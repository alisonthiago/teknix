import { NextResponse } from 'next/server'
import { getValidTokenBySellerId } from '@/services/mercadolivre/client'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const sellerId = searchParams.get('seller_id') || '470831049'

    const token = await getValidTokenBySellerId(sellerId)

    if (orderId) {
      // Fetch messages for a specific order / pack
      const cleanOrderId = orderId.replace('MLB-', '').replace('ML-', '')
      const res = await fetch(`https://api.mercadolibre.com/messages/packs/${cleanOrderId}/sellers/${sellerId}?tag=post_sale`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        return NextResponse.json({ messages: [], total: 0 })
      }

      const data = await res.json()
      return NextResponse.json({
        total: data.paging?.total || (data.messages || []).length,
        conversation_status: data.conversation_status,
        messages: (data.messages || []).reverse() // chronological order
      })
    }

    // Fetch latest post-sale conversations for all recent orders
    const supabase = getSupabase()
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10)

    const conversations: any[] = []

    for (const ord of (recentOrders || [])) {
      const cleanId = ord.order_number.replace('MLB-', '').replace('ML-', '')
      try {
        const msgRes = await fetch(`https://api.mercadolibre.com/messages/packs/${cleanId}/sellers/${sellerId}?tag=post_sale`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (msgRes.ok) {
          const msgData = await msgRes.json()
          if (msgData.messages && msgData.messages.length > 0) {
            conversations.push({
              order_id: cleanId,
              order_number: ord.order_number,
              customer_name: ord.customer_name,
              total_amount: ord.total_amount,
              status: ord.status,
              created_at: ord.created_at,
              conversation_status: msgData.conversation_status,
              messages_count: msgData.messages.length,
              last_message: msgData.messages[0], // newest
              messages: msgData.messages.slice().reverse()
            })
          }
        }
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({
      total: conversations.length,
      conversations
    })
  } catch (error: any) {
    console.error('Fetch post-sale messages error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao buscar mensagens' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id, text, seller_id = '470831049', buyer_id } = body

    if (!order_id || !text) {
      return NextResponse.json({ error: 'order_id e text são obrigatórios.' }, { status: 400 })
    }

    const cleanOrderId = order_id.replace('MLB-', '').replace('ML-', '')
    const token = await getValidTokenBySellerId(seller_id)

    // Build payload for post-sale message
    const payload: any = {
      from: {
        user_id: Number(seller_id) || 470831049
      },
      text: text.trim()
    }

    if (buyer_id) {
      payload.to = {
        user_id: Number(buyer_id)
      }
    }

    const res = await fetch(`https://api.mercadolibre.com/messages/packs/${cleanOrderId}/sellers/${seller_id}?tag=post_sale`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Erro ao enviar mensagem pós-venda' }, { status: res.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso ao comprador!',
      result: data
    })
  } catch (error: any) {
    console.error('Send post-sale message error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
