'use client'

import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { Truck, Globe } from 'lucide-react'

const integrations = [
  { name: 'Mercado Livre', type: 'marketplace', status: 'CONNECTED', icon: 'Mercado Livre' },
  { name: 'Shopee', type: 'marketplace', status: 'DISCONNECTED', icon: 'Shopee' },
  { name: 'TikTok Shop', type: 'marketplace', status: 'DISCONNECTED', icon: 'TikTok Shop' },
  { name: 'Amazon', type: 'marketplace', status: 'DISCONNECTED', icon: 'Amazon' },
  { name: 'Magalu', type: 'marketplace', status: 'DISCONNECTED', icon: 'Magalu' },
  { name: 'Correios', type: 'transport', status: 'DISCONNECTED', icon: '' },
  { name: 'Jadlog', type: 'transport', status: 'DISCONNECTED', icon: '' },
  { name: 'Google Sheets', type: 'tools', status: 'DISCONNECTED', icon: '' },
]

export default function IntegracoesPage() {
  return (
    <ConfigSubLayout title="Integrações" description="Conecte ferramentas utilizadas pela empresa">
      <ConfigSection title="Marketplaces">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integrations.filter(i => i.type === 'marketplace').map(int => (
            <div key={int.name} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
              <div className="flex items-center gap-3">
                <MarketplaceLogo name={int.icon} className="w-6 h-6" />
                <span className="text-[12px] font-medium text-[#333]">{int.name}</span>
              </div>
              <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${int.status === 'CONNECTED' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#999]'}`}>
                {int.status === 'CONNECTED' ? 'Conectado' : 'Disponível'}
              </span>
            </div>
          ))}
        </div>
      </ConfigSection>

      <ConfigSection title="Transportadoras">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integrations.filter(i => i.type === 'transport').map(int => (
            <div key={int.name} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#999]" />
                <span className="text-[12px] font-medium text-[#333]">{int.name}</span>
              </div>
              <button className="px-3 py-1 bg-[#1f2328] text-white text-[10px] font-medium rounded-md hover:bg-[#111827]">Conectar</button>
            </div>
          ))}
        </div>
      </ConfigSection>

      <ConfigSection title="Outras integrações">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integrations.filter(i => i.type === 'tools').map(int => (
            <div key={int.name} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#999]" />
                <span className="text-[12px] font-medium text-[#333]">{int.name}</span>
              </div>
              <button className="px-3 py-1 bg-[#1f2328] text-white text-[10px] font-medium rounded-md hover:bg-[#111827]">Conectar</button>
            </div>
          ))}
        </div>
      </ConfigSection>
    </ConfigSubLayout>
  )
}
