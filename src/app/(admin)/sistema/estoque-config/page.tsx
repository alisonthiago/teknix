'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection, Toggle } from '@/components/ConfigSubLayout'

export default function EstoqueConfigPage() {
  const [prefs, setPrefs] = useState({
    min_alert: true, zero_alert: true, reservation: true, lot_control: false,
    ean_control: true, sku_control: true,
  })
  function toggle(key: keyof typeof prefs) { setPrefs(p => ({ ...p, [key]: !p[key] })) }

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
          <div><label className="block text-[11px] text-[#999] mb-1">Estoque mínimo padrão</label><input type="number" defaultValue="10" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
          <div><label className="block text-[11px] text-[#999] mb-1">Estoque máximo padrão</label><input type="number" defaultValue="500" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
          <div><label className="block text-[11px] text-[#999] mb-1">Unidade de medida</label>
            <select className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa] bg-white"><option>Unidade (UN)</option><option>Kilograma (KG)</option><option>Metro (M)</option></select>
          </div>
        </div>
      </ConfigSection>
      <div className="flex justify-end"><button className="px-4 py-2 bg-[#3483fa] text-white text-[12px] font-medium rounded-md hover:bg-[#2968c8]">Salvar</button></div>
    </ConfigSubLayout>
  )
}
