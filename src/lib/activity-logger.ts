import { createClient } from '@/utils/supabase/server'
import { getUserPermissions } from '@/lib/permissions'

export type ActivityModule = 
  | 'products'
  | 'suppliers'
  | 'purchases'
  | 'orders'
  | 'users'
  | 'system'
  | 'auth'
  | 'customers'
  | 'sales'

export type ActivityType = 'success' | 'error' | 'warning' | 'info'

export interface LogActivityParams {
  title: string
  message: string
  type?: ActivityType
  module: ActivityModule
  entity_id?: string
  entity_type?: string
  target_user_id?: string
  metadata?: Record<string, any>
}

export async function logActivity(params: LogActivityParams) {
  try {
    const supabase = await createClient()

    // 1. Identificar o ator (quem está realizando a ação)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // Sem usuário autenticado, não loga (ou poderia logar como sistema)

    const userPerms = await getUserPermissions()
    const actorRole = userPerms?.role || 'UNKNOWN'

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const actorName = profile?.name || user.email || 'Usuário Desconhecido'

    // 2. Identificar o MASTER
    const { data: masterProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_master', true)
      .single()

    if (!masterProfile) return // Se não achar o master, aborta

    // 3. Inserir a notificação apontando para o MASTER
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: masterProfile.id,
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        is_read: false,
        actor_user_id: user.id,
        actor_name: actorName,
        actor_role: actorRole,
        target_user_id: params.target_user_id || null,
        module: params.module,
        entity_id: params.entity_id || null,
        entity_type: params.entity_type || null,
        metadata: params.metadata || null
      })

    if (error) {
      console.error('Error logging activity:', error)
    }

  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}
