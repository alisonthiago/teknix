import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resource, topic, user_id, application_id, attempts, sent } = body

    console.log(`[ML Webhook] Received notification: topic=${topic}, resource=${resource}, user_id=${user_id}`)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk0Mzc5MSwiZXhwIjoyMTAyNTE5NzkxfQ.mv6Asc4U7lVVFtTtBhWyVm_R5jW2ThKocGI7WTRXIts'
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Save event for audit & idempotency
    await supabase.from('marketplace_notifications').insert({
      topic: topic || 'unknown',
      resource: resource || '',
      payload: body,
      processed: false
    })

    const clientId = process.env.MERCADOLIVRE_APP_ID || '8874323668438382'
    const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET || 'JQrkHL7X2ieJdxPpevL9b9PX3iffwfFm'

    // Get active ML token
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    })

    if (!tokenRes.ok) {
      return NextResponse.json({ received: true, note: 'Token failed' }, { status: 200 })
    }

    const { access_token } = await tokenRes.json()

    // 1. If it is an Order notification (orders_v2)
    if (topic === 'orders_v2' || resource?.startsWith('/orders/')) {
      const orderId = resource.replace('/orders/', '')
      const ordRes = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${access_token}` }
      })

      if (ordRes.ok) {
        const o = await ordRes.json()
        const orderNumber = `MLB-${o.id}`
        const customerName = `${o.buyer?.first_name || ''} ${o.buyer?.last_name || ''}`.trim() || o.buyer?.nickname || 'Cliente Mercado Livre'
        const totalAmount = Number(o.total_amount) || 0

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
              headers: { Authorization: `Bearer ${access_token}` }
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
            console.error('Error fetching shipment in webhook:', e)
          }
        }

        // Upsert order
        const { data: dbOrder } = await supabase.from('orders').upsert({
          order_number: orderNumber,
          marketplace_id: '6ef8f3db-6d35-4701-86f7-8199378ec0c7',
          customer_name: customerName,
          total_amount: totalAmount,
          status: o.status === 'paid' ? 'PAGO' : o.status === 'cancelled' ? 'CANCELADO' : 'NOVO',
          payment_method: 'Mercado Pago',
          shipping_address: address,
          shipping_city: city,
          shipping_state: state,
          shipping_zip: zip,
          tracking_code: tracking,
          shipping_method: shippingMethod,
          shipping_cost: shippingCost,
          updated_at: new Date().toISOString()
        }, { onConflict: 'order_number' }).select('id').single()

        // Upsert order items & deduct central inventory
        if (dbOrder?.id && o.order_items?.length) {
          for (const it of o.order_items) {
            const itemSku = it.item?.seller_custom_field || it.item?.id
            const itemTitle = it.item?.title || 'Produto Mercado Livre'
            const itemQty = Number(it.quantity) || 1
            const itemPrice = Number(it.unit_price) || 0

            // Match product in central database
            const { data: product } = await supabase.from('products').select('id, stock').eq('sku', itemSku).single()

            await supabase.from('order_items').upsert({
              order_id: dbOrder.id,
              product_id: product?.id || null,
              product_name: itemTitle,
              sku: itemSku,
              quantity: itemQty,
              unit_price: itemPrice,
              total_price: itemQty * itemPrice
            })

            // Central Stock Sync: Deduct stock across all channels
            if (product?.id && product.stock !== null && product.stock !== undefined) {
              const newStock = Math.max(0, product.stock - itemQty)
              await supabase.from('products').update({ stock: newStock }).eq('id', product.id)

              // Record stock movement
              await supabase.from('inventory_movements').insert({
                product_id: product.id,
                movement_type: 'OUT',
                quantity: itemQty,
                reference_type: 'ORDER',
                reference_id: dbOrder.id,
                notes: `Venda no Mercado Livre (${orderNumber})`
              })
            }
          }
        }

        // Create Real Notification
        await supabase.from('notifications').insert({
          title: `🛒 Nova Venda: ${orderNumber}`,
          message: `${customerName} comprou R$ ${totalAmount.toFixed(2)} no Mercado Livre.`,
          type: 'ORDER',
          metadata: { order_id: dbOrder?.id, order_number: orderNumber, channel: 'Mercado Livre' }
        })

        console.log(`[ML Webhook] Successfully processed order ${orderNumber}`)
      }
    }

    // 2. If it is an Items notification (items)
    if (topic === 'items' || resource?.startsWith('/items/')) {
      const itemId = resource.replace('/items/', '')
      const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
        headers: { Authorization: `Bearer ${access_token}` }
      })

      if (itemRes.ok) {
        const item = await itemRes.json()
        const sku = item.seller_custom_field || item.id
        const primaryPic = (item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url || item.thumbnail || '').replace('http://', 'https://')

        const { data: prod } = await supabase.from('products').upsert({
          sku,
          name: item.title,
          stock: Number(item.available_quantity) || 0,
          image_url: primaryPic,
          status: item.status === 'active' ? 'ACTIVE' : 'PAUSED'
        }, { onConflict: 'sku' }).select('id').single()

        if (prod?.id && item.pictures?.length) {
          await supabase.from('product_images').delete().eq('product_id', prod.id)
          for (let pi = 0; pi < item.pictures.length; pi++) {
            const picUrl = (item.pictures[pi].secure_url || item.pictures[pi].url || '').replace('http://', 'https://')
            if (picUrl) {
              await supabase.from('product_images').insert({
                product_id: prod.id,
                url: picUrl,
                is_primary: pi === 0,
                sort_order: pi
              })
            }
          }
        }
        console.log(`[ML Webhook] Successfully updated product ${sku}`)
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[ML Webhook Error]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 200 }) // Return 200 to acknowledge webhook
  }
}
