'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TeknixLogo } from '@/components/TeknixLogo';
import { Star, Grid, Copy, EyeOff, Check, Calendar, ArrowLeft, MoreHorizontal, Trash2, Package, TrendingUp, ShoppingCart, Store, Clock, FileText, Share2, Pencil, CheckCircle2, ExternalLink, ShieldAlert, Award, RefreshCw, DollarSign, Layers, Globe, Plus, Search, Sparkles, Tag, Sliders, Building2, FolderTree, Barcode, User } from 'lucide-react'
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
import { PaginationBar, usePagination } from '@/components/ui/pagination'
import { summarizeProductName } from '@/lib/utils'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SaleStatusBadge({ status }: { status: string }) {
  const s = String(status || '').toUpperCase()
  if (s.includes('CANCEL')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
        Cancelado
      </span>
    )
  }
  if (s.includes('IMPRESSA') || s.includes('PRINTED')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
        Impressa
      </span>
    )
  }
  if (s.includes('DELIVER') || s.includes('ENTREG')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
        Entregue
      </span>
    )
  }
  if (s.includes('ENVIA') || s.includes('SHIP')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
        Enviado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]">
      {status || 'Concluído'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status || 'ACTIVE').toUpperCase()
  const styles: Record<string, { bg: string; dot: string; text: string }> = {
    ACTIVE: { bg: 'bg-[#ecfdf5] border-[#bbf7d0] text-[#16a34a]', dot: 'bg-[#16a34a]', text: 'Ativo' },
    INACTIVE: { bg: 'bg-[#f3f4f6] border-[#e5e7eb] text-[#6b7280]', dot: 'bg-[#9ca3af]', text: 'Inativo' },
    OUT_OF_STOCK: { bg: 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]', dot: 'bg-[#dc2626]', text: 'Sem Estoque' },
    LOW_STOCK: { bg: 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]', dot: 'bg-[#d97706]', text: 'Estoque Baixo' },
    PAUSED: { bg: 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]', dot: 'bg-[#d97706]', text: 'Pausado' },
  }
  const cfg = styles[s] || styles.ACTIVE
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.text}
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

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  if (!text || text === '—') return null
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] text-[11px] font-semibold text-[#475569] hover:text-[#0f172a] cursor-pointer transition-colors shadow-2xs"
      title={`Copiar ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-[#16a34a]" />
          <span className="text-[#16a34a] font-bold">Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 text-[#94a3b8]" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

function AttributeCard({
  icon: Icon,
  label,
  value,
  emptyLabel = '—',
  mono = false,
  copyable = false,
  link,
  badge
}: {
  icon?: any
  label: string
  value?: string | null
  emptyLabel?: string
  mono?: boolean
  copyable?: boolean
  link?: string
  badge?: string
}) {
  const isPresent = Boolean(value && value !== '—' && value.trim() !== '')
  const displayVal = isPresent ? value : emptyLabel

  return (
    <div className="bg-[#fafafa] hover:bg-[#f8fafc] transition-colors border border-[#e5e7eb] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[72px] group">
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1.5 truncate" title={label}>
          {Icon && <Icon className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />}
          {label}
        </span>
        {copyable && isPresent && (
          <CopyButton text={value!} label="Copiar" />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto">
        {link && isPresent ? (
          <Link href={link} className="text-[13.5px] font-bold text-[#0071e3] hover:underline truncate">
            {displayVal}
          </Link>
        ) : badge ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-[#cbd5e1] text-xs font-bold text-[#111111] shadow-2xs">
            {displayVal}
          </span>
        ) : (
          <span className={`text-[13.5px] truncate ${
            !isPresent 
              ? 'text-[#94a3b8] italic text-xs font-normal' 
              : mono 
              ? 'font-mono font-bold text-[#111111]' 
              : 'font-semibold text-[#111111]'
          }`} title={isPresent ? String(value) : undefined}>
            {displayVal}
          </span>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-[#111111] mb-5 pb-2.5 border-b border-[#f0f0f0]">{children}</h3>
}

function InfoRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 sm:py-3.5 border-b border-[#f0f0f0] last:border-0 gap-4">
      <span className="text-[13px] text-[#666666] font-medium">{label}</span>
      <span className={`text-[13.5px] text-right ${mono ? 'font-mono' : ''} ${bold ? 'font-bold text-[#111111]' : 'text-[#222222]'}`}>{value}</span>
    </div>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-[#cbd5e1] transition-all flex flex-col justify-between min-w-0 overflow-hidden">
      <div className="text-[11.5px] font-semibold text-[#888888] uppercase tracking-wider mb-2 truncate" title={label}>{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight truncate" title={value}>{value}</div>
      {sub && <div className="text-xs text-[#999999] mt-1.5 truncate">{sub}</div>}
    </div>
  )
}

function VisaoGeralTab({ product }: { product: ProductDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 shadow-xs">
          {/* Header com Ícone e Badge */}
          <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-[#f0f0f0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F7F7F7] border border-[#e5e7eb] flex items-center justify-center text-[#111111] shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#111111] leading-tight">
                  Especificações Técnicas & Atributos
                </h3>
                <p className="text-[11.5px] text-[#64748b]">Metadados, identificadores e dados de catálogo</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F7F7F7] border border-[#e5e7eb] text-xs font-semibold text-[#475569]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" /> Sincronizado
            </span>
          </div>

          {/* Nome do Produto em Banner de Destaque Full-Width */}
          <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-3 sm:p-3.5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">
                Nome do Produto
              </span>
              <p className="text-sm font-bold text-[#111111] leading-snug">
                {summarizeProductName(product.name, 36)}
              </p>
              {product.name !== summarizeProductName(product.name, 36) && (
                <p className="text-xs text-[#71717a] mt-0.5 line-clamp-1" title={product.name}>
                  Título no Marketplace: <span className="font-normal text-[#52525b]">{product.name}</span>
                </p>
              )}
            </div>
            <div className="shrink-0 self-end sm:self-auto">
              <CopyButton text={product.name} label="Copiar Nome" />
            </div>
          </div>

          {/* Grade de Atributos Perfeitamente Alinhados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AttributeCard
              icon={Tag}
              label="SKU / Código"
              value={product.sku}
              mono
              copyable
            />
            <AttributeCard
              icon={Barcode}
              label="Código de Barras (EAN)"
              value={product.ean}
              mono
              copyable={Boolean(product.ean && product.ean !== '—')}
              emptyLabel="Não cadastrado"
            />
            <AttributeCard
              icon={Award}
              label="Marca"
              value={product.brand || 'TEKNIX'}
              badge={product.brand || 'TEKNIX'}
            />
            <AttributeCard
              icon={Layers}
              label="Modelo"
              value={product.model}
              emptyLabel="Padrão / Não informado"
            />
            <AttributeCard
              icon={FolderTree}
              label="Categoria Mercado Livre"
              value={product.category || 'Geral'}
            />
            <AttributeCard
              icon={Building2}
              label="Fornecedor / Origem"
              value={product.supplier?.name}
              link={product.supplier?.id ? `/fornecedores/${product.supplier.id}` : undefined}
              emptyLabel="Próprio / Não vinculado"
            />
            <AttributeCard
              icon={Calendar}
              label="Data de Sincronização"
              value={product.created_at}
            />
            <AttributeCard
              icon={Globe}
              label="Loja TEKNIX (SITE)"
              value={product.site_published ? 'Publicado' : 'Rascunho'}
            />
            <AttributeCard
              icon={Package}
              label="Localização Estoque"
              value={product.stock?.location || 'Padrão / Principal'}
            />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 sm:p-7 shadow-xs">
          <SectionTitle>Descrição do Produto</SectionTitle>
          <div className="mt-2 text-xs sm:text-[13px] text-[#333333] leading-relaxed whitespace-pre-line bg-[#fafafa] p-4 rounded-xl border border-[#e6e6e6] max-h-80 overflow-y-auto font-sans">
            {product.description ? product.description : (
              <span className="text-[#999999] italic">Nenhuma descrição cadastrada para este produto.</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 sm:p-7 shadow-xs">
          <SectionTitle>Custo</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            <InfoRow label="Custo de compra" value={formatBRL(product.costs.purchase)} />
            <InfoRow label="Frete de compra" value={formatBRL(product.costs.freight)} />
            <InfoRow label="Embalagem" value={formatBRL(product.costs.packaging)} />
            <InfoRow label="Outros custos" value={formatBRL(product.costs.other)} />
          </div>
          <div className="mt-4 pt-3 border-t border-[#e6e6e6]">
            <InfoRow label="Custo real" value={formatBRL(product.costs.real)} bold />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 sm:p-7 shadow-xs">
          <SectionTitle>Precificação</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            <InfoRow label="Preço atual" value={formatBRL(product.pricing.current_price)} bold />
            <InfoRow label="Preço sugerido" value={formatBRL(product.pricing.suggested_price)} />
            <InfoRow label="Preço mínimo" value={formatBRL(product.pricing.minimum_price)} />
            <InfoRow label="Lucro" value={formatBRL(product.pricing.profit)} />
            <InfoRow label="Margem" value={`${Number(product.pricing.margin || 0).toFixed(1)}%`} />
          </div>
          <div className="mt-4 pt-2">
            <button className="text-xs text-[#1f2328] hover:underline font-bold cursor-pointer">Ajustar preço</button>
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 sm:p-7 shadow-xs">
          <SectionTitle>Estoque</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatBox label="Físico" value={String(product.stock.physical)} />
            <StatBox label="Reservado" value={String(product.stock.reserved)} />
            <StatBox label="Disponível" value={String(product.stock.available)} />
            <StatBox label="Mínimo" value={String(product.stock.minimum)} />
            <StatBox label="Localização" value={product.stock.location} />
            <StatBox label="Valor" value={formatBRL(product.stock.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 sm:p-7 shadow-xs">
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
          <div className="mt-4 pt-2">
            <Link href={`/fornecedores/${product.supplier.id}`} className="text-xs text-[#1f2328] hover:underline font-bold">Ver fornecedor</Link>
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 sm:p-7 shadow-xs">
          <SectionTitle>Marketplaces</SectionTitle>
          <div className="space-y-3">
            {product.marketplaces.map(mp => (
              <div key={mp.listing_id} className="flex items-center justify-between py-2.5 border-b border-[#f0f0f0] last:border-0">
                <div className="flex items-center gap-2.5">
                  <MarketplaceLogo name={mp.name} className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-semibold text-[#111]">{mp.name}</div>
                    <div className="text-xs font-mono text-[#999]">{mp.listing_id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#111]">{formatBRL(mp.price)}</div>
                  <MarketplaceStatusBadge status={mp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 sm:p-7 shadow-xs">
          <SectionTitle>Vendas por período</SectionTitle>
          <div className="space-y-2.5">
            {product.sales_chart.slice(-7).map(d => (
              <div key={d.period} className="flex items-center gap-2.5">
                <span className="text-xs text-[#999] w-10 font-mono">{d.period}</span>
                <div className="flex-1 h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1f2328] rounded-full" style={{ width: `${(d.units / 5) * 100}%` }} />
                </div>
                <span className="text-xs text-[#111] font-bold w-6 text-right">{d.units}</span>
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

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedSales,
    totalItems,
  } = usePagination(filteredSales, 5)

  const filteredRevenue = filteredSales.reduce((acc, s) => acc + s.revenue, 0)
  const filteredProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0)
  const filteredMargin = filteredRevenue > 0 ? (filteredProfit / filteredRevenue) * 100 : 0
  const filteredTicket = filteredSales.length > 0 ? filteredRevenue / filteredSales.length : 0
  const filteredOrders = Array.from(new Set(filteredSales.map(s => s.order_id))).length
  const filteredQuantity = filteredSales.reduce((acc, s) => acc + s.quantity, 0)

  return (
    <div className="space-y-6">
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setSelectedAccount('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${selectedAccount === 'ALL' ? 'bg-[#1f2328] text-white shadow-xs' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#e6e6e6]'}`}
          >
            Todas as Contas
          </button>
          {accounts.map(acc => (
            <button 
              key={acc}
              onClick={() => setSelectedAccount(acc)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${selectedAccount === acc ? 'bg-[#1f2328] text-white shadow-xs' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#e6e6e6]'}`}
            >
              {acc}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <StatBox label="Total vendido" value={`${filteredQuantity} un`} />
        <StatBox label="Faturamento" value={formatBRL(filteredRevenue)} />
        <StatBox label="Lucro" value={formatBRL(filteredProfit)} />
        <StatBox label="Margem média" value={`${filteredMargin.toFixed(1)}%`} />
        <StatBox label="Ticket médio" value={formatBRL(filteredTicket)} />
        <StatBox label="Total pedidos" value={String(filteredOrders)} />
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fafafa]/50">
          <div>
            <h3 className="text-sm font-bold text-[#111111] leading-tight">Histórico de Vendas & Compradores</h3>
            <p className="text-[11px] text-[#888888] leading-tight mt-0.5">
              {filteredSales.length} {filteredSales.length === 1 ? 'venda registrada' : 'vendas registradas'}
            </p>
          </div>
          {selectedAccount !== 'ALL' && (
            <span className="text-xs bg-white px-3 py-1 rounded-xl text-[#444] font-semibold border border-[#e6e6e6] shadow-2xs self-start sm:self-auto">
              Filtrado: {selectedAccount}
            </span>
          )}
        </div>

        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-[#999] text-xs">
            Nenhuma venda registrada para este produto até o momento.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fafafa] text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
                    <th className="py-3 px-5">Pedido & Data</th>
                    <th className="py-3 px-5">Cliente</th>
                    <th className="py-3 px-5">Canal</th>
                    <th className="py-3 px-5 text-right">Total</th>
                    <th className="py-3 px-5 text-right">Lucro & Margem</th>
                    <th className="py-3 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-xs">
                  {paginatedSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-[#f8fafc] transition-colors">
                      {/* Pedido & Data */}
                      <td className="py-3.5 px-5">
                        <Link 
                          href={`/pedidos/${sale.order_uuid || sale.order_id}`} 
                          className="font-mono text-xs font-bold text-[#111111] hover:text-[#0071e3] hover:underline block truncate max-w-[180px]"
                          title={`#${sale.order_id}`}
                        >
                          #{sale.order_id}
                        </Link>
                        <span className="text-[11px] text-[#888888] font-mono block mt-0.5">
                          {sale.date}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 min-w-0 max-w-[160px]">
                          <User className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                          <span className="font-semibold text-[#111111] truncate" title={sale.customer_name}>
                            {sale.customer_name || 'Cliente'}
                          </span>
                        </div>
                      </td>

                      {/* Canal */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <MarketplaceLogo name={sale.marketplace} className="w-4 h-4 object-contain shrink-0" />
                          <div className="min-w-0">
                            <span className="font-medium text-[#222222] block leading-tight truncate max-w-[120px]">
                              {sale.marketplace}
                            </span>
                            <span className="text-[10px] text-[#999999] block leading-tight truncate max-w-[120px]">
                              {sale.account_name || 'Oficial'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-5 text-right">
                        <span className="font-bold text-[#111111] block">
                          {formatBRL(sale.revenue)}
                        </span>
                        <span className="text-[11px] text-[#666666] block mt-0.5">
                          {sale.quantity} un {sale.quantity > 1 ? `· ${formatBRL(sale.price)}/un` : ''}
                        </span>
                      </td>

                      {/* Lucro & Margem */}
                      <td className="py-3.5 px-5 text-right">
                        <span className="font-bold text-[#16a34a] block">
                          {formatBRL(sale.profit)}
                        </span>
                        <span className="text-[11px] text-[#666666] font-medium block mt-0.5">
                          {Number(sale.margin || 0).toFixed(1)}% margem
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-center">
                        <SaleStatusBadge status={sale.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Limitador & Paginação na base */}
            {totalItems > 0 && (
              <div className="p-4 border-t border-[#f1f5f9] bg-[#fafafa]/50">
                <PaginationBar
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  itemName="vendas"
                />
              </div>
            )}
          </>
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
    <div className="space-y-6">
      {/* Alerta de Estoque Crítico (apenas se necessário) */}
      {isCritical && (
        <div className="p-4 sm:p-5 rounded-2xl border bg-[#fef2f2] border-[#fecaca] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-[#dc2626] text-white">
              Atenção
            </span>
            <span className="text-sm font-bold text-[#dc2626]">
              Estoque Baixo ({product.stock.physical} un restantes)
            </span>
          </div>
          <Link
            href={`/purchases/new?product=${product.id}`}
            className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Fazer Pedido de Compra
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <StatBox label="Estoque físico" value={String(product.stock.physical)} />
        <StatBox label="Reservado" value={String(product.stock.reserved)} />
        <StatBox label="Disponível" value={String(product.stock.available)} />
        <StatBox label="Mínimo" value={String(product.stock.minimum)} />
        <StatBox label="Localização" value={product.stock.location} />
        <StatBox label="Valor em estoque" value={formatBRL(product.stock.value)} />
      </div>

      {product.marketplaces.length > 0 && (
        <div className="bg-white border border-[#e6e6e6] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-5 border-b border-[#e6e6e6]">
            <SectionTitle>Estoque por Conta</SectionTitle>
          </div>
          <div className="table-container">
             <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f5f5f5] bg-[#fafafa]">
                  <th className="text-left py-4 px-6 font-semibold text-[#888] text-xs">Marketplace</th>
                  <th className="text-left py-4 px-6 font-semibold text-[#888] text-xs">Conta</th>
                  <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Estoque</th>
                  <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Preço</th>
                  <th className="text-center py-4 px-6 font-semibold text-[#888] text-xs">Status</th>
                  <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Último Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {product.marketplaces.map(mp => (
                  <tr key={mp.listing_id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <MarketplaceLogo name={mp.name} className="w-5 h-5" />
                        <span className="text-[#222] font-semibold">{mp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#666] font-mono text-xs">{mp.listing_id}</td>
                    <td className="py-4 px-6 text-right font-bold text-[#111]">{mp.stock}</td>
                    <td className="py-4 px-6 text-right text-[#666] font-medium">{formatBRL(mp.price)}</td>
                    <td className="py-4 px-6 text-center"><MarketplaceStatusBadge status={mp.status} /></td>
                    <td className="py-4 px-6 text-right text-xs text-[#888] font-mono">{new Date(mp.last_sync).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         </div>
       )}

      <div className="bg-white border border-[#e6e6e6] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-[#e6e6e6]">
          <SectionTitle>Movimentações de estoque</SectionTitle>
        </div>
        <div className="table-container">
           <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f5f5f5] bg-[#fafafa]">
                <th className="text-left py-4 px-6 font-semibold text-[#888] text-xs">Data</th>
                <th className="text-left py-4 px-6 font-semibold text-[#888] text-xs">Tipo</th>
                <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Quantidade</th>
                <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Saldo</th>
                <th className="text-left py-4 px-6 font-semibold text-[#888] text-xs">Pedido</th>
                <th className="text-left py-4 px-6 font-semibold text-[#888] text-xs">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee]">
              {product.stock_movements.map(m => (
                <tr key={m.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="py-4 px-6 text-[#666] font-mono text-xs">{m.date}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      m.type === 'COMPRA' ? 'bg-[#f0fff4] text-[#38a169] border border-[#bbf7d0]' :
                      m.type === 'VENDA' ? 'bg-[#f5f5f5] text-[#333] border border-[#e5e7eb]' :
                      m.type === 'DEVOLUCAO' ? 'bg-[#fffaf0] text-[#e67e22] border border-[#fed7aa]' :
                      'bg-[#f5f5f5] text-[#999]'
                    }`}>{m.type}</span>
                  </td>
                  <td className={`py-4 px-6 text-right font-bold ${m.quantity > 0 ? 'text-[#38a169]' : 'text-[#e74c3c]'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-[#111]">{m.balance}</td>
                  <td className="py-4 px-6 font-mono text-[#666] text-xs">{m.order_ref}</td>
                  <td className="py-4 px-6 text-[#666]">{m.user}</td>
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <StatBox label="Total comprado" value={`${product.purchases_history.reduce((a, b) => a + b.quantity, 0)} un`} />
        <StatBox label="Custo médio" value={formatBRL(product.purchases_history.reduce((a, b) => a + b.unit_cost, 0) / product.purchases_history.length)} />
        <StatBox label="Última compra" value={product.purchases_history[0]?.date || '-'} />
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-[#e6e6e6]">
          <SectionTitle>Histórico de compras</SectionTitle>
        </div>
        <div className="table-container">
           <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f5f5f5] bg-[#fafafa]">
                <th className="text-left py-4 px-6 font-semibold text-[#888] text-xs">Pedido</th>
                <th className="text-left py-4 px-6 font-semibold text-[#888] text-xs">Fornecedor</th>
                <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Qtd</th>
                <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Custo Unit.</th>
                <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Total</th>
                <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Data</th>
                <th className="text-center py-4 px-6 font-semibold text-[#888] text-xs">Status</th>
                <th className="text-right py-4 px-6 font-semibold text-[#888] text-xs">Nota Interna</th>
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
      {/* Canal 1: Loja Própria TEKNIX (SITE) */}
      <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#000000] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SITE
            </div>
            <div>
              <div className="text-sm font-bold text-[#111111] flex items-center gap-2">
                Loja Oficial TEKNIX
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                  Publicado
                </span>
              </div>
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
            className="px-3.5 py-1.5 bg-[#000000] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" /> Ajustar Preço
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-[11px] font-medium text-[#666666]">Preço na Loja</div>
            <div className="text-base font-black text-[#111111] mt-0.5">
              {formatBRL(product.site_price || product.pricing.current_price)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#666666]">Estoque</div>
            <div className="text-base font-bold text-[#16a34a] mt-0.5">{product.stock.physical} un</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#666666]">Status</div>
            <div className="text-xs font-bold text-[#16a34a] mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" /> Ativo
            </div>
          </div>
        </div>
      </div>

      {/* Canal 2+: Marketplaces e suas ofertas */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#666666]" /> Ofertas nos Marketplaces ({listings.length})
          </h3>

          <button
            onClick={() => router.push(`/produtos/publicacao?productId=${product.id}`)}
            className="px-4 py-2 bg-[#000000] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
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
                      <span className="text-sm font-bold text-[#111111]">{l.title || product.name}</span>
                      {l.is_best_seller && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                          <Award className="w-3 h-3 text-[#f59e0b]" /> MELHOR ANÚNCIO
                        </span>
                      )}
                      {(l as any).catalog_product_id && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F7F7F7] text-[#1f2328] border border-[#e5e7eb]">
                          <Sparkles className="w-3 h-3 text-[#1f2328]" /> Catálogo Oficial
                        </span>
                      )}
                      <MarketplaceStatusBadge status={l.status.toUpperCase()} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] mt-1 font-mono">
                      <span>ID: <strong className="text-[#111111]">{l.listing_id || l.external_id}</strong></span>
                      {(l as any).catalog_product_id && (
                        <>
                          <span className="text-[#cbd5e1]">•</span>
                          <span>Catalog ID: <strong className="text-[#2563eb]">{(l as any).catalog_product_id}</strong></span>
                        </>
                      )}
                      {l.account_name && (
                        <>
                          <span className="text-[#cbd5e1]">•</span>
                          <span className="font-sans">Conta: <strong className="text-[#111111]">{l.account_name}</strong></span>
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
                    className="px-3.5 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#111111] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#666666]" /> Editar Preço
                  </button>
                </div>
              </div>

              {/* Métricas da Oferta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-[11px] font-medium text-[#666666]">Preço Desta Oferta</div>
                  <div className="text-base font-black text-[#111111] mt-0.5">
                    {formatBRL(l.price)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#666666]">Total Vendido (Oferta)</div>
                  <div className="text-base font-bold text-[#111111] mt-0.5">
                    {l.sold_quantity} un
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#666666]">Faturamento Acumulado</div>
                  <div className="text-base font-bold text-[#16a34a] mt-0.5">
                    {formatBRL(l.total_revenue || (l.sold_quantity * l.price))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#666666]">Última Sincronização</div>
                  <div className="text-xs text-[#666666] mt-1 font-mono">
                    {new Date(l.last_sync).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Modal 2: Alteração de Preço com Regra de Isolamento */}
      {modalData?.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#2563eb] tracking-wider">
                  Isolamento de Preço • {modalData.channelName}
                </span>
                <h3 className="text-base font-extrabold text-[#111111] mt-0.5">
                  Ajustar Preço Individual
                </h3>
                <p className="text-xs font-mono text-[#666666]">Anúncio: {modalData.externalId}</p>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="text-[#999999] hover:text-[#111111] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F7F7F7] border border-[#e2e8f0] rounded-xl p-3.5">
                <div className="text-xs text-[#666666]">Preço atual:</div>
                <div className="text-lg font-black text-[#111111]">
                  {formatBRL(modalData.currentPrice)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Novo Preço (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#666666]">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputPrice}
                    onChange={e => setInputPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2.5 text-base font-bold bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#000000]"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1.5">
                  Motivo da Alteração (Opcional)
                </label>
                <input
                  type="text"
                  value={inputReason}
                  onChange={e => setInputReason(e.target.value)}
                  placeholder="Ex: Campanha de preço agressivo, teste de margem..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#000000]"
                />
              </div>

              {/* Callout de Garantia de Isolamento */}
              <div className="p-3 bg-[#F7F7F7] border border-[#e5e7eb] rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#1f2328] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#1f2328] leading-relaxed">
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
                  className="px-4 py-2 text-xs font-semibold text-[#666666] hover:text-[#111111] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePrice}
                  disabled={loading}
                  className="px-5 py-2 bg-[#000000] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
    <div className="bg-white border border-[#e6e6e6] rounded-2xl overflow-hidden shadow-xs">
      <div className="px-6 py-5 border-b border-[#e6e6e6]">
        <SectionTitle>Histórico de alterações</SectionTitle>
      </div>
      <div className="divide-y divide-[#eeeeee]">
        {product.history.map(h => (
          <div key={h.id} className="px-6 py-4 flex items-start gap-4 hover:bg-[#fafafa] transition-colors">
            <div className="w-2 h-2 rounded-full bg-[#1f2328] mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#111]">{h.action}</span>
                <span className="text-xs text-[#ccc]">•</span>
                <span className="text-xs text-[#888]">{h.user}</span>
              </div>
              <div className="text-xs text-[#555] mt-1 leading-relaxed">{h.details}</div>
            </div>
            <div className="text-xs text-[#999] text-right flex-shrink-0 font-mono">
              <div>{h.date}</div>
              <div className="text-[11px] text-[#bbb]">{h.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const rawName = (product.name || 'Produto sem título').replace(/\s*-\s*Remover dos favoritos\s*$/i, '').trim()
  const summarizedTitle = summarizeProductName(rawName, 37)
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isTitleExpanded, setIsTitleExpanded] = useState(false)
  const displayProductName = isTitleExpanded ? rawName : summarizedTitle
  
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
    <div className="product-detail-page pb-12">
      <div className="mb-5">
        <Link href="/operacao" className="inline-flex items-center gap-1.5 text-xs text-[#888] hover:text-[#111] transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Operação / Produtos
        </Link>
      </div>

      {/* Main Product Hero */}
      <div className="flex flex-col sm:flex-row items-start gap-5 lg:gap-8 w-full mb-5">
        
        {/* Photos Gallery */}
        <div className="w-full sm:w-36 lg:w-44 flex flex-col items-center gap-2.5 shrink-0">
          {/* Big Preview Frame */}
          <div className="relative w-full max-w-[240px] sm:max-w-none aspect-square rounded-2xl bg-white border border-[#e6e6e6] overflow-hidden flex items-center justify-center p-3 shadow-2xs group">
            {selectedImage && selectedImage !== '/placeholder-product.png' ? (
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <Package className="w-14 h-14 text-[#ccc]" />
            )}
            
            {/* Badges on main image */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
              {selectedImageIndex === 0 && (
                <span className="px-2 py-0.5 rounded-md bg-[#1f2328] text-white text-[10px] font-bold shadow-xs">
                  Capa
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                {selectedImageIndex + 1}/{images.length}
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto w-full py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-10 h-10 rounded-lg border-2 overflow-hidden p-0.5 shrink-0 transition-all cursor-pointer bg-white ${
                    selectedImageIndex === idx 
                      ? 'border-[#1f2328] ring-1 ring-[#1f2328]/20 shadow-xs scale-105' 
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
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch w-full">
          <div>
            {/* Top Header: Badges (Left) & Actions (Right) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F7] text-[#1f2328] border border-[#e5e7eb] text-xs font-semibold shadow-2xs">
                  <MarketplaceLogo name="Mercado Livre" className="w-3.5 h-3.5 object-contain" />
                  Mercado Livre Oficial
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F7F7F7] text-[#4b5563] text-xs font-semibold border border-[#e5e7eb]">
                  {!product.category || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.category)
                    ? 'Catálogo Geral'
                    : product.category}
                </span>
                <StatusBadge status={product.status} />
              </div>

              {/* Action Buttons */}
              <div className="product-action-icons flex items-center justify-center sm:justify-end gap-2 shrink-0 flex-wrap w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="h-9 w-9 flex items-center justify-center bg-white text-[#374151] border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] hover:border-[#111] hover:text-[#111] transition-all cursor-pointer shadow-xs shrink-0"
                  title="Compartilhar produto"
                >
                  <Share2 size={16} strokeWidth={2} className="w-4 h-4 text-[#374151] shrink-0" />
                </button>
                <button 
                  type="button"
                  onClick={() => router.push(`/purchases/new?product=${product.id}`)} 
                  className="h-9 px-3.5 flex items-center gap-1.5 bg-white text-[#374151] border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] hover:border-[#111] hover:text-[#111] text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                  title="Fazer Pedido de Compra"
                >
                  <ShoppingCart size={16} strokeWidth={2} className="w-4 h-4 text-[#374151] shrink-0" />
                  <span className="hidden sm:inline">Comprar</span>
                </button>
                <button 
                  type="button"
                  onClick={() => router.push(`/produtos/${product.id}/editar`)} 
                  className="h-9 px-3.5 flex items-center gap-1.5 bg-[#1f2328] hover:bg-black text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                  title="Editar Produto"
                >
                  <Pencil size={16} strokeWidth={2} className="w-4 h-4 text-white shrink-0" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="h-9 w-9 flex items-center justify-center bg-white text-[#ef4444] border border-[#fecaca] hover:bg-[#fef2f2] hover:border-[#ef4444] rounded-xl transition-all focus:outline-none cursor-pointer shadow-xs shrink-0"
                  title="Excluir produto"
                >
                  <Trash2 size={16} strokeWidth={2} className="w-4 h-4 text-[#ef4444] shrink-0" />
                </button>
              </div>
            </div>

            {/* Product Title (Clean, Summarized & Expandable) */}
            <div className="mb-2 text-center sm:text-left">
              <h1 
                className="text-base sm:text-lg font-bold text-[#111111] leading-snug tracking-tight"
                title={rawName}
              >
                {displayProductName}
              </h1>
              {rawName !== summarizedTitle && (
                <button
                  type="button"
                  onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                  className="text-[11px] text-[#0071e3] hover:underline font-medium mt-0.5 inline-flex items-center gap-1 cursor-pointer"
                >
                  {isTitleExpanded ? '← Resumir nome' : 'Ver nome completo →'}
                </button>
              )}
            </div>

            {/* Sub-info */}
            <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
              <span className="inline-flex items-center gap-1 bg-[#F7F7F7] px-2.5 py-1 rounded-lg border border-[#e5e7eb] text-[#1f2328] font-medium text-[11px]">
                <span className="text-[#888]">Marca:</span>
                <strong className="text-[#111] font-semibold">{product.brand || 'Geral'}</strong>
              </span>
              <span className="inline-flex items-center gap-1 bg-[#F7F7F7] px-2.5 py-1 rounded-lg border border-[#e5e7eb] text-[#1f2328] font-mono text-[11px]">
                <span className="text-[#888] font-sans">SKU:</span>
                <strong className="text-[#111] font-semibold">{product.sku}</strong>
              </span>
              {product.ean && product.ean !== '—' && (
                <span className="inline-flex items-center gap-1 bg-[#F7F7F7] px-2.5 py-1 rounded-lg border border-[#e5e7eb] text-[#1f2328] font-mono text-[11px]">
                  <span className="text-[#888] font-sans">EAN:</span>
                  <strong className="text-[#111] font-semibold">{product.ean}</strong>
                </span>
              )}
            </div>

            {/* Price & Stock Quick Highlight Bar (Compact Summary) */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-2 px-3.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-xs text-[#374151]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#6b7280]">Estoque Central:</span>
                <span className={`font-bold ${product.stock.physical > 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                  {product.stock.physical} un
                </span>
                <span className="text-[11px] text-[#9ca3af]">({product.stock.available} disp.)</span>
              </div>
              <div className="h-3 w-px bg-[#e5e7eb] hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-[#6b7280]">Preço Loja Oficial:</span>
                <span className="font-bold text-[#111]">
                  {formatBRL(product.site_price || product.pricing.current_price || product.costs.real || 0)}
                </span>
              </div>
              <div className="h-3 w-px bg-[#e5e7eb] hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-[#6b7280]">Canais Conectados:</span>
                <span className="font-bold text-[#111]">
                  {(product.channel_listings?.length || product.marketplaces.length) + (product.site_published ? 1 : 0)} canais
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <StatBox label="Vendas" value={String(product.summary.total_sales)} />
        <StatBox label="Estoque Central" value={`${product.stock.physical} un`} />
        <StatBox label="Faturamento" value={formatBRL(product.summary.total_revenue)} />
        <StatBox label="Lucro" value={formatBRL(product.summary.total_profit)} />
        <StatBox label="Margem" value={`${Number(product.summary.avg_margin || 0).toFixed(1)}%`} />
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
