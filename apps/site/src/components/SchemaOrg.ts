/**
 * SchemaOrg — Dados estruturados JSON-LD Schema.org para o TEKNIX SITE
 *
 * Builders de schema prontos para cada tipo de conteúdo:
 *
 *   buildWebSiteSchema()        → Home
 *   buildOrganizationSchema()   → Toda o site (identidade da empresa)
 *   buildProductSchema(product) → Página de produto
 *   buildBreadcrumbSchema(...)  → Categoria e produto
 *   buildArticleSchema(post)    → Blog / artigos
 *   buildCategoryPageSchema()   → Páginas de categoria
 *   buildWebPageSchema()        → Páginas institucionais
 */

const BASE_URL = 'https://teknixbrasil.com.br'
const LOGO_URL = 'https://teknixbrasil.com.br/teknix-logo.png'

// ─── WebSite ───────────────────────────────────────────────────────────────

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TEKNIX Ferramentas',
    url: BASE_URL,
    description: 'Ferramentas profissionais com a qualidade que você precisa para realizar qualquer projeto com excelência. Feito para fazer.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/busca?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

// ─── Organization ──────────────────────────────────────────────────────────

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TEKNIX Ferramentas',
    url: BASE_URL,
    logo: LOGO_URL,
    sameAs: [
      'https://www.instagram.com/teknixbrasil',
      'https://www.facebook.com/teknixbrasil',
      'https://www.youtube.com/@teknixbrasil',
      'https://br.linkedin.com/company/teknixbrasil'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Portuguese'
    }
  }
}

// ─── Product ───────────────────────────────────────────────────────────────

export interface ProductSchemaInput {
  id: string
  name: string
  description?: string
  image?: string
  images?: string[]
  price?: number
  promo_price?: number
  sku?: string
  slug?: string
  brand?: string
  seller?: string
  seller_url?: string
  stock?: number
  category?: string
  product_type?: 'physical' | 'digital' | 'course' | 'ebook' | 'event' | 'subscription' | 'service'
  weight?: number
  ean?: string
  ratingValue?: number
  reviewCount?: number
  reviews?: Array<{
    author: string
    reviewRating: number
    reviewBody?: string
    datePublished?: string
  }>
}

export function buildProductSchema(product: ProductSchemaInput): Record<string, unknown> {
  const url = `${BASE_URL}/${product.slug || product.sku || product.id}`
  const allImages = product.images?.length ? product.images : product.image ? [product.image] : []
  const currentPrice = product.promo_price || product.price || 0
  const availability = Number(product.stock || 0) > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'

  // Schemas específicos conforme o tipo real do produto
  if (product.product_type === 'course') {
    return buildCourseSchema({
      name: product.name,
      description: product.description,
      provider: product.seller || product.brand || 'TEKNIX',
      offers: {
        price: currentPrice,
        url
      },
      image: allImages[0]
    })
  }

  if (product.product_type === 'event') {
    return buildEventSchema({
      name: product.name,
      description: product.description,
      offers: {
        price: currentPrice,
        url
      },
      image: allImages[0]
    })
  }

  if (product.product_type === 'ebook') {
    return buildDigitalDocumentSchema({
      name: product.name,
      description: product.description,
      offers: {
        price: currentPrice,
        url
      },
      image: allImages[0]
    })
  }

  const sellerName = product.seller || 'TEKNIX Ferramentas'
  const sellerUrl = product.seller_url || `${BASE_URL}/loja/${product.seller ? product.seller.toLowerCase().replace(/\s+/g, '-') : 'teknix'}`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — TEKNIX Ferramentas`,
    image: allImages,
    url,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'TEKNIX'
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: currentPrice.toFixed(2),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: sellerName,
        url: sellerUrl
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }

  if (product.ean) {
    schema.gtin13 = product.ean
  }

  // Se houver avaliações/rating ou padrão 5 estrelas TEKNIX
  const rating = product.ratingValue || 4.9
  const count = product.reviewCount || 12
  schema.aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: rating.toFixed(1),
    reviewCount: count,
    bestRating: '5',
    worstRating: '1'
  }

  if (product.reviews?.length) {
    schema.review = product.reviews.map(r => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.author
      },
      datePublished: r.datePublished || new Date().toISOString().split('T')[0],
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.reviewRating,
        bestRating: '5',
        worstRating: '1'
      },
      reviewBody: r.reviewBody || ''
    }))
  }

  return schema
}

// ─── BreadcrumbList ────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string
  url: string
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

// ─── Article (Blog) ────────────────────────────────────────────────────────

export interface ArticleSchemaInput {
  title: string
  description?: string
  image?: string
  slug: string
  author?: string
  publishedAt?: string
  updatedAt?: string
}

export function buildArticleSchema(article: ArticleSchemaInput) {
  const url = `${BASE_URL}/blog/${article.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description || '',
    image: article.image ? [article.image] : [],
    url,
    datePublished: article.publishedAt || new Date().toISOString(),
    dateModified: article.updatedAt || article.publishedAt || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: article.author || 'TEKNIX'
    },
    publisher: {
      '@type': 'Organization',
      name: 'TEKNIX Ferramentas',
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  }
}

// ─── CollectionPage (Categoria) ────────────────────────────────────────────

export function buildCategoryPageSchema(name: string, url: string, description?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`,
    description: description || `${name} — TEKNIX Ferramentas`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TEKNIX Ferramentas',
      url: BASE_URL
    }
  }
}

// ─── WebPage (Institucionais / DynamicPage) ────────────────────────────────

export function buildWebPageSchema(name: string, url: string, description?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url: `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`,
    description: description || '',
    isPartOf: {
      '@type': 'WebSite',
      name: 'TEKNIX Ferramentas',
      url: BASE_URL
    }
  }
}

// ─── Store / Seller (Loja / Vendedor Marketplace) ───────────────────────────

export interface StoreSchemaInput {
  name: string
  slug: string
  description?: string
  logo?: string
  url?: string
  telephone?: string
  email?: string
}

export function buildStoreSchema(store: StoreSchemaInput) {
  const storeUrl = store.url || `${BASE_URL}/loja/${store.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.description || `Loja oficial ${store.name} na TEKNIX`,
    url: storeUrl,
    image: store.logo ? [store.logo] : [LOGO_URL],
    parentOrganization: {
      '@type': 'Organization',
      name: 'TEKNIX Ferramentas',
      url: BASE_URL
    },
    currenciesAccepted: 'BRL',
    paymentAccepted: 'Cash, Credit Card, Pix, Boleto'
  }
}

// ─── Brand (Marca Oficial) ──────────────────────────────────────────────────

export interface BrandSchemaInput {
  name: string
  slug: string
  description?: string
  logo?: string
}

export function buildBrandSchema(brand: BrandSchemaInput) {
  const brandUrl = `${BASE_URL}/marca/${brand.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    description: brand.description || `Catálogo oficial de produtos da marca ${brand.name} na TEKNIX`,
    url: brandUrl,
    logo: brand.logo || undefined
  }
}

// ─── Course (Cursos / Aulas Digitais) ───────────────────────────────────────

export interface CourseSchemaInput {
  name: string
  description?: string
  provider?: string
  offers?: {
    price: number
    url: string
  }
  image?: string
}

export function buildCourseSchema(course: CourseSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description || '',
    image: course.image ? [course.image] : [],
    provider: {
      '@type': 'Organization',
      name: course.provider || 'TEKNIX',
      sameAs: BASE_URL
    },
    offers: course.offers ? {
      '@type': 'Offer',
      price: course.offers.price.toFixed(2),
      priceCurrency: 'BRL',
      url: course.offers.url,
      availability: 'https://schema.org/InStock'
    } : undefined
  }
}

// ─── Event (Eventos / Ingressos) ───────────────────────────────────────────

export interface EventSchemaInput {
  name: string
  description?: string
  startDate?: string
  endDate?: string
  offers?: {
    price: number
    url: string
  }
  image?: string
}

export function buildEventSchema(event: EventSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || '',
    image: event.image ? [event.image] : [],
    startDate: event.startDate || new Date().toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    offers: event.offers ? {
      '@type': 'Offer',
      price: event.offers.price.toFixed(2),
      priceCurrency: 'BRL',
      url: event.offers.url,
      availability: 'https://schema.org/InStock'
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'TEKNIX Ferramentas',
      url: BASE_URL
    }
  }
}

// ─── DigitalDocument / Book (E-books / Documentos) ──────────────────────────

export interface DigitalDocumentSchemaInput {
  name: string
  description?: string
  offers?: {
    price: number
    url: string
  }
  image?: string
}

export function buildDigitalDocumentSchema(doc: DigitalDocumentSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    bookFormat: 'https://schema.org/EBook',
    name: doc.name,
    description: doc.description || '',
    image: doc.image ? [doc.image] : [],
    offers: doc.offers ? {
      '@type': 'Offer',
      price: doc.offers.price.toFixed(2),
      priceCurrency: 'BRL',
      url: doc.offers.url,
      availability: 'https://schema.org/InStock'
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'TEKNIX Ferramentas',
      url: BASE_URL
    }
  }
}

// ─── FAQPage (Perguntas Frequentes / Snippet Google) ───────────────────────

export interface FAQItem {
  question: string
  answer: string
}

export function buildFAQSchema(faqs: FAQItem[]) {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

