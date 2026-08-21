'use client'

import { AlertTriangle, CheckCircle2, XCircle, Info, X, ExternalLink, Calendar, Layers } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

interface ProductDiagnosticModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    name: string
    sku: string
    status: string
    stock: number
    notes?: string
    brand?: string
  } | null
}

export default function ProductDiagnosticModal({
  isOpen,
  onClose,
  product
}: ProductDiagnosticModalProps) {
  if (!isOpen || !product) return null

  let parsedNotes: any = null
  if (product.notes) {
    try {
      parsedNotes = JSON.parse(product.notes)
    } catch {
      parsedNotes = { reason: product.notes }
    }
  }

  const isBlocked = product.status === 'BLOCKED' || product.status === 'BANNED'
  const isPaused = product.status === 'PAUSED'
  const isLocked = product.status === 'LOCKED'
  const isOutOfStock = Number(product.stock || 0) <= 0

  const marketplaceName = parsedNotes?.marketplace || 'Mercado Livre'
  const statusDisplay = parsedNotes?.status || (isBlocked ? 'Bloqueado' : isPaused ? 'Pausado' : isLocked ? 'Travado' : isOutOfStock ? 'Sem Estoque' : 'Ativo')
  const reasonDisplay = parsedNotes?.reason || (
    isBlocked ? 'Anúncio bloqueado pela plataforma ou sob moderação de política de catálogo.' :
    isPaused ? 'Anúncio pausado manualmente pelo operador no painel TEKNIX.' :
    isLocked ? 'Trava de preço e estoque ativada pelo operador.' :
    isOutOfStock ? 'Estoque físico zerado no depósito.' :
    'Produto sincronizado e sem pendências no marketplace.'
  )
  const eventDate = parsedNotes?.date ? new Date(parsedNotes.date).toLocaleString('pt-BR') : 'Hoje às 03:00'
  const errorCode = parsedNotes?.code || (isBlocked ? 'ITEM_MODERATION_REVIEW' : 'STATUS_OK')

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-[#e6e6e6]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#3483fa]" />
            <h3 className="text-[14px] font-black text-[#111]">Diagnóstico do Marketplace & Situação</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f0f0f0] text-[#777] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-[#fafafa] rounded-xl border border-[#eee]">
            <p className="text-xs font-bold text-[#111]">{product.name}</p>
            <p className="text-[11px] font-mono text-[#777] mt-0.5">SKU: {product.sku}</p>
          </div>

          {/* Cards Formatados Conforme Solicitado */}
          <div className="p-4 rounded-2xl border border-[#e6e6e6] bg-white space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#f0f0f0]">
              <span className="text-[11px] font-bold text-[#777] uppercase">Marketplace</span>
              <div className="flex items-center gap-1.5 font-extrabold text-[#111] text-xs">
                <MarketplaceLogo name={marketplaceName} className="w-4 h-4" />
                <span>{marketplaceName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-[#f0f0f0]">
              <span className="text-[11px] font-bold text-[#777] uppercase">Status Atual</span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                isBlocked ? 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]' :
                isPaused ? 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]' :
                isLocked ? 'bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]' :
                'bg-[#ecfdf5] text-[#16a34a] border-[#bbf7d0]'
              }`}>
                {statusDisplay}
              </span>
            </div>

            <div className="space-y-1 pb-2.5 border-b border-[#f0f0f0]">
              <span className="text-[11px] font-bold text-[#777] uppercase block">Motivo do Bloqueio / Situação</span>
              <p className="text-[12px] font-semibold text-[#222] bg-[#f8f9fa] p-2.5 rounded-xl border border-[#eee] leading-relaxed">
                {reasonDisplay}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#777] uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#888]" /> Data do Evento:
              </span>
              <span className="font-bold text-[#111]">{eventDate}</span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#999] pt-1">
              <span>Código Retornado pela API:</span>
              <code className="font-mono bg-[#eee] px-1.5 py-0.5 rounded text-[#444]">{errorCode}</code>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#111] hover:bg-[#222] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Fechar Diagnóstico
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
