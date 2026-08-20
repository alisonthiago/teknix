'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreHorizontal, Package, TrendingUp, ShoppingCart, Store, Clock, FileText } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ProductDetail } from '@/lib/detail-types'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
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
    <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${styles[status] || styles.ACTIVE}`}>
      {labels[status] || status}
    </span>
  )
}

function MarketplaceStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${status === 'ACTIVE' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#999]'}`}>
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

function VisaoGeralTab({ product }: { product: ProductDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Informações do produto</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow label="Nome" value={product.name} bold />
            <InfoRow label="SKU" value={product.sku} mono />
            <InfoRow label="Marca" value={product.brand} />
            <InfoRow label="Modelo" value={product.model} />
            <InfoRow label="EAN/GTIN" value={product.ean} mono />
            <InfoRow label="Categoria" value={product.category} />
            <InfoRow label="Fornecedor" value={product.supplier.name} />
            <InfoRow label="Status" value="" />
            <InfoRow label="Data de cadastro" value={product.created_at} />
            <InfoRow label="Última atualização" value={product.updated_at} />
          </div>
          <div className="mt-3 pt-3 border-t border-[#f5f5f5]">
            <p className="text-[12px] text-[#999]">{product.description}</p>
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
            <button className="text-[11px] text-[#3483fa] hover:underline font-medium">Ajustar preço</button>
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
            <Link href={`/fornecedores/${product.supplier.id}`} className="text-[11px] text-[#3483fa] hover:underline font-medium">Ver fornecedor</Link>
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
                    <div className="text-[12px] font-medium text-[#333]">{mp.name}</div>
                    <div className="text-[10px] font-mono text-[#999]">{mp.listing_id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-[#333]">{formatBRL(mp.price)}</div>
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
                <span className="text-[10px] text-[#999] w-8">{d.period}</span>
                <div className="flex-1 h-1.5 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#3483fa] rounded-full" style={{ width: `${(d.units / 5) * 100}%` }} />
                </div>
                <span className="text-[10px] text-[#666] w-6 text-right">{d.units}</span>
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

      <div className="bg-white border border-[#e6e6e6] rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e6e6e6] flex items-center justify-between">
          <SectionTitle>Últimas vendas</SectionTitle>
          {selectedAccount !== 'ALL' && <span className="text-[10px] bg-[#f5f5f5] px-2 py-1 rounded text-[#666]">Filtrado: {selectedAccount}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#f5f5f5]">
                <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Pedido</th>
                <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Marketplace</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Qtd</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Preço</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Faturamento</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Lucro</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Margem</th>
                <th className="text-center py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Status</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee]">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[#999]">{sale.order_id}</td>
                  <td className="py-2.5 px-4 text-[#333]">
                    <div className="font-medium text-[11px]">{sale.marketplace}</div>
                    <div className="text-[9px] text-[#999]">{sale.account_name}</div>
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#999]">{sale.quantity}</td>
                  <td className="py-2.5 px-4 text-right text-[#999]">{formatBRL(sale.price)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-[#333]">{formatBRL(sale.revenue)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-[#333]">{formatBRL(sale.profit)}</td>
                  <td className="py-2.5 px-4 text-right text-[#999]">{sale.margin}%</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${sale.status === 'Entregue' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f0f7ff] text-[#3483fa]'}`}>{sale.status}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#999]">{sale.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EstoqueTab({ product }: { product: ProductDetail }) {
  return (
    <div className="space-y-4">
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
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#f5f5f5]">
                  <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Marketplace</th>
                  <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Conta</th>
                  <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Estoque</th>
                  <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Preço</th>
                  <th className="text-center py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Status</th>
                  <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Último Sync</th>
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
                    <td className="py-2.5 px-4 text-right text-[10px] text-[#ccc]">{new Date(mp.last_sync).toLocaleDateString('pt-BR')}</td>
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
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#f5f5f5]">
                <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Data</th>
                <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Tipo</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Quantidade</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Saldo</th>
                <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Pedido</th>
                <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee]">
              {product.stock_movements.map(m => (
                <tr key={m.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="py-2.5 px-4 text-[#999]">{m.date}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${
                      m.type === 'COMPRA' ? 'bg-[#f0fff4] text-[#38a169]' :
                      m.type === 'VENDA' ? 'bg-[#f0f7ff] text-[#3483fa]' :
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
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#f5f5f5]">
                <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Pedido</th>
                <th className="text-left py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Fornecedor</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Qtd</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Custo Unit.</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Total</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Data</th>
                <th className="text-center py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Status</th>
                <th className="text-right py-2 px-4 text-[10px] font-medium text-[#999] uppercase">Nota Interna</th>
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
                    <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">{p.status}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {p.purchase_id && (
                      <Link href={`/purchases/${p.purchase_id}/nota`} className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#f5f5f5] text-[#666] hover:bg-[#3483fa] hover:text-white transition-colors" title="Ver Nota Interna">
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
                  <div className="text-[10px] font-mono text-[#999]">ID: {mp.listing_id}</div>
                </div>
              </div>
              <MarketplaceStatusBadge status={mp.status} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-[#f5f5f5]">
              <div>
                <div className="text-[10px] text-[#999]">Preço</div>
                <div className="text-[13px] font-medium text-[#333]">{formatBRL(mp.price)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#999]">Estoque</div>
                <div className="text-[13px] font-medium text-[#333]">{mp.stock}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#999]">Última sincronização</div>
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
            <div className="w-1.5 h-1.5 rounded-full bg-[#3483fa] mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#333]">{h.action}</span>
                <span className="text-[10px] text-[#ccc]">•</span>
                <span className="text-[10px] text-[#999]">{h.user}</span>
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

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const images = product.images && product.images.length > 0 ? product.images : [product.image]
  const [selectedImage, setSelectedImage] = useState(images[0])

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
        <Link href="/operacao" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Operação / Produtos
        </Link>
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 mb-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Photos Gallery */}
          <div className="w-full md:w-64 flex flex-col items-center gap-3 shrink-0">
            <div className="w-full h-56 rounded-xl bg-[#fafafa] border border-[#e6e6e6] overflow-hidden flex items-center justify-center p-2 shadow-xs">
              {selectedImage && selectedImage !== '/placeholder-product.png' ? (
                <img src={selectedImage} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-12 h-12 text-[#ccc]" />
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto w-full py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-12 h-12 rounded-lg border overflow-hidden p-1 shrink-0 transition-all cursor-pointer ${
                      selectedImage === img ? 'border-[#3483fa] ring-2 ring-[#3483fa]/30 shadow-xs' : 'border-[#e6e6e6] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-[18px] font-bold text-[#333] leading-snug">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[12px] font-medium text-[#666]">{product.brand}</span>
                  <span className="text-[10px] text-[#ccc]">•</span>
                  <span className="text-[11px] font-mono text-[#999]">SKU {product.sku}</span>
                  <span className="text-[10px] text-[#ccc]">•</span>
                  <StatusBadge status={product.status} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => router.push(`/purchases/new?product=${product.id}`)} className="px-3 py-1.5 bg-[#f0fff4] text-[#38a169] border border-[#38a169]/20 text-[11px] font-medium rounded-md hover:bg-[#dcfce7] transition-colors flex items-center gap-1 cursor-pointer">
                  <ShoppingCart className="w-3.5 h-3.5" /> Comprar
                </button>
                <button onClick={() => router.push(`/produtos/${product.id}/editar`)} className="px-3 py-1.5 bg-[#3483fa] text-white text-[11px] font-medium rounded-md hover:bg-[#2968c8] transition-colors cursor-pointer">
                  Editar produto
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-[#e6e6e6] text-[#666] hover:bg-[#f5f5f5] transition-colors focus:outline-none cursor-pointer">
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                      className="text-[#e74c3c] focus:text-[#e74c3c] focus:bg-[#fff5f5] cursor-pointer"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Excluir produto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
    </div>
  )
}
