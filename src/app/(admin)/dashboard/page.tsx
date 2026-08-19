'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, ShoppingCart, Eye, EyeOff, Filter, User } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

interface FilterOption {
  id: string
  name: string
}

interface MarketplaceFilter extends FilterOption {
  code: string
}

interface AccountFilter {
  id: string
  account_name: string
  marketplace_id: string
  status: string
}

export default function DashboardPage() {
  const [tab, setTab] = useState('faturamento')
  const [hidden, setHidden] = useState(false)
  const [selectedMarketplace, setSelectedMarketplace] = useState('ALL')
  const [selectedAccount, setSelectedAccount] = useState('ALL')
  const [period, setPeriod] = useState('30')
  const router = useRouter()

  const { data: filterData } = useSupabaseQuery<{ marketplaces: MarketplaceFilter[]; accounts: AccountFilter[] }>(async (s) => {
    const [mpsRes, accsRes] = await Promise.all([
      s.from('marketplaces').select('id, name, code').order('name'),
      s.from('marketplace_accounts').select('id, account_name, marketplace_id, status').is('deleted_at', null).order('created_at'),
    ])
    return {
      marketplaces: (mpsRes.data || []) as MarketplaceFilter[],
      accounts: (accsRes.data || []) as AccountFilter[],
    }
  }, [])

  const filteredAccounts = (filterData?.accounts || []).filter(
    a => selectedMarketplace === 'ALL' || a.marketplace_id === selectedMarketplace
  )

  const { data: userProfile } = useSupabaseQuery(async (s) => {
    const { data: { user } } = await s.auth.getUser()
    if (!user) return null
    const { data } = await s.from('profiles').select('name, photo_url').eq('id', user.id).single()
    return { name: data?.name || user.email?.split('@')[0], photo_url: data?.photo_url }
  }, [])

  const { data: stats } = useSupabaseQuery(async (s) => {
    let salesQuery = s.from('sales').select('total_revenue, status, marketplace_id, marketplace_account_id')
    let ordersQuery = s.from('orders').select('status, total_amount, customer_name, marketplace_id, marketplace_account_id, created_at, order_number, marketplaces(name, logo), marketplace_accounts(account_name)')
    const purchasesQuery = s.from('purchases').select('total_cost')
    const productsQuery = s.from('products').select('id, stock, min_stock, cost_purchase, status')

    if (selectedMarketplace !== 'ALL') {
      salesQuery = salesQuery.eq('marketplace_id', selectedMarketplace)
      ordersQuery = ordersQuery.eq('marketplace_id', selectedMarketplace)
    }
    if (selectedAccount !== 'ALL') {
      salesQuery = salesQuery.eq('marketplace_account_id', selectedAccount)
      ordersQuery = ordersQuery.eq('marketplace_account_id', selectedAccount)
    }

    const [products, sales, orders, purchases] = await Promise.all([
      productsQuery,
      salesQuery,
      ordersQuery,
      purchasesQuery,
    ])

    const activeProducts = products.data?.filter(p => p.status === 'ACTIVE').length ?? 0
    const totalRevenue = sales.data?.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0) ?? 0
    const totalOrders = orders.data?.length ?? 0
    return {
      activeProducts,
      totalRevenue,
      totalOrders,
      orders: (orders.data || []).slice(0, 5),
    }
  }, [selectedMarketplace, selectedAccount])

  const tabs = [
    { id: 'faturamento', label: 'Faturamento' },
    { id: 'vendas', label: 'Vendas' },
    { id: 'lucro', label: 'Lucro' },
  ]

  const tabValues: Record<string, { value: string; subtitle: string }> = {
    faturamento: {
      value: `R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR')}`,
      subtitle: 'Receita total no período',
    },
    vendas: {
      value: String(stats?.totalOrders || 0),
      subtitle: `${stats?.totalOrders || 0} pedidos no período`,
    },
    lucro: {
      value: 'R$ —',
      subtitle: 'Configure integrações para calcular',
    },
  }

  const current = tabValues[tab]

  const getFilterLabel = () => {
    const parts: string[] = []
    if (selectedMarketplace !== 'ALL') {
      const mp = filterData?.marketplaces.find(m => m.id === selectedMarketplace)
      parts.push(mp?.name || '')
    } else {
      parts.push('Todos os marketplaces')
    }
    if (selectedAccount !== 'ALL') {
      const acc = filterData?.accounts.find(a => a.id === selectedAccount)
      parts.push(acc?.account_name || '')
    }
    return parts.join(' · ')
  }

  return (
    <div className="mp-stack">
      {/* Welcome Banner */}
      {userProfile && (
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#f5f5f5] border-2 border-[#e6e6e6] flex items-center justify-center flex-shrink-0">
            {userProfile.photo_url ? (
              <Image src={userProfile.photo_url} alt={userProfile.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
            ) : (
              <User className="w-6 h-6 text-[#ccc]" />
            )}
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#333]">Olá, {userProfile.name} 👋</h1>
            <p className="text-[13px] text-[#666] font-medium">Bem-vindo de volta ao sistema!</p>
          </div>
        </div>
      )}

      {/* Global Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-[#e6e6e6] rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-[#999]">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filtros</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <select
            value={selectedMarketplace}
            onChange={e => {
              setSelectedMarketplace(e.target.value)
              setSelectedAccount('ALL')
            }}
            className="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 border border-[#e6e6e6] rounded-md text-xs text-[#333] bg-white focus:outline-none focus:border-[#3483fa] min-h-[44px]"
          >
            <option value="ALL">Todos os marketplaces</option>
            {filterData?.marketplaces.map(mp => (
              <option key={mp.id} value={mp.id}>{mp.name}</option>
            ))}
          </select>

          <select
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 border border-[#e6e6e6] rounded-md text-xs text-[#333] bg-white focus:outline-none focus:border-[#3483fa] min-h-[44px]"
          >
            <option value="ALL">Todas as contas</option>
            {filteredAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.account_name}</option>
            ))}
          </select>

          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 border border-[#e6e6e6] rounded-md text-xs text-[#333] bg-white focus:outline-none focus:border-[#3483fa] min-h-[44px]"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        <span className="text-[10px] text-[#999] hidden sm:block">{getFilterLabel()}</span>
      </div>

      {/* Linha 1 — cards estilo MP */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* Card principal — Faturamento com tabs */}
        <div className="xl:col-span-5 mp-card-flush flex flex-col">
          <div className="px-4 sm:px-6 pt-4 sm:pt-5">
            <div className="mp-card-tabs">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`mp-card-tab ${tab === t.id ? 'mp-card-tab-active' : ''}`}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                {hidden ? (
                  <p className="mp-amount">R$ •••••</p>
                ) : (
                  <p className="mp-amount">
                    {current.value.startsWith('R$') ? (
                      <>
                        R$ {current.value.replace('R$ ', '').split(',')[0]}
                        <span className="mp-amount-sup">,{current.value.split(',')[1] || '00'}</span>
                      </>
                    ) : (
                      current.value
                    )}
                  </p>
                )}
                <p className="text-sm text-[#999] mt-3">{current.subtitle}</p>
              </div>
              <button onClick={() => setHidden(!hidden)} className="w-10 h-10 rounded-full flex items-center justify-center text-[#3483fa] hover:bg-[#ecf3fe] transition-colors shrink-0">
                {hidden ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
              </button>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/financeiro" className="mp-btn-primary">Ver relatório</Link>
              <Link href="/vendas" className="mp-btn-secondary">Extrato</Link>
            </div>
          </div>
        </div>

        {/* Card pedidos */}
        <div className="xl:col-span-3 mp-card flex flex-col justify-between min-h-[260px]">
          <div>
            <h3 className="text-base font-semibold text-[#333]">Pedidos</h3>
            <p className="text-sm text-[#666] mt-4 leading-relaxed">
              Você tem <strong className="text-[#333]">{stats?.totalOrders || 0}</strong> pedidos este mês.
            </p>
          </div>
          <Link href="/pedidos" className="mp-btn-secondary w-full mt-6 text-center">Ver pedidos</Link>
        </div>

        {/* Card escuro — produtos ativos */}
        <div className="xl:col-span-4 rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6 text-white flex flex-col justify-between min-h-[260px]">
          <div>
            <h3 className="text-base font-semibold">Produtos ativos</h3>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              Você tem <strong className="text-white">{stats?.activeProducts || 0}</strong> produtos cadastrados.
            </p>
            <p className="text-4xl font-semibold mt-6">{stats?.activeProducts || 0}</p>
          </div>
          <Link href="/operacao" className="inline-flex items-center justify-center bg-white text-[#333] font-semibold rounded-xl px-5 py-3 text-sm hover:bg-white/90 transition-colors mt-6 w-fit">
            Ver produtos
          </Link>
        </div>
      </div>

      {/* Linha 2 — atividades */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-12 mp-card">
          <h2 className="text-base font-semibold text-[#333]">Últimos pedidos</h2>
          <Link href="/pedidos" className="mp-link mt-1 mb-2">Conferir todas →</Link>
          <div className="mt-4">
            {(stats?.orders || []).map((order: Record<string, unknown>) => {
              const mp = order.marketplaces as Record<string, unknown> | null
              const acc = order.marketplace_accounts as Record<string, unknown> | null
              return (
                <div key={order.id as string} onClick={() => router.push(`/pedidos/${order.id}`)} className="mp-activity-row cursor-pointer hover:bg-[#fafafa] rounded-lg transition-colors">
                  <span className="text-sm text-[#999]">{new Date(order.created_at as string).toLocaleDateString('pt-BR')}</span>
                  <div className="mp-icon-circle">
                    <ShoppingCart className="w-5 h-5 text-[#666]" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#333] text-sm truncate">{order.order_number as string}</p>
                    <p className="text-xs text-[#999] truncate">{(order.customer_name as string) || 'Cliente'}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-1.5 text-xs text-[#999]">
                    {typeof mp?.logo === 'string' && <MarketplaceLogo name={mp.name as string} className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{(mp?.name as string) || '—'}</span>
                    {acc && typeof acc.account_name === 'string' && (
                      <span className="text-[#ccc]">· {acc.account_name}</span>
                    )}
                  </div>
                  <div className="hidden md:flex mp-status-success">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                    {order.status === 'CANCELADO' ? 'Cancelado' : 'Aprovado'}
                  </div>
                  <span className="font-semibold text-[#333] text-sm text-right whitespace-nowrap">
                    R$ {Number(order.total_amount || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
