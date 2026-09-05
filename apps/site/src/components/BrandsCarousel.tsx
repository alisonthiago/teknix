import { Link } from 'react-router-dom'
import { MakitaLogo, BoschLogo, PdrLogo, BovenauLogo, DewaltLogo, KarcherLogo } from './BrandLogos'

const BRANDS = [
  { name: 'Makita', logoComponent: <MakitaLogo height={30} /> },
  { name: 'Bosch', logoComponent: <BoschLogo height={26} /> },
  { name: 'PDR', logoComponent: <PdrLogo height={28} /> },
  { name: 'Bovenau', logoComponent: <BovenauLogo height={24} /> },
  { name: 'DeWalt', logoComponent: <DewaltLogo height={26} /> },
  { name: 'Kärcher', logoComponent: <KarcherLogo height={24} /> },
]

export default function BrandsCarousel() {
  return (
    <div className="ui container fluid brands">
      <div className="ui container">
        <div className="brands-container">
          <div className="brands-section-header">
            <h2 className="title-brands">Explore através das marcas</h2>
            <div className="brands-slider-controls">
              <button className="brand-ctrl-btn" aria-label="Anterior">‹</button>
              <div className="brand-ctrl-dots">
                <span className="brand-dot active"></span>
                <span className="brand-dot"></span>
              </div>
              <button className="brand-ctrl-btn" aria-label="Próximo">›</button>
            </div>
          </div>

          <div className="brands-grid">
            {BRANDS.map((b, idx) => (
              <Link
                to={`/produtos?search=${encodeURIComponent(b.name)}`}
                key={idx}
                className="brand-logo-card"
                title={`Filtrar produtos por ${b.name}`}
              >
                {b.logoComponent}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
