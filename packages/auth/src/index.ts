/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL AUTHENTICATION SERVICE (@teknix/auth)
   Autenticação unificada (E-mail ou Usuário), sessões e recuperação
   ========================================================================== */

import { supabase } from '../../supabase/client'
import { twoFactorService } from '../../2fa/src/index'
import { notificationService, type ProjectContext } from '../../notifications/src/index'

export interface AuthUser {
  id: string
  email: string
  name?: string
  username?: string
  role?: string
  user_metadata?: Record<string, any>
}

export class AuthService {
  /**
   * Suporta autenticação tanto por e-mail quanto por nome de usuário (Ex: joao.operador)
   */
  async signIn(identifier: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
    try {
      // Se for username sem @, normaliza para formato de credencial interna
      const resolvedEmail = identifier.includes('@')
        ? identifier
        : `${identifier.trim().toLowerCase()}@staff.teknixbrasil.com.br`

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password
      })

      if (error) return { error: error.message }
      if (!data.user) return { error: 'Usuário ou senha incorretos.' }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || resolvedEmail,
          username: !identifier.includes('@') ? identifier : undefined,
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role || 'CUSTOMER',
          user_metadata: data.user.user_metadata
        }
      }
    } catch (e: any) {
      return { error: e?.message || 'Erro inesperado na autenticação.' }
    }
  }

  async signUp(email: string, password: string, name?: string): Promise<{ user?: AuthUser; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, full_name: name } }
      })
      if (error) return { error: error.message }
      if (!data.user) return { error: 'Não foi possível cadastrar o usuário.' }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name,
          user_metadata: data.user.user_metadata
        }
      }
    } catch (e: any) {
      return { error: e?.message || 'Erro inesperado no cadastro.' }
    }
  }

  async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) return { error: error.message }
      return {}
    } catch (e: any) {
      return { error: e?.message || 'Erro ao encerrar sessão.' }
    }
  }

  async resetPassword(email: string, redirectTo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || `${typeof window !== 'undefined' ? window.location.origin : ''}/password`
      })
      if (error) return { success: false, error: error.message }

      await notificationService.publishEvent('user.password.reset', {
        project: 'site',
        targetUser: { email, name: 'Cliente' },
        data: { resetLink: redirectTo }
      })

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message }
    }
  }

  async request2FA(userId: string, email: string, name?: string, project: ProjectContext = 'site') {
    return twoFactorService.requestEmailCode(userId, email, name, project)
  }

  verify2FA(challengeId: string, code: string) {
    return twoFactorService.verifyCode(challengeId, code)
  }
}

export const authService = new AuthService()
