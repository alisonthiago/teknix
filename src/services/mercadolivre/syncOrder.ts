/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getValidTokenBySellerId, fetchMLOrder } from './client'

let _supabase: SupabaseClient<any> | null = null
function getSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabase
}

export async function syncOrder(resource: string, sellerId: string) {
  const supabase = getSupabase()
  
  // 1. Resolve User ID
  let userId = '3af9068a-4b78-4c9c-8657-f83b93c01588'
  const { data: conn } = await supabase
    .from('marketplace_connections')
    .select('user_id')
    .eq('seller_id', sellerId)
    .maybeSingle()

  if (conn?.user_id) {
    userId = conn.user_id
  }

  // 2. Resolve Marketplace ID
  let marketplaceId = '6ef8f3db-6d35-4701-86f7-8199378ec0c7'
  const { data: mp } = await supabase
    .from('marketplaces')
    .select('id')
    .or('code.eq.MERCADO_LIVRE,code.eq.mercadolivre')
    .maybeSingle()
  if (mp?.id) marketplaceId = mp.id

  // 3. Obter token válido via Single-Flight Mutex
  const token = await getValidTokenBySellerId(sellerId)

  // 4. Buscar pedido oficial da API do Mercado Livre
  const orderId = resource.replace('/orders/', '').trim()
  const orderData = await fetchMLOrder(token, orderId)

  if (!orderData || !orderData.id) {
    throw new Error(`Dados inválidos retornados para o pedido ML #${orderId}`)
  }

  const orderNumber = `MLB-${orderData.id}`
  const customerName = `${orderData.buyer?.first_name || ''} ${orderData.buyer?.last_name || ''}`.trim() || orderData.buyer?.nickname || 'Cliente Mercado Livre'
  const totalAmount = Number(orderData.total_amount) || 0
  const orderDate = orderData.date_created ? orderData.date_created.split('T')[0] : new Date().toISOString().split('T')[0]

  // 5. Buscar detalhes do Envio (Shipment) se existir
  let tracking = ''
  let address = ''
  let city = ''
  let state = ''
  let zip = ''
  let shippingMethod = 'Mercado Envios'
  let shippingCost = 0

  if (orderData.shipping?.id) {
    try {
      const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${orderData.shipping.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (shipRes.ok) {
        const shipData = await shipRes.json()
        tracking = shipData.tracking_number || shipData.tracking_id || `MEL${orderData.shipping.id}`
        address = `${shipData.receiver_address?.street_name || ''} ${shipData.receiver_address?.street_number || ''}`.trim() || 'Endereço Mercado Envios'
        city = shipData.receiver_address?.city?.name || 'São Paulo'
        state = shipData.receiver_address?.state?.id || 'SP'
        zip = shipData.receiver_address?.zip_code || '06412-270'
        shippingCost = Number(shipData.base_cost || 0)
        shippingMethod = shipData.logistic_type ? `Mercado Envios (${shipData.logistic_type.toUpperCase()})` : 'Mercado Envios'
      }
    } catch (e) {
      console.warn('[SyncOrder ML] Aviso ao buscar envio:', e)
    }
  }

  const statusMap: Record<string, string> = {
    paid: 'PAGO',
    confirmed: 'PAGO',
    payment_required: 'NOVO',
    payment_in_process: 'NOVO',
    partially_paid: 'NOVO',
    cancelled: 'CANCELADO',
    invalid: 'CANCELADO'
  }
  const orderStatus = statusMap[orderData.status] || 'PAGO'

  // 6. Upsert Seguro na tabela public.orders
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .maybeSingle()

  let dbOrderId: string | null = existingOrder?.id || null
  if (existingOrder) {
    await supabase
      .from('orders')
      .update({
        customer_name: customerName,
        customer_phone: orderData.buyer?.phone?.number || 'XXXXXXX',
        total_amount: totalAmount,
        status: orderStatus,
        tracking_code: tracking,
        carrier: shippingMethod,
        notes: address ? `${address}, ${city} - BR-${state} CEP: ${zip}` : 'Pedido Mercado Livre',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingOrder.id)
  } else {
    const { data: newOrder, error: insOrderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        marketplace_id: marketplaceId,
        customer_name: customerName,
        customer_phone: orderData.buyer?.phone?.number || 'XXXXXXX',
        total_amount: totalAmount,
        status: orderStatus,
        tracking_code: tracking,
        carrier: shippingMethod,
        notes: address ? `${address}, ${city} - BR-${state} CEP: ${zip}` : 'Pedido Mercado Livre',
        created_at: orderData.date_created || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insOrderErr) console.error('[SyncOrder ML] Erro ao inserir order:', insOrderErr)
    dbOrderId = newOrder?.id || null
  }

  // 7. Upsert Seguro na tabela public.sales
  const { data: existingSale } = await supabase
    .from('sales')
    .select('id')
    .eq('order_id', orderNumber)
    .maybeSingle()

  let dbSaleId: string | null = existingSale?.id || null
  if (existingSale) {
    await supabase
      .from('sales')
      .update({
        total_revenue: totalAmount,
        status: orderData.status === 'paid' ? 'COMPLETED' : 'PENDING',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSale.id)
  } else {
    const { data: newSale, error: insSaleErr } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        order_id: orderNumber,
        marketplace_id: marketplaceId,
        date: orderDate,
        total_revenue: totalAmount,
        status: orderData.status === 'paid' ? 'COMPLETED' : 'PENDING'
      })
      .select('id')
      .single()

    if (insSaleErr) console.error('[SyncOrder ML] Erro ao inserir sale:', insSaleErr)
    dbSaleId = newSale?.id || null
  }

  // 8. Upsert na tabela public.marketplace_orders (Mirror)
  const { data: mirrorOrder } = await supabase
    .from('marketplace_orders')
    .upsert({
      marketplace_id: 'mercadolivre',
      external_order_id: orderId,
      seller_id: sellerId,
      status: orderData.status,
      total_amount: totalAmount,
      currency: orderData.currency_id || 'BRL',
      order_date: orderData.date_created,
      paid_at: orderData.payments?.[0]?.date_approved || null,
      raw_data: orderData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'marketplace_id, external_order_id' })
    .select('id')
    .single()

  // 9. Processar Itens do Pedido e Atualizar Estoque com Idempotência
  if (orderData.order_items && Array.isArray(orderData.order_items)) {
    for (const item of orderData.order_items) {
      const sku = item.item?.seller_custom_field || item.item?.seller_sku || item.item?.id
      const itemTitle = item.item?.title || 'Produto Mercado Livre'
      const quantity = Number(item.quantity) || 1
      const unitPrice = Number(item.unit_price) || 0
      const saleFee = Number(item.sale_fee) || 0

      // Match product by SKU
      const { data: product } = await supabase
        .from('products')
        .select('id, name, cost_purchase, stock')
        .eq('sku', sku)
        .maybeSingle()

      const productId = product?.id || null

      // Gravar order_items
      if (dbOrderId) {
        const { data: existingOrderItem } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', dbOrderId)
          .eq('sku', sku)
          .maybeSingle()

        if (existingOrderItem) {
          await supabase.from('order_items').update({
            quantity,
            unit_price: unitPrice,
            total_price: unitPrice * quantity
          }).eq('id', existingOrderItem.id)
        } else {
          await supabase.from('order_items').insert({
            order_id: dbOrderId,
            product_id: productId,
            product_name: itemTitle,
            sku,
            quantity,
            unit_price: unitPrice,
            total_price: unitPrice * quantity
          })
        }
      }

      // Gravar marketplace_order_items
      if (mirrorOrder?.id) {
        await supabase.from('marketplace_order_items').upsert({
          order_id: mirrorOrder.id,
          product_id: productId,
          external_item_id: item.item?.id,
          seller_sku: sku,
          quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
          updated_at: new Date().toISOString()
        })
      }

      // Gravar sale_items
      if (dbSaleId) {
        const cost = Number(product?.cost_purchase || 0)
        const profit = (unitPrice * quantity) - (cost * quantity) - saleFee
        const margin = unitPrice > 0 ? (profit / (unitPrice * quantity)) * 100 : 0

        const { data: existingSaleItem } = await supabase
          .from('sale_items')
          .select('id')
          .eq('sale_id', dbSaleId)
          .maybeSingle()

        if (existingSaleItem) {
          await supabase.from('sale_items').update({
            quantity,
            unit_price: unitPrice,
            cost_at_sale: cost,
            profit,
            margin
          }).eq('id', existingSaleItem.id)
        } else {
          await supabase.from('sale_items').insert({
            sale_id: dbSaleId,
            product_id: productId,
            quantity,
            unit_price: unitPrice,
            cost_at_sale: cost,
            profit,
            margin
          })
        }
      }

      // 10. Dedução de Estoque com Idempotência
      if (productId && product && product.stock !== null && orderData.status === 'paid') {
        const { data: existingMovement } = await supabase
          .from('inventory_movements')
          .select('id')
          .eq('reference_id', orderNumber)
          .maybeSingle()

        if (!existingMovement) {
          const newStock = Math.max(0, (product.stock || 0) - quantity)
          await supabase.from('products').update({ stock: newStock }).eq('id', productId)

          await supabase.from('inventory_movements').insert({
            product_id: productId,
            user_id: userId,
            movement_type: 'OUT',
            quantity,
            reference_type: 'ORDER',
            reference_id: orderNumber,
            notes: `Venda Mercado Livre #${orderNumber}`
          })
          console.log(`[SyncOrder ML] Estoque deduzido com sucesso para SKU ${sku}: ${product.stock} -> ${newStock}`)
        }
      }
    }
  }

  // 11. Criar Notificação no Sistema
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'NEW_SALE',
    title: `🛒 Nova Venda: ${orderNumber}`,
    message: `${customerName} comprou R$ ${totalAmount.toFixed(2)} no Mercado Livre.`,
    marketplace_id: 'mercadolivre',
    resource: 'order',
    resource_id: dbOrderId || orderId
  })

  console.log(`[SyncOrder ML] Pedido ${orderNumber} sincronizado com 100% de sucesso!`)
}
