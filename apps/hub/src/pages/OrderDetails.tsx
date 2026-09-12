import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
  Send,
  FileCheck,
  ShieldAlert,
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
  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

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
      let query = supabase.from('store_orders').select('*, items:store_order_items(*)')
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '')
      if (isUuid) {
        query = query.eq('id', id)
      } else {
        query = query.eq('order_number', id)
      }
      const { data, error } = await query.maybeSingle()

      if (!error && data) {
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
    }
    setLoading(false)
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
    if (!order || !id) return
    setUpdating(true)
    setStatusMsg('')
    try {
      if (newStatus === 'paid') {
        const res = await OrderWorkflow.confirmOrderPayment(id, {
          source: 'manual',
          notes: 'Pagamento confirmado manualmente no TEKNIX HUB'
        })
        if (!res.success) throw new Error(res.message || res.error)
        setStatusMsg(res.message)
      } else if (['preparing', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
        const res = await OrderWorkflow.updateShippingStatus(id, newStatus as any)
        if (!res.success) throw new Error(res.message || res.error)
        setStatusMsg(res.message)
      } else {
        const { error } = await supabase
          .from('store_orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id)

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

  function getOrderStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Aguardando Pagamento'
      case 'paid': return 'Pagamento Aprovado'
      case 'processing': return 'Em análise'
      case 'preparing': return 'Preparando Envio'
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Entregue'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      default: return status || '—'
    }
  }

  function getOrderStatusBadge(status: string) {
    switch (status) {
      case 'pending': return 'badge-warning'
      case 'paid': return 'badge-success'
      case 'processing': return 'badge-info'
      case 'preparing': return 'badge-info'
      case 'shipped': return 'badge-primary'
      case 'delivered': return 'badge-success'
      case 'cancelled': return 'badge-danger'
      default: return 'badge-neutral'
    }
  }

  function getPaymentStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Aguardando Pagamento'
      case 'approved': return 'Pagamento Aprovado ✓'
      case 'rejected': return 'Pagamento Recusado'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      case 'in_process': return 'Em Análise'
      default: return status || '—'
    }
  }

  function getPaymentStatusBadge(status: string) {
    switch (status) {
      case 'pending': return 'badge-warning'
      case 'approved': return 'badge-success'
      case 'rejected': return 'badge-danger'
      case 'cancelled': return 'badge-danger'
      case 'refunded': return 'badge-neutral'
      case 'in_process': return 'badge-info'
      default: return 'badge-neutral'
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Carregando pedido...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#86868b' }}>Pedido não encontrado.</p>
        <Link to="/hub/pedidos" style={{ color: '#0066cc', textDecoration: 'none' }}>← Voltar para pedidos</Link>
      </div>
    )
  }

  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <div className="order-details-page">

      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <Link to="/hub/pedidos" className="back-link">← Voltar para pedidos</Link>
          <div className="order-title-group">
            <h2>Pedido {order.order_number}</h2>
            <span className={`status-badge ${getOrderStatusBadge(order.status)}`}>
              {getOrderStatusLabel(order.status)}
            </span>
            <span className={`status-badge ${getPaymentStatusBadge(order.payment_status)}`}>
              {getPaymentStatusLabel(order.payment_status)}
            </span>
          </div>
          <p className="order-date">
            Criado em {formatDate(order.created_at)}
            {order.updated_at !== order.created_at && ` • Atualizado em ${formatDate(order.updated_at)}`}
          </p>
          {statusMsg && (
            <div style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, background: statusMsg.startsWith('Erro') ? '#ffeaea' : '#e9fce9', color: statusMsg.startsWith('Erro') ? '#c00' : '#1d7e40', fontSize: 13, fontWeight: 600 }}>
              {statusMsg}
            </div>
          )}
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>Imprimir</button>
          {order.status === 'pending' && (
            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('paid')}>
              {updating ? 'Atualizando...' : 'Aprovar Pagamento'}
            </button>
          )}
          {order.status === 'paid' && (
            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('preparing')}>
              {updating ? '...' : 'Mover para Preparando'}
            </button>
          )}
          {order.status === 'preparing' && (
            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('shipped')}>
              {updating ? '...' : 'Mover para Enviado'}
            </button>
          )}
          {order.status === 'shipped' && (
            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('delivered')}>
              {updating ? '...' : 'Marcar como Entregue'}
            </button>
          )}
          {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
            <button className="btn btn-secondary" disabled={updating} onClick={() => handleUpdateStatus('cancelled')}
              style={{ color: '#c00', borderColor: '#ffd0d0' }}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="order-grid">

        {/* COLUNA PRINCIPAL */}
        <div className="order-main">

          {/* Produtos */}
          <div className="detail-card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Produtos comprados ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</h3>
              <span style={{ fontSize: 12, color: '#86868b' }}>{order.items?.length || 0} {order.items?.length === 1 ? 'produto' : 'produtos'}</span>
            </div>
            <div className="card-body no-padding">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th style={{ textAlign: 'center' }}>Qtd</th>
                    <th style={{ textAlign: 'right' }}>Preço Unit.</th>
                    <th style={{ textAlign: 'right' }}>Total Linha</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? order.items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="item-name">{item.product_name}</div>
                        {item.sku && (
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, fontFamily: 'monospace' }}>
                            SKU: {item.sku}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', color: '#555' }}>{formatPrice(item.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#1d1d1f' }}>{formatPrice(item.total)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: '24px' }}>
                        Itens não carregados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagamento e Resumo */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Resumo Financeiro</h3>
            </div>
            <div className="card-body">
              <div className="summary-section">
                <div className="summary-row">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Frete{order.shipping_method ? ` (${order.shipping_method})` : ''}</span>
                  <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : <span style={{ color: '#1d7e40' }}>Grátis</span>}</span>
                </div>
                {order.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Desconto / Cupom</span>
                    <span>−{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total Pago</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Dados de Pagamento */}
              <div className="payment-details-panel">
                <div className="payment-details-title">
                  Dados do Pagamento
                </div>
                <div className="payment-details-grid">
                  <div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>Método</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>{order.payment_method || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>Status do Pagamento</div>
                    <span className={`status-badge ${getPaymentStatusBadge(order.payment_status)}`} style={{ fontSize: 11 }}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </div>
                  {order.payment_id && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11, color: '#aaa' }}>ID Mercado Pago</div>
                      <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#555', wordBreak: 'break-all' }}>{order.payment_id}</div>
                    </div>
                  )}
                  {order.origin && (
                    <div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>Origem</div>
                      <div style={{ fontSize: 13, color: '#555' }}>{order.origin}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO OFICIAL: DOCUMENTOS / FISCAL (HUB) */}
          {/* ================================================================ */}
          <div className="detail-card fiscal-card">
            <div className="card-header fiscal-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} color="#0f172a" />
                <h3>Documentos / Fiscal</h3>
              </div>
              <span className={`fiscal-header-badge inv-badge-${invoice?.status || order.fiscal_status || 'pending'}`}>
                {invoice?.status === 'autorizada' && <CheckCircle2 size={13} />}
                {invoice?.status === 'processando' && <Clock size={13} />}
                {invoice?.status === 'rejeitada' && <XCircle size={13} />}
                {invoice?.status === 'cancelada' && <Ban size={13} />}
                {invoice?.status === 'dados_incompletos' && <AlertTriangle size={13} />}
                {invoice?.status?.toUpperCase() || 'NÃO EMITIDA'}
              </span>
            </div>

            <div className="card-body">
              {/* Feedback de ações fiscais */}
              {fiscalMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                    fontWeight: 600,
                    background: fiscalMsg.type === 'success' ? '#dcfce7' : fiscalMsg.type === 'error' ? '#fee2e2' : '#f1f5f9',
                    color: fiscalMsg.type === 'success' ? '#15803d' : fiscalMsg.type === 'error' ? '#b91c1c' : '#111111',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {fiscalMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{fiscalMsg.text}</span>
                </div>
              )}

              {/* 1. Preferência de Documento da Loja */}
              <div className="fiscal-pref-container">
                <span className="fiscal-pref-label">Tipo de Documento / Preferência:</span>
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

              {/* 2. Alerta se dados fiscais estiverem incompletos */}
              {validation && !validation.valid && (
                <div className="fiscal-alert-box fiscal-alert-warning">
                  <AlertTriangle size={20} className="fiscal-alert-icon" />
                  <div className="fiscal-alert-content">
                    <h4>Dados fiscais incompletos para emissão da NF-e</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>
                      A SEFAZ exige que os seguintes campos estejam preenchidos antes de autorizar a emissão:
                    </p>
                    <ul className="fiscal-alert-list">
                      {validation.missingFields.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 3. Alerta de rejeição da SEFAZ se houver */}
              {invoice?.status === 'rejeitada' && invoice.rejection_message && (
                <div className="fiscal-alert-box fiscal-alert-error">
                  <XCircle size={20} className="fiscal-alert-icon" />
                  <div className="fiscal-alert-content">
                    <h4>Rejeição SEFAZ ({invoice.rejection_code || 'Erro'})</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem' }}>{invoice.rejection_message}</p>
                  </div>
                </div>
              )}

              {/* 4. Subcards Grid: Recibo & NF-e */}
              <div className="fiscal-docs-grid">
                {/* SUBCARD RECIBO */}
                <div className="fiscal-subcard">
                  <div>
                    <div className="fiscal-subcard-header">
                      <span className="fiscal-subcard-title">
                        <FileCheck size={16} color="#2563eb" /> Recibo Comercial
                      </span>
                      <span className={`inv-badge ${receipt ? 'inv-badge-authorized' : 'inv-badge-pending'}`}>
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
                        <div className="fiscal-meta-item">
                          <strong>Status:</strong> {receipt.status?.toUpperCase()}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '8px 0' }}>
                        Recibo comercial com dados da TEKNIX, cliente, itens e forma de pagamento.
                      </p>
                    )}
                  </div>

                  <div className="fiscal-subcard-actions">
                    {receipt ? (
                      <>
                        <button
                          className="btn-fiscal-action primary"
                          onClick={() => setIsReceiptModalOpen(true)}
                        >
                          <Printer size={14} /> Visualizar / Imprimir
                        </button>
                        <button
                          className="btn-fiscal-action secondary"
                          onClick={handleGenerateReceipt}
                          disabled={fiscalLoading}
                        >
                          <RefreshCw size={14} className={fiscalLoading ? 'spin' : ''} /> Atualizar
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-fiscal-action primary"
                        onClick={handleGenerateReceipt}
                        disabled={fiscalLoading}
                      >
                        <FileText size={14} /> Gerar Recibo
                      </button>
                    )}
                  </div>
                </div>

                {/* SUBCARD NF-e */}
                <div className="fiscal-subcard">
                  <div>
                    <div className="fiscal-subcard-header">
                      <span className="fiscal-subcard-title">
                        <FileText size={16} color="#059669" /> Nota Fiscal (NF-e)
                      </span>
                      <span className={`inv-badge inv-badge-${invoice?.status || 'pending'}`}>
                        {invoice?.status?.toUpperCase() || 'NÃO EMITIDA'}
                      </span>
                    </div>

                    {invoice ? (
                      <div>
                        <div className="fiscal-meta-item">
                          <strong>Referência:</strong> {invoice.reference}
                        </div>
                        {invoice.numero && (
                          <div className="fiscal-meta-item">
                            <strong>Número / Série:</strong> Nº {invoice.numero} (Série {invoice.serie || 1})
                          </div>
                        )}
                        <div className="fiscal-meta-item">
                          <strong>Ambiente:</strong>{' '}
                          <span className={`inv-env-badge inv-env-${invoice.ambiente || 'homologacao'}`}>
                            {invoice.ambiente === 'producao' ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}
                          </span>
                        </div>
                        {invoice.protocolo && (
                          <div className="fiscal-meta-item">
                            <strong>Protocolo SEFAZ:</strong> {invoice.protocolo}
                          </div>
                        )}
                        {invoice.issued_at && (
                          <div className="fiscal-meta-item">
                            <strong>Data Emissão:</strong> {formatDate(invoice.issued_at)}
                          </div>
                        )}
                        {invoice.chave && (
                          <div className="fiscal-meta-item">
                            <strong>Chave de Acesso:</strong>
                            <div
                              className="fiscal-key-box"
                              title="Clique para copiar"
                              onClick={() => {
                                navigator.clipboard.writeText(invoice.chave || '')
                                alert('Chave de acesso copiada!')
                              }}
                            >
                              {invoice.chave}
                            </div>
                          </div>
                        )}
                        {invoice.status === 'cancelada' && invoice.cancellation_reason && (
                          <div className="fiscal-meta-item" style={{ color: '#dc2626' }}>
                            <strong>Justificativa Cancelamento:</strong> {invoice.cancellation_reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 10px' }}>
                          Emissão direta via SEFAZ com integração Focus NFe.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                          <label style={{ fontWeight: 600, color: '#111111' }}>Ambiente:</label>
                          <select
                            className="form-select"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: 6 }}
                            value={selectedEnv}
                            onChange={(e) => setSelectedEnv(e.target.value as any)}
                          >
                            <option value="homologacao">Homologação (Testes SEFAZ)</option>
                            <option value="producao">Produção Oficial</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="fiscal-subcard-actions">
                    {/* Ações conforme o estado da NF-e */}
                    {(!invoice || invoice.status === 'nao_emitida' || invoice.status === 'dados_incompletos') && (
                      <>
                        <button
                          className="btn-fiscal-action primary"
                          onClick={handleEmitNfe}
                          disabled={fiscalLoading || (validation ? !validation.valid : false)}
                          title={validation && !validation.valid ? 'Preencha os campos obrigatórios' : 'Emitir NF-e'}
                        >
                          <FileText size={14} /> Emitir NF-e
                        </button>
                        <button
                          className="btn-fiscal-action secondary"
                          onClick={handleGenerateBoth}
                          disabled={fiscalLoading || (validation ? !validation.valid : false)}
                        >
                          Gerar Ambos
                        </button>
                      </>
                    )}

                    {invoice?.status === 'processando' && (
                      <button
                        className="btn-fiscal-action secondary"
                        onClick={fetchOrder}
                        disabled={fiscalLoading}
                      >
                        <RefreshCw size={14} className={fiscalLoading ? 'spin' : ''} /> Consultar Status
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
                        className="btn-fiscal-action primary"
                        onClick={handleEmitNfe}
                        disabled={fiscalLoading}
                      >
                        <RefreshCw size={14} className={fiscalLoading ? 'spin' : ''} /> Reprocessar NF-e
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Endereço de Entrega */}
          {order.delivery_address && (
            <div className="detail-card">
              <div className="card-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  Endereço de Entrega
                </h3>
              </div>
              <div className="card-body">
                <div className="info-block">
                  <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{order.customer_name}</span>
                  <span>{order.delivery_address}</span>
                  {order.notes && <span style={{ color: '#86868b', fontSize: 13 }}>{order.notes}</span>}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* SIDEBAR */}
        <div className="order-sidebar">

          {/* Cliente */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Cliente</h3>
            </div>
            <div className="card-body">
              <div className="info-block">
                <strong style={{ fontSize: 15 }}>{order.customer_name || '—'}</strong>
                {order.customer_email && (
                  <a href={`mailto:${order.customer_email}`} style={{ color: '#0066cc', textDecoration: 'none', fontSize: 13 }}>
                    {order.customer_email}
                  </a>
                )}
                {order.customer_phone && <span>{order.customer_phone}</span>}
                {order.customer_document && (
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#86868b' }}>
                    CPF/CNPJ: {formatDoc(order.customer_document)}
                  </span>
                )}
              </div>
              {order.user_id && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#e9fce9', borderRadius: 8, fontSize: 11, color: '#1d7e40', fontWeight: 600 }}>
                  ✓ Conta TEKNIX vinculada
                </div>
              )}
            </div>
          </div>

          {/* Status do Pedido — controle manual */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Status do Pedido</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 12 }}>
                <span className={`status-badge ${getOrderStatusBadge(order.status)}`} style={{ fontSize: 12 }}>
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'] as const).map(s => (
                  <button
                    key={s}
                    className={`btn ${order.status === s ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 12, padding: '6px 12px', opacity: order.status === s ? 1 : 0.7 }}
                    disabled={updating || order.status === s}
                    onClick={() => handleUpdateStatus(s)}
                  >
                    {order.status === s ? '✓ ' : ''}{getOrderStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Informações do pedido */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Informações do Pedido</h3>
            </div>
            <div className="card-body">
              <div className="info-block">
                <div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>Número do pedido</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1d1d1f' }}>{order.order_number}</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>ID interno</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#86868b', wordBreak: 'break-all' }}>{order.id}</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>Data do pedido</div>
                  <div style={{ fontSize: 13 }}>{formatDate(order.created_at)}</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>Última atualização</div>
                  <div style={{ fontSize: 13 }}>{formatDate(order.updated_at)}</div>
                </div>
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
                className="btn-fiscal-action secondary"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={fiscalLoading}
              >
                Voltar
              </button>
              <button
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
