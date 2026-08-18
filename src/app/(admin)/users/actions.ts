'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface UserWithProfile {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
  custom_permissions: Array<{ permission_code: string; granted: boolean }>
}

export async function getUsers(): Promise<UserWithProfile[]> {
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return []

  // Check if current user is ADMIN
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
  if (profile?.role !== 'ADMIN') return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (!profiles) return []

  const userIds = profiles.map(p => p.id)
  const { data: customPerms } = await supabase
    .from('user_permissions')
    .select('user_id, permission_code, granted')
    .in('user_id', userIds)

  const permsByUser: Record<string, Array<{ permission_code: string; granted: boolean }>> = {}
  customPerms?.forEach(cp => {
    if (!permsByUser[cp.user_id]) permsByUser[cp.user_id] = []
    permsByUser[cp.user_id].push({ permission_code: cp.permission_code, granted: cp.granted })
  })

  return profiles.map(p => ({
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    is_active: p.status === 'ACTIVE',
    last_login: p.last_login,
    created_at: p.created_at,
    custom_permissions: permsByUser[p.id] || [],
  }))
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'ADMIN') throw new Error('Apenas administradores podem alterar perfis')

  await supabase.from('profiles').update({ role }).eq('id', userId)

  // Log audit
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    entity: 'profiles',
    entity_id: userId,
    action: 'UPDATE_ROLE',
    new_data: { role },
  })

  revalidatePath('/users')
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'ADMIN') throw new Error('Apenas administradores podem alterar status')

  await supabase.from('profiles').update({ status: isActive ? 'ACTIVE' : 'INACTIVE' }).eq('id', userId)

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    entity: 'profiles',
    entity_id: userId,
    action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    new_data: { status: isActive ? 'ACTIVE' : 'INACTIVE' },
  })

  revalidatePath('/users')
}

export async function setUserPermission(userId: string, permissionCode: string, granted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'ADMIN') throw new Error('Apenas administradores podem alterar permissões')

  const { error } = await supabase
    .from('user_permissions')
    .upsert(
      { user_id: userId, permission_code: permissionCode, granted },
      { onConflict: 'user_id,permission_code' }
    )

  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    entity: 'user_permissions',
    entity_id: userId,
    action: granted ? 'GRANT_PERMISSION' : 'REVOKE_PERMISSION',
    new_data: { permission_code: permissionCode, granted },
  })

  revalidatePath('/users')
}

export async function removeUserPermission(userId: string, permissionCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('user_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('permission_code', permissionCode)

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    entity: 'user_permissions',
    entity_id: userId,
    action: 'REMOVE_OVERRIDE',
    new_data: { permission_code: permissionCode },
  })

  revalidatePath('/users')
}

export async function createUser(formData: FormData) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
  if (adminProfile?.role !== 'ADMIN') throw new Error('Apenas administradores podem criar usuários')

  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string

  if (!email || !name || !role) throw new Error('Preencha todos os campos')

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
  })

  if (error) throw new Error(error.message)

  if (data.user) {
    await supabase.from('profiles').update({ role, name }).eq('id', data.user.id)

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id,
      entity: 'profiles',
      entity_id: data.user.id,
      action: 'CREATE_USER',
      new_data: { email, name, role },
    })
  }

  revalidatePath('/users')
  redirect('/users')
}
