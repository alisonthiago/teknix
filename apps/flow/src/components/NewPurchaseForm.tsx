'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Calendar, 
  FileText, 
  CreditCard, 
  Truck, 
  Building2, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  DollarSign,
  Search,
  Check
} from 'lucide-react'
import { createPurchase } from '@/app/(admin)/purchases/actions'
import { useNotification } from '@/contexts/NotificationContext'

interface Supplier {
  id: string
  name: string
  document?: string | null
  phone?: string | null
  email?: string | null
}

interface Product {
  id: string
  name: string
  sku: string
  supplier_id: string | null
  stock?: number
  cost_purchase?: number
  image_url?: string | null
}

interface PurchaseItem {
  id: string
  product_id: string
  quantity: number
  unit_cost: number
  freight: number
  other_costs: number
}

interface NewPurchaseFormProps {
  suppliers: Supplier[]
  products: Product[]
  initialSupplierId?: string
  initialProductId?: string
}

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function NewPurchaseForm({ 
  suppliers, 
  products,
  initialSupplierId = '',
  initialProductId = ''
}: NewPurchaseFormProps) {
  const router = useRouter()
  const { notify } = useNotification()

  const initialProduct = initialProductId ? products.find(p => p.id === initialProductId) : null
  const selectedSupplierFromProduct = initialProduct?.supplier_id || initialSupplierId

  const [supplierId, setSupplierId] = useState(selectedSupplierFromProduct)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [invoice, setInvoice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Boleto Bancário')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [quickSearchProduct, setQuickSearchProduct] = useState('')

  const [items, setItems] = useState<PurchaseItem[]>(() => {
    if (initialProduct) {
      return [{
        id: `item-init-1`,
        product_id: initialProduct.id,
        quantity: 1,
        unit_cost: Number(initialProduct.cost_purchase || 0),
        freight: 0,
        other_costs: 0
      }]
    }
    return []
  })

  const currentSupplier = useMemo(() => {
    return suppliers.find(s => s.id === supplierId) || null
  }, [suppliers, supplierId])

  // Produtos disponíveis: filtra pelo fornecedor selecionado, ou permite todos caso não haja vínculo estrito
  const availableProducts = useMemo(() => {
    if (!supplierId) return products
    const linked = products.filter(p => p.supplier_id === supplierId)
    return linked.length > 0 ? linked : products
  }, [products, supplierId])

  // Produtos rápidos para sugestão/atalho
  const filteredQuickProducts = useMemo(() => {
    if (!quickSearchProduct.trim()) return []
    const q = quickSearchProduct.toLowerCase()
    return availableProducts
      .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 6)
  }, [availableProducts, quickSearchProduct])

  const handleAddItem = (presetProduct?: Product) => {
    const prod = presetProduct || (availableProducts.length > 0 ? availableProducts[0] : null)
    const newItem: PurchaseItem = {
      id: Math.random().toString(36).slice(2, 9),
      product_id: prod?.id || '',
      quantity: 1,
      unit_cost: prod ? Number(prod.cost_purchase || 0) : 0,
      freight: 0,
      other_costs: 0
    }
    setItems(prev => [...prev, newItem])
    setQuickSearchProduct('')
  }

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      
      // Se alterou o produto, preenche o custo padrão se unit_cost for 0
      if (field === 'product_id') {
        const found = products.find(p => p.id === value)
        if (found && Number(found.cost_purchase || 0) > 0) {
          updated.unit_cost = Number(found.cost_purchase)
        }
      }
      return updated
    }))
  }

  const totals = useMemo(() => {
    let cost = 0
    let freight = 0
    let other = 0
    let totalQty = 0
    items.forEach(item => {
      const q = Number(item.quantity) || 0
      const u = Number(item.unit_cost) || 0
      cost += (u * q)
      freight += Number(item.freight) || 0
      other += Number(item.other_costs) || 0
      totalQty += q
    })
    return {
      cost,
      freight,
      other,
      totalQty,
      total: cost + freight + other
    }
  }, [items])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      notify({ type: 'error', title: 'Fornecedor obrigatório', message: 'Selecione o fornecedor da compra.' })
      return
    }
    if (items.length === 0) {
      notify({ type: 'error', title: 'Itens obrigatórios', message: 'Adicione pelo menos um produto à compra.' })
      return
    }
    if (items.some(i => !i.product_id)) {
      notify({ type: 'error', title: 'Produto não selecionado', message: 'Selecione o produto em todos os itens da lista.' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        supplier_id: supplierId,
        date,
        invoice,
        payment_method: paymentMethod,
        notes,
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: Number(i.quantity) || 1,
          unit_cost: Number(i.unit_cost) || 0,
          freight: Number(i.freight) || 0,
          other_costs: Number(i.other_costs) || 0
        }))
      }

      const purchaseId = await createPurchase(payload)
      notify({ type: 'success', title: 'Compra registrada', message: 'Estoque atualizado e Nota Interna gerada!' })
      router.push(`/purchases/${purchaseId}/nota`)
    } catch (err: any) {
      console.error(err)
      notify({ type: 'error', title: 'Erro ao salvar', message: err.message || 'Erro ao registrar compra.' })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Topo com Navegação e Título ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e6e6]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-xl border border-[#e6e6e6] bg-white flex items-center justify-center text-[#555] hover:text-[#111] hover:bg-[#f8f9fa] hover:border-[#cbd5e1] transition-all cursor-pointer shadow-2xs shrink-0"
            aria-label="Voltar"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] leading-tight">
                Nova Compra
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
                Entrada no Estoque
              </span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">
              Alimente o estoque dos produtos e emita a Nota Interna de conferência física
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/operacao"
            className="h-10 px-4 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || items.length === 0 || !supplierId}
            className="h-10 px-5 rounded-xl bg-[#0071e3] hover:bg-[#0062c4] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar e Gerar Nota</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Layout em 2 Colunas no Desktop (Principal 8 cols + Resumo 4 cols) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: Formulário Principal (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Fornecedor e Dados Gerais */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#f1f5f9]">
              <div className="w-8 h-8 rounded-xl bg-[#f0f9ff] text-[#0284c7] flex items-center justify-center shrink-0 border border-[#bae6fd]">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111111] leading-tight">
                  Dados do Fornecedor & Pedido
                </h2>
                <p className="text-[11px] text-[#888888] leading-tight mt-0.5">
                  Identificação do parceiro e informações fiscais da remessa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Fornecedor */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="supplier_id" className="block text-xs font-semibold text-[#333333]">
                  Fornecedor *
                </label>
                <select
                  id="supplier_id"
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value)
                  }}
                  required
                  className="w-full h-11 px-3.5 bg-white border border-[#d1d5db] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 rounded-xl text-xs sm:text-sm font-semibold text-[#111111] outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">Selecione o fornecedor da compra...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.document ? `(${s.document})` : ''}
                    </option>
                  ))}
                </select>

                {currentSupplier && (
                  <div className="mt-2.5 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#334155]">
                      <Truck className="w-4 h-4 text-[#64748b]" />
                      <span>
                        Fornecedor selecionado: <strong className="text-[#111111]">{currentSupplier.name}</strong>
                      </span>
                    </div>
                    {currentSupplier.document && (
                      <span className="font-mono text-[#64748b] bg-white px-2 py-0.5 rounded border border-[#e2e8f0]">
                        {currentSupplier.document}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Data da Compra */}
              <div className="space-y-1.5">
                <label htmlFor="date" className="block text-xs font-semibold text-[#333333]">
                  Data da Compra *
                </label>
                <div className="relative">
                  <input
                    id="date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-[#d1d5db] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 rounded-xl text-xs sm:text-sm text-[#111111] font-medium outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Nota Fiscal */}
              <div className="space-y-1.5">
                <label htmlFor="invoice" className="block text-xs font-semibold text-[#333333]">
                  Nota Fiscal (NFe)
                </label>
                <div className="relative">
                  <input
                    id="invoice"
                    type="text"
                    placeholder="Ex: 004.891.200"
                    value={invoice}
                    onChange={(e) => setInvoice(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-[#d1d5db] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 rounded-xl text-xs sm:text-sm text-[#111111] font-mono outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="payment_method" className="block text-xs font-semibold text-[#333333]">
                  Condição / Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Boleto Bancário', 'Pix', 'Cartão de Crédito', 'A Prazo (Faturado)'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`h-10 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center text-center ${
                        paymentMethod === method
                          ? 'border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3] shadow-xs'
                          : 'border-[#e2e8f0] bg-white text-[#555] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Produtos da Compra */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center shrink-0 border border-[#bbf7d0]">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111111] leading-tight">
                    Produtos & Quantidades ({items.length})
                  </h2>
                  <p className="text-[11px] text-[#888888] leading-tight mt-0.5">
                    Adicione os itens recebidos com seus respectivos custos e frete
                  </p>
                </div>
              </div>

              {supplierId && (
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="h-9 px-3.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#d1d5db] hover:border-[#111111] text-[#111111] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Produto</span>
                </button>
              )}
            </div>

            {/* Busca Rápida de Produto */}
            {supplierId && availableProducts.length > 0 && (
              <div className="relative">
                <div className="flex items-center gap-2 px-3.5 h-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#666]">
                  <Search className="w-4 h-4 text-[#999] shrink-0" />
                  <input
                    type="text"
                    placeholder="Localizar produto rápido por nome ou SKU para adicionar..."
                    value={quickSearchProduct}
                    onChange={(e) => setQuickSearchProduct(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-[#111] placeholder:text-[#999]"
                  />
                  {quickSearchProduct && (
                    <button
                      type="button"
                      onClick={() => setQuickSearchProduct('')}
                      className="text-xs text-[#999] hover:text-[#111]"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Dropdown de sugestões rápidas */}
                {filteredQuickProducts.length > 0 && (
                  <div className="absolute top-11 left-0 right-0 z-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl p-2 space-y-1 max-h-60 overflow-y-auto">
                    {filteredQuickProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddItem(p)}
                        className="w-full text-left p-2.5 hover:bg-[#f1f5f9] rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111] truncate">{p.name}</p>
                          <p className="text-[11px] text-[#666] font-mono">SKU: {p.sku} · Estoque atual: {p.stock ?? 0} un</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-[#16a34a]">{formatBRL(Number(p.cost_purchase || 0))}</span>
                          <span className="block text-[10px] text-[#0071e3] font-semibold group-hover:underline">+ Adicionar</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alerta caso nenhum fornecedor esteja selecionado */}
            {!supplierId && (
              <div className="p-8 text-center bg-[#fafafa] rounded-2xl border border-dashed border-[#e2e8f0] space-y-2">
                <Building2 className="w-8 h-8 text-[#94a3b8] mx-auto" />
                <p className="text-xs font-semibold text-[#475569]">
                  Selecione um fornecedor acima para liberar a lista de produtos
                </p>
                <p className="text-[11px] text-[#94a3b8]">
                  Os produtos serão filtrados automaticamente de acordo com o fornecedor escolhido.
                </p>
              </div>
            )}

            {/* Nenhum item adicionado ainda */}
            {supplierId && items.length === 0 && (
              <div className="p-8 text-center bg-[#fafafa] rounded-2xl border border-dashed border-[#e2e8f0] space-y-3">
                <ShoppingCart className="w-8 h-8 text-[#94a3b8] mx-auto" />
                <p className="text-xs font-semibold text-[#475569]">
                  Nenhum produto inserido nesta compra
                </p>
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-4 py-2 bg-white border border-[#d1d5db] hover:border-[#111] text-[#111] text-xs font-bold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Primeiro Produto</span>
                </button>
              </div>
            )}

            {/* Lista dos Itens da Compra */}
            <div className="space-y-3.5">
              {items.map((item, index) => {
                const selectedProd = products.find(p => p.id === item.product_id)
                const lineTotal = (Number(item.unit_cost || 0) * Number(item.quantity || 0)) + Number(item.freight || 0) + Number(item.other_costs || 0)

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] bg-[#fafafa] hover:border-[#cbd5e1] transition-all space-y-4 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Seletor de Produto */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                          Item #{index + 1} — Produto *
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                          required
                          className="w-full h-10 px-3 bg-white border border-[#d1d5db] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 rounded-xl text-xs font-semibold text-[#111] outline-none cursor-pointer shadow-2xs"
                        >
                          <option value="">Selecione o produto no catálogo...</option>
                          {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} — {p.name} (Estoque: {p.stock ?? 0} un)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Botão Remover Item */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] hover:text-[#dc2626] hover:bg-[#fee2e2]/60 transition-colors cursor-pointer mt-5 shrink-0"
                        title="Remover produto da compra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Campos de Valores e Quantidades */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {/* Quantidade */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#64748b]">
                          Quantidade *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full h-9 px-3 bg-white border border-[#d1d5db] focus:border-[#0071e3] rounded-xl text-xs font-bold text-[#111] outline-none shadow-2xs"
                        />
                      </div>

                      {/* Custo Unitário */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#64748b]">
                          Custo Unit. (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unit_cost}
                          onChange={(e) => updateItem(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-full h-9 px-3 bg-white border border-[#d1d5db] focus:border-[#0071e3] rounded-xl text-xs font-mono font-bold text-[#111] outline-none shadow-2xs"
                        />
                      </div>

                      {/* Frete do Item */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#64748b]">
                          Frete Rateado (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.freight}
                          onChange={(e) => updateItem(item.id, 'freight', parseFloat(e.target.value) || 0)}
                          className="w-full h-9 px-3 bg-white border border-[#d1d5db] focus:border-[#0071e3] rounded-xl text-xs font-mono text-[#444] outline-none shadow-2xs"
                        />
                      </div>

                      {/* Outros Custos */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#64748b]">
                          Outros Custos (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.other_costs}
                          onChange={(e) => updateItem(item.id, 'other_costs', parseFloat(e.target.value) || 0)}
                          className="w-full h-9 px-3 bg-white border border-[#d1d5db] focus:border-[#0071e3] rounded-xl text-xs font-mono text-[#444] outline-none shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Linha de Subtotal do Item */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0] text-xs">
                      <span className="text-[#64748b]">
                        Custo total deste produto:
                      </span>
                      <span className="font-mono font-bold text-[#111111] text-[13px]">
                        {formatBRL(lineTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Observações Gerais */}
            <div className="pt-2 space-y-1.5 border-t border-[#f1f5f9]">
              <label htmlFor="notes" className="block text-xs font-semibold text-[#333]">
                Observações Gerais / Instruções
              </label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Observações internas sobre a entrega, lote ou conferência..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-white border border-[#d1d5db] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 rounded-xl text-xs text-[#111] outline-none transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Resumo Financeiro & Ações (4 cols, Sticky) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <h3 className="text-sm font-bold text-[#111111]">
                Resumo da Compra
              </h3>
              <span className="text-xs font-semibold text-[#666]">
                {totals.totalQty} {totals.totalQty === 1 ? 'unidade' : 'unidades'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-[#555]">
                <span>Subtotal dos produtos:</span>
                <span className="font-mono font-semibold text-[#111]">{formatBRL(totals.cost)}</span>
              </div>
              <div className="flex items-center justify-between text-[#555]">
                <span>Total de frete:</span>
                <span className="font-mono font-semibold text-[#111]">{formatBRL(totals.freight)}</span>
              </div>
              <div className="flex items-center justify-between text-[#555]">
                <span>Outros custos adicionais:</span>
                <span className="font-mono font-semibold text-[#111]">{formatBRL(totals.other)}</span>
              </div>

              <div className="pt-3 border-t border-[#e6e6e6] flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-[#111] uppercase tracking-wider block">Valor Total</span>
                  <span className="text-[10px] text-[#888]">Custo global da compra</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#111111] font-sans block">
                    {formatBRL(totals.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Impactos no Sistema */}
            <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-2 text-[11px] text-[#475569]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                <span>Atualiza o estoque físico dos itens</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                <span>Recalcula o custo de aquisição</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                <span>Emite a Nota Interna para impressão</span>
              </div>
            </div>

            {/* Botão de Conclusão */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={saving || items.length === 0 || !supplierId}
                className="w-full h-12 bg-[#0071e3] hover:bg-[#0062c4] active:bg-[#004f9e] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando Compra...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar e Gerar Nota</span>
                    <span className="text-base font-normal">→</span>
                  </>
                )}
              </button>

              <Link
                href="/operacao"
                className="w-full h-10 border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-xs font-semibold text-[#64748b] hover:text-[#111111] rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                Voltar sem salvar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
