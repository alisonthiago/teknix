'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, Plus, MessageCircle, Phone } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Contact {
  id: string
  name: string | null
  phone: string
  is_whatsapp: boolean
}

export default function SupplierContactsEditor({ supplierId }: { supplierId: string }) {
  const supabase = createClient()
  const { notify } = useNotification()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newIsWhatsapp, setNewIsWhatsapp] = useState(true)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('supplier_contacts')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setContacts(data as Contact[])
    }
    setLoading(false)
  }, [supplierId, supabase])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleAdd = async () => {
    if (!newPhone.trim()) return
    setAdding(true)
    try {
      const { error } = await supabase
        .from('supplier_contacts')
        .insert({
          supplier_id: supplierId,
          name: newName.trim() || null,
          phone: newPhone.trim(),
          is_whatsapp: newIsWhatsapp,
        })

      if (error) throw error

      notify({ type: 'success', title: 'Sucesso', message: 'Contato adicionado.' })
      setNewName('')
      setNewPhone('')
      setNewIsWhatsapp(true)
      fetchContacts()
    } catch (err) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: 'Falha ao adicionar contato.' })
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('supplier_contacts').delete().eq('id', id)
      notify({ type: 'success', title: 'Sucesso', message: 'Contato removido.' })
      fetchContacts()
    } catch (err) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: 'Não foi possível remover.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-[#fcfcfc] border border-[#e6e6e6] rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <Label className="text-[11px] text-[#666] mb-1.5">Nome (Opcional)</Label>
          <Input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Ex: Vendas" className="h-9 text-[13px]" />
        </div>
        <div className="flex-1 w-full">
          <Label className="text-[11px] text-[#666] mb-1.5">Telefone / WhatsApp *</Label>
          <Input value={newPhone} onChange={e=>setNewPhone(e.target.value)} placeholder="(00) 00000-0000" className="h-9 text-[13px]" />
        </div>
        <div className="flex items-center pb-2 px-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newIsWhatsapp} onChange={e=>setNewIsWhatsapp(e.target.checked)} className="w-4 h-4 rounded text-[#1f2328]" />
            <span className="text-[12px] text-[#555] font-medium">WhatsApp</span>
          </label>
        </div>
        <Button onClick={handleAdd} disabled={adding || !newPhone.trim()} className="h-9 w-full sm:w-auto">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
          Adicionar
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#999]" />
        </div>
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 border border-[#f0f0f0] rounded-md bg-white hover:border-[#e0e0e0] transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.is_whatsapp ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                  {c.is_whatsapp ? <MessageCircle className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#333]">{c.phone}</div>
                  {c.name && <div className="text-[11px] text-[#666]">{c.name}</div>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-[#999] hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                title="Remover Contato"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-[#999] text-center py-4 border border-dashed border-[#e6e6e6] rounded-lg">
          Nenhum contato cadastrado. Adicione acima.
        </p>
      )}
    </div>
  )
}
