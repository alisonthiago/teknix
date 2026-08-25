'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { Eye, EyeOff, Smartphone } from 'lucide-react'

export default function SegurancaPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)

  return (
    <ConfigSubLayout title="Segurança" description="Gerencie a segurança da sua conta">
      <ConfigSection title="Alterar senha">
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5">Senha atual</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full px-3 py-2 pr-10 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#1f2328] transition-colors" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#666]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#999] mb-1.5">Nova senha</label>
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#1f2328] transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] text-[#999] mb-1.5">Confirmar nova senha</label>
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#1f2328] transition-colors" />
            </div>
          </div>
          <button className="px-4 py-2 bg-[#1f2328] text-white text-[12px] font-medium rounded-md hover:bg-[#111827] transition-colors">
            Alterar senha
          </button>
        </div>
      </ConfigSection>

      <ConfigSection title="Autenticação em dois fatores">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#333]">Autenticação em dois fatores (2FA)</p>
            <p className="text-[11px] text-[#999] mt-0.5">Adicione uma camada extra de segurança à sua conta.</p>
          </div>
          <button onClick={() => setTwoFactor(!twoFactor)} className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${twoFactor ? 'bg-[#1f2328]' : 'bg-[#ccc]'}`}>
            <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${twoFactor ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
          </button>
        </div>
      </ConfigSection>

      <ConfigSection title="Sessões ativas">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#999]" />
              <div>
                <p className="text-[12px] font-medium text-[#333]">MacBook — Chrome</p>
                <p className="text-[10px] text-[#999]">São Paulo, SP • Ativo agora</p>
              </div>
            </div>
            <span className="text-[10px] text-[#38a169] font-medium">Atual</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#999]" />
              <div>
                <p className="text-[12px] font-medium text-[#333]">iPhone — Safari</p>
                <p className="text-[10px] text-[#999]">São Paulo, SP • Último acesso há 2 horas</p>
              </div>
            </div>
            <button className="text-[10px] text-[#e74c3c] hover:underline">Encerrar</button>
          </div>
        </div>
      </ConfigSection>
    </ConfigSubLayout>
  )
}
