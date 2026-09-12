import { supabase } from '../lib/supabase'
import type { Product, Category } from '../types/database'

export const TEKNIX_DEMO_PRODUCTS: Product[] = []

export async function getProducts(options?: {
  category?: string
  segment?: string
  search?: string
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest'
  limit?: number
  offset?: number
  featured?: boolean
  flash_sale?: boolean
}) {
  try {
    let query = supabase
      .from('products')
      .select('*')

    if (options?.category || options?.segment) {
      const cat = (options.category || options.segment)!.trim()
      if (cat) {
        query = query.or(`category_id.eq.${cat},slug.ilike.%${cat}%,name.ilike.%${cat}%`)
      }
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
    }

    if (options?.featured) {
      query = query.eq('featured', true)
    }

    if (options?.flash_sale) {
      query = query.eq('flash_sale', true)
    }

    switch (options?.sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    if (options?.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data as Product[]
    }

    // Se a consulta com filtros não retornar nada ou der erro, tenta pegar todos sem filtros
    const { data: allData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options?.limit || 8)

    if (allData && allData.length > 0) {
      return allData as Product[]
    }

    return []
  } catch (err) {
    console.error('Error fetching products:', err)
    return []
  }
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data as Product
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('store_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    active: c.status === 'active' || c.active === true,
    sort_order: c.sort_order
  })) as unknown as Category[]
}

export async function getFeaturedProducts(limit = 4) {
  return getProducts({ featured: true, limit })
}

export async function getProductsByCategory(categorySlug: string, limit = 8) {
  return getProducts({ category: categorySlug, limit })
}
