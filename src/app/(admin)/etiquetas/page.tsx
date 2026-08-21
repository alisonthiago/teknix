'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Tag,
  Printer,
  Search,
  CheckSquare,
  Square,
  Package,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  RefreshCw,
  Eye,
  X,
  Check,
  Loader2
} from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { playNotificationSound } from '@/utils/audio-chime'

type ViewMode = 'ORDERS' | 'PRODUCTS' | 'HISTORY'
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
}

export default function CentralEtiquetasPage() {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('ORDERS')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'PRINTED' | 'ERROR'>('ALL')
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('ALL')
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  
  // Dados
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0)
  
  // Modais
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

  // Configurações de Impressora
  const [printerConfig, setPrinterConfig] = useState({
    paperSize: '100x150',
    margin: '0',
    scale: '100',
    orientation: 'portrait',
    autoCut: true,
  })

  // Histórico de Impressão
  const [printLogs, setPrintLogs] = useState<PrintLogItem[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Carregar dados reais
  const fetchLabelsData = async () => {
    try {
      const res = await fetch('/api/shipments/labels')
      if (!res.ok) return
      const data = await res.json()

      if (data.orders) {
        setOrders(data.orders)
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

  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: orders.length,
      available: orders.filter(o => o.labelStatus === 'AVAILABLE').length,
      printedToday: orders.filter(o => o.labelStatus === 'PRINTED').length,
      errors: orders.filter(o => o.labelStatus === 'ERROR').length,
    }
  }, [orders])

  // Filtragem
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter === 'AVAILABLE' && o.labelStatus !== 'AVAILABLE') return false
      if (statusFilter === 'PRINTED' && o.labelStatus !== 'PRINTED') return false
      if (statusFilter === 'ERROR' && o.labelStatus !== 'ERROR') return false

      if (marketplaceFilter !== 'ALL') {
        const matchMp = o.marketplaceName.toLowerCase().includes(marketplaceFilter.toLowerCase()) ||
                        o.marketplaceCode.toLowerCase().includes(marketplaceFilter.toLowerCase())
        if (!matchMp) return false
      }

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

  // Agrupado por Produto
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

  // Seleção
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
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

  // Execução de Impressão em Lote
  const handleBatchPrint = async (ids: string[], isReprint = false) => {
    if (ids.length === 0) return

    const selectedOrdersToPrint = orders.filter(o => ids.includes(o.id))
    
    setShowQueueModal(true)
    setQueueProgress({
      current: 0,
      total: ids.length,
      activeOrder: 'Preparando etiquetas térmicas 100x150mm...',
      isFinished: false,
      items: selectedOrdersToPrint.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: 'PENDING'
      }))
    })

    for (let i = 0; i < ids.length; i++) {
      const ord = selectedOrdersToPrint[i]
      setQueueProgress(prev => ({
        ...prev,
        current: i + 1,
        activeOrder: `Etiqueta ${i + 1}/${ids.length}: Pedido #${ord?.orderNumber || ids[i]}`,
        items: prev.items.map((item, idx) => {
          if (idx < i) return { ...item, status: 'DONE' }
          if (idx === i) return { ...item, status: 'PRINTING' }
          return item
        })
      }))
      await new Promise(r => setTimeout(r, 200))
    }

    setQueueProgress(prev => ({
      ...prev,
      current: ids.length,
      activeOrder: `✓ ${ids.length} etiqueta${ids.length > 1 ? 's' : ''} enviada${ids.length > 1 ? 's' : ''} para a impressora!`,
      isFinished: true,
      items: prev.items.map(item => ({ ...item, status: 'DONE' }))
    }))

    playNotificationSound()

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

    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, labelStatus: 'PRINTED' } : o))
    setSelectedOrderIds([])
    showToast(`🖨️ ${ids.length} etiqueta${ids.length > 1 ? 's' : ''} impressa${ids.length > 1 ? 's' : ''} com sucesso!`)

    const printUrl = `/api/shipments/mercadolivre/label?orderIds=${ids.join(',')}&cropPackagingOnly=true`
    window.open(printUrl, '_blank')
    setTimeout(fetchLabelsData, 1000)
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-200 pb-28 pt-2">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#16a34a] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ── 1. CABEÇALHO CLEAN & ESPAÇOSO ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
            Central de Etiquetas
          </h1>
          <p className="text-sm text-[#64748b]">
            Emissão oficial em lote no formato térmico 100x150mm integrada aos marketplaces
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2.5 bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] text-[#475569] hover:text-[#0f172a] rounded-xl text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Sliders className="w-4 h-4 text-[#64748b]" />
            <span>Configurar Impressora</span>
          </button>

          <button
            onClick={() => {
              const allAvailableIds = orders.filter(o => o.labelStatus === 'AVAILABLE').map(o => o.id)
              handleBatchPrint(allAvailableIds)
            }}
            disabled={stats.available === 0}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all shadow-xs cursor-pointer ${
              stats.available > 0
                ? 'bg-[#16a34a] hover:bg-[#15803d] text-white hover:shadow-md'
                : 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed border border-[#e2e8f0]'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              {stats.available > 0
                ? `Imprimir ${stats.available} etiqueta${stats.available > 1 ? 's' : ''} pendente${stats.available > 1 ? 's' : ''}`
                : 'Nenhuma etiqueta pendente'}
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. CARDS RESUMO COM RESPIRO E MINIMALISMO ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#64748b] tracking-wide">Total de Pedidos</p>
          <p className="text-3xl font-bold text-[#0f172a]">{stats.total}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#16a34a] tracking-wide">Aguardando Impressão</p>
            {stats.available > 0 && <span className="w-2 h-2 rounded-full bg-[#16a34a]" />}
          </div>
          <p className="text-3xl font-bold text-[#16a34a]">{stats.available}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#64748b] tracking-wide">Impressas Hoje</p>
          <p className="text-3xl font-bold text-[#0f172a]">{stats.printedToday}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#64748b] tracking-wide">Com Erro / Indisponível</p>
          <p className="text-3xl font-bold text-[#64748b]">{stats.errors}</p>
        </div>
      </div>

      {/* ── 3. NAVEGAÇÃO, FILTROS & BUSCA CLEAN ────────────────────────────── */}
      <div className="space-y-4">
        
        {/* Abas e Filtro de Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Abas de Modo de Visualização */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('ORDERS')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'ORDERS'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
              }`}
            >
              Por Pedido ({filteredOrders.length})
            </button>

            <button
              onClick={() => setViewMode('PRODUCTS')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'PRODUCTS'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
              }`}
            >
              Agrupado por Produto ({groupedByProduct.length})
            </button>

            <button
              onClick={() => setViewMode('HISTORY')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'HISTORY'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
              }`}
            >
              Histórico ({printLogs.length})
            </button>
          </div>

          {/* Filtros de Status (Estilo HostGator) */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
            <span className="pr-1 text-[#94a3b8]">Filtrar:</span>
            {[
              { key: 'ALL', label: 'Todos' },
              { key: 'AVAILABLE', label: 'Disponíveis' },
              { key: 'PRINTED', label: 'Impressas' },
              { key: 'ERROR', label: 'Com Erro' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  statusFilter === f.key
                    ? 'bg-[#e2e8f0] text-[#0f172a] font-bold'
                    : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campo de Busca & Filtro de Canais */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Buscar por pedido, SKU, produto, rastreamento ou comprador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#e2e8f0] focus:border-[#0f172a] rounded-2xl text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-all shadow-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto shrink-0 w-full sm:w-auto">
            {['ALL', 'MERCADO_LIVRE', 'SHOPEE', 'TIKTOK', 'MAGALU'].map(m => {
              const label = m === 'ALL' ? 'Todos Canais' : m === 'MERCADO_LIVRE' ? 'Mercado Livre' : m === 'TIKTOK' ? 'TikTok' : m === 'MAGALU' ? 'Magalu' : 'Shopee'
              const isSelected = marketplaceFilter === m
              return (
                <button
                  key={m}
                  onClick={() => setMarketplaceFilter(m)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0f172a] text-white border-[#0f172a]'
                      : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── BARRA FLUTUANTE DE AÇÃO EM LOTE ───────────────────────────────── */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-[#0f172a] text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#16a34a] text-white flex items-center justify-center font-bold text-xs">
              {selectedOrderIds.length}
            </span>
            <p className="font-semibold text-sm">
              {selectedOrderIds.length} etiqueta{selectedOrderIds.length > 1 ? 's' : ''} selecionada{selectedOrderIds.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            >
              Desmarcar
            </button>
            <button
              onClick={() => handleBatchPrint(selectedOrderIds)}
              className="px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Selecionadas</span>
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: LISTAGEM POR PEDIDO (ESTILO HOSTGATOR / CLEAN)              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'ORDERS' && (
        <div className="bg-white rounded-3xl border border-[#eef2f6] shadow-xs overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="py-20 px-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] flex items-center justify-center mx-auto text-[#94a3b8] mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0f172a]">Nenhuma etiqueta encontrada</h3>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto">
                Não há etiquetas correspondentes aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f1f5f9]">
              {/* Header da Lista */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                <div className="flex items-center gap-4">
                  <button onClick={selectAll} className="cursor-pointer text-[#64748b]">
                    {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#16a34a]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#cbd5e1]" />
                    )}
                  </button>
                  <span>Produto / Pedido</span>
                </div>
                <div className="flex items-center gap-12 pr-6">
                  <span className="hidden md:inline">Canal</span>
                  <span className="hidden sm:inline">Destinatário & Rastreio</span>
                  <span>Status</span>
                  <span>Ação</span>
                </div>
              </div>

              {/* Linhas de Pedidos */}
              {filteredOrders.map(order => {
                const isSelected = selectedOrderIds.includes(order.id)
                return (
                  <div
                    key={order.id}
                    className={`flex items-center justify-between px-6 py-4.5 hover:bg-[#fafafa] transition-colors ${
                      isSelected ? 'bg-[#f0fdf4]/50' : ''
                    }`}
                  >
                    {/* Checkbox e Produto */}
                    <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                      <button onClick={() => toggleSelectOrder(order.id)} className="cursor-pointer shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#16a34a]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#cbd5e1] hover:text-[#64748b]" />
                        )}
                      </button>

                      <img
                        src={order.productImage}
                        alt={order.productName}
                        className="w-11 h-11 rounded-xl object-contain border border-[#e2e8f0] bg-[#f8fafc] p-0.5 shrink-0"
                      />

                      <div className="min-w-0 space-y-0.5">
                        <p className="font-bold text-sm text-[#0f172a] truncate max-w-[320px]">
                          {order.productName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#64748b]">
                          <span className="font-mono">SKU: {order.productSku}</span>
                          <span>·</span>
                          <span className="font-medium text-[#0f172a]">#{order.orderNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Canal, Rastreio, Status e Ação */}
                    <div className="flex items-center gap-8 shrink-0">
                      {/* Canal */}
                      <div className="hidden md:flex items-center gap-2 min-w-[110px]">
                        <MarketplaceLogo name={order.marketplaceName} className="w-4 h-4" />
                        <span className="text-xs font-semibold text-[#334155]">{order.marketplaceName}</span>
                      </div>

                      {/* Rastreio */}
                      <div className="hidden sm:block min-w-[150px] space-y-0.5">
                        <p className="text-xs font-semibold text-[#0f172a] truncate max-w-[140px]">{order.customerName}</p>
                        <p className="font-mono text-[11px] font-bold text-[#16a34a]">{order.trackingCode}</p>
                      </div>

                      {/* Status */}
                      <div className="min-w-[90px] text-center">
                        {order.labelStatus === 'AVAILABLE' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fef9c3] text-[#a16207]">
                            Disponível
                          </span>
                        )}
                        {order.labelStatus === 'PRINTED' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#16a34a]">
                            Impressa
                          </span>
                        )}
                        {order.labelStatus === 'ERROR' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#dc2626]">
                            Erro
                          </span>
                        )}
                        {order.labelStatus === 'UNAVAILABLE' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#64748b]">
                            Indisponível
                          </span>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setPreviewOrder(order)
                            setShowPreviewModal(true)
                          }}
                          className="p-2 rounded-xl text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                          title="Prévia da Etiqueta"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleBatchPrint([order.id], order.labelStatus === 'PRINTED')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            order.labelStatus === 'AVAILABLE'
                              ? 'bg-[#16a34a] hover:bg-[#15803d] text-white shadow-xs'
                              : 'bg-white border border-[#e2e8f0] text-[#334155] hover:border-[#0f172a]'
                          }`}
                        >
                          {order.labelStatus === 'PRINTED' ? 'Reimprimir' : 'Imprimir'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 2: AGRUPADO POR PRODUTO                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'PRODUCTS' && (
        <div className="space-y-4">
          {groupedByProduct.map(group => (
            <div
              key={group.sku}
              className="bg-white rounded-3xl border border-[#eef2f6] shadow-xs p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-4">
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-14 h-14 rounded-2xl object-contain border border-[#e2e8f0] bg-[#f8fafc] p-1 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-base text-[#0f172a]">{group.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <span className="font-mono">SKU: {group.sku}</span>
                      <span>·</span>
                      <span className="font-bold text-[#16a34a]">{group.orders.length} vendas</span>
                      <span>·</span>
                      <span>Estoque: {group.stock || 12} un.</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectProductOrders(group.orders)}
                    className="px-4 py-2 bg-white border border-[#e2e8f0] hover:border-[#0f172a] text-[#0f172a] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Selecionar Todas ({group.orders.length})
                  </button>

                  <button
                    onClick={() => handleBatchPrint(group.orders.map(o => o.id))}
                    className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir {group.orders.length} etiquetas</span>
                  </button>
                </div>
              </div>

              {/* Lista dos Pedidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.orders.map(order => {
                  const isSelected = selectedOrderIds.includes(order.id)
                  return (
                    <div
                      key={order.id}
                      onClick={() => toggleSelectOrder(order.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#f0fdf4] border-[#86efac]'
                          : 'bg-[#fafafa] border-[#e2e8f0] hover:border-[#cbd5e1]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#16a34a] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#cbd5e1] shrink-0" />
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-xs text-[#0f172a] truncate">Pedido #{order.orderNumber}</p>
                          <p className="text-[11px] text-[#64748b] truncate">{order.customerName}</p>
                          <p className="font-mono text-[10px] text-[#16a34a]">{order.trackingCode}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
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
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 3: HISTÓRICO DE IMPRESSÕES                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-[#eef2f6] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#f1f5f9] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#0f172a]">Histórico de Impressões</h3>
              <p className="text-xs text-[#64748b]">Registro cronológico de etiquetas emitidas</p>
            </div>
            <button
              onClick={fetchLabelsData}
              className="p-2 border border-[#e2e8f0] hover:border-[#0f172a] rounded-xl text-[#64748b] hover:text-[#0f172a] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {printLogs.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#94a3b8]">
                Nenhum registro de impressão encontrado.
              </div>
            ) : (
              printLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa]">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-[#0f172a]">Pedido #{log.orderNumber}</p>
                    <p className="text-xs text-[#64748b]">{log.marketplace} · {log.printedAt}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-[#0f172a]">{log.operator}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#16a34a]">
                      {log.attempt === 1 ? '1ª Impressão' : `${log.attempt}ª Reimpressão`}
                    </span>
                    <button
                      onClick={() => {
                        const found = orders.find(o => o.orderNumber === log.orderNumber)
                        if (found) handleBatchPrint([found.id], true)
                      }}
                      className="px-3.5 py-1.5 bg-white border border-[#e2e8f0] hover:border-[#0f172a] text-[#0f172a] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Reimprimir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: FILA DE IMPRESSÃO EM LOTE                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showQueueModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] text-[#16a34a] flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0f172a]">Fila de Impressão</h3>
                  <p className="text-xs text-[#64748b]">Padrão térmico 100x150mm</p>
                </div>
              </div>
              {queueProgress.isFinished && (
                <button onClick={() => setShowQueueModal(false)} className="text-[#94a3b8] hover:text-[#0f172a]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0f172a]">
                <span>{queueProgress.activeOrder}</span>
                <span>{queueProgress.current}/{queueProgress.total}</span>
              </div>
              <div className="w-full h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16a34a] transition-all duration-300 rounded-full"
                  style={{ width: `${(queueProgress.current / (queueProgress.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              {queueProgress.isFinished && (
                <button
                  onClick={() => setShowQueueModal(false)}
                  className="px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: CONFIGURAÇÃO DE IMPRESSORA TÉRMICA                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <h3 className="font-bold text-base text-[#0f172a]">Configurações da Impressora</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1.5">Tamanho da Etiqueta</label>
                <select
                  value={printerConfig.paperSize}
                  onChange={e => setPrinterConfig({ ...printerConfig, paperSize: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0f172a]"
                >
                  <option value="100x150">100mm x 150mm (Padrão Mercado Envios / Shopee / Correios)</option>
                  <option value="100x100">100mm x 100mm</option>
                  <option value="A4">A4</option>
                </select>
              </div>

              <div className="p-3.5 bg-[#f0fdf4] rounded-2xl text-[#16a34a] text-xs leading-relaxed">
                ✓ A TEKNIX ajusta automaticamente a área de corte da etiqueta original sem alterar nenhum código de barras ou dados oficiais.
              </div>
            </div>

            <div className="pt-3 border-t border-[#f1f5f9] flex justify-end gap-2.5">
              <button
                onClick={() => window.open('/api/shipments/mercadolivre/label?original=false&cropPackagingOnly=true', '_blank')}
                className="px-4 py-2 bg-white border border-[#e2e8f0] text-[#334155] rounded-xl text-xs font-semibold"
              >
                Imprimir Teste
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  showToast('Configuração salva!')
                }}
                className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: PRÉ-VISUALIZAÇÃO DA ETIQUETA OFICIAL                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showPreviewModal && previewOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <h3 className="font-bold text-base text-[#0f172a]">Prévia da Etiqueta</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white border border-[#cbd5e1] rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black">
                <span className="font-bold text-sm">MERCADO ENVIOS</span>
                <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5">XD_DROP_OFF</span>
              </div>

              <div>
                <p className="text-[10px] text-gray-500">RASTREAMENTO:</p>
                <p className="font-bold text-sm">{previewOrder.trackingCode}</p>
                <p className="text-[11px]">PEDIDO: #{previewOrder.orderNumber}</p>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500">DESTINATÁRIO:</p>
                <p className="font-bold text-xs">{previewOrder.customerName}</p>
                <p className="text-[10px] text-gray-700">{previewOrder.shippingAddress}</p>
              </div>

              <div className="pt-2 border-t border-black">
                <p className="text-[10px] truncate">ITEM: {previewOrder.productName}</p>
                <p className="text-[10px]">SKU: {previewOrder.productSku} | QTD: {previewOrder.itemQuantity}</p>
              </div>

              <div className="h-16 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold text-gray-600">||||||||||||||||||||||||||||||||||||||||||||||||||||||||||</p>
                <p className="text-[10px] font-bold text-gray-600">*{previewOrder.trackingCode}*</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#64748b]"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  handleBatchPrint([previewOrder.id])
                }}
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold"
              >
                Imprimir Agora
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
