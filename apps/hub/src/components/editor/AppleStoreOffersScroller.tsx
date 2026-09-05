import React, { useRef } from 'react'

export interface OfferCardItem {
  id: string
  eyebrow: string
  eyebrow_color?: string
  title: string
  title_color?: string
  desc?: string
  image: string
  link?: string
  theme?: 'light' | 'dark'
  bg_color?: string
}

export interface AppleStoreOffersScrollerProps {
  content?: {
    headline_bold?: string
    headline_normal?: string
    headline_color?: string
    headline_size?: number
    items?: OfferCardItem[]
    card_width?: number
    card_height?: number
    card_border_radius?: number
    title_font_size?: number
    eyebrow_font_size?: number
    desc_font_size?: number
    show_nav_arrows?: boolean
  }
  style?: React.CSSProperties
  className?: string
}

export const DEFAULT_OFFER_ITEMS: OfferCardItem[] = [
  {
    id: 'offer-1',
    eyebrow: 'OFERTAS ESPECIAIS',
    eyebrow_color: '#6e6e73',
    title: 'Obtenha até R$ 1.100 de crédito em novas ferramentas com a troca do seu equipamento antigo.',
    desc: 'Confira ofertas para modelos elegíveis em qualquer condição.',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    link: '#',
    theme: 'light'
  },
  {
    id: 'offer-2',
    eyebrow: 'PROFISSIONAIS & INDÚSTRIA',
    eyebrow_color: '#6e6e73',
    title: 'Economize na compra de máquinas pesadas e kits completos TEKNIX.',
    desc: 'Preços e condições exclusivas para oficinas e autônomos.',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    link: '#',
    theme: 'light'
  },
  {
    id: 'offer-3',
    eyebrow: 'RECONDICIONADO CERTIFICADO',
    eyebrow_color: '#6e6e73',
    title: 'Compre ferramentas revisadas de fábrica com garantia oficial de 1 ano.',
    desc: 'Equipamentos testados rigorosamente e com desconto especial.',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80',
    link: '#',
    theme: 'light'
  },
  {
    id: 'offer-4',
    eyebrow: 'PEQUENAS EMPRESAS',
    eyebrow_color: '#86868b',
    title: 'Soluções completas e faturamento especial para o seu negócio crescer.',
    desc: '',
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80',
    link: '#',
    theme: 'dark',
    bg_color: '#000000'
  },
  {
    id: 'offer-5',
    eyebrow: 'CONTRATOS & FROTAS',
    eyebrow_color: '#6e6e73',
    title: 'Preços especiais e atendimento dedicado para compras corporativas e licitações.',
    desc: '',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    link: '#',
    theme: 'light'
  }
]

export default function AppleStoreOffersScroller({
  content = {},
  style = {},
  className = ''
}: AppleStoreOffersScrollerProps) {
  const headlineBold = content.headline_bold || 'Economias e ofertas.'
  const headlineNormal = content.headline_normal || 'Ofertas exclusivas, lojas especiais e muito mais.'
  const headlineColor = content.headline_color || '#1d1d1f'
  const headlineSize = content.headline_size ? `${content.headline_size}px` : 'clamp(26px, 3.5vw, 40px)'

  const items = Array.isArray(content.items) && content.items.length > 0 ? content.items : DEFAULT_OFFER_ITEMS

  const cardWidth = content.card_width ? `${content.card_width}px` : '380px'
  const cardHeight = content.card_height ? `${content.card_height}px` : '500px'
  const cardBorderRadius = content.card_border_radius !== undefined ? `${content.card_border_radius}px` : '24px'
  const titleFontSize = content.title_font_size ? `${content.title_font_size}px` : '24px'
  const eyebrowFontSize = content.eyebrow_font_size ? `${content.eyebrow_font_size}px` : '12px'
  const descFontSize = content.desc_font_size ? `${content.desc_font_size}px` : '14px'
  const showNavArrows = content.show_nav_arrows !== false

  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section
      className={`AppleStoreOffersScroller_section ${className}`.trim()}
      style={{
        backgroundColor: '#f5f5f7',
        padding: '64px 0 72px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
        ...style
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* ── HEADER DA SEÇÃO ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <h2
            style={{
              fontSize: headlineSize,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: headlineColor,
              margin: 0,
              lineHeight: 1.15
            }}
          >
            <span>{headlineBold} </span>
            <span style={{ color: '#6e6e73', fontWeight: 500 }}>{headlineNormal}</span>
          </h2>

          {showNavArrows && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => scroll('left')}
                aria-label="Anterior"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1d1d1f',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                aria-label="Próximo"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1d1d1f',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── CARROSSEL SCROLLER ── */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 24,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: 24,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {items.map((item, idx) => {
            const isDark = item.theme === 'dark'
            const cardBg = item.bg_color || (isDark ? '#000000' : '#ffffff')
            const textColor = item.title_color || (isDark ? '#f5f5f7' : '#1d1d1f')
            const eyebrowCol = item.eyebrow_color || (isDark ? '#86868b' : '#6e6e73')

            return (
              <a
                key={item.id || idx}
                href={item.link || '#'}
                style={{
                  flex: `0 0 ${cardWidth}`,
                  maxWidth: '420px',
                  minWidth: '320px',
                  height: cardHeight,
                  background: cardBg,
                  borderRadius: cardBorderRadius,
                  padding: '36px 32px 0',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  scrollSnapAlign: 'start',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
              >
                {/* Topo: Eyebrow, Título e Descrição */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  {item.eyebrow && (
                    <span
                      style={{
                        fontSize: eyebrowFontSize,
                        fontWeight: 700,
                        color: eyebrowCol,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'block',
                        marginBottom: 10
                      }}
                    >
                      {item.eyebrow}
                    </span>
                  )}
                  <h3
                    style={{
                      fontSize: titleFontSize,
                      fontWeight: 700,
                      color: textColor,
                      margin: '0 0 12px',
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {item.title}
                  </h3>
                  {item.desc && (
                    <p
                      style={{
                        fontSize: descFontSize,
                        lineHeight: '1.4',
                        color: isDark ? '#a1a1a6' : '#6e6e73',
                        margin: 0
                      }}
                    >
                      {item.desc}
                    </p>
                  )}
                </div>

                {/* Imagem de Fundo / Base */}
                <div
                  style={{
                    height: '240px',
                    margin: '0 -32px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: 1
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
