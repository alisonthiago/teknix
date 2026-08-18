'use client'

import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { Smartphone, Monitor } from 'lucide-react'

const devices = [
  { name: 'MacBook', browser: 'Chrome', os: 'macOS', location: 'São Paulo, SP', last: 'Ativo agora', icon: Monitor, current: true },
  { name: 'iPhone 15', browser: 'Safari', os: 'iOS', location: 'São Paulo, SP', last: 'Há 2 horas', icon: Smartphone, current: false },
]

export default function SessoesPage() {
  return (
    <ConfigSubLayout title="Sessões e dispositivos" description="Dispositivos conectados e sessões ativas">
      <ConfigSection title="Dispositivos conectados">
        <div className="space-y-3">
          {devices.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
              <div className="flex items-center gap-3">
                <d.icon className="w-5 h-5 text-[#999]" />
                <div>
                  <p className="text-[12px] font-medium text-[#333]">{d.name} — {d.browser}</p>
                  <p className="text-[10px] text-[#999]">{d.location} • {d.last}</p>
                </div>
              </div>
              {d.current ? (
                <span className="text-[10px] text-[#38a169] font-medium">Atual</span>
              ) : (
                <button className="text-[10px] text-[#e74c3c] hover:underline">Encerrar sessão</button>
              )}
            </div>
          ))}
        </div>
      </ConfigSection>
    </ConfigSubLayout>
  )
}
