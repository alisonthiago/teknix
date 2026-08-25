import './About.css'

export default function About() {
  return (
    <section className="about">
      <div className="about-inner">
        <div className="about-content">
          <span className="section-eyebrow">SOBRE A TEKNIX</span>
          <h2 className="about-title">
            Feito para fazer.<br />
            <span className="about-accent">Sem atalhos.</span>
          </h2>
          <p className="about-text">
            Somos uma marca focada em oferecer ferramentas de alta qualidade
            para profissionais e entusiastas que valorizam performance e
            durabilidade em cada projeto.
          </p>
          <p className="about-text">
            Cada ferramenta é desenvolvida para atender quem não aceita
            menos que o resultado perfeito.
          </p>
        </div>

        <div className="about-stats">
          <div className="about-stat">
            <span className="about-stat-number">+500</span>
            <span className="about-stat-label">Produtos</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-number">+1000</span>
            <span className="about-stat-label">Clientes</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-number">+50</span>
            <span className="about-stat-label">Categorias</span>
          </div>
        </div>

        <div className="about-values">
          <div className="about-value">
            <span className="about-value-icon">⚡</span>
            <div>
              <h4>Performance</h4>
              <p>Equipamentos que entregam resultado.</p>
            </div>
          </div>
          <div className="about-value">
            <span className="about-value-icon">🛡️</span>
            <div>
              <h4>Garantia</h4>
              <p>Produtos com garantia real.</p>
            </div>
          </div>
          <div className="about-value">
            <span className="about-value-icon">🚚</span>
            <div>
              <h4>Entrega</h4>
              <p>Logística eficiente para todo Brasil.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
