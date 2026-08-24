'use client'

import { useState, useCallback } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'
import { Loader2, ShieldCheck, ShieldOff, Users, Plus } from 'lucide-react'
import ColaboradorModal from '@/components/ColaboradorModal'

interface Profile {
  id: string
  name: string
  role: string
  email: string
  is_master?: boolean
}

interface Permission {
  code: string
  module: string
  description: string
}

interface UserPermission {
  user_id: string
  permission_code: string
  granted: boolean
}

const MODULE_LABELS: Record<string, string> = {
  products: 'Produtos', sales: 'Vendas', orders: 'Pedidos',
  picking: 'Separação', shipping: 'Expedição', inventory: 'Estoque',
  finance: 'Financeiro', revenue: 'Faturamento', cost: 'Custos',
  profit: 'Lucro', margin: 'Margem', reports: 'Relatórios',
  marketplaces: 'Marketplaces', settings: 'Configurações', users: 'Usuários',
  permissions: 'Permissões', imports: 'Importação', exports: 'Exportação',
  notifications: 'Notificações', pricing: 'Precificação', chat: 'Chat',
  customers: 'Clientes',
}

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver', create: 'Criar', edit: 'Editar', delete: 'Excluir',
  manage: 'Gerenciar', execute: 'Executar', adjust: 'Ajustar',
  export: 'Exportar', connect: 'Conectar', use: 'Usar',
  financial_view: 'Financeiro', print_label: 'Etiqueta', cost_view: 'Custos',
  sales: 'Vendas', inventory: 'Estoque', sync: 'Sincronizar', financial: 'Financeiro',
}

export default function PermissoesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: profiles, loading: profilesLoading, refetch: refetchProfiles } = useSupabaseQuery<Profile[]>(async (s) => {
    const { data, error } = await s.from('profiles').select('id, name, role, email, is_master').order('name')
    if (error) throw error
    return (data || []) as Profile[]
  })

  const { data: permissions, loading: permsLoading } = useSupabaseQuery<Permission[]>(async (s) => {
    const { data, error } = await s.from('permissions').select('*').order('module, code')
    if (error) throw error
    return (data || []) as Permission[]
  })

  const { data: userPerms, loading: upLoading, refetch: refetchPerms } = useSupabaseQuery<UserPermission[]>(
    async (s) => {
      if (!selectedId) return []
      const { data, error } = await s.from('user_permissions').select('*').eq('user_id', selectedId)
      if (error) throw error
      return (data || []) as UserPermission[]
    },
     
    [selectedId ?? '']
  )

  const loading = profilesLoading || permsLoading || upLoading
  const selectedProfile = profiles?.find(p => p.id === selectedId) || null

  const grantedSet = new Set(
    (userPerms || []).filter(up => up.granted).map(up => up.permission_code)
  )

  const togglePermission = useCallback(async (code: string) => {
    if (!selectedId || !selectedProfile) return
    if (selectedProfile.is_master) return // Não editar MASTER

    setToggling(code as string)
    const supabase = createClient()
    const isGranted = grantedSet.has(code)

    const { error } = await supabase
      .from('user_permissions')
      .upsert(
        { user_id: selectedId, permission_code: code, granted: !isGranted },
        { onConflict: 'user_id,permission_code' }
      )

    if (!error) {
      refetchPerms()
    }
    setToggling(null)
  }, [selectedId, selectedProfile, grantedSet, refetchPerms])

  const grantAll = useCallback(async () => {
    if (!selectedId || !selectedProfile || selectedProfile.is_master || !permissions) return
    setToggling('all')
    const supabase = createClient()
    const rows = permissions.map(p => ({ user_id: selectedId, permission_code: p.code, granted: true }))
    await supabase.from('user_permissions').upsert(rows, { onConflict: 'user_id,permission_code' })
    refetchPerms()
    setToggling(null)
  }, [selectedId, selectedProfile, permissions, refetchPerms])

  const revokeAll = useCallback(async () => {
    if (!selectedId || !selectedProfile || selectedProfile.is_master || !permissions) return
    setToggling('none')
    const supabase = createClient()
    const rows = permissions.map(p => ({ user_id: selectedId, permission_code: p.code, granted: false }))
    await supabase.from('user_permissions').upsert(rows, { onConflict: 'user_id,permission_code' })
    refetchPerms()
    setToggling(null)
  }, [selectedId, selectedProfile, permissions, refetchPerms])

  // Agrupar permissões por módulo
  const grouped = (permissions || []).reduce<Record<string, Permission[]>>((acc, p) => {
    const mod = p.code.split('.')[0] || p.module
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(p)
    return acc
  }, {})

  return (
    <ConfigSubLayout title="Permissões" description="Controle o que cada colaborador pode ver e fazer">
      <ConfigSection title="Colaboradores">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[11px] text-[#999]">Selecione um colaborador para editar suas permissões</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-[#3483fa] text-white text-[11px] font-medium rounded-md hover:bg-[#2968c8] flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Colaborador
          </button>
        </div>

        {profilesLoading ? (
          <div className="flex items-center gap-2 text-[13px] text-[#999]"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
        ) : !profiles?.length ? (
          <div className="text-[13px] text-[#999]">Nenhum colaborador encontrado.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                  selectedId === p.id ? 'bg-[#3483fa] text-white' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee]'
                }`}
              >
                <Users className="w-3 h-3" />
                {p.name}
                {p.is_master && <span className="text-[9px] bg-white/20 px-1 rounded">MASTER</span>}
              </button>
            ))}
          </div>
        )}
      </ConfigSection>

      {selectedProfile && (
        <ConfigSection title={`Permissões — ${selectedProfile.name}`}>
          {selectedProfile.is_master ? (
            <div className="flex items-center gap-3 p-4 bg-[#f0fff4] rounded-lg border border-[#c6f6d5]">
              <ShieldCheck className="w-5 h-5 text-[#38a169]" />
              <div>
                <p className="text-[13px] font-semibold text-[#38a169]">MASTER — Acesso Total</p>
                <p className="text-[12px] text-[#666]">O usuário MASTER tem todas as permissões e não pode ser editado.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] text-[#999]">
                  Clique em qualquer permissão para ativar ou desativar.
                  {' '}<strong className="text-[#333]">{grantedSet.size}</strong> permissões ativas.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={grantAll}
                    disabled={!!toggling}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium bg-[#f0fff4] text-[#38a169] rounded-md hover:bg-[#c6f6d5] transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Liberar tudo
                  </button>
                  <button
                    onClick={revokeAll}
                    disabled={!!toggling}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium bg-[#fff5f5] text-[#e74c3c] rounded-md hover:bg-[#fed7d7] transition-colors disabled:opacity-50"
                  >
                    <ShieldOff className="w-3.5 h-3.5" /> Revogar tudo
                  </button>
                </div>
              </div>

              {upLoading ? (
                <div className="flex items-center gap-2 text-[13px] text-[#999] py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando permissões...
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grouped).map(([mod, perms]) => (
                    <div key={mod}>
                      <p className="text-[11px] font-semibold text-[#999] uppercase mb-2 tracking-wider">
                        {MODULE_LABELS[mod] || mod}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {perms.map(p => {
                          const action = p.code.split('.')[1] || 'view'
                          const granted = grantedSet.has(p.code)
                          const isToggling = toggling === p.code

                          return (
                            <button
                              key={p.code}
                              onClick={() => togglePermission(p.code)}
                              disabled={!!toggling}
                              title={p.description}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
                                granted
                                  ? 'bg-[#f0fff4] border-[#9ae6b4] text-[#276749] hover:bg-[#c6f6d5]'
                                  : 'bg-[#f5f5f5] border-[#e6e6e6] text-[#999] hover:bg-[#eee] hover:text-[#666]'
                              } disabled:opacity-50 disabled:cursor-wait`}
                            >
                              {isToggling
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : granted
                                  ? <span className="text-[10px]">✓</span>
                                  : <span className="text-[10px]">○</span>
                              }
                              {ACTION_LABELS[action] || action}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </ConfigSection>
      )}

      <ColaboradorModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => { refetchProfiles(); setShowModal(false) }}
      />
    </ConfigSubLayout>
  )
}
