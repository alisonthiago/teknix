'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName?: string
  description?: string
  actionWord?: string
  actionTitle?: string
  buttonText?: string
}

export default function DeleteConfirmationModal({ 
  isOpen, onClose, onConfirm, itemName, description,
  actionWord = 'EXCLUIR',
  actionTitle = 'Exclusão',
  buttonText = 'Sim, Excluir'
}: DeleteConfirmationModalProps) {
  const [confirmationText, setConfirmationText] = useState('')

  if (!isOpen) return null

  const isConfirmed = confirmationText === actionWord

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm()
      setConfirmationText('')
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-[4px] z-[100] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-[14px] border border-[#e6e6e6] w-[calc(100%-24px)] sm:w-full sm:max-w-md shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e6e6] bg-white">
          <div className="flex items-center gap-2 text-[#dc2626]">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="text-[16px] font-semibold text-[#111111]">Confirmar {actionTitle}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#111111] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm text-[#333] mb-2">
              Você tem certeza que deseja {actionWord.toLowerCase()} <strong>{itemName || 'este item'}</strong>?
            </p>
            {description && <p className="text-xs text-[#666] leading-relaxed mb-4">{description}</p>}
            
            <p className="text-xs text-[#999] mb-2 font-medium">
              Para confirmar, digite a palavra <strong className="text-[#333]">{actionWord}</strong> (em maiúsculo) abaixo:
            </p>
            <input 
              type="text" 
              placeholder={`Digite ${actionWord}`}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isConfirmed) {
                  e.preventDefault()
                  handleConfirm()
                }
              }}
              className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-sm text-[#333] focus:outline-none focus:border-[#e74c3c] transition-colors"
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 w-full sm:w-auto min-h-[44px] px-4 py-2 border border-[#e6e6e6] text-[#666] text-sm font-medium rounded-lg hover:bg-[#f5f5f5] transition-colors"
            >
              Voltar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className="flex-1 w-full sm:w-auto min-h-[44px] px-4 py-2 bg-[#e74c3c] text-white text-sm font-semibold rounded-lg hover:bg-[#c0392b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
