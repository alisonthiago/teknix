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
  Laptop
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './StatsOverview.css'

interface HubOrder {
  id: string
  total?: number | null
  status?: string | null
  created_at: string
  customer_name?: string | null
}

const INVALID_ORDER_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'cancelado', 'estornado'])

export default function StatsOverview() {
  const [activeTab, setActiveTab] = useState<'general' | 'products' | 'sales' | 'visits' | 'live' | 'coupons'>('general')
  const [period, setPeriod] = useState('7days')
  const [comparison, setComparison] = useState('none')
  const [orders, setOrders] = useState<HubOrder[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadOrders() {
      const { data } = await supabase
        .from('store_orders')
        .select('id, total, status, created_at, customer_name')
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
      return time >= start && time < end
    })
  }, [period, validOrders])

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

  return (
    <div className="stats-page-container">
      <div className="stats-wrapper">
        
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1>Estatísticas</h1>
            <p>Métricas de vendas, visitas, conversão e desempenho da loja TEKNIX.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="stats-tab-nav" style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--tk-color-border, #e5e5e7)', paddingBottom: 8, overflowX: 'auto' }}>
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
                background: activeTab === tab.id ? 'var(--tk-color-primary, #0071e3)' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : 'var(--tk-color-text-primary, #1d1d1f)',
                border: '1px solid ' + (activeTab === tab.id ? 'var(--tk-color-primary, #0071e3)' : 'var(--tk-color-border-dark, #d2d2d7)'),
                borderRadius: 980,
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top Filters Bar */}
        <div className="stats-filter-bar">
          <div className="stats-filters-left">
            <div className="filter-select-pill">
              <span style={{ color: '#6b7280' }}>Data:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 600, color: '#000000', outline: 'none', cursor: 'pointer' }}
              >
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="this_month">Este mês</option>
                <option value="last_month">Mês passado</option>
                <option value="year">Este ano</option>
              </select>
              <Calendar size={14} color="#6b7280" />
            </div>

            <div className="filter-select-pill">
              <span style={{ color: '#6b7280' }}>Comparação:</span>
              <select
                value={comparison}
                onChange={(e) => setComparison(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 600, color: '#000000', outline: 'none', cursor: 'pointer' }}
              >
                <option value="none">Nenhuma</option>
                <option value="prev_period">Período anterior</option>
                <option value="prev_year">Mesmo período do ano anterior</option>
              </select>
              <Calendar size={14} color="#6b7280" />
            </div>

            <button className="filter-select-pill" onClick={() => alert('Filtros avançados')}>
              <SlidersHorizontal size={14} /> Filtros
            </button>
          </div>

          <button
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer' }}
            onClick={() => { setPeriod('7days'); setComparison('none') }}
          >
            Apagar filtros
          </button>
        </div>

        {/* 1. ABA: VISÃO GERAL */}
        {activeTab === 'general' && (
          <>
            <div className="stats-header-row">
              <h1 className="stats-title">Visão geral</h1>
              <div className="stats-timestamp">
                <Clock size={14} /> Atualizado às {updatedLabel}
              </div>
            </div>

            <p className="stats-subtitle">
              Exibindo dados de acordo com a <strong>data de criação</strong> do pedido
            </p>

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
                <div className="visitor-funnel visitor-timeline">
                  <div className="visitor-funnel-step">
                    <div className="visitor-funnel-label">
                      <span>Visitantes no site</span><span>Não disponível</span>
                    </div>
                    <div className="visitor-funnel-track"><div className="visitor-funnel-fill blue" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div className="visitor-funnel-step">
                    <div className="visitor-funnel-label">
                      <span>Pedidos criados</span><span>{metrics.orders}</span>
                    </div>
                    <div className="visitor-funnel-track"><div className="visitor-funnel-fill purple" style={{ width: `${Math.min(100, metrics.orders * 4)}%` }}></div>
                    </div>
                  </div>
                  <div className="visitor-funnel-step">
                    <div className="visitor-funnel-label">
                      <span>Clientes identificados</span><span>{metrics.buyers}</span>
                    </div>
                    <div className="visitor-funnel-track"><div className="visitor-funnel-fill orange" style={{ width: `${Math.min(100, metrics.buyers * 4)}%` }}></div>
                    </div>
                  </div>
                  <div className="visitor-funnel-step">
                    <div className="visitor-funnel-label">
                      <span>Receita gerada</span><span>{money(metrics.revenue)}</span>
                    </div>
                    <div className="visitor-funnel-track"><div className="visitor-funnel-fill green" style={{ width: metrics.revenue ? '100%' : '0%' }}></div>
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
              <h1 className="stats-title">Visitas</h1>
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
              <h1 className="stats-title">Tempo real</h1>
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

        {/* Fallback para outras abas */}
        {(activeTab === 'products' || activeTab === 'sales' || activeTab === 'coupons') && (
          <div className="stat-card" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <h3 style={{ color: '#000000', margin: '0 0 8px 0' }}>Relatório Detalhado de {activeTab.toUpperCase()}</h3>
            <p style={{ margin: 0 }}>Todos os dados consolidados e atualizados de acordo com as vendas aprovadas.</p>
          </div>
        )}

      </div>
    </div>
  )
}
