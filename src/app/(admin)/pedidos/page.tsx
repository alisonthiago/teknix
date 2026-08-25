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
  X
} from 'lucide-react'
import { PageHeader, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { createClient } from '@/utils/supabase/client'
import { exportToExcel } from '@/utils/excel'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'

type TabType = 'pedidos' | 'separacao' | 'expedicao'

type StatusConfig = { l: string; c: string }
const SC: Record<string, StatusConfig> = {
  NOVO: { l: 'Novo', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  PAGO: { l: 'Pago', c: 'bg-[#ecfdf5] text-[#16a34a]' },
  PAID: { l: 'Pago', c: 'bg-[#ecfdf5] text-[#16a34a]' },
  AGUARDANDO_SEPARACAO: { l: 'Aguardando', c: 'bg-[#fffaf0] text-[#e67e22]' },
  EM_SEPARACAO: { l: 'Em Separação', c: 'bg-[#fffaf0] text-[#e67e22]' },
  SEPARADO: { l: 'Separado', c: 'bg-[#f0f0ff] text-[#6c5ce7]' },
  AGUARDANDO_EXPEDICAO: { l: 'Expedição', c: 'bg-[#f0f0ff] text-[#6c5ce7]' },
  ETIQUETA_IMPRESSA: { l: 'Etiqueta Impressa', c: 'bg-[#ecfdf5] text-[#16a34a]' },
  EMBALADO: { l: 'Embalado', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  ENVIADO: { l: 'Enviado', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  ENTREGUE: { l: 'Entregue', c: 'bg-[#f0fff4] text-[#38a169]' },
  CANCELADO: { l: 'Cancelado', c: 'bg-[#fff5f5] text-[#e74c3c]' },
  DEVOLVIDO: { l: 'Devolvido', c: 'bg-[#fff5f5] text-[#e74c3c]' },
}

function getStatus(status: string): StatusConfig {
  return SC[status] || { l: status || 'Processando', c: 'bg-[#f5f5f5] text-[#666]' }
}

export default function PedidosPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('pedidos')
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

  // Filtragem de pedidos
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
  }, [orders, dateFilter, search])

  // Pedidos para Separação
  const pickingOrders = useMemo(() => {
    return orders.filter((o: Record<string, unknown>) => 
      ['AGUARDANDO_SEPARACAO', 'EM_SEPARACAO', 'PAGO', 'PAID', 'NOVO', 'approved', 'ETIQUETA_IMPRESSA'].includes(o.status as string)
    )
  }, [orders])

  // Pedidos para Expedição
  const shippingOrders = useMemo(() => {
    return orders.filter((o: Record<string, unknown>) => 
      ['SEPARADO', 'EMBALADO', 'ENVIADO', 'AGUARDANDO_EXPEDICAO'].includes(o.status as string)
    )
  }, [orders])

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

      {/* ── CABEÇALHO CLEAN & ESPAÇOSO ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
            Pedidos
          </h1>
          <p className="text-sm text-[#64748b]">
            Pedidos, separação e expedição da equipe
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportAll}
            className="px-4 py-2.5 bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] text-[#475569] hover:text-[#0f172a] rounded-xl text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-[#64748b]" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={() => router.push('/etiquetas')}
            className="px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Central de Etiquetas</span>
          </button>
        </div>
      </div>

      {/* ── CARDS RESUMO COM RESPIRO ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#64748b] tracking-wide">Total de Pedidos</p>
          <p className="text-3xl font-bold text-[#0f172a]">{stats.total}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#64748b] tracking-wide">Aguardando Separação</p>
            {stats.pendingPicking > 0 && <span className="w-2 h-2 rounded-full bg-[#16a34a]" />}
          </div>
          <p className="text-3xl font-bold text-[#0f172a]">{stats.pendingPicking}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#16a34a] tracking-wide">Prontos / Enviados</p>
          <p className="text-3xl font-bold text-[#0f172a]">{stats.readyShipping + stats.sent}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#64748b] tracking-wide">Cancelados</p>
          <p className="text-3xl font-bold text-[#64748b]">{stats.canceled}</p>
        </div>
      </div>

      {/* ── ABAS MODERNAS & ESPAÇOSAS (SEM BORDAS AZUIS ANTIGAS) ─────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Abas Estilo Pílula Clean */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'pedidos'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Pedidos ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('separacao')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'separacao'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
              }`}
            >
              <Pickaxe className="w-4 h-4" />
              <span>Separação ({stats.pendingPicking})</span>
            </button>

            <button
              onClick={() => setActiveTab('expedicao')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'expedicao'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Expedição ({stats.readyShipping})</span>
            </button>
          </div>

          {/* Filtros de Data (para a aba de pedidos) */}
          {activeTab === 'pedidos' && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
              <span className="pr-1 text-[#94a3b8]">Período:</span>
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
                      ? 'bg-[#e2e8f0] text-[#0f172a] font-bold'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Campo de Busca (para a aba de pedidos) */}
        {activeTab === 'pedidos' && (
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Buscar por número do pedido, SKU, produto ou comprador..."
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
        )}
      </div>

      {/* ── BARRA FLUTUANTE DE SELEÇÃO EM LOTE (BRANCO CLEAN) ─────────────── */}
      {selectedItems.length > 0 && (
        <div className="bg-white text-[#0f172a] px-6 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#e2e8f0] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {selectedItems.length}
            </span>
            <p className="font-bold text-sm text-[#0f172a]">
              {selectedItems.length} pedido(s) selecionado(s)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer px-2 py-1"
            >
              Desmarcar
            </button>
            <button 
              onClick={() => window.open(`/api/shipments/mercadolivre/label?orderIds=${selectedItems.join(',')}&cropPackagingOnly=true`, '_blank')}
              className="px-4 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" /> Imprimir Etiquetas
            </button>
            <button onClick={handleExportSelected} className="px-3.5 py-2.5 bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569] hover:text-[#0f172a] rounded-xl text-xs font-medium border border-[#e2e8f0] cursor-pointer">
              <Download className="w-3.5 h-3.5 inline mr-1 text-[#64748b]" /> Exportar
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="px-3.5 py-2.5 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] rounded-xl text-xs font-medium border border-[#fecaca] cursor-pointer">
              <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Excluir
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ABA 1: PEDIDOS                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pedidos' && (
        <div className="bg-white rounded-3xl border border-[#eef2f6] shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#94a3b8]">Carregando pedidos...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 px-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] flex items-center justify-center mx-auto text-[#94a3b8] mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0f172a]">Nenhum pedido encontrado</h3>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto">
                {dateFilter === 'TODAY'
                  ? 'Nenhum pedido novo recebido hoje até o momento.'
                  : 'Nenhum pedido corresponde aos critérios de busca selecionados.'}
              </p>
              {dateFilter === 'TODAY' && (
                <button
                  onClick={() => setDateFilter('ALL')}
                  className="mt-3 px-4 py-2 bg-[#0f172a] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Ver Todos os Pedidos ({stats.total})
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#f1f5f9]">
              {/* Header da Tabela */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <button onClick={toggleSelectAll} className="cursor-pointer text-[#64748b]">
                    {selectedItems.length === filteredOrders.length && filteredOrders.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#16a34a]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#cbd5e1]" />
                    )}
                  </button>
                  <span className="uppercase tracking-wider text-[11px] font-bold">Produto / Pedido</span>
                </div>
                <div className="flex items-center gap-8 lg:gap-12 shrink-0 pr-4">
                  <span className="hidden md:inline uppercase tracking-wider text-[11px] font-bold min-w-[120px]">Canal</span>
                  <span className="hidden sm:inline uppercase tracking-wider text-[11px] font-bold min-w-[170px]">Destinatário & Rastreio</span>
                  <span className="uppercase tracking-wider text-[11px] font-bold min-w-[90px] text-right">Total</span>
                  <span className="uppercase tracking-wider text-[11px] font-bold min-w-[110px] text-center">Status</span>
                  <span className="uppercase tracking-wider text-[11px] font-bold min-w-[90px] text-right">Ações</span>
                </div>
              </div>

              {/* Linhas */}
              {filteredOrders.map(order => {
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

                return (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/pedidos/${order.id}`)}
                    className={`flex items-center justify-between px-6 py-5 hover:bg-[#f8f9fa] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#f0fdf4]/60' : ''
                    }`}
                  >
                    {/* Checkbox e Produto */}
                    <div className="flex items-center gap-4 min-w-0 flex-1 pr-6">
                      <div onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(order.id)} className="cursor-pointer shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-4.5 h-4.5 text-[#16a34a]" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-[#cbd5e1] hover:text-[#64748b]" />
                          )}
                        </button>
                      </div>

                      <img
                        src={productImage}
                        alt={productName}
                        className="w-13 h-13 rounded-2xl object-contain border border-[#e2e8f0] bg-[#f5f5f5] p-1 shrink-0 shadow-2xs"
                      />

                      <div className="min-w-0 space-y-1.5 flex-1">
                        <p className="font-bold text-[14px] text-[#0f172a] truncate max-w-md leading-snug">
                          {productName}
                        </p>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[11px] font-mono font-bold text-[#475569]">
                            SKU: {productSku}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#f5f5f5] border border-[#e2e8f0] text-[11px] font-mono font-bold text-[#0f172a]">
                            #{order.order_number}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Canal, Rastreio, Valor, Status, Ações */}
                    <div className="flex items-center gap-8 lg:gap-12 shrink-0 pr-4">
                      <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                        <MarketplaceLogo name={mp?.name || 'Mercado Livre'} className="w-4 h-4" />
                        <span className="text-[13px] font-semibold text-[#334155]">{mp?.name || 'Mercado Livre'}</span>
                      </div>

                      <div className="hidden sm:block min-w-[170px] space-y-1">
                        <p className="text-[13px] font-semibold text-[#0f172a] truncate max-w-[160px]">{customerName}</p>
                        <p className="font-mono text-[11px] font-bold text-[#16a34a] truncate max-w-[160px]">{order.tracking_code || 'Envio Padrão'}</p>
                      </div>

                      <div className="min-w-[90px] text-right font-black text-[14px] text-[#0f172a]">
                        R$ {totalAmount.toFixed(2).replace('.', ',')}
                      </div>

                      <div className="min-w-[110px] text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${getStatus(order.status).c}`}>
                          {getStatus(order.status).l}
                        </span>
                      </div>

                      <div className="min-w-[90px] flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => window.open(`/api/shipments/mercadolivre/label?orderId=${order.id}&cropPackagingOnly=true`, '_blank')}
                          className="px-3.5 py-1.5 bg-[#ecfdf5] hover:bg-[#16a34a] text-[#16a34a] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Etiqueta
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
      {/* ABA 2: SEPARAÇÃO (PICKING)                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'separacao' && (
        <div className="space-y-4">
          {pickingOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#eef2f6] p-16 text-center shadow-xs space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#16a34a] mx-auto mb-2" />
              <p className="text-base font-bold text-[#0f172a]">Tudo separado!</p>
              <p className="text-xs text-[#64748b]">Nenhum pedido pendente de separação no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pickingOrders.map(order => {
                const mp = order.marketplaces as any
                const items = (order.order_items as any[]) || []
                const firstItem = items[0]
                const product = firstItem?.products || null

                return (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/pedidos/${order.id}`)}
                    className="bg-white rounded-2xl border border-[#e2e8f0] p-5 cursor-pointer hover:border-[#0f172a] hover:shadow-md transition-all shadow-xs space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#0f172a]">#{order.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatus(order.status).c}`}>
                        {getStatus(order.status).l}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      {product?.image_url ? (
                        <img src={product.image_url} alt="" className="w-12 h-12 rounded-xl object-contain border border-[#e2e8f0] bg-[#f5f5f5] p-0.5 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-[#94a3b8] shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-[13px] font-bold text-[#0f172a] truncate">{product?.name || firstItem?.product_name || 'Produto'}</p>
                        <p className="text-[11px] text-[#64748b] font-mono">SKU: {product?.sku || firstItem?.sku || 'SKU'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-[#f1f5f9]">
                      <span className="font-bold text-[#16a34a]">R$ {Number(order.total_amount || 0).toFixed(2).replace('.', ',')}</span>
                      <div className="flex items-center gap-1.5 text-[#64748b]">
                        <MarketplaceLogo name={mp?.name || 'Mercado Livre'} className="w-3.5 h-3.5" />
                        <span>{mp?.name || 'Mercado Livre'}</span>
                      </div>
                    </div>

                    {['AGUARDANDO_SEPARACAO', 'PAGO', 'PAID', 'NOVO', 'approved', 'ETIQUETA_IMPRESSA'].includes(order.status) && (
                      <button 
                        onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'EM_SEPARACAO') }} 
                        className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Iniciar Separação
                      </button>
                    )}
                    {order.status === 'EM_SEPARACAO' && (
                      <button 
                        onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'SEPARADO') }} 
                        className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Separado ✓
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ABA 3: EXPEDIÇÃO (SHIPPING)                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'expedicao' && (
        <div className="space-y-4">
          {shippingOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#eef2f6] p-16 text-center shadow-xs space-y-2">
              <Send className="w-10 h-10 text-[#cbd5e1] mx-auto mb-2" />
              <p className="text-base font-bold text-[#0f172a]">Nenhum pedido na expedição</p>
              <p className="text-xs text-[#64748b]">Os pedidos separados aparecerão aqui para conferência e despacho</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shippingOrders.map(order => {
                const mp = order.marketplaces as any
                return (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/pedidos/${order.id}`)}
                    className="bg-white rounded-3xl border border-[#eef2f6] p-6 cursor-pointer hover:border-[#0f172a] transition-all shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[#0f172a]">#{order.order_number}</span>
                      <span className="text-xs font-semibold text-[#64748b] flex items-center gap-1.5">
                        <MarketplaceLogo name={mp?.name || 'Mercado Livre'} className="w-3.5 h-3.5" />
                        {mp?.name || 'Mercado Livre'}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#0f172a]">{order.customer_name || 'Comprador'}</p>
                      <p className="font-mono text-[11px] text-[#16a34a] font-bold mt-0.5">{order.tracking_code || 'Envio Padrão'}</p>
                    </div>

                    <div className="pt-2 border-t border-[#f1f5f9]">
                      {['SEPARADO', 'AGUARDANDO_EXPEDICAO'].includes(order.status) && (
                        <button 
                          onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'EMBALADO') }} 
                          className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Embalar & Colar Etiqueta
                        </button>
                      )}
                      {order.status === 'EMBALADO' && (
                        <button 
                          onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'ENVIADO') }} 
                          className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Despachar Pedido ✓
                        </button>
                      )}
                      {order.status === 'ENVIADO' && (
                        <span className="block text-center text-xs text-[#16a34a] font-bold py-2.5 bg-[#ecfdf5] rounded-xl border border-[#bbf7d0]">
                          ✓ Despachado
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
