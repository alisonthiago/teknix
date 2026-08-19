'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Calendar } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'
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

interface Supplier {
  id: string
  name: string
}

interface Profile {
  id: string
  name: string
}

interface PurchaseCreateModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const EMPTY_FORM = {
  supplier_id: '',
  buyer_id: '',
  date: new Date().toISOString().split('T')[0],
  invoice: '',
  total_cost: '',
  payment_method: '',
  notes: ''
}

export default function PurchaseCreateModal({ open, onClose, onCreated }: PurchaseCreateModalProps) {
  const supabase = createClient()
  const { notify } = useNotification()
  const prevOpenRef = useRef(open)

  const [saving, setSaving] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (prevOpenRef.current && !open) {
      setForm(EMPTY_FORM)
    }
    prevOpenRef.current = open
  }, [open])

  useEffect(() => {
    if (!open) return
    
    // Fetch suppliers
    supabase
      .from('suppliers')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setSuppliers(data)
      })

    // Fetch profiles for "Quem comprou"
    supabase
      .from('profiles')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setProfiles(data)
      })
      
    // Set default buyer to logged-in user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setForm(prev => ({ ...prev, buyer_id: user.id }))
      }
    })
  }, [open, supabase])

  const updateField = (field: string, value: string | null) => {
    setForm(prev => ({ ...prev, [field]: value ?? '' }))
  }

  const handleSave = async () => {
    if (!form.supplier_id || !form.buyer_id || !form.date) return
    setSaving(true)

    try {
      const selectedBuyer = profiles.find(p => p.id === form.buyer_id)
      const { error } = await supabase.from('purchases').insert({
        supplier_id: form.supplier_id,
        buyer_id: form.buyer_id,
        buyer_name: selectedBuyer?.name || null,
        date: form.date,
        invoice: form.invoice.trim() || null,
        total_cost: parseFloat(form.total_cost) || 0,
        payment_method: form.payment_method.trim() || null,
        notes: form.notes.trim() || null,
      })

      if (error) throw error

      notify({
        type: 'success',
        title: 'Sucesso',
        message: 'Compra registrada com sucesso!'
      })

      onCreated()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar compra:', err)
      notify({
        type: 'error',
        title: 'Erro',
        message: err instanceof Error ? err.message : (err as any)?.message || 'Não foi possível registrar a compra.'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="relative w-[calc(100%-24px)] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-[#e6e6e6] rounded-t-2xl">
          <h2 className="text-[16px] font-semibold text-[#333]">Nova Compra</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-[#999] hover:bg-[#f5f5f5] hover:text-[#333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          
          {/* COLUNA ESQUERDA */}
          <div className="space-y-8">
            <section>
              <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3483fa]"></span>
                Dados Principais
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Fornecedor *</Label>
                  <Select value={form.supplier_id} onValueChange={v => updateField('supplier_id', v)} disabled={suppliers.length === 0}>
                    <SelectTrigger className="h-9 text-[13px] rounded-md w-full border-[#e6e6e6]">
                      <SelectValue placeholder={suppliers.length === 0 ? "Carregando fornecedores..." : "Selecione um fornecedor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Quem Comprou (Comprador) *</Label>
                  <Select value={form.buyer_id} onValueChange={v => updateField('buyer_id', v)} disabled={profiles.length === 0}>
                    <SelectTrigger className="h-9 text-[13px] rounded-md w-full border-[#e6e6e6]">
                      <SelectValue placeholder={profiles.length === 0 ? "Carregando compradores..." : "Selecione um comprador"} />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Data da Compra *</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={form.date}
                      onChange={e => updateField('date', e.target.value)}
                      className="h-9 text-[13px] rounded-md pl-9"
                    />
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-[#999]" />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Nota Fiscal / Pedido</Label>
                  <Input
                    placeholder="Número do documento"
                    value={form.invoice}
                    onChange={e => updateField('invoice', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* COLUNA DIREITA */}
          <div className="space-y-8">
            <section>
              <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a650]"></span>
                Financeiro
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Valor Total da Compra (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={form.total_cost}
                    onChange={e => updateField('total_cost', e.target.value)}
                    className="h-9 text-[13px] rounded-md text-lg font-semibold text-[#00a650]"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Forma de Pagamento</Label>
                  <Select value={form.payment_method} onValueChange={v => updateField('payment_method', v)}>
                    <SelectTrigger className="h-9 text-[13px] rounded-md w-full border-[#e6e6e6]">
                      <SelectValue placeholder="Ex: PIX, Boleto, Cartão..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Observações</Label>
                  <Input
                    placeholder="Anotações sobre a compra..."
                    value={form.notes}
                    onChange={e => updateField('notes', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
              </div>
            </section>
          </div>
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
            disabled={saving || !form.supplier_id || !form.buyer_id || !form.date}
            className="h-11 min-h-[44px] w-full sm:w-auto px-5 text-[13px] rounded-md bg-[#00a650] hover:bg-[#008a42]"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Registrando...
              </>
            ) : (
              'Registrar Compra'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
