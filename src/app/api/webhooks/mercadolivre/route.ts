import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getValidTokenBySellerId } from '@/services/mercadolivre/client'

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const body = await req.json()
    const { resource, topic, user_id, application_id } = body
    const sellerId = String(user_id || '470831049')

    console.log(`[ML Webhook] Event received: topic=${topic}, resource=${resource}, seller_id=${sellerId}`)

    // 1. Audit log na tabela real marketplace_webhook_events
    await supabase.from('marketplace_webhook_events').insert({
      marketplace_id: 'mercadolivre',
      event_type: topic || 'orders_v2',
      resource: resource || '',
      raw_payload: body,
      processed: true,
      processed_at: new Date().toISOString()
    })

    // 2. Get authenticated seller OAuth token
    let accessToken: string
    try {
      accessToken = await getValidTokenBySellerId(sellerId)
    } catch (tokenErr: any) {
      console.error('[ML Webhook] Failed to get seller token:', tokenErr.message)
      return NextResponse.json({ received: true, error: 'Seller token unavailable' }, { status: 200 })
    }

    // 3. Resolve Marketplace ID
    let marketplaceId = '6ef8f3db-6d35-4701-86f7-8199378ec0c7'
    const { data: mp } = await supabase
      .from('marketplaces')
      .select('id')
      .or('code.eq.MERCADO_LIVRE,code.eq.mercadolivre')
      .single()
    if (mp) marketplaceId = mp.id

    // Resolve Marketplace Account ID
    const { data: mpAcc } = await supabase
      .from('marketplace_accounts')
      .select('id')
      .eq('seller_id', sellerId)
      .single()
    const marketplaceAccountId = mpAcc?.id || null

    // ----------------------------------------------------
    // 4. ORDERS PROCESSING (orders_v2 / /orders/)
    // ----------------------------------------------------
    if (topic === 'orders_v2' || topic === 'orders' || resource?.startsWith('/orders/')) {
      const orderId = resource.replace('/orders/', '').trim()
      const ordRes = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (!ordRes.ok) {
        const errText = await ordRes.text()
        console.error(`[ML Webhook] Error fetching ML order ${orderId}: ${ordRes.status}`, errText)
        return NextResponse.json({ received: true, note: 'Order fetch failed' }, { status: 200 })
      }

      const o = await ordRes.json()
      const orderNumber = `MLB-${o.id}`
      const customerName = `${o.buyer?.first_name || ''} ${o.buyer?.last_name || ''}`.trim() || o.buyer?.nickname || 'Cliente Mercado Livre'
      const totalAmount = Number(o.total_amount) || 0
      const orderDate = o.date_created ? o.date_created.split('T')[0] : new Date().toISOString().split('T')[0]

      // Resolve shipment details
      let tracking = ''
      let address = ''
      let city = ''
      let state = ''
      let zip = ''
      let shippingMethod = 'Mercado Envios'
      let shippingCost = 0

      if (o.shipping?.id) {
        try {
          const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${o.shipping.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
          if (shipRes.ok) {
            const shipData = await shipRes.json()
            tracking = shipData.tracking_number || shipData.tracking_id || `MEL${o.shipping.id}`
            address = `${shipData.receiver_address?.street_name || ''} ${shipData.receiver_address?.street_number || ''}`.trim() || 'Endereço Mercado Envios'
            city = shipData.receiver_address?.city?.name || 'São Paulo'
            state = shipData.receiver_address?.state?.id || 'SP'
            zip = shipData.receiver_address?.zip_code || '06412-270'
            shippingCost = Number(shipData.base_cost || 0)
            shippingMethod = shipData.logistic_type ? `Mercado Envios (${shipData.logistic_type.toUpperCase()})` : 'Mercado Envios'
          }
        } catch (e) {
          console.error('[ML Webhook] Error fetching shipment:', e)
        }
      }

      // Map Order Status
      const statusMap: Record<string, string> = {
        paid: 'PAGO',
        confirmed: 'PAGO',
        payment_required: 'NOVO',
        payment_in_process: 'NOVO',
        partially_paid: 'NOVO',
        cancelled: 'CANCELADO',
        invalid: 'CANCELADO'
      }
      const orderStatus = statusMap[o.status] || 'PAGO'

      // A. Upsert into public.orders
      const { data: dbOrder, error: orderErr } = await supabase
        .from('orders')
        .upsert({
          order_number: orderNumber,
          marketplace_id: marketplaceId,
          marketplace_account_id: marketplaceAccountId,
          customer_name: customerName,
          total_amount: totalAmount,
          status: orderStatus,
          payment_method: 'Mercado Pago',
          shipping_address: address,
          shipping_city: city,
          shipping_state: state,
          shipping_zip: zip,
          tracking_code: tracking,
          shipping_method: shippingMethod,
          shipping_cost: shippingCost,
          updated_at: new Date().toISOString()
        }, { onConflict: 'order_number' })
        .select('id')
        .single()

      if (orderErr) {
        console.error('[ML Webhook] Order upsert error:', orderErr)
      }

      // B. Upsert into public.sales
      const { data: dbSale } = await supabase
        .from('sales')
        .upsert({
          order_id: `ML-${orderId}`,
          marketplace_id: marketplaceId,
          marketplace_account_id: marketplaceAccountId,
          date: orderDate,
          total_revenue: totalAmount,
          status: o.status === 'paid' ? 'COMPLETED' : 'PENDING'
        }, { onConflict: 'order_id' })
        .select('id')
        .single()

      // C. Upsert into public.marketplace_orders (Mirror)
      await supabase
        .from('marketplace_orders')
        .upsert({
          marketplace_id: 'mercadolivre',
          external_order_id: orderId,
          seller_id: sellerId,
          status: o.status,
          total_amount: totalAmount,
          currency: o.currency_id || 'BRL',
          order_date: o.date_created,
          paid_at: o.payments?.[0]?.date_approved || null,
          raw_data: o,
          updated_at: new Date().toISOString()
        }, { onConflict: 'marketplace_id, external_order_id' })

      // D. Process Order Items & Deduct Stock
      if (o.order_items?.length) {
        for (const it of o.order_items) {
          const itemSku = it.item?.seller_custom_field || it.item?.seller_sku || it.item?.id
          const itemTitle = it.item?.title || 'Produto Mercado Livre'
          const itemQty = Number(it.quantity) || 1
          const itemPrice = Number(it.unit_price) || 0
          const itemFee = Number(it.sale_fee) || 0

          // Match product in catalog
          const { data: product } = await supabase
            .from('products')
            .select('id, name, stock, cost_purchase')
            .eq('sku', itemSku)
            .single()

          // Upsert into order_items
          if (dbOrder?.id) {
            await supabase.from('order_items').upsert({
              order_id: dbOrder.id,
              product_id: product?.id || null,
              product_name: itemTitle,
              sku: itemSku,
              quantity: itemQty,
              unit_price: itemPrice,
              total_price: itemQty * itemPrice
            })
          }

          // Upsert into sale_items
          if (dbSale?.id) {
            const cost = Number(product?.cost_purchase || 0)
            const profit = (itemPrice * itemQty) - (cost * itemQty) - itemFee
            const margin = itemPrice > 0 ? (profit / (itemPrice * itemQty)) * 100 : 0

            await supabase.from('sale_items').upsert({
              sale_id: dbSale.id,
              product_id: product?.id || null,
              quantity: itemQty,
              unit_price: itemPrice,
              cost_at_sale: cost,
              profit,
              margin
            })
          }

          // Central Stock Sync: Deduct stock across channels (com proteção rigorosa de idempotência)
          if (product?.id && product.stock !== null && product.stock !== undefined && o.status === 'paid') {
            const { data: existingMovement } = await supabase
              .from('inventory_movements')
              .select('id')
              .eq('reference_id', dbOrder?.id || orderId)
              .maybeSingle()

            if (!existingMovement) {
              const newStock = Math.max(0, product.stock - itemQty)
              await supabase.from('products').update({ stock: newStock }).eq('id', product.id)

              // Stock movement audit
              await supabase.from('inventory_movements').insert({
                product_id: product.id,
                movement_type: 'OUT',
                quantity: itemQty,
                reference_type: 'ORDER',
                reference_id: dbOrder?.id || orderId,
                notes: `Venda Mercado Livre (#${orderNumber})`
              })
            }
          }
        }
      }

      // E. Create Instant Notification in Notification Feed
      await supabase.from('notifications').insert({
        title: `🛒 Nova Venda: ${orderNumber}`,
        message: `${customerName} comprou R$ ${totalAmount.toFixed(2)} no Mercado Livre.`,
        type: 'ORDER',
        metadata: {
          order_id: dbOrder?.id,
          order_number: orderNumber,
          channel: 'Mercado Livre',
          seller_id: sellerId
        }
      })

      console.log(`[ML Webhook] Successfully processed and stored order ${orderNumber}`)
    }

    // ----------------------------------------------------
    // 5. ITEMS PROCESSING (items / /items/)
    // ----------------------------------------------------
    if (topic === 'items' || resource?.startsWith('/items/')) {
      const itemId = resource.replace('/items/', '').trim()
      const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (itemRes.ok) {
        const item = await itemRes.json()
        const sku = item.seller_custom_field || item.id
        const primaryPic = (item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url || item.thumbnail || '').replace('http://', 'https://')
        const stock = Number(item.available_quantity) || 0
        const price = Number(item.price) || 0

        const { data: prod } = await supabase.from('products').upsert({
          sku,
          name: item.title,
          stock,
          image_url: primaryPic,
          status: item.status === 'active' ? 'ACTIVE' : 'PAUSED'
        }, { onConflict: 'sku' }).select('id').single()

        if (prod?.id) {
          // Upsert listing
          await supabase.from('marketplace_listings').upsert({
            marketplace_id: marketplaceId,
            product_id: prod.id,
            seller_id: sellerId,
            external_listing_id: item.id,
            title: item.title,
            price,
            stock,
            status: item.status,
            thumbnail_url: primaryPic,
            last_synced_at: new Date().toISOString()
          }, { onConflict: 'external_listing_id' })
        }
        console.log(`[ML Webhook] Product ${sku} synchronized`)
      }
    }

    // ----------------------------------------------------
    // 6. SHIPMENTS PROCESSING (shipments / /shipments/)
    // ----------------------------------------------------
    if (topic === 'shipments' || resource?.startsWith('/shipments/')) {
      const shipmentId = resource.replace('/shipments/', '').trim()
      const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${shipmentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (shipRes.ok) {
        const shipData = await shipRes.json()
        const tracking = shipData.tracking_number || shipData.tracking_id || `MEL${shipmentId}`
        const statusMap: Record<string, string> = {
          pending: 'PENDING',
          ready_to_ship: 'AGUARDANDO_EXPEDICAO',
          shipped: 'ENVIADO',
          delivered: 'ENTREGUE',
          not_delivered: 'DEVOLVIDO',
          cancelled: 'CANCELADO'
        }
        const orderShippingStatus = statusMap[shipData.status] || 'EM_SEPARACAO'

        if (shipData.order_id) {
          const orderNumber = `MLB-${shipData.order_id}`
          await supabase
            .from('orders')
            .update({
              tracking_code: tracking,
              shipping_method: shipData.logistic_type ? `Mercado Envios (${shipData.logistic_type.toUpperCase()})` : 'Mercado Envios',
              status: orderShippingStatus,
              updated_at: new Date().toISOString()
            })
            .eq('order_number', orderNumber)
        }
        console.log(`[ML Webhook] Shipment ${shipmentId} updated`)
      }
    }

    return NextResponse.json({ received: true, processed: true }, { status: 200 })
  } catch (error: any) {
    console.error('[ML Webhook Error]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 200 })
  }
}
