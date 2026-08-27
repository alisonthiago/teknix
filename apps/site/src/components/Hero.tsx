import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedProducts } from '../services/products'
import type { Product } from '../types/database'
import './Hero.css'

export default function Hero() {
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    getFeaturedProducts(1).then(p => {
      if (p.length > 0) setProduct(p[0])
    })
  }, [])

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-text">
          <span className="hero-eyebrow">NOVA COLEÇÃO 2026</span>
          <h1 className="hero-title">
            Ferramentas<br />
            Feitas para fazer.
          </h1>
          <p className="hero-description">
            Equipamentos profissionais com a qualidade que você precisa
            para transformar qualquer ideia em realidade.
          </p>
          <div className="hero-actions">
            <Link to="/produtos" className="btn btn-primary">
              Explorar Produtos
            </Link>
            <Link to="/produtos?featured=true" className="btn btn-secondary">
              Ver Destaques
            </Link>
          </div>
        </div>

        {product && (
          <Link to={`/produtos/${product.slug || product.id}`} className="hero-featured">
            <div className="hero-featured-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <div className="hero-featured-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="48" height="48">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="hero-featured-info">
              <span className="hero-featured-badge">DESTAQUE</span>
              <h3>{product.name}</h3>
              <p className="hero-featured-price">
                {product.price != null && product.promo_price && product.promo_price < product.price && (
                  <span className="hero-price-old">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </span>
                )}
                <span className="hero-price-current">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    (product.price != null && product.promo_price && product.promo_price < product.price
                      ? product.promo_price
                      : product.price) || 0
                  )}
                </span>
              </p>
              <span className="hero-featured-cta">
                Ver detalhes
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </Link>
        )}
      </div>
    </section>
  )
}
