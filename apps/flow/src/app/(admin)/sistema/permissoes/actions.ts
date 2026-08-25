'use server'

import { createClient } from '@supabase/supabase-js'

export async function createCollaborator(formData: FormData) {
  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  if (!email || !name || !role || !password) {
    return { error: 'Todos os campos são obrigatórios' }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Create admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData?.user) {
      // 2. Create Profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        name,
        email,
        role,
        status: 'ACTIVE'
      })

      if (profileError) {
        return { error: profileError.message }
      }

      return { success: true }
    }
    
    return { error: 'Falha ao criar o usuário (retorno vazio)' }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Erro interno' }
  }
}
