import { Link } from 'react-router-dom'
import { config } from '../config'
import ProductImage from './ProductImage'
import type { Product } from '../types/database'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.promo_price && product.promo_price < product.price

  function openWhatsApp(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const message = config.whatsapp.getMessage({
      name: product.name,
      sku: product.sku,
      slug: product.slug
    })
    window.open(`${config.whatsapp.link}?text=${message}`, '_blank')
  }

  return (
    <Link to={`/produtos/${product.slug || product.id}`} className="product-card">
      <div className="product-card-image">
        {product.image_url ? (
          <ProductImage src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="28" height="28">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
        {hasDiscount && (
          <span className="product-card-discount">
            -{Math.round(((product.price - product.promo_price!) / product.price) * 100)}%
          </span>
        )}
      </div>

      <div className="product-card-body">
        {product.category_id && (
          <span className="product-card-cat">{product.category_id}</span>
        )}
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-prices">
          {hasDiscount && (
            <span className="price-old">{formatPrice(product.price)}</span>
          )}
          <span className="price-current">
            {formatPrice(hasDiscount ? product.promo_price! : product.price)}
          </span>
        </div>
        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
          <span className="product-card-stock">Últimas unidades</span>
        )}
      </div>

      <button className="product-card-cta" onClick={openWhatsApp}>
        Tenho Interesse
      </button>
    </Link>
  )
}
