'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Store,
} from 'lucide-react'
import { logout } from '@/app/login/actions'
import { TeknixLogo } from './TeknixLogo'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  permission: string | null
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [
      { href: '/dashboard', label: 'Início', icon: LayoutDashboard, permission: null },
    ],
  },
  {
    label: 'Operação',
    items: [
      { href: '/marketplaces', label: 'Marketplaces', icon: Store, permission: 'marketplaces.view' },
      { href: '/operacao', label: 'Operação', icon: Package, permission: 'products.view' },
      { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart, permission: 'orders.view' },
      { href: '/vendas', label: 'Vendas', icon: DollarSign, permission: 'sales.view' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/precificacao', label: 'Precificação', icon: TrendingUp, permission: 'products.view' },
      { href: '/financeiro', label: 'Financeiro', icon: DollarSign, permission: 'finance.view' },
      { href: '/analises', label: 'Análises', icon: BarChart3, permission: 'reports.view' },
    ],
  },
]

interface SidebarProps {
  permissions: string[]
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export default function Sidebar({ permissions, mobileOpen, setMobileOpen, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const permSet = new Set(permissions)

  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || permSet.has(item.permission)),
  })).filter(group => group.items.length > 0)

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + '/'),
    [pathname],
  )

  const renderNavLinks = (isNavCollapsed: boolean) => (
    <>
      {visibleGroups.map((group, gi) => (
        <div key={gi}>
          {group.label && !isNavCollapsed && (
            <p className="px-4 pt-5 pb-2 text-xs text-[#999]">
              {group.label}
            </p>
          )}
          {group.label && isNavCollapsed && <div className="pt-4" />}
          <div>
            {group.items.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={isNavCollapsed ? item.label : undefined}
                  className={`flex items-center transition-colors min-h-[44px] relative ${
                    isNavCollapsed ? 'justify-center px-0 py-3 mx-2 rounded-lg' : 'gap-3 px-4 py-3'
                  } ${
                    active
                      ? 'text-[#3483fa] font-semibold bg-[#ecf3fe]/50'
                      : 'text-[#333] font-normal hover:bg-[#f5f5f5]'
                  }`}
                >
                  <Icon
                    className={`w-[22px] h-[22px] shrink-0 ${active ? 'text-[#3483fa]' : 'text-[#666]'}`}
                    strokeWidth={1.5}
                  />
                  {!isNavCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-[40] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed top-0 left-0 h-full bg-white z-50 flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        <div className={`h-[72px] flex items-center shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center">
              <TeknixLogo className="h-6 w-auto fill-[#333]" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center text-[#666] hover:text-[#333] transition-colors"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <PanelLeftClose className="w-5 h-5" strokeWidth={1.5} />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto pb-4">{renderNavLinks(collapsed)}</nav>

        <div className={`shrink-0 ${collapsed ? 'p-2' : 'p-4'}`}>
          <form action={logout}>
            <button
              type="submit"
              title={collapsed ? 'Sair' : undefined}
              className={`flex items-center transition-colors text-sm text-[#666] hover:text-[#333] min-h-[44px] ${
                collapsed ? 'w-full justify-center px-0 py-2' : 'w-full gap-3 px-4 py-2'
              }`}
            >
              <LogOut className="w-[22px] h-[22px] shrink-0" strokeWidth={1.5} />
              {!collapsed && <span>Sair</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 flex flex-col transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 shrink-0">
          <Link href="/dashboard" className="flex items-center" onClick={() => setMobileOpen(false)}>
            <TeknixLogo className="h-6 w-auto fill-[#333]" />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-9 h-9 rounded-full bg-[#f5f5f5] flex items-center justify-center"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5 text-[#333]" strokeWidth={1.75} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto pb-4">{renderNavLinks(false)}</nav>
        <div className="p-4 shrink-0 border-t border-[#eeeeee]">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#666] hover:text-[#333] transition-colors"
            >
              <LogOut className="w-[22px] h-[22px] shrink-0" strokeWidth={1.5} />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
