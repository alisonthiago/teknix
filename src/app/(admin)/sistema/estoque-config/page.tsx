'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection, Toggle } from '@/components/ConfigSubLayout'
import { useNotification } from '@/contexts/NotificationContext'
import { Loader2, Save } from 'lucide-react'

export default function EstoqueConfigPage() {
  const { notify } = useNotification()
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    min_alert: true, zero_alert: true, reservation: true, lot_control: false,
    ean_control: true, sku_control: true, min_stock: 10, max_stock: 500, unit: 'UN'
  })

  function toggle(key: keyof typeof prefs) { 
    setPrefs(p => ({ ...p, [key]: !p[key] })) 
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      localStorage.setItem('teknix_estoque_config', JSON.stringify(prefs))
      notify({
        type: 'success',
        title: 'Configurações Salvas!',
        message: 'Os parâmetros de estoque foram atualizados com sucesso.'
      })
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro ao Salvar',
        message: err.message || 'Falha ao salvar configurações de estoque.'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfigSubLayout title="Configurações de estoque" description="Parâmetros de controle de estoque">
      <ConfigSection title="Alertas">
        <Toggle label="Alerta de estoque baixo" description="Notificar quando atingir o estoque mínimo." enabled={prefs.min_alert} onChange={() => toggle('min_alert')} />
        <Toggle label="Alerta de estoque zerado" description="Notificar quando ficar sem estoque." enabled={prefs.zero_alert} onChange={() => toggle('zero_alert')} />
      </ConfigSection>
      <ConfigSection title="Controle">
        <Toggle label="Reserva de estoque" description="Reservar estoque ao receber pedido." enabled={prefs.reservation} onChange={() => toggle('reservation')} />
        <Toggle label="Controle por lote" description="Controle de estoque por lote quando necessário." enabled={prefs.lot_control} onChange={() => toggle('lot_control')} />
        <Toggle label="Controle por EAN/GTIN" description="Validar EAN nas movimentações." enabled={prefs.ean_control} onChange={() => toggle('ean_control')} />
        <Toggle label="Controle por SKU" description="Identificação por SKU obrigatória." enabled={prefs.sku_control} onChange={() => toggle('sku_control')} />
      </ConfigSection>
      <ConfigSection title="Limites padrão">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Estoque mínimo padrão</label>
            <input 
              type="number" 
              value={prefs.min_stock} 
              onChange={e => setPrefs({ ...prefs, min_stock: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Estoque máximo padrão</label>
            <input 
              type="number" 
              value={prefs.max_stock} 
              onChange={e => setPrefs({ ...prefs, max_stock: +e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1 font-medium">Unidade de medida</label>
            <select 
              value={prefs.unit}
              onChange={e => setPrefs({ ...prefs, unit: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl text-[13px] outline-none focus:border-[#111] bg-white"
            >
              <option value="UN">Unidade (UN)</option>
              <option value="KG">Kilograma (KG)</option>
              <option value="M">Metro (M)</option>
            </select>
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
