import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCircle2, AlertTriangle, Trash2,
  Check, ExternalLink, RefreshCw, Sparkles,
  ShoppingCart, CreditCard, Package, Truck, FileText,
  ChevronRight
} from 'lucide-react'
import { HubDataTable, type HubColumn } from '../components/ui/HubDataTable/HubDataTable'
import { useHubNotifications } from '../contexts/HubNotificationContext'
import {
  HubNotificationService,
  resolveNotificationUrl,
  type HubNotification
} from '../services/notificationService'
import { resolveNotificationIcon } from '@teknix/notifications'

export default function NotificationsList() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useHubNotifications()

  const [activeTab, setActiveTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)

  // Abas de filtro
  const tabs = useMemo(() => {
    const unread = notifications.filter(n => !n.is_read).length
    const sales = notifications.filter(n => ['sale', 'order'].includes(String(n.module || '').toLowerCase())).length
    const payments = notifications.filter(n => ['payment', 'pix'].includes(String(n.module || '').toLowerCase())).length
    const stock = notifications.filter(n => String(n.module || '').toLowerCase() === 'stock').length
    const shipments = notifications.filter(n => String(n.module || '').toLowerCase() === 'shipment').length
    const invoices = notifications.filter(n => String(n.module || '').toLowerCase() === 'invoice').length
    const errors = notifications.filter(n => String(n.type || '').toLowerCase() === 'error').length

    return [
      { id: 'all', label: 'Todas', count: notifications.length },
      { id: 'unread', label: 'Não Lidas', count: unread },
      { id: 'sales', label: 'Vendas & Pedidos', count: sales },
      { id: 'payments', label: 'Pagamentos & Pix', count: payments },
      { id: 'stock', label: 'Estoque', count: stock },
      { id: 'shipments', label: 'Envios', count: shipments },
      { id: 'invoices', label: 'Fiscais (NF-e)', count: invoices },
      { id: 'errors', label: 'Erros & Alertas', count: errors }
    ]
  }, [notifications])

  // Filtragem conforme a aba e o search
  const filteredNotifications = useMemo(() => {
    const term = search.toLowerCase().trim()
    return notifications.filter(n => {
      const mod = String(n.module || '').toLowerCase()
      const type = String(n.type || '').toLowerCase()

      if (activeTab === 'unread' && n.is_read) return false
      if (activeTab === 'sales' && !(mod === 'sale' || mod === 'order' || type === 'order')) return false
      if (activeTab === 'payments' && !(mod === 'payment' || mod === 'pix')) return false
      if (activeTab === 'stock' && mod !== 'stock') return false
      if (activeTab === 'shipments' && mod !== 'shipment') return false
      if (activeTab === 'invoices' && mod !== 'invoice') return false
      if (activeTab === 'errors' && type !== 'error') return false

      if (term) {
        const matchesTitle = String(n.title || '').toLowerCase().includes(term)
        const matchesMessage = String(n.message || '').toLowerCase().includes(term)
        const matchesEntity = String(n.entity_id || '').toLowerCase().includes(term)
        const matchesOrder = String(n.metadata?.order_number || '').toLowerCase().includes(term)
        if (!matchesTitle && !matchesMessage && !matchesEntity && !matchesOrder) return false
      }

      return true
    })
  }, [notifications, activeTab, search])

  // Helpers visuais
  const getModuleBadge = (notif: HubNotification) => {
    const mod = String(notif.module || '').toLowerCase()
    const type = String(notif.type || '').toLowerCase()

    if (mod === 'sale' || mod === 'order' || type === 'order') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#065f46', fontSize: '11px', fontWeight: 600 }}>
          <ShoppingCart size={12} /> Venda
        </span>
      )
    }
    if (mod === 'pix') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1e40af', fontSize: '11px', fontWeight: 600 }}>
          <CreditCard size={12} /> Pix
        </span>
      )
    }
    if (mod === 'payment') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: '#e0e7ff', color: '#3730a3', fontSize: '11px', fontWeight: 600 }}>
          <CreditCard size={12} /> Pagamento
        </span>
      )
    }
    if (mod === 'stock') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: '#fffbeb', color: '#92400e', fontSize: '11px', fontWeight: 600 }}>
          <Package size={12} /> Estoque
        </span>
      )
    }
    if (mod === 'shipment') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: '#f0f9ff', color: '#0369a1', fontSize: '11px', fontWeight: 600 }}>
          <Truck size={12} /> Envio
        </span>
      )
    }
    if (mod === 'invoice') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: '#f5f3ff', color: '#5b21b6', fontSize: '11px', fontWeight: 600 }}>
          <FileText size={12} /> Fiscal
        </span>
      )
    }
    if (type === 'error') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: '#fef2f2', color: '#991b1b', fontSize: '11px', fontWeight: 600 }}>
          <AlertTriangle size={12} /> Erro
        </span>
      )
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: '#f3f4f6', color: '#374151', fontSize: '11px', fontWeight: 600 }}>
        <Bell size={12} /> Sistema
      </span>
    )
  }

  // Colunas da HubDataTable
  const columns: HubColumn<HubNotification>[] = [
    {
      key: 'status',
      label: 'Status',
      width: '90px',
      render: (row: HubNotification) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: row.is_read ? '#9ca3af' : '#10b981',
              boxShadow: row.is_read ? 'none' : '0 0 0 3px rgba(16, 185, 129, 0.2)'
            }}
          />
          <span style={{ fontSize: '12px', color: row.is_read ? '#6b7280' : '#111827', fontWeight: row.is_read ? 400 : 600 }}>
            {row.is_read ? 'Lida' : 'Nova'}
          </span>
        </div>
      ),
      exportValue: (row: HubNotification) => (row.is_read ? 'Lida' : 'Nova')
    },
    {
      key: 'module',
      label: 'Tipo',
      width: '120px',
      render: (row: HubNotification) => getModuleBadge(row),
      exportValue: (row: HubNotification) => String(row.module || row.type || 'sistema')
    },
    {
      key: 'title',
      label: 'Notificação',
      render: (row: HubNotification) => {
        const approvedAsset = resolveNotificationIcon({
          module: row.module,
          type: row.type,
          title: row.title,
          message: row.message,
          metadata: row.metadata
        })

        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '2px 0' }}>
            {approvedAsset ? (
              <img
                src={approvedAsset}
                alt=""
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain',
                  flexShrink: 0,
                  marginTop: '2px',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))'
                }}
              />
            ) : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: row.is_read ? 500 : 700,
                color: '#111827',
                marginBottom: '2px'
              }}>
                {row.title}
              </div>
              <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.4 }}>
                {row.message}
              </div>
            </div>
          </div>
        )
      },
      exportValue: (row: HubNotification) => `${row.title} — ${row.message}`
    },
    {
      key: 'entity',
      label: 'Registro Vinculado',
      width: '180px',
      render: (row: HubNotification) => {
        const url = resolveNotificationUrl(row)
        const hasEntity = !!(row.entity_id || row.metadata?.order_number)
        const entityLabel = row.metadata?.order_number || row.entity_id || 'Ver detalhes'

        if (!hasEntity) {
          return <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
        }

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (!row.is_read) markAsRead(row.id)
              navigate(url)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#1f2937',
              cursor: 'pointer',
              maxWidth: '160px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title="Ir para o registro vinculado"
          >
            <ExternalLink size={11} color="#2563eb" />
            {entityLabel}
          </button>
        )
      },
      exportValue: (row: HubNotification) => row.metadata?.order_number || row.entity_id || ''
    },
    {
      key: 'created_at',
      label: 'Data / Hora',
      width: '150px',
      render: (row: HubNotification) => {
        const d = new Date(row.created_at)
        return (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            <div>{d.toLocaleDateString('pt-BR')}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )
      },
      exportValue: (row: HubNotification) => new Date(row.created_at).toLocaleString('pt-BR')
    }
  ]

  // Disparador de teste dos 7 cenários
  const runSimulation = async (scenario: string) => {
    setIsSimulating(true)
    const randomId = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      if (scenario === 'sale') {
        await HubNotificationService.notifyNewSale(
          randomId,
          `TKX-${randomId}`,
          'Rodrigo Alves',
          489.90,
          'Loja Oficial'
        )
      } else if (scenario === 'pix') {
        await HubNotificationService.notifyPixGenerated(
          randomId,
          `TKX-${randomId}`,
          'Juliana Mendes',
          249.90
        )
      } else if (scenario === 'payment') {
        await HubNotificationService.notifyPaymentApproved(
          randomId,
          `TKX-${randomId}`,
          'Juliana Mendes',
          249.90,
          'Pix'
        )
      } else if (scenario === 'stock') {
        await HubNotificationService.notifyLowStock(
          randomId,
          'Kit Furadeira de Impacto Brushless 20V',
          2,
          5
        )
      } else if (scenario === 'label') {
        await HubNotificationService.notifyShipmentLabelGenerated(
          `shp-${randomId}`,
          randomId,
          `BR${randomId}TK`,
          'Melhor Envio / Jadlog'
        )
      } else if (scenario === 'delivered') {
        await HubNotificationService.notifyOrderDelivered(
          randomId,
          `BR${randomId}TK`
        )
      } else if (scenario === 'error') {
        await HubNotificationService.notifyIntegrationError(
          'marketplace',
          'Sincronização Shopee Falhou',
          'Token de autenticação expirado para a loja secundária. Reautenticação necessária.',
          { channel: 'shopee' }
        )
      }
    } finally {
      setIsSimulating(false)
      setShowTestModal(false)
    }
  }

  // Header Actions
  const headerActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        onClick={() => setShowTestModal(true)}
        className="hub-btn hub-btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <Sparkles size={14} color="#6366f1" />
        Simular Evento
      </button>

      {unreadCount > 0 && (
        <button
          type="button"
          onClick={() => markAllAsRead()}
          className="hub-btn hub-btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Check size={14} color="#10b981" />
          Marcar Todas como Lidas
        </button>
      )}

      <button
        type="button"
        onClick={() => fetchNotifications()}
        className="hub-btn hub-btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        title="Recarregar"
      >
        <RefreshCw size={13} />
        Atualizar
      </button>
    </div>
  )

  // Abas na Toolbar
  const toolbarTabs = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      overflowX: 'auto',
      paddingBottom: '4px'
    }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: isActive ? '#111827' : '#e5e7eb',
              background: isActive ? '#111827' : '#ffffff',
              color: isActive ? '#ffffff' : '#6b7280',
              fontWeight: isActive ? 600 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
            <span style={{
              fontSize: '10.5px',
              padding: '1px 5px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
              color: isActive ? '#ffffff' : '#4b5563',
              fontWeight: 700
            }}>
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div>
      <HubDataTable<HubNotification>
        title="Central de Notificações & Alertas"
        headerActions={headerActions}
        columns={columns}
        rows={filteredNotifications}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por título, mensagem ou ID..."
        toolbarExtra={toolbarTabs}
        exportTitle="Notificações TEKNIX"
        exportFilename="notificacoes_teknix"
        emptyMessage="Nenhuma notificação encontrada nesta categoria."
        bulkActions={[
          {
            label: 'Marcar como Lidas',
            icon: <Check size={14} />,
            action: async (selectedIds) => {
              for (const id of selectedIds) {
                await markAsRead(id)
              }
            }
          },
          {
            label: 'Excluir Selecionadas',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            action: async (selectedIds) => {
              if (window.confirm(`Excluir ${selectedIds.length} notificação(ões)?`)) {
                for (const id of selectedIds) {
                  await deleteNotification(id)
                }
              }
            }
          }
        ]}
        renderRowActions={(row, onClose) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
            <button
              type="button"
              className="hub-menu-item"
              onClick={() => {
                onClose()
                if (!row.is_read) markAsRead(row.id)
                navigate(resolveNotificationUrl(row))
              }}
            >
              <ExternalLink size={13} /> Ir para registro vinculado
            </button>
            <button
              type="button"
              className="hub-menu-item"
              onClick={() => {
                onClose()
                markAsRead(row.id)
              }}
            >
              <Check size={13} /> Marcar como lida
            </button>
            <button
              type="button"
              className="hub-menu-item hub-menu-item-danger"
              onClick={() => {
                onClose()
                if (window.confirm('Excluir esta notificação?')) {
                  deleteNotification(row.id)
                }
              }}
            >
              <Trash2 size={13} /> Excluir notificação
            </button>
          </div>
        )}
      />

      {/* Modal de Simulação de Notificações de Teste */}
      {showTestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            maxWidth: '520px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827' }}>
                  Simulador de Eventos do Sistema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('sale')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShoppingCart size={18} color="#059669" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>1. Nova Venda Recebida</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Simula venda de R$ 489,90 na Loja Oficial</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('pix')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={18} color="#2563eb" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>2. Pix Gerado</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Simula chave Pix criada aguardando pagamento</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('payment')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>3. Pagamento Aprovado</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Confirma recebimento e libera pedido</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('stock')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Package size={18} color="#d97706" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>4. Estoque Baixo</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Alerta de produto atingindo o limite mínimo</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('label')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Truck size={18} color="#0284c7" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>5. Etiqueta Gerada</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Simula integração com Melhor Envio</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('delivered')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>6. Pedido Entregue</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Confirmação final da transportadora</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('error')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>7. Erro de Integração</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Simula falha de webhook ou autenticação</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
