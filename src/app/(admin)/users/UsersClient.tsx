'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Users as UsersIcon, Plus, Shield, CheckCircle2, XCircle,
  UserCheck, UserX, ChevronDown, ChevronRight, Settings,
  Eye, EyeOff, Pencil, Trash2
} from 'lucide-react'
import { getUsers, updateUserRole, toggleUserActive, setUserPermission, removeUserPermission, createUser } from './actions'

interface Permission {
  code: string
  module: string
  description: string
}

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
  custom_permissions: Array<{ permission_code: string; granted: boolean }>
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  FINANCEIRO: 'Financeiro',
  SEPARADOR: 'Separador',
  EXPEDICAO: 'Expedição',
  VENDEDOR: 'Vendedor',
  ESTOQUE: 'Estoque',
  CONSULTA: 'Consulta',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  GERENTE: 'bg-[#ecf3fe] text-[#2968c8]',
  FINANCEIRO: 'bg-green-100 text-green-700',
  SEPARADOR: 'bg-orange-100 text-orange-700',
  EXPEDICAO: 'bg-cyan-100 text-cyan-700',
  VENDEDOR: 'bg-lime-100 text-lime-700',
  ESTOQUE: 'bg-[#f5f5f5] text-[#666]',
  CONSULTA: 'bg-[#f5f5f5] text-[#666]',
}

export default function UsersClient({
  permissions,
  rolePermissions,
}: {
  permissions: Permission[]
  rolePermissions: Record<string, string[]>
}) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [newUserOpen, setNewUserOpen] = useState(false)
  const [createError, setCreateError] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    const data = await getUsers()
    setUsers(data)
    setLoading(false)
  }

  useState(() => { loadUsers() })

  const groupedPerms = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  const getEffectivePermission = (user: UserProfile, code: string): boolean => {
    const override = user.custom_permissions.find(cp => cp.permission_code === code)
    if (override) return override.granted
    const rolePermsList = rolePermissions[user.role] || []
    return rolePermsList.includes(code)
  }

  const hasOverride = (user: UserProfile, code: string): boolean => {
    return user.custom_permissions.some(cp => cp.permission_code === code)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole)
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, custom_permissions: [] } : u))
    if (selectedUser?.id === userId) {
      setSelectedUser({ ...selectedUser, role: newRole, custom_permissions: [] })
    }
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    await toggleUserActive(userId, !currentActive)
    setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentActive } : u))
    if (selectedUser?.id === userId) {
      setSelectedUser({ ...selectedUser, is_active: !currentActive })
    }
  }

  const handlePermissionToggle = async (userId: string, code: string, currentlyGranted: boolean) => {
    await setUserPermission(userId, code, !currentlyGranted)
    const updatedUsers = users.map(u => {
      if (u.id !== userId) return u
      const existing = u.custom_permissions.find(cp => cp.permission_code === code)
      let newPerms
      if (existing) {
        newPerms = u.custom_permissions.map(cp =>
          cp.permission_code === code ? { ...cp, granted: !currentlyGranted } : cp
        )
      } else {
        newPerms = [...u.custom_permissions, { permission_code: code, granted: !currentlyGranted }]
      }
      return { ...u, custom_permissions: newPerms }
    })
    setUsers(updatedUsers)
    if (selectedUser?.id === userId) {
      const updated = updatedUsers.find(u => u.id === userId)
      if (updated) setSelectedUser(updated)
    }
  }

  const handleRemoveOverride = async (userId: string, code: string) => {
    await removeUserPermission(userId, code)
    const updatedUsers = users.map(u => {
      if (u.id !== userId) return u
      return { ...u, custom_permissions: u.custom_permissions.filter(cp => cp.permission_code !== code) }
    })
    setUsers(updatedUsers)
    if (selectedUser?.id === userId) {
      const updated = updatedUsers.find(u => u.id === userId)
      if (updated) setSelectedUser(updated)
    }
  }

  const handleCreateUser = async (formData: FormData) => {
    setCreateError('')
    try {
      await createUser(formData)
      setNewUserOpen(false)
      await loadUsers()
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar usuário')
    }
  }

  const toggleModule = (mod: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(mod)) next.delete(mod)
      else next.add(mod)
      return next
    })
  }

  return (
    <div className="mp-stack">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[#999]">Gerencie usuários, perfis e permissões do sistema.</p>
        <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
          <DialogTrigger render={<Button className="bg-[#3483fa] hover:bg-[#2968c8]" />}>
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <form action={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input name="name" required placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input name="email" type="email" required placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Perfil</Label>
                <select name="role" className="flex h-9 w-full rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm" defaultValue="CONSULTA">
                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'ADMIN').map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <Button type="submit" className="w-full bg-[#333]">Criar Usuário</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Users List */}
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#999]">
                {users.length} usuário(s)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-[#999] text-sm">Carregando...</div>
              ) : users.length === 0 ? (
                <div className="p-6 text-center text-[#999] text-sm">Nenhum usuário encontrado.</div>
              ) : (
                <div className="divide-y divide-[#eeeeee]">
                  {users.map(u => (
                    <div
                      key={u.id}
                      className={`p-4 cursor-pointer hover:bg-[#fafafa] transition-colors ${selectedUser?.id === u.id ? 'bg-[#ecf3fe] border-l-2 border-[#3483fa]' : ''} ${!u.is_active ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${ROLE_COLORS[u.role] || 'bg-[#f5f5f5]'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#333]">{u.name}</p>
                            <p className="text-xs text-[#999]">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!u.is_active && <UserX className="w-4 h-4 text-red-400" />}
                          <Badge variant="outline" className={`text-[10px] ${ROLE_COLORS[u.role] || ''}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Detail / Permissions */}
        <div className="lg:col-span-2">
          {!selectedUser ? (
            <Card>
              <CardContent className="p-12 text-center">
                <UsersIcon className="w-12 h-12 text-[#999] mx-auto mb-4" />
                <p className="text-[#999]">Selecione um usuário para gerenciar suas permissões.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                    <p className="text-sm text-[#999]">{selectedUser.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={ROLE_COLORS[selectedUser.role]}>
                      {ROLE_LABELS[selectedUser.role]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(selectedUser.id, selectedUser.is_active)}
                    >
                      {selectedUser.is_active ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mp-stack">
                {/* Role Selector */}
                <div>
                  <Label className="text-sm font-medium text-[#666] mb-2 block">Perfil</Label>
                  <select
                    className="flex h-9 w-full max-w-xs rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm"
                    value={selectedUser.role}
                    onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                    disabled={selectedUser.role === 'ADMIN'}
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#999] mt-1">O perfil define as permissões padrão. Use os toggles abaixo para personalizar.</p>
                </div>

                {/* Permission Matrix */}
                <div>
                  <Label className="text-sm font-medium text-[#666] mb-3 block">
                    Permissões Personalizadas
                    <span className="font-normal text-[#999] ml-2">(toggle acima ou abaixo do perfil padrão)</span>
                  </Label>
                  <div className="space-y-2">
                    {Object.entries(groupedPerms).map(([mod, perms]) => {
                      const isExpanded = expandedModules.has(mod)
                      const allGranted = perms.every(p => getEffectivePermission(selectedUser, p.code))
                      const someGranted = perms.some(p => getEffectivePermission(selectedUser, p.code))

                      return (
                        <div key={mod} className="border border-[#e6e6e6] rounded-lg overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between p-3 hover:bg-[#fafafa] transition-colors text-left"
                            onClick={() => toggleModule(mod)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-[#999]" /> : <ChevronRight className="w-4 h-4 text-[#999]" />}
                              <span className="text-sm font-medium text-[#666]">{mod}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {allGranted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : someGranted ? (
                                <div className="w-4 h-4 rounded-full bg-lime-400 border-2 border-white"></div>
                              ) : (
                                <XCircle className="w-4 h-4 text-[#999]" />
                              )}
                              <span className="text-xs text-[#999]">
                                {perms.filter(p => getEffectivePermission(selectedUser, p.code)).length}/{perms.length}
                              </span>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="border-t border-[#e6e6e6] p-3 space-y-2 bg-[#fafafa]/50">
                              {perms.map(p => {
                                const granted = getEffectivePermission(selectedUser, p.code)
                                const overridden = hasOverride(selectedUser, p.code)

                                return (
                                  <div key={p.code} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-[#666]">{p.description}</span>
                                      <span className="text-[10px] text-[#999] font-mono">{p.code}</span>
                                      {overridden && (
                                        <Badge variant="outline" className="text-[9px] bg-lime-50 text-lime-600 border-lime-200">
                                          personalizado
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant={granted ? 'default' : 'outline'}
                                        size="sm"
                                        className={`h-7 px-3 text-xs ${granted ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                        onClick={() => handlePermissionToggle(selectedUser.id, p.code, granted)}
                                      >
                                        {granted ? <><Eye className="w-3 h-3 mr-1" /> Liberado</> : <><EyeOff className="w-3 h-3 mr-1" /> Bloqueado</>}
                                      </Button>
                                      {overridden && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs text-[#999]"
                                          onClick={() => handleRemoveOverride(selectedUser.id, p.code)}
                                        >
                                          Resetar
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
