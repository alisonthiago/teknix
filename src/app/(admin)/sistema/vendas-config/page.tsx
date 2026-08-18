'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection, Toggle } from '@/components/ConfigSubLayout'

export default function VendasConfigPage() {
  const [prefs, setPrefs] = useState({ auto_stock: true, auto_cancel: false, return_control: true })
  function toggle(key: keyof typeof prefs) { setPrefs(p => ({ ...p, [key]: !p[key] })) }

  return (
    <ConfigSubLayout title="Configurações de vendas" description="Parâmetros de vendas e pedidos">
      <ConfigSection title="Automação">
        <Toggle label="Baixa automática de estoque" description="Dar baixa no estoque ao confirmar pagamento." enabled={prefs.auto_stock} onChange={() => toggle('auto_stock')} />
        <Toggle label="Cancelamento automático" description="Cancelar pedido após prazo sem pagamento." enabled={prefs.auto_cancel} onChange={() => toggle('auto_cancel')} />
        <Toggle label="Controle de devoluções" description="Registrar e controlar devoluções." enabled={prefs.return_control} onChange={() => toggle('return_control')} />
      </ConfigSection>
      <ConfigSection title="Status de pedidos">
        <div className="space-y-2">
          {['Novo', 'Pago', 'Aguardando Separação', 'Em Separação', 'Separado', 'Embalado', 'Enviado', 'Entregue', 'Cancelado'].map(s => (
            <div key={s} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
              <span className="text-[12px] text-[#333]">{s}</span>
              <span className="text-[10px] text-[#38a169] font-medium">Ativo</span>
            </div>
          ))}
        </div>
      </ConfigSection>
      <div className="flex justify-end"><button className="px-4 py-2 bg-[#3483fa] text-white text-[12px] font-medium rounded-md hover:bg-[#2968c8]">Salvar</button></div>
    </ConfigSubLayout>
  )
}
