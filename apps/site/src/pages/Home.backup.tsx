import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageRenderer from '../components/PageRenderer'
import './Home.css'

export default function HomeBackup() {
  const [publishedHomeId, setPublishedHomeId] = useState<string | null>(null)
  const [activeEntertainment, setActiveEntertainment] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    async function checkPublishedHome() {
      try {
        const { data } = await supabase
          .from('pages')
          .select('id')
          .or('slug.eq./,slug.eq.home,slug.eq.,type.eq.home')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data?.id) {
          const { count } = await supabase
            .from('page_sections')
            .select('id', { count: 'exact', head: true })
            .eq('page_id', data.id)

          if (count && count > 0) {
            setPublishedHomeId(data.id)
          }
        }
      } catch (e) {
        console.warn('Fallback to native Apple Home:', e)
      }
    }
    checkPublishedHome()
  }, [])

  const entertainmentItems = [
    {
      id: 1,
      title: 'Ted Lasso',
      genre: 'Comédia',
      description: 'A comédia de sucesso está de volta e mais divertida do que nunca.',
      tag: 'Apple TV+',
      actionText: 'Assista agora',
      link: '/produtos',
      image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1600&q=80',
      service: 'tv'
    },
    {
      id: 2,
      title: 'Lucky',
      genre: 'Ação',
      description: 'Anya Taylor-Joy é uma golpista que foge para salvar a própria vida após um assalto dar errado.',
      tag: 'Apple TV+',
      actionText: 'Assista agora',
      link: '/produtos',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&q=80',
      service: 'tv'
    },
    {
      id: 3,
      title: 'Fórmula 1®',
      genre: 'Esportes',
      description: 'Todos os Grandes Prêmios™, ao vivo e sob demanda — tudo em um só lugar, o ano todo.',
      tag: 'Apple TV+',
      actionText: 'F1 na Apple TV',
      link: '/produtos',
      image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1600&q=80',
      service: 'tv'
    },
    {
      id: 4,
      title: 'Silo',
      genre: 'Ficção Científica',
      description: 'A verdade está no passado. 19 indicações ao Emmy®.',
      tag: 'Apple TV+',
      actionText: 'Assista agora',
      link: '/produtos',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80',
      service: 'tv'
    },
    {
      id: 5,
      title: 'Sabrina Carpenter',
      genre: 'Apple Music',
      description: 'A Entrevista com Zane Lowe e álbum completo em Áudio Espacial.',
      tag: 'Music',
      actionText: 'Ouça agora',
      link: '/produtos',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&q=80',
      service: 'music'
    },
    {
      id: 6,
      title: 'Balatro+ & Arcade Hits',
      genre: 'Apple Arcade',
      description: 'Mais de 200 jogos sem anúncios e sem compras dentro do app.',
      tag: 'Arcade',
      actionText: 'Jogue agora',
      link: '/produtos',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80',
      service: 'arcade'
    }
  ]

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setActiveEntertainment((prev) => (prev + 1) % entertainmentItems.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPlaying, entertainmentItems.length])

  if (publishedHomeId) {
    return <PageRenderer pageId={publishedHomeId} />
  }

  return (
    <div className="apple-home-root">
      <section className="section-ribbon" data-analytics-region="ribbon">
        <div className="ribbon ribbon-animate-color ribbon-blue-to-default">
          <div className="ribbon-content-wrapper">
            <div className="ribbon-content">
              <span>
                Estamos doando US$ 10 para a National Park Foundation para cada compra feita na Apple usando o Apple Pay até 28 de agosto.*
              </span>{' '}
              <Link to="/produtos" className="ribbon-link">
                Compre agora &gt;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="main" role="main">
        <section className="section section-hero">
          <div className="tile-wrapper tile-hero-mac-mini">
            <Link to="/mac" className="tile-link-cover" aria-label="Mac mini"></Link>
            <div className="tile-content">
              <div className="tile-copy-wrapper">
                <h2 className="tile-headline typography-hero-headline">Mac mini</h2>
                <p className="tile-subhead typography-hero-subhead">Agora com M6 e M5 Pro.</p>
                <p className="tile-callout typography-hero-callout">Disponível a partir de 22/09.</p>
              </div>
              <div className="tile-ctas">
                <Link to="/mac" className="button button-primary">
                  Saber mais
                </Link>
                <Link to="/produtos" className="button button-secondary">
                  Pedido antecipado
                </Link>
              </div>
            </div>
            <div className="tile-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&q=80"
                alt="Mac mini"
                className="hero-image"
              />
            </div>
          </div>
        </section>

        <section className="section section-hero">
          <div className="tile-wrapper tile-hero-mac-studio">
            <Link to="/mac" className="tile-link-cover" aria-label="Mac Studio"></Link>
            <div className="tile-content">
              <div className="tile-copy-wrapper">
                <h2 className="tile-headline typography-hero-headline">Mac Studio</h2>
                <p className="tile-subhead typography-hero-subhead">Agora com M5 Max e M5 Ultra.</p>
                <p className="tile-callout typography-hero-callout">Disponível a partir de 22/09.</p>
              </div>
              <div className="tile-ctas">
                <Link to="/mac" className="button button-primary">
                  Saber mais
                </Link>
                <Link to="/produtos" className="button button-secondary">
                  Pedido antecipado
                </Link>
              </div>
            </div>
            <div className="tile-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1600&q=80"
                alt="Mac Studio"
                className="hero-image"
              />
            </div>
          </div>
        </section>

        <section className="section section-hero">
          <div className="tile-wrapper tile-hero-bts">
            <Link to="/produtos" className="tile-link-cover" aria-label="Volta às Aulas"></Link>
            <div className="tile-content">
              <div className="tile-copy-wrapper">
                <h2 className="tile-headline typography-hero-headline">Faculdade, resolvido.</h2>
                <p className="tile-subhead typography-hero-subhead">
                  Ganhe um cartão-presente de US$ 100 a US$ 150 na compra de um Mac ou iPad com desconto para estudantes.**
                </p>
              </div>
              <div className="tile-ctas">
                <Link to="/produtos" className="button button-primary">
                  Comprar
                </Link>
              </div>
            </div>
            <div className="tile-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80"
                alt="Estudantes universitários com Mac e iPad"
                className="hero-image"
              />
            </div>
          </div>
        </section>

        <section className="section section-promo">
          <div className="promo-grid">
            <div className="tile-wrapper promo-tile">
              <div className="tile-content">
                <div className="tile-copy-wrapper">
                  <h3 className="tile-headline typography-promo-headline">iPhone</h3>
                  <p className="tile-subhead typography-promo-subhead">Conheça a mais recente linha de iPhones.</p>
                </div>
                <div className="tile-ctas">
                  <Link to="/iphone" className="button button-primary">
                    Saber mais
                  </Link>
                  <Link to="/produtos" className="button button-secondary">
                    Compre iPhone
                  </Link>
                </div>
              </div>
              <div className="tile-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=900&q=80"
                  alt="Linha iPhone"
                />
              </div>
            </div>

            <div className="tile-wrapper promo-tile">
              <div className="tile-content">
                <div className="tile-copy-wrapper">
                  <h3 className="tile-headline typography-promo-headline">MacBook Air</h3>
                  <p className="tile-subhead typography-promo-subhead">Agora turbinado pelo M5.</p>
                </div>
                <div className="tile-ctas">
                  <Link to="/mac" className="button button-primary">
                    Saber mais
                  </Link>
                  <Link to="/produtos" className="button button-secondary">
                    Comprar
                  </Link>
                </div>
              </div>
              <div className="tile-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&q=80"
                  alt="MacBook Air"
                />
              </div>
            </div>

            <div className="tile-wrapper promo-tile">
              <div className="tile-content">
                <div className="tile-copy-wrapper">
                  <h3 className="tile-headline typography-promo-headline">iPad Air</h3>
                  <p className="tile-subhead typography-promo-subhead">Agora turbinado pelo M4.</p>
                </div>
                <div className="tile-ctas">
                  <Link to="/ipad" className="button button-primary">
                    Saber mais
                  </Link>
                  <Link to="/produtos" className="button button-secondary">
                    Comprar
                  </Link>
                </div>
              </div>
              <div className="tile-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&q=80"
                  alt="iPad Air"
                />
              </div>
            </div>

            <div className="tile-wrapper promo-tile theme-dark">
              <div className="tile-content">
                <div className="tile-copy-wrapper">
                  <h3 className="tile-headline typography-promo-headline">iPad Pro</h3>
                  <p className="tile-subhead typography-promo-subhead">Desempenho avançado de IA e capacidades revolucionárias.</p>
                </div>
                <div className="tile-ctas">
                  <Link to="/ipad" className="button button-primary">
                    Saber mais
                  </Link>
                  <Link to="/produtos" className="button button-secondary">
                    Comprar
                  </Link>
                </div>
              </div>
              <div className="tile-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1561154464-82e9adf32764?w=900&q=80"
                  alt="iPad Pro"
                />
              </div>
            </div>

            <div className="tile-wrapper promo-tile">
              <div className="tile-content">
                <div className="tile-copy-wrapper">
                  <h3 className="tile-headline typography-promo-headline">Atualização Apple</h3>
                  <p className="tile-subhead typography-promo-subhead">Ame. Alugue. Melhore.</p>
                </div>
                <div className="tile-ctas">
                  <Link to="/produtos" className="button button-primary">
                    Saber mais
                  </Link>
                </div>
              </div>
              <div className="tile-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=900&q=80"
                  alt="Atualização Apple"
                />
              </div>
            </div>

            <div className="tile-wrapper promo-tile">
              <div className="tile-content">
                <div className="tile-copy-wrapper">
                  <h3 className="tile-headline typography-promo-headline">Cartão Apple</h3>
                  <p className="tile-subhead typography-promo-subhead">Receba até 3% de reembolso diário em todas as suas compras.</p>
                </div>
                <div className="tile-ctas">
                  <Link to="/checkout" className="button button-primary">
                    Saber mais
                  </Link>
                  <Link to="/checkout" className="button button-secondary">
                    Candidate-se agora
                  </Link>
                </div>
              </div>
              <div className="tile-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=900&q=80"
                  alt="Cartão Apple"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section-endless-entertainment-gallery">
          <div className="endless-entertainment-inner">
            <div className="media-gallery-headline-container">
              <h2 className="media-gallery-headline">Entretenimento sem fim.</h2>
            </div>

            <div className="media-gallery-dotnav">
              <div className="media-gallery-dotnav-items">
                {entertainmentItems.map((item, idx) => (
                  <button
                    key={item.id}
                    className={`media-gallery-dotnav-btn ${idx === activeEntertainment ? 'active' : ''}`}
                    onClick={() => setActiveEntertainment(idx)}
                    aria-label={`Slide ${idx + 1}`}
                  >
                    <span className="dot-progress"></span>
                  </button>
                ))}
              </div>

              <button
                className="media-gallery-play-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pausar galeria' : 'Reproduzir galeria'}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="entertainment-carousel-viewport">
              <div
                className="entertainment-carousel-track"
                style={{ transform: `translateX(-${activeEntertainment * 100}%)` }}
              >
                {entertainmentItems.map((item) => (
                  <div key={item.id} className="entertainment-card-slide">
                    <div className="entertainment-card">
                      <img src={item.image} alt={item.title} className="entertainment-bg-img" />
                      <div className="entertainment-overlay-scrim"></div>
                      <div className="entertainment-card-content">
                        <div className="entertainment-badge">{item.tag}</div>
                        <h3 className="entertainment-title">{item.title}</h3>
                        <p className="entertainment-desc">
                          <strong>{item.genre}</strong> — {item.description}
                        </p>
                        <Link to={item.link} className="entertainment-cta-btn">
                          {item.actionText}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
