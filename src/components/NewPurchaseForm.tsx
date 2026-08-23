'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { createPurchase } from '@/app/(admin)/purchases/actions'
import { useNotification } from '@/contexts/NotificationContext'

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  supplier_id: string | null
}

interface PurchaseItem {
  id: string // temp id
  product_id: string
  quantity: number
  unit_cost: number
  freight: number
  other_costs: number
}

interface NewPurchaseFormProps {
  suppliers: Supplier[]
  products: Product[]
}

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function NewPurchaseForm({ suppliers, products }: NewPurchaseFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultSupplier = searchParams.get('supplier') || ''
  const defaultProduct = searchParams.get('product') || ''
  const { notify } = useNotification()

  const initialProduct = defaultProduct ? products.find(p => p.id === defaultProduct) : null
  const initialSupplierId = initialProduct?.supplier_id || defaultSupplier

  const [supplierId, setSupplierId] = useState(initialSupplierId)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [invoice, setInvoice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  
  const [items, setItems] = useState<PurchaseItem[]>(() => initialProduct ? [{
    id: 'item-init-1',
    product_id: initialProduct.id,
    quantity: 1,
    unit_cost: 0,
    freight: 0,
    other_costs: 0
  }] : [])
  const [saving, setSaving] = useState(false)

  // Filter products by the selected supplier
  const availableProducts = useMemo(() => {
    if (!supplierId) return []
    return products.filter(p => p.supplier_id === supplierId)
  }, [products, supplierId])

  const handleAddItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).slice(2),
      product_id: '',
      quantity: 1,
      unit_cost: 0,
      freight: 0,
      other_costs: 0
    }])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const totals = useMemo(() => {
    let cost = 0
    let freight = 0
    let other = 0
    items.forEach(item => {
      cost += (item.unit_cost * item.quantity)
      freight += item.freight
      other += item.other_costs
    })
    return {
      cost,
      freight,
      other,
      total: cost + freight + other
    }
  }, [items])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      notify({ type: 'error', title: 'Erro', message: 'Selecione um fornecedor.' })
      return
    }
    if (items.length === 0) {
      notify({ type: 'error', title: 'Erro', message: 'Adicione pelo menos um produto.' })
      return
    }
    if (items.some(i => !i.product_id)) {
      notify({ type: 'error', title: 'Erro', message: 'Todos os itens precisam ter um produto selecionado.' })
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
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          freight: i.freight,
          other_costs: i.other_costs
        }))
      }

      const purchaseId = await createPurchase(payload)
      notify({ type: 'success', title: 'Sucesso', message: 'Compra registrada com sucesso!' })
      // Redirect to the internal nota page
      router.push(`/purchases/${purchaseId}/nota`)
    } catch (err: any) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: err.message || 'Erro ao salvar compra.' })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mp-stack">
      <Card>
        <CardHeader>
          <CardTitle>Dados Gerais da Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">Fornecedor *</Label>
              <select 
                id="supplier_id" 
                value={supplierId}
                onChange={e => {
                  setSupplierId(e.target.value)
                  setItems([]) // clear items on supplier change
                }}
                required
                className="flex h-9 w-full items-center justify-between rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-[#3483fa]"
              >
                <option value="">Selecione um fornecedor</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data da Compra *</Label>
              <Input id="date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice">Nota Fiscal</Label>
              <Input id="invoice" placeholder="Número da NF" value={invoice} onChange={e => setInvoice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Input id="payment_method" placeholder="Boleto, Pix, etc." value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Produtos Comprados</CardTitle>
            <CardDescription>
              {supplierId 
                ? 'Selecione os produtos disponíveis para este fornecedor.' 
                : 'Selecione um fornecedor primeiro para ver os produtos.'}
            </CardDescription>
          </div>
          {supplierId && (
            <Button type="button" onClick={handleAddItem} variant="outline" className="text-[12px] h-8">
              <Plus className="w-4 h-4 mr-1.5" /> Adicionar Produto
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!supplierId && (
            <div className="text-center py-8 text-[#999] text-sm bg-[#fafafa] rounded-md border border-dashed border-[#e6e6e6]">
              Por favor, selecione um fornecedor acima.
            </div>
          )}

          {supplierId && items.length === 0 && (
            <div className="text-center py-8 text-[#999] text-sm bg-[#fafafa] rounded-md border border-dashed border-[#e6e6e6]">
              Nenhum produto adicionado à compra ainda.
            </div>
          )}

          {items.map((item, index) => (
            <div key={item.id} className="p-4 rounded-lg border border-[#e6e6e6] bg-[#fafafa] relative group">
              <button 
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="absolute right-2 top-2 w-6 h-6 flex items-center justify-center rounded-full text-[#999] hover:bg-white hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                title="Remover Item"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-[11px] text-[#666]">Produto *</Label>
                  <select 
                    value={item.product_id}
                    onChange={e => updateItem(item.id, 'product_id', e.target.value)}
                    required
                    className="flex h-8 w-full items-center justify-between rounded-md border border-[#e6e6e6] bg-white px-2 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#3483fa]"
                  >
                    <option value="">Selecione...</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[11px] text-[#666]">Qtd *</Label>
                  <Input 
                    type="number" min="1" required 
                    value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="h-8 text-[12px]" 
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[11px] text-[#666]">Custo Unit. (R$) *</Label>
                  <Input 
                    type="number" step="0.01" min="0" required 
                    value={item.unit_cost} onChange={e => updateItem(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                    className="h-8 text-[12px]" 
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[11px] text-[#666]">Frete (R$)</Label>
                  <Input 
                    type="number" step="0.01" min="0" 
                    value={item.freight} onChange={e => updateItem(item.id, 'freight', parseFloat(e.target.value) || 0)}
                    className="h-8 text-[12px]" 
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[11px] text-[#666]">Outros Custos</Label>
                  <Input 
                    type="number" step="0.01" min="0" 
                    value={item.other_costs} onChange={e => updateItem(item.id, 'other_costs', parseFloat(e.target.value) || 0)}
                    className="h-8 text-[12px]" 
                  />
                </div>
              </div>
            </div>
          ))}

          {items.length > 0 && (
            <div className="flex flex-col items-end pt-4 border-t border-[#e6e6e6]">
              <div className="w-full sm:w-64 space-y-2 mb-4 text-[13px]">
                <div className="flex justify-between text-[#666]">
                  <span>Subtotal:</span>
                  <span>{formatBRL(totals.cost)}</span>
                </div>
                <div className="flex justify-between text-[#666]">
                  <span>Total Frete:</span>
                  <span>{formatBRL(totals.freight)}</span>
                </div>
                <div className="flex justify-between text-[#666]">
                  <span>Outros Custos:</span>
                  <span>{formatBRL(totals.other)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#333] pt-2 border-t border-[#f0f0f0] text-[15px]">
                  <span>Valor Total:</span>
                  <span>{formatBRL(totals.total)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Label htmlFor="notes">Observações Gerais</Label>
            <Input id="notes" placeholder="Informações adicionais para a nota interna" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="pt-6 flex justify-end">
            <Button type="submit" disabled={saving} className="bg-[#3483fa] hover:bg-[#2968c8]">
              {saving ? 'Registrando...' : 'Salvar Compra e Gerar Nota'} <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
