/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { getValidToken } from './client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function syncMercadoLivreAccount(sellerId: string) {
  const supabase = getSupabase()

  // 1. Get connection and token
  const { data: conn } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('seller_id', sellerId)
    .single()

  let token = conn?.access_token
  const userId = conn?.user_id || '3af9068a-4b78-4c9c-8657-f83b93c01588'

  if (conn?.user_id) {
    try {
      token = await getValidToken(conn.user_id)
    } catch {
      // fallback to stored access_token
      token = conn.access_token
    }
  }

  const results = {
    productsSynced: 0,
    ordersSynced: 0,
    errors: [] as string[]
  }

  if (!token) {
    // If no live token, search for products already listed or mock active listings
    console.warn(`No valid access token found for seller ${sellerId}`)
    return results
  }

  // 2. Fetch seller's active items
  try {
    const itemsSearchRes = await fetch(`https://api.mercadolibre.com/users/${sellerId}/items/search?status=active&limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (itemsSearchRes.ok) {
      const searchData = await itemsSearchRes.json()
      const itemIds: string[] = searchData.results || []

      // Fetch details in batches of 20
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
            const thumbnail = item.pictures?.[0]?.url || item.thumbnail || ''

            const brandAttr = item.attributes?.find((a: any) => a.id === 'BRAND')?.value_name || null
            const modelAttr = item.attributes?.find((a: any) => a.id === 'MODEL')?.value_name || null
            const gtinAttr = item.attributes?.find((a: any) => a.id === 'GTIN' || a.id === 'EAN')?.value_name || null

            // Upsert into products
            const { data: product } = await supabase
              .from('products')
              .upsert({
                sku,
                name: title,
                brand: brandAttr,
                model: modelAttr,
                ean: gtinAttr,
                cost_purchase: Math.round(price * 0.6 * 100) / 100, // estimated initial cost
                stock,
                status: 'ACTIVE'
              }, { onConflict: 'sku' })
              .select('id')
              .single()

            // Upsert into marketplace_listings
            await supabase
              .from('marketplace_listings')
              .upsert({
                marketplace_id: '6ef8f3db-6d35-4701-86f7-8199378ec0c7',
                product_id: product?.id || null,
                seller_id: sellerId,
                external_listing_id: item.id,
                title,
                price,
                stock,
                status: item.status,
                permalink: item.permalink,
                thumbnail_url: thumbnail,
                last_synced_at: new Date().toISOString()
              }, { onConflict: 'external_listing_id' })

            results.productsSynced++
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Error fetching ML items:', err)
    results.errors.push(err.message)
  }

  // 3. Fetch recent orders
  try {
    const ordersRes = await fetch(`https://api.mercadolibre.com/orders/search?seller=${sellerId}&limit=50&sort=date_desc`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (ordersRes.ok) {
      const ordersData = await ordersRes.json()
      const orders: any[] = ordersData.results || []

      for (const ord of orders) {
        const orderId = ord.id.toString()
        const totalAmount = Number(ord.total_amount) || 0
        const dateCreated = ord.date_created ? ord.date_created.split('T')[0] : new Date().toISOString().split('T')[0]

        // Upsert into sales
        await supabase
          .from('sales')
          .upsert({
            order_id: `ML-${orderId}`,
            date: dateCreated,
            total_revenue: totalAmount,
            status: ord.status === 'paid' ? 'COMPLETED' : 'PENDING'
          }, { onConflict: 'order_id' })

        results.ordersSynced++
      }
    }
  } catch (err: any) {
    console.error('Error fetching ML orders:', err)
    results.errors.push(err.message)
  }

  // 4. Update last_sync_at on marketplace_accounts and connections
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
