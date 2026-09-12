import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, RefreshCw, Eye, Trash2 } from 'lucide-react'
import { HubDataTable, type HubColumn, useBulkDelete } from '../components/ui/HubDataTable'
import type { Customer } from '../types/database'

interface CustomerWithMetrics extends Customer {
  total_spent?: number
  orders_count?: number
  last_order_date?: string
  cpf?: string
  document?: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price || 0)
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const palette = ['#4a6fa5', '#6b8f71', '#c07a4a', '#8b5e83', '#5e8fa5', '#a55e6b']
  return palette[Math.abs(hash) % palette.length]
}

const COLUMNS: HubColumn<CustomerWithMetrics>[] = [
  {
    key: 'name',
    label: 'Cliente',
    render: (c) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: stringToColor(c.name || '?'), color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700
        }}>
          {(c.name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="hub-cell-bold">{c.name || 'Cliente sem nome'}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>CPF: {c.cpf || c.document || 'Não informado'}</div>
        </div>
      </div>
    ),
    exportValue: (c) => c.name || '',
  },
  {
    key: 'email',
    label: 'Contato',
    render: (c) => (
      <div>
        <div className="hub-cell-text">{c.email || 'E-mail não informado'}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.phone || ''}</div>
      </div>
    ),
    exportValue: (c) => c.email || '',
  },
  {
    key: 'city',
    label: 'Localização',
    width: '140px',
    render: (c) => (
      <span className="hub-cell-muted">
        {c.city && c.state ? `${c.city} — ${c.state}` : (c.city || c.state || '—')}
      </span>
    ),
    exportValue: (c) => c.city && c.state ? `${c.city} — ${c.state}` : (c.city || c.state || ''),
  },
  {
    key: 'orders_count',
    label: 'Pedidos',
    width: '90px',
    align: 'center',
    render: (c) => (
      <span className="hub-status-badge hub-badge-gray">
        {c.orders_count || 0}
      </span>
    ),
    exportValue: (c) => c.orders_count || 0,
  },
  {
    key: 'total_spent',
    label: 'Total Comprado',
    width: '130px',
    align: 'right',
    render: (c) => <span className="hub-cell-bold">{formatPrice(c.total_spent || 0)}</span>,
    exportValue: (c) => formatPrice(c.total_spent || 0),
  },
  {
    key: 'last_order_date',
    label: 'Última Compra',
    width: '120px',
    render: (c) => <span className="hub-cell-muted">{formatDate(c.last_order_date)}</span>,
    exportValue: (c) => formatDate(c.last_order_date),
  },
]

export default function CustomersList() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<CustomerWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', cpf: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const [custRes, ordersRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('store_orders').select('id, customer_id, customer_email, total, status, created_at')
      ])
      if (custRes.error) throw custRes.error

      const rawCusts = (custRes.data || []) as any[]
      const allOrders = (ordersRes.data || []) as any[]

      const enriched: CustomerWithMetrics[] = rawCusts.map(c => {
        const clientOrders = allOrders.filter(
          o => (o.customer_id && o.customer_id === c.id) ||
            (o.customer_email && o.customer_email.toLowerCase() === (c.email || '').toLowerCase())
        )
        const paidOrders = clientOrders.filter(o =>
          ['paid', 'approved', 'preparing', 'shipped', 'delivered'].includes((o.status || '').toLowerCase())
        )
        const totalSpent = paidOrders.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0)
        const lastOrder = clientOrders.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        return {
          ...c,
          document: c.cpf || c.document || '',
          orders_count: clientOrders.length,
          total_spent: totalSpent > 0 ? totalSpent : Number(c.total_spent || 0),
          last_order_date: lastOrder ? lastOrder.created_at : undefined
        }
      })
      setCustomers(enriched)
    } catch (err) {
      console.error('[CustomersList]', err)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteCustomers(ids: string[]) {
    try {
      // Desvincular pedidos para evitar violação de integridade referencial
      await supabase.from('store_orders').update({ customer_id: null }).in('customer_id', ids)
      const { error } = await supabase.from('customers').delete().in('id', ids)
      if (error) {
        console.error('Erro ao excluir clientes no banco:', error)
        alert(`Não foi possível excluir: ${error.message}`)
        return
      }
      setCustomers(prev => prev.filter(c => !ids.includes(c.id)))
      await fetchCustomers()
    } catch (e: any) {
      console.error('Erro ao excluir clientes:', e)
      alert('Erro ao excluir clientes: ' + (e?.message || ''))
    }
  }

  const confirmDelete = useBulkDelete(handleDeleteCustomers, 'cliente')

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!newCustomer.name.trim()) return
    setSaving(true)
    try {
      await supabase.from('customers').insert({
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim() || null,
        phone: newCustomer.phone.trim() || null,
        cpf: newCustomer.cpf.replace(/\D/g, '') || null,
        created_at: new Date().toISOString()
      })
      setShowAddModal(false)
      setNewCustomer({ name: '', email: '', phone: '', cpf: '' })
      await fetchCustomers()
    } catch (err: any) {
      alert(`Erro ao cadastrar cliente: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const filteredCustomers = customers.filter(c =>
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.document && c.document.includes(search)) ||
    (c.cpf && c.cpf.includes(search))
  )

  return (
    <>
      <HubDataTable
        title="Clientes"
        headerActions={
          <>
            <button className="hub-btn hub-btn-secondary" onClick={fetchCustomers} disabled={loading}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </>
        }
        headerTopActions={
          <button className="hub-btn hub-btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Novo Cliente
          </button>
        }
        columns={COLUMNS}
        rows={filteredCustomers}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, e-mail ou CPF"
        exportTitle="Clientes"
        exportFilename="clientes"
        entityLabel="cliente"
        emptyMessage="Nenhum cliente encontrado."
        emptyDescription={search ? `Nenhum resultado para "${search}"` : 'Os clientes que realizarem compras no SITE aparecerão aqui.'}
        bulkActions={[
          { label: 'Excluir', icon: <Trash2 size={13} />, action: confirmDelete, variant: 'danger' },
        ]}
        renderRowActions={(customer, onClose) => (
          <>
            <Link
              to={`/hub/clientes/${customer.id}`}
              className="hub-dropdown-item"
              onClick={onClose}
            >
              <Eye size={14} color="#2563eb" /> Ver cliente
            </Link>
            <div className="hub-dropdown-divider" />
            <button
              className="hub-dropdown-item delete"
              onClick={() => { onClose(); confirmDelete([customer.id]) }}
            >
              <Trash2 size={14} color="#dc2626" /> Excluir cliente
            </button>
          </>
        )}
      />

      {/* Modal novo cliente */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAddModal(false)}
        >
          <form
            style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleCreateCustomer}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Novo Cliente</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Cadastre os dados básicos.</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
            </div>
            {[
              { label: 'Nome Completo *', key: 'name', type: 'text', required: true },
              { label: 'E-mail', key: 'email', type: 'email', required: false },
              { label: 'Telefone', key: 'phone', type: 'text', required: false },
              { label: 'CPF / CNPJ', key: 'cpf', type: 'text', required: false },
            ].map(f => (
              <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                {f.label}
                <input
                  type={f.type}
                  required={f.required}
                  value={(newCustomer as any)[f.key]}
                  onChange={e => setNewCustomer({ ...newCustomer, [f.key]: e.target.value })}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                />
              </label>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" className="hub-btn hub-btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="hub-btn hub-btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
