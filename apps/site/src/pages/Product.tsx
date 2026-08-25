import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductBySlug } from '../services/products'
import { config } from '../config'
import ProductImage from '../components/ProductImage'
import type { Product } from '../types/database'
import './Product.css'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

export default function Product() {
  const { slug } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!slug) return
    setLoading(true)
    getProductBySlug(slug).then(data => {
      setProduct(data)
      setLoading(false)
    })
  }, [slug])

  function openWhatsApp() {
    if (!product) return
    const message = config.whatsapp.getMessage({
      name: product.name,
      sku: product.sku,
      slug: product.slug
    })
    window.open(`${config.whatsapp.link}?text=${message}`, '_blank')
  }

  if (loading) {
    return (
      <div className="product-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Produto não encontrado</h2>
        <p>O produto que você procura não existe ou foi removido.</p>
        <Link to="/produtos" className="btn btn-primary">Ver produtos</Link>
      </div>
    )
  }

  const hasDiscount = product.promo_price && product.promo_price < product.price
  const images = product.images || (product.image_url ? [product.image_url] : [])

  return (
    <div className="product-page">
      <div className="product-breadcrumb">
        <Link to="/">Home</Link>
        <span className="bc-sep">/</span>
        <Link to="/produtos">Produtos</Link>
        <span className="bc-sep">/</span>
        <span className="bc-current">{product.name}</span>
      </div>

      <div className="product-detail">
        <div className="product-gallery">
          <div className="gallery-main">
            {images.length > 0 ? (
              <ProductImage src={images[selectedImage]} alt={product.name} />
            ) : (
              <div className="gallery-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="64" height="64">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
            {hasDiscount && (
              <span className="gallery-discount">
                -{Math.round(((product.price - product.promo_price!) / product.price) * 100)}%
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`gallery-thumb ${i === selectedImage ? 'active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <ProductImage src={img} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          {product.category_id && (
            <span className="product-category">{product.category_id}</span>
          )}
          <h1 className="product-name">{product.name}</h1>

          {product.sku && (
            <span className="product-sku">SKU: {product.sku}</span>
          )}

          <div className="product-price-block">
            {hasDiscount && (
              <span className="price-old">{formatPrice(product.price)}</span>
            )}
            <span className="price-current">
              {formatPrice(hasDiscount ? product.promo_price! : product.price)}
            </span>
            {hasDiscount && (
              <span className="price-save">
                Economize {formatPrice(product.price - product.promo_price!)}
              </span>
            )}
          </div>

          {product.stock !== undefined && (
            <div className={`product-stock ${product.stock <= 0 ? 'out' : product.stock <= 5 ? 'low' : 'ok'}`}>
              <span className="stock-dot"></span>
              {product.stock <= 0 ? 'Indisponível' : product.stock <= 5 ? 'Últimas unidades' : 'Em estoque'}
            </div>
          )}

          <button className="btn btn-whatsapp btn-full" onClick={openWhatsApp}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Tenho Interesse
          </button>

          {product.description && (
            <div className="product-section">
              <h3>Descrição</h3>
              <p>{product.description}</p>
            </div>
          )}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="product-section">
              <h3>Especificações</h3>
              <div className="specs-list">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div className="spec-row" key={key}>
                    <span className="spec-key">{key}</span>
                    <span className="spec-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
