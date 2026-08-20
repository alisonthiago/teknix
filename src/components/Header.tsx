'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { TeknixLogo } from './TeknixLogo'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, User, Settings, Calculator, BadgeDollarSign, Menu, X, ShoppingCart, AlertCircle, RefreshCw, Package } from 'lucide-react'
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
  const pathname = usePathname()
  const router = useRouter()

  // Buscar total de vendas de hoje para o badge do Header
  const { data: todayRevenue } = useSupabaseQuery<number>(async (supabase) => {
    const { data } = await supabase
      .from('orders')
      .select('total_amount')
      .order('created_at', { ascending: false })
      .limit(50)
    return (data || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  }, [], { intervalMs: 2000 })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setUserOpen, setNotifOpen])

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'vendas' | 'estoque' | 'pedidos' | 'integracoes'>('all')

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

  const renderNotificationIcon = (type?: string, module?: string) => {
    const t = String(type || module || '').toLowerCase()
    if (t.includes('sale') || t.includes('venda')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#059669] shrink-0">
          <ShoppingCart className="w-4 h-4" />
        </div>
      )
    }
    if (t.includes('stock') || t.includes('estoque')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center text-[#d97706] shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
      )
    }
    if (t.includes('integration') || t.includes('marketplace') || t.includes('sync')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a] shrink-0">
          <RefreshCw className="w-4 h-4" />
        </div>
      )
    }
    if (t.includes('error') || t.includes('erro')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center text-[#dc2626] shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb] shrink-0">
        <Package className="w-4 h-4" />
      </div>
    )
  }

  const filteredNotifications = notifications.filter(n => {
    if (selectedCategory === 'all') return true
    const mod = String(n.module || n.type || (n as any).metadata?.category || '').toLowerCase()
    if (selectedCategory === 'vendas') return mod.includes('sale') || mod.includes('venda')
    if (selectedCategory === 'estoque') return mod.includes('stock') || mod.includes('estoque')
    if (selectedCategory === 'pedidos') return mod.includes('order') || mod.includes('pedido')
    if (selectedCategory === 'integracoes') return mod.includes('marketplace') || mod.includes('sync') || mod.includes('integration')
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
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#e74c3c] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] bg-white rounded-3xl border border-[#e6e6e6] shadow-[0_12px_36px_rgba(0,0,0,0.12)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-[#eeeeee] flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#333]">Central de Notificações</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff0f0] text-[#e74c3c]">
                    {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-[#3483fa] hover:underline cursor-pointer"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-[#f0f0f0] bg-white overflow-x-auto text-[11px]">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'vendas', label: 'Vendas' },
                { id: 'estoque', label: 'Estoque' },
                { id: 'pedidos', label: 'Pedidos' },
                { id: 'integracoes', label: 'Canais' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#3483fa] text-white shadow-sm'
                      : 'text-[#666] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notification Items List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f5f5f5] p-1.5">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mx-auto mb-2 text-[#94a3b8]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#333]">Nenhuma notificação</p>
                  <p className="text-[11px] text-[#999] mt-1">Você está atualizado com todos os eventos do sistema.</p>
                </div>
              ) : (
                filteredNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id)
                      
                      let path = ''
                      const mod = String(n.module || n.type || '').toLowerCase()
                      if (mod.includes('order') || mod.includes('pedido') || mod.includes('sale') || mod.includes('venda')) {
                        path = n.entity_id ? `/pedidos/${n.entity_id}` : '/pedidos'
                      } else if (mod.includes('product') || mod.includes('produto') || mod.includes('stock') || mod.includes('estoque')) {
                        path = '/operacao'
                      } else if (mod.includes('market') || mod.includes('integr')) {
                        path = '/marketplaces'
                      }

                      if (path) {
                        setNotifOpen(false)
                        router.push(path)
                      }
                    }}
                    className={`p-3 rounded-2xl transition-all cursor-pointer flex gap-3 items-start my-1 ${
                      n.is_read
                        ? 'hover:bg-[#f8f9fa] opacity-80'
                        : 'bg-[#f0f7ff]/70 hover:bg-[#e6f1ff] border border-[#d6e7ff]'
                    }`}
                  >
                    {renderNotificationIcon(n.type, n.module)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-[12px] leading-tight truncate ${n.is_read ? 'text-[#555]' : 'text-[#111] font-bold'}`}>
                          {cleanTitle(n.title)}
                        </p>
                        <span className="text-[10px] text-[#999] shrink-0">{formatTimeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-[11px] text-[#666] leading-snug mt-1 line-clamp-2">{cleanTitle(n.message)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#84cc16] shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

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

      {/* 🔴 BOTÃO AO VIVO DENTRO DA PÍLULA VERDE */}
      <button
        onClick={() => setLiveDrawerOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111] hover:bg-[#222] text-white text-[11px] font-black shadow-xs transition-all tracking-wider uppercase cursor-pointer"
        title="Monitor ao Vivo em Tempo Real"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e74c3c] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e74c3c]"></span>
        </span>
        <span className="text-[#B5F500] font-mono">
          {todayRevenue && todayRevenue > 0
            ? `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : 'AO VIVO'}
        </span>
      </button>

      {/* Drawer Deslizante no Canto Direito */}
      <LiveMonitorDrawer
        open={liveDrawerOpen}
        onClose={() => setLiveDrawerOpen(false)}
      />

      <button
        onClick={onCalcOpen}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#333] hover:bg-[#EEFFB3]/60 transition-colors cursor-pointer"
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
      {/* Mobile — barra amarela MP */}
      <div className="lg:hidden sticky top-0 z-30 px-3 sm:px-4 pt-2 sm:pt-3 pb-2 bg-[#f5f5f5]">
        <div className="bg-[#B5F500] rounded-full flex items-center justify-between px-2 py-1.5 shadow-sm">
          <button
            onClick={onMenuOpen}
            className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-[#333]" strokeWidth={1.75} />
          </button>
          <div className="flex items-center text-[#333]">
            <TeknixLogo className="h-4 w-auto fill-[#333]" />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLiveDrawerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFE600] text-[#111] text-[10px] font-black border border-[#E5CC00] shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#e74c3c] animate-pulse" />
              <span>AO VIVO</span>
            </button>
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

      {/* Desktop — título + Botão Monitor ao Vivo + pill verde */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-[#f5f5f5] items-center justify-between py-5 px-10">
        <h1 className="text-[26px] font-semibold text-[#333] leading-tight">{pageTitle}</h1>
        
        <div className="flex items-center gap-3">
          
          {/* 🔴 BOTÃO MONITOR AO VIVO DESTACADO NO HEADER */}
          <button
            onClick={() => setLiveDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#B5F500] hover:bg-[#a3e600] text-[#111] text-[13px] font-extrabold shadow-sm border border-[#a2e000] hover:shadow-md transition-all cursor-pointer group"
            title="Abrir Monitor ao Vivo no canto direito da tela"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e74c3c] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e74c3c]"></span>
            </span>
            <span>Monitor ao Vivo</span>
            <span className="font-mono bg-black/10 px-2 py-0.5 rounded-full text-[11px] font-black text-[#111]">
              {todayRevenue && todayRevenue > 0
                ? `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : 'AO VIVO'}
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowBasicCalc(!showBasicCalc)}
              className="w-10 h-10 rounded-full hover:bg-[#EEFFB3]/60 text-[#111] flex items-center justify-center transition-colors border border-transparent hover:border-[#B5F500]"
              title="Abrir Calculadora Básica"
            >
              <Calculator className="w-5 h-5" strokeWidth={1.5} />
            </button>
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
