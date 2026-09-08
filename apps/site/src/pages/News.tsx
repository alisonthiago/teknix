import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import NewsHeader from '../components/NewsHeader'
import NewsFooter from '../components/NewsFooter'
import './News.css'
import './NewsMobileFix.css'

export default function News() {

  useEffect(() => {
    document.title = 'Home | Teknix News'
  }, [])

  return (
    <div className="news-page-root">

      <NewsHeader activePage="" />

      {/* ── MAIN ── */}
      <main className="page-main" role="main">

        {/* 1. HERO BANNER */}
        <div className="banner-container">
          <div
            className="banner-img"
            style={{
              backgroundImage: `url('/news-reference/hero-teknix.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="banner-description">
              <div className="banner-text">
                <p>O melhor <strong>está chegando.</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BLOCO 50-50 */}
        <div id="sobre" className="block-fifty-section">
          <div className="block-fifty-wrapper">
            <div
              className="block-fifty-image"
              style={{ backgroundImage: `url('/news-reference/fifty-fifty-teknix.png')` }}
            />
            <div className="block-fifty-description banner-descripcion-50">
              <div className="block-fifty-text">
                <p>
                  Ajude-nos a impulsionar o progresso conectando pessoas, inovando e criando novas formas de comprar,
                  vender, pagar e receber no Brasil por meio do Teknix e do Teknix Pago.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. NOTÍCIAS RECENTES (ESTRUTURA EXATA DO HTML DA REFERÊNCIA) */}
        <div id="block-noticiasdestacadas">
          <div className="news-section">
            <div>
              <div className="news-title">
                <h2>Notícias Recentes</h2>
                <div className="all-news-url">
                  <Link to="/noticias">VER TODAS AS NOTÍCIAS</Link>
                </div>
              </div>

              <div className="news-container">
                {/* Coluna 1: Notícia Principal (Big News) */}
                <div className="views-element-container">
                <div className="news-item big-news" role="link" tabIndex={0} onClick={() => { window.location.href = '/blog/resultados-segundo-trimestre-2026' }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') window.location.href = '/blog/resultados-segundo-trimestre-2026' }}>
                    <div className="news-tags">Resultados</div>
                    <div className="news-images">
                      <a href="#noticia-1">
                        <img
                          loading="lazy"
                          src="/news-reference/imagen-destacada---1440x580px_192.jpg.webp"
                          width={476}
                          height={242}
                          alt="Resultados Financeiros do Segundo Trimestre de 2026"
                        />
                      </a>
                    </div>
                    <div className="news-date">05 Ago 2026</div>
                    <div className="news-body">
                      <div>
                        <h2>
                          <a href="#noticia-1">
                            Receita do Mercado Livre no 2º trimestre de 2026 alcança US$ 10 bilhões, à medida que o maior engajamento fortalece sua vantagem competitiva
                          </a>
                        </h2>
                        <div className="short-description">
                          <ul>
                            <li>
                              <strong>Financeiro</strong>: A receita líquida cresceu 50% na comparação anual, alcançando US$ 10,2 bilhões.
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="news-url">
                        <a href="#noticia-1">
                          Ver mais
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 4 }}>
                            <path d="M3 7H11M11 7L7 3M11 7L7 11" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Lista de Notícias Secundárias */}
                <div className="views-element-container">
                  <div className="news-list mobile-offset">

                    {/* Notícia 1 */}
                    <div className="news-item">
                      <div className="news-tags">Resultados</div>
                      <div className="news-images">
                        <Link to="/blog/noticia-1">
                          <img
                            loading="lazy"
                            src="/news-reference/imagen-destacada---1440x580px_192.jpg"
                            width={240}
                            height={155}
                            alt="Resultados Financeiros do Segundo Trimestre de 2026"
                          />
                        </Link>
                      </div>
                      <div className="news-body">
                        <div className="news-tags">Resultados</div>
                        <div>
                          <h2>
                            <Link to="/blog/noticia-1">
                              Receita do Mercado Livre no 2º trimestre de 2026 alcança US$ 10 bilhões, à medida que o maior engajamento fortalece sua vantagem competitiva
                            </Link>
                          </h2>
                        </div>
                        <div className="news-url">
                          <Link to="/blog/noticia-1">See more</Link>
                        </div>
                      </div>
                    </div>

                    {/* Notícia 2 */}
                    <div className="news-item">
                      <div className="news-tags">Mercado Pago</div>
                      <div className="news-images">
                        <Link to="/blog/noticia-2">
                          <img
                            loading="lazy"
                            src="/news-reference/imagen-destacada---1440x580px_189.jpg"
                            width={240}
                            height={155}
                            alt="Mercado Pago é reconhecida como uma das principais empresas fintech do mundo em 2026"
                          />
                        </Link>
                      </div>
                      <div className="news-body">
                        <div className="news-tags">Mercado Pago</div>
                        <div>
                          <h2>
                            <Link to="/blog/noticia-2">
                              Mercado Pago é reconhecido pela CNBC como uma das principais fintechs do mundo em 2026
                            </Link>
                          </h2>
                        </div>
                        <div className="news-url">
                          <Link to="/blog/noticia-2">See more</Link>
                        </div>
                      </div>
                    </div>

                    {/* Notícia 3 */}
                    <div className="news-item">
                      <div className="news-tags">Cultura</div>
                      <div className="news-images">
                        <Link to="/blog/noticia-3">
                          <img
                            loading="lazy"
                            src="/news-reference/imagen-destacada---1440x580px_187.jpg"
                            width={240}
                            height={155}
                            alt="Como combater a falsificação e a pirataria durante a Copa do Mundo de 2026"
                          />
                        </Link>
                      </div>
                      <div className="news-body">
                        <div className="news-tags">Cultura</div>
                        <div>
                          <h2>
                            <Link to="/blog/noticia-3">
                              Version en Português Mercado Livre e FIFA unem forças para combater a falsificação e a pirataria durante a Copa do Mundo 2026
                            </Link>
                          </h2>
                        </div>
                        <div className="news-url">
                          <Link to="/blog/noticia-3">See more</Link>
                        </div>
                      </div>
                    </div>

                    {/* Notícia 4 */}
                    <div className="news-item">
                      <div className="news-tags">Relatório de Transparência</div>
                      <div className="news-images">
                        <Link to="/blog/noticia-4">
                          <img
                            loading="lazy"
                            src="/news-reference/imagen-destacada---1440x580px_200.jpg"
                            width={240}
                            height={155}
                            alt="Nosso Código de Ética: o compromisso de fazer o que é certo"
                          />
                        </Link>
                      </div>
                      <div className="news-body">
                        <div className="news-tags">Relatório de Transparência</div>
                        <div>
                          <h2>
                            <Link to="/blog/noticia-4">
                              Nosso Código de Ética: o compromisso de fazer o que é certo
                            </Link>
                          </h2>
                        </div>
                        <div className="news-url">
                          <Link to="/blog/noticia-4">See more</Link>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              <div className="news-title">
                <div className="all-news-url-mobile">
                  <Link to="/noticias">VER TODAS AS NOTÍCIAS</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTÕES 2x2 INÍCIO */}
        <div id="block-botonesinicio">
          <div className="buttons-home">
            <div className="buttons-wrapper">
              <div
                className="button-item"
                style={{ backgroundImage: `url('/news-reference/btn-sobre.webp')` }}
              >
                <Link to="/news/sobre-nos">
                  <div className="button-title">
                    <p>Sobre nós</p>
                    <img src="/news-reference/diagonal-arrow.svg" alt="arrow" />
                  </div>
                </Link>
              </div>

              <div
                className="button-item"
                style={{ backgroundImage: `url('/news-reference/btn-ecossistema.webp')` }}
              >
                <Link to="/news/nosso-ecossistema">
                  <div className="button-title">
                    <p>Nosso Ecossistema</p>
                    <img src="/news-reference/diagonal-arrow.svg" alt="arrow" />
                  </div>
                </Link>
              </div>

              <div
                className="button-item"
                style={{ backgroundImage: `url('/news-reference/btn-investidores.webp')` }}
              >
                <Link to="/news/investidores">
                  <div className="button-title">
                    <p>Investidores</p>
                    <img src="/news-reference/diagonal-arrow.svg" alt="arrow" />
                  </div>
                </Link>
              </div>

              <div
                className="button-item"
                style={{ backgroundImage: `url('/news-reference/btn-sustentabilidade.webp')` }}
              >
                <Link to="/news/sustentabilidade">
                  <div className="button-title">
                    <p>Sustentabilidade</p>
                    <img src="/news-reference/diagonal-arrow.svg" alt="arrow" />
                  </div>
                </Link>
              </div>
            </div>
            <div className="pattern-wrapper"></div>
          </div>
        </div>

        {/* 5. HISTÓRIAS INSPIRADORAS */}
        <div id="block-inspirationalstories">
          <div className="inspirational-stories-block">
            <div className="stories-block">
              <div className="story-banner">
                <div className="story-banner-pattern"></div>
                <img src="/news-reference/historias.png" alt="Banner Story" />
              </div>
              <div className="story-list">
                <div>
                  <h2>Histórias Inspiradoras</h2>
                  <div className="views-element-container">
                    <div className="item-list">
                      <ul>
                        <li className="story-item">
                          <div className="story-details">
                            <a href="#story-1">
                              Rubberon: Transformando Recursos Humanos com Mercado Pago Benefícios
                              <div className="icon">
                                <img src="/news-reference/arrow-right.svg" alt="arrow" />
                              </div>
                            </a>
                          </div>
                        </li>
                        <li className="story-item">
                          <div className="story-details">
                            <a href="#story-2">
                              Empório do Celular: Crescimento Impulsionado pelo E-commerce
                              <div className="icon">
                                <img src="/news-reference/arrow-right.svg" alt="arrow" />
                              </div>
                            </a>
                          </div>
                        </li>
                        <li className="story-item">
                          <div className="story-details">
                            <a href="#story-3">
                              Coca Nasa: Inovação Ancestral que Percorre a Colômbia
                              <div className="icon">
                                <img src="/news-reference/arrow-right.svg" alt="arrow" />
                              </div>
                            </a>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div className="more-link">
                      <a href="#historias">VER TODAS AS HISTÓRIAS</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER OFICIAL COM 6 COLUNAS PADRONIZADO ── */}
      <NewsFooter />

    </div>
  )
}
