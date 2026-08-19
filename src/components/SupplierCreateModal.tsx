'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageIcon } from 'lucide-react'

interface SupplierCreateModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const EMPTY_FORM = {
  name: '', legal_name: '', cnpj: '',
  contact: '', phone: '', whatsapp: '', email: '', website: '',
  city: '', state: '',
  delivery_time: '', min_order: '', freight: '', payment_terms: '', notes: ''
}

export default function SupplierCreateModal({ open, onClose, onCreated }: SupplierCreateModalProps) {
  const supabase = createClient()
  const prevOpenRef = useRef(open)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const { notify } = useNotification()

  useEffect(() => {
    if (prevOpenRef.current && !open) {
      setForm(EMPTY_FORM)
      setLogoFile(null)
      setLogoPreview(null)
    }
    prevOpenRef.current = open
  }, [open])

  const updateField = (field: string, value: string | null) => {
    setForm(prev => ({ ...prev, [field]: value ?? '' }))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.cnpj.trim() || !form.phone.trim()) {
      notify({ type: 'error', title: 'Erro', message: 'Preencha os campos obrigatórios: Nome, CNPJ e Telefone.' })
      return
    }
    setSaving(true)

    try {
      let logoUrl = null
      
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'png'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        
        const { error: uploadError } = await supabase.storage
          .from('supplier-logos')
          .upload(fileName, logoFile)
          
        if (!uploadError) {
          const { data } = supabase.storage.from('supplier-logos').getPublicUrl(fileName)
          logoUrl = data.publicUrl
        }
      }

      const { error } = await supabase.from('suppliers').insert({
        name: form.name.trim(),
        logo_url: logoUrl,
        legal_name: form.legal_name.trim() || null,
        cnpj: form.cnpj.trim() || null,
        contact: form.contact.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        delivery_time: form.delivery_time ? parseInt(form.delivery_time, 10) : null,
        min_order: form.min_order ? parseFloat(form.min_order) : null,
        freight: form.freight ? parseFloat(form.freight) : null,
        payment_terms: form.payment_terms.trim() || null,
        notes: form.notes.trim() || null,
      })

      if (error) throw error

      notify({
        type: 'success',
        title: 'Sucesso',
        message: 'Fornecedor cadastrado com sucesso!'
      })

      onCreated()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar fornecedor:', err)
      notify({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível salvar o fornecedor.'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="relative w-[calc(100%-24px)] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-[#e6e6e6] rounded-t-2xl shrink-0">
          <h2 className="text-[16px] font-semibold text-[#333]">Novo Fornecedor</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-[#999] hover:bg-[#f5f5f5] hover:text-[#333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* SECTION 1: IDENTIFICAÇÃO */}
            <section className="space-y-4">
              <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide border-b border-[#f0f0f0] pb-2">Identificação</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-full border border-dashed border-[#ccc] bg-[#fafafa] flex items-center justify-center overflow-hidden cursor-pointer hover:bg-[#f0f0f0] transition-colors shrink-0"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[#999]" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#333]">Logomarca</span>
                  <span className="text-[11px] text-[#999]">Opcional. Clique para enviar.</span>
                </div>
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setLogoFile(file)
                      setLogoPreview(URL.createObjectURL(file))
                    }
                  }}
                />
              </div>

              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Nome Fantasia *</Label>
                <Input
                  placeholder="Nome principal"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Razão Social</Label>
                <Input
                  placeholder="Nome completo da empresa"
                  value={form.legal_name}
                  onChange={e => updateField('legal_name', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">CNPJ *</Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={e => updateField('cnpj', e.target.value)}
                  className="h-9 text-[13px] rounded-md font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Cidade</Label>
                  <Input
                    placeholder="Ex: São Paulo"
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Estado (UF)</Label>
                  <Input
                    placeholder="Ex: SP"
                    maxLength={2}
                    value={form.state}
                    onChange={e => updateField('state', e.target.value)}
                    className="h-9 text-[13px] rounded-md uppercase"
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: CONTATO */}
            <section className="space-y-4">
              <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide border-b border-[#f0f0f0] pb-2">Contato</h3>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Pessoa de Contato</Label>
                <Input
                  placeholder="Nome do representante"
                  value={form.contact}
                  onChange={e => updateField('contact', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Email</Label>
                <Input
                  type="email"
                  placeholder="contato@empresa.com"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Telefone *</Label>
                  <Input
                    placeholder="(00) 0000-0000"
                    value={form.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">WhatsApp</Label>
                  <Input
                    placeholder="(00) 90000-0000"
                    value={form.whatsapp}
                    onChange={e => updateField('whatsapp', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Website</Label>
                <Input
                  placeholder="https://www.empresa.com.br"
                  value={form.website}
                  onChange={e => updateField('website', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
            </section>

            {/* SECTION 3: CONDIÇÕES COMERCIAIS */}
            <section className="space-y-4">
              <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide border-b border-[#f0f0f0] pb-2">Comercial</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Prazo Entrega (Dias)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 5"
                    value={form.delivery_time}
                    onChange={e => updateField('delivery_time', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Frete Padrão (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={form.freight}
                    onChange={e => updateField('freight', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Pedido Mínimo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.min_order}
                  onChange={e => updateField('min_order', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Termos de Pagamento</Label>
                <Input
                  placeholder="Ex: 30/60/90 dias, Boleto"
                  value={form.payment_terms}
                  onChange={e => updateField('payment_terms', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Observações Internas</Label>
                <Input
                  placeholder="Anotações sobre o fornecedor"
                  value={form.notes}
                  onChange={e => updateField('notes', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 bg-white border-t border-[#e6e6e6] rounded-b-2xl shrink-0">
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
            disabled={saving || !form.name.trim() || !form.cnpj.trim() || !form.phone.trim()}
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
