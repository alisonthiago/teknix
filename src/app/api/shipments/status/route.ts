import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { orderId, orderIds, newStatus = 'EMBALADO' } = await req.json()
    const supabase = await createClient()

    const idsToUpdate = orderIds && Array.isArray(orderIds) ? orderIds : (orderId ? [orderId] : [])

    if (idsToUpdate.length === 0) {
      return NextResponse.json({ error: 'Nenhum pedido especificado' }, { status: 400 })
    }

    // Update orders status
    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .in('id', idsToUpdate)
      .select('id, order_number, status')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Record status history for each
    for (const ord of updated || []) {
      await supabase.from('order_status_history').insert({
        order_id: ord.id,
        to_status: newStatus,
        notes: `Etiqueta de envio impressa via painel central TEKNIX.`
      })
    }

    return NextResponse.json({ success: true, updatedCount: updated?.length || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
