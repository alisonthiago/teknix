'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Webhook, RefreshCw, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react'
import { PageHeader, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

const STATUS_STYLES: Record<string, string> = {
  received: 'bg-[#f0f7ff] text-[#3483fa]',
  processed: 'bg-[#f0fff4] text-[#38a169]',
  failed: 'bg-[#fff5f5] text-[#e74c3c]',
  pending: 'bg-[#fffaf0] text-[#e67e22]',
}

export default function WebhooksPage() {
  const [search, setSearch] = useState('')
  const [filterMp, setFilterMp] = useState('all')

  const { data: events, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('marketplace_webhook_events')
      .select('*, marketplaces(name, code, logo), marketplace_accounts(account_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data || []
  })

  const { data: marketplaces } = useSupabaseQuery(async (s) => {
    const { data } = await s.from('marketplaces').select('id, name, code, logo').order('name')
    return data || []
  })

  const list = (events || []).filter((e: Record<string, unknown>) => {
    const mp = e.marketplaces as Record<string, unknown> | null
    if (filterMp !== 'all' && mp?.code !== filterMp) return false
    if (search) {
      const eventType = String(e.event_type || '').toLowerCase()
      const status = String(e.status || '').toLowerCase()
      if (!eventType.includes(search.toLowerCase()) && !status.includes(search.toLowerCase())) return false
    }
    return true
  })

  const total = list.length
  const processed = list.filter((e: Record<string, unknown>) => e.status === 'processed').length
  const failed = list.filter((e: Record<string, unknown>) => e.status === 'failed').length
  const pending = list.filter((e: Record<string, unknown>) => e.status === 'received' || e.status === 'pending').length

  return (
    <div className="mp-stack">
      <div className="mb-4">
        <Link href="/sistema" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Sistema
        </Link>
      </div>
      <PageHeader title="Monitoramento de Webhooks" description="Eventos recebidos dos marketplaces em tempo real" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total" value={String(total)} />
        <StatCard label="Processados" value={String(processed)} />
        <StatCard label="Pendentes" value={String(pending)} />
        <StatCard label="Falhas" value={String(failed)} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-4">
        <SearchInput placeholder="Buscar evento..." value={search} onChange={setSearch} />
        <select value={filterMp} onChange={e => setFilterMp(e.target.value)} className="w-full sm:w-auto min-h-[44px] px-3 border border-[#e6e6e6] rounded-lg text-[12px] text-[#666] focus:outline-none focus:border-[#3483fa] bg-white">
          <option value="all">Todos marketplaces</option>
          {(marketplaces || []).map((m: Record<string, unknown>) => (
            <option key={m.code as string} value={m.code as string}>{m.name as string}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando eventos...</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center">
          <Webhook className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
          <p className="text-[13px] font-medium text-[#333]">Nenhum evento recebido</p>
          <p className="text-[11px] text-[#999]">Webhooks aparecerão aqui quando marketplaces enviarem eventos</p>
        </div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th>Data/Hora</Th><Th>Marketplace</Th><Th>Conta</Th><Th>Evento</Th><Th className="text-center">Status</Th><Th>IP</Th><Th className="text-right">Duração</Th>
          </TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {list.map((e: Record<string, unknown>) => {
              const mp = e.marketplaces as Record<string, unknown> | null
              const acc = e.marketplace_accounts as Record<string, unknown> | null
              const st = String(e.status || 'pending')
              return (
                <tr key={e.id as string} className="hover:bg-[#fafafa] transition-colors">
                  <Td className="text-[11px] text-[#999] whitespace-nowrap">
                    {e.created_at ? new Date(e.created_at as string).toLocaleString('pt-BR') : '—'}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      {typeof mp?.logo === 'string' && <MarketplaceLogo name={mp.name as string} className="w-4 h-4" />}
                      <span className="text-[11px] text-[#999]">{(mp?.name as string) || '—'}</span>
                    </div>
                  </Td>
                  <Td className="text-[11px] text-[#999]">{(acc?.account_name as string) || '—'}</Td>
                  <Td className="font-mono text-[11px] text-[#333]">{(e.event_type as string) || '—'}</Td>
                  <Td className="text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-[2px] rounded text-[10px] font-medium ${STATUS_STYLES[st] || 'bg-[#f5f5f5] text-[#999]'}`}>
                      {st === 'processed' && <CheckCircle2 className="w-3 h-3" />}
                      {st === 'failed' && <XCircle className="w-3 h-3" />}
                      {st === 'pending' && <Clock className="w-3 h-3" />}
                      {st}
                    </span>
                  </Td>
                  <Td className="text-[11px] text-[#999] font-mono">{(e.source_ip as string) || '—'}</Td>
                  <Td className="text-[11px] text-[#999] text-right">{e.duration_ms ? `${e.duration_ms}ms` : '—'}</Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
    </div>
  )
}
