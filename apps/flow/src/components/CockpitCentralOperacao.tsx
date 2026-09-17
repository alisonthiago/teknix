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
          description: `Cancelado pelo comprador ou falha no envio.`,
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
          description: `Saldo zerado. Risco de pausa nos anúncios.`,
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
    <div className="bg-white border border-[#e6e6e6] rounded-2xl py-6 px-6 sm:px-8 lg:px-10 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4.5 border-b border-[#f0f0f0]">
        <div>
          <span className="text-[11px] font-medium text-[#777] uppercase tracking-wider">
            Cockpit de Operação
          </span>
          <h2 className="text-[17px] font-semibold text-[#111] mt-0.5">
            {totalActionsCount === 0 ? (
              'Operação 100% em dia'
            ) : (
              `${totalActionsCount} ações prioritárias hoje`
            )}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/pedidos"
            className="h-[38px] px-4 bg-[#0071e3] hover:bg-[#0062c4] active:bg-[#004f9e] text-white text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-none"
          >
            <Package className="w-4 h-4" />
            Ver Pedidos & Etiquetas
          </Link>

          <Link
            href="/operacao"
            className="h-[38px] px-4 bg-white hover:bg-[#F7F7F7] text-[#333] border border-[#e6e6e6] text-[13px] font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            Ver Estoque & Catálogo
          </Link>
        </div>
      </div>

      {/* 4 Clean Metric Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-5">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#777] font-normal">
            <span className="w-2 h-2 rounded-full bg-[#e74c3c]" />
            Urgente
          </div>
          <div className="text-[20px] font-semibold text-[#333] mt-0.5 tracking-tight">
            {urgentItems.length} <span className="text-[12px] font-normal text-[#999]">pendências</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#777] font-normal">
            <span className="w-2 h-2 rounded-full bg-[#f39c12]" />
            Para Enviar
          </div>
          <div className="text-[20px] font-semibold text-[#333] mt-0.5 tracking-tight">
            {toShipOrders.length} <span className="text-[12px] font-normal text-[#999]">pedidos</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#777] font-normal">
            <span className="w-2 h-2 rounded-full bg-[#1f2328]" />
            Estoque Baixo
          </div>
          <div className="text-[20px] font-semibold text-[#333] mt-0.5 tracking-tight">
            {lowStockProducts.length} <span className="text-[12px] font-normal text-[#999]">produtos</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#777] font-normal">
            <span className="w-2 h-2 rounded-full bg-[#27ae60]" />
            Expedidos
          </div>
          <div className="text-[20px] font-semibold text-[#333] mt-0.5 tracking-tight">
            {completedOrders.length} <span className="text-[12px] font-normal text-[#999]">concluídos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
