'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Store, ShoppingBag, ArrowUpRight, Search, Layers, CheckCircle2, Package, User, MoreHorizontal } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'
import LoadingState from '@/components/ui/LoadingState'

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SalesTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterMp, setFilterMp] = useState('all')
  const [filterAcc, setFilterAcc] = useState('all')
  const [shareSale, setShareSale] = useState<any | null>(null)
  const [actionSale, setActionSale] = useState<any | null>(null)

  const { data: sales, loading: loadingSales } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('sales')
      .select('*, marketplaces(name, code, logo, id), sale_items(*, products(name, sku))')
      .order('created_at', { ascending: false })
    return data || []
  })

  const { data: orders, loading: loadingOrders } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('orders')
      .select('*, marketplaces(name, code, logo, id), order_items(*, products(name, sku, price))')
      .order('created_at', { ascending: false })
    return data || []
  })

  const { data: accounts } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('marketplace_accounts')
      .select('id, account_name, marketplace_id')
      .or('status.eq.active,status.eq.ACTIVE')
    return data || []
  })

  // Consolidação Inteligente de Vendas
  const consolidatedSales = useMemo(() => {
    const salesList = (sales || []) as Record<string, any>[]
    const ordersList = (orders || []) as Record<string, any>[]

    if (salesList.length > 0) {
      return salesList.map(s => {
        const mp = s.marketplaces || { name: 'Mercado Livre', logo: '/logos/mercado-livre.svg' }
        const items = s.sale_items || []
        const qty = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0) || 1
        return {
          id: s.id,
          orderId: s.order_id || s.id?.slice(0, 8),
          customerName: s.customer_name || 'Comprador Mercado Livre',
          marketplaceName: mp.name || 'Mercado Livre',
          marketplaceId: mp.id,
          marketplaceLogo: mp.logo,
          accountName: 'Conta Principal',
          accountId: s.marketplace_account_id,
          revenue: Number(s.total_revenue || 0),
          itemsCount: qty,
          status: s.status === 'CANCELLED' ? 'CANCELADO' : 'CONCLUIDO',
          date: s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : 'Hoje',
          time: s.created_at ? new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
        }
      })
    }

    if (ordersList.length > 0) {
      return ordersList.map(o => {
        const mp = o.marketplaces || { name: 'Mercado Livre', logo: '/logos/mercado-livre.svg' }
        const items = o.order_items || []
        const qty = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0) || 1
        return {
          id: o.id,
          orderId: o.order_number || o.id?.slice(0, 8),
          customerName: o.customer_name || 'Comprador Mercado Livre',
          marketplaceName: mp.name || 'Mercado Livre',
          marketplaceId: mp.id,
          marketplaceLogo: mp.logo,
          accountName: 'Conta Principal',
          accountId: o.marketplace_account_id,
          revenue: Number(o.total_amount || 0),
          itemsCount: qty,
          status: o.status === 'CANCELADO' ? 'CANCELADO' : 'CONCLUIDO',
          date: o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : 'Hoje',
          time: o.created_at ? new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
        }
      })
    }

    return []
  }, [sales, orders])

  const filtered = useMemo(() => {
    return consolidatedSales.filter(s => {
      if (filterMp !== 'all' && s.marketplaceId !== filterMp && s.marketplaceName !== filterMp) return false
      if (filterAcc !== 'all' && s.accountId !== filterAcc) return false
      if (search) {
        const query = search.toLowerCase()
        const matchId = s.orderId.toLowerCase().includes(query)
        const matchCustomer = s.customerName.toLowerCase().includes(query)
        const matchMp = s.marketplaceName.toLowerCase().includes(query)
        if (!matchId && !matchCustomer && !matchMp) return false
      }
      return true
    })
  }, [consolidatedSales, filterMp, filterAcc, search])

  const totalRevenue = filtered.reduce((a, b) => a + b.revenue, 0)
  const totalItems = filtered.reduce((a, b) => a + b.itemsCount, 0)
  const loading = loadingSales && loadingOrders

  return (
    <div className="space-y-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white px-3 py-4 sm:px-5 sm:py-6 rounded-xl sm:rounded-2xl border border-[#e6e6e6] shadow-none">
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#999] uppercase tracking-wider">Receita de Vendas</p>
          <p className="text-xl sm:text-2xl font-bold text-[#111] mt-1 tracking-tight">{formatBRL(totalRevenue)}</p>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-[#16a34a] mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> 100% faturamento ativo
          </div>
        </div>

        <div className="bg-white px-3 py-4 sm:px-5 sm:py-6 rounded-xl sm:rounded-2xl border border-[#e6e6e6] shadow-none">
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#999] uppercase tracking-wider">Total de Vendas</p>
          <p className="text-xl sm:text-2xl font-bold text-[#111] mt-1 tracking-tight">{filtered.length}</p>
          <p className="text-[10px] sm:text-xs text-[#777] font-normal mt-1 sm:mt-2">Pedidos processados</p>
        </div>

        <div className="bg-white px-3 py-4 sm:px-5 sm:py-6 rounded-xl sm:rounded-2xl border border-[#e6e6e6] shadow-none">
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#999] uppercase tracking-wider">Itens Vendidos</p>
          <p className="text-xl sm:text-2xl font-bold text-[#111] mt-1 tracking-tight">{totalItems}</p>
          <p className="text-[10px] sm:text-xs text-[#777] font-normal mt-1 sm:mt-2">Unidades expedidas</p>
        </div>

        <div className="bg-white px-3 py-4 sm:px-5 sm:py-6 rounded-xl sm:rounded-2xl border border-[#e6e6e6] shadow-none">
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#999] uppercase tracking-wider">Ticket Médio</p>
          <p className="text-xl sm:text-2xl font-bold text-[#111] mt-1 tracking-tight">{formatBRL(totalRevenue / Math.max(1, filtered.length))}</p>
          <p className="text-[10px] sm:text-xs text-[#16a34a] font-medium mt-1 sm:mt-2">Média por venda</p>
        </div>
      </div>

      {/* Filtros em uma única linha */}
      <div className="sales-filters flex items-center gap-2.5 flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            type="text"
            placeholder="Buscar por pedido ou canal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 h-[38px] border border-[#e6e6e6] rounded-lg text-sm font-normal text-[#111] focus:outline-none focus:border-[#1f2328] bg-white transition-colors"
          />
        </div>
        <select 
          value={filterMp} 
          onChange={e => { setFilterMp(e.target.value); setFilterAcc('all') }} 
          className="w-[220px] flex-none h-[38px] px-3 border border-[#e6e6e6] rounded-lg text-sm font-normal text-[#111] focus:outline-none focus:border-[#1f2328] bg-white transition-colors cursor-pointer"
        >
          <option value="all">Todos marketplaces</option>
          <option value="Mercado Livre">Mercado Livre</option>
          <option value="Shopee">Shopee</option>
          <option value="Amazon">Amazon</option>
          <option value="Magalu">Magalu</option>
        </select>
        <select 
          value={filterAcc} 
          onChange={e => setFilterAcc(e.target.value)} 
          className="w-[180px] flex-none h-[38px] px-3 border border-[#e6e6e6] rounded-lg text-sm font-normal text-[#111] focus:outline-none focus:border-[#1f2328] bg-white transition-colors cursor-pointer"
        >
          <option value="all">Todas contas</option>
          {(accounts || []).map((a: Record<string, unknown>) => (
            <option key={a.id as string} value={a.id as string}>{a.account_name as string}</option>
          ))}
        </select>
      </div>

      {/* Tabela de Vendas Ativa */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#e6e6e6]">
          <LoadingState message="Carregando vendas..." padding={60} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e6e6e6] overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="sales-table w-full text-left">
              <thead className="bg-[#fafafa] border-b border-[#f0f0f0]">
                <tr>
                  <th className="text-left py-2.5 px-4 font-semibold text-[#666666] text-[11px] uppercase tracking-wider">Pedido / ID</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-[#666666] text-[11px] uppercase tracking-wider">Marketplace</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-[#666666] text-[11px] uppercase tracking-wider">Conta</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-[#666666] text-[11px] uppercase tracking-wider">Data</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-[#666666] text-[11px] uppercase tracking-wider">Itens</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-[#666666] text-[11px] uppercase tracking-wider">Valor Total</th>
                  <th className="text-center py-2.5 px-4 font-semibold text-[#666666] text-[11px] uppercase tracking-wider">Status</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-[#666666] text-[11px] uppercase tracking-wider">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filtered.map(s => (
                  <tr 
                    key={s.id} 
                    onClick={() => router.push(`/pedidos/${s.orderId || s.id}`)} 
                    className="hover:bg-[#fafafa] transition-colors cursor-pointer group"
                  >
                    <td
                      className="py-4 px-4 text-[#111111]"
                      style={{ fontSize: '12px', fontFamily: 'inherit', fontWeight: 400 }}
                    >
                      {s.orderId}
                    </td>
                    <td className="py-4 px-4 text-[#555555]">
                      <div className="flex items-center" title={s.marketplaceName}>
                        <MarketplaceLogo name={s.marketplaceName} className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[12px] text-[#666666] font-normal">
                      {s.accountName}
                    </td>
                    <td className="py-4 px-4 text-[#666666] font-normal text-[12px]">
                      {s.date} <span className="text-[#999999] text-[11px]">{s.time}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-[#333333] text-[12.5px]">
                      {s.itemsCount} un
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-[#111111] text-[13px]">
                      {formatBRL(s.revenue)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        s.status === 'CONCLUIDO' 
                          ? 'bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]' 
                          : 'bg-[#fef2f2] text-[#ef4444] border border-[#fecaca]'
                      }`}>
                        {s.status === 'CONCLUIDO' ? 'Concluída' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="relative flex items-center justify-end" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActionSale(actionSale?.id === s.id ? null : s)}
                          title="Mais ações"
                          aria-label="Mais ações"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e6e6e6] bg-white hover:bg-[#F7F7F7] text-[#555555] transition-all cursor-pointer shadow-none"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        {actionSale?.id === s.id && (
                          <div className="absolute left-0 right-auto top-9 z-20 min-w-[180px] rounded-lg border border-[#e6e6e6] bg-white p-1.5 text-left shadow-lg">
                            <button
                              onClick={() => { setActionSale(null); setShareSale(s) }}
                              className="w-full rounded-md px-3 py-2 text-left text-xs text-[#333] hover:bg-[#f5f5f5]"
                            >
                              Compartilhar no chat
                            </button>
                            <button
                              onClick={() => router.push(`/pedidos/${s.orderId || s.id}`)}
                              className="w-full rounded-md px-3 py-2 text-left text-xs text-[#333] hover:bg-[#f5f5f5]"
                            >
                              Abrir detalhes
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {shareSale && (
        <ShareContextModal
          isOpen={!!shareSale}
          onClose={() => setShareSale(null)}
          title={`Venda: ${shareSale.orderId}`}
          messageType="CARD_ORDER"
          metadata={{
            order_id: shareSale.id,
            order_number: shareSale.orderId,
            customer_name: shareSale.customerName,
            total_amount: shareSale.revenue,
            marketplace_name: shareSale.marketplaceName
          }}
          defaultNote={`Compartilhando venda ${shareSale.orderId} (${shareSale.customerName} - ${formatBRL(shareSale.revenue)}).`}
        />
      )}
    </div>
  )
}

function MarketplacesTab() {
  const { data: marketplaces, loading } = useSupabaseQuery(async (s) => {
    const { data } = await s.from('marketplaces').select('*').order('name')
    return data || []
  })

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6]">
          <LoadingState message="Carregando canais..." padding={60} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(marketplaces || []).map((m: any) => (
            <div key={m.id} className="bg-white px-5 py-6 rounded-2xl border border-[#e6e6e6] shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#fafafa] border border-[#eee] flex items-center justify-center">
                  <MarketplaceLogo name={m.name} className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-extrabold text-[#111] text-[14px]">{m.name}</p>
                  <p className="text-sm text-[#16a34a] font-bold mt-0.5">Sincronização Ativa</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
                Online
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VendasPage() {
  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-12 xl:-mx-16 px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="mp-stack">
        <PageHeader title="Vendas" />
        <Tabs defaultValue="vendas">
          <TabsList>
            <TabsTrigger value="vendas"><DollarSign className="w-3.5 h-3.5 mr-1 inline" /> Vendas</TabsTrigger>
            <TabsTrigger value="marketplaces"><Store className="w-3.5 h-3.5 mr-1 inline" /> Canais</TabsTrigger>
          </TabsList>
          <TabsContent value="vendas"><SalesTab /></TabsContent>
          <TabsContent value="marketplaces"><MarketplacesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
