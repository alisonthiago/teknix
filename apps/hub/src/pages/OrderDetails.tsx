import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function fetchOrder() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*, items:store_order_items(*)')
        .eq('id', id)
        .single()

      if (!error && data) {
        setOrder(data as StoreOrder)
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

  async function handleUpdateStatus(newStatus: string) {
    if (!order || !id) return
    setUpdating(true)
    setStatusMsg('')
    try {
      const { error } = await supabase
        .from('store_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setStatusMsg(`Status atualizado para "${getOrderStatusLabel(newStatus)}"`)
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
              <div style={{ marginTop: 20, padding: '16px', background: '#f5f5f7', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: '#86868b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Dados do Pagamento
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
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

          {/* Endereço de Entrega */}
          {order.delivery_address && (
            <div className="detail-card">
              <div className="card-header">
                <h3>📦 Endereço de Entrega</h3>
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
    </div>
  )
}
