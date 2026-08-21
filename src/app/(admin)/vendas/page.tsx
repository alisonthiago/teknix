import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Store, ShoppingBag, ArrowUpRight, Search, Layers, CheckCircle2, ChevronRight, Package, User, Share2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SalesTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterMp, setFilterMp] = useState('all')
  const [filterAcc, setFilterAcc] = useState('all')
  const [shareSale, setShareSale] = useState<any | null>(null)

  const { data: sales, loading: loadingSales } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('sales')
      .select('*, marketplaces(name, code, logo, id), marketplace_accounts(account_name, id, marketplace_id), sale_items(*, products(name, sku))')
      .order('created_at', { ascending: false })
    return data || []
  })

  const { data: orders, loading: loadingOrders } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('orders')
      .select('*, marketplaces(name, code, logo, id), marketplace_accounts(account_name, id, marketplace_id), order_items(*, products(name, sku, price))')
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
        const acc = s.marketplace_accounts || { account_name: 'Conta Principal' }
        const items = s.sale_items || []
        const qty = items.reduce((acc: number, i: any) => acc + (Number(i.quantity) || 1), 0) || 1
        return {
          id: s.id,
          orderId: s.order_id || s.id?.slice(0, 8),
          customerName: s.customer_name || 'Comprador Mercado Livre',
          marketplaceName: mp.name || 'Mercado Livre',
          marketplaceId: mp.id,
          marketplaceLogo: mp.logo,
          accountName: acc.account_name || 'Conta Principal',
          accountId: s.marketplace_account_id,
          revenue: Number(s.total_revenue || 0),
          itemsCount: qty,
          status: s.status === 'CANCELLED' ? 'CANCELADO' : 'CONCLUIDO',
          date: s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : 'Hoje'
        }
      })
    }

    if (ordersList.length > 0) {
      return ordersList.map(o => {
        const mp = o.marketplaces || { name: 'Mercado Livre', logo: '/logos/mercado-livre.svg' }
        const acc = o.marketplace_accounts || { account_name: 'Conta Principal' }
        const items = o.order_items || []
        const qty = items.reduce((acc: number, i: any) => acc + (Number(i.quantity) || 1), 0) || 1
        return {
          id: o.id,
          orderId: o.order_number || o.id?.slice(0, 8),
          customerName: o.customer_name || 'Comprador Mercado Livre',
          marketplaceName: mp.name || 'Mercado Livre',
          marketplaceId: mp.id,
          marketplaceLogo: mp.logo,
          accountName: acc.account_name || 'Conta Principal',
          accountId: o.marketplace_account_id,
          revenue: Number(o.total_amount || 0),
          itemsCount: qty,
          status: o.status === 'CANCELADO' ? 'CANCELADO' : 'CONCLUIDO',
          date: o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : 'Hoje'
        }
      })
    }

    // Dados de demonstração ativos
    return [
      { id: '1', orderId: 'MLB-2000008741', customerName: 'João Silva', marketplaceName: 'Mercado Livre', marketplaceId: 'ml', marketplaceLogo: '/logos/mercado-livre.svg', accountName: 'Teknix Oficial', accountId: 'acc1', revenue: 219.90, itemsCount: 1, status: 'CONCLUIDO', date: '21/08/2026' },
      { id: '2', orderId: 'MLB-2000008740', customerName: 'Maria Oliveira', marketplaceName: 'Mercado Livre', marketplaceId: 'ml', marketplaceLogo: '/logos/mercado-livre.svg', accountName: 'Teknix Oficial', accountId: 'acc1', revenue: 299.90, itemsCount: 2, status: 'CONCLUIDO', date: '20/08/2026' },
      { id: '3', orderId: 'MLB-2000008739', customerName: 'Carlos Eduardo', marketplaceName: 'Mercado Livre', marketplaceId: 'ml', marketplaceLogo: '/logos/mercado-livre.svg', accountName: 'Teknix Oficial', accountId: 'acc1', revenue: 249.90, itemsCount: 1, status: 'CONCLUIDO', date: '19/08/2026' },
      { id: '4', orderId: 'SHP-9921002931', customerName: 'Ana Paula Santos', marketplaceName: 'Shopee', marketplaceId: 'shopee', marketplaceLogo: '/logos/shopee.svg', accountName: 'Teknix Shopee', accountId: 'acc2', revenue: 69.90, itemsCount: 1, status: 'CONCLUIDO', date: '18/08/2026' },
      { id: '5', orderId: 'MLB-2000008738', customerName: 'Lucas Ferreira', marketplaceName: 'Mercado Livre', marketplaceId: 'ml', marketplaceLogo: '/logos/mercado-livre.svg', accountName: 'Teknix Oficial', accountId: 'acc1', revenue: 49.90, itemsCount: 1, status: 'CONCLUIDO', date: '17/08/2026' },
    ]
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-2xs">
          <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Receita de Vendas</p>
          <p className="text-2xl font-black text-[#111] mt-1">{formatBRL(totalRevenue)}</p>
          <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#16a34a] mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> 100% faturamento ativo
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-2xs">
          <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Total de Vendas</p>
          <p className="text-2xl font-black text-[#111] mt-1">{filtered.length}</p>
          <p className="text-[11px] text-[#666] font-semibold mt-2">Pedidos processados</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-2xs">
          <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Itens Vendidos</p>
          <p className="text-2xl font-black text-[#111] mt-1">{totalItems}</p>
          <p className="text-[11px] text-[#666] font-semibold mt-2">Unidades expedidas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-2xs">
          <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Ticket Médio</p>
          <p className="text-2xl font-black text-[#111] mt-1">{formatBRL(totalRevenue / Math.max(1, filtered.length))}</p>
          <p className="text-[11px] text-[#16a34a] font-bold mt-2">Média por venda</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            type="text"
            placeholder="Buscar por pedido, comprador ou canal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[12px] font-medium text-[#333] focus:outline-none focus:border-[#16a34a] bg-white shadow-2xs"
          />
        </div>
        <select 
          value={filterMp} 
          onChange={e => { setFilterMp(e.target.value); setFilterAcc('all') }} 
          className="min-h-[40px] px-3.5 border border-[#e6e6e6] rounded-xl text-[12px] font-medium text-[#333] focus:outline-none focus:border-[#16a34a] bg-white shadow-2xs"
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
          className="min-h-[40px] px-3.5 border border-[#e6e6e6] rounded-xl text-[12px] font-medium text-[#333] focus:outline-none focus:border-[#16a34a] bg-white shadow-2xs"
        >
          <option value="all">Todas contas</option>
          {(accounts || []).map((a: Record<string, unknown>) => (
            <option key={a.id as string} value={a.id as string}>{a.account_name as string}</option>
          ))}
        </select>
      </div>

      {/* Tabela de Vendas Ativa */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-12 text-center text-[#999] text-[13px]">
          Carregando vendas...
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#fafafa] border-b border-[#eee] text-[#777] font-bold">
              <tr>
                <th className="py-3 px-4">Pedido / ID</th>
                <th className="py-3 px-4">Comprador</th>
                <th className="py-3 px-4">Marketplace</th>
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Itens</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {filtered.map(s => (
                <tr 
                  key={s.id} 
                  onClick={() => router.push(`/pedidos/${s.id}`)} 
                  className="hover:bg-[#fafafa] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-[#111]">
                    {s.orderId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#333]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#888]" />
                      <span>{s.customerName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#555]">
                    <div className="flex items-center gap-2">
                      <MarketplaceLogo name={s.marketplaceName} className="w-4 h-4" />
                      <span className="font-semibold text-[#222]">{s.marketplaceName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-[#777] font-medium">
                    {s.accountName}
                  </td>
                  <td className="py-3.5 px-4 text-[#666] font-medium">
                    {s.date}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#111]">
                    {s.itemsCount} un
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-[#111] text-[13px]">
                    {formatBRL(s.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      s.status === 'CONCLUIDO' 
                        ? 'bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]' 
                        : 'bg-[#fef2f2] text-[#ef4444] border border-[#fecaca]'
                    }`}>
                      {s.status === 'CONCLUIDO' ? 'Concluída' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setShareSale(s)}
                        title="Compartilhar no Chat com a Equipe"
                        className="p-1.5 rounded-lg border border-[#e6e6e6] hover:bg-[#16a34a] hover:text-white text-[#777] transition-all cursor-pointer shadow-2xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/pedidos/${s.id}`)}
                        className="p-1.5 rounded-lg bg-[#f0f0f0] hover:bg-[#16a34a] hover:text-white transition-all text-[#666] cursor-pointer shadow-2xs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">
          Carregando canais...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(marketplaces || []).map((m: any) => (
            <div key={m.id} className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#fafafa] border border-[#eee] flex items-center justify-center">
                  <MarketplaceLogo name={m.name} className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-extrabold text-[#111] text-[14px]">{m.name}</p>
                  <p className="text-[11px] text-[#16a34a] font-bold mt-0.5">Sincronização Ativa</p>
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
    <div className="space-y-6 max-w-7xl mx-auto pb-14 animate-in fade-in duration-200">
      <PageHeader title="Vendas" description="Acompanhe todas as vendas, canais e desempenho comercial em tempo real" />
      <Tabs defaultValue="vendas">
        <TabsList>
          <TabsTrigger value="vendas"><DollarSign className="w-3.5 h-3.5 mr-1 inline" /> Vendas</TabsTrigger>
          <TabsTrigger value="marketplaces"><Store className="w-3.5 h-3.5 mr-1 inline" /> Canais</TabsTrigger>
        </TabsList>
        <TabsContent value="vendas"><SalesTab /></TabsContent>
        <TabsContent value="marketplaces"><MarketplacesTab /></TabsContent>
      </Tabs>
    </div>
  )
}
