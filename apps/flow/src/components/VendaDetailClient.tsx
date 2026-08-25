'use client'

import Link from 'next/link'
import { ArrowLeft, DollarSign, Package, Clock } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { SaleDetail } from '@/lib/detail-types'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-semibold text-[#333] mb-3">{children}</h3>
}

function InfoRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#f5f5f5] last:border-0">
      <span className="text-[12px] text-[#999]">{label}</span>
      <span className={`text-[12px] ${mono ? 'font-mono' : ''} ${bold ? 'font-medium text-[#333]' : 'text-[#666]'}`}>{value}</span>
    </div>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-3">
      <div className="text-[11px] text-[#999] mb-1">{label}</div>
      <div className="text-[16px] font-semibold text-[#333]">{value}</div>
      {sub && <div className="text-[10px] text-[#ccc] mt-0.5">{sub}</div>}
    </div>
  )
}

function VisaoGeralTab({ sale }: { sale: SaleDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Produto</SectionTitle>
          <div className="flex items-center gap-3 p-3 bg-[#fafafa] rounded-md">
            <div className="w-10 h-10 rounded-md bg-white border border-[#e6e6e6] flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-[#ccc]" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-[#333]">{sale.product.name}</div>
              <div className="text-[11px] text-[#999]">{sale.product.brand} — SKU {sale.product.sku}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mt-3">
            <InfoRow label="Quantidade" value={String(sale.quantity)} />
            <InfoRow label="Preço unitário" value={formatBRL(sale.price)} />
            <InfoRow label="Total" value={formatBRL(sale.revenue)} bold />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Composição financeira</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow label="Receita" value={formatBRL(sale.revenue)} bold />
            <InfoRow label="Custo do produto" value={formatBRL(sale.cost)} />
            <InfoRow label="Taxas marketplace" value={formatBRL(sale.fees)} />
            <InfoRow label="Frete" value={formatBRL(sale.freight)} />
            <InfoRow label="Impostos" value={formatBRL(sale.taxes)} />
          </div>
          <div className="mt-2 pt-2 border-t border-[#e6e6e6]">
            <InfoRow label="Lucro" value={formatBRL(sale.profit)} bold />
            <InfoRow label="Margem" value={`${sale.margin}%`} bold />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Cliente</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Nome" value={sale.customer.name} bold />
            <InfoRow label="E-mail" value={sale.customer.email} />
            <InfoRow label="Telefone" value={sale.customer.phone} />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Pagamento</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Método" value={sale.payment.method} bold />
            <InfoRow label="Parcelas" value={`${sale.payment.installments}x`} />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Frete</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Método" value={sale.shipping.method} />
            <InfoRow label="Status" value={sale.shipping.status} />
            {sale.shipping.tracking && <InfoRow label="Rastreio" value={sale.shipping.tracking} mono />}
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Detalhes</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Marketplace" value={sale.marketplace} />
            <InfoRow label="Data" value={sale.date} />
            <InfoRow label="Pedido" value={sale.order_id} mono />
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineTab({ sale }: { sale: SaleDetail }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e6e6e6]">
        <SectionTitle>Histórico da venda</SectionTitle>
      </div>
      <div className="divide-y divide-[#eeeeee]">
        {sale.timeline.map((h, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1f2328] mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#333]">{h.action}</span>
              </div>
              <div className="text-[11px] text-[#666] mt-0.5">{h.details}</div>
            </div>
            <div className="text-[10px] text-[#ccc] text-right flex-shrink-0">
              <div>{h.date}</div>
              <div>{h.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VendaDetailClient({ sale }: { sale: SaleDetail }) {
  return (
    <div>
      <div className="mb-4">
        <Link href="/vendas" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vendas
        </Link>
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-md p-5 mb-4">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-full sm:w-14 h-14 rounded-md bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center flex-shrink-0">
            <MarketplaceLogo name={sale.marketplace} className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-[18px] font-semibold text-[#333]">{sale.order_id}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[12px] text-[#999]">{sale.marketplace}</span>
                  <span className="text-[10px] text-[#ccc]">•</span>
                  <span className="text-[12px] text-[#999]">{sale.customer.name}</span>
                  <span className="text-[10px] text-[#ccc]">•</span>
                  <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${sale.profit >= 0 ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#fff5f5] text-[#e74c3c]'}`}>
                    {sale.profit >= 0 ? 'Lucrativo' : 'Prejuízo'}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-[18px] font-semibold text-[#333]">{formatBRL(sale.revenue)}</div>
                <div className={`text-[13px] font-medium ${sale.profit >= 0 ? 'text-[#38a169]' : 'text-[#e74c3c]'}`}>
                  Lucro: {formatBRL(sale.profit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <StatBox label="Receita" value={formatBRL(sale.revenue)} />
        <StatBox label="Custo" value={formatBRL(sale.cost)} />
        <StatBox label="Taxas" value={formatBRL(sale.fees)} />
        <StatBox label="Lucro" value={formatBRL(sale.profit)} />
        <StatBox label="Margem" value={`${sale.margin}%`} />
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral"><DollarSign className="w-3.5 h-3.5 mr-1 inline" /> Visão geral</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="w-3.5 h-3.5 mr-1 inline" /> Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral"><VisaoGeralTab sale={sale} /></TabsContent>
        <TabsContent value="timeline"><TimelineTab sale={sale} /></TabsContent>
      </Tabs>
    </div>
  )
}
