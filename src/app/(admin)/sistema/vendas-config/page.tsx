'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection, Toggle } from '@/components/ConfigSubLayout'
import { useNotification } from '@/contexts/NotificationContext'
import { Loader2, Save } from 'lucide-react'

export default function VendasConfigPage() {
  const { notify } = useNotification()
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({ auto_stock: true, auto_cancel: false, return_control: true })

  function toggle(key: keyof typeof prefs) { 
    setPrefs(p => ({ ...p, [key]: !p[key] })) 
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      localStorage.setItem('teknix_vendas_config', JSON.stringify(prefs))
      notify({
        type: 'success',
        title: 'Configurações Salvas!',
        message: 'Regras de automação de vendas e pedidos atualizadas com sucesso.'
      })
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro ao Salvar',
        message: err.message || 'Falha ao salvar configurações de vendas.'
      })
    } finally {
      setSaving(false)
    }
  }

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
              <span className="text-[10px] text-[#16a34a] font-bold bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#bbf7d0]">Ativo</span>
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
