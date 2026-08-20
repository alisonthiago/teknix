import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Shopee Webhook] Received payload:', body)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk0Mzc5MSwiZXhwIjoyMTAyNTE5NzkxfQ.mv6Asc4U7lVVFtTtBhWyVm_R5jW2ThKocGI7WTRXIts'
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
