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

  const isConfirmed = confirmationText.trim().toUpperCase() === actionWord.toUpperCase()

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm()
      setConfirmationText('')
    }
  }

  const handleClose = () => {
    setConfirmationText('')
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-[4px] z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200" 
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-3xl border border-[#e6e6e6] w-full max-w-[440px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-6 sm:p-8 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Topo com Ícone de Alerta e Botão Fechar */}
        <div className="flex items-start justify-between gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-[#111111] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Título e Texto com área de respiro limpa */}
        <div className="mt-4 space-y-1.5">
          <h2 className="text-[17px] font-bold text-[#111111] tracking-tight">
            Confirmar {actionTitle}
          </h2>
          <p className="text-[13.5px] text-[#475569] leading-relaxed">
            Deseja realmente excluir <strong className="text-[#111111] font-semibold">"{itemName || 'este item'}"</strong>? Esta ação é irreversível.
          </p>
          {description && (
            <p className="text-xs text-[#94a3b8] leading-relaxed pt-1">
              {description}
            </p>
          )}
        </div>

        {/* Campo de Confirmação Objetivo */}
        <div className="mt-5 space-y-2">
          <label className="block text-xs font-medium text-[#64748b]">
            Digite <span className="font-mono font-bold text-[#dc2626] bg-[#fef2f2] px-1.5 py-0.5 rounded border border-[#fecaca] tracking-wider">{actionWord}</span> para confirmar:
          </label>
          <input 
            type="text" 
            placeholder={`Digite ${actionWord}`}
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isConfirmed) {
                e.preventDefault()
                handleConfirm()
              }
            }}
            className="w-full h-11 px-3.5 border-2 border-[#e2e8f0] focus:border-[#dc2626] focus:ring-4 focus:ring-[#fee2e2] rounded-xl text-sm font-mono font-bold text-[#111111] placeholder:text-[#cbd5e1] placeholder:font-sans placeholder:font-normal focus:outline-none transition-all uppercase tracking-wider"
            autoFocus
          />
        </div>

        {/* Ações com Botões Espaçosos */}
        <div className="flex items-center gap-3 mt-6 pt-1">
          <button 
            type="button"
            onClick={handleClose}
            className="flex-1 h-11 px-4 border border-[#e2e8f0] text-[#475569] hover:text-[#111111] text-xs font-bold rounded-xl hover:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className="flex-1 h-11 px-5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
