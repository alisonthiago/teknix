'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { Plus, Eye, EyeOff, Copy, Trash2 } from 'lucide-react'

const keys = [
  { id: '1', name: 'Integração ML', key: 'tk_live_abc...xyz', created: '10/08/2026', last_used: '17/08 15:30', status: 'ACTIVE' },
  { id: '2', name: 'Webhook Tester', key: 'tk_test_def...uvw', created: '15/08/2026', last_used: '16/08 10:00', status: 'ACTIVE' },
]

export default function ApiPage() {
  const [showKey, setShowKey] = useState<string | null>(null)

  return (
    <ConfigSubLayout title="API e desenvolvedores" description="Gerencie chaves de API e acesso programático">
      <ConfigSection title="Chaves de API">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[11px] text-[#999]">{keys.length} chave(s) ativa(s)</p>
          <button className="px-3 py-1.5 bg-[#3483fa] text-white text-[11px] font-medium rounded-md hover:bg-[#2968c8] flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Criar chave
          </button>
        </div>
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
              <div>
                <p className="text-[12px] font-medium text-[#333]">{k.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[10px] font-mono text-[#999] bg-[#f0f0f0] px-2 py-0.5 rounded">
                    {showKey === k.id ? 'tk_live_abc123xyz789' : k.key}
                  </code>
                  <button onClick={() => setShowKey(showKey === k.id ? null : k.id)} className="text-[#ccc] hover:text-[#666]">
                    {showKey === k.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button className="text-[#ccc] hover:text-[#666]"><Copy className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-[#999]">Criada: {k.created}</p>
                  <p className="text-[10px] text-[#999]">Último uso: {k.last_used}</p>
                </div>
                <button className="text-[#ccc] hover:text-[#e74c3c]"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </ConfigSection>

      <ConfigSection title="Logs de API">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-[#f5f5f5]">
              <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Data</th>
              <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Serviço</th>
              <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Endpoint</th>
              <th className="text-center py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Status</th>
              <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Tempo</th>
            </tr></thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {[
                { date: '17/08 20:32', service: 'Mercado Livre', endpoint: 'GET /orders/123456', status: 200, time: '182ms' },
                { date: '17/08 20:30', service: 'Mercado Livre', endpoint: 'GET /products', status: 200, time: '245ms' },
                { date: '17/08 20:15', service: 'Shopee', endpoint: 'POST /sync', status: 500, time: '2100ms' },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-[#fafafa]">
                  <td className="py-2 px-3 text-[#999]">{log.date}</td>
                  <td className="py-2 px-3 text-[#333]">{log.service}</td>
                  <td className="py-2 px-3 font-mono text-[#999]">{log.endpoint}</td>
                  <td className="py-2 px-3 text-center"><span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${log.status === 200 ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#fff5f5] text-[#e74c3c]'}`}>{log.status}</span></td>
                  <td className="py-2 px-3 text-right text-[#999]">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ConfigSection>
    </ConfigSubLayout>
  )
}
