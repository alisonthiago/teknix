'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createColaborador, updateColaborador } from '@/app/actions/colaboradores'

interface ColaboradorModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  colaborador?: any // If provided, it's edit mode
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', GESTOR: 'Gestor', FINANCEIRO: 'Financeiro',
  ESTOQUE: 'Estoque', SEPARADOR: 'Separador', EXPEDICAO: 'Expedição',
  VENDEDOR: 'Vendedor', OPERADOR: 'Operador', VISUALIZADOR: 'Visualizador',
}

export default function ColaboradorModal({ open, onClose, onSuccess, colaborador }: ColaboradorModalProps) {
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERADOR'
  })

  useEffect(() => {
    if (open) {
      if (colaborador) {
        setForm({
          name: colaborador.name || '',
          email: colaborador.email || '',
          password: '',
          role: colaborador.role || 'OPERADOR'
        })
      } else {
        setForm({ name: '', email: '', password: '', role: 'OPERADOR' })
      }
      setErrorMsg('')
    }
  }, [open, colaborador])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')

    if (!colaborador && !form.password) {
      setErrorMsg('A senha é obrigatória para novos colaboradores.')
      setSaving(false)
      return
    }

    try {
      let res
      if (colaborador) {
        res = await updateColaborador(colaborador.id, {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        })
      } else {
        res = await createColaborador({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        })
      }

      if (!res.success) {
        setErrorMsg(res.error || 'Erro desconhecido ao salvar colaborador.')
      } else {
        onSuccess()
        onClose()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-[4px] p-3 sm:p-4">
      <div className="bg-white rounded-[14px] border border-[#e6e6e6] w-full max-w-md shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e6e6] bg-white">
          <h2 className="text-[16px] font-semibold text-[#111111]">
            {colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#111111] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-[13px] font-medium">
              {errorMsg}
            </div>
          )}
          <form id="colab-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[12.5px] text-[#666666] mb-1.5 font-medium">Nome</Label>
              <Input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: João Silva"
                className="text-[13.5px]"
              />
            </div>
            <div>
              <Label className="text-[12.5px] text-[#666666] mb-1.5 font-medium">E-mail</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Ex: joao@empresa.com"
                className="text-[13.5px]"
                disabled={!!colaborador?.is_master}
              />
            </div>
            <div>
              <Label className="text-[12.5px] text-[#666666] mb-1.5 font-medium">
                Senha {colaborador && '(Deixe em branco para manter)'}
              </Label>
              <Input
                type="password"
                required={!colaborador}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={colaborador ? "Nova senha" : "Senha de acesso"}
                className="text-[13.5px]"
              />
            </div>
            <div>
              <Label className="text-[12.5px] text-[#666666] mb-1.5 font-medium">Função</Label>
              <select
                required
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-[#e6e6e6] bg-white text-sm shadow-none transition-colors focus-visible:outline-none focus-visible:border-[#111111]"
                disabled={!!colaborador?.is_master}
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-[#e6e6e6] flex justify-end gap-2.5 bg-[#fafafa]">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="colab-form" variant="default" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {colaborador ? 'Salvar Alterações' : 'Criar Colaborador'}
          </Button>
        </div>
      </div>
    </div>
  )
}
