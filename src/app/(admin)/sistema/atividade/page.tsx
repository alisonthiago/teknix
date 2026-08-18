'use client'

import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

interface AuditLog {
  id: string
  action: string
  detail: string | null
  device: string | null
  ip: string | null
  created_at: string
}

export default function AtividadePage() {
  const { data: logs, loading, error } = useSupabaseQuery<AuditLog[]>(async (s) => {
    const { data, error } = await s.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return (data || []) as AuditLog[]
  })

  return (
    <ConfigSubLayout title="Atividade da conta" description="Histórico de acessos e alterações realizadas">
      <ConfigSection title="Atividade recente">
        {loading ? (
          <div className="text-[13px] text-[#999] py-4 text-center">Carregando atividade...</div>
        ) : error ? (
          <div className="text-[13px] text-[#e74c3c] py-4 text-center">Erro ao carregar atividade.</div>
        ) : !logs?.length ? (
          <div className="text-[13px] text-[#999] py-4 text-center">Nenhuma atividade registrada.</div>
        ) : (
          <div className="divide-y divide-[#f5f5f5]">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3483fa] mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#333]">{log.action}</span>
                    {log.detail && <span className="text-[11px] text-[#999]">— {log.detail}</span>}
                  </div>
                  <div className="text-[10px] text-[#ccc] mt-0.5">{log.device || ''} {log.device && '• '}IP: {log.ip || '—'}</div>
                </div>
                <span className="text-[10px] text-[#999] flex-shrink-0">{new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </ConfigSection>
    </ConfigSubLayout>
  )
}
