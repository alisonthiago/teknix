'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Package, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag,
  Zap,
  Check,
  RotateCw,
  Box,
  Truck
} from 'lucide-react'
import { MarketplaceLogo } from './MarketplaceLogos'

export interface CockpitData {
  orders: any[]
  products: any[]
  integrationsStatus?: any[]
}

export function CockpitCentralOperacao({ orders = [], products = [] }: CockpitData) {
  const router = useRouter()
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  // 1. Calculations
  const urgentItems = useMemo(() => {
    const list: any[] = []

    // Orders with status 'CANCELADO' or missing tracking/carrier issues
    orders.filter(o => o.status === 'CANCELADO' || o.status === 'ERROR').forEach(o => {
      if (!resolvedIds.has(`order-err-${o.id}`)) {
        list.push({
          id: `order-err-${o.id}`,
          type: 'ORDER_ERROR',
          title: `Pedido ${o.order_number} cancelado ou com pendência`,
          description: `O comprador cancelou ou houve recusa no processamento do envio.`,
          actionLabel: 'Verificar Pedido',
          actionLink: `/pedidos/${o.id}`,
          channel: (o.marketplaces as any)?.name || 'Mercado Livre',
          severity: 'URGENT'
        })
      }
    })

    // Out of stock products with sales activity
    products.filter(p => Number(p.stock || 0) <= 0).slice(0, 4).forEach(p => {
      if (!resolvedIds.has(`prod-stock-${p.id}`)) {
        list.push({
          id: `prod-stock-${p.id}`,
          type: 'OUT_OF_STOCK',
          title: `Produto ${p.sku} esgotado (Estoque 0)`,
          description: `${p.name} está com saldo zerado. Risco de pausa nos anúncios.`,
          actionLabel: 'Fazer Pedido de Compra',
          actionLink: `/purchases/new?product=${p.id}`,
          channel: 'Estoque Central',
          severity: 'URGENT'
        })
      }
    })

    return list
  }, [orders, products, resolvedIds])

  const toShipOrders = useMemo(() => {
    return orders.filter(o => ['NOVO', 'PAGO', 'EM_SEPARACAO', 'SEPARADO', 'AGUARDANDO_SEPARACAO'].includes(o.status))
  }, [orders])

  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const s = Number(p.stock || 0)
      const min = Number(p.min_stock || 3)
      return s > 0 && s <= min
    })
  }, [products])

  const completedOrders = useMemo(() => {
    return orders.filter(o => ['DELIVERED', 'ENTREGUE', 'ENVIADO', 'EMBALADO'].includes(o.status))
  }, [orders])

  const handleQuickResolve = (id: string) => {
    setResolvingId(id)
    setTimeout(() => {
      setResolvedIds(prev => new Set([...prev, id]))
      setResolvingId(null)
    }, 800)
  }

  const totalActionsCount = urgentItems.length + (toShipOrders.length > 0 ? 1 : 0) + (lowStockProducts.length > 0 ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* 🧠 Assistente Operacional Inteligente Banner (Clean White Theme) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#e2e8f0] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
              Cockpit Inteligente de Operação TEKNIX
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0f172a]">
              {totalActionsCount === 0 ? (
                'Operação 100% em Dia! Sem pendências críticas.'
              ) : (
                `Atenção: Existem ${totalActionsCount} ações operacionais prioritárias hoje.`
              )}
            </h2>

            <p className="text-xs sm:text-sm text-[#64748b] max-w-2xl leading-relaxed">
              O sistema monitora em tempo real seus pedidos do Mercado Livre, estoques críticos e etiquetas pendentes de expedição.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/expedicao"
              className="px-5 py-2.5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Package className="w-4 h-4" />
              Abrir Modo Expedição & Bipagem
            </Link>

            <Link
              href="/central-operacoes"
              className="px-5 py-2.5 rounded-2xl bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              Ver Fila Operacional Completa
            </Link>
          </div>
        </div>

        {/* Status Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#f1f5f9]">
          <div className="bg-[#fef2f2] p-4 rounded-2xl border border-[#fecaca] shadow-2xs">
            <div className="flex items-center gap-2 text-[#dc2626] text-xs font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
              Urgente
            </div>
            <p className="text-2xl font-black text-[#991b1b] mt-1">{urgentItems.length} pendência{urgentItems.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-[#fffbeb] p-4 rounded-2xl border border-[#fde68a] shadow-2xs">
            <div className="flex items-center gap-2 text-[#d97706] text-xs font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              Para Enviar
            </div>
            <p className="text-2xl font-black text-[#92400e] mt-1">{toShipOrders.length} pedido{toShipOrders.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-[#eff6ff] p-4 rounded-2xl border border-[#bfdbfe] shadow-2xs">
            <div className="flex items-center gap-2 text-[#2563eb] text-xs font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
              Estoque Baixo
            </div>
            <p className="text-2xl font-black text-[#1e40af] mt-1">{lowStockProducts.length} produto{lowStockProducts.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-[#f0fdf4] p-4 rounded-2xl border border-[#bbf7d0] shadow-2xs">
            <div className="flex items-center gap-2 text-[#16a34a] text-xs font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              Expedidos
            </div>
            <p className="text-2xl font-black text-[#166534] mt-1">{completedOrders.length} concluído{completedOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
