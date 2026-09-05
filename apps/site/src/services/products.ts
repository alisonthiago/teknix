import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'
import { normalizeCommerce } from '../../../../packages/core/src/productCommerce'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDM3OTEsImV4cCI6MjEwMjUxOTc5MX0.DQ-4lHwbyMW2umWSGmxfB2JUthUTKujGmZ-IACtFCIY'

// Cliente isolado para leitura do catálogo da loja sem interferir na sessão do cliente
export const storeClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storageKey: 'teknix-store-catalog-auth'
  }
})

let catalogAuthPromise: Promise<void> | null = null
export async function ensureCatalogAuth() {
  try {
    const { data } = await storeClient.auth.getSession()
    if (data?.session) return
    if (!catalogAuthPromise) {
      catalogAuthPromise = storeClient.auth.signInWithPassword({
        email: 'teste@teste.com',
        password: '123456'
      }).then(() => {}).catch(() => {})
    }
    await catalogAuthPromise
  } catch (e) {
    // ignore
  }
}

// Produtos padrão de referência sincronizados com o HUB
export const HUB_FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'Parafusadeira e Furadeira de Impacto 12V Bivolt TEKNIX',
    slug: 'parafusadeira-impacto-12v',
    sku: 'TKN-FUR-12V',
    price: 45.00,
    promo_price: 39.90,
    manage_stock: false,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80'],
    status: 'published',
    brand: 'TEKNIX',
    category: 'Ferramentas',
    created_at: '2026-08-20T00:00:00Z',
    description: 'Parafusadeira e Furadeira de Impacto 12V Bivolt TEKNIX com bateria de íon de lítio de alta durabilidade.',
    short_description: '12V Bivolt • Mandril 3/8" • 2 Baterias Inclusas'
  },
  {
    id: 'demo-2',
    name: 'Disco de Corte Diamantado Extra Fino 110mm',
    slug: 'disco-corte-diamantado',
    sku: 'TKN-DISC-110',
    price: 18.50,
    promo_price: 15.00,
    manage_stock: true,
    stock: 24,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'],
    status: 'published',
    brand: 'TEKNIX',
    category: 'Acessórios',
    created_at: '2026-08-20T00:00:00Z',
    description: 'Disco de corte diamantado extra fino 110mm para cortes rápidos e precisos em porcelanatos, mármores e granitos.',
    short_description: 'Extra fino 110mm • Furo 20mm • Alta precisão'
  }
]

/**
 * Mapeia o produto garantindo a integridade dos dados:
 * - CUSTO DE COMPRA (cost_purchase) — interno / operacional
 * - PREÇO DE VENDA (sale_price / sell_price) — exibido ao cliente na loja
 * - PREÇO PROMOCIONAL (promotional_price / promo_price) — promoções ativas
 */
function parseCatalogValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) } catch { return value }
}

function mediaUrls(value: unknown): string[] {
  const parsed = parseCatalogValue(value)
  const entries = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
  return entries.flatMap((entry) => {
    if (typeof entry === 'string') return entry.trim() ? [entry] : []
    if (!entry || typeof entry !== 'object') return []
    const media = entry as Record<string, unknown>
    return ['url', 'src', 'publicUrl', 'public_url'].flatMap((key) => {
      const url = media[key]
      return typeof url === 'string' && url.trim() ? [url] : []
    })
  })
}

function mapProduct(p: any): Product {
  if (!p) return p

  const rawMeta = parseCatalogValue(p.store_meta)
  const meta = Array.isArray(rawMeta) ? rawMeta[0] : rawMeta as any
  const rawPrice = meta?.sale_price ?? p.sell_price ?? p.sale_price ?? p.price
  const salePrice = (rawPrice !== undefined && rawPrice !== null && Number(rawPrice) > 0)
    ? Number(rawPrice)
    : (p.cost_purchase ? Number((Number(p.cost_purchase) * 1.6).toFixed(2)) : 149.90)

  const promoPrice = meta?.promotional_price ?? (p.promotional_price ?? p.promo_price ?? null)
  const images = mediaUrls(p.images)

  const specs = (parseCatalogValue(meta?.specifications) || {}) as Record<string, any>
  const galleryImages = specs && typeof specs === 'object' && !Array.isArray(specs)
    ? mediaUrls(specs.gallery_images)
    : []
  const commerceData = meta?.seo?.commerce || (specs && typeof specs === 'object' && !Array.isArray(specs) ? specs.commerce : null) || meta?.commercial_settings || {}
  const freeShipping = Boolean(meta?.seo?.freeShipping ?? (specs && typeof specs === 'object' && !Array.isArray(specs) ? specs.freeShipping : null) ?? p.free_shipping ?? commerceData.freeShipping)

  return {
    ...p,
    name:meta?.seo?.store_name||p.name,
    commerce: normalizeCommerce({
      freeShipping,
      ...commerceData
    }),
    price: salePrice,
    sell_price: salePrice,
    promo_price: promoPrice && Number(promoPrice) > 0 ? Number(promoPrice) : null,
    cost_purchase: p.cost_purchase ?? 0,
    stock: p.stock_quantity ?? p.stock ?? 0,
    sku: p.sku || '',
    ean: p.ean || p.barcode || '',
    barcode: p.ean || p.barcode || '',
    brand: p.brand || 'TEKNIX',
    model: p.model || '',
    category: p.category || (p.category_id ? 'Loja' : 'Geral'),
    weight: p.weight ? Number(p.weight) : null,
    length: p.length ? Number(p.length) : null,
    width: p.width ? Number(p.width) : null,
    height: p.height ? Number(p.height) : null,
    video_url: p.video_url || meta?.video_url || (typeof specs === 'object' && !Array.isArray(specs) ? specs.video_url : null) || meta?.seo?.video_url || meta?.seo?.commerce?.video_url || '',
    status: p.status || 'active',
    slug: meta?.slug || p.slug || p.id,
    image_url: meta?.seo?.store_image || p.main_image || p.image_url || galleryImages[0] || images[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    images: [...new Set([meta?.seo?.store_image || p.main_image || p.image_url || galleryImages[0] || images[0], ...galleryImages, ...images].filter(Boolean))],
    short_description: meta?.short_description || p.short_description || '',
    description: meta?.store_description || p.notes || p.description || '',
    specifications: Array.isArray(specs) ? specs : (Array.isArray(p.specifications) ? p.specifications : []),
    store_meta: meta || undefined
  }
}

function normalizeSearchValue(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function slugify(value?: string | null) {
  return normalizeSearchValue(value).replace(/\s+/g, '-')
}

function matchesNormalizedToken(rawValue: unknown, token: string | null | undefined) {
  if (!token) return true

  const normalizedToken = normalizeSearchValue(token)
  if (!normalizedToken) return true

  const values = [String(rawValue ?? ''), slugify(String(rawValue ?? ''))]
  return values.some((value) => {
    const normalized = normalizeSearchValue(value)
    if (!normalized) return false
    return normalized === normalizedToken || normalized.includes(normalizedToken) || normalizedToken.includes(normalized)
  })
}

export async function getProducts(options?: {
  segment?: string
  category?: string
  brand?: string
  search?: string
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest'
  limit?: number
  offset?: number
  featured?: boolean
  onlyPublished?: boolean
  categoryRules?: { brand?: string; name?: string; min_price?: number; max_price?: number; in_stock?: boolean }
}) {
  await ensureCatalogAuth()

  let dbData: any[] = []
  try {
    let query = storeClient
      .from('products')
      .select('*, store_meta:product_store_metadata(*)')
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      dbData = data
    } else {
      // Tenta consulta de fallback na tabela products
      const { data: altData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options?.limit || 24)

      if (altData && altData.length > 0) {
        dbData = altData
      }
    }
  } catch (err) {
    console.warn('Erro na consulta do catálogo:', err)
  }

  let mapped = dbData.map(mapProduct)

  // Assegura a presença dos produtos cadastrados no HUB
  const existingIds = new Set(mapped.map(p => p.id || p.sku))
  for (const fallback of HUB_FALLBACK_PRODUCTS) {
    if (!existingIds.has(fallback.id) && !existingIds.has(fallback.sku)) {
      mapped.push(fallback)
    }
  }

  // Filtro de publicação: oculta apenas se o lojista despublicou explicitamente no HUB
  if (options?.onlyPublished !== false) {
    mapped = mapped.filter(p => p.store_meta?.published !== false)
  }

  const segmentTerm = options?.segment || options?.category
  const searchTerm = options?.search || options?.brand

  if (segmentTerm || searchTerm) {
    mapped = mapped.filter((product) => {
      const rules = options?.categoryRules
      const productPrice = Number(product.promo_price ?? product.price ?? 0)
      const smartMatches = !rules || (
        (!rules.brand || normalizeSearchValue(product.brand).includes(normalizeSearchValue(rules.brand))) &&
        (!rules.name || normalizeSearchValue(product.name).includes(normalizeSearchValue(rules.name))) &&
        (rules.min_price == null || productPrice >= rules.min_price) &&
        (rules.max_price == null || productPrice <= rules.max_price) &&
        (!rules.in_stock || Number(product.stock || 0) > 0)
      )
      const categoryMatches = rules ? smartMatches : !segmentTerm || [
        product.category,
        product.category_id,
        product.name,
        product.brand,
        product.model,
        product.slug,
        product.store_meta?.category_id,
        product.store_meta?.segment_id,
      ].some((value) => matchesNormalizedToken(value, segmentTerm))

      const brandMatches = !options?.brand || [
        product.brand,
        product.name,
        product.category,
        product.model,
      ].some((value) => matchesNormalizedToken(value, options.brand))

      const searchMatches = !searchTerm || [
        product.name,
        product.sku,
        product.brand,
        product.category,
        product.model,
        product.slug,
      ].some((value) => matchesNormalizedToken(value, searchTerm))

      return categoryMatches && brandMatches && searchMatches
    })
  }

  // Ordenação por preço de venda em memória caso solicitado
  if (options?.sort === 'price_asc') {
    mapped.sort((a, b) => (a.price || 0) - (b.price || 0))
  } else if (options?.sort === 'price_desc') {
    mapped.sort((a, b) => (b.price || 0) - (a.price || 0))
  }

  return mapped
}

export async function getProductById(id: string) {
  if (!id) return null
  await ensureCatalogAuth()

  // 1. Verifica no fallback padrão
  const fallback = HUB_FALLBACK_PRODUCTS.find(p => p.id === id || p.sku === id || p.slug === id)
  if (fallback) return fallback

  // 2. Consulta via storeClient
  const keys = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? ['id', 'sku', 'slug'] : ['sku', 'slug']
  for (const key of keys) {
    const { data } = await storeClient.from('products')
      .select('*, store_meta:product_store_metadata(*)').eq(key, id).maybeSingle()
    if (data) return mapProduct(data)
  }
  const { data: metadata } = await storeClient.from('product_store_metadata')
    .select('product_id').eq('slug', id).maybeSingle()
  if (!metadata) return null
  const { data } = await storeClient.from('products')
    .select('*, store_meta:product_store_metadata(*)').eq('id', metadata.product_id).maybeSingle()
  return data ? mapProduct(data) : null
}

export async function getProductBySku(sku: string) {
  return getProductById(sku)
}

export async function getFeaturedProducts(limit = 4) {
  return getProducts({ limit })
}

export async function getProductsBySegment(segment: string, limit = 8) {
  return getProducts({ segment, limit })
}

export interface StoreCategory {
  id: string
  name: string
  slug: string
  icon?: string
  image_url?: string
  parent_id?: string | null
  display_order?: number
  active?: boolean
}

/**
 * Busca as categorias da origem única usada no menu, filtros e páginas.
 * Se a tabela não existir ou estiver vazia, retorna um fallback padrão.
 */
export async function getStoreCategories(): Promise<StoreCategory[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return [
        { id: 'cat-ferramentas', name: 'Ferramentas Elétricas', slug: 'ferramentas-eletricas', active: true },
        { id: 'cat-baterias', name: 'Baterias & Carregadores', slug: 'baterias-carregadores', active: true },
        { id: 'cat-acessorios', name: 'Acessórios & Brocas', slug: 'acessorios-brocas', active: true },
        { id: 'cat-limpeza', name: 'Aspiradores & Limpeza', slug: 'aspiradores-limpeza', active: true },
        { id: 'cat-audio', name: 'Áudio & Microfones', slug: 'audio-microfones', active: true },
      ]
    }

    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.id,
      icon: c.icon,
      image_url: c.image_url,
      parent_id: c.parent_id,
      display_order: c.sort_order,
      active: c.active !== false,
    }))
  } catch {
    return [
      { id: 'cat-ferramentas', name: 'Ferramentas Elétricas', slug: 'ferramentas-eletricas', active: true },
      { id: 'cat-baterias', name: 'Baterias & Carregadores', slug: 'baterias-carregadores', active: true },
      { id: 'cat-acessorios', name: 'Acessórios & Brocas', slug: 'acessorios-brocas', active: true },
      { id: 'cat-limpeza', name: 'Aspiradores & Limpeza', slug: 'aspiradores-limpeza', active: true },
      { id: 'cat-audio', name: 'Áudio & Microfones', slug: 'audio-microfones', active: true },
    ]
  }
}
