'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Plus } from 'lucide-react'
import CreateCollaboratorModal from '@/components/CreateCollaboratorModal'

interface Profile {
  id: string
  name: string
  role: string
}

interface Permission {
  code: string
  module: string
  description: string
}

interface RolePermission {
  role: string
  permission_code: string
}

const PAGE_LABELS: Record<string, string> = {
  products: 'Produtos', sales: 'Vendas', orders: 'Pedidos',
  picking: 'Separação', shipping: 'Expedição', inventory: 'Estoque',
  finance: 'Financeiro', revenue: 'Faturamento', cost: 'Custos',
  profit: 'Lucro', margin: 'Margem', reports: 'Relatórios',
  marketplaces: 'Marketplaces', settings: 'Configurações', users: 'Usuários',
  permissions: 'Permissões', imports: 'Importação', exports: 'Exportação',
  notifications: 'Notificações', dashboard: 'Dashboard'
}

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver', create: 'Criar', edit: 'Editar', delete: 'Excluir',
  manage: 'Gerenciar', execute: 'Executar', adjust: 'Ajustar',
  export: 'Exportar', connect: 'Conectar', use: 'Usar'
}

export default function PermissoesPage() {
  const { data: profiles, loading: profilesLoading } = useSupabaseQuery<Profile[]>(async (s) => {
    const { data, error } = await s.from('profiles').select('id, name, role').order('name')
    if (error) throw error
    return (data || []) as Profile[]
  })

  const { data: permissions, loading: permissionsLoading } = useSupabaseQuery<Permission[]>(async (s) => {
    const { data, error } = await s.from('permissions').select('*')
    if (error) throw error
    return (data || []) as Permission[]
  })

  const { data: rolePermissions, loading: rpLoading } = useSupabaseQuery<RolePermission[]>(async (s) => {
    const { data, error } = await s.from('role_permissions').select('*')
    if (error) throw error
    return (data || []) as RolePermission[]
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loading = profilesLoading || permissionsLoading || rpLoading

  const selectedProfile = profiles?.find(p => p.id === selectedId) || profiles?.[0]
  const userRole = selectedProfile?.role

  const refreshProfiles = () => {
    window.location.reload()
  }

  const allowedPerms = new Set(
    rolePermissions?.filter(rp => rp.role === userRole).map(rp => rp.permission_code) || []
  )

  const parsedPermissions = (permissions || []).map(p => {
    const [key, action] = p.code.split('.')
    return { code: p.code, key: key || p.code, action: action || 'view', module: p.module }
  })

  const allPermissionKeys = [...new Set(parsedPermissions.map(p => p.key))]
  const allActions = [...new Set(parsedPermissions.map(p => p.action))]

  return (
    <ConfigSubLayout title="Permissões" description="Controle o que cada colaborador pode ver e fazer">
      <ConfigSection title="Colaboradores">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[11px] text-[#999]">Selecione um colaborador para ver suas permissões</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-[#3483fa] text-white text-[11px] font-medium rounded-md hover:bg-[#2968c8] flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Colaborador
          </button>
        </div>
        {loading ? (
          <div className="text-[13px] text-[#999]">Carregando...</div>
        ) : !profiles?.length ? (
          <div className="text-[13px] text-[#999]">Nenhum colaborador encontrado.</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                    (selectedProfile?.id === p.id) ? 'bg-[#3483fa] text-white' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {selectedProfile && (
              <p className="text-[11px] text-[#999] mt-2">Função: <strong className="text-[#333]">{selectedProfile.role}</strong></p>
            )}
            <CreateCollaboratorModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              onSuccess={refreshProfiles} 
            />
          </>
        )}
      </ConfigSection>

      {selectedProfile && (
        <ConfigSection title={`Permissões de ${selectedProfile.name}`}>
          {loading ? (
            <div className="text-[13px] text-[#999] py-4 text-center">Carregando permissões...</div>
          ) : !allPermissionKeys.length ? (
            <div className="text-[13px] text-[#999] py-4 text-center">Nenhuma permissão configurada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#f5f5f5]">
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Módulo / Página</th>
                    {allActions.map((action, idx) => (
                      <th key={`th-${action}-${idx}`} className="text-center py-2 px-2 text-[10px] font-medium text-[#999] uppercase">{ACTION_LABELS[action] || action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f5]">
                  {allPermissionKeys.map((key, rowIdx) => (
                    <tr key={`tr-${key}-${rowIdx}`} className="hover:bg-[#fafafa]">
                      <td className="py-2 px-3 font-medium text-[#333]">{PAGE_LABELS[key] || key}</td>
                      {allActions.map((action, colIdx) => {
                        const code = `${key}.${action}`
                        const hasPermissionObject = parsedPermissions.some(p => p.code === code)
                        const hasPermissionGranted = allowedPerms.has(code)
                        
                        return (
                          <td key={`td-${action}-${colIdx}`} className="text-center py-2 px-2">
                            {hasPermissionObject ? (
                              <span className={`inline-flex w-5 h-5 rounded items-center justify-center text-[10px] cursor-pointer transition-colors ${hasPermissionGranted ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#ccc]'}`}>
                                {hasPermissionGranted ? '✓' : '—'}
                              </span>
                            ) : (
                              <span className="text-[#eee]">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConfigSection>
      )}
    </ConfigSubLayout>
  )
}
