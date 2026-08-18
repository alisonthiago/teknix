'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, FileInput, Download, Upload, FileSpreadsheet, File, TrendingUp, DollarSign } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function RelatoriosTab() {
  const { data: sales } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('sales').select('*, marketplaces(name, logo), marketplace_accounts(account_name), sale_items(cogs, fees, taxes, other_costs)')
    if (error) throw error
    return data || []
  })

  const { data: orders } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('orders').select('id, status')
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

  const totalRevenue = allSales.reduce((a, s) => a + Number(s.total_revenue || 0), 0)
  const totalProfit = allSales.reduce((a, s) => {
    const r = Number(s.total_revenue || 0)
    const c = getCost(s)
    const f = getFees(s)
    return a + r - c - f
  }, 0)
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'

  const mpBreakdown = new Map<string, { name: string; logo: string; revenue: number; orders: number }>()
  for (const s of allSales) {
    const mp = s.marketplaces as Record<string, unknown> | null
    const name = (mp?.name as string) || 'Desconhecido'
    const logo = (mp?.logo as string) || ''
    if (!mpBreakdown.has(name)) mpBreakdown.set(name, { name, logo, revenue: 0, orders: 0 })
    mpBreakdown.get(name)!.revenue += Number(s.total_revenue || 0)
    mpBreakdown.get(name)!.orders += 1
  }
  const mpRows = [...mpBreakdown.values()].sort((a, b) => b.revenue - a.revenue)
  const maxMpRev = mpRows[0]?.revenue || 1

  const reports = [
    { name: 'Vendas por Marketplace', description: 'Análise de performance por canal', icon: TrendingUp, color: 'bg-[#f0f7ff]', textColor: 'text-[#3483fa]' },
    { name: 'Margem por Produto', description: 'Margem de lucro detalhada', icon: DollarSign, color: 'bg-[#f0fff4]', textColor: 'text-[#38a169]' },
    { name: 'Relatório por Conta', description: 'Desempenho individual de cada conta', icon: BarChart3, color: 'bg-[#f0f0ff]', textColor: 'text-[#6c5ce7]', href: '/analises/relatorio-contas' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Receita Total" value={formatBRL(totalRevenue)} />
        <StatCard label="Total Pedidos" value={String((orders || []).length)} />
        <StatCard label="Margem Média" value={`${avgMargin}%`} />
      </div>

      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4 mb-4">
        <h3 className="text-[12px] font-semibold text-[#333] mb-3">Performance por Marketplace</h3>
        <div className="space-y-2.5">
          {mpRows.map(m => (
            <div key={m.name} className="flex items-center gap-2.5">
              <MarketplaceLogo name={m.name} className="w-5 h-5 flex-shrink-0" />
              <span className="w-28 text-[11px] text-[#333]">{m.name}</span>
              <div className="flex-1 h-4 rounded bg-[#f5f5f5] relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-[#3483fa]/[0.2] rounded flex items-center pl-2" style={{ width: `${(m.revenue / maxMpRev) * 100}%` }}>
                  <span className="text-[9px] text-[#3483fa] font-medium">{formatBRL(m.revenue)}</span>
                </div>
              </div>
              <span className="w-16 text-[10px] text-[#999] text-right">{m.orders} pedidos</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {reports.map(r => (
          <div key={r.name} className="bg-white rounded-2xl border border-[#e6e6e6] p-3.5 flex items-center gap-3 hover:bg-[#fafafa] transition-colors">
            <div className={`w-7 h-7 rounded ${r.color} flex items-center justify-center shrink-0`}><r.icon className={`w-3.5 h-3.5 ${r.textColor}`} /></div>
            <div className="flex-1 min-w-0"><h4 className="text-[12px] font-semibold text-[#333]">{r.name}</h4><p className="text-[10px] text-[#999]">{r.description}</p></div>
            {r.href ? (
              <Link href={r.href} className="text-[11px] text-[#3483fa] font-medium hover:text-[#2968c8] shrink-0">Ver</Link>
            ) : (
              <button className="text-[11px] text-[#3483fa] font-medium hover:text-[#2968c8] shrink-0">Gerar</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ImportExportTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
        <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 rounded bg-[#f0f7ff] flex items-center justify-center"><Upload className="w-3.5 h-3.5 text-[#3483fa]" /></div><h3 className="text-[12px] font-semibold text-[#333]">Importar</h3></div>
        <p className="text-[10px] text-[#999] mb-3">Importe dados de planilhas</p>
        <div className="space-y-1.5">
          {['Produtos', 'Fornecedores', 'Vendas', 'Estoque'].map(i => (
            <div key={i} className="flex items-center gap-2 p-2 rounded border border-[#eeeeee] hover:bg-[#fafafa] transition-colors cursor-pointer">
              <FileSpreadsheet className="w-3 h-3 text-[#38a169]" />
              <span className="text-[11px] font-medium text-[#666] flex-1">{i}</span>
              <span className="text-[9px] text-[#ccc]">.xlsx</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
        <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 rounded bg-[#f0fff4] flex items-center justify-center"><Download className="w-3.5 h-3.5 text-[#38a169]" /></div><h3 className="text-[12px] font-semibold text-[#333]">Exportar</h3></div>
        <p className="text-[10px] text-[#999] mb-3">Exporte seus dados</p>
        <div className="space-y-1.5">
          {['Produtos', 'Vendas', 'Financeiro', 'Relatórios'].map(e => (
            <div key={e} className="flex items-center gap-2 p-2 rounded border border-[#eeeeee] hover:bg-[#fafafa] transition-colors cursor-pointer">
              <File className="w-3 h-3 text-[#3483fa]" />
              <span className="text-[11px] font-medium text-[#666] flex-1">{e}</span>
              <span className="text-[9px] text-[#ccc]">.xlsx, .pdf</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AnalisesPage() {
  return (
    <div className="mp-stack">
      <PageHeader title="Análises" description="Relatórios e importação/exportação" />
      <Tabs defaultValue="relatorios">
        <TabsList>
          <TabsTrigger value="relatorios"><BarChart3 className="w-3.5 h-3.5 mr-1 inline" /> Relatórios</TabsTrigger>
          <TabsTrigger value="import-export"><FileInput className="w-3.5 h-3.5 mr-1 inline" /> Importar / Exportar</TabsTrigger>
        </TabsList>
        <TabsContent value="relatorios"><RelatoriosTab /></TabsContent>
        <TabsContent value="import-export"><ImportExportTab /></TabsContent>
      </Tabs>
    </div>
  )
}
