'use client'

import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'

export default function EmpresaPage() {
  return (
    <ConfigSubLayout title="Dados da empresa" description="Informações da empresa no TEKNIX">
      <ConfigSection title="Dados gerais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Nome da empresa', value: 'TEKNIX LTDA' },
            { label: 'Nome fantasia', value: 'TEKNIX' },
            { label: 'Razão social', value: 'TEKNIX COMÉRCIO E SERVIÇOS LTDA' },
            { label: 'CNPJ', value: '12.345.678/0001-90', mono: true },
            { label: 'E-mail', value: 'contato@teknix.com' },
            { label: 'Telefone', value: '(11) 99999-0000' },
            { label: 'WhatsApp', value: '(11) 98888-0000' },
            { label: 'Site', value: 'www.teknix.com' },
            { label: 'Endereço', value: 'Rua Augusta, 1000' },
            { label: 'Cidade', value: 'São Paulo' },
            { label: 'Estado', value: 'SP' },
            { label: 'CEP', value: '01234-567', mono: true },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-[11px] text-[#999] mb-1.5">{field.label}</label>
              <input
                type="text"
                defaultValue={field.value}
                className={`w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#3483fa] transition-colors ${field.mono ? 'font-mono' : ''}`}
              />
            </div>
          ))}
        </div>
      </ConfigSection>
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-[#3483fa] text-white text-[12px] font-medium rounded-md hover:bg-[#2968c8] transition-colors">Salvar</button>
      </div>
    </ConfigSubLayout>
  )
}
