import { useInView } from '../hooks/useInView'
import './Experience.css'

export default function Experience() {
  const { ref, isInView } = useInView()

  return (
    <section className="experience" ref={ref}>
      <div className="experience-inner">
        <div className={`experience-content ${isInView ? 'visible' : ''}`}>
          <span className="section-eyebrow">A DIFERENÇA TEKNIX</span>
          <h2 className="experience-title">
            Você faz.<br />
            A ferramenta ajuda.
          </h2>
          <p className="experience-description">
            Cada ferramenta Teknix é projetada para entregar performance
            e precisão quando você mais precisa. Da construção civil ao DIY,
            nossos equipamentos são feitos para quem não aceita menos.
          </p>
        </div>

        <div className={`experience-features ${isInView ? 'visible' : ''}`}>
          <div className="exp-feature">
            <div className="exp-feature-number">01</div>
            <h3>Potência</h3>
            <p>Motor de alta performance para os trabalhos mais pesados.</p>
          </div>
          <div className="exp-feature">
            <div className="exp-feature-number">02</div>
            <h3>Precisão</h3>
            <p>Controle total para resultados profissionais.</p>
          </div>
          <div className="exp-feature">
            <div className="exp-feature-number">03</div>
            <h3>Praticidade</h3>
            <p>Design ergonômico para uso prolongado.</p>
          </div>
          <div className="exp-feature">
            <div className="exp-feature-number">04</div>
            <h3>Desempenho</h3>
            <p>Resultados que superam expectativas.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
