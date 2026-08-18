'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ImageIcon, Star, Trash2, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SEGMENTOS = [
  'Eletrônicos',
  'Acessórios',
  'Capas',
  'Cabos',
  'Carregadores',
  'Ferramentas',
  'Periféricos',
  'Casa Inteligente',
  'Outros',
]

interface Supplier {
  id: string
  name: string
}

interface PhotoFile {
  file: File
  preview: string
  uploading: boolean
  url?: string
}

interface ProductCreateModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function generateSKU(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString()
  return `PROD-${digits}`
}

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const EMPTY_FORM = {
  name: '', sku: '', manufacturer_code: '', ean: '', brand: '', model: '',
  segment: '', category: '', description: '', supplier_id: '', supplier_code: '',
  cost_purchase: '', cost_freight: '', cost_packaging: '', cost_other: '',
  initial_stock: '', min_stock: '', max_stock: '', location: '',
  weight: '', height: '', width: '', length: '',
}

export default function ProductCreateModal({ open, onClose, onCreated }: ProductCreateModalProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevOpenRef = useRef(open)
  const tsRef = useRef(0)

  const [saving, setSaving] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (prevOpenRef.current && !open) {
      setForm(EMPTY_FORM)
      setPhotos([])
      setShowNewSupplier(false)
      setNewSupplierName('')
      tsRef.current = 0
    }
    if (!prevOpenRef.current && open) {
      tsRef.current = Date.now()
    }
    prevOpenRef.current = open
  }, [open])

  useEffect(() => {
    if (!open) return
    supabase
      .from('suppliers')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setSuppliers(data)
      })
  }, [open, supabase])

  const totalCost = [
    parseFloat(form.cost_purchase) || 0,
    parseFloat(form.cost_freight) || 0,
    parseFloat(form.cost_packaging) || 0,
    parseFloat(form.cost_other) || 0,
  ].reduce((a, b) => a + b, 0)

  const updateField = (field: string, value: string | null) => {
    setForm(prev => ({ ...prev, [field]: value ?? '' }))
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newPhotos: PhotoFile[] = []
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
      })
    })
    setPhotos(prev => [...prev, ...newPhotos])
  }, [setPhotos])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const setPrimaryPhoto = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev]
      const [item] = updated.splice(index, 1)
      updated.unshift(item)
      return updated
    })
  }

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return
    const { data, error } = await supabase
      .from('suppliers')
      .insert({ name: newSupplierName.trim() })
      .select('id, name')
      .single()
    if (!error && data) {
      setSuppliers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      updateField('supplier_id', data.id)
      setShowNewSupplier(false)
      setNewSupplierName('')
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    try {
      const sku = form.sku.trim() || generateSKU()

      const { data: product, error: prodError } = await supabase
        .from('products')
        .insert({
          name: form.name.trim(),
          sku,
          manufacturer_code: form.manufacturer_code.trim() || null,
          ean: form.ean.trim() || null,
          brand: form.brand.trim() || null,
          model: form.model.trim() || null,
          segment: form.segment || null,
          category: form.category.trim() || null,
          description: form.description.trim() || null,
          supplier_id: form.supplier_id || null,
          supplier_code: form.supplier_code.trim() || null,
          cost_purchase: parseFloat(form.cost_purchase) || 0,
          cost_freight: parseFloat(form.cost_freight) || 0,
          cost_packaging: parseFloat(form.cost_packaging) || 0,
          cost_other: parseFloat(form.cost_other) || 0,
          cost_real: totalCost,
          weight: parseFloat(form.weight) || null,
          height: parseFloat(form.height) || null,
          width: parseFloat(form.width) || null,
          length: parseFloat(form.length) || null,
          status: 'ACTIVE',
        })
        .select('id')
        .single()

      if (prodError || !product) throw prodError

      const productId = product.id

      if (photos.length > 0) {
        const imageInserts: { product_id: string; url: string; is_primary: boolean; sort_order: number }[] = []

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          const ext = photo.file.name.split('.').pop() || 'jpg'
          const filePath = `${productId}/${tsRef.current}-${i}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, photo.file)

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath)

            imageInserts.push({
              product_id: productId,
              url: urlData.publicUrl,
              is_primary: i === 0,
              sort_order: i,
            })
          }
        }

        if (imageInserts.length > 0) {
          await supabase.from('product_images').insert(imageInserts)
        }
      }

      const stockQty = parseInt(form.initial_stock) || 0
      if (stockQty > 0) {
        await supabase.from('inventory_movements').insert({
          product_id: productId,
          type: 'INITIAL_STOCK',
          quantity: stockQty,
          balance: stockQty,
          notes: 'Estoque inicial do cadastro',
        })
      }

      if (form.min_stock || form.max_stock || form.location) {
        await supabase.from('product_stock').upsert({
          product_id: productId,
          physical: stockQty,
          minimum: parseInt(form.min_stock) || 0,
          maximum: parseInt(form.max_stock) || 0,
          location: form.location.trim() || null,
        }, { onConflict: 'product_id' })
      }

      onCreated()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar produto:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="relative w-[calc(100%-24px)] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-[#e6e6e6] rounded-t-2xl">
          <h2 className="text-[16px] font-semibold text-[#333]">Novo Produto</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-[#999] hover:bg-[#f5f5f5] hover:text-[#333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* SECTION 1: IDENTIFICAÇÃO */}
          <section>
            <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide mb-4">Identificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-[11px] text-[#666] mb-1.5">Nome do produto *</Label>
                <Input
                  placeholder="Ex: Fone de Ouvido Bluetooth TWS Pro"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">SKU interno</Label>
                <Input
                  placeholder={generateSKU()}
                  value={form.sku}
                  onChange={e => updateField('sku', e.target.value)}
                  className="h-9 text-[13px] rounded-md font-mono"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Código de fábrica</Label>
                <Input
                  placeholder="Código do fabricante"
                  value={form.manufacturer_code}
                  onChange={e => updateField('manufacturer_code', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">EAN/GTIN</Label>
                <Input
                  placeholder="Código de barras"
                  value={form.ean}
                  onChange={e => updateField('ean', e.target.value)}
                  className="h-9 text-[13px] rounded-md font-mono"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Marca</Label>
                <Input
                  placeholder="Ex: Samsung, Apple"
                  value={form.brand}
                  onChange={e => updateField('brand', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Modelo</Label>
                <Input
                  placeholder="Ex: Galaxy Buds Pro"
                  value={form.model}
                  onChange={e => updateField('model', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Segmento</Label>
                <Select value={form.segment} onValueChange={v => updateField('segment', v)}>
                  <SelectTrigger className="h-9 text-[13px] rounded-md w-full border-[#e6e6e6]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTOS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Categoria</Label>
                <Input
                  placeholder="Ex: Áudio, Wearables"
                  value={form.category}
                  onChange={e => updateField('category', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[11px] text-[#666] mb-1.5">Descrição curta</Label>
                <Input
                  placeholder="Máximo 150 caracteres"
                  maxLength={150}
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
                <div className="text-[10px] text-[#999] mt-1 text-right">{form.description.length}/150</div>
              </div>
            </div>
          </section>

          <div className="border-t border-[#f0f0f0]" />

          {/* SECTION 2: FOTOS */}
          <section>
            <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide mb-4">Fotos</h3>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragActive ? 'border-[#3483fa] bg-[#f0f7ff]' : 'border-[#d0d0d0] hover:border-[#bbb] hover:bg-[#fafafa]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files?.length) handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              <ImageIcon className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
              <p className="text-[13px] text-[#666]">Arraste fotos ou clique para enviar</p>
              <p className="text-[11px] text-[#999] mt-1">JPG, PNG ou WebP. Máximo 5MB por arquivo.</p>
            </div>

            {photos.length > 0 && (
              <div className="flex gap-3 mt-4 flex-wrap">
                {photos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-[#e6e6e6] bg-[#f5f5f5]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {i !== 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); setPrimaryPhoto(i) }}
                          className="p-0.5 rounded-full bg-[#3483fa] text-white shadow-sm"
                          title="Definir como principal"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); removePhoto(i) }}
                        className="p-0.5 rounded-full bg-[#e74c3c] text-white shadow-sm"
                        title="Remover"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {i === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-[#3483fa]/90 text-white text-[9px] text-center py-0.5 font-medium">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="border-t border-[#f0f0f0]" />

          {/* SECTION 3: FORNECEDOR E CUSTO */}
          <section>
            <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide mb-4">Fornecedor e Custo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-[11px] text-[#666] mb-1.5">Fornecedor</Label>
                {showNewSupplier ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome do fornecedor"
                      value={newSupplierName}
                      onChange={e => setNewSupplierName(e.target.value)}
                      className="h-9 text-[13px] rounded-md flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleCreateSupplier()}
                    />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCreateSupplier}
                      className="h-9 px-3 text-[12px] rounded-md"
                    >
                      Criar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowNewSupplier(false); setNewSupplierName('') }}
                      className="h-9 px-3 text-[12px] rounded-md"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select value={form.supplier_id} onValueChange={v => updateField('supplier_id', v)}>
                      <SelectTrigger className="h-9 text-[13px] rounded-md flex-1 border-[#e6e6e6]">
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewSupplier(true)}
                      className="h-9 px-2.5 text-[12px] rounded-md border-dashed"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Novo
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Código do fornecedor</Label>
                <Input
                  placeholder="Código interno do fornecedor"
                  value={form.supplier_code}
                  onChange={e => updateField('supplier_code', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Custo de compra (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.cost_purchase}
                  onChange={e => updateField('cost_purchase', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Frete de compra (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.cost_freight}
                  onChange={e => updateField('cost_freight', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Custo de embalagem (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.cost_packaging}
                  onChange={e => updateField('cost_packaging', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Outros custos (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.cost_other}
                  onChange={e => updateField('cost_other', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div className="sm:col-span-2 bg-[#f9f9f9] border border-[#e6e6e6] rounded-md px-4 py-3 flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#666]">Custo real calculado</span>
                <span className="text-[14px] font-semibold text-[#333]">{formatBRL(totalCost)}</span>
              </div>
            </div>
          </section>

          <div className="border-t border-[#f0f0f0]" />

          {/* SECTION 4: ESTOQUE */}
          <section>
            <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide mb-4">Estoque</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Quantidade inicial *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.initial_stock}
                  onChange={e => updateField('initial_stock', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Estoque mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.min_stock}
                  onChange={e => updateField('min_stock', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Estoque máximo</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.max_stock}
                  onChange={e => updateField('max_stock', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Localização</Label>
                <Input
                  placeholder="Ex: Prateleira A3"
                  value={form.location}
                  onChange={e => updateField('location', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-[#f0f0f0]" />

          {/* SECTION 5: DADOS FÍSICOS */}
          <section>
            <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide mb-4">Dados Físicos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Peso (kg)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.weight}
                  onChange={e => updateField('weight', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Altura (cm)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.height}
                  onChange={e => updateField('height', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Largura (cm)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.width}
                  onChange={e => updateField('width', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Comprimento (cm)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.length}
                  onChange={e => updateField('length', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 bg-white border-t border-[#e6e6e6] rounded-b-2xl">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-11 min-h-[44px] w-full sm:w-auto px-4 text-[13px] rounded-md"
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="h-11 min-h-[44px] w-full sm:w-auto px-5 text-[13px] rounded-md"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
