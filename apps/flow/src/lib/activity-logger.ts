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

    // 3. Inserir em audit_logs para histórico de atividade/auditoria (SEM poluir notificações)
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action: params.title,
        detail: params.message,
        device: 'Web App',
        ip: null
      })

    if (error) {
      // Se audit_logs falhar (ex: tabela opcional em dev), apenas loga no console
      console.warn('Audit log write note:', error.message)
    }

  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}
