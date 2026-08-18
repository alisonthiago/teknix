'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

interface Profile {
  id: string
  name: string
  role: string
}

interface Permission {
  id: string
  permission_key: string
  action: string
  label: string
}

interface RolePermission {
  role: string
  permission_key: string
  action: string
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', produtos: 'Produtos', estoque: 'Estoque', pedidos: 'Pedidos',
  separacao: 'Separação', expedicao: 'Expedição', vendas: 'Vendas', marketplaces: 'Marketplaces',
  precificacao: 'Precificação', financeiro: 'Financeiro', relatorios: 'Relatórios', configuracoes: 'Configurações',
}

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver', create: 'Criar', edit: 'Editar', delete: 'Excluir',
  export: 'Exportar', import: 'Importar', manage: 'Gerenciar',
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

  const loading = profilesLoading || permissionsLoading || rpLoading

  const selectedProfile = profiles?.find(p => p.id === selectedId) || profiles?.[0]
  const userRole = selectedProfile?.role

  const allowedPerms = new Set(
    rolePermissions?.filter(rp => rp.role === userRole).map(rp => `${rp.permission_key}:${rp.action}`) || []
  )

  const allPermissionKeys = [...new Set(permissions?.map(p => p.permission_key) || [])]
  const allActions = [...new Set(permissions?.map(p => p.action) || [])]

  return (
    <ConfigSubLayout title="Permissões" description="Controle o que cada colaborador pode ver e fazer">
      <ConfigSection title="Selecionar colaborador">
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
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Página</th>
                    {allActions.map(action => (
                      <th key={action} className="text-center py-2 px-2 text-[10px] font-medium text-[#999] uppercase">{ACTION_LABELS[action] || action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f5]">
                  {allPermissionKeys.map(key => (
                    <tr key={key} className="hover:bg-[#fafafa]">
                      <td className="py-2 px-3 font-medium text-[#333]">{PAGE_LABELS[key] || key}</td>
                      {allActions.map(action => {
                        const has = allowedPerms.has(`${key}:${action}`)
                        return (
                          <td key={action} className="text-center py-2 px-2">
                            <span className={`inline-flex w-5 h-5 rounded items-center justify-center text-[10px] cursor-pointer transition-colors ${has ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#ccc]'}`}>
                              {has ? '✓' : '—'}
                            </span>
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
