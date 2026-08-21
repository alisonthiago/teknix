'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { useNotification } from '@/contexts/NotificationContext'
import { Loader2, Check, Save } from 'lucide-react'

export default function EmpresaPage() {
  const { notify } = useNotification()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: 'TEKNIX LTDA',
    tradeName: 'TEKNIX',
    companyName: 'TEKNIX COMÉRCIO E SERVIÇOS LTDA',
    cnpj: '12.345.678/0001-90',
    email: 'contato@teknix.com',
    phone: '(11) 99999-0000',
    whatsapp: '(11) 98888-0000',
    website: 'www.teknix.com',
    address: 'Rua Augusta, 1000',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // Simulação / persistência no local storage ou Supabase
      await new Promise(resolve => setTimeout(resolve, 600))
      localStorage.setItem('teknix_company_settings', JSON.stringify(formData))
      notify({
        type: 'success',
        title: 'Dados Salvos!',
        message: 'As informações da empresa foram atualizadas com sucesso.'
      })
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro ao Salvar',
        message: err.message || 'Não foi possível salvar os dados.'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfigSubLayout title="Dados da empresa" description="Informações da empresa no TEKNIX">
      <ConfigSection title="Dados gerais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Nome da empresa', value: formData.name },
            { key: 'tradeName', label: 'Nome fantasia', value: formData.tradeName },
            { key: 'companyName', label: 'Razão social', value: formData.companyName },
            { key: 'cnpj', label: 'CNPJ', value: formData.cnpj, mono: true },
            { key: 'email', label: 'E-mail', value: formData.email },
            { key: 'phone', label: 'Telefone', value: formData.phone },
            { key: 'whatsapp', label: 'WhatsApp', value: formData.whatsapp },
            { key: 'website', label: 'Site', value: formData.website },
            { key: 'address', label: 'Endereço', value: formData.address },
            { key: 'city', label: 'Cidade', value: formData.city },
            { key: 'state', label: 'Estado', value: formData.state },
            { key: 'zipCode', label: 'CEP', value: formData.zipCode, mono: true },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-[11px] text-[#999] mb-1.5 font-medium">{field.label}</label>
              <input
                type="text"
                value={field.value}
                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                className={`w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] text-[#333] outline-none focus:border-[#111] transition-colors bg-white ${field.mono ? 'font-mono' : ''}`}
              />
            </div>
          ))}
        </div>
      </ConfigSection>
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#111] hover:bg-[#222] text-white text-[12px] font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin text-[#B5F500]" /> : <Save className="w-4 h-4 text-[#B5F500]" />}
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>
    </ConfigSubLayout>
  )
}
