import { useState } from 'react'
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
import './StatsOverview.css'

export default function StatsOverview() {
  const [activeTab, setActiveTab] = useState<'general' | 'products' | 'sales' | 'visits' | 'live' | 'coupons'>('general')
  const [period, setPeriod] = useState('7days')
  const [comparison, setComparison] = useState('none')

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
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--tk-color-border, #e5e5e7)', paddingBottom: 8, overflowX: 'auto' }}>
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
                style={{ border: 'none', background: 'transparent', fontWeight: 600, color: '#111827', outline: 'none', cursor: 'pointer' }}
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
                style={{ border: 'none', background: 'transparent', fontWeight: 600, color: '#111827', outline: 'none', cursor: 'pointer' }}
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
                <Clock size={14} /> Última atualização: 25/08 - 23:44
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
                  <div className="stat-card-value">1.428</div>
                  <div className="stat-card-hint" style={{ color: '#059669', fontWeight: 600, marginTop: 4 }}>+12.4% vs período anterior</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">Vendas <Info size={14} className="stat-card-info-icon" /></span>
                  <MoreVertical size={16} className="stat-card-dots" />
                </div>
                <div>
                  <div className="stat-card-value">34</div>
                  <div className="stat-card-hint" style={{ color: '#059669', fontWeight: 600, marginTop: 4 }}>2.38% taxa de conversão</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">Receita <Info size={14} className="stat-card-info-icon" /></span>
                  <MoreVertical size={16} className="stat-card-dots" />
                </div>
                <div>
                  <div className="stat-card-value">R$ 14.890,00</div>
                  <div className="stat-card-hint" style={{ color: '#059669', fontWeight: 600, marginTop: 4 }}>+18.2% de faturamento</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">Ticket médio <Info size={14} className="stat-card-info-icon" /></span>
                  <MoreVertical size={16} className="stat-card-dots" />
                </div>
                <div>
                  <div className="stat-card-value">R$ 437,94</div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 0' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                      <span>Visitantes no site</span><span>1.428 (100%)</span>
                    </div>
                    <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', background: '#2563eb' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                      <span>Adicionaram ao carrinho</span><span>184 (12.8%)</span>
                    </div>
                    <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: '12.8%', height: '100%', background: '#7c3aed' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                      <span>Iniciaram Checkout</span><span>72 (5.0%)</span>
                    </div>
                    <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: '5.0%', height: '100%', background: '#f59e0b' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                      <span>Pedidos Concluídos</span><span>34 (2.38%)</span>
                    </div>
                    <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: '2.38%', height: '100%', background: '#059669' }}></div>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--apple-text-secondary, #86868b)', borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
                  Funil de conversão da loja em tempo real.
                </div>
              </div>

              <div className="stats-stack-right">
                <div className="stat-card" style={{ minHeight: 'auto' }}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Visitas a vendas <Info size={14} className="stat-card-info-icon" /></span>
                    <MoreVertical size={16} className="stat-card-dots" />
                  </div>
                  <div className="stat-card-value" style={{ color: '#059669' }}>2.38%</div>
                  <div className="stat-card-hint">Média do e-commerce: 1.8%</div>
                </div>

                <div className="stat-card" style={{ minHeight: 'auto' }}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Visitas a carrinhos criados <Info size={14} className="stat-card-info-icon" /></span>
                    <MoreVertical size={16} className="stat-card-dots" />
                  </div>
                  <div className="stat-card-value" style={{ color: '#2563eb' }}>12.88%</div>
                  <div className="stat-card-hint">Taxa de intenção de compra</div>
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
                <div className="stat-card-value" style={{ marginTop: 8 }}>1.428</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Total de Visitas Únicas</div>
              </div>

              <div className="stat-card" style={{ minHeight: 180 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 10px 0' }}>Top 100 visitas ao catálogo</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span>/produtos/parafusadeira-impacto-12v</span>
                  <strong>612 visitas</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span>/produtos/disco-corte-diamantado</span>
                  <strong>384 visitas</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0' }}>
                  <span>/ferramentas-eletricas</span>
                  <strong>245 visitas</strong>
                </div>
              </div>
            </div>

            <div className="stats-dual-grid">
              <div className="stat-card">
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 12px 0' }}>Ingressos por dispositivo</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Smartphone size={28} color="#2563eb" />
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: 4 }}>74%</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Mobile / Celular</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Laptop size={28} color="#7c3aed" />
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: 4 }}>26%</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Desktop / Computador</div>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 12px 0' }}>Recorrência de visitantes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Novos visitantes</span>
                    <strong>82% (1.171)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Visitantes recorrentes</span>
                    <strong>18% (257)</strong>
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
            <p className="stats-subtitle">Atividade nos últimos 5 minutos</p>

            <div className="stats-dual-grid">
              <div className="stat-card" style={{ minHeight: 180 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 8px 0' }}>Comportamento dos visitantes (Agora)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Navegando na Home</span><strong>9 visitantes</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Visualizando Produtos</span><strong>14 visitantes</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>No Carrinho / Checkout</span><strong>3 visitantes</strong>
                  </div>
                </div>
              </div>

              <div className="stat-card" style={{ minHeight: 180, justifyContent: 'center', alignItems: 'center' }}>
                <Activity size={36} color="#059669" />
                <div className="stat-card-value" style={{ marginTop: 8, color: '#059669' }}>26</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Usuários Ativos Agora no Site</div>
              </div>
            </div>
          </>
        )}

        {/* Fallback para outras abas */}
        {(activeTab === 'products' || activeTab === 'sales' || activeTab === 'coupons') && (
          <div className="stat-card" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <h3 style={{ color: '#111827', margin: '0 0 8px 0' }}>Relatório Detalhado de {activeTab.toUpperCase()}</h3>
            <p style={{ margin: 0 }}>Todos os dados consolidados e atualizados de acordo com as vendas aprovadas.</p>
          </div>
        )}

      </div>
    </div>
  )
}

