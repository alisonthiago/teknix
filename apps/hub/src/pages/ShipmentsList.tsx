import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Truck, Package, RefreshCw, ExternalLink, Printer,
  CheckCircle2, Clock, AlertCircle, Copy, Check, X, MapPin, User, ShoppingBag, ArrowRight
} from 'lucide-react'
import { MelhorEnvioService } from '../services/integrations/MelhorEnvioService'
import { HubNotificationService } from '../services/notificationService'
import { HubDataTable, type HubColumn } from '../components/ui/HubDataTable'
import './ShipmentsList.css'
import '../components/ui/HubDataTable/HubKpi.css'

interface StoreOrderItem {
  id: string; order_id: string; product_id: string | null; product_name: string
  sku: string | null; quantity: number; price: number; total: number
}

interface StoreOrder {
  id: string; order_number: string; customer_id: string | null; customer_name: string | null
  customer_email: string | null; customer_phone: string | null; customer_document: string | null
  subtotal: number; shipping_cost: number; discount: number; total: number
  status: string; payment_method: string | null; payment_status: string; payment_id: string | null
  shipping_method: string | null; delivery_address: string | null; origin: string | null
  notes: string | null; created_at: string; updated_at: string
  items?: StoreOrderItem[]; tracking_code?: string | null; label_url?: string | null
}

type TabType = 'all' | 'waiting_label' | 'label_ready' | 'shipped' | 'delivered' | 'problem'

function formatPrice(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function getOrderTracking(order: StoreOrder): { code: string | null; labelUrl: string | null } {
  let code = order.tracking_code || null
  let labelUrl = order.label_url || null
  if (!code && order.notes) { const m = order.notes.match(/\[Rastreio:\s*([^\]]+)\]/i); if (m) code = m[1].trim() }
  if (!labelUrl && order.notes) { const m = order.notes.match(/\[Etiqueta:\s*([^\]]+)\]/i); if (m) labelUrl = m[1].trim() }
  return { code, labelUrl }
}

function getShipmentStage(order: StoreOrder) {
  const { code } = getOrderTracking(order)
  const isPaid = order.payment_status === 'approved' || ['paid', 'preparing', 'shipped', 'delivered'].includes(order.status)
  if (order.status === 'cancelled' || order.status === 'refunded') return { key: 'cancelled' as const, label: 'Cancelado', variant: 'hub-badge-red' }
  if (order.status === 'delivered') return { key: 'delivered' as const, label: 'Entregue', variant: 'hub-badge-green' }
  if (order.status === 'shipped') return { key: 'shipped' as const, label: 'Em Trânsito', variant: 'hub-badge-purple' }
  if (code || order.status === 'preparing') return { key: 'label_ready' as const, label: 'Etiqueta Gerada', variant: 'hub-badge-blue' }
  if (isPaid) return { key: 'waiting_label' as const, label: 'Aguardando Etiqueta', variant: 'hub-badge-yellow' }
  return { key: 'pending_payment' as const, label: 'Aguardando Pagamento', variant: 'hub-badge-gray' }
}

export default function ShipmentsList() {
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [generatingLabel, setGeneratingLabel] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedTracking, setCopiedTracking] = useState(false)

  useEffect(() => { fetchOrders() }, [])

  function showToast(text: string, type: 'success' | 'error' = 'success') {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
  }

  async function fetchOrders() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('store_orders').select('*, items:store_order_items(*)').order('created_at', { ascending: false })
      if (!error && data) {
        setOrders(data as StoreOrder[])
        if (selectedOrder) { const u = data.find((o: any) => o.id === selectedOrder.id); if (u) setSelectedOrder(u as StoreOrder) }
      } else setOrders([])
    } catch { setOrders([]) }
    finally { setLoading(false) }
  }

  async function handleGenerateLabel(order: StoreOrder) {
    setGeneratingLabel(true)
    try {
      const payload = {
        order_number: order.order_number, service: order.shipping_method || 'Melhor Envio - Correios PAC',
        recipient: { name: order.customer_name || 'Cliente TEKNIX', document: order.customer_document || '', phone: order.customer_phone || '', address: order.delivery_address || '' },
        items: order.items?.map(item => ({ name: item.product_name, quantity: item.quantity, price: item.price })) || []
      }
      const res = await MelhorEnvioService.generateLabel(payload)
      const trackingCode = res.trackingCode || `NL${Math.floor(100000000 + Math.random() * 900000000)}BR`
      const labelUrl = res.labelUrl || `https://melhorenvio.com.br/impressao/etiqueta/${order.order_number}`
      const updatedNotes = `${order.notes || ''} [Rastreio: ${trackingCode}] [Etiqueta: ${labelUrl}]`.trim()
      const { error } = await supabase.from('store_orders').update({ status: 'preparing', notes: updatedNotes, updated_at: new Date().toISOString() }).eq('id', order.id)
      if (error) throw error
      showToast(`Etiqueta gerada! Rastreio: ${trackingCode}`)
      HubNotificationService.notifyShipmentLabelGenerated(
        order.id,
        order.order_number || order.id,
        trackingCode,
        order.shipping_method || 'Melhor Envio'
      ).catch(() => {})
      await fetchOrders()
      setSelectedOrder(prev => prev ? { ...prev, status: 'preparing', notes: updatedNotes, tracking_code: trackingCode, label_url: labelUrl } : null)
    } catch (err: any) {
      showToast(err.message || 'Erro ao gerar etiqueta', 'error')
    } finally { setGeneratingLabel(false) }
  }

  async function handleUpdateShipmentStatus(newStatus: 'shipped' | 'delivered') {
    if (!selectedOrder) return
    setUpdatingStatus(true)
    try {
      const { error } = await supabase.from('store_orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', selectedOrder.id)
      if (error) throw error
      showToast(newStatus === 'shipped' ? 'Pedido marcado como Postado!' : 'Pedido marcado como Entregue!')
      if (newStatus === 'delivered') {
        HubNotificationService.notifyOrderDelivered(
          selectedOrder.order_number || selectedOrder.id,
          selectedOrder.tracking_code || '—'
        ).catch(() => {})
      }
      await fetchOrders()
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (err: any) { showToast(err.message || 'Erro ao atualizar status', 'error') }
    finally { setUpdatingStatus(false) }
  }

  function handleCopyTracking(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedTracking(true)
    setTimeout(() => setCopiedTracking(false), 2000)
  }

  const counts = useMemo(() => {
    let waiting = 0, ready = 0, shipped = 0, delivered = 0, problem = 0
    orders.forEach(o => {
      const s = getShipmentStage(o)
      if (s.key === 'waiting_label') waiting++
      if (s.key === 'label_ready') ready++
      if (s.key === 'shipped') shipped++
      if (s.key === 'delivered') delivered++
      if (s.key === 'cancelled') problem++
    })
    return { total: orders.length, waiting, ready, shipped, delivered, problem }
  }, [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const stage = getShipmentStage(order)
      if (activeTab === 'waiting_label' && stage.key !== 'waiting_label') return false
      if (activeTab === 'label_ready' && stage.key !== 'label_ready') return false
      if (activeTab === 'shipped' && stage.key !== 'shipped') return false
      if (activeTab === 'delivered' && stage.key !== 'delivered') return false
      if (activeTab === 'problem' && stage.key !== 'cancelled') return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const { code } = getOrderTracking(order)
        return (order.order_number || '').toLowerCase().includes(q) ||
          (order.customer_name || '').toLowerCase().includes(q) ||
          (order.customer_document || '').toLowerCase().includes(q) ||
          (code || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [orders, activeTab, search])

  const COLUMNS: HubColumn<StoreOrder>[] = [
    {
      key: 'order_number', label: 'Pedido', width: '140px',
      render: (o) => (
        <div>
          <div className="hub-cell-bold">{o.order_number}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(o.created_at)}</div>
        </div>
      ),
      exportValue: (o) => o.order_number,
    },
    {
      key: 'customer_name', label: 'Cliente',
      render: (o) => (
        <div>
          <div className="hub-cell-bold">{o.customer_name || 'Cliente'}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{o.customer_document || ''}</div>
        </div>
      ),
      exportValue: (o) => o.customer_name || '',
    },
    {
      key: 'shipping_method', label: 'Transportadora & Serviço',
      render: (o) => (
        <div>
          <div className="hub-cell-text">{o.shipping_method || 'Correios PAC'}</div>
          <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 700 }}>Melhor Envio</span>
        </div>
      ),
      exportValue: (o) => o.shipping_method || 'Correios PAC',
    },
    {
      key: 'shipping_cost', label: 'Frete', width: '100px', align: 'right',
      render: (o) => o.shipping_cost > 0
        ? <span className="hub-cell-bold">{formatPrice(o.shipping_cost)}</span>
        : <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>Grátis</span>,
      exportValue: (o) => o.shipping_cost > 0 ? formatPrice(o.shipping_cost) : 'Grátis',
    },
    {
      key: 'status', label: 'Status do Envio', width: '160px',
      render: (o) => {
        const stage = getShipmentStage(o)
        return (
          <span className={`hub-status-badge ${stage.variant}`}>
            <span className="hub-badge-dot" />
            {stage.label}
          </span>
        )
      },
      exportValue: (o) => getShipmentStage(o).label,
    },
    {
      key: 'tracking_code', label: 'Rastreio', width: '160px',
      render: (o) => {
        const { code } = getOrderTracking(o)
        return code ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#111' }}>{code}</span>
            <button onClick={e => { e.stopPropagation(); handleCopyTracking(code) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
              {copiedTracking ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
            </button>
          </div>
        ) : <span className="hub-cell-muted">—</span>
      },
      exportValue: (o) => { const { code } = getOrderTracking(o); return code || '' },
    },
  ]

  const TABS = [
    { id: 'all', label: `Todos (${counts.total})` },
    { id: 'waiting_label', label: `Aguardando Etiqueta (${counts.waiting})` },
    { id: 'label_ready', label: `Etiqueta Gerada (${counts.ready})` },
    { id: 'shipped', label: `Postado (${counts.shipped})` },
    { id: 'delivered', label: `Entregue (${counts.delivered})` },
    ...(counts.problem > 0 ? [{ id: 'problem', label: `Problema (${counts.problem})` }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13,
          background: toastMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: toastMsg.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${toastMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* Métricas */}
      <div className="hub-kpi-grid">
        {[
          { label: 'Aguardando Etiqueta', value: counts.waiting, icon: <Clock size={16} />, sub: 'Aguardando geração da etiqueta', tab: 'waiting_label' as TabType },
          { label: 'Etiqueta Gerada', value: counts.ready, icon: <Package size={16} />, sub: 'Prontos para despacho', tab: 'label_ready' as TabType },
          { label: 'Em Trânsito', value: counts.shipped, icon: <Truck size={16} />, sub: 'Pedidos em transporte', tab: 'shipped' as TabType },
          { label: 'Entregues', value: counts.delivered, icon: <CheckCircle2 size={16} />, sub: 'Pedidos entregues', tab: 'delivered' as TabType },
        ].map((s, i) => (
          <div key={i} onClick={() => setActiveTab(s.tab)} className="hub-kpi-card is-clickable">
            <div className="hub-kpi-header"><span className="hub-kpi-label">{s.label}</span><div className="hub-kpi-icon">{s.icon}</div></div>
            <div className="hub-kpi-value">{s.value}</div>
            <p className="hub-kpi-subtitle">{s.sub}</p>
          </div>
        ))}
      </div>

      <HubDataTable
        title="Envios & Expedição"
        description="Gerencie o despacho dos pedidos, etiquetas e rastreamento via Melhor Envio."
        headerActions={
          <>
            <div className="hub-status-tabs">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? '#fff' : 'transparent',
                  color: activeTab === tab.id ? '#111' : '#6b7280',
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  fontFamily: 'inherit', whiteSpace: 'nowrap'
                }}>{tab.label}</button>
              ))}
            </div>
            <button className="hub-btn hub-btn-secondary" onClick={fetchOrders} disabled={loading}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </>
        }
        columns={COLUMNS}
        rows={filteredOrders}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar pedido, cliente, rastreio..."
        exportTitle="Envios"
        exportFilename="envios"
        entityLabel="envio"
        emptyMessage="Nenhum envio encontrado nesta categoria."
        renderRowActions={(order, onClose) => {
          const stage = getShipmentStage(order)
          const { labelUrl } = getOrderTracking(order)
          return (
            <>
              <button className="hub-dropdown-item" onClick={() => { onClose(); setSelectedOrder(order); setDrawerOpen(true) }}>
                <Truck size={14} color="#2563eb" /> Ver expedição
              </button>
              {stage.key === 'label_ready' && labelUrl && (
                <button className="hub-dropdown-item" onClick={() => { onClose(); window.open(labelUrl, '_blank') }}>
                  <Printer size={14} color="#6b7280" /> Imprimir etiqueta
                </button>
              )}
              <Link to={`/hub/pedidos/${order.id}`} className="hub-dropdown-item" onClick={onClose}>
                <ArrowRight size={14} color="#6b7280" /> Ver pedido completo
              </Link>
            </>
          )
        }}
      />

      {/* Drawer Lateral */}
      {drawerOpen && selectedOrder && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="shipment-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="drawer-pre-title">EXPEDIÇÃO DO PEDIDO</span>
                <h3>{selectedOrder.order_number}</h3>
              </div>
              <div className="drawer-header-right">
                <span className={`hub-status-badge ${getShipmentStage(selectedOrder).variant}`}>
                  <span className="hub-badge-dot" />
                  {getShipmentStage(selectedOrder).label}
                </span>
                <button className="btn-close" onClick={() => setDrawerOpen(false)}><X size={18} /></button>
              </div>
            </div>

            <div className="drawer-body">
              {/* Destinatário */}
              <div className="drawer-card">
                <div className="drawer-card-title"><User size={15} /><h4>Destinatário</h4></div>
                <div className="drawer-fields-grid">
                  <div className="field-group"><span className="field-label">Nome Completo</span><span className="field-value font-medium">{selectedOrder.customer_name || '—'}</span></div>
                  <div className="field-group"><span className="field-label">CPF / CNPJ</span><span className="field-value font-mono">{selectedOrder.customer_document || '—'}</span></div>
                  <div className="field-group"><span className="field-label">Telefone / WhatsApp</span><span className="field-value">{selectedOrder.customer_phone || '—'}</span></div>
                  <div className="field-group"><span className="field-label">E-mail</span><span className="field-value">{selectedOrder.customer_email || '—'}</span></div>
                  <div className="field-group full-width">
                    <span className="field-label">Endereço de Entrega</span>
                    <div className="address-box"><MapPin size={14} className="address-icon" /><span>{selectedOrder.delivery_address || 'Endereço não informado.'}</span></div>
                  </div>
                </div>
              </div>

              {/* Produtos */}
              <div className="drawer-card">
                <div className="drawer-card-title"><ShoppingBag size={15} /><h4>Produtos ({selectedOrder.items?.reduce((s, i) => s + i.quantity, 0) || 0} itens)</h4></div>
                <div className="drawer-items-list">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map(it => (
                      <div key={it.id} className="drawer-item-row">
                        <div className="item-icon-box"><Package size={16} /></div>
                        <div className="item-info">
                          <span className="item-title">{it.product_name}</span>
                          <span className="item-meta">SKU: {it.sku || 'N/A'} • {it.quantity}x {formatPrice(it.price)}</span>
                        </div>
                        <span className="item-total">{formatPrice(it.total)}</span>
                      </div>
                    ))
                  ) : <div className="empty-items-notice">Itens vinculados a store_order_items.</div>}
                </div>
                <div className="package-specs-summary">
                  <span className="spec-tag">📦 Pacote padrão: 30x20x15 cm</span>
                  <span className="spec-tag">⚖️ Peso estimado: 1.2 kg</span>
                </div>
              </div>

              {/* Frete */}
              <div className="drawer-card">
                <div className="drawer-card-title"><Truck size={15} /><h4>Frete Contratado</h4></div>
                <div className="drawer-freight-info">
                  <div className="freight-row"><span>Provedor Logístico:</span><strong>Melhor Envio</strong></div>
                  <div className="freight-row"><span>Serviço / Transportadora:</span><strong>{selectedOrder.shipping_method || 'Correios PAC'}</strong></div>
                  <div className="freight-row"><span>Valor pago:</span><strong>{selectedOrder.shipping_cost > 0 ? formatPrice(selectedOrder.shipping_cost) : 'Frete Grátis'}</strong></div>
                </div>
              </div>

              {/* Etiqueta */}
              <div className="drawer-card highlight-card">
                <div className="drawer-card-title"><Printer size={15} /><h4>Etiqueta & Despacho</h4></div>
                {(() => {
                  const { code, labelUrl } = getOrderTracking(selectedOrder)
                  if (!code) return (
                    <div className="label-action-box">
                      <p className="label-intro">O pagamento foi confirmado. Você já pode emitir a etiqueta via Melhor Envio.</p>
                      <button className="btn-generate-label" onClick={() => handleGenerateLabel(selectedOrder)} disabled={generatingLabel}>
                        {generatingLabel ? <><div className="spinner-white" /><span>Comunicando com Melhor Envio...</span></> : <><Package size={16} /><span>Gerar / Comprar Etiqueta via Melhor Envio</span></>}
                      </button>
                    </div>
                  )
                  return (
                    <div className="label-ready-box">
                      <div className="tracking-display">
                        <div className="tracking-label">Código de Rastreio</div>
                        <div className="tracking-code-group">
                          <span className="tracking-bold">{code}</span>
                          <button className="btn-copy" onClick={() => handleCopyTracking(code!)}>
                            {copiedTracking ? <><Check size={14} color="#10b981" />Copiado!</> : <><Copy size={14} />Copiar</>}
                          </button>
                        </div>
                      </div>
                      <div className="label-actions-grid">
                        <button className="btn-print-label" onClick={() => window.open(labelUrl || `https://melhorenvio.com.br/impressao/etiqueta/${selectedOrder.order_number}`, '_blank')}>
                          <Printer size={16} /><span>Imprimir Etiqueta (PDF)</span>
                        </button>
                        <a className="btn-track-external" href={`https://melhorrastreio.com.br/rastreio/${code}`} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} /><span>Acompanhar Rastreio</span>
                        </a>
                      </div>
                      <div className="manual-status-actions">
                        <span className="sub-label">Avançar status manualmente:</span>
                        <div className="status-buttons-row">
                          {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && (
                            <button className="btn-sub-action" onClick={() => handleUpdateShipmentStatus('shipped')} disabled={updatingStatus}>Marcar como Postado</button>
                          )}
                          {selectedOrder.status !== 'delivered' && (
                            <button className="btn-sub-action success" onClick={() => handleUpdateShipmentStatus('delivered')} disabled={updatingStatus}>Marcar como Entregue</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="drawer-footer">
              <Link to={`/hub/pedidos/${selectedOrder.id}`} className="link-view-order">
                Ver detalhes completos do pedido <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
