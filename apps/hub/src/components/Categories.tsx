import { useState, useEffect } from 'react'
import { getCategories } from '../services/products'
import { useInView } from '../hooks/useInView'
import type { Category } from '../types/database'
import { Zap, Wrench, Hammer, Disc, Layers, Folder } from 'lucide-react'
import './Categories.css'

const categoryIcons: Record<string, React.ReactNode> = {
  'ferramentas-eletricas': <Zap size={22} />,
  'ferramentas-manuais': <Wrench size={22} />,
  'furadeiras': <Hammer size={22} />,
  'parafusadeiras': <Wrench size={22} />,
  'serras': <Disc size={22} />,
  'kits': <Layers size={22} />,
  'acessorios': <Folder size={22} />,
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { ref, isInView } = useInView()

  useEffect(() => {
    async function load() {
      const data = await getCategories()
      setCategories(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading || categories.length === 0) {
    return null
  }

  return (
    <section className="categories" ref={ref}>
      <div className="section-container">
        <div className={`categories-header ${isInView ? 'visible' : ''}`}>
          <span className="section-badge">CATEGORIAS</span>
          <h2 className="section-title">Encontre a ferramenta certa</h2>
          <p className="section-subtitle">
            Explore nossa linha completa por tipo de produto
          </p>
        </div>

        <div className={`categories-grid ${isInView ? 'visible' : ''}`}>
          {categories.map((category, index) => (
            <a
              key={category.id}
              href={`/produtos?categoria=${category.slug || category.id}`}
              className="category-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="category-icon">
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} />
                ) : (
                  <span>{categoryIcons[category.slug || ''] || <Folder size={22} />}</span>
                )}
              </div>
              <h3 className="category-name">{category.name}</h3>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
              <span className="category-link">
                Explorar
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
