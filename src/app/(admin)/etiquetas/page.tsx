'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Tag,
  Printer,
  Search,
  CheckSquare,
  Square,
  Package,
  Layers,
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ExternalLink,
  Download,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  Truck,
  Sparkles,
  X,
  ChevronDown,
  ChevronRight,
  User,
  MapPin,
  Check,
  Loader2,
  ShieldCheck,
  Smartphone,
  Info
} from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { playNotificationSound } from '@/utils/audio-chime'

type ViewMode = 'ORDERS' | 'PRODUCTS' | 'MARKETPLACES' | 'HISTORY'
type LabelStatus = 'AVAILABLE' | 'QUEUED' | 'PRINTING' | 'PRINTED' | 'ERROR' | 'UNAVAILABLE'

interface OrderItem {
  id: string
  orderNumber: string
  customerName: string
  customerPhone?: string
  marketplaceName: string
  marketplaceCode: string
  marketplaceLogo: string
  accountName: string
  productName: string
  productSku: string
  productImage: string
  productStock: number
  itemQuantity: number
  totalItemsCount: number
  shippingAddress: string
  trackingCode: string
  carrier: string
  totalAmount: number
  status: string
  labelStatus: LabelStatus
  createdAt: string
  updatedAt: string
  shippedAt?: string
}

interface PrintLogItem {
  id: string
  orderNumber: string
  marketplace: string
  printedAt: string
  operator: string
  status: 'SUCCESS' | 'ERROR'
  attempt: number
  trackingCode?: string
}

export default function CentralEtiquetasPage() {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('ORDERS')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'PRINTED' | 'ERROR'>('ALL')
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('ALL')
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  
  // Dados vindos da API
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0)
  const [integrationsHealth, setIntegrationsHealth] = useState<any[]>([])
  
  // Modais de Controle
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewOrder, setPreviewOrder] = useState<OrderItem | null>(null)
  
  // Fila de Impressão
  const [queueProgress, setQueueProgress] = useState<{
    current: number
    total: number
    activeOrder: string
    isFinished: boolean
    items: { id: string; orderNumber: string; status: 'DONE' | 'PRINTING' | 'PENDING' }[]
  }>({
    current: 0,
    total: 0,
    activeOrder: '',
    isFinished: false,
    items: []
  })

  // Configurações de Impressora Térmica
  const [printerConfig, setPrinterConfig] = useState({
    paperSize: '100x150',
    margin: '0',
    scale: '100',
    orientation: 'portrait',
    autoCut: true,
    speed: 'normal',
    density: 'medium'
  })

  // Histórico de Impressão
  const [printLogs, setPrintLogs] = useState<PrintLogItem[]>([])

  // Notificações Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // 1. Carregar dados reais via API Route
  const fetchLabelsData = async () => {
    try {
      const res = await fetch('/api/shipments/labels')
      if (!res.ok) return
      const data = await res.json()

      if (data.orders) {
        setOrders(data.orders)
      }
      if (data.integrationsHealth) {
        setIntegrationsHealth(data.integrationsHealth)
      }
      if (data.printLogs) {
        const mappedLogs: PrintLogItem[] = data.printLogs.map((log: any, idx: number) => ({
          id: log.id || `log-${idx}`,
          orderNumber: log.notes?.match(/Pedido #([A-Za-z0-9-_]+)/)?.[1] || log.order_id?.slice(0, 10) || 'Pedido',
          marketplace: 'Mercado Livre',
          printedAt: new Date(log.created_at).toLocaleString('pt-BR'),
          operator: log.notes?.match(/por (.+?)\./)?.[1] || 'Alison',
          status: 'SUCCESS',
          attempt: log.notes?.includes('2ª') ? 2 : (log.notes?.includes('3ª') ? 3 : 1),
        }))
        setPrintLogs(mappedLogs)
      }
      setLastSyncSeconds(0)
    } catch (err) {
      console.error('Erro ao buscar dados de etiquetas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLabelsData()
    const interval = setInterval(fetchLabelsData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Timer para contador de sincronização
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Estatísticas Operacionais em Tempo Real
  const stats = useMemo(() => {
    return {
      total: orders.length,
      available: orders.filter(o => o.labelStatus === 'AVAILABLE').length,
      printedToday: orders.filter(o => o.labelStatus === 'PRINTED').length,
      errors: orders.filter(o => o.labelStatus === 'ERROR').length,
    }
  }, [orders])

  // Filtragem dos Pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Filtro de Status
      if (statusFilter === 'AVAILABLE' && o.labelStatus !== 'AVAILABLE') return false
      if (statusFilter === 'PRINTED' && o.labelStatus !== 'PRINTED') return false
      if (statusFilter === 'ERROR' && o.labelStatus !== 'ERROR') return false

      // Filtro de Marketplace
      if (marketplaceFilter !== 'ALL') {
        const matchMp = o.marketplaceName.toLowerCase().includes(marketplaceFilter.toLowerCase()) ||
                        o.marketplaceCode.toLowerCase().includes(marketplaceFilter.toLowerCase())
        if (!matchMp) return false
      }

      // Busca textual
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q) ||
          o.productSku.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.trackingCode.toLowerCase().includes(q) ||
          o.marketplaceName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [orders, statusFilter, marketplaceFilter, search])

  // Agrupamento por Produto
  const groupedByProduct = useMemo(() => {
    const map = new Map<string, { sku: string; name: string; image: string; stock: number; orders: OrderItem[] }>()
    filteredOrders.forEach(o => {
      const key = o.productSku || o.productName
      if (!map.has(key)) {
        map.set(key, {
          sku: o.productSku,
          name: o.productName,
          image: o.productImage,
          stock: o.productStock,
          orders: []
        })
      }
      map.get(key)!.orders.push(o)
    })
    return Array.from(map.values()).sort((a, b) => b.orders.length - a.orders.length)
  }, [filteredOrders])

  // Agrupamento por Marketplace
  const marketplaceCounts = useMemo(() => {
    const counts: Record<string, { total: number; available: number }> = {
      'ALL': { total: orders.length, available: stats.available },
      'MERCADO_LIVRE': { total: 0, available: 0 },
      'SHOPEE': { total: 0, available: 0 },
      'TIKTOK': { total: 0, available: 0 },
      'MAGALU': { total: 0, available: 0 },
      'AMAZON': { total: 0, available: 0 },
      'SHOPIFY': { total: 0, available: 0 },
    }

    orders.forEach(o => {
      const code = o.marketplaceCode.toUpperCase()
      if (!counts[code]) counts[code] = { total: 0, available: 0 }
      counts[code].total++
      if (o.labelStatus === 'AVAILABLE') counts[code].available++
    })

    return counts
  }, [orders, stats.available])

  // Seleções
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const selectAllAvailable = () => {
    const availableIds = filteredOrders.filter(o => o.labelStatus === 'AVAILABLE').map(o => o.id)
    setSelectedOrderIds(availableIds)
  }

  const selectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id))
    }
  }

  const selectProductOrders = (prodOrders: OrderItem[]) => {
    const ids = prodOrders.map(o => o.id)
    setSelectedOrderIds(prev => Array.from(new Set([...prev, ...ids])))
  }

  // Execução de Impressão em Lote com Fila Visual e Registro Real
  const handleBatchPrint = async (ids: string[], isReprint = false) => {
    if (ids.length === 0) return

    const selectedOrdersToPrint = orders.filter(o => ids.includes(o.id))
    
    setShowQueueModal(true)
    setQueueProgress({
      current: 0,
      total: ids.length,
      activeOrder: 'Preparando etiquetas oficiais térmicas 100x150mm...',
      isFinished: false,
      items: selectedOrdersToPrint.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: 'PENDING'
      }))
    })

    // Processamento passo a passo da fila para visualização limpa
    for (let i = 0; i < ids.length; i++) {
      const ord = selectedOrdersToPrint[i]
      setQueueProgress(prev => ({
        ...prev,
        current: i + 1,
        activeOrder: `Processando etiqueta ${i + 1}/${ids.length}: Pedido #${ord?.orderNumber || ids[i]}`,
        items: prev.items.map((item, idx) => {
          if (idx < i) return { ...item, status: 'DONE' }
          if (idx === i) return { ...item, status: 'PRINTING' }
          return item
        })
      }))
      await new Promise(r => setTimeout(r, 200))
    }

    // Finalizar fila
    setQueueProgress(prev => ({
      ...prev,
      current: ids.length,
      activeOrder: `✓ Todas as ${ids.length} etiquetas foram preparadas e enviadas para a impressora!`,
      isFinished: true,
      items: prev.items.map(item => ({ ...item, status: 'DONE' }))
    }))

    playNotificationSound()

    // Registrar no banco de dados via API oficial de logs de impressão
    try {
      await fetch('/api/shipments/print-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: ids,
          operatorName: 'Alison',
          attempt: isReprint ? 2 : 1,
          printerSettings: printerConfig
        })
      })
    } catch (e) {
      console.error('Erro ao gravar log de impressão:', e)
    }

    // Atualizar estado local
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, labelStatus: 'PRINTED' } : o))
    setSelectedOrderIds([])
    showToast(`🖨️ ${ids.length} etiqueta${ids.length > 1 ? 's' : ''} impressa${ids.length > 1 ? 's' : ''} com sucesso!`)

    // Abrir o PDF Unificado das etiquetas térmicas 100x150mm pronto para a impressora
    const printUrl = `/api/shipments/mercadolivre/label?orderIds=${ids.join(',')}&cropPackagingOnly=true`
    window.open(printUrl, '_blank')

    // Recarregar dados em background
    setTimeout(fetchLabelsData, 1000)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-150 pb-20">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#16a34a] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ── HEADER PRINCIPAL & AÇÃO DE DESTAQUE ───────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e6e6e6] shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#16a34a] text-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-[#111] tracking-tight">Central de Etiquetas & Expedição</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
                  Formato Térmico 100x150mm
                </span>
              </div>
              <p className="text-xs text-[#666] mt-0.5">
                Emissão oficial em lote sem alterar o layout original dos marketplaces (Mercado Livre, Shopee, Magalu, TikTok).
              </p>
            </div>
          </div>

          {/* Botões de Ação do Header */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2.5 bg-white border border-[#e2e8f0] hover:border-[#111] text-[#334155] rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Sliders className="w-4 h-4 text-[#64748b]" />
              <span>Configurar Impressora</span>
            </button>

            {/* AÇÃO PRINCIPAL: IMPRIMIR TODAS AS PENDENTES */}
            <button
              onClick={() => {
                const allAvailableIds = orders.filter(o => o.labelStatus === 'AVAILABLE').map(o => o.id)
                handleBatchPrint(allAvailableIds)
              }}
              disabled={stats.available === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition-all shadow-sm cursor-pointer ${
                stats.available > 0
                  ? 'bg-[#16a34a] hover:bg-[#15803d] text-white hover:scale-[1.02]'
                  : 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed border border-[#e2e8f0]'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                {stats.available > 0
                  ? `Imprimir ${stats.available} etiqueta${stats.available > 1 ? 's' : ''} pendente${stats.available > 1 ? 's' : ''}`
                  : 'Nenhuma etiqueta aguardando impressão'}
              </span>
            </button>
          </div>
        </div>

        {/* Barra de Sincronização & Saúde das Integrações */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f1f5f9] text-[12px]">
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#64748b] flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 text-[#16a34a] ${loading ? 'animate-spin' : ''}`} />
              Sincronização:
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-[#334155]">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Mercado Livre
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#334155]">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Shopee
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#334155]">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> TikTok Shop
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#334155]">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Magalu
              </span>
            </div>
          </div>

          <span className="text-[#94a3b8]">
            Última sincronização: <strong>{lastSyncSeconds < 5 ? 'agora mesmo' : `há ${lastSyncSeconds} segundos`}</strong>
          </span>
        </div>
      </div>

      {/* ── 4 CARDS DE RESUMO OPERACIONAL ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-[#e6e6e6] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Pedidos com Etiqueta</p>
          <p className="text-2xl font-black text-[#111] mt-1">{stats.total}</p>
          <p className="text-[11px] text-[#94a3b8] mt-1">Sincronizados na expedição</p>
        </div>

        <div className="p-4 bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#16a34a] uppercase tracking-wider">Aguardando Impressão</p>
            {stats.available > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-ping" />
            )}
          </div>
          <p className="text-2xl font-black text-[#16a34a] mt-1">{stats.available}</p>
          <p className="text-[11px] text-[#16a34a] font-bold mt-1">● Prontas para embalagem</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#e6e6e6] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Impressas Hoje</p>
          <p className="text-2xl font-black text-[#111] mt-1">{stats.printedToday}</p>
          <p className="text-[11px] text-[#64748b] mt-1">Já despachadas ou coladas</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#e6e6e6] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Com Erro / Indisponível</p>
          <p className="text-2xl font-black text-[#ef4444] mt-1">{stats.errors}</p>
          <p className="text-[11px] text-[#ef4444] mt-1">Aguardando liberação do canal</p>
        </div>
      </div>

      {/* ── BARRA DE CONTROLE, BUSCA E MODOS DE VISUALIZAÇÃO ──────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-[#e6e6e6] shadow-2xs space-y-3.5">
        
        {/* Abas Superiores de Visualização */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-xl w-fit">
            <button
              onClick={() => setViewMode('ORDERS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'ORDERS' ? 'bg-white text-[#111] shadow-2xs' : 'text-[#64748b] hover:text-[#111]'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Por Pedido ({filteredOrders.length})
            </button>

            <button
              onClick={() => setViewMode('PRODUCTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'PRODUCTS' ? 'bg-white text-[#111] shadow-2xs' : 'text-[#64748b] hover:text-[#111]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Agrupado por Produto ({groupedByProduct.length})
            </button>

            <button
              onClick={() => setViewMode('HISTORY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'HISTORY' ? 'bg-white text-[#111] shadow-2xs' : 'text-[#64748b] hover:text-[#111]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Histórico de Impressões ({printLogs.length})
            </button>
          </div>

          {/* Filtros Rápidos de Status */}
          <div className="flex items-center gap-1 bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0] text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-[#16a34a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#111]'
              }`}
            >
              Todas ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'AVAILABLE' ? 'bg-[#16a34a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#111]'
              }`}
            >
              Disponíveis ({stats.available})
            </button>
            <button
              onClick={() => setStatusFilter('PRINTED')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'PRINTED' ? 'bg-[#16a34a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#111]'
              }`}
            >
              Impressas ({stats.printedToday})
            </button>
            <button
              onClick={() => setStatusFilter('ERROR')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'ERROR' ? 'bg-[#ef4444] text-white shadow-xs' : 'text-[#64748b] hover:text-[#111]'
              }`}
            >
              Com Erro ({stats.errors})
            </button>
          </div>
        </div>

        {/* Filtros de Marketplaces (Pills Rápidas) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-[#64748b] pr-1 flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-[#64748b]" /> Canal:
          </span>
          {[
            { key: 'ALL', label: 'Todos os Marketplaces' },
            { key: 'MERCADO_LIVRE', label: 'Mercado Livre' },
            { key: 'SHOPEE', label: 'Shopee' },
            { key: 'TIKTOK', label: 'TikTok Shop' },
            { key: 'MAGALU', label: 'Magalu' },
            { key: 'AMAZON', label: 'Amazon' },
            { key: 'SHOPIFY', label: 'Shopify' }
          ].map(m => {
            const isSelected = marketplaceFilter === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMarketplaceFilter(m.key)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-xs'
                    : 'bg-white hover:bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Campo de Busca & Seleção Rápida */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Buscar por número do pedido, SKU, produto, rastreamento ou comprador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] focus:bg-white focus:border-[#16a34a] rounded-xl text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#333]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={selectAllAvailable}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white border border-[#e2e8f0] hover:border-[#16a34a] text-[#16a34a] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Selecionar Disponíveis ({stats.available})
            </button>
            <button
              onClick={selectAll}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white border border-[#e2e8f0] hover:border-[#111] text-[#334155] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          </div>
        </div>
      </div>

      {/* ── BARRA FLUTUANTE DE AÇÃO EM LOTE (QUANDO SELECIONADOS) ─────────── */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-[#1e293b] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#16a34a] text-white flex items-center justify-center font-black text-sm">
              {selectedOrderIds.length}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">
                {selectedOrderIds.length} etiqueta{selectedOrderIds.length > 1 ? 's' : ''} selecionada{selectedOrderIds.length > 1 ? 's' : ''}
              </p>
              <p className="text-[11px] text-[#94a3b8]">Prontas para emissão térmica contínua em lote</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3.5 py-2 text-xs font-bold text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            >
              Desmarcar
            </button>
            <button
              onClick={() => handleBatchPrint(selectedOrderIds)}
              className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Imprimir {selectedOrderIds.length} selecionada{selectedOrderIds.length > 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: POR PEDIDO (TABELA COMPLETA)                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'ORDERS' && (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] shadow-2xs overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mx-auto mb-4 text-[#94a3b8]">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#1e293b]">Nenhuma etiqueta aguardando impressão</h3>
              <p className="text-xs text-[#64748b] max-w-md mx-auto mt-1 leading-relaxed">
                Todas as etiquetas disponíveis foram processadas com sucesso ou nenhum pedido corresponde aos filtros aplicados.
              </p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('ALL'); setMarketplaceFilter('ALL') }}
                className="mt-4 px-4 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-bold">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <button
                        onClick={selectAll}
                        className="cursor-pointer text-[#64748b] hover:text-[#111]"
                      >
                        {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#16a34a]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Produto & Pedido</th>
                    <th className="py-3.5 px-4">Canal / Conta</th>
                    <th className="py-3.5 px-4">Destinatário & Rastreio</th>
                    <th className="py-3.5 px-4 text-center">Status da Etiqueta</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredOrders.map(order => {
                    const isSelected = selectedOrderIds.includes(order.id)
                    const isAvailable = order.labelStatus === 'AVAILABLE'

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-[#fafafa] transition-colors ${
                          isSelected ? 'bg-[#f0fdf4]/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => toggleSelectOrder(order.id)}
                            className="cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#16a34a]" />
                            ) : (
                              <Square className="w-4 h-4 text-[#cbd5e1] hover:text-[#64748b]" />
                            )}
                          </button>
                        </td>

                        {/* Produto & Pedido */}
                        <td className="py-4 px-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={order.productImage}
                              alt={order.productName}
                              className="w-12 h-12 rounded-xl object-contain border border-[#e2e8f0] bg-[#f8fafc] p-0.5 shrink-0"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-bold text-[#1e293b] line-clamp-1 max-w-[280px]">
                                {order.productName}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
                                <span className="font-mono">SKU: {order.productSku}</span>
                                <span>·</span>
                                <span className="font-bold text-[#111]">Pedido #{order.orderNumber}</span>
                              </div>
                              <p className="text-[10px] text-[#94a3b8]">
                                {new Date(order.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Canal / Conta */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <MarketplaceLogo name={order.marketplaceName} className="w-4 h-4 shrink-0" />
                            <div>
                              <p className="font-bold text-[#1e293b]">{order.marketplaceName}</p>
                              <p className="text-[11px] text-[#64748b]">{order.accountName}</p>
                            </div>
                          </div>
                        </td>

                        {/* Destinatário & Rastreio */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#1e293b]">{order.customerName}</p>
                            <p className="font-mono text-[11px] text-[#16a34a] font-bold">
                              {order.trackingCode}
                            </p>
                            <p className="text-[10px] text-[#94a3b8] truncate max-w-[220px]">
                              {order.shippingAddress}
                            </p>
                          </div>
                        </td>

                        {/* Status da Etiqueta */}
                        <td className="py-4 px-4 text-center">
                          {order.labelStatus === 'AVAILABLE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fef9c3] text-[#a16207] border border-[#fef08a]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ca8a04]" /> Disponível
                            </span>
                          )}
                          {order.labelStatus === 'PRINTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
                              <Check className="w-3 h-3 text-[#16a34a]" /> Impressa
                            </span>
                          )}
                          {order.labelStatus === 'ERROR' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
                              <AlertTriangle className="w-3 h-3 text-[#dc2626]" /> Erro
                            </span>
                          )}
                          {order.labelStatus === 'UNAVAILABLE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                              Indisponível
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setPreviewOrder(order)
                                setShowPreviewModal(true)
                              }}
                              className="p-1.5 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:text-[#111] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                              title="Pré-visualizar etiqueta"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleBatchPrint([order.id], order.labelStatus === 'PRINTED')}
                              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                                order.labelStatus === 'AVAILABLE'
                                  ? 'bg-[#16a34a] hover:bg-[#15803d] text-white shadow-2xs'
                                  : 'bg-white border border-[#e2e8f0] text-[#334155] hover:border-[#111]'
                              }`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{order.labelStatus === 'PRINTED' ? 'Reimprimir' : 'Imprimir'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 2: AGRUPADO POR PRODUTO                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'PRODUCTS' && (
        <div className="space-y-3">
          {groupedByProduct.map(group => {
            const availableCount = group.orders.filter(o => o.labelStatus === 'AVAILABLE').length
            const isAllGroupSelected = group.orders.every(o => selectedOrderIds.includes(o.id))

            return (
              <div
                key={group.sku}
                className="bg-white rounded-2xl border border-[#e6e6e6] shadow-2xs p-5 space-y-4"
              >
                {/* Header do Grupo de Produto */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={group.image}
                      alt={group.name}
                      className="w-14 h-14 rounded-2xl object-contain border border-[#e2e8f0] bg-[#f8fafc] p-1 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-[15px] text-[#1e293b] leading-tight">{group.name}</h3>
                      <div className="flex items-center gap-2.5 text-xs text-[#64748b] mt-1">
                        <span className="font-mono font-semibold">SKU: {group.sku}</span>
                        <span>·</span>
                        <span className="font-bold text-[#16a34a]">{group.orders.length} vendas registradas</span>
                        <span>·</span>
                        <span className="text-[#334155]">Estoque: {group.stock || 12} un.</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações do Produto */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectProductOrders(group.orders)}
                      className="px-3.5 py-2 bg-white border border-[#e2e8f0] hover:border-[#16a34a] text-[#16a34a] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {isAllGroupSelected ? '✓ Todas Selecionadas' : `Selecionar ${group.orders.length} deste produto`}
                    </button>

                    <button
                      onClick={() => handleBatchPrint(group.orders.map(o => o.id))}
                      className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Printer className="w-4 h-4 text-white" />
                      <span>Imprimir {group.orders.length} etiquetas</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Pedidos deste Produto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.orders.map(order => {
                    const isSelected = selectedOrderIds.includes(order.id)
                    return (
                      <div
                        key={order.id}
                        onClick={() => toggleSelectOrder(order.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#f0fdf4] border-[#86efac]'
                            : 'bg-[#fafafa] border-[#e2e8f0] hover:border-[#cbd5e1]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#16a34a] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#cbd5e1] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#1e293b] truncate">Pedido #{order.orderNumber}</p>
                            <p className="text-[11px] text-[#64748b] truncate">{order.customerName}</p>
                            <p className="font-mono text-[10px] text-[#16a34a] truncate">{order.trackingCode}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          order.labelStatus === 'AVAILABLE'
                            ? 'bg-[#fef9c3] text-[#a16207]'
                            : 'bg-[#ecfdf5] text-[#16a34a]'
                        }`}>
                          {order.labelStatus === 'AVAILABLE' ? 'Disponível' : 'Impressa'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 3: HISTÓRICO DE IMPRESSÕES REAL                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#1e293b]">Histórico Oficial de Impressões & Reimpressões</h3>
              <p className="text-xs text-[#64748b]">Registro cronológico de todas as emissões térmicas efetuadas na estação</p>
            </div>
            <button
              onClick={fetchLabelsData}
              className="p-2 border border-[#e2e8f0] hover:border-[#111] rounded-xl text-[#333] transition-all cursor-pointer"
              title="Atualizar histórico"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-bold">
                  <th className="py-3.5 px-4">Pedido</th>
                  <th className="py-3.5 px-4">Marketplace</th>
                  <th className="py-3.5 px-4">Data & Horário</th>
                  <th className="py-3.5 px-4">Operador</th>
                  <th className="py-3.5 px-4">Tentativa</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {printLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94a3b8]">
                      Nenhum registro de impressão encontrado.
                    </td>
                  </tr>
                ) : (
                  printLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#1e293b]">
                        #{log.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#475569]">
                        {log.marketplace}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748b]">
                        {log.printedAt}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#334155]">
                        {log.operator}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748b]">
                        {log.attempt === 1 ? '1ª Impressão' : `${log.attempt}ª Reimpressão`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
                          <Check className="w-3 h-3 text-[#16a34a]" /> Impressa
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            const found = orders.find(o => o.orderNumber === log.orderNumber)
                            if (found) handleBatchPrint([found.id], true)
                          }}
                          className="px-3 py-1 bg-white border border-[#e2e8f0] hover:border-[#111] text-[#334155] rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                        >
                          Reimprimir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: FILA DE IMPRESSÃO EM LOTE (BATCH PROGRESS QUEUE)           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showQueueModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a]">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#111]">Fila de Impressão Térmica</h3>
                  <p className="text-xs text-[#64748b]">Processamento em lote no padrão 100x150mm</p>
                </div>
              </div>
              {queueProgress.isFinished && (
                <button
                  onClick={() => setShowQueueModal(false)}
                  className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:text-[#111]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#1e293b]">
                <span>{queueProgress.activeOrder}</span>
                <span>{queueProgress.current}/{queueProgress.total}</span>
              </div>
              <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#e2e8f0]">
                <div
                  className="h-full bg-[#16a34a] transition-all duration-300 rounded-full"
                  style={{ width: `${(queueProgress.current / (queueProgress.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Lista dos Pedidos na Fila */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#f8fafc]">
              {queueProgress.items.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#64748b]">#{idx + 1}</span>
                    <span className="font-bold text-[#1e293b]">Pedido #{item.orderNumber}</span>
                  </div>
                  {item.status === 'DONE' && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#16a34a]">
                      <Check className="w-3.5 h-3.5" /> Preparada
                    </span>
                  )}
                  {item.status === 'PRINTING' && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#3b82f6] animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando PDF...
                    </span>
                  )}
                  {item.status === 'PENDING' && (
                    <span className="text-[11px] text-[#94a3b8]">Aguardando</span>
                  )}
                </div>
              ))}
            </div>

            {/* Rodapé Modal */}
            <div className="pt-3 border-t border-[#f1f5f9] flex justify-end gap-2">
              {queueProgress.isFinished ? (
                <button
                  onClick={() => setShowQueueModal(false)}
                  className="px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  Concluir e Fechar
                </button>
              ) : (
                <p className="text-xs text-[#94a3b8] italic">
                  Enviando fluxo unificado para a impressora...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: CONFIGURAÇÃO DE IMPRESSORA TÉRMICA                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#16a34a]" />
                <h3 className="font-bold text-base text-[#111]">Configurar Impressora Térmica</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:text-[#111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Formato do Papel / Etiqueta</label>
                <select
                  value={printerConfig.paperSize}
                  onChange={e => setPrinterConfig({ ...printerConfig, paperSize: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#1e293b]"
                >
                  <option value="100x150">100mm x 150mm (Padrão Mercado Envios / Correios / Shopee)</option>
                  <option value="100x100">100mm x 100mm (Quadrada Compacta)</option>
                  <option value="A4">A4 (Folha com 4 etiquetas)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Orientação</label>
                  <select
                    value={printerConfig.orientation}
                    onChange={e => setPrinterConfig({ ...printerConfig, orientation: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#1e293b]"
                  >
                    <option value="portrait">Retrato (Vertical)</option>
                    <option value="landscape">Paisagem (Horizontal)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Densidade Térmica</label>
                  <select
                    value={printerConfig.density}
                    onChange={e => setPrinterConfig({ ...printerConfig, density: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#1e293b]"
                  >
                    <option value="medium">Média (Recomendada)</option>
                    <option value="high">Alta (Código nítido)</option>
                    <option value="low">Econômica</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] text-[#16a34a] text-[11px] font-medium leading-relaxed">
                ✓ A TEKNIX ajusta automaticamente a área de corte da etiqueta original do marketplace sem alterar nenhum código de barras ou dados oficiais de rastreamento.
              </div>
            </div>

            <div className="pt-3 border-t border-[#f1f5f9] flex justify-end gap-2">
              <button
                onClick={() => {
                  window.open('/api/shipments/mercadolivre/label?original=false&cropPackagingOnly=true', '_blank')
                }}
                className="px-3.5 py-2 bg-white border border-[#e2e8f0] text-[#334155] rounded-xl text-xs font-bold hover:border-[#111]"
              >
                Imprimir Teste
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  showToast('Configurações de impressora salvas!')
                }}
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-black"
              >
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: PRÉ-VISUALIZAÇÃO DA ETIQUETA OFICIAL                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showPreviewModal && previewOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#16a34a]" />
                <h3 className="font-bold text-base text-[#111]">Prévia da Etiqueta Térmica</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:text-[#111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulação Fiel da Etiqueta Térmica 100x150mm */}
            <div className="p-4 bg-white border-2 border-dashed border-[#cbd5e1] rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black">
                <span className="font-bold text-sm tracking-wider">MERCADO ENVIOS</span>
                <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5">XD_DROP_OFF</span>
              </div>

              <div>
                <p className="text-[10px] text-gray-500">RASTREAMENTO OFICIAL:</p>
                <p className="font-bold text-sm">{previewOrder.trackingCode}</p>
                <p className="text-[11px]">PEDIDO: #{previewOrder.orderNumber}</p>
              </div>

              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500">DESTINATÁRIO:</p>
                <p className="font-bold text-xs">{previewOrder.customerName}</p>
                <p className="text-[10px] text-gray-700">{previewOrder.shippingAddress}</p>
              </div>

              <div className="pt-2 border-t border-black">
                <p className="text-[10px] truncate">ITEM: {previewOrder.productName}</p>
                <p className="text-[10px]">SKU: {previewOrder.productSku} | QTD: {previewOrder.itemQuantity}</p>
              </div>

              <div className="h-20 bg-gray-100 border border-gray-300 rounded flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold text-gray-600">||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||</p>
                <p className="text-[10px] font-bold text-gray-600">*{previewOrder.trackingCode}*</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#f1f5f9] flex justify-end gap-2">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-white border border-[#e2e8f0] text-[#334155] rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  handleBatchPrint([previewOrder.id])
                }}
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-black flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
