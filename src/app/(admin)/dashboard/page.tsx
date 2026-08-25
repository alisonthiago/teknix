'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, ShoppingCart, Eye, EyeOff, Filter, User } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { CockpitCentralOperacao } from '@/components/CockpitCentralOperacao'

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
    let salesQuery = s.from('sales').select('total_revenue, status, marketplace_id').order('created_at', { ascending: false })
    let ordersQuery = s.from('orders').select('id, status, total_amount, customer_name, marketplace_id, created_at, order_number, marketplaces(name, logo), order_items(*, products(name, sku, image_url))').order('created_at', { ascending: false })
    const purchasesQuery = s.from('purchases').select('total_cost')
    const productsQuery = s.from('products').select('id, stock, min_stock, cost_purchase, status')

    if (selectedMarketplace !== 'ALL') {
      salesQuery = salesQuery.eq('marketplace_id', selectedMarketplace)
      ordersQuery = ordersQuery.eq('marketplace_id', selectedMarketplace)
    }

    const [products, sales, orders, purchases] = await Promise.all([
      productsQuery,
      salesQuery,
      ordersQuery,
      purchasesQuery,
    ])

    const todayStr = new Date().toLocaleDateString('pt-BR')
    const validOrders = orders.data || []
    const todayOrders = validOrders.filter(o => {
      const orderDate = new Date(o.created_at || (o as any).updated_at).toLocaleDateString('pt-BR')
      const isCancelled = String(o.status || '').toUpperCase() === 'CANCELADO'
      return orderDate === todayStr && !isCancelled
    })
    const todayRevenue = todayOrders.length > 0
      ? todayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      : 0

    const activeProducts = products.data?.filter(p => p.status === 'ACTIVE').length ?? 0
    const totalRevenue = sales.data?.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0) ?? 0
    const totalOrders = orders.data?.length ?? 0
    return {
      activeProducts,
      todayRevenue,
      todayOrdersCount: todayOrders.length,
      totalRevenue,
      totalOrders,
      orders: (orders.data || []).slice(0, 5),
      allOrders: orders.data || [],
      allProducts: products.data || []
    }
  }, [selectedMarketplace, selectedAccount])

  const tabs = [
    { id: 'faturamento', label: 'Faturamento' },
    { id: 'vendas', label: 'Vendas' },
    { id: 'lucro', label: 'Lucro' },
  ]

  const tabValues: Record<string, { value: string; subtitle: string }> = {
    faturamento: {
      value: `R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Receita bruta acumulada',
    },
    vendas: {
      value: String(stats?.totalOrders || 0),
      subtitle: `${stats?.totalOrders || 0} pedidos`,
    },
    lucro: {
      value: 'R$ —',
      subtitle: 'Configure integrações',
    },
  }

  const current = tabValues[tab]

  const getFilterLabel = () => {
    const mp = selectedMarketplace === 'ALL' ? 'Todos marketplaces' : filterData?.marketplaces.find(m => m.id === selectedMarketplace)?.name
    const acc = selectedAccount === 'ALL' ? 'Todas contas' : filterData?.accounts.find(a => a.id === selectedAccount)?.account_name
    return `${mp} • ${acc}`
  }

  return (
    <div className="mp-stack">
      {/* User Welcome Banner */}
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
              <h1 className="text-[32px] font-bold text-[#333]">Olá, {userProfile.name}</h1>
            <p className="text-[13px] text-[#666] font-medium">Bem-vindo de volta!</p>
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

      {/* CARD DESTAQUE VENDAS DE HOJE (MONITOR AO VIVO) */}
      <div className="bg-[#B5F500] rounded-2xl px-5 sm:px-6 py-3 sm:py-4 shadow-sm border border-[#a2e000] text-[#111] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center shrink-0">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e74c3c] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#e74c3c]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold uppercase tracking-wider text-[#333]">Vendas de Hoje</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-black/10 text-[#222] tracking-wider uppercase">
                Ao Vivo
              </span>
            </div>
            <div className="text-[26px] sm:text-[32px] font-black tracking-tight text-[#111] mt-0.5 font-sans flex items-baseline gap-1">
              <span className="text-[20px] font-bold">R$</span>
              {(stats?.todayRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] font-medium text-[#444]">
               {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Sincronização ativa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right pr-3 border-r border-black/10">
              <span className="text-[10px] font-extrabold uppercase text-[#444] block">Vendas Brutas</span>
            <span className="text-[15px] font-black text-[#111] font-mono">
              R$ {(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <Link
            href="/ao-vivo"
            className="px-5 py-3 rounded-xl bg-black hover:bg-[#222] text-white text-[13px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <span>Ir para o Monitor ao Vivo</span>
            <span className="text-[14px]">→</span>
          </Link>
        </div>
      </div>

      {/* 🧠 Cockpit Inteligente de Operação */}
      <CockpitCentralOperacao orders={stats?.allOrders || []} products={stats?.allProducts || []} />

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
              <button onClick={() => setHidden(!hidden)} className="w-10 h-10 rounded-full flex items-center justify-center text-[#111] hover:bg-[#EEFFB3]/60 transition-colors shrink-0">
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

      {/* Linha 2 — Últimos Pedidos Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-12 mp-card p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0] mb-4">
            <div>
              <h2 className="mp-section-title">Últimos Pedidos</h2>
              <p className="mp-list-item-sub mt-1">Vendas recentes</p>
            </div>
            <Link href="/pedidos" className="mp-see-all-link">
              Conferir todos →
            </Link>
          </div>

          <div className="divide-y divide-[#f0f0f0]">
            {(stats?.orders || []).map((order: Record<string, any>) => {
              const mp = order.marketplaces as Record<string, unknown> | null
              const acc = order.marketplace_accounts as Record<string, unknown> | null
              const firstItem = order.order_items?.[0]
              const prod = firstItem?.products
              const prodTitle = prod?.name || order.product_name || 'Lava Jato Lavadora Portátil De Alta Pressão 21v'
              const prodSku = prod?.sku || order.sku || 'LAVA-JATO-21V'
              const prodImage = prod?.image_url || null
              const isCancelled = String(order.status || '').toUpperCase() === 'CANCELADO'

              return (
                <div
                  key={order.id as string}
                  onClick={() => router.push(`/pedidos/${order.id}`)}
                  className="py-4 px-3 sm:py-5 sm:px-4 hover:bg-[#fafafa] rounded-xl transition-all cursor-pointer flex items-center gap-3 sm:gap-3.5 group"
                >
                  {/* Foto */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#f5f5f5] border border-[#e6e6e6] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {prodImage ? (
                      <img src={prodImage} alt={prodTitle} className="w-full h-full object-contain" />
                    ) : (
                      <ShoppingCart className="w-5 h-5 text-[#666]" strokeWidth={1.5} />
                    )}
                  </div>

                  {/* Conteúdo: título + cliente + status (limpo no mobile) */}
                  <div className="flex-1 min-w-0">
                    <p className="mp-list-item-title truncate">{prodTitle}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <span className="text-[11px] text-[#888] truncate">{(order.customer_name as string) || 'Comprador'}</span>
                      <span className="hidden sm:inline text-[#bbb]">•</span>
                      <span className="hidden sm:inline font-mono text-[12px] text-[#999] truncate">SKU: {prodSku}</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border shrink-0 ${
                        isCancelled
                          ? 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]'
                          : 'bg-[#ecfdf5] text-[#16a34a] border-[#bbf7d0]'
                      }`}>
                        {isCancelled ? 'Cancelado' : 'Aprovado'}
                      </span>
                    </div>
                  </div>

                  {/* Pedido + data (somente desktop) */}
                  <div className="hidden sm:block text-right shrink-0">
                    <div className="font-mono font-bold text-[13px] text-[#111]">{order.order_number}</div>
                    <div className="text-[12px] text-[#888] font-medium">• {new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>

                  {/* Marketplace (desktop) + Valor */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#fafafa] border border-[#eee] text-[11px] font-bold text-[#555]">
                      <MarketplaceLogo name={(mp?.name as string) || 'Mercado Livre'} className="w-3.5 h-3.5 shrink-0" />
                      <span>{(mp?.name as string) || 'ML'}</span>
                    </div>
                    <span className="font-black text-[#111] text-[14px] text-right">
                      R$ {Number(order.total_amount || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
