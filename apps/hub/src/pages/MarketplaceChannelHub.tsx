import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  RefreshCw,
  CheckCircle2,
  Package,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ExternalLink,
  Plus
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  MercadoLivreLogo,
  ShopeeLogo,
  AmazonLogo,
  MagaluLogo,
  WhatsAppLogo,
  IntegrationLogoRenderer
} from '../components/IntegrationLogos'
import './MercadoLivreHub.css'

interface ChannelConfig {
  id: string
  code: string
  name: string
  bgColor: string
  accountName: string
  reputation: string
  stats: {
    activeListings: number | string
    logisticsName: string
    logisticsValue: number | string
    logisticsHint: string
    fastShipName: string
    fastShipValue: string
    fastShipHint: string
    monthlyRevenue: string
    monthlyOrders: string
  }
  idColumnName: string
  idPrefix: string
  products: {
    name: string
    codeId: string
    storeStock: string
    channelStock: string
    storePrice: string
    channelPrice: string
    status: string
  }[]
}

const CHANNELS_MAP: Record<string, ChannelConfig> = {
  'mercado-livre': {
    id: 'mercado-livre',
    code: 'ml',
    name: 'Mercado Livre',
    bgColor: '#FFE600',
    accountName: 'TEKNIX Oficial Brasil',
    reputation: 'Reputação MercadoLíder Platinum • Termômetro Verde Escuro',
    stats: {
      activeListings: 348,
      logisticsName: 'Mercado Envios Full',
      logisticsValue: 192,
      logisticsHint: 'Produtos no galpão Full',
      fastShipName: 'Envios Flex',
      fastShipValue: 'Ativo (SP)',
      fastShipHint: 'Entrega no mesmo dia',
      monthlyRevenue: 'R$ 48.920,00',
      monthlyOrders: '124 pedidos'
    },
    idColumnName: 'MLB (ID Anúncio)',
    idPrefix: 'MLB',
    products: [
      { name: 'Furadeira de Impacto 12V Pro TEKNIX', codeId: 'MLB394819284', storeStock: '45 un', channelStock: '45 un', storePrice: 'R$ 289,90', channelPrice: 'R$ 299,90', status: 'Ativo' },
      { name: 'Microfone De Lapela Sem Fio J6 Pro', codeId: 'MLB7449274490', storeStock: '18 un', channelStock: '18 un', storePrice: 'R$ 119,90', channelPrice: 'R$ 129,90', status: 'Ativo' },
      { name: 'Chave Impacto 21v Bomvink Bom-9966', codeId: 'MLB7441647214', storeStock: '30 un', channelStock: '30 un', storePrice: 'R$ 269,90', channelPrice: 'R$ 279,90', status: 'Ativo' },
      { name: 'Lava Jato Lavadora Portátil 21v Bivolt', codeId: 'MLB2000018111', storeStock: '12 un', channelStock: '12 un', storePrice: 'R$ 279,90', channelPrice: 'R$ 279,90', status: 'Ativo' }
    ]
  },
  'shopee': {
    id: 'shopee',
    code: 'shopee',
    name: 'Shopee',
    bgColor: '#EE4D2D',
    accountName: 'TEKNIX Ferramentas & Tech Oficial',
    reputation: 'Vendedor Indicado Oficial Shopee • 4.9 ★ (1.2k avaliações)',
    stats: {
      activeListings: 280,
      logisticsName: 'Shopee Xpress (Coleta)',
      logisticsValue: 240,
      logisticsHint: 'Coleta diária programada',
      fastShipName: 'Envio em 24h',
      fastShipValue: '99.4%',
      fastShipHint: 'Taxa de envio no prazo',
      monthlyRevenue: 'R$ 32.450,00',
      monthlyOrders: '186 pedidos'
    },
    idColumnName: 'Shopee Item ID',
    idPrefix: 'SHP',
    products: [
      { name: 'Furadeira de Impacto 12V Pro TEKNIX', codeId: 'SHP-992817412', storeStock: '45 un', channelStock: '40 un', storePrice: 'R$ 289,90', channelPrice: 'R$ 289,90', status: 'Ativo' },
      { name: 'Microfone De Lapela Sem Fio J6 Pro', codeId: 'SHP-881726419', storeStock: '18 un', channelStock: '18 un', storePrice: 'R$ 119,90', channelPrice: 'R$ 119,90', status: 'Ativo' },
      { name: 'Jogo de Brocas Titânio 13 Peças', codeId: 'SHP-441928371', storeStock: '50 un', channelStock: '50 un', storePrice: 'R$ 49,90', channelPrice: 'R$ 49,90', status: 'Ativo' }
    ]
  },
  'amazon': {
    id: 'amazon',
    code: 'amazon',
    name: 'Amazon Brasil',
    bgColor: '#232F3E',
    accountName: 'TEKNIX Store Amazon SP',
    reputation: 'Vendedor Prime Qualificado • Buy Box 98%',
    stats: {
      activeListings: 195,
      logisticsName: 'Amazon FBA / DBA',
      logisticsValue: 160,
      logisticsHint: 'Logística integrada Prime',
      fastShipName: 'Entrega Prime 1 Dia',
      fastShipValue: 'Ativo',
      fastShipHint: 'Elegível frete grátis Prime',
      monthlyRevenue: 'R$ 26.800,00',
      monthlyOrders: '78 pedidos'
    },
    idColumnName: 'ASIN Amazon',
    idPrefix: 'B0',
    products: [
      { name: 'Furadeira de Impacto 12V Pro TEKNIX', codeId: 'B0C8K9X2LM', storeStock: '45 un', channelStock: '35 un', storePrice: 'R$ 289,90', channelPrice: 'R$ 309,90', status: 'Ativo' },
      { name: 'Chave Impacto 21v Bomvink Bom-9966', codeId: 'B0D1M4P9QQ', storeStock: '30 un', channelStock: '25 un', storePrice: 'R$ 269,90', channelPrice: 'R$ 289,90', status: 'Ativo' }
    ]
  },
  'magalu': {
    id: 'magalu',
    code: 'magalu',
    name: 'Magalu (Magazine Luiza)',
    bgColor: '#0086FF',
    accountName: 'TEKNIX Oficial Magalu Marketplace',
    reputation: 'Loja Diamante Magalu • Sem reclamações',
    stats: {
      activeListings: 140,
      logisticsName: 'Magalu Entregas',
      logisticsValue: 140,
      logisticsHint: 'Postagem via agência Magalu',
      fastShipName: 'Magalu Express',
      fastShipValue: 'Ativo (Sudeste)',
      fastShipHint: 'Entrega rápida',
      monthlyRevenue: 'R$ 14.120,00',
      monthlyOrders: '42 pedidos'
    },
    idColumnName: 'SKU Magalu',
    idPrefix: 'MGL',
    products: [
      { name: 'Furadeira de Impacto 12V Pro TEKNIX', codeId: 'MGL-TK-12V-PRO', storeStock: '45 un', channelStock: '45 un', storePrice: 'R$ 289,90', channelPrice: 'R$ 299,90', status: 'Ativo' },
      { name: 'Lava Jato Lavadora Portátil 21v', codeId: 'MGL-TK-LAVA-21V', storeStock: '12 un', channelStock: '12 un', storePrice: 'R$ 279,90', channelPrice: 'R$ 289,90', status: 'Ativo' }
    ]
  }
}

export default function MarketplaceChannelHub({ defaultChannel }: { defaultChannel?: string }) {
  const { channelId } = useParams<{ channelId?: string }>()
  const channelKey = (channelId || defaultChannel || 'mercado-livre').toLowerCase()

  const config = CHANNELS_MAP[channelKey] || {
    ...CHANNELS_MAP['mercado-livre'],
    name: channelKey.replace(/-/g, ' ').toUpperCase(),
    accountName: `TEKNIX Oficial (${channelKey})`
  }

  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  function handleSync() {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setSyncSuccess(true)
      setTimeout(() => setSyncSuccess(false), 4000)
    }, 1200)
  }

  return (
    <div className="meli-page-container">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="header-info">
          <h1>{config.name}</h1>
          <p>Sincronização de catálogo, anúncios e estoque integrado ao FLOW.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : `Sincronizar ${config.name}`}
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div style={{ background: '#ecfdf5', color: '#16a34a', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          Catálogo, preços e estoque de {config.name} sincronizados com sucesso em tempo real!
        </div>
      )}

      {/* ── Status Banner com SVG Logo da Empresa ── */}
      <div className="meli-status-banner">
        <div className="meli-status-left">
          <div className="meli-logo-box">
            <IntegrationLogoRenderer code={config.id} size={48} />
          </div>
          <div>
            <div className="meli-account-name">Conta Conectada: {config.accountName}</div>
            <div className="meli-reputation-row">
              <CheckCircle2 size={13} className="text-[#16a34a]" />
              <span>{config.reputation}</span>
            </div>
          </div>
        </div>
        <span className="meli-sync-time">Última sincronização: Há 4 minutos</span>
      </div>

      {/* ── 4 Stats Grid ── */}
      <div className="meli-stats-grid">
        <div className="meli-stat-card">
          <span className="meli-stat-label">Anúncios Ativos</span>
          <div className="meli-stat-val">{config.stats.activeListings}</div>
          <span className="meli-stat-hint">Sincronizados com a loja</span>
        </div>
        <div className="meli-stat-card">
          <span className="meli-stat-label">{config.stats.logisticsName}</span>
          <div className="meli-stat-val">{config.stats.logisticsValue}</div>
          <span className="meli-stat-hint">{config.stats.logisticsHint}</span>
        </div>
        <div className="meli-stat-card">
          <span className="meli-stat-label">{config.stats.fastShipName}</span>
          <div className="meli-stat-val">{config.stats.fastShipValue}</div>
          <span className="meli-stat-hint">{config.stats.fastShipHint}</span>
        </div>
        <div className="meli-stat-card">
          <span className="meli-stat-label">Vendas no Mês</span>
          <div className="meli-stat-val">{config.stats.monthlyRevenue}</div>
          <span className="meli-stat-hint">{config.stats.monthlyOrders}</span>
        </div>
      </div>

      {/* ── Catalog Table Card ── */}
      <div className="meli-card">
        <div className="meli-card-header">
          <div>
            <h2>Produtos Integrados em {config.name}</h2>
            <p>Catálogo e estoque compartilhado em tempo real com o FLOW</p>
          </div>
          <a href="/ao-vivo" className="meli-flow-link">
            <span>Ver no Monitor ao Vivo</span>
            <ArrowUpRight size={13} />
          </a>
        </div>

        <div className="meli-table-wrap">
          <table className="meli-table">
            <thead>
              <tr>
                <th>PRODUTO NA LOJA</th>
                <th>{config.idColumnName}</th>
                <th>ESTOQUE LOJA</th>
                <th>ESTOQUE CANAL</th>
                <th>PREÇO LOJA</th>
                <th>PREÇO CANAL</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {config.products.map((prod, idx) => (
                <tr key={idx}>
                  <td className="meli-prod-name">{prod.name}</td>
                  <td><span className="meli-mlb-id">{prod.codeId}</span></td>
                  <td className="meli-stock">{prod.storeStock}</td>
                  <td className="meli-stock">{prod.channelStock}</td>
                  <td className="meli-price">{prod.storePrice}</td>
                  <td className="meli-price">{prod.channelPrice}</td>
                  <td><span className="badge-success">{prod.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
