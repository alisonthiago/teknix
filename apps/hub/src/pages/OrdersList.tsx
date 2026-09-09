import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingBag, RefreshCw } from 'lucide-react'
import './OrdersList.css'

// Tipagem para store_orders (loja própria TEKNIX — separado do FLOW)
interface StoreOrder {
  id: string
  order_number: string
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
  created_at: string
  updated_at: string
}

export default function OrdersList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data as StoreOrder[])
      } else {
        console.warn('Erro ao buscar pedidos da loja:', error?.message)
        setOrders([])
      }
    } catch (err) {
      console.error('Erro na requisição de pedidos:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0)
  }

  function formatDate(iso: string) {
    if (!iso) return '—'
    const d = new Date(iso)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d)
  }

  function toggleSelectAll() {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(p => p.id))
    }
  }

  function toggleSelect(id: string) {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(p => p !== id))
    } else {
      setSelectedOrders([...selectedOrders, id])
    }
  }

  const statusTabs = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Aguardando pagamento' },
    { id: 'paid', label: 'Pagamento aprovado' },
    { id: 'preparing', label: 'Preparando' },
    { id: 'shipped', label: 'Enviado' },
    { id: 'delivered', label: 'Entregue' },
    { id: 'cancelled', label: 'Cancelado' }
  ]

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase()
    const matchesSearch =
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.customer_document || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))

    const matchesTab = activeTab === 'all' || o.status === activeTab
    const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter

    return matchesSearch && matchesTab && matchesPayment
  })

  function getOrderStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'paid': return 'Aprovado'
      case 'processing': return 'Em análise'
      case 'preparing': return 'Preparando'
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
      case 'refunded': return 'badge-danger'
      default: return 'badge-neutral'
    }
  }

  function getPaymentStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Aguardando'
      case 'approved': return 'Aprovado'
      case 'rejected': return 'Recusado'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      case 'in_process': return 'Em análise'
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

  function getPaymentMethodShort(method: string | null) {
    if (!method) return '—'
    if (method.toLowerCase().includes('pix')) return 'Pix'
    if (method.toLowerCase().includes('cartão') || method.toLowerCase().includes('cartao') || method.toLowerCase().includes('card')) return 'Cartão'
    if (method.toLowerCase().includes('boleto')) return 'Boleto'
    return method
  }

  const totalRevenue = filteredOrders
    .filter(o => o.payment_status === 'approved')
    .reduce((s, o) => s + (o.total || 0), 0)

  return (
    <div className="orders-list-page">
      <div className="page-header">
        <div className="header-info">
          <h1>Pedidos da Loja</h1>
          <p>Gerencie todos os pedidos da Loja Própria TEKNIX (separado do FLOW de marketplaces).</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-action-primary" onClick={fetchOrders} title="Atualizar">
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e7', borderRadius: 12, padding: '14px 20px', flex: '1 1 160px' }}>
          <div style={{ fontSize: 12, color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total de Pedidos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', marginTop: 4 }}>{orders.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e7', borderRadius: 12, padding: '14px 20px', flex: '1 1 160px' }}>
          <div style={{ fontSize: 12, color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aprovados</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1d7e40', marginTop: 4 }}>
            {orders.filter(o => o.payment_status === 'approved').length}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e7', borderRadius: 12, padding: '14px 20px', flex: '1 1 160px' }}>
          <div style={{ fontSize: 12, color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aguardando</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#856404', marginTop: 4 }}>
            {orders.filter(o => o.payment_status === 'pending').length}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e7', borderRadius: 12, padding: '14px 20px', flex: '1 1 200px' }}>
          <div style={{ fontSize: 12, color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Receita Aprovada ({filteredOrders.filter(o => o.payment_status === 'approved').length} pedidos)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1d7e40', marginTop: 4 }}>{formatPrice(totalRevenue)}</div>
        </div>
      </div>

      <div className="orders-tabs">
        {statusTabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span style={{ marginLeft: 6, fontSize: 11, background: activeTab === tab.id ? '#1f2328' : '#f0f0f0', color: activeTab === tab.id ? '#fff' : '#666', borderRadius: 100, padding: '1px 6px' }}>
                {orders.filter(o => o.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="orders-toolbar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por número, cliente, e-mail ou CPF"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">Todos os pagamentos</option>
            <option value="pending">Aguardando</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Recusado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          {selectedOrders.length > 0 && (
            <div className="selection-info">
              {selectedOrders.length} selecionado{selectedOrders.length !== 1 ? 's' : ''}
              <button className="btn-text" onClick={() => setSelectedOrders([])}>
                Limpar seleção
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando pedidos da loja...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state" style={{ background: '#ffffff', padding: '60px 20px', borderRadius: 14, border: '1px solid #e5e5e7', textAlign: 'center' }}>
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <ShoppingBag size={36} color="#86868b" />
          </div>
          <h3 style={{ margin: '0 0 4px 0', color: '#1d1d1f', fontSize: '1.05rem', fontWeight: 600 }}>Nenhum pedido encontrado</h3>
          <p style={{ color: '#86868b', margin: 0, fontSize: '0.85rem' }}>
            {search ? `Nenhum resultado para "${search}"` : 'Não há pedidos com este filtro no momento.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Pedido</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th>Status Pedido</th>
                <th>Status Pag.</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr
                  key={order.id}
                  className={selectedOrders.includes(order.id) ? 'selected clickable-row' : 'clickable-row'}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                      navigate(`/hub/pedidos/${order.id}`)
                    }
                  }}
                >
                  <td className="col-check" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1d1d1f', fontSize: 13 }}>{order.order_number}</div>
                    {order.payment_id && (
                      <div style={{ fontSize: 10, color: '#86868b', marginTop: 2, fontFamily: 'monospace' }}>
                        MP: {order.payment_id.slice(0, 12)}…
                      </div>
                    )}
                  </td>
                  <td className="col-muted">{formatDate(order.created_at)}</td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar" style={{ background: stringToColor(order.customer_name || '?'), color: '#fff' }}>
                        {(order.customer_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1d1d1f' }}>{order.customer_name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#86868b' }}>{order.customer_email || ''}</div>
                        {order.customer_document && (
                          <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>
                            CPF/CNPJ: {formatDoc(order.customer_document)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>
                      {getPaymentMethodShort(order.payment_method)}
                    </span>
                  </td>
                  <td className="col-bold">{formatPrice(order.total)}</td>
                  <td>
                    <span className={`status-badge ${getOrderStatusBadge(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getPaymentStatusBadge(order.payment_status)}`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatDoc(doc: string): string {
  const d = doc.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const palette = ['#4a6fa5', '#6b8f71', '#c07a4a', '#8b5e83', '#5e8fa5', '#a55e6b', '#6e8b5e']
  return palette[Math.abs(hash) % palette.length]
}
