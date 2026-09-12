import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { RefreshCw, Eye, Trash2, ShoppingBag, DollarSign, CheckCircle2, Clock } from 'lucide-react'
import { HubDataTable, type HubColumn, useBulkDelete } from '../components/ui/HubDataTable'
import type { SortOption } from '../components/ui/HubDataTable'
import '../components/ui/HubDataTable/HubKpi.css'

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

const STATUS_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Aguardando' },
  { id: 'paid', label: 'Aprovado' },
  { id: 'preparing', label: 'Preparando' },
  { id: 'shipped', label: 'Enviado' },
  { id: 'delivered', label: 'Entregue' },
  { id: 'cancelled', label: 'Cancelado' },
]

const SORT_OPTIONS: SortOption[] = [
  { label: 'Mais novo', value: 'newest' },
  { label: 'Mais antigo', value: 'oldest' },
  { label: 'Maior valor', value: 'total_desc' },
  { label: 'Menor valor', value: 'total_asc' },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price || 0)
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

function getOrderStatusConfig(status: string): { label: string; variant: string } {
  switch (status) {
    case 'pending':    return { label: 'Pendente',    variant: 'hub-badge-yellow' }
    case 'paid':       return { label: 'Aprovado',    variant: 'hub-badge-green'  }
    case 'processing': return { label: 'Em análise',  variant: 'hub-badge-blue'   }
    case 'preparing':  return { label: 'Preparando',  variant: 'hub-badge-blue'   }
    case 'shipped':    return { label: 'Enviado',     variant: 'hub-badge-purple' }
    case 'delivered':  return { label: 'Entregue',    variant: 'hub-badge-green'  }
    case 'cancelled':  return { label: 'Cancelado',   variant: 'hub-badge-red'    }
    case 'refunded':   return { label: 'Reembolsado', variant: 'hub-badge-red'    }
    default:           return { label: status || '—', variant: 'hub-badge-gray'   }
  }
}

function getPaymentStatusConfig(status: string): { label: string; variant: string } {
  switch (status) {
    case 'pending':    return { label: 'Aguardando', variant: 'hub-badge-yellow' }
    case 'approved':   return { label: 'Aprovado',   variant: 'hub-badge-green'  }
    case 'rejected':   return { label: 'Recusado',   variant: 'hub-badge-red'    }
    case 'cancelled':  return { label: 'Cancelado',  variant: 'hub-badge-red'    }
    case 'refunded':   return { label: 'Reembolsado',variant: 'hub-badge-gray'   }
    case 'in_process': return { label: 'Em análise', variant: 'hub-badge-blue'   }
    default:           return { label: status || '—',variant: 'hub-badge-gray'   }
  }
}

function getPaymentMethodShort(method: string | null) {
  if (!method) return '—'
  if (method.toLowerCase().includes('pix')) return 'Pix'
  if (method.toLowerCase().includes('cartão') || method.toLowerCase().includes('card')) return 'Cartão'
  if (method.toLowerCase().includes('boleto')) return 'Boleto'
  return method
}

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const palette = ['#4a6fa5', '#6b8f71', '#c07a4a', '#8b5e83', '#5e8fa5', '#a55e6b', '#6e8b5e']
  return palette[Math.abs(hash) % palette.length]
}

const COLUMNS: HubColumn<StoreOrder>[] = [
  {
    key: 'order_number',
    label: 'Pedido',
    width: '140px',
    render: (o) => (
      <div>
        <div className="hub-cell-bold">{o.order_number}</div>
        {o.payment_id && (
          <div style={{ fontSize: 11, color: '#9ca3af' }}>MP: {o.payment_id.slice(0, 12)}…</div>
        )}
      </div>
    ),
    exportValue: (o) => o.order_number,
  },
  {
    key: 'created_at',
    label: 'Data',
    width: '140px',
    render: (o) => <span className="hub-cell-muted">{formatDate(o.created_at)}</span>,
    exportValue: (o) => formatDate(o.created_at),
  },
  {
    key: 'customer_name',
    label: 'Cliente',
    render: (o) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: stringToColor(o.customer_name || '?'),
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700
        }}>
          {(o.customer_name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="hub-cell-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
            {o.customer_name || '—'}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{o.customer_email || ''}</div>
        </div>
      </div>
    ),
    exportValue: (o) => `${o.customer_name || ''} <${o.customer_email || ''}>`,
  },
  {
    key: 'payment_method',
    label: 'Pagamento',
    width: '100px',
    render: (o) => <span className="hub-cell-muted">{getPaymentMethodShort(o.payment_method)}</span>,
    exportValue: (o) => getPaymentMethodShort(o.payment_method),
  },
  {
    key: 'total',
    label: 'Total',
    width: '110px',
    align: 'right',
    render: (o) => <span className="hub-cell-bold">{formatPrice(o.total)}</span>,
    exportValue: (o) => formatPrice(o.total),
  },
  {
    key: 'status',
    label: 'Status Pedido',
    width: '130px',
    render: (o) => {
      const cfg = getOrderStatusConfig(o.status)
      return (
        <span className={`hub-status-badge ${cfg.variant}`}>
          <span className="hub-badge-dot" />
          {cfg.label}
        </span>
      )
    },
    exportValue: (o) => getOrderStatusConfig(o.status).label,
  },
  {
    key: 'payment_status',
    label: 'Status Pag.',
    width: '120px',
    render: (o) => {
      const cfg = getPaymentStatusConfig(o.payment_status)
      return (
        <span className={`hub-status-badge ${cfg.variant}`}>
          <span className="hub-badge-dot" />
          {cfg.label}
        </span>
      )
    },
    exportValue: (o) => getPaymentStatusConfig(o.payment_status).label,
  },
]

export default function OrdersList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'all'
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(initialStatus)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam) setActiveTab(statusParam)
  }, [searchParams])

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) setOrders(data as StoreOrder[])
      else setOrders([])
    } catch { setOrders([]) }
    finally { setLoading(false) }
  }

  async function handleDeleteOrders(ids: string[]) {
    try {
      await supabase.from('store_orders').delete().in('id', ids)
      setOrders(prev => prev.filter(o => !ids.includes(o.id)))
    } catch (e) {
      console.error('Erro ao excluir pedidos:', e)
      alert('Erro ao excluir pedidos.')
    }
  }

  const confirmDelete = useBulkDelete(handleDeleteOrders, 'pedido')

  const filteredOrders = orders
    .filter(o => {
      const q = search.toLowerCase()
      const matchSearch =
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_email || '').toLowerCase().includes(q)
      const matchTab = activeTab === 'all' || o.status === activeTab
      const matchPay = paymentFilter === 'all' || o.payment_status === paymentFilter
      return matchSearch && matchTab && matchPay
    })
    .sort((a, b) => {
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'total_desc') return b.total - a.total
      if (sort === 'total_asc') return a.total - b.total
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const totalRevenue = orders
    .filter(o => o.payment_status === 'approved')
    .reduce((s, o) => s + (o.total || 0), 0)

  const activeFilters = [
    activeTab !== 'all' && `Status: ${STATUS_TABS.find(t => t.id === activeTab)?.label}`,
    paymentFilter !== 'all' && `Pagamento: ${paymentFilter}`,
    search && `Busca: "${search}"`,
  ].filter(Boolean).join(', ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div className="hub-kpi-grid">
        {[
          { label: 'Total de Pedidos', value: orders.length, icon: <ShoppingBag size={16} />, sub: 'Todos os pedidos registrados' },
          { label: 'Aprovados', value: orders.filter(o => o.payment_status === 'approved').length, icon: <CheckCircle2 size={16} />, sub: 'Pedidos com pagamento aprovado' },
          { label: 'Aguardando', value: orders.filter(o => o.payment_status === 'pending').length, icon: <Clock size={16} />, sub: 'Aguardando pagamento' },
          { label: 'Receita Aprovada', value: formatPrice(totalRevenue), icon: <DollarSign size={16} />, sub: 'Receita acumulada de vendas pagas', currency: true },
        ].map((s, i) => (
          <div key={i} className="hub-kpi-card">
            <div className="hub-kpi-header"><span className="hub-kpi-label">{s.label}</span><div className="hub-kpi-icon">{s.icon}</div></div>
            <div className="hub-kpi-value">{s.currency && <span className="hub-kpi-currency">R$</span>} {s.currency ? String(s.value).replace(/^R\$\s*/, '') : s.value}</div>
          </div>
        ))}
      </div>

      <HubDataTable
        title="Pedidos da Loja"
        headerActions={
          <>
            <div className="hub-status-tabs">
              {STATUS_TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? '#fff' : 'transparent',
                  color: activeTab === tab.id ? '#111' : '#6b7280',
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit'
                }}>
                  {tab.label}
                  {tab.id !== 'all' && <span style={{
                    fontSize: 11, fontWeight: 700, minWidth: 18, height: 18,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 100, padding: '0 5px',
                    background: activeTab === tab.id ? '#1a1a1a' : '#e5e7eb',
                    color: activeTab === tab.id ? '#fff' : '#6b7280',
                  }}>{orders.filter(o => o.status === tab.id).length}</span>}
                </button>
              ))}
            </div>
            <button className="hub-btn hub-btn-secondary" onClick={fetchOrders} title="Atualizar">
              <RefreshCw size={14} /> Atualizar
            </button>
          </>
        }
        columns={COLUMNS}
        rows={filteredOrders}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por número, cliente ou e-mail"
        sortOptions={SORT_OPTIONS}
        currentSort={sort}
        onSortChange={setSort}
        exportTitle="Pedidos da Loja"
        exportFilename="pedidos"
        activeFilters={activeFilters || undefined}
        entityLabel="pedido"
        emptyMessage="Nenhum pedido encontrado."
        emptyDescription={search ? `Nenhum resultado para "${search}"` : 'Não há pedidos com este filtro.'}
        bulkActions={[
          {
            label: 'Excluir',
            icon: <Trash2 size={13} />,
            action: confirmDelete,
            variant: 'danger',
          },
        ]}
        toolbarExtra={
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="hub-toolbar-btn"
            style={{ paddingRight: 28, appearance: 'auto' }}
            aria-label="Filtrar por pagamento"
          >
            <option value="all">Todos os pagamentos</option>
            <option value="pending">Aguardando</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Recusado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        }
        renderRowActions={(order, onClose) => (
          <>
            <Link
              to={`/hub/pedidos/${order.id}`}
              className="hub-dropdown-item"
              onClick={onClose}
            >
              <Eye size={14} color="#111111" /> Ver detalhes
            </Link>
            <div className="hub-dropdown-divider" />
            <button
              className="hub-dropdown-item delete"
              onClick={() => { onClose(); confirmDelete([order.id]) }}
            >
              <Trash2 size={14} color="#dc2626" /> Excluir pedido
            </button>
          </>
        )}
      />
    </div>
  )
}
