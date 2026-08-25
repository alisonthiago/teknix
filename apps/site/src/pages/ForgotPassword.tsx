import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await resetPassword(email)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <span className="logo-teknix">TEKNIX</span>
              <span className="logo-segment">FERRAMENTAS</span>
            </Link>
            <h1>Email enviado</h1>
            <p>Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
          </div>

          <Link to="/login" className="btn btn-primary btn-full">
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-teknix">TEKNIX</span>
            <span className="logo-segment">FERRAMENTAS</span>
          </Link>
          <h1>Esqueceu a senha?</h1>
          <p>Informe seu email para receber um link de redefinição</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Lembrou a senha?</p>
          <Link to="/login" className="btn btn-outline btn-full">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
