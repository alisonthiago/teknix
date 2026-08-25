import './About.css'

export default function About() {
  return (
    <section className="about">
      <div className="section-container">
        <div className="about-grid">
          <div className="about-content">
            <span className="section-badge">SOBRE NÓS</span>
            <h2 className="section-title">A Teknix chega para revolucionar</h2>
            <p className="about-text">
              Somos uma marca focada em oferecer ferramentas de alta qualidade
              para profissionais e entusiastas que valorizam performance e
              durabilidade em cada projeto.
            </p>
            <p className="about-text">
              Nossa missão é simples: <strong>Feito para fazer.</strong>
              Cada ferramenta é desenvolvida para atender quem não aceita
              menos que o resultado perfeito.
            </p>
            <div className="about-values">
              <div className="value-item">
                <span className="value-icon">⚡</span>
                <div>
                  <h4>Performance</h4>
                  <p>Equipamentos que entregam resultado</p>
                </div>
              </div>
              <div className="value-item">
                <span className="value-icon">🛡️</span>
                <div>
                  <h4>Garantia</h4>
                  <p>Produtos com garantia real</p>
                </div>
              </div>
              <div className="value-item">
                <span className="value-icon">🚚</span>
                <div>
                  <h4>Entrega</h4>
                  <p>Logística eficiente para todo Brasil</p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-visual">
            <div className="about-card">
              <span className="about-highlight">+500</span>
              <span className="about-label">Produtos</span>
            </div>
            <div className="about-card">
              <span className="about-highlight">+1000</span>
              <span className="about-label">Clientes</span>
            </div>
            <div className="about-card">
              <span className="about-highlight">+50</span>
              <span className="about-label">Categorias</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
