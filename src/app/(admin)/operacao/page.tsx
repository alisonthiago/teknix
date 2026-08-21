'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download, Upload, Package, Truck, ShoppingCart, Warehouse, Eye, Edit, Trash2, ClipboardCheck, CheckCircle2, AlertTriangle, Building2, Ban, Printer, Share2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, PrimaryButton, SecondaryButton, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'
import { exportToExcel, importFromExcel } from '@/utils/excel'
import dynamic from 'next/dynamic'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useNotification } from '@/contexts/NotificationContext'
import ProductMarketplaceActionModal from '@/components/ProductMarketplaceActionModal'
import ProductDiagnosticModal from '@/components/ProductDiagnosticModal'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'
import { PauseCircle, PlayCircle, Lock, Unlock, RefreshCw, Info, MoreHorizontal, ShieldAlert, AlertCircle } from 'lucide-react'

const ProductCreateModal = dynamic(() => import('@/components/ProductCreateModal'), { ssr: false })
const SupplierCreateModal = dynamic(() => import('@/components/SupplierCreateModal'), { ssr: false })
const PurchaseCreateModal = dynamic(() => import('@/components/PurchaseCreateModal'), { ssr: false })
const DeleteConfirmationModal = dynamic(() => import('@/components/DeleteConfirmationModal'), { ssr: false })

function ProductsTab() {
  const router = useRouter()
  const { notify } = useNotification()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [situationFilter, setSituationFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'BLOCKED' | 'LOCKED' | 'BANNED' | 'OUT_OF_STOCK' | 'ERROR' | 'SYNC_ISSUE'>('ALL')
  const [shareProduct, setShareProduct] = useState<any | null>(null)

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
      const q = search.toLowerCase()
      const matchName = String(p.name || '').toLowerCase().includes(q)
      const matchSku = String(p.sku || '').toLowerCase().includes(q)
      const matchBrand = String(p.brand || '').toLowerCase().includes(q)
      if (!matchName && !matchSku && !matchBrand) return false
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

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return
    const dataToExport = products?.filter((p: any) => selectedItems.includes(p.id)) || []
    exportToExcel(dataToExport, 'produtos_selecionados')
    setSelectedItems([])
  }

  const handleExportAll = () => {
    exportToExcel(products || [], 'todos_os_produtos')
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard label="Produtos Cadastrados" value={String(products?.length || 0)} />
        <StatCard label="Estoque Total" value={String(products?.reduce((a: number, b: Record<string, unknown>) => a + (Number(b.stock) || 0), 0) || 0)} />
        <StatCard label="Pausados / Bloqueados" value={String((counts.PAUSED + counts.BLOCKED) || 0)} />
        <StatCard label="Sem Estoque" value={String(counts.OUT_OF_STOCK || 0)} />
      </div>

      {/* TOOLBAR UNIFICADA: BUSCA + FILTRO DE SITUAÇÃO COMPACTO & CLEAN */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-3 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="flex-1 max-w-md">
            <SearchInput placeholder="Buscar por título, SKU, marca..." value={search} onChange={setSearch} />
          </div>

          {/* Filtro de Situação — somente dropdown limpo */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={situationFilter}
              onChange={(e) => setSituationFilter(e.target.value as any)}
              className="h-[38px] px-3.5 bg-[#f8f9fa] hover:bg-[#f0f0f0] border border-[#e6e6e6] rounded-xl text-xs font-bold text-[#333] focus:outline-none focus:border-[#16a34a] cursor-pointer shadow-sm transition-all"
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

            {/* Ações em Lote ou Botões de Ação */}
            {selectedItems.length > 0 ? (
              <div className="flex items-center gap-2 bg-[#f0f7ff] px-3 py-1 rounded-xl border border-[#3483fa]/20 shadow-2xs">
                <span className="text-xs font-bold text-[#3483fa]">{selectedItems.length} sel.</span>
                <button onClick={handleExportSelected} className="text-xs font-bold text-[#3483fa] hover:underline cursor-pointer">Exportar</button>
                <button onClick={handleDeleteSelected} className="text-xs font-bold text-[#dc2626] hover:underline cursor-pointer">Excluir</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SecondaryButton onClick={() => document.getElementById('import-products')?.click()}><Upload className="w-3.5 h-3.5" /> Importar</SecondaryButton>
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
                <SecondaryButton onClick={handleExportAll}><Download className="w-3.5 h-3.5" /> Exportar</SecondaryButton>
                <PrimaryButton onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> Novo</PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando catálogo...</div>
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
            <Th>SKU</Th>
            <Th>Produto & Canal</Th>
            <Th>Fornecedor</Th>
            <Th className="text-right">Custo</Th>
            <Th className="text-right">Estoque</Th>
            <Th className="text-center">Situação</Th>
            <Th className="text-right">Controle Central</Th>
          </TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {filtered.map((p: Record<string, any>) => {
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
                        className="rounded border-[#ccc] text-[#111] focus:ring-[#16a34a]"
                      />
                    </div>
                  </Td>
                  <Td className="font-mono text-[#777] text-xs">{p.sku as string}</Td>
                  <Td>
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#f5f5f5] border border-[#e6e6e6] overflow-hidden flex items-center justify-center shrink-0">
                        {(p.image_url || (p.product_images as any)?.[0]?.url) ? (
                          <img src={(p.image_url as string) || (p.product_images as any)[0].url} alt="" className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <Package className="w-5 h-5 text-[#ccc]" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[#111] text-[13px] leading-tight truncate max-w-sm">{p.name as string}</p>
                          {((p.marketplace_listings as any)?.length > 0 || String(p.sku || '').startsWith('MLB')) && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fffde7] text-[#856404] border border-[#ffeeba] text-[10px] font-bold shrink-0">
                              <MarketplaceLogo name="Mercado Livre" className="w-3 h-3" /> ML
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#777] leading-tight mt-0.5">{p.brand as string || 'Sem marca'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-[#666] text-xs">{supplierName}</Td>
                  <Td className="text-right text-xs font-semibold text-[#111]">R$ {cost.toFixed(2)}</Td>
                  <Td className="text-right">
                    <span className={`font-bold text-xs ${stock === 0 ? 'text-[#dc2626]' : stock <= minStock ? 'text-[#d97706]' : 'text-[#111]'}`}>
                      {stock}
                    </span>
                  </Td>
                  <Td className="text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusBadgeConfig.bg}`}>
                      {stock === 0 && status === 'ACTIVE' ? 'Sem Estoque' : statusBadgeConfig.label}
                    </span>
                  </Td>
                  
                  {/* CONTROLE CENTRALIZADO DE AÇÕES (CONFORME SOLICITADO) */}
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      {/* Botão Diagnóstico / Motivo */}
                      <button 
                        onClick={() => setDiagnosticModal({ isOpen: true, product: p })}
                        title="Ver Diagnóstico do Marketplace & Motivo"
                        className="p-1.5 rounded-lg border border-[#e6e6e6] hover:bg-[#f0f7ff] text-[#555] hover:text-[#3483fa] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      {/* Botão Pausar / Ativar Direto */}
                      {isPaused ? (
                        <button
                          onClick={() => setActionModal({ isOpen: true, product: p, action: 'activate' })}
                          title="Ativar Anúncio no Marketplace"
                          className="p-1.5 rounded-lg border border-[#bbf7d0] bg-[#f0fff4] hover:bg-[#dcfce7] text-[#16a34a] transition-colors cursor-pointer shadow-2xs"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionModal({ isOpen: true, product: p, action: 'pause' })}
                          title="Pausar Anúncio no Marketplace"
                          className="p-1.5 rounded-lg border border-[#fde68a] bg-[#fffbeb] hover:bg-[#fef3c7] text-[#d97706] transition-colors cursor-pointer shadow-2xs"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Botão Travar / Destravar */}
                      {isLocked ? (
                        <button
                          onClick={() => setActionModal({ isOpen: true, product: p, action: 'unlock' })}
                          title="Destravar Produto"
                          className="p-1.5 rounded-lg border border-[#c7d2fe] bg-[#e0e7ff] text-[#4338ca] hover:bg-[#c7d2fe] transition-colors cursor-pointer shadow-2xs"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionModal({ isOpen: true, product: p, action: 'lock' })}
                          title="Travar Preço & Estoque"
                          className="p-1.5 rounded-lg border border-[#e6e6e6] hover:bg-[#f5f5f5] text-[#777] hover:text-[#4338ca] transition-colors cursor-pointer shadow-2xs"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Botão Sincronizar */}
                      <button
                        onClick={() => setActionModal({ isOpen: true, product: p, action: 'sync' })}
                        title="Sincronizar com Marketplace"
                        className="p-1.5 rounded-lg border border-[#e6e6e6] hover:bg-[#f5f5f5] text-[#777] hover:text-[#0284c7] transition-colors cursor-pointer shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Botão Compartilhar no Chat */}
                      <button
                        onClick={() => setShareProduct(p)}
                        title="Compartilhar no Chat com Colaborador"
                        className="p-1.5 rounded-lg border border-[#e6e6e6] hover:bg-[#16a34a] hover:text-white text-[#777] transition-all cursor-pointer shadow-sm"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Botão Excluir Seguro */}
                      <button 
                        onClick={() => setDeleteModal({ isOpen: true, items: [p.id as string], name: p.name as string })}
                        title="Excluir Produto"
                        className="p-1.5 rounded-lg border border-[#e6e6e6] hover:bg-[#fee2e2] text-[#777] hover:text-[#dc2626] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
      {showCreate && <ProductCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetch() }} />}
    </div>
  )
}

function SuppliersTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
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

  const handleDeleteSelected = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.length} fornecedor(es)?`)) return
    const supabase = createClient()
    await supabase.from('suppliers').delete().in('id', selectedItems)
    setSelectedItems([])
    refetch()
  }

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return
    const dataToExport = suppliers?.filter((s: any) => selectedItems.includes(s.id)) || []
    exportToExcel(dataToExport, 'fornecedores_selecionados')
    setSelectedItems([])
  }

  const handleExportAll = () => {
    exportToExcel(suppliers || [], 'todos_os_fornecedores')
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Fornecedores" value={String(suppliers?.length || 0)} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-4">
        <SearchInput placeholder="Buscar fornecedor..." value={search} onChange={setSearch} />
        {selectedItems.length > 0 ? (
          <div className="flex items-center gap-2 bg-[#f0f7ff] px-3 py-1.5 rounded-md border border-[#3483fa]/20">
            <span className="text-[12px] font-medium text-[#3483fa] mr-2">{selectedItems.length} selecionado(s)</span>
            <button onClick={handleExportSelected} className="flex items-center gap-1.5 text-[12px] font-medium text-[#3483fa] bg-white px-2.5 py-1.5 rounded border border-[#3483fa]/20 hover:bg-[#3483fa] hover:text-white transition-colors cursor-pointer"><Download className="w-3.5 h-3.5" /> Exportar</button>
            <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 text-[12px] font-medium text-[#e74c3c] bg-white px-2.5 py-1.5 rounded border border-[#e74c3c]/20 hover:bg-[#e74c3c] hover:text-white transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton onClick={() => document.getElementById('import-suppliers')?.click()}><Upload className="w-3.5 h-3.5" /> Importar</SecondaryButton>
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
                    alert(`${data.length} fornecedores importados com sucesso!`)
                  }
                } catch (err) {
                  alert('Erro ao importar arquivo.')
                }
                e.target.value = ''
              }} 
            />
            <SecondaryButton onClick={handleExportAll}><Download className="w-3.5 h-3.5" /> Exportar</SecondaryButton>
            <PrimaryButton onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> Novo fornecedor</PrimaryButton>
          </div>
        )}
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th className="w-10">
              <input 
                type="checkbox" 
                checked={filtered.length > 0 && selectedItems.length === filtered.length}
                onChange={toggleSelectAll}
                className="rounded border-[#ccc] text-[#3483fa] focus:ring-[#3483fa]"
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
                      className="rounded border-[#ccc] text-[#3483fa] focus:ring-[#3483fa]"
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
      )}
      {showCreate && <SupplierCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetch() }} />}
    </div>
  )
}

function PurchasesTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
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

  const handleDeleteSelected = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.length} compra(s)? Essa ação não pode ser desfeita.`)) return
    const supabase = createClient()
    await supabase.from('purchases').delete().in('id', selectedItems)
    setSelectedItems([])
    refetch()
  }

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return
    const dataToExport = purchases?.filter((p: any) => selectedItems.includes(p.id)) || []
    exportToExcel(dataToExport, 'compras_selecionadas')
    setSelectedItems([])
  }

  const handleExportAll = () => {
    exportToExcel(purchases || [], 'todas_as_compras')
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-4">
        <SearchInput placeholder="Buscar compra..." value={search} onChange={setSearch} />
        {selectedItems.length > 0 ? (
          <div className="flex items-center gap-2 bg-[#f0f7ff] px-3 py-1.5 rounded-md border border-[#3483fa]/20">
            <span className="text-[12px] font-medium text-[#3483fa] mr-2">{selectedItems.length} selecionado(s)</span>
            <button onClick={handleExportSelected} className="flex items-center gap-1.5 text-[12px] font-medium text-[#3483fa] bg-white px-2.5 py-1.5 rounded border border-[#3483fa]/20 hover:bg-[#3483fa] hover:text-white transition-colors cursor-pointer"><Download className="w-3.5 h-3.5" /> Exportar</button>
            <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 text-[12px] font-medium text-[#e74c3c] bg-white px-2.5 py-1.5 rounded border border-[#e74c3c]/20 hover:bg-[#e74c3c] hover:text-white transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton onClick={() => document.getElementById('import-purchases')?.click()}><Upload className="w-3.5 h-3.5" /> Importar</SecondaryButton>
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
                    alert(`${data.length} compras importadas com sucesso! (Atenção: Itens não são importados por esta via)`)
                  }
                } catch (err) {
                  alert('Erro ao importar arquivo.')
                }
                e.target.value = ''
              }} 
            />
            <SecondaryButton onClick={handleExportAll}><Download className="w-3.5 h-3.5" /> Exportar</SecondaryButton>
            <PrimaryButton onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> Nova compra</PrimaryButton>
          </div>
        )}
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th className="w-10">
              <input 
                type="checkbox" 
                checked={filtered.length > 0 && selectedItems.length === filtered.length}
                onChange={toggleSelectAll}
                className="rounded border-[#ccc] text-[#3483fa] focus:ring-[#3483fa]"
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
                        className="rounded border-[#ccc] text-[#3483fa] focus:ring-[#3483fa]"
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
    </div>
  )
}

function StockTab() {
  const router = useRouter()
  const { data: products, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('*, product_images(url)').order('name').limit(200)
    if (error) throw error
    return data || []
  })

  function calcCost(p: Record<string, unknown>) {
    return (Number(p.cost_purchase) || 0) + (Number(p.freight_purchase) || 0) + (Number(p.packaging_cost) || 0) + (Number(p.other_costs) || 0)
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Produtos" value={String(products?.length || 0)} />
        <StatCard label="Estoque Total" value={String(products?.reduce((a: number, b: Record<string, unknown>) => a + (Number(b.stock) || 0), 0) || 0)} />
        <StatCard label="Críticos" value={String(products?.filter((p: Record<string, unknown>) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.min_stock) || 0)).length || 0)} />
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead><Th>SKU</Th><Th>Produto</Th><Th className="text-right">Estoque</Th><Th className="text-right">Mínimo</Th><Th className="text-right">Valor Unit.</Th><Th className="text-right">Valor Total</Th><Th className="text-center">Status</Th></TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {(products || []).map((p: Record<string, unknown>) => {
              const stock = Number(p.stock) || 0
              const minStock = Number(p.min_stock) || 0
              const cost = calcCost(p)
              return (
                <tr key={p.id as string} onClick={() => router.push(`/produtos/${p.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
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
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando produtos...</div>
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
                        className="w-20 px-2 py-1 text-center border border-[#e6e6e6] rounded-md text-[13px] text-[#333] focus:outline-none focus:border-[#3483fa] transition-colors min-h-[44px] sm:min-h-[34px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="inline-flex items-center justify-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors min-h-[44px]"
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
    <div className="mp-stack">
      <PageHeader title="Operação" description="Gerencie produtos, fornecedores, compras e estoque" />
      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos"><Package className="w-3.5 h-3.5 mr-1 inline" /> Produtos</TabsTrigger>
          <TabsTrigger value="fornecedores"><Truck className="w-3.5 h-3.5 mr-1 inline" /> Fornecedores</TabsTrigger>
          <TabsTrigger value="compras"><ShoppingCart className="w-3.5 h-3.5 mr-1 inline" /> Compras</TabsTrigger>
          <TabsTrigger value="estoque"><Warehouse className="w-3.5 h-3.5 mr-1 inline" /> Estoque</TabsTrigger>
          <TabsTrigger value="conferencia"><ClipboardCheck className="w-3.5 h-3.5 mr-1 inline" /> Conferência</TabsTrigger>
        </TabsList>
        <TabsContent value="produtos"><ProductsTab /></TabsContent>
        <TabsContent value="fornecedores"><SuppliersTab /></TabsContent>
        <TabsContent value="compras"><PurchasesTab /></TabsContent>
        <TabsContent value="estoque"><StockTab /></TabsContent>
        <TabsContent value="conferencia"><StockCountTab /></TabsContent>
      </Tabs>
    </div>
  )
}
