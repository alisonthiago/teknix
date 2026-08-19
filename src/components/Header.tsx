'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { TeknixLogo } from './TeknixLogo'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, User, Settings, Calculator, BadgeDollarSign, Menu, X } from 'lucide-react'
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
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotification()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setUserOpen, setNotifOpen])

  useEffect(() => {
    setUserOpen(false)
    setNotifOpen(false)
  }, [pathname, setUserOpen, setNotifOpen])

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
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[11px] text-[#3483fa] hover:underline">Marcar lidas</button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-[#999]">Nenhuma notificação</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id)
                      
                      if (n.module && n.entity_id) {
                        let path = ''
                        switch(n.module) {
                          case 'products': path = `/produtos/${n.entity_id}/editar`; break;
                          case 'suppliers': path = `/fornecedores/${n.entity_id}/editar`; break;
                          case 'purchases': path = `/compras/${n.entity_id}`; break;
                          case 'sales': path = `/vendas/${n.entity_id}`; break;
                          case 'orders': path = `/pedidos`; break;
                          case 'users': path = `/sistema/colaboradores`; break;
                        }
                        if (path) {
                          setNotifOpen(false)
                          router.push(path)
                        }
                      }
                    }}
                    className={`p-3 rounded-xl mb-1 cursor-pointer transition-colors ${n.is_read ? 'hover:bg-[#f5f5f5]' : 'bg-[#f0f7ff] hover:bg-[#e6f0ff]'}`}
                  >
                    <div className="flex gap-3">
                      <div>
                        <p className={`text-[13px] ${n.is_read ? 'text-[#666]' : 'text-[#333] font-medium'}`}>
                          {n.actor_name && <span className="font-bold mr-1">{n.actor_name}</span>}
                          {n.title}
                        </p>
                        <p className="text-[11px] text-[#666] mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onCalcOpen}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#333] hover:bg-[#EEFFB3]/60 transition-colors"
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
          <div className="flex items-center gap-0.5">
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

      {/* Desktop — título + pill amarela */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-[#f5f5f5] items-center justify-between py-5 px-10">
        <h1 className="text-[26px] font-semibold text-[#333] leading-tight">{pageTitle}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowBasicCalc(!showBasicCalc)}
              className="w-10 h-10 rounded-full hover:bg-[#ecf3fe] text-[#3483fa] flex items-center justify-center transition-colors border border-transparent hover:border-[#3483fa]"
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

      {calcOpen && <MarginCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />}
    </>
  )
}
