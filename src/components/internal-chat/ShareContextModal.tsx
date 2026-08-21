'use client'

import React, { useState } from 'react'
import { useInternalChat } from '@/contexts/InternalChatContext'
import { MessageType } from '@/types/internal-chat'
import {
  X,
  Send,
  User,
  Users,
  MessageSquare,
  ShoppingCart,
  Package,
  FileText,
  Truck,
  Check,
  Loader2
} from 'lucide-react'

interface ShareContextModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  messageType: MessageType
  metadata: any
  defaultNote?: string
}

export default function ShareContextModal({
  isOpen,
  onClose,
  title,
  messageType,
  metadata,
  defaultNote = ''
}: ShareContextModalProps) {
  const { collaborators, conversations, shareToChat } = useInternalChat()
  const [selectedTarget, setSelectedTarget] = useState<string>(conversations[0]?.id || collaborators[0]?.id || '')
  const [note, setNote] = useState(defaultNote)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleShare = async () => {
    setLoading(true)
    try {
      const isGroup = conversations.some(c => c.id === selectedTarget && c.type === 'GROUP')
      await shareToChat({
        targetType: isGroup ? 'GROUP' : 'DIRECT',
        targetId: selectedTarget,
        content: note || `Compartilhado: ${title}`,
        messageType,
        metadata
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[#e6e6e6]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#3483fa]" />
            <h3 className="text-sm font-black text-[#111]">Compartilhar no Chat Interno</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f0f0f0] text-[#777] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Card Preview do que está sendo compartilhado */}
          <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b]">
              {messageType === 'CARD_ORDER' && <ShoppingCart className="w-3.5 h-3.5 text-[#3483fa]" />}
              {messageType === 'CARD_PRODUCT' && <Package className="w-3.5 h-3.5 text-[#16a34a]" />}
              {messageType === 'CARD_CUSTOMER' && <User className="w-3.5 h-3.5 text-[#6366f1]" />}
              {messageType === 'CARD_INVOICE' && <FileText className="w-3.5 h-3.5 text-[#0284c7]" />}
              {messageType === 'CARD_SHIPPING' && <Truck className="w-3.5 h-3.5 text-[#d97706]" />}
              <span>{title}</span>
            </div>
            <p className="text-xs font-bold text-[#1e293b]">{metadata.order_number || metadata.product_name || metadata.customer_name || 'Item Operacional'}</p>
            {metadata.total_amount && (
              <p className="text-xs font-black text-[#16a34a]">R$ {Number(metadata.total_amount).toFixed(2).replace('.', ',')}</p>
            )}
          </div>

          {/* Seleção do Destinatário */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#333] block">Enviar para:</label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#f1f5f9]">
              <p className="text-[10px] font-black uppercase text-[#94a3b8] tracking-wider pt-1">Grupos Operacionais</p>
              {conversations.filter(c => c.type === 'GROUP').map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedTarget(g.id)}
                  type="button"
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedTarget === g.id
                      ? 'border-[#111] bg-[#fafafa] shadow-2xs'
                      : 'border-[#eee] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3483fa]" />
                    <span className="text-xs font-bold text-[#1e293b]">{g.name}</span>
                  </div>
                  {selectedTarget === g.id && <Check className="w-4 h-4 text-[#111]" />}
                </button>
              ))}

              <p className="text-[10px] font-black uppercase text-[#94a3b8] tracking-wider pt-3">Colaboradores</p>
              {collaborators.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedTarget(c.id)}
                  type="button"
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedTarget === c.id
                      ? 'border-[#111] bg-[#fafafa] shadow-2xs'
                      : 'border-[#eee] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[10px] font-extrabold text-[#475569]">
                      {c.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1e293b] leading-tight">{c.name}</p>
                      <p className="text-[10px] text-[#64748b] leading-tight">{c.role}</p>
                    </div>
                  </div>
                  {selectedTarget === c.id && <Check className="w-4 h-4 text-[#111]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mensagem / Observação Opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#333] block">Mensagem (opcional):</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Favor emitir a nota fiscal ou priorizar separação..."
              rows={2}
              className="w-full p-3 bg-[#f8fafc] border border-[#d0d7de] rounded-xl text-xs text-[#333] focus:outline-none focus:bg-white focus:border-[#16a34a] transition-all resize-none"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[#e6e6e6] bg-[#fafafa] hover:bg-[#eee] text-[#555] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleShare}
              disabled={loading || !selectedTarget}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
              <span>{loading ? 'Enviando...' : 'Compartilhar no Chat'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
