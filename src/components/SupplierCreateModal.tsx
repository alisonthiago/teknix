'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
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
  email: '', website: '',
  city: '', state: '',
  distributor_city: '', distributor_state: '', pickup_address: '',
  delivery_time: '', min_order: '', freight: '', payment_terms: '', pix_key: '', notes: ''
}

const INITIAL_CONTACTS = [
  { name: '', phone: '', is_whatsapp: true },
  { name: '', phone: '', is_whatsapp: true }
]

export default function SupplierCreateModal({ open, onClose, onCreated }: SupplierCreateModalProps) {
  const supabase = createClient()
  const prevOpenRef = useRef(open)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [contacts, setContacts] = useState(INITIAL_CONTACTS)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const { notify } = useNotification()

  useEffect(() => {
    if (prevOpenRef.current && !open) {
      setForm(EMPTY_FORM)
      setContacts(INITIAL_CONTACTS)
      setLogoFile(null)
      setLogoPreview(null)
    }
    prevOpenRef.current = open
  }, [open])

  const updateField = (field: string, value: string | null) => {
    setForm(prev => ({ ...prev, [field]: value ?? '' }))
  }

  const handleCnpjBlur = async () => {
    const cleanCnpj = form.cnpj.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) return

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
      if (!response.ok) return
      
      const data = await response.json()
      
      setForm(prev => ({
        ...prev,
        legal_name: prev.legal_name || data.razao_social || '',
        name: prev.name || data.nome_fantasia || data.razao_social || '',
        city: prev.city || data.municipio || '',
        state: prev.state || data.uf || ''
      }))
      
      if (data.ddd_telefone_1) {
        setContacts(prev => {
          const newContacts = [...prev]
          if (!newContacts[0].phone) {
            newContacts[0].phone = data.ddd_telefone_1
          }
          return newContacts
        })
      }
      
      notify({
        type: 'success',
        title: 'CNPJ Encontrado',
        message: 'Dados da Receita Federal preenchidos automaticamente.'
      })
    } catch (err) {
      console.error('Erro ao buscar CNPJ:', err)
    }
  }

  const handleSave = async () => {
    const hasValidPhone = contacts.some(c => c.phone.trim())
    if (!form.name.trim() || !form.cnpj.trim() || !hasValidPhone) {
      notify({ type: 'error', title: 'Erro', message: 'Preencha os campos obrigatórios: Nome, CNPJ e pelo menos um Número de Contato.' })
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

      const { data: insertedSupplier, error } = await supabase.from('suppliers').insert({
        name: form.name,
        legal_name: form.legal_name || null,
        cnpj: form.cnpj,
        email: form.email || null,
        website: form.website || null,
        city: form.city || null,
        state: form.state || null,
        distributor_city: form.distributor_city || null,
        distributor_state: form.distributor_state || null,
        pickup_address: form.pickup_address || null,
        delivery_time: form.delivery_time ? parseInt(form.delivery_time) : null,
        min_order: form.min_order ? parseFloat(form.min_order) : null,
        freight: form.freight ? parseFloat(form.freight) : null,
        payment_terms: form.payment_terms || null,
        pix_key: form.pix_key || null,
        notes: form.notes || null,
        logo_url: logoUrl
      }).select('id').single()

      if (error) throw error

      const supplierId = insertedSupplier.id

      // Insert contacts
      const validContacts = contacts.filter(c => c.phone.trim()).map(c => ({
        supplier_id: supplierId,
        name: c.name.trim() || null,
        phone: c.phone.trim(),
        is_whatsapp: c.is_whatsapp
      }))

      if (validContacts.length > 0) {
        const { error: contactsError } = await supabase.from('supplier_contacts').insert(validContacts)
        if (contactsError) throw contactsError
      }

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
      <div className="relative w-[calc(100%-24px)] sm:w-full sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl flex flex-col">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
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
                  onBlur={handleCnpjBlur}
                  className="h-9 text-[13px] rounded-md font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Cidade (Receita)</Label>
                  <Input
                    placeholder="Sua cidade"
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Estado (UF)</Label>
                  <Input
                    placeholder="SC"
                    value={form.state}
                    onChange={e => updateField('state', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
              </div>
            </section>
            
            {/* SECTION: LOCALIZAÇÃO & LOGÍSTICA */}
            <section className="space-y-4">
              <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide border-b border-[#f0f0f0] pb-2">Localização & Logística</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Cidade (Distribuidor)</Label>
                  <Input
                    placeholder="Ex: São Paulo"
                    value={form.distributor_city}
                    onChange={e => updateField('distributor_city', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Estado (Distribuidor)</Label>
                  <Input
                    placeholder="Ex: SP"
                    value={form.distributor_state}
                    onChange={e => updateField('distributor_state', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1.5">Endereço de Retirada / Coleta</Label>
                <Input
                  placeholder="Ex: Rua das Flores, 123 - Galpão 2"
                  value={form.pickup_address}
                  onChange={e => updateField('pickup_address', e.target.value)}
                  className="h-9 text-[13px] rounded-md"
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* SECTION: CONTATOS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2">
                <h3 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide">Contatos</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setContacts(prev => [...prev, { name: '', phone: '', is_whatsapp: true }])}
                  className="h-7 text-[11px] px-2 text-[#3483fa] hover:text-[#2968c8] hover:bg-[#eff4fe]"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Contato
                </Button>
              </div>

              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-[#fbfbfb] border border-[#f0f0f0] rounded-md relative group">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[11px] text-[#666]">Nome (Opcional)</Label>
                      <Input
                        placeholder="Ex: Comercial, Bruno..."
                        value={contact.name}
                        onChange={e => {
                          const newContacts = [...contacts]
                          newContacts[index].name = e.target.value
                          setContacts(newContacts)
                        }}
                        className="h-8 text-[12px] rounded-md"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[11px] text-[#666]">Telefone / WhatsApp *</Label>
                      <Input
                        placeholder="(00) 00000-0000"
                        value={contact.phone}
                        onChange={e => {
                          const newContacts = [...contacts]
                          newContacts[index].phone = e.target.value
                          setContacts(newContacts)
                        }}
                        className="h-8 text-[12px] rounded-md"
                      />
                    </div>
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contact.is_whatsapp}
                          onChange={e => {
                            const newContacts = [...contacts]
                            newContacts[index].is_whatsapp = e.target.checked
                            setContacts(newContacts)
                          }}
                          className="w-4 h-4 rounded text-[#3483fa] border-[#ccc] focus:ring-[#3483fa]"
                        />
                        <span className="text-[12px] text-[#555] font-medium">É WhatsApp?</span>
                      </label>
                    </div>
                    
                    {contacts.length > 1 && (
                      <button
                        onClick={() => {
                          const newContacts = [...contacts]
                          newContacts.splice(index, 1)
                          setContacts(newContacts)
                        }}
                        className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-[#e0e0e0] rounded-full flex items-center justify-center text-[#999] hover:text-red-500 hover:border-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="text-[11px] text-[#666] mb-1.5">Email Geral</Label>
                  <Input
                    type="email"
                    placeholder="contato@empresa.com"
                    value={form.email}
                    onChange={e => updateField('email', e.target.value)}
                    className="h-9 text-[13px] rounded-md"
                  />
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
              <div className="grid grid-cols-2 gap-4">
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
                  <Label className="text-[11px] text-[#666] mb-1.5">Chave PIX (Pagamento)</Label>
                  <Input
                    placeholder="Ex: CNPJ, Email ou Celular"
                    value={form.pix_key}
                    onChange={e => updateField('pix_key', e.target.value)}
                    className="h-9 text-[13px] rounded-md text-[#38a169]"
                  />
                </div>
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
            disabled={saving || !form.name.trim() || !form.cnpj.trim() || !contacts.some(c => c.phone.trim())}
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
