/* ==========================================================================
   TEKNIX SITE — PÁGINA OFICIAL DE CHECKOUT (1:1 PADRÃO APPLE STORE)
   Referência:
   - Etapa 1: https://secure8.store.apple.com/br/shop/checkout?_s=Shipping-init
   - Etapa 2: https://secure8.store.apple.com/br/shop/checkout?_s=Billing-init
   ========================================================================== */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { processCheckoutOrder } from '../services/checkout'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import './Checkout.css'

export default function Checkout() {
  const { items: cartItems, totalPrice, clearCart } = useCart()
  const { user } = useAuth()

  // Checkout Step: 'shipping' (Para onde enviar?) | 'billing' (Como deseja pagar?)
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'billing'>('shipping')

  // Companion Bar Summary Drawer
  const [showOrderSummary, setShowOrderSummary] = useState(false)

  // Address Selection ('saved' | 'new')
  const [addressChoice, setAddressChoice] = useState<'saved' | 'new'>('saved')
  const [savedAddress, setSavedAddress] = useState({
    name: 'alison thiago',
    street: 'Estrada do Atalaia 55',
    district: 'Jardim Atalaia',
    city: 'Cotia',
    state: 'São Paulo',
    zipCode: '06700-510'
  })

  // New Address Form Data
  const [newAddress, setNewAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    street2: '',
    zipCode: '',
    district: '',
    city: '',
    state: 'São Paulo',
    country: 'Brasil',
    isBusiness: false,
    saveToAddressBook: true
  })

  // Contact Info
  const [contactEmail, setContactEmail] = useState(user?.email || 'alisonsilvathiago@gmail.com')
  const [ddd, setDdd] = useState('11')
  const [phone, setPhone] = useState('975662930')
  const [noMobile] = useState(false)

  // Tax Info ('CPF' | 'CNPJ')
  const [taxType, setTaxType] = useState<'CPF' | 'CNPJ'>('CPF')
  const [cpf, setCpf] = useState('384.920.182-36')
  const [cnpj, setCnpj] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [useShippingTaxInfo, setUseShippingTaxInfo] = useState(true)

  // Billing Step: Payment Method ('SAVED_CARD' | 'CREDIT' | 'APPLE_PAY' | 'BOLETO')
  const [selectedBillingOption, setSelectedBillingOption] = useState<'SAVED_CARD' | 'CREDIT' | 'APPLE_PAY' | 'BOLETO'>('SAVED_CARD')

  // Validation / Error / Submitting
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState<{ id: string; orderNumber: string } | null>(null)

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      if (user.email) setContactEmail(user.email)
      const name = user.user_metadata?.name || user.user_metadata?.full_name
      if (name) {
        setSavedAddress(prev => ({ ...prev, name }))
      }
    }
  }, [user])

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Format CPF helper
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)
    val = val.replace(/(\d{3})(\d)/, '$1.$2')
    val = val.replace(/(\d{3})(\d)/, '$1.$2')
    val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    setCpf(val)
  }

  // Format CNPJ helper
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 14) val = val.slice(0, 14)
    val = val.replace(/^(\d{2})(\d)/, '$1.$2')
    val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    val = val.replace(/\.(\d{3})(\d)/, '.$1/$2')
    val = val.replace(/(\d{4})(\d)/, '$1-$2')
    setCnpj(val)
  }

  // CEP Auto-Fill helper
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 8) val = val.slice(0, 8)
    const formatted = val.replace(/^(\d{5})(\d)/, '$1-$2')
    setNewAddress(prev => ({ ...prev, zipCode: formatted }))

    if (val.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${val}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setNewAddress(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            district: data.bairro || prev.district,
            city: data.localidade || prev.city,
            state: data.uf === 'SP' ? 'São Paulo' : data.uf
          }))
        }
      } catch (err) {
        console.warn('Erro ao consultar CEP:', err)
      }
    }
  }

  // Avançar da Etapa 1 (Shipping) para a Etapa 2 (Billing)
  const handleContinueToPaymentStep = () => {
    setErrorMessage(null)

    if (addressChoice === 'new') {
      if (!newAddress.firstName || !newAddress.lastName || !newAddress.street || !newAddress.zipCode) {
        setErrorMessage('Por favor, preencha todos os campos obrigatórios do endereço.')
        window.scrollTo({ top: 100, behavior: 'smooth' })
        return
      }
    }

    if (taxType === 'CPF') {
      const cleanCpf = cpf.replace(/\D/g, '')
      if (cleanCpf.length < 11) {
        setErrorMessage('Por favor, insira um CPF válido para emissão da nota fiscal.')
        window.scrollTo({ top: 300, behavior: 'smooth' })
        return
      }
    } else {
      const cleanCnpj = cnpj.replace(/\D/g, '')
      if (cleanCnpj.length < 14 || !companyName) {
        setErrorMessage('Por favor, informe o CNPJ e a Razão Social da empresa.')
        window.scrollTo({ top: 300, behavior: 'smooth' })
        return
      }
    }

    setCheckoutStep('billing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Finalizar compra na Etapa 2 (Billing)
  const handleFinalOrderSubmit = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const customerData = {
        name: addressChoice === 'saved' ? savedAddress.name : `${newAddress.firstName} ${newAddress.lastName}`,
        email: contactEmail,
        document: taxType === 'CPF' ? cpf : cnpj,
        phone: noMobile ? '' : `${ddd}${phone}`,
        street: addressChoice === 'saved' ? savedAddress.street : newAddress.street,
        number: addressChoice === 'saved' ? '55' : 'S/N',
        complement: addressChoice === 'saved' ? '' : newAddress.street2,
        neighborhood: addressChoice === 'saved' ? savedAddress.district : newAddress.district,
        city: addressChoice === 'saved' ? savedAddress.city : newAddress.city,
        state: addressChoice === 'saved' ? 'SP' : newAddress.state,
        zipCode: addressChoice === 'saved' ? savedAddress.zipCode : newAddress.zipCode
      }

      const res = await processCheckoutOrder({
        items: cartItems,
        customer: customerData,
        shippingCost: 0,
        shippingMethod: 'sedex',
        discount: selectedBillingOption === 'BOLETO' ? totalPrice * 0.1 : 0,
        paymentMethod: selectedBillingOption === 'BOLETO' ? 'pix' : 'credit_card',
        userId: user?.id
      })

      if (res.success && res.orderId) {
        clearCart()
        setOrderComplete({
          id: res.orderId,
          orderNumber: res.orderNumber || ''
        })
      } else {
        setErrorMessage(res.error || 'Erro ao processar pedido. Tente novamente.')
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Erro inesperado ao finalizar compra.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const faqsShipping = [
    {
      q: 'Quando receberei meus produtos?',
      a: 'Ao inserir o código postal, você receberá datas de entrega estimadas dos itens. Só depois de fazer o pedido você verá a data de entrega final. Todas as datas estimadas variam de acordo com a disponibilidade do produto e a opção de entrega que você escolher.'
    },
    {
      q: 'Quanto custa o envio?',
      a: 'O frete padrão é grátis para todos os pedidos online na TEKNIX Store.'
    },
    {
      q: 'É possível enviar para um lugar que não seja minha casa?',
      a: 'Sim. Você pode informar o endereço comercial ou residencial desejado na finalização da compra.'
    },
    {
      q: 'Como faço para rastrear minha entrega?',
      a: 'Vamos enviar uma notificação quando cada produto for despachado. Você também pode acessar a página de status do pedido para acompanhar em tempo real.'
    },
    {
      q: 'Quando recebo notificações por mensagem de texto?',
      a: 'Insira o número do seu celular na finalização da compra para receber mensagens de texto quando seus produtos forem enviados ou se houver algum problema. Só enviamos mensagens entre 8h e 21h.'
    },
    {
      q: 'E se eu não estiver presente no momento da entrega?',
      a: 'O e-mail de confirmação de envio informará se você precisa assinar a entrega. Se não estiver, a transportadora deixará uma notificação e agendará uma nova tentativa.'
    }
  ]

  const faqsPayment = [
    {
      q: 'Quais são as opções de pagamento?',
      a: 'Aceitamos Apple Pay, boleto bancário, Pix e a maioria dos cartões de crédito e débito. Algumas opções podem não estar disponíveis para todos os produtos.'
    },
    {
      q: 'Quais são as opções de financiamento?',
      a: 'Você pode pagar em parcelas com seu cartão de crédito. Na página de finalização da compra, selecione as opções na seção de pagamento.'
    },
    {
      q: 'Como o imposto sobre vendas é calculado?',
      a: 'Os impostos indicados nas páginas da sacola e de pagamento são estimativas. Sua nota fiscal vai apresentar o imposto total.'
    },
    {
      q: 'A TEKNIX oferece descontos para a área de educação?',
      a: 'Sim. Oferecemos preços especiais para estudantes, professores e instituições de ensino.'
    },
    {
      q: 'Onde insiro meu CNPJ/CPF?',
      a: 'Você deve informar seu CNPJ/CPF na finalização da compra. O documento será impresso na sua nota fiscal.'
    }
  ]

  // Se o pedido foi concluído com sucesso
  if (orderComplete) {
    return (
      <div className="rs-checkout-success as-l-container">
        <div className="success-icon-wrap">
          <CheckCircle2 size={64} color="#34c759" />
        </div>
        <h1 className="typography-headline">Obrigado pelo seu pedido!</h1>
        <p className="success-order-num">Número do pedido: <strong>#{orderComplete.orderNumber}</strong></p>
        <p className="success-desc">
          Enviamos uma confirmação detalhada para <strong>{contactEmail}</strong> e o pedido já está sendo preparado pela nossa equipe de logística.
        </p>
        <div className="success-actions">
          <Link to={`/pedidos`} className="form-button">
            Ver meus pedidos
          </Link>
          <Link to="/" className="form-button-secondary">
            Continuar comprando
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div id="checkout-container" className="rs-page-content" role="main">
      <div className="rs-checkout">

        {/* ── 1. COMPANION STICKY BAR (Pagar + Resumo do Pedido) ── */}
        <div className="rs-checkout-headerbar rs-companionbar-sticky">
          <div className="rs-checkout-headerbar-content row as-l-container">
            <div className="column large-6">
              <div className="rs-checkout-headerbar-title typography-label">Pagar</div>
            </div>
            <div className="column small-6 large-last rs-companionbar-button typography-body-reduced">
              <button
                type="button"
                id="companionbar-button"
                className="as-buttonlink"
                onClick={() => setShowOrderSummary(!showOrderSummary)}
                aria-expanded={showOrderSummary}
              >
                <span className="rs-companionbar-button-label">Mostrar resumo do pedido: </span>
                <span className="rs-companionbar-button-amount">{formatPrice(totalPrice)}</span>
                {showOrderSummary ? <ChevronUp size={14} style={{ display: 'inline', marginLeft: '4px' }} /> : <ChevronDown size={14} style={{ display: 'inline', marginLeft: '4px' }} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. DRAWER DE RESUMO FLUTUANTE (Companion Bar Drawer) ── */}
        {showOrderSummary && (
          <div className="rs-companionbar-drawer as-l-container">
            <div className="drawer-inner">
              <div className="drawer-header">
                <h3>Resumo da Sacola ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})</h3>
                <Link to="/sacola" className="as-buttonlink">Editar sacola</Link>
              </div>
              <ul className="drawer-items-list">
                {cartItems.map(item => (
                  <li key={item.id} className="drawer-item-row">
                    <img src={item.image || 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80'} alt={item.name} className="drawer-thumb" />
                    <div className="drawer-item-info">
                      <span className="drawer-item-name">{item.name}</span>
                      <span className="drawer-item-qty">Qtd: {item.quantity}</span>
                    </div>
                    <span className="drawer-item-price">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="drawer-totals">
                <div className="drawer-total-line">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="drawer-total-line">
                  <span>Envio</span>
                  <span className="text-free">GRÁTIS</span>
                </div>
                <div className="drawer-total-line total-main">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. MAIN CONTENT CONTAINER ── */}
        <div className="as-l-container rs-checkout-main-content">
          
          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="rs-error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
             ETAPA 1: ENVIO / SHIPPING (Para onde devemos enviar seu pedido?)
             ══════════════════════════════════════════════════════════════ */}
          {checkoutStep === 'shipping' && (
            <div className="rs-shipping-step">
              <div className="rs-shipping-header-container">
                <h1 id="rs-checkout-header" className="rs-shipping-header typography-headline-reduced">
                  Para onde devemos enviar seu pedido?
                </h1>
              </div>

              {/* SEÇÃO 1: SELEÇÃO DE ENDEREÇO */}
              <div className="rs-shipping-section">
                <div className="row">
                  <div className="column large-6 small-12">
                    <h2 className="rs-shipping-address-title typography-label">Selecione um endereço:</h2>

                    {/* Card 1: Endereço Salvo Padrão */}
                    <div className={`form-selector ${addressChoice === 'saved' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        id="addressChoiceSaved"
                        name="addressChoice"
                        value="saved"
                        checked={addressChoice === 'saved'}
                        onChange={() => setAddressChoice('saved')}
                        className="form-selector-input"
                      />
                      <label htmlFor="addressChoiceSaved" className="form-selector-label">
                        <span className="row">
                          <span className="form-selector-left-col large-8">
                            <span className="form-selector-title">{savedAddress.name}</span>
                            <span className="form-label-small">
                              {savedAddress.street}, {savedAddress.district}, {savedAddress.city} – {savedAddress.state}, {savedAddress.zipCode}
                            </span>
                          </span>
                          <span className="form-selector-right-col large-4">
                            <span className="badge-default">Padrão</span>
                          </span>
                        </span>
                      </label>
                    </div>

                    {/* Card 2: Usar um Novo Endereço */}
                    <div className={`form-selector ${addressChoice === 'new' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        id="addressChoiceNew"
                        name="addressChoice"
                        value="new"
                        checked={addressChoice === 'new'}
                        onChange={() => setAddressChoice('new')}
                        className="form-selector-input"
                      />
                      <label htmlFor="addressChoiceNew" className="form-selector-label">
                        <span className="row">
                          <span className="form-selector-left-col large-12">
                            <span className="form-selector-title">Usar um novo endereço</span>
                          </span>
                        </span>
                      </label>
                    </div>

                    {/* Formulário Expandido de Novo Endereço */}
                    {addressChoice === 'new' && (
                      <div className="rs-new-address-form">
                        <div className="form-row-sidebyside">
                          <div className="form-textbox flex-1">
                            <label className="form-textbox-label">Primeiro nome</label>
                            <input
                              type="text"
                              className="form-textbox-input"
                              value={newAddress.firstName}
                              onChange={e => setNewAddress({ ...newAddress, firstName: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-textbox flex-1">
                            <label className="form-textbox-label">Sobrenome</label>
                            <input
                              type="text"
                              className="form-textbox-input"
                              value={newAddress.lastName}
                              onChange={e => setNewAddress({ ...newAddress, lastName: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="form-textbox">
                          <label className="form-textbox-label">Rua (Av, Pça, etc.) e número</label>
                          <input
                            type="text"
                            className="form-textbox-input"
                            value={newAddress.street}
                            onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-textbox">
                          <label className="form-textbox-label">apto, bloco, prédio (opcional)</label>
                          <input
                            type="text"
                            className="form-textbox-input"
                            value={newAddress.street2}
                            onChange={e => setNewAddress({ ...newAddress, street2: e.target.value })}
                          />
                        </div>

                        <div className="form-row-sidebyside">
                          <div className="form-textbox flex-1">
                            <label className="form-textbox-label">CEP (00000-000)</label>
                            <input
                              type="text"
                              className="form-textbox-input"
                              value={newAddress.zipCode}
                              onChange={handleCepChange}
                              maxLength={9}
                              required
                            />
                          </div>
                          <div className="form-textbox flex-1">
                            <label className="form-textbox-label">Bairro</label>
                            <input
                              type="text"
                              className="form-textbox-input"
                              value={newAddress.district}
                              onChange={e => setNewAddress({ ...newAddress, district: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="form-row-sidebyside">
                          <div className="form-textbox flex-1">
                            <label className="form-textbox-label">Cidade</label>
                            <input
                              type="text"
                              className="form-textbox-input"
                              value={newAddress.city}
                              onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-dropdown flex-1">
                            <label className="form-dropdown-label">Estado</label>
                            <select
                              className="form-dropdown-select"
                              value={newAddress.state}
                              onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                            >
                              {['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Paraná', 'Santa Catarina', 'Rio Grande do Sul', 'Bahia', 'Distrito Federal'].map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                            <span className="form-dropdown-chevron" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coluna Direita: Lembretes de Envio */}
                  <div className="column large-6 small-12">
                    <div className="rs-shipping-reminders">
                      <h3 className="rs-shipping-reminder-header typography-label">Tenha em mente as seguintes observações:</h3>
                      <ul className="rs-shipping-policy-list">
                        <li>Pode haver cobrança de impostos adicionais dependendo do destino de entrega.</li>
                        <li>O endereço informado aqui será incluído na nota fiscal.</li>
                        <li>Não realizamos envios para caixas postais.</li>
                        <li>Precisa de ajuda com o endereço? <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer" className="as-buttonlink">Busca CEP ↗</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: INFORMAÇÕES DE CONTATO */}
              <div className="rs-shipping-section">
                <div className="row">
                  <div className="column large-6 small-12">
                    <h2 className="rs-shipping-contact-title typography-label">Quais são suas informações de contato?</h2>

                    <div className="form-textbox">
                      <label className="form-textbox-label">E-mail</label>
                      <input
                        type="email"
                        className="form-textbox-input"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="as-supplementalinfo">Enviaremos o recibo e atualizações do pedido para este e-mail.</div>

                    <div className="form-row-sidebyside" style={{ marginTop: '16px' }}>
                      <div className="form-textbox ddd-box">
                        <label className="form-textbox-label">DDD</label>
                        <input
                          type="tel"
                          className="form-textbox-input"
                          value={ddd}
                          onChange={e => setDdd(e.target.value.replace(/\D/g, '').slice(0, 2))}
                          maxLength={2}
                          required={!noMobile}
                          disabled={noMobile}
                        />
                      </div>
                      <div className="form-textbox flex-1">
                        <label className="form-textbox-label">Celular</label>
                        <input
                          type="tel"
                          className="form-textbox-input"
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                          maxLength={9}
                          required={!noMobile}
                          disabled={noMobile}
                        />
                      </div>
                    </div>
                    <div className="as-supplementalinfo">
                      Caso haja algum problema com a entrega, a transportadora usará esse número para enviar atualizações por SMS ou ligar para você.
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: INFORMAÇÕES TRIBUTÁRIAS */}
              <div className="rs-shipping-section">
                <div className="row">
                  <div className="column large-6 small-12">
                    <h2 className="rs-taxinfo-header typography-label">Informações tributárias</h2>

                    <div className="rs-taxinfo-toggle-row">
                      <div className={`form-selector compact ${taxType === 'CPF' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          id="taxTypeCpf"
                          name="taxType"
                          checked={taxType === 'CPF'}
                          onChange={() => setTaxType('CPF')}
                          className="form-selector-input"
                        />
                        <label htmlFor="taxTypeCpf" className="form-selector-label">
                          <span className="form-selector-title">Pessoa Física (CPF)</span>
                        </label>
                      </div>

                      <div className={`form-selector compact ${taxType === 'CNPJ' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          id="taxTypeCnpj"
                          name="taxType"
                          checked={taxType === 'CNPJ'}
                          onChange={() => setTaxType('CNPJ')}
                          className="form-selector-input"
                        />
                        <label htmlFor="taxTypeCnpj" className="form-selector-label">
                          <span className="form-selector-title">Pessoa Jurídica (CNPJ)</span>
                        </label>
                      </div>
                    </div>

                    {taxType === 'CPF' ? (
                      <div className="form-textbox">
                        <label className="form-textbox-label">CPF (000.000.000-00)</label>
                        <input
                          type="text"
                          className="form-textbox-input"
                          value={cpf}
                          onChange={handleCpfChange}
                          maxLength={14}
                          required
                        />
                      </div>
                    ) : (
                      <>
                        <div className="form-textbox">
                          <label className="form-textbox-label">CNPJ (00.000.000/0000-00)</label>
                          <input
                            type="text"
                            className="form-textbox-input"
                            value={cnpj}
                            onChange={handleCnpjChange}
                            maxLength={18}
                            required
                          />
                        </div>
                        <div className="form-textbox" style={{ marginTop: '12px' }}>
                          <label className="form-textbox-label">Razão Social</label>
                          <input
                            type="text"
                            className="form-textbox-input"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTÃO DA ETAPA 1: CONTINUAR PARA O PAGAMENTO */}
              <div className="rs-checkout-action">
                <div className="row">
                  <div className="column large-6 small-12 rs-checkout-action-button-wrapper">
                    <button
                      id="rs-checkout-continue-button-bottom"
                      type="button"
                      className="form-button"
                      onClick={handleContinueToPaymentStep}
                    >
                      <span>Continuar para o pagamento</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
             ETAPA 2: PAGAMENTO / BILLING (Como você deseja pagar?)
             ══════════════════════════════════════════════════════════════ */}
          {checkoutStep === 'billing' && (
            <div className="rs-billing-step">
              <div className="rs-payment-header-container">
                <h1 id="rs-checkout-header" className="rs-payment-header typography-headline-reduced">
                  Como você deseja pagar?
                </h1>
              </div>

              <div className="rs-payment-options">
                <fieldset className="rs-payment-section">
                  <legend className="visuallyhidden"><h2>Opções de pagamento</h2></legend>
                  
                  <div className="rf-paymentoptions">
                    <div className="rf-paymentoptions-group rf-paymentoptions-group-paymentmethod">
                      <div className="rf-paymentoptions-legend large-6 small-12">
                        <h3 className="rf-paymentoptions-header typography-label">Método de pagamento.</h3>
                      </div>

                      {/* Opção 1: Cartão Salvo */}
                      <div className="rf-paymentoptions-item rf-paymentoptions-item-savedcard">
                        <div className="row rf-paymentoptions-item-container">
                          <div className="column large-6 small-12">
                            <div className={`form-selector ${selectedBillingOption === 'SAVED_CARD' ? 'selected' : ''}`}>
                              <input
                                className="form-selector-input"
                                id="billing_saved_card"
                                type="radio"
                                value="SAVED_CARD"
                                name="billingOption"
                                checked={selectedBillingOption === 'SAVED_CARD'}
                                onChange={() => setSelectedBillingOption('SAVED_CARD')}
                              />
                              <label htmlFor="billing_saved_card" className="form-selector-label">
                                <span className="row">
                                  <span className="form-selector-left-col large-6 small-7">
                                    <span className="form-selector-title">Mastercard 3185</span>
                                    <span className="form-label-small">11/33</span>
                                  </span>
                                  <span className="form-selector-right-col">
                                    <span>Cartão salvo</span>
                                  </span>
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="column large-6 small-12">
                            <div className="as-supplementalinfo typography-body-reduced">
                              Você pode alterar o cartão salvo com sua Conta Apple após a conclusão da compra.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Opção 2: Novo Cartão de Crédito */}
                      <div className="rf-paymentoptions-item rf-paymentoptions-item-creditcard">
                        <div className="row rf-paymentoptions-item-container">
                          <div className="column large-6 small-12">
                            <div className={`form-selector ${selectedBillingOption === 'CREDIT' ? 'selected' : ''}`}>
                              <input
                                className="form-selector-input"
                                id="billing_credit"
                                type="radio"
                                value="CREDIT"
                                name="billingOption"
                                checked={selectedBillingOption === 'CREDIT'}
                                onChange={() => setSelectedBillingOption('CREDIT')}
                              />
                              <label htmlFor="billing_credit" className="form-selector-label">
                                <span className="row">
                                  <span className="form-selector-left-col large-10">
                                    <span className="form-selector-title">Novo cartão de crédito</span>
                                    <span className="form-label-small">Visa, Mastercard, American Express</span>
                                  </span>
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Opção 3: TEKNIX Pay / Apple Pay */}
                      <div className="rf-paymentoptions-item rf-paymentoptions-item-applepay">
                        <div className="row rf-paymentoptions-item-container">
                          <div className="column large-6 small-12">
                            <div className={`form-selector ${selectedBillingOption === 'APPLE_PAY' ? 'selected' : ''}`}>
                              <input
                                className="form-selector-input"
                                id="billing_applepay"
                                type="radio"
                                value="APPLE_PAY"
                                name="billingOption"
                                checked={selectedBillingOption === 'APPLE_PAY'}
                                onChange={() => setSelectedBillingOption('APPLE_PAY')}
                              />
                              <label htmlFor="billing_applepay" className="form-selector-label">
                                <span className="row">
                                  <span className="form-selector-left-col large-6 small-7">
                                    <span className="form-selector-title">Apple Pay / TEKNIX Pay</span>
                                  </span>
                                  <span className="form-selector-right-col">
                                    <span className="badge-default">Configuração necessária</span>
                                  </span>
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Opção 4: Boleto Bancário / Pix */}
                      <div className="rf-paymentoptions-item rf-paymentoptions-item-boleto">
                        <div className="row rf-paymentoptions-item-container">
                          <div className="column large-6 small-12">
                            <div className={`form-selector ${selectedBillingOption === 'BOLETO' ? 'selected' : ''}`}>
                              <input
                                className="form-selector-input"
                                id="billing_boleto"
                                type="radio"
                                value="BOLETO"
                                name="billingOption"
                                checked={selectedBillingOption === 'BOLETO'}
                                onChange={() => setSelectedBillingOption('BOLETO')}
                              />
                              <label htmlFor="billing_boleto" className="form-selector-label">
                                <span className="row">
                                  <span className="form-selector-left-col large-10">
                                    <span className="form-selector-title">Boleto bancário / Pix</span>
                                    <span className="form-label-small">10% de desconto para pagamento à vista</span>
                                  </span>
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Informações Tributárias Reutilizadas */}
              <div className="row rs-taxinfo">
                <fieldset className="rs-taxinfo-section column large-6 small-12">
                  <legend><h3 className="rs-taxinfo-header typography-label">Informações tributárias</h3></legend>
                  <div className="form-checkbox" style={{ marginBottom: '12px' }}>
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={useShippingTaxInfo}
                        onChange={e => setUseShippingTaxInfo(e.target.checked)}
                      />
                      <span>Usar número de identificação fiscal informado com o endereço de envio.</span>
                    </label>
                  </div>
                  <div className="rs-taxinfo-cpffields">
                    <span className="rs-taxinfo-label">CPF: </span>
                    <span className="rs-taxinfo-value">••••••••••••36</span>
                  </div>
                </fieldset>
              </div>

              {/* BOTÃO DA ETAPA 2: REVISAR / FAZER O PEDIDO */}
              <div className="rs-checkout-action">
                <div className="row">
                  <div className="column large-6 small-12 rs-checkout-action-button-wrapper">
                    <button
                      id="rs-checkout-continue-button-bottom"
                      type="button"
                      className="form-button"
                      disabled={isSubmitting}
                      onClick={handleFinalOrderSubmit}
                    >
                      <span>{isSubmitting ? 'Processando pedido...' : 'Revisar o pedido'}</span>
                    </button>
                    <button
                      type="button"
                      className="as-buttonlink"
                      style={{ marginTop: '16px', display: 'block', textAlign: 'center' }}
                      onClick={() => setCheckoutStep('shipping')}
                    >
                      ← Voltar para o endereço de envio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. CHAT E ACORDEÃO FAQ ── */}
          <div className="rs-checkout-chatfaq-wrapper">
            <div className="as-chat rs-chat">
              <div className="as-l-container rs-chat-content">
                <div>Precisa de mais ajuda? <a href="https://wa.me/5511975662930" target="_blank" rel="noreferrer" className="as-chat-button">Entre no chat ↗</a> ou ligue para <span>0800-761-0867</span>.</div>
              </div>
            </div>

            <div className="rc-accordion rs-faq">
              <div className="rc-accordion-item">
                <h2 className="faq-title-main">
                  {checkoutStep === 'shipping' ? 'Perguntas frequentes sobre o envio' : 'Perguntas frequentes sobre pagamento'}
                </h2>
                <ul className="faq-questions-list">
                  {(checkoutStep === 'shipping' ? faqsShipping : faqsPayment).map((f, idx) => (
                    <li key={idx} className="faq-question-item">
                      <button
                        type="button"
                        className="faq-question-btn"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        aria-expanded={openFaq === idx}
                      >
                        <span className="faq-question-text">{f.q}</span>
                        {openFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {openFaq === idx && (
                        <div className="faq-answer-panel">
                          <p>{f.a}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── 5. RODAPÉ DE CRIPTOGRAFIA ── */}
          <div className="rs-checkout-footer-legal">
            <p>A TEKNIX utiliza a criptografia padrão do setor para proteger a confidencialidade dos seus dados pessoais.</p>
          </div>

        </div>
      </div>
    </div>
  )
}
