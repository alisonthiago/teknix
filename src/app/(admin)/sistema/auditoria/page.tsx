'use client'

import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'

const auditLogs = [
  { user: 'Alison', action: 'Alterou preço', target: 'FONE001', detail: 'R$ 89,90 → R$ 94,90', date: '17/08 20:34', ip: '189.54.xx.xx' },
  { user: 'Alison', action: 'Criou produto', target: 'CABO002', detail: 'Cabo Lightning 1m', date: '17/08 18:40', ip: '189.54.xx.xx' },
  { user: 'Alison', action: 'Alterou permissão', target: 'Maria Souza', detail: 'Função: SEPARADOR', date: '15/08 09:00', ip: '189.54.xx.xx' },
  { user: 'Alison', action: 'Excluiu produto', target: 'TEST001', detail: 'Produto de teste', date: '14/08 11:30', ip: '189.54.xx.xx' },
  { user: 'Pedro Lima', action: 'Alterou configuração', target: 'Financeiro', detail: 'Taxa ICMS: 17% → 18%', date: '13/08 14:00', ip: '189.54.xx.xx' },
]

export default function AuditoriaPage() {
  return (
    <ConfigSubLayout title="Auditoria" description="Log de todas as alterações realizadas no sistema">
      <ConfigSection title="Registros recentes">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#f5f5f5]">
                <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Data</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Usuário</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Ação</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Registro</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Detalhe</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {auditLogs.map((log, i) => (
                <tr key={i} className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-3 text-[#999]">{log.date}</td>
                  <td className="py-2.5 px-3 font-medium text-[#333]">{log.user}</td>
                  <td className="py-2.5 px-3 text-[#333]">{log.action}</td>
                  <td className="py-2.5 px-3 font-mono text-[#999]">{log.target}</td>
                  <td className="py-2.5 px-3 text-[#666]">{log.detail}</td>
                  <td className="py-2.5 px-3 text-[#999] font-mono text-[10px]">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ConfigSection>
    </ConfigSubLayout>
  )
}
