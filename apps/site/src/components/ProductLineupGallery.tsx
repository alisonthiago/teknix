import React, { useState, useEffect, useRef } from 'react'
import { getProducts } from '../services/products'

export interface ProductTileItem {
  id: string
  title: string
  image: string
  copy?: string
  price?: string | number
  installments?: string
  badge?: string
  link_saber?: string
  link_comprar?: string
  colors?: string[]
}

export interface ProductLineupGalleryProps {
  content?: {
    headline?: string
    compare_text?: string
    compare_link?: string
    data_source?: 'dynamic' | 'manual'
    category?: string
    segment?: string
    limit?: number
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'relevance'
    items?: ProductTileItem[]
    show_swatches?: boolean
    show_nav_arrows?: boolean
    title_max_chars?: number
    copy_max_chars?: number
    headline_color?: string
    headline_size?: number
    compare_color?: string
    compare_size?: number
    card_bg_color?: string
    card_border_color?: string
    card_border_radius?: number
    card_width?: number
    card_padding?: number
    badge_color?: string
    badge_font_size?: number
    title_color?: string
    title_font_size?: number
    image_height?: number
    copy_color?: string
    copy_font_size?: number
    price_color?: string
    price_font_size?: number
    installments_color?: string
    installments_font_size?: number
    btn_saber_bg?: string
    btn_saber_color?: string
    btn_saber_font_size?: number
    btn_saber_radius?: number
    btn_comprar_color?: string
    btn_comprar_font_size?: number
  }
  style?: React.CSSProperties
  className?: string
}

function truncateText(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text
  return text.slice(0, maxChars).trimEnd() + '…'
}

export const DEFAULT_LINEUP_ITEMS: ProductTileItem[] = [
  {
    id: 'demo-1',
    title: 'Parafusadeira e Furadeira 12V Bivolt TEKNIX',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    copy: 'Máxima precisão e autonomia para montagens e manutenções pesadas.',
    price: 'A partir de R$ 299,90',
    installments: 'ou 12x de R$ 24,99 sem juros',
    badge: 'Mais Vendido',
    link_saber: '/ferramentas/demo-1',
    link_comprar: '/checkout?product=demo-1',
    colors: ['#0071e3', '#1d1d1f', '#d7e5e6']
  },
  {
    id: 'demo-2',
    title: 'Esmerilhadeira Angular 4.1/2" 850W TEKNIX Pro',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    copy: 'Corte rápido, sem rebarbas e com alta durabilidade em metais e alvenaria.',
    price: 'A partir de R$ 389,00',
    installments: 'ou 12x de R$ 32,41 sem juros',
    badge: 'Lançamento',
    link_saber: '/ferramentas/demo-2',
    link_comprar: '/checkout?product=demo-2',
    colors: ['#1d1d1f', '#0071e3']
  },
  {
    id: 'demo-3',
    title: 'Serra Mármore 1400W Alta Potência TEKNIX',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80',
    copy: 'Desempenho industrial e cortes precisos em porcelanatos e mármores.',
    price: 'A partir de R$ 449,00',
    installments: 'ou 12x de R$ 37,41 sem juros',
    badge: 'Destaque',
    link_saber: '/ferramentas/demo-3',
    link_comprar: '/checkout?product=demo-3',
    colors: ['#0071e3', '#e3ded9']
  },
  {
    id: 'demo-4',
    title: 'Kit Maleta de Ferramentas 111 Peças TEKNIX',
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80',
    copy: 'Kit profissional completo em maleta reforçada com soquetes e bits.',
    price: 'A partir de R$ 189,90',
    installments: 'ou 12x de R$ 15,82 sem juros',
    badge: 'Oferta',
    link_saber: '/ferramentas/demo-4',
    link_comprar: '/checkout?product=demo-4',
    colors: ['#1d1d1f', '#0071e3', '#6b696e']
  }
]

export default function ProductLineupGallery({
  content = {},
  style = {},
  className = ''
}: ProductLineupGalleryProps) {
  const headline = content.headline || 'Explore a linha completa.'
  const compareText = content.compare_text ?? 'Comparar todos os modelos'
  const compareLink = content.compare_link || '/comparar'
  const dataSource = content.data_source || 'dynamic'
  const showNavArrows = content.show_nav_arrows !== false
  const showSwatches = content.show_swatches !== false
  const titleMaxChars = content.title_max_chars || 30
  const copyMaxChars = content.copy_max_chars || 80

  // Style properties
  const headlineColor = content.headline_color || '#1d1d1f'
  const headlineSize = content.headline_size ? `${content.headline_size}px` : 'clamp(32px, 4.5vw, 48px)'
  const compareColor = content.compare_color || '#0071e3'
  const compareSize = content.compare_size ? `${content.compare_size}px` : '15px'
  const cardBgColor = content.card_bg_color || '#ffffff'
  const cardBorderColor = content.card_border_color || 'rgba(0,0,0,0.06)'
  const cardBorderRadius = content.card_border_radius !== undefined ? `${content.card_border_radius}px` : '24px'
  const cardWidth = content.card_width ? `${content.card_width}px` : '320px'
  const cardPadding = content.card_padding ? `${content.card_padding}px` : '36px 28px 32px'
  const badgeColor = content.badge_color || '#bf4800'
  const badgeFontSize = content.badge_font_size ? `${content.badge_font_size}px` : '11px'
  const titleColor = content.title_color || '#1d1d1f'
  const titleFontSize = content.title_font_size ? `${content.title_font_size}px` : '26px'
  const imageHeight = content.image_height ? `${content.image_height}px` : '240px'
  const copyColor = content.copy_color || '#1d1d1f'
  const copyFontSize = content.copy_font_size ? `${content.copy_font_size}px` : '14px'
  const priceColor = content.price_color || '#1d1d1f'
  const priceFontSize = content.price_font_size ? `${content.price_font_size}px` : '14px'
  const installmentsColor = content.installments_color || '#86868b'
  const installmentsFontSize = content.installments_font_size ? `${content.installments_font_size}px` : '12px'
  const btnSaberBg = content.btn_saber_bg || '#0071e3'
  const btnSaberColor = content.btn_saber_color || '#ffffff'
  const btnSaberFontSize = content.btn_saber_font_size ? `${content.btn_saber_font_size}px` : '13px'
  const btnSaberRadius = content.btn_saber_radius !== undefined ? `${content.btn_saber_radius}px` : '980px'
  const btnComprarColor = content.btn_comprar_color || '#0071e3'
  const btnComprarFontSize = content.btn_comprar_font_size ? `${content.btn_comprar_font_size}px` : '13px'

  const [dbProducts, setDbProducts] = useState<ProductTileItem[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dataSource === 'dynamic') {
      let isMounted = true
      getProducts({
        category: content.category || content.segment,
        sort: content.sort || 'relevance',
        limit: content.limit || 8
      })
        .then(prods => {
          if (!isMounted) return
          if (prods && prods.length > 0) {
            const mapped: ProductTileItem[] = prods.map((p: any) => {
              const priceNum = Number((p as any).sell_price || (p as any).price || (p as any).sale_price || 0)
              const inst = priceNum > 0 ? `ou 12x de R$ ${(priceNum / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros` : ''
              const mainImage = p.image_url
                || (p as any).main_image
                || (Array.isArray((p as any).images) && (p as any).images.length > 0 ? (p as any).images[0] : '')
                || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'
              return {
                id: p.id,
                title: p.name,
                image: mainImage,
                copy: (p as any).short_description || (p as any).description || '',
                price: priceNum > 0 ? `A partir de R$ ${priceNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Consulte o valor',
                installments: inst,
                badge: (p as any).badge || (p.created_at && (Date.now() - new Date(p.created_at).getTime() < 30 * 24 * 3600 * 1000) ? 'Novo' : ''),
                link_saber: `/produtos/${p.slug || p.id}`,
                link_comprar: `/checkout?product=${p.id}`,
                colors: (p as any).colors || []
              }
            })
            setDbProducts(mapped)
          } else {
            setDbProducts(DEFAULT_LINEUP_ITEMS)
          }
        })
        .catch(() => {
          if (isMounted) setDbProducts(DEFAULT_LINEUP_ITEMS)
        })
      return () => { isMounted = false }
    }
  }, [dataSource, content.category, content.segment, content.limit, content.sort])

  const items = dataSource === 'dynamic' && dbProducts.length > 0
    ? dbProducts
    : (Array.isArray(content.items) && content.items.length > 0 ? content.items : DEFAULT_LINEUP_ITEMS)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section
      className={`ProductTileGallery_section ${className}`.trim()}
      style={{
        backgroundColor: '#f5f5f7',
        padding: '72px 0 80px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
        ...style
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* ── HEADER DA SEÇÃO ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: headlineSize,
              fontWeight: 'var(--tkn-weight-medium)',
              letterSpacing: '-0.02em',
              color: headlineColor,
              margin: 0,
              lineHeight: 1.1
            }}
          >
            {headline}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {compareText && (
              <a
                href={compareLink}
                style={{
                  fontSize: compareSize,
                  color: compareColor,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 400
                }}
              >
                <span>{compareText}</span>
                <span style={{ fontSize: '13px' }}>›</span>
              </a>
            )}

            {showNavArrows && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => scroll('left')}
                  aria-label="Anterior"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.15)',
                    background: 'rgba(255,255,255,0.8)',
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
                    border: '1px solid rgba(0,0,0,0.15)',
                    background: 'rgba(255,255,255,0.8)',
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
        </div>

        {/* ── CARROSSEL DE CARDS ── */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 24,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: 24,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            marginRight: 'calc(50% - 50vw)',
            paddingRight: 'calc(50vw - 50% + 24px)'
          }}
        >
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                flex: `0 0 ${cardWidth}`,
                maxWidth: '360px',
                minWidth: '280px',
                background: cardBgColor,
                borderRadius: cardBorderRadius,
                padding: cardPadding,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                scrollSnapAlign: 'start',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                border: `1px solid ${cardBorderColor}`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
            >
              {/* Topo: Badge & Título */}
              <div>
                <div style={{ minHeight: 20, marginBottom: 4 }}>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: badgeFontSize,
                        fontWeight: 600,
                        color: badgeColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: titleFontSize,
                    fontWeight: 'var(--tkn-weight-medium)',
                    color: titleColor,
                    margin: '0 0 16px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15
                  }}
                >
                  {truncateText(item.title, titleMaxChars)}
                </h3>

                {/* Imagem do Produto Protagonista */}
                <a
                  href={item.link_saber || '#'}
                  style={{
                    display: 'block',
                    height: imageHeight,
                    margin: '12px 0 20px',
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'}
                    alt={item.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'
                    }}
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      margin: '0 auto',
                      display: 'block'
                    }}
                  />
                </a>

                {/* Color Swatches */}
                {showSwatches && Array.isArray(item.colors) && item.colors.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                    {item.colors.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: c,
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08)'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Tagline / Descrição Curta */}
                {item.copy && (
                  <p
                    style={{
                      fontSize: copyFontSize,
                      lineHeight: '1.4',
                      color: copyColor,
                      fontWeight: 500,
                      margin: '0 0 16px',
                      minHeight: '40px'
                    }}
                  >
                    {truncateText(item.copy, copyMaxChars)}
                  </p>
                )}

                {/* Preço e Parcelamento */}
                <div style={{ minHeight: '44px', marginBottom: 24, borderTop: '1px solid #e8e8ed', paddingTop: 16 }}>
                  {item.price && (
                    <div style={{ fontSize: priceFontSize, fontWeight: 600, color: priceColor }}>
                      {item.price}
                    </div>
                  )}
                  {item.installments && (
                    <div style={{ fontSize: installmentsFontSize, color: installmentsColor, marginTop: 2 }}>
                      {item.installments}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé: Botão Saber mais e Link Comprar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto' }}>
                <a
                  href={item.link_saber || '#'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: btnSaberBg,
                    color: btnSaberColor,
                    padding: '8px 18px',
                    borderRadius: btnSaberRadius,
                    fontSize: btnSaberFontSize,
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'background 0.2s ease'
                  }}
                >
                  Saber mais
                </a>

                <a
                  href={item.link_comprar || '#'}
                  style={{
                    fontSize: btnComprarFontSize,
                    color: btnComprarColor,
                    textDecoration: 'none',
                    fontWeight: 400,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>Comprar</span>
                  <span style={{ fontSize: '12px' }}>›</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
