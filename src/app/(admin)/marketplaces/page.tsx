'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Store, ArrowRight, Wifi, WifiOff, AlertTriangle, RefreshCw, Unlink, CheckCircle2, X, Trash2, Power } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import ConnectMarketplaceModal from '@/components/ConnectMarketplaceModal'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'

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
  const { notify } = useNotification()
  const [filter, setFilter] = useState<'ALL' | 'CONNECTED' | 'DISCONNECTED'>('ALL')
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [disconnectingMp, setDisconnectingMp] = useState<MarketplaceWithAccounts | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const { data: marketplaces, loading, error, refetch } = useSupabaseQuery<MarketplaceWithAccounts[]>(async (s) => {
    const { data: mps, error: mpError } = await s
      .from('marketplaces')
      .select('*')
      .order('name')
    if (mpError) throw mpError

    // 1. Fetch from marketplace_accounts
    const { data: accounts } = await s
      .from('marketplace_accounts')
      .select('id, marketplace_id, seller_id, status, connection_status, account_name, last_sync_at, updated_at')

    // 2. Fetch from marketplace_connections
    const { data: connections } = await s
      .from('marketplace_connections')
      .select('id, marketplace_id, seller_id, status, account_name, last_sync_at, updated_at')

    const results: MarketplaceWithAccounts[] = []

    for (const mp of mps || []) {
      const mpCode = mp.code ? mp.code.toLowerCase().replace(/_/g, '') : ''
      const mpId = mp.id

      // Combine accounts from both tables
      const matchedAccs = [
        ...(accounts || []).filter(a => a.marketplace_id === mpId || (a.marketplace_id && a.marketplace_id.toLowerCase().replace(/_/g, '') === mpCode)),
        ...(connections || []).filter(c => c.marketplace_id === mpId || (c.marketplace_id && c.marketplace_id.toLowerCase().replace(/_/g, '') === mpCode))
      ]

      // Deduplicate by seller_id or account_name
      const seen = new Set<string>()
      const uniqueAccounts: AccountSummary[] = []
      for (const a of matchedAccs) {
        const key = a.seller_id || a.account_name || a.id
        if (!seen.has(key)) {
          seen.add(key)
          uniqueAccounts.push({
            id: a.id,
            account_name: a.account_name || a.seller_id || 'Conta Conectada',
            seller_id: a.seller_id,
            status: a.status || 'CONNECTED',
            connection_status: (a as any).connection_status || a.status || 'CONNECTED',
          })
        }
      }

      const connected = uniqueAccounts.filter(a => 
        a.status === 'CONNECTED' || a.status === 'ACTIVE' || (a as any).connection_status === 'CONNECTED'
      ).length

      results.push({
        ...mp,
        marketplace_accounts: uniqueAccounts,
        total_accounts: uniqueAccounts.length,
        connected_accounts: connected,
      })
    }

    return results
  })

  const handleDisconnect = async () => {
    if (!disconnectingMp) return
    setIsDisconnecting(true)
    const supabase = createClient()

    try {
      const mpId = disconnectingMp.id
      const mpCode = disconnectingMp.code ? disconnectingMp.code.toLowerCase() : ''

      // Delete from connections and accounts
      await supabase.from('marketplace_connections').delete().or(`marketplace_id.eq.${mpId},marketplace_id.eq.${mpCode},marketplace_id.eq.mercadolivre`)
      await supabase.from('marketplace_accounts').delete().or(`marketplace_id.eq.${mpId},marketplace_id.eq.${disconnectingMp.code}`)

      notify({
        type: 'success',
        title: 'Canal Desconectado',
        message: `${disconnectingMp.name} foi desconectado com sucesso.`
      })

      setDisconnectingMp(null)
      refetch()
    } catch (err: unknown) {
      console.error(err)
      notify({
        type: 'error',
        title: 'Erro ao Desconectar',
        message: err instanceof Error ? err.message : 'Não foi possível desconectar o canal.'
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

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
          <p className="text-sm text-[#999]">Gerencie seus canais de venda, login e múltiplas contas</p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="inline-flex items-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Marketplace
        </button>
      </div>

      {/* Connect Modal */}
      <ConnectMarketplaceModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={() => refetch()}
      />

      {/* Disconnect Confirmation Popup Modal */}
      {disconnectingMp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-[#e6e6e6]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#fff5f5] flex items-center justify-center shrink-0">
                <Unlink className="w-5 h-5 text-[#e74c3c]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#333]">Desconectar {disconnectingMp.name}</h3>
                <p className="text-[11px] text-[#999]">Confirmação de desconexão</p>
              </div>
            </div>

            <p className="text-[13px] text-[#555] leading-relaxed mb-6">
              Tem certeza que deseja desconectar o canal <strong>{disconnectingMp.name}</strong>? A sincronização automática de pedidos e estoque com a sua loja será interrompida.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDisconnectingMp(null)}
                disabled={isDisconnecting}
                className="px-4 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#f5f5f5] rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDisconnecting ? 'Desconectando...' : 'Sim, Desconectar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          {filtered.map(mp => {
            const isConnected = mp.connected_accounts > 0
            return (
              <div
                key={mp.id}
                className="bg-white border border-[#e6e6e6] rounded-2xl p-5 hover:border-[#3483fa]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      onClick={() => router.push(`/marketplaces/${mp.id}`)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#fafafa] border border-[#f0f0f0] p-2 flex items-center justify-center">
                        <MarketplaceLogo name={mp.name} className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-[#333] group-hover:text-[#3483fa] transition-colors">{mp.name}</h3>
                        <p className="text-[11px] text-[#999]">{mp.code}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/marketplaces/${mp.id}`)}
                      className="p-1.5 rounded-lg text-[#999] hover:text-[#3483fa] hover:bg-[#f0f7ff] transition-colors"
                      title="Ver detalhes do canal"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Accounts summary */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-[#999]" />
                      <span className="text-xs text-[#666]">
                        <strong className="text-[#333]">{mp.total_accounts}</strong> conta{mp.total_accounts !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {isConnected && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#38a169] animate-pulse" />
                        <span className="text-xs text-[#38a169] font-semibold">{mp.connected_accounts} Conectada</span>
                      </div>
                    )}
                    {!isConnected && (
                      <div className="flex items-center gap-1.5">
                        <WifiOff className="w-3.5 h-3.5 text-[#999]" />
                        <span className="text-xs text-[#999]">Desconectado</span>
                      </div>
                    )}
                  </div>

                  {/* Account chips */}
                  {mp.marketplace_accounts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {mp.marketplace_accounts.slice(0, 3).map(acc => (
                        <span
                          key={acc.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#f0fff4] text-[#276749] border border-[#c6f6d5]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38a169]" />
                          {acc.account_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer / Connect / Disconnect Buttons */}
                <div className="pt-3 border-t border-[#f5f5f5] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-[#999]">
                    <span>Taxa: <strong className="text-[#666]">{Number(mp.default_percentage_fee).toFixed(1)}%</strong></span>
                    <span>Fixa: <strong className="text-[#666]">R$ {Number(mp.default_fixed_fee).toFixed(2)}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDisconnectingMp(mp)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#e74c3c] hover:bg-[#fff5f5] rounded-lg transition-colors border border-[#fed7d7]"
                        title="Desconectar do canal"
                      >
                        <Unlink className="w-3 h-3" /> Desconectar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowConnectModal(true)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-white bg-[#3483fa] hover:bg-[#2968c8] rounded-lg transition-colors shadow-sm"
                      >
                        <Plus className="w-3 h-3" /> Conectar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full bg-white border border-[#e6e6e6] rounded-2xl p-12 text-center">
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
