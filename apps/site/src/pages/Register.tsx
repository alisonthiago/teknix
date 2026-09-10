import { Editable } from '../components/page-widgets/PageWidgets'
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Login.css'
import './Register.css'

export default function Register() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth()
  const redirectTarget = params.get('redirect') || '/conta'
  const documentNumber = params.get('document') || ''
  const initialEmail = params.get('email') || ''
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [confirmEmail, setConfirmEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate(redirectTarget, { replace: true })
    }
  }, [user, navigate, redirectTarget])

  async function handleGoogleSignUp() {
    setError('')
    setGoogleLoading(true)
    try {
      const result = await signInWithGoogle(redirectTarget)
      if (result.error) {
        setError('O cadastro com Google não está disponível no momento.')
        setGoogleLoading(false)
      }
    } catch {
      setError('O cadastro com Google não está disponível no momento.')
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (!name || !phone || !birthDate || !email || !password) return setError('Preencha todos os campos obrigatórios.')
    if (email !== confirmEmail) return setError('Os e-mails não conferem.')
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    if (password !== confirmPassword) return setError('As senhas não conferem.')
    if (!acceptedTerms) return setError('Você precisa aceitar os termos para criar sua conta.')

    setLoading(true)
    const result = await signUp(email, password, name)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    navigate(redirectTarget)
  }

  return (
    <main className="register-page">
      <header className="register-topbar">
        <Link to="/" aria-label="Ir para a página inicial"><Editable as="img" widgetId="register-1" src="/teknix-logo.svg" alt="TEKNIX" /></Link>
        {authLoading ? null : user ? (
          <Link className="register-account-link" to="/conta">Minha conta</Link>
        ) : (
          <Link className="register-account-link" to="/login">Entrar</Link>
        )}
      </header>
      <div className="register-layout">
        <aside className="register-benefits" aria-label="Vantagens da conta TEKNIX">
          <div>
            <span className="register-kicker">CONTA TEKNIX</span>
            <Editable as="h2" widgetId="register-2">Compre com mais praticidade.</Editable>
            <Editable as="p" widgetId="register-3">Crie sua conta para acompanhar pedidos, salvar produtos e receber ofertas.</Editable>
          </div>
          <ul>
            <li><Check size={16} /> Acompanhe pedidos</li>
            <li><Check size={16} /> Salve favoritos</li>
            <li><Check size={16} /> Compre mais rápido</li>
          </ul>
        </aside>
        <Editable content={{}} as="section" widgetId="register-4" className="register-form-area">
          <button type="button" className="register-back" onClick={() => navigate('/login')}><ArrowLeft size={16} /> Voltar</button>
          <Editable as="h1" widgetId="register-5">Cadastre sua nova conta</Editable>
          {documentNumber && <Editable content={{}} as="p" widgetId="register-6" className="register-document">CPF: {documentNumber}</Editable>}

          <button
            type="button"
            className="identification-google"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            style={{ width: '100%', marginBottom: 16 }}
          >
            <svg className="identification-google-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.3c1.9-1.8 3-4.3 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3A10 10 0 0 0 3 16.6L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3 7.4L6.4 10C7.2 7.6 9.4 5.9 12 5.9Z"/></svg>
            {googleLoading ? 'Conectando com o Google...' : 'Cadastrar com o Google'}
          </button>

          <div className="identification-divider" style={{ marginBottom: 20 }}><span>ou preencha os dados</span></div>

          <form className="register-form" onSubmit={handleSubmit}>
            {error && <div className="register-error" role="alert">{error}</div>}
            <label>Nome completo<input value={name} onChange={event => setName(event.target.value)} placeholder="Insira seu nome completo" autoComplete="name" /></label>
            <label>
              Celular com DDD
              <div className="register-phone-row">
                <span className="register-phone-prefix">+55</span>
                <input value={phone} onChange={event => setPhone(event.target.value)} placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel-national" />
              </div>
            </label>
            <label>Data de nascimento<input value={birthDate} onChange={event => setBirthDate(event.target.value)} type="date" autoComplete="bday" /></label>
            <label>E-mail<input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="seuemail@dominio.com.br" autoComplete="email" /></label>
            <label>Confirme o e-mail<input value={confirmEmail} onChange={event => setConfirmEmail(event.target.value)} type="email" placeholder="Digite novamente seu e-mail" autoComplete="email" /></label>
            <div className="register-password-intro"><strong>Crie sua senha</strong><span>Use ao menos 8 caracteres.</span></div>
            <label>Senha<input value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="Mínimo de 8 caracteres" autoComplete="new-password" /></label>
            <label>Confirme a senha<input value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} type="password" placeholder="Digite novamente sua senha" autoComplete="new-password" /></label>
            <label className="register-terms"><input checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} type="checkbox" /> <span>Li e aceito os <Link to="/contato">Termos de Uso</Link> e a <Link to="/contato">Política de Privacidade</Link>.</span></label>
            <button className="register-submit" type="submit" disabled={loading}>{loading ? 'Criando conta...' : 'Finalizar cadastro'}</button>
          </form>
          <Editable as="p" widgetId="register-7" className="register-login-link">Já possui uma conta? <Link to="/login">Entrar</Link></Editable>
        </Editable>
      </div>
    </main>
  )
}
