import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getValidTokenBySellerId } from '@/services/mercadolivre/client'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient()

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*, marketplaces(id, name, code, logo), marketplace_accounts(seller_id), order_items(*, products(id, name, sku, image_url, cost_purchase, stock))')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders for labels:', ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 400 })
    }

    const { data: printLogs } = await supabase
      .from('order_status_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    const ordersData = orders || []
    const sellerIds = Array.from(new Set(
      ordersData
        .map((o: any) => o.marketplace_accounts?.seller_id)
        .filter((id: any): id is string => typeof id === 'string')
    ))

    const tokenCache = new Map<string, string>()
    for (const sid of sellerIds) {
      try {
        tokenCache.set(sid, await getValidTokenBySellerId(sid))
      } catch (e) {
        console.warn('Could not get token for seller', sid, e)
      }
    }

    const normalizedOrders: any[] = []
    for (const o of ordersData) {
      const items = o.order_items || []
      const firstItem = items[0]
      const product = firstItem?.products || null
      const mp = o.marketplaces || { name: 'Mercado Livre', code: 'MERCADO_LIVRE', logo: '/logos/mercado-livre.svg' }

      let labelStatus: 'AVAILABLE' | 'QUEUED' | 'PRINTING' | 'PRINTED' | 'ERROR' | 'UNAVAILABLE' = 'AVAILABLE'
      
      if (o.status === 'CANCELADO') {
        labelStatus = 'UNAVAILABLE'
      } else if (o.status === 'ENVIADO' || o.status === 'ENTREGUE' || o.status === 'ETIQUETA_IMPRESSA' || o.shipped_at) {
        labelStatus = 'PRINTED'
      } else if (o.status === 'EM_SEPARACAO') {
        labelStatus = 'QUEUED'
      } else if (o.status === 'ERROR') {
        labelStatus = 'ERROR'
      } else {
        labelStatus = 'AVAILABLE'
      }

      const productSku = product?.sku || firstItem?.sku || 'SKU-PADRAO'
      const productName = product?.name || firstItem?.product_name || 'Produto'
      let productImage = product?.image_url || firstItem?.image_url || ''
      const sellerId = o.marketplace_accounts?.seller_id
      const token = sellerId ? tokenCache.get(sellerId) : undefined

      if (!productImage && token && productName && productName !== 'Produto') {
        const query = encodeURIComponent(productName)
        const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${query}&limit=1`
        try {
          const searchRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          })
          if (searchRes.ok) {
            const searchData = await searchRes.json()
            const found = searchData.results?.[0]
            if (found?.thumbnail) {
              productImage = found.thumbnail.replace('http://', 'https://')
            }
          }
        } catch (e) {
          console.warn('Failed to fetch product image from ML search:', e)
        }
      }

      if (!productImage) {
        productImage = 'https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp'
      }

      normalizedOrders.push({
        id: o.id,
        orderNumber: o.order_number || o.id?.slice(0, 10),
        customerName: o.customer_name || 'Comprador',
        customerPhone: o.customer_phone,
        marketplaceName: mp.name || 'Mercado Livre',
        marketplaceCode: mp.code || 'MERCADO_LIVRE',
        marketplaceLogo: mp.logo || '/logos/mercado-livre.svg',
        accountName: 'Conta Principal',
        productName,
        productSku,
        productImage,
        productStock: product?.stock || 0,
        itemQuantity: firstItem?.quantity || 1,
        totalItemsCount: items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0),
        shippingAddress: o.notes || 'Endereço não informado',
        trackingCode: o.tracking_code || 'MEL' + Math.floor(1000000000 + Math.random() * 9000000000),
        carrier: o.carrier || 'Mercado Envios',
        totalAmount: Number(o.total_amount || 0),
        status: o.status,
        labelStatus,
        createdAt: o.created_at || new Date().toISOString(),
        updatedAt: o.updated_at || o.created_at,
        shippedAt: o.shipped_at,
      })
    }

    const stats = {
      total: normalizedOrders.length,
      available: normalizedOrders.filter(o => o.labelStatus === 'AVAILABLE').length,
      printed: normalizedOrders.filter(o => o.labelStatus === 'PRINTED').length,
      errors: normalizedOrders.filter(o => o.labelStatus === 'ERROR').length,
      unavailable: normalizedOrders.filter(o => o.labelStatus === 'UNAVAILABLE').length,
    }

    const integrationsHealth = [
      { name: 'Mercado Livre', status: 'ONLINE', latencyMs: 120, lastSync: new Date().toISOString() },
      { name: 'Shopee', status: 'OFFLINE', latencyMs: 180, lastSync: new Date().toISOString() },
      { name: 'TikTok Shop', status: 'OFFLINE', latencyMs: 150, lastSync: new Date().toISOString() },
      { name: 'Magalu', status: 'OFFLINE', latencyMs: 210, lastSync: new Date().toISOString() },
    ]

    return NextResponse.json({
      orders: normalizedOrders,
      stats,
      integrationsHealth,
      printLogs: printLogs || [],
      serverTime: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('Internal server error in shipments/labels:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
