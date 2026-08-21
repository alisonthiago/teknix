'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { useNotification } from '@/contexts/NotificationContext'
import { Loader2, Save } from 'lucide-react'

export default function PrecificacaoConfigPage() {
  const { notify } = useNotification()
  const [saving, setSaving] = useState(false)
  const [params, setParams] = useState({
    min_margin: 15,
    target_margin: 25,
    markup: 1.3,
    avg_freight: 10,
    packaging: 2,
    marketplace_fee: 16,
    icms: 18,
    pis: 1.65,
    cofins: 7.6,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      localStorage.setItem('teknix_pricing_config', JSON.stringify(params))
      notify({
        type: 'success',
        title: 'Parâmetros Salvos!',
        message: 'Configurações de precificação e margens salvas com sucesso.'
      })
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro ao Salvar',
        message: err.message || 'Falha ao salvar configurações de precificação.'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfigSubLayout title="Precificação" description="Configure margem, markup, custos e simulador">
      <ConfigSection title="Margem">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Margem mínima (%)</label>
            <input 
              type="number" 
              value={params.min_margin} 
              onChange={e => setParams({ ...params, min_margin: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Margem desejada (%)</label>
            <input 
              type="number" 
              value={params.target_margin} 
              onChange={e => setParams({ ...params, target_margin: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Markup padrão</label>
            <input 
              type="number" 
              value={params.markup} 
              step="0.1" 
              onChange={e => setParams({ ...params, markup: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
        </div>
      </ConfigSection>
      <ConfigSection title="Custos padrão">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Frete médio (R$)</label>
            <input 
              type="number" 
              value={params.avg_freight} 
              onChange={e => setParams({ ...params, avg_freight: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Embalagem (R$)</label>
            <input 
              type="number" 
              value={params.packaging} 
              onChange={e => setParams({ ...params, packaging: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Taxa marketplace (%)</label>
            <input 
              type="number" 
              value={params.marketplace_fee} 
              onChange={e => setParams({ ...params, marketplace_fee: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
        </div>
      </ConfigSection>
      <ConfigSection title="Impostos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">ICMS (%)</label>
            <input 
              type="number" 
              value={params.icms} 
              onChange={e => setParams({ ...params, icms: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">PIS (%)</label>
            <input 
              type="number" 
              value={params.pis} 
              onChange={e => setParams({ ...params, pis: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">COFINS (%)</label>
            <input 
              type="number" 
              value={params.cofins} 
              onChange={e => setParams({ ...params, cofins: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
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
