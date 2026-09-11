import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Bell, CheckCircle2, Clock, Trash2, MessageSquare, Copy, Check, AlertCircle, RefreshCw, ExternalLink
} from 'lucide-react'
import { HubDataTable, type HubColumn, useBulkDelete } from '../components/ui/HubDataTable'
import '../components/ui/HubDataTable/HubKpi.css'

export interface StockNotificationItem {
  id: string
  product_id: string
  product_name: string
  email: string
  whatsapp: string
  notified: boolean
  created_at: string
  notes?: string
}

function formatPhoneDisplay(phone: string) {
  const raw = phone.replace(/\D/g, '')
  if (raw.length === 11) return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
  if (raw.length === 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`
  return phone
}

function getWhatsAppUrl(phone: string, productName: string) {
  const cleanNumber = phone.replace(/\D/g, '')
  const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`
  const text = encodeURIComponent(
    `Olá! Boas notícias: o produto "${productName}" que você solicitou aviso já está disponível em nosso site Teknix! Confira em https://teknixbrasil.com.br`
  )
  return `https://wa.me/${fullNumber}?text=${text}`
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(iso))
  } catch { return iso }
}

export default function StockNotificationsList() {
  const [notifications, setNotifications] = useState<StockNotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'notified'>('all')
  const [tableMissing, setTableMissing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { fetchNotifications() }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stock_notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
          setTableMissing(true)
          const localStored = localStorage.getItem('teknix_stock_notifications')
          if (localStored) {
            try { setNotifications(JSON.parse(localStored)) } catch { setNotifications([]) }
          }
        }
      } else if (data) {
        setNotifications(data as StockNotificationItem[])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function toggleNotified(item: StockNotificationItem) {
    const nextStatus = !item.notified
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, notified: nextStatus } : n))
    try {
      if (!tableMissing) {
        await supabase.from('stock_notifications').update({ notified: nextStatus }).eq('id', item.id)
      } else {
        const localStored = localStorage.getItem('teknix_stock_notifications')
        if (localStored) {
          const list: StockNotificationItem[] = JSON.parse(localStored)
          localStorage.setItem('teknix_stock_notifications', JSON.stringify(list.map(n => n.id === item.id ? { ...n, notified: nextStatus } : n)))
        }
      }
    } catch { console.error('Erro ao atualizar notificação') }
  }

  async function handleDeleteItems(ids: string[]) {
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)))
    try {
      if (!tableMissing) {
        await supabase.from('stock_notifications').delete().in('id', ids)
      } else {
        const localStored = localStorage.getItem('teknix_stock_notifications')
        if (localStored) {
          const list: StockNotificationItem[] = JSON.parse(localStored)
          localStorage.setItem('teknix_stock_notifications', JSON.stringify(list.filter(n => !ids.includes(n.id))))
        }
      }
    } catch { console.error('Erro ao excluir notificações') }
  }

  const confirmDelete = useBulkDelete(handleDeleteItems, 'aviso')

  function handleCopyEmail(email: string, id: string) {
    navigator.clipboard.writeText(email)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = notifications.filter(item => {
    const matchesTab = activeTab === 'all' ? true : activeTab === 'pending' ? !item.notified : item.notified
    const q = search.toLowerCase().trim()
    const matchesSearch = !q ||
      item.product_name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.whatsapp?.includes(q)
    return matchesTab && matchesSearch
  })

  const pendingCount = notifications.filter(n => !n.notified).length
  const notifiedCount = notifications.filter(n => n.notified).length

  const COLUMNS: HubColumn<StockNotificationItem>[] = [
    {
      key: 'product_name',
      label: 'Produto Solicitado',
      render: (item) => (
        <div>
          <div className="hub-cell-bold">{item.product_name}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>ID: {item.product_id}</div>
        </div>
      ),
      exportValue: (item) => item.product_name,
    },
    {
      key: 'email',
      label: 'Contato',
      render: (item) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="hub-cell-text">{item.email}</span>
            <button
              onClick={() => handleCopyEmail(item.email, item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === item.id ? '#16a34a' : '#9ca3af', padding: 2 }}
              title="Copiar e-mail"
            >
              {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          {item.whatsapp && (
            <a
              href={getWhatsAppUrl(item.whatsapp, item.product_name)}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#16a34a', marginTop: 2, textDecoration: 'none' }}
            >
              <MessageSquare size={12} />
              {formatPhoneDisplay(item.whatsapp)}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      ),
      exportValue: (item) => `${item.email} / ${item.whatsapp || ''}`,
    },
    {
      key: 'created_at',
      label: 'Data da Solicitação',
      width: '150px',
      render: (item) => <span className="hub-cell-muted">{formatDate(item.created_at)}</span>,
      exportValue: (item) => formatDate(item.created_at),
    },
    {
      key: 'notified',
      label: 'Status',
      width: '170px',
      render: (item) => item.notified ? (
        <span className="hub-status-badge hub-badge-green">
          <span className="hub-badge-dot" />
          <CheckCircle2 size={12} /> Notificado
        </span>
      ) : (
        <span className="hub-status-badge hub-badge-yellow">
          <span className="hub-badge-dot" />
          <Clock size={12} /> Aguardando
        </span>
      ),
      exportValue: (item) => item.notified ? 'Notificado' : 'Aguardando',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {tableMissing && (
        <div style={{ background: '#fff7ed', border: '1px solid #fb923c', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#f97316" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ fontSize: 14, color: '#92400e' }}>Tabela pronta para ativação no Supabase</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78350f' }}>
              A migração <code>015_stock_notifications.sql</code> foi criada. Execute-a no SQL Editor do Supabase para sincronizar dados em tempo real.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="hub-kpi-grid">
        {[
          { label: 'Total de Avisos', value: notifications.length, icon: <Bell size={16} />, sub: 'Todos os avisos cadastrados' },
          { label: 'Aguardando', value: pendingCount, icon: <Clock size={16} />, sub: 'Aguardando reposição' },
          { label: 'Notificados', value: notifiedCount, icon: <CheckCircle2 size={16} />, sub: 'Clientes já notificados' },
        ].map((s, i) => (
          <div key={i} className="hub-kpi-card hub-kpi-card--compact">
            <div className="hub-kpi-header"><span className="hub-kpi-label">{s.label}</span><div className="hub-kpi-icon">{s.icon}</div></div>
            <div className="hub-kpi-value">{s.value}</div>
            <p className="hub-kpi-subtitle">{s.sub}</p>
          </div>
        ))}
      </div>

      <HubDataTable
        title="Avisos de Estoque"
        description="Leads e clientes aguardando reposição de produtos esgotados no SITE."
        headerActions={
          <>
            <div className="hub-status-tabs">
              {([
                { id: 'all', label: `Todos (${notifications.length})` },
                { id: 'pending', label: `Pendentes (${pendingCount})` },
                { id: 'notified', label: `Notificados (${notifiedCount})` },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? '#fff' : 'transparent',
                  color: activeTab === tab.id ? '#111' : '#6b7280',
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  fontFamily: 'inherit', whiteSpace: 'nowrap'
                }}>{tab.label}</button>
              ))}
            </div>
            <button className="hub-btn hub-btn-secondary" onClick={fetchNotifications} disabled={loading}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </>
        }
        columns={COLUMNS}
        rows={filtered}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por produto, e-mail ou WhatsApp"
        exportTitle="Avisos de Estoque"
        exportFilename="avisos-estoque"
        entityLabel="aviso"
        emptyMessage="Nenhuma solicitação encontrada."
        emptyDescription={
          notifications.length === 0
            ? 'Assim que um cliente solicitar aviso de reposição, aparecerá aqui.'
            : 'Nenhum registro corresponde aos filtros selecionados.'
        }
        bulkActions={[
          { label: 'Excluir', icon: <Trash2 size={13} />, action: confirmDelete, variant: 'danger' },
        ]}
        renderRowActions={(item, onClose) => (
          <>
            <button className="hub-dropdown-item" onClick={() => { onClose(); toggleNotified(item) }}>
              {item.notified
                ? <><Clock size={14} color="#ca8a04" /> Marcar como pendente</>
                : <><CheckCircle2 size={14} color="#16a34a" /> Marcar como avisado</>
              }
            </button>
            <div className="hub-dropdown-divider" />
            <button className="hub-dropdown-item delete" onClick={() => { onClose(); confirmDelete([item.id]) }}>
              <Trash2 size={14} color="#dc2626" /> Excluir aviso
            </button>
          </>
        )}
      />
    </div>
  )
}
