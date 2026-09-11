import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, ShoppingBag, TrendingUp, CreditCard, CheckCircle2, Clock, Inbox } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './FinanceOverview.css'

interface StoreOrderRow {
  id: string
  order_number: string
  customer_name: string | null
  total: number
  status: string
  payment_method: string | null
  payment_status: string | null
  created_at: string
}

export default function FinanceOverview() {
  const [orders, setOrders] = useState<StoreOrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFinances()
  }, [])

  async function loadFinances() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('id, order_number, customer_name, total, status, payment_method, payment_status, created_at')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data as StoreOrderRow[])
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error('[FinanceOverview] Erro ao carregar dados financeiros:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Pedidos com receita aprovada
  const approvedOrders = orders.filter(o =>
    ['paid', 'approved', 'preparing', 'shipped', 'delivered'].includes((o.status || '').toLowerCase())
  )
  const pendingOrders = orders.filter(o => (o.status || '').toLowerCase() === 'pending')

  const totalRevenue = approvedOrders.reduce((acc, order) => acc + Number(order.total || 0), 0)
  const averageTicket = approvedOrders.length > 0 ? totalRevenue / approvedOrders.length : 0
  const approvedCount = approvedOrders.length
  const recentOrders = orders.slice(0, 10)

  return (
    <div className="finance-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="header-info">
          <h1>Financeiro</h1>
          <p>Acompanhe o faturamento, ticket médio e transações reais da loja.</p>
        </div>
        <div className="header-actions">
          <Link to="/hub/pagamentos" className="btn btn-secondary btn-action-primary">
            <CreditCard size={14} /> Configurar Gateway
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="finance-kpis-grid">
        <div className="finance-kpi-card">
          <div className="finance-kpi-header">
            <span className="finance-kpi-label">Faturamento Total</span>
            <div className="finance-kpi-icon">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="finance-kpi-val">
            <span className="finance-kpi-curr">R$</span> {fmtBRL(totalRevenue)}
          </div>
          <p className="finance-kpi-sub">Receita acumulada de vendas pagas</p>
        </div>

        <div className="finance-kpi-card">
          <div className="finance-kpi-header">
            <span className="finance-kpi-label">Ticket Médio</span>
            <div className="finance-kpi-icon">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="finance-kpi-val">
            <span className="finance-kpi-curr">R$</span> {fmtBRL(averageTicket)}
          </div>
          <p className="finance-kpi-sub">Média por pedido aprovado</p>
        </div>

        <div className="finance-kpi-card">
          <div className="finance-kpi-header">
            <span className="finance-kpi-label">Vendas Aprovadas</span>
            <div className="finance-kpi-icon">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="finance-kpi-val">
            {approvedCount}
          </div>
          <p className="finance-kpi-sub">{pendingOrders.length} aguardando pagamento</p>
        </div>
      </div>

      {/* ── Transactions Card ── */}
      <div className="finance-table-card">
        <div className="finance-table-card-header">
          <div>
            <h2>Transações Recentes</h2>
            <p>Histórico das últimas movimentações de pedidos</p>
          </div>
          <Link to="/hub/pedidos" className="finance-see-all">
            Ver todos os pedidos →
          </Link>
        </div>

        <div className="finance-table-wrap">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Método</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map(order => {
                  const isPaid = ['paid', 'approved', 'preparing', 'shipped', 'delivered'].includes((order.status || '').toLowerCase())
                  return (
                    <tr key={order.id}>
                      <td style={{ color: '#888888', fontSize: 12 }}>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td>
                        <Link to={`/hub/pedidos/${order.id}`} className="finance-order-link">
                          {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 600, color: '#333333' }}>
                        {order.customer_name || 'Cliente'}
                      </td>
                      <td style={{ color: '#666666', fontSize: 12 }}>
                        {order.payment_method || 'Mercado Pago'}
                      </td>
                      <td className="finance-amount-col">
                        R$ {fmtBRL(order.total || 0)}
                      </td>
                      <td>
                        {isPaid ? (
                          <span className="finance-badge-success">
                            <CheckCircle2 size={11} /> Aprovado
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#fffbeb', color: '#b45309' }}>
                            <Clock size={11} /> Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#888888' }}>
                    <Inbox size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 500, color: '#333333' }}>Nenhuma transação registrada</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>As vendas do SITE e checkout aparecerão aqui em tempo real.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
