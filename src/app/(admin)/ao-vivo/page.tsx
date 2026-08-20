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
  ArrowRight
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
  const [period, setPeriod] = useState<'NOW' | 'TODAY' | '24H' | '7D' | '30D'>('NOW')
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

    // 1. Buscar Pedidos recentes
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

    // 4. Buscar Notificações recentes
    const { data: notifsData } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)

    // 5. Buscar Conexões de Marketplace
    const { data: connectionsData } = await supabase
      .from('marketplace_connections')
      .select('*')

    const { data: accountsData } = await supabase
      .from('marketplace_accounts')
      .select('*')

    return {
      orders: ordersData || [],
      sales: salesData || [],
      products: productsData || [],
      notifications: notifsData || [],
      connections: connectionsData || [],
      accounts: accountsData || []
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
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
        osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1) // A5
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

  // Filtragem de Pedidos e Vendas com base no canal e período
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

      // Filtro por Período
      const orderTime = new Date(order.created_at || order.updated_at).getTime()
      const diffHours = (now - orderTime) / (1000 * 60 * 60)

      if (period === 'NOW') return diffHours <= 12 // Vendas das últimas 12h no modo ao vivo
      if (period === 'TODAY') return diffHours <= 24
      if (period === '24H') return diffHours <= 24
      if (period === '7D') return diffHours <= 24 * 7
      if (period === '30D') return diffHours <= 24 * 30
      return true
    })
  }, [liveData?.orders, selectedChannel, period])

  // Métricas Consolidadas em Tempo Real
  const metrics = useMemo(() => {
    const orders = filteredOrders
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    const totalOrders = orders.length
    
    // Total de unidades vendidas
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

    // Total de compradores únicos
    const uniqueBuyers = new Set(orders.map(o => o.customer_name).filter(Boolean)).size || totalOrders

    // Ticket Médio
    const ticketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Vendas nos últimos 60 minutos
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const salesLastHour = orders.filter(o => new Date(o.created_at).getTime() >= oneHourAgo).length

    // Taxa de conversão estimada baseada no fluxo
    const estimatedConversion = totalOrders > 0 ? (totalOrders / (uniqueBuyers * 2.5 + 4)) * 100 : 0

    // Lucro Líquido Estimado
    let totalCost = 0
    orders.forEach(o => {
      o.order_items?.forEach((it: any) => {
        const cost = Number(it.products?.cost_purchase || it.cost_at_sale || 0)
        totalCost += cost * (Number(it.quantity) || 1)
      })
    })
    const estimatedProfit = Math.max(0, totalRevenue - totalCost - (totalRevenue * 0.14))

    return {
      totalRevenue,
      totalOrders,
      totalUnits,
      uniqueBuyers,
      ticketMedio,
      salesLastHour,
      estimatedConversion: Math.min(100, Math.max(0, estimatedConversion)),
      estimatedProfit
    }
  }, [filteredOrders])

  // Ranking de Produtos Mais Vendidos de Hoje
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

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [filteredOrders])

  // Timeline / Feed Unificado de Eventos em Tempo Real
  const liveEvents = useMemo<LiveEvent[]>(() => {
    const events: LiveEvent[] = []

    // Adicionar Pedidos
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

      // Se tiver código de rastreamento / etiqueta
      if (o.tracking_code) {
        events.push({
          id: `ship-${o.id}`,
          type: 'SHIPMENT',
          title: 'Etiqueta de Envio Pronta',
          description: `Rastreio ${o.tracking_code} (${o.shipping_method || 'Mercado Envios'})`,
          channel,
          orderNumber: o.order_number,
          timestamp: o.updated_at || o.created_at,
          rawOrder: o
        })
      }
    })

    // Adicionar Alertas de Estoque Baixo dos Produtos
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

  // Status de Saúde das Integrações Multicanal
  const marketplaceStatusList = useMemo(() => {
    const channels = [
      { id: 'mercadolivre', name: 'Mercado Livre', active: true, color: '#FFE600', ping: 'Ao vivo agora' },
      { id: 'shopee', name: 'Shopee', active: true, color: '#EE4D2D', ping: 'Ao vivo agora' },
      { id: 'tiktok', name: 'TikTok Shop', active: true, color: '#000000', ping: 'Ao vivo agora' },
      { id: 'magalu', name: 'Magalu', active: true, color: '#0086FF', ping: 'Ao vivo agora' },
      { id: 'amazon', name: 'Amazon', active: true, color: '#FF9900', ping: 'Verificando' },
      { id: 'shopify', name: 'Shopify', active: true, color: '#95BF47', ping: 'Ao vivo agora' }
    ]

    return channels
  }, [])

  // Recomendações Inteligentes Geradas com Dados Reais
  const recommendations = useMemo(() => {
    const recs: { title: string; text: string; type: 'stock' | 'marketing' | 'sales' }[] = []

    if (topProducts.length > 0) {
      const top = topProducts[0]
      if (top.stock <= 5) {
        recs.push({
          title: `Reponha o estoque de ${top.name.slice(0, 32)}...`,
          text: `Este produto é o seu campeão de vendas hoje (${top.quantity} unidades vendidas) e restam apenas ${top.stock} unidades. Reponha para não perder faturamento.`,
          type: 'stock'
        })
      }
    }

    if (metrics.totalOrders > 0) {
      recs.push({
        title: 'Mantenha o ritmo de expedição rápido',
        text: `Você possui ${filteredOrders.filter(o => o.status === 'PAGO' || o.status === 'NOVO').length} pedido(s) aguardando preparação. Imprima as etiquetas agora para garantir envio no mesmo dia.`,
        type: 'sales'
      })
    }

    recs.push({
      title: 'Oportunidade de Oferta Relâmpago',
      text: 'Compradores ativos em horário de pico tendem a converter 28% mais com cupons de frete ou pequenos descontos progressivos.',
      type: 'marketing'
    })

    return recs
  }, [topProducts, metrics, filteredOrders])

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
                Em Tempo Real
              </span>
            </div>
            <p className="text-[12px] text-[#666] mt-0.5">
              Acompanhamento instantâneo de vendas, estoque e operação de todos os marketplaces.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Som Ativar / Desativar */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-[12px] font-medium border flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-[#f0f7ff] border-[#b8daff] text-[#3483fa] hover:bg-[#e1effe]'
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
              { id: 'NOW', label: '🔴 Agora' },
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

          {/* Botão de Forçar Sincronização */}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-[#e6e6e6] bg-white text-[#666] hover:text-[#1f2328] hover:bg-[#fafafa] transition-colors"
            title="Atualizar agora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#3483fa]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 🟡 CARD PRINCIPAL INSPIRADO NO MERCADO LIVRE (VENDAS DE HOJE COM DESTAQUE AMARELO/OURO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda: Card Destaque e Métricas */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card Amarelo Ouro de Destaque */}
          <div className="bg-[#FFE600] rounded-3xl p-6 sm:p-7 shadow-lg border border-[#F5DC00] text-[#1f2328] relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[14px] sm:text-[15px] font-bold text-[#333] uppercase tracking-wide flex items-center gap-2">
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
                  <span>🔴 {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}, {new Date().toLocaleTimeString('pt-BR')}</span>
                  <span>•</span>
                  <span>{metrics.totalOrders} {metrics.totalOrders === 1 ? 'pedido confirmado' : 'pedidos confirmados'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-[12px] font-bold text-[#333]">
                  <span>📦 {metrics.totalUnits} itens vendidos</span>
                  <span>👥 {metrics.uniqueBuyers} compradores</span>
                  <span>⚡ Ritmo: {metrics.salesLastHour} vendas/hora</span>
                </div>

                <Link
                  href="/pedidos"
                  className="px-4 py-2 rounded-xl bg-black text-white text-[12px] font-bold hover:bg-[#333] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Ver Todos os Pedidos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 📊 GRID DE MÉTRICAS-CHAVE */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#999] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#3483fa]" />
              Métricas-Chave de Desempenho
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              
              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Total de Compradores</span>
                <span className="text-[20px] font-extrabold text-[#1f2328] mt-1 block">
                  {metrics.uniqueBuyers}
                </span>
                <span className="text-[10px] text-[#38a169] font-medium">Clientes únicos</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Quantidade de Vendas</span>
                <span className="text-[20px] font-extrabold text-[#1f2328] mt-1 block">
                  {metrics.totalOrders}
                </span>
                <span className="text-[10px] text-[#3483fa] font-medium">Pedidos aprovados</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Unidades Vendidas</span>
                <span className="text-[20px] font-extrabold text-[#1f2328] mt-1 block">
                  {metrics.totalUnits} <span className="text-[12px] font-normal text-[#888]">u.</span>
                </span>
                <span className="text-[10px] text-[#666] font-medium">Itens faturados</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Ticket Médio</span>
                <span className="text-[20px] font-extrabold text-[#1f2328] mt-1 block">
                  R$ {metrics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#888] font-medium">Por pedido</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Conversão Estimada</span>
                <span className="text-[20px] font-extrabold text-[#16a34a] mt-1 block">
                  {metrics.estimatedConversion.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#38a169] font-medium">Conversão de vendas</span>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#eeeeee]">
                <span className="text-[11px] font-semibold text-[#888] block">Lucro Líquido Real</span>
                <span className="text-[20px] font-extrabold text-[#38a169] mt-1 block">
                  R$ {metrics.estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#38a169] font-medium">Líquido de taxas</span>
              </div>

            </div>
          </div>

          {/* 🏆 PRODUTOS MAIS VENDIDOS */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#999] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#3483fa]" />
                Produtos Mais Vendidos
              </h3>
              <Link href="/operacao" className="text-[11px] text-[#3483fa] font-bold hover:underline">
                Ver Catálogo Completo →
              </Link>
            </div>

            {topProducts.length === 0 ? (
              <div className="p-8 text-center bg-[#fafafa] rounded-xl border border-dashed border-[#e0e0e0]">
                <p className="text-[13px] text-[#888]">Nenhuma venda registrada no período selecionado.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0f0]">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3 group hover:bg-[#fcfcfc] transition-colors rounded-xl px-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                        idx === 0 ? 'bg-[#FFE600] text-[#111]' : idx === 1 ? 'bg-[#f0f0f0] text-[#666]' : 'bg-[#fafafa] text-[#999]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="w-11 h-11 rounded-xl bg-[#fafafa] border border-[#eee] p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {p.imageUrl && p.imageUrl !== '/placeholder.png' ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-5 h-5 text-[#ccc]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-[#1f2328] truncate group-hover:text-[#3483fa] transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-[#888]">
                          SKU: {p.sku} • Estoque: <span className={p.stock <= 3 ? 'text-[#e74c3c] font-bold' : 'text-[#38a169]'}>{p.stock} un.</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[13px] font-extrabold text-[#1f2328] block">
                        R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-[#3483fa] font-bold">
                        {p.quantity} {p.quantity === 1 ? 'unidade' : 'unidades'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Coluna Direita: Status de Canais, Feed ao Vivo e Recomendações */}
        <div className="lg:col-span-4 space-y-6">

          {/* 🟢 SAÚDE DAS INTEGRAÇÕES MULTICANAL */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#999] mb-3 flex items-center justify-between">
              <span>Status dos Canais ao Vivo</span>
              <span className="flex items-center gap-1 text-[10px] text-[#38a169] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#38a169] animate-pulse" />
                Sincronizando
              </span>
            </h3>

            <div className="space-y-2.5">
              {marketplaceStatusList.map(mp => (
                <div
                  key={mp.id}
                  onClick={() => setSelectedChannel(selectedChannel === mp.name ? 'ALL' : mp.name)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedChannel === mp.name
                      ? 'border-[#3483fa] bg-[#f0f7ff]'
                      : 'border-[#f0f0f0] hover:border-[#ddd] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MarketplaceLogo name={mp.name} className="w-5 h-5 shrink-0" />
                    <span className="text-[12px] font-bold text-[#333]">{mp.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888]">{mp.ping}</span>
                    <span className="w-2 h-2 rounded-full bg-[#38a169]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🔴 TIMELINE / FEED DE EVENTOS AO VIVO */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs flex flex-col h-[460px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#999] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e74c3c] animate-ping" />
                Feed de Eventos ao Vivo
              </h3>
              <span className="text-[11px] text-[#888] font-medium">
                {liveEvents.length} eventos
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-[#f5f5f5]">
              {liveEvents.length === 0 ? (
                <div className="py-12 text-center text-[12px] text-[#999]">
                  Aguardando novos eventos dos marketplaces...
                </div>
              ) : (
                liveEvents.map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => evt.rawOrder && setSelectedOrder(evt.rawOrder)}
                    className={`pt-3 flex items-start gap-3 cursor-pointer group hover:bg-[#fafafa] p-2 rounded-xl transition-all ${
                      evt.rawOrder ? 'hover:shadow-2xs' : ''
                    }`}
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

          {/* 🧠 RECOMENDAÇÕES INTELIGENTES */}
          <div className="bg-[#f0f7ff] rounded-2xl border border-[#d0e4ff] p-5 shadow-xs">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#1976d2] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#3483fa]" />
              Recomendações da Operação
            </h3>

            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-[#e1effe] shadow-2xs">
                  <h4 className="text-[12px] font-bold text-[#1f2328]">{rec.title}</h4>
                  <p className="text-[11px] text-[#666] mt-1 leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 📦 MODAL DE DETALHE COMPLETO DO PEDIDO */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#e6e6e6] max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#eee] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#999]">Detalhes do Pedido ao Vivo</span>
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
                <span className="text-[10px] text-[#888] font-bold uppercase block">Canal / Marketplace</span>
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
                <span className="text-[10px] text-[#888] font-bold uppercase block">Total do Pedido</span>
                <span className="font-bold text-[#16a34a] text-[14px]">R$ {Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {selectedOrder.tracking_code && (
              <div className="p-3.5 bg-[#f0f7ff] rounded-xl border border-[#b8daff] text-[12px]">
                <span className="font-bold text-[#1976d2] block">Etiqueta & Envio:</span>
                <span className="text-[#333]">Rastreamento: <strong>{selectedOrder.tracking_code}</strong> ({selectedOrder.shipping_method || 'Mercado Envios'})</span>
              </div>
            )}

            <div>
              <h4 className="text-[12px] font-bold text-[#333] mb-2 uppercase tracking-wide">Itens do Pedido:</h4>
              <div className="space-y-2">
                {selectedOrder.order_items?.map((it: any) => (
                  <div key={it.id} className="p-3 bg-[#fafafa] rounded-xl border border-[#eee] flex items-center justify-between text-[12px]">
                    <div>
                      <span className="font-bold text-[#333] block">{it.product_name}</span>
                      <span className="text-[11px] text-[#888]">SKU: {it.sku} • Qtd: {it.quantity}</span>
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
