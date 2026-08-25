import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { config } from '../config'
import { getFeaturedProducts } from '../services/products'
import type { Product } from '../types/database'
import './Hero.css'

export default function Hero() {
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null)

  useEffect(() => {
    async function loadProduct() {
      const products = await getFeaturedProducts(1)
      if (products.length > 0) {
        setFeaturedProduct(products[0])
      }
    }
    loadProduct()
  }, [])

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-grid"></div>
        <div className="hero-gradient"></div>
      </div>

      <div className="hero-content">
        <div className="hero-text">
          <span className="hero-badge">FEITO PARA FAZER</span>
          <h1 className="hero-title">
            Ferramentas para transformar
            <span className="hero-highlight"> ideias em realidade</span>
          </h1>
          <p className="hero-subtitle">
            Equipamentos profissionais com a qualidade que você precisa
            para realizar qualquer projeto com excelência.
          </p>
          <div className="hero-buttons">
            <Link to="/produtos" className="btn btn-primary btn-lg">
              Explorar Ferramentas
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <a
              href={config.whatsapp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              Falar com a Teknix
            </a>
          </div>
        </div>

        {featuredProduct && (
          <div className="hero-product">
            <div className="hero-product-card">
              {featuredProduct.image_url ? (
                <img
                  src={featuredProduct.image_url}
                  alt={featuredProduct.name}
                  className="hero-product-image"
                />
              ) : (
                <div className="hero-product-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="64" height="64">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              )}
              <div className="hero-product-info">
                <span className="hero-product-badge">PRODUTO EM DESTAQUE</span>
                <h3>{featuredProduct.name}</h3>
                <div className="hero-product-price">
                  {featuredProduct.promo_price && featuredProduct.promo_price < featuredProduct.price && (
                    <span className="price-old">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(featuredProduct.price)}
                    </span>
                  )}
                  <span className="price-current">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      featuredProduct.promo_price && featuredProduct.promo_price < featuredProduct.price
                        ? featuredProduct.promo_price
                        : featuredProduct.price
                    )}
                  </span>
                </div>
                <Link to={`/produtos/${featuredProduct.slug || featuredProduct.id}`} className="btn btn-outline btn-sm">
                  Ver Produto
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hero-stats">
        <div className="stat">
          <span className="stat-number">500+</span>
          <span className="stat-label">Produtos</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <span className="stat-number">1000+</span>
          <span className="stat-label">Clientes</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <span className="stat-number">50+</span>
          <span className="stat-label">Categorias</span>
        </div>
      </div>
    </section>
  )
}
