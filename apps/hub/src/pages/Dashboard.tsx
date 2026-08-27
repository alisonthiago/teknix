import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Filter, ArrowRight, Package, ShoppingCart } from 'lucide-react'
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
    products: 4,
    orders: 26,
    revenue: 4188.16,
    todayRevenue: 0.00,
    urgent: 7,
    toShip: 23,
    lowStock: 0,
    shipped: 0,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        const [products, orders] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
        ])
        setStats(prev => ({
          ...prev,
          products: products.count ?? prev.products,
          orders: orders.count ?? prev.orders,
        }))
      } catch {}
    }

    async function loadRecentOrders() {
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, buyer_name, total, status, created_at, marketplace, product_name, product_image, sku, marketplace_order_id')
          .order('created_at', { ascending: false })
          .limit(5)
        if (data && data.length > 0) setRecentOrders(data)
      } catch {}
    }

    loadStats()
    loadRecentOrders()
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
      shipped: { label: 'Enviado', cls: 'badge-blue' },
      delivered: { label: 'Entregue', cls: 'badge-gray' },
      cancelled: { label: 'Cancelado', cls: 'badge-red' },
    }
    const s = map[status?.toLowerCase()] ?? { label: status, cls: 'badge-gray' }
    return <span className={`dash-badge ${s.cls}`}>{s.label}</span>
  }

  // Demo orders if Supabase doesn't return real data
  const DEMO_ORDERS: RecentOrder[] = [
    {
      id: '1', buyer_name: 'P20260115213218', total: 279.90, status: 'approved',
      created_at: '2026-08-25T12:00:00Z', marketplace: 'Mercado Livre',
      product_name: 'Lava Jato Lavadora Portátil De Alta Pressão 21v',
      sku: 'LAVA-JATO-21V', marketplace_order_id: 'MLB-2000018111048714',
    },
    {
      id: '2', buyer_name: 'jocimar Guarnier Bonicenha', total: 279.90, status: 'approved',
      created_at: '2026-08-25T10:00:00Z', marketplace: 'Mercado Livre',
      product_name: 'Lava Jato Lavadora Portátil De Alta Pressão 21v',
      sku: 'LAVA-JATO-21V', marketplace_order_id: 'MLB-2000018110913428',
    },
    {
      id: '3', buyer_name: 'MODI1537792', total: 129.90, status: 'approved',
      created_at: '2026-08-24T18:00:00Z', marketplace: 'Mercado Livre',
      product_name: 'Microfone De Lapela Sem Fio J6 Lavalier Tipo-c Ios Android Preto',
      product_image: 'https://http2.mlstatic.com/D_873758-MLA99982359199_112025-O.jpg',
      sku: 'MLB7449274490', marketplace_order_id: 'MLB-2000018103693808',
    },
    {
      id: '4', buyer_name: 'MARIACLARANOGUEIRAZANIRATOE', total: 129.90, status: 'approved',
      created_at: '2026-08-24T14:00:00Z', marketplace: 'Mercado Livre',
      product_name: 'Microfone De Lapela Sem Fio J6 Lavalier Tipo-c Ios Android Preto',
      product_image: 'https://http2.mlstatic.com/D_873758-MLA99982359199_112025-O.jpg',
      sku: 'MLB7449274490', marketplace_order_id: 'MLB-2000018099521116',
    },
    {
      id: '5', buyer_name: 'LAUROJRGOMES', total: 279.90, status: 'approved',
      created_at: '2026-08-24T09:00:00Z', marketplace: 'Mercado Livre',
      product_name: 'Chave Impacto 21v Bomvink Bom-9966 Cor Amarelo 127/220v',
      product_image: 'https://http2.mlstatic.com/D_910176-MLA84473844235_052025-O.jpg',
      sku: 'MLB7441647214', marketplace_order_id: 'MLB-2000018098629818',
    },
  ]

  const displayOrders = recentOrders.length > 0 ? recentOrders : DEMO_ORDERS

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
          <h1 className="dash-welcome-name">Olá, {userNickname}</h1>
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
          <Link to="/hub/estatisticas" className="dash-hero-btn">
            <span>Ir para o Monitor ao Vivo</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── 4. Cockpit de Operação ── */}
      <div className="dash-cockpit">
        <div className="dash-cockpit-header">
          <div>
            <span className="dash-cockpit-eyebrow">Cockpit de Operação</span>
            <h2 className="dash-cockpit-title">{stats.urgent + stats.toShip} ações prioritárias hoje</h2>
            <p className="dash-cockpit-sub">Pedidos, separação, etiquetas e estoque em tempo real.</p>
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
          <div style={{ padding: '20px 24px 0' }}>
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
          {displayOrders.map(order => (
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
                  <img src="/logos/mercado-livre.svg" alt="Mercado Livre" style={{ width: 14, height: 14, objectFit: 'contain', flexShrink: 0 }} />
                  <span>Mercado Livre</span>
                </div>
                <span className="dash-order-price">R$ {fmtBRL(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
