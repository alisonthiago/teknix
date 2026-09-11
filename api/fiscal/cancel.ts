import { createClient } from '@supabase/supabase-js'

type VercelRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: any
}

type VercelResponse = {
  status(code: number): VercelResponse
  json(body: unknown): VercelResponse
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuração do Supabase ausente')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).json({})
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { reference, justification } = req.body || {}
  if (!reference) return res.status(400).json({ error: 'Referência fiscal obrigatória' })
  if (!justification || justification.trim().length < 15) {
    return res.status(400).json({ error: 'A justificativa de cancelamento deve ter no mínimo 15 caracteres' })
  }

  const supabase = admin()

  try {
    const { data: invoice } = await supabase
      .from('store_invoices')
      .select('*')
      .eq('reference', reference)
      .maybeSingle()

    if (!invoice) return res.status(404).json({ error: 'Nota fiscal não encontrada' })

    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('id', 'focus_nfe')
      .maybeSingle()

    const targetEnv = invoice.ambiente || 'homologacao'
    const credentials = config?.credentials || {}
    const token =
      targetEnv === 'producao'
        ? credentials.token_producao || credentials.token || process.env.FOCUS_NFE_PRODUCTION_TOKEN || 'mrEmmvhqXGLIDRxISKyxuFXZcy8vVMIn'
        : credentials.token_homologacao || credentials.token || process.env.FOCUS_NFE_HOMOLOGATION_TOKEN || '6epgnSvzZAoYAPPPKGXvJQk5sVd3gw5Z'

    const baseUrl =
      targetEnv === 'producao' ? 'https://api.focusnfe.com.br/v2' : 'https://homologacao.focusnfe.com.br/v2'

    const authHeader = 'Basic ' + Buffer.from(token + ':').toString('base64')

    const cancelRes = await fetch(`${baseUrl}/nfe/${reference}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ justificativa: justification.trim() }),
    })

    const cancelData = await cancelRes.json()

    const isCancelled =
      cancelRes.status === 200 &&
      (cancelData.status === 'cancelado' || cancelData.status === 'cancelada' || cancelData.status_sefaz === '135')

    const newStatus = isCancelled ? 'cancelada' : invoice.status

    await supabase
      .from('store_invoices')
      .update({
        status: newStatus,
        cancellation_reason: justification,
        cancelled_at: isCancelled ? new Date().toISOString() : null,
        rejection_message: !isCancelled ? cancelData.mensagem_sefaz || cancelData.mensagem : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    if (invoice.order_id && isCancelled) {
      await supabase
        .from('store_orders')
        .update({ fiscal_status: 'cancelada', updated_at: new Date().toISOString() })
        .eq('id', invoice.order_id)
    }

    await supabase.from('fiscal_audit_events').insert({
      order_id: invoice.order_id,
      invoice_id: invoice.id,
      action: 'cancelada',
      actor: 'hub_admin',
      details: { reference, justification, cancelData },
    })

    return res.status(200).json({
      success: isCancelled,
      status: newStatus,
      message: isCancelled ? 'NF-e cancelada com sucesso' : cancelData.mensagem_sefaz || cancelData.mensagem || 'Falha ao cancelar',
      details: cancelData,
    })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
