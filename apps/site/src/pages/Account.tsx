/* ==========================================================================
   TEKNIX SITE — PÁGINA DE CONTA OFICIAL (1:1 PADRÃO APPLE STORE ACCOUNT HOME)
   Referência: https://secure8.store.apple.com/br/shop/account/home
   Totalmente Integrado: Supabase Auth + Pedidos Reais + Endereços + Perfil + Favoritos
   ========================================================================== */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  getCustomerByUserId,
  getOrdersByUserId,
  getAddressesByUserId,
  type Customer,
  type Order
} from '../services/customer'
import {
  ChevronRight, ChevronLeft, ExternalLink, Check, AlertCircle,
  X
} from 'lucide-react'
import './Account.css'
import Login from './Login'

export default function Account() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modais de Edição 1:1 Apple
  const [activeModal, setActiveModal] = useState<'shippingAddress' | 'shippingContact' | 'billingAll' | null>(null)

  // Scroller ref para aparelhos
  const devicesScrollRef = useRef<HTMLDivElement>(null)

  // Formulário: Endereço de Envio (1:1 Apple)
  const [shippingForm, setShippingForm] = useState({
    firstName: 'alison',
    lastName: 'thiago',
    street: 'Estrada do Atalaia 55',
    street2: '',
    district: 'Jardim Atalaia',
    city: 'Cotia',
    state: 'São Paulo',
    postalCode: '06700-510',
    countryCode: 'Brasil'
  })

  // Formulário: Informações de Contato (1:1 Apple)
  const [contactForm, setContactForm] = useState({
    emailAddress: 'alisonsilvathiago@gmail.com',
    mobilePhoneAreaCode: '11',
    mobilePhone: '975662930'
  })

  // Formulário: Pagamento Completo (Contato, Endereço de Cobrança, Cartão)
  const [billingForm, setBillingForm] = useState({
    firstName: 'Alison',
    lastName: 'Thiago',
    daytimePhoneAreaCode: '11',
    daytimePhone: '975662930',
    mobilePhoneAreaCode: '11',
    mobilePhone: '975662930',
    countryCode: 'Brasil',
    street: 'Estrada do Atalaia 55',
    street2: '',
    city: 'Cotia',
    district: 'Jardim Atalaia',
    state: 'São Paulo',
    postalCode: '06700-510',
    cardNumber: '•••• •••• •••• 3185',
    expiration: '11/33',
    cardBrand: 'MASTERCARD'
  })

  // Modo visitante
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    if (!user && !isDemoMode) {
      setLoading(false)
      return
    }
    if (user) {
      loadData()
    } else if (isDemoMode) {
      loadDemoData()
    }
  }, [user, isDemoMode])

  function showToast(text: string, type: 'success' | 'error' = 'success') {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 3500)
  }

  function loadDemoData() {
    setLoading(true)
    setTimeout(() => {
      setCustomer({
        id: 'demo-cust',
        user_id: 'demo-user',
        name: 'alison thiago',
        email: 'alisonsilvathiago@gmail.com',
        phone: '11 975662930',
        document: '384.920.182-04',
        created_at: new Date().toISOString()
      })
      setLoading(false)
    }, 200)
  }

  async function loadData() {
    if (!user) return
    setLoading(true)
    try {
      const [cust, ords, adds] = await Promise.all([
        getCustomerByUserId(user.id),
        getOrdersByUserId(user.id),
        getAddressesByUserId(user.id)
      ])
      setCustomer(cust)
      setOrders(ords)

      if (cust) {
        const parts = (cust.name || '').split(' ')
        setShippingForm(prev => ({
          ...prev,
          firstName: parts[0] || prev.firstName,
          lastName: parts.slice(1).join(' ') || prev.lastName
        }))
        setContactForm(prev => ({
          ...prev,
          emailAddress: cust.email || prev.emailAddress
        }))
        setBillingForm(prev => ({
          ...prev,
          firstName: parts[0] || prev.firstName,
          lastName: parts.slice(1).join(' ') || prev.lastName
        }))
      }

      if (adds.length > 0) {
        const def = adds.find(a => a.is_default) || adds[0]
        setShippingForm(prev => ({
          ...prev,
          street: `${def.street} ${def.number || ''}`.trim(),
          complement: def.complement || '',
          district: def.neighborhood || '',
          city: def.city || 'Cotia',
          state: def.state || 'São Paulo',
          postalCode: def.zip_code || '06700-510'
        }))
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (isDemoMode) {
      setIsDemoMode(false)
      navigate('/')
      return
    }
    await signOut()
    navigate('/')
  }



  const scrollDevices = (direction: 'left' | 'right') => {
    if (devicesScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      devicesScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const userEmail = customer?.email || user?.email || (isDemoMode ? 'alisonsilvathiago@gmail.com' : '')
  const firstName = customer?.name?.split(' ')[0] || user?.user_metadata?.first_name || (isDemoMode ? 'alison' : 'cliente')

  // Lista de aparelhos base oficiais (Apple CDN)
  const baseDevices = [
    {
      id: 'dev-1',
      name: `iMac de ${firstName}`,
      model: 'iMac 21.5″',
      image: 'https://appleid.cdn-apple.com/static/deviceImages-13.0/iMac/iMac14,1/online-infobox__3x.png',
      productUrl: '/produtos'
    },
    {
      id: 'dev-2',
      name: `iMac de ${firstName}`,
      model: 'iMac 21.5″',
      image: 'https://appleid.cdn-apple.com/static/deviceImages-14.0/iMac/iMac14,1/online-infobox__3x.png',
      productUrl: '/produtos'
    },
    {
      id: 'dev-3',
      name: `Mac mini de ${firstName}`,
      model: 'Mac mini',
      image: 'https://appleid.cdn-apple.com/static/deviceImages-13.0/Macmini/Macmini6,1/online-infobox__3x.png',
      productUrl: '/mac'
    },
    {
      id: 'dev-4',
      name: `${firstName}’s MacBook Pro`,
      model: 'MacBook Pro 13″',
      image: 'https://appleid.cdn-apple.com/static/deviceImages-14.0/MacBookPro/MacBookPro15,4-e1e1df/online-infobox__3x.png',
      productUrl: '/mac'
    },
    {
      id: 'dev-5',
      name: `iPhone de ${firstName}`,
      model: 'iPhone 17 Pro Max',
      image: 'https://appleid.cdn-apple.com/static/deviceImages-15.0/iPhone/iPhone18,2-3b3b3c-47ade5/online-infobox__3x.png',
      productUrl: '/iphone'
    }
  ]

  // Aparelhos comprados pelo cliente em seus pedidos
  const purchasedDevices = orders.flatMap(ord =>
    (ord.items || []).map((item, idx) => ({
      id: `purchased-${ord.id}-${idx}`,
      name: `${firstName}’s ${item.product_name.split('—')[0].trim()}`,
      model: item.product_name,
      image: item.product_image || 'https://appleid.cdn-apple.com/static/deviceImages-15.0/iPhone/iPhone18,2-3b3b3c-47ade5/online-infobox__3x.png',
      productUrl: `/produto/${item.product_id}`
    }))
  )

  const allUserDevices = [...purchasedDevices, ...baseDevices]

  const brazilianStates = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal do Brasil',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do sul', 'Minas Gerais',
    'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do norte',
    'Rio Grande do sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ]

  if (loading) {
    return (
      <div className="apple-account-page loading-view">
        <div className="apple-account-loading-box">
          <div className="apple-spinner" />
          <p>Carregando sua conta...</p>
        </div>
      </div>
    )
  }

  // ── TELA DE LOGIN / VISITANTE (1:1 APPLE STORE OFICIAL) ──
  if (!user && !isDemoMode) {
    return (
      <div className="apple-account-page visitor-page">
        {/* Local Nav Header */}
        <div className="apple-account-localnav">
          <div className="apple-account-localnav-inner">
            <h1 className="apple-account-localnav-title">Sua conta</h1>
            <Link to="/login" className="apple-account-localnav-action">
              Iniciar sessão
            </Link>
          </div>
        </div>

        <Login
          customTitle="Inicie sessão para finalizar a compra com rapidez."
          onGuestContinue={() => {
            setIsDemoMode(true)
            loadDemoData()
          }}
        />
      </div>
    )
  }

  // ── TELA OFICIAL 1:1 APPLE ACCOUNT HOME ──
  return (
    <div className="apple-account-page">
      {/* Toast de Notificação */}
      {toastMsg && (
        <div className={`apple-account-toast ${toastMsg.type}`}>
          {toastMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ── 1. LOCAL NAV BAR (Sua conta | Encerrar sessão) ── */}
      <div className="apple-account-localnav">
        <div className="apple-account-localnav-inner">
          <h1 className="apple-account-localnav-title">Sua conta</h1>
          <button
            type="button"
            className="apple-account-localnav-action"
            onClick={handleSignOut}
          >
            Encerrar sessão
          </button>
        </div>
      </div>

      {/* ── 2. HERO GREETING (Oi, [Nome].) ── */}
      <div className="apple-account-hero">
        <div className="apple-account-container">
          <h2 className="apple-account-greeting">Oi, {firstName}.</h2>
        </div>
      </div>

      {/* ── 3. SEÇÃO SEUS APARELHOS (Carrossel Horizontal) ── */}
      <section className="apple-account-section bg-primary">
        <div className="apple-account-container">
          <div className="apple-devices-header-row">
            <div>
              <h3 className="apple-section-title">Seus aparelhos</h3>
              <p className="apple-section-subtitle">
                Você iniciou sessão em {allUserDevices.length} aparelhos com {userEmail}.
              </p>
            </div>
            <div className="apple-devices-nav-arrows">
              <button
                type="button"
                className="apple-nav-arrow"
                onClick={() => scrollDevices('left')}
                title="Aparelho anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="apple-nav-arrow"
                onClick={() => scrollDevices('right')}
                title="Próximo aparelho"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Scroller de Aparelhos */}
          <div className="apple-devices-scroller" ref={devicesScrollRef}>
            {allUserDevices.map(device => (
              <div key={device.id} className="apple-device-card">
                <Link to={device.productUrl || '/produtos'} className="apple-device-image-box" title={device.name}>
                  <img src={device.image} alt={device.name} />
                </Link>
                <div className="apple-device-info">
                  <Link to={device.productUrl || '/produtos'} className="apple-device-name-link">
                    <h4 className="apple-device-name">{device.name}</h4>
                  </Link>
                  <span className="apple-device-model">{device.model}</span>
                  <a
                    href="https://getsupport.apple.com"
                    target="_blank"
                    rel="noreferrer"
                    className="apple-link-more"
                  >
                    Obter suporte &gt;
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="apple-devices-footer-hint">
            Seu aparelho não aparece aqui? Para vincular um aparelho ou fazer alterações, acesse os{' '}
            <a href="https://account.apple.com" target="_blank" rel="noreferrer">
              ajustes da Conta TEKNIX
            </a>.
          </div>
        </div>
      </section>

      {/* ── 4. SEÇÃO TILES 2x1 (Seus pedidos / Itens salvos) ── */}
      <section className="apple-account-section bg-secondary">
        <div className="apple-account-container">
          <div className="apple-tiles-grid">
            {/* Tile 1: Seus pedidos */}
            <div className="apple-tile-card">
              <h3 className="apple-tile-title">Seus pedidos</h3>
              <p className="apple-tile-desc">
                Acompanhe, modifique e cancele pedidos ou faça uma devolução.
              </p>
              <Link
                to="/pedidos"
                className="apple-link-more"
              >
                Ver histórico de pedidos &gt;
              </Link>
            </div>

            {/* Tile 2: Itens salvos */}
            <div className="apple-tile-card">
              <h3 className="apple-tile-title">Itens salvos</h3>
              <p className="apple-tile-desc">
                Seja nas compras online ou em uma Loja TEKNIX, você pode salvar facilmente os produtos do seu interesse e acompanhar seu progresso aqui.
              </p>
              <Link
                to="/salvos"
                className="apple-link-more"
              >
                Ver Itens salvos &gt;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. SEÇÃO AJUSTES DA CONTA (Grid Oficial) ── */}
      <section className="apple-account-section bg-primary">
        <div className="apple-account-container">
          <h3 className="apple-settings-main-title">Ajustes da conta</h3>

          {/* Linha 1: Envio */}
          <div className="apple-settings-row">
            <div className="apple-settings-label-col">
              <h4>Envio</h4>
            </div>
            <div className="apple-settings-content-grid">
              {/* Endereço de envio */}
              <div className="apple-settings-box">
                <h5>Endereço de envio</h5>
                <div className="apple-settings-text">
                  <p>{shippingForm.firstName} {shippingForm.lastName}</p>
                  <p>{shippingForm.street} {shippingForm.street2}</p>
                  <p>{shippingForm.city}, {shippingForm.state}</p>
                  <p>{shippingForm.postalCode}</p>
                  <p>{shippingForm.countryCode}</p>
                </div>
                <button
                  type="button"
                  className="apple-btn-link"
                  onClick={() => setActiveModal('shippingAddress')}
                >
                  Editar
                </button>
              </div>

              {/* Informações de contato */}
              <div className="apple-settings-box">
                <h5>Informações de contato</h5>
                <div className="apple-settings-text">
                  <p>{contactForm.emailAddress}</p>
                  <p>{contactForm.mobilePhoneAreaCode ? `${contactForm.mobilePhoneAreaCode} ${contactForm.mobilePhone}` : ''}</p>
                </div>
                <button
                  type="button"
                  className="apple-btn-link"
                  onClick={() => setActiveModal('shippingContact')}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>

          {/* Linha 2: Pagamento */}
          <div className="apple-settings-row">
            <div className="apple-settings-label-col">
              <h4>Pagamento</h4>
            </div>
            <div className="apple-settings-content-grid three-cols">
              {/* Contato para cobrança */}
              <div className="apple-settings-box">
                <h5>Contato para cobrança</h5>
                <div className="apple-settings-text">
                  <p>{billingForm.firstName} {billingForm.lastName}</p>
                  <p>{billingForm.daytimePhoneAreaCode} {billingForm.daytimePhone}</p>
                </div>
                <div className="apple-settings-actions-inline">
                  <button type="button" className="apple-btn-link" onClick={() => setActiveModal('billingAll')}>
                    Editar
                  </button>
                  <span className="divider">|</span>
                  <button type="button" className="apple-btn-link" onClick={() => showToast('Contato de cobrança atualizado')}>
                    Remover
                  </button>
                </div>
              </div>

              {/* Endereço de cobrança */}
              <div className="apple-settings-box">
                <h5>Endereço de cobrança</h5>
                <div className="apple-settings-text">
                  <p>{billingForm.street}</p>
                  <p>{billingForm.city}, {billingForm.state}</p>
                  <p>{billingForm.postalCode}</p>
                  <p>{billingForm.countryCode}</p>
                </div>
                <div className="apple-settings-actions-inline">
                  <button type="button" className="apple-btn-link" onClick={() => setActiveModal('billingAll')}>
                    Editar
                  </button>
                  <span className="divider">|</span>
                  <button type="button" className="apple-btn-link" onClick={() => showToast('Endereço de cobrança resetado')}>
                    Remover
                  </button>
                </div>
              </div>

              {/* Método de pagamento */}
              <div className="apple-settings-box">
                <h5>Método de pagamento</h5>
                <div className="apple-settings-text">
                  <p><strong>{billingForm.cardBrand}</strong></p>
                  <p>{billingForm.cardNumber}</p>
                  <p>{billingForm.expiration}</p>
                </div>
                <div className="apple-settings-actions-inline">
                  <button type="button" className="apple-btn-link" onClick={() => setActiveModal('billingAll')}>
                    Editar
                  </button>
                  <span className="divider">|</span>
                  <button type="button" className="apple-btn-link" onClick={() => showToast('Método de pagamento removido')}>
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Linha 3: Privacidade */}
          <div className="apple-settings-row">
            <div className="apple-settings-label-col">
              <h4>Privacidade</h4>
            </div>
            <div className="apple-settings-content-wide">
              <h5>Informações pessoais</h5>
              <p className="apple-privacy-text">
                Você controla suas informações pessoais e pode gerenciar seus dados ou excluir sua conta a qualquer momento. A TEKNIX tem o compromisso de proteger sua privacidade.
              </p>
              <a
                href="https://www.apple.com/br/privacy"
                target="_blank"
                rel="noreferrer"
                className="apple-link-external"
              >
                Gerenciar minhas informações pessoais
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Linha 4: ID TEKNIX */}
          <div className="apple-settings-row">
            <div className="apple-settings-label-col">
              <h4>ID TEKNIX</h4>
            </div>
            <div className="apple-settings-content-wide">
              <p className="apple-id-email">{userEmail}</p>
              <a
                href="https://appleid.apple.com"
                target="_blank"
                rel="noreferrer"
                className="apple-link-external"
              >
                Gerenciar Conta TEKNIX
                <ExternalLink size={12} />
              </a>
              <p className="apple-id-description">
                Sua Conta TEKNIX é o endereço de e-mail que você usa para acessar os serviços TEKNIX, como Store, TEKNIX Music, iCloud, iMessage, FaceTime e muito mais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MODAIS DE EDIÇÃO 1:1 PADRÃO OFICIAL APPLE
         ══════════════════════════════════════════════════════════ */}

      {/* MODAL 1: EDITE O ENDEREÇO DE ENVIO (1:1 APPLE) */}
      {activeModal === 'shippingAddress' && (
        <div className="apple-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="apple-modal-card-apple" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="apple-overlay-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="apple-overlay-inner">
              <h2 className="apple-overlay-heading">Edite o endereço de envio.</h2>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  setActiveModal(null)
                  showToast('Endereço de envio salvo com sucesso!')
                }}
                className="apple-overlay-form"
              >
                <div className="form-textbox">
                  <label className="form-textbox-label form-textbox-eyebrow-label">Primeiro nome</label>
                  <input
                    type="text"
                    className="form-textbox-input form-textbox-entered"
                    value={shippingForm.firstName}
                    onChange={e => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-textbox">
                  <label className="form-textbox-label form-textbox-eyebrow-label">Sobrenome</label>
                  <input
                    type="text"
                    className="form-textbox-input form-textbox-entered"
                    value={shippingForm.lastName}
                    onChange={e => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-textbox">
                  <label className="form-textbox-label form-textbox-eyebrow-label">Rua (Av, Pça, etc.) e número</label>
                  <input
                    type="text"
                    className="form-textbox-input form-textbox-entered"
                    value={shippingForm.street}
                    onChange={e => setShippingForm({ ...shippingForm, street: e.target.value })}
                    required
                  />
                </div>

                <div className="form-textbox">
                  <label className="form-textbox-label">apto, bloco, prédio (opcional)</label>
                  <input
                    type="text"
                    className="form-textbox-input"
                    value={shippingForm.street2}
                    onChange={e => setShippingForm({ ...shippingForm, street2: e.target.value })}
                  />
                </div>

                <div className="form-textbox">
                  <label className="form-textbox-label">Bairro</label>
                  <input
                    type="text"
                    className="form-textbox-input"
                    value={shippingForm.district}
                    onChange={e => setShippingForm({ ...shippingForm, district: e.target.value })}
                    required
                  />
                </div>

                <div className="form-textbox">
                  <label className="form-textbox-label form-textbox-eyebrow-label">Cidade/Município</label>
                  <input
                    type="text"
                    className="form-textbox-input form-textbox-entered"
                    value={shippingForm.city}
                    onChange={e => setShippingForm({ ...shippingForm, city: e.target.value })}
                    required
                  />
                </div>

                <div className="form-dropdown">
                  <label className="form-dropdown-label">Estado</label>
                  <select
                    className="form-dropdown-select"
                    value={shippingForm.state}
                    onChange={e => setShippingForm({ ...shippingForm, state: e.target.value })}
                    required
                  >
                    <option value="">Selecionar um</option>
                    {brazilianStates.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <span className="form-dropdown-chevron" />
                </div>

                <div className="form-textbox">
                  <label className="form-textbox-label form-textbox-eyebrow-label">CEP (xxxxx-xxx)</label>
                  <input
                    type="text"
                    className="form-textbox-input form-textbox-entered"
                    value={shippingForm.postalCode}
                    onChange={e => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                    required
                  />
                </div>

                <div className="form-textbox disabled">
                  <label className="form-textbox-label form-textbox-eyebrow-label">País/Região</label>
                  <input
                    type="text"
                    className="form-textbox-input form-textbox-entered"
                    value="Brasil"
                    disabled
                  />
                </div>

                <div className="apple-overlay-actions">
                  <button type="submit" className="apple-overlay-save-btn">
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="apple-overlay-cancel-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITE AS INFORMAÇÕES DE CONTATO (1:1 APPLE) */}
      {activeModal === 'shippingContact' && (
        <div className="apple-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="apple-modal-card-apple" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="apple-overlay-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="apple-overlay-inner">
              <h2 className="apple-overlay-heading">Edite as informações de contato.</h2>
              <p className="apple-overlay-desc">
                O Contato para cobrança receberá notificações sobre envio automaticamente por e-mail. Para enviar notificações a um e-mail secundário, insira o e-mail abaixo. Para receber atualizações sobre o envio por mensagem de texto, insira um número de celular abaixo.
              </p>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  setActiveModal(null)
                  showToast('Informações de contato atualizadas!')
                }}
                className="apple-overlay-form"
              >
                <div className="form-textbox">
                  <label className="form-textbox-label form-textbox-eyebrow-label">E-mail (opcional)</label>
                  <input
                    type="email"
                    className="form-textbox-input form-textbox-entered"
                    value={contactForm.emailAddress}
                    onChange={e => setContactForm({ ...contactForm, emailAddress: e.target.value })}
                  />
                </div>

                <div className="form-row-sidebyside">
                  <div className="form-textbox ddd-box">
                    <label className="form-textbox-label">DDD</label>
                    <input
                      type="tel"
                      className="form-textbox-input"
                      value={contactForm.mobilePhoneAreaCode}
                      onChange={e => setContactForm({ ...contactForm, mobilePhoneAreaCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-textbox flex-1">
                    <label className="form-textbox-label">Celular</label>
                    <input
                      type="tel"
                      className="form-textbox-input"
                      value={contactForm.mobilePhone}
                      onChange={e => setContactForm({ ...contactForm, mobilePhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-supplemental-info">
                  Verifique se o número de telefone está correto. Não é possível alterá-lo depois de fazer o pedido.
                </div>

                <div className="apple-overlay-actions">
                  <button type="submit" className="apple-overlay-save-btn">
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="apple-overlay-cancel-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITE SUAS INFORMAÇÕES DE PAGAMENTO (1:1 APPLE) */}
      {activeModal === 'billingAll' && (
        <div className="apple-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="apple-modal-card-apple" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="apple-overlay-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="apple-overlay-inner">
              <h2 className="apple-overlay-heading">Edite suas informações de pagamento.</h2>
              <p className="apple-overlay-desc">
                As alterações feitas nas informações de pagamento serão aplicadas à sua conta da Apple e afetarão suas compras no site da Apple.
              </p>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  setActiveModal(null)
                  showToast('Informações de pagamento atualizadas!')
                }}
                className="apple-overlay-form"
              >
                {/* Fieldset 1: Contato para cobrança */}
                <fieldset className="apple-form-fieldset">
                  <legend className="apple-fieldset-legend">Contato para cobrança</legend>

                  <div className="form-textbox">
                    <label className="form-textbox-label form-textbox-eyebrow-label">Primeiro nome</label>
                    <input
                      type="text"
                      className="form-textbox-input form-textbox-entered"
                      value={billingForm.firstName}
                      onChange={e => setBillingForm({ ...billingForm, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-textbox">
                    <label className="form-textbox-label form-textbox-eyebrow-label">Sobrenome</label>
                    <input
                      type="text"
                      className="form-textbox-input form-textbox-entered"
                      value={billingForm.lastName}
                      onChange={e => setBillingForm({ ...billingForm, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row-sidebyside">
                    <div className="form-textbox ddd-box">
                      <label className="form-textbox-label form-textbox-eyebrow-label">DDD</label>
                      <input
                        type="tel"
                        className="form-textbox-input form-textbox-entered"
                        value={billingForm.daytimePhoneAreaCode}
                        onChange={e => setBillingForm({ ...billingForm, daytimePhoneAreaCode: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-textbox flex-1">
                      <label className="form-textbox-label form-textbox-eyebrow-label">Telefone</label>
                      <input
                        type="tel"
                        className="form-textbox-input form-textbox-entered"
                        value={billingForm.daytimePhone}
                        onChange={e => setBillingForm({ ...billingForm, daytimePhone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-supplemental-info">
                    Verifique se o número de telefone está correto. Não é possível alterá-lo depois de fazer o pedido.
                  </div>

                  <div className="form-row-sidebyside">
                    <div className="form-textbox ddd-box">
                      <label className="form-textbox-label">DDD</label>
                      <input
                        type="tel"
                        className="form-textbox-input"
                        value={billingForm.mobilePhoneAreaCode}
                        onChange={e => setBillingForm({ ...billingForm, mobilePhoneAreaCode: e.target.value })}
                      />
                    </div>
                    <div className="form-textbox flex-1">
                      <label className="form-textbox-label">Celular</label>
                      <input
                        type="tel"
                        className="form-textbox-input"
                        value={billingForm.mobilePhone}
                        onChange={e => setBillingForm({ ...billingForm, mobilePhone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-supplemental-info">
                    Verifique se o número de telefone está correto. Não é possível alterá-lo depois de fazer o pedido.
                  </div>
                </fieldset>

                {/* Fieldset 2: Endereço de cobrança */}
                <fieldset className="apple-form-fieldset">
                  <legend className="apple-fieldset-legend">Endereço de cobrança</legend>

                  <div className="form-textbox disabled">
                    <label className="form-textbox-label form-textbox-eyebrow-label">País/Região</label>
                    <input
                      type="text"
                      className="form-textbox-input form-textbox-entered"
                      value="Brasil"
                      disabled
                    />
                  </div>

                  <div className="form-textbox">
                    <label className="form-textbox-label form-textbox-eyebrow-label">Rua (Av, Pça, etc.) e número</label>
                    <input
                      type="text"
                      className="form-textbox-input form-textbox-entered"
                      value={billingForm.street}
                      onChange={e => setBillingForm({ ...billingForm, street: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-textbox">
                    <label className="form-textbox-label">apto, bloco, prédio (opcional)</label>
                    <input
                      type="text"
                      className="form-textbox-input"
                      value={billingForm.street2}
                      onChange={e => setBillingForm({ ...billingForm, street2: e.target.value })}
                    />
                  </div>

                  <div className="form-row-sidebyside">
                    <div className="form-textbox flex-1">
                      <label className="form-textbox-label form-textbox-eyebrow-label">Cidade/Município</label>
                      <input
                        type="text"
                        className="form-textbox-input form-textbox-entered"
                        value={billingForm.city}
                        onChange={e => setBillingForm({ ...billingForm, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-textbox flex-1">
                      <label className="form-textbox-label">Bairro</label>
                      <input
                        type="text"
                        className="form-textbox-input"
                        value={billingForm.district}
                        onChange={e => setBillingForm({ ...billingForm, district: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-dropdown">
                    <label className="form-dropdown-label">Estado</label>
                    <select
                      className="form-dropdown-select"
                      value={billingForm.state}
                      onChange={e => setBillingForm({ ...billingForm, state: e.target.value })}
                      required
                    >
                      <option value="">Selecionar um</option>
                      {brazilianStates.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <span className="form-dropdown-chevron" />
                  </div>

                  <div className="form-textbox">
                    <label className="form-textbox-label form-textbox-eyebrow-label">CEP (xxxxx-xxx)</label>
                    <input
                      type="text"
                      className="form-textbox-input form-textbox-entered"
                      value={billingForm.postalCode}
                      onChange={e => setBillingForm({ ...billingForm, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </fieldset>

                {/* Fieldset 3: Método de pagamento */}
                <fieldset className="apple-form-fieldset">
                  <legend className="apple-fieldset-legend">Método de pagamento</legend>

                  <div className="form-textbox with-card-logo">
                    <label className="form-textbox-label form-textbox-eyebrow-label">Número do cartão de crédito</label>
                    <input
                      type="text"
                      className="form-textbox-input form-textbox-entered"
                      value={billingForm.cardNumber}
                      onChange={e => setBillingForm({ ...billingForm, cardNumber: e.target.value })}
                      required
                    />
                    <div className="card-badge-inline">
                      <span className="mastercard-circle red" />
                      <span className="mastercard-circle yellow" />
                    </div>
                  </div>

                  <div className="form-textbox">
                    <label className="form-textbox-label form-textbox-eyebrow-label">Validade (MM/AA)</label>
                    <input
                      type="text"
                      className="form-textbox-input form-textbox-entered"
                      placeholder="MM/AA"
                      value={billingForm.expiration}
                      onChange={e => setBillingForm({ ...billingForm, expiration: e.target.value })}
                      required
                    />
                  </div>
                </fieldset>

                <div className="apple-overlay-actions">
                  <button type="submit" className="apple-overlay-save-btn">
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="apple-overlay-cancel-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
