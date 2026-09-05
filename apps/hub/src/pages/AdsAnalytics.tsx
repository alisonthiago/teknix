import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getPlacementLabel, type Ad } from './AdsList'
import AdsGeoMap, { type GeoEvent } from './AdsGeoMap'
import './AdsAnalytics.css'

export default function AdsAnalytics() {
  const navigate = useNavigate()
  const [ads, setAds] = useState<Ad[]>([])
  const [events, setEvents] = useState<GeoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [country, setCountry] = useState('all')
  const [region, setRegion] = useState('all')
  const [tab, setTab] = useState<'overview' | 'map'>('overview')

  useEffect(() => {
    Promise.all([
      supabase.from('ads').select('*').order('clicks', { ascending: false }),
      supabase.from('ad_events').select('*').order('created_at', { ascending: false }).limit(2000)
    ]).then(([a, e]) => {
      setAds((a.data || []) as Ad[])
      setEvents((e.data || []) as GeoEvent[])
      setLoading(false)
    })
  }, [])

  const countries = useMemo(
    () => [...new Set(events.map(e => e.country).filter(Boolean))] as string[],
    [events]
  )
  const regions = useMemo(
    () => [...new Set(events.filter(e => country === 'all' || e.country === country).map(e => e.region).filter(Boolean))] as string[],
    [events, country]
  )

  const filtered = useMemo(() => {
    const min = period === 'all' ? 0 : Date.now() - Number(period) * 86400000
    return events.filter(
      e => (!min || new Date(e.created_at).getTime() >= min) &&
        (country === 'all' || e.country === country) &&
        (region === 'all' || e.region === region)
    )
  }, [events, period, country, region])

  const detailed = events.length > 0
  const totalClicks = detailed
    ? filtered.filter(e => e.event_type === 'click').length
    : ads.reduce((n, a) => n + (a.clicks || 0), 0)
  const totalViews = detailed
    ? filtered.filter(e => e.event_type === 'impression').length
    : ads.reduce((n, a) => n + (a.impressions || 0), 0)
  const ctr = totalViews ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0'

  const rows = useMemo(() => {
    return ads.map(ad => {
      const own = filtered.filter(e => e.ad_id === ad.id)
      const clicks = detailed ? own.filter(e => e.event_type === 'click').length : (ad.clicks || 0)
      const views = detailed ? own.filter(e => e.event_type === 'impression').length : (ad.impressions || 0)
      return {
        ad,
        clicks,
        views,
        ctr: views ? ((clicks / views) * 100).toFixed(1) : '0.0'
      }
    })
  }, [ads, filtered, detailed])

  return (
    <div className="ads-analytics-page">
      <header className="analytics-header">
        <div>
          <span>PUBLICIDADE</span>
          <h1>Analytics de anúncios</h1>
          <p>Cliques, impressões, CTR e origem geográfica dos acessos.</p>
        </div>
        <button onClick={() => navigate('/hub/ads')}>← Voltar aos anúncios</button>
      </header>

      <div className="analytics-toolbar">
        <div className="analytics-tabs">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
            Visão geral
          </button>
          <button className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>
            Mapa
          </button>
        </div>

        <label>
          Período
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="1">Hoje</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="365">Ano</option>
            <option value="all">Todo o período</option>
          </select>
        </label>

        <label>
          País
          <select
            value={country}
            onChange={e => {
              setCountry(e.target.value)
              setRegion('all')
            }}
          >
            <option value="all">Todos</option>
            {countries.map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>

        <label>
          Região / Estado
          <select value={region} onChange={e => setRegion(e.target.value)}>
            <option value="all">Todas</option>
            {regions.map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="analytics-empty">Carregando dados…</div>
      ) : (
        <>
          <div className="analytics-kpis">
            <article>
              <b>{totalViews}</b>
              <span>Impressões</span>
            </article>
            <article>
              <b>{totalClicks}</b>
              <span>Cliques</span>
            </article>
            <article>
              <b>{ctr}%</b>
              <span>CTR</span>
            </article>
            <article>
              <b>{ads.filter(a => a.is_active).length}</b>
              <span>Anúncios ativos</span>
            </article>
          </div>

          {tab === 'overview' ? (
            <>
              <section className="analytics-panel">
                <h2>Desempenho por anúncio</h2>
                <div className="analytics-table">
                  <div className="analytics-row head">
                    <span>Anúncio</span>
                    <span>Posição</span>
                    <span>Impressões</span>
                    <span>Cliques</span>
                    <span>CTR</span>
                  </div>
                  {rows.map(({ ad, views, clicks, ctr: rowCtr }) => (
                    <div className="analytics-row" key={ad.id}>
                      <strong>{ad.name}</strong>
                      <span>{getPlacementLabel(ad.placement)}</span>
                      <span>{views}</span>
                      <span>{clicks}</span>
                      <b>{rowCtr}%</b>
                    </div>
                  ))}
                </div>
              </section>

              <section className="analytics-panel">
                <h2>Cliques recentes e localização</h2>
                {filtered.filter(e => e.event_type === 'click').length === 0 ? (
                  <p className="analytics-empty">
                    A contagem geral já está ativa. País, região e cidade aparecerão assim que houver registros geográficos detalhados.
                  </p>
                ) : (
                  <div className="analytics-table">
                    <div className="analytics-row event head">
                      <span>Data</span>
                      <span>Anúncio</span>
                      <span>País</span>
                      <span>Região / cidade</span>
                    </div>
                    {filtered
                      .filter(e => e.event_type === 'click')
                      .slice(0, 50)
                      .map(e => (
                        <div className="analytics-row event" key={e.id}>
                          <span>{new Date(e.created_at).toLocaleString('pt-BR')}</span>
                          <span>{ads.find(a => a.id === e.ad_id)?.name || 'Anúncio'}</span>
                          <span>{e.country || 'Não identificado'}</span>
                          <span>{[e.region, e.city].filter(Boolean).join(' / ') || 'Não identificado'}</span>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="analytics-panel analytics-map-panel">
              <h2>Distribuição Geográfica de Acessos</h2>
              <AdsGeoMap
                events={filtered}
                totalAdClicks={totalClicks}
                totalAdViews={totalViews}
                onFilterRegion={uf => setRegion(uf)}
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}
