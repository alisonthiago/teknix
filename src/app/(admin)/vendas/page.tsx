'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Store } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function SalesTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterMp, setFilterMp] = useState('all')
  const [filterAcc, setFilterAcc] = useState('all')
  const { data: sales, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('sales').select('*, marketplaces(name, code, logo, id), marketplace_accounts(account_name, id, marketplace_id), sale_items(*, products(name, sku))').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })

  const { data: accounts } = useSupabaseQuery(async (s) => {
    const { data } = await s.from('marketplace_accounts').select('id, account_name, marketplace_id').eq('status', 'active')
    return data || []
  })

  const filtered = (sales || []).filter((s: Record<string, unknown>) => {
    const mp = s.marketplaces as Record<string, unknown> | null
    if (filterMp !== 'all' && mp?.id !== filterMp) return false
    if (filterAcc !== 'all' && s.marketplace_account_id !== filterAcc) return false
    if (search) {
      const orderId = String(s.order_id || '').toLowerCase()
      if (!orderId.includes(search.toLowerCase())) return false
    }
    return true
  })

  const totalRevenue = (sales || []).reduce((a: number, b: Record<string, unknown>) => a + (Number(b.total_revenue) || 0), 0)
  const totalItems = (sales || []).reduce((a: number, b: Record<string, unknown>) => {
    const items = b.sale_items as Record<string, unknown>[] | null
    return a + (items?.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item.quantity) || 0), 0) || 0)
  }, 0)

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Receita" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        <StatCard label="Total Vendas" value={String(sales?.length || 0)} />
        <StatCard label="Itens Vendidos" value={String(totalItems)} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
        <SearchInput placeholder="Buscar venda..." value={search} onChange={setSearch} />
        <select value={filterMp} onChange={e => { setFilterMp(e.target.value); setFilterAcc('all') }} className="w-full sm:w-auto min-h-[44px] px-3 border border-[#e6e6e6] rounded-lg text-[12px] text-[#666] focus:outline-none focus:border-[#3483fa] bg-white">
          <option value="all">Todos marketplaces</option>
          {(() => { const mps = new Map<string, string>(); (sales || []).forEach((s: Record<string, unknown>) => { const mp = s.marketplaces as Record<string, unknown> | null; if (mp?.id && mp?.name) mps.set(mp.id as string, mp.name as string) }); return [...mps.entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>) })()}
        </select>
        <select value={filterAcc} onChange={e => setFilterAcc(e.target.value)} className="w-full sm:w-auto min-h-[44px] px-3 border border-[#e6e6e6] rounded-lg text-[12px] text-[#666] focus:outline-none focus:border-[#3483fa] bg-white">
          <option value="all">Todas contas</option>
          {(accounts || []).filter((a: Record<string, unknown>) => filterMp === 'all' || a.marketplace_id === filterMp).map((a: Record<string, unknown>) => (
            <option key={a.id as string} value={a.id as string}>{a.account_name as string}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead><Th>Pedido</Th><Th>Marketplace</Th><Th>Conta</Th><Th className="text-right">Receita</Th><Th className="text-right">Status</Th></TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {filtered.map((s: Record<string, unknown>) => {
              const mp = s.marketplaces as Record<string, unknown> | null
              const acc = s.marketplace_accounts as Record<string, unknown> | null
              return (
                <tr key={s.id as string} onClick={() => router.push(`/vendas/${s.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
                  <Td className="font-mono font-medium text-[#333]">{(s.order_id as string) || '—'}</Td>
                  <Td className="text-[#999]"><div className="flex items-center gap-1.5">{typeof mp?.logo === 'string' && <MarketplaceLogo name={mp.name as string} className="w-4 h-4" />}{(mp?.name as string) || '—'}</div></Td>
                  <Td className="text-[11px] text-[#999]">{(acc?.account_name as string) || '—'}</Td>
                  <Td className="text-right font-medium text-[#333]">R$ {Number(s.total_revenue || 0).toFixed(2)}</Td>
                  <Td className="text-center"><span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${s.status === 'COMPLETED' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#fff5f5] text-[#e74c3c]'}`}>{s.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}</span></Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
    </div>
  )
}

function MarketplacesTab() {
  const { data: marketplaces, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('marketplaces').select('*').order('name')
    if (error) throw error
    return data || []
  })

  return (
    <div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(marketplaces || []).map((m: Record<string, unknown>) => (
            <div key={m.id as string} className={`bg-white rounded-2xl border border-[#e6e6e6] p-4 ${m.status !== 'ACTIVE' ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                {typeof m.logo === 'string' && <MarketplaceLogo name={m.name as string} className="w-7 h-7" />}
                <div><h3 className="text-[12px] font-semibold text-[#333]">{m.name as string}</h3><p className="text-[10px] text-[#999]">{m.status === 'ACTIVE' ? 'Conectado' : 'Desconectado'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><p className="text-[#999]">Taxa</p><p className="font-semibold text-[#333]">{Number(m.default_percentage_fee || 0)}%</p></div>
                <div><p className="text-[#999]">Tipo</p><p className="font-semibold text-[#333]">{(m.type as string) || 'MARKETPLACE'}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VendasPage() {
  return (
    <div className="mp-stack">
      <PageHeader title="Vendas" description="Acompanhe vendas e marketplaces" />
      <Tabs defaultValue="vendas">
        <TabsList>
          <TabsTrigger value="vendas"><DollarSign className="w-3.5 h-3.5 mr-1 inline" /> Vendas</TabsTrigger>
          <TabsTrigger value="marketplaces"><Store className="w-3.5 h-3.5 mr-1 inline" /> Marketplaces</TabsTrigger>
        </TabsList>
        <TabsContent value="vendas"><SalesTab /></TabsContent>
        <TabsContent value="marketplaces"><MarketplacesTab /></TabsContent>
      </Tabs>
    </div>
  )
}
