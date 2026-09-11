import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Customer } from '../types/database'
import './CustomerDetails.css'

interface RealCustomerOrder {
  id: string
  order_number: string
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  status: string
  created_at: string
  items: any[]
}

interface CustomerDossier extends Customer {
  cpf?: string
  document?: string
  orders: RealCustomerOrder[]
  metrics: {
    total_spent: number
    orders_count: number
    average_ticket: number
  }
}

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerDossier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomer()
  }, [id])

  async function fetchCustomer() {
    setLoading(true)
    try {
      if (!id) {
        setCustomer(null)
        setLoading(false)
        return
      }

      // 1. Busca cadastro real do cliente
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (custErr || !custData) {
        setCustomer(null)
        setLoading(false)
        return
      }

      // 2. Busca pedidos reais vinculados na loja própria
      const query = custData.email
        ? supabase.from('store_orders').select('*, items:store_order_items(*)').or(`customer_id.eq.${id},customer_email.eq.${custData.email}`).order('created_at', { ascending: false })
        : supabase.from('store_orders').select('*, items:store_order_items(*)').eq('customer_id', id).order('created_at', { ascending: false })

      const { data: ordersData } = await query
      const ordersList = (ordersData || []) as any[]

      // 3. Cálculos de métricas financeiras reais
      const paidOrders = ordersList.filter(o =>
        ['paid', 'approved', 'preparing', 'shipped', 'delivered'].includes((o.status || '').toLowerCase())
      )
      const totalSpent = paidOrders.reduce((acc, o) => acc + Number(o.total || 0), 0)
      const averageTicket = paidOrders.length > 0 ? totalSpent / paidOrders.length : 0

      setCustomer({
        ...custData,
        document: custData.cpf || custData.document || '',
        metrics: {
          total_spent: totalSpent > 0 ? totalSpent : Number(custData.total_spent || 0),
          orders_count: ordersList.length,
          average_ticket: averageTicket
        },
        orders: ordersList.map(o => ({
          id: o.id,
          order_number: o.order_number,
          subtotal: Number(o.subtotal || 0),
          shipping_cost: Number(o.shipping_cost || 0),
          discount: Number(o.discount || 0),
          total: Number(o.total || 0),
          status: o.status || 'pending',
          created_at: o.created_at,
          items: o.items || []
        }))
      })
    } catch (err) {
      console.error('[CustomerDetails] Erro ao carregar dossiê:', err)
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price || 0)
  }

  function formatDate(iso: string) {
    if (!iso) return '—'
    const d = new Date(iso)
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  }

  function getStatusBadge(status: string) {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      paid: 'badge-success',
      approved: 'badge-success',
      preparing: 'badge-primary',
      shipped: 'badge-primary',
      delivered: 'badge-success',
      cancelled: 'badge-danger',
      refunded: 'badge-danger'
    }
    const labels: Record<string, string> = {
      pending: 'Aguardando',
      paid: 'Pago',
      approved: 'Aprovado',
      preparing: 'Preparando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado'
    }

    return (
      <span className={`badge ${classes[status] || 'badge-neutral'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Carregando dados reais do cliente...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="customer-details-page">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <h2>Cliente não encontrado</h2>
          <p style={{ marginTop: 8 }}>O registro solicitado não existe no banco de dados.</p>
          <Link to="/hub/clientes" className="btn btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>
            ← Voltar para Clientes
          </Link>
        </div>
      </div>
    )
  }

  const cleanPhone = (customer.phone || '').replace(/\D/g, '')
  const whatsappLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : '#'

  return (
    <div className="customer-details-page">
      <div className="page-header">
        <div className="header-info">
          <Link to="/hub/clientes" className="back-link">← Voltar para clientes</Link>
          <div className="customer-title-group">
            <div className="customer-avatar-large">{customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}</div>
            <div className="customer-title-text">
              <h2>{customer.name}</h2>
              <span className="customer-since">Cliente desde {formatDate(customer.created_at || '')}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {cleanPhone && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Mensagem WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="metrics-row">
        <div className="metric-card">
          <span className="metric-title">Total Gasto (LTV)</span>
          <span className="metric-value">{formatPrice(customer.metrics.total_spent)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Total de Pedidos</span>
          <span className="metric-value">{customer.metrics.orders_count}</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Ticket Médio</span>
          <span className="metric-value">{formatPrice(customer.metrics.average_ticket)}</span>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="customer-content-grid">
        {/* LEFT: INFO CARD */}
        <div className="card customer-info-card">
          <h3>Dados Cadastrais</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">E-mail</span>
              <span className="info-value">{customer.email || 'Não informado'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Telefone</span>
              <span className="info-value">{customer.phone || 'Não informado'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">CPF / CNPJ</span>
              <span className="info-value">{customer.cpf || customer.document || 'Não informado'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Endereço</span>
              <span className="info-value">
                {customer.address ? `${customer.address}${customer.city ? `, ${customer.city}` : ''}${customer.state ? ` - ${customer.state}` : ''}` : 'Não cadastrado'}
              </span>
            </div>
            {customer.zip_code && (
              <div className="info-item">
                <span className="info-label">CEP</span>
                <span className="info-value">{customer.zip_code}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ORDERS LIST */}
        <div className="card customer-orders-card">
          <div className="card-header-flex">
            <h3>Histórico de Pedidos ({customer.orders.length})</h3>
          </div>

          {customer.orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#888' }}>
              <p>Nenhum pedido vinculado a este cliente até o momento.</p>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map(order => (
                    <tr key={order.id} onClick={() => navigate(`/hub/pedidos/${order.id}`)} style={{ cursor: 'pointer' }}>
                      <td><strong>{order.order_number}</strong></td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>{order.items?.length || 0} produto(s)</td>
                      <td><strong>{formatPrice(order.total)}</strong></td>
                      <td>{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
