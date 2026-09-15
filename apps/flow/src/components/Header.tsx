'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { TeknixLogo } from './TeknixLogo'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, User, Settings, Calculator, BadgeDollarSign, Menu, X, ShoppingCart, AlertCircle, RefreshCw, Package, MessageSquare, CheckSquare, Eye, EyeOff, ChevronRight, CreditCard, Users, Layers, Shield, ExternalLink, Building2, Store } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import MarginCalculator from '@/components/MarginCalculator'
import BasicCalculatorPopup from '@/components/BasicCalculatorPopup'
import { usePermissions } from '@/lib/permissions-context'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Início',
  operacao: 'Operação',
  pedidos: 'Pedidos',
  vendas: 'Vendas',
  precificacao: 'Precificação',
  financeiro: 'Financeiro',
  analises: 'Análises',
  sistema: 'Sistema',
  products: 'Produtos',
  suppliers: 'Fornecedores',
  purchases: 'Compras',
  stock: 'Estoque',
  orders: 'Pedidos',
  picking: 'Separação',
  shipping: 'Expedição',
  sales: 'Vendas',
  marketplaces: 'Marketplaces',
  reports: 'Relatórios',
  'import-export': 'Import/Export',
  notifications: 'Notificações',
  users: 'Usuários',
  settings: 'Configurações',
}

function getPageTitle(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const last = parts[parts.length - 1]
  return ROUTE_LABELS[last] || ROUTE_LABELS[parts[0]] || 'TEKNIX'
}

interface HeaderProps {
  userName: string
  userRole: string
  userEmail: string
  userId: string
  userAvatarUrl?: string | null
  onMenuOpen: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

import { useNotification } from '@/contexts/NotificationContext'
import { useInternalChat } from '@/contexts/InternalChatContext'
import LiveMonitorDrawer from '@/components/LiveMonitorDrawer'

function HeaderActions({
  userName,
  userRole,
  userEmail,
  userId,
  userAvatarUrl,
  onCalcOpen,
  isMobile = false,
  onUserOpenChange,
}: {
  userName: string
  userRole: string
  userEmail: string
  userId: string
  userAvatarUrl?: string | null
  onCalcOpen: () => void
  isMobile?: boolean
  onUserOpenChange?: (open: boolean) => void
}) {
  const [userOpen, setUserOpen] = useState(false)

  useEffect(() => {
    onUserOpenChange?.(userOpen)
  }, [userOpen, onUserOpenChange])
  const [notifOpen, setNotifOpen] = useState(false)
  const [liveDrawerOpen, setLiveDrawerOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotification()
  const { totalUnreadCount, setIsFloatingOpen, setIsFloatingMinimized } = useInternalChat()
  const pathname = usePathname()
  const router = useRouter()

  let userPerms: { has: (c: string) => boolean; isAdmin: boolean; role: string } | null = null
  try {
    userPerms = usePermissions()
  } catch {}

  const effectiveRole = String(userRole || userPerms?.role || '').toUpperCase()
  const canAccessHub = 
    Boolean(userPerms?.isAdmin) || 
    effectiveRole === 'ADMIN' || 
    effectiveRole === 'MASTER' || 
    effectiveRole === 'GERENTE' || 
    effectiveRole === 'DIRETOR' || 
    effectiveRole === 'OWNER' ||
    Boolean(userPerms?.has?.('hub.access')) || 
    Boolean(userPerms?.has?.('settings.manage'))

  // Ocultar / Exibir valores (persistido no localStorage e sincronizado 1:1 HUB)
  const [hideValues, setHideValues] = useState<boolean>(() => {
    try {
      return localStorage.getItem('flow_hide_values') === 'true'
    } catch {
      return false
    }
  })

  const toggleHideValues = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setHideValues(prev => {
      const next = !prev
      try {
        localStorage.setItem('flow_hide_values', String(next))
        window.dispatchEvent(new CustomEvent('flow_hide_values_changed', { detail: { hide: next } }))
      } catch {}
      return next
    })
  }

  useEffect(() => {
    const handleHideChanged = (ev: Event) => {
      const customEv = ev as CustomEvent
      if (typeof customEv.detail?.hide === 'boolean') {
        setHideValues(customEv.detail.hide)
      }
    }
    window.addEventListener('flow_hide_values_changed', handleHideChanged)
    return () => window.removeEventListener('flow_hide_values_changed', handleHideChanged)
  }, [])

  // Buscar total de vendas estritamente de hoje para o badge do Header
  const { data: todayRevenue } = useSupabaseQuery<number>(async (supabase) => {
    const { data } = await supabase
      .from('orders')
      .select('total_amount, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(50)
    
    const todayStr = new Date().toLocaleDateString('pt-BR')
    const todayOrders = (data || []).filter(o => {
      const orderDate = new Date(o.created_at || o.updated_at).toLocaleDateString('pt-BR')
      return orderDate === todayStr
    })

    if (todayOrders.length > 0) {
      return todayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    }
    return 0
  }, [], { intervalMs: 2000 })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        if (window.innerWidth > 768) setUserOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setUserOpen, setNotifOpen])

  useEffect(() => {
    if (userOpen) {
      let originalOverflow = ''
      if (window.innerWidth <= 768) {
        originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
      }
      const handlePop = () => setUserOpen(false)
      window.addEventListener('popstate', handlePop)

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setUserOpen(false)
      }
      window.addEventListener('keydown', handleKey)

      return () => {
        if (originalOverflow) {
          document.body.style.overflow = originalOverflow
        }
        window.removeEventListener('popstate', handlePop)
        window.removeEventListener('keydown', handleKey)
      }
    }
  }, [userOpen])

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mensagens' | 'vendas' | 'perguntas' | 'estoque'>('all')

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Agora'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Agora'
    if (mins < 60) return `há ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `há ${hours}h`
    const days = Math.floor(hours / 24)
    return `há ${days}d`
  }

  const cleanTitle = (text?: string) => {
    if (!text) return ''
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim()
  }

  const renderNotificationIcon = (n: any) => {
    if (n.image_url) {
      return (
        <img src={n.image_url} alt="" className="w-10 h-10 rounded-xl object-contain border border-[#e6e6e6] bg-white p-0.5 shrink-0" />
      )
    }
    const t = String(n.module || n.title || n.type || '').toLowerCase()

    if (t.includes('lava jato') || t.includes('lavadora') || t.includes('pressão') || t.includes('mlb5090385757') || t.includes('2000018029918832')) {
      return (
        <div className="w-11 h-11 rounded-xl bg-white border border-[#e6e6e6] p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
          <img src="https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp" alt="Produto" className="w-full h-full object-contain" />
        </div>
      )
    }
    if (t.includes('parafusadeira') || t.includes('chave fenda') || t.includes('2000018014218344')) {
      return (
        <div className="w-11 h-11 rounded-xl bg-white border border-[#e6e6e6] p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
          <img src="https://http2.mlstatic.com/D_985226-MLA115019108190_082026-O.jpg" alt="Produto" className="w-full h-full object-contain" />
        </div>
      )
    }
    if (t.includes('laser') || t.includes('nivel') || t.includes('2000018011773470')) {
      return (
        <div className="w-11 h-11 rounded-xl bg-white border border-[#e6e6e6] p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
          <img src="https://http2.mlstatic.com/D_843763-MLA99938277957_112025-O.jpg" alt="Produto" className="w-full h-full object-contain" />
        </div>
      )
    }
    if (t.includes('message') || t.includes('mensagem')) {
      return (
        <div className="w-11 h-11 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center text-[#18181b] shrink-0 font-bold text-xs">
          <MessageSquare className="w-5 h-5 text-[#0f172a]" />
        </div>
      )
    }
    if (t.includes('sale') || t.includes('venda') || t.includes('vendeu')) {
      return (
        <div className="w-11 h-11 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#059669] shrink-0">
          <ShoppingCart className="w-5 h-5 text-[#16a34a]" />
        </div>
      )
    }
    if (t.includes('question') || t.includes('pergunta')) {
      return (
        <div className="w-11 h-11 rounded-xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center text-[#d97706] shrink-0">
          <MessageSquare className="w-5 h-5 text-[#d97706]" />
        </div>
      )
    }
    return (
      <div className="w-11 h-11 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center text-[#18181b] shrink-0">
        <Package className="w-5 h-5 text-[#475569]" />
      </div>
    )
  }

  const activeNotifs = notifications
  const activeUnreadCount = unreadCount

  const filteredNotifications = activeNotifs.filter(n => {
    const title = String(n.title || '').toLowerCase()
    const msg = String(n.message || '').toLowerCase()
    const mod = String(n.module || n.type || '').toLowerCase()

    // Bloqueio rigoroso de qualquer ação ou erro interno do sistema
    const isInternalAction = 
      title.includes('erro') ||
      title.includes('falha') ||
      title.includes('cnpj') ||
      title.includes('colaborador') ||
      title.includes('automaç') ||
      title.includes('fornecedor') ||
      title.includes('catálogo') ||
      title.includes('arquivo grande') ||
      title.includes('conexão') ||
      title.includes('token') ||
      title.includes('sucesso') ||
      title.includes('contato') ||
      title.includes('logomarca') ||
      msg.includes('json válido') ||
      msg.includes('receita federal') ||
      msg.includes('enviar pdf') ||
      msg.includes('foram atualizados') ||
      msg.includes('excede o limite') ||
      mod === 'suppliers' ||
      mod === 'auth' ||
      mod === 'system'

    if (isInternalAction) return false

    if (selectedCategory === 'all') return true
    if (selectedCategory === 'vendas') return mod.includes('sale') || mod.includes('venda') || mod.includes('vendeu') || title.includes('venda') || title.includes('vendeu')
    if (selectedCategory === 'mensagens') return mod.includes('message') || mod.includes('mensagem') || mod.includes('chat') || title.includes('mensagem')
    if (selectedCategory === 'perguntas') return mod.includes('question') || mod.includes('pergunta') || title.includes('pergunta')
    if (selectedCategory === 'estoque') return mod.includes('stock') || mod.includes('estoque') || title.includes('estoque')
    return true
  })

  return (
    <>
      {/* Notificações */}
      <div ref={notifRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setNotifOpen(!notifOpen)
            setUserOpen(false)
          }}
          className={isMobile ? "w-9 h-9 rounded-full flex items-center justify-center text-[#111] hover:bg-black/10 transition-colors relative cursor-pointer" : "flow-pill-btn"}
          title="Notificações e Alertas"
        >
          {isMobile ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell text-[#111]" aria-hidden="true">
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
          ) : (
            <Bell className="w-[21px] h-[21px]" strokeWidth={1.8} />
          )}
          {activeUnreadCount > 0 && (
            <span className="flow-badge-red" style={isMobile ? { top: 2, right: 2 } : undefined}>
              {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className={isMobile ? "fixed right-3 top-[60px] w-[min(420px,calc(100vw-24px))] max-h-[calc(100vh-75px)] bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_10px_28px_rgba(0,0,0,0.12)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150" : "absolute right-0 top-full mt-3 w-[390px] max-w-[94vw] bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_10px_28px_rgba(0,0,0,0.12)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"}>
            {/* Header Notificações Inteligentes */}
            <div className="px-4 py-3 border-b border-[#eeeeee] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-[#1f2328]">Alertas & Mercado Livre</h3>
                {activeUnreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#fff0f0] text-[#e74c3c] border border-[#ffcdd2]">
                    {activeUnreadCount} nova{activeUnreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {activeUnreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[9px] font-bold text-[#1f2328] hover:underline cursor-pointer"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Categorias de Filtro */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#f0f0f0] bg-[#fafafa] overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9]'
                }`}
              >
                Todas ({activeNotifs.length})
              </button>
              <button
                onClick={() => setSelectedCategory('vendas')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'vendas'
                    ? 'bg-[#16a34a] text-white shadow-xs'
                    : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9]'
                }`}
              >
                Vendas
              </button>
              <button
                onClick={() => setSelectedCategory('mensagens')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'mensagens'
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9]'
                }`}
              >
                Mensagens
              </button>
              <button
                onClick={() => setSelectedCategory('perguntas')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'perguntas'
                    ? 'bg-[#d97706] text-white shadow-xs'
                    : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9]'
                }`}
              >
                Perguntas
              </button>
            </div>

            {/* Lista */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-[#f0f0f0]">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center text-[#888]">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-[#ccc]" />
                  <p className="text-xs font-semibold">Nenhuma notificação encontrada</p>
                </div>
              ) : (
                filteredNotifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id)
                      const path = n.module === 'orders' && n.entity_id ? `/pedidos/${n.entity_id}` : '/notifications'
                      setNotifOpen(false)
                      router.push(path)
                    }}
                    className={`p-3 hover:bg-[#f9fafb] transition-colors cursor-pointer flex gap-3 items-start ${
                      !n.is_read ? 'bg-[#fcfdfa]' : ''
                    }`}
                  >
                    {renderNotificationIcon(n)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#111827] truncate">{cleanTitle(n.title)}</p>
                      <p className="text-[11px] text-[#4b5563] line-clamp-2 mt-0.5">{cleanTitle(n.message)}</p>
                      <span className="text-[9px] text-[#9ca3af] mt-1 block">{formatTimeAgo(n.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#f0f0f0] bg-[#fafafa] text-center">
              <Link
                href="/notifications"
                onClick={() => setNotifOpen(false)}
                className="text-[11px] font-bold text-[#5c8a00] hover:underline"
              >
                Ver histórico completo de notificações →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Somente no Desktop: Botão Ao Vivo + Drawer + Precificação */}
      {!isMobile && (
        <>
          <div className="hidden lg:inline-flex hub-live-revenue-capsule header-live-button">
            <button
              type="button"
              onClick={() => setLiveDrawerOpen(true)}
              className="hub-live-revenue-btn"
              title="Monitor ao Vivo em Tempo Real"
            >
              <span className="hub-live-pulse-wrapper">
                <span className="hub-live-pulse-ring" />
                <span className="hub-live-pulse-dot" />
              </span>
              <span className="hub-live-revenue-label">
                {hideValues ? '••••••' : (
                  todayRevenue && todayRevenue > 0
                    ? `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'R$ 0,00'
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleHideValues}
              className="hub-live-eye-btn"
              title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
              aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {hideValues ? (
                <EyeOff size={13} strokeWidth={1.8} />
              ) : (
                <Eye size={13} strokeWidth={1.8} />
              )}
            </button>
          </div>

          <LiveMonitorDrawer
            open={liveDrawerOpen}
            onClose={() => setLiveDrawerOpen(false)}
          />

          <button
            type="button"
            onClick={onCalcOpen}
            className="flow-pill-btn"
            title="Precificação Inteligente"
          >
            <BadgeDollarSign className="w-5 h-5" strokeWidth={1.6} />
          </button>
        </>
      )}

      {/* Usuário / Avatar — Mobile (1:1 HUB) ou Desktop (mp-wpn-header-user-btn) */}
      <div ref={userRef} className="relative">
        {isMobile ? (
          <button
            type="button"
            onClick={() => {
              setUserOpen(!userOpen)
              setNotifOpen(false)
            }}
            className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#f1f5f9] border border-black/10 shrink-0">
              {userAvatarUrl ? (
                <img
                  alt={userName}
                  src={userAvatarUrl}
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  alt="Avatar"
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userEmail || 'user'}`}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-[#111] max-w-[90px] truncate">{userName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-4 h-4 text-[#111] hidden sm:block" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            className="mp-wpn-header-user-btn"
            aria-label="Imagem do perfil e dados da conta"
          >
            <div className="mp-wpn-avatar-box">
              {userAvatarUrl ? (
                <Image
                  src={userAvatarUrl}
                  alt={userName}
                  width={28}
                  height={28}
                  className="mp-wpn-avatar-img"
                />
              ) : (
                <Image
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userEmail || 'user'}`}
                  alt="Avatar"
                  width={28}
                  height={28}
                  className="mp-wpn-avatar-img"
                />
              )}
            </div>
            <span className="mp-wpn-user-title hidden sm:block">{userName}</span>
            <ChevronDown size={14} className="mp-wpn-chevron hidden sm:block" />
          </button>
        )}

        {userOpen && (
          <div className="flow-user-drawer-wrapper">
            {/* Backdrop escurecido no mobile */}
            <div
              className="flow-user-drawer-backdrop"
              onClick={() => setUserOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Moderno 1:1 com a Referência Visual */}
            <div className="flow-user-dropdown mp-modern-user-menu" onClick={(e) => e.stopPropagation()}>
              {/* 1. Header do Usuário: Nome e E-mail à Esquerda + Avatar com Anel Gradiente à Direita */}
              <Link
                href="/sistema/perfil"
                className="modern-user-header-card"
                onClick={() => setUserOpen(false)}
              >
                <div className="modern-user-header-info">
                  <span className="modern-user-name">{userName || 'Alison'}</span>
                  <span className="modern-user-email">{userEmail || 'alison@teknixbrasil.com.br'}</span>
                </div>
                <div className="modern-user-avatar-ring">
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={userName || 'Perfil'}
                      className="modern-user-avatar-img"
                    />
                  ) : (
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userEmail || 'user'}`}
                      alt={userName || 'Perfil'}
                      className="modern-user-avatar-img"
                    />
                  )}
                </div>
              </Link>

              {/* 2. Lista de Itens do Menu */}
              <div className="modern-user-menu-list">
                {/* Perfil em Destaque */}
                <Link
                  href="/sistema/perfil"
                  className="modern-user-item active"
                  onClick={() => setUserOpen(false)}
                >
                  <User size={17} className="modern-item-icon" />
                  <span>Informações do perfil</span>
                </Link>

                {/* Troca de Conta: Foco no HUB com Badge PRO */}
                {canAccessHub && (
                  <a
                    href="http://localhost:5174/hub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modern-user-item"
                    onClick={() => setUserOpen(false)}
                    title="Acessar conta Teknix HUB (Loja Própria & E-commerce)"
                  >
                    <RefreshCw size={17} className="modern-item-icon" />
                    <span>Teknix HUB</span>
                    <span className="modern-badge hub">
                      ⚡ HUB
                    </span>
                  </a>
                )}

                <Link
                  href="/sistema/empresa"
                  className="modern-user-item"
                  onClick={() => setUserOpen(false)}
                >
                  <Building2 size={17} className="modern-item-icon" />
                  <span>Dados da empresa</span>
                </Link>

                <Link
                  href="/sistema/colaboradores"
                  className="modern-user-item"
                  onClick={() => setUserOpen(false)}
                >
                  <Users size={17} className="modern-item-icon" />
                  <span>Colaboradores & Permissões</span>
                </Link>

                <Link
                  href="/sistema"
                  className="modern-user-item"
                  onClick={() => setUserOpen(false)}
                >
                  <Settings size={17} className="modern-item-icon" />
                  <span>Configurações do sistema</span>
                </Link>

                <Link
                  href="/sistema/marketplaces"
                  className="modern-user-item"
                  onClick={() => setUserOpen(false)}
                >
                  <Store size={17} className="modern-item-icon" />
                  <span>Marketplaces & Integrações</span>
                </Link>

                <div className="modern-menu-divider" />

                <Link
                  href="/sistema/seguranca"
                  className="modern-user-item"
                  onClick={() => setUserOpen(false)}
                >
                  <Shield size={17} className="modern-item-icon" />
                  <span>Segurança da conta</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}


export default function Header({ userName, userRole, userEmail, userId, userAvatarUrl, onMenuOpen, collapsed, onToggleCollapse }: HeaderProps) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const [calcOpen, setCalcOpen] = useState(false)
  const [showBasicCalc, setShowBasicCalc] = useState(false)
  const [liveDrawerOpen, setLiveDrawerOpen] = useState(false)
  const [mobileUserOpen, setMobileUserOpen] = useState(false)

  // Buscar faturamento de hoje em tempo real
  const { data: todayRevenue } = useSupabaseQuery<number>(async (supabase) => {
    const { data } = await supabase
      .from('orders')
      .select('total_amount')
      .order('created_at', { ascending: false })
      .limit(50)
    return (data || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  }, [], { intervalMs: 2000 })

  return (
    <>
      {/* ── Mobile Header Oficial — Barra Verde #B5F500 (1:1 com HUB) ── */}
      <div className={`lg:hidden sticky top-0 z-30 hub-mobile-header-bar ${mobileUserOpen ? 'user-dropdown-open' : ''}`}>
        <div className="bg-[#B5F500] rounded-full flex items-center justify-between px-3.5 py-2.5 shadow-sm hub-mobile-pill relative z-[1005]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMenuOpen}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[#111] hover:bg-black/10 transition-colors cursor-pointer"
              aria-label="Abrir menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu w-7 h-7 text-[#111]" aria-hidden="true">
                <path d="M4 5h16" />
                <path d="M4 12h16" />
                <path d="M4 19h16" />
              </svg>
            </button>
            <Link href="/" className="flex items-center text-[#111]">
              <TeknixLogo height={28} style={{ fill: '#111', color: '#111' }} />
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCalcOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#111] hover:bg-black/10 transition-colors cursor-pointer"
              title="Precificação Inteligente"
            >
              <BadgeDollarSign className="w-5 h-5 text-[#111]" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => setShowBasicCalc(!showBasicCalc)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#111] hover:bg-black/10 transition-colors cursor-pointer"
              title="Abrir Calculadora Básica"
            >
              <Calculator className="w-5 h-5 text-[#111]" strokeWidth={1.6} />
            </button>
            {showBasicCalc && <BasicCalculatorPopup onClose={() => setShowBasicCalc(false)} />}

            <HeaderActions
              userName={userName}
              userRole={userRole}
              userEmail={userEmail}
              userId={userId}
              userAvatarUrl={userAvatarUrl}
              onCalcOpen={() => setCalcOpen(true)}
              isMobile={true}
              onUserOpenChange={setMobileUserOpen}
            />
          </div>
        </div>

      </div>

      {/* Desktop — título + pill oficial HUB */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-[#f5f5f5] items-center justify-between py-4 px-8">
        <h1 className="text-[22px] font-semibold text-[#1f2328] tracking-tight">{pageTitle}</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={() => setShowBasicCalc(!showBasicCalc)}
              className="w-9 h-9 rounded-full hover:bg-[#f5f5f5] text-[#1f2328] flex items-center justify-center transition-colors border border-[#e6e6e6] hover:border-[#1f2328] bg-white shadow-xs cursor-pointer"
              title="Abrir Calculadora Básica"
            >
              <Calculator className="w-4.5 h-4.5" strokeWidth={1.6} />
            </button>
            <a
              href="/atividades"
              className="w-9 h-9 rounded-full hover:bg-[#f5f5f5] text-[#1f2328] flex items-center justify-center transition-colors border border-[#e6e6e6] hover:border-[#1f2328] bg-white shadow-xs relative cursor-pointer"
              title="Atividades & Tarefas"
            >
              <CheckSquare className="w-4.5 h-4.5" strokeWidth={1.6} />
            </a>
            {showBasicCalc && <BasicCalculatorPopup onClose={() => setShowBasicCalc(false)} />}
          </div>

          <div className="mp-header-pill-hub">
            <HeaderActions
              userName={userName}
              userRole={userRole}
              userEmail={userEmail}
              userId={userId}
              userAvatarUrl={userAvatarUrl}
              onCalcOpen={() => setCalcOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Drawer Deslizante no Canto Direito */}
      <LiveMonitorDrawer
        open={liveDrawerOpen}
        onClose={() => setLiveDrawerOpen(false)}
      />

      {calcOpen && <MarginCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />}
    </>
  )
}
