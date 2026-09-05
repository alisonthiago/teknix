import { Editable } from '../components/page-widgets/PageWidgets'
/* ==========================================================================
   TEKNIX SITE — HISTÓRICO DE PEDIDOS OFICIAL (1:1 PADRÃO APPLE STORE)
   Referência de design: Identidade Oficial TEKNIX / Apple Store
   Integrado a auth, Supabase orders, tracking, NF-e e CartContext
   ========================================================================== */

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getOrdersByUserId, type Order as DbOrder } from '../services/customer'
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  FileText,
  HelpCircle,
  ShoppingBag,
  ExternalLink,
  MapPin,
  CreditCard,
  X,
  MessageSquare
} from 'lucide-react'
import './OrdersList.css'

interface OrderItemDisplay {
  id: string
  title: string
  sku: string
  price: number
  quantity: number
  img: string
  link: string
}

interface OrderDisplay {
  id: string
  orderNumber: string
  date: string
  timestamp: number
  status: 'delivered' | 'in_transit' | 'preparing' | 'canceled'
  statusLabel: string
  statusMessage: string
  progressStep: number // 1: recebido, 2: pago/preparando, 3: em transporte, 4: entregue
  trackingCode?: string
  trackingUrl?: string
  nfeKey?: string
  carrierName?: string
  shippingAddress: {
    name: string
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    cep: string
  }
  payment: {
    method: string
    subtotal: number
    shipping: number
    discount: number
    total: number
  }
  items: OrderItemDisplay[]
}


function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function OrdersList() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<OrderDisplay[]>([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'in_transit' | 'delivered' | 'canceled'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})

  // Modais de Nota Fiscal e Suporte
  const [activeNfeKey, setActiveNfeKey] = useState<string | null>(null)
  const [showHelpModal, setShowHelpModal] = useState<OrderDisplay | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null)

  // Carrega pedidos reais do usuário do Supabase
  useEffect(() => {
    setOrders([])
    setLoadError('')
    if (!user) { setLoading(false); return }
    let isMounted = true
    setLoading(true)

    getOrdersByUserId(user.id)
      .then((dbOrders: DbOrder[]) => {
        if (!isMounted) return
        if (dbOrders && dbOrders.length > 0) {
          const mapped: OrderDisplay[] = dbOrders.map((o) => {
            const rawStatus = (o.status || 'pending').toLowerCase()
            let status: OrderDisplay['status'] = 'preparing'
            let statusLabel = 'Processando'
            let statusMessage = 'Aguardando confirmação do pedido.'
            let progressStep = 1
            if (['paid', 'preparing', 'processing'].includes(rawStatus)) {
              statusMessage = 'Seu pedido está sendo preparado para envio.'
              progressStep = 2
            }

            if (rawStatus === 'delivered') {
              status = 'delivered'
              statusLabel = 'Entregue'
              statusMessage = 'Entrega finalizada com sucesso.'
              progressStep = 4
            } else if (rawStatus === 'shipped' || rawStatus === 'in_transit') {
              status = 'in_transit'
              statusLabel = 'A caminho'
              statusMessage = o.delivery_estimate ? `Previsão: ${o.delivery_estimate}` : 'Pacote em trânsito para o seu endereço.'
              progressStep = 3
            } else if (rawStatus === 'canceled' || rawStatus === 'cancelled') {
              status = 'canceled'
              statusLabel = 'Cancelado'
              statusMessage = 'Este pedido foi cancelado.'
              progressStep = 1
            }

            const items: OrderItemDisplay[] = (o.items || []).map((it, idx) => ({
              id: it.id || `item-${idx}`,
              title: it.product_name || 'Produto TEKNIX',
              sku: it.product_sku || 'Não informado',
              price: Number(it.price || 0),
              quantity: Number(it.quantity || 1),
              img: it.product_image || '',
              link: it.product_id ? `/produtos/${encodeURIComponent(it.product_id)}` : '/produtos'
            }))

            const dateStr = o.created_at
              ? new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Recente'

            return {
              id: o.order_number || o.id,
              orderNumber: o.order_number || o.id,
              date: dateStr,
              timestamp: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
              status,
              statusLabel,
              statusMessage,
              progressStep,
              trackingCode: o.tracking_code || undefined,
              trackingUrl: o.tracking_code ? `https://rastreamento.correios.com.br` : undefined,
              shippingAddress: {
                name: o.customer_name || user.user_metadata?.full_name || 'Cliente TEKNIX',
                street: o.shipping_address?.street || o.delivery_address || 'Endereço não informado',
                number: o.shipping_address?.number || '',
                neighborhood: o.shipping_address?.neighborhood || '',
                city: o.shipping_address?.city || '',
                state: o.shipping_address?.state || '',
                cep: o.shipping_address?.zip_code || ''
              },
              payment: {
                method: o.payment_method === 'pix' ? 'Pix' : o.payment_method === 'credit_card' ? 'Cartão de Crédito' : 'Pagamento Online',
                subtotal: Number(o.subtotal ?? o.total ?? 0),
                shipping: Number(o.shipping_cost ?? o.shipping ?? 0),
                discount: Number(o.discount || 0),
                total: Number(o.total || 0)
              },
              items
            }
          })

          setOrders(mapped)
        }
      })
      .catch((err) => {
        if (isMounted) setLoadError('Não foi possível carregar seus pedidos. Tente novamente mais tarde.')
        console.warn('Erro ao carregar pedidos do usuário:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user])

  // Filtragem por tab e busca
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filtro de tab
      if (activeTab === 'in_transit' && order.status !== 'in_transit' && order.status !== 'preparing') {
        return false
      }
      if (activeTab === 'delivered' && order.status !== 'delivered') {
        return false
      }
      if (activeTab === 'canceled' && order.status !== 'canceled') {
        return false
      }

      // Filtro de busca
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase().trim()
      const matchNumber = order.orderNumber.toLowerCase().includes(term)
      const matchTracking = order.trackingCode?.toLowerCase().includes(term)
      const matchItem = order.items.some((i) => i.title.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term))
      return matchNumber || matchTracking || matchItem
    })
  }, [orders, activeTab, searchTerm])

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  const handleCopyNfe = (key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2200)
    }
  }

  const handleCopyTracking = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
      setCopiedTracking(code)
      setTimeout(() => setCopiedTracking(null), 2200)
    }
  }

  const handleBuyAgain = (item: OrderItemDisplay) => {
    navigate(item.link)
  }

  return (
    <div className="teknix-orders-page">
      {/* ── LOCAL NAV OFICIAL ESTILO APPLE STORE ── */}
      <div className="teknix-orders-localnav">
        <div className="teknix-orders-container">
          <div className="teknix-orders-localnav-inner">
            <Link to="/conta" className="teknix-orders-localnav-title">Minha conta</Link>
            <nav className="teknix-orders-localnav-links" aria-label="Navegação da conta">
              <Link to="/conta" className="teknix-orders-localnav-link">Visão Geral</Link>
              <Link to="/pedidos" className="teknix-orders-localnav-link active" aria-current="page">Pedidos</Link>
              <Link to="/itens-salvos" className="teknix-orders-localnav-link">Itens Salvos</Link>
              <Link to="/buscar-pedido" className="teknix-orders-localnav-link">Rastrear</Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="teknix-orders-container">
        {/* ── HEADER PRINCIPAL EDITORIAL ── */}
        <header className="teknix-orders-header">
          <div className="teknix-orders-header-text">
            <Editable as="h1" widgetId="orderslist-1" className="teknix-orders-title">Seus pedidos</Editable>
          </div>
          <div className="teknix-orders-header-action">
            <Link to="/buscar-pedido" className="teknix-orders-lookup-btn">
              <Search size={15} />
              Localizar pedido
            </Link>
          </div>
        </header>

        {/* ── BARRA DE CONTROLE: ABAS + CAMPO DE BUSCA ── */}
        <div className="teknix-orders-toolbar">
          <div className="teknix-orders-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`teknix-orders-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Todos <span className="order-tab-count">{orders.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'in_transit'}
              className={`teknix-orders-tab ${activeTab === 'in_transit' ? 'active' : ''}`}
              onClick={() => setActiveTab('in_transit')}
            >
              Em transporte <span className="order-tab-count">{orders.filter(o => o.status === 'in_transit' || o.status === 'preparing').length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'delivered'}
              className={`teknix-orders-tab ${activeTab === 'delivered' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivered')}
            >
              Entregues <span className="order-tab-count">{orders.filter(o => o.status === 'delivered').length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'canceled'}
              className={`teknix-orders-tab ${activeTab === 'canceled' ? 'active' : ''}`}
              onClick={() => setActiveTab('canceled')}
            >
              Cancelados <span className="order-tab-count">{orders.filter(o => o.status === 'canceled').length}</span>
            </button>
          </div>

          <div className="teknix-orders-search-box">
            <Search size={16} className="teknix-orders-search-icon" />
            <input
              type="text"
              placeholder="Buscar por pedido ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="teknix-orders-search-input"
              aria-label="Buscar pedidos"
            />
            {searchTerm && (
              <button
                type="button"
                className="teknix-orders-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── LISTAGEM DOS CARDS DE PEDIDO ── */}
        {loading || authLoading ? (
          <div className="teknix-orders-loading">
            <div className="teknix-orders-spinner" />
            <Editable as="p" widgetId="orderslist-2">Carregando histórico de pedidos...</Editable>
          </div>
        ) : loadError ? <Editable content={{}} as="p" widgetId="orderslist-3" role="alert" className="teknix-orders-empty">{loadError}</Editable> : !user ? <div className="teknix-orders-empty teknix-orders-login-empty"><Editable as="h2" widgetId="orderslist-4">Entre para ver seus pedidos</Editable><Link to="/login" className="teknix-orders-empty-cta">Entrar na minha conta</Link></div> : filteredOrders.length === 0 ? (
          <div className="teknix-orders-empty">
            <div className="teknix-orders-empty-icon">
              <Package size={48} strokeWidth={1.2} />
            </div>
            <Editable as="h2" widgetId="orderslist-5" className="teknix-orders-empty-title">Nenhum pedido encontrado</Editable>
            <Editable content={{}} as="p" widgetId="orderslist-6" className="teknix-orders-empty-desc">
              {searchTerm
                ? 'Nenhum pedido corresponde aos critérios de pesquisa digitados.'
                : 'Você ainda não possui pedidos com esse status.'}
            </Editable>
            <Link to="/produtos" className="teknix-orders-empty-cta">
              Explorar Catálogo de Produtos TEKNIX →
            </Link>
          </div>
        ) : (
          <div className="teknix-orders-list">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders[order.id] === true

              return (
                <article className="teknix-order-card" key={order.id}>
                  {/* Cabeçalho do Card */}
                  <div className="teknix-order-card-header">
                    <div className="teknix-order-card-meta">
                      <div className="meta-block">
                        <span className="meta-label">Data</span>
                        <span className="meta-value">{order.date}</span>
                      </div>
                      <div className="meta-block">
                        <span className="meta-label">Total</span>
                        <span className="meta-value total-highlight">{formatCurrency(order.payment.total)}</span>
                      </div>
                      <div className="meta-block">
                        <span className="meta-label">Número do pedido</span>
                        <div className="meta-order-id">
                          <span className="meta-value id-code">{order.orderNumber}</span>
                          <button
                            type="button"
                            className="btn-copy-id"
                            title="Copiar número do pedido"
                            onClick={() => {
                              navigator.clipboard.writeText(order.orderNumber)
                            }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="teknix-order-card-status-badge-wrap">
                      <span className={`status-pill status-${order.status}`}>
                        {order.status === 'delivered' && <CheckCircle2 size={14} />}
                        {order.status === 'in_transit' && <Truck size={14} />}
                        {order.status === 'preparing' && <Clock size={14} />}
                        {order.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="teknix-order-card-body">
                    {/* Barra de Progresso / Stepper Estilo Apple */}
                    <div className="teknix-order-stepper">
                      <div className="stepper-track">
                        <div
                          className="stepper-fill"
                          style={{
                            width:
                              order.progressStep === 1
                                ? '15%'
                                : order.progressStep === 2
                                ? '45%'
                                : order.progressStep === 3
                                ? '75%'
                                : '100%'
                          }}
                        />
                      </div>
                      <div className="stepper-steps">
                        <div className={`step-node ${order.progressStep >= 1 ? 'completed' : ''}`}>
                          <span className="step-dot" />
                          <span className="step-text">Recebido</span>
                        </div>
                        <div className={`step-node ${order.progressStep >= 2 ? 'completed' : ''}`}>
                          <span className="step-dot" />
                          <span className="step-text">Confirmado</span>
                        </div>
                        <div className={`step-node ${order.progressStep >= 3 ? 'completed' : ''}`}>
                          <span className="step-dot" />
                          <span className="step-text">Em transporte</span>
                        </div>
                        <div className={`step-node ${order.progressStep >= 4 ? 'completed' : ''}`}>
                          <span className="step-dot" />
                          <span className="step-text">Entregue</span>
                        </div>
                      </div>
                    </div>

                    {/* Mensagem de Status em Destaque */}
                    <div className="teknix-order-status-banner">
                      <div className="status-banner-content">
                        {order.status === 'delivered' ? (
                          <CheckCircle2 size={20} className="status-banner-icon success" />
                        ) : order.status === 'in_transit' ? (
                          <Truck size={20} className="status-banner-icon info" />
                        ) : (
                          <Clock size={20} className="status-banner-icon warning" />
                        )}
                        <div>
                          <strong className="status-banner-title">{order.statusMessage}</strong>
                          {order.trackingCode && (
                            <p className="status-banner-tracking">
                              Rastreio:{' '}
                              <span className="tracking-code">{order.trackingCode}</span>
                              <button
                                type="button"
                                className="btn-copy-code"
                                onClick={() => handleCopyTracking(order.trackingCode!)}
                                title="Copiar código"
                              >
                                {copiedTracking === order.trackingCode ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                              </button>
                            </p>
                          )}
                        </div>
                      </div>

                      {order.trackingCode && (
                        <a
                          href={`https://rastreamento.correios.com.br/app/index.php?codigo=${order.trackingCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-track-external"
                        >
                          Rastrear envio
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>

                    {/* Lista de Itens do Pedido */}
                    <div className="teknix-order-items-list">
                      {order.items.map((item) => (
                        <div className="teknix-order-item" key={item.id}>
                          <Link to={item.link} className="item-thumbnail" aria-label={`Ver ${item.title}`}>
                            {item.img ? <img src={item.img} alt={item.title} /> : <Package size={32} aria-label="Imagem indisponível" />}
                          </Link>
                          <div className="item-info">
                            <Link to={item.link} className="item-title">
                              {item.title}
                            </Link>
                            <div className="item-subinfo">
                              <span>SKU: {item.sku}</span>
                              <span className="bullet">•</span>
                              <span>Qtd: {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}</span>
                            </div>
                          </div>
                          <div className="item-actions">
                            <span className="item-price">{formatCurrency(item.price)}</span>
                            <button
                              type="button"
                              className="btn-buy-again"
                              onClick={() => handleBuyAgain(item)}
                              title="Colocar na sacola novamente"
                            >
                              <ShoppingBag size={14} />
                              Comprar novamente
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Alternador de Detalhes Completo */}
                    <button
                      type="button"
                      className="btn-toggle-details"
                      onClick={() => toggleOrder(order.id)}
                    >
                      <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* Painel Expandido: Endereço, Pagamento e Nota Fiscal */}
                    {isExpanded && (
                      <div className="teknix-order-expanded-panel">
                        <div className="detail-col">
                          <h4 className="detail-title">
                            <MapPin size={15} />
                            Endereço de entrega
                          </h4>
                          <p className="detail-text bold">{order.shippingAddress.name}</p>
                          <p className="detail-text">{order.shippingAddress.street} {order.shippingAddress.number}</p>
                          {order.shippingAddress.neighborhood && (
                            <p className="detail-text">{order.shippingAddress.neighborhood}</p>
                          )}
                          <p className="detail-text">
                            {order.shippingAddress.city} {order.shippingAddress.state && `- ${order.shippingAddress.state}`}
                          </p>
                          {order.shippingAddress.cep && <p className="detail-text cep">{order.shippingAddress.cep}</p>}
                        </div>

                        <div className="detail-col">
                          <h4 className="detail-title">
                            <CreditCard size={15} />
                            Pagamento & Valores
                          </h4>
                          <p className="detail-text bold">{order.payment.method}</p>
                          <div className="payment-summary-rows">
                            <div className="summary-row">
                              <span>Subtotal</span>
                              <span>{formatCurrency(order.payment.subtotal)}</span>
                            </div>
                            <div className="summary-row">
                              <span>Frete</span>
                              <span className="free-badge">{order.payment.shipping === 0 ? 'Grátis' : formatCurrency(order.payment.shipping)}</span>
                            </div>
                            {order.payment.discount > 0 && (
                              <div className="summary-row discount">
                                <span>Desconto</span>
                                <span>-{formatCurrency(order.payment.discount)}</span>
                              </div>
                            )}
                            <div className="summary-row total">
                              <span>Total</span>
                              <span>{formatCurrency(order.payment.total)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="detail-col">
                          <h4 className="detail-title">
                            <FileText size={15} />
                            Documento Fiscal & Ajuda
                          </h4>
                          {order.nfeKey ? (
                            <div className="nfe-box">
                              <span className="nfe-label">Nota Fiscal Eletrônica (NF-e)</span>
                              <div className="nfe-key-row">
                                <span className="nfe-key-text">{order.nfeKey.slice(0, 18)}...{order.nfeKey.slice(-6)}</span>
                                <button
                                  type="button"
                                  className="btn-copy-nfe"
                                  onClick={() => handleCopyNfe(order.nfeKey!)}
                                  title="Copiar chave de acesso completa"
                                >
                                  {copiedKey ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                                </button>
                              </div>
                              <button
                                type="button"
                                className="btn-view-nfe"
                                onClick={() => setActiveNfeKey(order.nfeKey!)}
                              >
                                Visualizar DANFE / NF-e
                              </button>
                            </div>
                          ) : (
                            <p className="detail-text muted">NF-e será gerada após emissão na transportadora.</p>
                          )}

                          <button
                            type="button"
                            className="btn-help-order"
                            onClick={() => setShowHelpModal(order)}
                          >
                            <HelpCircle size={14} />
                            Preciso de atendimento neste pedido
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* ── BANNER DE SUPORTE OFICIAL TEKNIX ── */}
        <Editable as="section" widgetId="orderslist-7" className="teknix-orders-support-card">
          <div className="support-card-content">
            <div className="support-icon-wrap">
              <MessageSquare size={28} />
            </div>
            <div className="support-text">
              <Editable as="h3" widgetId="orderslist-8">Precisa de ajuda?</Editable>
              <Editable as="p" widgetId="orderslist-9">Fale com a equipe TEKNIX.</Editable>
            </div>
          </div>
          <div className="support-actions">
            <a
              href="https://wa.me/5546999155875?text=Olá!%20Gostaria%20de%20ajuda%20com%20meu%20pedido%20TEKNIX"
              target="_blank"
              rel="noreferrer"
              className="btn-support-whatsapp"
            >
              Falar no WhatsApp
            </a>
            <Link to="/contato" className="btn-support-contact">
              Central de Atendimento
            </Link>
          </div>
        </Editable>
      </div>

      {/* ── MODAL: ESPELHO DA NOTA FISCAL (DANFE) ── */}
      {activeNfeKey && (
        <div className="teknix-modal-backdrop" onClick={() => setActiveNfeKey(null)}>
          <div className="teknix-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="teknix-modal-header">
              <div className="modal-title-group">
                <FileText size={20} className="modal-title-icon" />
                <Editable as="h3" widgetId="orderslist-10">Nota Fiscal Eletrônica (NF-e)</Editable>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setActiveNfeKey(null)}
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="teknix-modal-body">
              <div className="nfe-preview-card">
                <div className="nfe-preview-top">
                  <div>
                    <strong>TEKNIX FERRAMENTAS & TECNOLOGIA LTDA.</strong>
                    <Editable as="p" widgetId="orderslist-11">CNPJ: 45.129.890/0001-32 • Inscrição Estadual: 083.412.980</Editable>
                    <Editable as="p" widgetId="orderslist-12">Rodovia Governador Mário Covas, Km 281 • Cariacica - ES</Editable>
                  </div>
                  <div className="danfe-badge">
                    <span>DANFE</span>
                    <small>Documento Auxiliar</small>
                  </div>
                </div>

                <div className="nfe-preview-key">
                  <span>Chave de Acesso Oficial da Receita Federal:</span>
                  <code>{activeNfeKey}</code>
                  <button
                    type="button"
                    className="btn-copy-full-key"
                    onClick={() => handleCopyNfe(activeNfeKey)}
                  >
                    {copiedKey ? '✓ Chave Copiada!' : 'Copiar Chave Completa'}
                  </button>
                </div>

                <Editable as="p" widgetId="orderslist-13" className="nfe-notice">
                  A consulta completa da validade e autenticidade jurídica deste documento pode ser efetuada no Portal Nacional da NF-e (www.nfe.fazenda.gov.br) ou junto à SEFAZ autorizadora.
                </Editable>
              </div>
            </div>

            <div className="teknix-modal-footer">
              <a
                href={`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&tipoConteudo=XbSeqxE8pl8=&nfe=${activeNfeKey}`}
                target="_blank"
                rel="noreferrer"
                className="btn-modal-primary"
              >
                Consultar na SEFAZ Nacional
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setActiveNfeKey(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SUPORTE & ATENDIMENTO DO PEDIDO ── */}
      {showHelpModal && (
        <div className="teknix-modal-backdrop" onClick={() => setShowHelpModal(null)}>
          <div className="teknix-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="teknix-modal-header">
              <div className="modal-title-group">
                <HelpCircle size={20} className="modal-title-icon" />
                <Editable content={{}} as="h3" widgetId="orderslist-14">Ajuda com o Pedido {showHelpModal.orderNumber}</Editable>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowHelpModal(null)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="teknix-modal-body">
              <Editable as="p" widgetId="orderslist-15" className="help-intro">
                Selecione o canal de sua preferência para atendimento prioritário sobre o pedido <strong>{showHelpModal.orderNumber}</strong>:
              </Editable>

              <div className="help-options-grid">
                <a
                  href={`https://wa.me/5546999155875?text=Olá!%20Preciso%20de%20ajuda%20com%20meu%20pedido%20${showHelpModal.orderNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="help-tile"
                >
                  <div className="help-tile-icon whatsapp">
                    <MessageSquare size={22} />
                  </div>
                  <div className="help-tile-text">
                    <strong>Atendimento WhatsApp</strong>
                    <span>Resposta média em até 5 minutos em horário comercial</span>
                  </div>
                </a>

                <Link
                  to="/contato"
                  className="help-tile"
                  onClick={() => setShowHelpModal(null)}
                >
                  <div className="help-tile-icon return">
                    <Package size={22} />
                  </div>
                  <div className="help-tile-text">
                    <strong>Trocas e Devoluções</strong>
                    <span>Garantia de 7 dias para devolução e suporte técnico</span>
                  </div>
                </Link>

                <Link
                  to="/contato"
                  className="help-tile"
                  onClick={() => setShowHelpModal(null)}
                >
                  <div className="help-tile-icon mail">
                    <FileText size={22} />
                  </div>
                  <div className="help-tile-text">
                    <strong>Abrir Chamado por E-mail</strong>
                    <span>Envie fotos, documentos ou relatos para a equipe TEKNIX</span>
                  </div>
                </Link>
              </div>
            </div>

            <div className="teknix-modal-footer">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setShowHelpModal(null)}
              >
                Voltar aos pedidos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
