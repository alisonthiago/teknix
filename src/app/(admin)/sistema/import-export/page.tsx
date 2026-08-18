'use client'

import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { Upload, Download } from 'lucide-react'

export default function ImportExportPage() {
  return (
    <ConfigSubLayout title="Importar / Exportar" description="Importe e exporte dados do TEKNIX">
      <ConfigSection title="Importar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {['Produtos', 'Fornecedores', 'Estoque', 'Compras', 'Pedidos', 'Vendas'].map(item => (
            <div key={item} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
              <span className="text-[12px] font-medium text-[#333]">{item}</span>
              <button className="px-3 py-1 bg-[#3483fa] text-white text-[10px] font-medium rounded-md hover:bg-[#2968c8] flex items-center gap-1">
                <Upload className="w-3 h-3" /> Importar
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#999] mt-2">Formatos aceitos: XLSX, CSV. A importação valida os dados antes de gravar.</p>
      </ConfigSection>
      <ConfigSection title="Exportar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {['Produtos', 'Estoque', 'Vendas', 'Pedidos', 'Relatórios'].map(item => (
            <div key={item} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
              <span className="text-[12px] font-medium text-[#333]">{item}</span>
              <button className="px-3 py-1 border border-[#e6e6e6] text-[#666] text-[10px] font-medium rounded-md hover:bg-[#f5f5f5] flex items-center gap-1">
                <Download className="w-3 h-3" /> Exportar
              </button>
            </div>
          ))}
        </div>
      </ConfigSection>
    </ConfigSubLayout>
  )
}
