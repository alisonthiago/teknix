'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Wifi, WifiOff, AlertTriangle, RefreshCw, ExternalLink, Power, Store } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

const OAUTH_MARKETPLACES: Record<string, string> = {
  mercadolivre: '/api/auth/mercadolivre',
  shopee: '/api/auth/shopee',
  amazon: '/api/auth/amazon',
  magalu: '/api/auth/magalu',
  tiktok: '/api/auth/tiktok',
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
  const [syncing, setSyncing] = useState<string | null>(null)

  const { data: marketplace, loading, error, refetch } = useSupabaseQuery<MarketplaceDetail>(async (s) => {
    const { data: mp, error: mpError } = await s
      .from('marketplaces')
      .select('*')
      .eq('id', marketplaceId)
      .single()
    if (mpError) throw mpError

    const { data: connections } = await s
      .from('marketplace_connections')
      .select('id, marketplace_id, seller_id, status, account_name, last_sync_at, last_webhook_at, updated_at')
      .or(`marketplace_id.eq.${mp.code.toLowerCase()},marketplace_id.eq.${marketplaceId}`)

    const accounts = (connections || []).map(c => ({
      id: c.id,
      account_name: c.account_name || c.seller_id || 'Conta',
      seller_id: c.seller_id,
      status: c.status,
      connection_status: c.status,
      last_sync_at: c.last_sync_at,
      last_webhook_at: c.last_webhook_at,
      created_at: c.updated_at,
    }))

    return { ...mp, marketplace_accounts: accounts }
  }, [marketplaceId])

  const accounts = marketplace?.marketplace_accounts || []
  const connectedCount = accounts.filter(a => a.status === 'CONNECTED').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED': return <Wifi className="w-4 h-4 text-[#38a169]" />
      case 'ERROR': return <AlertTriangle className="w-4 h-4 text-[#e74c3c]" />
      case 'REAUTH_REQUIRED': return <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
      default: return <WifiOff className="w-4 h-4 text-[#999]" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'Conectado'
      case 'INACTIVE': return 'Inativo'
      case 'ERROR': return 'Erro'
      case 'REAUTH_REQUIRED': return 'Reautenticar'
      case 'DISCONNECTED': return 'Desconectado'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'bg-[#f0fff4] text-[#38a169]'
      case 'ERROR': return 'bg-[#fff5f5] text-[#e74c3c]'
      case 'REAUTH_REQUIRED': return 'bg-[#fffbeb] text-[#f59e0b]'
      default: return 'bg-[#f5f5f5] text-[#999]'
    }
  }

  const handleSync = async (accountId: string) => {
    setSyncing(accountId)
    // Simulate sync
    await new Promise(r => setTimeout(r, 2000))
    setSyncing(null)
  }

  const handleConnectAccount = () => {
    if (!marketplace) return
    const oauthPath = OAUTH_MARKETPLACES[marketplace.code.toLowerCase()]
    if (oauthPath) {
      window.location.href = oauthPath
    } else {
      alert(`A integração com ${marketplace.name} via OAuth não está configurada no momento.`)
    }
  }

  return (
    <div className="mp-stack">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push('/marketplaces')}
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-[#3483fa] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {loading ? (
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#3483fa]" />
            <span className="text-sm text-[#999]">Carregando...</span>
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
              onClick={handleConnectAccount}
              className="inline-flex items-center justify-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Conectar conta
            </button>
          </div>
        ) : null}
      </div>

      {/* Default fees */}
      {marketplace && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-[#e6e6e6] rounded-lg p-3">
            <p className="text-[10px] text-[#999] uppercase">Taxa Padrão</p>
            <p className="text-lg font-bold text-[#333]">{Number(marketplace.default_percentage_fee).toFixed(1)}%</p>
          </div>
          <div className="bg-white border border-[#e6e6e6] rounded-lg p-3">
            <p className="text-[10px] text-[#999] uppercase">Taxa Fixa</p>
            <p className="text-lg font-bold text-[#333]">R$ {Number(marketplace.default_fixed_fee).toFixed(2)}</p>
          </div>
          <div className="bg-white border border-[#e6e6e6] rounded-lg p-3">
            <p className="text-[10px] text-[#999] uppercase">Imposto</p>
            <p className="text-lg font-bold text-[#333]">{Number(marketplace.default_tax).toFixed(1)}%</p>
          </div>
          <div className="bg-white border border-[#e6e6e6] rounded-lg p-3">
            <p className="text-[10px] text-[#999] uppercase">Publicidade</p>
            <p className="text-lg font-bold text-[#333]">{Number(marketplace.default_ads_fee).toFixed(1)}%</p>
          </div>
          <div className="bg-white border border-[#e6e6e6] rounded-lg p-3">
            <p className="text-[10px] text-[#999] uppercase">Total Contas</p>
            <p className="text-lg font-bold text-[#333]">{accounts.length}</p>
          </div>
        </div>
      )}

      {/* Accounts list */}
      {!loading && !error && (
        <div>
          <h2 className="text-sm font-semibold text-[#333] mb-3">Contas Conectadas</h2>

          {accounts.length === 0 ? (
            <div className="bg-white border border-[#e6e6e6] rounded-lg p-12 text-center">
              <Store className="w-12 h-12 text-[#ccc] mx-auto mb-3" />
              <p className="text-sm text-[#999] mb-4">Nenhuma conta conectada neste marketplace.</p>
              <button
                onClick={handleConnectAccount}
                className="inline-flex items-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#2968c8] transition-colors"
              >
                <Plus className="w-4 h-4" /> Conectar primeira conta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className="bg-white border border-[#e6e6e6] rounded-lg p-5 hover:border-[#3483fa]/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: account info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0">
                        {getStatusIcon(account.status)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#333] truncate">{account.account_name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(account.status)}`}>
                            {getStatusLabel(account.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#999]">
                          {account.seller_id && <span>Seller: {account.seller_id}</span>}
                          {account.cnpj && <span>CNPJ: {account.cnpj}</span>}
                          {account.display_name && <span>{account.display_name}</span>}
                        </div>
                        {account.last_error_message && account.status === 'ERROR' && (
                          <p className="text-[10px] text-[#e74c3c] mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {account.last_error_message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {account.status === 'CONNECTED' && (
                        <>
                          <button
                            onClick={() => handleSync(account.id)}
                            disabled={syncing === account.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f5] text-[#666] text-[11px] font-medium rounded-md hover:bg-[#eee] transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${syncing === account.id ? 'animate-spin' : ''}`} />
                            {syncing === account.id ? 'Sincronizando...' : 'Sincronizar'}
                          </button>
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#e74c3c]/20 text-[#e74c3c] text-[11px] font-medium rounded-md hover:bg-[#fff5f5] transition-colors">
                            <Power className="w-3 h-3" /> Desconectar
                          </button>
                        </>
                      )}
                      {account.status === 'REAUTH_REQUIRED' && (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f59e0b] text-white text-[11px] font-medium rounded-md hover:bg-[#d97706] transition-colors">
                          <ExternalLink className="w-3 h-3" /> Reautenticar
                        </button>
                      )}
                      {account.status !== 'CONNECTED' && account.status !== 'REAUTH_REQUIRED' && (
                        <button 
                          onClick={handleConnectAccount}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3483fa] text-white text-[11px] font-medium rounded-md hover:bg-[#2968c8] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Conectar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sync info */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f5f5f5] text-[10px] text-[#999]">
                    {account.last_sync_at && (
                      <span>Última sync: {new Date(account.last_sync_at).toLocaleString('pt-BR')}</span>
                    )}
                    {account.last_webhook_at && (
                      <span>Último webhook: {new Date(account.last_webhook_at).toLocaleString('pt-BR')}</span>
                    )}
                    {account.default_percentage_fee != null && (
                      <span>Taxa: {Number(account.default_percentage_fee).toFixed(1)}%</span>
                    )}
                    <span>Criada: {new Date(account.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
