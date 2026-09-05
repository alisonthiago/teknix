/* ==========================================================================
   TEKNIX SITE — HOME PAGE DATA SERVICE
   Conecta a Home pública diretamente ao Supabase (HUB & FLOW).
   ========================================================================== */

import { supabase } from '../lib/supabase'
import { getProducts } from './products'
import type { Product } from '../types/database'

export interface HomeHeroBanner {
  id: string
  title: string
  subtitle: string
  tagline?: string
  callout?: string
  buttonText: string
  buttonLink: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  imageUrl: string
  productId?: string
  backgroundColor?: string
  textColor?: string
}

export interface HomeCategoryItem {
  id: string
  name: string
  slug: string
  icon?: string
  imageUrl?: string
  productCount?: number
}

export interface HomeCampaignRibbon {
  id: string
  text: string
  linkText: string
  linkUrl: string
  backgroundColor?: string
  active: boolean
}

export interface HomeData {
  ribbon: HomeCampaignRibbon | null
  heroes: HomeHeroBanner[]
  featuredProducts: Product[]
  recentProducts: Product[]
  categories: HomeCategoryItem[]
  promos: HomeHeroBanner[]
}

export const DEFAULT_HOME_DATA: HomeData = {
  ribbon: {
    id: 'ribbon-main',
    text: '⚡ Frete Grátis para todo o Brasil em compras acima de R$ 299 + 5% OFF no Pix.',
    linkText: 'Aproveitar Ofertas >',
    linkUrl: '/produtos',
    active: true
  },
  heroes: [
    {
      id: 'hero-1',
      title: 'TEKNIX Pro Series',
      subtitle: 'Tecnologia Industrial de Precisão e Alta Performance.',
      tagline: 'Lançamento Exclusivo',
      callout: 'Pronta entrega com garantia oficial de 3 anos.',
      buttonText: 'Explorar Produtos',
      buttonLink: '/produtos',
      secondaryButtonText: 'Ver Linha Completa',
      secondaryButtonLink: '/produtos',
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1400&q=80'
    },
    {
      id: 'hero-2',
      title: 'Ferramentas Industriais 4.0',
      subtitle: 'Máxima potência, durabilidade extrema e ergonomia avançada.',
      tagline: 'Linha Pesada',
      callout: 'Condições especiais para empresas e profissionais.',
      buttonText: 'Comprar agora',
      buttonLink: '/produtos',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1400&q=80'
    }
  ],
  categories: [
    { id: '1', name: 'Ferramentas Elétricas', slug: 'ferramentas-eletricas', icon: '⚡' },
    { id: '2', name: 'Medição & Laser', slug: 'medicao-laser', icon: '📐' },
    { id: '3', name: 'Baterias & Carregadores', slug: 'baterias-carregadores', icon: '🔋' },
    { id: '4', name: 'Acessórios & Brocas', slug: 'acessorios-brocas', icon: '🛠️' },
    { id: '5', name: 'EPIs & Segurança', slug: 'epis-seguranca', icon: '🦺' }
  ],
  featuredProducts: [
    {
      id: 'prod-1',
      name: 'Parafusadeira e Furadeira de Impacto Brushless 20V Max',
      brand: 'TEKNIX Industrial',
      category: 'Ferramentas Elétricas',
      price: 699.90,
      sell_price: 699.90,
      promo_price: 599.90,
      stock: 24,
      status: 'active',
      slug: 'parafusadeira-furadeira-impacto-20v',
      image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'
    },
    {
      id: 'prod-2',
      name: 'Nível Laser Autonivelante 360 Graus Linha Verde',
      brand: 'TEKNIX Laser',
      category: 'Medição & Laser',
      price: 849.00,
      sell_price: 849.00,
      promo_price: 749.00,
      stock: 15,
      status: 'active',
      slug: 'nivel-laser-360-linha-verde',
      image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80'
    },
    {
      id: 'prod-3',
      name: 'Esmerilhadeira Angular 4.1/2 Pol 900W 11.000 RPM',
      brand: 'TEKNIX Power',
      category: 'Ferramentas Elétricas',
      price: 389.90,
      sell_price: 389.90,
      stock: 30,
      status: 'active',
      slug: 'esmerilhadeira-angular-900w',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80'
    },
    {
      id: 'prod-4',
      name: 'Bateria de Íons de Lítio 20V 4.0Ah Alta Autonomia',
      brand: 'TEKNIX Energy',
      category: 'Baterias & Carregadores',
      price: 279.00,
      sell_price: 279.00,
      promo_price: 249.00,
      stock: 45,
      status: 'active',
      slug: 'bateria-litio-20v-4ah',
      image_url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80'
    }
  ],
  recentProducts: [],
  promos: [
    {
      id: 'promo-1',
      title: 'Linha Brushless 20V',
      subtitle: 'Até 50% mais autonomia e torque para trabalho pesado.',
      tagline: 'Alta Tecnologia',
      buttonText: 'Ver Linha',
      buttonLink: '/produtos',
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80'
    },
    {
      id: 'promo-2',
      title: 'Medição & Precisão Laser',
      subtitle: 'Alcance de até 50 metros com precisão milimétrica.',
      tagline: 'Engenharia',
      buttonText: 'Conhecer',
      buttonLink: '/produtos',
      imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80'
    }
  ]
}

export async function fetchHomeData(): Promise<HomeData> {
  try {
    const [productsResult, categoriesResult] = await Promise.allSettled([
      getProducts({ limit: 12 }),
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    ])

    const allProducts: Product[] = productsResult.status === 'fulfilled' && Array.isArray(productsResult.value) && productsResult.value.length > 0
      ? productsResult.value
      : DEFAULT_HOME_DATA.featuredProducts

    const rawCategories = categoriesResult.status === 'fulfilled' && categoriesResult.value?.data
      ? categoriesResult.value.data
      : []

    const categories: HomeCategoryItem[] = rawCategories && rawCategories.length > 0
      ? rawCategories.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
          icon: c.icon || '📦',
          imageUrl: c.image_url
        }))
      : DEFAULT_HOME_DATA.categories

    const heroes: HomeHeroBanner[] = allProducts.slice(0, 3).map((p: any) => ({
      id: p.id,
      title: p.name,
      subtitle: p.brand ? `Linha Profissional ${p.brand}` : 'Tecnologia e Performance Industrial',
      tagline: p.category || 'Destaque TEKNIX',
      callout: (p.stock || 0) > 0 ? `Em estoque: ${p.stock} unidades — Frete Rápido` : 'Sob encomenda',
      buttonText: 'Comprar agora',
      buttonLink: `/produto/${p.slug || p.sku || p.id}`,
      secondaryButtonText: 'Ver detalhes',
      secondaryButtonLink: `/produto/${p.slug || p.sku || p.id}`,
      imageUrl: p.image_url || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1400&q=80',
      productId: p.id
    }))

    const promos: HomeHeroBanner[] = allProducts.slice(3, 7).map((p: any) => ({
      id: p.id,
      title: p.name,
      subtitle: p.promo_price ? `Oferta: R$ ${Number(p.promo_price).toFixed(2)}` : `A partir de R$ ${Number(p.price || 0).toFixed(2)}`,
      tagline: p.category || 'Destaque',
      buttonText: 'Ver Oferta',
      buttonLink: `/produto/${p.slug || p.sku || p.id}`,
      secondaryButtonText: 'Comprar',
      secondaryButtonLink: `/produto/${p.slug || p.sku || p.id}`,
      imageUrl: p.image_url || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80',
      productId: p.id
    }))


    return {
      ribbon: DEFAULT_HOME_DATA.ribbon,
      heroes: heroes.length > 0 ? heroes : DEFAULT_HOME_DATA.heroes,
      featuredProducts: allProducts,
      recentProducts: allProducts.slice(0, 6),
      categories,
      promos: promos.length > 0 ? promos : DEFAULT_HOME_DATA.promos
    }
  } catch (err: any) {
    console.warn('[HomeService] Usando fallback:', err.message)
    return DEFAULT_HOME_DATA
  }
}
