'use client'

import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'

export default function PrecificacaoConfigPage() {
  return (
    <ConfigSubLayout title="Precificação" description="Configure margem, markup, custos e simulador">
      <ConfigSection title="Margem">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-[11px] text-[#999] mb-1">Margem mínima (%)</label><input type="number" defaultValue="15" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
          <div><label className="block text-[11px] text-[#999] mb-1">Margem desejada (%)</label><input type="number" defaultValue="25" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
          <div><label className="block text-[11px] text-[#999] mb-1">Markup padrão</label><input type="number" defaultValue="1.3" step="0.1" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
        </div>
      </ConfigSection>
      <ConfigSection title="Custos padrão">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-[11px] text-[#999] mb-1">Frete médio (R$)</label><input type="number" defaultValue="10" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
          <div><label className="block text-[11px] text-[#999] mb-1">Embalagem (R$)</label><input type="number" defaultValue="2" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
          <div><label className="block text-[11px] text-[#999] mb-1">Taxa marketplace (%)</label><input type="number" defaultValue="16" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
        </div>
      </ConfigSection>
      <ConfigSection title="Impostos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-[11px] text-[#999] mb-1">ICMS (%)</label><input type="number" defaultValue="18" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
          <div><label className="block text-[11px] text-[#999] mb-1">PIS (%)</label><input type="number" defaultValue="1.65" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
          <div><label className="block text-[11px] text-[#999] mb-1">COFINS (%)</label><input type="number" defaultValue="7.6" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa]" /></div>
        </div>
      </ConfigSection>
      <div className="flex justify-end"><button className="px-4 py-2 bg-[#3483fa] text-white text-[12px] font-medium rounded-md hover:bg-[#2968c8]">Salvar</button></div>
    </ConfigSubLayout>
  )
}
