'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  X,
  Radio,
  Flame,
  ShoppingBag,
  TrendingUp,
  Package,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

interface LiveMonitorDrawerProps {
  open: boolean
  onClose: () => void
}

export default function LiveMonitorDrawer({ open, onClose }: LiveMonitorDrawerProps) {
  const [lastUpdateSeconds, setLastUpdateSeconds] = useState(0)

  useEffect(() => {
    if (!open) return
    const timer = setInterval(() => {
      setLastUpdateSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [open])

  // Polling em tempo real de 2 segundos
  const { data: liveData, loading, refetch } = useSupabaseQuery(async (supabase) => {
    setLastUpdateSeconds(0)

    const [ordersRes, productsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, marketplaces(name, code, logo), order_items(*, products(*))')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('products')
        .select('id, name, sku, stock, min_stock, cost_purchase, image_url, status')
        .order('updated_at', { ascending: false })
        .limit(30)
    ])

    return {
      orders: ordersRes.data || [],
      products: productsRes.data || []
    }
  }, [], { intervalMs: 2000 })

  // Cálculos das métricas
  const orders = liveData?.orders || []
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  const totalOrders = orders.length
  
  let totalUnits = 0
  orders.forEach(o => {
    if (o.order_items?.length) {
      o.order_items.forEach((it: any) => {
        totalUnits += Number(it.quantity) || 1
      })
    } else {
      totalUnits += 1
    }
  })

  const uniqueBuyers = new Set(orders.map(o => o.customer_name).filter(Boolean)).size || totalOrders
  const ticketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const estimatedConversion = totalOrders > 0 ? (totalOrders / (uniqueBuyers * 2.5 + 4)) * 100 : 0

  // Produtos mais vendidos
  const topProducts = useMemo(() => {
    const map = new Map<string, {
      id: string
      name: string
      sku: string
      quantity: number
      revenue: number
      imageUrl: string
      stock: number
    }>()

    orders.forEach(o => {
      if (o.order_items?.length) {
        o.order_items.forEach((it: any) => {
          const sku = it.sku || it.product_name || 'Sem SKU'
          const existing = map.get(sku) || {
            id: it.product_id || sku,
            name: it.product_name || 'Produto sem título',
            sku,
            quantity: 0,
            revenue: 0,
            imageUrl: it.products?.image_url || '/placeholder.png',
            stock: it.products?.stock ?? 0
          }
          existing.quantity += Number(it.quantity) || 1
          existing.revenue += Number(it.total_price || (it.unit_price * (it.quantity || 1))) || 0
          if (it.products?.image_url) existing.imageUrl = it.products.image_url
          if (it.products?.stock !== undefined) existing.stock = it.products.stock
          map.set(sku, existing)
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 3)
  }, [orders])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop com blur suave */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer no Canto Direito */}
      <div className="relative z-10 w-full max-w-md bg-[#f5f5f7] h-full shadow-2xl flex flex-col overflow-hidden border-l border-[#e6e6e6] animate-in slide-in-from-right duration-300">
        
        {/* Header do Drawer */}
        <div className="bg-[#FFE600] px-5 py-4 border-b border-[#E5CC00] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e74c3c] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e74c3c]"></span>
            </span>
            <span className="text-[14px] font-black text-[#111] tracking-tight uppercase flex items-center gap-1.5">
              Monitor ao Vivo
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-1.5 rounded-full hover:bg-black/10 text-[#333] transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/10 text-[#333] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Card Amarelo Ouro - Vendas de Hoje */}
          <div className="bg-[#FFE600] rounded-2xl p-5 shadow-xs border border-[#F5DC00] text-[#111] relative overflow-hidden">
            <div className="flex items-center justify-between text-[12px] font-bold text-[#333] uppercase">
              <span>Vendas de hoje</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/10 font-bold">
                {lastUpdateSeconds <= 3 ? '🔴 Ao vivo' : `há ${lastUpdateSeconds}s`}
              </span>
            </div>

            <div className="mt-3 mb-2">
              <div className="text-[32px] font-black tracking-tight text-[#111] font-sans flex items-baseline gap-1">
                <span className="text-[20px] font-bold">R$</span>
                {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] font-semibold text-[#444] mt-0.5">
                🔴 {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}, {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>

            <Link
              href="/ao-vivo"
              onClick={onClose}
              className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between text-[12px] font-bold text-[#111] hover:text-black group"
            >
              <span>Ir para o Painel ao vivo completo</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Card Métricas-Chave */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4 shadow-2xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#999] mb-3">
              Métricas-chave
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#fafafa] border border-[#f0f0f0]">
                <span className="text-[10px] font-semibold text-[#888] block">Total compradores</span>
                <span className="text-[16px] font-extrabold text-[#111] mt-0.5 block">{uniqueBuyers}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#fafafa] border border-[#f0f0f0]">
                <span className="text-[10px] font-semibold text-[#888] block">Qtd. de vendas</span>
                <span className="text-[16px] font-extrabold text-[#111] mt-0.5 block">{totalOrders}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#fafafa] border border-[#f0f0f0]">
                <span className="text-[10px] font-semibold text-[#888] block">Unidades vendidas</span>
                <span className="text-[16px] font-extrabold text-[#111] mt-0.5 block">{totalUnits} <span className="text-[11px] font-normal text-[#888]">u.</span></span>
              </div>

              <div className="p-3 rounded-xl bg-[#fafafa] border border-[#f0f0f0]">
                <span className="text-[10px] font-semibold text-[#888] block">Preço médio</span>
                <span className="text-[16px] font-extrabold text-[#111] mt-0.5 block">R$ {Math.round(ticketMedio)}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#fafafa] border border-[#f0f0f0] col-span-2">
                <span className="text-[10px] font-semibold text-[#888] block">Conversão estimada</span>
                <span className="text-[16px] font-extrabold text-[#16a34a] mt-0.5 block">{estimatedConversion.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Card Produtos Mais Vendidos */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4 shadow-2xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#999] mb-3 flex items-center justify-between">
              <span>Produtos mais vendidos</span>
              <span className="text-[10px] text-[#3483fa] font-bold">Hoje</span>
            </h4>

            {topProducts.length === 0 ? (
              <p className="text-[12px] text-[#999] py-4 text-center">Nenhum produto vendido hoje.</p>
            ) : (
              <div className="divide-y divide-[#f0f0f0]">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="py-2.5 flex items-center gap-3">
                    <span className="text-[12px] font-bold text-[#888] w-4">{idx + 1}</span>
                    <div className="w-10 h-10 rounded-xl bg-[#fafafa] border border-[#eee] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imageUrl && p.imageUrl !== '/placeholder.png' ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package className="w-4 h-4 text-[#ccc]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#222] truncate">{p.name}</p>
                      <p className="text-[10px] text-[#888]">R$ {Math.round(p.revenue / (p.quantity || 1))} | {p.quantity} u. | Estoque: {p.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimos Pedidos / Detalhes do Envio */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4 shadow-2xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#999] mb-3 flex items-center justify-between">
              <span>Últimos Envios & Pedidos</span>
              <Truck className="w-3.5 h-3.5 text-[#3483fa]" />
            </h4>

            <div className="space-y-2.5">
              {orders.slice(0, 4).map(o => (
                <div key={o.id} className="p-2.5 rounded-xl bg-[#fafafa] border border-[#eee] text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111]">{o.order_number}</span>
                    <span className="font-extrabold text-[#16a34a]">R$ {Number(o.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-[#666] truncate mt-0.5">{o.customer_name || 'Cliente'} • {o.shipping_city || 'Destino'}/{o.shipping_state || 'BR'}</p>
                  <div className="mt-1.5 pt-1.5 border-t border-[#eee] flex items-center justify-between text-[10px] text-[#888]">
                    <span>{o.shipping_method || 'Mercado Envios'}</span>
                    <span className="text-[#3483fa] font-semibold">{o.tracking_code ? `Rastreio: ${o.tracking_code}` : o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendações */}
          <div className="bg-[#f0f7ff] rounded-2xl border border-[#d0e4ff] p-4 text-[12px]">
            <h4 className="font-bold text-[#1976d2] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3483fa]" />
              Recomendações
            </h4>
            <p className="text-[#444] text-[11px] leading-relaxed">
              Mantenha os pedidos despachados até o horário limite da transportadora para manter sua reputação alta nos marketplaces.
            </p>
          </div>

        </div>

        {/* Footer do Drawer com Botão Ver Mais */}
        <div className="p-4 bg-white border-t border-[#eee] shrink-0">
          <Link
            href="/ao-vivo"
            onClick={onClose}
            className="w-full py-3 bg-[#111] hover:bg-[#222] text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-center"
          >
            <span>Ver Painel Completo ao Vivo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
