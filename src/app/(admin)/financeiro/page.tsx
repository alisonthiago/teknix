'use client'

import { useState } from 'react'
import { TrendingUp, DollarSign, BarChart3, Percent } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function FilterBar({ mp, setMp, acc, setAcc, accounts }: {
  mp: string; setMp: (v: string) => void
  acc: string; setAcc: (v: string) => void
  accounts: Record<string, unknown>[]
}) {
  const { data: marketplaces } = useSupabaseQuery(async (s) => {
    const { data } = await s.from('marketplaces').select('id, name, code, logo').order('name')
    return data || []
  })

  const filteredAccounts = accounts.filter((a: Record<string, unknown>) => {
    if (mp === 'all') return true
    return a.marketplace_id === mp
  })

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
      <select value={mp} onChange={e => { setMp(e.target.value); setAcc('all') }}
        className="w-full sm:w-auto min-h-[44px] px-3 border border-[#e6e6e6] rounded-lg text-[12px] text-[#666] focus:outline-none focus:border-[#3483fa] bg-white">
        <option value="all">Todos marketplaces</option>
        {(marketplaces || []).map((m: Record<string, unknown>) => (
          <option key={m.id as string} value={m.id as string}>{m.name as string}</option>
        ))}
      </select>
      <select value={acc} onChange={e => setAcc(e.target.value)}
        className="w-full sm:w-auto min-h-[44px] px-3 border border-[#e6e6e6] rounded-lg text-[12px] text-[#666] focus:outline-none focus:border-[#3483fa] bg-white">
        <option value="all">Todas contas</option>
        {filteredAccounts.map((a: Record<string, unknown>) => (
          <option key={a.id as string} value={a.id as string}>{a.account_name as string}</option>
        ))}
      </select>
    </div>
  )
}

export default function FinanceiroPage() {
  const [filterMp, setFilterMp] = useState('all')
  const [filterAcc, setFilterAcc] = useState('all')

  const { data: accounts } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('marketplace_accounts')
      .select('id, account_name, marketplace_id, marketplaces(name, logo)')
      .eq('status', 'active')
    return data || []
  })

  const { data: sales } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('sales')
      .select('*, marketplace_accounts(account_name), marketplaces(name, logo), sale_items(cogs, fees, taxes, freight, other_costs)')
    if (error) throw error
    return data || []
  })

  const { data: orders } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('orders')
      .select('*, marketplace_accounts(account_name), marketplaces(name, logo)')
    if (error) throw error
    return data || []
  })

  const allSales = (sales || []) as Record<string, unknown>[]

  function getCost(s: Record<string, unknown>) {
    const items = s.sale_items as Record<string, unknown>[] | null
    return (items || []).reduce((a: number, i: Record<string, unknown>) => a + Number(i.cogs || 0), 0)
  }
  function getFees(s: Record<string, unknown>) {
    const items = s.sale_items as Record<string, unknown>[] | null
    return (items || []).reduce((a: number, i: Record<string, unknown>) => a + Number(i.fees || 0) + Number(i.taxes || 0) + Number(i.other_costs || 0), 0)
  }
  const allOrders = (orders || []) as Record<string, unknown>[]

  const filteredSales = allSales.filter((s: Record<string, unknown>) => {
    if (filterMp !== 'all') {
      const mp = s.marketplaces as Record<string, unknown> | null
      if (mp?.id !== filterMp) return false
    }
    if (filterAcc !== 'all' && s.marketplace_account_id !== filterAcc) return false
    return true
  })

  const revenue = filteredSales.reduce((a, s) => a + Number(s.total_revenue || 0), 0)
  const cost = filteredSales.reduce((a, s) => a + getCost(s), 0)
  const fees = filteredSales.reduce((a, s) => a + getFees(s), 0)
  const profit = revenue - cost - fees
  const avgMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  const monthlyData: Record<string, { revenue: number; profit: number; fees: number }> = {}
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  for (const s of filteredSales) {
    const d = new Date(s.created_at as string)
    const key = monthNames[d.getMonth()]
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, profit: 0, fees: 0 }
    const r = Number(s.total_revenue || 0)
    const c = getCost(s)
    const f = getFees(s)
    monthlyData[key].revenue += r
    monthlyData[key].profit += r - c - f
    monthlyData[key].fees += f
  }
  const monthlyRows = Object.entries(monthlyData).map(([month, data]) => ({ month, ...data }))

  const mpBreakdown = new Map<string, { name: string; logo: string; revenue: number }>()
  for (const s of filteredSales) {
    const mp = s.marketplaces as Record<string, unknown> | null
    const name = (mp?.name as string) || 'Desconhecido'
    const logo = (mp?.logo as string) || ''
    if (!mpBreakdown.has(name)) mpBreakdown.set(name, { name, logo, revenue: 0 })
    mpBreakdown.get(name)!.revenue += Number(s.total_revenue || 0)
  }
  const mpRows = [...mpBreakdown.values()].sort((a, b) => b.revenue - a.revenue)
  const maxMpRevenue = mpRows[0]?.revenue || 1

  const costBreakdown = [
    { label: 'Produtos', value: cost, color: 'bg-[#999]' },
    { label: 'Taxas', value: fees, color: 'bg-[#e67e22]' },
    { label: 'Frete', value: filteredSales.reduce((a, s) => a + Number(s.shipping_cost || 0), 0), color: 'bg-[#3483fa]' },
    { label: 'Impostos', value: filteredSales.reduce((a, s) => a + Number(s.taxes || 0), 0), color: 'bg-[#e74c3c]' },
  ]

  return (
    <div className="mp-stack">
      <PageHeader title="Financeiro" description="Acompanhe receitas, lucros e margens" />
      <FilterBar mp={filterMp} setMp={setFilterMp} acc={filterAcc} setAcc={setFilterAcc} accounts={accounts || []} />
      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral"><BarChart3 className="w-3.5 h-3.5 mr-1 inline" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="faturamento"><DollarSign className="w-3.5 h-3.5 mr-1 inline" /> Faturamento</TabsTrigger>
          <TabsTrigger value="lucro"><TrendingUp className="w-3.5 h-3.5 mr-1 inline" /> Lucro</TabsTrigger>
          <TabsTrigger value="margem"><Percent className="w-3.5 h-3.5 mr-1 inline" /> Margem</TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral">
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard label="Receita" value={formatBRL(revenue)} />
              <StatCard label="Lucro" value={formatBRL(profit)} />
              <StatCard label="Margem" value={`${avgMargin}%`} />
              <StatCard label="Taxas" value={formatBRL(fees)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
                <h3 className="text-[12px] font-semibold text-[#333] mb-3">Evolução Mensal</h3>
                <div className="space-y-2">
                  {monthlyRows.map(m => (
                    <div key={m.month} className="flex items-center gap-2">
                      <span className="w-7 text-[10px] text-[#999] font-medium">{m.month}</span>
                      <div className="flex-1 h-4 rounded bg-[#3483fa]/[0.06] relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-[#3483fa]/[0.2] rounded" style={{ width: `${revenue > 0 ? (m.revenue / maxMpRevenue) * 100 : 0}%` }} />
                      </div>
                      <span className="w-12 text-[10px] text-[#666] font-medium text-right">{formatBRL(m.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
                <h3 className="text-[12px] font-semibold text-[#333] mb-3">Composição de Custos</h3>
                <div className="space-y-2.5">
                  {costBreakdown.map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${item.color}`} /><span className="text-[#666]">{item.label}</span></div>
                        <span className="font-medium text-[#333]">{formatBRL(item.value)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f1f3f5] overflow-hidden"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${revenue > 0 ? (item.value / revenue) * 100 : 0}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="faturamento">
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <StatCard label="Receita Bruta" value={formatBRL(revenue)} />
              <StatCard label="Receita Líquida" value={formatBRL(revenue - fees)} />
              <StatCard label="Ticket Médio" value={filteredSales.length > 0 ? formatBRL(revenue / filteredSales.length) : 'R$ 0,00'} />
            </div>
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
              <h3 className="text-[12px] font-semibold text-[#333] mb-3">Faturamento por Marketplace</h3>
              <div className="space-y-2.5">
                {mpRows.map(m => (
                  <div key={m.name} className="flex items-center gap-2.5">
                    <MarketplaceLogo name={m.name} className="w-5 h-5 flex-shrink-0" />
                    <span className="w-28 text-[11px] text-[#333]">{m.name}</span>
                    <div className="flex-1 h-4 rounded bg-[#f5f5f5] relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-[#3483fa]/[0.2] rounded flex items-center pl-2" style={{ width: `${(m.revenue / maxMpRevenue) * 100}%` }}>
                        <span className="text-[9px] text-[#3483fa] font-medium">{formatBRL(m.revenue)}</span>
                      </div>
                    </div>
                    <span className="w-10 text-[10px] text-[#ccc] text-right">{revenue > 0 ? ((m.revenue / revenue) * 100).toFixed(0) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="lucro">
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <StatCard label="Lucro Líquido" value={formatBRL(profit)} />
              <StatCard label="Lucro Bruto" value={formatBRL(revenue - cost)} />
              <StatCard label="Lucro/Pedido" value={filteredSales.length > 0 ? formatBRL(profit / filteredSales.length) : 'R$ 0,00'} />
            </div>
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
              <h3 className="text-[12px] font-semibold text-[#333] mb-3">Evolução do Lucro</h3>
              <div className="space-y-2">
                {monthlyRows.map(m => (
                  <div key={m.month} className="flex items-center gap-2">
                    <span className="w-7 text-[10px] text-[#999] font-medium">{m.month}</span>
                    <div className="flex-1 h-4 rounded bg-[#38a169]/[0.06] relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-[#38a169]/[0.2] rounded" style={{ width: `${profit > 0 ? Math.max(0, (m.profit / profit) * 100) : 0}%` }} />
                    </div>
                    <span className="w-12 text-[10px] text-[#38a169] font-medium text-right">{formatBRL(m.profit)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="margem">
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <StatCard label="Margem Média" value={`${avgMargin}%`} />
              <StatCard label="Melhor" value={`${filteredSales.length > 0 ? Math.max(...filteredSales.map((s: Record<string, unknown>) => { const r = Number(s.total_revenue || 0); const c = getCost(s); const f = getFees(s); return r > 0 ? ((r - c - f) / r * 100) : 0 })).toFixed(1) : '0'}%`} />
              <StatCard label="Pior" value={`${filteredSales.length > 0 ? Math.min(...filteredSales.map((s: Record<string, unknown>) => { const r = Number(s.total_revenue || 0); const c = getCost(s); const f = getFees(s); return r > 0 ? ((r - c - f) / r * 100) : 0 })).toFixed(1) : '0'}%`} />
            </div>
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
              <h3 className="text-[12px] font-semibold text-[#333] mb-3">Margem por Marketplace</h3>
              <div className="space-y-2">
                {mpRows.map(m => {
                  const mpSales = filteredSales.filter((s: Record<string, unknown>) => {
                    const mp = s.marketplaces as Record<string, unknown> | null
                    return mp?.name === m.name
                  })
                  const mpRevenue = mpSales.reduce((a, s) => a + Number(s.total_revenue || 0), 0)
                  const mpCost = mpSales.reduce((a, s) => a + getCost(s), 0)
                  const mpFees = mpSales.reduce((a, s) => a + getFees(s), 0)
                  const mpMargin = mpRevenue > 0 ? ((mpRevenue - mpCost - mpFees) / mpRevenue * 100) : 0
                  return (
                    <div key={m.name} className="flex items-center gap-2">
                      <MarketplaceLogo name={m.name} className="w-5 h-5 flex-shrink-0" />
                      <span className="w-28 text-[11px] text-[#333]">{m.name}</span>
                      <div className="flex-1 h-[14px] rounded bg-[#f5f5f5] relative overflow-hidden">
                        <div className={`absolute inset-y-0 left-0 rounded ${mpMargin >= 0 ? 'bg-[#38a169]/[0.3]' : 'bg-[#e74c3c]/[0.3]'}`} style={{ width: `${Math.min(Math.abs(mpMargin), 100)}%` }} />
                      </div>
                      <span className="w-12 text-[10px] font-medium text-right" style={{ color: mpMargin >= 0 ? '#38a169' : '#e74c3c' }}>{mpMargin.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
