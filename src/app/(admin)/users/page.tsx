import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export const metadata = {
  title: 'Usuários | TEKNIX',
}

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'ADMIN') redirect('/access-denied')

  const { data: allPermissions } = await supabase.from('permissions').select('code, module, description').order('code')
  const { data: rolePerms } = await supabase.from('role_permissions').select('role, permission_code')

  const permissions = allPermissions || []
  const rolePermissions: Record<string, string[]> = {}
  rolePerms?.forEach(rp => {
    if (!rolePermissions[rp.role]) rolePermissions[rp.role] = []
    rolePermissions[rp.role].push(rp.permission_code)
  })

  return <UsersClient permissions={permissions} rolePermissions={rolePermissions} />
}
