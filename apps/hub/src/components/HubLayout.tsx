import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../hooks/usePermissions'
import { useHubNotifications } from '../contexts/HubNotificationContext'
import { resolveNotificationUrl, type HubNotification } from '../services/notificationService'
import AccessDenied from './AccessDenied'
import HubToast from './HubToast'
import {
  MercadoLivreLogo,
  ShopeeLogo,
  AmazonLogo,
  MagaluLogo,
  WhatsAppLogo,
  IntegrationLogoRenderer
} from './IntegrationLogos'
import { InternalChatProvider, useInternalChat } from '../contexts/InternalChatContext'
import FloatingMessenger from './internal-chat/FloatingMessenger'
import './HubLayout.css'

// ─── Ícones originais + logos de integração ────────────────────────────────
const icons: Record<string, React.ReactElement> = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  tag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  creditCard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  store: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  message: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  layout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  palette: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2z"/></svg>,
  media: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  template: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  blog: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  ads: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  // Logos oficiais em SVG
  mercadoLivreLogo: <MercadoLivreLogo size={22} />,
  shopeeLogo: <ShopeeLogo size={22} />,
  amazonLogo: <AmazonLogo size={22} />,
  magaluLogo: <MagaluLogo size={22} />,
  whatsappLogo: <WhatsAppLogo size={22} />,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  fileText: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  plusLogo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}

// ─── Botão do Chat Interno no Pill do Header (1:1 com o FLOW) ─────────────
function HubChatPillButton() {
  const { totalUnreadCount, isFloatingOpen, setIsFloatingOpen, isFloatingMinimized, setIsFloatingMinimized } = useInternalChat()
  return (
    <button
      type="button"
      className="flow-pill-btn"
      title="Chat Interno TEKNIX"
      onClick={() => {
        if (isFloatingOpen && !isFloatingMinimized) {
          setIsFloatingOpen(false)
        } else {
          setIsFloatingOpen(true)
          setIsFloatingMinimized(false)
        }
      }}
      style={{ position: 'relative' }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      {totalUnreadCount > 0 && (
        <span className="flow-badge-red" style={{ animation: 'pulse 1.5s infinite' }}>
          {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
        </span>
      )}
    </button>
  )
}

// ─── Componente principal interno ──────────────────────────────────────────
function HubLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationTab, setNotificationTab] = useState<'all' | 'unread'>('all')
  const notifDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useHubNotifications()

  // Fechar popup de notificações e usuário ao clicar fora ou apertar Esc
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setShowUserDropdown(false)
      }
    }

    if (showNotifications || showUserDropdown) {
      document.addEventListener('mousedown', handleDocumentClick)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showNotifications, showUserDropdown])

  function cleanNotificationText(text: string): string {
    if (!text) return ''
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/^[\s\-–—:•]+/, '')
      .trim()
  }

  function formatRelativeTime(dateStr: string) {
    try {
      const date = new Date(dateStr)
      const diffMs = Date.now() - date.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      if (diffSec < 60) return 'Agora mesmo'
      const mins = Math.floor(diffSec / 60)
      if (mins < 60) return `${mins}m atrás`
      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours}h atrás`
      const days = Math.floor(hours / 24)
      if (days === 1) return 'Ontem'
      if (days < 7) return `${days}d atrás`
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    } catch {
      return 'Recente'
    }
  }

  const { can, canAccessRoute, role, isMaster } = usePermissions()

  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || 'Alison Thiago')
  const [userNickname, setUserNickname] = useState(() => localStorage.getItem('user_nickname') || 'Alison')
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_email') || 'alison@teknix.com.br')
  const [userPhoto, setUserPhoto] = useState(() => localStorage.getItem('user_photo_url') || 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg')

  // Contas de integração dinâmicas
  const [marketplaceAccounts, setMarketplaceAccounts] = useState<any[]>([])

  useEffect(() => {
    async function loadAccounts() {
      try {
        const { data } = await supabase
          .from('marketplace_accounts')
          .select('id, account_name, marketplace_id, status')
          .is('deleted_at', null)
        if (data && data.length > 0) {
          setMarketplaceAccounts(data)
        }
      } catch {}
    }
    loadAccounts()

    function handleProfileUpdate(e: any) {
      if (e.detail?.photo_url) setUserPhoto(e.detail.photo_url)
      if (e.detail?.name) setUserName(e.detail.name)
      if (e.detail?.nickname) setUserNickname(e.detail.nickname)
      if (e.detail?.email) setUserEmail(e.detail.email)
    }
    window.addEventListener('user_profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('user_profile_updated', handleProfileUpdate)
  }, [])

  const isActive = (path: string) => {
    if (path === '/hub') return location.pathname === '/hub'
    return location.pathname.startsWith(path)
  }

  // ─── Itens dinâmicos de Integrações ──────────────────────────────────────
  const integrationMenuItems = [
    { icon: 'mercadoLivreLogo', label: 'Mercado Livre', path: '/hub/mercado-livre' },
    { icon: 'shopeeLogo', label: 'Shopee', path: '/hub/shopee' },
    { icon: 'amazonLogo', label: 'Amazon', path: '/hub/amazon' },
    { icon: 'magaluLogo', label: 'Magalu', path: '/hub/magalu' },
    { icon: 'whatsappLogo', label: 'WhatsApp', path: '/hub/whatsapp' },
    { icon: 'plusLogo', label: 'Ver Todas', path: '/hub/integracoes' },
  ]

  // Mantém o menu lateral compacto; a página de Integrações continua
  // reunindo todos os canais pelo item "Ver Todas".
  const compactIntegrationMenuItems = [
    ...integrationMenuItems.slice(0, 2),
    integrationMenuItems[integrationMenuItems.length - 1],
  ]

  // ─── menuItems do HUB (Filtrados por Permissão Real) ──────────────────────
  interface MenuItemDef {
    icon: string
    label: string
    path: string
    perm?: string
  }

  interface MenuSectionDef {
    section: string
    items: MenuItemDef[]
  }

  const rawMenuItems: MenuSectionDef[] = [
    {
      section: 'Principal',
      items: [
        { icon: 'dashboard', label: 'Painel', path: '/hub', perm: 'dashboard.view' },
        { icon: 'chart', label: 'Estatísticas', path: '/hub/estatisticas', perm: 'stats.view' },
      ]
    },
    {
      section: 'Administrar',
      items: [
        { icon: 'box', label: 'Produtos', path: '/hub/produtos', perm: 'products.view' },
        { icon: 'bell', label: 'Avisos de Estoque', path: '/hub/avisos-estoque', perm: 'products.view' },
        { icon: 'tag', label: 'Categorias', path: '/hub/categorias', perm: 'categories.view' },
        { icon: 'cart', label: 'Pedidos', path: '/hub/pedidos', perm: 'orders.view' },
        { icon: 'truck', label: 'Envios', path: '/hub/envios', perm: 'orders.view' },
        { icon: 'users', label: 'Clientes', path: '/hub/clientes', perm: 'customers.view' },
      ]
    },
    {
      section: 'Financeiro',
      items: [
        { icon: 'dollar', label: 'Financeiro', path: '/hub/financeiro', perm: 'finance.view' },
        { icon: 'creditCard', label: 'Pagamentos', path: '/hub/pagamentos', perm: 'mercado_pago.view' },
        { icon: 'fileText', label: 'Notas Fiscais', path: '/hub/notas-fiscais', perm: 'finance.view' },
      ]
    },
    {
      section: 'Integrações',
      items: can('integrations.view') ? compactIntegrationMenuItems : []
    },
    {
      section: 'Conteúdo',
      items: [
        { icon: 'layout', label: 'Páginas', path: '/hub/paginas', perm: 'pages.view' },
        { icon: 'blog', label: 'Blog', path: '/hub/blog', perm: 'pages.view' },
        { icon: 'ads', label: 'Ads', path: '/hub/ads', perm: 'pages.view' },
      ]
    },
    {
      section: 'Sistema',
      items: [
        { icon: 'user', label: 'Usuários', path: '/hub/usuarios', perm: 'users.view' },
        { icon: 'settings', label: 'Configurações', path: '/hub/configuracoes', perm: 'settings.view' },
      ]
    },
  ]

  const menuItems = rawMenuItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.perm || can(item.perm))
    }))
    .filter(section => section.items.length > 0)

  return (
    <div className={`hub-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <HubToast />

      {/* ── Sidebar (estilo visual FLOW, funcionalidade original) ── */}
      <aside className="hub-sidebar">
        {/* Sidebar Header — logo TEKNIX vetorial + botão colapso */}
        <div className="sidebar-header">
          <Link to="/hub" className="sidebar-logo-link">
            {/* Logo TEKNIX vetorial (mesmo do FLOW) */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 113.98 26.81" className="sidebar-logo-svg">
              <g fill="currentColor">
                <polygon points="56.95 26.15 52.21 26.19 49.52 22.34 46.09 17.51 43.48 20.03 43.46 26.2 39.44 26.2 39.44 .97 43.47 .96 43.46 8.58 43.48 15.21 51.4 7.36 56.59 7.39 48.85 14.95 56.95 26.15"/>
                <path d="M108.37,23.32v2.92c-1.43.03-2.67.06-3.99-.35-1.52-.47-2.96-1.36-3.93-2.62l-2.33-3.01-1.92,2.5c-2.19,2.85-4.83,3.73-8.34,3.46v-4.11s1.05-.05,1.05-.05c1.62.13,3.09-.56,4.07-1.81l2.65-3.39-6.67-8.75c-.13-.17-.09-.58-.02-.78h4.17s5,6.3,5,6.3l2.55-3.22,2.47-3.08h4c.29.46.05.9-.23,1.27l-1.28,1.63-5.04,6.64,2.87,3.61c.77.97,1.9,1.47,3.1,1.59h1.8s.02,1.25.02,1.25Z"/>
                <path d="M73.33,16.07c0-2.87-2.11-5.18-4.91-5.42s-5.53,1.78-5.67,4.7l-.08,10.84h-4.03s0-10.25,0-10.25c-.05-3.9,2.25-7.33,5.86-8.8,5.04-2.05,10.8.7,12.44,5.9.25.8.32,1.59.4,2.44v10.71s-4,.01-4,.01v-10.14Z"/>
                <path d="M30.76,22.09c.85-.54,1.36-1.25,1.75-2.1l4.25-.02c-1.16,3.7-4.45,6.33-8.32,6.78-3.61.42-7.13-.96-9.32-3.89s-2.66-6.84-1.08-10.29c1.38-3.01,4.26-5.3,7.79-5.81,4.59-.66,8.98,1.97,10.63,6.32.61,1.61.78,3.31.63,4.98h-15.86c.15,1.19.6,2.15,1.38,3.02,2.04,2.26,5.53,2.68,8.14,1.01ZM33,14.94c-.33-1.55-1.15-2.63-2.23-3.48-2.31-1.51-5.23-1.46-7.44.24-1.02.78-1.71,1.92-2.06,3.25h11.73Z"/>
                <path d="M15.99,26.22l-4.32-.04c-3.82-.04-6.97-3.46-6.99-6.94l-.05-8.69c0-.45-.36-.84-.81-.85l-3.82-.02v-4.29s2.76.01,2.76.01c3.36.19,6.11,2.9,6.14,6.26l.07,7.03c.02,2.11,2.06,3.26,3.97,3.25l3.06-.02-.02,4.3Z"/>
                <path d="M15.76,4.67l.02,4.17-3.43-.03c-3.15-.21-5.64-2.77-5.88-5.9L6.42,0h4.35s0,3.8,0,3.8c.06.49.37.86.86.87h4.13Z"/>
                <rect x="81.41" y="7.34" width="4.08" height="18.87"/>
                <polygon points="85.48 5.19 81.42 5.17 81.42 .98 85.48 .96 85.48 5.19"/>
              </g>
            </svg>
          </Link>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
            aria-expanded={sidebarOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="18" height="18">
              {sidebarOpen ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
            </svg>
          </button>
        </div>

        {/* Navigation — estrutura original com visual FLOW */}
        <nav className="sidebar-nav">
          {menuItems.map((group) => (
            <div key={group.section} className="nav-group">
              <span className="nav-group-label">{group.section}</span>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="nav-icon">{icons[item.icon]}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer original */}
        <div className="sidebar-footer">
          <a href="/" className="sidebar-link" target="_blank" rel="noopener noreferrer">
            <span className="nav-icon">{icons.external}</span>
            <span className="nav-label">Ver site público</span>
          </a>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="hub-main">
        {/* Header — visual FLOW com Lime Capsule */}
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
            {location.pathname.includes('/avisos-estoque') ? null : (
              <h1 className="hub-page-title">
                {getPageTitle(location.pathname)}
              </h1>
            )}
          </div>

          <div className="hub-header-right">
            {/* Lime Capsule Pill (FLOW 1:1) */}
            <div style={{ position: 'relative' }} ref={notifDropdownRef}>
              <div className="mp-header-pill-hub">
                {/* Chat Interno TEKNIX (1:1 com FLOW) */}
                <HubChatPillButton />

                {/* Notificações */}
                <button
                  type="button"
                  className="flow-pill-btn"
                  title="Notificações e Alertas"
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false) }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="flow-badge-red">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>

                {/* Usuário logado */}
                <button
                  type="button"
                  className="flow-user-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="flow-user-avatar-wrap">
                    <img
                      src={userPhoto}
                      alt={userNickname}
                      className="flow-user-avatar-img"
                    />
                  </div>
                  <span className="flow-user-name-text">{userNickname}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ color: '#4b5563' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>

              {showNotifications && (
                <div className="flow-notification-dropdown" onClick={e => e.stopPropagation()}>
                  {/* Mercado Livre Notification Center Header */}
                  <div className="flow-notification-header">
                    <div className="flow-notification-top-row">
                      <h3 className="flow-notification-title">Notificações</h3>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="flow-notification-mark-read-btn"
                          onClick={() => markAllAsRead()}
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    <div className="flow-notification-tabs">
                      <button
                        type="button"
                        className={`flow-notification-tab ${notificationTab === 'all' ? 'active' : ''}`}
                        onClick={() => setNotificationTab('all')}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        className={`flow-notification-tab ${notificationTab === 'unread' ? 'active' : ''}`}
                        onClick={() => setNotificationTab('unread')}
                      >
                        Não lidas
                        {unreadCount > 0 && (
                          <span className="flow-notification-tab-badge">{unreadCount}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notification Items List */}
                  <div className="flow-notification-list">
                    {(() => {
                      const list = notificationTab === 'unread'
                        ? notifications.filter(n => !n.is_read)
                        : notifications

                      if (list.length === 0) {
                        return (
                          <div className="flow-notification-empty">
                            <div className="flow-notification-empty-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                              </svg>
                            </div>
                            <p className="flow-notification-empty-title">
                              {notificationTab === 'unread'
                                ? 'Nenhuma notificação não lida'
                                : 'Você não tem notificações'}
                            </p>
                            <p className="flow-notification-empty-desc">
                              {notificationTab === 'unread'
                                ? 'Você leu todas as notificações recentes.'
                                : 'Atualizações sobre vendas, pedidos e novidades aparecerão aqui.'}
                            </p>
                          </div>
                        )
                      }

                      return list.slice(0, 18).map((item) => {
                        const mod = String(item.module || '').toLowerCase()
                        const type = String(item.type || '').toLowerCase()
                        const isSale = mod === 'sale' || mod === 'order' || type === 'order'
                        const isPix = mod === 'pix'
                        const isPayment = mod === 'payment'
                        const isStock = mod === 'stock'
                        const isShipment = mod === 'shipment'
                        const isInvoice = mod === 'invoice'
                        const isError = type === 'error'

                        let iconSymbol: React.ReactElement = (
                          <svg viewBox="0 0 24 24">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                        )
                        let iconBg = '#f0f4f8'
                        let iconColor = '#475569'

                        if (isSale) {
                          // Mercado Livre green cart
                          iconSymbol = (
                            <svg viewBox="0 0 24 24">
                              <circle cx="9" cy="20" r="1.5"/>
                              <circle cx="19" cy="20" r="1.5"/>
                              <path d="M2.5 3h3l2.4 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 1.9-1.4l2.1-8.6H6.5"/>
                            </svg>
                          )
                          iconBg = '#e8f8ee'
                          iconColor = '#00a650'
                        } else if (isPix || isPayment) {
                          // Mercado Pago blue payment
                          iconSymbol = (
                            <svg viewBox="0 0 24 24">
                              <rect x="2.5" y="5" width="19" height="14" rx="2.5"/>
                              <line x1="2.5" y1="10" x2="21.5" y2="10"/>
                              <line x1="6" y1="15" x2="10" y2="15"/>
                            </svg>
                          )
                          iconBg = '#ebf3fe'
                          iconColor = '#2563eb'
                        } else if (isStock) {
                          // Amber stock box
                          iconSymbol = (
                            <svg viewBox="0 0 24 24">
                              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                              <path d="m3.3 7 8.7 5 8.7-5"/>
                              <path d="M12 22V12"/>
                            </svg>
                          )
                          iconBg = '#fff5e5'
                          iconColor = '#ea580c'
                        } else if (isShipment) {
                          // Mercado Envios delivery truck
                          iconSymbol = (
                            <svg viewBox="0 0 24 24">
                              <rect x="2" y="4" width="13" height="11" rx="1.5"/>
                              <polygon points="15 8 19 8 22 12 22 15 15 15 15 8"/>
                              <circle cx="6" cy="18.5" r="2"/>
                              <circle cx="18" cy="18.5" r="2"/>
                            </svg>
                          )
                          iconBg = '#e5f5fc'
                          iconColor = '#0284c7'
                        } else if (isInvoice) {
                          // Fiscal purple invoice
                          iconSymbol = (
                            <svg viewBox="0 0 24 24">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                          )
                          iconBg = '#f3ebff'
                          iconColor = '#7c3aed'
                        } else if (isError) {
                          // Red alert
                          iconSymbol = (
                            <svg viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                          )
                          iconBg = '#feeaea'
                          iconColor = '#dc2626'
                        }

                        const timeStr = formatRelativeTime(item.created_at)

                        return (
                          <div
                            key={item.id}
                            className={`flow-notification-item ${item.is_read ? 'read' : 'unread'}`}
                            onClick={() => {
                              if (!item.is_read) markAsRead(item.id)
                              setShowNotifications(false)
                              navigate(resolveNotificationUrl(item))
                            }}
                          >
                            <div className="flow-notification-icon" style={{ background: iconBg, color: iconColor }}>
                              {iconSymbol}
                            </div>
                            <div className="flow-notification-content">
                              <h4 className="flow-notification-item-title">{cleanNotificationText(item.title)}</h4>
                              {item.message && (
                                <p className="flow-notification-item-desc">{cleanNotificationText(item.message)}</p>
                              )}
                              <span className="flow-notification-item-time">{timeStr}</span>
                            </div>
                            {!item.is_read && <span className="flow-notification-dot" title="Não lida" />}
                          </div>
                        )
                      })
                    })()}
                  </div>

                  {/* Modeless Footer */}
                  <Link
                    to="/hub/notificacoes"
                    onClick={() => setShowNotifications(false)}
                    className="flow-notification-footer"
                  >
                    Ver todas as notificações →
                  </Link>
                </div>
              )}

              {showUserDropdown && (
                <div className="flow-user-dropdown" onClick={() => setShowUserDropdown(false)}>
                  <div className="flow-user-dropdown-header">
                    <div className="flow-dropdown-name">{userName}</div>
                    <div className="flow-dropdown-email">{userEmail}</div>
                  </div>
                  <div className="flow-dropdown-divider" />
                  <Link to="/hub/usuarios" className="flow-dropdown-item">
                    Dados da conta
                  </Link>
                  <Link to="/hub/configuracoes" className="flow-dropdown-item">
                    Configurações da loja
                  </Link>
                  <div className="flow-dropdown-divider" />
                  <Link to="/login" className="flow-dropdown-item logout">
                    Sair
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content protegido por Permissões Reais */}
        <div className="hub-content">
          {canAccessRoute(location.pathname) ? (
            <Outlet />
          ) : (
            <AccessDenied
              title="Acesso Não Autorizado"
              message={`Seu perfil de colaborador não possui permissão para acessar o módulo "${getPageTitle(location.pathname)}". Solicite a liberação ao administrador principal.`}
            />
          )}
        </div>
      </main>

      {/* Janela Flutuante do Messenger Operacional (Mesmo do FLOW) */}
      <FloatingMessenger />
    </div>
  )
}

// ─── Export Principal Envolvido com o Contexto Global do Chat ──────────────
export default function HubLayout() {
  return (
    <InternalChatProvider>
      <HubLayoutContent />
    </InternalChatProvider>
  )
}

// ─── getPageTitle original (inalterado) ─────────────────────────────────────
function getPageTitle(pathname: string): string {
  if (pathname === '/hub') return 'Painel'
  if (pathname.includes('/produtos/novo')) return 'Novo produto'
  if (pathname.includes('/produtos/editar')) return 'Editar produto'
  if (pathname.includes('/produtos')) return 'Produtos'
  if (pathname.includes('/avisos-estoque')) return 'Avisos de Estoque'
  if (pathname.includes('/categorias')) return 'Categorias'
  if (pathname.includes('/pedidos')) return 'Pedidos'
  if (pathname.includes('/clientes')) return 'Clientes'
  if (pathname.includes('/financeiro')) return 'Financeiro'
  if (pathname.includes('/pagamentos')) return 'Pagamentos'
  if (pathname.includes('/mercado-livre')) return 'Mercado Livre'
  if (pathname.includes('/shopee')) return 'Shopee'
  if (pathname.includes('/amazon')) return 'Amazon'
  if (pathname.includes('/magalu')) return 'Magalu'
  if (pathname.includes('/integracoes')) return 'Integrações'
  if (pathname.includes('/mercado-pago')) return 'Mercado Pago'
  if (pathname.includes('/whatsapp')) return 'WhatsApp'
  if (pathname.includes('/usuarios')) return 'Usuários'
  if (pathname.includes('/configuracoes')) return 'Configurações'
  if (pathname.includes('/estatisticas')) return 'Estatísticas'
  if (pathname.includes('/paginas')) return 'Páginas'
  if (pathname.includes('/blog/add')) return 'Novo post'
  if (pathname.includes('/blog/editar')) return 'Editar post'
  if (pathname.includes('/blog')) return 'Blog'
  if (pathname.includes('/ads')) return 'Anúncios & Banners'
  return 'HUB'
}
