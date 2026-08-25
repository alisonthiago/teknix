'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { PageHeader, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-[#f0fff4] text-[#38a169]',
  error: 'bg-[#fff5f5] text-[#e74c3c]',
  pending: 'bg-[#fffaf0] text-[#e67e22]',
}

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-[#f5f5f5] text-[#1f2328]',
  POST: 'bg-[#f0fff4] text-[#38a169]',
  PUT: 'bg-[#fffaf0] text-[#e67e22]',
  DELETE: 'bg-[#fff5f5] text-[#e74c3c]',
  PATCH: 'bg-[#f0f0ff] text-[#6c5ce7]',
}

export default function IntegracoesLogsPage() {
  const [search, setSearch] = useState('')
  const [filterMp, setFilterMp] = useState('all')
  const [filterAction, setFilterAction] = useState('all')

  const { data: logs, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('integration_logs')
      .select('*, marketplaces(name, code, logo), marketplace_accounts(account_name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return data || []
  })

  const { data: marketplaces } = useSupabaseQuery(async (s) => {
    const { data } = await s.from('marketplaces').select('id, name, code, logo').order('name')
    return data || []
  })

  const actions = [...new Set((logs || []).map((l: Record<string, unknown>) => l.action as string))].filter(Boolean)

  const list = (logs || []).filter((l: Record<string, unknown>) => {
    const mp = l.marketplaces as Record<string, unknown> | null
    if (filterMp !== 'all' && mp?.code !== filterMp) return false
    if (filterAction !== 'all' && l.action !== filterAction) return false
    if (search) {
      const endpoint = String(l.endpoint || '').toLowerCase()
      const action = String(l.action || '').toLowerCase()
      if (!endpoint.includes(search.toLowerCase()) && !action.includes(search.toLowerCase())) return false
    }
    return true
  })

  const total = list.length
  const successCount = list.filter((l: Record<string, unknown>) => l.status_code && Number(l.status_code) < 400).length
  const errorCount = list.filter((l: Record<string, unknown>) => l.status_code && Number(l.status_code) >= 400).length
  const avgDuration = list.length > 0 ? Math.round(list.reduce((a: number, l: Record<string, unknown>) => a + (Number(l.duration_ms) || 0), 0) / list.length) : 0

  return (
    <div className="mp-stack">
      <div className="mb-4">
        <Link href="/sistema" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Sistema
        </Link>
      </div>
      <PageHeader title="Logs de Integração" description="Chamadas API realizadas com marketplaces" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total" value={String(total)} />
        <StatCard label="Sucesso" value={String(successCount)} />
        <StatCard label="Erros" value={String(errorCount)} />
        <StatCard label="Duração Média" value={`${avgDuration}ms`} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-4">
        <SearchInput placeholder="Buscar log..." value={search} onChange={setSearch} />
        <div className="flex gap-2">
          <select value={filterMp} onChange={e => setFilterMp(e.target.value)} className="w-full sm:w-auto min-h-[44px] flex-1 sm:flex-none px-3 border border-[#e6e6e6] rounded-lg text-[12px] text-[#666] focus:outline-none focus:border-[#1f2328] bg-white">
            <option value="all">Todos marketplaces</option>
            {(marketplaces || []).map((m: Record<string, unknown>) => (
              <option key={m.code as string} value={m.code as string}>{m.name as string}</option>
            ))}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="w-full sm:w-auto min-h-[44px] flex-1 sm:flex-none px-3 border border-[#e6e6e6] rounded-lg text-[12px] text-[#666] focus:outline-none focus:border-[#1f2328] bg-white">
            <option value="all">Todas ações</option>
            {actions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando logs...</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center">
          <Activity className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
          <p className="text-[13px] font-medium text-[#333]">Nenhum log registrado</p>
          <p className="text-[11px] text-[#999]">Chamadas API aparecerão aqui</p>
        </div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th>Data/Hora</Th><Th>Marketplace</Th><Th>Ação</Th><Th>Método</Th><Th>Endpoint</Th><Th className="text-center">Status</Th><Th className="text-right">Duração</Th>
          </TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {list.map((l: Record<string, unknown>) => {
              const mp = l.marketplaces as Record<string, unknown> | null
              const method = String(l.method || 'GET').toUpperCase()
              const code = Number(l.status_code || 0)
              const isSuccess = code > 0 && code < 400
              return (
                <tr key={l.id as string} className="hover:bg-[#fafafa] transition-colors">
                  <Td className="text-[11px] text-[#999] whitespace-nowrap">
                    {l.created_at ? new Date(l.created_at as string).toLocaleString('pt-BR') : '—'}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      {typeof mp?.logo === 'string' && <MarketplaceLogo name={mp.name as string} className="w-4 h-4" />}
                      <span className="text-[11px] text-[#999]">{(mp?.name as string) || '—'}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-[11px] text-[#333]">{(l.action as string) || '—'}</Td>
                  <Td>
                    <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${METHOD_STYLES[method] || 'bg-[#f5f5f5] text-[#999]'}`}>
                      {method}
                    </span>
                  </Td>
                  <Td className="text-[11px] text-[#999] font-mono max-w-[200px] truncate">{(l.endpoint as string) || '—'}</Td>
                  <Td className="text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-[2px] rounded text-[10px] font-medium ${isSuccess ? 'bg-[#f0fff4] text-[#38a169]' : code >= 400 ? 'bg-[#fff5f5] text-[#e74c3c]' : 'bg-[#f5f5f5] text-[#999]'}`}>
                      {isSuccess && <CheckCircle2 className="w-3 h-3" />}
                      {code >= 400 && <XCircle className="w-3 h-3" />}
                      {code || '—'}
                    </span>
                  </Td>
                  <Td className="text-[11px] text-[#999] text-right">{l.duration_ms ? `${l.duration_ms}ms` : '—'}</Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
    </div>
  )
}
