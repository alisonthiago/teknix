'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreHorizontal, Package, TrendingUp, ShoppingCart, Store, Clock, FileText, Share2, Pencil } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ProductDetail } from '@/lib/detail-types'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/utils/supabase/client'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-[#f0fff4] text-[#38a169]',
    INACTIVE: 'bg-[#f5f5f5] text-[#999]',
    OUT_OF_STOCK: 'bg-[#fff5f5] text-[#e74c3c]',
    LOW_STOCK: 'bg-[#fffaf0] text-[#e67e22]',
    PAUSED: 'bg-[#fffaf0] text-[#e67e22]',
  }
  const labels: Record<string, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    OUT_OF_STOCK: 'Sem Estoque',
    LOW_STOCK: 'Estoque Baixo',
    PAUSED: 'Pausado',
  }
  return (
    <span className={`inline-flex px-2 py-[2px] rounded text-xs font-medium ${styles[status] || styles.ACTIVE}`}>
      {labels[status] || status}
    </span>
  )
}

function MarketplaceStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-[2px] rounded text-xs font-medium ${status === 'ACTIVE' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#999]'}`}>
      {status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-semibold text-[#333] mb-3">{children}</h3>
}

function InfoRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#f5f5f5] last:border-0">
      <span className="text-sm text-[#999]">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono' : ''} ${bold ? 'font-medium text-[#333]' : 'text-[#666]'}`}>{value}</span>
    </div>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-3">
      <div className="text-[11px] text-[#999] mb-1">{label}</div>
      <div className="text-[16px] font-semibold text-[#333]">{value}</div>
      {sub && <div className="text-xs text-[#ccc] mt-0.5">{sub}</div>}
    </div>
  )
}

function VisaoGeralTab({ product }: { product: ProductDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs">
          <SectionTitle>Especificações Técnicas & Atributos</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow label="Nome do Produto" value={product.name} bold />
            <InfoRow label="SKU / Código" value={product.sku} mono />
            <InfoRow label="Marca" value={product.brand} />
            <InfoRow label="Modelo" value={product.model} />
            <InfoRow label="Código de Barras (EAN)" value={product.ean} mono />
            <InfoRow label="Categoria Mercado Livre" value={product.category} />
            <InfoRow label="Fornecedor / Origem" value={product.supplier.name} />
            <InfoRow label="Data de Sincronização" value={product.created_at} />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs">
          <SectionTitle>Descrição Completa do Produto</SectionTitle>
          <div className="mt-2 text-[13px] text-[#334155] leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-[#e6e6e6] max-h-96 overflow-y-auto font-sans">
            {product.description || (
              `PRODUTO: ${product.name}
SKU: ${product.sku}
MARCA: ${product.brand || 'Original'}
MODELO: ${product.model || 'Padrão'}
CATEGORIA: ${product.category || 'Geral'}

DESCRIÇÃO TÉCNICA:
• Produto de alta durabilidade e excelente desempenho operacional.
• Fabricado com materiais de primeira linha e em conformidade com as normas técnicas.
• Indicado para operações diárias com máxima eficiência e segurança.
• Acompanha Nota Fiscal eletrônica e garantia de fábrica.

DIMENSÕES E EXPEDIÇÃO:
• Embalagem reforçada e padronizada para transporte seguro em todos os marketplaces (Mercado Livre, Shopee, Magalu e TikTok Shop).
• Estoque conferido e sincronizado em tempo real na central TEKNIX.`
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Custo</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow label="Custo de compra" value={formatBRL(product.costs.purchase)} />
            <InfoRow label="Frete de compra" value={formatBRL(product.costs.freight)} />
            <InfoRow label="Embalagem" value={formatBRL(product.costs.packaging)} />
            <InfoRow label="Outros custos" value={formatBRL(product.costs.other)} />
          </div>
          <div className="mt-2 pt-2 border-t border-[#e6e6e6]">
            <InfoRow label="Custo real" value={formatBRL(product.costs.real)} bold />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Precificação</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow label="Preço atual" value={formatBRL(product.pricing.current_price)} bold />
            <InfoRow label="Preço sugerido" value={formatBRL(product.pricing.suggested_price)} />
            <InfoRow label="Preço mínimo" value={formatBRL(product.pricing.minimum_price)} />
            <InfoRow label="Lucro" value={formatBRL(product.pricing.profit)} />
            <InfoRow label="Margem" value={`${product.pricing.margin}%`} />
          </div>
          <div className="mt-3">
            <button className="text-[11px] text-[#1f2328] hover:underline font-medium">Ajustar preço</button>
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Estoque</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Físico" value={String(product.stock.physical)} />
            <StatBox label="Reservado" value={String(product.stock.reserved)} />
            <StatBox label="Disponível" value={String(product.stock.available)} />
            <StatBox label="Mínimo" value={String(product.stock.minimum)} />
            <StatBox label="Localização" value={product.stock.location} />
            <StatBox label="Valor" value={formatBRL(product.stock.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Fornecedor</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Nome" value={product.supplier.name} bold />
            <InfoRow label="CNPJ" value={product.supplier.cnpj} mono />
            <InfoRow label="Contato" value={product.supplier.contact} />
            <InfoRow label="Telefone" value={product.supplier.phone} />
            <InfoRow label="WhatsApp" value={product.supplier.whatsapp} />
            <InfoRow label="E-mail" value={product.supplier.email} />
            <InfoRow label="Prazo" value={`${product.supplier.delivery_time} dias`} />
            <InfoRow label="Pedido mínimo" value={String(product.supplier.min_order)} />
            <InfoRow label="Última compra" value={product.supplier.last_purchase} />
            <InfoRow label="Custo atual" value={formatBRL(product.supplier.cost)} />
          </div>
          <div className="mt-3">
            <Link href={`/fornecedores/${product.supplier.id}`} className="text-[11px] text-[#1f2328] hover:underline font-medium">Ver fornecedor</Link>
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Marketplaces</SectionTitle>
          <div className="space-y-2">
            {product.marketplaces.map(mp => (
              <div key={mp.listing_id} className="flex items-center justify-between py-1.5 border-b border-[#f5f5f5] last:border-0">
                <div className="flex items-center gap-2">
                  <MarketplaceLogo name={mp.name} className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium text-[#333]">{mp.name}</div>
                    <div className="text-xs font-mono text-[#999]">{mp.listing_id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#333]">{formatBRL(mp.price)}</div>
                  <MarketplaceStatusBadge status={mp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Vendas por período</SectionTitle>
          <div className="space-y-1.5">
            {product.sales_chart.slice(-7).map(d => (
              <div key={d.period} className="flex items-center gap-2">
                <span className="text-xs text-[#999] w-8">{d.period}</span>
                <div className="flex-1 h-1.5 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1f2328] rounded-full" style={{ width: `${(d.units / 5) * 100}%` }} />
                </div>
                <span className="text-xs text-[#666] w-6 text-right">{d.units}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function VendasTab({ product }: { product: ProductDetail }) {
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL')
  const accounts = Array.from(new Set(product.recent_sales.map(s => s.account_name).filter(Boolean))) as string[]
  
  const filteredSales = selectedAccount === 'ALL' 
    ? product.recent_sales 
    : product.recent_sales.filter(s => s.account_name === selectedAccount)

  const filteredRevenue = filteredSales.reduce((acc, s) => acc + s.revenue, 0)
  const filteredProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0)
  const filteredMargin = filteredRevenue > 0 ? (filteredProfit / filteredRevenue) * 100 : 0
  const filteredTicket = filteredSales.length > 0 ? filteredRevenue / filteredSales.length : 0
  const filteredOrders = Array.from(new Set(filteredSales.map(s => s.order_id))).length
  const filteredQuantity = filteredSales.reduce((acc, s) => acc + s.quantity, 0)

  return (
    <div className="space-y-4">
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setSelectedAccount('ALL')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${selectedAccount === 'ALL' ? 'bg-[#333] text-white' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#e6e6e6]'}`}
          >
            Todas as Contas
          </button>
          {accounts.map(acc => (
            <button 
              key={acc}
              onClick={() => setSelectedAccount(acc)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${selectedAccount === acc ? 'bg-[#333] text-white' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#e6e6e6]'}`}
            >
              {acc}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatBox label="Total vendido" value={`${filteredQuantity} un`} />
        <StatBox label="Faturamento" value={formatBRL(filteredRevenue)} />
        <StatBox label="Lucro" value={formatBRL(filteredProfit)} />
        <StatBox label="Margem média" value={`${filteredMargin.toFixed(1)}%`} />
        <StatBox label="Ticket médio" value={formatBRL(filteredTicket)} />
        <StatBox label="Total pedidos" value={String(filteredOrders)} />
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#e6e6e6] flex items-center justify-between">
          <SectionTitle>Histórico de Vendas & Compradores</SectionTitle>
          {selectedAccount !== 'ALL' && <span className="text-xs bg-[#f5f5f5] px-2 py-1 rounded text-[#666]">Filtrado: {selectedAccount}</span>}
        </div>
          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-[#999] text-[13px]">
              Nenhuma venda registrada para este produto até o momento.
            </div>
          ) : (
            <div className="table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f5f5f5] bg-[#fafafa]">
                    <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Pedido</th>
                    <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Cliente / Comprador</th>
                    <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Marketplace</th>
                    <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Qtd</th>
                    <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Preço</th>
                    <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Faturamento</th>
                    <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Lucro</th>
                    <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Margem</th>
                    <th className="text-center py-3.5 px-5 font-medium text-[#999] text-xs">Status</th>
                    <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeeeee]">
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1f2328]">
                        <Link href={`/pedidos/${sale.order_uuid || sale.order_id}`} className="hover:underline">
                          {sale.order_id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#1e293b]">
                        {sale.customer_name || 'Cliente Mercado Livre'}
                      </td>
                      <td className="py-3 px-4 text-[#333]">
                        <div className="font-semibold text-[11px] flex items-center gap-1.5">
                          <MarketplaceLogo name={sale.marketplace} className="w-3.5 h-3.5" />
                          {sale.marketplace}
                        </div>
                        <div className="text-[9px] text-[#999]">{sale.account_name || 'TEKNIXBRASIL'}</div>
                      </td>
                      <td className="py-3 px-4 text-right text-[#64748b] font-medium">{sale.quantity}</td>
                      <td className="py-3 px-4 text-right text-[#64748b]">{formatBRL(sale.price)}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#1e293b]">{formatBRL(sale.revenue)}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#16a34a]">{formatBRL(sale.profit)}</td>
                      <td className="py-3 px-4 text-right font-medium text-[#64748b]">{sale.margin}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[#64748b] font-mono text-[11px]">{sale.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}

function EstoqueTab({ product }: { product: ProductDetail }) {
  const recent7DaysUnits = (product.recent_sales || []).slice(0, 7).reduce((acc, s) => acc + Number(s.quantity || 0), 0)
  const dailyAverage = recent7DaysUnits > 0 ? (recent7DaysUnits / 7) : (product.summary.total_sales > 0 ? product.summary.total_sales / 30 : 0.3)
  const daysRemaining = dailyAverage > 0 ? Math.round(product.stock.physical / dailyAverage) : 999
  const isCritical = product.stock.physical <= (product.stock.minimum || 3) || daysRemaining <= 5

  return (
    <div className="space-y-4">
      {/* 🧠 Inteligência Preditiva de Estoque */}
      <div className={`p-5 rounded-2xl border ${isCritical ? 'bg-[#fef2f2] border-[#fecaca]' : 'bg-[#f0fdf4] border-[#bbf7d0]'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${isCritical ? 'bg-[#dc2626] text-white' : 'bg-[#16a34a] text-white'}`}>
              {isCritical ? 'Atenção Necessária' : 'Estoque Saudável'}
            </span>
            <h4 className="text-sm font-extrabold text-[#0f172a]">
              {isCritical ? 'Risco de Ruptura de Estoque' : 'Previsão de Suprimento Normal'}
            </h4>
          </div>
          <p className="text-xs text-[#64748b]">
            Estoque atual: <strong className="text-[#0f172a]">{product.stock.physical} un</strong> • Média diária: <strong className="text-[#0f172a]">{dailyAverage.toFixed(1)} un/dia</strong> • Previsão de término em aproximadamente <strong className="text-[#0f172a]">{daysRemaining > 365 ? 'Mais de 1 ano' : `${daysRemaining} dias`}</strong>.
          </p>
        </div>

        {isCritical && (
          <Link
            href={`/purchases/new?product=${product.id}`}
            className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Fazer Pedido de Compra
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatBox label="Estoque físico" value={String(product.stock.physical)} />
        <StatBox label="Reservado" value={String(product.stock.reserved)} />
        <StatBox label="Disponível" value={String(product.stock.available)} />
        <StatBox label="Mínimo" value={String(product.stock.minimum)} />
        <StatBox label="Localização" value={product.stock.location} />
        <StatBox label="Valor em estoque" value={formatBRL(product.stock.value)} />
      </div>

      {product.marketplaces.length > 0 && (
        <div className="bg-white border border-[#e6e6e6] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e6e6e6]">
            <SectionTitle>Estoque por Conta</SectionTitle>
          </div>
        <div className="table-container">
             <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f5f5f5]">
                  <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Marketplace</th>
                  <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Conta</th>
                  <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Estoque</th>
                  <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Preço</th>
                  <th className="text-center py-3.5 px-5 font-medium text-[#999] text-xs">Status</th>
                  <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Último Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {product.marketplaces.map(mp => (
                  <tr key={mp.listing_id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <MarketplaceLogo name={mp.name} className="w-5 h-5" />
                        <span className="text-[#333]">{mp.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-[#999]">{mp.listing_id}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-[#333]">{mp.stock}</td>
                    <td className="py-2.5 px-4 text-right text-[#999]">{formatBRL(mp.price)}</td>
                    <td className="py-2.5 px-4 text-center"><MarketplaceStatusBadge status={mp.status} /></td>
                    <td className="py-2.5 px-4 text-right text-xs text-[#ccc]">{new Date(mp.last_sync).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         </div>
       )}

      <div className="bg-white border border-[#e6e6e6] rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e6e6e6]">
          <SectionTitle>Movimentações de estoque</SectionTitle>
        </div>
        <div className="table-container">
           <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f5f5f5]">
                <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Data</th>
                <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Tipo</th>
                <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Quantidade</th>
                <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Saldo</th>
                <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Pedido</th>
                <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee]">
              {product.stock_movements.map(m => (
                <tr key={m.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="py-2.5 px-4 text-[#999]">{m.date}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex px-2 py-[2px] rounded text-xs font-medium ${
                      m.type === 'COMPRA' ? 'bg-[#f0fff4] text-[#38a169]' :
                      m.type === 'VENDA' ? 'bg-[#f5f5f5] text-[#333]' :
                      m.type === 'DEVOLUCAO' ? 'bg-[#fffaf0] text-[#e67e22]' :
                      'bg-[#f5f5f5] text-[#999]'
                    }`}>{m.type}</span>
                  </td>
                  <td className={`py-2.5 px-4 text-right font-medium ${m.quantity > 0 ? 'text-[#38a169]' : 'text-[#e74c3c]'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#333]">{m.balance}</td>
                  <td className="py-2.5 px-4 font-mono text-[#999]">{m.order_ref}</td>
                  <td className="py-2.5 px-4 text-[#999]">{m.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ComprasTab({ product }: { product: ProductDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatBox label="Total comprado" value={`${product.purchases_history.reduce((a, b) => a + b.quantity, 0)} un`} />
        <StatBox label="Custo médio" value={formatBRL(product.purchases_history.reduce((a, b) => a + b.unit_cost, 0) / product.purchases_history.length)} />
        <StatBox label="Última compra" value={product.purchases_history[0]?.date || '-'} />
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e6e6e6]">
          <SectionTitle>Histórico de compras</SectionTitle>
        </div>
        <div className="table-container">
           <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f5f5f5]">
                <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Pedido</th>
                <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Fornecedor</th>
                <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Qtd</th>
                <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Custo Unit.</th>
                <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Total</th>
                <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Data</th>
                <th className="text-center py-3.5 px-5 font-medium text-[#999] text-xs">Status</th>
                <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Nota Interna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee]">
              {product.purchases_history.map(p => (
                <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[#999]">{p.order_ref}</td>
                  <td className="py-2.5 px-4 text-[#333]">{p.supplier}</td>
                  <td className="py-2.5 px-4 text-right text-[#999]">{p.quantity}</td>
                  <td className="py-2.5 px-4 text-right text-[#999]">{formatBRL(p.unit_cost)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-[#333]">{formatBRL(p.total)}</td>
                  <td className="py-2.5 px-4 text-right text-[#999]">{p.date}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex px-2 py-[2px] rounded text-xs font-medium bg-[#f0fff4] text-[#38a169]">{p.status}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {p.purchase_id && (
                      <Link href={`/purchases/${p.purchase_id}/nota`} className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#f5f5f5] text-[#666] hover:bg-[#1f2328] hover:text-white transition-colors" title="Ver Nota Interna">
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MarketplacesTab({ product }: { product: ProductDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {product.marketplaces.map(mp => (
          <div key={mp.listing_id} className="bg-white border border-[#e6e6e6] rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MarketplaceLogo name={mp.name} className="w-8 h-8" />
                <div>
                  <div className="text-[13px] font-medium text-[#333] flex items-center gap-1.5">
                    {mp.name}
                    {mp.account_name && mp.account_name !== '—' && (
                      <span className="text-[9px] bg-[#f5f5f5] text-[#666] px-1.5 py-0.5 rounded font-normal">
                        {mp.account_name}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#999]">ID: {mp.listing_id}</div>
                </div>
              </div>
              <MarketplaceStatusBadge status={mp.status} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-[#f5f5f5]">
              <div>
                <div className="text-xs text-[#999]">Preço</div>
                <div className="text-[13px] font-medium text-[#333]">{formatBRL(mp.price)}</div>
              </div>
              <div>
                <div className="text-xs text-[#999]">Estoque</div>
                <div className="text-[13px] font-medium text-[#333]">{mp.stock}</div>
              </div>
              <div>
                <div className="text-xs text-[#999]">Última sincronização</div>
                <div className="text-[11px] text-[#666]">{new Date(mp.last_sync).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoricoTab({ product }: { product: ProductDetail }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e6e6e6]">
        <SectionTitle>Histórico de alterações</SectionTitle>
      </div>
      <div className="divide-y divide-[#eeeeee]">
        {product.history.map(h => (
          <div key={h.id} className="px-4 py-3 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1f2328] mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#333]">{h.action}</span>
                <span className="text-xs text-[#ccc]">•</span>
                <span className="text-xs text-[#999]">{h.user}</span>
              </div>
              <div className="text-[11px] text-[#666] mt-0.5">{h.details}</div>
            </div>
            <div className="text-xs text-[#ccc] text-right flex-shrink-0">
              <div>{h.date}</div>
              <div>{h.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  
  const images = product.images && product.images.length > 0 ? product.images : [product.image]
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const selectedImage = images[selectedImageIndex] || images[0]

  const handleDelete = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (error) throw error
      router.push('/operacao')
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Erro ao excluir produto. Verifique sua conexão e tente novamente.')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/operacao" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Operação / Produtos
        </Link>
      </div>

      {/* Main Product Hero Card */}
      <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 mb-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Photos Gallery */}
          <div className="w-full lg:w-80 flex flex-col items-center gap-3 shrink-0">
            {/* Big Preview Frame */}
            <div className="relative w-full h-72 rounded-2xl bg-[#fafafa] border border-[#e6e6e6] overflow-hidden flex items-center justify-center p-3 shadow-inner group">
              {selectedImage && selectedImage !== '/placeholder-product.png' ? (
                <img 
                  src={selectedImage} 
                  alt={product.name} 
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                />
              ) : (
                <Package className="w-16 h-16 text-[#ccc]" />
              )}
              
              {/* Badges on main image */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                {selectedImageIndex === 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-[#1f2328] text-white text-xs font-bold shadow-xs">
                    Foto Principal (Capa)
                  </span>
                )}
              </div>
              <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-xs font-medium px-2 py-0.5 rounded-md">
                {selectedImageIndex + 1} de {images.length} fotos
              </div>
            </div>

            {/* Thumbnails Row (Clean, no browser scrollbar) */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto w-full py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden p-1 shrink-0 transition-all cursor-pointer bg-white ${
                      selectedImageIndex === idx 
                        ? 'border-[#1f2328] ring-2 ring-[#1f2328]/20 shadow-sm scale-105' 
                        : 'border-[#e6e6e6] opacity-60 hover:opacity-100 hover:border-[#ccc]'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Product Details & Actions */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
            <div>
              {/* Top Header: Badges (Left) & Actions (Right) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#fffde7] text-[#856404] border border-[#ffeeba] text-xs font-bold shadow-2xs">
                    <MarketplaceLogo name="Mercado Livre" className="w-3.5 h-3.5" />
                    Mercado Livre Oficial
                  </span>
                  <span className="inline-flex px-3 py-1 rounded-xl bg-white text-[#555] text-xs font-semibold border border-[#e6e6e6]">
                    {product.category || 'Catálogo Geral'}
                  </span>
                  <StatusBadge status={product.status} />
                </div>

                {/* Action Buttons at Top Right Corner (Estilo Minimalista Preto/Grafite Unificado) */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-9 h-9 flex items-center justify-center bg-white text-[#374151] border border-[#e5e7eb] rounded-full hover:bg-[#f9fafb] hover:border-[#111111] hover:text-[#111111] transition-all cursor-pointer shadow-xs"
                    title="Compartilhar produto com a equipe"
                  >
                    <Share2 className="w-4 h-4 text-[#374151]" />
                  </button>
                  <button 
                    onClick={() => router.push(`/purchases/new?product=${product.id}`)} 
                    className="w-9 h-9 flex items-center justify-center bg-white text-[#374151] border border-[#e5e7eb] rounded-full hover:bg-[#f9fafb] hover:border-[#111111] hover:text-[#111111] transition-all cursor-pointer shadow-xs"
                    title="Fazer Pedido de Compra"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#374151]" />
                  </button>
                  <button 
                    onClick={() => router.push(`/produtos/${product.id}/editar`)} 
                    className="w-9 h-9 flex items-center justify-center bg-white text-[#374151] border border-[#e5e7eb] rounded-full hover:bg-[#f9fafb] hover:border-[#111111] hover:text-[#111111] transition-all cursor-pointer shadow-xs"
                    title="Editar Produto"
                  >
                    <Pencil className="w-4 h-4 text-[#374151]" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-9 h-9 flex items-center justify-center bg-white text-[#374151] border border-[#e5e7eb] rounded-full hover:bg-[#f9fafb] hover:border-[#111111] hover:text-[#111111] transition-colors focus:outline-none cursor-pointer shadow-xs" title="Mais opções">
                      <MoreHorizontal className="w-4 h-4 text-[#374151]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-2xl p-1.5 shadow-xl border border-[#e2e8f0]">
                      <DropdownMenuItem 
                        className="text-[#dc2626] focus:text-[#dc2626] focus:bg-[#fef2f2] cursor-pointer rounded-xl font-semibold text-xs py-2"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Excluir produto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] leading-snug mb-2">
                {product.name}
              </h1>

              {/* Sub-info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748b] mb-4">
                <span>Marca: <strong className="text-[#0f172a]">{product.brand}</strong></span>
                <span className="text-[#cbd5e1]">•</span>
                <span>SKU: <strong className="font-mono text-[#0f172a]">{product.sku}</strong></span>
                {product.ean && product.ean !== '—' && (
                  <>
                    <span className="text-[#cbd5e1]">•</span>
                    <span>EAN: <strong className="font-mono text-[#0f172a]">{product.ean}</strong></span>
                  </>
                )}
              </div>

              {/* Price & Stock Quick Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white border border-[#e6e6e6] rounded-2xl mb-2 shadow-2xs">
                <div>
                  <span className="text-xs uppercase font-bold text-[#64748b] tracking-wider">Preço no Mercado Livre</span>
                  <div className="text-xl font-black text-[#0f172a] mt-0.5">
                    {formatBRL(product.pricing.current_price || product.costs.real || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-[#64748b] tracking-wider">Estoque Disponível</span>
                  <div className={`text-xl font-black mt-0.5 ${product.stock.physical > 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                    {product.stock.physical} unidades
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs uppercase font-bold text-[#64748b] tracking-wider">Margem / Lucro</span>
                  <div className="text-xl font-black text-[#2563eb] mt-0.5">
                    {product.pricing.margin ? `${product.pricing.margin}%` : 'Ativo'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <StatBox label="Vendas" value={String(product.summary.total_sales)} />
        <StatBox label="Estoque" value={String(product.stock.physical)} />
        <StatBox label="Faturamento" value={formatBRL(product.summary.total_revenue)} />
        <StatBox label="Lucro" value={formatBRL(product.summary.total_profit)} />
        <StatBox label="Margem" value={`${product.summary.avg_margin}%`} />
        <StatBox label="Pedidos" value={String(product.summary.total_orders)} />
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral"><Package className="w-3.5 h-3.5 mr-1 inline" /> Visão geral</TabsTrigger>
          <TabsTrigger value="vendas"><TrendingUp className="w-3.5 h-3.5 mr-1 inline" /> Vendas</TabsTrigger>
          <TabsTrigger value="estoque"><ShoppingCart className="w-3.5 h-3.5 mr-1 inline" /> Estoque</TabsTrigger>
          <TabsTrigger value="compras"><Store className="w-3.5 h-3.5 mr-1 inline" /> Compras</TabsTrigger>
          <TabsTrigger value="marketplaces"><Store className="w-3.5 h-3.5 mr-1 inline" /> Marketplaces</TabsTrigger>
          <TabsTrigger value="historico"><Clock className="w-3.5 h-3.5 mr-1 inline" /> Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral"><VisaoGeralTab product={product} /></TabsContent>
        <TabsContent value="vendas"><VendasTab product={product} /></TabsContent>
        <TabsContent value="estoque"><EstoqueTab product={product} /></TabsContent>
        <TabsContent value="compras"><ComprasTab product={product} /></TabsContent>
        <TabsContent value="marketplaces"><MarketplacesTab product={product} /></TabsContent>
        <TabsContent value="historico"><HistoricoTab product={product} /></TabsContent>
      </Tabs>

      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={product.name}
        description="Esta ação excluirá o produto apenas do sistema TEKNIX. Ele não será excluído dos Marketplaces conectados."
      />

      <ShareContextModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Produto"
        messageType="CARD_PRODUCT"
        metadata={{
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          product_image: product.image,
          total_amount: product.pricing.current_price || product.costs.real || 0,
          stock: product.stock.physical
        }}
      />
    </div>
  )
}
