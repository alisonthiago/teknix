'use client'

import { useState, useEffect, FormEvent } from 'react'
import { X, Plus, Trash2, Phone, MessageCircle, Mail, MapPin } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  supplierId?: string
  onSuccess?: () => void
}

export default function SupplierModal({ isOpen, onClose, supplierId, onSuccess }: SupplierModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    cnpj: '',
    contact: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: '',
    state: '',
    delivery_time: '0',
    min_order: '0',
    freight: '0',
    payment_terms: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen && supplierId) {
      setFetching(true)
      const fetchSupplier = async () => {
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('suppliers').select('*').eq('id', supplierId).single()
          if (error) throw error
          if (data) {
            setFormData({
              name: data.name || '',
              legal_name: data.legal_name || '',
              cnpj: data.cnpj || '',
              contact: data.contact || '',
              phone: data.phone || '',
              whatsapp: data.whatsapp || '',
              email: data.email || '',
              city: data.city || '',
              state: data.state || '',
              delivery_time: String(data.delivery_time || 0),
              min_order: String(data.min_order || 0),
              freight: String(data.freight || 0),
              payment_terms: data.payment_terms || '',
              notes: data.notes || ''
            })
          }
        } catch (error) {
          console.error('Error fetching supplier:', error)
        } finally {
          setFetching(false)
        }
      }
      fetchSupplier()
    } else {
      // Reset form
      setFormData({
        name: '', legal_name: '', cnpj: '', contact: '', phone: '', whatsapp: '', email: '',
        city: '', state: '', delivery_time: '0', min_order: '0', freight: '0', payment_terms: '', notes: ''
      })
    }
  }, [isOpen, supplierId])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const dataToSave = {
        name: formData.name,
        legal_name: formData.legal_name,
        cnpj: formData.cnpj,
        contact: formData.contact,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        city: formData.city,
        state: formData.state,
        delivery_time: parseInt(formData.delivery_time) || 0,
        min_order: parseFloat(formData.min_order) || 0,
        freight: parseFloat(formData.freight) || 0,
        payment_terms: formData.payment_terms,
        notes: formData.notes,
      }

      if (supplierId) {
        const { error } = await supabase.from('suppliers').update(dataToSave).eq('id', supplierId)
        if (error) throw error
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('suppliers').insert([{ ...dataToSave, user_id: user?.id }])
        if (error) throw error
      }

      if (onSuccess) onSuccess()
      router.refresh()
      onClose()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Erro ao salvar fornecedor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl w-full max-w-5xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e6e6]">
          <div>
            <h2 className="text-lg font-bold text-[#333]">{supplierId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
            <p className="text-xs text-[#999]">Preencha os dados e múltiplos contatos se necessário</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors">
            <X className="w-4 h-4 text-[#666]" />
          </button>
        </div>

        {fetching ? (
          <div className="p-12 text-center text-[#999]">Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Coluna 1: Dados Principais e Localização */}
                <div className="space-y-5">
                  <div className="bg-[#fcfcfc] border border-[#e6e6e6] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[#333] mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Dados Principais
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-[#666] mb-1">Nome Fantasia *</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="Nome Fantasia" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-[#666] mb-1">Razão Social</label>
                        <input value={formData.legal_name} onChange={e => setFormData({...formData, legal_name: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="Razão Social" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666] mb-1">CNPJ</label>
                        <input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="00.000.000/0000-00" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666] mb-1">Cidade</label>
                        <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="Sua Cidade" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fcfcfc] border border-[#e6e6e6] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[#333] mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Contatos Principais
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-[#666] mb-1">Nome do Contato</label>
                        <input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="Pessoa de contato" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666] mb-1">WhatsApp</label>
                        <div className="relative">
                          <MessageCircle className="absolute left-2.5 top-2.5 w-4 h-4 text-[#38a169]" />
                          <input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="(11) 90000-0000" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666] mb-1">Telefone Fixo</label>
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-[#3483fa]" />
                          <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="(11) 0000-0000" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-[#666] mb-1">E-mail</label>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2.5 w-4 h-4 text-[#999]" />
                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="contato@empresa.com" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Logística, Prazos e Observações */}
                <div className="space-y-5">
                  <div className="bg-[#fcfcfc] border border-[#e6e6e6] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[#333] mb-3">Prazos e Valores</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#666] mb-1">Dias de Entrega</label>
                        <input type="number" min="0" value={formData.delivery_time} onChange={e => setFormData({...formData, delivery_time: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="Ex: 5" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666] mb-1">Pedido Mínimo (R$)</label>
                        <input type="number" step="0.01" min="0" value={formData.min_order} onChange={e => setFormData({...formData, min_order: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="Ex: 1000.00" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666] mb-1">Custo Frete Fixo (R$)</label>
                        <input type="number" step="0.01" min="0" value={formData.freight} onChange={e => setFormData({...formData, freight: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="Ex: 50.00" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666] mb-1">Condições Pgto.</label>
                        <input value={formData.payment_terms} onChange={e => setFormData({...formData, payment_terms: e.target.value})} className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm" placeholder="Ex: 30/60/90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fcfcfc] border border-[#e6e6e6] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[#333] mb-3">Contatos Adicionais e Observações</h3>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-[#666] mb-1">Outros Contatos e Notas</label>
                      <textarea 
                        value={formData.notes} 
                        onChange={e => setFormData({...formData, notes: e.target.value})} 
                        className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm h-32 resize-none" 
                        placeholder="Adicione telefones e emails secundários aqui..." 
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="border-t border-[#e6e6e6] p-4 bg-[#fcfcfc] flex items-center justify-end gap-3 rounded-b-xl">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-[#e6e6e6] text-[#666] text-sm font-medium hover:bg-white transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-[#3483fa] text-white text-sm font-semibold hover:bg-[#2968c8] transition-colors disabled:opacity-50">
                {loading ? 'Salvando...' : (supplierId ? 'Salvar Alterações' : 'Criar Fornecedor')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
