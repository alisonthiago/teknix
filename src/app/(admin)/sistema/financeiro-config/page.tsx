'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { useNotification } from '@/contexts/NotificationContext'
import { Loader2, Save } from 'lucide-react'

export default function FinanceiroConfigPage() {
  const { notify } = useNotification()
  const [saving, setSaving] = useState(false)
  const [currency, setCurrency] = useState('BRL')
  const [format, setFormat] = useState('pt-BR')

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      localStorage.setItem('teknix_financial_config', JSON.stringify({ currency, format }))
      notify({
        type: 'success',
        title: 'Configurações Salvas!',
        message: 'Preferências financeiras e de moeda atualizadas com sucesso.'
      })
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro ao Salvar',
        message: err.message || 'Falha ao salvar configurações financeiras.'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfigSubLayout title="Configurações financeiras" description="Moeda, impostos, categorias e contas">
      <ConfigSection title="Geral">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5 font-medium">Moeda Padrão</label>
            <select 
              value={currency} 
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#16a34a] bg-white"
            >
              <option value="BRL">R$ Real Brasileiro (BRL)</option>
              <option value="USD">$ Dólar Americano (USD)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5 font-medium">Formato de Valores</label>
            <select 
              value={format} 
              onChange={e => setFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#16a34a] bg-white"
            >
              <option value="pt-BR">1.234,56 (Padrão Brasil)</option>
              <option value="en-US">1,234.56 (Padrão Internacional)</option>
            </select>
          </div>
        </div>
      </ConfigSection>
      <ConfigSection title="Categorias financeiras">
        <div className="space-y-2">
          {['Receita de vendas', 'Custo de produtos', 'Frete', 'Taxas marketplace', 'Impostos', 'Embalagem', 'Outros custos'].map(c => (
            <div key={c} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
              <span className="text-[12px] text-[#333]">{c}</span>
              <span className="text-[10px] text-[#16a34a] font-bold bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#bbf7d0]">Ativa</span>
            </div>
          ))}
        </div>
      </ConfigSection>
      <ConfigSection title="Formas de pagamento">
        <div className="space-y-2">
          {['PIX', 'Cartão de Crédito', 'Boleto', 'Transferência', 'Dinheiro'].map(p => (
            <div key={p} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
              <span className="text-[12px] text-[#333]">{p}</span>
              <span className="text-[10px] text-[#16a34a] font-bold bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#bbf7d0]">Ativa</span>
            </div>
          ))}
        </div>
      </ConfigSection>
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-[12px] font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>
    </ConfigSubLayout>
  )
}
