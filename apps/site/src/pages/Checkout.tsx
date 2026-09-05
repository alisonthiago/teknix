import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Truck, ShieldCheck, Package, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Ticket, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { getAddressesByUserId, getCustomerByUserId } from '../services/customer'
import { processCheckoutOrder, type CreatedOrderResult } from '../services/checkout'
import { validateCoupon, registerCouponUse, type AppliedCoupon } from '../services/coupons'
import pixIcon from '../assets/bf_v6_pix.svg'
import creditIcon from '../assets/bf_v6_credito_noborde.svg'
import boletoIcon from '../assets/bf_v6_boleto_black_noborde.svg'
import './CheckoutReference.css'

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const emptyAddress = { name: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' }

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const { user, signOut } = useAuth()
  const [address, setAddress] = useState(emptyAddress)
  const [draft, setDraft] = useState(emptyAddress)
  const [editingAddress, setEditingAddress] = useState(true)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [taxType, setTaxType] = useState<'CPF' | 'CNPJ'>('CPF')
  const [company, setCompany] = useState('')
  const [accountName, setAccountName] = useState('')
  const [payment, setPayment] = useState<'pix' | 'credit_card' | 'boleto'>('pix')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponNotice, setCouponNotice] = useState('')
  const [couponOpen, setCouponOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [error, setError] = useState('')
  const [loadNotice, setLoadNotice] = useState('')
  const [cepNotice, setCepNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState<CreatedOrderResult | null>(null)
  // Mantém o valor usado pela integração anterior; a cotação dinâmica é uma integração separada.
  const shippingCost = 0
  const total = Math.max(0, totalPrice + shippingCost - (coupon?.discount || 0))
  useEffect(() => {
    let active = true
    if (!user) return
    setLoading(true)
    setEmail(user.email || '')
    Promise.all([getAddressesByUserId(user.id), getCustomerByUserId(user.id)])
      .then(([addresses, customer]) => {
        if (!active) return
        const saved = addresses[0]
        const name = customer?.name || user.user_metadata?.name || ''
        const value = saved ? { name: saved.recipient_name || name, street: saved.street, number: saved.number, complement: saved.complement || '', neighborhood: saved.neighborhood, city: saved.city, state: saved.state, zipCode: saved.zip_code } : { ...emptyAddress, name }
        setAddress(value); setDraft(value); setEditingAddress(!saved)
        setAccountName(name)
        setPhone(customer?.phone || '')
        const id = (customer?.cpf_cnpj || customer?.document || '').replace(/\D/g, '')
        setDocument(id); setTaxType(id.length > 11 ? 'CNPJ' : 'CPF')
      })
      .catch(() => { if (active) setLoadNotice('Não foi possível carregar o cadastro. Você pode preencher os dados abaixo.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  const validAddress = (value: typeof address) => value.name.trim() && value.street.trim() && value.number.trim() && value.neighborhood.trim() && value.city.trim() && /^[A-Za-z]{2}$/.test(value.state.trim()) && value.zipCode.replace(/\D/g, '').length === 8
  const lookupCep = async (value = draft.zipCode) => {
    const cep = value.replace(/\D/g, '')
    if (cep.length !== 8) return
    setCepNotice('Consultando CEP…')
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      if (!response.ok) throw new Error('CEP')
      const data = await response.json()
      if (data.erro) throw new Error('CEP')
      setDraft(previous => previous.zipCode.replace(/\D/g, '') === cep ? {
        ...previous, street: data.logradouro || previous.street, neighborhood: data.bairro || previous.neighborhood,
        city: data.localidade || previous.city, state: data.uf || previous.state
      } : previous)
      setCepNotice('Confira o número e o complemento do endereço.')
    } catch { setCepNotice('Não foi possível consultar o CEP. Preencha o endereço manualmente.') }
  }
  const confirmAddress = () => {
    if (!validAddress(draft)) { setError('Preencha nome, CEP, rua, número, bairro, cidade e UF do endereço.'); return }
    setAddress({ ...draft, state: draft.state.toUpperCase() }); setEditingAddress(false); setError('')
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !items.length) return
    const selected = editingAddress ? draft : address
    if (!validAddress(selected)) { setError('Confira os campos do endereço antes de continuar.'); return }
    if (document.length !== (taxType === 'CPF' ? 11 : 14) || (taxType === 'CNPJ' && !company.trim())) { setError('Confira o documento e os dados de faturamento.'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Informe o telefone com DDD.'); return }
    setBusy(true); setError('')
    try {
      const result = await processCheckoutOrder({
        items, customer: { ...selected, name: taxType === 'CNPJ' ? company.trim() : selected.name, email, phone, document },
        shippingCost, shippingMethod: 'sedex', discount: coupon?.discount || 0, paymentMethod: payment, userId: user?.id
      })
      if (!result.success || !result.orderId) { setError(result.error || 'Não foi possível continuar. Tente novamente.'); return }
      await registerCouponUse(coupon?.id)
      setComplete(result); clearCart()
    } catch { setError('Não foi possível continuar. Tente novamente mais tarde.') }
    finally { setBusy(false) }
  }
  const safePaymentUrl = complete?.checkoutUrl?.startsWith('https://') ? complete.checkoutUrl : null
  const displayName = accountName || String(user?.user_metadata?.name || user?.email?.split('@')[0] || 'Minha conta')
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'TC'
  const avatarUrl = typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : ''
  const applyCoupon = async () => {
    setCouponNotice('')
    const result = await validateCoupon(couponCode, totalPrice)
    if (!result.coupon) { setCouponNotice(result.error || 'Não foi possível aplicar o cupom.'); return }
    setCoupon(result.coupon); setCouponNotice(`Cupom ${result.coupon.code} aplicado.`); setCouponOpen(false)
  }
  return <div id="checkout-container" className="tkn-checkout">
    <Editable as="header" widgetId="checkout-header" label="Cabeçalho do checkout" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-top"><div className="tkn-checkout-shell">
      <Link to="/" aria-label="TEKNIX início"><Editable as="img" widgetId="checkout-1" src="/teknix-logo.svg" alt="TEKNIX" width="122" /></Link>
      <nav aria-label="Ajuda e conta">
        {user ? <details className="tkn-checkout-account-menu">
          <summary aria-label={`Abrir menu de ${displayName}`}>
            <span className="tkn-checkout-avatar">{avatarUrl ? <Editable as="img" widgetId="checkout-2" src={avatarUrl} alt="" /> : initials}</span>
            <span className="tkn-checkout-account-name">{displayName}</span><ChevronDown size={15} aria-hidden="true" />
          </summary>
          <div className="tkn-checkout-account-popover">
            <div className="tkn-checkout-account-identity"><span className="tkn-checkout-avatar">{avatarUrl ? <Editable as="img" widgetId="checkout-3" src={avatarUrl} alt="" /> : initials}</span><span><strong>{displayName}</strong><small>{user.email}</small></span></div>
            <Link to="/conta">Minha conta</Link><Link to="/pedidos">Meus pedidos</Link><Link to="/conta/enderecos">Endereços</Link>
            <button type="button" onClick={() => { void signOut() }}>Sair</button>
          </div>
        </details> : <Link to="/login">Entrar</Link>}
        <Link to="/contato">Contato</Link>
      </nav>
    </div></Editable>
    <main className="tkn-checkout-shell tkn-checkout-main">
      <EditableFlow id="checkout-main" label="Estrutura do checkout">
      <Editable as="div" widgetId="checkout-main-content" label="Conteúdo do checkout" widgetType="container" editorKind="container" renderContent={false} style={{ display: 'contents' }}>
      {complete ? <Editable content={{}} as="section" widgetId="checkout-4" className="tkn-checkout-empty">
        <CheckCircle2 size={40} /><Editable as="h1" widgetId="checkout-5">Pedido recebido</Editable><Editable content={{}} as="p" widgetId="checkout-6">Pedido {complete.orderNumber}. O pagamento ainda precisa ser confirmado.</Editable>
        {safePaymentUrl ? <a className="tkn-checkout-primary" href={safePaymentUrl}>Continuar no pagamento</a> : <Editable as="p" widgetId="checkout-7">Consulte o status e as instruções de pagamento em seus pedidos.</Editable>}
        <Link to="/pedidos" className="tkn-checkout-link">Ver meus pedidos</Link>
      </Editable> : !items.length ? <Editable as="section" widgetId="checkout-8" className="tkn-checkout-empty">
        <Package size={40} /><Editable as="h1" widgetId="checkout-9">Sua sacola está vazia</Editable><Editable as="p" widgetId="checkout-10">Adicione um produto para finalizar sua compra.</Editable><Link to="/produtos" className="tkn-checkout-primary">Explorar produtos</Link>
      </Editable> : <>
        <Link to="/sacola" className="tkn-checkout-back"><ArrowLeft size={15} /> Voltar à sacola</Link>
        <Editable as="form" widgetId="checkout-form" label="Formulário do checkout" widgetType="container" editorKind="container" renderContent={false} id="tkn-checkout-form" className="tkn-checkout-grid" onSubmit={submit}>
          <EditableFlow id="checkout-columns" label="Colunas do checkout" compact>
          <Editable as="fieldset" widgetId="checkout-fields" label="Dados de entrega e pagamento" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-content" disabled={busy || loading}>
            <Editable as="h1" widgetId="checkout-11">Finalize sua compra</Editable>
            <div className="tkn-checkout-products">{items.map(item => <article key={item.id} className="tkn-checkout-product">
              <div className="tkn-checkout-thumb">{item.image ? <img src={item.image} alt={item.name} /> : <Package size={24} />}</div>
              <div><Link to={'/produtos/' + encodeURIComponent(item.id)}>{item.name}</Link><p>Quantidade: <strong>{item.quantity}</strong> · {money((item.promo_price && item.promo_price > 0 ? item.promo_price : item.price) * item.quantity)}</p></div>
            </article>)}</div>
            {loading && <Editable as="p" widgetId="checkout-12" role="status">Carregando seus dados…</Editable>}
            {loadNotice && <Editable content={{}} as="p" widgetId="checkout-13" className="tkn-checkout-notice" role="status">{loadNotice}</Editable>}
            <Editable content={{}} as="section" widgetId="checkout-14" className="tkn-checkout-card" aria-labelledby="delivery-title">
              <Editable as="h2" widgetId="checkout-15" id="delivery-title">Forma de entrega</Editable>
              <div className="tkn-checkout-delivery-type"><Truck size={20} /><span>Enviar para meu endereço</span></div>
              {!editingAddress ? <div className="tkn-checkout-address">
                <MapPin size={19} /><div><strong>{address.street}, {address.number}</strong><Editable content={{}} as="p" widgetId="checkout-16">{address.complement && address.complement + ' · '}{address.neighborhood} · {address.city} / {address.state}<br />CEP {address.zipCode} · {address.name}</Editable><button className="tkn-checkout-link" type="button" onClick={() => { setDraft(address); setEditingAddress(true) }}>Alterar endereço</button></div>
              </div> : <div className="tkn-checkout-fields">
                {([
                  ['name', 'Nome de quem recebe', 'name'], ['zipCode', 'CEP', 'postal-code'],
                  ['street', 'Rua / Avenida', 'address-line1'], ['number', 'Número', 'off'],
                  ['complement', 'Complemento (opcional)', 'address-line2'], ['neighborhood', 'Bairro', 'off'],
                  ['city', 'Cidade', 'address-level2'], ['state', 'UF', 'address-level1']
                ] as const).map(([key, title, autoComplete]) => <label key={key} className={key === 'name' || key === 'street' ? 'tkn-checkout-wide' : ''}>{title}<input autoComplete={autoComplete} value={draft[key]} required={key !== 'complement'} inputMode={key === 'zipCode' ? 'numeric' : undefined} onBlur={key === 'zipCode' ? () => { void lookupCep() } : undefined} maxLength={key === 'state' ? 2 : key === 'zipCode' ? 9 : undefined} onChange={event => { const value = event.target.value; setDraft({ ...draft, [key]: value }); if (key === 'zipCode' && value.replace(/\D/g, '').length === 8) void lookupCep(value) }} /></label>)}
                {cepNotice && <Editable content={{}} as="p" widgetId="checkout-17" className="tkn-checkout-wide tkn-checkout-cep-note" role="status">{cepNotice}</Editable>}
                <div className="tkn-checkout-wide tkn-checkout-edit-actions"><button type="button" className="tkn-checkout-secondary" onClick={confirmAddress}>Usar este endereço</button>{validAddress(address) && <button type="button" className="tkn-checkout-link" onClick={() => setEditingAddress(false)}>Cancelar</button>}</div>
              </div>}
              <div className="tkn-checkout-shipping"><Editable as="h3" widgetId="checkout-18">Envio</Editable><div><span>Entrega padrão</span><strong>{money(shippingCost)}</strong></div><Editable as="p" widgetId="checkout-19">O prazo de entrega será informado no acompanhamento do pedido.</Editable></div>
            </Editable>
            <Editable content={{}} as="section" widgetId="checkout-20" className="tkn-checkout-card" aria-labelledby="payment-title">
              <Editable as="h2" widgetId="checkout-21" id="payment-title">Meios de pagamento</Editable>
              {([{id:'pix',name:'Pix',detail:'Pagamento com QR Code',icon:pixIcon},{id:'credit_card',name:'Cartão de crédito',detail:'Continue no ambiente de pagamento',icon:creditIcon},{id:'boleto',name:'Boleto bancário',detail:'Sujeito à confirmação do pagamento',icon:boletoIcon}] as const).map(({id,name,detail,icon}) => <label key={id} className={'tkn-checkout-payment ' + (payment === id ? 'is-selected' : '')}><input type="radio" name="payment" value={id} checked={payment === id} onChange={() => setPayment(id)} /><img className="tkn-checkout-payment-icon" src={icon} alt="" /><span>{name}<small>{detail}</small></span></label>)}
            </Editable>
            <Editable as="section" widgetId="checkout-22" className="tkn-checkout-card" aria-labelledby="billing-title">
              <Editable as="h2" widgetId="checkout-23" id="billing-title">Faturamento e contato</Editable>
              <div className="tkn-checkout-fields">
                <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
                <label>Celular com DDD<input type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} /></label>
                <label>Tipo de pessoa<select value={taxType} onChange={e => { setTaxType(e.target.value as 'CPF' | 'CNPJ'); setDocument('') }}><option value="CPF">Pessoa física</option><option value="CNPJ">Pessoa jurídica</option></select></label>
                <label>{taxType}<input inputMode="numeric" required value={document} maxLength={taxType === 'CPF' ? 11 : 14} onChange={e => setDocument(e.target.value.replace(/\D/g, ''))} /></label>
                {taxType === 'CNPJ' && <label className="tkn-checkout-wide">Razão social<input required value={company} onChange={e => setCompany(e.target.value)} /></label>}
              </div>
            </Editable>
          </Editable>
          <Editable as="aside" widgetId="checkout-summary" label="Resumo da compra" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-summary" aria-label="Resumo da compra">
            <Editable as="h2" widgetId="checkout-24">Resumo da compra</Editable>
            <button className="tkn-checkout-coupon" type="button" onClick={() => { setCouponNotice(''); setCouponOpen(true) }}><Ticket size={16} /> {coupon ? `Cupom ${coupon.code}` : 'Inserir código do cupom'}</button>
            <dl><div><dt>Produtos</dt><dd>{money(totalPrice)}</dd></div><div><dt>Frete</dt><dd>{money(shippingCost)}</dd></div>{coupon && <div><dt>Desconto</dt><dd>- {money(coupon.discount)}</dd></div>}<div className="tkn-checkout-total"><dt><button type="button" onClick={() => setSummaryOpen(true)}>Total <ChevronUp size={14} /></button></dt><dd>{money(total)}</dd></div></dl>
            {error && <Editable content={{}} as="p" widgetId="checkout-25" role="alert" className="tkn-checkout-error">{error}</Editable>}
            <button className="tkn-checkout-primary" type="submit" disabled={busy || loading}>{busy ? 'Processando…' : 'Continuar para pagamento'}</button>
            <Editable as="p" widgetId="checkout-26" className="tkn-checkout-safe"><ShieldCheck size={16} /> Confira os dados antes de continuar.</Editable>
            <Link className="tkn-checkout-link" to="/sacola">Editar sacola</Link>
          </Editable>
          </EditableFlow>
        </Editable>
      </>}
      </Editable>
      </EditableFlow>
    </main>
    {summaryOpen && <div className="tkn-checkout-overlay andes-bottom-sheet__overlay" role="dialog" aria-modal="true" aria-label="Resumo da compra"><Editable as="section" widgetId="checkout-27" className="tkn-checkout-sheet tkn-checkout-full-summary"><button className="tkn-checkout-close" type="button" onClick={() => setSummaryOpen(false)} aria-label="Fechar resumo"><X size={20} /></button><Editable as="h2" widgetId="checkout-28">Resumo da compra</Editable><dl><div><dt>Produtos</dt><dd>{money(totalPrice)}</dd></div>{coupon && <div className="tkn-summary-discount"><dt>Desconto do produto</dt><dd>- {money(coupon.discount)}</dd></div>}<div><dt>Frete</dt><dd>{money(shippingCost)}</dd></div></dl><button className="tkn-sheet-coupon" type="button" onClick={() => { setSummaryOpen(false); setCouponOpen(true) }}><Ticket size={16} /> Inserir código do cupom</button><dl><div><dt>Subtotal</dt><dd>{money(total)}</dd></div><div><dt>Você pagará</dt><dd>{money(total)}<small>{payment === 'pix' ? 'Pix' : payment === 'boleto' ? 'Boleto' : 'Cartão de crédito'}</small></dd></div><div className="tkn-checkout-total"><dt>Total</dt><dd>{money(total)}</dd></div></dl><button className="tkn-checkout-primary" type="submit" form="tkn-checkout-form">Continuar para pagamento</button></Editable></div>}
    {couponOpen && <div className="tkn-checkout-overlay andes-bottom-sheet__overlay" role="dialog" aria-modal="true" aria-label="Cupons"><Editable content={{}} as="section" widgetId="checkout-29" className="tkn-checkout-sheet tkn-checkout-coupon-sheet"><button className="tkn-checkout-close" type="button" onClick={() => setCouponOpen(false)} aria-label="Fechar cupons"><X size={20} /></button><Editable as="h2" widgetId="checkout-30">Cupons</Editable><Editable as="p" widgetId="checkout-31">Insira um código cadastrado para aplicá-lo a esta compra.</Editable><div className="tkn-checkout-coupon-form"><input autoFocus value={couponCode} placeholder="Insira seu código aqui" onChange={e => setCouponCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void applyCoupon() }} /><button type="button" onClick={() => void applyCoupon()}>Inserir</button></div>{couponNotice && <Editable content={{}} as="p" widgetId="checkout-32" className="tkn-checkout-coupon-notice" role="status">{couponNotice}</Editable>}</Editable></div>}
    <Editable as="footer" widgetId="checkout-footer" label="Rodapé do checkout" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-footer"><div className="tkn-checkout-shell"><Link to="/contato">Contato e atendimento</Link><Link to="/sacola">Minha sacola</Link><span>TEKNIX · Todos os direitos reservados.</span></div></Editable>
  </div>
}
