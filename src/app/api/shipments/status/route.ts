import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logActivity } from '@/lib/activity-logger'

export async function POST(req: NextRequest) {
  try {
    const { orderId, newStatus } = await req.json()

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'orderId e newStatus são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status, order_number')
      .eq('id', orderId)
      .single()

    if (findError || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const fromStatus = order.status

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      from_status: fromStatus,
      to_status: newStatus,
      notes: `Status operacional atualizado para ${newStatus} na Estação de Expedição`,
    })

    await logActivity({
      title: `Pedido ${newStatus}`,
      message: `O pedido #${order.order_number || orderId.slice(0, 8)} foi avançado para ${newStatus}.`,
      type: 'success',
      module: 'orders',
      entity_id: orderId,
      entity_type: 'order'
    })

    return NextResponse.json({ success: true, orderId, newStatus })
  } catch (err: any) {
    console.error('Erro na API de status de envio:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
