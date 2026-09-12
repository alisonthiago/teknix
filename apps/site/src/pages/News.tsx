import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import NewsHeader from '../components/NewsHeader'
import NewsFooter from '../components/NewsFooter'
import './News.css'
import './NewsMobileFix.css'

type PublishedPost = {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  tags: string[] | null
  published_at: string | null
}

function postTag(post: PublishedPost) {
  return post.tags?.[0] || 'TEKNIX NEWS'
}

function postDate(post: PublishedPost) {
  return post.published_at
    ? new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''
}

export default function News() {
  const [posts, setPosts] = useState<PublishedPost[]>([])

  useEffect(() => {
    document.title = 'Home | Teknix News'
    void supabase
      .from('blog_posts')
      .select('id,title,slug,summary,cover_image,tags,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          console.error('Não foi possível carregar as notícias publicadas:', error)
          return
        }
        setPosts((data || []) as PublishedPost[])
      })
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

        {/* 3. NOTÍCIAS RECENTES — conteúdo publicado no blog */}
        <div id="block-noticiasdestacadas">
          <div className="news-section">
            <div>
              {posts.length > 0 && <div className="news-container">
                <div className="views-element-container">
                  {(() => {
                    const post = posts[0]
                    return <div className="news-item big-news">
                      <div className="news-tags">{postTag(post)}</div>
                      <div className="news-images">
                        <Link to={`/blog/${post.slug}`}>
                          {post.cover_image && <img loading="lazy" src={post.cover_image} width={476} height={242} alt={post.title} />}
                        </Link>
                      </div>
                      <div className="news-date">{postDate(post)}</div>
                      <div className="news-body">
                        <div>
                          <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
                          {post.summary && <div className="short-description"><ul><li>{post.summary}</li></ul></div>}
                        </div>
                        <div className="news-url"><Link to={`/blog/${post.slug}`}>Ver mais<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 4 }}><path d="M3 7H11M11 7L7 3M11 7L7 11" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></Link></div>
                      </div>
                    </div>
                  })()}
                </div>
                <div className="views-element-container">
                  <div className="news-list mobile-offset">
                    {posts.slice(1).map(post => <div className="news-item" key={post.id}>
                      <div className="news-tags">{postTag(post)}</div>
                      <div className="news-images">
                        <Link to={`/blog/${post.slug}`}>
                          {post.cover_image && <img loading="lazy" src={post.cover_image} width={240} height={155} alt={post.title} />}
                        </Link>
                      </div>
                      <div className="news-body">
                        <div className="news-tags">{postTag(post)}</div>
                        <div><h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2></div>
                        <div className="news-url"><Link to={`/blog/${post.slug}`}>Ver mais</Link></div>
                      </div>
                    </div>)}
                  </div>
                </div>
              </div>}

              {posts.length === 0 && <div className="news-empty">Nenhuma notícia publicada no momento.</div>}

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
