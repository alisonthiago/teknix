'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Store, ArrowRight, Wifi, WifiOff, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

interface AccountSummary {
  id: string
  account_name: string
  seller_id?: string | null
  status: string
  connection_status: string
}

interface MarketplaceWithAccounts {
  id: string
  name: string
  code: string
  status: string
  default_percentage_fee: number
  default_fixed_fee: number
  marketplace_accounts: AccountSummary[]
  total_accounts: number
  connected_accounts: number
}

export default function MarketplacesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'ALL' | 'CONNECTED' | 'DISCONNECTED'>('ALL')

  const { data: marketplaces, loading, error } = useSupabaseQuery<MarketplaceWithAccounts[]>(async (s) => {
    const { data: mps, error: mpError } = await s
      .from('marketplaces')
      .select('*')
      .order('name')
    if (mpError) throw mpError

    const results: MarketplaceWithAccounts[] = []

    for (const mp of mps || []) {
      const { data: accounts } = await s
        .from('marketplace_accounts')
        .select('id, account_name, seller_id, status, connection_status')
        .eq('marketplace_id', mp.id)
        .is('deleted_at', null)
        .order('created_at')

      const accountsList = accounts || []
      const connected = accountsList.filter(a => a.status === 'CONNECTED' || a.connection_status === 'CONNECTED').length

      results.push({
        ...mp,
        marketplace_accounts: accountsList,
        total_accounts: accountsList.length,
        connected_accounts: connected,
      })
    }

    return results
  })

  const filtered = (marketplaces || []).filter(mp => {
    if (filter === 'CONNECTED') return mp.connected_accounts > 0
    if (filter === 'DISCONNECTED') return mp.connected_accounts === 0
    return true
  })

  const totalAccounts = (marketplaces || []).reduce((sum, mp) => sum + mp.total_accounts, 0)
  const totalConnected = (marketplaces || []).reduce((sum, mp) => sum + mp.connected_accounts, 0)

  return (
    <div className="mp-stack">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#333]">Marketplaces</h1>
          <p className="text-sm text-[#999]">Gerencie seus canais de venda e múltiplas contas</p>
        </div>
        <Link
          href="/marketplaces/new"
          className="inline-flex items-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Marketplace
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e6e6e6] rounded-lg p-4">
          <p className="text-xs text-[#999] uppercase tracking-wide">Marketplaces</p>
          <p className="text-2xl font-bold text-[#333] mt-1">{marketplaces?.length || 0}</p>
        </div>
        <div className="bg-white border border-[#e6e6e6] rounded-lg p-4">
          <p className="text-xs text-[#999] uppercase tracking-wide">Total de Contas</p>
          <p className="text-2xl font-bold text-[#333] mt-1">{totalAccounts}</p>
        </div>
        <div className="bg-white border border-[#e6e6e6] rounded-lg p-4">
          <p className="text-xs text-[#999] uppercase tracking-wide">Conectadas</p>
          <p className="text-2xl font-bold text-[#38a169] mt-1">{totalConnected}</p>
        </div>
        <div className="bg-white border border-[#e6e6e6] rounded-lg p-4">
          <p className="text-xs text-[#999] uppercase tracking-wide">Desconectadas</p>
          <p className="text-2xl font-bold text-[#e74c3c] mt-1">{totalAccounts - totalConnected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['ALL', 'CONNECTED', 'DISCONNECTED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f
                ? 'bg-[#3483fa] text-white'
                : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee]'
            }`}
          >
            {f === 'ALL' ? 'Todos' : f === 'CONNECTED' ? 'Conectados' : 'Desconectados'}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="bg-white border border-[#e6e6e6] rounded-lg p-12 text-center text-sm text-[#999]">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#3483fa]" />
          Carregando marketplaces...
        </div>
      )}
      {error && (
        <div className="bg-white border border-[#e74c3c]/20 rounded-lg p-6 text-center text-sm text-[#e74c3c]">
          Erro ao carregar marketplaces.
        </div>
      )}

      {/* Marketplace cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(mp => (
            <div
              key={mp.id}
              onClick={() => router.push(`/marketplaces/${mp.id}`)}
              className="bg-white border border-[#e6e6e6] rounded-lg p-5 cursor-pointer hover:border-[#3483fa]/30 hover:shadow-sm transition-all group"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MarketplaceLogo name={mp.name} className="w-10 h-10" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#333] group-hover:text-[#3483fa] transition-colors">{mp.name}</h3>
                    <p className="text-xs text-[#999]">{mp.code}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#3483fa] transition-colors" />
              </div>

              {/* Accounts summary */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#999]" />
                  <span className="text-xs text-[#666]">
                    <strong className="text-[#333]">{mp.total_accounts}</strong> conta{mp.total_accounts !== 1 ? 's' : ''}
                  </span>
                </div>
                {mp.connected_accounts > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-[#38a169]" />
                    <span className="text-xs text-[#38a169] font-medium">{mp.connected_accounts} conectada{mp.connected_accounts !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {mp.total_accounts > mp.connected_accounts && (
                  <div className="flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5 text-[#e74c3c]" />
                    <span className="text-xs text-[#e74c3c]">{mp.total_accounts - mp.connected_accounts} off</span>
                  </div>
                )}
              </div>

              {/* Account chips */}
              {mp.marketplace_accounts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {mp.marketplace_accounts.slice(0, 4).map(acc => (
                    <span
                      key={acc.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                        acc.status === 'CONNECTED' || acc.connection_status === 'CONNECTED'
                          ? 'bg-[#f0fff4] text-[#38a169]'
                          : acc.status === 'ERROR'
                          ? 'bg-[#fff5f5] text-[#e74c3c]'
                          : 'bg-[#f5f5f5] text-[#999]'
                      }`}
                    >
                      {(acc.status === 'CONNECTED' || acc.connection_status === 'CONNECTED') ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38a169]" />
                      ) : acc.status === 'ERROR' ? (
                        <AlertTriangle className="w-2.5 h-2.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ccc]" />
                      )}
                      {acc.account_name}
                    </span>
                  ))}
                  {mp.marketplace_accounts.length > 4 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-[#999] bg-[#f5f5f5]">
                      +{mp.marketplace_accounts.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Fees */}
              <div className="flex items-center gap-4 pt-3 border-t border-[#f5f5f5]">
                <span className="text-[10px] text-[#999]">
                  Taxa: <strong className="text-[#666]">{Number(mp.default_percentage_fee).toFixed(1)}%</strong>
                </span>
                <span className="text-[10px] text-[#999]">
                  Fixa: <strong className="text-[#666]">R$ {Number(mp.default_fixed_fee).toFixed(2)}</strong>
                </span>
                {mp.marketplace_accounts.length === 0 && (
                  <span className="text-[10px] text-[#3483fa] ml-auto flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Conectar
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full bg-white border border-[#e6e6e6] rounded-lg p-12 text-center">
              <Store className="w-12 h-12 text-[#ccc] mx-auto mb-3" />
              <p className="text-sm text-[#999]">
                {filter === 'ALL' ? 'Nenhum marketplace cadastrado.' : 'Nenhum marketplace nesta categoria.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
