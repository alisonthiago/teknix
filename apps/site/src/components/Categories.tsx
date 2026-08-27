import { useInView } from '../hooks/useInView'
import './Categories.css'

const SEGMENTS = [
  { slug: 'ferramentas', name: 'Ferramentas', description: 'Elétricas, manuais e acessórios profissionais', icon: '🔧' },
  { slug: 'informatica', name: 'Informática', description: 'Periféricos, componentes e soluções técnicas', icon: '💻' },
  { slug: 'casa', name: 'Casa', description: 'Tudo para organização e manutenção do lar', icon: '🏠' },
  { slug: 'automotivo', name: 'Automotivo', description: 'Ferramentas e acessórios para seu veículo', icon: '🚗' },
]

export default function Categories() {
  const { ref, isInView } = useInView()

  return (
    <section className="segments" ref={ref}>
      <div className="segments-header">
        <span className="section-eyebrow">SEGMENTOS</span>
        <h2 className="section-headline">Explore por segmento</h2>
      </div>

      <div className={`segments-grid ${isInView ? 'visible' : ''}`}>
        {SEGMENTS.map((seg, i) => (
          <a
            key={seg.slug}
            href={`/${seg.slug}`}
            className="segment-card"
            style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}
          >
            <div className="segment-visual">
              <span className="segment-icon">{seg.icon}</span>
            </div>
            <div className="segment-info">
              <h3>{seg.name}</h3>
              {seg.description && <p>{seg.description}</p>}
              <span className="segment-link">
                Explorar
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
