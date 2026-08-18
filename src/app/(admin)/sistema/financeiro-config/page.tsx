'use client'

import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'

export default function FinanceiroConfigPage() {
  return (
    <ConfigSubLayout title="Configurações financeiras" description="Moeda, impostos, categorias e contas">
      <ConfigSection title="Geral">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-[11px] text-[#999] mb-1">Moeda</label>
            <select className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa] bg-white"><option>R$ (BRL)</option><option>$ (USD)</option></select>
          </div>
          <div><label className="block text-[11px] text-[#999] mb-1">Formato de valores</label>
            <select className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] outline-none focus:border-[#3483fa] bg-white"><option>1.234,56</option><option>1,234.56</option></select>
          </div>
        </div>
      </ConfigSection>
      <ConfigSection title="Categorias financeiras">
        <div className="space-y-2">
          {['Receita de vendas', 'Custo de produtos', 'Frete', 'Taxas marketplace', 'Impostos', 'Embalagem', 'Outros custos'].map(c => (
            <div key={c} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
              <span className="text-[12px] text-[#333]">{c}</span>
              <span className="text-[10px] text-[#38a169] font-medium">Ativa</span>
            </div>
          ))}
        </div>
      </ConfigSection>
      <ConfigSection title="Formas de pagamento">
        <div className="space-y-2">
          {['PIX', 'Cartão de Crédito', 'Boleto', 'Transferência', 'Dinheiro'].map(p => (
            <div key={p} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
              <span className="text-[12px] text-[#333]">{p}</span>
              <span className="text-[10px] text-[#38a169] font-medium">Ativa</span>
            </div>
          ))}
        </div>
      </ConfigSection>
      <div className="flex justify-end"><button className="px-4 py-2 bg-[#3483fa] text-white text-[12px] font-medium rounded-md hover:bg-[#2968c8]">Salvar</button></div>
    </ConfigSubLayout>
  )
}
