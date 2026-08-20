/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getValidToken, fetchMLOrder } from './client'

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
  
  // 1. Find user ID
  let userId = '3af9068a-4b78-4c9c-8657-f83b93c01588'
  const { data: conn } = await supabase
    .from('marketplace_connections')
    .select('user_id')
    .eq('seller_id', sellerId)
    .single()

  if (conn?.user_id) {
    userId = conn.user_id
  } else {
    const { data: acc } = await supabase
      .from('marketplace_accounts')
      .select('user_id')
      .eq('seller_id', sellerId)
      .single()
    if (acc?.user_id) userId = acc.user_id
  }

  // 2. Get valid token by sellerId
  const { getValidTokenBySellerId } = await import('./client')
  const token = await getValidTokenBySellerId(sellerId)

  // 3. Fetch from ML API
  // Resource comes like "/orders/200000000"
  const orderId = resource.split('/').pop()!
  const orderData = await fetchMLOrder(token, orderId)

  // 4. Save to marketplace_orders
  const { data: order, error: orderError } = await supabase
    .from('marketplace_orders')
    .upsert({
      marketplace_id: 'mercadolivre',
      external_order_id: orderId,
      seller_id: sellerId,
      status: orderData.status,
      total_amount: orderData.total_amount,
      currency: orderData.currency_id,
      order_date: orderData.date_created,
      paid_at: orderData.payments?.[0]?.date_approved || null,
      raw_data: orderData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'marketplace_id, external_order_id' })
    .select('id')
    .single()

  if (orderError) throw orderError

  // 5. Process Items
  let hasMissingProducts = false

  for (const item of orderData.order_items) {
    const sku = item.item.seller_sku

    // Try to find the internal product by SKU
    const { data: product } = await supabase
      .from('products')
      .select('id, name, cost_purchase, stock')
      .eq('user_id', userId)
      .eq('sku', sku)
      .single()

    const productId = product?.id || null

    if (!productId) {
      hasMissingProducts = true
    }

    await supabase
      .from('marketplace_order_items')
      .upsert({
        order_id: order.id,
        product_id: productId,
        external_item_id: item.item.id,
        seller_sku: sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        updated_at: new Date().toISOString()
      })

    // If product is found and order is paid, generate a Sale in TEKNIX
    if (productId && product && orderData.status === 'paid') {
      // Check if we already created a sale for this order + item
      const { data: existingSale } = await supabase
        .from('sales')
        .select('id')
        .eq('external_order_id', orderId)
        .eq('product_id', productId)
        .single()

      if (!existingSale) {
        // Create Sale
        // Calculate Lucro and Margin based on current product cost
        const salePrice = item.unit_price
        const cost = product.cost_purchase || 0
        const marketplaceFee = item.sale_fee || 0 // ML provides fee in order_items
        
        const profit = salePrice - cost - marketplaceFee
        const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0

        const { data: newSale, error: saleError } = await supabase
          .from('sales')
          .insert({
            user_id: userId,
            product_id: productId,
            channel: 'Mercado Livre',
            external_order_id: orderId,
            quantity: item.quantity,
            sale_price: salePrice,
            sale_date: orderData.date_created,
            status: 'completed',
            marketplace_fee: marketplaceFee
          })
          .select('id')
          .single()

        if (!saleError) {
          // Add sale_items
          await supabase.from('sale_items').insert({
            sale_id: newSale.id,
            cost_at_sale: cost,
            profit,
            margin
          })

          // Deduct Stock
          const newStock = (product.stock || 0) - item.quantity
          await supabase.from('products').update({ stock: newStock }).eq('id', productId)

          // Create Stock Movement
          await supabase.from('inventory_movements').insert({
            product_id: productId,
            user_id: userId,
            type: 'SALE',
            quantity: -item.quantity,
            notes: `Venda Mercado Livre #${orderId}`,
            marketplace_id: 'mercadolivre',
            external_order_id: orderId
          })

          // Create Notification
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'NEW_SALE',
            title: '🔔 Nova Venda',
            message: `Venda #${orderId} de ${item.quantity}x ${product.name} (Lucro: R$ ${profit.toFixed(2)})`,
            marketplace_id: 'mercadolivre',
            resource: 'sale',
            resource_id: newSale.id
          })
        }
      }
    }
  }

  if (hasMissingProducts) {
    // Generate notification for missing product
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'WARNING',
      title: '⚠️ Produto Não Vinculado',
      message: `O pedido #${orderId} possui itens com SKU não cadastrado no sistema. A venda não pôde ser faturada.`,
      marketplace_id: 'mercadolivre',
      resource: 'marketplace_orders',
      resource_id: order.id
    })
  }
}
