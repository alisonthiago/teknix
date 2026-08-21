'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Webhook,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Zap,
  Globe,
  ShieldCheck
} from 'lucide-react'
import { PageHeader, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

const WEBHOOK_ENDPOINTS = [
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    url: 'https://www.teknixbrasil.com.br/api/webhooks/mercadolivre',
    topics: 'orders_v2, shipments, items, payments',
    status: 'ATIVO',
    color: '#FFE600'
  },
  {
    id: 'shopee',
    name: 'Shopee',
    url: 'https://www.teknixbrasil.com.br/api/webhooks/shopee',
    topics: 'order_status_update, tracking_update',
    status: 'ATIVO',
    color: '#EE4D2D'
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    url: 'https://www.teknixbrasil.com.br/api/webhooks/tiktok',
    topics: 'ORDER_STATUS_CHANGE, PACKAGE_UPDATE',
    status: 'ATIVO',
    color: '#000000'
  },
  {
    id: 'magalu',
    name: 'Magazine Luiza',
    url: 'https://www.teknixbrasil.com.br/api/webhooks/magalu',
    topics: 'orders, order_status, tracking',
    status: 'ATIVO',
    color: '#0086FF'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    url: 'https://www.teknixbrasil.com.br/api/webhooks/amazon',
    topics: 'ORDER_CHANGE, NOTIFICATIONS',
    status: 'ATIVO',
    color: '#FF9900'
  }
]

export default function WebhooksPage() {
  const [search, setSearch] = useState('')
  const [filterMp, setFilterMp] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Buscar eventos de webhook em tempo real a cada 2 segundos
  const { data: events, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('marketplace_webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.warn('Webhook events error:', error)
      return []
    }
    return data || []
  }, [], { intervalMs: 2000 })

  const list = (events || []).filter((e: Record<string, unknown>) => {
    const mpId = String(e.marketplace_id || '').toLowerCase()
    if (filterMp !== 'all' && !mpId.includes(filterMp.toLowerCase())) return false
    if (search) {
      const eventType = String(e.event_type || '').toLowerCase()
      const resource = String(e.resource || '').toLowerCase()
      if (!eventType.includes(search.toLowerCase()) && !resource.includes(search.toLowerCase())) return false
    }
    return true
  })

  const total = list.length
  const processed = list.filter((e: any) => e.processed === true || e.status === 'processed').length
  const failed = list.filter((e: any) => Boolean(e.error) || e.status === 'failed').length
  const pending = list.filter((e: any) => e.processed === false || e.status === 'received').length

  return (
    <div className="space-y-6">
      
      {/* Voltar */}
      <div>
        <Link href="/sistema" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Sistema
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-[#1f2328] tracking-tight flex items-center gap-2">
            <Webhook className="w-6 h-6 text-[#5c8a00]" />
            Webhooks & Eventos ao Vivo
          </h1>
          <p className="text-[12px] text-[#666] mt-0.5">
            URLs oficiais dos webhooks configurados e auditoria dos eventos recebidos em tempo real.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3.5 py-2 rounded-xl border border-[#e6e6e6] bg-white text-[#333] text-[12px] font-bold hover:bg-[#fafafa] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5c8a00]' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* 🟢 SEÇÃO 1: WEBHOOKS CONECTADOS / URLS OFICIAIS */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-[#f0f0f0] pb-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#1f2328] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#38a169]" />
              Webhooks Conectados nos Marketplaces
            </h2>
            <p className="text-[11px] text-[#888]">URLs públicas escutando notificações dos marketplaces em tempo real.</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#38a169] bg-[#f0fff4] px-2.5 py-1 rounded-full border border-[#bbf7d0]">
            <span className="w-2 h-2 rounded-full bg-[#38a169] animate-pulse" />
            5 Endpoints Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {WEBHOOK_ENDPOINTS.map(wh => (
            <div
              key={wh.id}
              className="p-4 rounded-xl border border-[#eeeeee] bg-[#fafafa] hover:border-[#16a34a] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MarketplaceLogo name={wh.name} className="w-5 h-5 shrink-0" />
                    <h3 className="text-[13px] font-bold text-[#1f2328]">{wh.name}</h3>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32]">
                    {wh.status}
                  </span>
                </div>

                <div className="mt-2 bg-white rounded-lg p-2 border border-[#e6e6e6] flex items-center justify-between gap-2 font-mono text-[11px] text-[#333]">
                  <span className="truncate select-all">{wh.url}</span>
                  <button
                    onClick={() => handleCopy(wh.id, wh.url)}
                    className="p-1.5 rounded-md hover:bg-[#f0f0f0] text-[#666] shrink-0 transition-colors"
                    title="Copiar URL do Webhook"
                  >
                    {copiedId === wh.id ? <Check className="w-4 h-4 text-[#38a169]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#eee] flex items-center justify-between text-[10px] text-[#888]">
                <span>Tópicos: <strong>{wh.topics}</strong></span>
                <span className="text-[#38a169] font-medium">SSL / HTTPS Ativo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📊 STATS DE EVENTOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total de Eventos" value={String(total)} />
        <StatCard label="Processados com Sucesso" value={String(processed)} />
        <StatCard label="Pendentes / Recebidos" value={String(pending)} />
        <StatCard label="Falhas" value={String(failed)} />
      </div>

      {/* 📋 SEÇÃO 2: HISTÓRICO DE EVENTOS EM TEMPO REAL */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0] pb-3">
          <h2 className="text-[14px] font-bold text-[#1f2328] flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#e74c3c] animate-pulse" />
            Histórico de Eventos Recebidos
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Buscar por tópico ou recurso..." value={search} onChange={setSearch} />
            <select
              value={filterMp}
              onChange={e => setFilterMp(e.target.value)}
              className="h-10 px-3 border border-[#e6e6e6] rounded-xl text-[12px] text-[#666] bg-white focus:outline-none focus:border-[#84cc16]"
            >
              <option value="all">Todos os canais</option>
              <option value="mercadolivre">Mercado Livre</option>
              <option value="shopee">Shopee</option>
              <option value="tiktok">TikTok</option>
              <option value="magalu">Magalu</option>
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="p-10 text-center bg-[#fafafa] rounded-xl border border-dashed border-[#e0e0e0]">
            <Webhook className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
            <p className="text-[13px] font-bold text-[#333]">Nenhum evento registrado no momento</p>
            <p className="text-[11px] text-[#999] mt-0.5">
              Os eventos recebidos dos webhooks do Mercado Livre e demais canais serão listados aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] text-[#888] font-bold uppercase text-[10px] border-b border-[#eee]">
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Canal</th>
                  <th className="py-2.5 px-3">Tópico / Evento</th>
                  <th className="py-2.5 px-3">Recurso (Resource)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee]">
                {list.map(e => (
                  <tr key={e.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3 text-[11px] text-[#777] whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-[#333]">
                        <MarketplaceLogo name={e.marketplace_id === 'mercadolivre' ? 'Mercado Livre' : e.marketplace_id} className="w-4 h-4" />
                        <span>{e.marketplace_id === 'mercadolivre' ? 'Mercado Livre' : e.marketplace_id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#5c8a00] font-bold">
                      {e.event_type || 'orders_v2'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#555]">
                      {e.resource || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f5e9] text-[#2e7d32]">
                        <CheckCircle2 className="w-3 h-3" />
                        {e.processed ? 'PROCESSADO' : 'RECEBIDO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
