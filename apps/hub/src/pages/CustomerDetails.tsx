import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, User, Mail, Phone, MapPin, CreditCard, ShoppingBag, MessageCircle, DollarSign, ArrowUpRight } from 'lucide-react'
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
      preparing: 'badge-info',
      shipped: 'badge-info',
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
      <span className={`cd-badge ${classes[status] || 'badge-neutral'}`}>
        <span className="cd-badge-dot" />
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="customer-details-page">
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <p>Carregando dados do cliente...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="customer-details-page">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <h2>Cliente não encontrado</h2>
          <p style={{ marginTop: 8 }}>O registro solicitado não existe no banco de dados.</p>
          <Link to="/hub/clientes" className="hub-btn hub-btn-secondary" style={{ marginTop: 16, display: 'inline-flex' }}>
            <ChevronLeft size={16} /> Voltar para Clientes
          </Link>
        </div>
      </div>
    )
  }

  const cleanPhone = (customer.phone || '').replace(/\D/g, '')
  const whatsappLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : '#'

  return (
    <div className="customer-details-page">
      {/* Top Header */}
      <div className="cd-header-row">
        <div className="cd-header-left">
          <Link to="/hub/clientes" className="cd-back-btn">
            <ChevronLeft size={16} />
            <span>Clientes</span>
          </Link>
          <div className="cd-profile-summary">
            <div className="cd-avatar">
              {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="cd-profile-info">
              <div className="cd-name-row">
                <h1>{customer.name}</h1>
                <span className="cd-since-tag">Cliente desde {formatDate(customer.created_at || '')}</span>
              </div>
              <span className="cd-email-sub">{customer.email || 'E-mail não informado'}</span>
            </div>
          </div>
        </div>

        <div className="cd-header-actions">
          {cleanPhone && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="cd-btn-whatsapp">
              <MessageCircle size={15} />
              <span>Conversar no WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="cd-kpi-grid">
        <div className="cd-kpi-card">
          <div className="cd-kpi-top">
            <span className="cd-kpi-title">Total Gasto (LTV)</span>
            <div className="cd-kpi-icon"><DollarSign size={15} /></div>
          </div>
          <div className="cd-kpi-value">{formatPrice(customer.metrics.total_spent)}</div>
          <span className="cd-kpi-sub">Receita aprovada deste cliente</span>
        </div>

        <div className="cd-kpi-card">
          <div className="cd-kpi-top">
            <span className="cd-kpi-title">Total de Pedidos</span>
            <div className="cd-kpi-icon"><ShoppingBag size={15} /></div>
          </div>
          <div className="cd-kpi-value">{customer.metrics.orders_count}</div>
          <span className="cd-kpi-sub">Pedidos efetuados na loja</span>
        </div>

        <div className="cd-kpi-card">
          <div className="cd-kpi-top">
            <span className="cd-kpi-title">Ticket Médio</span>
            <div className="cd-kpi-icon"><CreditCard size={15} /></div>
          </div>
          <div className="cd-kpi-value">{formatPrice(customer.metrics.average_ticket)}</div>
          <span className="cd-kpi-sub">Valor médio por compra paga</span>
        </div>
      </div>

      {/* 2-Column Content Grid */}
      <div className="cd-main-grid">
        {/* Left: Customer Info Card */}
        <div className="cd-card">
          <div className="cd-card-header">
            <User size={16} className="cd-card-icon" />
            <h3>Dados Cadastrais</h3>
          </div>

          <div className="cd-info-list">
            <div className="cd-info-row">
              <span className="cd-info-label">
                <Mail size={13} /> E-mail
              </span>
              <span className="cd-info-value">{customer.email || 'Não informado'}</span>
            </div>

            <div className="cd-info-row">
              <span className="cd-info-label">
                <Phone size={13} /> Telefone
              </span>
              <span className="cd-info-value">{customer.phone || 'Não informado'}</span>
            </div>

            <div className="cd-info-row">
              <span className="cd-info-label">
                <CreditCard size={13} /> CPF / CNPJ
              </span>
              <span className="cd-info-value font-mono">{customer.cpf || customer.document || 'Não informado'}</span>
            </div>

            <div className="cd-info-row">
              <span className="cd-info-label">
                <MapPin size={13} /> Endereço
              </span>
              <span className="cd-info-value">
                {customer.address ? `${customer.address}${customer.city ? `, ${customer.city}` : ''}${customer.state ? ` - ${customer.state}` : ''}` : 'Não cadastrado'}
              </span>
            </div>

            {customer.zip_code && (
              <div className="cd-info-row">
                <span className="cd-info-label">CEP</span>
                <span className="cd-info-value font-mono">{customer.zip_code}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Orders History */}
        <div className="cd-card">
          <div className="cd-card-header">
            <ShoppingBag size={16} className="cd-card-icon" />
            <h3>Histórico de Pedidos ({customer.orders.length})</h3>
          </div>

          {customer.orders.length === 0 ? (
            <div className="cd-empty-orders">
              <p>Nenhum pedido vinculado a este cliente até o momento.</p>
            </div>
          ) : (
            <div className="cd-table-wrap">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map(order => (
                    <tr key={order.id} onClick={() => navigate(`/hub/pedidos/${order.id}`)}>
                      <td>
                        <strong className="cd-order-num">{order.order_number}</strong>
                      </td>
                      <td className="cd-order-date">{formatDate(order.created_at)}</td>
                      <td>{order.items?.length || 0} item(ns)</td>
                      <td>
                        <strong className="cd-order-total">{formatPrice(order.total)}</strong>
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td style={{ textAlign: 'right', color: '#94a3b8' }}>
                        <ArrowUpRight size={15} />
                      </td>
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
