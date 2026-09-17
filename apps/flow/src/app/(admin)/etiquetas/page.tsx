'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Tag,
  ArrowLeft,
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
  Loader2,
  User,
} from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { playNotificationSound } from '@/utils/audio-chime'
import { PaginationBar, usePagination } from '@/components/ui/pagination'

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
      if (!res.ok) {
        console.error('Labels API error:', res.status)
        return
      }
      const data = await res.json()

      if (data.orders) {
        setOrders(data.orders)
      }
      if (data.printLogs) {
        const mappedLogs: PrintLogItem[] = data.printLogs.map((log: any, idx: number) => ({
          id: log.id || `log-${idx}`,
          orderNumber: log.notes?.match(/Pedido #([A-Za-z0-9-_]+)/)?.[1] || log.order_id?.slice(0, 8) || 'Pedido',
          marketplace: 'Mercado Livre',
          printedAt: new Date(log.created_at).toLocaleString('pt-BR'),
          operator: log.notes?.match(/por (.+?)\./)?.[1] || 'Sistema',
          status: log.notes?.includes('sucesso') ? 'SUCCESS' : 'INFO',
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

  // Paginação de Pedidos
  const {
    currentPage: ordersPage,
    setCurrentPage: setOrdersPage,
    pageSize: ordersPageSize,
    setPageSize: setOrdersPageSize,
    paginatedItems: paginatedOrders,
    totalItems: totalOrdersCount,
  } = usePagination(filteredOrders, 10)

  // Paginação de Produtos Agrupados
  const {
    currentPage: productsPage,
    setCurrentPage: setProductsPage,
    pageSize: productsPageSize,
    setPageSize: setProductsPageSize,
    paginatedItems: paginatedProductGroups,
    totalItems: totalProductGroupsCount,
  } = usePagination(groupedByProduct, 10)

  // Paginação de Histórico de Impressão
  const {
    currentPage: historyPage,
    setCurrentPage: setHistoryPage,
    pageSize: historyPageSize,
    setPageSize: setHistoryPageSize,
    paginatedItems: paginatedLogs,
    totalItems: totalLogsCount,
  } = usePagination(printLogs, 15)

  // Resetar página ao mudar filtros de busca ou status
  useEffect(() => {
    setOrdersPage(1)
    setProductsPage(1)
  }, [search, statusFilter, marketplaceFilter])

  // Seleção
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const isPageSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))
  const isAllFilteredSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id))

  const toggleSelectCurrentPage = () => {
    if (isPageSelected) {
      const pageIds = paginatedOrders.map(o => o.id)
      setSelectedOrderIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const pageIds = paginatedOrders.map(o => o.id)
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const selectAll = () => {
    if (isAllFilteredSelected) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e6e6e6]/60">
        {/* Título Mobile (Escondido no desktop) */}
        <div className="hub-mobile-header-title-row lg:hidden !justify-start gap-3">
          <button type="button" className="hub-mobile-back-btn" aria-label="Voltar" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="hub-mobile-page-title !text-[16px]">
            Central de Etiquetas
          </h1>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setShowConfigModal(true)}
            className="h-[38px] flex-1 sm:flex-none px-3 sm:px-3.5 bg-white border border-[#e6e6e6] hover:bg-[#F7F7F7] text-[#333] rounded-lg text-xs sm:text-sm font-normal flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Sliders className="w-4 h-4 text-[#666] shrink-0" />
            <span className="hidden sm:inline">Configurar Impressora</span>
            <span className="sm:hidden">Configurar</span>
          </button>

          <button
            onClick={() => {
              const allAvailableIds = orders.filter(o => o.labelStatus === 'AVAILABLE').map(o => o.id)
              handleBatchPrint(allAvailableIds)
            }}
            disabled={stats.available === 0}
            className={`h-[38px] flex-1 sm:flex-none px-3 sm:px-4 rounded-lg text-xs sm:text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              stats.available > 0
                ? 'bg-[#0071e3] hover:bg-[#0062c4] text-white shadow-2xs'
                : 'bg-[#f5f5f5] text-[#999] cursor-not-allowed border border-[#e6e6e6]'
            }`}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {stats.available > 0
                ? `Imprimir ${stats.available} pendente${stats.available > 1 ? 's' : ''}`
                : 'Nenhuma pendente'}
            </span>
            <span className="sm:hidden whitespace-nowrap">
              {stats.available > 0 ? `Imprimir (${stats.available})` : 'Nenhuma'}
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. CARDS RESUMO COM RESPIRO E MINIMALISMO ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-none space-y-1">
          <p className="text-[11px] font-semibold text-[#8a8a8a] tracking-wider uppercase">Total de Pedidos</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">{stats.total}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-none space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-[#8a8a8a] tracking-wider uppercase">Aguardando Impressão</p>
            {stats.available > 0 && <span className="w-2 h-2 rounded-full bg-[#16a34a]" />}
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">{stats.available}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-none space-y-1">
          <p className="text-[11px] font-semibold text-[#8a8a8a] tracking-wider uppercase">Impressas Hoje</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">{stats.printedToday}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e6e6e6] shadow-none space-y-1">
          <p className="text-[11px] font-semibold text-[#8a8a8a] tracking-wider uppercase">Com Erro / Indisp.</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">{stats.errors}</p>
        </div>
      </div>

      {/* ── 3. NAVEGAÇÃO, FILTROS & BUSCA CLEAN ────────────────────────────── */}
      <div className="space-y-4">
        
        {/* Abas e Filtro de Status */}
        <div className="labels-mode-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Abas de Modo de Visualização */}
          <div className="labels-tabs flex sm:inline-flex items-center gap-1 p-1 bg-[#f0f0f0] rounded-lg overflow-x-auto w-full sm:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setViewMode('ORDERS')}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'ORDERS'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              Pedidos ({filteredOrders.length})
            </button>

            <button
              onClick={() => setViewMode('PRODUCTS')}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'PRODUCTS'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              Produtos ({groupedByProduct.length})
            </button>

            <button
              onClick={() => setViewMode('HISTORY')}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'HISTORY'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              Histórico ({printLogs.length})
            </button>
          </div>

          {/* Filtros de Status (Padrão Oficial HUB) */}
          <div className="labels-status flex items-center gap-2 text-xs font-medium text-[#6b7280] flex-wrap">
            <span className="pr-1 text-[#333333] font-semibold text-xs">Status:</span>
            {[
              { key: 'ALL', label: 'Todos' },
              { key: 'AVAILABLE', label: 'Pendentes' },
              { key: 'PRINTED', label: 'Impressas' },
              { key: 'ERROR', label: 'Erros' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as any)}
                className={`h-[38px] min-h-[38px] px-4.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer border whitespace-nowrap flex items-center justify-center ${
                  statusFilter === f.key
                    ? 'bg-[#000000] text-white border-[#000000] shadow-xs'
                    : 'bg-white text-[#333333] border-[#e2e8f0] hover:bg-[#F7F7F7] hover:border-[#cbd5e1] hover:text-[#000000]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campo de Busca & Filtro de Canais */}
        <div className="labels-search-row flex flex-col sm:flex-row items-center gap-3 py-1">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              type="text"
              placeholder="Buscar por pedido, SKU, produto, rastreamento ou comprador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-[42px] pl-10 pr-9 bg-white border border-[#e2e8f0] focus:border-[#000000] rounded-lg text-sm leading-normal text-[#111111] placeholder:text-[#9ca3af] focus:outline-none transition-all shadow-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#111111] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="labels-channel-filters flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {['ALL', 'MERCADO_LIVRE', 'SHOPEE', 'TIKTOK', 'MAGALU'].map(m => {
              const label = m === 'ALL' ? 'Todos Canais' : m === 'MERCADO_LIVRE' ? 'Mercado Livre' : m === 'TIKTOK' ? 'TikTok' : m === 'MAGALU' ? 'Magalu' : 'Shopee'
              const isSelected = marketplaceFilter === m
              return (
                <button
                  key={m}
                  onClick={() => setMarketplaceFilter(m)}
                  className={`h-[38px] min-h-[38px] px-4 rounded-xl text-[13px] font-semibold transition-all cursor-pointer border whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#000000] text-white border-[#000000] shadow-xs'
                      : 'bg-white text-[#333333] border-[#e2e8f0] hover:bg-[#F7F7F7] hover:border-[#cbd5e1] hover:text-[#000000]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── BARRA FLUTUANTE DE AÇÃO EM LOTE (ESTILO BRANCO CLEAN) ────────── */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-white text-[#111111] px-6 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#e2e8f0] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {selectedOrderIds.length}
            </span>
            <p className="font-bold text-sm text-[#111111]">
              {selectedOrderIds.length} etiqueta{selectedOrderIds.length > 1 ? 's' : ''} selecionada{selectedOrderIds.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors cursor-pointer px-2 py-1"
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
              <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] flex items-center justify-center mx-auto text-[#999999] mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">Nenhuma etiqueta encontrada</h3>
              <p className="text-xs text-[#666666] max-w-sm mx-auto">
                Não há etiquetas correspondentes aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f1f5f9]">
              {/* Header da Lista */}
              <div className="hidden sm:flex items-center justify-between px-6 py-4 bg-[#F7F7F7] text-xs font-semibold text-[#666666]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectCurrentPage}
                    className="cursor-pointer text-[#666666] flex items-center gap-2 hover:text-[#111111] transition-colors"
                    title="Selecionar todos da página atual"
                  >
                    {isPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#16a34a]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#cbd5e1]" />
                    )}
                    <span>Página atual ({paginatedOrders.length})</span>
                  </button>

                  {filteredOrders.length > paginatedOrders.length && (
                    <>
                      <span className="text-[#d1d5db]">|</span>
                      <button
                        onClick={selectAll}
                        className="text-xs text-[#16a34a] hover:underline font-semibold cursor-pointer"
                      >
                        {isAllFilteredSelected
                          ? 'Desmarcar todos'
                          : `Selecionar todas as ${filteredOrders.length} etiquetas`}
                      </button>
                    </>
                  )}
                </div>

                <div className="text-xs text-[#888888]">
                  Total: <strong className="text-[#111111]">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'etiqueta' : 'etiquetas'}
                </div>
              </div>

              {/* Linhas de Pedidos */}
              <div className="space-y-4 p-4 sm:p-6">
                {paginatedOrders.map(order => {
                  const isSelected = selectedOrderIds.includes(order.id)
                  return (
                    <div
                      key={order.id}
                      className={`bg-white border border-[#e6e6e6] rounded-xl py-5 px-6 sm:px-8 hover:bg-[#f8f9fa] hover:border-[#cbd5e1] transition-all shadow-2xs ${
                        isSelected ? 'bg-[#f0fdf4]/50 border-[#16a34a]' : ''
                      }`}
                    >
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                       {/* Select & Marketplace Logo */}
                       <div className="flex items-center gap-3.5 shrink-0">
                         <div onClick={e => e.stopPropagation()}>
                            <button onClick={() => toggleSelectOrder(order.id)} className="cursor-pointer shrink-0 flex items-center justify-center">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-[#16a34a]" />
                              ) : (
                                <Square className="w-5 h-5 text-[#cbd5e1] hover:text-[#666666]" />
                              )}
                            </button>
                         </div>
                         <div className="w-14 h-14 rounded-md bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center flex-shrink-0">
                           <MarketplaceLogo name={order.marketplaceName} className="w-8 h-8 object-contain flex-shrink-0" />
                         </div>
                       </div>
                       
                       <div className="flex-1 min-w-0 w-full">
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                           <div>
                             <h1 style={{ fontSize: '14px', lineHeight: '1.2' }} className="!text-[14px] leading-tight font-bold text-[#111111]">#{order.orderNumber}</h1>
                             <p className="font-medium text-[13.5px] text-[#6b7280] truncate max-w-sm leading-snug mt-1">
                               {order.productName}
                             </p>
                             <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
                               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F7F7F7] text-[#1f2328] border border-[#e5e7eb] text-xs shadow-2xs">
                                 <User className="w-3.5 h-3.5 text-[#1f2328]" />
                                 <span className="text-[#666666] font-medium">Cliente:</span>
                                 <strong className="text-[#111111] font-extrabold text-[13px]">{order.customerName}</strong>
                               </span>
                               <span className="text-sm font-semibold text-[#666666] bg-[#F7F7F7] px-2.5 py-1 rounded-xl border border-[#e2e8f0]">
                                 {order.marketplaceName}
                               </span>
                               {order.labelStatus === 'AVAILABLE' && (
                                 <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[#fef9c3] text-[#a16207]">Disponível</span>
                               )}
                               {order.labelStatus === 'PRINTED' && (
                                 <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#ecfdf5] text-[#16a34a]">Impressa</span>
                               )}
                               {order.labelStatus === 'ERROR' && (
                                 <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#fee2e2] text-[#dc2626]">Erro</span>
                               )}
                               {order.labelStatus === 'UNAVAILABLE' && (
                                 <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#f1f5f9] text-[#666666]">Indisponível</span>
                               )}
                             </div>
                           </div>
                           
                           <div className="w-full sm:w-auto sm:text-right bg-[#F7F7F7] sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#e2e8f0] shrink-0 mt-2 sm:mt-0">
                             <div className="flex items-center gap-3 justify-between sm:justify-end pb-3 sm:pb-3 border-b border-[#e2e8f0] sm:border-0">
                               <span className="sm:hidden text-xs font-semibold text-[#666]">Ações:</span>
                               <div className="flex items-center gap-2">
                                 <button
                                   onClick={(e) => { e.stopPropagation(); setPreviewOrder(order); setShowPreviewModal(true); }}
                                   className="w-11 h-10 flex items-center justify-center rounded-xl text-[#555555] hover:text-[#111111] bg-white border border-[#e6e6e6] sm:border-0 sm:bg-transparent hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                                   title="Prévia da Etiqueta"
                                 >
                                   <Eye className="w-[18px] h-[18px]" strokeWidth={2.2} />
                                 </button>
                                 <button
                                   onClick={(e) => { e.stopPropagation(); handleBatchPrint([order.id], order.labelStatus === 'PRINTED'); }}
                                   className="h-10 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-white border border-[#e2e8f0] text-[#333333] hover:border-[#000000]"
                                 >
                                   {order.labelStatus === 'PRINTED' ? 'Reimprimir' : 'Imprimir'}
                                 </button>
                               </div>
                             </div>
                              <p className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider mt-2 sm:mt-1">Rastreio</p>
                              <div className="text-xs sm:text-[13px] font-bold text-[#16a34a] mt-0.5 font-mono truncate max-w-full sm:max-w-[220px]" title={order.trackingCode}>
                                {order.trackingCode}
                              </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                )
              })}
              </div>

              {/* Limitador e Paginação em baixo */}
              {totalOrdersCount > 0 && (
                <div className="p-4 sm:p-6 border-t border-[#f1f5f9] bg-[#fafafa]/50">
                  <PaginationBar
                    currentPage={ordersPage}
                    totalItems={totalOrdersCount}
                    pageSize={ordersPageSize}
                    onPageChange={setOrdersPage}
                    onPageSizeChange={setOrdersPageSize}
                    pageSizeOptions={[10, 20, 50, 100]}
                    itemName="etiquetas"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 2: AGRUPADO POR PRODUTO                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'PRODUCTS' && (
        <div className="space-y-6">
          {paginatedProductGroups.map(group => (
            <div
              key={group.sku}
              className="bg-white rounded-3xl border border-[#eef2f6] shadow-xs p-6 sm:p-7 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-5 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-4 sm:gap-5">
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-16 h-16 rounded-2xl object-contain border border-[#e2e8f0] bg-[#F7F7F7] p-1.5 shrink-0"
                  />
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-[#111111] leading-snug">{group.name}</h3>
                    <div className="flex items-center gap-2.5 text-xs text-[#666666] flex-wrap">
                      <span className="font-mono">SKU: {group.sku}</span>
                      <span>·</span>
                      <span className="font-bold text-[#16a34a]">{group.orders.length} vendas</span>
                      <span>·</span>
                      <span>Estoque: {group.stock || 12} un.</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => selectProductOrders(group.orders)}
                    className="h-[38px] px-4 bg-white border border-[#e2e8f0] hover:border-[#000000] text-[#111111] rounded-xl text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center"
                  >
                    Selecionar Todas ({group.orders.length})
                  </button>

                  <button
                    onClick={() => handleBatchPrint(group.orders.map(o => o.id))}
                    className="h-[38px] px-4.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir {group.orders.length} etiquetas</span>
                  </button>
                </div>
              </div>

              {/* Lista dos Pedidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.orders.map(order => {
                  const isSelected = selectedOrderIds.includes(order.id)
                  return (
                    <div
                      key={order.id}
                      onClick={() => toggleSelectOrder(order.id)}
                      className={`p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#f0fdf4] border-[#86efac]'
                          : 'bg-[#fafafa] border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#16a34a] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#cbd5e1] shrink-0" />
                        )}
                        <div className="min-w-0 space-y-1">
                          <p className="font-bold text-xs text-[#111111] truncate">Pedido #{order.orderNumber}</p>
                          <p className="text-xs text-[#666666] truncate">{order.customerName}</p>
                          <p className="font-mono text-xs text-[#16a34a] font-medium">{order.trackingCode}</p>
                        </div>
                      </div>

                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2 ${
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

          {/* Limitador e Paginação em baixo - Produtos */}
          {totalProductGroupsCount > 0 && (
            <PaginationBar
              currentPage={productsPage}
              totalItems={totalProductGroupsCount}
              pageSize={productsPageSize}
              onPageChange={setProductsPage}
              onPageSizeChange={setProductsPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              itemName="produtos agrupados"
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 3: HISTÓRICO DE IMPRESSÕES                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-[#eef2f6] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#f1f5f9] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#111111]">Histórico de Impressões</h3>
              <p className="text-xs text-[#666666]">Registro cronológico de etiquetas emitidas</p>
            </div>
            <button
              onClick={fetchLabelsData}
              className="p-2 border border-[#e2e8f0] hover:border-[#000000] rounded-xl text-[#666666] hover:text-[#111111] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {paginatedLogs.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#999999]">
                Nenhum registro de impressão encontrado.
              </div>
            ) : (
              paginatedLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa]">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-[#111111]">Pedido #{log.orderNumber}</p>
                    <p className="text-xs text-[#666666]">{log.marketplace} · {log.printedAt}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-[#111111]">{log.operator}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#16a34a]">
                      {log.attempt === 1 ? '1ª Impressão' : `${log.attempt}ª Reimpressão`}
                    </span>
                    <button
                      onClick={() => {
                        const found = orders.find(o => o.orderNumber === log.orderNumber)
                        if (found) handleBatchPrint([found.id], true)
                      }}
                      className="px-3.5 py-1.5 bg-white border border-[#e2e8f0] hover:border-[#000000] text-[#111111] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Reimprimir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Limitador e Paginação em baixo - Histórico */}
          {totalLogsCount > 0 && (
            <div className="p-4 sm:p-6 border-t border-[#f1f5f9] bg-[#fafafa]/50">
              <PaginationBar
                currentPage={historyPage}
                totalItems={totalLogsCount}
                pageSize={historyPageSize}
                onPageChange={setHistoryPage}
                onPageSizeChange={setHistoryPageSize}
                pageSizeOptions={[10, 15, 30, 50]}
                itemName="registros"
              />
            </div>
          )}
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
                  <h3 className="font-bold text-base text-[#111111]">Fila de Impressão</h3>
                  <p className="text-xs text-[#666666]">Padrão térmico 100x150mm</p>
                </div>
              </div>
              {queueProgress.isFinished && (
                <button onClick={() => setShowQueueModal(false)} className="text-[#999999] hover:text-[#111111]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
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
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a] shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#111111]">Configurações da Impressora</h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-[#999999] hover:text-[#111111]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#333333] mb-1.5">Tamanho da Etiqueta</label>
                <select
                  value={printerConfig.paperSize}
                  onChange={e => setPrinterConfig({ ...printerConfig, paperSize: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#111111]"
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
                className="px-4 py-2 bg-white border border-[#e2e8f0] text-[#333333] rounded-xl text-xs font-semibold"
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
      {/* MODAL 3: PRÉ-VISUALIZAÇÃO DA ETIQUETA OFICIAL DA PLATAFORMA (PDF)    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showPreviewModal && previewOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a] font-bold shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#111111] leading-tight">
                    Etiqueta Oficial da Plataforma (PDF 100x150mm)
                  </h3>
                  <p className="text-xs text-[#666666] mt-0.5">
                    {previewOrder.marketplaceName} • Pedido #{previewOrder.orderNumber} • {previewOrder.customerName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#999999] hover:text-[#111111] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visualizador do PDF Real da Plataforma */}
            <div className="flex-1 bg-[#F7F7F7] border border-[#e2e8f0] rounded-2xl overflow-hidden min-h-[480px] flex items-center justify-center relative shadow-inner">
              <iframe
                src={`/api/shipments/mercadolivre/label?orderId=${encodeURIComponent(previewOrder.id)}&cropPackagingOnly=true#toolbar=0&navpanes=0`}
                className="w-full h-[480px] rounded-2xl bg-white border-0"
                title={`Etiqueta ${previewOrder.orderNumber}`}
              />
            </div>

            {/* Barra de Ações */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#f1f5f9]">
              <span className="text-xs text-[#999999] font-medium hidden sm:inline">
                Formato térmico padrão 100x150mm pronto para expedição
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const printUrl = `/api/shipments/mercadolivre/label?orderId=${encodeURIComponent(previewOrder.id)}&cropPackagingOnly=true`
                    window.open(printUrl, '_blank')
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-[#666666] hover:text-[#111111] hover:bg-[#f1f5f9] rounded-xl border border-[#e2e8f0] transition-colors cursor-pointer"
                >
                  Abrir PDF em Nova Aba
                </button>

                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    handleBatchPrint([previewOrder.id])
                  }}
                  className="px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
