import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import NewsHeader from '../components/NewsHeader'
import NewsFooter from '../components/NewsFooter'
import './News.css'

export default function NewsAbout() {

  useEffect(() => {
    document.title = 'Sobre nós | Teknix News'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="news-page-root about-page">

      <NewsHeader activePage="sobre" />

      {/* ── MAIN CONTENT ── */}
      <main className="page-main" role="main">

        {/* 1. HERO BANNER COM SELO AMARELO */}
        <div className="banner-container">
          <div
            className="banner-img is-not-front"
            style={{
              backgroundImage: `url('/news-reference/about-hero-teknix.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="banner-description">
              <div className="banner-description-wrapper">
                <div className="title_bg">
                  <div>Sobre a Teknix</div>
                </div>
                <div className="banner-text">
                  <p className="p1">
                    Somos a empresa de tecnologia<br />
                    <strong>líder em inovação, ferramentas</strong><br />
                    <strong>e soluções digitais</strong> do Brasil
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BLOCO 50-50: NOSSA MISSÃO */}
        <div id="missao" className="block-fifty-section">
          <div className="block-fifty-wrapper">
            <div
              className="block-fifty-image"
              style={{ backgroundImage: `url('/news-reference/fifty-fifty.jpg')` }}
            />
            <div className="block-fifty-description banner-descripcion-50-internal">
              <div className="block-fifty-text">
                <h4>
                  NOSSA <br />
                  <strong>MISSÃO</strong>
                </h4>
                <p>
                  <strong>Democratizamos o acesso a ferramentas, tecnologia e serviços</strong> para transformar a vida e o trabalho de milhões de profissionais e famílias em todo o país.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. NOSSA HISTÓRIA */}
        <div id="historia" className="news-cards-section">
          <div className="news-cards-wrapper">
            <div>
              <div className="news-cards-text">
                <h4>
                  NOSSA <br />
                  <strong>HISTÓRIA</strong>
                </h4>
                <p>
                  Nascemos com a missão de aproximar ferramentas robustas, tecnologia inteligente e praticidade do dia a dia das pessoas. Ao longo dos anos, expandimos nosso portfólio, consolidamos parcerias industriais e construímos um ecossistema completo sem nunca perder nosso espírito inovador.
                </p>
              </div>

              <div className="render-news">
                <div className="news-item-card-featured">
                  <div className="news-item-cover">
                    <span className="badge-tag">Trajetória</span>
                    <img
                      src="/news-reference/banner-hero.jpg"
                      alt="História da Teknix"
                    />
                  </div>
                  <div className="news-item-body">
                    <h2>Nossa jornada: do primeiro produto à liderança nacional</h2>
                    <p>
                      Iniciamos com a convicção de que equipamentos de alto desempenho devem ser acessíveis. Hoje conectamos oficinas, indústrias e lares em todo o território nacional com entrega ágil e tecnologia de ponta.
                    </p>
                    <div className="news-item-footer">
                      <Link to="/noticias">VER MAIS NOTÍCIAS</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. NOSSOS COLABORADORES E CULTURA */}
        <div id="colaboradores" className="culture-section">
          <div className="culture-wrapper">
            <div className="culture-header">
              <h4>
                NOSSOS <br />
                <strong>COLABORADORES</strong>
              </h4>
              <p>
                Construímos um ambiente onde o protagonismo, a diversidade de ideias e o foco no cliente impulsionam cada lançamento.
              </p>
            </div>

            <div className="culture-grid">
              <div className="culture-card">
                <div className="culture-num">01</div>
                <h3>Empreendedorismo e Agilidade</h3>
                <p>Incentivamos cada pessoa a agir com espírito de dono, testando rápido e aprendendo continuamente.</p>
              </div>
              <div className="culture-card">
                <div className="culture-num">02</div>
                <h3>Foco Total no Usuário</h3>
                <p>Desenvolvemos produtos e ferramentas a partir das reais necessidades de quem trabalha e produz.</p>
              </div>
              <div className="culture-card">
                <div className="culture-num">03</div>
                <h3>Excelência e Segurança</h3>
                <p>Padrões rigorosos de qualidade, engenharia de ponta e respeito incondicional às normas técnicas.</p>
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
