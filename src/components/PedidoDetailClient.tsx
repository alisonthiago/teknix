'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ArrowLeft, Package, Clock, Loader2, CheckCircle2, Send, Printer, User, Calendar, ShoppingCart, RefreshCw, Box, Truck, MessageSquare, Share2, FileText } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { OrderDetail } from '@/lib/detail-types'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { moveOrderToPaid, moveOrderStatus } from '@/app/(admin)/pedidos/actions'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const SC: Record<string, { l: string; c: string }> = {
  NOVO: { l: 'Novo', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  PAGO: { l: 'Pago', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  AGUARDANDO_SEPARACAO: { l: 'Aguardando', c: 'bg-[#fffaf0] text-[#e67e22]' },
  EM_SEPARACAO: { l: 'Separação', c: 'bg-[#fffaf0] text-[#e67e22]' },
  SEPARADO: { l: 'Separado', c: 'bg-[#f0f0ff] text-[#6c5ce7]' },
  ENVIADO: { l: 'Enviado', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  ENTREGUE: { l: 'Entregue', c: 'bg-[#f0fff4] text-[#38a169]' },
  CANCELADO: { l: 'Cancelado', c: 'bg-[#fff5f5] text-[#e74c3c]' },
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

function VisaoGeralTab({ order }: { order: OrderDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Itens do pedido</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#f5f5f5]">
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">SKU</th>
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Produto</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Qtd</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Preço</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {order.items.map((item, i) => (
                  <tr key={i} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#999]">{item.sku}</td>
                    <td className="py-2.5 px-3 text-[#333] font-medium">
                      {item.product_id ? (
                        <Link 
                          href={`/produtos/${item.product_id}`}
                          className="flex items-center gap-3 group hover:text-[#3483fa] transition-colors cursor-pointer"
                          title="Clique para abrir os detalhes deste produto"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] border border-[#e6e6e6] group-hover:border-[#3483fa]/50 overflow-hidden flex items-center justify-center shrink-0 transition-all shadow-2xs">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-[#ccc]" />
                            )}
                          </div>
                          <span className="font-semibold text-[13px] group-hover:underline underline-offset-2">
                            {item.name}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] border border-[#e6e6e6] overflow-hidden flex items-center justify-center shrink-0">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-[#ccc]" />
                            )}
                          </div>
                          <span className="font-semibold text-[13px]">{item.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#999] font-medium">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-[#999]">{formatBRL(item.price)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#333]">{formatBRL(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Pagamento</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow label="Método" value={order.payment.method} bold />
            <InfoRow label="Parcelas" value={`${order.payment.installments}x`} />
            <InfoRow label="Total" value={formatBRL(order.payment.total)} bold />
            <InfoRow label="Taxa" value={formatBRL(order.payment.fee)} />
            <InfoRow label="Líquido" value={formatBRL(order.payment.net)} bold />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Card Cliente */}
        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs">
          <SectionTitle>Dados do Cliente</SectionTitle>
          <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb] font-bold text-sm shrink-0">
                {order.customer.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-[#0f172a] truncate">{order.customer.name}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#64748b]">
                  <MarketplaceLogo name={order.marketplace} className="w-3 h-3" />
                  Comprador {order.marketplace}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <InfoRow label="Telefone / Contato" value={order.customer.phone || '—'} />
            <InfoRow label="E-mail" value={order.customer.email || '—'} />
            <InfoRow label="Total Pago pelo Cliente" value={formatBRL(order.payment.total || order.items.reduce((a, b) => a + b.total, 0))} bold />
            <InfoRow label="Forma de Pagamento" value={order.payment.method || 'PIX'} />
          </div>

          <Link
            href={`/clientes/${encodeURIComponent(order.customer.name.trim().toLowerCase().replace(/\s+/g, '-'))}`}
            className="mt-3.5 w-full py-2 px-3 bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] rounded-xl text-xs font-bold text-[#2563eb] flex items-center justify-center gap-1.5 transition-colors"
          >
            Ver Perfil e Histórico do Cliente ➔
          </Link>
        </div>

        {/* Card Frete & Envio */}
        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs">
          <SectionTitle>Frete & Entrega</SectionTitle>
          <div className="space-y-1.5">
            <InfoRow label="Canal de Envio" value={order.marketplace} bold />
            <InfoRow label="Método" value={order.shipping.method || 'Mercado Envios'} />
            <InfoRow label="Destino" value={`${order.shipping.city} / ${order.shipping.state}`} />
            <InfoRow label="CEP" value={order.shipping.zip} mono />
            <InfoRow label="Endereço" value={order.shipping.address} />
            <InfoRow label="Valor do Frete" value={order.shipping.cost > 0 ? formatBRL(order.shipping.cost) : 'Frete Grátis'} />
            {order.shipping.tracking && <InfoRow label="Rastreamento" value={order.shipping.tracking} mono bold />}
          </div>
        </div>

        {/* Card Resumo Financeiro */}
        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs">
          <SectionTitle>Resumo da Cobrança</SectionTitle>
          <div className="space-y-1.5">
            <InfoRow label="Subtotal dos Itens" value={formatBRL(order.items.reduce((a, b) => a + b.total, 0))} />
            <InfoRow label="Frete cobrado" value={order.shipping.cost > 0 ? formatBRL(order.shipping.cost) : 'Grátis'} />
            <InfoRow label="Taxas do Marketplace" value={formatBRL(order.payment.fee)} />
            <div className="pt-2 mt-2 border-t border-[#e2e8f0] flex justify-between items-center">
              <span className="text-xs font-bold text-[#0f172a]">Total Cobrado do Cliente:</span>
              <span className="text-sm font-black text-[#16a34a]">{formatBRL(order.payment.total || order.items.reduce((a, b) => a + b.total, 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineTab({ order }: { order: OrderDetail }) {
  const isDelivered = order.status === 'DELIVERED' || order.status === 'ENTREGUE'
  const isShipped = isDelivered || order.status === 'ENVIADO'
  const isPacked = isShipped || order.status === 'EMBALADO' || order.status === 'SEPARADO'
  const isLabelGenerated = isPacked || order.shipping.tracking !== '' || ['PAGO', 'NOVO'].includes(order.status)

  const steps = [
    { title: 'Venda Realizada', desc: `${order.marketplace} (${formatBRL(order.payment.total)})`, done: true, icon: ShoppingCart },
    { title: 'Pedido Sincronizado', desc: 'Webhook em Tempo Real', done: true, icon: RefreshCw },
    { title: 'Estoque Baixado', desc: 'Saldo Central Deduzido', done: true, icon: Package },
    { title: 'Etiqueta Disponível', desc: order.shipping.tracking || 'Mercado Envios', done: isLabelGenerated, icon: Printer },
    { title: 'Etiqueta Impressa', desc: isPacked ? 'Pronto na Estação' : 'Aguardando Impressão', done: isPacked, icon: CheckCircle2 },
    { title: 'Pedido Conferido & Embalado', desc: isPacked ? 'Conferência Bipagem OK' : 'Aguardando Bipagem', done: isPacked, icon: Box },
    { title: 'Enviado & Rastreamento', desc: isShipped ? (isDelivered ? 'Entregue ao Comprador' : 'Em Trânsito p/ Destino') : 'Aguardando Coleta', done: isShipped, icon: Truck },
  ]

  return (
    <div className="space-y-6">
      {/* 7-Stage Visual Progress Stepper */}
      <div className="bg-white border border-[#e6e6e6] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-base font-extrabold text-[#0f172a] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563eb]" />
              Linha do Tempo da Operação do Pedido
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">Rastreabilidade completa desde a venda até a entrega final.</p>
          </div>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
            {order.status}
          </span>
        </div>

        <div className="relative pl-6 space-y-8 before:absolute before:left-8 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#e2e8f0]">
          {steps.map((st, i) => {
            const Icon = st.icon

            return (
              <div key={i} className="relative flex items-start gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-2xs border ${
                  st.done ? 'bg-[#2563eb] text-white border-[#1d4ed8]' : 'bg-[#f8fafc] text-[#94a3b8] border-[#e2e8f0]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-bold leading-tight ${st.done ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>
                    {st.title}
                  </p>
                  <p className="text-xs text-[#64748b] mt-0.5">{st.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Historical logs */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="bg-white border border-[#e6e6e6] rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-[#f1f5f9] bg-[#fafafa]">
            <SectionTitle>Registro de Eventos do Sistema</SectionTitle>
          </div>
          <div className="divide-y divide-[#f1f5f9] p-2">
            {order.timeline.map((h, i) => (
              <div key={i} className="p-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-1.5 shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-[#0f172a]">{h.description}</span>
                </div>
                <div className="text-[11px] text-[#94a3b8] font-mono text-right shrink-0">
                  {h.date} {h.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderActions({ order }: { order: OrderDetail }) {
  const [isPending, startTransition] = useTransition()
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean
    type: 'CARD_ORDER' | 'CARD_INVOICE' | 'CARD_SHIPPING'
    title: string
    metadata: any
    note?: string
  }>({
    isOpen: false,
    type: 'CARD_ORDER',
    title: '',
    metadata: {}
  })
  const router = useRouter()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAction = (action: () => Promise<any>) => {
    startTransition(async () => {
      await action()
      router.refresh()
    })
  }

  const handleShareOrder = () => {
    setShareModal({
      isOpen: true,
      type: 'CARD_ORDER',
      title: `Pedido #${order.order_number}`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.customer.name,
        product_name: order.items[0]?.name || 'Produto',
        product_sku: order.items[0]?.sku || 'SKU',
        product_image: order.items[0]?.image,
        total_amount: order.payment.total,
        marketplace_name: order.marketplace
      },
      note: 'Favor verificar os detalhes operacionais deste pedido.'
    })
  }

  const handleShareInvoice = () => {
    setShareModal({
      isOpen: true,
      type: 'CARD_INVOICE',
      title: `Nota Fiscal — Pedido #${order.order_number}`,
      metadata: {
        order_number: order.order_number,
        invoice_number: 'NF-e 000.412.980',
        customer_name: order.customer.name
      },
      note: 'Cliente solicitou a emissão/envio da Nota Fiscal.'
    })
  }

  return (
    <>
      <ShareContextModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal(prev => ({ ...prev, isOpen: false }))}
        title={shareModal.title}
        messageType={shareModal.type}
        metadata={shareModal.metadata}
        defaultNote={shareModal.note}
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {/* BOTÕES DE COMPARTILHAMENTO OPERACIONAL 360° */}
        <button
          onClick={handleShareOrder}
          className="inline-flex items-center gap-1.5 bg-[#111] hover:bg-[#222] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
          title="Compartilhar este pedido com outro colaborador no Chat"
        >
          <Share2 className="w-3 h-3 text-[#B5F500]" />
          Compartilhar Pedido
        </button>

        <button
          onClick={handleShareInvoice}
          className="inline-flex items-center gap-1.5 bg-white border border-[#d0d7de] hover:bg-[#f8fafc] text-[#1e293b] text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
          title="Compartilhar solicitação de nota fiscal"
        >
          <FileText className="w-3 h-3 text-[#0284c7]" />
          Pedir Nota Fiscal
        </button>

        <button
          onClick={() => router.push(`/pedidos/${order.id}/etiqueta`)}
          className="inline-flex items-center gap-1.5 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <Printer className="w-3 h-3" />
          Imprimir Etiqueta (100x150mm)
        </button>
        
        <button
          onClick={() => router.push(`/pedidos/${order.id}/nota`)}
          className="inline-flex items-center gap-1.5 bg-white border border-[#e6e6e6] text-[#333] text-[11px] font-medium px-3 py-1.5 rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer"
        >
          <Printer className="w-3 h-3" />
          Declaração
        </button>

        {order.status === 'NOVO' && (
          <button
            onClick={() => handleAction(() => moveOrderToPaid(order.id))}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 bg-[#38a169] text-white text-[11px] font-medium px-3 py-1.5 rounded-xl hover:bg-[#2d8f55] transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Confirmar Pagamento
          </button>
        )}
        {order.status === 'PAGO' && (
          <button
            onClick={() => handleAction(() => moveOrderStatus(order.id, 'AGUARDANDO_SEPARACAO'))}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 bg-[#e67e22] text-white text-[11px] font-medium px-3 py-1.5 rounded-xl hover:bg-[#d35400] transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
            Enviar para Separação
          </button>
        )}
      </div>
    </>
  )
}

export default function PedidoDetailClient({ order }: { order: OrderDetail }) {
  const sc = SC[order.status] || { l: order.status, c: 'bg-[#f5f5f5] text-[#666]' }

  return (
    <div>
      <div className="mb-4">
        <Link href="/pedidos" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Pedidos
        </Link>
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-md p-5 mb-4">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-full sm:w-14 h-14 rounded-md bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center flex-shrink-0">
            <MarketplaceLogo name={order.marketplace} className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#0f172a]">{order.order_number}</h1>
                <div className="flex flex-wrap items-center gap-2.5 mt-2">
                  <Link
                    href={`/clientes/${encodeURIComponent(order.customer.name.trim().toLowerCase().replace(/\s+/g, '-'))}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] border border-[#bfdbfe] font-bold text-xs shadow-2xs transition-all hover:scale-[1.02] cursor-pointer group"
                    title="Clique para abrir o perfil deste cliente"
                  >
                    <User className="w-3.5 h-3.5 text-[#3b82f6] group-hover:text-[#2563eb]" />
                    <span className="text-[#64748b] font-medium">Cliente:</span>
                    <strong className="text-[#0f172a] group-hover:text-[#2563eb] font-extrabold text-[13px] group-hover:underline underline-offset-2">
                      {order.customer.name}
                    </strong>
                  </Link>
                  <span className="text-[12px] font-semibold text-[#64748b] bg-[#f8fafc] px-2.5 py-1 rounded-xl border border-[#e2e8f0]">
                    {order.marketplace}
                  </span>
                  <span className={`inline-flex px-2.5 py-1 rounded-xl text-[11px] font-bold ${sc.c}`}>{sc.l}</span>
                </div>
                <OrderActions order={order} />
              </div>
              <div className="sm:text-right bg-[#f8fafc] sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-[#e2e8f0] shrink-0">
                <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Total do Pedido</p>
                <div className="text-2xl sm:text-3xl font-black text-[#0f172a] mt-0.5">{formatBRL(order.payment.total)}</div>
                <div className="text-xs font-semibold text-[#64748b] mt-1.5 flex sm:justify-end items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" /> {order.date}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatBox label="Itens" value={String(order.items.length)} />
        <StatBox label="Total" value={formatBRL(order.payment.total)} />
        <StatBox label="Frete" value={formatBRL(order.shipping.cost)} />
        <StatBox label="Líquido" value={formatBRL(order.payment.net)} />
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral"><Package className="w-3.5 h-3.5 mr-1 inline" /> Visão geral</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="w-3.5 h-3.5 mr-1 inline" /> Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral"><VisaoGeralTab order={order} /></TabsContent>
        <TabsContent value="timeline"><TimelineTab order={order} /></TabsContent>
      </Tabs>
    </div>
  )
}
