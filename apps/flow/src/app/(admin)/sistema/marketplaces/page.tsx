'use client'

import ConfigSubLayout from '@/components/ConfigSubLayout'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

interface MarketplaceConnection {
  id: string
  marketplace_id: string
  seller_id: string
  status: string
  account_name?: string | null
  last_sync_at?: string | null
}

interface MarketplaceWithConnections {
  id: string
  name: string
  code: string
  status: string
  default_percentage_fee: number
  default_fixed_fee: number
  connections: MarketplaceConnection[]
  connected_count: number
}

export default function MarketplacesConfigPage() {
  const { data: marketplaces, loading, error } = useSupabaseQuery<MarketplaceWithConnections[]>(async (s) => {
    const { data: mps, error: mpError } = await s.from('marketplaces').select('*').order('name')
    if (mpError) throw mpError

    const { data: connections } = await s
      .from('marketplace_connections')
      .select('id, marketplace_id, seller_id, status, account_name, last_sync_at')

    const connByMarketplace: Record<string, MarketplaceConnection[]> = {}
    for (const conn of connections || []) {
      const key = conn.marketplace_id?.toLowerCase() || ''
      if (!connByMarketplace[key]) connByMarketplace[key] = []
      connByMarketplace[key].push(conn)
    }

    return (mps || []).map(mp => {
      const conns = connByMarketplace[mp.code.toLowerCase()] || connByMarketplace[mp.id] || []
      return {
        ...mp,
        connections: conns,
        connected_count: conns.filter(c => c.status === 'CONNECTED').length,
      }
    })
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
                    {m.connections.length > 0 ? (
                      <p className="text-[10px] text-[#38a169]">
                        {m.connected_count} conta{m.connected_count !== 1 ? 's' : ''} conectada{m.connected_count !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#999]">Não conectado</p>
                    )}
                  </div>
                </div>
                <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${m.connected_count > 0 ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#999]'}`}>
                  {m.connected_count > 0 ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              {m.connections.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {m.connections.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-[10px]">
                      <span className="text-[#666]">{c.account_name || c.seller_id}</span>
                      <span className={`font-medium ${c.status === 'CONNECTED' ? 'text-[#38a169]' : 'text-[#999]'}`}>
                        {c.status === 'CONNECTED' ? 'Conectado' : c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {m.connected_count > 0 ? (
                  <>
                    <button className="px-3 py-1.5 bg-[#f5f5f5] text-[#666] text-[11px] font-medium rounded-md hover:bg-[#eee]">Sincronizar</button>
                    <button className="px-3 py-1.5 border border-[#e74c3c]/20 text-[#e74c3c] text-[11px] font-medium rounded-md hover:bg-[#fff5f5]">Desconectar</button>
                  </>
                ) : (
                  <a href={`/marketplaces/${m.id}`} className="px-3 py-1.5 bg-[#1f2328] text-white text-[11px] font-medium rounded-md hover:bg-[#111827] inline-block">Conectar via OAuth</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ConfigSubLayout>
  )
}
