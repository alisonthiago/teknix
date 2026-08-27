import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageRenderer from '../components/PageRenderer'
import { getProducts } from '../services/products'
import type { Product } from '../types/database'
import './CategoryPage.css'

interface PageData {
  id: string
  title: string
  slug: string
  status: string
  type: string
}

export default function CategoryPage() {
  const { segmento, categoria } = useParams<{ segmento: string; categoria: string }>()
  const [page, setPage] = useState<PageData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!segmento || !categoria) return
    setLoading(true)
    setNotFound(false)

    async function load() {
      const categoryPath = `/${segmento}/${categoria}`

      const { data: pageData } = await supabase
        .from('pages')
        .select('id, title, slug, status, type')
        .eq('slug', categoryPath)
        .eq('status', 'published')
        .maybeSingle()

      if (!pageData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setPage(pageData)

      const categoryProducts = await getProducts({
        segment: categoria,
        limit: 40,
        sort: sortBy
      })
      setProducts(categoryProducts)
      setLoading(false)
    }

    load()
  }, [segmento, categoria, sortBy])

  if (loading) {
    return (
      <div className="category-loading">
        <div className="spinner" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="category-not-found">
        <h1>404</h1>
        <p>Categoria não encontrada</p>
        <Link to="/" className="btn-back">Voltar ao início</Link>
      </div>
    )
  }

  return (
    <div className="category-page">
      {page && (
        <div className="category-hero">
          <div className="category-hero-inner">
            <nav className="category-breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <Link to={`/${segmento}`}>{segmento}</Link>
              <span>/</span>
              <span className="current">{categoria}</span>
            </nav>
            <h1 className="category-title">{page.title}</h1>
          </div>
        </div>
      )}

      {page && (
        <PageRenderer pageId={page.id} />
      )}

      <section className="category-products-section">
        <div className="category-products-inner">
          <div className="category-products-header">
            <h2 className="category-section-title">
              {products.length > 0 ? `${products.length} produtos encontrados` : 'Produtos'}
            </h2>
            <select
              className="category-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="newest">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
            </select>
          </div>

          {products.length > 0 ? (
            <div className="category-products-grid">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/produtos/${product.sku || product.id}`}
                  className="category-product-card"
                >
                  <div className="category-product-image">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="category-product-placeholder">📦</div>
                    )}
                    {product.stock != null && product.stock <= 5 && product.stock > 0 && (
                      <span className="category-product-badge low">Últimas unidades</span>
                    )}
                  </div>
                  <div className="category-product-info">
                    {product.brand && <span className="category-product-brand">{product.brand}</span>}
                    <h3 className="category-product-name">{product.name}</h3>
                    {product.model && <span className="category-product-model">{product.model}</span>}
                    {product.cost_purchase != null && product.cost_purchase > 0 && (
                      <span className="category-product-price">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.cost_purchase)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="category-empty">
              <p>Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
