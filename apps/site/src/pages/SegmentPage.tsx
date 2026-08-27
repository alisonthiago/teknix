import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  const [page, setPage] = useState<PageData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!segmento) return
    setLoading(true)
    setNotFound(false)

    async function load() {
      const cleanSlug = (segmento || '').replace(/^\//, '')
      const possibleSlugs = [`/${cleanSlug}`, cleanSlug]

      const { data: pageData } = await supabase
        .from('pages')
        .select('id, title, slug, status, type')
        .in('slug', possibleSlugs)
        .eq('status', 'published')
        .limit(1)
        .maybeSingle()

      if (!pageData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setPage(pageData)

      const segmentProducts = await getProducts({ segment: segmento, limit: 20 })
      setProducts(segmentProducts)
      setLoading(false)
    }

    load()
  }, [segmento])

  if (loading) {
    return (
      <div className="segment-loading">
        <div className="spinner" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="segment-not-found">
        <h1>404</h1>
        <p>Segmento não encontrado</p>
        <Link to="/" className="btn-back">Voltar ao início</Link>
      </div>
    )
  }

  return (
    <div className="segment-page">
      {page && page.type === 'segment' && (
        <div className="segment-hero">
          <div className="segment-hero-inner">
            <h1 className="segment-title">{page.title}</h1>
          </div>
        </div>
      )}

      {page && (
        <PageRenderer pageId={page.id} />
      )}

      {page?.type === 'segment' && products.length > 0 && (
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
