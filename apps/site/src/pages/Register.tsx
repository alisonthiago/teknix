import { Editable } from '../components/page-widgets/PageWidgets'
import React, { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Register.css'

export default function Register() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signUp } = useAuth()
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
    navigate('/conta')
  }

  return (
    <main className="register-page">
      <header className="register-topbar">
        <Link to="/" aria-label="Ir para a página inicial"><Editable as="img" widgetId="register-1" src="/teknix-logo.svg" alt="TEKNIX" /></Link>
      </header>
      <div className="register-layout">
        <aside className="register-benefits" aria-label="Vantagens da conta TEKNIX">
          <div>
            <span className="register-kicker">CONTA TEKNIX</span>
            <Editable as="h2" widgetId="register-2">Compre com mais praticidade.</Editable>
            <Editable as="p" widgetId="register-3">Crie sua conta para acompanhar seus pedidos, salvar produtos e receber ofertas relevantes.</Editable>
          </div>
          <ul>
            <li><Check size={18} /> Acompanhe seus pedidos</li>
            <li><Check size={18} /> Salve seus produtos favoritos</li>
            <li><Check size={18} /> Finalize suas compras mais rápido</li>
          </ul>
        </aside>
        <Editable content={{}} as="section" widgetId="register-4" className="register-form-area">
          <button type="button" className="register-back" onClick={() => navigate('/login')}><ArrowLeft size={16} /> Voltar</button>
          <Editable as="h1" widgetId="register-5">Cadastre sua nova conta</Editable>
          {documentNumber && <Editable content={{}} as="p" widgetId="register-6" className="register-document">CPF: {documentNumber}</Editable>}
          <form className="register-form" onSubmit={handleSubmit}>
            {error && <div className="register-error" role="alert">{error}</div>}
            <label>Nome completo<input value={name} onChange={event => setName(event.target.value)} placeholder="Insira seu nome completo" autoComplete="name" /></label>
            <label>Celular com DDD<input value={phone} onChange={event => setPhone(event.target.value)} placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel" /></label>
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
