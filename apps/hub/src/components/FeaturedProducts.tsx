import ProductCard from './ProductCard'
import type { Product } from '../types/database'
import './FeaturedProducts.css'

interface FeaturedProductsProps {
  products?: Product[]
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Furadeira de Impacto Teknix 750W',
    slug: 'furadeira-impacto-tekniix-750w',
    sku: 'TK-FUR-750',
    price: 189.90,
    promo_price: 149.90,
    stock: 15,
    image_url: '',
    category_id: 'Ferramentas Elétricas',
    featured: true,
    active: true,
  },
  {
    id: '2',
    name: 'Parafusadeira Sem Fio Teknix 12V',
    slug: 'parafusadeira-sem-fio-tekniix-12v',
    sku: 'TK-PAR-12V',
    price: 249.90,
    stock: 8,
    image_url: '',
    category_id: 'Ferramentas Elétricas',
    featured: true,
    active: true,
  },
  {
    id: '3',
    name: 'Kit Ferramentas Teknix 50 peças',
    slug: 'kit-ferramentas-tekniix-50pecas',
    sku: 'TK-KIT-50',
    price: 349.90,
    promo_price: 299.90,
    stock: 3,
    image_url: '',
    category_id: 'Kits',
    featured: true,
    active: true,
  },
  {
    id: '4',
    name: 'Serra Circular Teknix 1400W',
    slug: 'serra-circular-tekniix-1400w',
    sku: 'TK-SER-1400',
    price: 459.90,
    stock: 12,
    image_url: '',
    category_id: 'Ferramentas Elétricas',
    featured: true,
    active: true,
  },
]

export default function FeaturedProducts({ products = mockProducts }: FeaturedProductsProps) {
  const featured = products.filter(p => p.featured !== false).slice(0, 4)

  return (
    <section className="featured-products">
      <div className="section-container">
        <span className="section-badge">DESTAQUES</span>
        <h2 className="section-title">Produtos em destaque</h2>
        <p className="section-subtitle">
          As melhores ferramentas selecionadas para você
        </p>
        <div className="products-grid">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="section-cta">
          <a href="/produtos" className="btn btn-outline">
            Ver todos os produtos
          </a>
        </div>
      </div>
    </section>
  )
}
