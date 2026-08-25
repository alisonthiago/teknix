import { useInView } from '../hooks/useInView'
import './Experience.css'

export default function Experience() {
  const { ref, isInView } = useInView()

  return (
    <section className="experience" ref={ref}>
      <div className={`experience-container ${isInView ? 'visible' : ''}`}>
        <div className="experience-content">
          <span className="section-badge">EXPERIÊNCIA</span>
          <h2 className="experience-title">
            Você faz. <span className="text-green">A ferramenta ajuda.</span>
          </h2>
          <p className="experience-text">
            Cada ferramenta Teknix é projetada para entregar performance
            e precisão quando você mais precisa. Da construção civil ao
            DIY, nossos equipamentos são feitos para quem não aceita menos.
          </p>
          <div className="experience-features">
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div className="feature-text">
                <h4>Potência</h4>
                <p>Motor de alta performance para os trabalhos mais pesados</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div className="feature-text">
                <h4>Precisão</h4>
                <p>Controle total para resultados profissionais</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="feature-text">
                <h4>Praticidade</h4>
                <p>Design ergonômico para uso prolongado</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="feature-text">
                <h4>Desempenho</h4>
                <p>Resultados que superam expectativas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="experience-visual">
          <div className="experience-image-wrapper">
            <div className="experience-image">
              <div className="experience-image-overlay"></div>
            </div>
            <div className="experience-badge">
              <span className="badge-text">FEITO PARA</span>
              <span className="badge-highlight">FAZER</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
