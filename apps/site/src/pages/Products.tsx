import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getProducts, getCategories } from '../services/products'
import type { Product, Category } from '../types/database'
import './Products.css'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const categoryFilter = searchParams.get('categoria') || ''
  const sortFilter = searchParams.get('ordenar') || 'newest'
  const featuredFilter = searchParams.get('destaque') === 'true'

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [categoryFilter, sortFilter, featuredFilter])

  async function fetchCategories() {
    const data = await getCategories()
    setCategories(data)
  }

  async function fetchProducts() {
    setLoading(true)
    const data = await getProducts({
      category: categoryFilter || undefined,
      sort: sortFilter as 'relevance' | 'price_asc' | 'price_desc' | 'newest',
      featured: featuredFilter || undefined,
      search: search || undefined,
    })
    setProducts(data)
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchProducts()
  }

  return (
    <div className="products-page">
      <div className="products-hero">
        <h1>Produtos</h1>
        <p>Encontre a ferramenta ideal para o seu projeto</p>
      </div>

      <div className="products-layout">
        <aside className="products-sidebar">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Buscar produto ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
          </form>

          <div className="filter-group">
            <h3>Categorias</h3>
            <button
              className={`filter-btn ${!categoryFilter ? 'active' : ''}`}
              onClick={() => setSearchParams({})}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-btn ${categoryFilter === cat.slug ? 'active' : ''}`}
                onClick={() => setSearchParams({ categoria: cat.slug || cat.id })}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h3>Ordenar por</h3>
            <button
              className={`filter-btn ${sortFilter === 'newest' ? 'active' : ''}`}
              onClick={() => setSearchParams({ ordenar: 'newest' })}
            >
              Novidades
            </button>
            <button
              className={`filter-btn ${sortFilter === 'price_asc' ? 'active' : ''}`}
              onClick={() => setSearchParams({ ordenar: 'price_asc' })}
            >
              Menor preço
            </button>
            <button
              className={`filter-btn ${sortFilter === 'price_desc' ? 'active' : ''}`}
              onClick={() => setSearchParams({ ordenar: 'price_desc' })}
            >
              Maior preço
            </button>
          </div>

          <div className="filter-group">
            <h3>Exibir</h3>
            <button
              className={`filter-btn ${featuredFilter ? 'active' : ''}`}
              onClick={() => setSearchParams({ destaque: 'true' })}
            >
              Destaques
            </button>
          </div>
        </aside>

        <div className="products-main">
          {loading ? (
            <div className="products-loading">
              <div className="spinner"></div>
              <p>Carregando produtos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="64" height="64">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <path d="M8 11h6"/>
              </svg>
              <p>Nenhum produto encontrado</p>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSearch('')
                  setSearchParams({})
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="products-count">
                {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
              </div>
              <div className="products-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
