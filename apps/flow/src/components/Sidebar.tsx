'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  LogOut,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  PanelLeft,
  User,
  Store,
  Radio,
  Tag,
  ExternalLink,
  X,
} from 'lucide-react'
import { logout } from '@/app/login/actions'
import { TeknixLogo } from './TeknixLogo'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  permission: string | null
  isLive?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Início', icon: LayoutDashboard, permission: null },
      { href: '/ao-vivo', label: 'Monitor ao Vivo', icon: Radio, permission: null, isLive: true },
    ],
  },
  {
    label: 'Equipe & Operação',
    items: [
      { href: '/etiquetas', label: 'Etiquetas', icon: Tag, permission: 'orders.view' },
      { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart, permission: 'orders.view' },
      { href: '/vendas', label: 'Vendas', icon: DollarSign, permission: 'sales.view' },
      { href: '/operacao', label: 'Catálogo & Estoque', icon: Package, permission: 'products.view' },
      { href: '/marketplaces', label: 'Marketplaces', icon: Store, permission: 'marketplaces.view' },
      { href: '/clientes', label: 'Clientes & CRM', icon: User, permission: null },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/financeiro', label: 'Financeiro', icon: DollarSign, permission: 'finance.view' },
      { href: '/precificacao', label: 'Precificação', icon: TrendingUp, permission: 'products.view' },
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
  onHoverChange?: (hovered: boolean) => void
}

export default function Sidebar({
  permissions,
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
  onHoverChange,
}: SidebarProps) {
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

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1025px)').matches) {
      onHoverChange?.(true)
    }
  }

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1025px)').matches) {
      onHoverChange?.(false)
    }
  }

  return (
    <>
      {/* ── Sidebar (1:1 com referência HUB Floating Apple Clean) ── */}
      <aside
        className="hub-sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Sidebar Header — logo TEKNIX vetorial + botão fechar mobile */}
        <div className="sidebar-header flex items-center justify-between px-4 sm:px-5 h-[64px] shrink-0">
          <Link href="/dashboard" className="sidebar-logo-link flex items-center shrink-0" onClick={() => setMobileOpen(false)}>
            <TeknixLogo height={22} className="sidebar-logo-svg h-[22px] max-h-[22px] w-auto fill-[#111827] text-[#111827] block" style={{ height: '22px', maxHeight: '22px', width: 'auto', display: 'block' }} />
          </Link>

          {/* Botão toggle / fechar mobile com ícone PanelLeft */}
          <button
            type="button"
            className="sidebar-toggle w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer shrink-0"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
                setMobileOpen(false)
              } else {
                setCollapsed(!collapsed)
                onHoverChange?.(false)
              }
            }}
            aria-label="Alternar menu lateral"
            title="Menu lateral"
          >
            <PanelLeft className="w-5 h-5 text-[#64748b] hover:text-[#111]" strokeWidth={1.75} />
          </button>
        </div>

        {/* Navigation — estrutura com ondulações e largura 90% */}
        <nav className="sidebar-nav">
          {visibleGroups.map((group, gi) => (
            <div key={gi} className="nav-group">
              {group.label && <span className="nav-group-label">{group.label}</span>}
              {group.items.map(item => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`nav-item ${active ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon">
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 ${
                          active
                            ? item.isLive ? 'text-[#e74c3c]' : 'text-[#000000]'
                            : item.isLive ? 'text-[#e74c3c]' : 'text-[#000000]'
                        }`}
                        strokeWidth={1.5}
                      />
                    </span>
                    <span className="nav-label">{item.label}</span>
                    {item.isLive && (
                      <span className="nav-live-badge px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#e74c3c] text-white tracking-wider uppercase ml-auto">
                        AO VIVO
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer com Ver site público e Sair */}
        <div className="sidebar-footer">
          <a
            href="/"
            className="sidebar-link"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? 'Ver site público' : undefined}
          >
            <span className="nav-icon">
              <ExternalLink className="w-[18px] h-[18px] text-[#000000]" strokeWidth={1.5} />
            </span>
            <span className="nav-label">Ver site público</span>
          </a>

          <form action={logout}>
            <button
              type="submit"
              className="sidebar-link sidebar-logout-btn"
              title={collapsed ? 'Sair' : undefined}
            >
              <span className="nav-icon">
                <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </span>
              <span className="nav-label">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Backdrop Mobile para fechar Sidebar ao tocar fora */}
      {mobileOpen && (
        <div
          className="hub-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
