import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedProducts } from '../services/products'
import ProductImage from './ProductImage'
import type { Product } from '../types/database'
import './FeaturedProducts.css'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeaturedProducts(4).then(data => {
      setProducts(data)
      setLoading(false)
    })
  }, [])

  if (loading || products.length === 0) return null

  return (
    <section className="featured">
      <div className="featured-inner">
        <div className="featured-header">
          <div>
            <span className="section-eyebrow">DESTAQUES</span>
            <h2 className="section-headline">Produtos em destaque</h2>
          </div>
          <Link to="/produtos" className="btn btn-outline">
            Ver todos
          </Link>
        </div>

        <div className="featured-grid">
          {products.map((product, i) => (
            <Link
              key={product.id}
              to={`/produtos/${product.slug || product.id}`}
              className={`featured-item ${i === 0 ? 'featured-item-hero' : ''}`}
            >
              <div className="featured-item-image">
                {product.image_url ? (
                  <ProductImage src={product.image_url} alt={product.name} />
                ) : (
                  <div className="featured-item-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="32" height="32">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                {product.promo_price && product.promo_price < product.price && (
                  <span className="featured-badge">
                    -{Math.round(((product.price - product.promo_price) / product.price) * 100)}%
                  </span>
                )}
              </div>
              <div className="featured-item-info">
                {product.category_id && (
                  <span className="featured-item-cat">{product.category_id}</span>
                )}
                <h3>{product.name}</h3>
                <div className="featured-item-prices">
                  {product.promo_price && product.promo_price < product.price && (
                    <span className="price-old">{formatPrice(product.price)}</span>
                  )}
                  <span className="price-current">
                    {formatPrice(product.promo_price && product.promo_price < product.price ? product.promo_price : product.price)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
