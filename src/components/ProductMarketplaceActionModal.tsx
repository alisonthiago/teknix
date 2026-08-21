'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, PauseCircle, PlayCircle, Lock, Unlock, RefreshCw, X, Loader2 } from 'lucide-react'

interface ProductMarketplaceActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  productName: string
  sku: string
  action: 'pause' | 'activate' | 'block' | 'unblock' | 'lock' | 'unlock' | 'sync' | null
  marketplaceName?: string
}

export default function ProductMarketplaceActionModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  sku,
  action,
  marketplaceName = 'Mercado Livre'
}: ProductMarketplaceActionModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !action) return null

  const getActionConfig = () => {
    switch (action) {
      case 'pause':
        return {
          title: `Pausar Anúncio no ${marketplaceName}`,
          icon: PauseCircle,
          iconColor: 'text-[#f59e0b]',
          btnColor: 'bg-[#f59e0b] hover:bg-[#d97706] text-white',
          confirmQuestion: `Deseja realmente pausar este produto no ${marketplaceName}?`,
          detail: `O anúncio deixará de receber visitas e vendas no marketplace até que você o ative novamente.`,
          btnText: 'Sim, Pausar Anúncio'
        }
      case 'activate':
        return {
          title: `Ativar Anúncio no ${marketplaceName}`,
          icon: PlayCircle,
          iconColor: 'text-[#16a34a]',
          btnColor: 'bg-[#16a34a] hover:bg-[#15803d] text-white',
          confirmQuestion: `Deseja ativar e reabrir as vendas deste produto no ${marketplaceName}?`,
          detail: `O produto ficará ativo imediatamente e voltará a receber pedidos nos canais conectados.`,
          btnText: 'Sim, Ativar Produto'
        }
      case 'block':
        return {
          title: `Bloquear Produto no Sistema`,
          icon: Lock,
          iconColor: 'text-[#ef4444]',
          btnColor: 'bg-[#ef4444] hover:bg-[#dc2626] text-white',
          confirmQuestion: `Deseja bloquear este produto?`,
          detail: `O produto será suspenso e não será sincronizado automaticamente com os marketplaces.`,
          btnText: 'Sim, Bloquear Produto'
        }
      case 'unblock':
        return {
          title: `Desbloquear Produto`,
          icon: Unlock,
          iconColor: 'text-[#16a34a]',
          btnColor: 'bg-[#111] hover:bg-[#222] text-white',
          confirmQuestion: `Deseja desbloquear este produto?`,
          detail: `O produto voltará ao status ativo normal de operação.`,
          btnText: 'Sim, Desbloquear'
        }
      case 'lock':
        return {
          title: `Travar Alterações Automáticas`,
          icon: Lock,
          iconColor: 'text-[#6366f1]',
          btnColor: 'bg-[#6366f1] hover:bg-[#4f46e5] text-white',
          confirmQuestion: `Deseja travar o preço e estoque deste produto?`,
          detail: `Nenhuma regra automática ou precificador alterará este item até que você o destrave.`,
          btnText: 'Sim, Travar Produto'
        }
      case 'unlock':
        return {
          title: `Destravar Produto`,
          icon: Unlock,
          iconColor: 'text-[#111]',
          btnColor: 'bg-[#111] hover:bg-[#222] text-white',
          confirmQuestion: `Deseja destravar este produto?`,
          detail: `O produto voltará a aceitar atualizações normais automáticas.`,
          btnText: 'Sim, Destravar'
        }
      case 'sync':
        return {
          title: `Sincronizar com ${marketplaceName}`,
          icon: RefreshCw,
          iconColor: 'text-[#0284c7]',
          btnColor: 'bg-[#0284c7] hover:bg-[#0369a1] text-white',
          confirmQuestion: `Deseja sincronizar este produto com a API do ${marketplaceName}?`,
          detail: `Os dados de estoque, preço e status serão atualizados diretamente com a plataforma externa.`,
          btnText: 'Sincronizar Agora'
        }
    }
  }

  const config = getActionConfig()
  const Icon = config.icon

  const handleExecute = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[#e6e6e6]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
            <h3 className="text-[14px] font-black text-[#111]">{config.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f0f0f0] text-[#777] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-[#fafafa] rounded-xl border border-[#eee]">
            <p className="text-xs font-bold text-[#111] line-clamp-2">{productName}</p>
            <p className="text-[11px] font-mono text-[#777] mt-0.5">SKU: {sku}</p>
          </div>

          <div>
            <p className="text-sm font-black text-[#111]">{config.confirmQuestion}</p>
            <p className="text-xs text-[#666] mt-1 leading-relaxed">{config.detail}</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[#e6e6e6] bg-[#fafafa] hover:bg-[#eee] text-[#555] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleExecute}
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${config.btnColor} disabled:opacity-50`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Processando...' : config.btnText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
