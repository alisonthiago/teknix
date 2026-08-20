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
    <div className="bg-white border border-[#e6e6e6] rounded-md p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#f0f0f0]">
        <div>
          <span className="text-[11px] font-bold text-[#5c8a00] uppercase tracking-wider">
            Cockpit de Operação
          </span>
          <h2 className="text-[18px] font-bold text-[#333] mt-0.5">
            {totalActionsCount === 0 ? (
              'Operação 100% em dia'
            ) : (
              `Atenção: Existem ${totalActionsCount} ações operacionais prioritárias hoje`
            )}
          </h2>
          <p className="text-[12px] text-[#666] mt-0.5">
            Monitoramento em tempo real de pedidos, separação, etiquetas e estoque.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/pedidos"
            className="px-4 py-2 bg-[#B5F500] hover:bg-[#a3e600] text-[#111] text-[12px] font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-[#a2e000] shadow-2xs"
          >
            <Package className="w-3.5 h-3.5" />
            Ver Pedidos & Etiquetas
          </Link>

          <Link
            href="/operacao"
            className="px-4 py-2 bg-[#EEFFB3]/60 hover:bg-[#EEFFB3] text-[#111] text-[12px] font-bold rounded-xl transition-colors border border-[#d9f99d]"
          >
            Ver Estoque & Catálogo
          </Link>
        </div>
      </div>

      {/* 4 Clean Metric Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#666] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#e74c3c]" />
            Urgente
          </div>
          <div className="text-[22px] font-bold text-[#333] mt-0.5">
            {urgentItems.length} <span className="text-[12px] font-normal text-[#999]">pendências</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#666] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#f39c12]" />
            Para Enviar
          </div>
          <div className="text-[22px] font-bold text-[#333] mt-0.5">
            {toShipOrders.length} <span className="text-[12px] font-normal text-[#999]">pedidos</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#666] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#3483fa]" />
            Estoque Baixo
          </div>
          <div className="text-[22px] font-bold text-[#333] mt-0.5">
            {lowStockProducts.length} <span className="text-[12px] font-normal text-[#999]">produtos</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#666] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#27ae60]" />
            Expedidos
          </div>
          <div className="text-[22px] font-bold text-[#333] mt-0.5">
            {completedOrders.length} <span className="text-[12px] font-normal text-[#999]">concluídos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
