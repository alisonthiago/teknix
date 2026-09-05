import { supabase } from '../lib/supabase'
import type { Product, Category } from '../types/database'

export const TEKNIX_DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'Parafusadeira e Furadeira de Impacto 12V Bivolt TEKNIX',
    slug: 'parafusadeira-impacto-12v',
    sku: 'TKN-FUR-12V',
    price: 299.90,
    promo_price: 249.90,
    short_description: 'Máxima precisão e autonomia para montagens e manutenções pesadas.',
    description: 'A Parafusadeira e Furadeira de Impacto TEKNIX 12V Bivolt oferece máxima precisão e autonomia para montagens, reformas e manutenções pesadas.',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'],
    brand: 'TEKNIX',
    status: 'active',
    active: true
  },
  {
    id: 'demo-2',
    name: 'Esmerilhadeira Angular 4.1/2" 850W TEKNIX Pro',
    slug: 'esmerilhadeira-angular-850w',
    sku: 'TKN-ESM-850',
    price: 389.00,
    promo_price: 349.00,
    short_description: 'Corte rápido, sem rebarbas e com alta durabilidade em metais e alvenaria.',
    description: 'Esmerilhadeira angular de alta rotação para cortes e desbastes exigentes com motor de 850W blindado contra poeira.',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'],
    brand: 'TEKNIX',
    status: 'active',
    active: true
  },
  {
    id: 'demo-3',
    name: 'Serra Mármore 1400W Alta Potência TEKNIX',
    slug: 'serra-marmore-1400w',
    sku: 'TKN-SRM-1400',
    price: 449.00,
    promo_price: 399.90,
    short_description: 'Desempenho industrial e cortes precisos em porcelanatos e mármores.',
    description: 'Serra mármore para cortes retos e em ângulo com motor reforçado de 1400W e ajuste rápido de profundidade.',
    image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80'],
    brand: 'TEKNIX',
    status: 'active',
    active: true
  },
  {
    id: 'demo-4',
    name: 'Kit Maleta de Ferramentas e Brocas 111 Peças TEKNIX',
    slug: 'kit-ferramentas-111-pecas',
    sku: 'TKN-KIT-111',
    price: 189.90,
    promo_price: 159.90,
    short_description: 'Kit profissional completo em maleta reforçada com soquetes e bits.',
    description: 'Maleta organizadora resistente contendo jogo completo de brocas, soquetes, bits magnéticos e chave catraca.',
    image_url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80'],
    brand: 'TEKNIX',
    status: 'active',
    active: true
  }
]

export async function getProducts(options?: {
  category?: string
  segment?: string
  search?: string
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest'
  limit?: number
  offset?: number
  featured?: boolean
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

    // Se ainda não houver produtos no banco, retorna o catálogo de demonstração TEKNIX
    return TEKNIX_DEMO_PRODUCTS
  } catch (err) {
    console.error('Error fetching products:', err)
    return TEKNIX_DEMO_PRODUCTS
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
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data as Category[]
}

export async function getFeaturedProducts(limit = 4) {
  return getProducts({ featured: true, limit })
}

export async function getProductsByCategory(categorySlug: string, limit = 8) {
  return getProducts({ category: categorySlug, limit })
}
