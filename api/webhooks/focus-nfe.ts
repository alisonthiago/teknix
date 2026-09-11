import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Request = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  on?: (event: string, listener: (...args: any[]) => void) => void
}
type Response = {
  status(code: number): Response
  json(body: unknown): Response
}

const text = (value: unknown) => (value == null || value === '' ? null : String(value))

function header(request: Request, name: string) {
  const wanted = name.toLowerCase()
  const entry = Object.entries(request.headers || {}).find(([key]) => key.toLowerCase() === wanted)?.[1]
  return Array.isArray(entry) ? entry[0] : entry
}

async function bodyOf(request: Request) {
  if (typeof request.body === 'string') return request.body
  if (request.on) {
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      request.on?.('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      request.on?.('end', resolve)
      request.on?.('error', reject)
    })
    return Buffer.concat(chunks).toString('utf8')
  }
  return JSON.stringify(request.body ?? {})
}

function equal(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuração do Supabase ausente')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function findValue(payload: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    if (payload[name] != null) return payload[name]
  }
  return null
}

function resolveUrl(pathOrUrl: unknown, ambiente: string = 'producao'): string | null {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return null
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const base = ambiente === 'homologacao' ? 'https://homologacao.focusnfe.com.br' : 'https://api.focusnfe.com.br'
  return `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export default async function handler(request: Request, response: Response) {
  if (request.method === 'GET') {
    return response.status(200).json({ status: 'online', service: 'focus-nfe-webhook' })
  }
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido' })
  }

  const correlationId = header(request, 'x-request-id') || randomUUID()
  const raw = await bodyOf(request)
  const configuredHeader = process.env.FOCUS_NFE_WEBHOOK_AUTH_HEADER || 'Authorization'
  const expectedSecret = process.env.FOCUS_NFE_WEBHOOK_AUTH_SECRET
  const suppliedSecret = header(request, configuredHeader)

  if (expectedSecret && (!suppliedSecret || !equal(suppliedSecret, expectedSecret))) {
    console.warn('[Focus NFe webhook] unauthorized request', { correlationId, headerConfigured: Boolean(expectedSecret) })
    return response.status(401).json({ received: false, error: 'Não autorizado' })
  }

  let payload: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON object expected')
    payload = parsed as Record<string, unknown>
  } catch {
    return response.status(400).json({ received: false, error: 'JSON inválido', correlationId })
  }

  const nested = [payload.data, payload.nfe, payload.nota_fiscal, payload.invoice].find(
    (v) => v && typeof v === 'object'
  ) as Record<string, unknown> | undefined
  const source = nested ? { ...payload, ...nested } : payload

  const ref = text(findValue(source, ['ref', 'reference', 'referencia', 'ref_nfe']))
  const statusRaw = text(findValue(source, ['status', 'situacao', 'situacao_nfe', 'status_nfe'])) || ''
  const chave = text(findValue(source, ['chave_nfe', 'chave', 'chNFe', 'access_key']))
  const numero = text(findValue(source, ['numero', 'nfe_id', 'numero_nfe']))
  const serie = text(findValue(source, ['serie', 'serie_nfe'])) || '1'
  const protocolo = text(findValue(source, ['protocolo', 'nProt']))
  const xmlPath = text(findValue(source, ['caminho_xml_nota_fiscal', 'xml', 'xml_url']))
  const danfePath = text(findValue(source, ['caminho_danfe', 'danfe', 'danfe_url', 'pdf_url']))
  const msgSefaz = text(findValue(source, ['mensagem_sefaz', 'motivo', 'rejection_message', 'xMotivo']))
  const statusSefaz = text(findValue(source, ['status_sefaz', 'cStat', 'codigo_status']))
  const justificativa = text(findValue(source, ['justificativa', 'cancellation_reason']))

  const eventHash = createHash('sha256').update(raw).digest('hex')
  const eventId = text(findValue(payload, ['id', 'event_id', 'id_evento'])) || ref || correlationId

  const supabase = admin()

  // 1. Persistência idempotente em webhook_events
  const { data: weData, error: weError } = await supabase
    .from('webhook_events')
    .insert({
      event_hash: eventHash,
      provider_id: 'focus_nfe',
      event_type: 'focus_nfe.webhook',
      event_id: eventId,
      status: 'received',
      payload,
      result: { ref, statusRaw, chave, correlationId },
      received_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle()

  if (weError?.code === '23505') {
    return response.status(200).json({ received: true, duplicate: true, correlationId })
  }

  // 2. Mapeamento de status oficial
  let mappedStatus = 'processando'
  let auditAction = 'processando'

  const normalized = statusRaw.toLowerCase().trim()
  if (['autorizado', 'autorizada', 'emitido', 'emitida'].includes(normalized)) {
    mappedStatus = 'autorizada'
    auditAction = 'autorizada'
  } else if (['cancelado', 'cancelada'].includes(normalized)) {
    mappedStatus = 'cancelada'
    auditAction = 'cancelada'
  } else if (['erro_autorizacao', 'rejeitado', 'rejeitada', 'denegado', 'denegada'].includes(normalized)) {
    mappedStatus = 'rejeitada'
    auditAction = 'rejeitada'
  } else if (['processando_autorizacao', 'processando'].includes(normalized)) {
    mappedStatus = 'processando'
    auditAction = 'processando'
  }

  // 3. Atualizar store_invoices se houver ref
  if (ref) {
    try {
      const { data: invoice } = await supabase
        .from('store_invoices')
        .select('*')
        .eq('reference', ref)
        .maybeSingle()

      const ambiente = invoice?.ambiente || 'producao'
      const xmlUrl = resolveUrl(xmlPath, ambiente)
      const danfeUrl = resolveUrl(danfePath, ambiente)

      const updateData: Record<string, unknown> = {
        status: mappedStatus,
        raw_payload: payload,
        updated_at: new Date().toISOString(),
      }

      if (chave) updateData.chave = chave
      if (numero) updateData.numero = numero
      if (serie) updateData.serie = serie
      if (protocolo) updateData.protocolo = protocolo
      if (xmlUrl) updateData.xml_url = xmlUrl
      if (danfeUrl) updateData.danfe_url = danfeUrl
      if (msgSefaz) updateData.rejection_message = msgSefaz
      if (statusSefaz) updateData.rejection_code = statusSefaz
      if (justificativa) updateData.cancellation_reason = justificativa
      if (mappedStatus === 'autorizada' && !invoice?.issued_at) {
        updateData.issued_at = new Date().toISOString()
      }
      if (mappedStatus === 'cancelada') {
        updateData.cancelled_at = new Date().toISOString()
      }

      let invoiceId = invoice?.id
      let orderId = invoice?.order_id

      if (invoice) {
        await supabase
          .from('store_invoices')
          .update(updateData)
          .eq('id', invoice.id)
      } else {
        // Se a nota ainda não foi pré-registrada, cria registro
        const { data: newInv } = await supabase
          .from('store_invoices')
          .insert({
            reference: ref,
            status: mappedStatus,
            chave,
            numero,
            serie,
            protocolo,
            xml_url: xmlUrl,
            danfe_url: danfeUrl,
            rejection_message: msgSefaz,
            rejection_code: statusSefaz,
            cancellation_reason: justificativa,
            issued_at: mappedStatus === 'autorizada' ? new Date().toISOString() : null,
            raw_payload: payload,
          })
          .select('id, order_id')
          .single()

        invoiceId = newInv?.id
        orderId = newInv?.order_id
      }

      // 4. Se o pedido foi identificado, sincroniza o status fiscal do pedido
      if (orderId) {
        await supabase
          .from('store_orders')
          .update({
            fiscal_status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
      } else if (ref.startsWith('TK-')) {
        const orderNum = ref.replace(/^TK-/, '')
        await supabase
          .from('store_orders')
          .update({
            fiscal_status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .or(`order_number.eq.${orderNum},id.eq.${orderNum}`)
      }

      // 5. Auditoria fiscal
      if (invoiceId || orderId) {
        await supabase.from('fiscal_audit_events').insert({
          invoice_id: invoiceId,
          order_id: orderId,
          action: auditAction,
          actor: 'focus_nfe_webhook',
          details: {
            ref,
            statusRaw,
            statusSefaz,
            msgSefaz,
            chave,
            protocolo,
            correlationId,
          },
        })
      }
    } catch (err: any) {
      console.error('[Focus NFe webhook] Erro ao sincronizar store_invoices:', err.message)
    }
  }

  if (weData?.id) {
    await supabase
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', weData.id)
  }

  return response.status(200).json({
    received: true,
    duplicate: false,
    ref: ref || null,
    status: mappedStatus,
    correlationId,
  })
}