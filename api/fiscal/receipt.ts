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

  const { orderId, generatedBy } = req.body || {}
  if (!orderId) return res.status(400).json({ error: 'ID do pedido obrigatório' })

  const supabase = admin()

  try {
    const { data: order, error: ordErr } = await supabase
      .from('store_orders')
      .select('*, items:store_order_items(*)')
      .eq('id', orderId)
      .single()

    if (ordErr || !order) return res.status(404).json({ error: 'Pedido não encontrado' })

    const receiptNumber = `REC-${order.order_number?.replace(/\D/g, '') || order.id.slice(0, 8)}`

    const { data: receipt, error: recErr } = await supabase
      .from('store_receipts')
      .upsert(
        {
          order_id: order.id,
          order_number: order.order_number,
          receipt_number: receiptNumber,
          customer_name: order.customer_name,
          customer_document: order.customer_document,
          status: 'gerado',
          total: Number(order.total) || 0,
          payment_method: order.payment_method,
          generated_by: generatedBy || 'admin',
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'receipt_number' }
      )
      .select('*')
      .single()

    if (recErr) throw recErr

    await supabase.from('fiscal_audit_events').insert({
      order_id: order.id,
      action: 'recibo_gerado',
      actor: generatedBy || 'admin',
      details: { receiptNumber, total: order.total },
    })

    return res.status(200).json({
      success: true,
      receipt,
      order,
    })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
