import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import './HubLayout.css'

const icons: Record<string, JSX.Element> = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  tag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  creditCard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  store: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  message: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  external: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  layout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  palette: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2z"/></svg>,
}

export default function HubLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/hub') return location.pathname === '/hub'
    return location.pathname.startsWith(path)
  }

  const menuItems = [
    {
      section: 'Principal',
      items: [
        { icon: 'dashboard', label: 'Painel', path: '/hub' },
        { icon: 'chart', label: 'Estatísticas', path: '/hub/estatisticas' },
      ]
    },
    {
      section: 'Administrar',
      items: [
        { icon: 'box', label: 'Produtos', path: '/hub/produtos' },
        { icon: 'tag', label: 'Categorias', path: '/hub/categorias' },
        { icon: 'cart', label: 'Pedidos', path: '/hub/pedidos' },
        { icon: 'users', label: 'Clientes', path: '/hub/clientes' },
      ]
    },
    {
      section: 'Financeiro',
      items: [
        { icon: 'dollar', label: 'Financeiro', path: '/hub/financeiro' },
        { icon: 'creditCard', label: 'Mercado Pago', path: '/hub/mercado-pago' },
      ]
    },
    {
      section: 'Integrações',
      items: [
        { icon: 'store', label: 'Mercado Livre', path: '/hub/mercado-livre' },
        { icon: 'message', label: 'WhatsApp', path: '/hub/whatsapp' },
      ]
    },
    {
      section: 'Páginas',
      items: [
        { icon: 'layout', label: 'Páginas', path: '/hub/paginas' },
        { icon: 'palette', label: 'Temas', path: '/hub/temas' },
      ]
    },
    {
      section: 'Sistema',
      items: [
        { icon: 'user', label: 'Usuários', path: '/hub/usuarios' },
        { icon: 'settings', label: 'Configurações', path: '/hub/configuracoes' },
      ]
    },
  ]

  return (
    <div className={`hub-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="hub-sidebar">
        <div className="sidebar-header">
          <Link to="/hub" className="sidebar-logo">
            <span className="logo-mark">T</span>
            <span className="logo-text">HUB</span>
          </Link>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              {sidebarOpen ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((group) => (
            <div key={group.section} className="nav-group">
              <span className="nav-group-label">{group.section}</span>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-icon">{icons[item.icon]}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a href="/" className="sidebar-link" target="_blank" rel="noopener noreferrer">
            <span className="nav-icon">{icons.external}</span>
            <span className="nav-label">Ver site público</span>
          </a>
        </div>
      </aside>

      <main className="hub-main">
        <header className="hub-header">
          <div className="hub-header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 className="hub-page-title">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
          <div className="hub-header-right">
            <div className="hub-user-avatar">A</div>
          </div>
        </header>

        <div className="hub-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function getPageTitle(pathname: string): string {
  if (pathname === '/hub') return 'Painel'
  if (pathname.includes('/produtos/novo')) return 'Novo produto'
  if (pathname.includes('/produtos/editar')) return 'Editar produto'
  if (pathname.includes('/produtos')) return 'Produtos'
  if (pathname.includes('/categorias')) return 'Categorias'
  if (pathname.includes('/pedidos')) return 'Pedidos'
  if (pathname.includes('/clientes')) return 'Clientes'
  if (pathname.includes('/financeiro')) return 'Financeiro'
  if (pathname.includes('/mercado-livre')) return 'Mercado Livre'
  if (pathname.includes('/mercado-pago')) return 'Mercado Pago'
  if (pathname.includes('/whatsapp')) return 'WhatsApp'
  if (pathname.includes('/usuarios')) return 'Usuários'
  if (pathname.includes('/configuracoes')) return 'Configurações'
  if (pathname.includes('/estatisticas')) return 'Estatísticas'
  if (pathname.includes('/paginas/editar')) return 'Editor de página'
  if (pathname.includes('/paginas/nova')) return 'Nova página'
  if (pathname.includes('/paginas')) return 'Páginas'
  if (pathname.includes('/temas/editar')) return 'Editor de tema'
  if (pathname.includes('/temas/novo')) return 'Novo tema'
  if (pathname.includes('/temas')) return 'Temas'
  return 'HUB'
}
