import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import NewsHeader from '../components/NewsHeader'
import NewsFooter from '../components/NewsFooter'
import './News.css'

export default function NewsSustainability() {

  useEffect(() => {
    document.title = 'Sustentabilidade | Teknix News'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="news-page-root sustainability-page">

      <NewsHeader activePage="sustentabilidade" />

      {/* ── MAIN CONTENT ── */}
      <main className="page-main" role="main">

        {/* 1. HERO BANNER COM SELO AMARELO */}
        <div className="banner-container">
          <div
            className="banner-img is-not-front"
            style={{
              backgroundImage: `url('/news-reference/sustainability-hero-v2.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="banner-description">
              <div className="banner-description-wrapper">
                <div className="title_bg">
                  <div>Sustentabilidade</div>
                </div>
                <div className="banner-text">
                  <p className="p1">
                    Atuamos hoje para<br />
                    <strong>que chegue o melhor</strong><br />
                    para o futuro
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BLOCO 50-50 TEXTO AMARELO: COMPROMISSO INTEGRADO */}
        <div className="block-fifty-text-only">
          <div className="description-wrapper">
            <div className="description-box">
              <div className="title-block-50">SUSTENTABILIDADE</div>
              <div className="description-columns">
                <div className="description-50-left">
                  <h5>
                    Entendemos a sustentabilidade como um <strong>modo de agir integrado à nossa estratégia de negócio e expansão</strong>
                  </h5>
                </div>
                <div className="description-50-right">
                  <p>
                    Materializamos nosso compromisso por meio de ações em três frentes: o impulso do <strong>ecossistema empreendedor e profissional</strong> com foco em capacitação e inclusão; a contribuição com as comunidades locais por meio de <strong>programas de educação técnica</strong>; e o respeito ao meio ambiente com embalagens recicláveis, eficiência logística e descarte responsável.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. AS TRÊS FRENTES DE ATUAÇÃO SUSTENTÁVEL */}
        <div className="news-cards-section">
          <div className="news-cards-wrapper">
            <div>
              <div className="news-cards-text">
                <h4>
                  NOSSAS FRENTES DE <br />
                  <strong>IMPACTO POSITIVO</strong>
                </h4>
                <p>
                  Iniciativas que geram transformação real para pessoas, negócios e para o planeta.
                </p>
              </div>

              <div className="sustainability-grid">
                <div className="sustainability-card">
                  <div className="sustainability-num">01</div>
                  <h3>Ecossistema Empreendedor</h3>
                  <p>
                    Apoiamos pequenos empresários, autônomos e oficinas com capacitação técnica, acesso a linhas de crédito justas e tecnologia que potencializa seus rendimentos.
                  </p>
                </div>

                <div className="sustainability-card">
                  <div className="sustainability-num">02</div>
                  <h3>Educação e Inclusão Social</h3>
                  <p>
                    Parcerias com escolas técnicas e institutos de formação profissional para preparar jovens e profissionais para as ferramentas e profissões do futuro.
                  </p>
                </div>

                <div className="sustainability-card">
                  <div className="sustainability-num">03</div>
                  <h3>Meio Ambiente e Circularidade</h3>
                  <p>
                    Compromisso contínuo com a redução de resíduos plásticos nas embalagens, logística reversa de baterias e componentes elétricos e eficiência energética.
                  </p>
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
