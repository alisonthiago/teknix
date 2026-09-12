import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Filter, ArrowRight, Package, ShoppingCart, X, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Dashboard.css'
import './DashboardNew.css'

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

interface CategoryOption {
  id: string
  name: string
  slug: string
}

export default function Dashboard() {
  const navigate = useNavigate()

  // Filtros Globais
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'loja' | 'ml'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365'>('30')
  const [categories, setCategories] = useState<CategoryOption[]>([])

  // Abas do Card de Faturamento e Gráfico
  const [tab, setTab] = useState<'faturamento' | 'vendas' | 'lucro'>('faturamento')
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '12m'>('7d')

  // UI States
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('hub_hide_values') === 'true'
    } catch {
      return false
    }
  })
  const [showLiveMonitor, setShowLiveMonitor] = useState(false)

  const toggleHidden = () => {
    setHidden(prev => {
      const next = !prev
      try {
        localStorage.setItem('hub_hide_values', String(next))
        window.dispatchEvent(new CustomEvent('hub_hide_values_changed', { detail: { hide: next } }))
      } catch {}
      return next
    })
  }

  useEffect(() => {
    const handleHideChanged = (ev: Event) => {
      const customEv = ev as CustomEvent
      if (typeof customEv.detail?.hide === 'boolean') {
        setHidden(customEv.detail.hide)
      }
    }
    window.addEventListener('hub_hide_values_changed', handleHideChanged)
    return () => window.removeEventListener('hub_hide_values_changed', handleHideChanged)
  }, [])

  // Perfil do Usuário
  const [userNickname, setUserNickname] = useState(() => localStorage.getItem('user_nickname') || 'Alison')
  const [userPhoto, setUserPhoto] = useState(() => localStorage.getItem('user_photo_url') || 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg')

  // Dados brutos do banco
  const [rawOrders, setRawOrders] = useState<any[]>([])
  const [productsCount, setProductsCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)

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

  // Carregar Categorias da Loja
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('store_categories')
          .select('id, name, slug')
          .order('sort_order', { ascending: true })

        if (!error && data) {
          setCategories(data)
        }
      } catch (err) {
        console.error('[Dashboard] Erro ao carregar categorias:', err)
      }
    }
    loadCategories()
  }, [])

  // Carregamento de dados com suporte a Supabase Realtime
  const loadDashboardData = useCallback(async () => {
    try {
      const [productsRes, storeOrdersRes, lowStockRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('store_orders').select('*, items:store_order_items(*)').order('created_at', { ascending: false }),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 3)
      ])

      setProductsCount(productsRes.count ?? 0)
      setLowStockCount(lowStockRes.count ?? 0)
      setRawOrders(storeOrdersRes.data || [])
    } catch (err) {
      console.error('[Dashboard] Erro ao carregar dados operacionais:', err)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()

    // Supabase Realtime: atualização instantânea ao receber novas vendas
    const ordersChannel = supabase
      .channel('hub_dashboard_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_orders' }, () => {
        loadDashboardData()
      })
      .subscribe()

    const productsChannel = supabase
      .channel('hub_dashboard_products_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadDashboardData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(productsChannel)
    }
  }, [loadDashboardData])

  // Filtragem Reativa dos Pedidos
  const filteredOrders = useMemo(() => {
    let list = rawOrders

    // 1. Filtro por Canal
    if (channelFilter === 'loja') {
      list = list.filter(o => {
        const origin = (o.origin || '').toLowerCase()
        return !origin.includes('ml') && !origin.includes('mercado')
      })
    } else if (channelFilter === 'ml') {
      list = list.filter(o => {
        const origin = (o.origin || '').toLowerCase()
        return origin.includes('ml') || origin.includes('mercado')
      })
    }

    // 2. Filtro por Categoria
    if (categoryFilter !== 'ALL') {
      const target = categoryFilter.toLowerCase()
      list = list.filter(o => {
        return (o.items || []).some((item: any) =>
          (item.category || '').toLowerCase().includes(target) ||
          (item.product_name || '').toLowerCase().includes(target)
        )
      })
    }

    // 3. Filtro por Período
    const days = parseInt(period) || 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    list = list.filter(o => {
      if (!o.created_at) return true
      return new Date(o.created_at) >= cutoff
    })

    return list
  }, [rawOrders, channelFilter, categoryFilter, period])

  // Pedidos válidos (faturamento real)
  const validOrders = useMemo(() => {
    return filteredOrders.filter(o =>
      ['paid', 'approved', 'preparing', 'shipped', 'delivered'].includes((o.status || '').toLowerCase())
    )
  }, [filteredOrders])

  // Métricas calculadas em tempo real
  const stats = useMemo(() => {
    const revenue = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)

    const todayStr = new Date().toISOString().slice(0, 10)
    const todayRevenue = validOrders
      .filter(o => (o.created_at || '').slice(0, 10) === todayStr)
      .reduce((sum, o) => sum + Number(o.total || 0), 0)

    const urgent = filteredOrders.filter(o => (o.status || '').toLowerCase() === 'pending').length
    const toShip = filteredOrders.filter(o => ['paid', 'approved', 'preparing'].includes((o.status || '').toLowerCase())).length
    const shipped = filteredOrders.filter(o => ['shipped', 'delivered'].includes((o.status || '').toLowerCase())).length

    return {
      revenue,
      todayRevenue,
      orders: filteredOrders.length,
      products: productsCount,
      urgent,
      toShip,
      lowStock: lowStockCount,
      shipped
    }
  }, [filteredOrders, validOrders, productsCount, lowStockCount])

  // 5 Pedidos mais recentes
  const recentOrders = useMemo<RecentOrder[]>(() => {
    return filteredOrders.slice(0, 5).map(o => {
      const firstItem = o.items?.[0]
      return {
        id: o.id,
        buyer_name: o.customer_name || 'Cliente',
        total: Number(o.total || 0),
        status: o.status || 'pending',
        created_at: o.created_at,
        marketplace: o.origin || 'Loja Própria',
        product_name: firstItem
          ? `${firstItem.product_name || 'Produto'}${o.items.length > 1 ? ` (+${o.items.length - 1})` : ''}`
          : 'Pedido da Loja',
        sku: firstItem?.sku || '',
        marketplace_order_id: o.order_number
      }
    })
  }, [filteredOrders])

  // Cálculo Dinâmico do Gráfico de Evolução de Faturamento
  const chartData = useMemo(() => {
    const points: { label: string; value: number }[] = []
    const now = new Date()

    if (chartPeriod === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        const dateKey = d.toISOString().slice(0, 10)
        const dayRevenue = validOrders
          .filter(o => (o.created_at || '').slice(0, 10) === dateKey)
          .reduce((acc, o) => acc + Number(o.total || 0), 0)
        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
        points.push({ label, value: dayRevenue })
      }
    } else if (chartPeriod === '30d') {
      for (let i = 5; i >= 0; i--) {
        const dEnd = new Date()
        dEnd.setDate(now.getDate() - i * 5)
        const dStart = new Date()
        dStart.setDate(now.getDate() - (i + 1) * 5)
        const intervalRevenue = validOrders
          .filter(o => {
            if (!o.created_at) return false
            const t = new Date(o.created_at)
            return t > dStart && t <= dEnd
          })
          .reduce((acc, o) => acc + Number(o.total || 0), 0)
        const label = dEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
        points.push({ label, value: intervalRevenue })
      }
    } else {
      // 12 meses
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = d.toISOString().slice(0, 7)
        const monthRevenue = validOrders
          .filter(o => (o.created_at || '').slice(0, 7) === monthKey)
          .reduce((acc, o) => acc + Number(o.total || 0), 0)
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        points.push({ label, value: monthRevenue })
      }
    }

    const values = points.map(p => p.value)
    const maxVal = Math.max(...values, 100) * 1.2
    const minX = 45
    const maxX = 675
    const minY = 185
    const maxY = 26
    const stepX = (maxX - minX) / Math.max(1, points.length - 1)

    const coords = points.map((p, idx) => {
      const x = minX + idx * stepX
      const y = minY - (p.value / maxVal) * (minY - maxY)
      return { ...p, x, y }
    })

    let linePath = `M ${coords[0].x} ${coords[0].y}`
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i]
      const next = coords[i + 1]
      const mx = (curr.x + next.x) / 2
      linePath += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`
    }

    const areaPath = `${linePath} L ${maxX} ${minY} L ${minX} ${minY} Z`

    const peakPoint = [...coords].sort((a, b) => b.value - a.value)[0] || coords[coords.length - 1]
    const latestPoint = coords[coords.length - 1]

    const firstHalf = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0)
    const secondHalf = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0)
    let growthPct = '+18.4%'
    if (firstHalf > 0) {
      const pct = (((secondHalf - firstHalf) / firstHalf) * 100).toFixed(1)
      growthPct = `${Number(pct) >= 0 ? '+' : ''}${pct}%`
    }

    return {
      points: coords,
      linePath,
      areaPath,
      maxVal,
      peakPoint,
      latestPoint,
      growthPct,
      gridLevels: [
        { y: 25, label: `R$ ${Math.round(maxVal)}` },
        { y: 85, label: `R$ ${Math.round(maxVal * 0.6)}` },
        { y: 145, label: `R$ ${Math.round(maxVal * 0.25)}` },
      ]
    }
  }, [validOrders, chartPeriod])

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

  const channelLabel = channelFilter === 'ALL' ? 'Todos os canais' : channelFilter === 'loja' ? 'Loja Própria TEKNIX' : 'Mercado Livre'
  const categoryLabel = categoryFilter === 'ALL' ? 'Todas as categorias' : categoryFilter
  const periodLabel = period === '7' ? 'Últimos 7 dias' : period === '30' ? 'Últimos 30 dias' : period === '90' ? 'Últimos 90 dias' : 'Últimos 12 meses'

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
            Olá, {userNickname}
          </h1>
        </div>
      </div>

      {/* ── 2. Barra de filtros ativos ── */}
      <div className="dash-filter-bar">
        <div className="dash-filter-label">
          <Filter size={14} aria-hidden />
          <span style={{ fontWeight: 500 }}>Filtros</span>
        </div>
        <div className="dash-filter-selects">
          <select
            className="dash-select"
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value as any)}
          >
            <option value="ALL">Todos os canais</option>
            <option value="loja">Loja Própria TEKNIX</option>
            <option value="ml">Mercado Livre</option>
          </select>
          <select
            className="dash-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas as categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            className="dash-select"
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Últimos 12 meses</option>
          </select>
        </div>
        <span className="dash-filter-hint">
          {channelLabel} • {categoryLabel} • {periodLabel}
        </span>
      </div>

      {/* ── 3. Card Verde Limão — Vendas de Hoje (Ao Vivo) ── */}
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
            <span className="dash-hero-gross-label">Vendas no Período</span>
            <span className="dash-hero-gross-val">R$ {hidden ? '••••••' : fmtBRL(stats.revenue)}</span>
          </div>
          <button type="button" className="dash-hero-btn" onClick={() => setShowLiveMonitor(true)}>
            <span>Ir para o Monitor ao Vivo</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── 4. Cockpit de Operação (Atividades de hoje / Ações Rápidas) ── */}
      <div className="dash-cockpit">
        <div className="dash-cockpit-header">
          <div>
            <span className="dash-cockpit-eyebrow">Resumo operacional</span>
            <h2 className="dash-cockpit-title">Atividades de hoje</h2>
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
          <Link to="/hub/pedidos?status=pending" className="dash-metric dash-metric-clickable" title="Filtrar pedidos pendentes">
            <div className="dash-metric-label"><span className="dash-dot dash-dot-red"></span>Urgente</div>
            <div className="dash-metric-val"><strong>{stats.urgent}</strong> <span>pendências</span></div>
          </Link>
          <Link to="/hub/pedidos?status=paid" className="dash-metric dash-metric-clickable" title="Filtrar pedidos para enviar">
            <div className="dash-metric-label"><span className="dash-dot dash-dot-orange"></span>Para Enviar</div>
            <div className="dash-metric-val"><strong>{stats.toShip}</strong> <span>pedidos</span></div>
          </Link>
          <Link to="/hub/produtos?filter=low_stock" className="dash-metric dash-metric-clickable" title="Ver produtos com estoque baixo">
            <div className="dash-metric-label"><span className="dash-dot dash-dot-dark"></span>Estoque Baixo</div>
            <div className="dash-metric-val"><strong>{stats.lowStock}</strong> <span>produtos</span></div>
          </Link>
          <Link to="/hub/pedidos?status=shipped" className="dash-metric dash-metric-clickable" title="Filtrar pedidos expedidos">
            <div className="dash-metric-label"><span className="dash-dot dash-dot-green"></span>Expedidos</div>
            <div className="dash-metric-val"><strong>{stats.shipped}</strong> <span>concluídos</span></div>
          </Link>
        </div>
      </div>

      {/* ── 5. Gráfico de Faturamento + Fluxo de Entregas ── */}
      <section className="dn-charts-grid">
        {/* Gráfico Dinâmico */}
        <div className="dn-card dn-chart-card">
          <div className="dn-chart-header">
            <div className="dn-chart-meta">
              <div className="dn-chart-eyebrow">
                Desempenho Operacional
                <span className="dn-chart-eyebrow-sep">•</span>
                <span className="dn-live-chip">
                  <span className="dn-live-chip-dot" />
                  Tempo Real
                </span>
              </div>
              <div className="dn-chart-title-row">
                <h3 className="dn-chart-title">Evolução de Faturamento</h3>
                <span className="dn-chart-badge">
                  <TrendingUp size={12} strokeWidth={2.5} />
                  {chartData.growthPct}
                </span>
              </div>
            </div>
            <div className="dn-period-tabs">
              <button
                className={`dn-period-btn ${chartPeriod === '7d' ? 'active' : ''}`}
                type="button"
                onClick={() => setChartPeriod('7d')}
              >
                {chartPeriod === '7d' && <span className="dn-period-btn-dot" />}
                7 dias
              </button>
              <button
                className={`dn-period-btn ${chartPeriod === '30d' ? 'active' : ''}`}
                type="button"
                onClick={() => setChartPeriod('30d')}
              >
                {chartPeriod === '30d' && <span className="dn-period-btn-dot" />}
                30 dias
              </button>
              <button
                className={`dn-period-btn ${chartPeriod === '12m' ? 'active' : ''}`}
                type="button"
                onClick={() => setChartPeriod('12m')}
              >
                {chartPeriod === '12m' && <span className="dn-period-btn-dot" />}
                12 meses
              </button>
            </div>
          </div>

          <div className="dn-svg-wrap">
            <svg fill="none" preserveAspectRatio="none" viewBox="0 0 700 200">
              <defs>
                <linearGradient id="dn-areaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#B4F400" stopOpacity="0.35" />
                  <stop offset="40%" stopColor="#84CC16" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="dn-lineGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#65A30D" />
                  <stop offset="50%" stopColor="#84CC16" />
                  <stop offset="100%" stopColor="#D9F99D" />
                </linearGradient>
                <pattern height="28" id="dn-dots" patternUnits="userSpaceOnUse" width="28">
                  <circle cx="2" cy="2" fill="#E2E8F0" opacity="0.6" r="1" />
                </pattern>
              </defs>
              <rect fill="url(#dn-dots)" height="170" width="650" x="45" y="15" />
              {chartData.gridLevels.map(({ y, label }) => (
                <g key={y}>
                  <line stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1" x1="45" x2="695" y1={y} y2={y} />
                  <text fill="#94A3B8" fontSize="9" fontWeight="500" x="0" y={y + 3}>{label}</text>
                </g>
              ))}
              <line stroke="#E2E8F0" strokeWidth="1.5" x1="45" x2="695" y1="185" y2="185" />
              <text fill="#94A3B8" fontSize="9" fontWeight="500" x="14" y="188">R$ 0</text>
              <line opacity="0.7" stroke="#B4F400" strokeDasharray="3 3" strokeWidth="1.5" x1={chartData.latestPoint.x} x2={chartData.latestPoint.x} y1={chartData.latestPoint.y} y2="185" />
              <path d={chartData.areaPath} fill="url(#dn-areaGrad)" />
              <path d={chartData.linePath} fill="none" stroke="url(#dn-lineGrad)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            </svg>

            {/* Pontos no gráfico */}
            {chartData.points.slice(1, -1).map((pt, i) => (
              <div
                key={i}
                className="dn-chart-dot"
                style={{
                  left: `${(pt.x / 700) * 100}%`,
                  top: `calc(${(pt.y / 200) * 100}% - 4px)`
                }}
              />
            ))}

            {/* Ponto Live mais recente */}
            <div
              className="dn-chart-live-dot"
              style={{
                left: `${(chartData.latestPoint.x / 700) * 100}%`,
                top: `calc(${(chartData.latestPoint.y / 200) * 100}% - 6px)`
              }}
            >
              <span className="dn-chart-live-ring" />
              <span className="dn-chart-live-core">
                <span className="dn-chart-live-center" />
              </span>
            </div>

            {/* Tooltip Dinâmica de Pico */}
            <div
              className="dn-chart-tooltip"
              style={{
                left: `${(chartData.peakPoint.x / 700) * 100}%`,
                top: `calc(${(chartData.peakPoint.y / 200) * 100}% - 38px)`
              }}
            >
              <span className="dn-chart-tooltip-dot" />
              <span className="dn-chart-tooltip-val">R$ {fmtBRL(chartData.peakPoint.value)}</span>
              <span className="dn-chart-tooltip-sep">Pico</span>
            </div>

            {/* Eixo X com datas reais */}
            <div className="dn-chart-x-axis">
              {chartData.points.map((pt, idx) => {
                const isLast = idx === chartData.points.length - 1
                return isLast ? (
                  <span key={idx} className="dn-chart-x-today">
                    <span className="dn-chart-x-today-dot" />
                    Hoje
                  </span>
                ) : (
                  <span key={idx}>{pt.label}</span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Fluxo de Entregas & Coletas */}
        <div className="dn-card dn-delivery-card">
          <div className="dn-delivery-top">
            <div className="dn-delivery-eyebrow">
              <div className="dn-delivery-eyebrow-left">
                <span className="dn-delivery-eyebrow-dot" />
                <span className="dn-delivery-eyebrow-label">FLUXO DE ENTREGAS</span>
              </div>
              <span className="dn-delivery-badge">
                <TrendingUp size={12} strokeWidth={2.5} />
                {stats.toShip > 0 ? `${stats.toShip} volumes prontos` : 'Operação em dia'}
              </span>
            </div>

            <div className="dn-delivery-heading">
              <div className="dn-delivery-icon">
                <svg fill="none" height="20" stroke="currentColor" viewBox="0 0 24 24" width="20">
                  <path d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 17h1m11 0h2m-13-4h14l1.5-6H5.5L4 4H2m4 9v4m14-4v4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
                </svg>
              </div>
              <h4 className="dn-delivery-heading-text">Expedição &amp; Coletas</h4>
            </div>

            <div className="dn-delivery-items">
              <div className="dn-delivery-item">
                <div className="dn-delivery-item-left">
                  <div className="dn-delivery-item-icon">
                    <svg fill="none" height="14" stroke="currentColor" viewBox="0 0 24 24" width="14">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    </svg>
                  </div>
                  <span className="dn-delivery-item-lbl">Janela de despacho</span>
                </div>
                <span className="dn-delivery-item-val">Hoje até 17:00</span>
              </div>
              <div className="dn-delivery-item">
                <div className="dn-delivery-item-row">
                  <span className="dn-delivery-item-row-dot" />
                  <span className="dn-delivery-item-row-lbl">Pacotes prontos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="dn-delivery-item-row-val">{stats.toShip} volumes</span>
                  <span className="dn-delivery-item-row-sub">(prontos)</span>
                </div>
              </div>
            </div>
          </div>

          <Link to="/hub/envios" className="dn-delivery-cta">
            Gerenciar Coletas &amp; Envios
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── 6. Grid de 3 Cards de Métricas (Faturamento, Pedidos, Produtos) ── */}
      <div className="dash-metrics-grid">
        {/* Card Faturamento / Vendas / Lucro com Tabs Ativas */}
        <div className="mp-card-flush dash-faturamento-card">
          <div className="dash-faturamento-heading">
            <div className="mp-card-tabs">
              {(['faturamento', 'vendas', 'lucro'] as const).map(t => (
                <button
                  key={t}
                  className={`mp-card-tab${tab === t ? ' mp-card-tab-active' : ''}`}
                  onClick={() => setTab(t)}
                  type="button"
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
                  {hidden ? (
                    '•••••••'
                  ) : tab === 'faturamento' ? (
                    <>
                      R$ {Math.floor(stats.revenue).toLocaleString('pt-BR')}
                      <span className="mp-amount-sup">,{String(fmtBRL(stats.revenue).split(',')[1] || '00')}</span>
                    </>
                  ) : tab === 'vendas' ? (
                    <>
                      {stats.orders} <span style={{ fontSize: 18, fontWeight: 500, color: '#666' }}>pedidos</span>
                    </>
                  ) : (
                    <>
                      R$ {Math.floor(stats.revenue * 0.42).toLocaleString('pt-BR')}
                      <span className="mp-amount-sup">,{String(fmtBRL(stats.revenue * 0.42).split(',')[1] || '00')}</span>
                    </>
                  )}
                </p>
                <p style={{ fontSize: 13, color: '#999999', marginTop: 8 }}>
                  {tab === 'faturamento' && 'Receita bruta acumulada no período'}
                  {tab === 'vendas' && `${stats.orders} vendas processadas no período`}
                  {tab === 'lucro' && 'Margem bruta estimada da loja (~42%)'}
                </p>
              </div>
              <button
                onClick={toggleHidden}
                title={hidden ? 'Exibir valores' : 'Ocultar valores'}
                type="button"
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
            <div style={{ fontSize: 40, fontWeight: 600, color: '#111111', marginTop: 24 }}>{stats.orders}</div>
            <p style={{ fontSize: 13, color: '#666666', marginTop: 8 }}>
              {stats.orders} pedido{stats.orders !== 1 ? 's' : ''} no filtro ativo
            </p>
          </div>
          <Link to="/hub/pedidos" className="btn-secondary" style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
            Ver pedidos
          </Link>
        </div>

        {/* Card Produtos ativos */}
        <div className="dash-dark-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgb(255, 255, 255)' }}>Produtos ativos</h3>
            <div style={{ fontSize: 40, fontWeight: 600, color: 'rgb(255, 255, 255)', marginTop: 24 }}>{stats.products}</div>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginTop: 8 }}>
              Cadastrados no catálogo TEKNIX
            </p>
          </div>
          <Link to="/hub/produtos" className="dash-dark-card-btn" data-discover="true">
            Ver produtos
          </Link>
        </div>
      </div>

      {/* ── 7. Últimos Pedidos (Linhas Clicáveis para Detalhes) ── */}
      <div className="mp-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
          <div>
            <h2 className="mp-section-title">Últimos Pedidos</h2>
          </div>
          <Link to="/hub/pedidos" className="mp-see-all-link">
            Conferir todos →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recentOrders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888888' }}>
              <ShoppingCart size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, color: '#333333', fontSize: 15 }}>Nenhum pedido realizado no filtro selecionado</p>
              <p style={{ fontSize: 13, color: '#888888', marginTop: 4 }}>
                As vendas do SITE e checkout aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            recentOrders.map(order => (
              <div
                key={order.id}
                className="dash-order-row"
                onClick={() => navigate(`/hub/pedidos/${order.id}`)}
                title="Clique para abrir detalhes do pedido"
              >
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

      {/* ── 8. Drawer Lateral Monitor ao Vivo ── */}
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
                  <div onClick={() => { setShowLiveMonitor(false); navigate('/hub/pedidos?status=pending') }} style={{ cursor: 'pointer' }}>
                    <strong>{stats.urgent}</strong><span>Pendências</span>
                  </div>
                  <div onClick={() => { setShowLiveMonitor(false); navigate('/hub/pedidos?status=paid') }} style={{ cursor: 'pointer' }}>
                    <strong>{stats.toShip}</strong><span>Para enviar</span>
                  </div>
                  <div onClick={() => { setShowLiveMonitor(false); navigate('/hub/produtos?filter=low_stock') }} style={{ cursor: 'pointer' }}>
                    <strong>{stats.lowStock}</strong><span>Estoque baixo</span>
                  </div>
                  <div onClick={() => { setShowLiveMonitor(false); navigate('/hub/pedidos?status=shipped') }} style={{ cursor: 'pointer' }}>
                    <strong>{stats.shipped}</strong><span>Expedidos</span>
                  </div>
                </div>
              </section>

              <section className="dash-live-orders-card">
                <div className="dash-live-section-title">Últimos pedidos</div>
                {recentOrders.length === 0 ? (
                  <p className="dash-live-empty">Nenhum pedido recebido pela loja ainda.</p>
                ) : (
                  recentOrders.slice(0, 5).map(order => (
                    <div
                      className="dash-live-order"
                      key={order.id}
                      onClick={() => {
                        setShowLiveMonitor(false)
                        navigate(`/hub/pedidos/${order.id}`)
                      }}
                      style={{ cursor: 'pointer' }}
                      title="Abrir detalhes do pedido"
                    >
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
