'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import ColaboradorModal from '@/components/ColaboradorModal'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import { deleteColaborador } from '@/app/actions/colaboradores'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  status: string
  last_login: string | null
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', GESTOR: 'Gestor', FINANCEIRO: 'Financeiro',
  ESTOQUE: 'Estoque', SEPARADOR: 'Separador', EXPEDICAO: 'Expedição',
  VENDEDOR: 'Vendedor', OPERADOR: 'Operador', VISUALIZADOR: 'Visualizador',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-[#f0f7ff] text-[#3483fa]', GESTOR: 'bg-[#f0f0ff] text-[#6c5ce7]',
  FINANCEIRO: 'bg-[#f0fff4] text-[#38a169]', ESTOQUE: 'bg-[#fffaf0] text-[#e67e22]',
  SEPARADOR: 'bg-[#fff5f5] text-[#e74c3c]', VENDEDOR: 'bg-[#f5f5f5] text-[#666]',
}

export default function ColaboradoresPage() {
  const [showModal, setShowModal] = useState(false)
  const [colabToEdit, setColabToEdit] = useState<Profile | null>(null)
  const [colabToDelete, setColabToDelete] = useState<Profile | null>(null)
  
  const { data: users, loading, error, refetch } = useSupabaseQuery<Profile[]>(async (s) => {
    const { data, error } = await s.from('profiles').select('*').order('name')
    if (error) throw error
    return (data || []) as Profile[]
  })

  const handleEdit = (user: Profile) => {
    setColabToEdit(user)
    setShowModal(true)
  }

  const handleDelete = (user: Profile) => {
    if (user.email === 'alison@tektou.com') {
      alert('O usuário Master não pode ser excluído.')
      return
    }
    setColabToDelete(user)
  }

  const confirmDelete = async () => {
    if (!colabToDelete) return
    const res = await deleteColaborador(colabToDelete.id)
    if (res.success) {
      refetch()
    } else {
      alert(res.error || 'Erro ao excluir colaborador.')
    }
    setColabToDelete(null)
  }

  return (
    <ConfigSubLayout title="Colaboradores" description="Pessoas que operam o TEKNIX">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-4">
        <div className="flex gap-4 text-[12px] text-[#999]">
          {loading ? (
            <span>Carregando...</span>
          ) : error ? (
            <span className="text-[#e74c3c]">Erro ao carregar</span>
          ) : (
            <>
              <span><strong className="text-[#333]">{users?.length || 0}</strong> total</span>
              <span><strong className="text-[#38a169]">{users?.filter(u => u.status === 'ACTIVE').length || 0}</strong> ativos</span>
            </>
          )}
        </div>
        <button onClick={() => { setColabToEdit(null); setShowModal(true); }} className="w-full sm:w-auto min-h-[44px] px-3 py-1.5 bg-[#3483fa] text-white text-[11px] font-medium rounded-md hover:bg-[#2968c8] transition-colors flex items-center gap-1 justify-center">
          <Plus className="w-3.5 h-3.5" /> Adicionar colaborador
        </button>
      </div>

      <ColaboradorModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={() => refetch()} 
        colaborador={colabToEdit} 
      />

      <ConfigSection title="Colaboradores">
        {loading ? (
          <div className="text-[13px] text-[#999] py-4 text-center">Carregando colaboradores...</div>
        ) : error ? (
          <div className="text-[13px] text-[#e74c3c] py-4 text-center">Erro ao carregar colaboradores.</div>
        ) : !users?.length ? (
          <div className="text-[13px] text-[#999] py-4 text-center">Nenhum colaborador encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#f5f5f5]">
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Nome</th>
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">E-mail</th>
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Função</th>
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Último acesso</th>
                  <th className="text-center py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Status</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-3 font-medium text-[#333]">{u.name} {u.email === 'alison@tektou.com' && <span className="ml-2 text-[10px] bg-[#333] text-white px-1.5 py-0.5 rounded">MASTER</span>}</td>
                    <td className="py-2.5 px-3 text-[#999]">{u.email}</td>
                    <td className="py-2.5 px-3"><span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${ROLE_COLORS[u.role] || 'bg-[#f5f5f5] text-[#666]'}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td className="py-2.5 px-3 text-[#999]">{u.last_login ? new Date(u.last_login).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="py-2.5 px-3 text-center"><span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${u.status === 'ACTIVE' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#999]'}`}>{u.status === 'ACTIVE' ? 'Ativo' : u.status}</span></td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(u)} className="p-1.5 rounded hover:bg-[#e6e6e6] text-[#666] transition-colors" title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.email !== 'alison@tektou.com' && (
                          <button onClick={() => handleDelete(u)} className="p-1.5 rounded hover:bg-[#fff5f5] text-[#e74c3c] transition-colors" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ConfigSection>

      <DeleteConfirmationModal
        isOpen={!!colabToDelete}
        onClose={() => setColabToDelete(null)}
        onConfirm={confirmDelete}
        itemName={colabToDelete?.name}
        description={`Esta ação removerá o acesso do colaborador ${colabToDelete?.name} ao sistema.`}
      />
    </ConfigSubLayout>
  )
}
