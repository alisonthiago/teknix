import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedProducts } from '../services/products'
import ProductCard from './ProductCard'
import type { Product } from '../types/database'
import './BestSellers.css'

export default function BestSellers() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeaturedProducts(8).then(data => {
      setProducts(data)
      setLoading(false)
    })
  }, [])

  if (loading || products.length === 0) return null

  return (
    <section className="bestsellers">
      <div className="bestsellers-inner">
        <div className="bestsellers-header">
          <div>
            <span className="section-eyebrow">MAIS PROCURADOS</span>
            <h2 className="section-headline">Os favoritos dos nossos clientes</h2>
          </div>
          <Link to="/produtos" className="btn btn-outline">
            Ver todos
          </Link>
        </div>

        <div className="bestsellers-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
