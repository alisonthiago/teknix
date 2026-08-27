/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL USER & PROFILE SERVICE (@teknix/users)
   Identidade única e unificada com escopos por projeto
   ========================================================================== */

import { supabase } from '../../supabase/client'
import type { UserRole, ProjectScope } from '../../permissions/src/index'

export interface TeknixUserIdentity {
  id: string
  email: string
  name: string
  phone?: string
  document?: string
  avatarUrl?: string
  rolesByProject: Record<ProjectScope, UserRole>
  createdAt: string
  updatedAt?: string
}

export async function getUserProfile(userId: string): Promise<TeknixUserIdentity | null> {
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!customer) return null

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name || 'Cliente',
      phone: customer.phone,
      document: customer.document,
      rolesByProject: {
        site: 'CUSTOMER',
        flow: 'OPERATOR',
        hub: 'ADMIN'
      },
      createdAt: customer.created_at
    }
  } catch (err) {
    console.error('Erro ao buscar perfil de usuário:', err)
    return null
  }
}
