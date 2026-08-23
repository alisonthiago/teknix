'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { TeknixLogo } from './TeknixLogo'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, User, Settings, Calculator, BadgeDollarSign, Menu, X, ShoppingCart, AlertCircle, RefreshCw, Package, MessageSquare, CheckSquare } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import MarginCalculator from '@/components/MarginCalculator'
import BasicCalculatorPopup from '@/components/BasicCalculatorPopup'

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
}: {
  userName: string
  userRole: string
  userEmail: string
  userId: string
  userAvatarUrl?: string | null
  onCalcOpen: () => void
}) {
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [liveDrawerOpen, setLiveDrawerOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotification()
  const { totalUnreadCount, setIsFloatingOpen, setIsFloatingMinimized } = useInternalChat()
  const pathname = usePathname()
  const router = useRouter()

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
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setUserOpen, setNotifOpen])

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

  const renderNotificationIcon = (type?: string, module?: string, title?: string) => {
    const t = String(type || module || title || '').toLowerCase()

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
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#333] hover:bg-[#EEFFB3]/60 transition-colors relative cursor-pointer"
          title="Notificações"
        >
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          {activeUnreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#e74c3c] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in-50 duration-200">
              {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-[420px] max-w-[94vw] bg-white rounded-3xl border border-[#e6e6e6] shadow-[0_12px_40px_rgba(0,0,0,0.14)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header Notificações Inteligentes */}
            <div className="p-4 border-b border-[#eeeeee] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-black text-[#1f2328]">Alertas & Mercado Livre</h3>
                {activeUnreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#fff0f0] text-[#e74c3c] border border-[#ffcdd2]">
                    {activeUnreadCount} nova{activeUnreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {activeUnreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-[#3483fa] hover:underline cursor-pointer"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-2.5 border-b border-[#f0f0f0] bg-[#fafafa] overflow-x-auto text-[11px]">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'mensagens', label: 'Mensagens' },
                { id: 'vendas', label: 'Vendas' },
                { id: 'perguntas', label: 'Perguntas' },
                { id: 'estoque', label: 'Estoque' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#1f2328] text-white shadow-2xs'
                      : 'text-[#666] hover:bg-white hover:text-[#111]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notification Items List Estilo Mercado Livre */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f0f0f0] p-2 space-y-1">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mx-auto mb-2 text-[#94a3b8]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#333]">Nenhum alerta recente</p>
                  <p className="text-[11px] text-[#999] mt-1">Você está em dia com todas as perguntas, vendas e estoque do Mercado Livre.</p>
                </div>
              ) : (
                filteredNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id)
                      
                      let path = ''
                      const mod = String(n.module || n.type || n.title || '').toLowerCase()
                      if (mod.includes('message') || mod.includes('mensagem') || mod.includes('question') || mod.includes('pergunta')) {
                        path = '/atendimento'
                      } else if (mod.includes('sale') || mod.includes('venda') || mod.includes('vendeu') || mod.includes('order') || mod.includes('pedido')) {
                        path = '/pedidos'
                      } else if (mod.includes('product') || mod.includes('produto') || mod.includes('stock') || mod.includes('estoque')) {
                        path = '/operacao'
                      } else {
                        path = '/atendimento'
                      }

                      setNotifOpen(false)
                      router.push(path)
                    }}
                    className={`p-3 rounded-2xl transition-all cursor-pointer flex gap-3 items-center ${
                      n.is_read
                        ? 'bg-white hover:bg-[#fafafa]'
                        : 'bg-[#fafafa] hover:bg-[#f5f5f5] border border-[#e2e8f0]'
                    }`}
                  >
                    {renderNotificationIcon(n.type, n.module, n.title)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-[12px] leading-snug line-clamp-1 ${n.is_read ? 'text-[#333]' : 'text-[#111] font-extrabold'}`}>
                          {cleanTitle(n.title)}
                        </p>
                        <span className="text-[10px] text-[#999] shrink-0 font-medium">{formatTimeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-[11px] text-[#666] leading-tight mt-1 line-clamp-1">{cleanTitle(n.message)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}

            {/* Footer */}
            <div className="p-2.5 border-t border-[#f0f0f0] bg-[#fafafa] text-center">
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

      {/* 💬 BOTÃO DO CHAT INTERNO COM BADGE DE NÃO LIDAS */}
      <button
        onClick={() => {
          setIsFloatingOpen(true)
          setIsFloatingMinimized(false)
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#333] hover:bg-[#EEFFB3]/60 transition-colors relative cursor-pointer"
        title="Chat Interno TEKNIX"
      >
        <MessageSquare className="w-5 h-5 text-[#1e293b]" strokeWidth={1.5} />
        {totalUnreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#16a34a] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* 🔴 BOTÃO AO VIVO DENTRO DA PÍLULA VERDE (AGORA PRETO CLEAN CONFORME PEDIDO) */}
      <button
        onClick={() => setLiveDrawerOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111111] hover:bg-[#222222] text-white text-[11px] font-black shadow-sm transition-all tracking-wider uppercase cursor-pointer"
        title="Monitor ao Vivo em Tempo Real"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e74c3c] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e74c3c]"></span>
        </span>
        <span className="font-mono font-bold whitespace-nowrap">
          {todayRevenue && todayRevenue > 0
            ? `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : 'R$ 0,00'}
        </span>
      </button>

      {/* Drawer Deslizante no Canto Direito */}
      <LiveMonitorDrawer
        open={liveDrawerOpen}
        onClose={() => setLiveDrawerOpen(false)}
      />

      <button
        onClick={onCalcOpen}
        className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center text-[#333] hover:bg-[#EEFFB3]/60 transition-colors cursor-pointer"
        title="Precificação"
      >
        <BadgeDollarSign className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <div ref={userRef} className="relative">
        <button
          onClick={() => setUserOpen(!userOpen)}
          className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-[#EEFFB3]/60 transition-colors"
        >
          <div className="relative">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-[#f5f5f5]">
              {userAvatarUrl ? (
                <Image
                  src={userAvatarUrl}
                  alt={userName}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userEmail || 'user'}`}
                  alt="Avatar"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
          <span className="hidden sm:block text-sm font-medium text-[#333] max-w-[90px] truncate">{userName}</span>
          <ChevronDown className="w-4 h-4 text-[#666] hidden sm:block" strokeWidth={2} />
          </button>
        {userOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-[#e6e6e6] shadow-[0_8px_24px_rgba(0,0,0,0.1)] overflow-hidden z-50">
            <div className="p-4 border-b border-[#eeeeee]">
              <p className="text-sm font-semibold text-[#333]">{userName}</p>
              <p className="text-xs text-[#999] mt-0.5">{userRole}</p>
            </div>
            <div className="p-1.5">
              <button 
                onClick={() => {
                  setUserOpen(false)
                  router.push('/sistema/perfil')
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f5] rounded-xl"
              >
                <User className="w-4 h-4" strokeWidth={1.5} /> Meu Perfil
              </button>
              <button 
                onClick={() => {
                  setUserOpen(false)
                  router.push('/sistema')
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f5] rounded-xl"
              >
                <Settings className="w-4 h-4" strokeWidth={1.5} /> Configurações
              </button>
              <button 
                onClick={() => {
                  setUserOpen(false)
                  setIsFloatingOpen(true)
                  setIsFloatingMinimized(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f5] rounded-xl"
              >
                <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                <span>Conversas & Chat</span>
                {totalUnreadCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#16a34a] text-white">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            </div>
            <div className="p-1.5 border-t border-[#eeeeee]">
              <button 
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#f23d4f] hover:bg-[#fff5f5] rounded-xl"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} /> Sair
              </button>
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
      {/* Mobile — barra verde limpa e elegante */}
      <div className="lg:hidden sticky top-0 z-30 px-3 pt-2 pb-2 bg-[#f5f5f5]">
        <div className="bg-[#B5F500] rounded-full flex items-center justify-between px-2.5 py-1.5 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuOpen}
              className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shrink-0 shadow-2xs"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5 text-[#111]" strokeWidth={2} />
            </button>
            <div className="flex items-center text-[#111]">
              <TeknixLogo className="h-4 w-auto fill-[#111]" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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
        <div className="flex items-center justify-between mt-4 px-1">
          <h1 className="text-xl font-semibold text-[#333]">{pageTitle}</h1>
          <div className="relative">
            <button
              onClick={() => setShowBasicCalc(!showBasicCalc)}
              className="w-10 h-10 rounded-full hover:bg-[#ecf3fe] text-[#3483fa] flex items-center justify-center transition-colors border border-[#e6e6e6] hover:border-[#3483fa] bg-white shadow-sm"
              title="Abrir Calculadora Básica"
            >
              <Calculator className="w-5 h-5" strokeWidth={1.5} />
            </button>
            {showBasicCalc && <BasicCalculatorPopup onClose={() => setShowBasicCalc(false)} />}
          </div>
        </div>
      </div>

      {/* Desktop — título + pill verde */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-[#f5f5f5] items-center justify-between py-5 px-10">
        <h1 className="text-[26px] font-semibold text-[#333] leading-tight">{pageTitle}</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setShowBasicCalc(!showBasicCalc)}
              className="w-10 h-10 rounded-full hover:bg-[#EEFFB3]/60 text-[#111] flex items-center justify-center transition-colors border border-transparent hover:border-[#16a34a]"
              title="Abrir Calculadora Básica"
            >
              <Calculator className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <a
              href="/atividades"
              className="w-10 h-10 rounded-full hover:bg-[#EEFFB3]/60 text-[#111] flex items-center justify-center transition-colors border border-transparent hover:border-[#16a34a] relative"
              title="Atividades & Tarefas"
            >
              <CheckSquare className="w-5 h-5" strokeWidth={1.5} />
            </a>
            {showBasicCalc && <BasicCalculatorPopup onClose={() => setShowBasicCalc(false)} />}
          </div>

          <div className="mp-header-pill gap-0.5 py-1 px-2">
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
