import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FocusNfeService } from '../services/integrations/FocusNfeService'
import { MelhorEnvioService } from '../services/integrations/MelhorEnvioService'
import type { Order } from '../types/database'
import './OrderDetails.css'


export default function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const [updating, setUpdating] = useState(false)
  const [trackingInput, setTrackingInput] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function handleUpdateStatus(newStatus: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled') {
    if (!order || !id) return
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      await fetchOrder()
    } catch (err: any) {
      alert(`Erro ao atualizar status: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  async function handleEmitNfe() {
    if (!order || !id) return
    setUpdating(true)
    try {
      const res = await FocusNfeService.emitNfe(order)
      if (res?.accessKey) {
        await supabase
          .from('orders')
          .update({
            nfe_key: res.accessKey,
            nfe_pdf_url: res.pdfUrl,
            nfe_xml_url: res.xmlUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
        alert(`NF-e emitida com sucesso! Chave: ${res.accessKey}`)
        await fetchOrder()
      } else {
        alert(res?.message || 'NF-e enviada para processamento na SEFAZ.')
      }
    } catch (err: any) {
      alert(`Erro ao emitir NF-e: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  async function handleSaveTracking() {
    if (!order || !id) return
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_code: trackingInput,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      alert('Código de rastreio salvo com sucesso!')
      await fetchOrder()
    } catch (err: any) {
      alert(`Erro ao salvar rastreio: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  async function handleGenerateShippingLabel() {
    if (!order || !id) return
    setUpdating(true)
    try {
      const res = await MelhorEnvioService.generateLabel(order)
      if (res?.trackingCode) {
        await supabase
          .from('orders')
          .update({
            tracking_code: res.trackingCode,
            shipping_label_url: res.labelUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
        alert(`Etiqueta gerada com sucesso! Rastreio: ${res.trackingCode}`)
        await fetchOrder()
      }
    } catch (err: any) {
      alert(`Erro ao gerar etiqueta: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  async function fetchOrder() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*), items:order_items(*), history:order_history(*)')
      .eq('id', id)
      .single()

    if (!error && data) {
      setOrder(data as Order)
      setTrackingInput(data.tracking_code || '')
    } else {
      setOrder(null)
    }
    setLoading(false)
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  function formatDate(iso: string) {
    if (!iso) return ''
    const d = new Date(iso)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d)
  }

  function getStatusLabel(status: string) {
    switch(status) {
      case 'pending': return 'Aguardando Pagamento'
      case 'paid': return 'Pagamento Aprovado'
      case 'preparing': return 'Preparando Envio'
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Entregue'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      default: return status
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

  if (!order) return <div className="empty-state">Pedido não encontrado.</div>

  return (
    <div className="order-details-page">
      <div className="page-header">
        <div className="header-info">
          <Link to="/hub/pedidos" className="back-link">← Voltar para pedidos</Link>
          <div className="order-title-group">
            <h2>Pedido {order.order_number}</h2>
            <span className={`status-badge badge-${order.status === 'paid' || order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'primary'}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <p className="order-date">{formatDate(order.created_at || '')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>Imprimir Pedido</button>
          {order.status === 'pending' && (
            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('paid')}>
              Aprovar Pagamento
            </button>
          )}
          {order.status === 'paid' && (
            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('preparing')}>
              Mover para Preparando
            </button>
          )}
          {order.status === 'preparing' && (
            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('shipped')}>
              Mover para Enviado
            </button>
          )}
          {order.status === 'shipped' && (
            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('delivered')}>
              Marcar como Entregue
            </button>
          )}
        </div>
      </div>

      <div className="order-grid">
        <div className="order-main">
          <div className="detail-card">
            <div className="card-header">
              <h3>Produtos comprados ({order.items?.length})</h3>
            </div>
            <div className="card-body no-padding">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Preço Unitário</th>
                    <th align="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="item-name">{item.product_name}</div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td align="right" className="col-bold">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-header">
              <h3>Pagamento e Resumo</h3>
            </div>
            <div className="card-body">
              <div className="summary-section">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Frete ({order.shipping_method})</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Desconto</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total pago</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                <div className="summary-footer">
                  <span>Método de pagamento: <strong>{order.payment_method}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-header">
              <h3>Linha do Tempo</h3>
            </div>
            <div className="card-body">
              <div className="timeline">
                {order.history?.map((event, i) => (
                  <div className="timeline-item" key={event.id}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h4>{event.description}</h4>
                      <span className="timeline-date">{formatDate(event.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="order-sidebar">
          <div className="detail-card">
            <div className="card-header">
              <h3>Cliente</h3>
            </div>
            <div className="card-body">
              <div className="info-block">
                <strong>{order.customer?.name}</strong>
                <span>{order.customer?.email}</span>
                <span>{order.customer?.phone}</span>
                <span>CPF/CNPJ: {order.customer?.document}</span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-header">
              <h3>Endereço de Entrega</h3>
            </div>
            <div className="card-body">
              <div className="info-block">
                <span>{order.customer?.address}, {order.customer?.number} {order.customer?.complement && `- ${order.customer.complement}`}</span>
                <span>{order.customer?.neighborhood}</span>
                <span>{order.customer?.city} - {order.customer?.state}</span>
                <span>CEP: {order.customer?.zip_code}</span>
              </div>
            </div>
          </div>

          {/* Card Fiscal Focus NFe */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Nota Fiscal (Focus NFe)</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Chave da NF-e</label>
                <div className="input-readonly" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  {order.nfe_key || 'Não emitida'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn btn-primary btn-full"
                  disabled={updating}
                  onClick={handleEmitNfe}
                >
                  {updating ? 'Emitindo...' : '⚡ Emitir NF-e'}
                </button>
                {order.nfe_pdf_url && (
                  <a
                    href={order.nfe_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    DANFE
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Card Logística Melhor Envio */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Logística & Melhor Envio</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Método de Envio</label>
                <div className="input-readonly">{order.shipping_method || 'Não definido'}</div>
              </div>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Código de Rastreamento</label>
                <input 
                  type="text" 
                  placeholder="Ex: BR123456789BR"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn btn-primary btn-full"
                  disabled={updating}
                  onClick={handleGenerateShippingLabel}
                >
                  📦 Gerar Etiqueta (Melhor Envio)
                </button>
                <button
                  className="btn btn-secondary btn-full"
                  disabled={updating}
                  onClick={handleSaveTracking}
                >
                  {updating ? 'Salvando...' : 'Salvar Rastreio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
