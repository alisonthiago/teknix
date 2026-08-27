import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Customer, Order } from '../types/database'
import './CustomerDetails.css'

interface CustomerDossier extends Customer {
  orders: Order[]
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
    
    // In a real app we'd fetch customer + orders in parallel
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      // Mock data representing a Customer Dossier
      setCustomer({
        id: id || '1',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 98765-4321',
        document: '111.222.333-44',
        address: 'Rua das Flores',
        number: '123',
        complement: 'Apto 42',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01000-000',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        metrics: {
          total_spent: 2450.00,
          orders_count: 3,
          average_ticket: 816.66
        },
        orders: [
          {
            id: 'o1',
            order_number: '#TK-1045',
            subtotal: 1545.00,
            shipping_cost: 0,
            discount: 0,
            total: 1545.00,
            status: 'delivered',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            items: []
          } as Order,
          {
            id: 'o2',
            order_number: '#TK-0921',
            subtotal: 450.00,
            shipping_cost: 0,
            discount: 0,
            total: 450.00,
            status: 'delivered',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
            items: []
          } as Order,
          {
            id: 'o3',
            order_number: '#TK-0800',
            subtotal: 455.00,
            shipping_cost: 0,
            discount: 0,
            total: 455.00,
            status: 'delivered',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
            items: []
          } as Order
        ]
      })
    }
    
    setLoading(false)
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  }

  function getStatusBadge(status: string) {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      paid: 'badge-success',
      preparing: 'badge-primary',
      shipped: 'badge-primary',
      delivered: 'badge-success',
      cancelled: 'badge-danger',
      refunded: 'badge-danger'
    }
    const labels: Record<string, string> = {
      pending: 'Aguardando',
      paid: 'Pago',
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
        <p>Carregando dossiê...</p>
      </div>
    )
  }

  if (!customer) return <div className="empty-state">Cliente não encontrado.</div>

  const whatsappLink = `https://wa.me/55${customer.phone?.replace(/\D/g, '')}`

  return (
    <div className="customer-details-page">
      <div className="page-header">
        <div className="header-info">
          <Link to="/hub/clientes" className="back-link">← Voltar para clientes</Link>
          <div className="customer-title-group">
            <div className="customer-avatar-large">{customer.name.charAt(0).toUpperCase()}</div>
            <div className="customer-title-text">
              <h2>{customer.name}</h2>
              <span className="customer-since">Cliente desde {formatDate(customer.created_at || '')}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">Editar Perfil</button>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Mensagem
          </a>
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

      <div className="customer-grid">
        <div className="customer-main">
          {/* ORDER HISTORY */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Histórico de Compras ({customer.orders.length})</h3>
            </div>
            <div className="card-body no-padding">
              <table className="items-table interactive-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th align="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map(order => (
                    <tr key={order.id} onClick={() => navigate(`/hub/pedidos/${order.id}`)}>
                      <td><strong>{order.order_number}</strong></td>
                      <td>{formatDate(order.created_at || '')}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td align="right"><strong>{formatPrice(order.total)}</strong></td>
                    </tr>
                  ))}
                  {customer.orders.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>
                        Nenhum pedido encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="customer-sidebar">
          <div className="detail-card">
            <div className="card-header">
              <h3>Dados de Contato</h3>
            </div>
            <div className="card-body">
              <div className="info-block">
                <span><strong>Email:</strong> {customer.email}</span>
                <span><strong>Telefone:</strong> {customer.phone}</span>
                <span><strong>CPF/CNPJ:</strong> {customer.document}</span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-header">
              <h3>Endereço Principal</h3>
            </div>
            <div className="card-body">
              <div className="info-block">
                <span>{customer.address}, {customer.number} {customer.complement && `- ${customer.complement}`}</span>
                <span>{customer.neighborhood}</span>
                <span>{customer.city} - {customer.state}</span>
                <span>CEP: {customer.zip_code}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
