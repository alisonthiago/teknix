'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createCollaborator } from '@/app/(admin)/sistema/permissoes/actions'

interface CreateCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCollaboratorModal({ isOpen, onClose, onSuccess }: CreateCollaboratorModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await createCollaborator(formData)
    
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="flex items-center justify-between p-5 border-b border-[#f0f0f0]">
          <h2 className="text-[16px] font-semibold text-[#333]">Adicionar Colaborador</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#999] hover:bg-[#f5f5f5] hover:text-[#333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-[#fff5f5] text-[#e74c3c] p-3 rounded-xl text-sm border border-[#fbd4d4]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[#666] mb-1.5">Nome Completo</label>
            <input 
              name="name" 
              required 
              placeholder="Ex: João Silva"
              className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#666] mb-1.5">Email</label>
            <input 
              type="email"
              name="email" 
              required 
              placeholder="joao@empresa.com"
              className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#666] mb-1.5">Senha de Acesso</label>
            <input 
              type="text"
              name="password" 
              required 
              minLength={6}
              placeholder="Crie uma senha inicial"
              className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#666] mb-1.5">Função (Cargo)</label>
            <select 
              name="role" 
              required
              className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333] bg-white"
            >
              <option value="ADMIN">ADMIN - Acesso total ao sistema</option>
              <option value="GERENTE">GERENTE - Gerenciamento e supervisão</option>
              <option value="FINANCEIRO">FINANCEIRO - Acesso a relatórios e finanças</option>
              <option value="OPERATOR">OPERATOR - Operador logístico padrão</option>
              <option value="SEPARADOR">SEPARADOR - Separação de pedidos (Picking)</option>
              <option value="EXPEDICAO">EXPEDIÇÃO - Empacotamento e envio (Packing)</option>
              <option value="VENDEDOR">VENDEDOR - Acesso a vendas e clientes</option>
              <option value="ESTOQUE">ESTOQUE - Controle de inventário</option>
              <option value="CONSULTA">CONSULTA - Acesso restrito a operações e pedidos</option>
            </select>
            <p className="text-[10px] text-[#999] mt-1.5">A função define quais páginas e ações este colaborador terá acesso de acordo com o quadro de permissões.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-[#e6e6e6] text-[#666] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#3483fa] hover:bg-[#2968c8] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
