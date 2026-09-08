import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './NewsHeader.css'

type ActivePage = 'sobre' | 'ecossistema' | 'investidores' | 'sustentabilidade' | 'noticias' | ''

interface NewsHeaderProps {
  activePage?: ActivePage
  hideMenu?: boolean
  loggedUserName?: string
}

export default function NewsHeader({ activePage, hideMenu = false, loggedUserName }: NewsHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Determina página ativa por prop ou por rota atual
  const getActive = (): ActivePage => {
    if (activePage !== undefined) return activePage
    const p = location.pathname
    if (p.startsWith('/news/sobre-nos') || p.startsWith('/news/sobrenos')) return 'sobre'
    if (p.startsWith('/news/nosso-ecossistema')) return 'ecossistema'
    if (p.startsWith('/news/investidores')) return 'investidores'
    if (p.startsWith('/news/sustentabilidade')) return 'sustentabilidade'
    if (p.startsWith('/noticias') || p.startsWith('/blog')) return 'noticias'
    return ''
  }

  const current = getActive()
  const isActive = (page: ActivePage) => current === page ? 'news-menu-active' : ''

  // Fecha menu no mobile ao mudar de rota
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Fecha no ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="news-shared-header" role="banner">
        <div className="news-header-inner">
          <Link
            className="news-header-logo"
            to="/news"
            onClick={() => setMenuOpen(false)}
            aria-label="Teknix News - Home"
          >
            <img src="/teknix-logo.svg" alt="TEKNIX" width="114" height="27" />
          </Link>

          {hideMenu && (
            <div className="help-header-utility" aria-label="Acesso rápido">
              {!loggedUserName && <Link to="/cadastro">Crie a sua conta</Link>}
              <Link to={loggedUserName ? '/conta' : '/login'}>{loggedUserName ? `Olá, ${loggedUserName}` : 'Entre'}</Link>
              <Link to="/contato">Contato</Link>
            </div>
          )}

          {!hideMenu && <nav role="navigation" aria-label="Menu principal">
            {/* Botão Hambúrguer Mobile */}
            <button
              id="news-mobile-menu-btn"
              className={`news-mobile-btn${menuOpen ? ' active' : ''}`}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMenuOpen(prev => !prev)}
            >
              <div className="news-hamburger" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>

            {/* Menu Desktop e Dropdown Mobile */}
            <div className={`news-header-menu-wrapper${menuOpen ? ' active' : ''}`}>
              <ul className="news-header-menu">
                <li className={isActive('sobre')}>
                  <Link to="/news/sobre-nos" onClick={() => setMenuOpen(false)}>
                    Sobre nós
                  </Link>
                </li>
                <li className={isActive('ecossistema')}>
                  <Link to="/news/nosso-ecossistema" onClick={() => setMenuOpen(false)}>
                    Nosso Ecossistema
                  </Link>
                </li>
                <li className={isActive('investidores')}>
                  <Link to="/news/investidores" onClick={() => setMenuOpen(false)}>
                    Investidores
                  </Link>
                </li>
                <li className={isActive('sustentabilidade')}>
                  <Link to="/news/sustentabilidade" onClick={() => setMenuOpen(false)}>
                    Sustentabilidade
                  </Link>
                </li>
                <li className={`news-menu-noticias ${isActive('noticias')}`}>
                  <Link to="/noticias" onClick={() => setMenuOpen(false)}>
                    Notícias
                  </Link>
                </li>
              </ul>
            </div>
          </nav>}
        </div>
      </header>

      {/* Backdrop escurecido no mobile quando menu está aberto */}
      {menuOpen && (
        <div
          className="news-mobile-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
