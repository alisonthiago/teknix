import React from 'react'

export interface ChapterNavItem {
  id: string
  label: string
  href?: string
  image_url?: string
  icon_name?: string
  badge?: string
  badge_color?: string
  badge_bg?: string
  is_new?: boolean
  analytics_title?: string
}

export interface ChapterNavContent {
  items?: ChapterNavItem[]
  align?: 'center' | 'flex-start' | 'space-between'
  item_gap?: number
  icon_height?: number
  show_badges?: boolean
  bg_color?: string
  text_color?: string
  hover_color?: string
}

export interface ChapterNavProps {
  content?: ChapterNavContent
  style?: React.CSSProperties
  className?: string
}

export const DEFAULT_CHAPTERNAV_ITEMS: ChapterNavItem[] = [
  {
    id: 'item-ipad-pro',
    label: 'iPad Pro',
    href: '/ipad-pro',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_pro_light__dyaaecs32huu_large.svg',
    analytics_title: 'ipad pro',
    badge: 'Novo',
    is_new: true
  },
  {
    id: 'item-ipad-air',
    label: 'iPad Air',
    href: '/ipad-air',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_air_light__d9omv1pt7fme_large.svg',
    analytics_title: 'ipad air',
    badge: 'Novo',
    is_new: true
  },
  {
    id: 'item-ipad-11',
    label: 'iPad',
    href: '/ipad',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_light__b1cl7u80agae_large.svg',
    analytics_title: 'ipad'
  },
  {
    id: 'item-ipad-mini',
    label: 'iPad mini',
    href: '/ipad-mini',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_mini_light__cq27f27i4gqu_large.svg',
    analytics_title: 'ipad mini',
    badge: 'Novo',
    is_new: true
  },
  {
    id: 'item-compare',
    label: 'Comparar',
    href: '/ipad/compare',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_compare_light__cxllcfpo8cqe_large.svg',
    analytics_title: 'compare'
  },
  {
    id: 'item-apple-pencil',
    label: 'Apple Pencil',
    href: '/apple-pencil',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/apple_pencil_light__e639uud77g2a_large.svg',
    analytics_title: 'apple pencil'
  },
  {
    id: 'item-keyboards',
    label: 'Teclados',
    href: '/ipad-keyboards',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_keyboards_light__burdcamwhzme_large.svg',
    analytics_title: 'keyboards'
  },
  {
    id: 'item-accessories',
    label: 'Acessórios',
    href: '/shop/accessories',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_accessories_light__f2trnfdsqeqi_large.svg',
    analytics_title: 'accessories'
  },
  {
    id: 'item-ipados',
    label: 'iPadOS 18',
    href: '/ipados',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipados_light__dbz66e04d4eu_large.svg',
    analytics_title: 'ipados',
    badge: 'Preview'
  },
  {
    id: 'item-shop-ipad',
    label: 'Comprar iPad',
    href: '/shop/ipad',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/shop_ipad_light__bw0vgwlj4e2u_large.svg',
    analytics_title: 'shop ipad'
  }
]

export default function ChapterNav({
  content = {},
  style = {},
  className = ''
}: ChapterNavProps) {
  const items = Array.isArray(content.items) && content.items.length > 0 ? content.items : DEFAULT_CHAPTERNAV_ITEMS
  const align = content.align || 'center'
  const itemGap = Number(content.item_gap ?? 32)
  const iconHeight = Number(content.icon_height ?? 54)
  const showBadges = content.show_badges !== false

  return (
    <nav
      className={`chapternav-wrapper ${className}`.trim()}
      aria-label="Navegação por capítulos de produtos"
      style={{
        width: '100%',
        backgroundColor: content.bg_color || 'transparent',
        padding: '16px 0 20px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        display: 'flex',
        justifyContent: align === 'flex-start' ? 'flex-start' : align === 'space-between' ? 'space-between' : 'center',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <ul
        className="ChapterNav_chapternav-items"
        style={{
          display: 'inline-flex',
          alignItems: 'flex-end',
          justifyContent: align,
          gap: `${itemGap}px`,
          margin: '0 auto',
          padding: '0 24px',
          listStyle: 'none',
          minWidth: 'max-content'
        }}
      >
        {items.map((item, idx) => (
          <li
            key={item.id || idx}
            className="ChapterNav_chapternav-item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <a
              href={item.href || '#'}
              data-analytics-title={item.analytics_title || item.label}
              onClick={e => {
                if (!item.href || item.href === '#') e.preventDefault()
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textDecoration: 'none',
                color: content.text_color || '#1d1d1f',
                transition: 'opacity 0.2s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.2s ease',
                position: 'relative',
                padding: '4px 6px'
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.opacity = '0.7'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.opacity = '1'
              }}
            >
              {/* Ícone ou Foto do Produto */}
              <figure
                style={{
                  margin: '0 0 8px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  height: `${iconHeight}px`,
                  minWidth: '36px'
                }}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    aria-hidden="true"
                    style={{
                      maxHeight: `${iconHeight}px`,
                      maxWidth: '80px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    onError={(e) => {
                      // Fallback visual minimalista caso a URL seja externa ou local customizada
                      ;(e.target as HTMLElement).style.opacity = '0.3'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: '#86868b'
                    }}
                  >
                    
                  </div>
                )}
              </figure>

              {/* Rótulo / Nome do Modelo */}
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: '1.25',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  color: content.text_color || '#1d1d1f'
                }}
              >
                <span>{item.label}</span>
              </p>

              {/* Badge (Novo / Preview) */}
              {showBadges && (item.badge || item.is_new) && (
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    lineHeight: '1',
                    fontWeight: 500,
                    color: item.badge_color || '#bf4800',
                    marginTop: '4px',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {item.badge || (item.is_new ? 'Novo' : '')}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
