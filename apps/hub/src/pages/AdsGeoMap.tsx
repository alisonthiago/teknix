import { useState, useMemo } from 'react'
import { BRAZIL_STATES, WORLD_COUNTRIES, type BrazilStatePath, type WorldCountryPath } from './analyticsMapData'
import { MapPin, Globe, MousePointerClick, Eye, RotateCcw, ZoomIn, ZoomOut, BarChart3 } from 'lucide-react'
import './AdsGeoMap.css'

export interface GeoEvent {
  id: string
  ad_id: string
  event_type: 'impression' | 'click'
  placement: string
  country: string | null
  region: string | null
  city: string | null
  created_at: string
}

interface AdsGeoMapProps {
  events: GeoEvent[]
  totalAdClicks: number
  totalAdViews: number
  onFilterRegion?: (region: string) => void
}

// Normalização dos nomes e siglas para UF do Brasil
const UF_MAP: Record<string, string> = {
  'AC': 'AC', 'ACRE': 'AC',
  'AL': 'AL', 'ALAGOAS': 'AL',
  'AP': 'AP', 'AMAPA': 'AP', 'AMAPÁ': 'AP',
  'AM': 'AM', 'AMAZONAS': 'AM',
  'BA': 'BA', 'BAHIA': 'BA',
  'CE': 'CE', 'CEARA': 'CE', 'CEARÁ': 'CE',
  'DF': 'DF', 'DISTRITO FEDERAL': 'DF', 'BRASILIA': 'DF', 'BRASÍLIA': 'DF',
  'ES': 'ES', 'ESPIRITO SANTO': 'ES', 'ESPÍRITO SANTO': 'ES',
  'GO': 'GO', 'GOIAS': 'GO', 'GOIÁS': 'GO',
  'MA': 'MA', 'MARANHAO': 'MA', 'MARANHÃO': 'MA',
  'MT': 'MT', 'MATO GROSSO': 'MT',
  'MS': 'MS', 'MATO GROSSO DO SUL': 'MS',
  'MG': 'MG', 'MINAS GERAIS': 'MG',
  'PA': 'PA', 'PARA': 'PA', 'PARÁ': 'PA',
  'PB': 'PB', 'PARAIBA': 'PB', 'PARAÍBA': 'PB',
  'PR': 'PR', 'PARANA': 'PR', 'PARANÁ': 'PR',
  'PE': 'PE', 'PERNAMBUCO': 'PE',
  'PI': 'PI', 'PIAUI': 'PI', 'PIAUÍ': 'PI',
  'RJ': 'RJ', 'RIO DE JANEIRO': 'RJ',
  'RN': 'RN', 'RIO GRANDE DO NORTE': 'RN',
  'RS': 'RS', 'RIO GRANDE DO SUL': 'RS',
  'RO': 'RO', 'RONDONIA': 'RO', 'RONDÔNIA': 'RO',
  'RR': 'RR', 'RORAIMA': 'RR',
  'SC': 'SC', 'SANTA CATARINA': 'SC',
  'SP': 'SP', 'SAO PAULO': 'SP', 'SÃO PAULO': 'SP',
  'SE': 'SE', 'SERGIPE': 'SE',
  'TO': 'TO', 'TOCANTINS': 'TO'
}

// Cidades representativas mapeadas para UF caso o evento venha sem region
const CITY_TO_UF: Record<string, string> = {
  'SAO PAULO': 'SP', 'SÃO PAULO': 'SP', 'CAMPINAS': 'SP', 'SANTOS': 'SP', 'RIBEIRAO PRETO': 'SP',
  'RIO DE JANEIRO': 'RJ', 'NITEROI': 'RJ', 'NITERÓI': 'RJ',
  'BELO HORIZONTE': 'MG', 'UBERLANDIA': 'MG', 'UBERLÂNDIA': 'MG',
  'CURITIBA': 'PR', 'LONDRINA': 'PR', 'MARINGA': 'PR',
  'PORTO ALEGRE': 'RS', 'CAXIAS DO SUL': 'RS',
  'FLORIANOPOLIS': 'SC', 'FLORIANÓPOLIS': 'SC', 'JOINVILLE': 'SC',
  'SALVADOR': 'BA', 'FEIRA DE SANTANA': 'BA',
  'FORTALEZA': 'CE', 'RECIFE': 'PE', 'GOIANIA': 'GO', 'GOIÂNIA': 'GO',
  'BRASILIA': 'DF', 'BRASÍLIA': 'DF', 'MANAUS': 'AM', 'BELEM': 'PA', 'BELÉM': 'PA'
}

// Distribuição de benchmark de e-commerce brasileiro para quando o banco ainda não tiver registros geográficos individuais
const BENCHMARK_SHARE: Record<string, number> = {
  SP: 0.38, RJ: 0.14, MG: 0.11, RS: 0.08, PR: 0.07, SC: 0.05,
  BA: 0.035, DF: 0.03, GO: 0.025, PE: 0.02, CE: 0.018, ES: 0.015,
  MT: 0.01, MS: 0.008, PA: 0.007, PB: 0.006, RN: 0.005, AL: 0.004,
  MA: 0.004, PI: 0.003, SE: 0.003, RO: 0.003, TO: 0.002, AC: 0.001,
  AP: 0.001, RR: 0.001
}

function normalizeToUF(regionStr: string | null | undefined, cityStr: string | null | undefined): string | null {
  if (regionStr) {
    const clean = regionStr.trim().toUpperCase()
    if (UF_MAP[clean]) return UF_MAP[clean]
  }
  if (cityStr) {
    const cleanCity = cityStr.trim().toUpperCase()
    if (CITY_TO_UF[cleanCity]) return CITY_TO_UF[cleanCity]
    for (const [c, uf] of Object.entries(CITY_TO_UF)) {
      if (cleanCity.includes(c)) return uf
    }
  }
  return null
}

export default function AdsGeoMap({ events, totalAdClicks, totalAdViews, onFilterRegion }: AdsGeoMapProps) {
  const [mapMode, setMapMode] = useState<'brazil' | 'world'>('brazil')
  const [metricType, setMetricType] = useState<'clicks' | 'impressions'>('clicks')
  const [hoveredState, setHoveredState] = useState<BrazilStatePath | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<WorldCountryPath | null>(null)
  const [selectedUF, setSelectedUF] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Verifica se temos eventos reais geolocalizados
  const realGeoEventsCount = useMemo(() => {
    return events.filter(e => e.region || e.country || e.city).length
  }, [events])

  const useBenchmark = realGeoEventsCount === 0 && (totalAdClicks > 0 || totalAdViews > 0)

  // Estatísticas agregadas por Estado (Brasil)
  const stateStats = useMemo(() => {
    const stats: Record<string, { clicks: number; impressions: number; cities: Record<string, number> }> = {}
    
    // Inicializa todos os 27 estados
    for (const s of BRAZIL_STATES) {
      stats[s.uf] = { clicks: 0, impressions: 0, cities: {} }
    }

    if (!useBenchmark) {
      // Usa eventos reais
      for (const ev of events) {
        const uf = normalizeToUF(ev.region, ev.city)
        if (uf && stats[uf]) {
          if (ev.event_type === 'click') {
            stats[uf].clicks++
            if (ev.city) {
              stats[uf].cities[ev.city] = (stats[uf].cities[ev.city] || 0) + 1
            }
          } else {
            stats[uf].impressions++
          }
        }
      }
    } else {
      // Projeção baseada nos totais reais da tabela ads
      for (const s of BRAZIL_STATES) {
        const share = BENCHMARK_SHARE[s.uf] || 0.002
        stats[s.uf].clicks = Math.round(totalAdClicks * share)
        stats[s.uf].impressions = Math.round(totalAdViews * share)
      }
    }

    return stats
  }, [events, useBenchmark, totalAdClicks, totalAdViews])

  // Estatísticas agregadas por País (Mundo)
  const countryStats = useMemo(() => {
    const stats: Record<string, { clicks: number; impressions: number }> = {}

    for (const ev of events) {
      const c = (ev.country || 'BR').trim().toUpperCase()
      if (!stats[c]) stats[c] = { clicks: 0, impressions: 0 }
      if (ev.event_type === 'click') stats[c].clicks++
      else stats[c].impressions++
    }

    // Se estiver em modo benchmark, coloca o Brasil com os totais
    if (useBenchmark) {
      stats['BRA'] = { clicks: totalAdClicks, impressions: totalAdViews }
      stats['BR'] = { clicks: totalAdClicks, impressions: totalAdViews }
    }

    return stats
  }, [events, useBenchmark, totalAdClicks, totalAdViews])

  // Máximo do metricType para cálculo de cor
  const maxStateValue = useMemo(() => {
    let max = 1
    for (const s of BRAZIL_STATES) {
      const val = metricType === 'clicks' ? stateStats[s.uf].clicks : stateStats[s.uf].impressions
      if (val > max) max = val
    }
    return max
  }, [stateStats, metricType])

  // Ranking ordenado de estados
  const stateRanking = useMemo(() => {
    const list = BRAZIL_STATES.map(s => {
      const st = stateStats[s.uf]
      const clicks = st.clicks
      const impressions = st.impressions
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0'
      const totalMetric = metricType === 'clicks' ? clicks : impressions
      return {
        ...s,
        clicks,
        impressions,
        ctr,
        totalMetric
      }
    })

    list.sort((a, b) => b.totalMetric - a.totalMetric)
    return list
  }, [stateStats, metricType])

  // Total nacional no Brasil
  const totalBrazilMetric = useMemo(() => {
    return stateRanking.reduce((acc, curr) => acc + curr.totalMetric, 0)
  }, [stateRanking])

  // Função para interpolar cor em tons do TEKNIX (#83b700)
  function getStateColor(uf: string, isHovered: boolean, isSelected: boolean) {
    if (isSelected) return '#1e293b'
    const val = metricType === 'clicks' ? stateStats[uf]?.clicks || 0 : stateStats[uf]?.impressions || 0
    if (val === 0) return isHovered ? '#cbd5e1' : '#f1f5f9'

    const ratio = Math.min(1, val / maxStateValue)
    if (isHovered) {
      return '#65a30d' // tom mais vibrante no hover
    }
    if (ratio > 0.75) return '#4d7c0f'
    if (ratio > 0.45) return '#83b700'
    if (ratio > 0.2) return '#a3e635'
    return '#d9f99d'
  }

  function getCountryColor(country: WorldCountryPath, isHovered: boolean) {
    const isBrazil = country.id === 'BRA' || country.name.toLowerCase() === 'brazil'
    const cData = countryStats[country.id] || (isBrazil ? countryStats['BR'] : null)
    const clicks = cData?.clicks || 0

    if (isBrazil) {
      return isHovered ? '#65a30d' : '#83b700'
    }
    if (clicks > 0) {
      return isHovered ? '#3b82f6' : '#93c5fd'
    }
    return isHovered ? '#cbd5e1' : '#e2e8f0'
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <div className="ads-geomap-container">
      {/* Barra de Controles e Alternância de Visualização */}
      <div className="ads-geomap-header">
        <div className="ads-geomap-views">
          <button
            className={`ads-view-btn ${mapMode === 'brazil' ? 'active' : ''}`}
            onClick={() => { setMapMode('brazil'); setSelectedUF(null); }}
          >
            <MapPin size={15} />
            <span>Brasil (Estados & Regiões)</span>
          </button>
          <button
            className={`ads-view-btn ${mapMode === 'world' ? 'active' : ''}`}
            onClick={() => { setMapMode('world'); setSelectedUF(null); }}
          >
            <Globe size={15} />
            <span>Mundo (Países)</span>
          </button>
        </div>

        <div className="ads-geomap-actions">
          <div className="ads-metric-toggle">
            <button
              className={`metric-btn ${metricType === 'clicks' ? 'active' : ''}`}
              onClick={() => setMetricType('clicks')}
            >
              <MousePointerClick size={14} />
              <span>Cliques</span>
            </button>
            <button
              className={`metric-btn ${metricType === 'impressions' ? 'active' : ''}`}
              onClick={() => setMetricType('impressions')}
            >
              <Eye size={14} />
              <span>Impressões</span>
            </button>
          </div>

          <div className="ads-zoom-controls">
            <button
              title="Aproximar zoom"
              onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.2))}
            >
              <ZoomIn size={14} />
            </button>
            <button
              title="Afastar zoom"
              onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
            >
              <ZoomOut size={14} />
            </button>
            <button
              title="Resetar visualização"
              onClick={() => { setZoomLevel(1); setSelectedUF(null); }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {useBenchmark && (
        <div className="ads-geomap-notice">
          <BarChart3 size={15} />
          <span>
            <strong>Projeção de Tráfego Nacional TEKNIX ativa:</strong> O volume total ({totalAdClicks} cliques e {totalAdViews} impressões) está projetado com base na densidade de vendas por estado.
          </span>
        </div>
      )}

      {/* Grade Principal: Mapa SVG Real + Painel Lateral de Desempenho */}
      <div className="ads-geomap-grid">
        {/* Lado Esquerdo: Canvas SVG do Mapa */}
        <div className="ads-geomap-canvas-wrapper">
          {mapMode === 'brazil' ? (
            <div className="ads-svg-viewport" style={{ transform: `scale(${zoomLevel})` }}>
              <svg
                viewBox="0 0 600 600"
                className="ads-vector-map brazil-map"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => { setHoveredState(null); setTooltipPos(null); }}
                aria-label="Mapa do Brasil por estados"
              >
                {/* Sombras suaves e filtros */}
                <defs>
                  <filter id="map-glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                  </filter>
                </defs>

                {/* Traçados Reais dos 27 Estados do Brasil */}
                <g filter="url(#map-glow)">
                  {BRAZIL_STATES.map((state) => {
                    const isHovered = hoveredState?.uf === state.uf
                    const isSelected = selectedUF === state.uf
                    const fillColor = getStateColor(state.uf, isHovered, isSelected)
                    return (
                      <path
                        key={state.uf}
                        id={`state-${state.uf}`}
                        d={state.path}
                        fill={fillColor}
                        stroke={isHovered || isSelected ? '#0f172a' : '#ffffff'}
                        strokeWidth={isHovered || isSelected ? 2 : 1}
                        strokeLinejoin="round"
                        className="ads-state-path"
                        onMouseEnter={() => setHoveredState(state)}
                        onClick={() => {
                          const next = selectedUF === state.uf ? null : state.uf
                          setSelectedUF(next)
                          if (onFilterRegion && next) onFilterRegion(next)
                        }}
                      />
                    )
                  })}
                </g>

                {/* Rótulos com as siglas dos estados principais */}
                {BRAZIL_STATES.map((state) => {
                  const val = metricType === 'clicks' ? stateStats[state.uf]?.clicks : stateStats[state.uf]?.impressions
                  const isVisible = val > 0 || ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'DF', 'PE', 'CE', 'AM'].includes(state.uf)
                  if (!isVisible) return null
                  return (
                    <text
                      key={`lbl-${state.uf}`}
                      x={state.cx}
                      y={state.cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`ads-state-label ${hoveredState?.uf === state.uf ? 'hovered' : ''}`}
                      pointerEvents="none"
                    >
                      {state.uf}
                    </text>
                  )
                })}
              </svg>
            </div>
          ) : (
            <div className="ads-svg-viewport world" style={{ transform: `scale(${zoomLevel})` }}>
              <svg
                viewBox="0 0 960 500"
                className="ads-vector-map world-map"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => { setHoveredCountry(null); setTooltipPos(null); }}
                aria-label="Mapa Global de Países"
              >
                <defs>
                  <filter id="world-shadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
                  </filter>
                </defs>

                <g filter="url(#world-shadow)">
                  {WORLD_COUNTRIES.map((country) => {
                    const isHovered = hoveredCountry?.id === country.id
                    const fillColor = getCountryColor(country, isHovered)
                    return (
                      <path
                        key={country.id}
                        id={`country-${country.id}`}
                        d={country.path}
                        fill={fillColor}
                        stroke={isHovered ? '#0f172a' : '#ffffff'}
                        strokeWidth={isHovered ? 1.5 : 0.6}
                        strokeLinejoin="round"
                        className="ads-country-path"
                        onMouseEnter={() => setHoveredCountry(country)}
                      />
                    )
                  })}
                </g>
              </svg>
            </div>
          )}

          {/* Legenda de Calor */}
          <div className="ads-geomap-legend">
            <span className="legend-label">Densidade ({metricType === 'clicks' ? 'Cliques' : 'Impressões'}):</span>
            <div className="legend-gradient-bar">
              <span className="legend-stop stop-0" title="Sem registros" />
              <span className="legend-stop stop-low" title="Baixo tráfego" />
              <span className="legend-stop stop-mid" title="Médio tráfego" />
              <span className="legend-stop stop-high" title="Alto tráfego" />
            </div>
            <div className="legend-values">
              <span>0</span>
              <span>{Math.round(maxStateValue * 0.3)}</span>
              <span>{Math.round(maxStateValue * 0.7)}</span>
              <span>{maxStateValue}+</span>
            </div>
          </div>

          {/* Tooltip Flutuante com Métricas do Estado / País */}
          {tooltipPos && hoveredState && mapMode === 'brazil' && (
            <div
              className="ads-geomap-tooltip"
              style={{
                left: `${Math.min(tooltipPos.x + 12, 380)}px`,
                top: `${Math.max(10, tooltipPos.y - 80)}px`
              }}
            >
              <div className="tooltip-head">
                <span className="uf-badge">{hoveredState.uf}</span>
                <strong>{hoveredState.name}</strong>
                <span className="region-pill">{hoveredState.region}</span>
              </div>
              <div className="tooltip-metrics">
                <div>
                  <span>Cliques</span>
                  <b>{stateStats[hoveredState.uf]?.clicks || 0}</b>
                </div>
                <div>
                  <span>Impressões</span>
                  <b>{stateStats[hoveredState.uf]?.impressions || 0}</b>
                </div>
                <div>
                  <span>CTR</span>
                  <b>
                    {stateStats[hoveredState.uf]?.impressions
                      ? `${(((stateStats[hoveredState.uf]?.clicks || 0) / stateStats[hoveredState.uf]!.impressions) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </b>
                </div>
                <div>
                  <span>Share</span>
                  <b>
                    {totalBrazilMetric > 0
                      ? `${(((stateStats[hoveredState.uf]?.[metricType] || 0) / totalBrazilMetric) * 100).toFixed(1)}%`
                      : '0%'}
                  </b>
                </div>
              </div>

              {/* Detalhe de cidades se houver */}
              {Object.keys(stateStats[hoveredState.uf]?.cities || {}).length > 0 && (
                <div className="tooltip-cities">
                  <span className="cities-title">Top Cidades:</span>
                  {Object.entries(stateStats[hoveredState.uf]!.cities)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([city, cCount]) => (
                      <div key={city} className="city-row">
                        <span>{city}</span>
                        <b>{cCount} cliques</b>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {tooltipPos && hoveredCountry && mapMode === 'world' && (
            <div
              className="ads-geomap-tooltip"
              style={{
                left: `${Math.min(tooltipPos.x + 12, 450)}px`,
                top: `${Math.max(10, tooltipPos.y - 70)}px`
              }}
            >
              <div className="tooltip-head">
                <Globe size={14} />
                <strong>{hoveredCountry.name}</strong>
              </div>
              <div className="tooltip-metrics">
                <div>
                  <span>Cliques</span>
                  <b>{countryStats[hoveredCountry.id]?.clicks || (hoveredCountry.id === 'BRA' ? totalAdClicks : 0)}</b>
                </div>
                <div>
                  <span>Impressões</span>
                  <b>{countryStats[hoveredCountry.id]?.impressions || (hoveredCountry.id === 'BRA' ? totalAdViews : 0)}</b>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Tabela / Ranking por Regiões e Estados */}
        <div className="ads-geomap-ranking">
          <div className="ranking-header">
            <h3>Top Estados & Regiões</h3>
            <span className="ranking-subtitle">
              {metricType === 'clicks' ? 'Ordenado por volume de cliques' : 'Ordenado por impressões'}
            </span>
          </div>

          <div className="ranking-list">
            {stateRanking.slice(0, 10).map((st, index) => {
              const share = totalBrazilMetric > 0 ? (st.totalMetric / totalBrazilMetric) * 100 : 0
              const isSelected = selectedUF === st.uf
              return (
                <div
                  key={st.uf}
                  className={`ranking-row ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => setHoveredState(st)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => {
                    const next = selectedUF === st.uf ? null : st.uf
                    setSelectedUF(next)
                    if (onFilterRegion && next) onFilterRegion(next)
                  }}
                >
                  <div className="ranking-pos">#{index + 1}</div>
                  <div className="ranking-info">
                    <div className="ranking-title">
                      <span className="ranking-uf-pill">{st.uf}</span>
                      <strong>{st.name}</strong>
                      <span className="ranking-region">{st.region}</span>
                    </div>
                    <div className="ranking-progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.max(4, Math.min(100, (st.totalMetric / maxStateValue) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="ranking-metric">
                    <b>{st.totalMetric}</b>
                    <span>{share.toFixed(1)}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedUF && (
            <div className="ranking-footer-filter">
              <span>Filtrado por <strong>{selectedUF}</strong></span>
              <button onClick={() => { setSelectedUF(null); if (onFilterRegion) onFilterRegion('all'); }}>
                Limpar filtro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
