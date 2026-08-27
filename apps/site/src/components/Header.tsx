import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../context/CartContext'
import { TeknixLogo } from './TeknixLogo'
import './Header.css'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { 
    totalItems, 
    items: cartItems, 
    totalPrice, 
    isOpen: bagOpen, 
    openCart, 
    closeCart, 
    lastAddedItem, 
    clearLastAdded 
  } = useCart()
  const bagRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Sincroniza o slide do carrossel sempre que um novo item for adicionado
  useEffect(() => {
    if (cartItems.length > 0) {
      // Foca no item recém adicionado ou no último
      setCurrentSlideIndex(cartItems.length - 1)
    }
  }, [cartItems.length, lastAddedItem])

  // Fecha o menu e sacola ao navegar
  useEffect(() => {
    setMenuOpen(false)
    closeCart()
    clearLastAdded()
  }, [location])

  // Fecha no ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeCart()
        clearLastAdded()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeCart, clearLastAdded])

  async function handleSignOut() {
    await signOut()
    closeCart()
    navigate('/')
  }

  function formatBRL(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const userName = user?.email ? user.email.split('@')[0] : 'alison'

  // Item ativo no carrossel do banner fixo
  const activeSlideItem = cartItems[currentSlideIndex] || cartItems[0] || lastAddedItem

  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : cartItems.length - 1))
  }

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => (prev < cartItems.length - 1 ? prev + 1 : 0))
  }

  return (
    <>
      <header className={`apple-global-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="apple-global-header-inner">
          {/* TEKNIX Official SVG Logo */}
          <Link to="/" className="apple-nav-link apple-logo-link" aria-label="TEKNIX Home" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <TeknixLogo className="h-4 w-auto" />
          </Link>

          {/* Global Navigation Items */}
          <nav className={`apple-global-nav ${menuOpen ? 'open' : ''}`}>
            <Link to="/produtos" className="apple-nav-link">Store</Link>
            <Link to="/mac" className="apple-nav-link">Mac</Link>
            <Link to="/ipad" className="apple-nav-link">iPad</Link>
            <Link to="/iphone" className="apple-nav-link">iPhone</Link>
            <Link to="/watch" className="apple-nav-link">Watch</Link>
            <Link to="/vision" className="apple-nav-link">Vision</Link>
            <Link to="/airpods" className="apple-nav-link">AirPods</Link>
            <Link to="/produtos" className="apple-nav-link">TV &amp; Home</Link>
            <Link to="/produtos" className="apple-nav-link">Entertainment</Link>
            <Link to="/produtos" className="apple-nav-link">Accessories</Link>
            <Link to="/contato" className="apple-nav-link">Support</Link>
          </nav>

          {/* Search & Bag Icons */}
          <div className="apple-nav-actions">
            {/* Search Icon */}
            <Link to="/produtos" className="apple-nav-link apple-action-icon" aria-label="Pesquisar">
              <svg height="44" viewBox="0 0 15 44" width="15" fill="currentColor">
                <path d="m14.298 27.202-3.87-3.87c.701-.929 1.122-2.081 1.122-3.332c0-3.06-2.489-5.55-5.55-5.55s-5.55 2.49-5.55 5.55 2.49 5.55 5.55 5.55c1.251 0 2.403-.421 3.332-1.122l3.87 3.87c.151.151.35.228.548.228s.396-.076.548-.228c.303-.303.303-.793 0-1.096zm-12.748-7.202c0-2.454 1.997-4.45 4.45-4.45s4.45 1.997 4.45 4.45-1.997 4.45-4.45 4.45-4.45-1.997-4.45-4.45z" />
              </svg>
            </Link>

            {/* Shopping Bag Icon */}
            <div className="apple-bag-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                id="globalnav-menubutton-link-bag"
                className={`apple-header-icon-btn bag-btn ${bagOpen ? 'active' : ''}`}
                onClick={() => (bagOpen ? closeCart() : openCart())}
                aria-label={totalItems > 0 ? `Sacola com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}` : 'Sacola'}
              >
                <svg height="44" viewBox="0 0 14 44" width="14" fill="currentColor">
                  <path d="m11.3535 16.0283h-1.0205a3.4229 3.4229 0 0 0 -3.333-2.9648 3.4229 3.4229 0 0 0 -3.333 2.9648h-1.02a2.1184 2.1184 0 0 0 -2.117 2.1162v7.7155a2.1186 2.1186 0 0 0 2.1162 2.1167h8.707a2.1186 2.1186 0 0 0 2.1168-2.1167v-7.7155a2.1184 2.1184 0 0 0 -2.1165-2.1162zm-4.3535-1.8652a2.3169 2.3169 0 0 1 2.2222 1.8652h-4.4444a2.3169 2.3169 0 0 1 2.2222-1.8652zm5.37 11.6969a1.0182 1.0182 0 0 1 -1.0166 1.0171h-8.7069a1.0182 1.0182 0 0 1 -1.0165-1.0171v-7.7155a1.0178 1.0178 0 0 1 1.0166-1.0166h8.707a1.0178 1.0178 0 0 1 1.0164 1.0166z" />
                </svg>
                {totalItems > 0 && (
                  <span className="globalnav-bag-badge">
                    <span className="globalnav-bag-badge-number">{totalItems}</span>
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className={`apple-menu-btn ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
                <line x1="2" y1="5" x2="16" y2="5" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="13" x2="16" y2="13" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── 1:1 APPLE STICKY REVIEW BAG BANNER COM CARROSSEL MULTI-ITENS (FIXO AO ROLAR) ── */}
      {cartItems.length > 0 && !bagOpen && (
        <div className="apple-review-bag-strip">
          <div className="apple-review-bag-inner">
            {/* Seta Esquerda (se houver mais de 1 item) */}
            {cartItems.length > 1 && (
              <button
                type="button"
                className="apple-review-carousel-arrow prev"
                onClick={handlePrevSlide}
                aria-label="Item anterior na sacola"
              >
                ‹
              </button>
            )}

            {/* Miniatura do Produto Ativo */}
            <div className="apple-review-bag-thumb">
              <img 
                src={activeSlideItem?.image || 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80'} 
                alt={activeSlideItem?.name} 
              />
            </div>

            {/* Detalhes do Produto Ativo */}
            <div className="apple-review-bag-info">
              <div className="apple-review-bag-title">
                <strong>{activeSlideItem?.name}</strong> {activeSlideItem?.quantity > 1 ? `(${activeSlideItem.quantity}x)` : ''}
              </div>
              <div className="apple-review-bag-sub">
                {formatBRL(activeSlideItem?.promo_price && activeSlideItem.promo_price > 0 ? activeSlideItem.promo_price : (activeSlideItem?.price || 0))} • {totalItems} {totalItems === 1 ? 'item' : 'itens'} na sacola ({formatBRL(totalPrice)})
              </div>

              {/* Indicadores de Pontos (Dots do Carrossel) */}
              {cartItems.length > 1 && (
                <div className="apple-review-bag-dots">
                  {cartItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`apple-review-dot ${idx === currentSlideIndex ? 'active' : ''}`}
                      onClick={() => setCurrentSlideIndex(idx)}
                      aria-label={`Ver item ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Seta Direita (se houver mais de 1 item) */}
            {cartItems.length > 1 && (
              <button
                type="button"
                className="apple-review-carousel-arrow next"
                onClick={handleNextSlide}
                aria-label="Próximo item na sacola"
              >
                ›
              </button>
            )}

            {/* Botão Azul "Review Bag / Ver Sacola" 1:1 Apple */}
            <div className="apple-review-bag-actions">
              <button 
                type="button" 
                className="apple-review-bag-btn" 
                onClick={openCart}
              >
                Review Bag
              </button>
              <button 
                type="button" 
                className="apple-review-bag-close" 
                onClick={clearLastAdded}
                aria-label="Fechar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 1:1 AUTHENTIC APPLE FULL-WIDTH BAG DROPDOWN / DRAWER ── */}
      {bagOpen && (
        <>
          <div className="apple-bag-backdrop" onClick={closeCart} />
          <div className="apple-bag-dropdown-panel" ref={bagRef}>
            <div className="apple-bag-dropdown-inner">
              {/* Top: Header e Itens da Sacola */}
              {cartItems.length === 0 ? (
                <div className="apple-bag-state-block">
                  <h2 className="apple-bag-state-title">Sua sacola está vazia.</h2>
                  <Link
                    to="/produtos"
                    className="apple-bag-shop-link"
                    onClick={closeCart}
                  >
                    Ver produtos
                  </Link>
                </div>
              ) : (
                <div className="apple-bag-state-block filled">
                  <div className="apple-bag-flyout-top-row">
                    <h2 className="apple-bag-state-title-clean">Sacola</h2>
                    <Link
                      to="/sacola"
                      className="apple-bag-view-btn primary"
                      onClick={closeCart}
                    >
                      Review Bag
                    </Link>
                  </div>

                  {/* Lista de Produtos 1:1 Oficial Apple Store */}
                  <div className="apple-bag-flyout-items-list">
                    {cartItems.map(item => (
                      <Link
                        key={item.id}
                        to={`/produto/${item.id}`}
                        className="apple-bag-flyout-item-row"
                        onClick={closeCart}
                      >
                        <div className="flyout-item-thumb">
                          <img 
                            src={item.image || 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80'} 
                            alt={item.name} 
                          />
                        </div>
                        <span className="flyout-item-name">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom: Meu perfil */}
              <div className="apple-bag-profile-block">
                <span className="apple-bag-profile-label">Meu perfil</span>
                <ul className="apple-bag-profile-nav">
                  <li>
                    <Link
                      to="/pedidos"
                      className="apple-bag-profile-link"
                      onClick={closeCart}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                      <span>Pedidos</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/salvos"
                      className="apple-bag-profile-link"
                      onClick={closeCart}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span>Itens salvos</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/conta"
                      className="apple-bag-profile-link"
                      onClick={closeCart}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      <span>Conta</span>
                    </Link>
                  </li>
                  <li>
                    {user ? (
                      <button
                        type="button"
                        className="apple-bag-profile-link"
                        onClick={handleSignOut}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M18 20a6 6 0 0 0-12 0"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>Sair {userName ? userName.toLowerCase().split(' ')[0] : ''}</span>
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="apple-bag-profile-link"
                        onClick={closeCart}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M18 20a6 6 0 0 0-12 0"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>Iniciar sessão</span>
                      </Link>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

