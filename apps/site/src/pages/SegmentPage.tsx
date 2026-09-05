import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageRenderer from '../components/PageRenderer'
import { getProducts } from '../services/products'
import type { Product } from '../types/database'
import './SegmentPage.css'

interface PageData {
  id: string
  title: string
  slug: string
  status: string
  type: string
}

export default function SegmentPage() {
  const { segmento } = useParams<{ segmento: string }>()
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState<PageData | null>(null)
  const [segmentName, setSegmentName] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const searchTerm = searchParams.get('q') || searchParams.get('search') || searchParams.get('marca') || searchParams.get('brand') || ''

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!segmento) return
    setLoading(true)

    async function load() {
      const cleanSlug = (segmento || '').replace(/^\//, '')
      const possibleSlugs = [`/${cleanSlug}`, cleanSlug]

      // 1. Nome do segmento (store_segments) — usado no hero
      const { data: segData } = await supabase
        .from('store_segments')
        .select('name, slug')
        .eq('slug', cleanSlug)
        .eq('status', 'active')
        .maybeSingle()
      if (segData) setSegmentName(segData.name)

      // 2. Página própria do segmento (se o usuário criou no HUB)
      const { data: pageData } = await supabase
        .from('pages')
        .select('id, title, slug, status, type')
        .in('slug', possibleSlugs)
        .eq('status', 'published')
        .limit(1)
        .maybeSingle()

      // 3. Se não houver página própria, o segmento renderiza apenas o
      //    hero + grade de produtos (sem dependência do Page Builder).
      setPage(pageData || null)

      // 4. Produtos do segmento
      const segmentProducts = await getProducts({
        segment: cleanSlug,
        brand: searchTerm || undefined,
        search: searchTerm || undefined,
        limit: 20
      })
      setProducts(segmentProducts)
      setLoading(false)
    }

    load()
  }, [segmento, searchTerm])

  if (loading) {
    return (
      <div className="segment-loading">
        <div className="spinner" />
      </div>
    )
  }

  const heroTitle = segmentName || page?.title || ''

  return (
    <div className="segment-page">
      {heroTitle && (
        <div className="segment-hero">
          <div className="segment-hero-inner">
            <h1 className="segment-title">{heroTitle}</h1>
          </div>
        </div>
      )}

      {page && <PageRenderer pageId={page.id} />}

      {products.length > 0 && (
        <section className="segment-products">
          <div className="segment-products-inner">
            <h2 className="segment-section-title">Produtos</h2>
            <div className="segment-products-grid">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/produtos/${product.sku || product.id}`}
                  className="segment-product-card"
                >
                  <div className="segment-product-image">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="segment-product-placeholder">📦</div>
                    )}
                  </div>
                  <div className="segment-product-info">
                    <h3 className="segment-product-name">{product.name}</h3>
                    {product.brand && <span className="segment-product-brand">{product.brand}</span>}
                    {product.cost_purchase != null && product.cost_purchase > 0 && (
                      <span className="segment-product-price">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.cost_purchase)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
