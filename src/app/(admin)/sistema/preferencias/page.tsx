'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'

export default function PreferenciasPage() {
  const [prefs, setPrefs] = useState({
    idioma: 'pt-BR', moeda: 'BRL', formato_data: 'DD/MM/AAAA', fuso: 'America/Sao_Paulo',
    itens_pagina: '20', visualizacao: 'tabela',
  })

  return (
    <ConfigSubLayout title="Preferências" description="Configurações pessoais do sistema">
      <ConfigSection title="Região e idioma">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'idioma', label: 'Idioma', options: ['Português (BR)', 'English'] },
            { key: 'moeda', label: 'Moeda', options: ['R$ (BRL)', '$ (USD)'] },
            { key: 'formato_data', label: 'Formato de data', options: ['DD/MM/AAAA', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
            { key: 'fuso', label: 'Fuso horário', options: ['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza'] },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-[11px] text-[#999] mb-1.5">{field.label}</label>
              <select
                value={prefs[field.key as keyof typeof prefs]}
                onChange={e => setPrefs(p => ({ ...p, [field.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#1f2328] bg-white transition-colors"
              >
                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </ConfigSection>

      <ConfigSection title="Visualização">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5">Itens por página</label>
            <select
              value={prefs.itens_pagina}
              onChange={e => setPrefs(p => ({ ...p, itens_pagina: e.target.value }))}
              className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#1f2328] bg-white transition-colors"
            >
              {['10', '20', '50', '100'].map(o => <option key={o} value={o}>{o} itens</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5">Preferência de visualização</label>
            <select
              value={prefs.visualizacao}
              onChange={e => setPrefs(p => ({ ...p, visualizacao: e.target.value }))}
              className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#1f2328] bg-white transition-colors"
            >
              <option value="tabela">Tabela</option>
              <option value="cards">Cards</option>
              <option value="lista">Lista</option>
            </select>
          </div>
        </div>
      </ConfigSection>

      <div className="flex justify-end">
        <button className="px-4 py-2 bg-[#1f2328] text-white text-[12px] font-medium rounded-md hover:bg-[#111827] transition-colors">Salvar preferências</button>
      </div>
    </ConfigSubLayout>
  )
}
