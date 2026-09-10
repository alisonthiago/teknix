import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type VercelRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  on?: (event: string, listener: (...args: any[]) => void) => void
}

type VercelResponse = {
  status(code: number): VercelResponse
  json(body: unknown): VercelResponse
}

const EVENT_TYPES = new Set([
  'order.created', 'order.pending', 'order.released', 'order.generated',
  'order.received', 'order.posted', 'order.delivered', 'order.cancelled',
  'order.undelivered', 'order.paused', 'order.suspended',
])

type LabelData = {
  id?: unknown
  protocol?: unknown
  status?: unknown
  tracking?: unknown
  self_tracking?: unknown
  tags?: unknown
  tracking_url?: unknown
  created_at?: unknown
  paid_at?: unknown
  generated_at?: unknown
  posted_at?: unknown
  delivered_at?: unknown
  canceled_at?: unknown
  expired_at?: unknown
}

type Payload = { event?: unknown; data?: LabelData }

function header(request: VercelRequest, name: string): string | undefined {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

async function rawBody(request: VercelRequest): Promise<string> {
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

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuração do Supabase ausente')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function safeEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue)
  const right = Buffer.from(rightValue)
  return left.length === right.length && timingSafeEqual(left, right)
}

function requestDiagnostics(request: VercelRequest, body: string, signature: string | undefined) {
  return {
    method: request.method || null,
    contentType: header(request, 'content-type') || null,
    userAgent: header(request, 'user-agent') || null,
    signaturePresent: Boolean(signature),
    bodyLength: Buffer.byteLength(body, 'utf8'),
  }
}

function isRegistrationProbe(body: string): boolean {
  const trimmed = body.trim()
  if (!trimmed) return true
  try {
    const payload = JSON.parse(trimmed) as unknown
    return Boolean(payload && typeof payload === 'object' && !Array.isArray(payload) && Object.keys(payload).length === 0)
  } catch {
    return false
  }
}

function sanitisePayload(payload: Payload) {
  const data = payload.data || {}
  return {
    event: String(payload.event),
    data: {
      id: String(data.id),
      protocol: data.protocol ? String(data.protocol) : null,
      status: data.status ? String(data.status) : null,
      tracking: data.tracking ? String(data.tracking) : null,
      self_tracking: data.self_tracking ? String(data.self_tracking) : null,
      tags: Array.isArray(data.tags)
        ? data.tags.filter((tag): tag is Record<string, unknown> => Boolean(tag && typeof tag === 'object'))
          .map((tag) => ({ tag: typeof tag.tag === 'string' ? tag.tag : null, url: typeof tag.url === 'string' ? tag.url : null }))
        : [],
      tracking_url: data.tracking_url ? String(data.tracking_url) : null,
      created_at: data.created_at || null,
      paid_at: data.paid_at || null,
      generated_at: data.generated_at || null,
      posted_at: data.posted_at || null,
      delivered_at: data.delivered_at || null,
      canceled_at: data.canceled_at || null,
      expired_at: data.expired_at || null,
    },
  }
}

function internalStatus(event: string): string | null {
  if (event === 'order.posted') return 'ENVIADO'
  if (event === 'order.delivered') return 'ENTREGUE'
  if (event === 'order.cancelled') return 'CANCELADO'
  if (['order.undelivered', 'order.paused', 'order.suspended'].includes(event)) return 'PROBLEMA'
  if (['order.created', 'order.released', 'order.generated'].includes(event)) return 'ETIQUETA_IMPRESSA'
  return null
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' })

  const correlationId = header(request, 'x-request-id') || randomUUID()
  const receivedAt = new Date().toISOString()
  const body = await rawBody(request)
  const secret = process.env.MELHOR_ENVIO_WEBHOOK_SECRET
  const signature = header(request, 'x-me-signature')
  const diagnostics = requestDiagnostics(request, body, signature)

  console.info('[Melhor Envio webhook] request received', { correlationId, ...diagnostics })

  // The Melhor Envio dashboard sends an unsigned probe when registering a URL.
  // Only an empty probe is accepted; event payloads remain signature-protected.
  if (!signature && isRegistrationProbe(body)) {
    console.info('[Melhor Envio webhook] registration probe accepted', { correlationId })
    return response.status(200).json({ ok: true })
  }

  if (!secret || !signature) {
    console.warn('[Melhor Envio webhook] rejected: missing authentication', { correlationId, ...diagnostics })
    return response.status(401).json({ received: false, error: 'Webhook não configurado' })
  }
  const expected = createHmac('sha256', secret).update(body).digest('base64')
  if (!safeEqual(signature, expected)) {
    console.warn('[Melhor Envio webhook] rejected: invalid signature', { correlationId, ...diagnostics })
    return response.status(401).json({ received: false, error: 'Assinatura inválida' })
  }

  let payload: Payload
  try { payload = JSON.parse(body) as Payload } catch {
    console.warn('[Melhor Envio webhook] rejected: invalid JSON', { correlationId, ...diagnostics })
    return response.status(400).json({ received: false, error: 'JSON inválido' })
  }
  const event = typeof payload.event === 'string' ? payload.event : ''
  const data = payload.data && typeof payload.data === 'object' ? payload.data : null
  const labelId = data && typeof data.id === 'string' ? data.id : ''
  if (!EVENT_TYPES.has(event) || !data || !labelId) {
    console.warn('[Melhor Envio webhook] rejected: invalid label payload', {
      correlationId,
      ...diagnostics,
      eventPresent: typeof payload.event === 'string',
      event,
      dataPresent: Boolean(data),
      labelIdPresent: Boolean(labelId),
      payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload as Record<string, unknown>) : [],
    })
    return response.status(400).json({ received: false, error: 'Payload de etiqueta inválido' })
  }

  const supabase = getAdminClient()
  const safePayload = sanitisePayload(payload)
  const idempotencyKey = `melhor-envio:${event}:${labelId}:${createHash('sha256').update(body).digest('hex')}`
  const row = {
    idempotency_key: idempotencyKey, provider: 'melhor_envio', event_type: event, label_id: labelId,
    protocol: data.protocol ? String(data.protocol) : null,
    tracking_code: data.tracking ? String(data.tracking) : data.self_tracking ? String(data.self_tracking) : null,
    external_status: data.status ? String(data.status) : null, internal_status: internalStatus(event),
    payload: safePayload, status: 'RECEIVED', correlation_id: correlationId, received_at: receivedAt, http_result: 200,
  }
  const { data: inserted, error: insertError } = await supabase.from('melhor_envio_webhook_events').insert(row).select('id').maybeSingle()
  if (insertError?.code === '23505') return response.status(200).json({ received: true, duplicate: true, correlationId })
  if (insertError || !inserted) {
    console.error('[Melhor Envio webhook] persist error', { correlationId, error: insertError?.message })
    return response.status(500).json({ received: false, error: 'Falha ao registrar evento', correlationId })
  }

  try {
    const tracking = row.tracking_code
    let order: { id: string; status: string } | null = null
    let shipmentId: string | null = null
    if (tracking) {
      const byOrder = await supabase.from('orders').select('id,status').eq('tracking_code', tracking).maybeSingle()
      order = byOrder.data
      if (!order) {
        const shipment = await supabase.from('shipments').select('id,order_id').eq('tracking_code', tracking).maybeSingle()
        if (shipment.data?.order_id) {
          shipmentId = shipment.data.id || null
          const byShipment = await supabase.from('orders').select('id,status').eq('id', shipment.data.order_id).maybeSingle()
          order = byShipment.data
        }
      }
    }
    if (!order && row.protocol) order = (await supabase.from('orders').select('id,status').eq('order_number', row.protocol).maybeSingle()).data
    if (!order) {
      await supabase.from('melhor_envio_webhook_events').update({ status: 'ORDER_NOT_FOUND', processed_at: new Date().toISOString() }).eq('id', inserted.id)
      return response.status(200).json({ received: true, processed: false, reason: 'order_not_found', correlationId })
    }

    const nextStatus = row.internal_status
    const changed = Boolean(nextStatus && nextStatus !== order.status)
    const orderUpdate: Record<string, string> = { carrier: 'Melhor Envio' }
    if (tracking) orderUpdate.tracking_code = tracking
    if (nextStatus === 'ENVIADO') orderUpdate.shipped_at = String(data.posted_at || new Date().toISOString())
    if (nextStatus === 'ENTREGUE') orderUpdate.delivered_at = String(data.delivered_at || new Date().toISOString())
    if (nextStatus && changed) orderUpdate.status = nextStatus
    await supabase.from('orders').update(orderUpdate).eq('id', order.id)
    if (changed) await supabase.from('order_status_history').insert({ order_id: order.id, from_status: order.status, to_status: nextStatus, notes: `Melhor Envio: ${event} (${labelId})` })
    const shipmentUpdate = { tracking_code: tracking, carrier: 'Melhor Envio', status: nextStatus || 'ETIQUETA' }
    const shipmentQuery = shipmentId ? supabase.from('shipments').update(shipmentUpdate).eq('id', shipmentId) : supabase.from('shipments').update(shipmentUpdate).eq('order_id', order.id)
    await shipmentQuery
    await supabase.from('melhor_envio_webhook_events').update({ order_id: order.id, shipment_id: shipmentId, status: changed ? 'PROCESSED' : 'PROCESSED_NO_CHANGE', processed_at: new Date().toISOString() }).eq('id', inserted.id)
    return response.status(200).json({ received: true, processed: true, duplicate: false, orderId: order.id, correlationId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    await supabase.from('melhor_envio_webhook_events').update({ status: 'FAILED', error_message: message, processed_at: new Date().toISOString() }).eq('id', inserted.id)
    console.error('[Melhor Envio webhook] processing error', { correlationId, error: message })
    return response.status(200).json({ received: true, processed: false, correlationId })
  }
}

export const config = { api: { bodyParser: false } }