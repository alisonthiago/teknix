'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ArrowLeft, Package, Clock, Loader2, CheckCircle2, Send, Printer } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { OrderDetail } from '@/lib/detail-types'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { moveOrderToPaid, moveOrderStatus } from '@/app/(admin)/pedidos/actions'

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
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Cliente</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Nome" value={order.customer.name} bold />
            <InfoRow label="E-mail" value={order.customer.email} />
            <InfoRow label="Telefone" value={order.customer.phone} />
            <InfoRow label="CPF" value={order.customer.cpf} mono />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Frete & Envio</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Canal" value={order.marketplace} bold />
            <InfoRow label="Método" value={order.shipping.method || 'Mercado Envios'} />
            <InfoRow label="Destino" value={`${order.shipping.city}/${order.shipping.state}`} />
            <InfoRow label="CEP" value={order.shipping.zip} mono />
            <InfoRow label="Endereço" value={order.shipping.address} />
            <InfoRow label="Valor" value={formatBRL(order.shipping.cost)} />
            {order.shipping.tracking && <InfoRow label="Rastreamento" value={order.shipping.tracking} mono bold />}
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Resumo</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Subtotal" value={formatBRL(order.items.reduce((a, b) => a + b.total, 0))} />
            <InfoRow label="Frete" value={formatBRL(order.shipping.cost)} />
            <InfoRow label="Taxas" value={formatBRL(order.payment.fee)} />
            <InfoRow label="Total" value={formatBRL(order.payment.total)} bold />
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineTab({ order }: { order: OrderDetail }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e6e6e6]">
        <SectionTitle>Histórico do pedido</SectionTitle>
      </div>
      <div className="divide-y divide-[#eeeeee]">
        {order.timeline.map((h, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3483fa] mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#333]">{h.description}</span>
              </div>
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

function OrderActions({ status, orderId }: { status: string; orderId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAction = (action: () => Promise<any>) => {
    startTransition(async () => {
      await action()
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <button
        onClick={() => router.push(`/pedidos/${orderId}/etiqueta`)}
        className="inline-flex items-center gap-1.5 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs cursor-pointer"
      >
        <Printer className="w-3 h-3" />
        Imprimir Etiqueta de Envio (100x150mm)
      </button>
      <button
        onClick={() => router.push(`/pedidos/${orderId}/nota`)}
        className="inline-flex items-center gap-1.5 bg-white border border-[#e6e6e6] text-[#333] text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-[#f5f5f5] transition-colors cursor-pointer"
      >
        <Printer className="w-3 h-3" />
        Comprovante / Declaração
      </button>
      {status === 'NOVO' && (
        <button
          onClick={() => handleAction(() => moveOrderToPaid(orderId))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-[#38a169] text-white text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-[#2d8f55] transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          Confirmar Pagamento
        </button>
      )}
      {status === 'PAGO' && (
        <button
          onClick={() => handleAction(() => moveOrderStatus(orderId, 'AGUARDANDO_SEPARACAO'))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-[#e67e22] text-white text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-[#d35400] transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
          Enviar para Separação
        </button>
      )}
      {status === 'SEPARADO' && (
        <button
          onClick={() => handleAction(() => moveOrderStatus(orderId, 'ENVIADO'))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-[#3483fa] text-white text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-[#2968c8] transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Enviar
        </button>
      )}
      {['NOVO', 'PAGO', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO'].includes(status) && (
        <button
          onClick={() => handleAction(() => moveOrderStatus(orderId, 'CANCELADO'))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 border border-[#e74c3c]/30 text-[#e74c3c] text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-[#fff5f5] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      )}
    </div>
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
                <h1 className="text-[18px] font-semibold text-[#333]">{order.order_number}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[12px] text-[#999]">{order.marketplace}</span>
                   <span className="text-[10px] text-[#ccc]">•</span>
                   <span className="text-[12px] text-[#999]">{order.customer.name}</span>
                   <span className="text-[10px] text-[#ccc]">•</span>
                   <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${sc.c}`}>{sc.l}</span>
                 </div>
                 <OrderActions status={order.status} orderId={order.id} />
              </div>
              <div className="sm:text-right">
                <div className="text-[18px] font-semibold text-[#333]">{formatBRL(order.payment.total)}</div>
                <div className="text-[11px] text-[#999] mt-0.5">{order.date}</div>
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
