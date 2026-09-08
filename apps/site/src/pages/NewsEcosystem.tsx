import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import NewsHeader from '../components/NewsHeader'
import NewsFooter from '../components/NewsFooter'
import './News.css'

export default function NewsEcosystem() {

  useEffect(() => {
    document.title = 'Nosso Ecossistema | Teknix News'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="news-page-root">

      <NewsHeader activePage="ecossistema" />

      {/* ── MAIN CONTENT ── */}
      <main className="page-main" role="main">

        {/* 1. HERO BANNER COM SELO AMARELO */}
        <div className="banner-container">
          <div
            className="banner-img is-not-front"
            style={{
              backgroundImage: `url('/news-reference/btn-ecossistema.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="banner-description">
              <div className="banner-description-wrapper">
                <div className="title_bg">
                  <div>Nosso Ecossistema</div>
                </div>
                <div className="banner-text">
                  <p className="p1">
                    O valor de pensar<br />
                    <strong>todas as soluções integradas</strong><br />
                    para o seu trabalho
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BLOCO 50-50: PROPÓSITO DO ECOSSISTEMA */}
        <div className="block-fifty-section">
          <div className="block-fifty-wrapper">
            <div
              className="block-fifty-image"
              style={{ backgroundImage: `url('/news-reference/fifty-fifty.jpg')` }}
            />
            <div className="block-fifty-description banner-descripcion-50-internal">
              <div className="block-fifty-text">
                <p>
                  Com o objetivo de <strong>impulsionar a produtividade, a eficiência operacional e transformar a experiência dos nossos clientes</strong>, desenvolvemos um ecossistema integrado que une catálogo completo de ferramentas, meios de pagamento ágeis e entrega expressa.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. OS PILARES DO ECOSSISTEMA TEKNIX */}
        <div className="news-cards-section">
          <div className="news-cards-wrapper">
            <div>
              <div className="news-cards-text">
                <h4>
                  CONHEÇA AS MARCAS E SOLUÇÕES <br />
                  <strong>DO ECOSSISTEMA TEKNIX</strong>
                </h4>
                <p>
                  Cada unidade do nosso ecossistema foi projetada para atuar em sinergia, oferecendo comodidade, confiabilidade e suporte de ponta a ponta.
                </p>
              </div>

              <div className="ecosystem-grid">
                {/* Pilar 1: Teknix Store */}
                <div className="ecosystem-card">
                  <div className="ecosystem-card-header">
                    <span className="badge-tag">E-commerce & Catálogo</span>
                    <h3>Teknix Store</h3>
                  </div>
                  <p>
                    Plataforma completa de ferramentas elétricas, pneumáticas, manuais e industriais com procedência e suporte oficial.
                  </p>
                  <Link to="/" className="btn-ecosystem">ACESSAR LOJA →</Link>
                </div>

                {/* Pilar 2: Teknix Pago */}
                <div className="ecosystem-card">
                  <div className="ecosystem-card-header">
                    <span className="badge-tag">Serviços Financeiros</span>
                    <h3>Teknix Pago</h3>
                  </div>
                  <p>
                    Condições facilitadas de pagamento com parcelamento inteligente, Pix instantâneo com desconto e aprovação segura.
                  </p>
                  <Link to="/news" className="btn-ecosystem">SAIBA MAIS →</Link>
                </div>

                {/* Pilar 3: Teknix Express */}
                <div className="ecosystem-card">
                  <div className="ecosystem-card-header">
                    <span className="badge-tag">Logística</span>
                    <h3>Teknix Express</h3>
                  </div>
                  <p>
                    Malha logística integrada com centros de distribuição modernos para garantir remessas rápidas e rastreamento em tempo real.
                  </p>
                  <Link to="/news" className="btn-ecosystem">CONHECER REDE →</Link>
                </div>

                {/* Pilar 4: Teknix Pro */}
                <div className="ecosystem-card">
                  <div className="ecosystem-card-header">
                    <span className="badge-tag">B2B & Indústria</span>
                    <h3>Teknix Pro</h3>
                  </div>
                  <p>
                    Atendimento especializado para oficinas mecânicas, marcenarias e construtoras com faturamento corporativo dedicado.
                  </p>
                  <Link to="/news" className="btn-ecosystem">SOLUÇÕES B2B →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER OFICIAL PADRONIZADO ── */}
      <NewsFooter />

    </div>
  )
}
