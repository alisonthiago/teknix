import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'
import { normalizeCommerce, cleanProductTitle, normalizeShowcase } from '../../../../packages/core/src/productCommerce'

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
    id: 'macaco-hidraulico-garrafa-2t',
    name: 'Macaco Hidráulico Tipo Garrafa 2 Toneladas Bovenau Profissional',
    slug: 'macaco-hidraulico-tipo-garrafa-2-toneladas-bovenau',
    sku: 'TKN-MCK-002',
    price: 189.90,
    promo_price: 159.90,
    manage_stock: true,
    stock: 25,
    image_url: '/images/referencias/macaco-hidraulico.webp',
    images: ['/images/referencias/macaco-hidraulico.webp'],
    status: 'published',
    brand: 'Bovenau',
    category: 'Equipamentos Automotivos',
    created_at: '2026-08-20T00:00:00Z',
    description: 'Macaco hidráulico tipo garrafa capacidade 2 toneladas, ideal para oficinas, borracharias e manutenção automotiva com válvula de segurança integrada.',
    short_description: 'Capacidade 2 Toneladas • Acionamento hidráulico suave • Bovenau'
  },
  {
    id: 'morsa-bancada-giratoria-n4',
    name: 'Morsa Torno de Bancada Giratória Nº 4 Base com Fixação Reforçada',
    slug: 'morsa-torno-bancada-giratoria-n4',
    sku: 'TKN-MRS-004',
    price: 249.90,
    promo_price: 219.90,
    manage_stock: true,
    stock: 18,
    image_url: '/images/referencias/morsa-de-bancada.webp',
    images: ['/images/referencias/morsa-de-bancada.webp'],
    status: 'published',
    brand: 'TEKNIX',
    category: 'Ferramentas Manuais e Bancada',
    created_at: '2026-08-20T00:00:00Z',
    description: 'Morsa torno de bancada nº 4 com base giratória 360 graus em ferro fundido nodular de alta resistência.',
    short_description: 'Base Giratória 360° • Ferro Fundido Nodular • Mordente Aço Temperado'
  },
  {
    id: 'pistola-pintura-hvlp-600ml',
    name: 'Pistola de Pintura Gravidade Profissional HVLP Bico 1.4mm Caneca 600ml',
    slug: 'pistola-pintura-gravidade-hvlp-bico-14mm-600ml',
    sku: 'TKN-PST-014',
    price: 199.90,
    promo_price: 169.90,
    manage_stock: true,
    stock: 32,
    image_url: '/images/referencias/pistola-de-pintura.webp',
    images: ['/images/referencias/pistola-de-pintura.webp'],
    status: 'published',
    brand: 'PDR',
    category: 'Pintura e Repintura',
    created_at: '2026-08-20T00:00:00Z',
    description: 'Pistola de pintura profissional HVLP por gravidade com bico 1.4mm e copo de 600ml para acabamentos finos.',
    short_description: 'Tecnologia HVLP • Bico 1.4mm Aço Inox • Caneca 600ml'
  },
  {
    id: 'lixadeira-roto-orbital-125mm',
    name: 'Lixadeira Roto Orbital Elétrica 125mm 300W com Coletor de Pó',
    slug: 'lixadeira-roto-orbital-eletrica-125mm-300w',
    sku: 'TKN-LIX-125',
    price: 279.90,
    promo_price: 239.90,
    manage_stock: true,
    stock: 20,
    image_url: '/images/referencias/lixadeira.webp',
    images: ['/images/referencias/lixadeira.webp'],
    status: 'published',
    brand: 'TEKNIX',
    category: 'Ferramentas Elétricas',
    created_at: '2026-08-20T00:00:00Z',
    description: 'Lixadeira roto orbital de alta performance com velocidade variável e sistema integrado de aspiração de pó.',
    short_description: 'Potência 300W • Disco 125mm • 6 Níveis de Velocidade'
  },
  {
    id: 'b5ec9f54-f942-4e7f-bd2c-a78b269e6f59',
    name: 'Kit Parafusadeira Chave Fenda Elétrica 30 Peças Lançamento',
    slug: 'kit-parafusadeira-chave-fenda-eletrica-30-pecas',
    sku: 'MLB7453209398',
    price: 119.90,
    promo_price: 99.90,
    manage_stock: true,
    stock: 30,
    image_url: 'https://http2.mlstatic.com/D_985226-MLA115019108190_082026-O.jpg',
    images: ['https://http2.mlstatic.com/D_985226-MLA115019108190_082026-O.jpg'],
    status: 'published',
    brand: 'Bomvink',
    category: 'Ferramentas',
    created_at: '2026-08-20T00:00:00Z',
    description: 'A Parafusadeira Chave de Fenda Elétrica Bomvink BOM-9917 foi desenvolvida para facilitar tarefas do dia a dia com mais agilidade, precisão e conforto.',
    short_description: 'Kit 30 peças com estojo organizador • Bateria recarregável'
  },
  {
    id: '4bae4104-dadb-44e1-98b0-8e3128eb7222',
    name: 'Kit Jogo De Ferramentas Chave Catraca Soquete Crv 46 Peças Sextavado',
    slug: 'kit-ferramentas-catraca-soquete-crv-46-pecas',
    sku: 'MLB7451225922',
    price: 69.90,
    promo_price: 54.90,
    manage_stock: true,
    stock: 45,
    image_url: 'https://http2.mlstatic.com/D_955140-MLA100095920631_122025-O.jpg',
    images: ['https://http2.mlstatic.com/D_955140-MLA100095920631_122025-O.jpg'],
    status: 'published',
    brand: 'Bomvink',
    category: 'Ferramentas Manuais',
    created_at: '2026-08-20T00:00:00Z',
    description: 'Jogo de ferramentas catraca soquetes 46 peças em aço cromo vanádio de alta durabilidade.',
    short_description: 'Aço CrV 46 peças • Maleta rígida reforçada'
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
    name: cleanProductTitle(meta?.seo?.store_name || p.name),
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
    editorial_showcase: (() => {
      const rawShowcase = {
        ...((meta?.seo?.editorial_showcase && typeof meta.seo.editorial_showcase === 'object') ? meta.seo.editorial_showcase : {}),
        ...((specs?.editorial_showcase && typeof specs.editorial_showcase === 'object') ? specs.editorial_showcase : {}),
        ...(((p as any).editorial_showcase && typeof (p as any).editorial_showcase === 'object') ? (p as any).editorial_showcase : {})
      }
      const normalized = normalizeShowcase(rawShowcase, meta?.seo?.store_name || p.name, [...new Set([meta?.seo?.store_image || p.main_image || p.image_url || galleryImages[0] || images[0], ...galleryImages, ...images].filter(Boolean))])
      const presentationImages = Array.isArray(rawShowcase.presentation_images)
        ? rawShowcase.presentation_images.filter((image: unknown): image is string => typeof image === 'string' && image.trim().length > 0).slice(0, 3)
        : []
      return { ...normalized, presentation_images: presentationImages }
    })(),
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

      const searchMatches = !searchTerm || (() => {
        const normTerm = normalizeSearchValue(searchTerm)
        if (!normTerm) return true

        const fullProductText = normalizeSearchValue([
          product.name,
          product.sku,
          product.brand,
          product.category,
          product.model,
          product.slug,
          product.short_description,
          product.description
        ].join(' '))

        if (fullProductText.includes(normTerm)) return true

        const words = normTerm.split(/\s+/).filter(w => w.length > 1)
        if (words.length === 0) return true

        return words.every(word => fullProductText.includes(word))
      })()

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

  // 1. Verifica no fallback padrão
  const fallback = HUB_FALLBACK_PRODUCTS.find(p => p.id === id || p.sku === id || p.slug === id)
  if (fallback) return fallback

  // 2. Consulta o catálogo público sem depender da sessão do cliente.
  // A visualização de produto é pública; autenticação fica restrita a conta,
  // pedidos e checkout. O storeClient ainda é usado para respeitar as regras
  // de publicação existentes quando a base permitir leitura anônima.
  const keys = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? ['id', 'sku', 'slug', 'mercadolivre_item_id']
    : ['sku', 'slug', 'mercadolivre_item_id']
  for (const key of keys) {
    try {
      const { data } = await storeClient.from('products')
        .select('*, store_meta:product_store_metadata(*)').ilike(key, id).maybeSingle()
      if (data) return mapProduct(data)
    } catch {
      // A página continua pública mesmo quando o catálogo remoto está indisponível.
    }
  }
  try {
    const { data: metadata } = await storeClient.from('product_store_metadata')
      .select('product_id').ilike('slug', id).maybeSingle()
    if (!metadata) return null
    const { data } = await storeClient.from('products')
      .select('*, store_meta:product_store_metadata(*)').eq('id', metadata.product_id).maybeSingle()
    return data ? mapProduct(data) : null
  } catch {
    return null
  }
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
