'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Download, Upload, Package, Truck, ShoppingCart, Warehouse, Eye, Edit, Trash2, ClipboardCheck, CheckCircle2, AlertTriangle, Building2, Ban, Printer, Share2, Layers, ChevronRight, MapPin, Clock, FileSpreadsheet, FileText, ChevronDown, X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, PrimaryButton, SecondaryButton, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'
import { exportToExcel, importFromExcel, exportToPDF, type ExportColumnDef } from '@/utils/excel'
import dynamic from 'next/dynamic'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useNotification } from '@/contexts/NotificationContext'
import ProductMarketplaceActionModal from '@/components/ProductMarketplaceActionModal'
import ProductDiagnosticModal from '@/components/ProductDiagnosticModal'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'
import { PauseCircle, PlayCircle, Lock, Unlock, RefreshCw, Info, MoreHorizontal, MoreVertical, ShieldAlert, AlertCircle } from 'lucide-react'

const ProductCreateModal = dynamic(() => import('@/components/ProductCreateModal'), { ssr: false })
const SupplierCreateModal = dynamic(() => import('@/components/SupplierCreateModal'), { ssr: false })
const PurchaseCreateModal = dynamic(() => import('@/components/PurchaseCreateModal'), { ssr: false })
const DeleteConfirmationModal = dynamic(() => import('@/components/DeleteConfirmationModal'), { ssr: false })
import LoadingState from '@/components/ui/LoadingState'
import { PaginationBar, usePagination } from '@/components/ui/pagination'
import { matchesSearchQuery } from '@/lib/utils'

function summarizeTitle(title?: string, maxLength = 36) {
  if (!title) return ''
  const clean = title.trim()
  if (clean.length <= maxLength) return clean
  return clean.slice(0, maxLength).trim() + '...'
}

function ProductsTab() {
  const router = useRouter()
  const { notify } = useNotification()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [situationFilter, setSituationFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'BLOCKED' | 'LOCKED' | 'BANNED' | 'OUT_OF_STOCK' | 'ERROR' | 'SYNC_ISSUE'>('ALL')
  const [shareProduct, setShareProduct] = useState<any | null>(null)
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null)
  const [pendingMatchesCount, setPendingMatchesCount] = useState(0)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Carrega contagem de anúncios que precisam de vinculação
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const supabase = createClient()
        const { count } = await supabase
          .from('pending_product_matches')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'PENDING')
        setPendingMatchesCount(count || 0)
      } catch (e) {
        // silence
      }
    }
    fetchPendingCount()
  }, [])

  // Fecha o menu de ações ao clicar em qualquer lugar fora dele
  useEffect(() => {
    const handleClickOutside = () => setActiveActionMenuId(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // Modais de Controle e Diagnóstico
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    product: any | null
    action: 'pause' | 'activate' | 'block' | 'unblock' | 'lock' | 'unlock' | 'sync' | null
  }>({ isOpen: false, product: null, action: null })

  const [diagnosticModal, setDiagnosticModal] = useState<{
    isOpen: boolean
    product: any | null
  }>({ isOpen: false, product: null })

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    items: string[]
    name: string
  }>({ isOpen: false, items: [], name: '' })

  const { data: products, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('products')
      .select('*, suppliers(name), product_images(url), marketplace_listings(marketplace_id, status)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      const { data: fallbackData } = await s
        .from('products')
        .select('*, suppliers(name), product_images(url)')
        .order('created_at', { ascending: false })
        .limit(100)
      return fallbackData || []
    }
    return data || []
  })

  // Contadores de Situação
  const allList = products || []
  const counts = {
    ALL: allList.length,
    ACTIVE: allList.filter((p: any) => (p.status === 'ACTIVE' || !p.status) && Number(p.stock || 0) > 0).length,
    PAUSED: allList.filter((p: any) => p.status === 'PAUSED').length,
    BLOCKED: allList.filter((p: any) => p.status === 'BLOCKED').length,
    LOCKED: allList.filter((p: any) => p.status === 'LOCKED').length,
    BANNED: allList.filter((p: any) => p.status === 'BANNED').length,
    OUT_OF_STOCK: allList.filter((p: any) => Number(p.stock || 0) === 0).length,
    ERROR: allList.filter((p: any) => p.status === 'ERROR' || p.has_error).length,
    SYNC_ISSUE: allList.filter((p: any) => p.status === 'SYNC_ISSUE' || p.sync_status === 'failed').length,
  }

  const filtered = allList.filter((p: Record<string, any>) => {
    if (search) {
      const match = matchesSearchQuery(
        [p.name, p.sku, p.brand, p.model, p.ean],
        search
      )
      if (!match) return false
    }

    const stock = Number(p.stock) || 0
    const status = String(p.status || 'ACTIVE').toUpperCase()

    if (situationFilter === 'ACTIVE') return status === 'ACTIVE' && stock > 0
    if (situationFilter === 'PAUSED') return status === 'PAUSED'
    if (situationFilter === 'BLOCKED') return status === 'BLOCKED'
    if (situationFilter === 'LOCKED') return status === 'LOCKED'
    if (situationFilter === 'BANNED') return status === 'BANNED'
    if (situationFilter === 'OUT_OF_STOCK') return stock === 0
    if (situationFilter === 'ERROR') return status === 'ERROR' || p.has_error
    if (situationFilter === 'SYNC_ISSUE') return status === 'SYNC_ISSUE' || p.sync_status === 'failed'

    return true
  })

  const {
    currentPage: productsPage,
    setCurrentPage: setProductsPage,
    pageSize: productsPageSize,
    setPageSize: setProductsPageSize,
    paginatedItems: paginatedProducts,
    totalItems: totalProductsCount,
  } = usePagination(filtered, 15)

  function calcCost(p: Record<string, unknown>) {
    return (Number(p.cost_purchase) || 0) + (Number(p.freight_purchase) || 0) + (Number(p.packaging_cost) || 0) + (Number(p.other_costs) || 0)
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === filtered.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filtered.map((p: any) => p.id as string))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return
    setDeleteModal({
      isOpen: true,
      items: selectedItems,
      name: `${selectedItems.length} produto(s) selecionado(s)`
    })
  }

  const confirmDeleteProducts = async () => {
    const supabase = createClient()
    await supabase.from('products').delete().in('id', deleteModal.items)
    setSelectedItems([])
    setDeleteModal({ isOpen: false, items: [], name: '' })
    notify({
      type: 'success',
      title: 'Produtos Excluídos',
      message: 'Os produtos selecionados foram removidos permanentemente.'
    })
    refetch()
  }

  const PRODUCT_EXPORT_COLUMNS: ExportColumnDef[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Produto' },
    { key: 'brand', label: 'Marca' },
    { key: 'supplier', label: 'Fornecedor', format: (_v, r) => (r.suppliers as any)?.name || '—' },
    { key: 'cost_purchase', label: 'Custo Compra (R$)', align: 'right', format: (_v, r) => `R$ ${calcCost(r).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { key: 'stock', label: 'Estoque', align: 'right', format: (v) => String(Number(v) || 0) },
    { key: 'status', label: 'Situação', align: 'center', format: (v) => String(v || 'ACTIVE').toUpperCase() }
  ]

  const handleExportSelectedExcel = () => {
    if (selectedItems.length === 0) return
    const dataToExport = products?.filter((p: any) => selectedItems.includes(p.id)) || []
    exportToExcel(dataToExport, 'produtos_selecionados', 'Produtos', PRODUCT_EXPORT_COLUMNS)
    notify({ type: 'success', title: 'Excel Exportado', message: `${dataToExport.length} produtos exportados para planilha.` })
  }

  const handleExportSelectedPDF = () => {
    if (selectedItems.length === 0) return
    const dataToExport = products?.filter((p: any) => selectedItems.includes(p.id)) || []
    exportToPDF(dataToExport, PRODUCT_EXPORT_COLUMNS, 'Catálogo de Produtos Selecionados', `${dataToExport.length} produto(s) selecionado(s)`)
  }

  const handleExportAllExcel = () => {
    const dataToExport = filtered.length > 0 ? filtered : (products || [])
    exportToExcel(dataToExport, 'catalogo_produtos', 'Produtos', PRODUCT_EXPORT_COLUMNS)
    notify({ type: 'success', title: 'Excel Exportado', message: `${dataToExport.length} produtos exportados para planilha.` })
  }

  const handleExportAllPDF = () => {
    const dataToExport = filtered.length > 0 ? filtered : (products || [])
    exportToPDF(dataToExport, PRODUCT_EXPORT_COLUMNS, 'Catálogo Operacional de Produtos', `Situação: ${situationFilter} • Total: ${dataToExport.length} produtos`)
  }

  // Executa Ação de Marketplace (Pausar, Ativar, Bloquear, Travar, Sincronizar)
  const handleExecuteMarketplaceAction = async () => {
    if (!actionModal.product || !actionModal.action) return
    try {
      const res = await fetch(`/api/products/${actionModal.product.id}/marketplace-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionModal.action })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao executar ação')

      let msg = 'Ação executada com sucesso.'
      if (actionModal.action === 'pause') msg = 'Produto pausado com sucesso no Mercado Livre.'
      if (actionModal.action === 'activate') msg = 'Produto ativado com sucesso no Mercado Livre.'
      if (actionModal.action === 'block') msg = 'Produto bloqueado no sistema.'
      if (actionModal.action === 'unblock') msg = 'Produto desbloqueado com sucesso.'
      if (actionModal.action === 'lock') msg = 'Trava de preço e estoque ativada.'
      if (actionModal.action === 'unlock') msg = 'Trava removida com sucesso.'
      if (actionModal.action === 'sync') msg = 'Produto sincronizado com o Mercado Livre via API oficial.'

      notify({
        type: 'success',
        title: 'Status Atualizado!',
        message: msg
      })
      refetch()
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro na operação',
        message: err.message || 'Não foi possível atualizar o produto no marketplace.'
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Modal de Compartilhamento no Chat Interno */}
      {shareProduct && (
        <ShareContextModal
          isOpen={!!shareProduct}
          onClose={() => setShareProduct(null)}
          title={`Produto: ${shareProduct.name}`}
          messageType="CARD_PRODUCT"
          metadata={{
            product_id: shareProduct.id,
            product_name: shareProduct.name,
            product_sku: shareProduct.sku,
            product_image: shareProduct.image_url,
            total_amount: shareProduct.stock || 8
          }}
          defaultNote={`Verificação operacional do produto ${shareProduct.name} (SKU: ${shareProduct.sku}).`}
        />
      )}

      {/* Modal de Ação no Marketplace */}
      <ProductMarketplaceActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, product: null, action: null })}
        onConfirm={handleExecuteMarketplaceAction}
        productName={actionModal.product?.name || ''}
        sku={actionModal.product?.sku || ''}
        action={actionModal.action}
        marketplaceName="Mercado Livre"
      />

      {/* Modal de Diagnóstico / Motivo */}
      <ProductDiagnosticModal
        isOpen={diagnosticModal.isOpen}
        onClose={() => setDiagnosticModal({ isOpen: false, product: null })}
        product={diagnosticModal.product}
      />

      {/* Modal de Exclusão com Digitação de "EXCLUIR" */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, items: [], name: '' })}
        onConfirm={confirmDeleteProducts}
        itemName={deleteModal.name}
        description="Esta ação removerá permanentemente os produtos selecionados do catálogo e banco de dados."
        actionWord="EXCLUIR"
        actionTitle="Exclusão de Produtos"
      />

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Produtos Cadastrados" value={String(products?.length || 0)} />
        <StatCard label="Estoque Total" value={String(products?.reduce((a: number, b: Record<string, unknown>) => a + (Number(b.stock) || 0), 0) || 0)} />
        <StatCard label="Pausados / Bloqueados" value={String((counts.PAUSED + counts.BLOCKED) || 0)} />
        <StatCard label="Sem Estoque" value={String(counts.OUT_OF_STOCK || 0)} />
      </div>

      {/* TOOLBAR UNIFICADA: BUSCA + FILTRO DE SITUAÇÃO COMPACTO & CLEAN */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-3 shadow-2xs space-y-3">
        {/* Barra de Ações: Busca + Filtro de Situação + Botões de Ação em uma única linha */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {/* Campo de Busca */}
          <div className="flex-1 min-w-[200px] max-w-sm">
            <SearchInput placeholder="Buscar por título, SKU, marca..." value={search} onChange={setSearch} className="w-full max-w-none" />
          </div>

          {/* Filtro de Situação + Botões de Ação — todos alinhados em uma única linha */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            <select
              value={situationFilter}
              onChange={(e) => setSituationFilter(e.target.value as any)}
              className="h-[38px] px-3 bg-[#f8f9fa] hover:bg-[#f0f0f0] border border-[#e6e6e6] rounded-xl text-xs font-medium text-[#333] focus:outline-none focus:border-[#16a34a] cursor-pointer shadow-none shrink-0 transition-all"
            >
              <option value="ALL">Todas Situações ({counts.ALL})</option>
              <option value="ACTIVE">Ativos ({counts.ACTIVE})</option>
              <option value="PAUSED">Pausados ({counts.PAUSED})</option>
              <option value="BLOCKED">Bloqueados ({counts.BLOCKED})</option>
              <option value="LOCKED">Travados ({counts.LOCKED})</option>
              <option value="BANNED">Banidos ({counts.BANNED})</option>
              <option value="OUT_OF_STOCK">Sem Estoque ({counts.OUT_OF_STOCK})</option>
              <option value="ERROR">Com Erro ({counts.ERROR})</option>
              <option value="SYNC_ISSUE">Problema Sync ({counts.SYNC_ISSUE})</option>
            </select>

            {/* Botão Atalho para Vincular Anúncios */}
            <Link
              href="/marketplaces/vincular"
              className={`h-[38px] px-3.5 border rounded-xl text-xs font-bold transition-all shadow-none flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                pendingMatchesCount > 0
                  ? 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca] hover:bg-[#fee2e2]'
                  : 'bg-white hover:bg-[#F7F7F7] text-[#111111] border-[#e2e8f0]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
              Vincular Anúncios
              {pendingMatchesCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#ef4444] text-white text-[10px] font-black rounded-full leading-none">
                  {pendingMatchesCount}
                </span>
              )}
            </Link>

            {/* Ações em Lote quando há seleção */}
            {selectedItems.length > 0 ? (
              <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#0071e3]/30 px-3 py-1 rounded-xl shadow-2xs shrink-0 flex-nowrap animate-in fade-in">
                <span className="text-xs font-bold text-[#0071e3] whitespace-nowrap bg-[#eff6ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                  {selectedItems.length} selecionado{selectedItems.length > 1 ? 's' : ''}
                </span>

                {/* Baixar Excel Selecionados */}
                <button
                  type="button"
                  onClick={handleExportSelectedExcel}
                  className="h-[32px] px-2.5 bg-white hover:bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] hover:text-[#15803d] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none whitespace-nowrap"
                  title="Baixar selecionados em planilha Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#16a34a]" />
                  <span>Excel</span>
                </button>

                {/* Baixar PDF Selecionados */}
                <button
                  type="button"
                  onClick={handleExportSelectedPDF}
                  className="h-[32px] px-2.5 bg-white hover:bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] hover:text-[#b91c1c] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none whitespace-nowrap"
                  title="Baixar ou imprimir selecionados em PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-[#dc2626]" />
                  <span>PDF</span>
                </button>

                {/* Excluir Selecionados */}
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="h-[32px] px-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                  title="Excluir produtos selecionados"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>

                {/* Desmarcar */}
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="h-[32px] w-[32px] flex items-center justify-center bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#111111] rounded-lg border border-[#e2e8f0] transition-all cursor-pointer shadow-none"
                  title="Desmarcar seleção"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                <SecondaryButton className="shrink-0 whitespace-nowrap" onClick={() => document.getElementById('import-products')?.click()}>
                  <Upload className="w-3.5 h-3.5" /> Importar
                </SecondaryButton>
                <input 
                  type="file" 
                  id="import-products" 
                  className="hidden" 
                  accept=".xlsx,.xls,.csv" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const data = await importFromExcel(file, {
                        name: ['nome', 'name', 'produto', 'título'],
                        sku: ['sku', 'código', 'ref'],
                        ean: ['ean', 'código de barras', 'gtin'],
                        category: ['categoria', 'category'],
                        cost_purchase: ['custo', 'preço de custo', 'cost'],
                        current_price: ['preço', 'price', 'valor'],
                        stock: ['estoque', 'quantidade', 'stock']
                      })
                      if (data.length > 0) {
                        const supabase = createClient()
                        await supabase.from('products').insert(data)
                        refetch()
                        notify({ type: 'success', title: 'Produtos Importados', message: `${data.length} produtos adicionados com sucesso.` })
                      }
                    } catch (err) {
                      notify({ type: 'error', title: 'Erro de Importação', message: 'Falha ao processar arquivo.' })
                    }
                    e.target.value = ''
                  }} 
                />

                {/* Dropdown de Exportação: Excel e PDF */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <SecondaryButton 
                    className="shrink-0 whitespace-nowrap" 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar <ChevronDown className="w-3 h-3 text-[#888]" />
                  </SecondaryButton>

                  {showExportMenu && (
                    <div 
                      className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-[#e2e8f0] py-1.5 z-50 animate-in fade-in zoom-in-95 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowExportMenu(false)
                          handleExportAllExcel()
                        }}
                        className="w-full px-3.5 py-2 text-xs font-semibold text-[#111111] hover:bg-[#f0fdf4] hover:text-[#16a34a] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#16a34a] shrink-0" />
                        <div>
                          <div className="font-bold">Baixar Excel (.xlsx)</div>
                          <div className="text-[10px] text-[#666666] font-normal">Planilha formatada</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExportMenu(false)
                          handleExportAllPDF()
                        }}
                        className="w-full px-3.5 py-2 text-xs font-semibold text-[#111111] hover:bg-[#fef2f2] hover:text-[#dc2626] flex items-center gap-2.5 transition-colors cursor-pointer border-t border-[#f1f5f9] text-left"
                      >
                        <FileText className="w-4 h-4 text-[#dc2626] shrink-0" />
                        <div>
                          <div className="font-bold">Baixar PDF (.pdf)</div>
                          <div className="text-[10px] text-[#666666] font-normal">Relatório para imprimir/salvar</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Botão Excluir informativo */}
                <button
                  type="button"
                  onClick={() => {
                    notify({
                      type: 'info',
                      title: 'Selecione os produtos',
                      message: 'Marque a caixinha de seleção dos produtos na tabela que deseja excluir.'
                    })
                  }}
                  className="h-[38px] px-3 border border-[#fecaca] bg-[#fff5f5] hover:bg-[#fee2e2] text-[#dc2626] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Excluir produtos (selecione na tabela)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                  <span>Excluir</span>
                </button>

                <PrimaryButton className="shrink-0 whitespace-nowrap" onClick={() => setShowCreate(true)}>
                  <Plus className="w-3.5 h-3.5" /> Novo
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6]">
          <LoadingState message="Carregando catálogo operacional..." padding={60} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center space-y-2">
          <Package className="w-8 h-8 text-[#ccc] mx-auto" />
          <p className="text-sm font-bold text-[#111]">Nenhum produto encontrado nesta situação</p>
          <p className="text-xs text-[#777]">Tente selecionar outra situação ou limpar o filtro de busca.</p>
        </div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th className="w-10">
              <input 
                type="checkbox" 
                checked={filtered.length > 0 && selectedItems.length === filtered.length}
                onChange={toggleSelectAll}
                className="rounded border-[#ccc] text-[#111] focus:ring-[#16a34a]"
              />
            </Th>
            <Th className="min-w-[320px]">Produto</Th>
            <Th className="whitespace-nowrap min-w-[130px]">Código SKU</Th>
            <Th className="whitespace-nowrap">Fornecedor</Th>
            <Th className="text-right whitespace-nowrap">Custo</Th>
            <Th className="text-right whitespace-nowrap">Estoque</Th>
            <Th className="text-center whitespace-nowrap">Situação</Th>
            <Th className="text-right whitespace-nowrap w-24">Ações</Th>
          </TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {paginatedProducts.map((p: Record<string, any>) => {
              const cost = calcCost(p)
              const stock = Number(p.stock) || 0
              const minStock = Number(p.min_stock) || 0
              const supplierName = (p.suppliers as Record<string, unknown>)?.name as string || '—'
              const status = String(p.status || 'ACTIVE').toUpperCase()
              const isPaused = status === 'PAUSED'
              const isBlocked = status === 'BLOCKED' || status === 'BANNED'
              const isLocked = status === 'LOCKED'

              const statusBadgeConfig = {
                ACTIVE: { label: 'Ativo', bg: 'bg-[#ecfdf5] text-[#16a34a] border-[#bbf7d0]' },
                PAUSED: { label: 'Pausado', bg: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]' },
                BLOCKED: { label: 'Bloqueado', bg: 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]' },
                LOCKED: { label: 'Travado', bg: 'bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]' },
                BANNED: { label: 'Banido', bg: 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]' },
                ERROR: { label: 'Com Erro', bg: 'bg-[#ffedd5] text-[#ea580c] border-[#fed7aa]' },
                SYNC_ISSUE: { label: 'Erro Sync', bg: 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]' },
              }[status] || { label: 'Ativo', bg: 'bg-[#ecfdf5] text-[#16a34a] border-[#bbf7d0]' }

              return (
                <tr key={p.id as string} onClick={() => router.push(`/produtos/${p.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer group">
                  <Td>
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(p.id as string)}
                        onChange={() => toggleSelect(p.id as string)}
                        className="rounded border-[#d1d5db] text-[#0071e3] focus:ring-[#0071e3] accent-[#0071e3]"
                      />
                    </div>
                  </Td>
                  <Td className="min-w-[320px]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white border border-[#e6e6e6] overflow-hidden flex items-center justify-center shrink-0 p-1">
                        {(p.image_url || (p.product_images as any)?.[0]?.url) ? (
                          <img src={(p.image_url as string) || (p.product_images as any)[0].url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-5 h-5 text-[#ccc]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center">
                        <p className="font-semibold text-[#111111] text-[13px] leading-normal truncate max-w-md !m-0 !mb-0" title={p.name as string}>
                          {p.name as string}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="text-[11px] font-medium text-[#475569] bg-[#f1f5f9] px-2 py-0.5 rounded-md border border-[#e2e8f0] inline-block leading-tight">
                      {p.sku as string || '—'}
                    </span>
                  </Td>
                  <Td className="text-[#666666] text-[12.5px] whitespace-nowrap">{supplierName}</Td>
                  <Td className="text-right text-[12.5px] font-medium text-[#111111] whitespace-nowrap">
                    R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <span className={`font-semibold text-[12.5px] ${stock === 0 ? 'text-[#dc2626]' : stock <= minStock ? 'text-[#d97706]' : 'text-[#111111]'}`}>
                      {stock}
                    </span>
                  </Td>
                  <Td className="text-center whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border ${statusBadgeConfig.bg}`}>
                      {stock === 0 && status === 'ACTIVE' ? 'Sem Estoque' : statusBadgeConfig.label}
                    </span>
                  </Td>
                  
                  {/* MENU DE 3 PONTOS (DESIGN CLEAN & POPUP DE AÇÕES) */}
                  <Td className="text-right">
                    <div className="relative inline-flex items-center justify-end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveActionMenuId(activeActionMenuId === p.id ? null : p.id)
                        }}
                        title="Opções do Produto"
                        className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all cursor-pointer shadow-none ${
                          activeActionMenuId === p.id
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'border-[#e6e6e6] bg-white hover:bg-[#F7F7F7] text-[#666666] hover:text-[#111111]'
                        }`}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {/* POPUP DROPDOWN DE AÇÕES DAS 3 PONTAS (DESIGN ULTRA CLEAN & COMPACTO) */}
                      {activeActionMenuId === p.id && (
                        <div 
                          className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-[#e2e8f0] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] py-2 w-52 animate-in fade-in zoom-in-95 duration-100 text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 1. Diagnóstico */}
                          <button
                            onClick={() => {
                              setActiveActionMenuId(null)
                              setDiagnosticModal({ isOpen: true, product: p })
                            }}
                            className="w-full px-4 py-2 text-[12.5px] font-medium text-[#333333] hover:bg-[#f4f4f5] hover:text-[#111111] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5 text-[#666666]" />
                            <span>Diagnóstico</span>
                          </button>

                          {/* 2. Pausar / Ativar */}
                          {isPaused ? (
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null)
                                setActionModal({ isOpen: true, product: p, action: 'activate' })
                              }}
                              className="w-full px-4 py-2 text-[12.5px] font-medium text-[#16a34a] hover:bg-[#f0fff4] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <PlayCircle className="w-3.5 h-3.5 text-[#16a34a]" />
                              <span>Ativar Anúncio</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null)
                                setActionModal({ isOpen: true, product: p, action: 'pause' })
                              }}
                              className="w-full px-4 py-2 text-[12.5px] font-medium text-[#333333] hover:bg-[#f4f4f5] hover:text-[#d97706] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <PauseCircle className="w-3.5 h-3.5 text-[#666666]" />
                              <span>Pausar Anúncio</span>
                            </button>
                          )}

                          {/* 3. Travar / Destravar */}
                          {isLocked ? (
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null)
                                setActionModal({ isOpen: true, product: p, action: 'unlock' })
                              }}
                              className="w-full px-4 py-2 text-[12.5px] font-medium text-[#4338ca] hover:bg-[#e0e7ff] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5 text-[#4338ca]" />
                              <span>Destravar Produto</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null)
                                setActionModal({ isOpen: true, product: p, action: 'lock' })
                              }}
                              className="w-full px-4 py-2 text-[12.5px] font-medium text-[#333333] hover:bg-[#f4f4f5] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5 text-[#666666]" />
                              <span>Travar Estoque</span>
                            </button>
                          )}

                          {/* 4. Sincronizar */}
                          <button
                            onClick={() => {
                              setActiveActionMenuId(null)
                              setActionModal({ isOpen: true, product: p, action: 'sync' })
                            }}
                            className="w-full px-4 py-2 text-[12.5px] font-medium text-[#333333] hover:bg-[#f4f4f5] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-[#666666]" />
                            <span>Sincronizar</span>
                          </button>

                          {/* 5. Compartilhar no Chat */}
                          <button
                            onClick={() => {
                              setActiveActionMenuId(null)
                              setShareProduct(p)
                            }}
                            className="w-full px-4 py-2 text-[12.5px] font-medium text-[#333333] hover:bg-[#f4f4f5] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#666666]" />
                            <span>Compartilhar</span>
                          </button>

                          {/* 6. Bloquear */}
                          <button
                            onClick={() => {
                              setActiveActionMenuId(null)
                              setActionModal({ isOpen: true, product: p, action: isBlocked ? 'unblock' : 'block' })
                            }}
                            className="w-full px-4 py-2 text-[12.5px] font-medium text-[#dc2626] hover:bg-[#fef2f2] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-[#dc2626]" />
                            <span>{isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
                          </button>

                          <div className="my-1 border-t border-[#f1f5f9]" />

                          {/* 7. Excluir */}
                          <button
                            onClick={() => {
                              setActiveActionMenuId(null)
                              setDeleteModal({ isOpen: true, items: [p.id as string], name: p.name as string })
                            }}
                            className="w-full px-4 py-2 text-[12.5px] font-medium text-[#dc2626] hover:bg-[#fef2f2] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                            <span>Excluir Produto</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}

      {/* Limitador / Paginação em baixo */}
      {filtered.length > 0 && (
        <PaginationBar
          currentPage={productsPage}
          totalItems={totalProductsCount}
          pageSize={productsPageSize}
          onPageChange={setProductsPage}
          onPageSizeChange={setProductsPageSize}
          pageSizeOptions={[15, 30, 50, 100]}
          itemName="produtos"
        />
      )}

      {showCreate && <ProductCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetch() }} />}
    </div>
  )
}

function SuppliersTab() {
  const router = useRouter()
  const { notify } = useNotification()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const { data: suppliers, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('suppliers').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return data || []
  })

  const filtered = (suppliers || []).filter((s: Record<string, unknown>) =>
    !search || String(s.name).toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedItems.length === filtered.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filtered.map((s: any) => s.id as string))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const confirmDeleteSuppliers = async () => {
    const supabase = createClient()
    await supabase.from('suppliers').delete().in('id', selectedItems)
    setSelectedItems([])
    setShowDeleteModal(false)
    notify({ type: 'success', title: 'Fornecedores Excluídos', message: 'Os fornecedores selecionados foram excluídos com sucesso.' })
    refetch()
  }

  const SUPPLIER_EXPORT_COLUMNS: ExportColumnDef[] = [
    { key: 'name', label: 'Fornecedor / Razão Social' },
    { key: 'cnpj', label: 'CNPJ / CPF', format: (v) => (v as string) || '—' },
    { key: 'contact', label: 'Contato', format: (v) => (v as string) || '—' },
    { key: 'phone', label: 'Telefone', format: (v) => (v as string) || '—' },
    { key: 'email', label: 'E-mail', format: (v) => (v as string) || '—' },
    { key: 'city_state', label: 'Cidade/UF', format: (_v, r) => [r.city, r.state].filter(Boolean).join('/') || '—' },
    { key: 'delivery_time', label: 'Prazo Entrega', align: 'right', format: (v) => v ? `${v} dias` : '—' }
  ]

  const handleExportSelectedExcel = () => {
    if (selectedItems.length === 0) return
    const dataToExport = suppliers?.filter((s: any) => selectedItems.includes(s.id)) || []
    exportToExcel(dataToExport, 'fornecedores_selecionados', 'Fornecedores', SUPPLIER_EXPORT_COLUMNS)
    notify({ type: 'success', title: 'Excel Exportado', message: `${dataToExport.length} fornecedores exportados.` })
  }

  const handleExportSelectedPDF = () => {
    if (selectedItems.length === 0) return
    const dataToExport = suppliers?.filter((s: any) => selectedItems.includes(s.id)) || []
    exportToPDF(dataToExport, SUPPLIER_EXPORT_COLUMNS, 'Relatório de Fornecedores Selecionados', `${dataToExport.length} fornecedor(es) selecionado(s)`)
  }

  const handleExportAllExcel = () => {
    const dataToExport = filtered.length > 0 ? filtered : (suppliers || [])
    exportToExcel(dataToExport, 'fornecedores_cadastrados', 'Fornecedores', SUPPLIER_EXPORT_COLUMNS)
    notify({ type: 'success', title: 'Excel Exportado', message: `${dataToExport.length} fornecedores exportados.` })
  }

  const handleExportAllPDF = () => {
    const dataToExport = filtered.length > 0 ? filtered : (suppliers || [])
    exportToPDF(dataToExport, SUPPLIER_EXPORT_COLUMNS, 'Relatório Geral de Fornecedores', `Total: ${dataToExport.length} fornecedores cadastrados`)
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      notify({
        type: 'info',
        title: 'Selecione fornecedores',
        message: 'Marque a caixinha de seleção dos fornecedores na tabela que deseja excluir.'
      })
      return
    }
    setShowDeleteModal(true)
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Fornecedores" value={String(suppliers?.length || 0)} />
      </div>

      {/* TOOLBAR UNIFICADA DE FORNECEDORES */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-3 shadow-2xs space-y-3 mb-4">
        <div className="flex items-center justify-between gap-3 flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {/* Campo de Busca */}
          <div className="flex-1 min-w-[200px] max-w-sm">
            <SearchInput placeholder="Buscar por fornecedor, CNPJ, contato..." value={search} onChange={setSearch} className="w-full max-w-none" />
          </div>

          {/* Ações em Lote quando há seleção */}
          {selectedItems.length > 0 ? (
            <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#0071e3]/30 px-3 py-1 rounded-xl shadow-2xs shrink-0 flex-nowrap animate-in fade-in">
              <span className="text-xs font-bold text-[#0071e3] whitespace-nowrap bg-[#eff6ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                {selectedItems.length} selecionado{selectedItems.length > 1 ? 's' : ''}
              </span>

              {/* Baixar Excel Selecionados */}
              <button
                type="button"
                onClick={handleExportSelectedExcel}
                className="h-[32px] px-2.5 bg-white hover:bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] hover:text-[#15803d] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none whitespace-nowrap"
                title="Baixar selecionados em planilha Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#16a34a]" />
                <span>Excel</span>
              </button>

              {/* Baixar PDF Selecionados */}
              <button
                type="button"
                onClick={handleExportSelectedPDF}
                className="h-[32px] px-2.5 bg-white hover:bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] hover:text-[#b91c1c] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none whitespace-nowrap"
                title="Baixar ou imprimir selecionados em PDF"
              >
                <FileText className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>PDF</span>
              </button>

              {/* Excluir Selecionados */}
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="h-[32px] px-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                title="Excluir fornecedores selecionados"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              {/* Desmarcar */}
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="h-[32px] w-[32px] flex items-center justify-center bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#111111] rounded-lg border border-[#e2e8f0] transition-all cursor-pointer shadow-none"
                title="Desmarcar seleção"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0 flex-nowrap">
              <SecondaryButton className="shrink-0 whitespace-nowrap" onClick={() => document.getElementById('import-suppliers')?.click()}>
                <Upload className="w-3.5 h-3.5" /> Importar
              </SecondaryButton>
              <input 
                type="file" 
                id="import-suppliers" 
                className="hidden" 
                accept=".xlsx,.xls,.csv" 
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const data = await importFromExcel(file, {
                      name: ['nome', 'name', 'fornecedor', 'razão', 'empresa'],
                      cnpj: ['cnpj', 'documento'],
                      phone: ['telefone', 'phone', 'celular', 'contato'],
                      email: ['email', 'e-mail', 'correio']
                    })
                    if (data.length > 0) {
                      const supabase = createClient()
                      await supabase.from('suppliers').insert(data)
                      refetch()
                      notify({ type: 'success', title: 'Fornecedores Importados', message: `${data.length} fornecedores importados com sucesso.` })
                    }
                  } catch (err) {
                    notify({ type: 'error', title: 'Erro de Importação', message: 'Falha ao processar arquivo.' })
                  }
                  e.target.value = ''
                }} 
              />

              {/* Dropdown de Exportação: Excel e PDF */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <SecondaryButton 
                  className="shrink-0 whitespace-nowrap" 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <Download className="w-3.5 h-3.5" /> Exportar <ChevronDown className="w-3 h-3 text-[#888]" />
                </SecondaryButton>

                {showExportMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-[#e2e8f0] py-1.5 z-50 animate-in fade-in zoom-in-95 text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false)
                        handleExportAllExcel()
                      }}
                      className="w-full px-3.5 py-2 text-xs font-semibold text-[#111111] hover:bg-[#f0fdf4] hover:text-[#16a34a] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#16a34a] shrink-0" />
                      <div>
                        <div className="font-bold">Baixar Excel (.xlsx)</div>
                        <div className="text-[10px] text-[#666666] font-normal">Planilha formatada</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false)
                        handleExportAllPDF()
                      }}
                      className="w-full px-3.5 py-2 text-xs font-semibold text-[#111111] hover:bg-[#fef2f2] hover:text-[#dc2626] flex items-center gap-2.5 transition-colors cursor-pointer border-t border-[#f1f5f9] text-left"
                    >
                      <FileText className="w-4 h-4 text-[#dc2626] shrink-0" />
                      <div>
                        <div className="font-bold">Baixar PDF (.pdf)</div>
                        <div className="text-[10px] text-[#666666] font-normal">Relatório para imprimir/salvar</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Excluir informativo */}
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="h-[38px] px-3 border border-[#fecaca] bg-[#fff5f5] hover:bg-[#fee2e2] text-[#dc2626] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                title="Excluir fornecedores (selecione na tabela)"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>Excluir</span>
              </button>

              <PrimaryButton className="shrink-0 whitespace-nowrap" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5" /> Novo fornecedor
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6]">
          <LoadingState message="Carregando fornecedores..." padding={60} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center space-y-2">
          <Building2 className="w-8 h-8 text-[#ccc] mx-auto" />
          <p className="text-sm font-bold text-[#111]">Nenhum fornecedor encontrado</p>
          <p className="text-xs text-[#777]">Tente buscar com outro termo ou cadastre um novo fornecedor.</p>
        </div>
      ) : (
        <>
          {/* Card list para celulares (< 640px) */}
          <div className="block sm:hidden bg-white rounded-2xl border border-[#e6e6e6] divide-y divide-[#f1f5f9] overflow-hidden shadow-xs">
            {filtered.map((s: Record<string, unknown>) => {
              const id = s.id as string
              const name = (s.name as string) || 'Fornecedor'
              const cnpj = (s.cnpj as string) || (s.email as string) || 'Sem CNPJ'
              const cityState = [s.city, s.state].filter(Boolean).join('/') || null
              const isSelected = selectedItems.includes(id)

              return (
                <div 
                  key={id} 
                  onClick={() => router.push(`/fornecedores/${id}`)}
                  className={`p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#f8fafc]' : 'hover:bg-[#fafafa]'
                  }`}
                >
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleSelect(id)}
                      className="rounded border-[#ccc] text-[#1f2328] focus:ring-[#1f2328] w-4 h-4"
                    />
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden flex items-center justify-center shrink-0 p-1">
                    {s.logo_url ? (
                      <img src={s.logo_url as string} alt={name} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-5 h-5 text-[#94a3b8]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <p className="font-bold text-[#111111] text-[13.5px] leading-snug truncate" title={name}>
                        {name}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#64748b]">
                      <span className="font-mono text-[10.5px] bg-[#f1f5f9] text-[#334155] px-1.5 py-0.5 rounded border border-[#e2e8f0] leading-none">
                        {cnpj}
                      </span>
                      {cityState && (
                        <span className="text-[11px] text-[#475569] flex items-center gap-0.5">
                          • {cityState}
                        </span>
                      )}
                      {Boolean(s.delivery_time) && (
                        <span className="text-[11px] text-[#16a34a] font-semibold flex items-center gap-0.5">
                          • {String(s.delivery_time)}d
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => router.push(`/fornecedores/${id}/editar`)} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-[#111] transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-[#cbd5e1]" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tabela completa para Desktop (>= 640px) */}
          <div className="hidden sm:block">
            <ModuleTable>
              <TableHead>
                <Th className="w-10">
                  <input 
                    type="checkbox" 
                    checked={filtered.length > 0 && selectedItems.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#ccc] text-[#1f2328] focus:ring-[#1f2328]"
                  />
                </Th>
                <Th>Fornecedor</Th><Th>Contato</Th><Th>Cidade</Th><Th className="text-right">Prazo</Th><Th className="text-right">Ações</Th>
              </TableHead>
              <tbody className="divide-y divide-[#eeeeee]">
                {filtered.map((s: Record<string, unknown>) => (
                  <tr key={s.id as string} onClick={() => router.push(`/fornecedores/${s.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
                    <Td>
                      <div onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(s.id as string)}
                          onChange={() => toggleSelect(s.id as string)}
                          className="rounded border-[#ccc] text-[#1f2328] focus:ring-[#1f2328]"
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-[#f5f5f5] border-2 border-[#e6e6e6] overflow-hidden flex items-center justify-center flex-shrink-0">
                          {s.logo_url ? (
                            <img src={s.logo_url as string} alt={s.name as string} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-[#ccc]" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="font-semibold text-[#1f2328] text-[14px] leading-tight mb-0.5">{s.name as string}</p>
                          <p className="text-[13px] text-[#656d76] leading-tight">{s.cnpj as string || s.email as string || 'Sem CNPJ'}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>{s.contact as string || '—'}</Td>
                    <Td className="text-[#999]">{[s.city, s.state].filter(Boolean).join('/') || '—'}</Td>
                    <Td className="text-right text-[#999]">{s.delivery_time ? `${s.delivery_time} dias` : '—'}</Td>
                    <Td className="text-right"><div onClick={(e: React.MouseEvent) => e.stopPropagation()}><button onClick={() => router.push(`/fornecedores/${s.id}/editar`)} className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#ccc] hover:text-[#666] cursor-pointer"><Edit className="w-3.5 h-3.5" /></button></div></Td>
                  </tr>
                ))}
              </tbody>
            </ModuleTable>
          </div>
        </>
      )}
      {showCreate && <SupplierCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetch() }} />}
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteSuppliers}
          itemName={`${selectedItems.length} fornecedor(es)`}
          description="Esta ação removerá permanentemente os fornecedores selecionados do banco de dados."
          actionWord="EXCLUIR"
          actionTitle="Exclusão de Fornecedores"
          buttonText="Sim, Excluir"
        />
      )}
    </div>
  )
}

function PurchasesTab() {
  const router = useRouter()
  const { notify } = useNotification()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const { data: purchases, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('purchases').select('*, suppliers(name), purchase_items(*)').order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return data || []
  })

  const filtered = (purchases || []).filter((p: Record<string, unknown>) => {
    const invoiceStr = String(p.invoice || 'S/N').toLowerCase()
    const supplierStr = String((p.suppliers as any)?.name || '').toLowerCase()
    return !search || invoiceStr.includes(search.toLowerCase()) || supplierStr.includes(search.toLowerCase())
  })

  const toggleSelectAll = () => {
    if (selectedItems.length === filtered.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filtered.map((p: any) => p.id as string))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const confirmDeletePurchases = async () => {
    const supabase = createClient()
    await supabase.from('purchases').delete().in('id', selectedItems)
    setSelectedItems([])
    setShowDeleteModal(false)
    notify({ type: 'success', title: 'Compras Excluídas', message: 'Os registros de compra selecionados foram excluídos com sucesso.' })
    refetch()
  }

  const PURCHASE_EXPORT_COLUMNS: ExportColumnDef[] = [
    { key: 'invoice', label: 'Nota Fiscal (NF)', format: (v) => (v as string) || 'S/N' },
    { key: 'date', label: 'Data', format: (v) => v ? new Date(v as string).toLocaleDateString('pt-BR') : '—' },
    { key: 'supplier', label: 'Fornecedor', format: (_v, r) => (r.suppliers as any)?.name || '—' },
    { key: 'buyer', label: 'Comprador', format: (v) => (v as string) || '—' },
    { key: 'total_cost', label: 'Valor Total (R$)', align: 'right', format: (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { key: 'status', label: 'Status', align: 'center', format: (v) => v === 'CANCELED' ? 'Cancelada' : 'Concluída' }
  ]

  const handleExportSelectedExcel = () => {
    if (selectedItems.length === 0) return
    const dataToExport = purchases?.filter((p: any) => selectedItems.includes(p.id)) || []
    exportToExcel(dataToExport, 'compras_selecionadas', 'Compras', PURCHASE_EXPORT_COLUMNS)
    notify({ type: 'success', title: 'Excel Exportado', message: `${dataToExport.length} compras exportadas.` })
  }

  const handleExportSelectedPDF = () => {
    if (selectedItems.length === 0) return
    const dataToExport = purchases?.filter((p: any) => selectedItems.includes(p.id)) || []
    exportToPDF(dataToExport, PURCHASE_EXPORT_COLUMNS, 'Relatório de Compras Selecionadas', `${dataToExport.length} compra(s) selecionada(s)`)
  }

  const handleExportAllExcel = () => {
    const dataToExport = filtered.length > 0 ? filtered : (purchases || [])
    exportToExcel(dataToExport, 'relatorio_compras', 'Compras', PURCHASE_EXPORT_COLUMNS)
    notify({ type: 'success', title: 'Excel Exportado', message: `${dataToExport.length} compras exportadas.` })
  }

  const handleExportAllPDF = () => {
    const dataToExport = filtered.length > 0 ? filtered : (purchases || [])
    exportToPDF(dataToExport, PURCHASE_EXPORT_COLUMNS, 'Relatório Geral de Compras', `Total: ${dataToExport.length} registros`)
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      notify({
        type: 'info',
        title: 'Selecione as compras',
        message: 'Marque a caixinha de seleção das compras na tabela que deseja excluir.'
      })
      return
    }
    setShowDeleteModal(true)
  }

  const [cancelModalId, setCancelModalId] = useState<string | null>(null)

  const confirmCancelPurchase = async () => {
    if (!cancelModalId) return
    const supabase = createClient()
    await supabase.from('purchases').update({ status: 'CANCELED' }).eq('id', cancelModalId)
    setCancelModalId(null)
    refetch()
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Total Compras" value={String(purchases?.length || 0)} />
        <StatCard label="Valor Total" value={`R$ ${(purchases || []).reduce((a: number, b: Record<string, unknown>) => a + (Number(b.total_cost) || 0), 0).toLocaleString('pt-BR')}`} />
      </div>

      {/* TOOLBAR UNIFICADA DE COMPRAS */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-3 shadow-2xs space-y-3 mb-4">
        <div className="flex items-center justify-between gap-3 flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {/* Campo de Busca */}
          <div className="flex-1 min-w-[200px] max-w-sm">
            <SearchInput placeholder="Buscar por nota, fornecedor..." value={search} onChange={setSearch} className="w-full max-w-none" />
          </div>

          {/* Ações em Lote quando há seleção */}
          {selectedItems.length > 0 ? (
            <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#0071e3]/30 px-3 py-1 rounded-xl shadow-2xs shrink-0 flex-nowrap animate-in fade-in">
              <span className="text-xs font-bold text-[#0071e3] whitespace-nowrap bg-[#eff6ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                {selectedItems.length} selecionado{selectedItems.length > 1 ? 's' : ''}
              </span>

              {/* Baixar Excel Selecionados */}
              <button
                type="button"
                onClick={handleExportSelectedExcel}
                className="h-[32px] px-2.5 bg-white hover:bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] hover:text-[#15803d] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none whitespace-nowrap"
                title="Baixar selecionados em planilha Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#16a34a]" />
                <span>Excel</span>
              </button>

              {/* Baixar PDF Selecionados */}
              <button
                type="button"
                onClick={handleExportSelectedPDF}
                className="h-[32px] px-2.5 bg-white hover:bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] hover:text-[#b91c1c] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none whitespace-nowrap"
                title="Baixar ou imprimir selecionados em PDF"
              >
                <FileText className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>PDF</span>
              </button>

              {/* Excluir Selecionados */}
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="h-[32px] px-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                title="Excluir compras selecionadas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              {/* Desmarcar */}
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="h-[32px] w-[32px] flex items-center justify-center bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#111111] rounded-lg border border-[#e2e8f0] transition-all cursor-pointer shadow-none"
                title="Desmarcar seleção"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0 flex-nowrap">
              <SecondaryButton className="shrink-0 whitespace-nowrap" onClick={() => document.getElementById('import-purchases')?.click()}>
                <Upload className="w-3.5 h-3.5" /> Importar
              </SecondaryButton>
              <input 
                type="file" 
                id="import-purchases" 
                className="hidden" 
                accept=".xlsx,.xls,.csv" 
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const data = await importFromExcel(file, {
                      invoice: ['nota', 'nf', 'invoice', 'documento'],
                      total_cost: ['custo total', 'total', 'valor', 'montante'],
                      notes: ['observação', 'notas', 'observações', 'obs']
                    })
                    if (data.length > 0) {
                      const supabase = createClient()
                      await supabase.from('purchases').insert(data)
                      refetch()
                      notify({ type: 'success', title: 'Compras Importadas', message: `${data.length} compras importadas com sucesso.` })
                    }
                  } catch (err) {
                    notify({ type: 'error', title: 'Erro de Importação', message: 'Falha ao processar arquivo.' })
                  }
                  e.target.value = ''
                }} 
              />

              {/* Dropdown de Exportação: Excel e PDF */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <SecondaryButton 
                  className="shrink-0 whitespace-nowrap" 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <Download className="w-3.5 h-3.5" /> Exportar <ChevronDown className="w-3 h-3 text-[#888]" />
                </SecondaryButton>

                {showExportMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-[#e2e8f0] py-1.5 z-50 animate-in fade-in zoom-in-95 text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false)
                        handleExportAllExcel()
                      }}
                      className="w-full px-3.5 py-2 text-xs font-semibold text-[#111111] hover:bg-[#f0fdf4] hover:text-[#16a34a] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#16a34a] shrink-0" />
                      <div>
                        <div className="font-bold">Baixar Excel (.xlsx)</div>
                        <div className="text-[10px] text-[#666666] font-normal">Planilha formatada</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false)
                        handleExportAllPDF()
                      }}
                      className="w-full px-3.5 py-2 text-xs font-semibold text-[#111111] hover:bg-[#fef2f2] hover:text-[#dc2626] flex items-center gap-2.5 transition-colors cursor-pointer border-t border-[#f1f5f9] text-left"
                    >
                      <FileText className="w-4 h-4 text-[#dc2626] shrink-0" />
                      <div>
                        <div className="font-bold">Baixar PDF (.pdf)</div>
                        <div className="text-[10px] text-[#666666] font-normal">Relatório para imprimir/salvar</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Excluir informativo */}
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="h-[38px] px-3 border border-[#fecaca] bg-[#fff5f5] hover:bg-[#fee2e2] text-[#dc2626] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                title="Excluir compras (selecione na tabela)"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>Excluir</span>
              </button>

              <PrimaryButton className="shrink-0 whitespace-nowrap" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5" /> Nova compra
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6]">
          <LoadingState message="Carregando compras..." padding={60} />
        </div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th className="w-10">
              <input 
                type="checkbox" 
                checked={filtered.length > 0 && selectedItems.length === filtered.length}
                onChange={toggleSelectAll}
                className="rounded border-[#ccc] text-[#1f2328] focus:ring-[#1f2328]"
              />
            </Th>
            <Th>Data</Th><Th>Fornecedor</Th><Th>Comprador</Th><Th className="text-right">Custo Total</Th><Th className="text-center">Status</Th><Th className="text-right w-12">Ações</Th>
          </TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {filtered.map((p: Record<string, unknown>) => {
              const supplierName = (p.suppliers as Record<string, unknown>)?.name as string || '—'
              const buyerName = (p.buyer_name as string) || ((p as any).profiles?.name as string) || 'Admin'
              return (
                <tr key={p.id as string} className="hover:bg-[#fafafa] transition-colors">
                  <Td>
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(p.id as string)}
                        onChange={() => toggleSelect(p.id as string)}
                        className="rounded border-[#ccc] text-[#1f2328] focus:ring-[#1f2328]"
                      />
                    </div>
                  </Td>
                  <Td>{new Date(p.date as string).toLocaleDateString('pt-BR')}</Td>
                  <Td>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-[#f5f5f5] border-2 border-[#e6e6e6] overflow-hidden flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-5 h-5 text-[#ccc]" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold text-[#1f2328] text-[14px] leading-tight mb-0.5">{supplierName}</p>
                        <p className="text-[13px] text-[#656d76] leading-tight">Nota: {(p.invoice as string) || 'S/N'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-[#666]">{buyerName}</Td>
                  <Td className="text-right font-medium text-[#333]">R$ {Number(p.total_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Td>
                  <Td className="text-center">
                    <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${p.status === 'CANCELED' ? 'bg-[#fff5f5] text-[#e74c3c]' : 'bg-[#f0fff4] text-[#38a169]'}`}>
                      {p.status === 'CANCELED' ? 'Cancelada' : 'Concluída'}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-0.5" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <button onClick={() => router.push(`/purchases/${p.id}/nota`)} className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#ccc] hover:text-[#666] transition-colors" title="Imprimir Comprovante">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {p.status !== 'CANCELED' && (
                        <button onClick={() => setCancelModalId(p.id as string)} className="p-1.5 rounded hover:bg-[#fff5f5] text-[#ccc] hover:text-[#e74c3c] transition-colors" title="Cancelar Compra">
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
      {showCreate && <PurchaseCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetch() }} />}
      {cancelModalId && (
        <DeleteConfirmationModal
          isOpen={!!cancelModalId}
          onClose={() => setCancelModalId(null)}
          onConfirm={confirmCancelPurchase}
          itemName="esta compra"
          description="O status será alterado para Cancelada e a nota refletirá essa alteração. O item não será excluído do sistema."
          actionWord="CANCELAR"
          actionTitle="Cancelamento"
          buttonText="Sim, Cancelar"
        />
      )}
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeletePurchases}
          itemName={`${selectedItems.length} compra(s)`}
          description="Esta ação removerá permanentemente os registros de compras selecionados do sistema TEKNIX."
          actionWord="EXCLUIR"
          actionTitle="Exclusão de Compras"
          buttonText="Sim, Excluir"
        />
      )}
    </div>
  )
}

function StockTab() {
  const router = useRouter()
  const { notify } = useNotification()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'OUT_OF_STOCK' | 'NORMAL'>('ALL')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showExportMenu, setShowExportMenu] = useState(false)

  const { data: products, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('*, product_images(url)').order('name').limit(200)
    if (error) throw error
    return data || []
  })

  function calcCost(p: Record<string, unknown>) {
    return (Number(p.cost_purchase) || 0) + (Number(p.freight_purchase) || 0) + (Number(p.packaging_cost) || 0) + (Number(p.other_costs) || 0)
  }

  const allProducts = (products || []) as Record<string, any>[]

  const counts = {
    ALL: allProducts.length,
    CRITICAL: allProducts.filter(p => {
      const stock = Number(p.stock) || 0
      const minStock = Number(p.min_stock) || 0
      return stock > 0 && stock <= minStock
    }).length,
    OUT_OF_STOCK: allProducts.filter(p => (Number(p.stock) || 0) === 0).length,
    NORMAL: allProducts.filter(p => {
      const stock = Number(p.stock) || 0
      const minStock = Number(p.min_stock) || 0
      return stock > minStock
    }).length,
  }

  const filtered = allProducts.filter(p => {
    if (search) {
      const match = matchesSearchQuery([p.name, p.sku, p.brand], search)
      if (!match) return false
    }
    const stock = Number(p.stock) || 0
    const minStock = Number(p.min_stock) || 0
    if (statusFilter === 'OUT_OF_STOCK') return stock === 0
    if (statusFilter === 'CRITICAL') return stock > 0 && stock <= minStock
    if (statusFilter === 'NORMAL') return stock > minStock
    return true
  })

  const toggleSelectAll = () => {
    if (selectedItems.length === filtered.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filtered.map((p: any) => p.id as string))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const STOCK_EXPORT_COLUMNS: ExportColumnDef[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Produto' },
    { key: 'brand', label: 'Marca', format: (v) => (v as string) || '—' },
    { key: 'stock', label: 'Estoque Atual', align: 'right', format: (v) => String(Number(v) || 0) },
    { key: 'min_stock', label: 'Estoque Mínimo', align: 'right', format: (v) => String(Number(v) || 0) },
    { key: 'cost', label: 'Custo Unitário (R$)', align: 'right', format: (_v, r) => `R$ ${calcCost(r).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { key: 'total_value', label: 'Valor Total (R$)', align: 'right', format: (_v, r) => `R$ ${(calcCost(r) * (Number(r.stock) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { key: 'status_label', label: 'Situação', align: 'center', format: (_v, r) => {
      const s = Number(r.stock) || 0
      const m = Number(r.min_stock) || 0
      if (s === 0) return 'Esgotado'
      if (s <= m) return 'Crítico'
      return 'Normal'
    }}
  ]

  const handleExportSelectedExcel = () => {
    if (selectedItems.length === 0) return
    const dataToExport = allProducts.filter((p: any) => selectedItems.includes(p.id))
    exportToExcel(dataToExport, 'posicao_estoque_selecionados', 'Estoque', STOCK_EXPORT_COLUMNS)
    notify({ type: 'success', title: 'Excel Exportado', message: `${dataToExport.length} itens exportados para planilha.` })
  }

  const handleExportSelectedPDF = () => {
    if (selectedItems.length === 0) return
    const dataToExport = allProducts.filter((p: any) => selectedItems.includes(p.id))
    exportToPDF(dataToExport, STOCK_EXPORT_COLUMNS, 'Posição de Estoque (Itens Selecionados)', `${dataToExport.length} itens selecionados`)
  }

  const handleExportAllExcel = () => {
    const dataToExport = filtered.length > 0 ? filtered : allProducts
    exportToExcel(dataToExport, 'posicao_estoque_geral', 'Estoque', STOCK_EXPORT_COLUMNS)
    notify({ type: 'success', title: 'Excel Exportado', message: `${dataToExport.length} itens exportados para planilha.` })
  }

  const handleExportAllPDF = () => {
    const dataToExport = filtered.length > 0 ? filtered : allProducts
    exportToPDF(dataToExport, STOCK_EXPORT_COLUMNS, 'Relatório Geral de Posição de Estoque', `Filtro: ${statusFilter} • Total: ${dataToExport.length} produtos`)
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Produtos" value={String(allProducts.length)} />
        <StatCard label="Estoque Total" value={String(allProducts.reduce((a: number, b: Record<string, unknown>) => a + (Number(b.stock) || 0), 0))} />
        <StatCard label="Críticos" value={String(counts.CRITICAL)} />
        <StatCard label="Esgotados" value={String(counts.OUT_OF_STOCK)} />
      </div>

      {/* TOOLBAR UNIFICADA DE ESTOQUE */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-3 shadow-2xs space-y-3 mb-4">
        <div className="flex items-center justify-between gap-3 flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {/* Campo de Busca */}
          <div className="flex-1 min-w-[200px] max-w-sm">
            <SearchInput placeholder="Buscar produto ou SKU..." value={search} onChange={setSearch} className="w-full max-w-none" />
          </div>

          {/* Filtro e Ações */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-[38px] px-3 bg-[#f8f9fa] hover:bg-[#f0f0f0] border border-[#e6e6e6] rounded-xl text-xs font-medium text-[#333] focus:outline-none focus:border-[#16a34a] cursor-pointer shadow-none shrink-0 transition-all"
            >
              <option value="ALL">Todos os Níveis ({counts.ALL})</option>
              <option value="NORMAL">Normal ({counts.NORMAL})</option>
              <option value="CRITICAL">Críticos ({counts.CRITICAL})</option>
              <option value="OUT_OF_STOCK">Esgotados ({counts.OUT_OF_STOCK})</option>
            </select>

            {/* Ações em Lote quando há seleção */}
            {selectedItems.length > 0 ? (
              <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#0071e3]/30 px-3 py-1 rounded-xl shadow-2xs shrink-0 flex-nowrap animate-in fade-in">
                <span className="text-xs font-bold text-[#0071e3] whitespace-nowrap bg-[#eff6ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                  {selectedItems.length} selecionado{selectedItems.length > 1 ? 's' : ''}
                </span>

                {/* Baixar Excel Selecionados */}
                <button
                  type="button"
                  onClick={handleExportSelectedExcel}
                  className="h-[32px] px-2.5 bg-white hover:bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] hover:text-[#15803d] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none whitespace-nowrap"
                  title="Baixar selecionados em planilha Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#16a34a]" />
                  <span>Excel</span>
                </button>

                {/* Baixar PDF Selecionados */}
                <button
                  type="button"
                  onClick={handleExportSelectedPDF}
                  className="h-[32px] px-2.5 bg-white hover:bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] hover:text-[#b91c1c] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none whitespace-nowrap"
                  title="Baixar ou imprimir selecionados em PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-[#dc2626]" />
                  <span>PDF</span>
                </button>

                {/* Desmarcar */}
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="h-[32px] w-[32px] flex items-center justify-center bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#111111] rounded-lg border border-[#e2e8f0] transition-all cursor-pointer shadow-none"
                  title="Desmarcar seleção"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                {/* Dropdown de Exportação: Excel e PDF */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <SecondaryButton 
                    className="shrink-0 whitespace-nowrap" 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar <ChevronDown className="w-3 h-3 text-[#888]" />
                  </SecondaryButton>

                  {showExportMenu && (
                    <div 
                      className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-[#e2e8f0] py-1.5 z-50 animate-in fade-in zoom-in-95 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowExportMenu(false)
                          handleExportAllExcel()
                        }}
                        className="w-full px-3.5 py-2 text-xs font-semibold text-[#111111] hover:bg-[#f0fdf4] hover:text-[#16a34a] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#16a34a] shrink-0" />
                        <div>
                          <div className="font-bold">Baixar Excel (.xlsx)</div>
                          <div className="text-[10px] text-[#666666] font-normal">Planilha formatada</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExportMenu(false)
                          handleExportAllPDF()
                        }}
                        className="w-full px-3.5 py-2 text-xs font-semibold text-[#111111] hover:bg-[#fef2f2] hover:text-[#dc2626] flex items-center gap-2.5 transition-colors cursor-pointer border-t border-[#f1f5f9] text-left"
                      >
                        <FileText className="w-4 h-4 text-[#dc2626] shrink-0" />
                        <div>
                          <div className="font-bold">Baixar PDF (.pdf)</div>
                          <div className="text-[10px] text-[#666666] font-normal">Relatório para imprimir/salvar</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6]">
          <LoadingState message="Carregando posição de estoque..." padding={60} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center space-y-2">
          <Warehouse className="w-8 h-8 text-[#ccc] mx-auto" />
          <p className="text-sm font-bold text-[#111]">Nenhum item encontrado no estoque</p>
          <p className="text-xs text-[#777]">Tente buscar com outro termo ou alterar o filtro.</p>
        </div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th className="w-10">
              <input 
                type="checkbox" 
                checked={filtered.length > 0 && selectedItems.length === filtered.length}
                onChange={toggleSelectAll}
                className="rounded border-[#ccc] text-[#1f2328] focus:ring-[#1f2328]"
              />
            </Th>
            <Th>SKU</Th>
            <Th>Produto</Th>
            <Th className="text-right">Estoque</Th>
            <Th className="text-right">Mínimo</Th>
            <Th className="text-right">Valor Unit.</Th>
            <Th className="text-right">Valor Total</Th>
            <Th className="text-center">Status</Th>
          </TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {filtered.map((p: Record<string, unknown>) => {
              const stock = Number(p.stock) || 0
              const minStock = Number(p.min_stock) || 0
              const cost = calcCost(p)
              const isSelected = selectedItems.includes(p.id as string)

              return (
                <tr 
                  key={p.id as string} 
                  onClick={() => router.push(`/produtos/${p.id}`)} 
                  className={`hover:bg-[#fafafa] transition-colors cursor-pointer ${isSelected ? 'bg-[#f8fafc]' : ''}`}
                >
                  <Td>
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id as string)}
                        className="rounded border-[#ccc] text-[#1f2328] focus:ring-[#1f2328]"
                      />
                    </div>
                  </Td>
                  <Td className="font-mono text-[#999]">{p.sku as string}</Td>
                  <Td>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-[#f5f5f5] border-2 border-[#e6e6e6] overflow-hidden flex items-center justify-center flex-shrink-0">
                        {(p.product_images as any)?.[0]?.url ? (
                          <img src={(p.product_images as any)[0].url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Package className="w-5 h-5 text-[#ccc]" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold text-[#1f2328] text-[14px] leading-tight mb-0.5">{p.name as string}</p>
                        <p className="text-[13px] text-[#656d76] leading-tight">{p.brand as string || 'Sem marca'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-right"><span className={`font-medium ${stock === 0 ? 'text-[#e74c3c]' : stock <= minStock ? 'text-[#e67e22]' : 'text-[#333]'}`}>{stock}</span></Td>
                  <Td className="text-right text-[#999]">{minStock}</Td>
                  <Td className="text-right text-[#999]">R$ {cost.toFixed(2)}</Td>
                  <Td className="text-right font-medium text-[#333]">R$ {(cost * stock).toFixed(2)}</Td>
                  <Td className="text-center">
                    {stock === 0 && <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#fff5f5] text-[#e74c3c]">Esgotado</span>}
                    {stock > 0 && stock <= minStock && <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#fffaf0] text-[#e67e22]">Crítico</span>}
                    {stock > minStock && <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">Normal</span>}
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

function StockCountTab() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)
  const { data: products, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('id, sku, name, stock, min_stock, status').eq('status', 'ACTIVE').order('name')
    if (error) throw error
    return data || []
  })

  const productList = (products || []) as Record<string, unknown>[]
  const counted = Object.keys(counts).length
  const discrepancies = productList.filter(p => {
    const countedVal = counts[p.id as string]
    return countedVal !== undefined && countedVal !== Number(p.stock)
  })
  const systemTotal = productList.reduce((a, p) => a + (Number(p.stock) || 0), 0)
  const countedTotal = Object.values(counts).reduce((a, b) => a + b, 0)

  const updateCount = (productId: string, value: string) => {
    const num = parseInt(value, 10)
    setCounts(prev => {
      const next = { ...prev }
      if (value === '' || isNaN(num)) {
        delete next[productId]
      } else {
        next[productId] = num
      }
      return next
    })
    setSaved(false)
  }

  const handleSave = async () => {
    const supabase = createClient()
    for (const [productId, physicalCount] of Object.entries(counts)) {
      const product = productList.find(p => p.id === productId)
      if (!product) continue
      const systemStock = Number(product.stock) || 0
      const diff = physicalCount - systemStock
      if (diff === 0) continue

      await supabase.from('products').update({ stock: physicalCount }).eq('id', productId)
      await supabase.from('inventory_movements').insert({
        product_id: productId,
        type: 'ADJUSTMENT',
        quantity: diff,
        notes: `Conferência de estoque — sistema: ${systemStock}, físico: ${physicalCount}`,
      })
    }
    setSaved(true)
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <StatCard label="Produtos" value={String(productList.length)} />
        <StatCard label="Conferidos" value={String(counted)} />
        <StatCard label="Diferenças" value={String(discrepancies.length)} />
        <StatCard label="Estoque Sistema" value={String(systemTotal)} />
        <StatCard label="Contagem Física" value={counted > 0 ? String(countedTotal) : '—'} />
      </div>

      {discrepancies.length > 0 && (
        <div className="bg-[#fffaf0] border border-[#f59e0b]/20 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0" />
          <span className="text-xs text-[#92400e]">
            <strong>{discrepancies.length} produto{discrepancies.length !== 1 ? 's' : ''}</strong> com diferença entre estoque do sistema e contagem física.
          </span>
        </div>
      )}

      {saved && (
        <div className="bg-[#f0fff4] border border-[#38a169]/20 rounded-lg p-3 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#38a169] shrink-0" />
          <span className="text-xs text-[#276749]">Conferência salva. Ajustes de estoque serão registrados como movimentação.</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6]">
          <LoadingState message="Carregando produtos para conferência..." padding={60} />
        </div>
      ) : (
        <>
          <ModuleTable>
            <TableHead>
              <Th>SKU</Th><Th>Produto</Th><Th className="text-right">Estoque Sistema</Th><Th className="text-center">Contagem Física</Th><Th className="text-center">Diferença</Th><Th className="text-center">Status</Th>
            </TableHead>
            <tbody className="divide-y divide-[#eeeeee]">
              {productList.map(p => {
                const systemStock = Number(p.stock) || 0
                const countedVal = counts[p.id as string]
                const diff = countedVal !== undefined ? countedVal - systemStock : null
                return (
                  <tr key={p.id as string} className="hover:bg-[#fafafa] transition-colors">
                    <Td className="font-mono text-[#999]">{p.sku as string}</Td>
                    <Td className="font-medium text-[#333]">{p.name as string}</Td>
                    <Td className="text-right font-medium text-[#333]">{systemStock}</Td>
                    <Td className="text-center">
                      <input
                        type="number"
                        min="0"
                        value={counts[p.id as string] ?? ''}
                        onChange={e => updateCount(p.id as string, e.target.value)}
                        placeholder="—"
                        className="w-20 px-2 py-1 text-center border border-[#e6e6e6] rounded-md text-[13px] text-[#333] focus:outline-none focus:border-[#1f2328] transition-colors min-h-[44px] sm:min-h-[34px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </Td>
                    <Td className="text-center">
                      {diff !== null ? (
                        <span className={`text-[13px] font-semibold ${diff === 0 ? 'text-[#38a169]' : 'text-[#e74c3c]'}`}>
                          {diff === 0 ? '✓' : diff > 0 ? `+${diff}` : diff}
                        </span>
                      ) : '—'}
                    </Td>
                    <Td className="text-center">
                      {diff !== null && (
                        diff === 0
                          ? <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">Correto</span>
                          : <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#fff5f5] text-[#e74c3c]">Diferente</span>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </ModuleTable>

          {counted > 0 && (
            <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2">
              <button
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 bg-[#1f2328] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#111827] transition-colors min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" /> Salvar Conferência
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function OperacaoPage() {
  return (
    <div className="mp-stack space-y-6">
      <Tabs defaultValue="produtos" plain>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eeeeee] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="hub-mobile-back-btn !w-8 !h-8 sm:!w-9 sm:!h-9 !rounded-xl"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-[15px] sm:text-[16px] font-bold tracking-tight text-[#111111] leading-tight">
                Operação
              </h1>
              <p className="text-[11px] sm:text-xs text-[#888888] leading-tight mt-0.5">
                Painel de produtos, fornecedores, compras e conferência de estoque
              </p>
            </div>
          </div>

          <TabsList align="right" className="!border-b-0 !pb-0 !mb-0 shrink-0">
            <TabsTrigger variant="icon" value="produtos" title="Produtos">
              <Package size={19} strokeWidth={2} className="w-5 h-5 shrink-0" style={{ width: '19px', height: '19px', minWidth: '19px', minHeight: '19px', display: 'block' }} />
            </TabsTrigger>
            <TabsTrigger variant="icon" value="fornecedores" title="Fornecedores">
              <Truck size={19} strokeWidth={2} className="w-5 h-5 shrink-0" style={{ width: '19px', height: '19px', minWidth: '19px', minHeight: '19px', display: 'block' }} />
            </TabsTrigger>
            <TabsTrigger variant="icon" value="compras" title="Compras">
              <ShoppingCart size={19} strokeWidth={2} className="w-5 h-5 shrink-0" style={{ width: '19px', height: '19px', minWidth: '19px', minHeight: '19px', display: 'block' }} />
            </TabsTrigger>
            <TabsTrigger variant="icon" value="estoque" title="Estoque">
              <Warehouse size={19} strokeWidth={2} className="w-5 h-5 shrink-0" style={{ width: '19px', height: '19px', minWidth: '19px', minHeight: '19px', display: 'block' }} />
            </TabsTrigger>
            <TabsTrigger variant="icon" value="conferencia" title="Conferência">
              <ClipboardCheck size={19} strokeWidth={2} className="w-5 h-5 shrink-0" style={{ width: '19px', height: '19px', minWidth: '19px', minHeight: '19px', display: 'block' }} />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="produtos" className="space-y-6"><ProductsTab /></TabsContent>
        <TabsContent value="fornecedores" className="space-y-6"><SuppliersTab /></TabsContent>
        <TabsContent value="compras" className="space-y-6"><PurchasesTab /></TabsContent>
        <TabsContent value="estoque" className="space-y-6"><StockTab /></TabsContent>
        <TabsContent value="conferencia" className="space-y-6"><StockCountTab /></TabsContent>
      </Tabs>
    </div>
  )
}
