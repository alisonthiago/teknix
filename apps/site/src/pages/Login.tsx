import { Editable } from '../components/page-widgets/PageWidgets'
import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import './Login.css'

export default function Login({ customTitle }: { onGuestContinue?: () => void; customTitle?: string }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'identify' | 'password'>('identify')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const email = identifier.trim().toLowerCase()
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const digits = identifier.replace(/\D/g, '')
  const isDocument = digits.length === 11 || digits.length === 14

  function handleIdentify(event: React.FormEvent) {
    event.preventDefault()
    setErrorMsg(null)
    if (isEmail) return setStep('password')
    if (isDocument) return navigate(`/cadastro?document=${encodeURIComponent(digits)}`)
    setErrorMsg('Informe um e-mail válido, CPF ou CNPJ.')
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault()
    if (!password) return setErrorMsg('Informe sua senha para continuar.')
    setErrorMsg(null)
    setLoading(true)
    try {
      const result = await signIn(email, password)
      if (result.error) {
        setErrorMsg('Não encontramos uma conta com esses dados. Você pode criar sua conta agora.')
        return
      }
      navigate('/conta')
    } catch {
      setErrorMsg('Não foi possível entrar. Confira seus dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setErrorMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/conta` } })
    if (error) setErrorMsg('O login com Google não está disponível no momento.')
  }

  return (
    <main className="identification-page">
      <header className="identification-topbar">
        <button type="button" className="identification-brand" onClick={() => navigate('/')} aria-label="Ir para a página inicial">
          <Editable as="img" widgetId="login-1" src="/teknix-logo.svg" alt="TEKNIX" />
        </button>
      </header>
      <div className="identification-content">
        <button type="button" className="identification-back" onClick={() => step === 'password' ? setStep('identify') : navigate(-1)}>
          <ArrowLeft size={16} aria-hidden="true" /> Voltar
        </button>
        <Editable content={{}} as="h1" widgetId="login-2">{customTitle || 'Identificação'}</Editable>
        <Editable content={{}} as="section" widgetId="login-3" className="identification-card" aria-labelledby="identification-form-title">
          <Editable content={{}} as="h2" widgetId="login-4" id="identification-form-title">{step === 'identify' ? 'Entre ou cadastre-se' : 'Digite sua senha'}</Editable>
          <Editable content={{}} as="p" widgetId="login-5">{step === 'identify' ? 'Para começar, digite seu CPF, CNPJ ou e-mail no campo abaixo.' : `Entre com a senha da conta ${email}.`}</Editable>
          {errorMsg && <div className="identification-message" role="alert">{errorMsg}</div>}
          {step === 'identify' ? (
            <form onSubmit={handleIdentify}>
              <label htmlFor="identifier">CPF, CNPJ ou e-mail</label>
              <input id="identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Digite seu CPF, CNPJ ou e-mail" autoComplete="username" autoFocus />
              <small>Exemplo: 123.456.789-00 ou nome@exemplo.com</small>
              <button className="identification-continue" type="submit" disabled={!identifier.trim()}>Continuar</button>
            </form>
          ) : (
            <form onSubmit={handleSignIn}>
              <label htmlFor="password">Senha</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus />
              <button className="identification-continue" type="submit" disabled={!password || loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
              <div className="identification-login-actions">
                <button type="button" className="identification-text-link" onClick={() => navigate('/password')}>Esqueceu a senha?</button>
                {errorMsg && <button type="button" className="identification-text-link" onClick={() => navigate(`/cadastro?email=${encodeURIComponent(email)}`)}>Criar uma conta</button>}
              </div>
            </form>
          )}
          {step === 'identify' && <>
            <div className="identification-divider"><span>ou entre com</span></div>
            <button type="button" className="identification-google" onClick={handleGoogleSignIn}>
              <svg className="identification-google-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.3c1.9-1.8 3-4.3 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3A10 10 0 0 0 3 16.6L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3 7.4L6.4 10C7.2 7.6 9.4 5.9 12 5.9Z"/></svg>
              Continuar com o Google
            </button>
          </>}
        </Editable>
      </div>
    </main>
  )
}
