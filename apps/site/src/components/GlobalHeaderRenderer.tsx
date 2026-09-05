import React, { useState } from 'react'
import {
  ShoppingBag, X, Edit3, Settings,
  Home, User, Heart, Bell, Star, LogOut, ChevronRight, Globe, HelpCircle,
  Share2, MessageCircle, Play, Camera, Zap, LayoutGrid
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './GlobalHeaderFooter.css'

function TeknixLogoSVG({ height = 18 }: { height?: number }) {
  return (
    <svg viewBox="0 0 113.98 26.81" fill="currentColor" style={{ height, width: 'auto', display: 'block' }}>
      <g>
        <polygon points="56.95 26.15 52.21 26.19 49.52 22.34 46.09 17.51 43.48 20.03 43.46 26.2 39.44 26.2 39.44 .97 43.47 .96 43.46 8.58 43.48 15.21 51.4 7.36 56.59 7.39 48.85 14.95 56.95 26.15" />
        <path d="M108.37,23.32v2.92c-1.43.03-2.67.06-3.99-.35-1.52-.47-2.96-1.36-3.93-2.62l-2.33-3.01-1.92,2.5c-2.19,2.85-4.83,3.73-8.34,3.46v-4.11s1.05-.05,1.05-.05c1.62.13,3.09-.56,4.07-1.81l2.65-3.39-6.67-8.75c-.13-.17-.09-.58-.02-.78h4.17s5,6.3,5,6.3l2.55-3.22,2.47-3.08h4c.29.46.05.9-.23,1.27l-1.28,1.63-5.04,6.64,2.87,3.61c.77.97,1.9,1.47,3.1,1.59h1.8s.02,1.25.02,1.25Z" />
        <path d="M73.33,16.07c0-2.87-2.11-5.18-4.91-5.42s-5.53,1.78-5.67,4.7l-.08,10.84h-4.03s0-10.25,0-10.25c-.05-3.9,2.25-7.33,5.86-8.8,5.04-2.05,10.8.7,12.44,5.9.25.8.32,1.59.4,2.44v10.71s-4,.01-4,.01v-10.14Z" />
        <path d="M30.76,22.09c.85-.54,1.36-1.25,1.75-2.1l4.25-.02c-1.16,3.7-4.45,6.33-8.32,6.78-3.61.42-7.13-.96-9.32-3.89s-2.66-6.84-1.08-10.29c1.38-3.01,4.26-5.3,7.79-5.81,4.59-.66,8.98,1.97,10.63,6.32.61,1.61.78,3.31.63,4.98h-15.86c.15,1.19.6,2.15,1.38,3.02,2.04,2.26,5.53,2.68,8.14,1.01ZM33,14.94c-.33-1.55-1.15-2.63-2.23-3.48-2.31-1.51-5.23-1.46-7.44.24-1.02.78-1.71,1.92-2.06,3.25h11.73Z" />
        <path d="M15.99,26.22l-4.32-.04c-3.82-.04-6.97-3.46-6.99-6.94l-.05-8.69c0-.45-.36-.84-.81-.85l-3.82-.02v-4.29s2.76.01,2.76.01c3.36.19,6.11,2.9,6.14,6.26l.07,7.03c.02,2.11,2.06,3.26,3.97,3.25l3.06-.02-.02,4.3Z" />
        <path d="M15.76,4.67l.02,4.17-3.43-.03c-3.15-.21-5.64-2.77-5.88-5.9L6.42,0h4.35s0,3.8,0,3.8c.06.49.37.86.86.87h4.13Z" />
        <rect x="81.41" y="7.34" width="4.08" height="18.87" />
        <polygon points="85.48 5.19 81.42 5.17 81.42 .98 85.48 .96 85.48 5.19" />
        <g>
          <path d="M111.95,4.58l.05.03c1.07.16,1.87,1.01,1.98,2.06v.46c-.13,1.16-1.09,2.06-2.25,2.09-1.42.04-2.55-1.21-2.35-2.65.17-1.03.95-1.81,1.98-1.96l.03-.02h.57ZM113.51,6.89c0-1.02-.83-1.84-1.84-1.84s-1.84.83-1.84,1.84.83,1.84,1.84,1.84,1.84-.83,1.84-1.84Z" />
          <path d="M112.83,8.05h-.67s-.34-.7-.34-.7c-.06-.13-.19-.21-.33-.21h-.22s0,.91,0,.91h-.63s0-2.42,0-2.42h1.11c.19,0,.38.07.54.16.17.13.22.31.22.51,0,.29-.15.52-.45.61.16.08.25.16.34.29l.42.85ZM111.91,6.39c0-.18-.1-.3-.27-.3h-.36s0,.62,0,.62h.37c.17-.02.26-.15.26-.32Z" />
        </g>
      </g>
    </svg>
  )
}

export type HeaderModel = 'apple_dark' | 'apple_light' | 'industrial_pro' | 'ecommerce_search'
export type MobileMenuModel =
  | 'apple_drawer'
  | 'categories_accordion'
  | 'dark_pro'
  | 'compact_grid'
  | 'profile_blue_drawer'
  | 'profile_purple_drawer'
  | 'fullscreen_overlay'
  | 'dark_settings_drawer'
  | 'clean_light_drawer'
  | 'light_tabbed_drawer'
  | 'tab_grid_bottom'
  | 'grouped_sections_drawer'

export interface HeaderConfig {
  model?: HeaderModel
  mobileModel?: MobileMenuModel
  showLogo?: boolean
  logoType?: 'icon' | 'full_logo' | 'text' | 'tek_icon_text' | 'image' | 'none'
  logoSource?: 'svg' | 'image'
  logoIconType?: 'svg' | 'image'
  logoFullType?: 'image' | 'svg'
  logoSvgCode?: string
  logoIconImage?: string
  logoImage?: string
  logoText?: string
  logoHeight?: number | string
  logoWidth?: number | string
  logoIconSize?: number | string
  logoFontSize?: number | string
  mobileForceIcon?: boolean
  links?: { label: string; url: string; badge?: string }[]
  showSearch?: boolean
  showBag?: boolean
  showAccount?: boolean
  bgColor?: string
  textColor?: string
  isSticky?: boolean
  stickyOffset?: number
  stickyDuration?: number
  stickyDelay?: number
  stickyEffect?: 'immediate' | 'fade' | 'slide'
  stickyOnScrollUp?: boolean
  stickyOnDesktop?: boolean
  stickyOnTablet?: boolean
  stickyOnMobile?: boolean
  stickyBlur?: boolean
  isLocalOnly?: boolean
  showAnnouncementRibbon?: boolean
  announcementText?: string
  announcementLink?: string
  // ─── Bag Dropdown Popup Customization ───
  bagDropdownBgColor?: string
  bagDropdownTextColor?: string
  bagDropdownBorderColor?: string
  bagDropdownTitle?: string
  bagDropdownShopLinkText?: string
  bagDropdownShopLinkUrl?: string
  // ─── Extended Advanced / Style Properties ───
  headerHeight?: number | string
  headerWidthMode?: 'boxed' | 'full'
  headerMaxWidth?: number | string
  headerTransparent?: boolean
  menuItemGap?: number | string
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  textTransform?: string
  letterSpacing?: string
  lineHeight?: string
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string
  zIndex?: number | string
  cssId?: string
  cssClasses?: string
}

const DEFAULT_HEADER_LINKS: { label: string; url: string; badge?: string }[] = [
  { label: 'Store', url: '/produtos' },
  { label: 'Mac', url: '/mac' },
  { label: 'iPad', url: '/ipad' },
  { label: 'iPhone', url: '/iphone' },
  { label: 'Watch', url: '/watch' },
  { label: 'Vision', url: '/vision' },
  { label: 'AirPods', url: '/airpods' },
  { label: 'TV & Home', url: '/produtos?cat=tv-home' },
  { label: 'Entertainment', url: '/produtos' },
  { label: 'Accessories', url: '/produtos?cat=acessorios' },
  { label: 'Support', url: '/contato' },
]

interface Props {
  config?: HeaderConfig
  viewportMode?: string
  isEditor?: boolean
  isSelected?: boolean
  onSelect?: () => void
  onChangeConfig?: (newConfig: HeaderConfig) => void
  onHideHeader?: () => void
  onOpenLibrary?: () => void
}

export default function GlobalHeaderRenderer({
  config = {},
  viewportMode = 'desktop',
  isEditor = false,
  isSelected = false,
  onSelect
}: Props) {
  const { user } = useAuth()
  const model: HeaderModel = config.model || 'apple_light'
  const mobileModel: MobileMenuModel = config.mobileModel || 'apple_drawer'
  const links = config.links || DEFAULT_HEADER_LINKS
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [bagDropdownOpen, setBagDropdownOpen] = useState(false)
  const isMobileViewport = viewportMode === 'mobile' || viewportMode === 'tablet'
  const [isScrolled, setIsScrolled] = useState(false)
  const [showScrollUp, setShowScrollUp] = useState(true)
  const lastScrollY = React.useRef(0)
  const accountName = String(
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    ''
  ).trim().split(/\s+/)[0]

  const isSticky = config.isSticky !== false // Ativo por padrão se não desativado
  const stickyOffset = config.stickyOffset || 0
  const stickyEffect = config.stickyEffect || 'fade'
  const stickyOnScrollUp = !!config.stickyOnScrollUp

  // Scroll listener for sticky header behavior
  React.useEffect(() => {
    const handleScroll = (scrollY: number) => {
      const currentY = scrollY
      const pastOffset = currentY > stickyOffset

      setIsScrolled(pastOffset)

      if (stickyOnScrollUp) {
        if (currentY > lastScrollY.current && currentY > 80) {
          setShowScrollUp(false)
        } else {
          setShowScrollUp(true)
        }
      } else {
        setShowScrollUp(true)
      }

      lastScrollY.current = currentY
    }

    const onWindowScroll = () => handleScroll(window.scrollY)

    // Also listen to canvas scroll wrapper in editor
    const canvasWrapper = document.querySelector('.elementor-canvas-wrapper')
    const onCanvasScroll = () => {
      if (canvasWrapper) handleScroll(canvasWrapper.scrollTop)
    }

    window.addEventListener('scroll', onWindowScroll, { passive: true })
    if (canvasWrapper) canvasWrapper.addEventListener('scroll', onCanvasScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onWindowScroll)
      if (canvasWrapper) canvasWrapper.removeEventListener('scroll', onCanvasScroll)
    }
  }, [stickyOffset, stickyOnScrollUp])

  const stickyDuration = config.stickyDuration ?? 350
  const stickyDelay = config.stickyDelay ?? 0

  return (
    <div
      id={config.cssId || undefined}
      className={`teknix-global-header-wrapper header-model-${model} ${config.cssClasses || ''} ${isSelected ? 'editor-selected' : ''} ${isSticky ? 'sticky-enabled' : ''} ${isScrolled ? 'is-scrolled' : ''} ${!showScrollUp ? 'hide-scroll-up' : ''} effect-${stickyEffect}`}
      style={{
        marginTop: config.marginTop ? `${config.marginTop}px` : undefined,
        marginRight: config.marginRight ? `${config.marginRight}px` : undefined,
        marginBottom: config.marginBottom ? `${config.marginBottom}px` : undefined,
        marginLeft: config.marginLeft ? `${config.marginLeft}px` : undefined,
        zIndex: config.zIndex !== undefined && config.zIndex !== '' ? Number(config.zIndex) : undefined,
        ['--sticky-duration' as any]: `${stickyDuration}ms`,
        ['--sticky-delay' as any]: `${stickyDelay}ms`,
      }}
      onDoubleClick={(e) => {
        if (isEditor && onSelect) {
          e.stopPropagation()
          onSelect()
        }
      }}
      onClick={(e) => {
        if (isEditor && onSelect) {
          e.stopPropagation()
          onSelect()
        }
      }}
    >
      {/* ── ELEMENTOR 1:1 HOVER HANDLE (Aparece no topo ao passar o mouse) ── */}
      {isEditor && (
        <ul
          className={`elementor-editor-element-settings elementor-editor-container-settings elementor-editor-element-overlay-settings elementor-header-hover-handle ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.()
          }}
          title="Clique para editar o Header"
        >
          <li
            className="elementor-editor-element-setting elementor-editor-element-edit ui-sortable-handle"
            aria-label="Editar Header"
          >
            <Edit3 size={10} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Editar</span>
          </li>
        </ul>
      )}

      {/* ── ANNOUNCEMENT TOP RIBBON (Opcional) ── */}
      {config.showAnnouncementRibbon && (
        <div className="apple-announcement-ribbon">
          <span>{config.announcementText || 'Estamos doando US$ 10 para cada compra com Apple Pay na TEKNIX'}</span>
          {config.announcementLink && <a href={config.announcementLink}>Compre agora &gt;</a>}
        </div>
      )}

      {/* ── HEADER NAVIGATION BAR ── */}
      <header
        className={`apple-global-header model-${model}`}
        style={{
          background: config.headerTransparent
            ? 'transparent'
            : config.bgColor || undefined,
          color: config.textColor || undefined,
          fontFamily: config.fontFamily || undefined,
          fontSize: config.fontSize ? (config.fontSize.includes('px') || config.fontSize.includes('rem') || config.fontSize.includes('em') ? config.fontSize : `${config.fontSize}px`) : undefined,
          fontWeight: config.fontWeight || undefined,
          textTransform: (config.textTransform as any) || undefined,
          letterSpacing: config.letterSpacing ? (config.letterSpacing.includes('px') || config.letterSpacing.includes('em') ? config.letterSpacing : `${config.letterSpacing}px`) : undefined,
          lineHeight: config.lineHeight || undefined,
          height: config.headerHeight ? `${config.headerHeight}px` : undefined,
          minHeight: config.headerHeight ? `${config.headerHeight}px` : undefined,
          paddingTop: config.paddingTop ? `${config.paddingTop}px` : undefined,
          paddingRight: config.paddingRight ? `${config.paddingRight}px` : undefined,
          paddingBottom: config.paddingBottom ? `${config.paddingBottom}px` : undefined,
          paddingLeft: config.paddingLeft ? `${config.paddingLeft}px` : undefined,
        }}
      >
        <div
          className="apple-global-header-inner"
          style={{
            maxWidth: config.headerWidthMode === 'full'
              ? '100%'
              : config.headerMaxWidth ? `${config.headerMaxWidth}px` : undefined,
            height: config.headerHeight ? `${config.headerHeight}px` : undefined,
          }}
        >
          {/* Logo TEKNIX — 3 Formatos Suportados: 1. Ícone (SVG/Img) | 2. Logo Completo (Img/SVG) | 3. Nome/Texto */}
          {config.logoType !== 'none' && (
            <div
              className="apple-nav-link apple-logo-link"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isEditor ? 'pointer' : 'default' }}
              onClick={(e) => {
                if (isEditor && onSelect) {
                  e.stopPropagation()
                  onSelect()
                }
              }}
            >
              {/* 1. FORMATO: ÍCONE (SVG ou Imagem) ou Mobile forçado em ícone */}
              {(config.logoType === 'icon' || (isMobileViewport && config.mobileForceIcon && config.logoType !== 'text')) ? (
                config.logoIconType === 'image' && (config.logoIconImage || config.logoImage) ? (
                  <img
                    src={config.logoIconImage || config.logoImage}
                    alt={config.logoText || 'TEKNIX'}
                    style={{
                      height: config.logoIconSize ? `${config.logoIconSize}px` : '24px',
                      width: config.logoIconSize ? `${config.logoIconSize}px` : '24px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                ) : config.logoSvgCode ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: config.logoSvgCode }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  />
                ) : (
                  <TeknixLogoSVG height={Number(config.logoIconSize) || 22} />
                )
              ) : (config.logoType === 'full_logo' || config.logoType === 'image') ? (
                /* 2. FORMATO: LOGO INTEIRO (Imagem ou SVG) */
                (config.logoFullType === 'image' || (!config.logoFullType && config.logoImage)) && config.logoImage ? (
                  <img
                    src={config.logoImage}
                    alt={config.logoText || 'TEKNIX'}
                    style={{
                      height: config.logoHeight ? `${config.logoHeight}px` : '28px',
                      maxHeight: '42px',
                      maxWidth: config.logoWidth ? `${config.logoWidth}px` : '180px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                ) : config.logoSvgCode ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: config.logoSvgCode }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  />
                ) : (
                  /* SVG Padrão Completo (Ícone + Texto) */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TeknixLogoSVG height={Number(config.logoHeight) || 28} />
                    {config.logoText && config.logoText !== 'TEKNIX' && (
                      <span style={{ fontWeight: 800, fontSize: config.logoFontSize ? `${config.logoFontSize}px` : '15px', letterSpacing: '-0.02em', color: 'inherit' }}>
                        {config.logoText}
                      </span>
                    )}
                  </div>
                )
              ) : config.logoType === 'text' ? (
                /* 3. FORMATO: APENAS NOME / TEXTO */
                <span style={{ fontWeight: 800, fontSize: config.logoFontSize ? `${config.logoFontSize}px` : '16px', letterSpacing: '-0.02em', color: 'inherit' }}>
                  {config.logoText || 'TEKNIX'}
                </span>
              ) : (
                /* Default / 'tek_icon_text': Oficial TEKNIX SVG Icon + Text */
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TeknixLogoSVG height={Number(config.logoHeight) || 28} />
                  {config.logoText && config.logoText !== 'TEKNIX' && (
                    <span style={{ fontWeight: 800, fontSize: config.logoFontSize ? `${config.logoFontSize}px` : '15px', letterSpacing: '-0.02em', color: 'inherit' }}>
                      {config.logoText}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nav Items (Desktop) */}
          <nav
            className="apple-global-nav"
            style={{
              display: isMobileViewport ? 'none' : undefined,
              gap: config.menuItemGap ? `${config.menuItemGap}px` : undefined,
            }}
          >
            {links.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                className="apple-nav-link"
                style={{
                  color: config.textColor || undefined,
                  fontFamily: config.fontFamily || undefined,
                  fontSize: config.fontSize ? (config.fontSize.includes('px') || config.fontSize.includes('rem') ? config.fontSize : `${config.fontSize}px`) : undefined,
                  fontWeight: config.fontWeight || undefined,
                  textTransform: (config.textTransform as any) || undefined,
                  letterSpacing: config.letterSpacing ? (config.letterSpacing.includes('px') || config.letterSpacing.includes('em') ? config.letterSpacing : `${config.letterSpacing}px`) : undefined,
                }}
                onClick={e => isEditor && e.preventDefault()}
              >
                {item.label}
                {item.badge && <span className="nav-item-badge">{item.badge}</span>}
              </a>
            ))}
          </nav>

          {/* Action Icons (Search, Bag, Mobile Menu) */}
          <div className="apple-nav-actions">
            {/* Search */}
            <div className="apple-nav-link apple-action-icon" title="Pesquisar">
              <svg height="44" viewBox="0 0 15 44" width="15" fill="currentColor">
                <path d="m14.298 27.202-3.87-3.87c.701-.929 1.122-2.081 1.122-3.332c0-3.06-2.489-5.55-5.55-5.55s-5.55 2.49-5.55 5.55 2.49 5.55 5.55 5.55c1.251 0 2.403-.421 3.332-1.122l3.87 3.87c.151.151.35.228.548.228s.396-.076.548-.228c.303-.303.303-.793 0-1.096zm-12.748-7.202c0-2.454 1.997-4.45 4.45-4.45s4.45 1.997 4.45 4.45-1.997 4.45-4.45 4.45-1.997 4.45-4.45z" />
              </svg>
            </div>

            {/* Bag */}
            {config.showBag !== false && (
              <div className="apple-bag-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  id="globalnav-menubutton-link-bag"
                  className={`apple-header-icon-btn bag-btn ${bagDropdownOpen ? 'active' : ''}`}
                  aria-label="Sacola"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: config.textColor || undefined
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setBagDropdownOpen(!bagDropdownOpen)
                  }}
                >
                  <svg height="44" viewBox="0 0 14 44" width="14" fill="currentColor">
                    <path d="m11.3535 16.0283h-1.0205a3.4229 3.4229 0 0 0 -3.333-2.9648 3.4229 3.4229 0 0 0 -3.333 2.9648h-1.02a2.1184 2.1184 0 0 0 -2.117 2.1162v7.7155a2.1186 2.1186 0 0 0 2.1162 2.1167h8.707a2.1186 2.1186 0 0 0 2.1168-2.1167v-7.7155a2.1184 2.1184 0 0 0 -2.1165-2.1162zm-4.3535-1.8652a2.3169 2.3169 0 0 1 2.2222 1.8652h-4.4444a2.3169 2.3169 0 0 1 2.2222-1.8652zm5.37 11.6969a1.0182 1.0182 0 0 1 -1.0166 1.0171h-8.7069a1.0182 1.0182 0 0 1 -1.0165-1.0171v-7.7155a1.0178 1.0178 0 0 1 1.0166-1.0166h8.707a1.0178 1.0178 0 0 1 1.0164 1.0166z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="apple-menu-btn"
              style={{ display: isMobileViewport ? 'flex' : undefined }}
              aria-label="Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X size={18} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <line x1="2" y1="5" x2="16" y2="5" />
                  <line x1="2" y1="13" x2="16" y2="13" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── MOBILE MEGA MENU (8 Modelos) ── */}
        {mobileMenuOpen && (
          <div className={`apple-mobile-drawer mobile-style-${mobileModel}`}>
            <div className="mobile-drawer-inner">

              {/* ─── 1. Apple Classic Drawer ─── */}
              {mobileModel === 'apple_drawer' && (
                <div className="mobile-nav-list classic">
                  {links.map((item, idx) => (
                    <a key={idx} href={item.url} className="mobile-nav-item" onClick={e => isEditor && e.preventDefault()}>
                      {item.label}
                    </a>
                  ))}
                  <div className="mobile-drawer-footer">
                    <a href="/minha-conta" className="mobile-footer-link">Minha Conta</a>
                    <a href="/pedidos" className="mobile-footer-link">Rastrear Pedido</a>
                  </div>
                </div>
              )}

              {/* ─── 2. Categories Accordion ─── */}
              {mobileModel === 'categories_accordion' && (
                <div className="mobile-nav-list categories">
                  <div className="mobile-cat-header">Departamentos</div>
                  {links.map((item, idx) => (
                    <a key={idx} href={item.url} className="mobile-cat-card" onClick={e => isEditor && e.preventDefault()}>
                      <span>{item.label}</span>
                      <ChevronRight size={14} />
                    </a>
                  ))}
                </div>
              )}

              {/* ─── 3. Dark Pro ─── */}
              {mobileModel === 'dark_pro' && (
                <div className="mobile-nav-list dark-pro">
                  <div className="dark-pro-hero">
                    <strong>TEKNIX Store</strong>
                    <p>Tecnologia industrial de alta precisão</p>
                  </div>
                  {links.map((item, idx) => (
                    <a key={idx} href={item.url} className="dark-pro-link" onClick={e => isEditor && e.preventDefault()}>
                      <span>{item.label}</span>
                      <span className="dark-pro-dot" />
                    </a>
                  ))}
                </div>
              )}

              {/* ─── 4. Compact Grid 2x2 ─── */}
              {mobileModel === 'compact_grid' && (
                <div className="mobile-nav-list compact-grid">
                  <div className="grid-2x2-menu">
                    {links.slice(0, 8).map((item, idx) => (
                      <a key={idx} href={item.url} className="grid-menu-card" onClick={e => isEditor && e.preventDefault()}>
                        <span>{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── 5. Profile Blue Drawer (Azul App Sidebar) ─── */}
              {mobileModel === 'profile_blue_drawer' && (
                <div className="mobile-nav-list profile-blue">
                  {/* Close Button */}
                  <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
                    <X size={20} />
                  </button>
                  {/* Profile Header */}
                  <div className="profile-drawer-header">
                    <div className="profile-drawer-avatar">
                      <User size={28} />
                    </div>
                    <div className="profile-drawer-info">
                      <span className="profile-drawer-name">Minha Conta</span>
                      <span className="profile-drawer-email">cliente@teknix.com.br</span>
                    </div>
                  </div>
                  {/* Nav Items with Icons */}
                  <div className="profile-drawer-nav">
                    {links.map((item, idx) => {
                      const icons = [Home, LayoutGrid, Star, Heart, Bell, Settings, User, Globe, HelpCircle, LogOut, Zap]
                      const Icon = icons[idx % icons.length]
                      return (
                        <a key={idx} href={item.url} className="profile-drawer-item" onClick={e => isEditor && e.preventDefault()}>
                          <Icon size={18} />
                          <span>{item.label}</span>
                          <ChevronRight size={14} className="profile-item-arrow" />
                        </a>
                      )
                    })}
                  </div>
                  {/* Logout */}
                  <div className="profile-drawer-logout">
                    <a href="/sair" className="profile-drawer-item logout" onClick={e => isEditor && e.preventDefault()}>
                      <LogOut size={18} />
                      <span>Sair</span>
                    </a>
                  </div>
                </div>
              )}

              {/* ─── 6. Profile Purple Drawer (Roxo com Redes Sociais) ─── */}
              {mobileModel === 'profile_purple_drawer' && (
                <div className="mobile-nav-list profile-purple">
                  <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
                    <X size={20} />
                  </button>
                  {/* Profile Header */}
                  <div className="profile-drawer-header purple">
                    <div className="profile-drawer-avatar purple">
                      <User size={28} />
                    </div>
                    <div className="profile-drawer-info">
                      <span className="profile-drawer-name">Minha Conta</span>
                      <span className="profile-drawer-email">cliente@teknix.com.br</span>
                    </div>
                  </div>
                  {/* Nav Items */}
                  <div className="profile-drawer-nav">
                    {links.map((item, idx) => {
                      const icons = [Home, User, Heart, Star, Bell, Settings, Globe, HelpCircle, LayoutGrid, LogOut, Zap]
                      const Icon = icons[idx % icons.length]
                      const isActive = idx === 0
                      return (
                        <a key={idx} href={item.url} className={`profile-drawer-item purple ${isActive ? 'active-purple' : ''}`} onClick={e => isEditor && e.preventDefault()}>
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </a>
                      )
                    })}
                  </div>
                  {/* Social Links */}
                  <div className="profile-social-links">
                    <a href="#" className="social-icon" onClick={e => isEditor && e.preventDefault()}><Share2 size={16} /></a>
                    <a href="#" className="social-icon" onClick={e => isEditor && e.preventDefault()}><MessageCircle size={16} /></a>
                    <a href="#" className="social-icon" onClick={e => isEditor && e.preventDefault()}><Play size={16} /></a>
                    <a href="#" className="social-icon" onClick={e => isEditor && e.preventDefault()}><Camera size={16} /></a>
                  </div>
                </div>
              )}

              {/* ─── 7. Fullscreen Overlay (Tela Cheia Translúcida) ─── */}
              {mobileModel === 'fullscreen_overlay' && (
                <div className="mobile-nav-list fullscreen-overlay">
                  {/* Profile */}
                  <div className="overlay-profile">
                    <div className="overlay-avatar">
                      <User size={32} />
                    </div>
                    <div className="overlay-user-name">Minha Conta</div>
                    <div className="overlay-user-role">Cliente TEKNIX</div>
                  </div>
                  {/* Links */}
                  <nav className="overlay-nav">
                    {links.map((item, idx) => (
                      <a key={idx} href={item.url} className="overlay-nav-item" onClick={e => isEditor && e.preventDefault()}>
                        {item.label}
                      </a>
                    ))}
                  </nav>
                  {/* Close */}
                  <button
                    className="overlay-close-btn"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Fechar menu"
                  >
                    <X size={22} />
                  </button>
                </div>
              )}

              {/* ─── 8. Dark Settings Drawer (Dark com Toggles) ─── */}
              {mobileModel === 'dark_settings_drawer' && (
                <div className="mobile-nav-list dark-settings">
                  <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
                    <X size={20} />
                  </button>
                  {/* Profile */}
                  <div className="dark-settings-profile">
                    <div className="dark-settings-avatar">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="dark-settings-name">Minha Conta</div>
                      <div className="dark-settings-handle">@cliente</div>
                    </div>
                    <ChevronRight size={16} className="dark-settings-chevron" />
                  </div>
                  {/* Nav Links */}
                  <div className="dark-settings-nav">
                    {links.map((item, idx) => {
                      const icons = [Home, User, Heart, Star, Bell, Settings, Globe, HelpCircle, LayoutGrid, LogOut, Zap]
                      const Icon = icons[idx % icons.length]
                      return (
                        <a key={idx} href={item.url} className="dark-settings-item" onClick={e => isEditor && e.preventDefault()}>
                          <Icon size={16} className="dark-settings-item-icon" />
                          <span>{item.label}</span>
                          <ChevronRight size={14} className="dark-settings-item-arrow" />
                        </a>
                      )
                    })}
                  </div>
                  {/* Logout */}
                  <div className="dark-settings-footer">
                    <a href="/sair" className="dark-settings-logout" onClick={e => isEditor && e.preventDefault()}>
                      <LogOut size={16} />
                      <span>Sair da Conta</span>
                    </a>
                  </div>
                </div>
              )}

              {/* ─── 9. Clean Light Drawer (Branco com Toggles) ─── */}
              {mobileModel === 'clean_light_drawer' && (
                <div className="mobile-nav-list clean-light">
                  <button className="mobile-close-btn dark" onClick={() => setMobileMenuOpen(false)}>
                    <X size={18} />
                  </button>
                  {/* Profile */}
                  <div className="cl-profile">
                    <div className="cl-avatar">
                      <User size={22} />
                    </div>
                    <div className="cl-profile-info">
                      <span className="cl-name">Creative Jeff</span>
                      <span className="cl-email">jeff@teknix.com.br</span>
                    </div>
                  </div>
                  {/* Nav with optional toggle on some items */}
                  <div className="cl-nav">
                    {links.map((item, idx) => {
                      const icons = [Home, LayoutGrid, ShoppingBag, Heart, Star, MessageCircle, Bell, Settings, User, Globe]
                      const Icon = icons[idx % icons.length]
                      const hasToggle = [2, 5, 6].includes(idx) // Notification, Message, Bell have toggles
                      return (
                        <div key={idx} className="cl-item">
                          <div className="cl-item-left">
                            <Icon size={18} className="cl-item-icon" />
                            <a href={item.url} className="cl-item-label" onClick={e => isEditor && e.preventDefault()}>
                              {item.label}
                            </a>
                          </div>
                          {hasToggle ? (
                            <span className="cl-toggle-on" />
                          ) : (
                            <ChevronRight size={14} className="cl-item-arrow" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {/* Bottom: Settings + Logout */}
                  <div className="cl-footer">
                    <a href="/configuracoes" className="cl-footer-btn" onClick={e => isEditor && e.preventDefault()}>
                      <Settings size={16} /> Configurações
                    </a>
                    <a href="/sair" className="cl-footer-btn danger" onClick={e => isEditor && e.preventDefault()}>
                      <LogOut size={16} /> Sair
                    </a>
                  </div>
                </div>
              )}

              {/* ─── 10. Light Tabbed Drawer (Tabs + Cards) ─── */}
              {mobileModel === 'light_tabbed_drawer' && (
                <div className="mobile-nav-list light-tabbed">
                  <button className="mobile-close-btn dark" onClick={() => setMobileMenuOpen(false)}>
                    <X size={18} />
                  </button>
                  {/* Profile */}
                  <div className="lt-profile">
                    <div className="lt-avatar">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="lt-name">Julian Hart</div>
                      <div className="lt-email">julian@teknix.com.br</div>
                    </div>
                  </div>
                  {/* Tabs */}
                  <div className="lt-tabs">
                    {(links.slice(0, 4)).map((item, idx) => (
                      <a key={idx} href={item.url} className={`lt-tab ${idx === 1 ? 'active' : ''}`} onClick={e => isEditor && e.preventDefault()}>
                        {item.label}
                      </a>
                    ))}
                  </div>
                  {/* Cards */}
                  <div className="lt-cards">
                    {links.slice(0).map((item, idx) => {
                      const icons = [Home, LayoutGrid, ShoppingBag, Heart, Star, MessageCircle, Bell, Settings, User, Globe, HelpCircle]
                      const Icon = icons[idx % icons.length]
                      const hasBadge = idx === 1
                      return (
                        <a key={idx} href={item.url} className="lt-card" onClick={e => isEditor && e.preventDefault()}>
                          <Icon size={20} className="lt-card-icon" />
                          <span className="lt-card-label">{item.label}</span>
                          {hasBadge && <span className="lt-badge">2</span>}
                        </a>
                      )
                    })}
                  </div>
                  {/* Bottom nav */}
                  <div className="lt-bottom-bar">
                    <a href="/" className="lt-bottom-btn active" onClick={e => isEditor && e.preventDefault()}><Home size={18} /><span>Home</span></a>
                    <a href="/configuracoes" className="lt-bottom-btn" onClick={e => isEditor && e.preventDefault()}><Settings size={18} /><span>Config</span></a>
                    <a href="/sair" className="lt-bottom-btn" onClick={e => isEditor && e.preventDefault()}><LogOut size={18} /><span>Sair</span></a>
                  </div>
                </div>
              )}

              {/* ─── 11. Tab Grid Bottom (Grid + Bottom Bar) ─── */}
              {mobileModel === 'tab_grid_bottom' && (
                <div className="mobile-nav-list tab-grid">
                  <button className="mobile-close-btn dark" onClick={() => setMobileMenuOpen(false)}>
                    <X size={18} />
                  </button>
                  {/* Profile compact */}
                  <div className="tg-header">
                    <div className="tg-avatar"><User size={20} /></div>
                    <div className="tg-user-info">
                      <span className="tg-name">Julian Hart</span>
                      <span className="tg-email">julian@teknix.com.br</span>
                    </div>
                  </div>
                  {/* Tab selector */}
                  <div className="tg-tabs">
                    {(['Store', 'Categorias', 'Sacola']).map((tab, i) => (
                      <button key={i} className={`tg-tab ${i === 1 ? 'active' : ''}`} onClick={e => isEditor && e.preventDefault()}>
                        {tab}
                      </button>
                    ))}
                  </div>
                  {/* Grid */}
                  <div className="tg-grid">
                    {links.slice(0, 6).map((item, idx) => {
                      const icons = [Home, LayoutGrid, ShoppingBag, Bell, MessageCircle, Settings]
                      const Icon = icons[idx % icons.length]
                      return (
                        <a key={idx} href={item.url} className="tg-grid-card" onClick={e => isEditor && e.preventDefault()}>
                          <Icon size={22} />
                          <span>{item.label}</span>
                        </a>
                      )
                    })}
                  </div>
                  {/* Bottom */}
                  <div className="tg-bottom">
                    <a href="/perfil" className="tg-bottom-link" onClick={e => isEditor && e.preventDefault()}>
                      <User size={16} /> Perfil
                    </a>
                    <a href="/configuracoes" className="tg-bottom-link" onClick={e => isEditor && e.preventDefault()}>
                      <Settings size={16} /> Configurações
                    </a>
                    <a href="/sair" className="tg-bottom-link danger" onClick={e => isEditor && e.preventDefault()}>
                      <LogOut size={16} /> Sair
                    </a>
                  </div>
                </div>
              )}

              {/* ─── 12. Grouped Sections Drawer (App Sidebar com Grupos) ─── */}
              {mobileModel === 'grouped_sections_drawer' && (
                <div className="mobile-nav-list grouped-sections">
                  <button className="mobile-close-btn dark" onClick={() => setMobileMenuOpen(false)}>
                    <X size={18} />
                  </button>
                  {/* Logo + App Name */}
                  <div className="gs-logo">
                    <div className="gs-logo-icon">TK</div>
                    <div>
                      <div className="gs-app-name">TEKNIX</div>
                      <div className="gs-app-version">v 2.0</div>
                    </div>
                  </div>
                  {/* Grouped nav sections */}
                  <div className="gs-nav">
                    <div className="gs-group-label">PRODUTOS</div>
                    {links.slice(0, 3).map((item, idx) => {
                      const icons = [LayoutGrid, ShoppingBag, Star]
                      const Icon = icons[idx]
                      const badge = idx === 1 ? '14' : idx === 2 ? '9' : null
                      return (
                        <a key={idx} href={item.url} className={`gs-item ${idx === 2 ? 'active' : ''}`} onClick={e => isEditor && e.preventDefault()}>
                          <Icon size={16} />
                          <span>{item.label}</span>
                          {badge && <span className="gs-badge">{badge}</span>}
                          {!badge && <ChevronRight size={12} className="gs-arrow" />}
                        </a>
                      )
                    })}

                    <div className="gs-group-label" style={{ marginTop: 12 }}>CONTA</div>
                    {links.slice(3, 6).map((item, idx) => {
                      const icons = [User, Bell, Settings]
                      const Icon = icons[idx]
                      const badge = idx === 1 ? '3' : null
                      return (
                        <a key={idx} href={item.url} className="gs-item" onClick={e => isEditor && e.preventDefault()}>
                          <Icon size={16} />
                          <span>{item.label}</span>
                          {badge && <span className="gs-badge">{badge}</span>}
                          {!badge && <ChevronRight size={12} className="gs-arrow" />}
                        </a>
                      )
                    })}

                    <div className="gs-group-label" style={{ marginTop: 12 }}>SUPORTE</div>
                    {links.slice(6).map((item, idx) => {
                      const icons = [HelpCircle, Globe, MessageCircle, LogOut]
                      const Icon = icons[idx % icons.length]
                      return (
                        <a key={idx} href={item.url} className="gs-item" onClick={e => isEditor && e.preventDefault()}>
                          <Icon size={16} />
                          <span>{item.label}</span>
                          <ChevronRight size={12} className="gs-arrow" />
                        </a>
                      )
                    })}
                  </div>

                  {/* Bottom user profile */}
                  <div className="gs-user-bottom">
                    <div className="gs-user-avatar"><User size={18} /></div>
                    <div className="gs-user-info">
                      <span className="gs-user-name">Minha Conta</span>
                      <span className="gs-user-email">cliente@teknix.com.br</span>
                    </div>
                    <button className="gs-user-more" onClick={e => isEditor && e.preventDefault()}>⋯</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </header>

      {/* ── 1:1 AUTHENTIC APPLE FULL-WIDTH BAG DROPDOWN / DRAWER ── */}
      {bagDropdownOpen && (
        <div
          className="apple-bag-dropdown-panel"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            width: '100%',
            background: config.bagDropdownBgColor || '#ffffff',
            borderBottom: `1px solid ${config.bagDropdownBorderColor || '#d2d2d7'}`,
            zIndex: 9999,
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            padding: '32px 24px 40px',
            boxSizing: 'border-box'
          }}
        >
          <div className="apple-bag-dropdown-inner" style={{ maxWidth: '1024px', margin: '0 auto' }}>
            <div className="apple-bag-state-block" style={{ marginBottom: '28px' }}>
              <h2
                className="apple-bag-state-title"
                style={{
                  fontSize: '26px',
                  fontWeight: 600,
                  color: config.bagDropdownTextColor || '#1d1d1f',
                  margin: '0 0 12px 0'
                }}
              >
                {config.bagDropdownTitle || 'Sua sacola está vazia.'}
              </h2>
              <a
                className="apple-bag-shop-link"
                href={config.bagDropdownShopLinkUrl || '/produtos'}
                data-discover="true"
                style={{
                  fontSize: '14px',
                  color: '#0071e3',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px'
                }}
              >
                {config.bagDropdownShopLinkText || 'Ver produtos'}
              </a>
            </div>

            <div className="apple-bag-profile-block" style={{ borderTop: '1px solid #e5e5ea', paddingTop: '24px' }}>
              <span
                className="apple-bag-profile-label"
                style={{
                  fontSize: '12px',
                  color: '#86868b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'block',
                  marginBottom: '14px'
                }}
              >
                {accountName ? `Olá, ${accountName}` : 'Meu perfil'}
              </span>
              <ul className="apple-bag-profile-nav" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li>
                  <a className="apple-bag-profile-link" href="/pedidos" data-discover="true" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0071e3', textDecoration: 'none', fontSize: '14px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <span>Pedidos</span>
                  </a>
                </li>
                <li>
                  <a className="apple-bag-profile-link" href="/salvos" data-discover="true" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0071e3', textDecoration: 'none', fontSize: '14px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>Itens salvos</span>
                  </a>
                </li>
                <li>
                  <a className="apple-bag-profile-link" href="/conta" data-discover="true" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0071e3', textDecoration: 'none', fontSize: '14px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>{accountName ? `Conta de ${accountName}` : 'Conta'}</span>
                  </a>
                </li>
                <li>
                  <a className="apple-bag-profile-link" href="/login" data-discover="true" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0071e3', textDecoration: 'none', fontSize: '14px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M18 20a6 6 0 0 0-12 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Iniciar sessão</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
