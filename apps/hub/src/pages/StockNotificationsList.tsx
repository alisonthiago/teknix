import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bell, Search, ExternalLink, CheckCircle2, Clock, Trash2, MessageSquare, Copy, Check, AlertCircle } from 'lucide-react'
import './StockNotificationsList.css'

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

export default function StockNotificationsList() {
  const [notifications, setNotifications] = useState<StockNotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'notified'>('all')
  const [tableMissing, setTableMissing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

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
          // Tentar ler do localStorage do site/hub como fallback local
          const localStored = localStorage.getItem('teknix_stock_notifications')
          if (localStored) {
            try {
              setNotifications(JSON.parse(localStored))
            } catch {
              setNotifications([])
            }
          }
        } else {
          console.warn('Erro ao buscar avisos de estoque:', error.message)
        }
      } else if (data) {
        setNotifications(data as StockNotificationItem[])
      }
    } catch (err) {
      console.error('Erro na requisição de avisos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleNotified(item: StockNotificationItem) {
    const nextStatus = !item.notified
    // Atualização otimista
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, notified: nextStatus } : n))
    )

    try {
      if (!tableMissing) {
        await supabase
          .from('stock_notifications')
          .update({ notified: nextStatus })
          .eq('id', item.id)
      } else {
        const localStored = localStorage.getItem('teknix_stock_notifications')
        if (localStored) {
          const list: StockNotificationItem[] = JSON.parse(localStored)
          const updated = list.map(n => (n.id === item.id ? { ...n, notified: nextStatus } : n))
          localStorage.setItem('teknix_stock_notifications', JSON.stringify(updated))
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar notificação:', err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente remover esta solicitação de aviso?')) return

    setNotifications(prev => prev.filter(n => n.id !== id))

    try {
      if (!tableMissing) {
        await supabase.from('stock_notifications').delete().eq('id', id)
      } else {
        const localStored = localStorage.getItem('teknix_stock_notifications')
        if (localStored) {
          const list: StockNotificationItem[] = JSON.parse(localStored)
          const updated = list.filter(n => n.id !== id)
          localStorage.setItem('teknix_stock_notifications', JSON.stringify(updated))
        }
      }
    } catch (err) {
      console.error('Erro ao excluir notificação:', err)
    }
  }

  function handleCopyEmail(email: string, id: string) {
    navigator.clipboard.writeText(email)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function getWhatsAppUrl(phone: string, productName: string) {
    const cleanNumber = phone.replace(/\D/g, '')
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`
    const text = encodeURIComponent(
      `Olá! Boas notícias: o produto "${productName}" que você solicitou aviso já está disponível em nosso site Teknix! Confira em https://teknixbrasil.com.br`
    )
    return `https://wa.me/${fullNumber}?text=${text}`
  }

  function formatPhoneDisplay(phone: string) {
    const raw = phone.replace(/\D/g, '')
    if (raw.length === 11) {
      return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
    }
    if (raw.length === 10) {
      return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`
    }
    return phone
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    } catch {
      return iso
    }
  }

  const filtered = notifications.filter(item => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'pending'
        ? !item.notified
        : item.notified

    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      item.product_name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.whatsapp?.includes(q)

    return matchesTab && matchesSearch
  })

  const pendingCount = notifications.filter(n => !n.notified).length
  const notifiedCount = notifications.filter(n => n.notified).length

  return (
    <div className="stock-notifications-page">
      <div className="page-header">
        <div className="header-info">
          <h1>Avisos de Estoque</h1>
          <p>Leads e clientes aguardando reposição de produtos esgotados no SITE.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={fetchNotifications}
            disabled={loading}
          >
            Atualizar
          </button>
        </div>
      </div>

      {tableMissing && (
        <div className="stock-notice-banner">
          <AlertCircle size={20} className="stock-notice-icon" />
          <div className="stock-notice-content">
            <strong>Tabela pronta para ativação no Supabase</strong>
            <p>
              A migração <code>015_stock_notifications.sql</code> foi criada. Quando executar no SQL Editor do Supabase,
              os dados serão sincronizados na nuvem em tempo real.
            </p>
          </div>
        </div>
      )}

      {/* Métricas rápidas */}
      <div className="stock-metrics-grid">
        <div className="stock-metric-card">
          <span className="stock-metric-label">Total de Pedidos de Aviso</span>
          <span className="stock-metric-value">{notifications.length}</span>
        </div>
        <div className="stock-metric-card pending">
          <span className="stock-metric-label">Aguardando Aviso</span>
          <span className="stock-metric-value text-amber">{pendingCount}</span>
        </div>
        <div className="stock-metric-card notified">
          <span className="stock-metric-label">Notificados</span>
          <span className="stock-metric-value text-green">{notifiedCount}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="stock-tabs">
        <button
          className={`stock-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Todos ({notifications.length})
        </button>
        <button
          className={`stock-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pendentes ({pendingCount})
        </button>
        <button
          className={`stock-tab-btn ${activeTab === 'notified' ? 'active' : ''}`}
          onClick={() => setActiveTab('notified')}
        >
          Notificados ({notifiedCount})
        </button>
      </div>

      {/* Toolbar */}
      <div className="stock-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por produto, email ou WhatsApp..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando solicitações de aviso...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="stock-empty-state">
          <div className="empty-icon">
            <Bell size={36} color="#86868b" />
          </div>
          <h3>Nenhuma solicitação encontrada</h3>
          <p>
            {notifications.length === 0
              ? 'Assim que um cliente solicitar ser avisado sobre um produto esgotado na loja, o contato dele aparecerá aqui.'
              : 'Nenhum registro corresponde aos filtros selecionados.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto Solicitado</th>
                <th>Cliente / Contato</th>
                <th>Data da Solicitação</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="stock-notify-row">
                  <td className="stock-col-product">
                    <span className="stock-product-name">{item.product_name}</span>
                    <span className="stock-product-id">ID: {item.product_id}</span>
                  </td>
                  <td className="stock-col-contact">
                    <div className="stock-contact-line">
                      <span className="stock-contact-email">{item.email}</span>
                      <button
                        className="stock-copy-btn"
                        onClick={() => handleCopyEmail(item.email, item.id)}
                        title="Copiar e-mail"
                      >
                        {copiedId === item.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      </button>
                    </div>
                    {item.whatsapp && (
                      <div className="stock-contact-wpp">
                        <a
                          href={getWhatsAppUrl(item.whatsapp, item.product_name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="stock-wpp-link"
                          title="Abrir WhatsApp com mensagem pronta"
                        >
                          <MessageSquare size={13} />
                          <span>{formatPhoneDisplay(item.whatsapp)}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="stock-col-date">
                    <span className="stock-date-text">{formatDate(item.created_at)}</span>
                  </td>
                  <td className="stock-col-status">
                    {item.notified ? (
                      <span className="stock-badge stock-badge-success">
                        <CheckCircle2 size={13} /> Notificado
                      </span>
                    ) : (
                      <span className="stock-badge stock-badge-pending">
                        <Clock size={13} /> Aguardando reposição
                      </span>
                    )}
                  </td>
                  <td className="stock-col-actions" style={{ textAlign: 'right' }}>
                    <div className="stock-action-buttons">
                      <button
                        className={`stock-btn-action ${item.notified ? 'btn-revert' : 'btn-mark'}`}
                        onClick={() => toggleNotified(item)}
                        title={item.notified ? 'Marcar como pendente' : 'Marcar como avisado'}
                      >
                        {item.notified ? 'Desmarcar' : 'Marcar como avisado'}
                      </button>
                      <button
                        className="stock-btn-delete"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir lead"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
