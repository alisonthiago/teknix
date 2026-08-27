import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order } from '../types/database'
import { ShoppingBag } from 'lucide-react'
import './OrdersList.css'

export default function OrdersList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data)
      } else {
        console.warn('Erro ao buscar pedidos no banco:', error?.message)
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
    }).format(price)
  }

  function formatDate(iso: string) {
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

  const tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Aguardando pagamento' },
    { id: 'paid', label: 'Pagamento aprovado' },
    { id: 'preparing', label: 'Preparando' },
    { id: 'shipped', label: 'Enviado' },
    { id: 'delivered', label: 'Entregue' },
    { id: 'cancelled', label: 'Cancelado' }
  ]

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.order_number.toLowerCase().includes(search.toLowerCase()) || 
      (o.customer?.name && o.customer.name.toLowerCase().includes(search.toLowerCase()))
    
    const matchesTab = activeTab === 'all' || o.status === activeTab

    return matchesSearch && matchesTab
  })

  function getStatusLabel(status: string) {
    switch(status) {
      case 'pending': return 'Pendente'
      case 'paid': return 'Aprovado'
      case 'preparing': return 'Preparando'
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Entregue'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      default: return status
    }
  }

  function getStatusBadgeClass(status: string) {
    switch(status) {
      case 'pending': return 'badge-warning'
      case 'paid': return 'badge-success'
      case 'preparing': return 'badge-info'
      case 'shipped': return 'badge-primary'
      case 'delivered': return 'badge-success'
      case 'cancelled': return 'badge-danger'
      case 'refunded': return 'badge-danger'
      default: return 'badge-neutral'
    }
  }

  return (
    <div className="orders-list-page">
      <div className="page-header">
        <div className="header-info">
          <h1>Pedidos</h1>
          <p>Acompanhe e gerencie as vendas e envios da loja.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">Exportar</button>
        </div>
      </div>

      <div className="orders-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
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
            placeholder="Buscar por número do pedido ou cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selectedOrders.length > 0 && (
          <div className="selection-info">
            {selectedOrders.length} selecionado{selectedOrders.length !== 1 ? 's' : ''}
            <button className="btn-text" onClick={() => setSelectedOrders([])}>
              Limpar seleção
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state" style={{ background: '#ffffff', padding: '60px 20px', borderRadius: 14, border: '1px solid #e5e5e7', textAlign: 'center' }}>
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <ShoppingBag size={36} color="#86868b" />
          </div>
          <h3 style={{ margin: '0 0 4px 0', color: '#1d1d1f', fontSize: '1.05rem', fontWeight: 600 }}>Nenhum pedido encontrado</h3>
          <p style={{ color: '#86868b', margin: 0, fontSize: '0.85rem' }}>Não há pedidos com este filtro no momento.</p>
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
                <th>Total</th>
                <th>Status</th>
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
                  <td className="col-bold">{order.order_number}</td>
                  <td className="col-muted">{formatDate(order.created_at || '')}</td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar">{order.customer?.name.charAt(0)}</div>
                      <span>{order.customer?.name}</span>
                    </div>
                  </td>
                  <td className="col-bold">{formatPrice(order.total)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
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
