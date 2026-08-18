'use client'

import { useState } from 'react'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

interface ConnectAccountModalProps {
  marketplaceId: string
  marketplaceName: string
  onClose: () => void
  onConnected: () => void
}

export default function ConnectAccountModal({ marketplaceId, marketplaceName, onClose, onConnected }: ConnectAccountModalProps) {
  const [step, setStep] = useState<'form' | 'connecting' | 'success' | 'error'>('form')
  const [accountName, setAccountName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim()) return

    setStep('connecting')

    // Simulate OAuth flow
    try {
      await new Promise(r => setTimeout(r, 2500))
      setStep('success')
    } catch {
      setErrorMsg('Erro ao conectar conta. Tente novamente.')
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-[calc(100%-24px)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e6e6]">
          <div className="flex items-center gap-3">
            <MarketplaceLogo name={marketplaceName} className="w-8 h-8" />
            <div>
              <h2 className="text-sm font-semibold text-[#333]">Conectar conta</h2>
              <p className="text-xs text-[#999]">{marketplaceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors">
            <X className="w-4 h-4 text-[#666]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#333] mb-1.5">Nome da conta *</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="Ex: Loja Principal, Loja Eletrônicos..."
                  className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm text-[#333] placeholder:text-[#ccc] focus:outline-none focus:border-[#3483fa] transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1.5">CNPJ (opcional)</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm text-[#333] placeholder:text-[#ccc] focus:outline-none focus:border-[#3483fa] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1.5">Seller ID (opcional)</label>
                  <input
                    type="text"
                    value={sellerId}
                    onChange={e => setSellerId(e.target.value)}
                    placeholder="ID do vendedor"
                    className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm text-[#333] placeholder:text-[#ccc] focus:outline-none focus:border-[#3483fa] transition-colors"
                  />
                </div>
              </div>

              <div className="bg-[#f8f9fa] border border-[#e6e6e6] rounded-md p-4">
                <p className="text-xs text-[#666] leading-relaxed">
                  Ao clicar em <strong>&quot;Autorizar&quot;</strong>, você será redirecionado para o {marketplaceName} para autorizar o acesso.
                   O TEKNIX receberá apenas os dados necessários para operação (pedidos, vendas, estoque, etc).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 w-full sm:w-auto min-h-[44px] px-4 py-2.5 border border-[#e6e6e6] text-[#666] text-sm font-medium rounded-lg hover:bg-[#f5f5f5] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Autorizar
                </button>
              </div>
            </form>
          )}

          {step === 'connecting' && (
            <div className="py-12 text-center">
              <Loader2 className="w-10 h-10 text-[#3483fa] animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-[#333]">Conectando com {marketplaceName}...</p>
              <p className="text-xs text-[#999] mt-1">Aguarde a autorização</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#f0fff4] flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#38a169]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#333]">Conta conectada!</p>
              <p className="text-xs text-[#999] mt-1">{accountName} foi conectada ao {marketplaceName}.</p>
              <button
                onClick={onConnected}
                className="mt-6 bg-[#3483fa] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors"
              >
                Concluído
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#fff5f5] flex items-center justify-center mx-auto mb-4">
                <X className="w-7 h-7 text-[#e74c3c]" />
              </div>
              <p className="text-sm font-semibold text-[#333]">Erro na conexão</p>
              <p className="text-xs text-[#999] mt-1">{errorMsg}</p>
              <button
                onClick={() => setStep('form')}
                className="mt-6 bg-[#3483fa] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
