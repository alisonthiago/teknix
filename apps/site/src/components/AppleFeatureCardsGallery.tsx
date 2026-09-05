import React, { useState, useEffect, useRef } from 'react'
import { getProducts } from '../services/products'

export interface FeatureCardItem {
  id: string
  topic: string
  headline: string
  bg_image?: string
  bg_color?: string
  text_theme?: 'dark' | 'light'
  link_url?: string
  modal_content?: string
}

export interface AppleFeatureCardsGalleryProps {
  content?: {
    headline?: string
    headline_align?: 'left' | 'center'
    data_source?: 'dynamic' | 'manual'
    source_type?: 'products' | 'categories' | 'manual'
    category?: string
    segment?: string
    limit?: number
    items?: FeatureCardItem[]
    // Carousel options
    slides_per_view_desktop?: number
    slides_per_view_mobile?: number
    slides_to_scroll?: number
    autoplay?: boolean
    autoplay_speed?: number
    pause_on_hover?: boolean
    show_arrows?: boolean
    arrows_position?: 'bottom-right' | 'top-right' | 'sides'
    card_height?: number
    container_layout?: 'bleed-right' | 'bleed-left' | 'full-width' | 'boxed' | string
    layout_mode?: string
    max_width?: string
    padding_left?: string
    padding_right?: string
  }
  style?: React.CSSProperties
  className?: string
}

export const DEFAULT_FEATURE_CARDS: FeatureCardItem[] = [
  {
    id: 'ipados-apps',
    topic: 'iPadOS + Apps',
    headline: 'Janelas flexíveis. O paraíso dos multitarefas.',
    bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_ipados__e45197f15_large.jpg',
    bg_color: '#000000',
    text_theme: 'dark',
    link_url: '#modal-ipados'
  },
  {
    id: 'apple-intelligence',
    topic: 'Apple Intelligence',
    headline: 'Útil sem esforço em todas as tarefas do dia.',
    bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_apple_intelligence__c2351ccf7_large.jpg',
    bg_color: '#000000',
    text_theme: 'dark',
    link_url: '#modal-ai'
  },
  {
    id: 'productivity',
    topic: 'Produtividade',
    headline: 'Seu local de trabalho agora é qualquer lugar.',
    bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_productivity__28abd3acd_large.jpg',
    bg_color: '#242b1d',
    text_theme: 'dark',
    link_url: '#modal-productivity'
  },
  {
    id: 'creativity',
    topic: 'Criatividade',
    headline: 'Liberte o artista que existe dentro de você.',
    bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_creativity__1b6fd91e5_large.jpg',
    bg_color: '#1a2238',
    text_theme: 'dark',
    link_url: '#modal-creativity'
  },
  {
    id: 'learning',
    topic: 'Aprendizado',
    headline: 'Sua sala de aula onde quer que você esteja.',
    bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_learning__b024858e9_large.jpg',
    bg_color: '#3d2b1f',
    text_theme: 'dark',
    link_url: '#modal-learning'
  },
  {
    id: 'entertainment',
    topic: 'Entretenimento',
    headline: 'Relaxe. Sintonize. Jogue sem limites.',
    bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_entertainment__c0c876924_large.jpg',
    bg_color: '#1b1c2e',
    text_theme: 'dark',
    link_url: '#modal-entertainment'
  },
  {
    id: 'apple-pencil',
    topic: 'Apple Pencil',
    headline: 'Imagine qualquer coisa. Anote na hora.',
    bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_pencil__6ef5e2dd2_large.jpg',
    bg_color: '#1d1d1f',
    text_theme: 'dark',
    link_url: '#modal-pencil'
  }
]

export default function AppleFeatureCardsGallery({
  content = {},
  style = {},
  className = ''
}: AppleFeatureCardsGalleryProps) {
  const headline = content.headline || 'Get to know iPad.'
  const headlineAlign = content.headline_align || 'left'
  const dataSource = content.data_source || 'manual'
  const cardHeight = Number(content.card_height || 620)
  const showArrows = content.show_arrows !== false
  const arrowsPosition = content.arrows_position || 'bottom-right'
  const slidesToScroll = Number(content.slides_to_scroll || 1)
  const autoplay = content.autoplay === true
  const autoplaySpeed = Number(content.autoplay_speed || 4000)
  const pauseOnHover = content.pause_on_hover !== false

  const [dbItems, setDbItems] = useState<FeatureCardItem[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeModalItem, setActiveModalItem] = useState<FeatureCardItem | null>(null)

  useEffect(() => {
    if (dataSource === 'dynamic') {
      let isMounted = true
      getProducts({
        category: content.category || content.segment,
        limit: content.limit || 8
      })
        .then(prods => {
          if (!isMounted) return
          if (prods && prods.length > 0) {
            const mapped: FeatureCardItem[] = prods.map((p: any) => ({
              id: p.id,
              topic: (p as any).category || (p as any).segment || 'Destaque',
              headline: p.name,
              bg_image: p.image_url || 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_ipados__e45197f15_large.jpg',
              bg_color: '#000000',
              text_theme: 'dark',
              link_url: `/${p.slug || 'produto/' + p.id}`,
              modal_content: (p as any).short_description || (p as any).description || ''
            }))
            setDbItems(mapped)
          } else {
            setDbItems(DEFAULT_FEATURE_CARDS)
          }
        })
        .catch(() => {
          if (isMounted) setDbItems(DEFAULT_FEATURE_CARDS)
        })
      return () => { isMounted = false }
    }
  }, [dataSource, content.category, content.segment, content.limit])

  const items = dataSource === 'dynamic' && dbItems.length > 0
    ? dbItems
    : (Array.isArray(content.items) && content.items.length > 0 ? content.items : DEFAULT_FEATURE_CARDS)

  // Autoplay
  useEffect(() => {
    if (!autoplay || (pauseOnHover && isHovered)) return
    const timer = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        const maxScroll = scrollWidth - clientWidth
        if (scrollLeft >= maxScroll - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          scrollRef.current.scrollBy({ left: 340 * slidesToScroll, behavior: 'smooth' })
        }
      }
    }, autoplaySpeed)
    return () => clearInterval(timer)
  }, [autoplay, autoplaySpeed, pauseOnHover, isHovered, slidesToScroll])

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = (dir === 'left' ? -340 : 340) * slidesToScroll
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  const containerLayout = content.container_layout || content.layout_mode || 'bleed-right'
  const containerMaxWidth = content.max_width || '1280px'
  const containerPaddingLeft = content.padding_left || ''
  const containerPaddingRight = content.padding_right || ''

  const getContainerStyle = (): React.CSSProperties => {
    if (containerLayout === 'bleed-right') {
      return {
        width: '100%',
        maxWidth: '100%',
        paddingLeft: containerPaddingLeft || 'max(24px, calc((100vw - 1280px) / 2 + 24px))',
        paddingRight: containerPaddingRight || '24px',
        boxSizing: 'border-box',
        margin: 0
      }
    }
    if (containerLayout === 'bleed-left') {
      return {
        width: '100%',
        maxWidth: '100%',
        paddingLeft: containerPaddingLeft || '24px',
        paddingRight: containerPaddingRight || 'max(24px, calc((100vw - 1280px) / 2 + 24px))',
        boxSizing: 'border-box',
        margin: 0
      }
    }
    if (containerLayout === 'full-width') {
      return {
        width: '100%',
        maxWidth: '100%',
        paddingLeft: containerPaddingLeft || '24px',
        paddingRight: containerPaddingRight || '24px',
        boxSizing: 'border-box',
        margin: 0
      }
    }
    return {
      maxWidth: containerMaxWidth,
      margin: '0 auto',
      paddingLeft: containerPaddingLeft || '24px',
      paddingRight: containerPaddingRight || '24px',
      boxSizing: 'border-box',
      width: '100%'
    }
  }

  return (
    <section
      className={`MarcomSection_section ${className}`.trim()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        padding: '72px 0 80px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
        ...style
      }}
    >
      <div style={getContainerStyle()}>
        {/* ── HEADER DA SEÇÃO ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 40, maxWidth: containerLayout === 'bleed-right' ? '1280px' : undefined }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 'var(--tkn-weight-medium)',
              letterSpacing: '-0.02em',
              color: '#1d1d1f',
              margin: 0,
              lineHeight: 1.1,
              textAlign: headlineAlign
            }}
          >
            {headline}
          </h2>

          {showArrows && arrowsPosition === 'top-right' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => scroll('left')}
                aria-label="Anterior"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: 'rgba(255,255,255,0.9)',
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
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: 'rgba(255,255,255,0.9)',
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

        {/* ── CARDS CAROUSEL SCROLLER ── */}
        <div style={{ position: 'relative' }}>
          {showArrows && arrowsPosition === 'sides' && (
            <>
              <button
                onClick={() => scroll('left')}
                aria-label="Anterior"
                style={{
                  position: 'absolute',
                  left: -16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1d1d1f'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                aria-label="Próximo"
                style={{
                  position: 'absolute',
                  right: -16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1d1d1f'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: 20,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              paddingBottom: 24,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {items.map((card, idx) => (
              <div
                key={card.id || idx}
                style={{
                  flex: '0 0 310px',
                  maxWidth: '350px',
                  minWidth: '280px',
                  height: `${cardHeight}px`,
                  borderRadius: 28,
                  position: 'relative',
                  overflow: 'hidden',
                  scrollSnapAlign: 'start',
                  backgroundColor: card.bg_color || '#000000',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '36px 30px',
                  boxSizing: 'border-box',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
                onClick={() => {
                  if (card.modal_content) {
                    setActiveModalItem(card)
                  } else if (card.link_url && card.link_url !== '#') {
                    window.location.href = card.link_url
                  }
                }}
              >
                {/* Background Image Artwork */}
                {card.bg_image && (
                  <img
                    src={card.bg_image}
                    alt={card.headline}
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

                {/* Scrim Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.6) 100%)',
                    zIndex: 2
                  }}
                />

                {/* Top Text Header */}
                <div style={{ position: 'relative', zIndex: 3 }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      textTransform: 'none',
                      letterSpacing: '-0.01em',
                      color: 'rgba(255, 255, 255, 0.8)',
                      margin: '0 0 10px'
                    }}
                  >
                    {card.topic}
                  </h3>

                  <p
                    style={{
                      fontSize: 'clamp(20px, 2.5vw, 26px)',
                      fontWeight: 'var(--tkn-weight-medium)',
                      lineHeight: '1.2',
                      letterSpacing: '-0.02em',
                      color: '#ffffff',
                      margin: 0
                    }}
                  >
                    {card.headline}
                  </p>
                </div>

                {/* Bottom Right Floating Circle Plus Action Button */}
                <div style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                      transition: 'transform 0.2s ease, background-color 0.2s ease'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M16 8.5h-4.5V4a1.5 1.5 0 0 0-3 0v4.5H4a1.5 1.5 0 0 0 0 3h4.5V16a1.5 1.5 0 0 0 3 0v-4.5H16a1.5 1.5 0 0 0 0-3z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM RIGHT PADDLE NAVIGATION ARROWS ── */}
        {showArrows && arrowsPosition === 'bottom-right' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => scroll('left')}
              aria-label="Anterior"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.12)',
                background: '#f5f5f7',
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
                background: '#f5f5f7',
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

      {/* ── MODAL DETALHES DO CARD ── */}
      {activeModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setActiveModalItem(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              maxWidth: 540,
              width: '100%',
              padding: '36px',
              position: 'relative',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalItem(null)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: '#f5f5f7',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#86868b', textTransform: 'uppercase' }}>
              {activeModalItem.topic}
            </span>
            <h3 style={{ fontSize: 24, fontWeight: 'var(--tkn-weight-medium)', margin: '8px 0 16px', color: '#1d1d1f' }}>
              {activeModalItem.headline}
            </h3>
            {activeModalItem.bg_image && (
              <img
                src={activeModalItem.bg_image}
                alt=""
                style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 16, marginBottom: 16 }}
              />
            )}
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#424245' }}>
              {activeModalItem.modal_content || 'Explore todos os recursos e detalhes completos em nossa loja.'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
