import React, { useRef } from 'react'

export interface BenefitColumnItem {
  id?: string
  icon_type?: 'tradein' | 'truck' | 'creditcard' | 'bag' | 'emoji' | 'logo' | 'custom'
  icon_svg?: string
  icon_color?: string
  highlight_color?: string
  title_prefix?: string
  title_highlight?: string
  title_suffix?: string
  link?: string
}

export interface BenefitColumn {
  id?: string
  top_card: BenefitColumnItem
  bottom_card: BenefitColumnItem
}

export interface AppleStoreBenefitsScrollerProps {
  content?: {
    headline_bold?: string
    headline_normal?: string
    headline_color?: string
    headline_size?: number
    // Main featured card
    featured_badge?: string
    featured_title?: string
    featured_desc?: string
    featured_link?: string
    featured_link_text?: string
    featured_media_type?: 'video' | 'image'
    featured_media_url?: string
    featured_bg_color?: string
    featured_text_color?: string
    // Columns with stacked cards
    columns?: BenefitColumn[]
    // Card styles
    card_bg_color?: string
    card_border_radius?: number
    card_padding?: number
    card_text_size?: number
    card_text_color?: number | string
    show_nav_arrows?: boolean
  }
  style?: React.CSSProperties
  className?: string
}

export const DEFAULT_BENEFIT_COLUMNS: BenefitColumn[] = [
  {
    id: 'col-1',
    top_card: {
      id: 'card-1',
      icon_type: 'tradein',
      icon_color: '#0071e3',
      highlight_color: '#0071e3',
      title_prefix: '',
      title_highlight: 'Troque seu aparelho atual',
      title_suffix: ' e receba crédito para comprar um novo.',
      link: '#'
    },
    bottom_card: {
      id: 'card-2',
      icon_type: 'truck',
      icon_color: '#34c759',
      highlight_color: '#34c759',
      title_prefix: 'Desfrute ',
      title_highlight: 'de entrega expressa',
      title_suffix: ', frete grátis ou retirada rápida.',
      link: '#'
    }
  },
  {
    id: 'col-2',
    top_card: {
      id: 'card-3',
      icon_type: 'creditcard',
      icon_color: '#ff3b30',
      highlight_color: '#ff3b30',
      title_prefix: 'Pague à vista com desconto, parcelado ou faça ',
      title_highlight: 'financiamento facilitado.',
      title_suffix: '',
      link: '#'
    },
    bottom_card: {
      id: 'card-4',
      icon_type: 'bag',
      icon_color: '#0071e3',
      highlight_color: '#0071e3',
      title_prefix: 'Tenha uma experiência ',
      title_highlight: 'de compra personalizada',
      title_suffix: ' no site ou televendas.',
      link: '#'
    }
  },
  {
    id: 'col-3',
    top_card: {
      id: 'card-5',
      icon_type: 'emoji',
      icon_color: '#af52de',
      highlight_color: '#af52de',
      title_prefix: 'Personalize-os. ',
      title_highlight: 'Grave gratuitamente uma combinação de nomes e códigos.',
      title_suffix: '',
      link: '#'
    },
    bottom_card: {
      id: 'card-6',
      icon_type: 'logo',
      icon_color: '#ff9500',
      highlight_color: '#ff9500',
      title_prefix: 'Monte sua oficina e ',
      title_highlight: 'personalize seus kits',
      title_suffix: ' exclusivamente para você.',
      link: '#'
    }
  }
]

function renderIcon(type: string | undefined, color: string) {
  switch (type) {
    case 'tradein':
      return (
        <svg width="36" height="36" viewBox="0 0 40 56" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M38 29v10c0 3.86-3.14 7-7 7H9c-3.86 0-7-3.14-7-7v-4.75h-1.25l2.2-3.13 2.2 3.14H3.9v4.75c0 2.76 2.24 5 5 5h22c2.76 0 5-2.24 5-5V29" />
          <path d="M2 22V12c0-3.86 3.14-7 7-7h22c3.86 0 7 3.14 7 7v9.98" />
          <rect x="18" y="24" width="8" height="12" rx="2" />
        </svg>
      )
    case 'truck':
      return (
        <svg width="38" height="38" viewBox="0 0 49 56" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 15h23v24H5z" />
          <path d="M28 23h9l6 7v9h-15V23z" />
          <circle cx="12" cy="42" r="4" />
          <circle cx="37" cy="42" r="4" />
        </svg>
      )
    case 'creditcard':
      return (
        <svg width="38" height="38" viewBox="0 0 46 56" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="16" width="40" height="26" rx="4" />
          <line x1="3" y1="23" x2="43" y2="23" />
          <rect x="8" y="32" width="7" height="4" rx="1" fill={color} />
        </svg>
      )
    case 'bag':
      return (
        <svg width="34" height="34" viewBox="0 0 36 56" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="18" width="28" height="28" rx="5" />
          <path d="M12 18V13a6 6 0 0 1 12 0v5" />
          <circle cx="18" cy="29" r="3" fill={color} />
        </svg>
      )
    case 'emoji':
      return (
        <svg width="36" height="36" viewBox="0 0 40 56" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="20" cy="28" r="16" />
          <circle cx="15" cy="24" r="2" fill={color} />
          <circle cx="25" cy="24" r="2" fill={color} />
          <path d="M13 32c1.5 4 4.5 5 7 5s5.5-1 7-5" />
        </svg>
      )
    case 'logo':
    default:
      return (
        <svg width="34" height="34" viewBox="0 0 29 56" fill={color}>
          <path d="M14.9 14.4a2.6 2.6 0 0 1-.5 0 3.1 3.1 0 0 1-.1-.6 7.5 7.5 0 0 1 1.9-4.7 7.8 7.8 0 0 1 5.1-2.6 3.3 3.3 0 0 1 .1.7 7.7 7.7 0 0 1-1.8 4.8 6.7 6.7 0 0 1-4.7 2.4zm12.8 3.8a7.9 7.9 0 0 0-3.8 6.6 7.6 7.6 0 0 0 4.6 7 18.3 18.3 0 0 1-2.4 4.9c-1.5 2.1-3 4.3-5.4 4.3s-3-1.4-5.7-1.4c-2.7 0-3.6 1.4-5.8 1.4s-3.7-2-5.4-4.4A21.3 21.3 0 0 1 .4 25.2c0-6.7 4.4-10.3 8.7-10.3 2.3 0 4.2 1.5 5.6 1.5 1.4 0 3.5-1.6 6.1-1.6a8.2 8.2 0 0 1 6.9 3.4z" />
        </svg>
      )
  }
}

export default function AppleStoreBenefitsScroller({
  content = {},
  style = {},
  className = ''
}: AppleStoreBenefitsScrollerProps) {
  const headlineBold = content.headline_bold || 'O diferencial da TEKNIX.'
  const headlineNormal = content.headline_normal || 'Mais razões para comprar conosco.'
  const headlineColor = content.headline_color || '#1d1d1f'
  const headlineSize = content.headline_size ? `${content.headline_size}px` : 'clamp(26px, 3.5vw, 40px)'

  const featuredBadge = content.featured_badge || 'NOVO'
  const featuredTitle = content.featured_title || 'TEKNIX Pro Upgrade'
  const featuredDesc = content.featured_desc || 'Adquira as melhores ferramentas com pagamentos mensais reduzidos e condições exclusivas.'
  const featuredMediaType = content.featured_media_type || 'video'
  const featuredMediaUrl = content.featured_media_url || 'https://store.storevideos.cdn-apple.com/v1/store.apple.com/st/1784672018526/store-card-40-upgrade-202607-vid1.mp4'
  const featuredBgColor = content.featured_bg_color || '#ffffff'
  const featuredTextColor = content.featured_text_color || '#1d1d1f'

  const columns = Array.isArray(content.columns) && content.columns.length > 0 ? content.columns : DEFAULT_BENEFIT_COLUMNS

  const cardBgColor = content.card_bg_color || '#ffffff'
  const cardBorderRadius = content.card_border_radius !== undefined ? `${content.card_border_radius}px` : '20px'
  const cardPadding = content.card_padding ? `${content.card_padding}px` : '28px'
  const cardTextSize = content.card_text_size ? `${content.card_text_size}px` : '17px'
  const cardTextColor = typeof content.card_text_color === 'string' ? content.card_text_color : '#1d1d1f'
  const showNavArrows = content.show_nav_arrows !== false

  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section
      className={`AppleStoreBenefitsScroller_section ${className}`.trim()}
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
          {/* 1. CARD GRANDE / FEATURED CARD (40 SIZE) */}
          <div
            style={{
              flex: '0 0 320px',
              maxWidth: '340px',
              minWidth: '290px',
              height: '460px',
              background: featuredBgColor,
              borderRadius: cardBorderRadius,
              padding: '32px 28px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              scrollSnapAlign: 'start',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              {featuredBadge && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#bf4800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: 6
                  }}
                >
                  {featuredBadge}
                </span>
              )}
              <h3
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: featuredTextColor,
                  margin: '0 0 10px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em'
                }}
              >
                {featuredTitle}
              </h3>
              {featuredDesc && (
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.4',
                    color: '#6e6e73',
                    margin: 0
                  }}
                >
                  {featuredDesc}
                </p>
              )}
            </div>

            {/* Mídia inferior (Vídeo em loop ou Imagem) */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '240px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                overflow: 'hidden',
                zIndex: 1
              }}
            >
              {featuredMediaType === 'video' ? (
                <video
                  src={featuredMediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none'
                  }}
                />
              ) : (
                <img
                  src={featuredMediaUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'}
                  alt={featuredTitle}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>
          </div>

          {/* 2. COLUNAS DE 2 CARDS EMPILHADOS (17 SIZE) */}
          {columns.map((col, cIdx) => (
            <div
              key={col.id || cIdx}
              style={{
                flex: '0 0 290px',
                maxWidth: '310px',
                minWidth: '270px',
                height: '460px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                scrollSnapAlign: 'start'
              }}
            >
              {/* Card Superior */}
              <a
                href={col.top_card.link || '#'}
                style={{
                  flex: 1,
                  background: cardBgColor,
                  borderRadius: cardBorderRadius,
                  padding: cardPadding,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {renderIcon(col.top_card.icon_type, col.top_card.icon_color || '#0071e3')}
                </div>
                <div
                  style={{
                    fontSize: cardTextSize,
                    fontWeight: 600,
                    lineHeight: '1.3',
                    color: cardTextColor,
                    letterSpacing: '-0.01em'
                  }}
                >
                  <span>{col.top_card.title_prefix}</span>
                  <span style={{ color: col.top_card.highlight_color || '#0071e3' }}>
                    {col.top_card.title_highlight}
                  </span>
                  <span>{col.top_card.title_suffix}</span>
                </div>
              </a>

              {/* Card Inferior */}
              <a
                href={col.bottom_card.link || '#'}
                style={{
                  flex: 1,
                  background: cardBgColor,
                  borderRadius: cardBorderRadius,
                  padding: cardPadding,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {renderIcon(col.bottom_card.icon_type, col.bottom_card.icon_color || '#34c759')}
                </div>
                <div
                  style={{
                    fontSize: cardTextSize,
                    fontWeight: 600,
                    lineHeight: '1.3',
                    color: cardTextColor,
                    letterSpacing: '-0.01em'
                  }}
                >
                  <span>{col.bottom_card.title_prefix}</span>
                  <span style={{ color: col.bottom_card.highlight_color || '#34c759' }}>
                    {col.bottom_card.title_highlight}
                  </span>
                  <span>{col.bottom_card.title_suffix}</span>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
