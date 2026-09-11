import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Filter, ArrowRight, Package, ShoppingCart, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

interface RecentOrder {
  id: string
  buyer_name: string
  total: number
  status: string
  created_at: string
  marketplace: string
  product_name: string
  product_image?: string
  sku?: string
  marketplace_order_id?: string
}

export default function Dashboard() {
  const [tab, setTab] = useState<'faturamento' | 'vendas' | 'lucro'>('faturamento')
  const [hidden, setHidden] = useState(false)
  const [showLiveMonitor, setShowLiveMonitor] = useState(false)
  const [period, setPeriod] = useState('30')
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])

  const [userNickname, setUserNickname] = useState(() => localStorage.getItem('user_nickname') || 'Alison')
  const [userPhoto, setUserPhoto] = useState(() => localStorage.getItem('user_photo_url') || 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg')

  useEffect(() => {
    function handleProfileUpdate(e: any) {
      if (e.detail?.photo_url) setUserPhoto(e.detail.photo_url)
      if (e.detail?.nickname || e.detail?.name) {
        setUserNickname(e.detail.nickname || e.detail.name.split(' ')[0])
      }
    }
    window.addEventListener('user_profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('user_profile_updated', handleProfileUpdate)
  }, [])

  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    todayRevenue: 0.00,
    urgent: 0,
    toShip: 0,
    lowStock: 0,
    shipped: 0,
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [productsRes, storeOrdersRes, lowStockRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('store_orders').select('*, items:store_order_items(*)').order('created_at', { ascending: false }),
          supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 3)
        ])

        const ordersList = (storeOrdersRes.data || []) as any[]

        // Faturamento acumulado de pedidos pagos/em processo
        const validOrders = ordersList.filter(o =>
          ['paid', 'approved', 'preparing', 'shipped', 'delivered'].includes((o.status || '').toLowerCase())
        )
        const revenue = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0)

        // Faturamento de hoje
        const todayStr = new Date().toISOString().slice(0, 10)
        const todayRevenue = validOrders
          .filter(o => (o.created_at || '').slice(0, 10) === todayStr)
          .reduce((acc, o) => acc + Number(o.total || 0), 0)

        // Contagens por estágio operacional
        const urgentCount = ordersList.filter(o => (o.status || '').toLowerCase() === 'pending').length
        const toShipCount = ordersList.filter(o => ['paid', 'approved', 'preparing'].includes((o.status || '').toLowerCase())).length
        const shippedCount = ordersList.filter(o => ['shipped', 'delivered'].includes((o.status || '').toLowerCase())).length

        setStats({
          products: productsRes.count ?? 0,
          orders: ordersList.length,
          revenue,
          todayRevenue,
          urgent: urgentCount,
          toShip: toShipCount,
          lowStock: lowStockRes.count ?? 0,
          shipped: shippedCount,
        })

        // 5 pedidos mais recentes
        const recentMapped: RecentOrder[] = ordersList.slice(0, 5).map(o => {
          const firstItem = o.items?.[0]
          return {
            id: o.id,
            buyer_name: o.customer_name || 'Cliente',
            total: Number(o.total || 0),
            status: o.status || 'pending',
            created_at: o.created_at,
            marketplace: o.origin || 'Loja Própria (SITE)',
            product_name: firstItem ? `${firstItem.product_name || 'Produto'}${o.items.length > 1 ? ` (+${o.items.length - 1})` : ''}` : 'Pedido da Loja',
            sku: firstItem?.sku || '',
            marketplace_order_id: o.order_number
          }
        })

        setRecentOrders(recentMapped)
      } catch (err) {
        console.error('[Dashboard] Erro ao carregar dados operacionais:', err)
      }
    }

    loadDashboardData()
  }, [])

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const now = new Date()
  const nowDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  const nowTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      approved: { label: 'Aprovado', cls: 'badge-success' },
      paid: { label: 'Pago', cls: 'badge-success' },
      pending: { label: 'Pendente', cls: 'badge-warn' },
      preparing: { label: 'Preparando', cls: 'badge-blue' },
      shipped: { label: 'Enviado', cls: 'badge-blue' },
      delivered: { label: 'Entregue', cls: 'badge-gray' },
      cancelled: { label: 'Cancelado', cls: 'badge-red' },
    }
    const s = map[status?.toLowerCase()] ?? { label: status, cls: 'badge-gray' }
    return <span className={`dash-badge ${s.cls}`}>{s.label}</span>
  }

  return (
    <div className="dash-page">
      {/* ── 1. Saudação do usuário ── */}
      <div className="dash-welcome">
        <div className="dash-avatar">
          <img
            src={userPhoto}
            alt={userNickname}
            width={56} height={56}
            className="dash-avatar-img"
          />
        </div>
        <div>
          <h1 className="dash-welcome-name">
            Olá, {userNickname} <span className="dash-welcome-emoji" aria-hidden="true">👋</span>
          </h1>
          <p className="dash-welcome-sub">Bem-vindo de volta!</p>
        </div>
      </div>

      {/* ── 2. Barra de filtros ── */}
      <div className="dash-filter-bar">
        <div className="dash-filter-label">
          <Filter size={14} aria-hidden />
          <span style={{ fontWeight: 500 }}>Filtros</span>
        </div>
        <div className="dash-filter-selects">
          <select className="dash-select">
            <option value="ALL">Todos os canais</option>
            <option value="loja">Loja Própria TEKNIX</option>
            <option value="ml">Mercado Livre</option>
          </select>
          <select className="dash-select">
            <option value="ALL">Todas as categorias</option>
            <option value="ferramentas">Ferramentas</option>
            <option value="eletronicos">Eletrônicos</option>
          </select>
          <select className="dash-select" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
        <span className="dash-filter-hint">Loja Própria TEKNIX • Todas as categorias</span>
      </div>

      {/* ── 3. Card Verde Limão — Vendas de Hoje ── */}
      <div className="dash-hero-lime">
        <div className="dash-hero-left">
          <div className="dash-live-icon">
            <span className="dash-ping-wrap">
              <span className="dash-ping-outer"></span>
              <span className="dash-ping-inner"></span>
            </span>
          </div>
          <div>
            <div className="dash-hero-badge-row">
              <span className="dash-hero-label">Vendas de Hoje</span>
              <span className="dash-hero-pill">Ao Vivo</span>
            </div>
            <div className="dash-hero-value">
              <span className="dash-hero-currency">R$</span>
              {hidden
                ? '••••••'
                : fmtBRL(stats.todayRevenue)}
            </div>
            <p className="dash-hero-meta">
              {nowDate}, {nowTime} • Sincronização ativa
            </p>
          </div>
        </div>
        <div className="dash-hero-right">
          <div className="dash-hero-gross">
            <span className="dash-hero-gross-label">Vendas Brutas</span>
            <span className="dash-hero-gross-val">R$ {fmtBRL(stats.revenue)}</span>
          </div>
          <button type="button" className="dash-hero-btn" onClick={() => setShowLiveMonitor(true)}>
            <span>Ir para o Monitor ao Vivo</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── 4. Cockpit de Operação ── */}
      <div className="dash-cockpit">
        <div className="dash-cockpit-header">
          <div>
            <span className="dash-cockpit-eyebrow">Resumo operacional</span>
            <h2 className="dash-cockpit-title">Atividades de hoje</h2>
            <p className="dash-cockpit-sub">Pedidos e estoque da loja.</p>
          </div>
          <div className="dash-cockpit-actions">
            <Link to="/hub/pedidos" className="dash-btn-dark">
              <Package size={13} aria-hidden />
              Ver Pedidos &amp; Etiquetas
            </Link>
            <Link to="/hub/produtos" className="dash-btn-outline">
              Ver Estoque &amp; Catálogo
            </Link>
          </div>
        </div>
        <div className="dash-cockpit-metrics">
          <div className="dash-metric">
            <div className="dash-metric-label"><span className="dash-dot dash-dot-red"></span>Urgente</div>
            <div className="dash-metric-val"><strong>{stats.urgent}</strong> <span>pendências</span></div>
          </div>
          <div className="dash-metric">
            <div className="dash-metric-label"><span className="dash-dot dash-dot-orange"></span>Para Enviar</div>
            <div className="dash-metric-val"><strong>{stats.toShip}</strong> <span>pedidos</span></div>
          </div>
          <div className="dash-metric">
            <div className="dash-metric-label"><span className="dash-dot dash-dot-dark"></span>Estoque Baixo</div>
            <div className="dash-metric-val"><strong>{stats.lowStock}</strong> <span>produtos</span></div>
          </div>
          <div className="dash-metric">
            <div className="dash-metric-label"><span className="dash-dot dash-dot-green"></span>Expedidos</div>
            <div className="dash-metric-val"><strong>{stats.shipped}</strong> <span>concluídos</span></div>
          </div>
        </div>
      </div>

      {/* ── 5. Grid de 3 cards métricas ── */}
      <div className="dash-metrics-grid">
        {/* Card Faturamento (tabs) */}
        <div className="mp-card-flush dash-faturamento-card">
          <div className="dash-faturamento-heading">
            <div className="mp-card-tabs">
              {(['faturamento', 'vendas', 'lucro'] as const).map(t => (
                <button
                  key={t}
                  className={`mp-card-tab${tab === t ? ' mp-card-tab-active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '20px 24px 24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p className="mp-amount">
                  {hidden
                    ? '•••••••'
                    : <>R$ {Math.floor(stats.revenue).toLocaleString('pt-BR')}<span className="mp-amount-sup">,{String(fmtBRL(stats.revenue).split(',')[1])}</span></>}
                </p>
                <p style={{ fontSize: 14, color: '#999999', marginTop: 12 }}>Receita bruta acumulada</p>
              </div>
              <button
                onClick={() => setHidden(!hidden)}
                style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Link to="/hub/financeiro" className="btn-primary" style={{ fontSize: 14, padding: '10px 18px', minHeight: 40 }}>Ver relatório</Link>
              <Link to="/hub/estatisticas" className="btn-secondary" style={{ fontSize: 14, padding: '10px 18px', minHeight: 40 }}>Extrato</Link>
            </div>
          </div>
        </div>

        {/* Card Pedidos */}
        <div className="mp-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333333' }}>Pedidos</h3>
            <p style={{ fontSize: 14, color: '#666666', marginTop: 16, lineHeight: 1.6 }}>
              Você tem <strong style={{ color: '#333333' }}>{stats.orders}</strong> pedidos este mês.
            </p>
          </div>
          <Link to="/hub/pedidos" className="btn-secondary" style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
            Ver pedidos
          </Link>
        </div>

        {/* Card Produtos (dark navy) */}
        <div className="dash-dark-card">
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>Produtos ativos</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 1.6 }}>
              Você tem <strong style={{ color: '#ffffff' }}>{stats.products}</strong> produtos cadastrados.
            </p>
            <div style={{ fontSize: 40, fontWeight: 600, color: '#ffffff', marginTop: 24 }}>{stats.products}</div>
          </div>
          <Link to="/hub/produtos" className="dash-dark-card-btn">
            Ver produtos
          </Link>
        </div>
      </div>

      {/* ── 6. Últimos Pedidos ── */}
      <div className="mp-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
          <div>
            <h2 className="mp-section-title">Últimos Pedidos</h2>
            <p className="mp-list-item-sub" style={{ marginTop: 4 }}>Vendas recentes</p>
          </div>
          <Link to="/hub/pedidos" className="mp-see-all-link">
            Conferir todos →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recentOrders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888888' }}>
              <ShoppingCart size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, color: '#333333', fontSize: 15 }}>Nenhum pedido realizado ainda</p>
              <p style={{ fontSize: 13, color: '#888888', marginTop: 4 }}>
                As vendas do SITE e checkout aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} className="dash-order-row">
                {/* Thumbnail */}
                <div className="dash-order-thumb">
                  {order.product_image
                    ? <img src={order.product_image} alt={order.product_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <ShoppingCart size={18} color="#666" aria-hidden />}
                </div>

                {/* Nome + detalhes */}
                <div className="dash-order-info">
                  <p className="mp-list-item-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.product_name}
                  </p>
                  <div className="dash-order-meta">
                    <span className="dash-order-buyer">{order.buyer_name}</span>
                    {order.sku && <><span className="dash-meta-dot">•</span><span className="dash-order-sku">SKU: {order.sku}</span></>}
                    {statusBadge(order.status)}
                  </div>
                </div>

                {/* ID Marketplace + data */}
                <div className="dash-order-id-col">
                  {order.marketplace_order_id && (
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#111' }}>
                      {order.marketplace_order_id}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#888888', fontWeight: 500 }}>
                    • {fmtDate(order.created_at)}
                  </div>
                </div>

                {/* Marketplace badge + Valor */}
                <div className="dash-order-right">
                  <div className="dash-mp-badge">
                    <span>{order.marketplace || 'Loja Própria'}</span>
                  </div>
                  <span className="dash-order-price">R$ {fmtBRL(order.total)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showLiveMonitor && (
        <div
          className="dash-live-monitor-overlay"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setShowLiveMonitor(false)
          }}
        >
          <aside className="dash-live-monitor-drawer" role="dialog" aria-modal="true" aria-labelledby="dash-live-monitor-title">
            <div className="dash-live-monitor-header">
              <div>
                <span className="dash-live-monitor-eyebrow">Loja Própria TEKNIX</span>
                <h2 id="dash-live-monitor-title">Monitor ao vivo</h2>
              </div>
              <button
                type="button"
                className="dash-live-monitor-close"
                aria-label="Fechar monitor ao vivo"
                onClick={() => setShowLiveMonitor(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dash-live-monitor-body">
              <section className="dash-live-today-card">
                <div className="dash-live-card-label"><span className="dash-live-dot"></span>Vendas de hoje</div>
                <strong>{hidden ? '••••••' : `R$ ${fmtBRL(stats.todayRevenue)}`}</strong>
                <span>{nowDate}, {nowTime}</span>
              </section>

              <section className="dash-live-summary-card">
                <div className="dash-live-section-title">Resumo da loja</div>
                <div className="dash-live-summary-row">
                  <span>Vendas acumuladas</span>
                  <strong>{hidden ? '••••••' : `R$ ${fmtBRL(stats.revenue)}`}</strong>
                </div>
                <div className="dash-live-summary-row">
                  <span>Pedidos recebidos</span>
                  <strong>{stats.orders}</strong>
                </div>
                <div className="dash-live-summary-row">
                  <span>Produtos ativos</span>
                  <strong>{stats.products}</strong>
                </div>
              </section>

              <section className="dash-live-summary-card">
                <div className="dash-live-section-title">Operação agora</div>
                <div className="dash-live-operation-grid">
                  <div><strong>{stats.urgent}</strong><span>Pendências</span></div>
                  <div><strong>{stats.toShip}</strong><span>Para enviar</span></div>
                  <div><strong>{stats.lowStock}</strong><span>Estoque baixo</span></div>
                  <div><strong>{stats.shipped}</strong><span>Expedidos</span></div>
                </div>
              </section>

              <section className="dash-live-orders-card">
                <div className="dash-live-section-title">Últimos pedidos</div>
                {recentOrders.length === 0 ? (
                  <p className="dash-live-empty">Nenhum pedido recebido pela loja ainda.</p>
                ) : (
                  recentOrders.slice(0, 5).map(order => (
                    <div className="dash-live-order" key={order.id}>
                      <div className="dash-live-order-info">
                        <strong>{order.product_name}</strong>
                        <span>{order.buyer_name} • {fmtDate(order.created_at)}</span>
                      </div>
                      <strong>{hidden ? '••••' : `R$ ${fmtBRL(order.total)}`}</strong>
                    </div>
                  ))
                )}
              </section>
            </div>

            <div className="dash-live-monitor-footer">
              <Link to="/hub/estatisticas" className="dash-live-full-link" onClick={() => setShowLiveMonitor(false)}>
                Ver painel completo ao vivo <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
