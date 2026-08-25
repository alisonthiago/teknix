'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, ExternalLink, RefreshCw, Unplug, Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Marketplace {
  id: string
  name: string
  code: string
  status: string
  type: string
  api_available: boolean
  oauth_available: boolean
  webhook_available: boolean
}

interface Connection {
  id: string
  user_id: string
  marketplace_id: string
  seller_id: string
  status: string
  updated_at: string
  account_name?: string
  last_sync_at?: string
}

const MARKETPLACE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MERCADO_LIVRE: { bg: 'bg-lime-100', text: 'text-lime-600', border: 'border-lime-400' },
  SHOPEE: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-400' },
  AMAZON: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-500' },
  TIKTOK_SHOP: { bg: 'bg-[#f5f5f5]', text: 'text-[#333]', border: 'border-[#999]' },
  MAGALU: { bg: 'bg-[#ecf3fe]', text: 'text-[#3483fa]', border: 'border-blue-400' },
  TEMU: { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-300' },
  SHEIN: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300' },
  ALIEXPRESS: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-400' },
  CASAS_BAHIA: { bg: 'bg-[#ecf3fe]', text: 'text-[#3483fa]', border: 'border-blue-300' },
  AMERICANAS: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-300' },
  OLX: { bg: 'bg-[#f5f5f5]', text: 'text-[#666]', border: 'border-[#e6e6e6]' },
  OUTROS: { bg: 'bg-[#fafafa]', text: 'text-[#999]', border: 'border-[#e6e6e6]' },
}

export default function IntegrationsClient({ initialConnections, marketplaces }: { initialConnections: Connection[]; marketplaces: Marketplace[] }) {
  const router = useRouter()
  const [connections, setConnections] = useState(initialConnections)

  const getConnection = (code: string) => connections.find(c => c.marketplace_id === code.toLowerCase())
  const isConnected = (code: string) => { const c = getConnection(code); return c && c.status === 'CONNECTED' }

  const handleConnect = (code: string) => {
    if (code === 'MERCADO_LIVRE') {
      router.push('/api/auth/mercadolivre')
    }
  }

  const handleDisconnect = async (code: string, name: string) => {
    if (!confirm(`Tem certeza que deseja desconectar ${name}?`)) return

    if (code === 'MERCADO_LIVRE') {
      try {
        const res = await fetch('/api/auth/mercadolivre/disconnect', { method: 'POST' })
        if (res.ok) {
          setConnections(connections.filter(c => c.marketplace_id !== code.toLowerCase()))
          alert('Desconectado com sucesso!')
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const connected = marketplaces.filter(m => isConnected(m.code))
  const available = marketplaces.filter(m => !isConnected(m.code) && m.status === 'ACTIVE' && m.api_available)
  const comingSoon = marketplaces.filter(m => !isConnected(m.code) && (!m.api_available || m.status !== 'ACTIVE'))

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#333]">Integrações</h1>
          <p className="text-sm text-[#999] mt-1">Gerencie a conexão com seus canais de venda.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#999]">
          <span className="font-medium text-[#00a650]">{connected.length}</span> conectados
          <span className="text-[#999]">|</span>
          <span className="font-medium text-[#666]">{marketplaces.length}</span> marketplaces
        </div>
      </div>

      {/* Connected */}
      {connected.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">Conectados</h2>
          <div className="grid gap-4">
            {connected.map(mp => {
              const conn = getConnection(mp.code)
              const colors = MARKETPLACE_COLORS[mp.code] || MARKETPLACE_COLORS.OUTROS
              return (
                <div key={mp.id} className="bg-white rounded-2xl border border-[#e6e6e6] overflow-hidden">
                  <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Store className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#333]">{mp.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-[#e6f9ef] text-[#00a650] border border-[#b8e6d0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00a650]"></span>
                            CONECTADO
                          </span>
                          {conn?.last_sync_at && (
                            <span className="text-xs text-[#999] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Sync: {new Date(conn.last_sync_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        <RefreshCw className="w-4 h-4 mr-1" /> Sync
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDisconnect(mp.code, mp.name)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Unplug className="w-4 h-4 mr-1" /> Desconectar
                      </Button>
                    </div>
                  </div>
                  {conn && (
                    <div className="bg-[#fafafa] border-t border-[#e6e6e6] px-6 py-2 text-xs text-[#999] flex justify-between">
                      <span>Seller: <span className="font-medium text-[#666]">{conn.seller_id}</span></span>
                      <span>{conn.account_name && `${conn.account_name} • `}{new Date(conn.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available to connect */}
      {available.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">Disponíveis para Conectar</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {available.map(mp => {
              const colors = MARKETPLACE_COLORS[mp.code] || MARKETPLACE_COLORS.OUTROS
              return (
                <div key={mp.id} className="bg-white rounded-2xl border border-[#e6e6e6] p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Store className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#333] text-sm">{mp.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {mp.oauth_available && <span className="text-xs text-[#00a650] bg-[#e6f9ef] px-1.5 py-0.5 rounded font-medium">OAuth</span>}
                        {mp.webhook_available && <span className="text-xs text-[#3483fa] bg-[#ecf3fe] px-1.5 py-0.5 rounded font-medium">Webhooks</span>}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleConnect(mp.code)} className="bg-[#333] hover:bg-[#666]">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Conectar
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Coming Soon */}
      {comingSoon.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">Em Breve</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {comingSoon.map(mp => {
              const colors = MARKETPLACE_COLORS[mp.code] || MARKETPLACE_COLORS.OUTROS
              return (
                <div key={mp.id} className="bg-[#fafafa] rounded-xl border border-dashed border-[#e6e6e6] p-4 flex items-center gap-3 opacity-60">
                  <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center grayscale flex-shrink-0`}>
                    <Store className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#666] text-sm">{mp.name}</h3>
                    <span className="text-xs bg-[#f5f5f5] text-[#999] px-1.5 py-0.5 rounded font-medium">
                      <Zap className="w-2.5 h-2.5 inline mr-0.5" /> Em breve
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
