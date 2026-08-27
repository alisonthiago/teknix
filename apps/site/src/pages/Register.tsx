/* ==========================================================================
   TEKNIX SITE — PÁGINA OFICIAL DE CADASTRO (1:1 PADRÃO APPLE ACCOUNT)
   Referência: https://account.apple.com/account
   ========================================================================== */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RotateCw, Volume2, Users } from 'lucide-react'
import './Register.css'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('Brasil')
  const [day, setDay] = useState('01')
  const [month, setMonth] = useState('01')
  const [year, setYear] = useState('1995')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')

  // Preferences Checkboxes
  const [optAnnouncements, setOptAnnouncements] = useState(true)
  const [optMedia, setOptMedia] = useState(true)

  // Captcha
  const [captchaCode, setCaptchaCode] = useState('4FDM')
  const [captchaInput, setCaptchaInput] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const refreshCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    let res = ''
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaCode(res)
    setCaptchaInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!firstName || !lastName || !email || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas inseridas não coincidem.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas e minúsculas.')
      return
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError('Os caracteres digitados da imagem não conferem. Tente novamente.')
      return
    }

    setLoading(true)
    const fullName = `${firstName} ${lastName}`.trim()
    const result = await signUp(email, password, fullName)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      navigate('/conta')
    }
  }

  return (
    <div className="apple-account-create-page">
      {/* ── Subnav Local Bar 1:1 Apple ── */}
      <nav className="ac-localnav" aria-label="Local">
        <div className="ac-localnav-wrapper">
          <div className="ac-localnav-content">
            <div className="ac-localnav-title">
              <Link to="/conta">Conta TEKNIX</Link>
            </div>
            <div className="ac-localnav-menu">
              <ul className="ac-localnav-menu-items">
                <li className="ac-localnav-menu-item">
                  <Link to="/login" className="ac-localnav-menu-link">Iniciar sessão</Link>
                </li>
                <li className="ac-localnav-menu-item">
                  <span className="ac-localnav-menu-link current">Crie sua Conta TEKNIX</span>
                </li>
                <li className="ac-localnav-menu-item">
                  <Link to="/contato" className="ac-localnav-menu-link">Perguntas frequentes</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content Form (1:1 Apple Account) ── */}
      <div className="account-create-main">
        <div className="account-create-header">
          <h1 className="account-create-title">Crie sua Conta TEKNIX</h1>
          <p className="account-create-subtitle">
            Uma Conta TEKNIX é o que você precisa para acessar todos os serviços da TEKNIX.
          </p>
          <div className="account-create-signin-link">
            <span>Já tem uma Conta TEKNIX? </span>
            <Link to="/login" className="icon-external">Inicie sessão ↗</Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="account-create-form">
          {error && (
            <div className="account-create-error">
              {error}
            </div>
          )}

          {/* Nome e Sobrenome */}
          <div className="form-row-2cols">
            <div className="form-input-group">
              <input
                type="text"
                className="apple-form-input"
                placeholder="Nome"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-input-group">
              <input
                type="text"
                className="apple-form-input"
                placeholder="Sobrenome"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* País / Região */}
          <div className="form-input-group">
            <label className="apple-floating-label">País/região</label>
            <select
              className="apple-form-select"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              <option value="Brasil">Brasil</option>
              <option value="Portugal">Portugal</option>
              <option value="Estados Unidos">Estados Unidos</option>
            </select>
            <span className="apple-select-chevron" />
          </div>

          {/* Data de Nascimento */}
          <div className="form-birthdate-block">
            <div className="form-birthdate-label">
              <span>Data de nascimento</span>
              <span className="form-info-icon" title="Sua data de nascimento nos ajuda a fornecer a experiência correta.">?</span>
            </div>
            <div className="form-birthdate-selects">
              <div className="birthdate-select-wrap">
                <select value={day} onChange={e => setDay(e.target.value)} className="apple-form-select">
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="apple-select-chevron" />
              </div>
              <div className="birthdate-select-wrap">
                <select value={month} onChange={e => setMonth(e.target.value)} className="apple-form-select">
                  <option value="01">janeiro</option>
                  <option value="02">fevereiro</option>
                  <option value="03">março</option>
                  <option value="04">abril</option>
                  <option value="05">maio</option>
                  <option value="06">junho</option>
                  <option value="07">julho</option>
                  <option value="08">agosto</option>
                  <option value="09">setembro</option>
                  <option value="10">outubro</option>
                  <option value="11">novembro</option>
                  <option value="12">dezembro</option>
                </select>
                <span className="apple-select-chevron" />
              </div>
              <div className="birthdate-select-wrap">
                <select value={year} onChange={e => setYear(e.target.value)} className="apple-form-select">
                  {Array.from({ length: 90 }, (_, i) => 2026 - i).map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
                <span className="apple-select-chevron" />
              </div>
            </div>
          </div>

          <div className="form-divider" />

          {/* Email */}
          <div className="form-input-group">
            <input
              type="email"
              className="apple-form-input"
              placeholder="nome@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Senha */}
          <div className="form-input-group">
            <input
              type="password"
              className="apple-form-input"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirmar Senha */}
          <div className="form-input-group">
            <input
              type="password"
              className="apple-form-input"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-divider" />

          {/* Telefone */}
          <div className="form-input-group">
            <div className="phone-header-wrap">
              <input
                type="tel"
                className="apple-form-input"
                placeholder="Número de telefone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
              <span className="form-info-icon" title="Usado para verificação de 2 fatores e segurança">?</span>
            </div>
            <p className="apple-input-helper">
              Certifique-se de inserir um número de telefone que você sempre possa acessar. Ele será usado para verificar a sua identidade quando você iniciar sessão em um novo dispositivo ou em um navegador da web. Taxas de mensagens ou dados podem ser aplicadas.
            </p>
          </div>

          <div className="form-divider" />

          {/* Checkboxes de Preferências */}
          <div className="apple-checkbox-block">
            <label className="apple-checkbox-label">
              <input
                type="checkbox"
                checked={optAnnouncements}
                onChange={e => setOptAnnouncements(e.target.checked)}
              />
              <div className="apple-checkbox-text">
                <strong>Anúncios</strong>
                <p>Receba e-mails e comunicados da TEKNIX com anúncios, marketing, recomendações e atualizações sobre produtos, serviços e software da TEKNIX.</p>
              </div>
            </label>

            <label className="apple-checkbox-label">
              <input
                type="checkbox"
                checked={optMedia}
                onChange={e => setOptMedia(e.target.checked)}
              />
              <div className="apple-checkbox-text">
                <strong>Apps, músicas, TV e mais</strong>
                <p>Receba e-mails e comunicados da TEKNIX com novos lançamentos, conteúdo exclusivo, ofertas especiais, marketing e recomendações de apps, músicas, filmes, TV, livros, podcasts, TEKNIX Pay e mais.</p>
              </div>
            </label>
          </div>

          <div className="form-divider" />

          {/* Captcha 1:1 Apple */}
          <div className="apple-captcha-block">
            <div className="captcha-badge-image">
              <span className="captcha-characters">{captchaCode}</span>
            </div>
            <div className="form-input-group" style={{ flex: 1 }}>
              <input
                type="text"
                className="apple-form-input"
                placeholder="Insira os caracteres da imagem"
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="captcha-actions">
            <button type="button" className="captcha-action-link" onClick={refreshCaptcha}>
              <RotateCw size={13} style={{ display: 'inline', marginRight: '4px' }} /> Novo código
            </button>
            <span className="captcha-sep">|</span>
            <button type="button" className="captcha-action-link" onClick={() => alert(`Código: ${captchaCode.split('').join(' ')}`)}>
              <Volume2 size={13} style={{ display: 'inline', marginRight: '4px' }} /> Pessoas com deficiência visual
            </button>
          </div>

          {/* Privacy Footnote 1:1 Apple */}
          <div className="apple-privacy-statement">
            <div className="privacy-icon-wrap">
              <Users size={32} color="#0071e3" />
            </div>
            <p>
              Usamos as informações da sua Conta TEKNIX para possibilitar um início de sessão seguro e acessar seus dados. A TEKNIX registra determinados dados para fins de segurança, suporte e geração de relatórios.
            </p>
          </div>

          {/* Submit */}
          <div className="account-create-submit">
            <button type="submit" className="apple-submit-btn" disabled={loading}>
              {loading ? 'Criando conta...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
