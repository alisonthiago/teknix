import { Editable } from '../components/page-widgets/PageWidgets'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [stage, setStage] = useState<'email' | 'code' | 'reset'>('email')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  async function sendRecovery(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = await resetPassword(email)
    setLoading(false)
    if (result.error) return setError(result.error)
    setStage('code')
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault()
    const token = code.join('')
    if (token.length !== 6) return setError('Digite os 6 números enviados para seu e-mail.')
    setLoading(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' })
    setLoading(false)
    if (verifyError) return setError('Código inválido ou expirado. Solicite um novo código.')
    setStage('reset')
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault()
    if (newPassword.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    if (newPassword !== confirmPassword) return setError('As senhas não conferem.')
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (updateError) return setError('Não foi possível atualizar a senha. Tente novamente.')
    navigate('/login')
  }

  return <main className="identification-page">
    <header className="identification-topbar"><Link className="identification-brand" to="/"><Editable as="img" widgetId="forgotpassword-1" src="/teknix-logo.svg" alt="TEKNIX" /></Link></header>
    <div className="identification-content recovery-content">
      <button type="button" className="identification-back" onClick={() => stage === 'code' ? setStage('email') : navigate('/login')}>← Voltar</button>
      <Editable as="h1" widgetId="forgotpassword-2">Esqueceu a senha?</Editable>
      <Editable content={{}} as="section" widgetId="forgotpassword-3" className="identification-card" aria-labelledby="recovery-title">
        <Editable content={{}} as="h2" widgetId="forgotpassword-4" id="recovery-title">{stage === 'email' ? 'Recupere sua conta' : stage === 'code' ? 'Confirme o código' : 'Crie uma nova senha'}</Editable>
        <Editable content={{}} as="p" widgetId="forgotpassword-5">{stage === 'email' ? 'Informe seu e-mail para receber um código de redefinição.' : stage === 'code' ? `Enviamos um código de 6 números para ${email}.` : 'Escolha uma senha segura para continuar.'}</Editable>
        {error && <div className="identification-message" role="alert">{error}</div>}
        {stage === 'email' ? <form onSubmit={sendRecovery}>
          <label htmlFor="recovery-email">E-mail</label><input id="recovery-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="seu@email.com" autoComplete="email" required autoFocus />
          <button className="identification-continue" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar código de redefinição'}</button>
        </form> : stage === 'code' ? <form onSubmit={verifyCode}>
          <div className="recovery-code-row" aria-label="Código de seis números">{code.map((digit, index) => <input key={index} ref={element => { inputs.current[index] = element }} value={digit} inputMode="numeric" maxLength={1} aria-label={`Dígito ${index + 1}`} onChange={event => { const value = event.target.value.replace(/\D/g, ''); const next = [...code]; next[index] = value; setCode(next); if (value && index < 5) inputs.current[index + 1]?.focus() }} onKeyDown={event => { if (event.key === 'Backspace' && !digit && index > 0) inputs.current[index - 1]?.focus() }} />)}</div>
          <button className="identification-continue" type="submit" disabled={loading}>{loading ? 'Confirmando...' : 'Confirmar código'}</button>
          <button type="button" className="identification-text-link" onClick={() => setStage('email')}>Enviar outro código</button>
        </form> : <form onSubmit={updatePassword}>
          <label htmlFor="new-password">Nova senha</label><input id="new-password" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" required />
          <label htmlFor="confirm-password">Confirme a senha</label><input id="confirm-password" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Digite novamente sua senha" autoComplete="new-password" required />
          <button className="identification-continue" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar nova senha'}</button>
        </form>}
        <Editable as="p" widgetId="forgotpassword-6" className="recovery-login-note">Lembrou a senha? <Link to="/login">Voltar para o login</Link></Editable>
      </Editable>
    </div>
  </main>
}
