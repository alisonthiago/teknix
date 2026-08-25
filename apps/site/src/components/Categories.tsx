import { useState, useEffect } from 'react'
import { getCategories } from '../services/products'
import { useInView } from '../hooks/useInView'
import type { Category } from '../types/database'
import './Categories.css'

const segmentThemes: Record<string, { icon: string; color: string }> = {
  'ferramentas-eletricas': { icon: '⚡', color: '#1d1d1f' },
  'ferramentas-manuais': { icon: '🔧', color: '#1d1d1f' },
  'furadeiras': { icon: '🔩', color: '#1d1d1f' },
  'parafusadeiras': { icon: '🛠️', color: '#1d1d1f' },
  'serras': { icon: '⚙️', color: '#1d1d1f' },
  'kits': { icon: '📦', color: '#1d1d1f' },
  'acessorios': { icon: '🎯', color: '#1d1d1f' },
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { ref, isInView } = useInView()

  useEffect(() => {
    getCategories().then(data => {
      setCategories(data)
      setLoading(false)
    })
  }, [])

  if (loading || categories.length === 0) return null

  return (
    <section className="segments" ref={ref}>
      <div className="segments-header">
        <span className="section-eyebrow">SEGMENTOS</span>
        <h2 className="section-headline">Explore por categoria</h2>
      </div>

      <div className={`segments-grid ${isInView ? 'visible' : ''}`}>
        {categories.map((cat, i) => {
          const theme = segmentThemes[cat.slug || ''] || { icon: '📦', color: '#1d1d1f' }
          return (
            <a
              key={cat.id}
              href={`/produtos?categoria=${cat.slug || cat.id}`}
              className="segment-card"
              style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}
            >
              <div className="segment-visual">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} />
                ) : (
                  <span className="segment-icon">{theme.icon}</span>
                )}
              </div>
              <div className="segment-info">
                <h3>{cat.name}</h3>
                {cat.description && <p>{cat.description}</p>}
                <span className="segment-link">
                  Explorar
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
