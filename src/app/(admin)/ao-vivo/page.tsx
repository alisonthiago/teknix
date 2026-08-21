'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Radio,
  Zap,
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Filter,
  Volume2,
  VolumeX,
  Store,
  CheckCircle2,
  Truck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Box,
  Tag,
  Flame,
  ArrowRight,
  Printer,
  MapPin,
  FileText
} from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { createClient } from '@/utils/supabase/client'

interface LiveEvent {
  id: string
  type: 'SALE' | 'STOCK' | 'SHIPMENT' | 'ALERT' | 'INTEGRATION'
  title: string
  description: string
  channel: string
  channelColor?: string
  amount?: number
  quantity?: number
  productName?: string
  sku?: string
  imageUrl?: string
  orderNumber?: string
  timestamp: string
  rawOrder?: any
}

export default function MonitorAoVivoPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL')
  const [shippingFilter, setShippingFilter] = useState<string>('ALL')
  const [period, setPeriod] = useState<'NOW' | 'TODAY' | '24H' | '7D' | '30D'>('TODAY')
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [lastUpdateSeconds, setLastUpdateSeconds] = useState(0)
  const previousSalesCount = useRef<number>(0)

  // Timer para o "Atualizado há X segundos"
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdateSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Consulta em tempo real (atualiza a cada 2 segundos pelo useSupabaseQuery)
  const { data: liveData, loading, refetch } = useSupabaseQuery(async (supabase) => {
    setLastUpdateSeconds(0)

    // 1. Buscar Pedidos recentes com produtos e itens
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, marketplaces(name, code, logo), order_items(*, products(*)), marketplace_accounts(account_name)')
      .order('created_at', { ascending: false })
      .limit(100)

    // 2. Buscar Vendas recentes
    const { data: salesData } = await supabase
      .from('sales')
      .select('*, marketplaces(name, code, logo), sale_items(*, products(*))')
      .order('created_at', { ascending: false })
      .limit(100)

    // 3. Buscar Produtos e Estoque
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, sku, stock, min_stock, cost_purchase, image_url, status, updated_at')
      .order('updated_at', { ascending: false })

    return {
      orders: ordersData || [],
      sales: salesData || [],
      products: productsData || []
    }
  }, [selectedChannel, period], { intervalMs: 2000 })

  // Tocar som suave de nova venda se o número de pedidos aumentar
  useEffect(() => {
    if (!liveData?.orders) return
    const currentCount = liveData.orders.length
    if (previousSalesCount.current > 0 && currentCount > previousSalesCount.current && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime)
        osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.35)
      } catch {
        // Áudio bloqueado pelo navegador
      }
    }
    previousSalesCount.current = currentCount
  }, [liveData?.orders, soundEnabled])

  // Filtragem de Pedidos e Vendas
  const filteredOrders = useMemo(() => {
    if (!liveData?.orders) return []
    const now = new Date().getTime()

    return liveData.orders.filter(order => {
      // Filtro por Canal
      if (selectedChannel !== 'ALL') {
        const mpName = (order.marketplaces?.name || '').toLowerCase()
        const channelFilter = selectedChannel.toLowerCase()
        if (!mpName.includes(channelFilter) && order.marketplace_id !== selectedChannel) {
          return false
        }
      }

      // Filtro por Status de Envio
      if (shippingFilter !== 'ALL') {
        const st = (order.status || '').toUpperCase()
        if (shippingFilter === 'TO_SHIP' && !['NOVO', 'PAGO', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO', 'SEPARADO'].includes(st)) return false
        if (shippingFilter === 'SHIPPED' && !['ENVIADO', 'EMBALADO', 'AGUARDANDO_EXPEDICAO'].includes(st)) return false
        if (shippingFilter === 'DELIVERED' && st !== 'ENTREGUE') return false
      }

      // Filtro por Período
      const orderTime = new Date(order.created_at || order.updated_at).getTime()
      const diffHours = (now - orderTime) / (1000 * 60 * 60)

      if (period === 'NOW') return diffHours <= 12
      if (period === 'TODAY') return diffHours <= 24
      if (period === '24H') return diffHours <= 24
      if (period === '7D') return diffHours <= 24 * 7
      if (period === '30D') return diffHours <= 24 * 30
      return true
    })
  }, [liveData?.orders, selectedChannel, shippingFilter, period])

  // Métricas Consolidadas
  const metrics = useMemo(() => {
    const orders = filteredOrders
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
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const salesLastHour = orders.filter(o => new Date(o.created_at).getTime() >= oneHourAgo).length
    const estimatedConversion = totalOrders > 0 ? (totalOrders / (uniqueBuyers * 2.5 + 4)) * 100 : 0

    // Envios pendentes
    const pendingShipments = orders.filter(o => ['NOVO', 'PAGO', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO'].includes(o.status)).length
    const readyToShip = orders.filter(o => ['SEPARADO', 'EMBALADO', 'AGUARDANDO_EXPEDICAO'].includes(o.status) || Boolean(o.tracking_code)).length

    return {
      totalRevenue,
      totalOrders,
      totalUnits,
      uniqueBuyers,
      ticketMedio,
      salesLastHour,
      estimatedConversion: Math.min(100, Math.max(0, estimatedConversion)),
      pendingShipments,
      readyToShip
    }
  }, [filteredOrders])

  // Ranking de Produtos Mais Vendidos
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

    filteredOrders.forEach(o => {
      if (o.order_items?.length) {
        o.order_items.forEach((it: any) => {
          const sku = it.sku || it.product_name || 'Sem SKU'
          const existing = map.get(sku) || {
            id: it.product_id || sku,
            name: it.products?.name || it.product_name || it.sku || 'Produto Mercado Livre',
            sku,
            quantity: 0,
            revenue: 0,
            imageUrl: it.products?.image_url || '/placeholder.png',
            stock: it.products?.stock ?? 0
          }
          existing.quantity += Number(it.quantity) || 1
          existing.revenue += Number(it.total_price || (it.unit_price * (it.quantity || 1))) || 0
          if (it.products?.name) existing.name = it.products.name
          if (it.products?.image_url) existing.imageUrl = it.products.image_url
          if (it.products?.stock !== undefined) existing.stock = it.products.stock
          map.set(sku, existing)
        })
      }
    })

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [filteredOrders])

  // Timeline de Eventos ao Vivo
  const liveEvents = useMemo<LiveEvent[]>(() => {
    const events: LiveEvent[] = []

    filteredOrders.forEach(o => {
      const channel = o.marketplaces?.name || 'Mercado Livre'
      const firstItem = o.order_items?.[0]
      const productName = firstItem?.product_name || `Pedido ${o.order_number}`
      const imageUrl = firstItem?.products?.image_url

      events.push({
        id: `order-${o.id}`,
        type: 'SALE',
        title: 'Nova Venda Confirmada',
        description: `${o.customer_name || 'Cliente'} comprou ${firstItem?.quantity || 1}x ${productName}`,
        channel,
        amount: Number(o.total_amount) || 0,
        quantity: firstItem?.quantity || 1,
        productName,
        sku: firstItem?.sku,
        imageUrl,
        orderNumber: o.order_number,
        timestamp: o.created_at || o.updated_at,
        rawOrder: o
      })

      if (o.tracking_code) {
        events.push({
          id: `ship-${o.id}`,
          type: 'SHIPMENT',
          title: 'Etiqueta de Envio Pronta',
          description: `Rastreio ${o.tracking_code} • ${o.shipping_city || 'Destino'}/${o.shipping_state || 'BR'}`,
          channel,
          orderNumber: o.order_number,
          timestamp: o.updated_at || o.created_at,
          rawOrder: o
        })
      }
    })

    liveData?.products?.forEach(p => {
      if (p.stock !== null && p.stock <= (p.min_stock || 3) && p.status === 'ACTIVE') {
        events.push({
          id: `stock-${p.id}`,
          type: 'ALERT',
          title: p.stock === 0 ? 'Produto Esgotado' : 'Estoque Baixo',
          description: `${p.name} possui apenas ${p.stock} unidade(s) restante(s).`,
          channel: 'TEKNIX Estoque',
          productName: p.name,
          sku: p.sku,
          imageUrl: p.image_url,
          timestamp: p.updated_at || new Date().toISOString()
        })
      }
    })

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30)
  }, [filteredOrders, liveData?.products])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* 🔴 HEADER SUPERIOR DO MONITOR AO VIVO */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-4 h-4 rounded-full bg-[#e74c3c] animate-ping opacity-75" />
            <span className="relative w-3.5 h-3.5 rounded-full bg-[#e74c3c]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] sm:text-[20px] font-black text-[#1f2328] tracking-tight">
                Monitor ao Vivo Multicanal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffebee] text-[#e74c3c] border border-[#ffcdd2] flex items-center gap-1 uppercase tracking-wider">
                <Radio className="w-3 h-3 animate-pulse" />
                Em Tempo Real (2s)
              </span>
            </div>
            <p className="text-[12px] text-[#666] mt-0.5">
              Monitoramento ao vivo de vendas, faturamento e logística de todos os marketplaces conectados.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Som Ativar / Desativar */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-[12px] font-medium border flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-[#EEFFB3]/70 border-[#d9f99d] text-[#111] font-bold hover:bg-[#EEFFB3]'
                : 'bg-[#f5f5f5] border-[#e6e6e6] text-[#888] hover:bg-[#eee]'
            }`}
            title={soundEnabled ? 'Som de nova venda ativado' : 'Som desativado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Alerta Sonoro' : 'Mudo'}</span>
          </button>

          {/* Filtro de Período */}
          <div className="flex bg-[#f5f5f5] p-1 rounded-xl border border-[#e6e6e6] text-[11px] font-semibold text-[#666]">
            {[
              { id: 'NOW', label: 'Agora' },
              { id: 'TODAY', label: 'Hoje' },
              { id: '24H', label: '24h' },
              { id: '7D', label: '7 Dias' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === p.id ? 'bg-white text-[#1f2328] shadow-2xs font-bold' : 'hover:text-[#1f2328]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-[#e6e6e6] bg-white text-[#666] hover:text-[#1f2328] hover:bg-[#fafafa] transition-colors"
            title="Atualizar agora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5c8a00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* CARD PRINCIPAL DESTAQUE (VENDAS DE HOJE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-[#B5F500] rounded-3xl p-6 sm:p-7 shadow-md border border-[#a2e000] text-[#1f2328] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#333] uppercase tracking-wide flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#e74c3c]" />
                Vendas {period === 'NOW' ? 'ao Vivo' : period === 'TODAY' ? 'de Hoje' : 'do Período'}
              </span>
              
              <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-black/10 text-[#333]">
                <span className="w-2 h-2 rounded-full bg-[#e74c3c] animate-pulse" />
                {lastUpdateSeconds <= 3 ? 'Atualizado agora' : `Atualizado há ${lastUpdateSeconds}s`}
              </span>
            </div>

            <div className="mt-4 mb-3">
              <div className="text-[34px] sm:text-[46px] font-black tracking-tight text-[#111] font-sans flex items-baseline gap-2">
                <span className="text-[22px] sm:text-[28px] font-bold">R$</span>
                {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#444] mt-1">
                <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}, {new Date().toLocaleTimeString('pt-BR')}</span>
                <span>•</span>
                <span>{metrics.totalOrders} pedidos confirmados</span>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-[12px] font-bold text-[#333]">
                <span>{metrics.totalUnits} itens</span>
                <span>{metrics.uniqueBuyers} compradores</span>
                <span>{metrics.pendingShipments} para despachar</span>
              </div>

              <Link
                href="/pedidos"
                className="px-4 py-2 rounded-xl bg-black text-white text-[12px] font-bold hover:bg-[#333] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Painel de Expedição</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 📊 GRID DE MÉTRICAS-CHAVE */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#999] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5c8a00]" />
              Métricas de Vendas & Operação
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Total Compradores</span>
                <span className="text-[20px] font-extrabold text-[#1f2328] mt-1 block">{metrics.uniqueBuyers}</span>
                <span className="text-[10px] text-[#38a169] font-medium">Clientes únicos</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Qtd. de Vendas</span>
                <span className="text-[20px] font-extrabold text-[#1f2328] mt-1 block">{metrics.totalOrders}</span>
                <span className="text-[10px] text-[#5c8a00] font-bold">Pedidos faturados</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Itens Vendidos</span>
                <span className="text-[20px] font-extrabold text-[#1f2328] mt-1 block">{metrics.totalUnits} <span className="text-[12px] font-normal text-[#888]">u.</span></span>
                <span className="text-[10px] text-[#666] font-medium">Unidades totais</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Ticket Médio</span>
                <span className="text-[20px] font-extrabold text-[#1f2328] mt-1 block">R$ {Math.round(metrics.ticketMedio)}</span>
                <span className="text-[10px] text-[#888] font-medium">Valor médio</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Para Despachar</span>
                <span className="text-[20px] font-extrabold text-[#e67e22] mt-1 block">{metrics.pendingShipments}</span>
                <span className="text-[10px] text-[#e67e22] font-medium">Aguardando envio</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Etiquetas Prontas</span>
                <span className="text-[20px] font-extrabold text-[#38a169] mt-1 block">{metrics.readyToShip}</span>
                <span className="text-[10px] text-[#38a169] font-medium">Rastreio gerado</span>
              </div>
            </div>
          </div>

          {/* 🚚 DETALHES COMPLETOS DE ENVIO E EXPEDIÇÃO AO VIVO */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0] pb-4">
              <div>
                <h3 className="text-[15px] font-bold text-[#1f2328] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#5c8a00]" />
                  Logística & Detalhes de Envio ao Vivo
                </h3>
                <p className="text-[12px] text-[#666] mt-0.5">
                  Acompanhe etiquetas, prazos, código de rastreamento e endereço de cada entrega.
                </p>
              </div>

              {/* Filtros de Envio */}
              <div className="flex items-center gap-1.5 bg-[#f5f5f5] p-1 rounded-xl text-[11px] font-semibold text-[#666]">
                {[
                  { id: 'ALL', label: 'Todos' },
                  { id: 'TO_SHIP', label: 'A Enviar' },
                  { id: 'SHIPPED', label: 'Em Trânsito' },
                  { id: 'DELIVERED', label: 'Entregues' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setShippingFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      shippingFilter === f.id ? 'bg-white text-[#5c8a00] shadow-2xs font-bold' : 'hover:text-[#111]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#fafafa] rounded-xl border border-dashed border-[#e0e0e0]">
                <p className="text-[13px] text-[#888]">Nenhum pedido encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-[#fafafa] text-[#888] font-bold uppercase text-[10px] border-b border-[#eee]">
                      <th className="py-2.5 px-3">Canal & Pedido</th>
                      <th className="py-2.5 px-3">Cliente / Destino</th>
                      <th className="py-2.5 px-3">Itens Comprados</th>
                      <th className="py-2.5 px-3">Modalidade & Rastreio</th>
                      <th className="py-2.5 px-3 text-right">Valor</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee]">
                    {filteredOrders.map(o => (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        className="hover:bg-[#f8faff] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <MarketplaceLogo name={o.marketplaces?.name || 'Mercado Livre'} className="w-4 h-4 shrink-0" />
                            <div>
                              <span className="font-bold text-[#1f2328] block">{o.order_number}</span>
                              <span className="text-[10px] text-[#888]">
                                {new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#333] block truncate max-w-[140px]">{o.customer_name || 'Cliente'}</span>
                          <span className="text-[11px] text-[#777] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#999]" />
                            {o.shipping_city || 'São Paulo'} - {o.shipping_state || 'SP'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-medium text-[#444] block truncate max-w-[180px]">
                            {o.order_items?.[0]?.product_name || 'Produto Mercado Livre'}
                          </span>
                          <span className="text-[10px] text-[#888]">
                            SKU: {o.order_items?.[0]?.sku || 'S/ SKU'} {o.order_items?.length > 1 ? `(+${o.order_items.length - 1} itens)` : ''}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-[#333] block text-[11px]">{o.shipping_method || 'Mercado Envios'}</span>
                          <span className="text-[10px] font-mono text-[#5c8a00] font-bold">
                            {o.tracking_code || 'Aguardando Etiqueta'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span className="font-extrabold text-[#16a34a] text-[13px] block">
                            R$ {Number(o.total_amount || 0).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-[#888]">
                            Frete: {o.shipping_cost > 0 ? `R$ ${Number(o.shipping_cost).toFixed(2)}` : 'Grátis'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            o.status === 'ENTREGUE'
                              ? 'bg-[#e8f5e9] text-[#2e7d32]'
                              : o.status === 'ENVIADO'
                              ? 'bg-[#e3f2fd] text-[#1976d2]'
                              : o.status === 'CANCELADO'
                              ? 'bg-[#ffebee] text-[#c62828]'
                              : 'bg-[#fff8e1] text-[#f57f17]'
                          }`}>
                            {o.status || 'PAGO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Coluna Direita: Canais e Feed de Eventos */}
        <div className="lg:col-span-4 space-y-6">

          {/* 🟢 CANAIS CONECTADOS AO VIVO */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#999] mb-3 flex items-center justify-between">
              <span>Canais ao Vivo</span>
              <span className="flex items-center gap-1 text-[10px] text-[#38a169] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#38a169] animate-pulse" />
                Sincronizando
              </span>
            </h3>

            <div className="space-y-2">
              {[
                { id: 'ALL', name: 'Todos os Canais', count: metrics.totalOrders },
                { id: 'Mercado Livre', name: 'Mercado Livre', count: filteredOrders.filter(o => o.marketplaces?.name?.includes('Mercado') || !o.marketplaces).length },
                { id: 'Shopee', name: 'Shopee', count: filteredOrders.filter(o => o.marketplaces?.name?.includes('Shopee')).length },
                { id: 'TikTok', name: 'TikTok Shop', count: 0 },
                { id: 'Magalu', name: 'Magalu', count: 0 }
              ].map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedChannel(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedChannel === c.id
                      ? 'border-[#3483fa] bg-[#f0f7ff]'
                      : 'border-[#f0f0f0] hover:border-[#ddd] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {c.id !== 'ALL' && <MarketplaceLogo name={c.name} className="w-5 h-5 shrink-0" />}
                    <span className="text-[12px] font-bold text-[#333]">{c.name}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fafafa] border border-[#eee] text-[#555]">
                    {c.count} pedidos
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 🔴 TIMELINE / FEED AO VIVO */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs flex flex-col h-[460px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#999] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e74c3c] animate-ping" />
                Feed Operacional ao Vivo
              </h3>
              <span className="text-[11px] text-[#888] font-medium">{liveEvents.length} eventos</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-[#f5f5f5]">
              {liveEvents.length === 0 ? (
                <div className="py-12 text-center text-[12px] text-[#999]">
                  Aguardando novas notificações dos marketplaces...
                </div>
              ) : (
                liveEvents.map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => evt.rawOrder && setSelectedOrder(evt.rawOrder)}
                    className="pt-3 flex items-start gap-3 cursor-pointer group hover:bg-[#fafafa] p-2 rounded-xl transition-all"
                  >
                    <div className="mt-0.5">
                      {evt.type === 'SALE' ? (
                        <div className="w-8 h-8 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      ) : evt.type === 'SHIPMENT' ? (
                        <div className="w-8 h-8 rounded-full bg-[#e3f2fd] text-[#1976d2] flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#fff3e0] text-[#e65100] flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[12px] font-bold text-[#1f2328] truncate group-hover:text-[#3483fa] transition-colors">
                          {evt.title}
                        </span>
                        <span className="text-[10px] text-[#999] shrink-0">
                          {new Date(evt.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#666] line-clamp-2 mt-0.5 leading-relaxed">
                        {evt.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-[#888]">
                        <span className="px-1.5 py-0.5 bg-[#f0f0f0] rounded text-[#555]">{evt.channel}</span>
                        {evt.amount && (
                          <span className="text-[#16a34a] font-bold">R$ {evt.amount.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 🏆 PRODUTOS CAMPEÕES */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#999] mb-3">
              Campeões de Vendas Hoje
            </h3>

            <div className="divide-y divide-[#f0f0f0]">
              {topProducts.map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/produtos/${p.id}`}
                  className="py-2.5 flex items-center gap-3 hover:bg-[#fafafa] -mx-2 px-2 rounded-xl transition-colors group cursor-pointer"
                >
                  <span className="text-[12px] font-extrabold text-[#888]">{idx + 1}</span>
                  <div className="w-10 h-10 rounded-xl bg-[#fafafa] border border-[#eee] p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-[#3483fa] transition-colors">
                    {p.imageUrl && p.imageUrl !== '/placeholder.png' ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-4 h-4 text-[#ccc]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-[#222] group-hover:text-[#3483fa] transition-colors truncate">{p.name}</p>
                    <p className="text-[10px] text-[#888]">{p.quantity} un. • R$ {p.revenue.toFixed(2)}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#ccc] group-hover:text-[#3483fa] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 📦 MODAL DETALHE COMPLETO DO PEDIDO */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#e6e6e6] max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#eee] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#999]">Detalhes do Pedido & Envio</span>
                <h3 className="text-[18px] font-black text-[#1f2328]">{selectedOrder.order_number}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-[#999] hover:text-[#333] hover:bg-[#f5f5f5] rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 bg-[#fafafa] rounded-xl border border-[#eee]">
                <span className="text-[10px] text-[#888] font-bold uppercase block">Marketplace</span>
                <span className="font-bold text-[#333]">{selectedOrder.marketplaces?.name || 'Mercado Livre'}</span>
              </div>
              <div className="p-3 bg-[#fafafa] rounded-xl border border-[#eee]">
                <span className="text-[10px] text-[#888] font-bold uppercase block">Status</span>
                <span className="font-bold text-[#3483fa]">{selectedOrder.status}</span>
              </div>
              <div className="p-3 bg-[#fafafa] rounded-xl border border-[#eee]">
                <span className="text-[10px] text-[#888] font-bold uppercase block">Comprador</span>
                <span className="font-bold text-[#333]">{selectedOrder.customer_name || 'Cliente'}</span>
              </div>
              <div className="p-3 bg-[#fafafa] rounded-xl border border-[#eee]">
                <span className="text-[10px] text-[#888] font-bold uppercase block">Valor Total</span>
                <span className="font-bold text-[#16a34a] text-[14px]">R$ {Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Endereço e Logística */}
            <div className="p-3.5 bg-[#f0f7ff] rounded-xl border border-[#b8daff] text-[12px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1976d2] flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  Dados de Envio & Rastreamento
                </span>
                <span className="text-[11px] font-bold text-[#3483fa]">{selectedOrder.shipping_method || 'Mercado Envios'}</span>
              </div>
              <p className="text-[#333]"><strong>Destinatário / Endereço:</strong> {selectedOrder.shipping_address || 'Endereço registrado no marketplace'}</p>
              <p className="text-[#333]"><strong>Cidade/UF:</strong> {selectedOrder.shipping_city || 'São Paulo'} - {selectedOrder.shipping_state || 'SP'} (CEP: {selectedOrder.shipping_zip || '00000-000'})</p>
              <p className="text-[#333]"><strong>Código de Rastreio:</strong> <span className="font-mono font-bold text-[#1976d2]">{selectedOrder.tracking_code || 'Gerando etiqueta...'}</span></p>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-[#333] mb-2 uppercase tracking-wide">Produtos no Pedido:</h4>
              <div className="space-y-2">
                {selectedOrder.order_items?.map((it: any) => (
                  <div key={it.id} className="p-3 bg-[#fafafa] rounded-xl border border-[#eee] flex items-center justify-between text-[12px]">
                    <div>
                      <span className="font-bold text-[#333] block">{it.product_name}</span>
                      <span className="text-[11px] text-[#888]">SKU: {it.sku} • Qtd: {it.quantity} un.</span>
                    </div>
                    <span className="font-bold text-[#1f2328]">R$ {Number(it.total_price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#eee] flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-[#f0f0f0] text-[#333] font-bold text-[12px] rounded-xl hover:bg-[#e6e6e6]"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
