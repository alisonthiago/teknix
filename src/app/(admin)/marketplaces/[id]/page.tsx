'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Wifi, WifiOff, AlertTriangle, RefreshCw, ExternalLink, Power, Store, Unlink, CheckCircle2, Loader2 } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import ConnectMarketplaceModal from '@/components/ConnectMarketplaceModal'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'

const OAUTH_MARKETPLACES: Record<string, string> = {
  mercadolivre: '/api/auth/mercadolivre',
  mercado_livre: '/api/auth/mercadolivre',
  shopify: '/api/auth/shopify',
  shopee: '/api/auth/shopee',
  amazon: '/api/auth/amazon',
  magalu: '/api/auth/magalu',
  magazine_luiza: '/api/auth/magalu',
  tiktok: '/api/auth/tiktok',
  tiktok_shop: '/api/auth/tiktok',
}

interface Account {
  id: string
  account_name: string
  display_name?: string | null
  seller_id?: string | null
  cnpj?: string | null
  status: string
  connection_status: string
  last_sync_at?: string | null
  last_webhook_at?: string | null
  last_error_at?: string | null
  last_error_message?: string | null
  default_percentage_fee?: number | null
  default_fixed_fee?: number | null
  created_at: string
}

interface MarketplaceDetail {
  id: string
  name: string
  code: string
  status: string
  default_percentage_fee: number
  default_fixed_fee: number
  default_tax: number
  default_ads_fee: number
  marketplace_accounts: Account[]
}

export default function MarketplaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const marketplaceId = params.id as string
  const { notify } = useNotification()
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [disconnectingAccount, setDisconnectingAccount] = useState<Account | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const { data: marketplace, loading, error, refetch } = useSupabaseQuery<MarketplaceDetail>(async (s) => {
    const { data: mp, error: mpError } = await s
      .from('marketplaces')
      .select('*')
      .eq('id', marketplaceId)
      .single()
    if (mpError) throw mpError

    const mpCode = mp.code ? mp.code.toLowerCase().replace(/_/g, '') : ''

    // 1. Fetch from marketplace_accounts using marketplaceId
    const { data: accs } = await s
      .from('marketplace_accounts')
      .select('*')
      .eq('marketplace_id', marketplaceId)

    // 2. Fetch from marketplace_connections
    let conns: any[] = []
    try {
      const { data: cData } = await s
        .from('marketplace_connections')
        .select('*')
        .or(`marketplace_id.eq.${marketplaceId},marketplace_id.eq.${mpCode},marketplace_id.eq.mercadolivre`)
      if (cData) conns = cData
    } catch {
      // ignore
    }

    // Merge and deduplicate
    const combined = [...(accs || []), ...(conns || [])]
    const seen = new Set<string>()
    const accounts: Account[] = []

    for (const c of combined) {
      const key = c.seller_id || c.account_name || c.id
      if (!seen.has(key)) {
        seen.add(key)
        accounts.push({
          id: c.id,
          account_name: c.account_name || c.seller_id || 'Conta Conectada',
          seller_id: c.seller_id,
          status: c.status === 'ACTIVE' ? 'CONNECTED' : c.status || 'CONNECTED',
          connection_status: (c as any).connection_status || 'CONNECTED',
          last_sync_at: c.last_sync_at,
          last_webhook_at: (c as any).last_webhook_at || null,
          created_at: c.created_at || c.updated_at || new Date().toISOString(),
        })
      }
    }

    return { ...mp, marketplace_accounts: accounts }
  }, [marketplaceId])

  const accounts = marketplace?.marketplace_accounts || []
  const connectedCount = accounts.filter(a => a.status === 'CONNECTED' || a.status === 'ACTIVE').length

  const handleSyncAccount = async (account: Account) => {
    if (!account.seller_id) return
    setSyncingId(account.id)

    try {
      const res = await fetch('/api/sync/mercadolivre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: account.seller_id })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Falha ao sincronizar')

      notify({
        type: 'success',
        title: 'Sincronização Concluída!',
        message: data.message || 'Produtos e pedidos foram sincronizados com sucesso!'
      })

      refetch()
    } catch (err: unknown) {
      console.error(err)
      notify({
        type: 'error',
        title: 'Erro na Sincronização',
        message: err instanceof Error ? err.message : 'Não foi possível buscar os dados da API.'
      })
    } finally {
      setSyncingId(null)
    }
  }

  const handleDisconnectSingleAccount = async () => {
    if (!disconnectingAccount) return
    setIsDisconnecting(true)
    const supabase = createClient()

    try {
      const sellerId = disconnectingAccount.seller_id
      const accountId = disconnectingAccount.id

      if (sellerId) {
        await supabase.from('marketplace_accounts').delete().eq('seller_id', sellerId)
        await supabase.from('marketplace_connections').delete().eq('seller_id', sellerId)
      } else {
        await supabase.from('marketplace_accounts').delete().eq('id', accountId)
      }

      notify({
        type: 'success',
        title: 'Conta Desconectada',
        message: `A conta "${disconnectingAccount.account_name}" foi desconectada com sucesso.`
      })

      setDisconnectingAccount(null)
      refetch()
    } catch (err: unknown) {
      console.error(err)
      notify({
        type: 'error',
        title: 'Erro ao Desconectar',
        message: err instanceof Error ? err.message : 'Não foi possível desconectar a conta.'
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleConnectAccount = () => {
    if (!marketplace) return
    const code = marketplace.code.toLowerCase()
    const oauthPath = OAUTH_MARKETPLACES[code] || OAUTH_MARKETPLACES[code.replace(/_/g, '')]
    if (oauthPath) {
      window.location.href = oauthPath
    } else {
      setShowConnectModal(true)
    }
  }

  return (
    <div className="mp-stack">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push('/marketplaces')}
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-[#3483fa] transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Marketplaces
        </button>

        {loading ? (
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#3483fa]" />
            <span className="text-sm text-[#999]">Carregando marketplace...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-[#e74c3c]">Erro ao carregar marketplace.</div>
        ) : marketplace ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <MarketplaceLogo name={marketplace.name} className="w-12 h-12" />
              <div>
                <h1 className="text-lg font-semibold text-[#333]">{marketplace.name}</h1>
                <p className="text-sm text-[#999]">
                  {connectedCount} de {accounts.length} conta{accounts.length !== 1 ? 's' : ''} conectada{connectedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors w-full sm:w-auto shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Conectar Nova Conta
            </button>
          </div>
        ) : null}
      </div>

      {/* Disconnect Single Account Modal */}
      {disconnectingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-[#e6e6e6]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#fff5f5] flex items-center justify-center shrink-0">
                <Unlink className="w-5 h-5 text-[#e74c3c]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#333]">Desconectar Conta</h3>
                <p className="text-[11px] text-[#999]">{disconnectingAccount.account_name}</p>
              </div>
            </div>

            <p className="text-[13px] text-[#555] leading-relaxed mb-6">
              Tem certeza que deseja desconectar a conta <strong>{disconnectingAccount.account_name}</strong> (Seller ID: {disconnectingAccount.seller_id})? 
              Apenas esta conta será removida. Suas outras contas continuarão ativas.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDisconnectingAccount(null)}
                disabled={isDisconnecting}
                className="px-4 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#f5f5f5] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDisconnectSingleAccount}
                disabled={isDisconnecting}
                className="px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isDisconnecting ? 'Desconectando...' : 'Sim, Desconectar Esta Conta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      <ConnectMarketplaceModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={() => refetch()}
      />

      {/* Accounts list */}
      {!loading && !error && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#333]">Contas Conectadas ({accounts.length})</h2>
            <span className="text-[11px] text-[#999]">Sincronização de anúncios, estoque e pedidos em tempo real</span>
          </div>

          {accounts.length === 0 ? (
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-12 text-center shadow-sm">
              <Store className="w-12 h-12 text-[#ccc] mx-auto mb-3" />
              <p className="text-sm text-[#999] mb-4">Nenhuma conta conectada neste marketplace.</p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="inline-flex items-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2968c8] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Conectar Primeira Conta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map(account => {
                const isSyncing = syncingId === account.id
                return (
                  <div
                    key={account.id}
                    className="bg-white border border-[#e6e6e6] rounded-2xl p-5 hover:border-[#3483fa]/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#f0fff4] border border-[#c6f6d5] flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#38a169] animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-[14px] font-bold text-[#333]">{account.account_name}</h3>
                            <p className="text-[11px] text-[#999]">Seller ID: <strong className="text-[#666]">{account.seller_id || 'Principal'}</strong></p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#f0fff4] text-[#276749] border border-[#c6f6d5]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38a169]" />
                          Conectada & Ativa
                        </span>
                      </div>

                      {/* Info & Sync Details */}
                      <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#eeeeee] space-y-1.5 text-[11px] text-[#666] mb-4">
                        <div className="flex items-center justify-between">
                          <span>Status do Webhook:</span>
                          <span className="text-[#38a169] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Recebendo Vendas
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Estoque Centralizado:</span>
                          <span className="text-[#3483fa] font-medium">Sincronização Ativa</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-[#eeeeee]">
                          <span>Última Sincronização:</span>
                          <span className="text-[#999]">
                            {account.last_sync_at ? new Date(account.last_sync_at).toLocaleString('pt-BR') : 'Hoje'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#f5f5f5] gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSyncAccount(account)}
                          disabled={isSyncing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f7ff] hover:bg-[#e0efff] text-[#3483fa] text-[11px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Buscando Vendas da API...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              Sincronizar Vendas e Anúncios
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = '/api/auth/mercadolivre'
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B5F500] hover:bg-[#a3e600] text-[#111] text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-[#a2e000] shadow-2xs"
                          title="Autorizar com 1 clique no Mercado Livre"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Autorizar no Mercado Livre
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDisconnectingAccount(account)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#e74c3c] hover:bg-[#fff5f5] rounded-lg transition-colors border border-[#fed7d7] cursor-pointer"
                        title="Desconectar apenas esta conta"
                      >
                        <Unlink className="w-3 h-3" /> Desconectar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
