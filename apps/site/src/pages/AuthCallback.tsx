import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { syncOAuthUser } from '../services/customer'
import './AuthCallback.css'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [statusMessage, setStatusMessage] = useState('Conectando com segurança...')

  useEffect(() => {
    let mounted = true

    async function handleAuthCallback() {
      try {
        // 1. Verificar se há erro nos parâmetros de busca ou no hash
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

        const error = urlParams.get('error') || hashParams.get('error')
        const errorDesc = urlParams.get('error_description') || hashParams.get('error_description') || ''

        if (error || errorDesc) {
          console.error('[AuthCallback] Erro retornado pelo OAuth:', error, errorDesc)
          let friendlyMessage = 'Não foi possível completar o login com o Google.'
          if (errorDesc.includes('Unable to exchange external code')) {
            friendlyMessage = 'Falha na validação das chaves do Google com o Supabase. Verifique o Client ID e Secret.'
          } else if (error === 'access_denied' || errorDesc.includes('denied')) {
            friendlyMessage = 'O acesso com a conta Google foi cancelado.'
          }
          sessionStorage.setItem('auth_error', friendlyMessage)
          navigate('/login', { replace: true })
          return
        }

        // 2. Tentar recuperar a sessão ativa
        setStatusMessage('Validando credenciais...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[AuthCallback] Erro ao obter sessão:', sessionError)
          sessionStorage.setItem('auth_error', 'Sessão expirada ou inválida. Tente novamente.')
          navigate('/login', { replace: true })
          return
        }

        if (session?.user) {
          setStatusMessage('Sincronizando perfil...')
          try {
            await syncOAuthUser(session.user)
          } catch (syncErr) {
            console.warn('[AuthCallback] Aviso na sincronização do perfil:', syncErr)
          }

          const target = sessionStorage.getItem('auth_redirect') || '/conta'
          sessionStorage.removeItem('auth_redirect')
          if (mounted) {
            navigate(target, { replace: true })
          }
          return
        }

        // 3. Se ainda não há sessão, aguardar evento de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
            setStatusMessage('Sincronizando sua conta...')
            try {
              await syncOAuthUser(newSession.user)
            } catch {}

            const target = sessionStorage.getItem('auth_redirect') || '/conta'
            sessionStorage.removeItem('auth_redirect')
            subscription.unsubscribe()
            if (mounted) {
              navigate(target, { replace: true })
            }
          }
        })

        // 4. Timeout de segurança (6 segundos)
        const timeout = setTimeout(() => {
          subscription.unsubscribe()
          if (mounted) {
            sessionStorage.setItem('auth_error', 'Tempo limite de autenticação excedido. Tente novamente.')
            navigate('/login', { replace: true })
          }
        }, 6000)

        return () => {
          clearTimeout(timeout)
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error('[AuthCallback] Exceção inesperada:', err)
        sessionStorage.setItem('auth_error', 'Ocorreu um erro ao processar seu login.')
        navigate('/login', { replace: true })
      }
    }

    handleAuthCallback()

    return () => {
      mounted = false
    }
  }, [navigate])

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        <div className="auth-callback-spinner"></div>
        <h2 className="auth-callback-title">{statusMessage}</h2>
        <p className="auth-callback-subtitle">Aguarde um momento enquanto preparamos seu acesso à TEKNIX.</p>
      </div>
    </div>
  )
}
