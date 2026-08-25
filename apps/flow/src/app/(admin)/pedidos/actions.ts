'use server'

import { createClient } from '@/utils/supabase/server'
import { logActivity } from '@/lib/activity-logger'

export async function moveOrderToPaid(orderId: string) {
  const s = await createClient()

  const { data: order, error: orderError } = await s
    .from('orders')
    .select('id, marketplace_account_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) throw new Error('Pedido não encontrado')

  const { data: items, error: itemsError } = await s
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (itemsError) throw new Error('Erro ao buscar itens')

  for (const item of items || []) {
    const { data: product } = await s
      .from('products')
      .select('id, stock')
      .eq('id', item.product_id)
      .single()

    if (!product) continue

    const newStock = (product.stock || 0) - (item.quantity || 0)

    await s
      .from('products')
      .update({ stock: Math.max(0, newStock) })
      .eq('id', item.product_id)

    await s.from('inventory_movements').insert({
      product_id: item.product_id,
      type: 'SALE',
      quantity: -(item.quantity || 0),
      reference_id: orderId,
      marketplace_account_id: order.marketplace_account_id,
      notes: `Baixa automática - Pedido #${orderId.slice(0, 8)}`,
    })
  }

  await s
    .from('orders')
    .update({ status: 'PAGO' })
    .eq('id', orderId)

  await s.from('order_status_history').insert({
    order_id: orderId,
    from_status: 'NOVO',
    to_status: 'PAGO',
    notes: 'Pagamento confirmado — estoque baixado automaticamente',
  })

  await logActivity({
    title: 'Pedido Pago',
    message: `O pedido #${orderId.split('-')[0]} foi marcado como PAGO e o estoque foi baixado.`,
    type: 'success',
    module: 'orders',
    entity_id: orderId,
    entity_type: 'order'
  })

  return { success: true }
}

export async function moveOrderStatus(orderId: string, newStatus: string) {
  const s = await createClient()

  const { data: order } = await s
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Pedido não encontrado')

  await s
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  await s.from('order_status_history').insert({
    order_id: orderId,
    from_status: order.status,
    to_status: newStatus,
    notes: `Status alterado de ${order.status} para ${newStatus}`,
  })

  return { success: true }
}
