import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { syncOAuthUser } from '../services/customer'
import { dispatchWelcomeEmail } from '../services/notifications'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: (redirectTo?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u) {
        syncOAuthUser(u).catch(err => console.warn('[useAuth] Sync inicial de usuário:', err))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (event === 'SIGNED_IN' && u) {
        syncOAuthUser(u).catch(err => console.warn('[useAuth] Sync de usuário pós-login:', err))
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email: string, password: string, name: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })

    if (error) {
      return { error: error.message }
    }

    // Disparar e-mail de boas-vindas via Brevo
    dispatchWelcomeEmail({ name, email }).catch(err =>
      console.warn('[useAuth] Falha ao enviar e-mail de boas-vindas:', err)
    )

    return {}
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { error: error.message }
    }
    return {}
  }

  async function signInWithGoogle(redirectTo?: string) {
    // 1. Guardar a rota de destino final pretendida (ex: /conta, /checkout, etc.)
    const target = redirectTo || '/conta'
    try {
      sessionStorage.setItem('auth_redirect', target)
    } catch {}

    // 2. Determinar a URL de retorno oficial do SITE:
    // Se for ambiente local: http://localhost:5173/auth/callback
    // Se for produção: https://teknixbrasil.com.br/auth/callback
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    const siteOrigin = isLocalhost ? window.location.origin : 'https://teknixbrasil.com.br'
    const callbackUrl = `${siteOrigin}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      return { error: error.message }
    }
    return {}
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`
    })

    if (error) {
      return { error: error.message }
    }
    return {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
