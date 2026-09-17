'use client'

import { useState } from 'react'
import { BadgeDollarSign, Calculator, Percent, CircleDollarSign, Search, ArrowLeft } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import LoadingState from '@/components/ui/LoadingState'

function CustoRealTab() {
  const { data: products, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('*').eq('status', 'ACTIVE').order('name')
    if (error) throw error
    return data || []
  })

  const list = (products || []) as Record<string, unknown>[]
  const avgCost = list.length > 0 ? list.reduce((a, p) => a + Number(p.cost_real || p.cost_purchase || 0), 0) / list.length : 0
  const maxCost = list.length > 0 ? Math.max(...list.map(p => Number(p.cost_real || p.cost_purchase || 0))) : 0
  const minCost = list.length > 0 ? Math.min(...list.map(p => Number(p.cost_real || p.cost_purchase || 0))) : 0

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Custo Médio" value={`R$ ${avgCost.toFixed(2)}`} />
        <StatCard label="Maior Custo" value={`R$ ${maxCost.toFixed(2)}`} />
        <StatCard label="Menor Custo" value={`R$ ${minCost.toFixed(2)}`} />
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6]">
          <LoadingState message="Carregando produtos e custos..." padding={60} />
        </div>
      ) : (
        <ModuleTable>
          <TableHead><Th>SKU</Th><Th>Produto</Th><Th className="text-right">Compra</Th><Th className="text-right">Frete</Th><Th className="text-right">Embalagem</Th><Th className="text-right">Outros</Th><Th className="text-right">Custo Real</Th></TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {list.map(p => (
              <tr key={p.id as string} className="hover:bg-[#fafafa] transition-colors">
                <Td className="font-mono text-[#999]">{p.sku as string}</Td>
                <Td className="font-medium text-[#333]">{p.name as string}</Td>
                <Td className="text-right">R$ {Number(p.cost_purchase || 0).toFixed(2)}</Td>
                <Td className="text-right">R$ {Number(p.freight_purchase || 0).toFixed(2)}</Td>
                <Td className="text-right">R$ {Number(p.packaging_cost || 0).toFixed(2)}</Td>
                <Td className="text-right">R$ {Number(p.other_costs || 0).toFixed(2)}</Td>
                <Td className="text-right font-bold text-[#333]">R$ {Number(p.cost_real || p.cost_purchase || 0).toFixed(2)}</Td>
              </tr>
            ))}
          </tbody>
        </ModuleTable>
      )}
    </div>
  )
}

function PrecoSugeridoTab() {
  const { data: products, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('*').eq('status', 'ACTIVE').order('name')
    if (error) throw error
    return data || []
  })

  const { data: mps } = useSupabaseQuery(async (s) => {
    const { data } = await s.from('marketplaces').select('code, default_percentage_fee').eq('status', 'ACTIVE')
    return data || []
  })

  const list = (products || []) as Record<string, unknown>[]
  const fees: Record<string, number> = {}
  for (const mp of (mps || []) as Record<string, unknown>[]) {
    fees[mp.code as string] = Number(mp.default_percentage_fee || 0)
  }
  if (Object.keys(fees).length === 0) {
    Object.assign(fees, { MERCADO_LIVRE: 16, SHOPEE: 18, AMAZON: 15, TIKTOK: 20, MAGALU: 17 })
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        {Object.entries(fees).map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl border border-[#e6e6e6] p-2.5 text-center">
            <p className="text-[9px] text-[#999] uppercase font-medium">{k}</p>
            <p className="text-[14px] font-bold text-[#333] mt-0.5">{v}%</p>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6]">
          <LoadingState message="Carregando produtos e taxas..." padding={60} />
        </div>
      ) : (
        <ModuleTable>
          <TableHead><Th>SKU</Th><Th>Produto</Th><Th className="text-right">Custo</Th><Th className="text-right">ML</Th><Th className="text-right">Shopee</Th><Th className="text-right">Amazon</Th><Th className="text-right">TikTok</Th></TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {list.map(p => {
              const cost = Number(p.cost_real || p.cost_purchase || 0)
              const ml = cost / (1 - fees.ML / 100 - 0.30)
              const shp = cost / (1 - fees.SHP / 100 - 0.30)
              const amz = cost / (1 - fees.AMZ / 100 - 0.30)
              const tt = cost / (1 - fees.TT / 100 - 0.30)
              return (
                <tr key={p.id as string} className="hover:bg-[#fafafa] transition-colors">
                  <Td className="font-mono text-[#999]">{p.sku as string}</Td>
                  <Td className="font-medium text-[#333]">{p.name as string}</Td>
                  <Td className="text-right">R$ {cost.toFixed(2)}</Td>
                  <Td className="text-right font-medium text-[#38a169]">R$ {ml.toFixed(2)}</Td>
                  <Td className="text-right font-medium text-[#38a169]">R$ {shp.toFixed(2)}</Td>
                  <Td className="text-right font-medium text-[#38a169]">R$ {amz.toFixed(2)}</Td>
                  <Td className="text-right font-medium text-[#38a169]">R$ {tt.toFixed(2)}</Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
    </div>
  )
}

function MinhaMargemTab() {
  const { data: products, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('*').eq('status', 'ACTIVE').order('name')
    if (error) throw error
    return data || []
  })

  const list = (products || []) as Record<string, unknown>[]

  return (
    <div>
      <ModuleTable>
        <TableHead><Th>SKU</Th><Th>Produto</Th><Th className="text-right">Preço</Th><Th className="text-right">Custo</Th><Th className="text-right">Lucro</Th><Th className="text-right">Margem</Th><Th className="text-center">Status</Th></TableHead>
        <tbody className="divide-y divide-[#eeeeee]">
          {list.map(p => {
            const cost = Number(p.cost_real || p.cost_purchase || 0)
            const sale = cost * 1.3; const fees = sale * 0.16; const profit = sale - cost - fees; const margin = (profit / sale) * 100
            return (
              <tr key={p.id as string} className="hover:bg-[#fafafa] transition-colors">
                <Td className="font-mono text-[#999]">{p.sku as string}</Td>
                <Td className="font-medium text-[#333]">{p.name as string}</Td>
                <Td className="text-right">R$ {sale.toFixed(2)}</Td>
                <Td className="text-right">R$ {(cost + fees).toFixed(2)}</Td>
                <Td className="text-right font-medium" style={{ color: profit >= 0 ? '#38a169' : '#e74c3c' }}>R$ {profit.toFixed(2)}</Td>
                <Td className="text-right font-medium" style={{ color: margin >= 0 ? '#38a169' : '#e74c3c' }}>{margin.toFixed(1)}%</Td>
                <Td className="text-center"><span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${margin >= 0 ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#fff5f5] text-[#e74c3c]'}`}>{margin >= 0 ? 'Lucrativo' : 'Prejuízo'}</span></Td>
              </tr>
            )
          })}
        </tbody>
      </ModuleTable>
    </div>
  )
}

function PrecoVendaTab() {
  const { data: products } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('*').eq('status', 'ACTIVE').order('name')
    if (error) throw error
    return data || []
  })

  const list = (products || []) as Record<string, unknown>[]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {list.slice(0, 6).map(p => {
        const cost = Number(p.cost_real || p.cost_purchase || 0)
        return (
          <div key={p.id as string} className="bg-white rounded-2xl border border-[#e6e6e6] p-4">
            <h4 className="text-[12px] font-semibold text-[#333]">{p.name as string}</h4>
            <p className="text-[10px] text-[#999] mb-3">{p.sku as string} — Custo: R$ {cost.toFixed(2)}</p>
            <div className="space-y-1.5">
              {[{ name: 'Mercado Livre', fee: 16 }, { name: 'Shopee', fee: 18 }, { name: 'Amazon', fee: 15 }, { name: 'TikTok Shop', fee: 20 }].map(m => {
                const price = cost / (1 - m.fee / 100 - 0.30)
                return (
                  <div key={m.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5"><MarketplaceLogo name={m.name} className="w-4 h-4" /><span className="text-[#999]">{m.name}</span></div>
                    <span className="font-semibold text-[#333]">R$ {price.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SimulatorTab() {
  const [cost, setCost] = useState(45); const [freight, setFreight] = useState(10); const [margin, setMargin] = useState(30); const [fee, setFee] = useState(16)
  const total = cost + freight; const price = total / (1 - fee / 100 - margin / 100); const profit = price - total - price * fee / 100
  const inp = "w-full border border-[#e6e6e6] rounded-md px-3 py-2 text-[13px] text-[#333] outline-none focus:border-[#1f2328] transition-colors"
  return (
    <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5">
      <h3 className="text-[13px] font-semibold text-[#333] mb-4">Simulador de Preço</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div><label className="block text-[11px] font-medium text-[#999] mb-1">Custo (R$)</label><input type="number" value={cost} onChange={e => setCost(+e.target.value)} className={inp} /></div>
        <div><label className="block text-[11px] font-medium text-[#999] mb-1">Frete (R$)</label><input type="number" value={freight} onChange={e => setFreight(+e.target.value)} className={inp} /></div>
        <div><label className="block text-[11px] font-medium text-[#999] mb-1">Margem (%)</label><input type="number" value={margin} onChange={e => setMargin(+e.target.value)} className={inp} /></div>
        <div><label className="block text-[11px] font-medium text-[#999] mb-1">Taxa (%)</label><input type="number" value={fee} onChange={e => setFee(+e.target.value)} className={inp} /></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        <div className="p-3 rounded-md bg-[#f5f5f5] text-center"><p className="text-[9px] text-[#999] uppercase font-medium">Custo Total</p><p className="text-[14px] font-bold text-[#333] mt-0.5">R$ {total.toFixed(2)}</p></div>
        <div className="p-3 rounded-md bg-[#f5f5f5] text-center"><p className="text-[9px] text-[#1f2328] uppercase font-medium">Preço Sugerido</p><p className="text-[14px] font-bold text-[#1f2328] mt-0.5">R$ {price.toFixed(2)}</p></div>
        <div className="p-3 rounded-md bg-[#f0fff4] text-center"><p className="text-[9px] text-[#38a169] uppercase font-medium">Lucro</p><p className="text-[14px] font-bold text-[#38a169] mt-0.5">R$ {profit.toFixed(2)}</p></div>
      </div>
    </div>
  )
}

export default function PrecificacaoPage() {
  return (
    <div className="mp-stack">
      <Tabs defaultValue="custo-real" plain>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eeeeee] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="hub-mobile-back-btn !w-8 !h-8 sm:!w-9 sm:!h-9 !rounded-xl"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-[15px] sm:text-[16px] font-bold tracking-tight text-[#111111] leading-tight">
                Precificação
              </h1>
              <p className="text-[11px] sm:text-xs text-[#888888] leading-tight mt-0.5">
                Custo real, cálculo de margem e sugestão de preço por canal
              </p>
            </div>
          </div>

          <TabsList align="right" className="shrink-0">
            <TabsTrigger variant="icon" value="custo-real" title="Custo">
              <BadgeDollarSign size={19} strokeWidth={2} className="w-5 h-5 shrink-0" />
            </TabsTrigger>
            <TabsTrigger variant="icon" value="preco-sugerido" title="Sugerido">
              <Calculator size={19} strokeWidth={2} className="w-5 h-5 shrink-0" />
            </TabsTrigger>
            <TabsTrigger variant="icon" value="minha-margem" title="Margem">
              <Percent size={19} strokeWidth={2} className="w-5 h-5 shrink-0" />
            </TabsTrigger>
            <TabsTrigger variant="icon" value="preco-venda" title="Venda">
              <CircleDollarSign size={19} strokeWidth={2} className="w-5 h-5 shrink-0" />
            </TabsTrigger>
            <TabsTrigger variant="icon" value="simulador" title="Simulador">
              <Search size={19} strokeWidth={2} className="w-5 h-5 shrink-0" />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="custo-real"><CustoRealTab /></TabsContent>
        <TabsContent value="preco-sugerido"><PrecoSugeridoTab /></TabsContent>
        <TabsContent value="minha-margem"><MinhaMargemTab /></TabsContent>
        <TabsContent value="preco-venda"><PrecoVendaTab /></TabsContent>
        <TabsContent value="simulador"><SimulatorTab /></TabsContent>
      </Tabs>
    </div>
  )
}
