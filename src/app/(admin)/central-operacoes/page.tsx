'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  Package, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ArrowRight, 
  Box, 
  Sparkles, 
  RotateCw,
  Check
} from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CentralOperacoesPage() {
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const { data: rawData, loading } = useSupabaseQuery(async (s) => {
    const { data: orders } = await s
      .from('orders')
      .select('*, marketplaces(name, logo), order_items(*, products(id, name, sku, image_url))')
      .order('created_at', { ascending: false })

    const { data: products } = await s
      .from('products')
      .select('id, name, sku, stock, min_stock, cost_purchase, image_url')

    return { orders: orders || [], products: products || [] }
  })

  const orders = rawData?.orders || []
  const products = rawData?.products || []

  // 1. URGENTE
  const urgentQueue = useMemo(() => {
    const list: any[] = []

    orders.filter((o: any) => o.status === 'CANCELADO' || o.status === 'ERROR').forEach((o: any) => {
      if (!resolvedIds.has(`ord-${o.id}`)) {
        list.push({
          id: `ord-${o.id}`,
          title: `Pedido ${o.order_number} cancelado`,
          subtitle: `Cliente: ${o.customer_name} • ${formatBRL(Number(o.total_amount || 0))}`,
          channel: (o.marketplaces as any)?.name || 'Mercado Livre',
          actionLabel: 'Ver Pedido',
          actionHref: `/pedidos/${o.id}`,
          tag: 'Cancelamento / Divergência'
        })
      }
    })

    products.filter((p: any) => Number(p.stock || 0) <= 0).forEach((p: any) => {
      if (!resolvedIds.has(`prod-${p.id}`)) {
        list.push({
          id: `prod-${p.id}`,
          title: `Estoque Zerado: ${p.sku}`,
          subtitle: `${p.name} está com 0 unidades em estoque`,
          channel: 'Catálogo Central',
          actionLabel: 'Repor Estoque',
          actionHref: `/purchases/new?product=${p.id}`,
          tag: 'Risco de Pausa'
        })
      }
    })

    return list
  }, [orders, products, resolvedIds])

  // 2. PARA ENVIAR
  const toShipQueue = useMemo(() => {
    return orders.filter((o: any) => ['NOVO', 'PAGO', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO', 'SEPARADO'].includes(o.status))
  }, [orders])

  // 3. ATENÇÃO
  const attentionQueue = useMemo(() => {
    return products.filter((p: any) => {
      const s = Number(p.stock || 0)
      const min = Number(p.min_stock || 3)
      return s > 0 && s <= min
    })
  }, [products])

  // 4. CONCLUÍDO
  const completedQueue = useMemo(() => {
    return orders.filter((o: any) => ['DELIVERED', 'ENTREGUE', 'ENVIADO', 'EMBALADO'].includes(o.status)).slice(0, 15)
  }, [orders])

  const handleResolve = (id: string) => {
    setResolvingId(id)
    setTimeout(() => {
      setResolvedIds(prev => new Set([...prev, id]))
      setResolvingId(null)
    }, 600)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a]">Central de Operações</h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
              Cockpit Geral
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Fila operacional inteligente organizada por nível de prioridade (Urgente, Para Enviar, Atenção e Concluído).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/expedicao"
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            Abrir Modo Expedição
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-[#e2e8f0] text-center text-xs text-[#94a3b8]">
          Carregando fila operacional...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 🔴 LANE 1: URGENTE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fef2f2] border border-[#fecaca]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-ping" />
                <h3 className="text-xs font-black text-[#dc2626] uppercase tracking-wider">Urgente</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white text-[#dc2626]">
                {urgentQueue.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {urgentQueue.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-[#e2e8f0] text-center text-xs text-[#94a3b8]">
                  Nenhuma pendência urgente.
                </div>
              ) : (
                urgentQueue.map((item: any) => (
                  <div key={item.id} className="p-4 bg-white rounded-2xl border border-[#fecaca] shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#dc2626] uppercase">{item.tag}</span>
                      <span className="text-[10px] text-[#64748b] font-medium">{item.channel}</span>
                    </div>

                    <p className="text-xs font-bold text-[#0f172a] leading-tight">{item.title}</p>
                    <p className="text-[11px] text-[#64748b] leading-snug">{item.subtitle}</p>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f1f5f9]">
                      <Link
                        href={item.actionHref}
                        className="text-xs font-bold text-[#2563eb] hover:underline"
                      >
                        {item.actionLabel} ➔
                      </Link>

                      <button
                        onClick={() => handleResolve(item.id)}
                        disabled={resolvingId === item.id}
                        className="px-2.5 py-1 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {resolvingId === item.id ? <RotateCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Resolver
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 🟠 LANE 2: PARA ENVIAR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fffbeb] border border-[#fde68a]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <h3 className="text-xs font-black text-[#d97706] uppercase tracking-wider">Para Enviar</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white text-[#d97706]">
                {toShipQueue.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {toShipQueue.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-[#e2e8f0] text-center text-xs text-[#94a3b8]">
                  Nenhum pedido pendente de envio.
                </div>
              ) : (
                toShipQueue.map((o: any) => (
                  <div key={o.id} className="p-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs space-y-2 hover:border-[#2563eb] transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <MarketplaceLogo name={(o.marketplaces as any)?.name || 'Mercado Livre'} className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-[#0f172a] font-mono">{o.order_number}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a]">
                        {o.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#0f172a] font-medium">{o.customer_name}</p>
                    <p className="text-xs font-black text-[#16a34a]">{formatBRL(Number(o.total_amount || 0))}</p>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f1f5f9]">
                      <Link
                        href={`/pedidos/${o.id}/etiqueta`}
                        target="_blank"
                        className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> Etiqueta PDF
                      </Link>

                      <Link
                        href={`/pedidos/${o.id}`}
                        className="text-[11px] font-bold text-[#64748b] hover:text-[#0f172a]"
                      >
                        Detalhes ➔
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 🟡 LANE 3: ATENÇÃO / ESTOQUE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                <h3 className="text-xs font-black text-[#2563eb] uppercase tracking-wider">Atenção / Estoque</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white text-[#2563eb]">
                {attentionQueue.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {attentionQueue.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-[#e2e8f0] text-center text-xs text-[#94a3b8]">
                  Nenhum produto com estoque crítico.
                </div>
              ) : (
                attentionQueue.map((p: any) => (
                  <div key={p.id} className="p-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#64748b]">{p.sku}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fffbeb] text-[#d97706]">
                        {p.stock} un restante{p.stock !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#0f172a] truncate">{p.name}</p>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f1f5f9]">
                      <Link
                        href={`/purchases/new?product=${p.id}`}
                        className="text-xs font-bold text-[#2563eb] hover:underline"
                      >
                        Comprar Mais ➔
                      </Link>

                      <Link
                        href={`/produtos/${p.id}`}
                        className="text-[11px] font-bold text-[#64748b]"
                      >
                        Ver Produto
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 🟢 LANE 4: CONCLUÍDO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                <h3 className="text-xs font-black text-[#16a34a] uppercase tracking-wider">Concluído</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white text-[#16a34a]">
                {completedQueue.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {completedQueue.map((o: any) => (
                <div key={o.id} className="p-3.5 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs space-y-1 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0f172a] font-mono">{o.order_number}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a]">
                      {o.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748b] truncate">{o.customer_name}</p>
                  <p className="text-xs font-bold text-[#0f172a]">{formatBRL(Number(o.total_amount || 0))}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
