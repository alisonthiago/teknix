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
        <div className="flex items-center gap-4">
          <div className="relative p-[2px] rounded-full bg-gradient-to-br from-[#ff4b3e] via-[#ff8b1f] to-[#ffd21c] flex-shrink-0 shadow-sm">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center">
              {userProfile.photo_url ? (
                <Image src={userProfile.photo_url} alt={userProfile.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
              ) : (
                <User className="w-6 h-6 text-[#ccc]" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#19c968] border-2 border-white" aria-label="Online" title="Online" />
          </div>
          <div>
            <h1 className="text-[24px] sm:text-[26px] font-semibold text-black tracking-tight">Olá, {userProfile.name?.split(' ')[0]}</h1>
          </div>
        </div>
      )}

      {/* Global Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-[#e6e6e6] rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-[#222222]">
          <Filter className="w-4 h-4 text-[#222222]" />
          <span className="font-semibold text-[#111111]">Filtros</span>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2 flex-1">
          <select
            value={selectedMarketplace}
            onChange={e => {
              setSelectedMarketplace(e.target.value)
              setSelectedAccount('ALL')
            }}
            style={{ color: '#111111', backgroundColor: '#ffffff', colorScheme: 'light', WebkitTextFillColor: '#111111' }}
            className="w-full sm:w-auto px-3 h-[38px] border border-[#e6e6e6] rounded-lg text-xs font-medium text-[#111111] bg-white focus:outline-none focus:border-[#1f2328] cursor-pointer"
          >
            <option value="ALL" style={{ color: '#111111', backgroundColor: '#ffffff' }}>Todos os marketplaces</option>
            {filterData?.marketplaces.map(mp => (
              <option key={mp.id} value={mp.id} style={{ color: '#111111', backgroundColor: '#ffffff' }}>{mp.name}</option>
            ))}
          </select>

          <select
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            style={{ color: '#111111', backgroundColor: '#ffffff', colorScheme: 'light', WebkitTextFillColor: '#111111' }}
            className="w-full sm:w-auto px-3 h-[38px] border border-[#e6e6e6] rounded-lg text-xs font-medium text-[#111111] bg-white focus:outline-none focus:border-[#1f2328] cursor-pointer"
          >
            <option value="ALL" style={{ color: '#111111', backgroundColor: '#ffffff' }}>Todas as contas</option>
            {filteredAccounts.map(acc => (
              <option key={acc.id} value={acc.id} style={{ color: '#111111', backgroundColor: '#ffffff' }}>{acc.account_name}</option>
            ))}
          </select>

          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ color: '#111111', backgroundColor: '#ffffff', colorScheme: 'light', WebkitTextFillColor: '#111111' }}
            className="col-span-2 w-full sm:col-span-1 sm:w-auto px-3 h-[38px] border border-[#e6e6e6] rounded-lg text-xs font-medium text-[#111111] bg-white focus:outline-none focus:border-[#1f2328] cursor-pointer"
          >
            <option value="7" style={{ color: '#111111', backgroundColor: '#ffffff' }}>Últimos 7 dias</option>
            <option value="30" style={{ color: '#111111', backgroundColor: '#ffffff' }}>Últimos 30 dias</option>
            <option value="90" style={{ color: '#111111', backgroundColor: '#ffffff' }}>Últimos 90 dias</option>
          </select>
        </div>

        <span className="text-[11px] font-medium text-[#555555] hidden sm:block">{getFilterLabel()}</span>
      </div>

      {/* CARD DESTAQUE VENDAS DE HOJE (MONITOR AO VIVO) */}
      {/* CARD DESTAQUE VENDAS DE HOJE (MONITOR AO VIVO) */}
      <div className="bg-[#B5F500] rounded-2xl py-5 sm:py-6 px-6 sm:px-8 lg:px-10 shadow-sm border border-[#a2e000] text-[#111] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center shrink-0">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e74c3c] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#e74c3c]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#333]">Vendas de Hoje</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-black/10 text-[#222] tracking-wider uppercase">
                Ao Vivo
              </span>
            </div>
            <div className="text-[24px] sm:text-[30px] font-semibold tracking-tight text-[#111] mt-0.5 font-sans flex items-baseline gap-1">
              <span className="text-[18px] font-medium">R$</span>
              {(stats?.todayRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] font-normal text-[#444]">
              Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Atualizado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right pr-3 border-r border-black/10">
              <span className="text-[10px] font-medium uppercase text-[#444] block">Vendas Brutas</span>
            <span className="text-[15px] font-semibold text-[#111] font-mono">
              R$ {(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <Link
            href="/ao-vivo"
            className="px-5 py-2.5 rounded-lg bg-[#1f2328] hover:bg-black text-white text-[13px] font-medium transition-colors flex items-center justify-center gap-2 shadow-2xs shrink-0"
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
          <div className="px-6 sm:px-8 lg:px-9 pt-5 sm:pt-6">
            <div className="mp-card-tabs">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`mp-card-tab ${tab === t.id ? 'mp-card-tab-active' : ''}`}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="px-6 sm:px-8 lg:px-9 py-5 sm:py-6 flex-1">
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
        <div className="xl:col-span-3 mp-card flex flex-col justify-between min-h-[240px]">
          <div>
            <h3 className="text-base font-semibold text-[#333]">Pedidos</h3>
            <p className="text-3xl font-bold text-[#111] mt-3">{stats?.totalOrders || 0}</p>
            <p className="text-xs text-[#999] mt-1">Total acumulado</p>
          </div>
          <Link href="/pedidos" className="mp-btn-secondary w-full mt-6 text-center">Ver pedidos</Link>
        </div>

        {/* Card produtos ativos */}
        <div className="xl:col-span-4 mp-card flex flex-col justify-between min-h-[240px]">
          <div>
            <h3 className="text-base font-semibold text-[#333]">Produtos Ativos</h3>
            <p className="text-3xl font-bold text-[#111] mt-3">{stats?.activeProducts || 0}</p>
            <p className="text-xs text-[#999] mt-1">Itens no catálogo</p>
          </div>
          <Link href="/operacao" className="mp-btn-secondary w-full mt-6 text-center">
            Ver produtos
          </Link>
        </div>
      </div>

      {/* ── Últimos Pedidos (1:1 com o HUB) ── */}
      <div className="mp-card !py-6 !px-6 sm:!px-8 lg:!px-10">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
          <div>
            <h2 className="mp-section-title">Últimos Pedidos</h2>
          </div>
          <Link href="/pedidos" className="mp-see-all-link">
            Conferir todos →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(stats?.orders || []).length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888888' }}>
              <ShoppingCart size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, color: '#333333', fontSize: 15 }}>Nenhum pedido realizado no filtro selecionado</p>
              <p style={{ fontSize: 13, color: '#888888', marginTop: 4 }}>
                As vendas aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            (stats?.orders || []).map((order: Record<string, any>) => {
              const mp = order.marketplaces as Record<string, unknown> | null
              const firstItem = order.order_items?.[0]
              const prod = firstItem?.products
              const prodTitle = prod?.name || order.product_name || 'Lava Jato Lavadora Portátil De Alta Pressão 21v'
              const prodSku = prod?.sku || order.sku || 'LAVA-JATO-21V'
              const prodImage = prod?.image_url || null
              const isCancelled = String(order.status || '').toUpperCase() === 'CANCELADO'

              return (
                <div
                  key={order.id as string}
                  className="dash-order-row"
                  onClick={() => router.push(`/pedidos/${order.id}`)}
                  title="Clique para abrir detalhes do pedido"
                >
                  {/* Thumbnail */}
                  <div className="dash-order-thumb">
                    {prodImage ? (
                      <img src={prodImage} alt={prodTitle} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ShoppingCart size={18} color="#666" aria-hidden />
                    )}
                  </div>

                  {/* Nome + detalhes */}
                  <div className="dash-order-info">
                    <p className="mp-list-item-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prodTitle}
                    </p>
                    <div className="dash-order-meta">
                      <span className="dash-order-buyer">{(order.customer_name as string) || 'Comprador'}</span>
                      {prodSku && (
                        <>
                          <span className="dash-meta-dot">•</span>
                          <span className="dash-order-sku">SKU: {prodSku}</span>
                        </>
                      )}
                      <span className={`dash-badge ${isCancelled ? 'badge-red' : 'badge-success'}`}>
                        {isCancelled ? 'Cancelado' : 'Aprovado'}
                      </span>
                    </div>
                  </div>

                  {/* ID Marketplace + data */}
                  <div className="dash-order-id-col">
                    {order.order_number && (
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#111' }}>
                        {order.order_number}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#888888', fontWeight: 500 }}>
                      • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Marketplace badge + Valor */}
                  <div className="dash-order-right">
                    <div className="dash-mp-badge">
                      <MarketplaceLogo name={(mp?.name as string) || 'Mercado Livre'} className="w-3.5 h-3.5 shrink-0" />
                      <span>{(mp?.name as string) || 'Loja Própria'}</span>
                    </div>
                    <span className="dash-order-price">
                      R$ {Number(order.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
