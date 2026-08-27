import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Customer } from '../types/database'
import './CustomersList.css'

// Extended interface for the list view metrics
interface CustomerWithMetrics extends Customer {
  total_spent?: number
  orders_count?: number
  last_order_date?: string
}

export default function CustomersList() {
  const [customers, setCustomers] = useState<CustomerWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      // Mock data
      setCustomers([
        {
          id: '1',
          name: 'João Silva',
          email: 'joao.silva@email.com',
          phone: '(11) 98765-4321',
          document: '111.222.333-44',
          city: 'São Paulo',
          state: 'SP',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          total_spent: 2450.00,
          orders_count: 3,
          last_order_date: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Maria Oliveira',
          email: 'maria.oliveira@email.com',
          phone: '(21) 99999-8888',
          document: '555.666.777-88',
          city: 'Rio de Janeiro',
          state: 'RJ',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
          total_spent: 750.00,
          orders_count: 1,
          last_order_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
        },
        {
          id: '3',
          name: 'Carlos Santos',
          email: 'carlos.santos@email.com',
          phone: '(31) 97777-6666',
          document: '999.888.777-66',
          city: 'Belo Horizonte',
          state: 'MG',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          total_spent: 0,
          orders_count: 0,
          last_order_date: undefined
        }
      ])
    } else {
      setCustomers(data as CustomerWithMetrics[])
    }
    setLoading(false)
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
  }

  function formatDate(iso?: string) {
    if (!iso) return '-'
    const d = new Date(iso)
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.document && c.document.includes(searchTerm))
  )

  return (
    <div className="customers-list-page">
      <div className="page-header">
        <div className="header-info">
          <h1>Clientes</h1>
          <p>Gerencie sua carteira de clientes e histórico de compras</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">Exportar (CSV)</button>
          <button className="btn btn-primary">Adicionar Cliente</button>
        </div>
      </div>

      <div className="list-filters">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou CPF..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <table className="data-table interactive-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Localidade</th>
                <th>Pedidos</th>
                <th>Total Gasto (LTV)</th>
                <th>Última Compra</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} onClick={() => navigate(`/hub/clientes/${customer.id}`)}>
                  <td>
                    <div className="customer-info">
                      <div className="customer-avatar">{customer.name.charAt(0).toUpperCase()}</div>
                      <div className="customer-name-group">
                        <strong>{customer.name}</strong>
                        <span>CPF/CNPJ: {customer.document || 'Não informado'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <span>{customer.email}</span>
                      <span>{customer.phone}</span>
                    </div>
                  </td>
                  <td>
                    {customer.city && customer.state ? `${customer.city} - ${customer.state}` : '-'}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{customer.orders_count || 0}</span>
                  </td>
                  <td>
                    <strong>{formatPrice(customer.total_spent || 0)}</strong>
                  </td>
                  <td>
                    {formatDate(customer.last_order_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
