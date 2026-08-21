'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList,
  Pickaxe,
  Send,
  CheckCircle2,
  Download,
  Trash2,
  Printer,
  Package,
  User,
  Store,
  Share2,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  Search,
  Truck,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { createClient } from '@/utils/supabase/client'
import { exportToExcel } from '@/utils/excel'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'

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

function OrdersTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7D' | '30D'>('ALL')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean
    title: string
    metadata: any
    note?: string
  }>({ isOpen: false, title: '', metadata: {} })

  const { data: rawOrders, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('orders')
      .select('*, marketplaces(name, code, logo), order_items(*, products(name, sku, image_url))')
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

  const orders = useMemo(() => {
    return rawOrders || []
  }, [rawOrders])

  // Filtragem por data e busca
  const filtered = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    return orders.filter((o: Record<string, unknown>) => {
      // Filtro de Data
      if (dateFilter === 'TODAY') {
        const orderDate = String(o.created_at || '').slice(0, 10)
        if (orderDate !== todayStr) return false
      } else if (dateFilter === '7D') {
        if (String(o.created_at) < sevenDaysAgo) return false
      } else if (dateFilter === '30D') {
        if (String(o.created_at) < thirtyDaysAgo) return false
      }

      // Busca Textual
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

  const toggleSelectAll = () => {
    if (selectedItems.length === filtered.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filtered.map((o: any) => o.id as string))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteSelected = () => {
    setShowDeleteModal(true)
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
    <div className="space-y-4">
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

      {/* ── CARDS DE ESTATÍSTICAS OPERACIONAIS ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#64748b] tracking-wide">Total de Pedidos</p>
          <p className="text-2xl font-bold text-[#0f172a]">{stats.total}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#e67e22] tracking-wide">Aguardando Separação</p>
            {stats.pendingPicking > 0 && <span className="w-2 h-2 rounded-full bg-[#e67e22] animate-ping" />}
          </div>
          <p className="text-2xl font-bold text-[#e67e22]">{stats.pendingPicking}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#16a34a] tracking-wide">Prontos / Enviados</p>
          <p className="text-2xl font-bold text-[#0f172a]">{stats.readyShipping + stats.sent}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#64748b] tracking-wide">Cancelados</p>
          <p className="text-2xl font-bold text-[#64748b]">{stats.canceled}</p>
        </div>
      </div>

      {/* ── FILTROS DE PERÍODO & BARRA DE BUSCA ────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-[#eef2f6] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Filtros Rápidos de Data */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-[#94a3b8] pr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Período:
            </span>
            {[
              { key: 'ALL', label: 'Todos os Pedidos' },
              { key: 'TODAY', label: `Hoje (${stats.today})` },
              { key: '7D', label: 'Últimos 7 dias' },
              { key: '30D', label: 'Últimos 30 dias' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                  dateFilter === f.key
                    ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                    : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Ações de Exportação */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="px-3.5 py-1.5 bg-white border border-[#e2e8f0] hover:border-[#0f172a] text-[#334155] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#64748b]" />
              Exportar Todos
            </button>
          </div>
        </div>

        {/* Campo de Busca */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Buscar por número do pedido, SKU, produto ou comprador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] focus:bg-white focus:border-[#0f172a] rounded-xl text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── BARRA FLUTUANTE DE SELEÇÃO EM LOTE ─────────────────────────────── */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-lg animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#16a34a] text-white flex items-center justify-center font-bold text-xs">
              {selectedItems.length}
            </span>
            <span className="text-xs font-semibold">pedido(s) selecionado(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.open(`/api/shipments/mercadolivre/label?orderIds=${selectedItems.join(',')}&cropPackagingOnly=true`, '_blank')}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#16a34a] px-3 py-1.5 rounded-xl hover:bg-[#15803d] transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Etiquetas ({selectedItems.length})
            </button>
            <button onClick={handleExportSelected} className="flex items-center gap-1 text-xs font-medium text-[#cbd5e1] hover:text-white px-2.5 py-1.5 rounded-lg cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
            <button onClick={handleDeleteSelected} className="flex items-center gap-1 text-xs font-medium text-[#fca5a5] hover:text-white px-2.5 py-1.5 rounded-lg cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </div>
        </div>
      )}

      {/* ── TABELA DE PEDIDOS ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#eef2f6] p-12 text-center text-xs text-[#94a3b8]">
          Carregando pedidos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#eef2f6] p-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] flex items-center justify-center mx-auto text-[#94a3b8] mb-2">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#0f172a]">Nenhum pedido encontrado</p>
          <p className="text-xs text-[#64748b] max-w-sm mx-auto">
            {dateFilter === 'TODAY' 
              ? 'Nenhum pedido novo recebido hoje até o momento. Selecione "Todos os Pedidos" para ver os anteriores.'
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
        <ModuleTable>
          <TableHead>
            <Th className="w-10 text-center">
              <input 
                type="checkbox" 
                checked={selectedItems.length === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-[#cbd5e1] text-[#16a34a] focus:ring-[#16a34a]"
              />
            </Th>
            <Th>Produto & Pedido</Th>
            <Th>Marketplace</Th>
            <Th>Cliente</Th>
            <Th className="text-right">Total</Th>
            <Th className="text-center">Status</Th>
            <Th className="text-right w-28">Ações</Th>
          </TableHead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {filtered.map((o: Record<string, unknown>) => {
              const mp = o.marketplaces as Record<string, unknown> | null
              const items = (o.order_items as Array<Record<string, unknown>>) || []
              const firstItem = items[0]
              const product = (firstItem?.products as Record<string, unknown>) || null
              
              const productImage = (product?.image_url as string) || (firstItem?.image_url as string) || 'https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp'
              const productName = (product?.name as string) || (firstItem?.product_name as string) || 'Produto'
              const productSku = (product?.sku as string) || (firstItem?.sku as string) || 'SKU-PADRAO'
              const customerName = (o.customer_name as string) || 'Comprador'
              const totalAmount = Number(o.total_amount || 0)

              return (
                <tr key={o.id as string} onClick={() => router.push(`/pedidos/${o.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer group">
                  <Td className="text-center">
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(o.id as string)}
                        onChange={() => toggleSelect(o.id as string)}
                        className="rounded border-[#cbd5e1] text-[#16a34a] focus:ring-[#16a34a]"
                      />
                    </div>
                  </Td>
                  
                  {/* FOTO DO PRODUTO + TÍTULO + SKU + CÓDIGO DO PEDIDO */}
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                        {productImage ? (
                          <img src={productImage} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-5 h-5 text-[#94a3b8]" />
                        )}
                      </div>
                      <div className="min-w-0 max-w-xs sm:max-w-sm">
                        <p className="font-bold text-xs text-[#0f172a] line-clamp-1 group-hover:text-[#16a34a] transition-colors leading-tight">
                          {productName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-[#64748b]">
                            {o.order_number as string}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#f1f5f9] text-[#475569] font-bold">
                            SKU: {productSku}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Td>

                  {/* MARKETPLACE */}
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <MarketplaceLogo name={(mp?.name as string) || 'Mercado Livre'} className="w-4 h-4" />
                      <span className="text-xs font-semibold text-[#0f172a]">{(mp?.name as string) || 'Mercado Livre'}</span>
                    </div>
                  </Td>

                  {/* CLIENTE */}
                  <Td>
                    <p className="font-semibold text-xs text-[#0f172a]">{customerName}</p>
                    <p className="text-[10px] text-[#94a3b8] font-mono">{o.tracking_code as string || 'Envio Padrão'}</p>
                  </Td>

                  {/* VALOR TOTAL */}
                  <Td className="text-right">
                    <span className="font-bold text-xs text-[#16a34a]">
                      R$ {totalAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </Td>

                  {/* STATUS */}
                  <Td className="text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatus(o.status as string).c}`}>
                      {getStatus(o.status as string).l}
                    </span>
                  </Td>

                  {/* AÇÕES */}
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => window.open(`/api/shipments/mercadolivre/label?orderId=${o.id}&cropPackagingOnly=true`, '_blank')}
                        className="px-2.5 py-1 bg-[#ecfdf5] text-[#16a34a] hover:bg-[#16a34a] hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Imprimir Etiqueta Térmica"
                      >
                        <Printer className="w-3 h-3" />
                        Etiqueta
                      </button>

                      <button
                        onClick={() => setShareModal({
                          isOpen: true,
                          title: `Pedido #${o.order_number}`,
                          metadata: {
                            order_id: o.id,
                            order_number: o.order_number,
                            customer_name: customerName,
                            product_name: productName,
                            product_sku: productSku,
                            product_image: productImage,
                            total_amount: totalAmount,
                            marketplace_name: (mp?.name as string) || 'Mercado Livre'
                          },
                          note: 'Conferência operacional deste pedido.'
                        })}
                        className="p-1.5 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg transition-all cursor-pointer"
                        title="Compartilhar no Chat"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#3b82f6]" />
                      </button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
    </div>
  )
}

function PickingTab() {
  const router = useRouter()
  const { data: rawOrders, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('orders')
      .select('*, marketplaces(name, code, logo), order_items(*, products(name, sku, image_url, stock))')
      .order('created_at', { ascending: false })
    
    if (error) {
      const { data: fbData } = await s.from('orders').select('*, marketplaces(name, code, logo), order_items(*)').order('created_at', { ascending: false })
      return fbData || []
    }
    return data || []
  })

  const orders = rawOrders || []

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    refetch()
  }

  const pending = useMemo(() => {
    return orders.filter((o: Record<string, unknown>) => 
      ['AGUARDANDO_SEPARACAO', 'EM_SEPARACAO', 'PAGO', 'PAID', 'NOVO', 'approved', 'ETIQUETA_IMPRESSA'].includes(o.status as string)
    )
  }, [orders])

  const stats = useMemo(() => {
    return {
      waiting: pending.filter((o: any) => ['AGUARDANDO_SEPARACAO', 'PAGO', 'PAID', 'NOVO', 'approved', 'ETIQUETA_IMPRESSA'].includes(o.status)).length,
      inPicking: pending.filter((o: any) => o.status === 'EM_SEPARACAO').length,
      separated: orders.filter((o: any) => ['SEPARADO', 'EMBALADO'].includes(o.status)).length
    }
  }, [pending, orders])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#e67e22] tracking-wide">Aguardando Separação</p>
          <p className="text-2xl font-bold text-[#e67e22]">{stats.waiting}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#3b82f6] tracking-wide">Em Separação</p>
          <p className="text-2xl font-bold text-[#3b82f6]">{stats.inPicking}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#16a34a] tracking-wide">Separados / Prontos</p>
          <p className="text-2xl font-bold text-[#16a34a]">{stats.separated}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#eef2f6] p-12 text-center text-xs text-[#94a3b8]">Carregando pedidos de separação...</div>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#eef2f6] p-16 text-center shadow-xs space-y-2">
          <CheckCircle2 className="w-10 h-10 text-[#16a34a] mx-auto mb-2" />
          <p className="text-base font-bold text-[#0f172a]">Tudo separado!</p>
          <p className="text-xs text-[#64748b]">Nenhum pedido pendente de separação no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pending.map((o: Record<string, unknown>) => {
            const mp = o.marketplaces as Record<string, unknown> | null
            const items = (o.order_items as Array<Record<string, unknown>>) || []
            const firstItem = items[0]
            const product = firstItem?.products as Record<string, unknown> | null

            return (
              <div key={o.id as string} onClick={() => router.push(`/pedidos/${o.id}`)} className="bg-white rounded-2xl border border-[#eef2f6] p-5 cursor-pointer hover:border-[#0f172a] transition-all shadow-xs group space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#0f172a]">#{o.order_number as string}</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatus(o.status as string).c}`}>{getStatus(o.status as string).l}</span>
                </div>

                <div className="flex items-center gap-3">
                  {product?.image_url ? (
                    <img src={product.image_url as string} alt="" className="w-10 h-10 rounded-xl object-contain border border-[#e2e8f0] bg-[#f8fafc] p-0.5 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0f172a] truncate">{String(product?.name || firstItem?.product_name || 'Produto')}</p>
                    <p className="text-[11px] text-[#64748b] font-mono">SKU: {String(product?.sku || firstItem?.sku || 'SKU')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#f1f5f9]">
                  <span className="font-bold text-[#16a34a]">R$ {Number(o.total_amount || 0).toFixed(2).replace('.', ',')}</span>
                  <div className="flex items-center gap-1.5 text-[#64748b] font-medium">
                    <MarketplaceLogo name={(mp?.name as string) || 'Mercado Livre'} className="w-3.5 h-3.5" />
                    <span>{(mp?.name as string) || 'Mercado Livre'}</span>
                  </div>
                </div>

                {['AGUARDANDO_SEPARACAO', 'PAGO', 'PAID', 'NOVO', 'approved', 'ETIQUETA_IMPRESSA'].includes(o.status as string) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id as string, 'EM_SEPARACAO') }} 
                    className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Iniciar Separação
                  </button>
                )}
                {o.status === 'EM_SEPARACAO' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id as string, 'SEPARADO') }} 
                    className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Marcar como Separado ✓
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ShippingTab() {
  const router = useRouter()
  const { data: rawOrders, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('orders')
      .select('*, marketplaces(name, code, logo), order_items(*, products(name, sku, image_url))')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })

  const orders = rawOrders || []

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    refetch()
  }

  const ready = useMemo(() => {
    return orders.filter((o: Record<string, unknown>) => 
      ['SEPARADO', 'EMBALADO', 'ENVIADO', 'AGUARDANDO_EXPEDICAO'].includes(o.status as string)
    )
  }, [orders])

  const stats = useMemo(() => {
    return {
      readyToPack: ready.filter((o: any) => ['SEPARADO', 'AGUARDANDO_EXPEDICAO'].includes(o.status)).length,
      packed: ready.filter((o: any) => o.status === 'EMBALADO').length,
      shipped: orders.filter((o: any) => ['ENVIADO', 'ENTREGUE'].includes(o.status)).length
    }
  }, [ready, orders])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#0284c7] tracking-wide">Prontos para Embalagem</p>
          <p className="text-2xl font-bold text-[#0284c7]">{stats.readyToPack}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#16a34a] tracking-wide">Embalados (Aguardando Coleta)</p>
          <p className="text-2xl font-bold text-[#16a34a]">{stats.packed}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#eef2f6] shadow-xs space-y-1">
          <p className="text-xs font-semibold text-[#64748b] tracking-wide">Despachados / Enviados</p>
          <p className="text-2xl font-bold text-[#0f172a]">{stats.shipped}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#eef2f6] p-12 text-center text-xs text-[#94a3b8]">Carregando expedição...</div>
      ) : ready.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#eef2f6] p-16 text-center shadow-xs space-y-2">
          <Send className="w-10 h-10 text-[#cbd5e1] mx-auto mb-2" />
          <p className="text-base font-bold text-[#0f172a]">Nenhum pedido na expedição</p>
          <p className="text-xs text-[#64748b]">Os pedidos separados aparecerão aqui para conferência e despacho</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ready.map((o: Record<string, unknown>) => {
            const mp = o.marketplaces as Record<string, unknown> | null
            return (
              <div key={o.id as string} onClick={() => router.push(`/pedidos/${o.id}`)} className="bg-white rounded-2xl border border-[#eef2f6] p-5 cursor-pointer hover:border-[#0f172a] transition-all shadow-xs group space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#0f172a]">#{o.order_number as string}</span>
                  <span className="text-xs font-semibold text-[#64748b] flex items-center gap-1.5">
                    <MarketplaceLogo name={(mp?.name as string) || 'Mercado Livre'} className="w-3.5 h-3.5" />
                    {(mp?.name as string) || 'Mercado Livre'}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#0f172a]">{(o.customer_name as string) || 'Comprador'}</p>
                  <p className="font-mono text-[11px] text-[#16a34a] font-bold mt-0.5">{o.tracking_code as string || 'Envio Padrão'}</p>
                </div>

                <div className="pt-2 border-t border-[#f1f5f9]">
                  {['SEPARADO', 'AGUARDANDO_EXPEDICAO'].includes(o.status as string) && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id as string, 'EMBALADO') }} 
                      className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Embalar & Colar Etiqueta
                    </button>
                  )}
                  {o.status === 'EMBALADO' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id as string, 'ENVIADO') }} 
                      className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Despachar Pedido ✓
                    </button>
                  )}
                  {o.status === 'ENVIADO' && (
                    <span className="block text-center text-xs text-[#16a34a] font-bold py-2 bg-[#ecfdf5] rounded-xl border border-[#bbf7d0]">
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
  )
}

export default function PedidosPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos" description="Gerencie pedidos, separação e expedição da equipe" />
      <Tabs defaultValue="pedidos" className="space-y-4">
        <TabsList className="bg-[#f1f5f9] p-1 rounded-2xl w-fit">
          <TabsTrigger value="pedidos" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-[#0f172a] data-[state=active]:shadow-xs">
            <ClipboardList className="w-3.5 h-3.5 mr-1.5 inline" /> Pedidos
          </TabsTrigger>
          <TabsTrigger value="separacao" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-[#0f172a] data-[state=active]:shadow-xs">
            <Pickaxe className="w-3.5 h-3.5 mr-1.5 inline" /> Separação
          </TabsTrigger>
          <TabsTrigger value="expedicao" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-[#0f172a] data-[state=active]:shadow-xs">
            <Send className="w-3.5 h-3.5 mr-1.5 inline" /> Expedição
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos"><OrdersTab /></TabsContent>
        <TabsContent value="separacao"><PickingTab /></TabsContent>
        <TabsContent value="expedicao"><ShippingTab /></TabsContent>
      </Tabs>
    </div>
  )
}
