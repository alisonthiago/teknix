import { Editable } from '../components/page-widgets/PageWidgets'
import React, { useEffect, useState } from 'react'
import { getCustomerByUserId, createOrUpdateCustomer, getAddressesByUserId, createAddress, updateAddress } from '../services/customer'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import './Account.css'

export default function Account() {
  const { user, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Nome do usuário (se autenticado ou padrão Alison)
  const userName = user?.user_metadata?.first_name || user?.user_metadata?.name || 'Cliente'

  const { pathname } = useLocation()
  const sectionRoutes = { cadastro: '/conta/dados-cadastrais', enderecos: '/conta/enderecos', seguranca: '/conta/seguranca', help: '/conta/atendimento' }
  const activeModal = Object.entries(sectionRoutes).find(([, route]) => route === pathname)?.[0] || null
  const isOverview = ['/conta', '/minha-conta', '/account'].includes(pathname)
  const setActiveModal = (section: keyof typeof sectionRoutes | null) => navigate(section ? sectionRoutes[section] : '/conta')

  // Estado dos dados cadastrais
  const [cadastroData, setCadastroData] = useState({
    nome: '', cpf: '', email: user?.email || '', telefone: '', dataNascimento: '',
  })
  const profileName = cadastroData.nome.trim() || userName
  const profileInitials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase() || 'TC'
  const [profileAvatar, setProfileAvatar] = useState('')

  // Estado dos endereços
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileSnapshot, setProfileSnapshot] = useState(cadastroData)
  const [profileNotice, setProfileNotice] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user || uploadingAvatar) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setProfileNotice('Escolha uma imagem de até 5 MB.')
      return
    }
    const previousAvatar = profileAvatar
    setUploadingAvatar(true)
    setProfileNotice('Enviando foto…')
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('user-avatars').upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('user-avatars').getPublicUrl(path)
      if (!data.publicUrl) throw new Error('url')
      const { error: profileError } = await supabase.auth.updateUser({ data: { ...user.user_metadata, avatar_url: data.publicUrl } })
      if (profileError) throw profileError
      setProfileAvatar(data.publicUrl)
      setProfileNotice('Foto atualizada.')
    } catch {
      setProfileAvatar(previousAvatar)
      setProfileNotice('Não foi possível enviar a foto. Tente novamente.')
    } finally { setUploadingAvatar(false) }
  }

  const startEditingProfile = () => {
    setProfileSnapshot({ ...cadastroData })
    setProfileNotice('')
    setEditingProfile(true)
  }
  const cancelEditingProfile = () => {
    setCadastroData(profileSnapshot)
    setEditingProfile(false)
  }
  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || saving) return
    setSaving(true)
    setProfileNotice('')
    try {
      const saved = await createOrUpdateCustomer(user, { name: cadastroData.nome.trim(), phone: cadastroData.telefone.trim() })
      if (!saved) throw new Error('save')
      setEditingProfile(false)
      setProfileNotice('Dados salvos na sua conta.')
    } catch { setProfileNotice('Não foi possível salvar. Seus dados continuam no formulário para tentar novamente.') }
    finally { setSaving(false) }
  }

  const [addressData, setAddressData] = useState({
    cep: '', rua: '', bairro: '', cidade: '', estado: '', numero: '', complemento: '',
  })

  const [editingAddress, setEditingAddress] = useState(false)
  const [addressSnapshot, setAddressSnapshot] = useState(addressData)
  const [addressNotice, setAddressNotice] = useState('')
  const [addressId, setAddressId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [accountLoading, setAccountLoading] = useState(true)
  const [accountError, setAccountError] = useState('')
  const [addressError, setAddressError] = useState('')

  useEffect(() => {
    let active = true
    setAccountLoading(true)
    setAccountError('')
    setAddressError('')
    setEditingProfile(false)
    setEditingAddress(false)
    if (!user) { setAccountLoading(false); return }
    Promise.all([getCustomerByUserId(user.id), getAddressesByUserId(user.id).catch(() => {
      if (active) setAddressError('O serviço de endereços está indisponível. Tente novamente mais tarde.')
      return []
    })])
      .then(([customer, addresses]) => {
        if (!active) return
        setCadastroData({ nome: customer?.name || user.user_metadata?.name || '', cpf: customer?.document || customer?.cpf_cnpj || '', email: user.email || '', telefone: customer?.phone || '', dataNascimento: customer?.birth_date || '' })
        const address = addresses[0]
        setAddressId(address?.id || null)
        setAddressData({ cep: address?.zip_code || '', rua: address?.street || '', bairro: address?.neighborhood || '', cidade: address?.city || '', estado: address?.state || '', numero: address?.number || '', complemento: address?.complement || '' })
      })
      .catch(() => { if (active) setAccountError('Não foi possível carregar sua conta. Atualize a página para tentar novamente.') })
      .finally(() => { if (active) setAccountLoading(false) })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    setProfileAvatar(typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '')
  }, [user])

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || saving) return
    setSaving(true)
    setAddressNotice('')
    try {
      const payload = { street: addressData.rua.trim(), number: addressData.numero.trim(), complement: addressData.complemento.trim(), neighborhood: addressData.bairro.trim(), city: addressData.cidade.trim(), state: addressData.estado.trim().toUpperCase(), zip_code: addressData.cep.trim() }
      if (addressId) {
        if (!await updateAddress(addressId, user.id, payload)) throw new Error('save')
      } else {
        const saved = await createAddress({ ...payload, user_id: user.id, label: 'Entrega', is_default: false })
        if (!saved) throw new Error('save')
        setAddressId(saved.id)
      }
      setEditingAddress(false)
      setAddressNotice('Endereço salvo na sua conta.')
    } catch { setAddressNotice('Não foi possível salvar. Seus dados continuam no formulário para tentar novamente.') }
    finally { setSaving(false) }
  }

  // Estado de segurança
  const [securityData, setSecurityData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  })
  const [showSecurityPasswords, setShowSecurityPasswords] = useState(false)

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
    } catch {
      // ignore
    }
    navigate('/')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      setActiveModal(null)
    }, 1200)
  }

  if (authLoading || accountLoading) return <div className="cb-account-wrapper" role="status">Carregando sua conta…</div>
  if (!user) return <div className="cb-account-wrapper"><Link to="/login">Entre para acessar sua conta</Link></div>
  if (accountError) return <div className="cb-account-wrapper" role="alert">{accountError} <Link to="/conta">Voltar à conta</Link></div>
  if (activeModal === 'enderecos' && addressError) return <div className="cb-account-wrapper" role="alert">{addressError} <Link to="/conta">Voltar à conta</Link></div>

  return (
    <div className="cb-account-wrapper">
      {/* ── NAVEGAÇÃO DA CONTA ── */}
      <aside className="cb-account-sidebar">
        <div className="cb-account-greeting">
          <Editable as="p" widgetId="account-1" className="cb-account-greeting-prefix">Boas-vindas,</Editable>
          <Editable content={{}} as="h2" widgetId="account-2" className="cb-account-greeting-name">{profileName}</Editable>
        </div>

        <nav className="cb-account-nav-list" aria-label="Minha conta">
          <Link to="/pedidos" className="cb-account-nav-item">
            <span className="cb-account-nav-icon">
              {/* Ícone Caixa */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            <span>Meus pedidos</span>
          </Link>


<Link to="/conta/enderecos" className="cb-account-nav-item">
            <span className="cb-account-nav-icon">
              {/* Ícone Localização */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span>Endereços</span>
          </Link>

<Link to="/conta/dados-cadastrais" className="cb-account-nav-item">
            <span className="cb-account-nav-icon">
              {/* Ícone Usuário */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span>Dados cadastrais</span>
          </Link>



          <Link to="/salvos" className="cb-account-nav-item">
            <span className="cb-account-nav-icon">
              {/* Ícone Presente */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </span>
            <span>Lista de presentes</span>
          </Link>

<Link to="/conta/seguranca" className="cb-account-nav-item">
            <span className="cb-account-nav-icon">
              {/* Ícone Cadeado */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <span>Segurança</span>
          </Link>

<Link to="/conta/garantias" className="cb-account-nav-item">
            <span className="cb-account-nav-icon">
              {/* Ícone Escudo */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span>Garantias e seguros</span>
          </Link>

          <a
            href="https://wa.me/5546999155875?text=Ol%C3%A1,%20gostaria%20de%20atendimento%20TEKNIX"
            target="_blank"
            rel="noreferrer"
            className="cb-account-nav-item"
          >
            <span className="cb-account-nav-icon">
              {/* Ícone WhatsApp */}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.97.53 1.871.815 2.796.815 3.183 0 5.769-2.586 5.77-5.766.001-3.181-2.585-5.769-5.77-5.769zm3.376 8.21c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.023-.474-1.697-.703-2.766-2.451-2.85-2.564-.084-.112-.686-.913-.686-1.741 0-.829.434-1.237.588-1.405.155-.168.337-.21.45-.21.112 0 .225.001.324.006.104.005.244-.04.382.291.144.344.492 1.2.535 1.287.043.088.072.19.014.303-.058.112-.087.183-.173.283-.087.1-.183.224-.261.3-.087.085-.178.177-.077.35.101.173.45 1.08 1.155 1.706.911.81 1.68 1.06 1.919 1.178.239.118.379.099.521-.065.141-.164.606-.706.768-.948.162-.242.324-.202.544-.121.22.08 1.393.657 1.632.776.239.119.398.178.456.277.058.1.058.577-.086.982z" />
              </svg>
            </span>
            <span>Me Chama no Zap</span>
          </a>
        </nav>

        <div className="cb-account-logout-wrap">
          <button type="button" className="cb-account-logout-btn" onClick={handleLogout}>
            Desconectar
          </button>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL DIREITA ── */}
      {isOverview && <Editable content={{}} as="section" widgetId="account-3" className="cb-account-main" aria-labelledby="account-title">
        <Editable as="h1" widgetId="account-4" id="account-title" className="cb-account-main-title">Minha conta</Editable>
        <Editable as="p" widgetId="account-5" className="cb-account-main-subtitle">Pedidos, dados e preferências.</Editable>

        {/* ── GRID 2x2 DE CARDS PRINCIPAIS ── */}
        <div className="cb-account-cards-grid">
          {/* Card 1: Meus Pedidos */}
          <Link to="/pedidos" className="cb-account-card">
            <div className="cb-account-card-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="cb-account-card-content">
              <Editable as="h3" widgetId="account-6" className="cb-account-card-title">Meus pedidos</Editable>
              <Editable as="p" widgetId="account-7" className="cb-account-card-desc">Detalhes, status e histórico.</Editable>
            </div>
          </Link>

          {/* Card 2: Dados Cadastrais */}
<Link to="/conta/dados-cadastrais" className="cb-account-card">
            <div className="cb-account-card-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="cb-account-card-content">
              <Editable as="h3" widgetId="account-8" className="cb-account-card-title">Dados cadastrais</Editable>
              <Editable as="p" widgetId="account-9" className="cb-account-card-desc">Atualize suas informações pessoais.</Editable>
            </div>
          </Link>

          {/* Card 3: Endereços */}
<Link to="/conta/enderecos" className="cb-account-card">
            <div className="cb-account-card-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="cb-account-card-content">
              <Editable as="h3" widgetId="account-10" className="cb-account-card-title">Endereços</Editable>
              <Editable as="p" widgetId="account-11" className="cb-account-card-desc">Cadastre ou altere seu endereço.</Editable>
            </div>
          </Link>

          {/* Card 4: Segurança */}
<Link to="/conta/seguranca" className="cb-account-card">
            <div className="cb-account-card-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="cb-account-card-content">
              <Editable as="h3" widgetId="account-12" className="cb-account-card-title">Segurança</Editable>
              <Editable as="p" widgetId="account-13" className="cb-account-card-desc">Senha, dispositivos e biometria.</Editable>
            </div>
          </Link>
        </div>

        {/* ── LINHA DIVISÓRIA ── */}
        <div className="cb-account-divider" />

        {/* ── SEÇÃO ATENDIMENTO ── */}
        <Editable as="section" widgetId="account-14" className="cb-account-support-section">
          <div>
            <Editable as="h2" widgetId="account-15">Precisa de ajuda?</Editable>
            <Editable as="p" widgetId="account-16" className="cb-account-support-desc">Conte com a gente para tirar suas dúvidas.</Editable>
          </div>
          <button
            type="button"
            className="cb-account-support-btn"
            onClick={() => setActiveModal('help')}
          >
            Falar com atendimento
          </button>
        </Editable>
      </Editable>}

      {!isOverview && <Editable content={{}} as="section" widgetId="account-17" className="cb-account-detail">
        <Link to="/conta" className="cb-account-back">← Voltar para minha conta</Link>
        {pathname === '/conta/lojas-fisicas' && <div className="cb-account-detail-content cb-account-legacy-help">
          <Editable as="h1" widgetId="account-18" className="cb-account-main-title">Meus pedidos lojas físicas</Editable>
          <Editable as="p" widgetId="account-19">Para consultar uma compra feita em loja física, fale com nossa equipe e tenha o número do pedido ou comprovante em mãos.</Editable>
          <Link className="cb-account-support-btn" to="/contato">Consultar uma compra</Link>
        </div>}
        {pathname === '/conta/garantias' && <>
          <Editable as="h1" widgetId="account-20" className="cb-account-main-title">Garantias e seguros</Editable>
          <Editable as="p" widgetId="account-21">Precisa de suporte para um produto? Consulte seu pedido ou entre em contato com nossa equipe para receber orientação.</Editable>
          <div className="cb-modal-actions">
            <Link className="cb-account-support-btn" to="/pedidos">Ver meus pedidos</Link>
            <Link className="cb-account-support-btn" to="/contato">Falar com atendimento</Link>
          </div>
        </>}

      {/* ── MODAL: DADOS CADASTRAIS ── */}
      {activeModal === 'cadastro' && (
        <div className="cb-account-detail-content">
        <div className="cb-account-form-panel">
            <div className="cb-modal-header">
              <div className="cb-profile-heading">
                <label className="cb-profile-avatar-upload" title="Alterar foto de perfil">
                  <span className="cb-profile-avatar">{profileAvatar ? <Editable as="img" widgetId="account-22" src={profileAvatar} alt="Foto de perfil" /> : profileInitials}</span>
                  <span className="cb-profile-avatar-action">{uploadingAvatar ? 'Enviando' : 'Alterar foto'}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </label>
                <div>
                <Editable as="h1" widgetId="account-23" className="cb-account-main-title">Dados cadastrais</Editable>
                <Editable as="p" widgetId="account-24" className="cb-profile-intro">Suas informações pessoais, sempre à mão.</Editable>
                </div>
              </div>
              {!editingProfile && <button type="button" className="cb-account-support-btn" onClick={startEditingProfile}>Editar dados</button>}
            </div>

            {profileNotice && <Editable content={{}} as="p" widgetId="account-25" className="cb-profile-notice" role="status">{profileNotice}</Editable>}
            {!editingProfile ? <dl className="cb-profile-summary">
              <div><dt>Nome completo</dt><dd>{cadastroData.nome || 'Não informado'}</dd></div>
              <div><dt>CPF</dt><dd>{cadastroData.cpf || 'Não informado'}</dd></div>
              <div><dt>E-mail</dt><dd>{cadastroData.email || 'Não informado'}</dd></div>
              <div><dt>Telefone celular</dt><dd>{cadastroData.telefone || 'Não informado'}</dd></div>
            </dl> : <form onSubmit={saveProfile} className="cb-modal-form">
              <Editable as="p" widgetId="account-26" className="cb-profile-notice">O e-mail de acesso e o documento não são alterados neste formulário.</Editable>
              <div className="cb-form-group">
                <label htmlFor="profile-name">Nome Completo</label>
                <input
                  id="profile-name"
                  type="text"
                  className="cb-form-input"
                  value={cadastroData.nome}
                  onChange={(e) => setCadastroData({ ...cadastroData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="cb-form-group">
                <label htmlFor="profile-cpf">CPF</label>
                <input
                  id="profile-cpf"
                  type="text"
                  className="cb-form-input"
                  value={cadastroData.cpf}
                  disabled
                />
              </div>

              <div className="cb-form-group">
                <label htmlFor="profile-email">E-mail</label>
                <input
                  id="profile-email"
                  readOnly
                  type="email"
                  className="cb-form-input"
                  value={cadastroData.email}
                  onChange={(e) => setCadastroData({ ...cadastroData, email: e.target.value })}
                  required
                />
              </div>

              <div className="cb-form-group">
                <label htmlFor="profile-phone">Telefone Celular</label>
                <input
                  id="profile-phone"
                  type="text"
                  className="cb-form-input"
                  value={cadastroData.telefone}
                  onChange={(e) => setCadastroData({ ...cadastroData, telefone: e.target.value })}
                  required
                />
              </div>

              {savedSuccess && (
                <Editable as="p" widgetId="account-27" style={{ color: '#047857', fontWeight: 'var(--tkn-weight-medium)', margin: 0 }}>
                  ✓ Dados atualizados com sucesso!
                </Editable>
              )}

              <div className="cb-modal-actions">
                <button type="button" className="cb-btn-cancel" disabled={saving} onClick={cancelEditingProfile}>
                  Cancelar
                </button>
                <button type="submit" className="cb-btn-save" disabled={saving}>
                  Salvar alterações
                </button>
              </div>
            </form>}
          </div>
        </div>
      )}

      {/* ── MODAL: ENDEREÇOS ── */}
      {activeModal === 'enderecos' && (
        <div className="cb-account-detail-content">
        <div className="cb-account-form-panel">
            <div className="cb-modal-header">
              <Editable as="h1" widgetId="account-28" className="cb-account-main-title">Endereço de entrega</Editable>
              {!editingAddress && <button type="button" className="cb-account-support-btn" onClick={() => {
                setAddressSnapshot(addressData)
                setAddressNotice('')
                setEditingAddress(true)
              }}>Editar endereço</button>}
            </div>

            {addressNotice && <Editable content={{}} as="p" widgetId="account-29" className="cb-profile-notice" role="status">{addressNotice}</Editable>}
            {!editingAddress ? <dl className="cb-profile-summary">
              <div><dt>CEP</dt><dd>{addressData.cep}</dd></div>
              <div><dt>Logradouro / Rua</dt><dd>{addressData.rua}</dd></div>
              <div><dt>Número</dt><dd>{addressData.numero}</dd></div>
              <div><dt>Complemento</dt><dd>{addressData.complemento || 'Não informado'}</dd></div>
              <div><dt>Bairro</dt><dd>{addressData.bairro}</dd></div>
              <div><dt>Cidade / Estado</dt><dd>{addressData.cidade} / {addressData.estado}</dd></div>
            </dl> : <form onSubmit={saveAddress} className="cb-modal-form">
              <div className="cb-form-group">
                <label>CEP</label>
                <input
                  type="text"
                  className="cb-form-input"
                  value={addressData.cep}
                  onChange={(e) => setAddressData({ ...addressData, cep: e.target.value })}
                  required
                />
              </div>

              <div className="cb-form-group">
                <label>Logradouro / Rua</label>
                <input
                  type="text"
                  className="cb-form-input"
                  value={addressData.rua}
                  onChange={(e) => setAddressData({ ...addressData, rua: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="cb-form-group">
                  <label>Número</label>
                  <input
                    type="text"
                    className="cb-form-input"
                    value={addressData.numero}
                    onChange={(e) => setAddressData({ ...addressData, numero: e.target.value })}
                    required
                  />
                </div>
                <div className="cb-form-group">
                  <label>Complemento</label>
                  <input
                    type="text"
                    className="cb-form-input"
                    value={addressData.complemento}
                    onChange={(e) => setAddressData({ ...addressData, complemento: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="cb-form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    className="cb-form-input"
                    value={addressData.cidade}
                    onChange={(e) => setAddressData({ ...addressData, cidade: e.target.value })}
                    required
                  />
                </div>
                <div className="cb-form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    className="cb-form-input"
                    value={addressData.estado}
                    onChange={(e) => setAddressData({ ...addressData, estado: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="cb-form-group">
                <label htmlFor="address-neighborhood">Bairro</label>
                <input id="address-neighborhood" className="cb-form-input" value={addressData.bairro} onChange={(event) => setAddressData({ ...addressData, bairro: event.target.value })} required />
              </div>

              <div className="cb-modal-actions">
                <button type="button" className="cb-btn-cancel" disabled={saving} onClick={() => { setAddressData(addressSnapshot); setEditingAddress(false) }}>
                  Cancelar
                </button>
                <button type="submit" className="cb-btn-save" disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar endereço'}
                </button>
              </div>
            </form>}
          </div>
        </div>
      )}

      {/* ── MODAL: SEGURANÇA ── */}
      {activeModal === 'seguranca' && (
        <div className="cb-account-detail-content">
        <div className="cb-account-form-panel">
            <div className="cb-modal-header">
              <Editable as="h3" widgetId="account-30">Segurança da Conta</Editable>
              <button
                type="button"
                className="cb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="cb-modal-form">
              <div className="cb-form-group cb-password-group">
                <label>Senha Atual</label>
                <input
                  type={showSecurityPasswords ? 'text' : 'password'}
                  className="cb-form-input"
                  value={securityData.senhaAtual}
                  onChange={(e) => setSecurityData({ ...securityData, senhaAtual: e.target.value })}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="cb-password-toggle" onClick={() => setShowSecurityPasswords(open => !open)} aria-label={showSecurityPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}>{showSecurityPasswords ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>

              <div className="cb-form-group cb-password-group">
                <label>Nova Senha</label>
                <input
                  type={showSecurityPasswords ? 'text' : 'password'}
                  className="cb-form-input"
                  value={securityData.novaSenha}
                  onChange={(e) => setSecurityData({ ...securityData, novaSenha: e.target.value })}
                  placeholder="No mínimo 8 caracteres"
                  required
                />
                <button type="button" className="cb-password-toggle" onClick={() => setShowSecurityPasswords(open => !open)} aria-label={showSecurityPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}>{showSecurityPasswords ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>

              <div className="cb-form-group cb-password-group">
                <label>Confirmar Nova Senha</label>
                <input
                  type={showSecurityPasswords ? 'text' : 'password'}
                  className="cb-form-input"
                  value={securityData.confirmarSenha}
                  onChange={(e) => setSecurityData({ ...securityData, confirmarSenha: e.target.value })}
                  placeholder="Repita a nova senha"
                  required
                />
                <button type="button" className="cb-password-toggle" onClick={() => setShowSecurityPasswords(open => !open)} aria-label={showSecurityPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}>{showSecurityPasswords ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>

              {savedSuccess && (
                <Editable as="p" widgetId="account-31" style={{ color: '#047857', fontWeight: 'var(--tkn-weight-medium)', margin: 0 }}>
                  ✓ Senha atualizada com sucesso!
                </Editable>
              )}

              <div className="cb-modal-actions">
                <button type="button" className="cb-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className="cb-btn-save">
                  Alterar senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ATENDIMENTO ── */}
      {activeModal === 'help' && (
        <div className="cb-account-detail-content">
        <div className="cb-account-form-panel">
            <div className="cb-modal-header">
              <Editable as="h3" widgetId="account-32">Central de Atendimento TEKNIX</Editable>
              <button
                type="button"
                className="cb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
              <Editable as="p" widgetId="account-33" style={{ color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                Estamos à disposição para te ajudar de segunda a sexta-feira, das 8h30 às 18h.
              </Editable>

              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <Editable as="p" widgetId="account-34" style={{ margin: '0 0 6px 0', fontWeight: 'var(--tkn-weight-medium)', color: '#0033c6' }}>
                  📱 WhatsApp Oficial
                </Editable>
                <Editable as="p" widgetId="account-35" style={{ margin: 0, color: '#1f2937', fontSize: '15px' }}>
                  (46) 99915-5875
                </Editable>
              </div>

              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <Editable as="p" widgetId="account-36" style={{ margin: '0 0 6px 0', fontWeight: 'var(--tkn-weight-medium)', color: '#0033c6' }}>
                  ✉️ E-mail SAC
                </Editable>
                <Editable as="p" widgetId="account-37" style={{ margin: 0, color: '#1f2937', fontSize: '15px' }}>
                  sac@teknix.com.br
                </Editable>
              </div>
            </div>

            <div className="cb-modal-actions">
              <button type="button" className="cb-btn-cancel" onClick={() => setActiveModal(null)}>
                Fechar
              </button>
              <a
                href="https://wa.me/5546999155875?text=Ol%C3%A1,%20gostaria%20de%20atendimento%20TEKNIX"
                target="_blank"
                rel="noreferrer"
                className="cb-btn-save"
                style={{ textDecoration: 'none' }}
              >
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
      </Editable>}
    </div>
  )
}
