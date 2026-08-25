import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getCustomerByUserId, getOrdersByUserId, getAddressesByUserId, type Customer, type Order, type Address } from '../services/customer'
import './Account.css'

type Tab = 'overview' | 'orders' | 'addresses' | 'settings'

export default function Account() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadData()
  }, [user])

  async function loadData() {
    if (!user) return

    const [customerData, ordersData, addressesData] = await Promise.all([
      getCustomerByUserId(user.id),
      getOrdersByUserId(user.id),
      getAddressesByUserId(user.id)
    ])

    setCustomer(customerData)
    setOrders(ordersData)
    setAddresses(addressesData)
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  function getStatusLabel(status: string) {
    const statuses: Record<string, string> = {
      'pending': 'Aguardando pagamento',
      'paid': 'Pago',
      'preparing': 'Preparando envio',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    }
    return statuses[status] || status
  }

  function getStatusClass(status: string) {
    const classes: Record<string, string> = {
      'pending': 'status-pending',
      'paid': 'status-paid',
      'preparing': 'status-preparing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    }
    return classes[status] || ''
  }

  if (loading) {
    return (
      <div className="account-page">
        <div className="account-loading">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="account-page">
      <div className="account-container">
        <aside className="account-sidebar">
          <div className="account-user">
            <div className="user-avatar">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{customer?.name || user?.email}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>

          <nav className="account-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Visão geral
            </button>
            <button
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Meus pedidos
            </button>
            <button
              className={`nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Endereços
            </button>
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Configurações
            </button>
            <button className="nav-item nav-item-danger" onClick={handleSignOut}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </nav>
        </aside>

        <main className="account-main">
          {activeTab === 'overview' && (
            <div className="account-overview">
              <h2>Olá, {customer?.name || user?.email?.split('@')[0]}</h2>
              <p className="overview-subtitle">Bem-vindo à sua conta Teknix</p>

              <div className="overview-stats">
                <div className="stat-card">
                  <span className="stat-value">{orders.length}</span>
                  <span className="stat-label">Pedidos</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{addresses.length}</span>
                  <span className="stat-label">Endereços</span>
                </div>
              </div>

              {orders.length > 0 && (
                <div className="overview-recent">
                  <h3>Último pedido</h3>
                  <div className="order-card">
                    <div className="order-header">
                      <span className="order-id">#{orders[0].id.slice(0, 8)}</span>
                      <span className={`order-status ${getStatusClass(orders[0].status)}`}>
                        {getStatusLabel(orders[0].status)}
                      </span>
                    </div>
                    <div className="order-details">
                      <span>{formatDate(orders[0].created_at)}</span>
                      <span className="order-total">{formatPrice(orders[0].total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="account-orders">
              <h2>Meus pedidos</h2>

              {orders.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="48" height="48">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  <p>Nenhum pedido encontrado</p>
                  <Link to="/produtos" className="btn btn-primary">
                    Ver produtos
                  </Link>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <span className="order-id">#{order.id.slice(0, 8)}</span>
                        <span className={`order-status ${getStatusClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="order-details">
                        <span>{formatDate(order.created_at)}</span>
                        <span className="order-total">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="account-addresses">
              <div className="section-header-row">
                <h2>Endereços</h2>
              </div>

              {addresses.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="48" height="48">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <p>Nenhum endereço cadastrado</p>
                </div>
              ) : (
                <div className="addresses-list">
                  {addresses.map(addr => (
                    <div key={addr.id} className="address-card">
                      <div className="address-header">
                        <span className="address-label">{addr.label}</span>
                        {addr.is_default && <span className="address-default">Principal</span>}
                      </div>
                      <p className="address-text">
                        {addr.street}, {addr.number}
                        {addr.complement && ` - ${addr.complement}`}
                        <br />
                        {addr.neighborhood} - {addr.city}/{addr.state}
                        <br />
                        CEP: {addr.zip_code}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="account-settings">
              <h2>Configurações</h2>

              <div className="settings-section">
                <h3>Dados da conta</h3>
                <div className="settings-info">
                  <div className="info-row">
                    <span className="info-label">Nome</span>
                    <span className="info-value">{customer?.name || 'Não informado'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Telefone</span>
                    <span className="info-value">{customer?.phone || 'Não informado'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
