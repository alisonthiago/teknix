'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
import { PageHeader, StatCard, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function RelatorioContasPage() {
  const [period, setPeriod] = useState('30d')

  const { data: sales, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('sales')
      .select('*, marketplace_accounts(id, account_name, marketplace_id), marketplaces(name, code, logo), sale_items(cogs, fees, taxes, other_costs)')
    if (error) throw error
    return data || []
  })

  const { data: accounts } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('marketplace_accounts')
      .select('id, account_name, marketplace_id, status, marketplaces(name, code, logo)')
      .eq('status', 'active')
    return data || []
  })

  const now = new Date()
  const cutoff = period === '7d' ? new Date(now.getTime() - 7 * 86400000) : period === '30d' ? new Date(now.getTime() - 30 * 86400000) : new Date(now.getTime() - 90 * 86400000)

  const filteredSales = (sales || []).filter((s: Record<string, unknown>) => {
    return new Date(s.created_at as string) >= cutoff
  })

  const accountMap = new Map<string, {
    name: string; marketplace: string; logo: string; code: string;
    revenue: number; cost: number; fees: number; orders: number; items: number
  }>()

  for (const acc of (accounts || []) as Record<string, unknown>[]) {
    const mp = acc.marketplaces as Record<string, unknown> | null
    accountMap.set(acc.id as string, {
      name: acc.account_name as string || '—',
      marketplace: (mp?.name as string) || '—',
      logo: (mp?.code as string) || '',
      code: (mp?.code as string) || '',
      revenue: 0, cost: 0, fees: 0, orders: 0, items: 0,
    })
  }

  for (const sale of filteredSales) {
    const accId = sale.marketplace_account_id as string
    if (!accId || !accountMap.has(accId)) continue
    const acc = accountMap.get(accId)!
    const items = sale.sale_items as Record<string, unknown>[] | null
    const cost = (items || []).reduce((a: number, i: Record<string, unknown>) => a + Number(i.cogs || 0), 0)
    const fees = (items || []).reduce((a: number, i: Record<string, unknown>) => a + Number(i.fees || 0) + Number(i.taxes || 0) + Number(i.other_costs || 0), 0)
    acc.revenue += Number(sale.total_revenue || 0)
    acc.cost += cost
    acc.fees += fees
    acc.orders += 1
    acc.items += Number(sale.quantity || 1)
  }

  const rows = [...accountMap.values()].filter(a => a.orders > 0).sort((a, b) => b.revenue - a.revenue)

  const totalRevenue = rows.reduce((a, b) => a + b.revenue, 0)
  const totalOrders = rows.reduce((a, b) => a + b.orders, 0)
  const totalProfit = rows.reduce((a, b) => a + (b.revenue - b.cost - b.fees), 0)
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'

  return (
    <div className="mp-stack">
      <div className="mb-4">
        <Link href="/analises" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Análises
        </Link>
      </div>
      <PageHeader title="Relatório por Conta" description="Desempenho individual de cada conta de marketplace" />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['7d', '30d', '90d'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${period === p ? 'bg-[#1f2328] text-white' : 'bg-white border border-[#e6e6e6] text-[#999] hover:text-[#333]'}`}>
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Faturamento Total" value={formatBRL(totalRevenue)} />
        <StatCard label="Total Pedidos" value={String(totalOrders)} />
        <StatCard label="Lucro Líquido" value={formatBRL(totalProfit)} />
        <StatCard label="Margem Média" value={`${avgMargin}%`} />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center">
          <BarChart3 className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
          <p className="text-[13px] font-medium text-[#333]">Nenhum dado no período</p>
        </div>
      ) : (
        <>
          <ModuleTable>
            <TableHead>
              <Th>Conta</Th><Th>Marketplace</Th><Th className="text-right">Pedidos</Th><Th className="text-right">Faturamento</Th><Th className="text-right">Custo</Th><Th className="text-right">Taxas</Th><Th className="text-right">Lucro</Th><Th className="text-right">Margem</Th><Th className="text-right">Ticket Médio</Th>
            </TableHead>
            <tbody className="divide-y divide-[#eeeeee]">
              {rows.map(row => {
                const profit = row.revenue - row.cost - row.fees
                const margin = row.revenue > 0 ? ((profit / row.revenue) * 100) : 0
                return (
                  <tr key={row.name} className="hover:bg-[#fafafa] transition-colors">
                    <Td className="font-medium text-[#333]">{row.name}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <MarketplaceLogo name={row.marketplace} className="w-4 h-4" />
                        <span className="text-[11px] text-[#999]">{row.marketplace}</span>
                      </div>
                    </Td>
                    <Td className="text-right text-[#333]">{row.orders}</Td>
                    <Td className="text-right font-medium text-[#333]">{formatBRL(row.revenue)}</Td>
                    <Td className="text-right text-[#999]">{formatBRL(row.cost)}</Td>
                    <Td className="text-right text-[#e67e22]">{formatBRL(row.fees)}</Td>
                    <Td className="text-right font-medium" style={{ color: profit >= 0 ? '#38a169' : '#e74c3c' }}>{formatBRL(profit)}</Td>
                    <Td className="text-right text-[11px] font-medium" style={{ color: margin >= 20 ? '#38a169' : margin >= 10 ? '#e67e22' : '#e74c3c' }}>{margin.toFixed(1)}%</Td>
                    <Td className="text-right text-[#999]">{formatBRL(row.revenue / row.orders)}</Td>
                  </tr>
                )
              })}
            </tbody>
          </ModuleTable>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
              <h3 className="text-[12px] font-semibold text-[#333] mb-3">Faturamento por Conta</h3>
              <div className="space-y-2.5">
                {rows.map(row => (
                  <div key={row.name} className="flex items-center gap-2.5">
                    <MarketplaceLogo name={row.marketplace} className="w-5 h-5 flex-shrink-0" />
                    <span className="w-32 text-[11px] text-[#333] truncate">{row.name}</span>
                    <div className="flex-1 h-4 rounded bg-[#f5f5f5] relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-[#1f2328]/[0.2] rounded flex items-center pl-2"
                        style={{ width: `${totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0}%` }}>
                        <span className="text-[9px] text-[#1f2328] font-medium">{formatBRL(row.revenue)}</span>
                      </div>
                    </div>
                    <span className="w-10 text-[10px] text-[#ccc] text-right">
                      {totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
              <h3 className="text-[12px] font-semibold text-[#333] mb-3">Margem por Conta</h3>
              <div className="space-y-2">
                {rows.map(row => {
                  const profit = row.revenue - row.cost - row.fees
                  const margin = row.revenue > 0 ? ((profit / row.revenue) * 100) : 0
                  return (
                    <div key={row.name} className="flex items-center gap-2">
                      <span className="w-32 text-[11px] text-[#333] truncate">{row.name}</span>
                      <div className="flex-1 h-[14px] rounded bg-[#f5f5f5] relative overflow-hidden">
                        <div className={`absolute inset-y-0 left-0 rounded ${margin >= 0 ? 'bg-[#38a169]/[0.3]' : 'bg-[#e74c3c]/[0.3]'}`}
                          style={{ width: `${Math.min(Math.abs(margin), 100)}%` }} />
                      </div>
                      <span className="w-12 text-[10px] font-medium text-right" style={{ color: margin >= 0 ? '#38a169' : '#e74c3c' }}>
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
