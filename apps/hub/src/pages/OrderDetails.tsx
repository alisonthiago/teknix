import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, supabaseAdmin } from '../lib/supabase'
import {
  FileText,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
  RefreshCw,
  Ban,
  FileCheck,
  ArrowLeft,
  Check,
  Package,
  Truck,
  User,
  MapPin,
  CreditCard,
  Copy,
  MessageSquare,
  ShoppingBag,
  Sliders,
  CheckCheck
} from 'lucide-react'
import { FiscalService, StoreInvoice, StoreReceipt, FiscalValidationResult } from '../services/fiscal/FiscalService'
import { OrderWorkflow } from '../services/orderWorkflow'
import { ReceiptModal } from '../components/ReceiptModal'
import { HubNotificationService } from '../services/notificationService'
import './OrderDetails.css'

// Tipagem para store_orders (loja própria — separado do FLOW)
interface StoreOrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  sku: string | null
  quantity: number
  price: number
  total: number
  image_url?: string | null
}

interface StoreOrder {
  id: string
  order_number: string
  customer_id: string | null
  user_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  customer_document: string | null
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  status: string
  payment_method: string | null
  payment_status: string
  payment_id: string | null
  shipping_method: string | null
  delivery_address: string | null
  origin: string | null
  notes: string | null
  fiscal_preference?: 'none' | 'receipt' | 'nfe' | 'both'
  fiscal_status?: string
  created_at: string
  updated_at: string
  items?: StoreOrderItem[]
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Estados Fiscais
  const [invoice, setInvoice] = useState<StoreInvoice | null>(null)
  const [receipt, setReceipt] = useState<StoreReceipt | null>(null)
  const [validation, setValidation] = useState<FiscalValidationResult | null>(null)
  const [fiscalLoading, setFiscalLoading] = useState(false)
  const [fiscalMsg, setFiscalMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [selectedEnv, setSelectedEnv] = useState<'homologacao' | 'producao'>('homologacao')

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function fetchOrder() {
    setLoading(true)
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '')
      
      // Usa supabaseAdmin no HUB para garantir permissão administrativa, com fallback para supabase
      let query = (supabaseAdmin || supabase)
        .from('store_orders')
        .select('*, items:store_order_items(*)')

      if (isUuid) {
        query = query.eq('id', id)
      } else {
        query = query.eq('order_number', id)
      }

      let { data, error } = await query.maybeSingle()

      // Fallback seguro caso haja problema com a query inicial
      if (error || !data) {
        const fallbackClient = supabaseAdmin || supabase
        const fbRes = await fallbackClient
          .from('store_orders')
          .select('*, items:store_order_items(*)')
          .eq(isUuid ? 'id' : 'order_number', id)
          .maybeSingle()
        if (fbRes.data) {
          data = fbRes.data
          error = null
        }
      }

      if (data) {
        // Enriquecer os itens do pedido com as fotos oficiais da tabela products
        if (data.items && data.items.length > 0) {
          const prodIds = data.items.map((i: any) => i.product_id).filter(Boolean)
          if (prodIds.length > 0) {
            const { data: prods } = await (supabaseAdmin || supabase)
              .from('products')
              .select('id, image_url')
              .in('id', prodIds)
            if (prods) {
              const imgMap = new Map(prods.map(p => [p.id, p.image_url]))
              data.items = data.items.map((item: any) => ({
                ...item,
                image_url: imgMap.get(item.product_id) || null
              }))
            }
          }
        }

        setOrder(data as StoreOrder)

        // Busca documentos fiscais vinculados
        const [inv, rec] = await Promise.all([
          FiscalService.getInvoiceByOrderId(data.id),
          FiscalService.getReceiptByOrderId(data.id),
        ])
        setInvoice(inv)
        setReceipt(rec)
        setValidation(FiscalService.validateOrder(data))
      } else {
        setOrder(null)
        console.warn('[OrderDetails] Pedido não encontrado:', error?.message)
      }
    } catch (e) {
      console.error('[OrderDetails] fetchOrder:', e)
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2500)
  }

  async function handlePreferenceChange(pref: 'none' | 'receipt' | 'nfe' | 'both') {
    if (!order) return
    try {
      await FiscalService.updateFiscalPreference(order.id, pref)
      setOrder({ ...order, fiscal_preference: pref })
      setFiscalMsg({ type: 'success', text: `Preferência alterada para "${getPreferenceLabel(pref)}"` })
    } catch (err: any) {
      setFiscalMsg({ type: 'error', text: err.message })
    }
  }

  async function handleEmitNfe() {
    if (!order) return
    setFiscalLoading(true)
    setFiscalMsg(null)
    try {
      const res = await FiscalService.emitNfe(order.id, selectedEnv)
      setFiscalMsg({
        type: 'success',
        text: `NF-e enviada para a SEFAZ! Status: ${res.status.toUpperCase()} (Ref: ${res.reference})`,
      })
      HubNotificationService.notifyInvoiceAuthorized(
        res.reference || order.id,
        res.reference || order.order_number || '000001',
        order.id
      ).catch(() => {})
      await fetchOrder()
    } catch (err: any) {
      setFiscalMsg({ type: 'error', text: err.message })
      await fetchOrder()
    } finally {
      setFiscalLoading(false)
    }
  }

  async function handleGenerateReceipt() {
    if (!order) return
    setFiscalLoading(true)
    setFiscalMsg(null)
    try {
      const rec = await FiscalService.generateReceipt(order.id)
      setReceipt(rec)
      setFiscalMsg({ type: 'success', text: `Recibo ${rec.receipt_number} gerado com sucesso!` })
      setIsReceiptModalOpen(true)
      await fetchOrder()
    } catch (err: any) {
      setFiscalMsg({ type: 'error', text: err.message })
    } finally {
      setFiscalLoading(false)
    }
  }

  async function handleGenerateBoth() {
    if (!order) return
    setFiscalLoading(true)
    setFiscalMsg(null)
    try {
      await FiscalService.generateReceipt(order.id)
      await FiscalService.emitNfe(order.id, selectedEnv)
      setFiscalMsg({ type: 'success', text: 'Recibo gerado e NF-e submetida à SEFAZ com sucesso!' })
      await fetchOrder()
    } catch (err: any) {
      setFiscalMsg({ type: 'error', text: err.message })
      await fetchOrder()
    } finally {
      setFiscalLoading(false)
    }
  }

  async function handleConfirmCancelNfe() {
    if (!invoice || !cancelReason.trim() || cancelReason.trim().length < 15) {
      alert('A justificativa deve ter no mínimo 15 caracteres.')
      return
    }
    setFiscalLoading(true)
    try {
      const res = await FiscalService.cancelNfe(invoice.reference, cancelReason)
      setFiscalMsg({ type: 'success', text: res.message || 'NF-e cancelada com sucesso na SEFAZ' })
      setIsCancelModalOpen(false)
      setCancelReason('')
      await fetchOrder()
    } catch (err: any) {
      setFiscalMsg({ type: 'error', text: err.message })
    } finally {
      setFiscalLoading(false)
    }
  }

  function getPreferenceLabel(pref?: string) {
    switch (pref) {
      case 'receipt': return 'Apenas Recibo'
      case 'nfe': return 'Nota Fiscal (NF-e)'
      case 'both': return 'Recibo + NF-e'
      case 'none': return 'Nenhum'
      default: return 'Nota Fiscal (NF-e)'
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    if (!order) return
    setUpdating(true)
    setStatusMsg('')
    try {
      if (newStatus === 'paid') {
        const res = await OrderWorkflow.confirmOrderPayment(order.id, {
          source: 'manual',
          notes: 'Pagamento confirmado manualmente no TEKNIX HUB'
        })
        if (!res.success) throw new Error(res.message || res.error)
        setStatusMsg(res.message || 'Pagamento aprovado com sucesso!')
      } else if (['preparing', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
        const res = await OrderWorkflow.updateShippingStatus(order.id, newStatus as any)
        if (!res.success) throw new Error(res.message || res.error)
        setStatusMsg(res.message || `Status atualizado para "${getOrderStatusLabel(newStatus)}"`)
      } else {
        const { error } = await (supabaseAdmin || supabase)
          .from('store_orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', order.id)

        if (error) throw error
        setStatusMsg(`Status atualizado para "${getOrderStatusLabel(newStatus)}"`)
      }
      await fetchOrder()
    } catch (err: any) {
      setStatusMsg(`Erro: ${err.message}`)
    } finally {
      setUpdating(false)
      setTimeout(() => setStatusMsg(''), 4000)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0)
  }

  function formatDate(iso: string | null | undefined) {
    if (!iso) return '—'
    const d = new Date(iso)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d)
  }

  function formatDoc(doc: string): string {
    const d = doc.replace(/\D/g, '')
    if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    return doc
  }

  function formatPhone(phone: string | null | undefined): string {
    if (!phone) return '—'
    let clean = phone.replace(/\D/g, '')
    if (clean.startsWith('55') && clean.length >= 12) {
      clean = clean.substring(2)
    }
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  function getWhatsAppUrl(phone: string | null | undefined): string | null {
    if (!phone) return null
    const digits = phone.replace(/\D/g, '')
    const full = digits.startsWith('55') ? digits : `55${digits}`
    if (full.length < 10) return null
    return `https://wa.me/${full}`
  }

  function getOrderStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Aguardando Pagamento'
      case 'paid': return 'Pagamento Aprovado'
      case 'processing': return 'Em Análise'
      case 'preparing': return 'Preparando Envio'
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Entregue'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      default: return status || '—'
    }
  }

  function getOrderStatusClass(status: string) {
    switch (status) {
      case 'pending': return 'pending'
      case 'paid':
      case 'delivered': return 'paid'
      case 'preparing':
      case 'shipped': return 'shipped'
      case 'cancelled':
      case 'refunded': return 'cancelled'
      default: return 'neutral'
    }
  }

  function getPaymentStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Pagamento Pendente'
      case 'approved': return 'Pagamento Aprovado ✓'
      case 'rejected': return 'Pagamento Recusado'
      case 'cancelled': return 'Pagamento Cancelado'
      case 'refunded': return 'Reembolsado'
      case 'in_process': return 'Em Análise'
      default: return status || '—'
    }
  }

  // Stepper progress index
  const getStepperIndex = (status: string, paymentStatus: string) => {
    if (status === 'cancelled' || status === 'refunded') return -1
    if (status === 'delivered') return 4
    if (status === 'shipped') return 3
    if (status === 'preparing') return 2
    if (status === 'paid' || paymentStatus === 'approved') return 1
    return 0
  }

  if (loading) {
    return (
      <div className="order-details-container">
        <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw className="hub-spin" size={24} style={{ marginBottom: 12 }} />
          <div>Carregando ficha completa do pedido...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-details-container">
        <div className="order-card" style={{ padding: '60px', textAlign: 'center' }}>
          <ShoppingBag size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, color: '#0f172a', marginBottom: 8 }}>Pedido não encontrado</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Não encontramos nenhum pedido com o identificador informado.
          </p>
          <button
            type="button"
            className="hub-btn hub-btn-primary"
            onClick={() => navigate('/hub/pedidos')}
          >
            <ArrowLeft size={14} /> Voltar para Pedidos
          </button>
        </div>
      </div>
    )
  }

  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0
  const currentStep = getStepperIndex(order.status, order.payment_status)
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded'

  const steps = [
    { label: 'Pedido Criado', sub: formatDate(order.created_at), icon: ShoppingBag },
    { label: 'Pagamento', sub: order.payment_status === 'approved' || order.status !== 'pending' ? 'Aprovado' : 'Aguardando', icon: CreditCard },
    { label: 'Preparação', sub: ['preparing', 'shipped', 'delivered'].includes(order.status) ? 'Pronto para envio' : 'Separação', icon: Package },
    { label: 'Despachado', sub: ['shipped', 'delivered'].includes(order.status) ? (order.shipping_method || 'Em trânsito') : 'Aguardando', icon: Truck },
    { label: 'Entregue', sub: order.status === 'delivered' ? 'Concluído' : 'Aguardando', icon: CheckCircle2 },
  ]

  const customerInitials = order.customer_name
    ? order.customer_name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'TK'

  return (
    <div className="order-details-container">

      {/* ─── TOP HEADER ─────────────────────────────────────────────────── */}
      <div className="order-top-header">
        <div>
          <div className="order-breadcrumb-wrapper">
            <button
              type="button"
              className="order-btn-back"
              onClick={() => navigate('/hub/pedidos')}
              title="Voltar para Pedidos"
              aria-label="Voltar para Pedidos"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="order-breadcrumb">
              <Link to="/hub/pedidos">Pedidos</Link>
              <span>/</span>
              <span>{order.order_number}</span>
            </div>
          </div>

          <div className="order-title-group">
            <h1 className="order-title">Pedido {order.order_number}</h1>
            <span className={`order-badge ${getOrderStatusClass(order.status)}`}>
              {getOrderStatusLabel(order.status)}
            </span>
            <span className={`order-badge ${order.payment_status === 'approved' ? 'paid' : 'pending'}`}>
              {getPaymentStatusLabel(order.payment_status)}
            </span>
          </div>

          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Realizado em {formatDate(order.created_at)}
            {order.updated_at !== order.created_at && ` • Atualizado em ${formatDate(order.updated_at)}`}
          </div>

          {statusMsg && (
            <div className={`order-status-msg-banner ${statusMsg.startsWith('Erro') ? 'error' : 'success'}`}>
              {statusMsg.startsWith('Erro') ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        <div className="order-header-actions">
          <button
            type="button"
            className="hub-btn hub-btn-secondary"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Imprimir
          </button>

          {/* Botão Contextual Principal */}
          {order.status === 'pending' && (
            <button
              type="button"
              className="hub-btn hub-btn-primary"
              disabled={updating}
              onClick={() => handleUpdateStatus('paid')}
            >
              <Check size={14} /> {updating ? 'Atualizando...' : 'Aprovar Pagamento'}
            </button>
          )}

          {order.status === 'paid' && (
            <button
              type="button"
              className="hub-btn hub-btn-primary"
              disabled={updating}
              onClick={() => handleUpdateStatus('preparing')}
            >
              <Package size={14} /> {updating ? 'Atualizando...' : 'Iniciar Preparação'}
            </button>
          )}

          {order.status === 'preparing' && (
            <button
              type="button"
              className="hub-btn hub-btn-primary"
              disabled={updating}
              onClick={() => handleUpdateStatus('shipped')}
            >
              <Truck size={14} /> {updating ? 'Atualizando...' : 'Despachar Pedido'}
            </button>
          )}

          {order.status === 'shipped' && (
            <button
              type="button"
              className="hub-btn hub-btn-primary"
              disabled={updating}
              onClick={() => handleUpdateStatus('delivered')}
            >
              <CheckCircle2 size={14} /> {updating ? 'Atualizando...' : 'Confirmar Entrega'}
            </button>
          )}

          {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
            <button
              type="button"
              className="hub-btn hub-btn-secondary"
              disabled={updating}
              onClick={() => {
                if (confirm('Deseja realmente cancelar este pedido?')) {
                  handleUpdateStatus('cancelled')
                }
              }}
              style={{ color: '#dc2626', borderColor: '#fecaca' }}
            >
              <Ban size={13} /> Cancelar Pedido
            </button>
          )}
        </div>
      </div>

      {/* ─── STEPPER / PROGRESSO VISUAL DO PEDIDO ───────────────────────── */}
      {!isCancelled ? (
        <div className="order-stepper-card">
          <div className="order-stepper-track">
            <div className="order-step-connector">
              <div
                className="order-step-connector-fill"
                style={{ width: `${Math.min(100, Math.max(0, (currentStep / (steps.length - 1)) * 100))}%` }}
              />
            </div>

            {steps.map((s, idx) => {
              const isCompleted = currentStep > idx
              const isActive = currentStep === idx
              const IconComp = s.icon
              return (
                <div
                  key={s.label}
                  className={`order-step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="order-step-circle">
                    {isCompleted ? <Check size={16} /> : <IconComp size={16} />}
                  </div>
                  <div className="order-step-info">
                    <div className="order-step-label">{s.label}</div>
                    <div className="order-step-sub">{s.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="order-card" style={{ padding: '16px 20px', marginBottom: 24, background: '#fef2f2', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ban size={20} color="#dc2626" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#991b1b' }}>Pedido Cancelado</div>
            <div style={{ fontSize: 12, color: '#b91c1c' }}>Este pedido foi cancelado e não terá continuidade no fluxo de expedição.</div>
          </div>
        </div>
      )}

      {/* ─── GRID PRINCIPAL DE DETALHES ─────────────────────────────────── */}
      <div className="order-grid-layout">
        
        {/* COLUNA ESQUERDA (PRINCIPAL) */}
        <div className="order-main-col">

          {/* 1. PRODUTOS DO PEDIDO */}
          <div className="order-card">
            <div className="order-card-header">
              <h3 className="order-card-title">
                <ShoppingBag size={18} style={{ color: '#0f172a' }} />
                Produtos do Pedido ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
              </h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {order.items?.length || 0} {order.items?.length === 1 ? 'produto cadastrado' : 'produtos'}
              </span>
            </div>

            <div className="order-card-body no-padding">
              <div className="order-products-table-wrap">
              <table className="order-products-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th style={{ textAlign: 'center' }}>Qtd</th>
                    <th style={{ textAlign: 'right' }}>Preço Unit.</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="order-product-cell">
                            <div className="order-product-thumb">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.product_name} />
                              ) : (
                                <Package size={22} color="#94a3b8" />
                              )}
                            </div>
                            <div className="order-product-info">
                              <div className="order-product-name">{item.product_name}</div>
                              {item.sku && (
                                <div className="order-product-sku">
                                  SKU: {item.sku}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                          {item.quantity} un.
                        </td>
                        <td style={{ textAlign: 'right', color: '#64748b', fontSize: 13 }}>
                          {formatPrice(item.price)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                          {formatPrice(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                        Nenhum item listado para este pedido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* 2. RESUMO FINANCEIRO & PAGAMENTO */}
          <div className="order-card">
            <div className="order-card-header">
              <h3 className="order-card-title">
                <CreditCard size={18} style={{ color: '#0f172a' }} /> Resumo Financeiro & Pagamento
              </h3>
            </div>

            <div className="order-card-body">
              <div className="order-finance-rows">
                <div className="order-finance-row">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>

                <div className="order-finance-row">
                  <span>Frete {order.shipping_method ? `(${order.shipping_method})` : ''}</span>
                  <span>
                    {order.shipping_cost > 0 ? (
                      formatPrice(order.shipping_cost)
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Grátis</span>
                    )}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="order-finance-row" style={{ color: '#dc2626' }}>
                    <span>Desconto Aplicado</span>
                    <span>−{formatPrice(order.discount)}</span>
                  </div>
                )}

                <div className="order-finance-row total">
                  <span>Total do Pedido</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Bloco de Dados do Pagamento */}
              <div className="order-payment-box">
                <div className="order-payment-header">
                  <div className="order-payment-method">
                    <CreditCard size={16} color="#0f172a" />
                    <span>{order.payment_method || 'Pagamento na Loja'}</span>
                  </div>
                  <span className={`order-badge ${order.payment_status === 'approved' ? 'paid' : 'pending'}`}>
                    {getPaymentStatusLabel(order.payment_status)}
                  </span>
                </div>

                {order.payment_id && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>ID Transação:</span>
                    <code style={{ background: '#ffffff', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                      {order.payment_id}
                    </code>
                    <button
                      type="button"
                      className="order-copy-btn"
                      onClick={() => copyToClipboard(order.payment_id || '', 'payment_id')}
                      title="Copiar ID"
                    >
                      {copiedField === 'payment_id' ? <CheckCheck size={13} color="#16a34a" /> : <Copy size={13} />}
                    </button>
                  </div>
                )}

                {order.status === 'pending' && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#ca8a04', background: '#fefce8', padding: '8px 12px', borderRadius: 6, border: '1px solid #fef08a' }}>
                    Aguardando confirmação do pagamento via Pix ou aprovação manual no botão acima.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. DOCUMENTOS FISCAIS (NF-e & RECIBO) */}
          <div className="order-card">
            <div className="order-card-header">
              <h3 className="order-card-title">
                <FileText size={18} color="#0f172a" /> Documentos Fiscais & Comerciais
              </h3>
              <span className={`fiscal-header-badge inv-badge-${invoice?.status || order.fiscal_status || 'pending'}`}>
                {invoice?.status === 'autorizada' && <CheckCircle2 size={13} />}
                {invoice?.status === 'processando' && <Clock size={13} />}
                {invoice?.status === 'rejeitada' && <XCircle size={13} />}
                {invoice?.status === 'cancelada' && <Ban size={13} />}
                {invoice?.status?.toUpperCase() || 'NÃO EMITIDA'}
              </span>
            </div>

            <div className="order-card-body">
              {fiscalMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                    fontWeight: 600,
                    background: fiscalMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: fiscalMsg.type === 'success' ? '#15803d' : '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {fiscalMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{fiscalMsg.text}</span>
                </div>
              )}

              {/* Preferência Fiscal */}
              <div className="fiscal-pref-container">
                <span className="fiscal-pref-label">Preferência de Emissão:</span>
                <div className="fiscal-pref-pills">
                  {(['nfe', 'receipt', 'both', 'none'] as const).map((p) => (
                    <button
                      key={p}
                      className={`fiscal-pref-btn ${(order.fiscal_preference || 'nfe') === p ? 'active' : ''}`}
                      onClick={() => handlePreferenceChange(p)}
                    >
                      {getPreferenceLabel(p)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid dos Documentos */}
              <div className="fiscal-docs-grid">
                {/* SUBCARD RECIBO */}
                <div className="fiscal-subcard">
                  <div>
                    <div className="fiscal-subcard-header">
                      <span className="fiscal-subcard-title">
                        <FileCheck size={16} color="#2563eb" /> Recibo Comercial
                      </span>
                      <span className={`order-badge ${receipt ? 'paid' : 'neutral'}`} style={{ fontSize: 11 }}>
                        {receipt ? 'GERADO' : 'NÃO GERADO'}
                      </span>
                    </div>

                    {receipt ? (
                      <div>
                        <div className="fiscal-meta-item">
                          <strong>Número:</strong> {receipt.receipt_number}
                        </div>
                        <div className="fiscal-meta-item">
                          <strong>Data de Geração:</strong> {formatDate(receipt.generated_at)}
                        </div>
                        <div className="fiscal-meta-item">
                          <strong>Valor:</strong> {formatPrice(receipt.total)}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '6px 0' }}>
                        Recibo comercial timbrado da TEKNIX com comprovante de itens e forma de pagamento.
                      </p>
                    )}
                  </div>

                  <div className="fiscal-subcard-actions">
                    {receipt ? (
                      <>
                        <button
                          type="button"
                          className="btn-fiscal-action primary"
                          onClick={() => setIsReceiptModalOpen(true)}
                        >
                          <Printer size={14} /> Imprimir Recibo
                        </button>
                        <button
                          type="button"
                          className="btn-fiscal-action secondary"
                          onClick={handleGenerateReceipt}
                          disabled={fiscalLoading}
                        >
                          <RefreshCw size={14} className={fiscalLoading ? 'hub-spin' : ''} /> Atualizar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-fiscal-action primary"
                        onClick={handleGenerateReceipt}
                        disabled={fiscalLoading}
                      >
                        <FileText size={14} /> Gerar Recibo
                      </button>
                    )}
                  </div>
                </div>

                {/* SUBCARD NF-E */}
                <div className="fiscal-subcard">
                  <div>
                    <div className="fiscal-subcard-header">
                      <span className="fiscal-subcard-title">
                        <FileText size={16} color="#059669" /> Nota Fiscal (NF-e)
                      </span>
                      <span className={`order-badge ${invoice?.status === 'autorizada' ? 'paid' : 'neutral'}`} style={{ fontSize: 11 }}>
                        {invoice?.status?.toUpperCase() || 'NÃO EMITIDA'}
                      </span>
                    </div>

                    {invoice ? (
                      <div>
                        {invoice.numero && (
                          <div className="fiscal-meta-item">
                            <strong>Número / Série:</strong> Nº {invoice.numero} (Série {invoice.serie || 1})
                          </div>
                        )}
                        <div className="fiscal-meta-item">
                          <strong>Ambiente:</strong>{' '}
                          <span style={{ fontWeight: 600, color: invoice.ambiente === 'producao' ? '#16a34a' : '#ca8a04' }}>
                            {invoice.ambiente === 'producao' ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}
                          </span>
                        </div>
                        {invoice.chave && (
                          <div className="fiscal-meta-item">
                            <strong>Chave de Acesso:</strong>
                            <div
                              className="fiscal-key-box"
                              title="Clique para copiar"
                              onClick={() => copyToClipboard(invoice.chave || '', 'chave_nfe')}
                            >
                              {invoice.chave}
                            </div>
                            {copiedField === 'chave_nfe' && (
                              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Copiada!</span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 8px' }}>
                          Emissão direta e autorização via SEFAZ estadual.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                          <label style={{ fontWeight: 600, color: '#0f172a' }}>Ambiente:</label>
                          <select
                            style={{ padding: '3px 6px', fontSize: '0.8rem', borderRadius: 6, border: '1px solid #e2e8f0' }}
                            value={selectedEnv}
                            onChange={(e) => setSelectedEnv(e.target.value as any)}
                          >
                            <option value="homologacao">Homologação (Testes)</option>
                            <option value="producao">Produção Oficial</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="fiscal-subcard-actions">
                    {(!invoice || invoice.status === 'nao_emitida' || invoice.status === 'dados_incompletos') && (
                      <button
                        type="button"
                        className="btn-fiscal-action primary"
                        onClick={handleEmitNfe}
                        disabled={fiscalLoading}
                      >
                        <FileText size={14} /> Emitir NF-e
                      </button>
                    )}

                    {invoice?.status === 'processando' && (
                      <button
                        type="button"
                        className="btn-fiscal-action secondary"
                        onClick={fetchOrder}
                        disabled={fiscalLoading}
                      >
                        <RefreshCw size={14} className={fiscalLoading ? 'hub-spin' : ''} /> Consultar Status
                      </button>
                    )}

                    {invoice?.status === 'autorizada' && (
                      <>
                        {invoice.danfe_url && (
                          <a
                            href={invoice.danfe_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-fiscal-action primary"
                          >
                            <FileText size={14} /> Ver DANFE
                          </a>
                        )}
                        {invoice.xml_url && (
                          <a
                            href={invoice.xml_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-fiscal-action secondary"
                          >
                            <Download size={14} /> Baixar XML
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn-fiscal-action danger"
                          onClick={() => setIsCancelModalOpen(true)}
                          disabled={fiscalLoading}
                        >
                          <Ban size={14} /> Cancelar NF-e
                        </button>
                      </>
                    )}

                    {invoice?.status === 'rejeitada' && (
                      <button
                        type="button"
                        className="btn-fiscal-action primary"
                        onClick={handleEmitNfe}
                        disabled={fiscalLoading}
                      >
                        <RefreshCw size={14} /> Reprocessar NF-e
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA (SIDEBAR) */}
        <div className="order-sidebar-col">

          {/* CARD CLIENTE */}
          <div className="order-card">
            <div className="order-card-header">
              <h3 className="order-card-title">
                <User size={18} style={{ color: '#0f172a' }} /> Dados do Cliente
              </h3>
            </div>

            <div className="order-card-body">
              <div className="order-customer-profile">
                <div className="order-avatar-circle">
                  {customerInitials}
                </div>
                <div>
                  <div className="order-customer-name">{order.customer_name || 'Cliente Sem Nome'}</div>
                  <div className="order-customer-type">✓ Loja Própria TEKNIX</div>
                </div>
              </div>

              <div className="order-info-list">
                {order.customer_email && (
                  <div className="order-info-item">
                    <span className="order-info-label">E-mail</span>
                    <div className="order-info-value">
                      <a href={`mailto:${order.customer_email}`} style={{ color: '#0071e3', textDecoration: 'none' }}>
                        {order.customer_email}
                      </a>
                      <button
                        type="button"
                        className="order-copy-btn"
                        onClick={() => copyToClipboard(order.customer_email || '', 'email')}
                        title="Copiar e-mail"
                      >
                        {copiedField === 'email' ? <CheckCheck size={13} color="#16a34a" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                )}

                {order.customer_phone && (
                  <div className="order-info-item">
                    <span className="order-info-label">Telefone / WhatsApp</span>
                    <div className="order-info-value">
                      <span>{formatPhone(order.customer_phone)}</span>
                    </div>

                    {getWhatsAppUrl(order.customer_phone) && (
                      <a
                        href={getWhatsAppUrl(order.customer_phone)!}
                        target="_blank"
                        rel="noreferrer"
                        className="order-whatsapp-btn"
                      >
                        <MessageSquare size={14} /> Conversar no WhatsApp
                      </a>
                    )}
                  </div>
                )}

                {order.customer_document && (
                  <div className="order-info-item">
                    <span className="order-info-label">CPF / CNPJ</span>
                    <div className="order-info-value">
                      <span style={{ fontFamily: 'monospace' }}>{formatDoc(order.customer_document)}</span>
                      <button
                        type="button"
                        className="order-copy-btn"
                        onClick={() => copyToClipboard(order.customer_document || '', 'cpf')}
                        title="Copiar documento"
                      >
                        {copiedField === 'cpf' ? <CheckCheck size={13} color="#16a34a" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD ENTREGA & ENDEREÇO */}
          <div className="order-card">
            <div className="order-card-header">
              <h3 className="order-card-title">
                <Truck size={18} style={{ color: '#0f172a' }} /> Entrega & Destino
              </h3>
            </div>

            <div className="order-card-body">
              <div className="order-info-list">
                <div className="order-info-item">
                  <span className="order-info-label">Método de Envio</span>
                  <div className="order-info-value" style={{ fontWeight: 600 }}>
                    {order.shipping_method || 'Entrega Padrão'}
                  </div>
                </div>

                <div className="order-info-item">
                  <span className="order-info-label">Endereço de Entrega</span>
                  <div className="order-info-value" style={{ lineHeight: 1.4 }}>
                    {order.delivery_address || 'Endereço não informado'}
                  </div>
                </div>

                {order.notes && (
                  <div className="order-info-item">
                    <span className="order-info-label">Observações</span>
                    <div className="order-info-value" style={{ fontSize: 12, color: '#64748b' }}>
                      {order.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD GESTÃO DE STATUS DO PEDIDO */}
          <div className="order-card">
            <div className="order-card-header">
              <h3 className="order-card-title">
                <Sliders size={18} style={{ color: '#0f172a' }} /> Gestão de Status
              </h3>
            </div>

            <div className="order-card-body">
              <div style={{ marginBottom: 12 }}>
                <span className="order-info-label">Status Atual</span>
                <div style={{ marginTop: 4 }}>
                  <span className={`order-badge ${getOrderStatusClass(order.status)}`} style={{ fontSize: 13, width: '100%', justifyContent: 'center' }}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                <label className="order-info-label">Alterar Status:</label>
                <select
                  className="order-status-select"
                  value={order.status}
                  disabled={updating}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                >
                  <option value="pending">Aguardando Pagamento</option>
                  <option value="paid">Pagamento Aprovado</option>
                  <option value="preparing">Preparando Envio</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL DO RECIBO COMERCIAL */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={order}
        receipt={receipt}
      />

      {/* MODAL DE CANCELAMENTO DE NF-E */}
      {isCancelModalOpen && (
        <div className="cancel-modal-backdrop" onClick={() => setIsCancelModalOpen(false)}>
          <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar NF-e #{invoice?.numero || invoice?.reference}</h3>
            <p>
              A SEFAZ exige uma justificativa com no mínimo 15 caracteres para homologar o cancelamento.
              Esta operação é irreversível.
            </p>
            <textarea
              className="cancel-textarea"
              placeholder="Descreva o motivo do cancelamento (ex: Desistência da compra pelo cliente com estorno efetuado)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="cancel-modal-actions">
              <button
                type="button"
                className="btn-fiscal-action secondary"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={fiscalLoading}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn-fiscal-action danger"
                onClick={handleConfirmCancelNfe}
                disabled={fiscalLoading || cancelReason.trim().length < 15}
              >
                {fiscalLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
