'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity-logger'

export async function createColaborador(data: { name: string; email: string; password?: string; role: string }) {
  const supabase = createAdminClient()

  try {
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password || undefined,
      email_confirm: true,
      user_metadata: { name: data.name }
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    // 2. Add to profiles table
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').update({
        name: data.name,
        role: data.role,
        status: 'ACTIVE'
      }).eq('id', authData.user.id)

      if (profileError) {
        return { success: false, error: profileError.message }
      }
    if (authData.user) {
      await logActivity({
        title: 'Novo Colaborador Criado',
        message: `O colaborador ${data.name} (${data.email}) foi cadastrado com o cargo de ${data.role}.`,
        type: 'success',
        module: 'users',
        entity_id: authData.user.id,
        entity_type: 'user'
      })
    }
    }

    revalidatePath('/sistema/colaboradores')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}

export async function updateColaborador(id: string, data: { name: string; email: string; password?: string; role: string }) {
  const supabase = createAdminClient()

  try {
    // Protect master user
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', id).single()
    if (profile?.email === 'alison@tektou.com') {
      return { success: false, error: 'O usuário Master não pode ser editado desta forma.' }
    }

    // 1. Update Auth (Email/Password)
    const updateData: { email?: string; password?: string; user_metadata?: any } = {
      email: data.email,
      user_metadata: { name: data.name }
    }
    if (data.password) {
      updateData.password = data.password
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(id, updateData)
    if (authError) {
      return { success: false, error: authError.message }
    }

    // 2. Update Profile
    const { error: profileError } = await supabase.from('profiles').update({
      name: data.name,
      email: data.email,
      role: data.role
    }).eq('id', id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    await logActivity({
      title: 'Colaborador Atualizado',
      message: `Os dados de ${data.name} (${data.email}) foram alterados.`,
      type: 'info',
      module: 'users',
      entity_id: id,
      entity_type: 'user'
    })

    revalidatePath('/sistema/colaboradores')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}

export async function deleteColaborador(id: string) {
  const supabase = createAdminClient()

  try {
    // Protect master user
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', id).single()
    if (profile?.email === 'alison@tektou.com') {
      return { success: false, error: 'O usuário Master não pode ser excluído.' }
    }

    // Deleting from auth automatically deletes from profiles due to ON DELETE CASCADE on auth.users if set up.
    // Otherwise we need to delete from profiles first or auth first depending on foreign key constraints.
    // Auth admin deleteUser will cascade to public schema tables that reference auth.users with ON DELETE CASCADE.
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) {
      return { success: false, error: error.message }
    }

    // Clean up profile if it wasn't cascaded
    await supabase.from('profiles').delete().eq('id', id)

    await logActivity({
      title: 'Colaborador Removido',
      message: `O colaborador ${profile?.email} foi excluído do sistema.`,
      type: 'error',
      module: 'users',
      entity_id: id,
      entity_type: 'user'
    })

    revalidatePath('/sistema/colaboradores')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}
