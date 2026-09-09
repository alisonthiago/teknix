import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
import { useEffect, useState, useRef, type FormEvent } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { MapPin, Truck, ShieldCheck, Package, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Ticket, X, Copy, Check, ExternalLink, CreditCard, RefreshCw, Loader2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { getAddressesByUserId, getCustomerByUserId } from '../services/customer'
import { processCheckoutOrder, type CreatedOrderResult } from '../services/checkout'
import { validateCoupon, registerCouponUse, type AppliedCoupon } from '../services/coupons'
import { getProductById, getProductBySku } from '../services/products'
import pixIcon from '../assets/bf_v6_pix.svg'
import creditIcon from '../assets/bf_v6_credito_noborde.svg'
import boletoIcon from '../assets/bf_v6_boleto_black_noborde.svg'
import './CheckoutReference.css'

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const emptyAddress = { name: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' }

// Mercado Pago SDK loader (loads once)
let mpSdkPromise: Promise<any> | null = null
function loadMercadoPagoSdk(publicKey: string): Promise<any> {
  if (mpSdkPromise) return mpSdkPromise
  mpSdkPromise = new Promise((resolve, reject) => {
    if ((window as any).MercadoPago) {
      resolve(new (window as any).MercadoPago(publicKey))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.onload = () => resolve(new (window as any).MercadoPago(publicKey))
    script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago'))
    document.head.appendChild(script)
  })
  return mpSdkPromise
}

// Detect card brand from first 6 digits (BIN)
function detectCardBrand(number: string): string {
  const n = number.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'master'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^6(011|5)/.test(n)) return 'elo'
  if (/^(301|303|360|374|375|376|378|34)/.test(n)) return 'hipercard'
  return 'master'
}

// Format card number with spaces every 4 digits
function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

// Format expiry MM/YY
function formatExpiry(value: string) {
  const v = value.replace(/\D/g, '').slice(0, 4)
  if (v.length <= 2) return v
  return v.slice(0, 2) + '/' + v.slice(2)
}

/* -----------------------------------------------------------------------
   PIX SUCCESS SCREEN
   ----------------------------------------------------------------------- */
function PixSuccess({ qrCode, qrCodeBase64, orderNumber }: { qrCode: string, qrCodeBase64: string, orderNumber: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(qrCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="tkn-pix-screen">
      <div className="tkn-pix-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
          <path d="M8.5 3h7l3.5 3.5v11L15.5 21h-7L5 17.5v-11L8.5 3z" stroke="#1dc860" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="m9 12 2 2 4-4" stroke="#1dc860" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="tkn-pix-title">Pague com Pix</h2>
      <p className="tkn-pix-subtitle">Pedido <strong>{orderNumber}</strong> — escaneie o QR Code ou copie o código abaixo</p>

      {qrCodeBase64 ? (
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code Pix"
          className="tkn-pix-qr"
          width={200}
          height={200}
        />
      ) : (
        <div className="tkn-pix-qr-placeholder">
          <RefreshCw size={32} className="tkn-pix-spin" />
          <span>Gerando QR Code…</span>
        </div>
      )}

      <div className="tkn-pix-code-wrap">
        <textarea
          className="tkn-pix-code"
          readOnly
          value={qrCode}
          rows={3}
          aria-label="Código Pix Copia e Cola"
        />
        <button
          type="button"
          className={`tkn-pix-copy ${copied ? 'is-copied' : ''}`}
          onClick={copy}
          aria-label="Copiar código Pix"
        >
          {copied ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar</>}
        </button>
      </div>

      <ul className="tkn-pix-tips">
        <li>Abra o app do seu banco e acesse a área Pix</li>
        <li>Escolha "Pix Copia e Cola" ou escaneie o QR Code</li>
        <li>Confirme o pagamento de <strong>{orderNumber}</strong></li>
        <li>O pedido é confirmado automaticamente após o pagamento</li>
      </ul>

      <div className="tkn-pix-waiting">
        <RefreshCw size={14} className="tkn-pix-spin" />
        <span>Aguardando confirmação do pagamento…</span>
      </div>
    </div>
  )
}

/* -----------------------------------------------------------------------
   BOLETO SUCCESS SCREEN
   ----------------------------------------------------------------------- */
function BoletoSuccess({ ticketUrl, digitableLine, orderNumber }: { ticketUrl: string, digitableLine: string, orderNumber: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(digitableLine).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <div className="tkn-boleto-screen">
      <div className="tkn-pix-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="#1d1d1f" strokeWidth="1.5"/>
          <path d="M7 8h10M7 12h6M7 16h4" stroke="#1d1d1f" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="tkn-pix-title">Boleto gerado!</h2>
      <p className="tkn-pix-subtitle">Pedido <strong>{orderNumber}</strong> — pague até o vencimento (3 dias úteis)</p>

      {digitableLine && (
        <div className="tkn-boleto-line-wrap">
          <span className="tkn-boleto-label">Linha Digitável</span>
          <div className="tkn-boleto-line">{digitableLine}</div>
          <button type="button" className={`tkn-pix-copy ${copied ? 'is-copied' : ''}`} onClick={copy}>
            {copied ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar linha digitável</>}
          </button>
        </div>
      )}

      {ticketUrl && (
        <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className="tkn-boleto-open">
          <ExternalLink size={16} /> Abrir / Imprimir Boleto
        </a>
      )}

      <ul className="tkn-pix-tips">
        <li>O boleto tem vencimento em 3 dias úteis</li>
        <li>Após o pagamento, a confirmação pode levar até 3 dias</li>
        <li>Pague em qualquer banco, lotérica ou app</li>
      </ul>
    </div>
  )
}

/* -----------------------------------------------------------------------
   CREDIT CARD FIELDS
   ----------------------------------------------------------------------- */
interface CardFieldsProps {
  onToken: (token: string, brand: string, installments: number) => void
  onError: (msg: string) => void
  total: number
  busy: boolean
}
function CardFields({ onToken, onError, total, busy }: CardFieldsProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [installments, setInstallments] = useState(1)
  const [tokenizing, setTokenizing] = useState(false)
  const mpRef = useRef<any>(null)

  useEffect(() => {
    const pk = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY
    if (!pk) return
    loadMercadoPagoSdk(pk).then(mp => { mpRef.current = mp }).catch(() => {})
  }, [])

  const brand = detectCardBrand(cardNumber)

  const handleTokenize = async () => {
    const [month, year] = expiry.split('/')
    if (!cardNumber || !cardName || !month || !year || !cvv || !docNumber) {
      onError('Preencha todos os dados do cartão.')
      return
    }
    setTokenizing(true)
    try {
      const mp = mpRef.current
      if (!mp) throw new Error('SDK do Mercado Pago não carregado.')
      const token = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardName.toUpperCase(),
        cardExpirationMonth: month,
        cardExpirationYear: year.length === 2 ? '20' + year : year,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: docNumber.replace(/\D/g, '')
      })
      if (!token?.id) throw new Error('Falha ao tokenizar o cartão. Verifique os dados.')
      onToken(token.id, brand, installments)
    } catch (err: any) {
      onError(err.message || 'Erro ao processar cartão.')
    } finally {
      setTokenizing(false)
    }
  }

  // Expose tokenize via data attribute so parent can trigger via submit
  useEffect(() => {
    const el = document.getElementById('tkn-card-tokenize-btn')
    if (el) (el as any)._trigger = handleTokenize
  })

  return (
    <div className="tkn-card-fields">
      <div className="tkn-card-brand-row">
        <CreditCard size={18} />
        <span className="tkn-card-brand-name">{brand.toUpperCase()}</span>
      </div>
      <div className="tkn-checkout-fields">
        <label className="tkn-checkout-wide">
          Número do cartão
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
          />
        </label>
        <label className="tkn-checkout-wide">
          Nome impresso no cartão
          <input
            type="text"
            autoComplete="cc-name"
            value={cardName}
            onChange={e => setCardName(e.target.value)}
            placeholder="NOME COMO NO CARTÃO"
          />
        </label>
        <label>
          Validade
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            maxLength={5}
          />
        </label>
        <label>
          CVV
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="000"
            maxLength={4}
          />
        </label>
        <label className="tkn-checkout-wide">
          CPF do titular do cartão
          <input
            type="text"
            inputMode="numeric"
            value={docNumber}
            onChange={e => setDocNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="00000000000"
            maxLength={11}
          />
        </label>
        <label className="tkn-checkout-wide">
          Parcelas
          <select value={installments} onChange={e => setInstallments(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 10, 12].map(n => (
              <option key={n} value={n}>
                {n}x {money(total / n)}{n === 1 ? ' sem juros' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      {/* Hidden trigger button — parent calls _trigger() on submit */}
      <button
        id="tkn-card-tokenize-btn"
        type="button"
        style={{ display: 'none' }}
        onClick={handleTokenize}
        disabled={tokenizing || busy}
      />
    </div>
  )
}

/* -----------------------------------------------------------------------
   MAIN CHECKOUT PAGE
   ----------------------------------------------------------------------- */
export default function Checkout() {
  const params = useParams<{ code?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const urlCode = params.code || searchParams.get('product') || searchParams.get('sku') || searchParams.get('code') || ''

  const { items, totalPrice, clearCart, addToCart } = useCart()
  const [loadingProduct, setLoadingProduct] = useState(false)
  const { user, signOut } = useAuth()
  const [address, setAddress] = useState(emptyAddress)
  const [draft, setDraft] = useState(emptyAddress)
  const [editingAddress, setEditingAddress] = useState(true)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [taxDoc, setTaxDoc] = useState('')
  const [taxType, setTaxType] = useState<'CPF' | 'CNPJ'>('CPF')
  const [company, setCompany] = useState('')
  const [loadingCnpj, setLoadingCnpj] = useState(false)
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
  // Card tokenization state (set by CardFields component via callback)
  const [cardToken, setCardToken] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [cardInstallments, setCardInstallments] = useState(1)
  const [cardReady, setCardReady] = useState(false)
  const [directItem, setDirectItem] = useState<any>(null)

  const isPlayDomain = typeof window !== 'undefined' && (
    window.location.hostname.startsWith('play.') || 
    window.location.hostname === 'play.teknixbrasil.com.br'
  )
  const storeUrl = (path: string) => isPlayDomain ? `https://teknixbrasil.com.br${path}` : path

  // 1. Sincronização automática do produto pela URL específica (ex: play.teknixbrasil.com.br/:code ou /checkout/:code)
  useEffect(() => {
    if (!urlCode) {
      setDirectItem(null)
      return
    }

    const decoded = decodeURIComponent(urlCode).trim()
    const isCartRoute = decoded.toLowerCase() === 'sacola' || decoded.toLowerCase() === 'carrinho' || decoded.toLowerCase() === 'pedido'
    if (isCartRoute) {
      setDirectItem(null)
      return
    }

    // Se já estiver no carrinho, isola o item diretamente para este checkout
    const inCart = items.find(
      i => (i.sku && i.sku.toLowerCase() === decoded.toLowerCase()) ||
           (i.id && i.id.toLowerCase() === decoded.toLowerCase()) ||
           ((i as any).slug && (i as any).slug.toLowerCase() === decoded.toLowerCase())
    )
    if (inCart) {
      setDirectItem(inCart)
      return
    }

    let cancelled = false
    setLoadingProduct(true)

    async function loadProduct() {
      try {
        let p = await getProductBySku(decoded)
        if (!p) p = await getProductById(decoded)
        if (cancelled || !p) return

        const isolated = {
          id: p.id,
          name: p.name,
          sku: p.sku || p.id,
          price: p.price || 0,
          promo_price: p.promo_price || undefined,
          image: p.image_url || (p.images && p.images[0]) || '',
          quantity: 1,
          stock: p.stock || 0
        }
        setDirectItem(isolated)
      } catch (err) {
        console.warn('[checkout] Falha ao carregar produto por código:', err)
      } finally {
        if (!cancelled) setLoadingProduct(false)
      }
    }

    loadProduct()
    return () => { cancelled = true }
  }, [urlCode, items])

  const activeItems = directItem ? [directItem] : items
  const activeTotalPrice = directItem
    ? (directItem.promo_price && directItem.promo_price > 0 ? directItem.promo_price : directItem.price) * directItem.quantity
    : totalPrice

  const shippingCost = 0
  const total = Math.max(0, activeTotalPrice + shippingCost - (coupon?.discount || 0))

  // 2. Garante que a URL SEMPRE exiba o código específico do produto (sem /checkout no play.teknixbrasil.com.br)
  useEffect(() => {
    if (!urlCode && activeItems.length === 1) {
      const singleCode = activeItems[0].sku || activeItems[0].id
      if (singleCode) {
        const dest = isPlayDomain ? `/${encodeURIComponent(singleCode)}` : `/checkout/${encodeURIComponent(singleCode)}`
        navigate(dest, { replace: true })
      }
    }
  }, [urlCode, activeItems, navigate, isPlayDomain])

  // 3. Normaliza URLs com query param para o formato correto
  useEffect(() => {
    const qCode = searchParams.get('product') || searchParams.get('sku') || searchParams.get('code')
    if (qCode && !params.code) {
      const dest = isPlayDomain ? `/${encodeURIComponent(qCode)}` : `/checkout/${encodeURIComponent(qCode)}`
      navigate(dest, { replace: true })
    }
  }, [searchParams, params.code, navigate, isPlayDomain])

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
        setTaxDoc(id); setTaxType(id.length > 11 ? 'CNPJ' : 'CPF')
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

  // Process order with tokenized card or other payment methods
  const executeOrder = async (overrideCard?: { token: string; brand: string; installments: number }) => {
    setBusy(true)
    try {
      const selected = editingAddress ? draft : address
      const result = await processCheckoutOrder({
        items: activeItems,
        customer: { ...selected, name: taxType === 'CNPJ' ? company.trim() : selected.name, email, phone, document: taxDoc },
        shippingCost,
        shippingMethod: 'sedex',
        discount: coupon?.discount || 0,
        paymentMethod: payment,
        userId: user?.id,
        cardToken: overrideCard ? overrideCard.token : (payment === 'credit_card' ? cardToken : undefined),
        cardBrand: overrideCard ? overrideCard.brand : (payment === 'credit_card' ? cardBrand : undefined),
        installments: overrideCard ? overrideCard.installments : (payment === 'credit_card' ? cardInstallments : undefined)
      })
      if (!result.success || !result.orderId) {
        setError(result.error || 'Não foi possível continuar. Tente novamente.')
        return
      }
      await registerCouponUse(coupon?.id)
      setComplete(result)
      clearCart()
      setCardReady(false)
      setCardToken('')
    } catch {
      setError('Não foi possível continuar. Tente novamente mais tarde.')
    } finally {
      setBusy(false)
    }
  }

  // Called by CardFields component when token is ready
  const handleCardToken = (token: string, brand: string, installments: number) => {
    setCardToken(token)
    setCardBrand(brand)
    setCardInstallments(installments)
    setCardReady(true)
    void executeOrder({ token, brand, installments })
  }

  const handleCardError = (msg: string) => {
    setError(msg)
    setBusy(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !activeItems.length) return
    const selected = editingAddress ? draft : address
    if (!validAddress(selected)) { setError('Confira os campos do endereço antes de continuar.'); return }
    if (taxDoc.length !== (taxType === 'CPF' ? 11 : 14) || (taxType === 'CNPJ' && !company.trim())) { setError('Confira o documento e os dados de faturamento.'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Informe o telefone com DDD.'); return }
    setError('')

    // For credit card: trigger tokenization first (calls handleCardToken -> executeOrder)
    if (payment === 'credit_card') {
      setBusy(true)
      const btn = window.document.getElementById('tkn-card-tokenize-btn') as any
      if (btn?._trigger) {
        await btn._trigger()
      } else {
        setError('Preencha os dados do cartão antes de continuar.')
        setBusy(false)
      }
      return
    }

    // For Pix / Boleto:
    await executeOrder()
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

    const handleDocumentChange = async (val: string) => {
    const clean = val.replace(/\D/g, '')
    setTaxDoc(clean)
    if (taxType === 'CNPJ' && clean.length === 14) {
      setLoadingCnpj(true)
      try {
        let legalName = ''
        try {
          const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`)
          if (res.ok) {
            const data = await res.json()
            legalName = data.razao_social || data.nome_fantasia || ''
          }
        } catch (err) {
          console.warn('BrasilAPI CNPJ lookup failed, trying fallback', err)
        }
        if (!legalName) {
          try {
            const res2 = await fetch(`https://publica.cnpj.ws/cnpj/${clean}`)
            if (res2.ok) {
              const data2 = await res2.json()
              legalName = data2.razao_social || data2.estabelecimento?.nome_fantasia || ''
            }
          } catch {}
        }
        if (legalName) {
          setCompany(legalName)
        }
      } finally {
        setLoadingCnpj(false)
      }
    }
  }

  const handleDocumentBlur = () => {
    if (taxType === 'CNPJ' && taxDoc.length === 14 && !company) {
      void handleDocumentChange(taxDoc)
    }
  }

  // ── Determine success screen to show ──────────────────────────────────────
  const showPixSuccess = complete && payment === 'pix'
  const showBoletoSuccess = complete && payment === 'boleto'
  const showCardSuccess = complete && payment === 'credit_card'

  return <div id="checkout-container" className="tkn-checkout">
    <Editable as="header" widgetId="checkout-header" label="Cabeçalho do checkout" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-top"><div className="tkn-checkout-shell">
      <a href={storeUrl('/')} aria-label="TEKNIX início"><Editable as="img" widgetId="checkout-1" src="/teknix-logo.svg" alt="TEKNIX" width="122" /></a>
      <nav aria-label="Ajuda e conta">
        {user ? <details className="tkn-checkout-account-menu">
          <summary aria-label={`Abrir menu de ${displayName}`}>
            <span className="tkn-checkout-avatar">{avatarUrl ? <Editable as="img" widgetId="checkout-2" src={avatarUrl} alt="" /> : initials}</span>
            <span className="tkn-checkout-account-name">{displayName}</span><ChevronDown size={15} aria-hidden="true" />
          </summary>
          <div className="tkn-checkout-account-popover">
            <div className="tkn-checkout-account-identity"><span className="tkn-checkout-avatar">{avatarUrl ? <Editable as="img" widgetId="checkout-3" src={avatarUrl} alt="" /> : initials}</span><span><strong>{displayName}</strong><small>{user.email}</small></span></div>
            <a href={storeUrl('/conta')}>Minha conta</a><a href={storeUrl('/pedidos')}>Meus pedidos</a><a href={storeUrl('/conta/enderecos')}>Endereços</a>
            <button type="button" onClick={() => { void signOut() }}>Sair</button>
          </div>
        </details> : <a href={storeUrl('/login')}>Entrar</a>}
        <a href={storeUrl('/ajuda')}>Contato</a>
      </nav>
    </div></Editable>
    <main className="tkn-checkout-shell tkn-checkout-main">
      <EditableFlow id="checkout-main" label="Estrutura do checkout">
      <Editable as="div" widgetId="checkout-main-content" label="Conteúdo do checkout" widgetType="container" editorKind="container" renderContent={false} style={{ display: 'contents' }}>
      {/* ── SUCCESS / PAYMENT SCREENS ─────────────────────────────────── */}
      {complete ? <Editable content={{}} as="section" widgetId="checkout-4" className="tkn-checkout-empty">

        {showPixSuccess && (
          <PixSuccess
            qrCode={complete.qrCode || ''}
            qrCodeBase64={complete.qrCodeBase64 || ''}
            orderNumber={complete.orderNumber || ''}
          />
        )}

        {showBoletoSuccess && (
          <BoletoSuccess
            ticketUrl={complete.ticketUrl || ''}
            digitableLine={complete.digitableLine || complete.barcodeContent || ''}
            orderNumber={complete.orderNumber || ''}
          />
        )}

        {showCardSuccess && <>
          <CheckCircle2 size={40} />
          <Editable as="h1" widgetId="checkout-5">Pedido recebido!</Editable>
          <Editable content={{}} as="p" widgetId="checkout-6">Pedido {complete.orderNumber} — o pagamento está sendo processado.</Editable>
          {safePaymentUrl && <a className="tkn-checkout-primary" href={safePaymentUrl}>Continuar no pagamento</a>}
        </>}

        {!showPixSuccess && !showBoletoSuccess && !showCardSuccess && <>
          <CheckCircle2 size={40} />
          <Editable as="h1" widgetId="checkout-5b">Pedido recebido</Editable>
          <Editable content={{}} as="p" widgetId="checkout-6b">Pedido {complete.orderNumber}. O pagamento ainda precisa ser confirmado.</Editable>
        </>}

        <a href={storeUrl('/pedidos')} className="tkn-checkout-link">Ver meus pedidos</a>
      </Editable> : (loadingProduct && !items.length) ? <Editable as="section" widgetId="checkout-8" className="tkn-checkout-empty">
        <Loader2 size={40} className="animate-spin" style={{ color: '#0071e3', animation: 'spin 1s linear infinite' }} />
        <Editable as="h1" widgetId="checkout-9">Carregando produto…</Editable>
        <Editable as="p" widgetId="checkout-10">Buscando informações oficiais do equipamento para finalizar sua compra.</Editable>
      </Editable> : !items.length ? <Editable as="section" widgetId="checkout-8" className="tkn-checkout-empty">
        <Package size={40} /><Editable as="h1" widgetId="checkout-9">Sua sacola está vazia</Editable><Editable as="p" widgetId="checkout-10">Adicione um produto para finalizar sua compra.</Editable><a href={storeUrl('/')} className="tkn-checkout-primary">Explorar produtos</a>
      </Editable> : <>
        <a href={storeUrl('/sacola')} className="tkn-checkout-back"><ArrowLeft size={15} /> Voltar à sacola</a>
          <Editable as="form" widgetId="checkout-form" label="Formulário do checkout" widgetType="form" editorKind="widget" renderContent={false} id="tkn-checkout-form" className="tkn-checkout-grid" onSubmit={submit}>
          <EditableFlow id="checkout-columns" label="Colunas do checkout" compact>
          <Editable as="fieldset" widgetId="checkout-fields" label="Dados de entrega e pagamento" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-content" disabled={busy || loading}>
            <Editable as="h1" widgetId="checkout-11">Finalize sua compra</Editable>
            <div className="tkn-checkout-products">{items.map(item => <article key={item.id} className="tkn-checkout-product">
              <div className="tkn-checkout-thumb">{item.image ? <img src={item.image} alt={item.name} /> : <Package size={24} />}</div>
              <div><a href={storeUrl('/' + encodeURIComponent(item.sku || item.id))}>{item.name}</a><p>Quantidade: <strong>{item.quantity}</strong> · {money((item.promo_price && item.promo_price > 0 ? item.promo_price : item.price) * item.quantity)}</p></div>
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
              {([{id:'pix',name:'Pix',detail:'Pagamento instantâneo com QR Code',icon:pixIcon},{id:'credit_card',name:'Cartão de crédito',detail:'Parcelamento em até 12x',icon:creditIcon},{id:'boleto',name:'Boleto bancário',detail:'Vencimento em 3 dias úteis',icon:boletoIcon}] as const).map(({id,name,detail,icon}) => <label key={id} className={'tkn-checkout-payment ' + (payment === id ? 'is-selected' : '')}><input type="radio" name="payment" value={id} checked={payment === id} onChange={() => { setPayment(id); setCardReady(false); setCardToken(''); setError('') }} /><img className="tkn-checkout-payment-icon" src={icon} alt="" /><span>{name}<small>{detail}</small></span></label>)}

              {/* Credit card fields — shown inline when credit_card is selected */}
              {payment === 'credit_card' && (
                <CardFields
                  onToken={handleCardToken}
                  onError={handleCardError}
                  total={total}
                  busy={busy}
                />
              )}
            </Editable>
            <Editable as="section" widgetId="checkout-22" className="tkn-checkout-card" aria-labelledby="billing-title">
              <Editable as="h2" widgetId="checkout-23" id="billing-title">Faturamento e contato</Editable>
              <div className="tkn-checkout-fields">
                <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
                <label>Celular com DDD<input type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} /></label>
                <label>Tipo de pessoa<select value={taxType} onChange={e => { setTaxType(e.target.value as 'CPF' | 'CNPJ'); setTaxDoc(''); setCompany('') }}><option value="CPF">Pessoa física</option><option value="CNPJ">Pessoa jurídica</option></select></label>
                <label><span>{taxType} {taxType === 'CNPJ' && loadingCnpj && <small style={{ color: '#059669', fontSize: 11, fontWeight: 500 }}>(Consultando...)</small>}</span><input inputMode="numeric" required value={taxDoc} maxLength={taxType === 'CPF' ? 11 : 14} placeholder={taxType === 'CNPJ' ? '00000000000000' : '00000000000'} onChange={e => void handleDocumentChange(e.target.value)} onBlur={handleDocumentBlur} /></label>
                {taxType === 'CNPJ' && <label className="tkn-checkout-wide"><span>Razão social {loadingCnpj && <small style={{ color: '#059669', fontSize: 11, fontWeight: 500 }}>(Buscando na Receita...)</small>}</span><input required value={company} placeholder={loadingCnpj ? 'Consultando Receita Federal...' : 'Razão social da empresa'} onChange={e => setCompany(e.target.value)} /></label>}
              </div>
            </Editable>
          </Editable>
          <Editable as="aside" widgetId="checkout-summary" label="Resumo da compra" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-summary" aria-label="Resumo da compra">
            <Editable as="h2" widgetId="checkout-24">Resumo da compra</Editable>
            <button className="tkn-checkout-coupon" type="button" onClick={() => { setCouponNotice(''); setCouponOpen(true) }}><Ticket size={16} /> {coupon ? `Cupom ${coupon.code}` : 'Inserir código do cupom'}</button>
            <dl><div><dt>Produtos</dt><dd>{money(totalPrice)}</dd></div><div><dt>Frete</dt><dd>{money(shippingCost)}</dd></div>{coupon && <div><dt>Desconto</dt><dd>- {money(coupon.discount)}</dd></div>}<div className="tkn-checkout-total"><dt><button type="button" onClick={() => setSummaryOpen(true)}>Total <ChevronUp size={14} /></button></dt><dd>{money(total)}</dd></div></dl>
            {error && <Editable content={{}} as="p" widgetId="checkout-25" role="alert" className="tkn-checkout-error">{error}</Editable>}
            <button className="tkn-checkout-primary" type="submit" disabled={busy || loading}>
              {busy ? (payment === 'credit_card' && !cardReady ? 'Validando cartão…' : 'Processando…') : 'Comprar agora!'}
            </button>
            <Editable as="p" widgetId="checkout-26" className="tkn-checkout-safe"><ShieldCheck size={16} /> Confira os dados antes de continuar.</Editable>
            <a className="tkn-checkout-link" href={storeUrl('/sacola')}>Editar sacola</a>
          </Editable>
          </EditableFlow>
        </Editable>
      </>}
      </Editable>
      </EditableFlow>
    </main>
    {summaryOpen && <div className="tkn-checkout-overlay andes-bottom-sheet__overlay" role="dialog" aria-modal="true" aria-label="Resumo da compra"><Editable as="section" widgetId="checkout-27" className="tkn-checkout-sheet tkn-checkout-full-summary"><button className="tkn-checkout-close" type="button" onClick={() => setSummaryOpen(false)} aria-label="Fechar resumo"><X size={20} /></button><Editable as="h2" widgetId="checkout-28">Resumo da compra</Editable><dl><div><dt>Produtos</dt><dd>{money(totalPrice)}</dd></div>{coupon && <div className="tkn-summary-discount"><dt>Desconto do produto</dt><dd>- {money(coupon.discount)}</dd></div>}<div><dt>Frete</dt><dd>{money(shippingCost)}</dd></div></dl><button className="tkn-sheet-coupon" type="button" onClick={() => { setSummaryOpen(false); setCouponOpen(true) }}><Ticket size={16} /> Inserir código do cupom</button><dl><div><dt>Subtotal</dt><dd>{money(total)}</dd></div><div><dt>Você pagará</dt><dd>{money(total)}<small>{payment === 'pix' ? 'Pix' : payment === 'boleto' ? 'Boleto' : 'Cartão de crédito'}</small></dd></div><div className="tkn-checkout-total"><dt>Total</dt><dd>{money(total)}</dd></div></dl><button className="tkn-checkout-primary" type="submit" form="tkn-checkout-form">Comprar agora!</button></Editable></div>}
    {couponOpen && <div className="tkn-checkout-overlay andes-bottom-sheet__overlay" role="dialog" aria-modal="true" aria-label="Cupons"><Editable content={{}} as="section" widgetId="checkout-29" className="tkn-checkout-sheet tkn-checkout-coupon-sheet"><button className="tkn-checkout-close" type="button" onClick={() => setCouponOpen(false)} aria-label="Fechar cupons"><X size={20} /></button><Editable as="h2" widgetId="checkout-30">Cupons</Editable><Editable as="p" widgetId="checkout-31">Insira um código cadastrado para aplicá-lo a esta compra.</Editable><div className="tkn-checkout-coupon-form"><input autoFocus value={couponCode} placeholder="Insira seu código aqui" onChange={e => setCouponCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void applyCoupon() }} /><button type="button" onClick={() => void applyCoupon()}>Inserir</button></div>{couponNotice && <Editable content={{}} as="p" widgetId="checkout-32" className="tkn-checkout-coupon-notice" role="status">{couponNotice}</Editable>}</Editable></div>}
    <Editable as="footer" widgetId="checkout-footer" label="Rodapé do checkout" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-footer"><div className="tkn-checkout-shell"><a href={storeUrl('/ajuda')}>Contato e atendimento</a><a href={storeUrl('/sacola')}>Minha sacola</a><span>TEKNIX · Todos os direitos reservados.</span></div></Editable>
  </div>
}
