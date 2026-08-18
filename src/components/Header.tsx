'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, LogOut, User, Settings, Calculator, Menu } from 'lucide-react'
import Image from 'next/image'
import { logout } from '@/app/login/actions'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import MarginCalculator from '@/components/MarginCalculator'

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
  onMenuOpen: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function HeaderActions({
  userName,
  userRole,
  userEmail,
  userOpen,
  setUserOpen,
  notifOpen,
  setNotifOpen,
  onCalcOpen,
}: {
  userName: string
  userRole: string
  userEmail: string
  userOpen: boolean
  setUserOpen: (v: boolean) => void
  notifOpen: boolean
  setNotifOpen: (v: boolean) => void
  onCalcOpen: () => void
}) {
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const { data: notifData } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('notifications').select('*').order('created_at', { ascending: false }).limit(10)
    if (error) throw error
    return data || []
  })
  const notifications = (notifData || []) as Record<string, unknown>[]
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setUserOpen, setNotifOpen])

  return (
    <>
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#333] hover:bg-[#EEFFB3]/60 transition-colors relative"
        >
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#3483fa] rounded-full" />
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-[#e6e6e6] shadow-[0_8px_24px_rgba(0,0,0,0.1)] overflow-hidden z-50">
            <div className="p-4 border-b border-[#eeeeee] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#333]">Notificações</h3>
              <span className="text-xs text-[#3483fa] font-medium cursor-pointer">Marcar como lidas</span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[#eeeeee]">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id as string} className={`p-4 hover:bg-[#fafafa] cursor-pointer ${!n.is_read ? 'bg-[#ecf3fe]/50' : ''}`}>
                  <p className="text-sm font-medium text-[#333]">{n.title as string}</p>
                  <p className="text-xs text-[#999] mt-0.5 truncate">{n.message as string}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="p-4 text-center text-[11px] text-[#999]">Nenhuma notificação</div>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onCalcOpen}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#333] hover:bg-[#EEFFB3]/60 transition-colors"
        title="Calculadora"
      >
        <Calculator className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <div ref={userRef} className="relative">
        <button
          onClick={() => setUserOpen(!userOpen)}
          className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-[#EEFFB3]/60 transition-colors"
        >
          <div className="h-9 w-9 rounded-full overflow-hidden bg-[#f5f5f5]">
            <Image
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userEmail || 'user'}`}
              alt="Avatar"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
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
              <Link href="/sistema/perfil" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f5] rounded-xl">
                <User className="w-4 h-4" strokeWidth={1.5} /> Meu Perfil
              </Link>
              <Link href="/sistema" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f5] rounded-xl">
                <Settings className="w-4 h-4" strokeWidth={1.5} /> Configurações
              </Link>
            </div>
            <div className="p-1.5 border-t border-[#eeeeee]">
              <form action={logout}>
                <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#f23d4f] hover:bg-[#fff5f5] rounded-xl">
                  <LogOut className="w-4 h-4" strokeWidth={1.5} /> Sair
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function Header({ userName, userRole, userEmail, onMenuOpen }: HeaderProps) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)

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
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#333] font-bold text-sm">
            TEKNIX
          </div>
          <div className="flex items-center gap-0.5">
            <HeaderActions
              userName={userName}
              userRole={userRole}
              userEmail={userEmail}
              userOpen={userOpen}
              setUserOpen={setUserOpen}
              notifOpen={notifOpen}
              setNotifOpen={setNotifOpen}
              onCalcOpen={() => setCalcOpen(true)}
            />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-[#333] mt-4 px-1">{pageTitle}</h1>
      </div>

      {/* Desktop — título + pill amarela */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-[#f5f5f5] items-center justify-between py-5 px-10">
        <h1 className="text-[26px] font-semibold text-[#333] leading-tight">{pageTitle}</h1>
        <div className="mp-header-pill gap-0.5 py-1 px-2">
          <HeaderActions
            userName={userName}
            userRole={userRole}
            userEmail={userEmail}
            userOpen={userOpen}
            setUserOpen={setUserOpen}
            notifOpen={notifOpen}
            setNotifOpen={setNotifOpen}
            onCalcOpen={() => setCalcOpen(true)}
          />
        </div>
      </header>

      {calcOpen && <MarginCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />}
    </>
  )
}
