'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  Pickaxe,
  Send,
  CheckCircle2,
  Download,
  Trash2,
  Printer,
  Package,
  Calendar,
  CheckSquare,
  Square,
  Search,
  Share2,
  Sliders,
  PlayCircle,
  ArrowLeft,
  User,
  X,
  Loader2,
} from 'lucide-react'
import { PageHeader, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import LoadingState from '@/components/ui/LoadingState'
import { createClient } from '@/utils/supabase/client'
import { exportToExcel } from '@/utils/excel'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'
import { PaginationBar, usePagination } from '@/components/ui/pagination'

type StatusConfig = { l: string; c: string }
const SC: Record<string, StatusConfig> = {
  NOVO: { l: 'Novo', c: 'bg-[#f5f5f5] text-[#1f2328]' },
  PAGO: { l: 'Pago', c: 'bg-[#ecfdf5] text-[#16a34a]' },
  PAID: { l: 'Pago', c: 'bg-[#ecfdf5] text-[#16a34a]' },
  AGUARDANDO_SEPARACAO: { l: 'Aguardando', c: 'bg-[#fffaf0] text-[#e67e22]' },
  EM_SEPARACAO: { l: 'Em Separação', c: 'bg-[#fffaf0] text-[#e67e22]' },
  SEPARADO: { l: 'Separado', c: 'bg-[#f0f0ff] text-[#6c5ce7]' },
  AGUARDANDO_EXPEDICAO: { l: 'Expedição', c: 'bg-[#f0f0ff] text-[#6c5ce7]' },
  ETIQUETA_IMPRESSA: { l: 'Etiqueta Impressa', c: 'bg-[#ecfdf5] text-[#16a34a]' },
  EMBALADO: { l: 'Embalado', c: 'bg-[#f5f5f5] text-[#1f2328]' },
  ENVIADO: { l: 'Enviado', c: 'bg-[#f5f5f5] text-[#1f2328]' },
  ENTREGUE: { l: 'Entregue', c: 'bg-[#f0fff4] text-[#38a169]' },
  CANCELADO: { l: 'Cancelado', c: 'bg-[#fff5f5] text-[#e74c3c]' },
  DEVOLVIDO: { l: 'Devolvido', c: 'bg-[#fff5f5] text-[#e74c3c]' },
}

function getStatus(status: string): StatusConfig {
  return SC[status] || { l: status || 'Processando', c: 'bg-[#f5f5f5] text-[#666]' }
}

export default function PedidosPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PRINTED' | 'SENT'>('ALL')
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7D' | '30D'>('ALL')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean
    title: string
    metadata: any
    note?: string
  }>({ isOpen: false, title: '', metadata: {} })

  // Consulta principal
  const { data: rawOrders, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('orders')
      .select('*, marketplaces(name, code, logo), order_items(*, products(name, sku, image_url, stock))')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Fallback orders query:', error)
      const { data: fbData } = await s
        .from('orders')
        .select('*, marketplaces(name, code, logo)')
        .order('created_at', { ascending: false })
      return fbData || []
    }
    return data || []
  })

  const orders = useMemo(() => rawOrders || [], [rawOrders])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    refetch()
  }

  // Ações automáticas integradas (sem precisar de abas separadas)
  const handlePrintAndAdvance = async (e: React.MouseEvent, order: any) => {
    e.stopPropagation()
    setPrintingOrderId(order.id)

    // 1. Abre a etiqueta oficial de envio
    window.open(`/api/shipments/mercadolivre/label?orderId=${order.id}&cropPackagingOnly=true`, '_blank')

    // 2. Automático: avança para ETIQUETA_IMPRESSA porque já vai direto para a embalagem
    if (['PAGO', 'PAID', 'NOVO', 'approved', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO'].includes(order.status)) {
      await updateOrderStatus(order.id, 'ETIQUETA_IMPRESSA')
    }

    setTimeout(() => {
      setPrintingOrderId(null)
    }, 1200)
  }

  const handleSeparationClick = async (e: React.MouseEvent, order: any) => {
    e.stopPropagation()
    await updateOrderStatus(order.id, 'SEPARADO')
  }

  const handleShippingClick = async (e: React.MouseEvent, order: any) => {
    e.stopPropagation()
    await updateOrderStatus(order.id, 'ENVIADO')
  }

  // Estatísticas globais
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayOrders = orders.filter((o: any) => String(o.created_at || '').slice(0, 10) === todayStr)
    const pendingPicking = orders.filter((o: any) => ['PAGO', 'PAID', 'NOVO', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO'].includes(o.status))
    const readyShipping = orders.filter((o: any) => ['SEPARADO', 'EMBALADO', 'ETIQUETA_IMPRESSA', 'AGUARDANDO_EXPEDICAO'].includes(o.status))
    const sent = orders.filter((o: any) => ['ENVIADO', 'ENTREGUE'].includes(o.status))
    const canceled = orders.filter((o: any) => o.status === 'CANCELADO')

    return {
      total: orders.length,
      today: todayOrders.length,
      pendingPicking: pendingPicking.length,
      readyShipping: readyShipping.length,
      sent: sent.length,
      canceled: canceled.length
    }
  }, [orders])

  // Filtragem de pedidos unificada
  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    return orders.filter((o: Record<string, unknown>) => {
      if (dateFilter === 'TODAY') {
        const orderDate = String(o.created_at || '').slice(0, 10)
        if (orderDate !== todayStr) return false
      } else if (dateFilter === '7D') {
        if (String(o.created_at) < sevenDaysAgo) return false
      } else if (dateFilter === '30D') {
        if (String(o.created_at) < thirtyDaysAgo) return false
      }

      if (statusFilter === 'PENDING') {
        if (!['PAGO', 'PAID', 'NOVO', 'approved', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO'].includes(String(o.status))) return false
      } else if (statusFilter === 'PRINTED') {
        if (!['SEPARADO', 'EMBALADO', 'ETIQUETA_IMPRESSA', 'AGUARDANDO_EXPEDICAO'].includes(String(o.status))) return false
      } else if (statusFilter === 'SENT') {
        if (!['ENVIADO', 'ENTREGUE'].includes(String(o.status))) return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        const matchNumber = String(o.order_number || '').toLowerCase().includes(q)
        const matchCustomer = String(o.customer_name || '').toLowerCase().includes(q)
        const items = (o.order_items as Array<Record<string, unknown>>) || []
        const matchItem = items.some(item => {
          const prod = item.products as Record<string, unknown> | null
          return (
            String(item.product_name || '').toLowerCase().includes(q) ||
            String(item.sku || '').toLowerCase().includes(q) ||
            String(prod?.name || '').toLowerCase().includes(q) ||
            String(prod?.sku || '').toLowerCase().includes(q)
          )
        })
        return matchNumber || matchCustomer || matchItem
      }

      return true
    })
  }, [orders, dateFilter, statusFilter, search])

  const {
    currentPage: pedidosPage,
    setCurrentPage: setPedidosPage,
    pageSize: pedidosPageSize,
    setPageSize: setPedidosPageSize,
    paginatedItems: paginatedOrders,
    totalItems: totalPedidosCount,
  } = usePagination(filteredOrders, 10)

  // Seleções
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredOrders.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredOrders.map((o: any) => o.id as string))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const confirmDelete = async () => {
    const supabase = createClient()
    await supabase.from('orders').delete().in('id', selectedItems)
    setSelectedItems([])
    setShowDeleteModal(false)
    refetch()
  }

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return
    const dataToExport = orders?.filter((o: any) => selectedItems.includes(o.id)) || []
    exportToExcel(dataToExport, 'pedidos_selecionados')
    setSelectedItems([])
  }

  const handleExportAll = () => {
    exportToExcel(orders || [], 'todos_os_pedidos')
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-200 pb-28 pt-2">
      
      {/* Modais */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemName={`${selectedItems.length} pedido(s) selecionado(s)`}
        description="Esta ação removerá permanentemente os pedidos selecionados do banco de dados."
        actionWord="EXCLUIR"
        actionTitle="Exclusão de Pedidos"
      />

      {shareModal.isOpen && (
        <ShareContextModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal(prev => ({ ...prev, isOpen: false }))}
          title={shareModal.title}
          messageType="CARD_ORDER"
          metadata={shareModal.metadata}
          defaultNote={shareModal.note}
        />
      )}

      {/* ── CABEÇALHO CLEAN & ESPAÇOSO (HUB 1:1) ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
        {/* Título Mobile (Escondido no desktop) */}
        <div className="hub-mobile-header-title-row lg:hidden !justify-start gap-3">
          <button type="button" className="hub-mobile-back-btn" aria-label="Voltar" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="hub-mobile-page-title !text-[16px]">
            Pedidos
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleExportAll}
            className="h-[36px] px-4 bg-white border border-[#e6e6e6] hover:bg-[#F7F7F7] hover:border-[#d1d5db] text-[#333333] rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none"
          >
            <Download className="w-4 h-4 text-[#666666]" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={() => router.push('/etiquetas')}
            className="h-[36px] px-4 bg-[#0071e3] hover:bg-[#0062c4] text-white rounded-lg text-[13.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-none"
          >
            <Printer className="w-4 h-4" />
            <span>Central de Etiquetas</span>
          </button>
        </div>
      </div>

      {/* ── CARDS RESUMO COM RESPIRO ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#e6e6e6] shadow-none space-y-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#8a8a8a] tracking-wider uppercase">Total de Pedidos</p>
          <p className="text-xl sm:text-3xl font-bold text-[#111111] tracking-tight">{stats.total}</p>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#e6e6e6] shadow-none space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-semibold text-[#8a8a8a] tracking-wider uppercase">Aguardando Separação</p>
            {stats.pendingPicking > 0 && <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />}
          </div>
          <p className="text-xl sm:text-3xl font-bold text-[#111111] tracking-tight">{stats.pendingPicking}</p>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#e6e6e6] shadow-none space-y-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#16a34a] tracking-wider uppercase">Prontos / Enviados</p>
          <p className="text-xl sm:text-3xl font-bold text-[#111111] tracking-tight">{stats.readyShipping + stats.sent}</p>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#e6e6e6] shadow-none space-y-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#8a8a8a] tracking-wider uppercase">Cancelados</p>
          <p className="text-xl sm:text-3xl font-bold text-[#8a8a8a] tracking-tight">{stats.canceled}</p>
        </div>
      </div>

      {/* ── FILTROS E BUSCA INTEGRADA ──────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Status Pills Unificados */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F7F7F7] rounded-2xl border border-[#e6e6e6] text-xs font-semibold overflow-x-auto max-w-full">
            {[
              { key: 'ALL', label: 'Todos', count: stats.total },
              { key: 'PENDING', label: 'Aguardando Separação', count: stats.pendingPicking },
              { key: 'PRINTED', label: 'Prontos / Impressos', count: stats.readyShipping },
              { key: 'SENT', label: 'Enviados', count: stats.sent },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as any)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  statusFilter === f.key
                    ? 'bg-[#1f2328] text-white shadow-sm'
                    : 'text-[#666] hover:bg-[#f1f5f9] hover:text-[#111]'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-[2px] rounded-full font-extrabold ${statusFilter === f.key ? 'bg-white/20 text-white' : 'bg-[#e6e6e6] text-[#666]'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filtros de Data */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#666666]">
            <span className="pr-1 text-[#999999]">Período:</span>
            {[
              { key: 'ALL', label: 'Todos' },
              { key: 'TODAY', label: `Hoje (${stats.today})` },
              { key: '7D', label: '7 dias' },
              { key: '30D', label: '30 dias' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  dateFilter === f.key
                    ? 'bg-[#e2e8f0] text-[#111111] font-bold'
                    : 'bg-[#F7F7F7] text-[#666666] hover:bg-[#f1f5f9] hover:text-[#111111]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            placeholder="Buscar por número do pedido, SKU, produto ou comprador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e6e6e6] focus:border-[#1f2328] focus:ring-1 focus:ring-[#1f2328]/10 rounded-lg text-[13.5px] text-[#111111] placeholder:text-[#999999] focus:outline-none transition-colors shadow-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#111111]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── BARRA FLUTUANTE DE SELEÇÃO EM LOTE (BRANCO CLEAN) ─────────────── */}
      {selectedItems.length > 0 && (
        <div className="bg-white text-[#111111] px-5 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#e6e6e6] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-bold text-xs shadow-none">
              {selectedItems.length}
            </span>
            <p className="font-semibold text-[13.5px] text-[#111111]">
              {selectedItems.length} pedido(s) selecionado(s)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors cursor-pointer px-2 py-1"
            >
              Desmarcar
            </button>
            <button 
              onClick={() => window.open(`/api/shipments/mercadolivre/label?orderIds=${selectedItems.join(',')}&cropPackagingOnly=true`, '_blank')}
              className="px-3.5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-none"
            >
              <Printer className="w-4 h-4" /> Imprimir Etiquetas
            </button>
            <button onClick={handleExportSelected} className="px-3.5 py-2 bg-white hover:bg-[#F7F7F7] text-[#333333] hover:text-[#111111] rounded-lg text-xs font-medium border border-[#e6e6e6] cursor-pointer">
              <Download className="w-3.5 h-3.5 inline mr-1 text-[#666666]" /> Exportar
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="px-3.5 py-2 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] rounded-lg text-xs font-medium border border-[#fecaca] cursor-pointer">
              <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Excluir
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PEDIDOS (LISTA UNIFICADA COM AÇÕES AUTOMÁTICAS INTEGRADAS)          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] shadow-none overflow-hidden">
        {loading ? (
          <LoadingState message="Carregando pedidos..." padding={80} />
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] flex items-center justify-center mx-auto text-[#999999] mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Nenhum pedido encontrado</h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              {dateFilter === 'TODAY'
                ? 'Nenhum pedido novo recebido hoje até o momento.'
                : 'Nenhum pedido corresponde aos critérios de busca selecionados.'}
            </p>
            {dateFilter === 'TODAY' && (
              <button
                onClick={() => setDateFilter('ALL')}
                className="mt-3 px-4 py-2 bg-[#000000] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ver Todos os Pedidos ({stats.total})
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {/* Header da Tabela (Oculto no Mobile) */}
            <div className="hidden sm:flex items-center justify-between px-6 sm:px-8 py-4 bg-[#F7F7F7] text-xs font-semibold text-[#666666]">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <button onClick={toggleSelectAll} className="cursor-pointer text-[#666666]">
                  {selectedItems.length === filteredOrders.length && filteredOrders.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-[#16a34a]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#cbd5e1]" />
                  )}
                </button>
                <span className="text-xs font-medium text-[#999]">Produto / Pedido</span>
              </div>
              <div className="flex items-center gap-8 lg:gap-12 shrink-0 pr-4">
                <span className="hidden md:inline text-xs font-medium text-[#999] min-w-[120px]">Canal</span>
                <span className="hidden sm:inline text-xs font-medium text-[#999] min-w-[170px]">Destinatário & Rastreio</span>
                <span className="text-xs font-medium text-[#999] min-w-[90px] text-right">Total</span>
                <span className="text-xs font-medium text-[#999] min-w-[110px] text-center">Status</span>
                <span className="text-xs font-medium text-[#999] min-w-[90px] text-right">Ações</span>
              </div>
            </div>

            {/* Linhas de Pedidos com espaçamento externo (direita e esquerda) */}
            <div className="space-y-4 p-4 sm:p-6">
              {paginatedOrders.map(order => {
                const isSelected = selectedItems.includes(order.id)
                const mp = order.marketplaces as any
                const items = (order.order_items as any[]) || []
                const firstItem = items[0]
                const product = firstItem?.products || null
                const productImage = product?.image_url || firstItem?.image_url || 'https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp'
                const productName = product?.name || firstItem?.product_name || 'Produto'
                const productSku = product?.sku || firstItem?.sku || 'SKU-PADRAO'
                const customerName = order.customer_name || 'Comprador'
                const totalAmount = Number(order.total_amount || 0)

                const isPrinted = ['ETIQUETA_IMPRESSA', 'EMBALADO', 'ENVIADO', 'ENTREGUE'].includes(order.status)
                const isSeparated = ['SEPARADO', 'ETIQUETA_IMPRESSA', 'EMBALADO', 'ENVIADO', 'ENTREGUE'].includes(order.status)
                const isSent = ['ENVIADO', 'ENTREGUE'].includes(order.status)

                return (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/pedidos/${order.id}`)}
                    className={`bg-white border border-[#e6e6e6] rounded-xl py-5 px-6 sm:px-8 cursor-pointer hover:bg-[#f8f9fa] hover:border-[#cbd5e1] transition-all shadow-2xs ${
                      isSelected ? 'bg-[#f0fdf4]/60 border-[#16a34a]' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      
                      {/* Select & Marketplace Logo */}
                      <div className="flex items-center gap-3.5 shrink-0">
                        <div onClick={e => e.stopPropagation()}>
                          <button onClick={() => toggleSelect(order.id)} className="cursor-pointer shrink-0 flex items-center justify-center">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-[#16a34a]" />
                            ) : (
                              <Square className="w-5 h-5 text-[#cbd5e1] hover:text-[#666666]" />
                            )}
                          </button>
                        </div>
                        <div className="w-14 h-14 rounded-md bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center flex-shrink-0">
                           <MarketplaceLogo name={mp?.name || 'Mercado Livre'} className="w-8 h-8 object-contain flex-shrink-0" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h1 style={{ fontSize: '14px', lineHeight: '1.2' }} className="!text-[14px] font-bold text-[#111111]">#{order.order_number}</h1>
                            <p className="font-medium text-[13.5px] text-[#1f2328] truncate max-w-sm leading-snug mt-1">
                              {productName}
                            </p>
                            <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F7F7F7] text-[#1f2328] border border-[#e5e7eb] text-xs shadow-2xs">
                                <User className="w-3.5 h-3.5 text-[#1f2328]" />
                                <span className="text-[#666666] font-medium">Cliente:</span>
                                <strong className="text-[#111111] font-extrabold text-[13px]">{customerName}</strong>
                              </span>
                              <span className="text-sm font-semibold text-[#666666] bg-[#F7F7F7] px-2.5 py-1 rounded-xl border border-[#e2e8f0]">
                                {mp?.name || 'Mercado Livre'}
                              </span>
                              <span className={`inline-flex px-2.5 py-1 rounded-xl text-sm font-bold bg-[#f5f5f5] text-[#666] ${getStatus(order.status).c}`}>
                                {getStatus(order.status).l}
                              </span>
                            </div>
                          </div>
                          <div className="sm:text-right bg-[#F7F7F7] sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-[#e2e8f0] shrink-0 mt-2 sm:mt-0">
                            
                            {/* Ações Rápidas Automáticas: Imprimir, Separação, Expedição */}
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-0 sm:mt-1 pb-3 sm:pb-4 justify-between sm:justify-end flex-wrap">
                              <span className="sm:hidden text-xs font-semibold text-[#666]">Ações:</span>

                              {/* 1. IMPRIMIR (Automático: abre a etiqueta e avança direto para embalagem) */}
                              <button
                                onClick={(e) => handlePrintAndAdvance(e, order)}
                                style={{ minHeight: '32px', height: '32px' }}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0 rounded-lg transition-colors shadow-xs cursor-pointer ${
                                  printingOrderId === order.id
                                    ? 'bg-[#1f2328] text-white border border-[#1f2328]'
                                    : isPrinted
                                    ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] hover:bg-[#dcfce7]'
                                    : 'bg-white border border-[#e6e6e6] text-[#444444] hover:bg-[#f5f5f5] hover:border-[#d0d0d0]'
                                }`}
                                title={isPrinted ? "Etiqueta impressa. Clique para reimprimir" : "Imprimir etiqueta e marcar como pronto para embalagem"}
                              >
                                {printingOrderId === order.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                    <span>Imprimindo...</span>
                                  </>
                                ) : isPrinted ? (
                                  <>
                                    <Printer className="w-3.5 h-3.5 text-[#16a34a]" />
                                    <span>Impresso</span>
                                  </>
                                ) : (
                                  <>
                                    <Printer className="w-3.5 h-3.5 text-[#444444]" />
                                    <span>Imprimir</span>
                                  </>
                                )}
                              </button>

                              {/* 2. SEPARAÇÃO (Automático quando impresso ou manual com 1 clique) */}
                              <button
                                onClick={(e) => handleSeparationClick(e, order)}
                                style={{ minHeight: '32px', height: '32px' }}
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0 rounded-lg transition-colors shadow-xs cursor-pointer ${
                                  isSeparated
                                    ? 'bg-[#f0f0ff] border border-[#d8d5fb] text-[#6c5ce7] font-semibold'
                                    : 'bg-white border border-[#e6e6e6] text-[#444444] hover:bg-[#f5f5f5] hover:border-[#d0d0d0]'
                                }`}
                                title={isSeparated ? "Produto já separado" : "Clique para marcar como separado"}
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${isSeparated ? 'text-[#6c5ce7]' : 'text-[#666666]'}`} />
                                <span>{isSeparated ? 'Separado' : 'Separação'}</span>
                              </button>

                              {/* 3. EXPEDIÇÃO (Despachar para transportadora/correios) */}
                              <button
                                onClick={(e) => handleShippingClick(e, order)}
                                style={{ minHeight: '32px', height: '32px' }}
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0 rounded-lg transition-colors shadow-xs cursor-pointer ${
                                  isSent
                                    ? 'bg-[#ecfdf5] border border-[#bbf7d0] text-[#16a34a] font-semibold'
                                    : isPrinted || isSeparated
                                    ? 'bg-[#1f2328] hover:bg-black text-white border border-[#1f2328]'
                                    : 'bg-white border border-[#e6e6e6] text-[#444444] hover:bg-[#f5f5f5] hover:border-[#d0d0d0]'
                                }`}
                                title={isSent ? "Pedido despachado / enviado" : "Clique para marcar como despachado"}
                              >
                                <Send className={`w-3.5 h-3.5 ${isSent ? 'text-[#16a34a]' : isPrinted || isSeparated ? 'text-white' : 'text-[#666666]'}`} />
                                <span>{isSent ? 'Despachado' : 'Expedição'}</span>
                              </button>
                            </div>

                            <p className="text-sm font-bold text-[#666666] uppercase tracking-wider">Total do Pedido</p>
                            <div className="text-2xl sm:text-3xl font-black text-[#111111] mt-0.5">
                              R$ {totalAmount.toFixed(2).replace('.', ',')}
                            </div>
                            <div className="text-xs font-semibold text-[#666666] mt-1.5 flex sm:justify-end items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#999999]" /> 
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Limitador / Paginação em baixo */}
            {filteredOrders.length > 0 && (
              <div className="p-4 sm:p-6 pt-2 border-t border-[#eee] bg-[#fafafa]/40">
                <PaginationBar
                  currentPage={pedidosPage}
                  totalItems={totalPedidosCount}
                  pageSize={pedidosPageSize}
                  onPageChange={setPedidosPage}
                  onPageSizeChange={setPedidosPageSize}
                  pageSizeOptions={[10, 25, 50, 100]}
                  itemName="pedidos"
                />
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
