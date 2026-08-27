import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Shopee Webhook] Received payload:', body)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('[Shopee Webhook] SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente.')
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Save notification
    await supabase.from('marketplace_notifications').insert({
      topic: body.code ? `shopee_${body.code}` : 'shopee_event',
      resource: body.data?.ordersn || body.data?.item_id || '',
      payload: body,
      processed: true
    })

    // If order created / updated
    if (body.data?.ordersn) {
      const orderNumber = `SHP-${body.data.ordersn}`
      const totalAmount = Number(body.data.total_amount || body.data.escrow_amount || 0)

      await supabase.from('notifications').insert({
        title: `🛒 Nova Venda Shopee: ${orderNumber}`,
        message: `Novo pedido de R$ ${totalAmount.toFixed(2)} recebido da Shopee.`,
        type: 'ORDER',
        metadata: { order_number: orderNumber, channel: 'Shopee' }
      })
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 })
  } catch (error: any) {
    console.error('[Shopee Webhook Error]', error)
    return NextResponse.json({ message: 'Error' }, { status: 200 })
  }
}
