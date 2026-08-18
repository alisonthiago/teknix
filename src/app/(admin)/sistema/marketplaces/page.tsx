'use client'

import ConfigSubLayout from '@/components/ConfigSubLayout'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

interface Marketplace {
  id: string
  name: string
  code: string
  status: string
  seller_id: string
  last_sync: string | null
  orders: number
}

export default function MarketplacesConfigPage() {
  const { data: marketplaces, loading, error } = useSupabaseQuery<Marketplace[]>(async (s) => {
    const { data, error } = await s.from('marketplaces').select('*').order('name')
    if (error) throw error
    return (data || []) as Marketplace[]
  })

  return (
    <ConfigSubLayout title="Marketplaces" description="Conecte suas plataformas de venda ao TEKNIX">
      {loading ? (
        <div className="bg-white border border-[#e6e6e6] rounded-md p-6 text-center text-[13px] text-[#999]">Carregando marketplaces...</div>
      ) : error ? (
        <div className="bg-white border border-[#e6e6e6] rounded-md p-6 text-center text-[13px] text-[#e74c3c]">Erro ao carregar marketplaces.</div>
      ) : !marketplaces?.length ? (
        <div className="bg-white border border-[#e6e6e6] rounded-md p-6 text-center text-[13px] text-[#999]">Nenhum marketplace configurado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {marketplaces.map(m => (
            <div key={m.id} className="bg-white border border-[#e6e6e6] rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <MarketplaceLogo name={m.name} className="w-8 h-8" />
                  <div>
                    <h3 className="text-[13px] font-semibold text-[#333]">{m.name}</h3>
                    <p className="text-[10px] text-[#999]">{m.seller_id || 'Não conectado'}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${m.status === 'CONNECTED' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#999]'}`}>
                  {m.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              {m.last_sync && <p className="text-[10px] text-[#ccc] mb-3">Última sincronização: {new Date(m.last_sync).toLocaleString('pt-BR')}</p>}
              <div className="flex gap-2">
                {m.status === 'CONNECTED' ? (
                  <>
                    <button className="px-3 py-1.5 bg-[#f5f5f5] text-[#666] text-[11px] font-medium rounded-md hover:bg-[#eee]">Sincronizar</button>
                    <button className="px-3 py-1.5 border border-[#e74c3c]/20 text-[#e74c3c] text-[11px] font-medium rounded-md hover:bg-[#fff5f5]">Desconectar</button>
                  </>
                ) : (
                  <button className="px-3 py-1.5 bg-[#3483fa] text-white text-[11px] font-medium rounded-md hover:bg-[#2968c8]">Conectar via OAuth</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ConfigSubLayout>
  )
}
