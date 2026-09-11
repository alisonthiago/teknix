'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreHorizontal, Package, TrendingUp, ShoppingCart, Store, Clock, FileText, Share2, Pencil, CheckCircle2, ExternalLink, ShieldAlert, Award, RefreshCw, DollarSign, Layers, Globe, Plus, Search, Sparkles, Tag } from 'lucide-react'
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
  const router = useRouter()
  // Modal de Ajuste de Preço
  const [modalData, setModalData] = useState<{
    open: boolean
    title: string
    currentPrice: number
    listingId?: string
    isSite?: boolean
    channelName: string
    externalId: string
  } | null>(null)

  const [inputPrice, setInputPrice] = useState('')
  const [inputReason, setInputReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal de Nova Oferta / Publicação de Canal
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<'mercadolivre' | 'shopee' | 'magalu'>('mercadolivre')
  const [mlMode, setMlMode] = useState<'CATALOG' | 'TRADITIONAL'>('CATALOG')
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [catalogSearching, setCatalogSearching] = useState(false)
  const [catalogCandidates, setCatalogCandidates] = useState<any[]>([])
  const [selectedCatalogId, setSelectedCatalogId] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [listingType, setListingType] = useState<'gold_special' | 'gold_pro'>('gold_special')
  const [customTitle, setCustomTitle] = useState('')
  const [publishLoading, setPublishLoading] = useState(false)
  const [publishFeedback, setPublishFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const triggerCatalogSearch = async (overrideQuery?: string) => {
    setCatalogSearching(true)
    try {
      const res = await fetch('/api/mercadolivre/catalog/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: overrideQuery ?? (catalogSearchQuery || product.name),
          gtin: product.ean && product.ean !== '—' ? product.ean : undefined,
          brand: product.brand && product.brand !== '—' ? product.brand : undefined,
          model: product.model && product.model !== '—' ? product.model : undefined
        })
      })
      const json = await res.json()
      if (json.candidates && json.candidates.length > 0) {
        setCatalogCandidates(json.candidates)
        if (!selectedCatalogId) {
          setSelectedCatalogId(json.candidates[0].catalog_product_id)
        }
      }
    } catch (e) {
      console.warn('Erro na busca do catálogo:', e)
    } finally {
      setCatalogSearching(false)
    }
  }

  const handlePublishOffer = async () => {
    const numPrice = Number(offerPrice.replace(',', '.'))
    if (!numPrice || numPrice <= 0) {
      setPublishFeedback({ type: 'error', text: 'Informe um preço válido para a oferta.' })
      return
    }

    if (selectedChannel === 'mercadolivre' && mlMode === 'CATALOG' && !selectedCatalogId) {
      setPublishFeedback({ type: 'error', text: 'Selecione ou informe um Catalog Product ID válido do Mercado Livre.' })
      return
    }

    setPublishLoading(true)
    setPublishFeedback(null)

    try {
      const res = await fetch('/api/marketplaces/publish-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          channel: selectedChannel,
          mode: mlMode,
          catalogProductId: selectedCatalogId,
          price: numPrice,
          listingType,
          title: customTitle || product.name
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao publicar oferta')

      setPublishFeedback({
        type: 'success',
        text: json.message || 'Oferta criada e vinculada com sucesso ao produto central!'
      })

      setTimeout(() => {
        setPublishModalOpen(false)
        router.refresh()
      }, 1400)
    } catch (err: any) {
      setPublishFeedback({ type: 'error', text: err.message || 'Falha ao criar oferta' })
    } finally {
      setPublishLoading(false)
    }
  }

  const listings = product.channel_listings && product.channel_listings.length > 0
    ? product.channel_listings
    : product.marketplaces.map(mp => ({
        id: mp.listing_id,
        channel: 'mercadolivre',
        channel_name: mp.name,
        account_name: mp.account_name,
        listing_id: mp.listing_id,
        external_id: mp.listing_id,
        title: product.name,
        price: mp.price,
        stock: mp.stock,
        status: mp.status,
        sold_quantity: 0,
        total_revenue: 0,
        permalink: null,
        thumbnail_url: null,
        last_sync: mp.last_sync,
        is_best_seller: false
      }))

  const openPriceModal = (item: {
    title: string
    currentPrice: number
    listingId?: string
    isSite?: boolean
    channelName: string
    externalId: string
  }) => {
    setModalData({ open: true, ...item })
    setInputPrice(String(item.currentPrice))
    setInputReason('')
    setFeedback(null)
  }

  const handleSavePrice = async () => {
    if (!modalData) return
    const numPrice = Number(inputPrice.replace(',', '.'))
    if (isNaN(numPrice) || numPrice < 0) {
      setFeedback({ type: 'error', text: 'Informe um valor numérico válido.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/products/${product.id}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: modalData.listingId,
          isSitePrice: modalData.isSite,
          newPrice: numPrice,
          reason: inputReason || (modalData.isSite ? 'Ajuste manual site' : `Ajuste manual ${modalData.externalId}`)
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao atualizar preço')

      setFeedback({
        type: 'success',
        text: `Preço atualizado com sucesso para ${formatBRL(numPrice)}! Os demais canais e anúncios foram rigorosamente preservados.`
      })

      setTimeout(() => {
        setModalData(null)
        router.refresh()
      }, 1400)
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Falha ao salvar' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Banner Informativo de Arquitetura */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563eb]" />
              <h4 className="text-sm font-extrabold text-[#0f172a]">
                Gestão Multicanal: 1 Produto Central → Ofertas Independentes
              </h4>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed max-w-2xl">
              Este produto físico central compartilha seu estoque físico (<strong className="text-[#0f172a]">{product.stock.physical} unidades</strong>) entre o Site Próprio, Catálogo Oficial do Mercado Livre e demais marketplaces. Cada oferta possui seu próprio preço independente.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-center">
              <div className="text-[10px] text-[#64748b] uppercase font-bold">Estoque Central</div>
              <div className="text-sm font-black text-[#0f172a]">{product.stock.physical} un</div>
            </div>
            <div className="px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-center">
              <div className="text-[10px] text-[#64748b] uppercase font-bold">Total Ofertas</div>
              <div className="text-sm font-black text-[#2563eb]">{listings.length + (product.site_published ? 1 : 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Canal 1: Loja Própria TEKNIX (SITE) */}
      <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SITE
            </div>
            <div>
              <div className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                Loja Oficial TEKNIX (Site Próprio)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                  Publicado
                </span>
              </div>
              <div className="text-xs text-[#64748b]">Canal Direto D2C • teknixbrasil.com.br</div>
            </div>
          </div>

          <button
            onClick={() => openPriceModal({
              title: product.name,
              currentPrice: product.site_price || product.pricing.current_price,
              isSite: true,
              channelName: 'Loja Oficial TEKNIX (SITE)',
              externalId: product.sku
            })}
            className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" /> Ajustar Preço no Site
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-[11px] font-medium text-[#64748b]">Preço no Site</div>
            <div className="text-base font-black text-[#0f172a] mt-0.5">
              {formatBRL(product.site_price || product.pricing.current_price)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#64748b]">Estoque Compartilhado</div>
            <div className="text-base font-bold text-[#16a34a] mt-0.5">{product.stock.physical} un</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#64748b]">Canal Isolado</div>
            <div className="text-xs text-[#64748b] mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" /> Não afeta Marketplaces
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#64748b]">Checkout</div>
            <div className="text-xs font-bold text-[#2563eb] mt-1">Teknix Play Ativo</div>
          </div>
        </div>
      </div>

      {/* Canal 2+: Marketplaces e suas ofertas */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#64748b]" /> Ofertas & Publicações nos Marketplaces ({listings.length})
            </h3>
            <p className="text-xs text-[#64748b]">
              Venda no Catálogo Oficial (Buy Box) ou crie anúncios tradicionais com preços independentes
            </p>
          </div>

          <button
            onClick={() => {
              setPublishModalOpen(true)
              setOfferPrice(String(product.pricing.current_price || product.site_price || ''))
              setCustomTitle(product.name)
              triggerCatalogSearch()
            }}
            className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Publicar Nova Oferta / Canal
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {listings.map(l => (
            <div
              key={l.id || l.listing_id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                l.is_best_seller ? 'border-[#f59e0b] ring-1 ring-[#f59e0b]/30' : 'border-[#e6e6e6]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <MarketplaceLogo name={l.channel_name || 'Mercado Livre'} className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#0f172a]">{l.title || product.name}</span>
                      {l.is_best_seller && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                          <Award className="w-3 h-3 text-[#f59e0b]" /> MELHOR ANÚNCIO
                        </span>
                      )}
                      {(l as any).catalog_product_id && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
                          <Sparkles className="w-3 h-3 text-[#2563eb]" /> Catálogo Oficial
                        </span>
                      )}
                      <MarketplaceStatusBadge status={l.status.toUpperCase()} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748b] mt-1 font-mono">
                      <span>ID: <strong className="text-[#0f172a]">{l.listing_id || l.external_id}</strong></span>
                      {(l as any).catalog_product_id && (
                        <>
                          <span className="text-[#cbd5e1]">•</span>
                          <span>Catalog ID: <strong className="text-[#2563eb]">{(l as any).catalog_product_id}</strong></span>
                        </>
                      )}
                      {l.account_name && (
                        <>
                          <span className="text-[#cbd5e1]">•</span>
                          <span className="font-sans">Conta: <strong className="text-[#0f172a]">{l.account_name}</strong></span>
                        </>
                      )}
                      {l.permalink && (
                        <>
                          <span className="text-[#cbd5e1]">•</span>
                          <a
                            href={l.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-[#2563eb] hover:underline inline-flex items-center gap-1"
                          >
                            Ver anúncio oficial <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => openPriceModal({
                      title: l.title || product.name,
                      currentPrice: l.price,
                      listingId: l.id,
                      channelName: l.channel_name || 'Mercado Livre',
                      externalId: l.listing_id || l.external_id
                    })}
                    className="px-3.5 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#64748b]" /> Editar Preço
                  </button>
                </div>
              </div>

              {/* Métricas da Oferta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-[11px] font-medium text-[#64748b]">Preço Desta Oferta</div>
                  <div className="text-base font-black text-[#0f172a] mt-0.5">
                    {formatBRL(l.price)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#64748b]">Total Vendido (Oferta)</div>
                  <div className="text-base font-bold text-[#0f172a] mt-0.5">
                    {l.sold_quantity} un
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#64748b]">Faturamento Acumulado</div>
                  <div className="text-base font-bold text-[#16a34a] mt-0.5">
                    {formatBRL(l.total_revenue || (l.sold_quantity * l.price))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#64748b]">Última Sincronização</div>
                  <div className="text-xs text-[#64748b] mt-1 font-mono">
                    {new Date(l.last_sync).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal 1: Nova Oferta / Publicar no Canal (com Buy Box do Catálogo) */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#2563eb] tracking-wider">
                  Publicação Multicanal TEKNIX
                </span>
                <h3 className="text-lg font-extrabold text-[#0f172a] mt-0.5">
                  Publicar Nova Oferta no Canal
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Produto Central: <strong>{product.name}</strong> • Estoque: <strong>{product.stock.physical} un</strong>
                </p>
              </div>
              <button
                onClick={() => setPublishModalOpen(false)}
                className="text-[#94a3b8] hover:text-[#0f172a] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Seleção do Canal */}
              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-2">Selecione o Canal de Destino</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChannel('mercadolivre')
                      triggerCatalogSearch()
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedChannel === 'mercadolivre'
                        ? 'border-[#0f172a] bg-[#f8fafc] ring-2 ring-[#0f172a]/20'
                        : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MarketplaceLogo name="Mercado Livre" className="w-4 h-4" />
                      <span className="text-xs font-bold text-[#0f172a]">Mercado Livre</span>
                    </div>
                    <span className="text-[10px] text-[#64748b]">Catálogo Buy Box</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('shopee')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedChannel === 'shopee'
                        ? 'border-[#0f172a] bg-[#f8fafc] ring-2 ring-[#0f172a]/20'
                        : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MarketplaceLogo name="Shopee" className="w-4 h-4" />
                      <span className="text-xs font-bold text-[#0f172a]">Shopee</span>
                    </div>
                    <span className="text-[10px] text-[#64748b]">Anúncio Shopee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('magalu')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedChannel === 'magalu'
                        ? 'border-[#0f172a] bg-[#f8fafc] ring-2 ring-[#0f172a]/20'
                        : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MarketplaceLogo name="Magazine Luiza" className="w-4 h-4" />
                      <span className="text-xs font-bold text-[#0f172a]">Magalu</span>
                    </div>
                    <span className="text-[10px] text-[#64748b]">Open API SKU</span>
                  </button>
                </div>
              </div>

              {/* Se for Mercado Livre: Escolha de Modo (Catálogo vs Tradicional) */}
              {selectedChannel === 'mercadolivre' && (
                <div className="space-y-3 pt-2 border-t border-[#f1f5f9]">
                  <label className="block text-xs font-bold text-[#0f172a]">Modo de Publicação no Mercado Livre</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div
                      onClick={() => setMlMode('CATALOG')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        mlMode === 'CATALOG'
                          ? 'border-[#2563eb] bg-[#eff6ff] ring-2 ring-[#2563eb]/20'
                          : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mlMode"
                          checked={mlMode === 'CATALOG'}
                          onChange={() => setMlMode('CATALOG')}
                          className="text-[#2563eb]"
                        />
                        <span className="text-xs font-bold text-[#0f172a]">Vender no Catálogo (Buy Box)</span>
                      </div>
                      <p className="text-[11px] text-[#64748b] mt-1.5 leading-tight">
                        Aproveite a ficha oficial existente com tráfego e avaliações para disputar a primeira opção de compra.
                      </p>
                    </div>

                    <div
                      onClick={() => setMlMode('TRADITIONAL')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        mlMode === 'TRADITIONAL'
                          ? 'border-[#0f172a] bg-[#f8fafc] ring-2 ring-[#0f172a]/20'
                          : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mlMode"
                          checked={mlMode === 'TRADITIONAL'}
                          onChange={() => setMlMode('TRADITIONAL')}
                          className="text-[#0f172a]"
                        />
                        <span className="text-xs font-bold text-[#0f172a]">Criar Anúncio Tradicional</span>
                      </div>
                      <p className="text-[11px] text-[#64748b] mt-1.5 leading-tight">
                        Publicação independente com fotos, ficha e título próprios.
                      </p>
                    </div>
                  </div>

                  {/* Se Catálogo: Resultados da busca automática */}
                  {mlMode === 'CATALOG' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-[#2563eb]" /> Produto Encontrado no Catálogo do ML:
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerCatalogSearch()}
                          className="text-[11px] text-[#2563eb] hover:underline font-bold"
                        >
                          {catalogSearching ? 'Buscando...' : 'Atualizar Busca'}
                        </button>
                      </div>

                      {catalogCandidates.length > 0 ? (
                        <div className="space-y-2">
                          {catalogCandidates.map(c => (
                            <div
                              key={c.catalog_product_id}
                              onClick={() => setSelectedCatalogId(c.catalog_product_id)}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                selectedCatalogId === c.catalog_product_id
                                  ? 'border-[#2563eb] bg-[#eff6ff]'
                                  : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden">
                                  {c.thumbnail ? (
                                    <img src={c.thumbnail} alt="" className="w-full h-full object-contain p-0.5" />
                                  ) : (
                                    <Package className="w-4 h-4 text-[#94a3b8]" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#0f172a] truncate">{c.title}</div>
                                  <div className="text-[10px] text-[#64748b] font-mono">
                                    Catalog ID: <strong>{c.catalog_product_id}</strong> • Confiança: {c.confidence}%
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#2563eb] border border-[#bfdbfe] shrink-0">
                                {selectedCatalogId === c.catalog_product_id ? 'Selecionado' : 'Usar Este'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-xl text-center text-xs text-[#64748b]">
                          {catalogSearching ? 'Pesquisando produtos oficiais no catálogo...' : 'Nenhum item automático retornado. Você pode digitar o Catalog ID abaixo.'}
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-medium text-[#64748b] mb-1">
                          Catalog Product ID (MLB...)
                        </label>
                        <input
                          type="text"
                          value={selectedCatalogId}
                          onChange={e => setSelectedCatalogId(e.target.value)}
                          placeholder="Ex: MLB28472948"
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Se Tradicional: Título Customizado */}
                  {mlMode === 'TRADITIONAL' && (
                    <div>
                      <label className="block text-xs font-bold text-[#0f172a] mb-1">Título do Anúncio Tradicional</label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={e => setCustomTitle(e.target.value)}
                        placeholder="Ex: Hollyland Lark M2 Microfone Duplo Sem Fio"
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Se for Shopee ou Magalu: Informações do Canal */}
              {selectedChannel !== 'mercadolivre' && (
                <div className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-1">
                  <div className="text-xs font-bold text-[#0f172a]">
                    Modo: {selectedChannel === 'shopee' ? 'Publicação de Produto/Anúncio Shopee' : 'Publicação de Produto/SKU Magalu'}
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    Esta oferta será criada e associada ao produto central, debitando do estoque físico único ({product.stock.physical} un).
                  </p>
                </div>
              )}

              {/* Preço e Tipo de Oferta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f1f5f9]">
                <div>
                  <label className="block text-xs font-bold text-[#0f172a] mb-1">Preço da Oferta (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748b]">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={offerPrice}
                      onChange={e => setOfferPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                    />
                  </div>
                  <span className="text-[10px] text-[#64748b] mt-0.5 block">Preço isolado deste canal</span>
                </div>

                {selectedChannel === 'mercadolivre' && (
                  <div>
                    <label className="block text-xs font-bold text-[#0f172a] mb-1">Tipo de Anúncio no ML</label>
                    <select
                      value={listingType}
                      onChange={e => setListingType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a] cursor-pointer"
                    >
                      <option value="gold_special">Clássico (gold_special)</option>
                      <option value="gold_pro">Premium - 10x sem juros (gold_pro)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Callout de Garantia de Isolamento */}
              <div className="p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#1e40af] leading-relaxed">
                  <strong>Regra Permanente TEKNIX:</strong> O estoque físico central único ({product.stock.physical} un) será debitado a cada venda. O preço desta oferta é 100% independente e não alterará o SITE próprio nem os demais anúncios.
                </p>
              </div>

              {publishFeedback && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  publishFeedback.type === 'success'
                    ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                    : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
                }`}>
                  {publishFeedback.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  disabled={publishLoading}
                  className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePublishOffer}
                  disabled={publishLoading}
                  className="px-5 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {publishLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar e Criar Oferta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Alteração de Preço com Regra de Isolamento */}
      {modalData?.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#2563eb] tracking-wider">
                  Isolamento de Preço • {modalData.channelName}
                </span>
                <h3 className="text-base font-extrabold text-[#0f172a] mt-0.5">
                  Ajustar Preço Individual
                </h3>
                <p className="text-xs font-mono text-[#64748b]">Anúncio: {modalData.externalId}</p>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="text-[#94a3b8] hover:text-[#0f172a] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5">
                <div className="text-xs text-[#64748b]">Preço atual:</div>
                <div className="text-lg font-black text-[#0f172a]">
                  {formatBRL(modalData.currentPrice)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-1.5">
                  Novo Preço (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#64748b]">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputPrice}
                    onChange={e => setInputPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2.5 text-base font-bold bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                  Motivo da Alteração (Opcional)
                </label>
                <input
                  type="text"
                  value={inputReason}
                  onChange={e => setInputReason(e.target.value)}
                  placeholder="Ex: Campanha de preço agressivo, teste de margem..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                />
              </div>

              {/* Callout de Garantia de Isolamento */}
              <div className="p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#1e40af] leading-relaxed">
                  <strong>Regra de Isolamento:</strong> Esta alteração será aplicada <em>somente</em> a este anúncio. Os outros anúncios do Mercado Livre e o preço da loja própria TEKNIX não sofrerão nenhuma alteração.
                </p>
              </div>

              {feedback && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  feedback.type === 'success'
                    ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                    : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
                }`}>
                  {feedback.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalData(null)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePrice}
                  disabled={loading}
                  className="px-5 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar Novo Preço
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
    <div className="product-detail-page">
      <div className="mb-4">
        <Link href="/operacao" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Operação / Produtos
        </Link>
      </div>

      {/* Main Product Hero Card */}
      <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 mb-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start gap-5">
          {/* Photos Gallery */}
          <div className="w-full lg:w-24 flex flex-col items-center gap-2 shrink-0">
            {/* Big Preview Frame */}
            <div className="relative w-full h-72 lg:h-24 rounded-xl bg-[#fafafa] border border-[#e6e6e6] overflow-hidden flex items-center justify-center p-2 shadow-inner group">
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
                  <span className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">Estoque Físico Central</span>
                  <div className={`text-xl font-black mt-0.5 ${product.stock.physical > 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                    {product.stock.physical} unidades
                  </div>
                  <div className="text-[11px] text-[#64748b] mt-0.5">Disponível: <strong>{product.stock.available} un</strong></div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">Preço Loja Oficial (Site)</span>
                  <div className="text-xl font-black text-[#0f172a] mt-0.5">
                    {formatBRL(product.site_price || product.pricing.current_price || product.costs.real || 0)}
                  </div>
                  <div className="text-[11px] text-[#2563eb] mt-0.5 font-medium">Canal D2C Direto</div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">Anúncios & Marketplaces</span>
                  <div className="text-xl font-black text-[#0f172a] mt-0.5">
                    {(product.channel_listings?.length || product.marketplaces.length) + (product.site_published ? 1 : 0)} canais
                  </div>
                  <div className="text-[11px] text-[#16a34a] mt-0.5 font-medium">Preços Independentes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <StatBox label="Vendas" value={String(product.summary.total_sales)} />
        <StatBox label="Estoque Central" value={`${product.stock.physical} un`} />
        <StatBox label="Faturamento" value={formatBRL(product.summary.total_revenue)} />
        <StatBox label="Lucro" value={formatBRL(product.summary.total_profit)} />
        <StatBox label="Margem" value={`${product.summary.avg_margin}%`} />
        <StatBox label="Pedidos" value={String(product.summary.total_orders)} />
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral"><Package className="w-3.5 h-3.5 mr-1 inline" /> Visão geral</TabsTrigger>
          <TabsTrigger value="marketplaces"><Store className="w-3.5 h-3.5 mr-1 inline" /> Multicanal & Anúncios</TabsTrigger>
          <TabsTrigger value="vendas"><TrendingUp className="w-3.5 h-3.5 mr-1 inline" /> Vendas</TabsTrigger>
          <TabsTrigger value="estoque"><ShoppingCart className="w-3.5 h-3.5 mr-1 inline" /> Estoque</TabsTrigger>
          <TabsTrigger value="compras"><Store className="w-3.5 h-3.5 mr-1 inline" /> Compras</TabsTrigger>
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
