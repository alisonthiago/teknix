import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPermissions } from '@/lib/permissions'
import { PermissionProvider } from '@/lib/permissions-context'
import AdminChrome from '@/components/AdminChrome'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  const user = data.user
  const userPerms = await getUserPermissions()

  if (!userPerms) {
    redirect('/login')
  }

  const permissionsArray = Array.from(userPerms.permissions)

  const roleLabels: Record<string, string> = {
    MASTER: 'Master',
    ADMIN: 'Administrador',
    GERENTE: 'Gerente',
    VENDEDOR: 'Vendedor',
    FINANCEIRO: 'Financeiro',
    SEPARADOR: 'Separador',
    EXPEDICAO: 'Expedição',
    ESTOQUE: 'Estoque',
    CONSULTA: 'Somente Leitura',
    OPERATOR: 'Operador',
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, photo_url, name')
    .eq('id', user.id)
    .single()

  const userName = profile?.name || (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'Usuário'
  const userRole = roleLabels[userPerms.role] || userPerms.role
  const userEmail = user.email || ''
  const avatarUrl = profile?.avatar_url || profile?.photo_url || null

  return (
    <PermissionProvider role={userPerms.role} permissions={permissionsArray}>
      <AdminChrome
        permissions={permissionsArray}
        userName={userName}
        userRole={userRole}
        userEmail={userEmail}
        userId={user.id}
        userAvatarUrl={avatarUrl}
      >
        {children}
      </AdminChrome>
    </PermissionProvider>
  )
}
