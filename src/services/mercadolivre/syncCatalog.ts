/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { getValidTokenBySellerId } from './client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function syncMercadoLivreAccount(sellerId: string) {
  const supabase = getSupabase()

  const results = {
    productsSynced: 0,
    ordersSynced: 0,
    errors: [] as string[]
  }

  // 1. Get authenticated seller token
  let token: string
  try {
    token = await getValidTokenBySellerId(sellerId)
  } catch (err: any) {
    console.error(`[Sync ML] Token error for seller ${sellerId}:`, err.message)
    results.errors.push(err.message)
    return results
  }

  // Resolve Marketplace ID & Account ID
  let marketplaceId = '6ef8f3db-6d35-4701-86f7-8199378ec0c7'
  const { data: mp } = await supabase
    .from('marketplaces')
    .select('id')
    .or('code.eq.MERCADO_LIVRE,code.eq.mercadolivre')
    .single()
  if (mp) marketplaceId = mp.id

  const { data: mpAcc } = await supabase
    .from('marketplace_accounts')
    .select('id')
    .eq('seller_id', sellerId)
    .single()
  const marketplaceAccountId = mpAcc?.id || null

  // ----------------------------------------------------
  // 2. Fetch & Sync Seller's Active Items
  // ----------------------------------------------------
  try {
    const itemsSearchRes = await fetch(`https://api.mercadolibre.com/users/${sellerId}/items/search?status=active&limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (itemsSearchRes.ok) {
      const searchData = await itemsSearchRes.json()
      const itemIds: string[] = searchData.results || []

      for (let i = 0; i < itemIds.length; i += 20) {
        const batchIds = itemIds.slice(i, i + 20).join(',')
        const multiGetRes = await fetch(`https://api.mercadolibre.com/items?ids=${batchIds}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (multiGetRes.ok) {
          const itemsData: { code: number; body: any }[] = await multiGetRes.json()

          for (const wrapper of itemsData) {
            if (wrapper.code !== 200 || !wrapper.body) continue
            const item = wrapper.body

            const sku = item.seller_custom_field || item.id
            const title = item.title
            const price = Number(item.price) || 0
            const stock = Number(item.available_quantity) || 0

            const brandAttr = item.attributes?.find((a: any) => a.id === 'BRAND')?.value_name || null
            const modelAttr = item.attributes?.find((a: any) => a.id === 'MODEL')?.value_name || null
            const gtinAttr = item.attributes?.find((a: any) => a.id === 'GTIN' || a.id === 'EAN')?.value_name || null
            const primaryPic = (item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url || item.thumbnail || '').replace('http://', 'https://')

            // Upsert into products
            const { data: product } = await supabase
              .from('products')
              .upsert({
                sku,
                name: title,
                brand: brandAttr,
                model: modelAttr,
                ean: gtinAttr,
                image_url: primaryPic,
                cost_purchase: Math.round(price * 0.6 * 100) / 100,
                stock,
                status: 'ACTIVE'
              }, { onConflict: 'sku' })
              .select('id')
              .single()

            if (product?.id && item.pictures?.length) {
              await supabase.from('product_images').delete().eq('product_id', product.id)
              for (let pi = 0; pi < item.pictures.length; pi++) {
                const picUrl = (item.pictures[pi].secure_url || item.pictures[pi].url || '').replace('http://', 'https://')
                if (picUrl) {
                  await supabase.from('product_images').insert({
                    product_id: product.id,
                    url: picUrl,
                    is_primary: pi === 0,
                    sort_order: pi
                  })
                }
              }
            }

            // Upsert into marketplace_listings
            await supabase
              .from('marketplace_listings')
              .upsert({
                marketplace_id: marketplaceId,
                product_id: product?.id || null,
                seller_id: sellerId,
                external_listing_id: item.id,
                title,
                price,
                stock,
                status: item.status,
                permalink: item.permalink,
                thumbnail_url: primaryPic,
                last_synced_at: new Date().toISOString()
              }, { onConflict: 'external_listing_id' })

            results.productsSynced++
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Sync ML] Error fetching items:', err)
    results.errors.push(err.message)
  }

  // ----------------------------------------------------
  // 3. Fetch & Reconcile Recent Orders
  // ----------------------------------------------------
  try {
    const ordersRes = await fetch(`https://api.mercadolibre.com/orders/search?seller=${sellerId}&limit=50&sort=date_desc`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (ordersRes.ok) {
      const ordersData = await ordersRes.json()
      const orders: any[] = ordersData.results || []

      for (const ord of orders) {
        const orderId = ord.id.toString()
        const orderNumber = `MLB-${orderId}`
        const totalAmount = Number(ord.total_amount) || 0
        const dateCreated = ord.date_created ? ord.date_created.split('T')[0] : new Date().toISOString().split('T')[0]
        const customerName = `${ord.buyer?.first_name || ''} ${ord.buyer?.last_name || ''}`.trim() || ord.buyer?.nickname || 'Cliente Mercado Livre'

        // Resolve shipment details
        let tracking = ''
        let address = ''
        let city = ''
        let state = ''
        let zip = ''
        let shippingMethod = 'Mercado Envios'
        let shippingCost = 0

        if (ord.shipping?.id) {
          try {
            const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${ord.shipping.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (shipRes.ok) {
              const shipData = await shipRes.json()
              tracking = shipData.tracking_number || shipData.tracking_id || `MEL${ord.shipping.id}`
              address = `${shipData.receiver_address?.street_name || ''} ${shipData.receiver_address?.street_number || ''}`.trim() || 'Endereço Mercado Envios'
              city = shipData.receiver_address?.city?.name || 'São Paulo'
              state = shipData.receiver_address?.state?.id || 'SP'
              zip = shipData.receiver_address?.zip_code || '06412-270'
              shippingCost = Number(shipData.base_cost || 0)
              shippingMethod = shipData.logistic_type ? `Mercado Envios (${shipData.logistic_type.toUpperCase()})` : 'Mercado Envios'
            }
          } catch (e) {
            console.warn('[Sync ML] Shipping fetch warning:', e)
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
        const orderStatus = statusMap[ord.status] || 'PAGO'

        // A. Upsert into orders
        const { data: dbOrder } = await supabase
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

        // B. Upsert into sales
        const { data: dbSale } = await supabase
          .from('sales')
          .upsert({
            order_id: `ML-${orderId}`,
            marketplace_id: marketplaceId,
            marketplace_account_id: marketplaceAccountId,
            date: dateCreated,
            total_revenue: totalAmount,
            status: ord.status === 'paid' ? 'COMPLETED' : 'PENDING'
          }, { onConflict: 'order_id' })
          .select('id')
          .single()

        // C. Upsert into marketplace_orders
        await supabase
          .from('marketplace_orders')
          .upsert({
            marketplace_id: 'mercadolivre',
            external_order_id: orderId,
            seller_id: sellerId,
            status: ord.status,
            total_amount: totalAmount,
            currency: ord.currency_id || 'BRL',
            order_date: ord.date_created,
            paid_at: ord.payments?.[0]?.date_approved || null,
            raw_data: ord,
            updated_at: new Date().toISOString()
          }, { onConflict: 'marketplace_id, external_order_id' })

        // D. Order Items & Sale Items
        if (ord.order_items?.length) {
          for (const it of ord.order_items) {
            const itemSku = it.item?.seller_custom_field || it.item?.seller_sku || it.item?.id
            const itemTitle = it.item?.title || 'Produto Mercado Livre'
            const itemQty = Number(it.quantity) || 1
            const itemPrice = Number(it.unit_price) || 0
            const itemFee = Number(it.sale_fee) || 0

            const { data: product } = await supabase
              .from('products')
              .select('id, cost_purchase')
              .eq('sku', itemSku)
              .single()

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
          }
        }

        results.ordersSynced++
      }
    }
  } catch (err: any) {
    console.error('[Sync ML] Error fetching orders:', err)
    results.errors.push(err.message)
  }

  // 4. Update last_sync_at timestamps
  const now = new Date().toISOString()
  await supabase
    .from('marketplace_accounts')
    .update({ last_sync_at: now })
    .eq('seller_id', sellerId)

  await supabase
    .from('marketplace_connections')
    .update({ last_sync_at: now })
    .eq('seller_id', sellerId)

  return results
}
