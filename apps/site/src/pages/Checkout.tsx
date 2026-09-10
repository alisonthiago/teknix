import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
import { useEffect, useState, useRef, type FormEvent } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { MapPin, Truck, ShieldCheck, Package, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Ticket, X, Copy, Check, ExternalLink, CreditCard, RefreshCw, Loader2, Clock, FileText, Printer, Mail, Info, Banknote } from 'lucide-react'
import { useCart, getCartSessionCode } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { getAddressesByUserId, getCustomerByUserId } from '../services/customer'
import { processCheckoutOrder, type CreatedOrderResult } from '../services/checkout'
import { validateCoupon, registerCouponUse, type AppliedCoupon } from '../services/coupons'
import { getProductById, getProductBySku } from '../services/products'
import { supabase } from '../lib/supabase'
import pixIcon from '../assets/bf_v6_pix.svg'
import creditIcon from '../assets/bf_v6_credito_noborde.svg'
import boletoIcon from '../assets/bf_v6_boleto_black_noborde.svg'
import './Checkout.css'
import './CheckoutReference.css'
import QRCode from 'qrcode'

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const emptyAddress = { name: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' }

const normalizeBrPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

const formatTaxDocument = (value: string, type: 'CPF' | 'CNPJ') => {
  const digits = value.replace(/\D/g, '').slice(0, type === 'CPF' ? 11 : 14)
  if (type === 'CPF') {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

// Mercado Pago Public Key oficial TEKNIX (fallback seguro para frontend)
const MP_DEFAULT_PUBLIC_KEY = 'APP_USR-bef9e18f-d642-4334-90c0-36ecbbb5c381'
const MP_PUBLIC_KEY = (import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY as string) || MP_DEFAULT_PUBLIC_KEY

// Mercado Pago SDK loader (singleton resiliente)
let mpInstance: any = null
let mpSdkPromise: Promise<any> | null = null

function loadMercadoPagoSdk(publicKey: string = MP_PUBLIC_KEY): Promise<any> {
  if (mpInstance) return Promise.resolve(mpInstance)
  if (mpSdkPromise) return mpSdkPromise

  mpSdkPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window não disponível'))

    const initInstance = () => {
      try {
        if ((window as any).MercadoPago) {
          mpInstance = new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' })
          resolve(mpInstance)
          return true
        }
      } catch (e) {
        console.error('[MP SDK] Erro ao instanciar MercadoPago:', e)
      }
      return false
    }

    if (initInstance()) return

    const existing = document.querySelector('script[src*="mercadopago.com"]')
    if (existing) {
      existing.addEventListener('load', () => {
        if (!initInstance()) reject(new Error('Falha ao instanciar SDK do Mercado Pago.'))
      })
      existing.addEventListener('error', () => {
        mpSdkPromise = null
        reject(new Error('Falha ao carregar script do Mercado Pago.'))
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.onload = () => {
      if (!initInstance()) reject(new Error('Falha ao instanciar SDK do Mercado Pago.'))
    }
    script.onerror = () => {
      mpSdkPromise = null
      reject(new Error('Falha ao baixar SDK do Mercado Pago.'))
    }
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
/* -----------------------------------------------------------------------
   PIX SUCCESS SCREEN (PREMIUM 1:1 TEKNIX / FINTECH REDESIGN)
   ----------------------------------------------------------------------- */
function PixSuccess({
  qrCode,
  qrCodeBase64,
  orderId,
  orderNumber,
  total,
  storeUrl,
  customerEmail
}: {
  qrCode: string
  qrCodeBase64: string
  orderId?: string
  orderNumber: string
  total?: number
  storeUrl: (path: string) => string
  customerEmail?: string
}) {
  const TOTAL_TIME = 1800
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [localQr, setLocalQr] = useState<string>(qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : '')
  const [paymentApproved, setPaymentApproved] = useState(false)

  useEffect(() => {
    if (!orderId || paymentApproved) return

    let cancelled = false
    const checkPayment = async () => {
      const { data } = await supabase
        .from('store_orders')
        .select('payment_status, status')
        .eq('id', orderId)
        .maybeSingle()

      if (!cancelled && (data?.payment_status === 'approved' || data?.payment_status === 'paid' || data?.status === 'paid')) {
        setPaymentApproved(true)
      }
    }

    void checkPayment()
    const paymentTimer = window.setInterval(() => void checkPayment(), 4000)
    return () => {
      cancelled = true
      window.clearInterval(paymentTimer)
    }
  }, [orderId, paymentApproved])

  useEffect(() => {
    if (paymentApproved) return
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [paymentApproved])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const progressPct = (timeLeft / TOTAL_TIME) * 100
  const isExpiring = timeLeft < 300

  const copy = () => {
    if (!qrCode) return
    navigator.clipboard.writeText(qrCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  useEffect(() => {
    if (qrCodeBase64) {
      setLocalQr(`data:image/png;base64,${qrCodeBase64}`)
      return
    }
    if (qrCode) {
      QRCode.toDataURL(qrCode, {
        width: 320,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' }
      })
        .then(url => setLocalQr(url))
        .catch(() => setLocalQr(''))
    }
  }, [qrCode, qrCodeBase64])

  return (
    <div className="tkn-mp-card tkn-mp-pix-card">
      {/* ── Topo: status badge + timer badge ── */}
      <div className="tkn-mp-top-row">
        <div className="tkn-mp-badge-pix">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M8.5 3h7l3.5 3.5v11L15.5 21h-7L5 17.5v-11L8.5 3z" stroke="#008a7b" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="m9 12 2 2 4-4" stroke="#008a7b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Pix Instantâneo</span>
        </div>
        {paymentApproved ? (
          <div className="tkn-mp-badge-approved"><CheckCircle2 size={15} /> Pagamento aprovado</div>
        ) : (
          <div className={`tkn-mp-badge-timer ${isExpiring ? 'is-expiring' : ''}`}>
            <Clock size={13} />
            <span>Expira em {timeFormatted}</span>
          </div>
        )}
      </div>

      {/* ── Valor total a pagar ── */}
      <div className="tkn-mp-amount-block">
        <span className={`tkn-mp-amount-label ${paymentApproved ? 'is-approved' : ''}`}>{paymentApproved ? 'Pagamento confirmado' : 'Falta pouco!'}</span>
        <h2 className="tkn-mp-amount-value">{paymentApproved ? 'Pagamento aprovado com sucesso' : <>Pague {total ? money(total) : 'o valor da sua compra'} via Pix para concluir sua compra</>}</h2>
        <div className="tkn-mp-order-status-row">
          <span className="tkn-mp-order-num">Pedido {orderNumber}</span>
          <span className="tkn-mp-dot-sep">•</span>
          <span className={paymentApproved ? 'tkn-mp-status-approved' : 'tkn-mp-status-awaiting'}>
            {paymentApproved ? <CheckCircle2 size={15} /> : <span className="tkn-mp-pulsing-amber-dot" />}
            {paymentApproved ? 'Pagamento aprovado' : 'Aguardando pagamento'}
          </span>
        </div>
      </div>

      {paymentApproved && (
        <div className="tkn-mp-payment-approved" role="status" aria-live="polite">
          <CheckCircle2 size={22} />
          <div><strong>Pagamento aprovado</strong><span>Recebemos seu Pix. Seu pedido já está confirmado e seguirá para preparação.</span></div>
        </div>
      )}

      <div className="tkn-mp-divider" />

      {/* ── QR Code central com cantoneiras teal ── */}
      <div className="tkn-mp-qr-section">
        <div className="tkn-mp-qr-frame">
          <span className="tkn-mp-bracket tkn-mp-bracket-tl" />
          <span className="tkn-mp-bracket tkn-mp-bracket-tr" />
          <span className="tkn-mp-bracket tkn-mp-bracket-bl" />
          <span className="tkn-mp-bracket tkn-mp-bracket-br" />

          {localQr ? (
            <img src={localQr} alt="QR Code Pix" className="tkn-mp-qr-img" />
          ) : (
            <div className="tkn-mp-qr-skeleton">
              <RefreshCw size={28} className="animate-spin" />
              <span>Gerando QR Code Pix…</span>
            </div>
          )}
        </div>
        <p className="tkn-mp-qr-caption">
          Aponte a câmera do seu celular no app do banco para pagar instantaneamente.
        </p>
      </div>

      {/* ── Seção Copia e Cola ── */}
      <div className="tkn-mp-copia-cola-block">
        <div className="tkn-mp-section-header">
          <span className="tkn-mp-header-title">OU PAGUE COM PIX COPIA E COLA</span>
          <span className="tkn-mp-header-sub">CLIQUE NO BOTÃO PARA COPIAR</span>
        </div>

        <div className="tkn-mp-code-box">
          <div className="tkn-mp-code-inner" title={qrCode}>
              <code>{qrCode || 'Código Pix indisponível.'}</code>
          </div>

          <button
            type="button"
            className={`tkn-mp-btn-blue ${copied ? 'is-copied' : ''}`}
            onClick={copy}
            disabled={!qrCode}
          >
            {copied ? (
              <>
                <Check size={18} />
                <span>Código copiado!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span>Copiar código Pix</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Aviso discreto de e-mail enviado ── */}
      {customerEmail && (
        <div className="tkn-mp-email-notice">
          <Mail size={16} />
          <span>Enviamos o QR Code e o código Copia e Cola para <strong>{customerEmail}</strong></span>
        </div>
      )}

      {/* ── Como pagar (Passo a passo com círculos azuis 1, 2, 3) ── */}
      <div className="tkn-mp-steps-card">
        <h3 className="tkn-mp-steps-title">COMO PAGAR:</h3>
        <div className="tkn-mp-step-row">
          <span className="tkn-mp-step-num">1</span>
          <div className="tkn-mp-step-texts">
            <strong>Abra o banco</strong>
            <p>Acesse o aplicativo do seu banco e vá até a área Pix.</p>
          </div>
        </div>
        <div className="tkn-mp-step-row">
          <span className="tkn-mp-step-num">2</span>
          <div className="tkn-mp-step-texts">
            <strong>Escolha pagar com Pix</strong>
            <p>Escaneie o QR code com a câmera ou cole o código Copia e Cola acima.</p>
          </div>
        </div>
        <div className="tkn-mp-step-row">
          <span className="tkn-mp-step-num">3</span>
          <div className="tkn-mp-step-texts">
            <strong>Confirme o pagamento</strong>
            <p>Verifique as informações e finalize. A aprovação é imediata em instantes!</p>
          </div>
        </div>
      </div>

      {/* ── Footer com botões ── */}
      <div className="tkn-mp-footer">
        <a href={storeUrl('/pedidos')} className="tkn-mp-btn-orders">
          Acompanhar Meus Pedidos
        </a>
        <a href={storeUrl('/ajuda')} className="tkn-mp-link-help">
          Dúvidas sobre o Pix? Fale conosco
        </a>
      </div>
    </div>
  )
}

/* -----------------------------------------------------------------------
   BOLETO — Barcode visual SVG
   ----------------------------------------------------------------------- */
function BarcodeVisual({ code }: { code: string }) {
  const clean = (code.replace(/[^0-9]/g, '') || '12345678901234').repeat(3)
  const bars: { w: number; gap: number }[] = []
  for (let i = 0; i < 96; i++) {
    const d = parseInt(clean[i % clean.length] || '5', 10)
    const thick = d >= 7
    bars.push({ w: thick ? 3 : 1, gap: thick ? 4 : d % 2 === 0 ? 3 : 2 })
  }
  const totalW = bars.reduce((s, b) => s + b.w + b.gap, 0)
  return (
    <svg viewBox={`0 0 ${totalW} 56`} className="tkn-barcode-svg" role="img" aria-label="Código de barras">
      {bars.reduce<{ els: any[]; x: number }>(
        ({ els, x }, b, i) => { els.push(<rect key={i} x={x} y={0} width={b.w} height={56} fill="#111" />); return { els, x: x + b.w + b.gap } },
        { els: [], x: 0 }
      ).els}
    </svg>
  )
}

function BoletoSuccess({
  ticketUrl,
  digitableLine,
  orderNumber,
  total,
  storeUrl,
  customerName,
  customerEmail,
  customerDoc
}: {
  ticketUrl: string
  digitableLine: string
  orderNumber: string
  total?: number
  storeUrl: (path: string) => string
  customerName?: string
  customerEmail?: string
  customerDoc?: string
}) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const dueDate = (() => {
    const d = new Date()
    let bd = 0
    while (bd < 3) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) bd++ }
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  })()

  const formattedLine = digitableLine || '23793.38029 60600.421923 57006.333306 7 15660000002000'

  const copy = () => {
    navigator.clipboard.writeText(formattedLine.replace(/\s+/g, '')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <>
      <div className="tkn-mp-card">
        {/* ── Botão superior de Abrir / Imprimir Boleto Bancário ── */}
        <div className="tkn-mp-boleto-top-btn-wrap">
          <button
            type="button"
            className="tkn-mp-btn-dark-print"
            onClick={() => setShowModal(true)}
          >
            <ExternalLink size={16} />
            <span>Abrir / Imprimir Boleto Bancário</span>
          </button>
        </div>

        {/* ── Linha digitável ── */}
        <div className="tkn-mp-copia-cola-block">
          <div className="tkn-mp-section-header">
            <span className="tkn-mp-header-title">LINHA DIGITÁVEL</span>
            <span className="tkn-mp-header-sub">COPIE PARA PAGAR NO APLICATIVO BANCÁRIO</span>
          </div>

          <div className="tkn-mp-code-box">
            <div className="tkn-mp-code-inner" style={{ textAlign: 'center', padding: '10px 12px' }}>
              <code style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.3px' }}>{formattedLine}</code>
            </div>

            <button
              type="button"
              className={`tkn-mp-btn-blue ${copied ? 'is-copied' : ''}`}
              onClick={copy}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  <span>Código copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span>Copiar Linha Digitável</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Aviso discreto de e-mail ── */}
        {customerEmail && (
          <div className="tkn-mp-email-notice">
            <Mail size={16} />
            <span>Enviamos o boleto e a linha digitável para <strong>{customerEmail}</strong></span>
          </div>
        )}

        {/* ── Informações Importantes (Passo a passo com círculos azuis 1, 2, 3) ── */}
        <div className="tkn-mp-steps-card">
          <h3 className="tkn-mp-steps-title">INFORMAÇÕES IMPORTANTES:</h3>
          <div className="tkn-mp-step-row">
            <span className="tkn-mp-step-num">1</span>
            <div className="tkn-mp-step-texts">
              <strong>Pague onde preferir</strong>
              <p>Qualquer banco, lotérica ou internet banking</p>
            </div>
          </div>
          <div className="tkn-mp-step-row">
            <span className="tkn-mp-step-num">2</span>
            <div className="tkn-mp-step-texts">
              <strong>Prazo de compensação</strong>
              <p>Compensa em até 2 dias úteis após o pagamento</p>
            </div>
          </div>
          <div className="tkn-mp-step-row">
            <span className="tkn-mp-step-num">3</span>
            <div className="tkn-mp-step-texts">
              <strong>Envio garantido</strong>
              <p>Seus produtos ficam reservados durante o prazo</p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="tkn-mp-footer">
          <a href={storeUrl('/pedidos')} className="tkn-mp-btn-orders">
            Acompanhar Meus Pedidos
          </a>
          <a href={storeUrl('/ajuda')} className="tkn-mp-link-help">
            Dúvidas sobre o boleto? Fale conosco
          </a>
        </div>
      </div>

      {/* ── Modal Oficial de Impressão do Boleto TEKNIX ── */}
      {showModal && (
        <div className="tkn-boleto-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tkn-boleto-modal-content" onClick={e => e.stopPropagation()}>
            <div className="tkn-boleto-modal-header">
              <div className="tkn-boleto-modal-title">
                <FileText size={18} />
                <span>Boleto Bancário — Pedido #{orderNumber}</span>
              </div>
              <div className="tkn-boleto-modal-actions">
                <button
                  type="button"
                  className="tkn-btn-modal-print"
                  onClick={() => window.print()}
                >
                  <Printer size={15} />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  className="tkn-btn-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Documento do Boleto (Padrão Bancário Oficial) */}
            <div className="tkn-boleto-printable-slip" id="printable-boleto">
              <div className="tkn-b-slip-bank-header">
                <div className="tkn-b-slip-bank-logo">
                  <strong>TEKNIX</strong>
                </div>
                <div className="tkn-b-slip-bank-code">237-2</div>
                <div className="tkn-b-slip-digitable">{formattedLine}</div>
              </div>

              <table className="tkn-b-slip-table">
                <tbody>
                  <tr>
                    <td colSpan={5} className="tkn-b-td">
                      <span className="tkn-b-label">Local de Pagamento</span>
                      <span className="tkn-b-val">Pagável em qualquer banco ou casa lotérica até o vencimento</span>
                    </td>
                    <td className="tkn-b-td tkn-b-highlight">
                      <span className="tkn-b-label">Vencimento</span>
                      <span className="tkn-b-val"><strong>{dueDate}</strong></span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="tkn-b-td">
                      <span className="tkn-b-label">Beneficiário</span>
                      <span className="tkn-b-val">TEKNIX BRASIL EQUIPAMENTOS E TECNOLOGIA LTDA — CNPJ 52.040.005/0001-08</span>
                    </td>
                    <td className="tkn-b-td">
                      <span className="tkn-b-label">Agência / Código Beneficiário</span>
                      <span className="tkn-b-val">3380 / 0606004-2</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="tkn-b-td">
                      <span className="tkn-b-label">Data Documento</span>
                      <span className="tkn-b-val">{new Date().toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="tkn-b-td">
                      <span className="tkn-b-label">Nº Documento</span>
                      <span className="tkn-b-val">{orderNumber}</span>
                    </td>
                    <td className="tkn-b-td">
                      <span className="tkn-b-label">Espécie Doc.</span>
                      <span className="tkn-b-val">DM</span>
                    </td>
                    <td className="tkn-b-td">
                      <span className="tkn-b-label">Aceite</span>
                      <span className="tkn-b-val">N</span>
                    </td>
                    <td className="tkn-b-td">
                      <span className="tkn-b-label">Data Processamento</span>
                      <span className="tkn-b-val">{new Date().toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="tkn-b-td tkn-b-highlight">
                      <span className="tkn-b-label">Valor do Documento</span>
                      <span className="tkn-b-val"><strong>{total ? money(total) : 'R$ 0,00'}</strong></span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} rowSpan={2} className="tkn-b-td tkn-b-instructions">
                      <span className="tkn-b-label">Instruções de Responsabilidade do Beneficiário</span>
                      <p className="tkn-b-inst-p">• Não receber após 15 dias do vencimento.</p>
                      <p className="tkn-b-inst-p">• Pagável em qualquer agência bancária, aplicativo ou casa lotérica.</p>
                      <p className="tkn-b-inst-p">• Pedido #{orderNumber} — Loja Oficial TEKNIX.</p>
                    </td>
                    <td className="tkn-b-td">
                      <span className="tkn-b-label">(-) Desconto / Abatimento</span>
                      <span className="tkn-b-val">-</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="tkn-b-td">
                      <span className="tkn-b-label">(=) Valor Cobrado</span>
                      <span className="tkn-b-val"><strong>{total ? money(total) : 'R$ 0,00'}</strong></span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="tkn-b-td tkn-b-payer">
                      <span className="tkn-b-label">Pagador</span>
                      <span className="tkn-b-val">
                        <strong>{customerName || 'Cliente TEKNIX'}</strong>
                        {customerDoc ? ` — CPF/CNPJ: ${customerDoc}` : ''}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="tkn-b-slip-barcode-area">
                <BarcodeVisual code={formattedLine.replace(/\D/g, '') || orderNumber} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function formatExpiry(value: string) {
  const v = value.replace(/\D/g, '').slice(0, 4)
  if (v.length <= 2) return v
  return v.slice(0, 2) + '/' + v.slice(2)
}

function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false

  let sum = 0
  for (let index = 0; index < 9; index += 1) sum += Number(digits[index]) * (10 - index)
  let check = (sum * 10) % 11
  if (check === 10) check = 0
  if (check !== Number(digits[9])) return false

  sum = 0
  for (let index = 0; index < 10; index += 1) sum += Number(digits[index]) * (11 - index)
  check = (sum * 10) % 11
  if (check === 10) check = 0
  return check === Number(digits[10])
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
  const [docError, setDocError] = useState('')
  const mpRef = useRef<any>(null)

  useEffect(() => {
    loadMercadoPagoSdk(MP_PUBLIC_KEY)
      .then(mp => { mpRef.current = mp })
      .catch(err => {
        console.warn('[checkout] Aviso ao carregar Mercado Pago SDK:', err)
      })
  }, [])

  const brand = detectCardBrand(cardNumber)

  const handleTokenize = async () => {
    const [month, year] = (expiry || '').split('/')
    if (!cardNumber || !cardName || !month || !year || !cvv || !docNumber) {
      onError('Preencha todos os dados do cartão.')
      return
    }
    if (!isValidCpf(docNumber)) {
      setDocError('Informe um CPF válido com 11 números.')
      onError('Confira o CPF do titular do cartão.')
      return
    }
    setDocError('')
    setTokenizing(true)
    try {
      let mp = mpRef.current
      if (!mp) {
        mp = await loadMercadoPagoSdk(MP_PUBLIC_KEY)
        mpRef.current = mp
      }
      if (!mp) throw new Error('Não foi possível conectar com o Mercado Pago. Verifique sua conexão e tente novamente.')

      const cleanMonth = month.trim().padStart(2, '0')
      const cleanYear = year.trim().length === 2 ? '20' + year.trim() : year.trim()

      const token = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardName.trim().toUpperCase(),
        cardExpirationMonth: cleanMonth,
        cardExpirationYear: cleanYear,
        securityCode: cvv.trim(),
        identificationType: 'CPF',
        identificationNumber: docNumber.replace(/\D/g, '')
      })
      if (!token?.id) throw new Error('Falha ao tokenizar o cartão. Verifique se os dados estão corretos.')
      onToken(token.id, brand, installments)
    } catch (err: any) {
      console.error('[checkout] Erro createCardToken:', err)
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
            onChange={e => {
              setDocNumber(e.target.value.replace(/\D/g, '').slice(0, 11))
              setDocError('')
            }}
            placeholder="00000000000"
            maxLength={11}
            aria-invalid={Boolean(docError)}
            className={docError ? 'is-invalid' : undefined}
          />
          {docError && <span className="tkn-checkout-field-error" role="alert">{docError}</span>}
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
  const { user, loading: authLoading, signOut } = useAuth()
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
  const [paymentSettings, setPaymentSettings] = useState({ enable_pix: true, enable_credit_card: true, enable_boleto: false })
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
  const [checkoutLoadingMessage, setCheckoutLoadingMessage] = useState('Preparando tudo para sua compra')

  useEffect(() => {
    let mounted = true
    void supabase.from('store_payment_settings').select('enable_pix, enable_credit_card, enable_boleto').eq('id', 'default').maybeSingle().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        console.warn('[checkout] Configurações de pagamento indisponíveis; usando os padrões.', error.message)
        return
      }
      if (data) setPaymentSettings(current => ({ ...current, ...data }))
    })
    return () => { mounted = false }
  }, [])

  const availablePayments = [
    { id: 'pix' as const, name: 'Pix', detail: 'Pagamento instantâneo com QR Code', icon: pixIcon, enabled: paymentSettings.enable_pix },
    { id: 'credit_card' as const, name: 'Cartão de crédito', detail: 'Parcelamento em até 12x', icon: creditIcon, enabled: paymentSettings.enable_credit_card },
    { id: 'boleto' as const, name: 'Boleto bancário', detail: 'Vencimento em 3 dias úteis', icon: boletoIcon, enabled: paymentSettings.enable_boleto }
  ].filter(method => method.enabled)

  useEffect(() => {
    if (availablePayments.length > 0 && !availablePayments.some(method => method.id === payment)) {
      setPayment(availablePayments[0].id)
      setCardReady(false)
      setCardToken('')
    }
  }, [paymentSettings.enable_pix, paymentSettings.enable_credit_card, paymentSettings.enable_boleto, payment, availablePayments.length])
  const [complete, setComplete] = useState<CreatedOrderResult | null>(null)
  const [pixFlowStage, setPixFlowStage] = useState<'idle' | 'preparing' | 'almost' | 'confirming'>('idle')
  // Card tokenization state (set by CardFields component via callback)
  const [cardToken, setCardToken] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [cardInstallments, setCardInstallments] = useState(1)
  const [cardReady, setCardReady] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState('')
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
    const isCartSession = decoded.toLowerCase() === 'sacola' || 
      decoded.toLowerCase() === 'carrinho' || 
      decoded.toLowerCase() === 'pedido' || 
      /^\d{6,14}$/.test(decoded) || 
      decoded.toLowerCase().startsWith('cart_')

    if (isCartSession) {
      setDirectItem(null)
      setLoadingProduct(false)
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

  // 2. Garante que a URL SEMPRE exiba o código correto (sem /checkout no play.teknixbrasil.com.br)
  useEffect(() => {
    if (!urlCode) {
      if (activeItems.length === 1) {
        const singleCode = activeItems[0].sku || activeItems[0].id
        if (singleCode) {
          const dest = isPlayDomain ? `/${encodeURIComponent(singleCode)}` : `/checkout/${encodeURIComponent(singleCode)}`
          navigate(dest, { replace: true })
        }
      } else if (activeItems.length > 1) {
        const cartCode = getCartSessionCode()
        const dest = isPlayDomain ? `/${cartCode}` : `/checkout/${cartCode}`
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
    if (!overrideCard && payment === 'pix') {
      setCheckoutStep('Gerando QR Code Pix instantâneo…')
    } else if (overrideCard) {
      setCheckoutStep('Processando pagamento com a operadora…')
    } else {
      setCheckoutStep('Finalizando pedido…')
    }

    try {
      const selected = editingAddress ? draft : address
      const result = await processCheckoutOrder({
        items: activeItems,
        customer: { ...selected, name: taxType === 'CNPJ' ? company.trim() : selected.name, email, phone: normalizeBrPhone(phone), document: taxDoc },
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
        if (payment === 'pix') setPixFlowStage('idle')
        return
      }
      await registerCouponUse(coupon?.id)
      setComplete(result)
      clearCart()
      setCardReady(false)
      setCardToken('')
    } catch {
      setError('Não foi possível continuar. Tente novamente mais tarde.')
      if (payment === 'pix') setPixFlowStage('idle')
    } finally {
      setBusy(false)
      setCheckoutStep('')
      setCheckoutLoadingMessage('Preparando tudo para sua compra')
    }
  }

  // Called by CardFields component when token is ready
  const handleCardToken = (token: string, brand: string, installments: number) => {
    setCardToken(token)
    setCardBrand(brand)
    setCardInstallments(installments)
    setCardReady(true)
    setCheckoutStep('Processando pagamento com a operadora…')
    void executeOrder({ token, brand, installments })
  }

  const handleCardError = (msg: string) => {
    setError(msg)
    setBusy(false)
    setCheckoutStep('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !activeItems.length) return
    if (!availablePayments.length) {
      setError('Nenhuma forma de pagamento está disponível no momento.')
      return
    }
    const selected = editingAddress ? draft : address
    if (!validAddress(selected)) { setError('Confira os campos do endereço antes de continuar.'); return }
    if (taxDoc.length !== (taxType === 'CPF' ? 11 : 14) || (taxType === 'CNPJ' && !company.trim())) { setError('Confira o documento e os dados de faturamento.'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Informe o telefone com DDD.'); return }
    setError('')
    if (payment === 'pix') {
      setPixFlowStage('preparing')
      setCheckoutLoadingMessage('Preparando tudo para sua compra')
    }

    // For credit card: trigger tokenization first (calls handleCardToken -> executeOrder)
    if (payment === 'credit_card') {
      setBusy(true)
      setCheckoutStep('Criptografando dados do cartão…')
      const btn = window.document.getElementById('tkn-card-tokenize-btn') as any
      if (btn?._trigger) {
        await btn._trigger()
      } else {
        setError('Preencha os dados do cartão antes de continuar.')
        setBusy(false)
        setCheckoutStep('')
      }
      return
    }

    // For Pix / Boleto:
    setCheckoutStep(payment === 'pix' ? 'Gerando QR Code Pix instantâneo…' : 'Gerando boleto bancário…')
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

  useEffect(() => {
    if (pixFlowStage === 'preparing') {
      const timer = window.setTimeout(() => {
        setCheckoutLoadingMessage('Já é quase sua!')
        setPixFlowStage('almost')
      }, 3000)
      return () => window.clearTimeout(timer)
    }
    if (pixFlowStage === 'almost') {
      const timer = window.setTimeout(() => setPixFlowStage('confirming'), 2000)
      return () => window.clearTimeout(timer)
    }
    if (pixFlowStage === 'confirming') {
      const timer = window.setTimeout(() => setPixFlowStage('idle'), 2000)
      return () => window.clearTimeout(timer)
    }
  }, [pixFlowStage])

  // ── Determine success screen to show ──────────────────────────────────────
  const showPixSuccess = complete && payment === 'pix' && pixFlowStage === 'idle'
  const showBoletoSuccess = complete && payment === 'boleto'
  const showCardSuccess = complete && payment === 'credit_card'

  const checkoutLoadingOverlay = ((busy && !complete && pixFlowStage === 'idle') || pixFlowStage !== 'idle') && (
    <div className={`tkn-checkout-loading-overlay ${pixFlowStage === 'confirming' ? 'is-pix-confirming' : ''}`} role="status" aria-live="polite" style={{ display: 'grid', placeItems: 'center', background: pixFlowStage === 'confirming' ? 'transparent' : '#fff' }}>
      <div className="tkn-checkout-loading-content" style={{ display: 'grid', justifyItems: 'center', gap: 24, width: 'min(100% - 48px, 360px)', padding: 24, color: '#111', textAlign: 'center' }}>
        {pixFlowStage === 'confirming' ? <><span className="tkn-pix-confirmation-icon"><CheckCircle2 size={38} /></span><strong>Pagamento Pix preparado</strong></> : <><strong>{checkoutStep || checkoutLoadingMessage}</strong><span className="tkn-checkout-loading-spinner" aria-hidden="true" /></>}
      </div>
    </div>
  )

  return <div id="checkout-container" className="tkn-checkout">
    {typeof document !== 'undefined' && checkoutLoadingOverlay && createPortal(checkoutLoadingOverlay, document.body)}
    <Editable as="header" widgetId="checkout-header" label="Cabeçalho do checkout" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-top"><div className="tkn-checkout-shell">
      <a href={storeUrl('/')} aria-label="TEKNIX início"><Editable as="img" widgetId="checkout-1" src="/teknix-logo.svg" alt="TEKNIX" width="122" /></a>
      <nav aria-label="Ajuda e conta">
        {authLoading ? (
          <span className="tkn-checkout-auth-slot" aria-hidden="true" />
        ) : user ? (
          <details className="tkn-checkout-account-menu">
            <summary aria-label={`Abrir menu de ${displayName}`}>
              <span className="tkn-checkout-avatar">{avatarUrl ? <Editable as="img" widgetId="checkout-2" src={avatarUrl} alt="" /> : initials}</span>
              <span className="tkn-checkout-account-name">{displayName}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </summary>
            <div className="tkn-checkout-account-popover">
              <div className="tkn-checkout-account-identity">
                <span className="tkn-checkout-avatar">{avatarUrl ? <Editable as="img" widgetId="checkout-3" src={avatarUrl} alt="" /> : initials}</span>
                <span><strong>{displayName}</strong><small>{user.email}</small></span>
              </div>
              <a href={storeUrl('/conta')}>Minha conta</a>
              <a href={storeUrl('/pedidos')}>Meus pedidos</a>
              <a href={storeUrl('/conta/enderecos')}>Endereços</a>
              <button type="button" onClick={() => { void signOut() }}>Sair</button>
            </div>
          </details>
        ) : (
          <a className="tkn-checkout-login-link" href={storeUrl('/login')}>Entrar</a>
        )}
        <a className="tkn-checkout-contact-link" href={storeUrl('/ajuda')}>Contato</a>
      </nav>
    </div></Editable>
    <main className="tkn-checkout-shell tkn-checkout-main">
      <EditableFlow id="checkout-main" label="Estrutura do checkout">
      <Editable as="div" widgetId="checkout-main-content" label="Conteúdo do checkout" widgetType="container" editorKind="container" renderContent={false} style={{ display: 'contents' }}>
      {/* ── SUCCESS / PAYMENT SCREENS ─────────────────────────────────── */}
      {complete ? <Editable content={{}} as="section" widgetId="checkout-4" className="tkn-checkout-success-wrapper">

        {showPixSuccess && (
          <PixSuccess
            qrCode={complete.qrCode || ''}
            qrCodeBase64={complete.qrCodeBase64 || ''}
            orderId={complete.orderId}
            orderNumber={complete.orderNumber || ''}
            total={complete.total}
            storeUrl={storeUrl}
            customerEmail={email}
          />
        )}

        {showBoletoSuccess && (
          <BoletoSuccess
            ticketUrl={complete.ticketUrl || ''}
            digitableLine={complete.digitableLine || complete.barcodeContent || ''}
            orderNumber={complete.orderNumber || ''}
            total={complete.total}
            storeUrl={storeUrl}
            customerName={taxType === 'CNPJ' ? company.trim() : (address.name || draft.name || accountName || 'Cliente')}
            customerEmail={email}
            customerDoc={taxDoc}
          />
        )}

        {showCardSuccess && <>
          <CheckCircle2 size={40} />
          <Editable as="h1" widgetId="checkout-5">Pedido recebido!</Editable>
          <Editable content={{}} as="p" widgetId="checkout-6">Pedido {complete.orderNumber} — o pagamento está sendo processado.</Editable>
          {safePaymentUrl && <a className="tkn-checkout-primary" href={safePaymentUrl}>Continuar no pagamento</a>}
        </>}

        {!showPixSuccess && !showBoletoSuccess && !showCardSuccess && pixFlowStage === 'idle' && <>
          <CheckCircle2 size={40} />
          <Editable as="h1" widgetId="checkout-5b">Pedido recebido</Editable>
          <Editable content={{}} as="p" widgetId="checkout-6b">Pedido {complete.orderNumber}. O pagamento ainda precisa ser confirmado.</Editable>
        </>}

        {!showPixSuccess && !showBoletoSuccess && (
          <a href={storeUrl('/pedidos')} className="tkn-checkout-link">Ver meus pedidos</a>
        )}
      </Editable> : (loadingProduct && !activeItems.length) ? <Editable as="section" widgetId="checkout-8" className="tkn-checkout-empty">
        <Loader2 size={40} className="animate-spin" style={{ color: '#0071e3', animation: 'spin 1s linear infinite' }} />
        <Editable as="h1" widgetId="checkout-9">Carregando produto…</Editable>
        <Editable as="p" widgetId="checkout-10">Buscando informações oficiais do equipamento para finalizar sua compra.</Editable>
      </Editable> : !activeItems.length ? <Editable as="section" widgetId="checkout-8" className="tkn-checkout-empty">
        <Package size={40} /><Editable as="h1" widgetId="checkout-9">Sua sacola está vazia</Editable><Editable as="p" widgetId="checkout-10">Adicione um produto para finalizar sua compra.</Editable><a href={storeUrl('/')} className="tkn-checkout-primary">Explorar produtos</a>
      </Editable> : <>
        <a href={storeUrl('/sacola')} className="tkn-checkout-back"><ArrowLeft size={15} /> Voltar à sacola</a>
          <Editable as="form" widgetId="checkout-form" label="Formulário do checkout" widgetType="form" editorKind="widget" renderContent={false} id="tkn-checkout-form" className="tkn-checkout-grid" onSubmit={submit}>
          <EditableFlow id="checkout-columns" label="Colunas do checkout" compact>
          <Editable as="fieldset" widgetId="checkout-fields" label="Dados de entrega e pagamento" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-content" disabled={busy || loading}>
            <Editable as="h1" widgetId="checkout-11">Finalize sua compra</Editable>
            <div className="tkn-checkout-products">{activeItems.map(item => <article key={item.id} className="tkn-checkout-product">
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
            <section className="tkn-checkout-card" aria-labelledby="payment-title" data-widget-id="checkout-20">
              <Editable as="h2" widgetId="checkout-21" id="payment-title">Meios de pagamento</Editable>
              {availablePayments.map(({ id, name, detail, icon }) => <label key={id} className={'tkn-checkout-payment ' + (payment === id ? 'is-selected' : '')} style={{ display: 'flex', flex: '0 0 auto', height: 64, minHeight: 64, maxHeight: 64, alignItems: 'center', justifyContent: 'flex-start', gap: 10, overflow: 'hidden', boxSizing: 'border-box' }}><input type="radio" name="payment" value={id} checked={payment === id} onChange={() => { setPayment(id); setCardReady(false); setCardToken(''); setError('') }} /><img className="tkn-checkout-payment-icon" src={icon} alt="" style={{ flex: '0 0 32px', width: 32, height: 32 }} /><span style={{ display: 'block', flex: '1 1 auto', minWidth: 0, width: 'auto', height: 'auto', overflow: 'hidden' }}>{name}<small>{detail}</small></span></label>)}
              {availablePayments.length === 0 && <p role="alert">Nenhuma forma de pagamento está disponível no momento.</p>}

              {/* Credit card fields — shown inline when credit_card is selected */}
              {payment === 'credit_card' && (
                <CardFields
                  onToken={handleCardToken}
                  onError={handleCardError}
                  total={total}
                  busy={busy}
                />
              )}
            </section>
            <Editable as="section" widgetId="checkout-22" className="tkn-checkout-card" aria-labelledby="billing-title">
              <Editable as="h2" widgetId="checkout-23" id="billing-title">Faturamento e contato</Editable>
              <div className="tkn-checkout-fields">
                <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
                <label className="tkn-checkout-phone-field">
                  Celular com DDD
                  <div className="tkn-checkout-phone-row">
                    <span className="tkn-checkout-phone-prefix" title="Brasil">+55</span>
                    <input
                      type="tel"
                      autoComplete="tel-national"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      inputMode="tel"
                    />
                  </div>
                </label>
                <label>Tipo de pessoa<select aria-label="Tipo de pessoa" value={taxType} onChange={e => { setTaxType(e.target.value as 'CPF' | 'CNPJ'); setTaxDoc(''); setCompany(''); setError('') }}><option value="CPF">Pessoa física</option><option value="CNPJ">Pessoa jurídica</option></select></label>
                <label><span>{taxType} {taxType === 'CNPJ' && loadingCnpj && <small style={{ color: '#059669', fontSize: 11, fontWeight: 500 }}>(Consultando...)</small>}</span><input inputMode="numeric" autoComplete="off" required value={formatTaxDocument(taxDoc, taxType)} maxLength={taxType === 'CPF' ? 14 : 18} placeholder={taxType === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'} onChange={e => void handleDocumentChange(e.target.value)} onBlur={handleDocumentBlur} /></label>
                {taxType === 'CNPJ' && <label className="tkn-checkout-wide"><span>Razão social {loadingCnpj && <small style={{ color: '#059669', fontSize: 11, fontWeight: 500 }}>(Buscando na Receita...)</small>}</span><input required value={company} placeholder={loadingCnpj ? 'Consultando Receita Federal...' : 'Razão social da empresa'} onChange={e => setCompany(e.target.value)} /></label>}
              </div>
            </Editable>
          </Editable>
          <Editable as="aside" widgetId="checkout-summary" label="Resumo da compra" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-summary" aria-label="Resumo da compra">
            <Editable as="h2" widgetId="checkout-24">Resumo da compra</Editable>
            <button className="tkn-checkout-coupon" type="button" onClick={() => { setCouponNotice(''); setCouponOpen(true) }}><Ticket size={16} /> {coupon ? `Cupom ${coupon.code}` : 'Inserir código do cupom'}</button>
            <dl><div><dt>Produtos</dt><dd>{money(activeTotalPrice)}</dd></div><div><dt>Frete</dt><dd>{money(shippingCost)}</dd></div>{coupon && <div><dt>Desconto</dt><dd>- {money(coupon.discount)}</dd></div>}<div className="tkn-checkout-total"><dt><button type="button" onClick={() => setSummaryOpen(true)}>Total <ChevronUp size={14} /></button></dt><dd>{money(total)}</dd></div></dl>
            {error && <Editable content={{}} as="p" widgetId="checkout-25" role="alert" className="tkn-checkout-error">{error}</Editable>}
            <button className="tkn-checkout-primary" type="submit" disabled={busy || loading || !availablePayments.length}>
              {busy ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <RefreshCw size={15} className="tkn-pix-spin" />
                  <span>{checkoutStep || 'Processando com segurança…'}</span>
                </span>
              ) : (
                payment === 'pix' ? 'Pagar com Pix' : payment === 'credit_card' ? 'Pagar com Cartão' : 'Comprar agora'
              )}
            </button>
            {busy && (
              <div style={{
                marginTop: 8,
                padding: '7px 10px',
                borderRadius: 6,
                background: '#f5f5f7',
                border: '1px solid #e5e5ea',
                fontSize: 11.5,
                color: '#3a3a3c',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <ShieldCheck size={13} style={{ color: '#008a7b', flexShrink: 0 }} />
                <span>Criptografia ponta a ponta ativa</span>
              </div>
            )}
            <Editable as="p" widgetId="checkout-26" className="tkn-checkout-safe"><ShieldCheck size={16} /> Confira os dados antes de continuar.</Editable>
            <a className="tkn-checkout-link" href={storeUrl('/sacola')}>Editar sacola</a>
          </Editable>
          </EditableFlow>
        </Editable>
      </>}
      </Editable>
      </EditableFlow>
    </main>
    {summaryOpen && <div className="tkn-checkout-overlay andes-bottom-sheet__overlay" role="dialog" aria-modal="true" aria-label="Resumo da compra"><Editable as="section" widgetId="checkout-27" className="tkn-checkout-sheet tkn-checkout-full-summary"><button className="tkn-checkout-close" type="button" onClick={() => setSummaryOpen(false)} aria-label="Fechar resumo"><X size={20} /></button><Editable as="h2" widgetId="checkout-28">Resumo da compra</Editable><dl><div><dt>Produtos</dt><dd>{money(activeTotalPrice)}</dd></div>{coupon && <div className="tkn-summary-discount"><dt>Desconto do produto</dt><dd>- {money(coupon.discount)}</dd></div>}<div><dt>Frete</dt><dd>{money(shippingCost)}</dd></div></dl><button className="tkn-sheet-coupon" type="button" onClick={() => { setSummaryOpen(false); setCouponOpen(true) }}><Ticket size={16} /> Inserir código do cupom</button><dl><div><dt>Subtotal</dt><dd>{money(total)}</dd></div><div><dt>Você pagará</dt><dd>{money(total)}<small>{payment === 'pix' ? 'Pix' : payment === 'boleto' ? 'Boleto' : 'Cartão de crédito'}</small></dd></div><div className="tkn-checkout-total"><dt>Total</dt><dd>{money(total)}</dd></div></dl><button className="tkn-checkout-primary" type="submit" form="tkn-checkout-form">Comprar agora</button></Editable></div>}
    {couponOpen && <div className="tkn-checkout-overlay andes-bottom-sheet__overlay" role="dialog" aria-modal="true" aria-label="Cupons"><Editable content={{}} as="section" widgetId="checkout-29" className="tkn-checkout-sheet tkn-checkout-coupon-sheet"><button className="tkn-checkout-close" type="button" onClick={() => setCouponOpen(false)} aria-label="Fechar cupons"><X size={20} /></button><Editable as="h2" widgetId="checkout-30">Cupons</Editable><Editable as="p" widgetId="checkout-31">Insira um código cadastrado para aplicá-lo a esta compra.</Editable><div className="tkn-checkout-coupon-form"><input autoFocus value={couponCode} placeholder="Insira seu código aqui" onChange={e => setCouponCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void applyCoupon() }} /><button type="button" onClick={() => void applyCoupon()}>Inserir</button></div>{couponNotice && <Editable content={{}} as="p" widgetId="checkout-32" className="tkn-checkout-coupon-notice" role="status">{couponNotice}</Editable>}</Editable></div>}
    <Editable as="footer" widgetId="checkout-footer" label="Rodapé do checkout" widgetType="container" editorKind="container" renderContent={false} className="tkn-checkout-footer"><div className="tkn-checkout-shell"><a href={storeUrl('/ajuda')}>Contato e atendimento</a><a href={storeUrl('/sacola')}>Minha sacola</a><span>TEKNIX · Todos os direitos reservados.</span></div></Editable>
  </div>
}
