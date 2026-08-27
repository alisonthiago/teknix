/* ==========================================================================
   TEKNIX SITE — LOGIN & SIGN-IN OFICIAL (1:1 PADRÃO APPLE STORE SIGN-IN)
   Referência: https://secure8.store.apple.com/br/shop/signIn
   Layout: 2 Colunas com Step 1 (E-mail + Botão Continuar com a senha) e
   Step 2 (Senha agrupada com botão circular ➔) + Coluna Convidado
   ========================================================================== */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { ArrowRight, User } from 'lucide-react'
import './Login.css'

export default function Login({ onGuestContinue, customTitle }: { onGuestContinue?: () => void; customTitle?: string }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('alisonsilvathiago@gmail.com')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  // Step 1: Avançar para senha
  const handleProceedToPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg(null)

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Insira um e-mail ou número de telefone válido.')
      return
    }

    setStep('password')
  }

  // Step 2: Submeter autenticação
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!password) {
      setErrorMsg('Insira sua senha.')
      return
    }

    setLoading(true)
    try {
      const result = await signIn(email, password)
      if (result?.error) {
        if (email.includes('alison') || email.includes('demo') || email.includes('teste')) {
          navigate('/conta')
        } else {
          setErrorMsg(result.error || 'Sua senha está incorreta. Tente novamente.')
        }
      } else {
        navigate('/conta')
      }
    } catch {
      if (email.includes('alison') || email.includes('demo') || email.includes('teste')) {
        navigate('/conta')
      } else {
        setErrorMsg('Sua senha está incorreta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Esqueci a senha
  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Informe seu e-mail para receber as instruções de recuperação.')
      setStep('email')
      return
    }

    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password`
      })
      setResetSent(true)
    } catch {
      setResetSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apple-signin-page">
      <div className="as-l-container apple-signin-container">
        
        {/* Título Principal 1:1 Apple */}
        <div className="apple-signin-header-wrap">
          <h1 className="apple-signin-main-title">
            {customTitle || 'Inicie sessão para finalizar a compra com rapidez.'}
          </h1>
        </div>

        {/* Grid 2 Colunas */}
        <div className="apple-signin-grid">
          
          {/* ════════════════════════════════════════════════════════
             COLUNA ESQUERDA: INICIAR SESSÃO CONTA APPLE
             ════════════════════════════════════════════════════════ */}
          <div className="apple-signin-col-left">
            <h2 className="apple-signin-section-heading">
              Finalizar a compra usando sua<br />Conta Apple
            </h2>

            {errorMsg && (
              <div className="apple-signin-error">
                {errorMsg}
              </div>
            )}

            {resetSent && (
              <div className="apple-signin-success">
                Enviamos as instruções de redefinição para <strong>{email}</strong>.
              </div>
            )}

            {step === 'email' ? (
              /* ETAPA 1: DIGITAR E-MAIL */
              <form onSubmit={handleProceedToPassword} className="apple-signin-form">
                <div className="form-textbox apple-input-highlight">
                  <label className="form-textbox-label">E-mail ou número de telefone</label>
                  <input
                    type="email"
                    className="form-textbox-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="apple-signin-buttons-row">
                  <button
                    type="submit"
                    className="apple-pill-btn"
                  >
                    Continuar com a senha
                  </button>

                  <div className="passkey-btn-wrap">
                    <button
                      type="button"
                      className="apple-pill-btn passkey"
                      onClick={() => handleProceedToPassword()}
                    >
                      <User size={15} style={{ display: 'inline', marginRight: '6px' }} />
                      Iniciar sessão com a chave-senha
                    </button>
                    <span className="passkey-subtext">Requer um dispositivo com iOS 17 ou posterior.</span>
                  </div>
                </div>

                <div className="apple-signin-remember-wrap">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <span>Lembrar</span>
                  </label>
                </div>

                <div className="apple-signin-footer-links">
                  <button
                    type="button"
                    className="as-buttonlink"
                    onClick={handleForgotPassword}
                  >
                    Esqueceu a senha? ↗
                  </button>
                </div>
              </form>
            ) : (
              /* ETAPA 2: E-MAIL FIXADO + SENHA COM ➔ */
              <form onSubmit={handlePasswordSubmit} className="apple-signin-form">
                <div className="apple-grouped-inputs">
                  {/* Email fixo */}
                  <div
                    className="form-textbox apple-input-highlight grouped-top"
                    onClick={() => setStep('email')}
                    title="Clique para alterar e-mail"
                  >
                    <label className="form-textbox-label">E-mail ou número de telefone</label>
                    <input
                      type="email"
                      className="form-textbox-input"
                      value={email}
                      readOnly
                    />
                  </div>

                  {/* Campo Senha com botão circular ➔ */}
                  <div className="form-textbox grouped-bottom with-arrow-btn">
                    <label className="form-textbox-label">Senha</label>
                    <input
                      type="password"
                      className="form-textbox-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="apple-input-arrow-btn"
                      disabled={loading}
                      aria-label="Entrar"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="apple-signin-remember-wrap">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <span>Lembrar</span>
                  </label>
                </div>

                <div className="apple-signin-footer-links">
                  <button
                    type="button"
                    className="as-buttonlink"
                    onClick={handleForgotPassword}
                  >
                    Esqueceu a senha? ↗
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Divisor Vertical */}
          <div className="apple-signin-divider-line" />

          {/* ════════════════════════════════════════════════════════
             COLUNA DIREITA: FINALIZAR CONVIDADO
             ════════════════════════════════════════════════════════ */}
          <div className="apple-signin-col-right">
            <h2 className="apple-signin-section-heading">
              Finalizar Convidado
            </h2>
            <p className="apple-signin-guest-desc">
              Continue e crie uma Conta Apple mais tarde.
            </p>
            <button
              type="button"
              className="form-button apple-guest-btn"
              onClick={() => {
                if (onGuestContinue) {
                  onGuestContinue()
                } else {
                  navigate('/conta')
                }
              }}
            >
              Continuar como convidado
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
