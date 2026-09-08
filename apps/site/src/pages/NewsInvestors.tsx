import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import NewsHeader from '../components/NewsHeader'
import NewsFooter from '../components/NewsFooter'
import './News.css'

export default function NewsInvestors() {

  useEffect(() => {
    document.title = 'Investidores | Teknix News'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="news-page-root investors-page">

      <NewsHeader activePage="investidores" />

      {/* ── MAIN CONTENT ── */}
      <main className="page-main" role="main">

        {/* 1. HERO BANNER COM SELO AMARELO */}
        <div className="banner-container">
          <div
            className="banner-img is-not-front"
            style={{
              backgroundImage: `url('/news-reference/btn-investidores.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="banner-description">
              <div className="banner-description-wrapper">
                <div className="title_bg">
                  <div>Investidores</div>
                </div>
                <div className="banner-text">
                  <p className="p1">
                    Resultados de <strong>nosso crescimento</strong><br />
                    <strong>no ecossistema digital</strong><br />
                    e industrial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BLOCO 50-50 TEXTO AMARELO: LIDERANÇA E EFICIÊNCIA */}
        <div className="block-fifty-text-only">
          <div className="description-wrapper">
            <div className="description-box">
              <div className="title-block-50">INVESTIDORES</div>
              <div className="description-columns">
                <div className="description-50-left">
                  <h5>
                    <strong>Liderança consolidada no segmento técnico e digital</strong>, com crescimento sustentável de receita e rentabilidade consistente
                  </h5>
                </div>
                <div className="description-50-right">
                  <p>
                    Com investimento contínuo em logística proprietária, canais digitais e expansão do portfólio, fortalecemos nosso posicionamento estratégico gerando valor a longo prazo para acionistas, parceiros e colaboradores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. RELATÓRIOS E RESULTADOS TRIMESTRAIS */}
        <div className="news-cards-section">
          <div className="news-cards-wrapper">
            <div>
              <div className="news-cards-text">
                <h4>
                  RELATÓRIOS E <br />
                  <strong>RESULTADOS FINANCEIROS</strong>
                </h4>
                <p>
                  Acesse os balanços, comunicados e apresentações aos analistas e ao mercado de capitais.
                </p>
              </div>

              <div className="downloads-list">
                <div className="download-row">
                  <div>
                    <span className="badge-tag">2º Trimestre 2026</span>
                    <h3>Release de Resultados — 2T26</h3>
                    <p>Crescimento de receita líquida de 50% na comparação anual e expansão da margem operacional.</p>
                  </div>
                  <a href="#download-2t26" className="btn-download">
                    <p>VER RELATÓRIO</p>
                    <svg width="17" height="14" viewBox="0 0 17 14" fill="none">
                      <path d="M16 7L16.3536 6.64645L16.7071 7L16.3536 7.35355L16 7ZM1 7.5C0.723858 7.5 0.5 7.27614 0.5 7C0.5 6.72386 0.723858 6.5 1 6.5V7.5ZM10.3536 0.646447L16.3536 6.64645L15.6464 7.35355L9.64645 1.35355L10.3536 0.646447ZM16.3536 7.35355L10.3536 13.3536L9.64645 12.6464L15.6464 6.64645L16.3536 7.35355ZM16 7.5H1V6.5H16V7.5Z" fill="#333333"/>
                    </svg>
                  </a>
                </div>

                <div className="download-row">
                  <div>
                    <span className="badge-tag">1º Trimestre 2026</span>
                    <h3>Release de Resultados — 1T26</h3>
                    <p>Desempenho histórico de vendas, consolidação de centros de distribuição e novos recordes.</p>
                  </div>
                  <a href="#download-1t26" className="btn-download">
                    <p>VER RELATÓRIO</p>
                    <svg width="17" height="14" viewBox="0 0 17 14" fill="none">
                      <path d="M16 7L16.3536 6.64645L16.7071 7L16.3536 7.35355L16 7ZM1 7.5C0.723858 7.5 0.5 7.27614 0.5 7C0.5 6.72386 0.723858 6.5 1 6.5V7.5ZM10.3536 0.646447L16.3536 6.64645L15.6464 7.35355L9.64645 1.35355L10.3536 0.646447ZM16.3536 7.35355L10.3536 13.3536L9.64645 12.6464L15.6464 6.64645L16.3536 7.35355ZM16 7.5H1V6.5H16V7.5Z" fill="#333333"/>
                    </svg>
                  </a>
                </div>

                <div className="download-row">
                  <div>
                    <span className="badge-tag">Governança</span>
                    <h3>Formulário de Referência e Código de Conduta</h3>
                    <p>Práticas sólidas de governança corporativa, compliance e transparência regulatória.</p>
                  </div>
                  <a href="#download-governanca" className="btn-download">
                    <p>VER DOCUMENTO</p>
                    <svg width="17" height="14" viewBox="0 0 17 14" fill="none">
                      <path d="M16 7L16.3536 6.64645L16.7071 7L16.3536 7.35355L16 7ZM1 7.5C0.723858 7.5 0.5 7.27614 0.5 7C0.5 6.72386 0.723858 6.5 1 6.5V7.5ZM10.3536 0.646447L16.3536 6.64645L15.6464 7.35355L9.64645 1.35355L10.3536 0.646447ZM16.3536 7.35355L10.3536 13.3536L9.64645 12.6464L15.6464 6.64645L16.3536 7.35355ZM16 7.5H1V6.5H16V7.5Z" fill="#333333"/>
                    </svg>
                  </a>
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
