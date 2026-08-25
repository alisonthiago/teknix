import { useState, useEffect } from 'react'
import { getFeaturedProducts } from '../services/products'
import ProductCard from './ProductCard'
import type { Product } from '../types/database'
import './BestSellers.css'

export default function BestSellers() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getFeaturedProducts(8)
      setProducts(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section className="best-sellers">
      <div className="section-container">
        <div className="section-header">
          <div>
            <span className="section-badge">MAIS PROCURADOS</span>
            <h2 className="section-title">Os favoritos dos nossos clientes</h2>
          </div>
          <a href="/produtos" className="btn btn-outline">
            Ver todos
          </a>
        </div>

        {loading ? (
          <div className="products-loading">
            <div className="spinner"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="products-empty">
            <p>Produtos em breve.</p>
          </div>
        ) : (
          <div className="best-sellers-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
