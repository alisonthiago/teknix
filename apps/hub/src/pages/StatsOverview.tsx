import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  SlidersHorizontal,
  Info,
  MoreVertical,
  Clock,
  TrendingUp,
  Eye,
  ShoppingBag,
  DollarSign,
  Activity,
  Users,
  Smartphone,
  Laptop,
  ChevronDown,
  RotateCcw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './StatsOverview.css'

interface HubOrder {
  id: string
  total?: number | null
  status?: string | null
  created_at: string
  customer_name?: string | null
  origin?: string | null
}

const INVALID_ORDER_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'cancelado', 'estornado'])

export default function StatsOverview() {
  const [activeTab, setActiveTab] = useState<'general' | 'products' | 'sales' | 'visits' | 'live' | 'coupons'>('general')
  const [period, setPeriod] = useState('7days')
  const [comparison, setComparison] = useState('none')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'loja' | 'ml'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'paid' | 'pending' | 'shipped'>('ALL')
  const [orders, setOrders] = useState<HubOrder[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadOrders() {
      const { data } = await supabase
        .from('store_orders')
        .select('id, total, status, created_at, customer_name, origin')
        .order('created_at', { ascending: false })
        .limit(1000)
      if (mounted && data) {
        setOrders(data as HubOrder[])
        setLastUpdated(new Date())
      }
    }

    loadOrders()
    const interval = window.setInterval(loadOrders, activeTab === 'live' ? 15000 : 60000)
    const channel = supabase
      .channel('hub-statistics-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_orders' }, loadOrders)
      .subscribe()

    return () => {
      mounted = false
      window.clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [activeTab])

  const validOrders = useMemo(
    () => orders.filter(order => !INVALID_ORDER_STATUSES.has((order.status || '').toLowerCase())),
    [orders],
  )

  const periodOrders = useMemo(() => {
    const now = Date.now()
    const start = period === 'today'
      ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      : period === 'yesterday'
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime() - 86400000
        : period === '30days'
          ? now - 30 * 86400000
          : period === 'this_month'
            ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
            : period === 'last_month'
              ? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime()
              : period === 'year'
                ? new Date(new Date().getFullYear(), 0, 1).getTime()
                : now - 7 * 86400000
    const end = period === 'yesterday'
      ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      : period === 'last_month'
        ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
        : Infinity
    return validOrders.filter(order => {
      const time = new Date(order.created_at).getTime()
      if (time < start || time >= end) return false

      if (channelFilter === 'loja') {
        const orig = (order.origin || '').toLowerCase()
        if (orig.includes('ml') || orig.includes('mercado')) return false
      } else if (channelFilter === 'ml') {
        const orig = (order.origin || '').toLowerCase()
        if (!orig.includes('ml') && !orig.includes('mercado')) return false
      }

      if (statusFilter !== 'ALL') {
        const st = (order.status || '').toLowerCase()
        if (statusFilter === 'paid' && !['paid', 'approved', 'preparing'].includes(st)) return false
        if (statusFilter === 'pending' && st !== 'pending') return false
        if (statusFilter === 'shipped' && !['shipped', 'delivered'].includes(st)) return false
      }

      return true
    })
  }, [period, validOrders, channelFilter, statusFilter])

  const metrics = useMemo(() => {
    const revenue = periodOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0)
    const buyers = new Set(periodOrders.map(order => order.customer_name).filter(Boolean)).size
    return {
      orders: periodOrders.length,
      revenue,
      ticket: periodOrders.length ? revenue / periodOrders.length : 0,
      buyers: buyers || periodOrders.length,
    }
  }, [periodOrders])

  const liveOrders = useMemo(() => {
    const cutoff = Date.now() - 5 * 60 * 1000
    return validOrders.filter(order => new Date(order.created_at).getTime() >= cutoff)
  }, [validOrders, lastUpdated])

  const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const updatedLabel = lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'aguardando dados'

  const activeFilterCount = (channelFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0
  const hasAnyCustomFilter = period !== '7days' || comparison !== 'none' || hasActiveFilters

  return (
    <div className="stats-page-container">
      <div className="stats-wrapper">

        {/* Navigation Tabs */}
        <div className="stats-tab-nav" style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 10, overflowX: 'auto' }}>
          {[
            { id: 'general', label: 'Visão geral' },
            { id: 'products', label: 'Produtos' },
            { id: 'sales', label: 'Vendas e clientes' },
            { id: 'visits', label: 'Visitas' },
            { id: 'live', label: 'Tempo real' },
            { id: 'coupons', label: 'Relatório de cupons' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`stats-tab-button ${activeTab === tab.id ? 'is-active' : ''}`}
              style={{
                background: activeTab === tab.id ? '#0f172a' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
                border: '1px solid ' + (activeTab === tab.id ? '#0f172a' : '#e2e8f0'),
                borderRadius: 980,
                padding: '5px 14px',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top Filters Bar */}
        <div className="stats-filter-container">
          <div className="stats-filter-bar">
            <div className="stats-filters-left">
              {/* Filtro de Data */}
              <label className="filter-select-pill" title="Filtrar por período">
                <Calendar size={14} className="filter-pill-icon" />
                <span className="filter-pill-label">Data:</span>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="filter-pill-select raw-select"
                >
                  <option value="today">Hoje</option>
                  <option value="yesterday">Ontem</option>
                  <option value="7days">Últimos 7 dias</option>
                  <option value="30days">Últimos 30 dias</option>
                  <option value="this_month">Este mês</option>
                  <option value="last_month">Mês passado</option>
                  <option value="year">Este ano</option>
                </select>
                <ChevronDown size={13} className="filter-pill-chevron" />
              </label>

              {/* Filtro de Comparação */}
              <label className="filter-select-pill" title="Comparar períodos">
                <Activity size={14} className="filter-pill-icon" />
                <span className="filter-pill-label">Comparação:</span>
                <select
                  value={comparison}
                  onChange={(e) => setComparison(e.target.value)}
                  className="filter-pill-select raw-select"
                >
                  <option value="none">Nenhuma</option>
                  <option value="prev_period">Período anterior</option>
                  <option value="prev_year">Mesmo período do ano anterior</option>
                </select>
                <ChevronDown size={13} className="filter-pill-chevron" />
              </label>

              {/* Botão Filtros */}
              <button
                type="button"
                className={`filter-btn-pill ${showAdvancedFilters ? 'active' : ''}`}
                onClick={() => setShowAdvancedFilters(prev => !prev)}
                title="Filtrar por canal e status"
              >
                <SlidersHorizontal size={14} className="filter-pill-icon" />
                <span>Filtros</span>
                {hasActiveFilters && <span className="filter-pill-badge">{activeFilterCount}</span>}
              </button>
            </div>

            {hasAnyCustomFilter && (
              <button
                type="button"
                className="stats-filter-clear-btn"
                onClick={() => {
                  setPeriod('7days')
                  setComparison('none')
                  setChannelFilter('ALL')
                  setStatusFilter('ALL')
                }}
                title="Restaurar filtros padrão"
              >
                <RotateCcw size={12} />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>

          {/* Gaveta expansível de Filtros */}
          {showAdvancedFilters && (
            <div className="stats-advanced-filters-drawer">
              <div className="stats-adv-group">
                <span className="stats-adv-label">Canal:</span>
                <div className="stats-adv-pills">
                  <button
                    type="button"
                    className={`stats-adv-pill ${channelFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setChannelFilter('ALL')}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`stats-adv-pill ${channelFilter === 'loja' ? 'active' : ''}`}
                    onClick={() => setChannelFilter('loja')}
                  >
                    Loja Própria
                  </button>
                  <button
                    type="button"
                    className={`stats-adv-pill ${channelFilter === 'ml' ? 'active' : ''}`}
                    onClick={() => setChannelFilter('ml')}
                  >
                    Mercado Livre
                  </button>
                </div>
              </div>

              <div className="stats-adv-group">
                <span className="stats-adv-label">Status:</span>
                <div className="stats-adv-pills">
                  <button
                    type="button"
                    className={`stats-adv-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('ALL')}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`stats-adv-pill ${statusFilter === 'paid' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('paid')}
                  >
                    Pagos
                  </button>
                  <button
                    type="button"
                    className={`stats-adv-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('pending')}
                  >
                    Pendentes
                  </button>
                  <button
                    type="button"
                    className={`stats-adv-pill ${statusFilter === 'shipped' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('shipped')}
                  >
                    Enviados
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 1. ABA: VISÃO GERAL */}
        {activeTab === 'general' && (
          <>
            <div className="stats-header-row">
              <h2 className="stats-title">Visão geral</h2>
              <div className="stats-timestamp">
                <Clock size={14} /> Atualizado às {updatedLabel}
              </div>
            </div>

            <div className="stats-metrics-grid">
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">Visitas <Info size={14} className="stat-card-info-icon" /></span>
                  <MoreVertical size={16} className="stat-card-dots" />
                </div>
                <div>
                   <div className="stat-card-value">—</div>
                   <div className="stat-card-hint" style={{ marginTop: 4 }}>Fonte de visitas não configurada</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">Vendas <Info size={14} className="stat-card-info-icon" /></span>
                  <MoreVertical size={16} className="stat-card-dots" />
                </div>
                <div>
                   <div className="stat-card-value">{metrics.orders}</div>
                   <div className="stat-card-hint" style={{ marginTop: 4 }}>Pedidos aprovados no período</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">Receita <Info size={14} className="stat-card-info-icon" /></span>
                  <MoreVertical size={16} className="stat-card-dots" />
                </div>
                <div>
                   <div className="stat-card-value">{money(metrics.revenue)}</div>
                   <div className="stat-card-hint" style={{ marginTop: 4 }}>Receita consolidada de todos os canais</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">Ticket médio <Info size={14} className="stat-card-info-icon" /></span>
                  <MoreVertical size={16} className="stat-card-dots" />
                </div>
                <div>
                   <div className="stat-card-value">{money(metrics.ticket)}</div>
                  <div className="stat-card-hint">Valor médio por pedido pago</div>
                </div>
              </div>
            </div>

            <div className="stats-dual-grid">
              <div className="stat-card-large">
                <div className="stat-card-header">
                  <span className="stat-card-label">Comportamento dos visitantes <Info size={14} className="stat-card-info-icon" /></span>
                  <MoreVertical size={16} className="stat-card-dots" />
                </div>
                <div className="visitor-timeline">
                  <div className="visitor-timeline-step visitor-timeline-muted">
                    <div className="visitor-timeline-marker">1</div>
                    <div className="visitor-timeline-content">
                      <span>Visitantes no site</span>
                      <strong>Não disponível</strong>
                      <small>Fonte de visitas ainda não conectada</small>
                    </div>
                  </div>
                  <div className="visitor-timeline-step">
                    <div className="visitor-timeline-marker">2</div>
                    <div className="visitor-timeline-content">
                      <span>Pedidos criados</span>
                      <strong>{metrics.orders}</strong>
                      <small>Pedidos da Loja Própria no período</small>
                    </div>
                  </div>
                  <div className="visitor-timeline-step">
                    <div className="visitor-timeline-marker">3</div>
                    <div className="visitor-timeline-content">
                      <span>Clientes identificados</span>
                      <strong>{metrics.buyers}</strong>
                      <small>Clientes com pedido identificado</small>
                    </div>
                  </div>
                  <div className="visitor-timeline-step visitor-timeline-success">
                    <div className="visitor-timeline-marker">4</div>
                    <div className="visitor-timeline-content">
                      <span>Receita gerada</span>
                      <strong>{money(metrics.revenue)}</strong>
                      <small>Receita consolidada da Loja Própria</small>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--apple-text-secondary, #86868b)', borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
                  O sistema de visitas ainda não está conectado; os eventos abaixo representam o fluxo real de pedidos.
                </div>
              </div>

              <div className="stats-stack-right">
                <div className="stat-card" style={{ minHeight: 'auto' }}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Visitas a vendas <Info size={14} className="stat-card-info-icon" /></span>
                    <MoreVertical size={16} className="stat-card-dots" />
                  </div>
                   <div className="stat-card-value" style={{ color: '#059669' }}>—</div>
                   <div className="stat-card-hint">Visitantes não disponíveis</div>
                </div>

                <div className="stat-card" style={{ minHeight: 'auto' }}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Visitas a carrinhos criados <Info size={14} className="stat-card-info-icon" /></span>
                    <MoreVertical size={16} className="stat-card-dots" />
                  </div>
                   <div className="stat-card-value" style={{ color: '#2563eb' }}>{metrics.orders}</div>
                   <div className="stat-card-hint">Pedidos no período selecionado</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 2. ABA: VISITAS (Print 5) */}
        {activeTab === 'visits' && (
          <>
            <div className="stats-header-row">
              <h2 className="stats-title">Visitas</h2>
            </div>

            <div className="stats-dual-grid">
              <div className="stat-card" style={{ minHeight: 180, justifyContent: 'center', alignItems: 'center' }}>
                <Eye size={36} color="#2563eb" />
                <div className="stat-card-value" style={{ marginTop: 8 }}>—</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Fonte de visitas não configurada</div>
              </div>

              <div className="stat-card" style={{ minHeight: 180 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 10px 0' }}>Visitas ao catálogo</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span>Dados de páginas</span>
                  <strong>Não disponível</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span>Dados de páginas</span>
                  <strong>Não disponível</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0' }}>
                  <span>Dados de páginas</span>
                  <strong>Não disponível</strong>
                </div>
              </div>
            </div>

            <div className="stats-dual-grid">
              <div className="stat-card">
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 12px 0' }}>Ingressos por dispositivo</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Smartphone size={28} color="#2563eb" />
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: 4 }}>—</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Mobile / Celular</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Laptop size={28} color="#7c3aed" />
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: 4 }}>—</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Desktop / Computador</div>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 12px 0' }}>Recorrência de visitantes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Novos visitantes</span>
                    <strong>Não disponível</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Visitantes recorrentes</span>
                    <strong>Não disponível</strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 3. ABA: TEMPO REAL (Print 4) */}
        {activeTab === 'live' && (
          <>
            <div className="stats-header-row">
              <h2 className="stats-title">Tempo real</h2>
            </div>
            <p className="stats-subtitle">Pedidos recebidos nos últimos 5 minutos · atualização automática a cada 15 segundos</p>

            <div className="stats-dual-grid">
              <div className="stat-card" style={{ minHeight: 180 }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 8px 0' }}>Atividade de pedidos (agora)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Pedidos nos últimos 5 min</span><strong>{liveOrders.length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Clientes identificados</span><strong>{new Set(liveOrders.map(order => order.customer_name).filter(Boolean)).size}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Receita recebida</span><strong>{money(liveOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0))}</strong>
                  </div>
                </div>
              </div>

              <div className="stat-card" style={{ minHeight: 180, justifyContent: 'center', alignItems: 'center' }}>
                <Activity size={36} color="#059669" />
                <div className="stat-card-value" style={{ marginTop: 8, color: '#059669' }}>{liveOrders.length}</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Pedidos recebidos nos últimos 5 minutos</div>
              </div>
            </div>
          </>
        )}

        {/* Abas complementares */}
        {(activeTab === 'products' || activeTab === 'sales' || activeTab === 'coupons') && (
          <div className="stat-card" style={{ padding: '32px 24px', textAlign: 'center', color: '#64748b' }}>
            <h3 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 }}>
              {activeTab === 'products' ? 'Produtos' : activeTab === 'sales' ? 'Vendas e clientes' : 'Relatório de cupons'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Dados consolidados e atualizados de acordo com as vendas aprovadas.</p>
          </div>
        )}

      </div>
    </div>
  )
}
