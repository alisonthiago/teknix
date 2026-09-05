import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { config } from '../config'
import ProductImage from './ProductImage'
import { useCompare } from '../context/CompareContext'
import type { Product } from '../types/database'
import { productPricing } from '../../../../packages/core/src/productCommerce'
import { commerceSignals } from '../services/storefrontCommerce'
import ProductSignals from './ProductSignals'
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
  const [hovered, setHovered] = useState(false)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!product.commerce?.offerEnabled) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [product.commerce?.offerEnabled])
  const pricing = productPricing(product.price, product.promo_price, product.commerce, now)
  const hasDiscount = pricing.discount > 0
  const alternate = product.images?.find(src => src !== product.image_url)
  const { addToCompare, removeFromCompare, isInCompare } = useCompare()

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

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isInCompare(product.id)) {
      removeFromCompare(product.id)
    } else {
      addToCompare({
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        slug: product.slug || '',
        image_url: product.image_url || '',
        price: product.price || 0,
        promo_price: product.promo_price,
        brand: product.brand,
        category: product.category_id
      })
    }
  }

  return (
    <Link to={`/produtos/${product.slug || product.id}`} className="product-card">
      <div className="product-card-image" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {product.image_url ? (
          <ProductImage src={hovered && alternate ? alternate : product.image_url} alt={product.name} />
        ) : (
          <div className="product-card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="28" height="28">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
        <ProductSignals overlay data={commerceSignals(product, now)} />
        <button
          className={`product-card-compare ${isInCompare(product.id) ? 'active' : ''}`}
          onClick={handleCompare}
          aria-label={isInCompare(product.id) ? 'Remover da comparação' : 'Adicionar à comparação'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>

      <div className="product-card-body">
        {product.category_id && (
          <span className="product-card-cat">{product.category_id}</span>
        )}
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-prices">
          {hasDiscount && product.price != null && (
            <span className="price-old">{formatPrice(pricing.base)}</span>
          )}
          <span className="price-current">
            {formatPrice(pricing.pix)}
          </span>
        </div>
        <small>No Pix{hasDiscount ? ` · ${pricing.discount}% OFF` : ''}</small>
        {pricing.commerce.installments > 1 && <small>{pricing.commerce.installments}x de {formatPrice(pricing.installment)} sem juros</small>}
        {pricing.commerce.freeShipping && <span className="product-free-shipping">Frete grátis</span>}
      </div>

      <button className="product-card-cta" onClick={openWhatsApp}>
        Tenho Interesse
      </button>
    </Link>
  )
}
