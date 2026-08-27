import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'

/**
 * Mapeia o produto garantindo a separação estrita entre:
 * - CUSTO DE COMPRA (cost_purchase) — interno / operacional
 * - PREÇO DE VENDA (sale_price / sell_price) — exibido ao cliente na loja
 * - PREÇO PROMOCIONAL (promotional_price / promo_price) — promoções ativas
 */
function mapProduct(p: any): Product {
  if (!p) return p

  const meta = Array.isArray(p.store_meta) ? p.store_meta[0] : p.store_meta
  const salePrice = meta?.sale_price ?? p.sale_price ?? p.price ?? (p.cost_purchase ? Number((p.cost_purchase * 1.6).toFixed(2)) : 149.90)
  const promoPrice = meta?.promotional_price ?? p.promotional_price ?? p.promo_price ?? null

  return {
    ...p,
    price: salePrice,
    sell_price: salePrice,
    promo_price: promoPrice && promoPrice > 0 ? promoPrice : null,
    cost_purchase: p.cost_purchase ?? 0, // Custo de compra permanece separado
    stock: p.stock ?? p.stock_quantity ?? 0,
    status: p.status || 'active',
    slug: meta?.slug || p.slug || p.id,
    image_url: p.image_url || (meta?.images && meta.images[0]) || 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-select-11in-wifi-purple-202405?wid=800&hei=800&fmt=jpeg&qlt=95'
  }
}

export async function getProducts(options?: {
  segment?: string
  category?: string
  search?: string
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest'
  limit?: number
  offset?: number
  featured?: boolean
}) {
  let query = supabase
    .from('products')
    .select('*, store_meta:product_store_metadata(*)')

  // Filtro de status: permite produtos ativos ou pausados na importação mestre
  query = query.in('status', ['active', 'ACTIVE', 'published', 'PAUSED', 'paused'])

  if (options?.segment || options?.category) {
    const cat = options.segment || options.category
    query = query.eq('category', cat)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%,brand.ilike.%${options.search}%`)
  }

  // Ordenação
  query = query.order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)
  }

  const { data, error } = await query

  if (error) {
    // Fallback simples caso a relation com product_store_metadata falhe
    const { data: fallbackData } = await supabase
      .from('products')
      .select('*')
      .in('status', ['active', 'ACTIVE', 'published'])
      .order('created_at', { ascending: false })

    return (fallbackData || []).map(mapProduct)
  }

  const mapped = (data || []).map(mapProduct)

  // Ordenação por preço de venda em memória caso solicitado
  if (options?.sort === 'price_asc') {
    mapped.sort((a, b) => (a.price || 0) - (b.price || 0))
  } else if (options?.sort === 'price_desc') {
    mapped.sort((a, b) => (b.price || 0) - (a.price || 0))
  }

  return mapped
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, store_meta:product_store_metadata(*)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    const { data: fallback } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    return fallback ? mapProduct(fallback) : null
  }

  return mapProduct(data)
}

export async function getProductBySku(sku: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, store_meta:product_store_metadata(*)')
    .eq('sku', sku)
    .maybeSingle()

  if (error || !data) {
    const { data: fallback } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .maybeSingle()

    return fallback ? mapProduct(fallback) : null
  }

  return mapProduct(data)
}

export async function getFeaturedProducts(limit = 4) {
  return getProducts({ limit })
}

export async function getProductsBySegment(segment: string, limit = 8) {
  return getProducts({ segment, limit })
}
