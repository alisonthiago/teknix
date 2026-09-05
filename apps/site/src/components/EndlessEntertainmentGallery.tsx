import React, { useState, useEffect, useRef } from 'react'

export interface TVShowItem {
  id: string
  title: string
  brand?: string
  genre?: string
  description?: string
  button_text?: string
  button_link?: string
  bg_image?: string
  logo_image?: string
  theme?: 'dark' | 'light'
}

export interface FamServiceItem {
  id: string
  service: 'music' | 'arcade' | 'fitness'
  title: string
  bg_color?: string
  bg_image?: string
  button_text?: string
  button_link?: string
  longnote?: string
}

export interface EndlessEntertainmentGalleryProps {
  content?: {
    headline?: string
    headlineTag?: 'h1' | 'h2' | 'h3' | 'div'
    activeTab?: 'tv' | 'services' | 'all'
    autoplay?: boolean
    interval?: number
    tvShows?: TVShowItem[]
    famServices?: FamServiceItem[]
    showControls?: boolean
  }
  style?: React.CSSProperties
  className?: string
}

export const DEFAULT_TV_SHOWS: TVShowItem[] = [
  {
    id: 'mls',
    title: 'MLS',
    brand: 'MLS on Apple TV',
    genre: 'Esportes',
    description: 'Assista a todos os clubes, todos os jogos ao vivo — a temporada inteira.',
    button_text: 'MLS on Apple TV',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/78/57/f6/7857f6ec-a4ed-87dc-dea9-a6ed02888722/ebd59c17-8e95-49b1-aec0-44aec57388ee.png/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/Kc1Xx3Z1QBOuXe1EHDu4TA/220x54.png'
  },
  {
    id: 'ted-lasso',
    title: 'Ted Lasso',
    brand: 'Apple Original',
    genre: 'Comédia',
    description: 'A comédia de sucesso está de volta e mais divertida do que nunca.',
    button_text: 'Assista agora',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features221/v4/3d/b5/d5/3db5d5c0-808b-d357-a2f1-2240d614e2b0/e6663278-3bd4-4114-9f97-082e7c192453.png/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/Cc6MMzxFzD1gVqnd6IslKA/220x54.png'
  },
  {
    id: 'formula-1',
    title: 'Formula 1',
    brand: 'Formula 1',
    genre: 'Esportes',
    description: 'Todos os Grandes Prêmios ao vivo e sob demanda — tudo em um só lugar o ano todo.',
    button_text: 'F1 on Apple TV',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/47/76/ea/4776ea5e-5e00-a76b-c8f1-6fda44050f30/3dd9b6d8-a87a-4a15-80bb-0cc06dfa62d4.png/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features221/v4/f0/ac/1e/f0ac1e58-0027-49d0-378e-68470edfb0ec/3b7d6fac-0061-401c-9716-742245053fd0.png/220x54.png'
  },
  {
    id: 'dark-matter',
    title: 'Matéria Escura',
    brand: 'Apple Original',
    genre: 'Ficção Científica',
    description: 'Nova temporada.',
    button_text: 'Assista agora',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/b-b9eb0IET479YbfP-t1cA/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/2O76_V3dS7VrJAjsyXvY2Q/220x54.png'
  },
  {
    id: 'lucky',
    title: 'Lucky',
    brand: 'Apple Original',
    genre: 'Ação',
    description: 'Anya Taylor-Joy é uma vigarista fugindo para salvar a vida após um roubo dar errado.',
    button_text: 'Assista agora',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/3aJOoInTKLjwSg8kv-ifDg/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/pQdOLq_2af0BOpHwvbC6vg/220x54.png'
  },
  {
    id: 'silo',
    title: 'Silo',
    brand: 'Apple Original',
    genre: 'Ficção Científica',
    description: 'A verdade está no passado.',
    button_text: 'Assista agora',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/hRaOrIKahRFcNlKt6UV4Ow/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/w6iOdqXGZLugnUgKmWZp0g/220x54.png'
  },
  {
    id: 'friday-night-baseball',
    title: 'Friday Night Baseball',
    brand: 'MLB',
    genre: 'Esportes',
    description: 'Jogos da MLB ao vivo toda sexta-feira.',
    button_text: 'Ver programação',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/33/9e/cf/339ecfe7-f515-8594-2e48-d991803409ea/5a944fdc-acd7-47a8-89e7-274d84cf4276.png/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/6f/41/7c/6f417c01-dbf7-6cdc-df62-f014aa88a673/e452926f-7b52-4c05-a07f-8e4939b1bf6b.png/220x54.png'
  },
  {
    id: 'the-dink',
    title: 'The Dink',
    brand: 'Apple Original Film',
    genre: 'Comédia',
    description: 'Pickleball contra tênis em um novo filme hilário.',
    button_text: 'Assista agora',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/koGPFMce0cxPTuuHdx325g/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/hjNrUSK0q2WdGZr46dOQyw/220x54.png'
  },
  {
    id: 'widows-bay',
    title: 'Widow’s Bay',
    brand: 'Apple Original',
    genre: 'Mistério',
    description: '19 indicações ao Emmy®, incluindo Melhor Série de Comédia.',
    button_text: 'Assista agora',
    button_link: 'https://tv.apple.com',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/CqMFl0CvUAUE1axxV4k-ew/1250x668sr.jpg',
    logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/vXNv4MQ8aLXIkWQTZxw-BQ/220x54.png'
  }
]

export const DEFAULT_FAM_SERVICES: FamServiceItem[] = [
  {
    id: 'fam-music-1',
    service: 'music',
    title: 'Sabrina Carpenter: The Zane Lowe Interview',
    bg_color: '#000000',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/55/2b/5f/552b5f86-46e6-d848-ee06-5395bf09c206/83e0ed3d-c824-4ed9-9572-ae9e784568cb.png/452x452sr.jpg',
    button_text: 'Ouvir agora',
    button_link: 'https://music.apple.com'
  },
  {
    id: 'fam-arcade-1',
    service: 'arcade',
    title: 'Hello Kitty Island Adventure',
    bg_color: '#f4f8fb',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/5b/b3/4a/5bb34a60-695c-a96f-75ec-8a957fc2a20b/45899847-e52c-44a1-9ce5-09aedebb7a78.png/940x528.jpg',
    button_text: 'Jogar agora',
    button_link: 'https://apps.apple.com'
  },
  {
    id: 'fam-fitness-1',
    service: 'fitness',
    title: 'David Bowie',
    bg_color: '#2d2a45',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features221/v4/c1/e6/09/c1e609c8-914d-6037-cda2-4cfdaf87a263/07eaa70a-574b-4abe-aea4-bcb530d837e3.png/940x528.jpg',
    button_text: 'Treinar agora',
    button_link: 'https://fitness.apple.com'
  },
  {
    id: 'fam-music-2',
    service: 'music',
    title: 'A-List Pop',
    bg_color: '#ea33c0',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/d2/c0/34/d2c034a9-4c6f-c97f-2cc8-85b056699f62/a6b27345-5c84-471f-99aa-c84fc695814e.png/452x452SC.DN01.jpg',
    button_text: 'Ouvir agora',
    button_link: 'https://music.apple.com'
  },
  {
    id: 'fam-arcade-2',
    service: 'arcade',
    title: 'PowerWash Simulator',
    bg_color: '#9fc6f4',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/53/55/d7/5355d758-e5b7-b406-f004-bb98d03ecb38/9388d284-2a0b-43e8-86e0-5852e8559d18.png/940x528.jpg',
    button_text: 'Jogar agora',
    button_link: 'https://apps.apple.com'
  },
  {
    id: 'fam-fitness-2',
    service: 'fitness',
    title: 'HIIT with Bakari',
    bg_color: '#56412b',
    bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Video221/v4/24/25/85/2425854a-14c7-fb09-533b-110aaf585363/HI_BW_0217_artwork_en_ID336111_0.png/940x528.jpg',
    button_text: 'Treinar agora',
    button_link: 'https://fitness.apple.com'
  }
]

export default function EndlessEntertainmentGallery({
  content = {},
  style = {},
  className = ''
}: EndlessEntertainmentGalleryProps) {
  const headline = content.headline || 'Endless entertainment.'
  const HeadlineTag = content.headlineTag || 'h2'
  const tvShows = Array.isArray(content.tvShows) && content.tvShows.length > 0 ? content.tvShows : DEFAULT_TV_SHOWS
  const famServices = Array.isArray(content.famServices) && content.famServices.length > 0 ? content.famServices : DEFAULT_FAM_SERVICES
  const autoplay = content.autoplay !== false
  const interval = Number(content.interval || 4160)

  const [activeTab, setActiveTab] = useState<'tv' | 'services'>(content.activeTab === 'services' ? 'services' : 'tv')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const timerRef = useRef<any>(null)

  const activeItems = activeTab === 'tv' ? tvShows : famServices

  useEffect(() => {
    if (currentSlide >= activeItems.length) {
      setCurrentSlide(0)
    }
  }, [activeTab, activeItems.length, currentSlide])

  useEffect(() => {
    if (!isPlaying || activeItems.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeItems.length)
    }, interval)
    return () => clearInterval(timerRef.current)
  }, [isPlaying, activeItems.length, interval])

  const togglePlay = () => {
    setIsPlaying(prev => !prev)
  }

  return (
    <div
      className={`endless-entertainment-root ${className}`.trim()}
      style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '40px 20px 60px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
        ...style
      }}
    >
      {/* ── HEADER DA GALERIA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <HeadlineTag
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 'var(--tkn-weight-medium)',
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.1
            }}
          >
            {headline}
          </HeadlineTag>

          {/* Abas de Navegação (TV / Serviços) */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255, 255, 255, 0.08)', padding: 4, borderRadius: 980 }}>
            <button
              onClick={() => { setActiveTab('tv'); setCurrentSlide(0); }}
              style={{
                background: activeTab === 'tv' ? '#ffffff' : 'transparent',
                color: activeTab === 'tv' ? '#000000' : '#86868b',
                border: 'none',
                padding: '6px 16px',
                borderRadius: 980,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Apple TV+ & Filmes
            </button>
            <button
              onClick={() => { setActiveTab('services'); setCurrentSlide(0); }}
              style={{
                background: activeTab === 'services' ? '#ffffff' : 'transparent',
                color: activeTab === 'services' ? '#000000' : '#86868b',
                border: 'none',
                padding: '6px 16px',
                borderRadius: 980,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Música, Arcade & Fitness
            </button>
          </div>
        </div>

        {/* ── DOT NAVIGATION & PLAY / PAUSE CONTROLS ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {activeItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                style={{
                  width: idx === currentSlide ? 32 : 10,
                  height: 10,
                  borderRadius: 980,
                  border: 'none',
                  background: idx === currentSlide ? '#ffffff' : 'rgba(255, 255, 255, 0.24)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              />
            ))}
          </div>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pausar reprodução' : 'Iniciar reprodução'}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── CAROUSEL VIEWPORT & SLIDER TRACK ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 24,
          background: '#161617',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div
          style={{
            display: 'flex',
            transform: `translateX(-${currentSlide * 100}%)`,
            transition: 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
            width: '100%'
          }}
        >
          {activeTab === 'tv' ? (
            tvShows.map((show, idx) => (
              <div
                key={show.id || idx}
                style={{
                  flex: '0 0 100%',
                  minWidth: '100%',
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  minHeight: '440px',
                  maxHeight: '560px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                {/* Imagem de Fundo do Show */}
                {show.bg_image && (
                  <img
                    src={show.bg_image}
                    alt={show.title}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1
                    }}
                  />
                )}

                {/* Scrim Overlay Cinematográfico */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.88) 100%)',
                    zIndex: 2
                  }}
                />

                {/* Logo Topo Direito / Esquerdo */}
                {show.logo_image && (
                  <div style={{ position: 'absolute', top: 32, left: 36, zIndex: 3, maxWidth: 180 }}>
                    <img src={show.logo_image} alt="" style={{ maxHeight: 44, width: 'auto', objectFit: 'contain' }} />
                  </div>
                )}

                {/* Conteúdo Inferior */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 3,
                    padding: '36px',
                    maxWidth: 640,
                    color: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {show.genre && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 'var(--tkn-weight-medium)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#B5F500'
                        }}
                      >
                        {show.genre}
                      </span>
                    )}
                    {show.brand && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                        • {show.brand}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: 'clamp(24px, 3.5vw, 38px)',
                      fontWeight: 'var(--tkn-weight-medium)',
                      margin: '0 0 10px',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15
                    }}
                  >
                    {show.title}
                  </h3>

                  {show.description && (
                    <p
                      style={{
                        fontSize: 'clamp(14px, 1.8vw, 17px)',
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: 1.4,
                        margin: '0 0 20px',
                        maxWidth: 520
                      }}
                    >
                      {show.description}
                    </p>
                  )}

                  <a
                    href={show.button_link || '#'}
                    onClick={e => { if (!show.button_link || show.button_link === '#') e.preventDefault(); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#ffffff',
                      color: '#000000',
                      padding: '10px 24px',
                      borderRadius: 980,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    {show.button_text || 'Assista agora'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            ))
          ) : (
            famServices.map((service, idx) => (
              <div
                key={service.id || idx}
                style={{
                  flex: '0 0 100%',
                  minWidth: '100%',
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  minHeight: '440px',
                  maxHeight: '560px',
                  background: service.bg_color || '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '48px',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                {/* Lado Esquerdo: Info e Botão */}
                <div style={{ position: 'relative', zIndex: 3, maxWidth: 480, color: '#ffffff' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 'var(--tkn-weight-medium)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: service.service === 'music' ? '#ff2d55' : service.service === 'arcade' ? '#ff9500' : '#30d158',
                      marginBottom: 12
                    }}
                  >
                    Apple {service.service.toUpperCase()}
                  </div>

                  <h3
                    style={{
                      fontSize: 'clamp(24px, 3.5vw, 36px)',
                      fontWeight: 'var(--tkn-weight-medium)',
                      letterSpacing: '-0.02em',
                      margin: '0 0 16px',
                      lineHeight: 1.2
                    }}
                  >
                    {service.title}
                  </h3>

                  <a
                    href={service.button_link || '#'}
                    onClick={e => { if (!service.button_link || service.button_link === '#') e.preventDefault(); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#ffffff',
                      color: '#000000',
                      padding: '10px 24px',
                      borderRadius: 980,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  >
                    {service.button_text || 'Explorar'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>

                {/* Lado Direito: Artwork Showcase */}
                {service.bg_image && (
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 3,
                      maxWidth: '45%',
                      borderRadius: 20,
                      overflow: 'hidden',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <img
                      src={service.bg_image}
                      alt={service.title}
                      style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
