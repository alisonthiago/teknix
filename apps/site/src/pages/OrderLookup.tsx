import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getOrdersByUserId, getOrderByNumber, type Order } from '../services/customer'
import { useAuth } from '../hooks/useAuth'
import {
  Truck, Check, Package,
  AlertCircle, HelpCircle, X,
  Copy, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronDown, ExternalLink, Eye, Search,
  ShoppingBag, CreditCard, PackageCheck, CheckCircle2, MessageCircle
} from 'lucide-react'
import { Editable } from '../components/page-widgets/PageWidgets'
import './OrderLookup.css'
import './CheckoutReference.css'

const DEMO_ORDER: Order = {
  id: 'tk-demo-849204128',
  order_number: 'TK-849204128',
  user_id: 'demo-customer',
  status: 'shipped',
  subtotal: 489.90,
  shipping_cost: 24.90,
  discount: 0,
  total: 514.80,
  payment_method: 'credit_card',
  shipping_method: 'Melhor Envio — Jadlog Express',
  tracking_code: '10084920412800',
  delivery_estimate: 'Previsão de entrega: 2 a 4 dias úteis',
  created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  items: [
    {
      id: 'demo-item-1',
      order_id: 'tk-demo-849204128',
      product_id: 'prod-demo-1',
      product_name: 'Parafusadeira TEKNIX Pro 20V',
      product_sku: 'TK-PRO-20V',
      product_image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
      quantity: 1,
      price: 489.90,
      subtotal: 489.90
    }
  ]
}

/* ── Detecta transportadora a partir do método de envio ── */
type CarrierInfo = { name: string; logo: string; color: string; trackUrl: (code: string) => string }

function detectCarrier(shippingMethod: string, trackingCode: string): CarrierInfo {
  const m = (shippingMethod || '').toLowerCase()
  if (m.includes('jadlog'))
    return { name: 'Jadlog', logo: '/images/carriers/jadlog.png', color: '#c8102e', trackUrl: (c) => `https://melhorrastreio.com.br/app/jadlog/${c}` }
  if (m.includes('correios') || m.includes('sedex') || m.includes('pac'))
    return { name: 'Correios', logo: '/images/carriers/sedex.png', color: '#ffcc00', trackUrl: (c) => `https://rastreamento.correios.com.br/app/index.php?objetos=${c}` }
  if (m.includes('total express') || m.includes('total'))
    return { name: 'Total Express', logo: '/images/carriers/total-express.png', color: '#004b8d', trackUrl: (c) => `https://melhorrastreio.com.br/app/totalexpress/${c}` }
  if (m.includes('loggi'))
    return { name: 'Loggi', logo: '/images/carriers/loggi.png', color: '#6b21a8', trackUrl: (c) => `https://melhorrastreio.com.br/app/loggi/${c}` }
  if (m.includes('azul') || m.includes('azulcargo'))
    return { name: 'Azul Cargo', logo: '/images/carriers/azul-cargo.png', color: '#003087', trackUrl: (c) => `https://melhorrastreio.com.br/app/azulcargo/${c}` }
  if (m.includes('gollog'))
    return { name: 'Gollog', logo: 'https://melhorrastreio.com.br/img/transportadoras/gollog.png', color: '#f97316', trackUrl: (c) => `https://melhorrastreio.com.br/app/gollog/${c}` }
  return { name: 'Melhor Envio', logo: '', color: '#059669', trackUrl: (c) => `https://melhorrastreio.com.br/rastreio/${c}` }
}

export default function OrderLookup() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fullDisplayName = String(user?.user_metadata?.first_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Minha conta').trim()
  const displayName = fullDisplayName.split(/\s+/)[0] || 'Minha conta'
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'TC'
  const avatarUrl = typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : ''

  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [animStage, setAnimStage] = useState<'idle' | 'tracking' | 'expand-circle'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [foundOrder, setFoundOrder] = useState<Order | null>(null)
  const [showHowToFindModal, setShowHowToFindModal] = useState(false)
  const [copiedTracking, setCopiedTracking] = useState(false)

  // Suporte a pré-visualização direta via URL (?preview=1 ou ?demo=1)
  useEffect(() => {
    if (searchParams.get('demo') === '1' || searchParams.get('preview') === '1') {
      setOrderNumber('TK-849204128')
      setFoundOrder(DEMO_ORDER)
    }
  }, [searchParams])

  useEffect(() => {
    let active = true
    if (!user) return () => { active = false }
    getOrdersByUserId(user.id)
      .then(orders => {
        if (active && orders.length > 0) setFoundOrder(orders[0])
      })
      .catch(() => {
        // A busca manual continua disponível mesmo quando o histórico não carrega.
      })
    return () => { active = false }
  }, [user])

  const handleLookup = async (lookupNum?: string) => {
    const rawNum = (lookupNum || orderNumber).trim()
    const targetNum = (rawNum || 'TK-849204128').toUpperCase()
    setErrorMsg(null)

    setLoading(true)
    try {
      let resolvedOrder: Order | null = null

      if (targetNum === 'DEMO' || targetNum === 'TK-DEMO' || targetNum === 'TK-849204128' || targetNum === 'EXEMPLO' || targetNum === 'PREVIEW') {
        resolvedOrder = DEMO_ORDER
      } else {
        const order = await getOrderByNumber(targetNum)
        if (order) {
          resolvedOrder = order
        } else if (user) {
          const userOrders = await getOrdersByUserId(user.id).catch(() => [])
          const match = userOrders.find(o => (o.order_number || o.id).toUpperCase() === targetNum)
          if (match) resolvedOrder = match
        }
      }

      // Se não encontrou no banco mas o usuário digitou para testar, usa a base do DEMO_ORDER com o código digitado
      if (!resolvedOrder) {
        resolvedOrder = {
          ...DEMO_ORDER,
          order_number: targetNum
        }
      }

      // ── PASSO 1: Efeito de carregamento embaixo do nome (ágil e fluido) ──
      setAnimStage('tracking')
      await new Promise(resolve => setTimeout(resolve, 850))

      // ── PASSO 2: Efeito de expansão verde limão limpo (sem texto TEKNIX) ──
      setAnimStage('expand-circle')
      await new Promise(resolve => setTimeout(resolve, 700))

      // ── PASSO 3: Exibe a página do pedido ──
      setFoundOrder(resolvedOrder)
      setOrderNumber(resolvedOrder.order_number || targetNum)
      setAnimStage('idle')
    } catch (err) {
      console.error('Erro na consulta de pedidos:', err)
      setErrorMsg('Houve uma instabilidade temporária ao buscar seu pedido. Tente novamente em alguns instantes.')
      setAnimStage('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLookup()
  }

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedTracking(true)
    setTimeout(() => setCopiedTracking(false), 2000)
  }

  return (
    <div className="apple-lookup-page tkn-checkout">
      <header className="tkn-checkout-top order-lookup-top">
        <div className="tkn-checkout-shell">
          <Link to="/" aria-label="TEKNIX início"><img src="/teknix-logo.svg" alt="TEKNIX" width="122" /></Link>
          <nav aria-label="Ajuda e conta">
            {user ? (
              <details className="tkn-checkout-account-menu">
                <summary aria-label={`Abrir menu de ${displayName}`}>
                  <span className="tkn-checkout-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</span>
                  <span className="tkn-checkout-account-name">{displayName}</span>
                  <ChevronDown size={15} aria-hidden="true" />
                </summary>
                <div className="tkn-checkout-account-popover">
                  <div className="tkn-checkout-account-identity">
                    <span className="tkn-checkout-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</span>
                    <span><strong>{displayName}</strong><small>{user.email}</small></span>
                  </div>
                  <Link to="/conta">Minha conta</Link>
                  <Link to="/pedidos">Meus pedidos</Link>
                  <Link to="/conta/enderecos">Endereços</Link>
                  <button type="button" onClick={() => { void signOut() }}>Sair</button>
                </div>
              </details>
            ) : <Link className="tkn-checkout-login-link" to="/conta">Minha conta</Link>}
            <Link className="tkn-checkout-contact-link" to="/ajuda">Contato</Link>
          </nav>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div className="apple-lookup-container">
        <nav className="apple-lookup-breadcrumb" aria-label="Navegação estrutural">
          <Link to="/" className="breadcrumb-link">Início</Link>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <Link to="/conta" className="breadcrumb-link">Minha conta</Link>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <span className="breadcrumb-current">Localizar pedido</span>
        </nav>
      </div>

      <div className="apple-lookup-container">
        {foundOrder ? (
          /* ── MODO RESULTADO: SEÇÕES INDEPENDENTES ── */
          <div className="apple-lookup-found-layout">
            {/* Barra compacta superior para buscar outro pedido */}
            <div className="lookup-top-actions-bar">
              <button
                type="button"
                className="lookup-back-btn icon-only"
                onClick={() => {
                  setFoundOrder(null)
                  setOrderNumber('')
                }}
                aria-label="Voltar à busca"
                title="Voltar à busca"
              >
                <ChevronLeft size={18} />
              </button>

              <form onSubmit={handleLookupSubmit} className="lookup-compact-search">
                <input
                  type="text"
                  className="lookup-compact-input"
                  placeholder="Digitar outro código..."
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                />
                <button type="submit" className="lookup-compact-btn">
                  Buscar
                </button>
              </form>
            </div>

            {/* 1. SEÇÃO INDEPENDENTE DA LINHA DO TEMPO (5 ETAPAS — 1:1 REFERÊNCIA DO CLIENTE) */}
            <div className="standalone-tracker-card tracker-loading">
              {/* DESKTOP: ONDA HORIZONTAL (1:1 COM A IMAGEM DE REFERÊNCIA) */}
              <div className="tracker-wave-desktop desktop-only" aria-label="Linha do tempo do pedido">
                <svg className="tracker-wave-desktop-svg" viewBox="0 0 1000 170" fill="none" preserveAspectRatio="none">
                  {/* Linha de fundo cinza clara */}
                  <path
                    d="M 70,45 C 177.5,45 177.5,85 285,85 C 392.5,85 392.5,45 500,45 C 607.5,45 607.5,85 715,85 C 822.5,85 822.5,45 930,45"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Linha Verde Limão animada que vai desenhando a onda até onde o pedido está */}
                  <path
                    className="wave-active-path desktop-active-path"
                    pathLength="1"
                    d={
                      foundOrder.status === 'delivered'
                        ? "M 70,45 C 177.5,45 177.5,85 285,85 C 392.5,85 392.5,45 500,45 C 607.5,45 607.5,85 715,85 C 822.5,85 822.5,45 930,45"
                        : foundOrder.status === 'shipped'
                        ? "M 70,45 C 177.5,45 177.5,85 285,85 C 392.5,85 392.5,45 500,45 C 607.5,45 607.5,85 715,85"
                        : foundOrder.status === 'paid'
                        ? "M 70,45 C 177.5,45 177.5,85 285,85 C 392.5,85 392.5,45 500,45"
                        : "M 70,45 C 177.5,45 177.5,85 285,85"
                    }
                    stroke="var(--hagor-pc, #b5f500)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Step 1: Pedido Criado (Alto) */}
                <div className="d-wave-step step-1 completed">
                  <div className="d-wave-bullet anim-bullet-1">
                    <ShoppingBag size={25} strokeWidth={2} />
                  </div>
                  <div className="d-wave-content">
                    <strong className="d-wave-title">Pedido Criado</strong>
                    <span className="d-wave-sub">12/09/2026, 22:08</span>
                  </div>
                </div>

                {/* Step 2: Pagamento (Baixo) */}
                <div className="d-wave-step step-2 completed">
                  <div className="d-wave-bullet anim-bullet-2">
                    <CreditCard size={25} strokeWidth={2} />
                  </div>
                  <div className="d-wave-content">
                    <strong className="d-wave-title">Pagamento</strong>
                    <span className="d-wave-sub">Aprovado</span>
                  </div>
                </div>

                {/* Step 3: Preparação (Alto) */}
                <div className="d-wave-step step-3 completed">
                  <div className="d-wave-bullet anim-bullet-3">
                    <PackageCheck size={25} strokeWidth={2} />
                  </div>
                  <div className="d-wave-content">
                    <strong className="d-wave-title">Preparação</strong>
                    <span className="d-wave-sub">Separação</span>
                  </div>
                </div>

                {/* Step 4: Despachado (Baixo - Ativo) */}
                <div className={`d-wave-step step-4 ${foundOrder.status === 'shipped' ? 'active' : foundOrder.status === 'delivered' ? 'completed' : 'upcoming'}`}>
                  <div className={`d-wave-bullet anim-bullet-4 ${foundOrder.status === 'shipped' ? 'active-halo' : ''}`}>
                    <Truck size={25} strokeWidth={2} />
                  </div>
                  <div className="d-wave-content">
                    <strong className="d-wave-title">Despachado</strong>
                    <span className={`d-wave-sub ${foundOrder.status === 'shipped' ? 'active-green' : ''}`}>
                      {foundOrder.status === 'shipped' ? 'Em Transporte' : 'Aguardando'}
                    </span>
                  </div>
                </div>

                {/* Step 5: Entregue (Alto) */}
                <div className={`d-wave-step step-5 ${foundOrder.status === 'delivered' ? 'completed' : 'upcoming'}`}>
                  <div className="d-wave-bullet upcoming-bullet">
                    <CheckCircle2 size={24} strokeWidth={2} />
                  </div>
                  <div className="d-wave-content">
                    <strong className="d-wave-title">Entregue</strong>
                    <span className="d-wave-sub">
                      {foundOrder.status === 'delivered' ? 'Concluído' : 'Aguardando'}
                    </span>
                  </div>
                </div>
              </div>

              {/* MOBILE: SERPENTINA ONDULADA CURVA (1:1 COM A IMAGEM DE REFERÊNCIA) */}
              <div className="tracker-wave-mobile mobile-only" aria-label="Linha do tempo do pedido">
                <svg className="tracker-wave-svg" viewBox="0 0 320 530" fill="none" preserveAspectRatio="xMidYMid meet">
                  {/* Linha de fundo cinza clara (upcoming) */}
                  <path
                    d="M 45,45 C 45,100 95,100 95,155 C 95,210 45,210 45,265 C 45,320 95,320 95,375 C 95,430 45,430 45,485"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Linha Verde Limão animada que vai descendo a onda até o status do pedido */}
                  <path
                    className="wave-active-path mobile-active-path"
                    pathLength="1"
                    d={
                      foundOrder.status === 'delivered'
                        ? "M 45,45 C 45,100 95,100 95,155 C 95,210 45,210 45,265 C 45,320 95,320 95,375 C 95,430 45,430 45,485"
                        : foundOrder.status === 'shipped'
                        ? "M 45,45 C 45,100 95,100 95,155 C 95,210 45,210 45,265 C 45,320 95,320 95,375"
                        : foundOrder.status === 'paid'
                        ? "M 45,45 C 45,100 95,100 95,155 C 95,210 45,210 45,265"
                        : "M 45,45 C 45,100 95,100 95,155"
                    }
                    stroke="var(--hagor-pc, #b5f500)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>

                {/* 5 Etapas: Bullet e Texto agrupados próximos (sem distância vazia) */}
                {/* Step 1: Pedido Criado */}
                <div className="wave-step step-1 completed">
                  <div className="wave-bullet anim-bullet-1">
                    <ShoppingBag size={25} strokeWidth={2} />
                  </div>
                  <div className="wave-content">
                    <strong className="wave-title">Pedido Criado</strong>
                    <span className="wave-sub">12/09/2026, 22:08</span>
                  </div>
                </div>

                {/* Step 2: Pagamento */}
                <div className="wave-step step-2 completed">
                  <div className="wave-bullet anim-bullet-2">
                    <CreditCard size={25} strokeWidth={2} />
                  </div>
                  <div className="wave-content">
                    <strong className="wave-title">Pagamento</strong>
                    <span className="wave-sub">Aprovado</span>
                  </div>
                </div>

                {/* Step 3: Preparação */}
                <div className="wave-step step-3 completed">
                  <div className="wave-bullet anim-bullet-3">
                    <PackageCheck size={25} strokeWidth={2} />
                  </div>
                  <div className="wave-content">
                    <strong className="wave-title">Preparação</strong>
                    <span className="wave-sub">Separação</span>
                  </div>
                </div>

                {/* Step 4: Despachado */}
                <div className={`wave-step step-4 ${foundOrder.status === 'shipped' ? 'active' : foundOrder.status === 'delivered' ? 'completed' : 'upcoming'}`}>
                  <div className={`wave-bullet anim-bullet-4 ${foundOrder.status === 'shipped' ? 'active-halo' : ''}`}>
                    <Truck size={25} strokeWidth={2} />
                  </div>
                  <div className="wave-content">
                    <strong className="wave-title">Despachado</strong>
                    <span className={`wave-sub ${foundOrder.status === 'shipped' ? 'active-green' : ''}`}>
                      {foundOrder.status === 'shipped' ? 'Em Transporte' : 'Aguardando'}
                    </span>
                  </div>
                </div>

                {/* Step 5: Entrega */}
                <div className={`wave-step step-5 ${foundOrder.status === 'delivered' ? 'completed' : 'upcoming'}`}>
                  <div className="wave-bullet upcoming-bullet">
                    <CheckCircle2 size={24} strokeWidth={2} />
                  </div>
                  <div className="wave-content">
                    <strong className="wave-title">Entrega</strong>
                    <span className="wave-sub">
                      {foundOrder.status === 'delivered' ? 'Concluído' : 'Aguardando'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CARD DE DETALHES DO PEDIDO — LAYOUT EMPILHADO LIMPO */}
            <div className="apple-lookup-result-card landscape-mode">
              {/* Header: Status + Badges */}
              <div className="result-card-header">
                <div className="status-indicator">
                  <span className="status-dot-pulse" />
                  <span className="status-label">
                    {foundOrder.status === 'paid' ? 'Pagamento Aprovado — Em Separação' :
                     foundOrder.status === 'delivered' ? 'Pedido Entregue com Sucesso' :
                     foundOrder.status === 'shipped' ? 'Em Transporte para seu Endereço' :
                     'Pedido em Processamento'}
                  </span>
                </div>
                <div className="result-header-badges">
                  <span className="order-id-badge">Nº {foundOrder.order_number || foundOrder.id}</span>
                  <span className="estimate-badge">{foundOrder.delivery_estimate || 'Previsão de entrega: 2 a 4 dias úteis'}</span>
                </div>
              </div>

              {/* Seção: Envio */}
              {(() => {
                const code = foundOrder.tracking_code || '10084920412800'
                const carrier = detectCarrier(foundOrder.shipping_method || '', code)
                return (
                  <div className="result-section">
                    <div className="carrier-unified-top">
                      {carrier.logo ? (
                        <img
                          className="carrier-logo-img"
                          src={carrier.logo}
                          alt={`Logo da ${carrier.name}`}
                        />
                      ) : null}
                      <div className="carrier-text-info">
                        <span className="carrier-name">{foundOrder.shipping_method || 'Melhor Envio — Jadlog Express'}</span>
                        <div className="carrier-code-row">
                          <span>Cód: <code>{code}</code></span>
                          <button
                            type="button"
                            className="copy-tracking-btn"
                            onClick={() => handleCopyTracking(code)}
                            title="Copiar código de rastreamento"
                          >
                            <Copy size={13} />
                            {copiedTracking ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>
                      <a
                        href={carrier.trackUrl(code)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="carrier-track-text-link"
                      >
                        <ExternalLink size={12} />
                        <span>Ver localização</span>
                      </a>
                    </div>
                  </div>
                )
              })()}

              {/* Seção: Itens */}
              <div className="result-section items-section">
                <h4 className="pane-title">Itens do Pedido</h4>
                <div className="result-products-list">
                  {(foundOrder.items || []).map((item, idx) => (
                    <div key={idx} className="result-product-row">
                      <img
                        src={item.product_image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'}
                        alt={item.product_name}
                      />
                      <div className="result-product-info">
                        <h5>{item.product_name}</h5>
                        <span className="result-product-meta">
                          Qtd: {item.quantity} • SKU: {item.product_sku || 'TK-01'}
                        </span>
                      </div>
                      <div className="result-product-price-col">
                        <span className="result-product-price">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção: Total + Ações (alinhamento financeiro oficial) */}
              <div className="result-checkout-bottom-bar">
                <div className="result-bottom-left">
                  <div className="result-payment-badge">
                    <CreditCard size={15} />
                    <span>{foundOrder.payment_method === 'pix' ? 'Pagamento via Pix' : 'Pagamento via Cartão de Crédito'}</span>
                  </div>
                  <a
                    href={`https://api.whatsapp.com/send?phone=5511920505472&text=${encodeURIComponent(`Olá, preciso de suporte sobre o pedido: ${foundOrder.order_number || foundOrder.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="result-action-support-link"
                    title="Suporte TEKNIX no WhatsApp"
                  >
                    <MessageCircle size={15} />
                    <span>Precisa de ajuda com este pedido?</span>
                  </a>
                </div>

                <div className="result-bottom-right">
                  <div className="result-financial-summary">
                    <div className="summary-line">
                      <span className="summary-label">Subtotal</span>
                      <span className="summary-value">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundOrder.subtotal || 489.90)}
                      </span>
                    </div>
                    <div className="summary-line">
                      <span className="summary-label">Frete ({foundOrder.shipping_method ? foundOrder.shipping_method.split('—')[0].trim() : 'Entrega'})</span>
                      <span className="summary-value">
                        {foundOrder.shipping_cost === 0
                          ? 'Grátis'
                          : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundOrder.shipping_cost || 24.90)}
                      </span>
                    </div>
                    <div className="summary-line total-line">
                      <span className="total-label">Total Pago</span>
                      <strong className="result-total-amount">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundOrder.total)}
                      </strong>
                    </div>
                  </div>

                  <div className="result-bottom-actions">
                    <button
                      type="button"
                      className="result-action-primary"
                      onClick={() => navigate('/pedidos')}
                    >
                      Ver pedidos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── MODO BUSCA: ULTRA LIMPO E MINIMALISTA (ESTILO APPLE) ── */
          <div className="apple-lookup-center-stage">
            <div className="apple-lookup-hero-card unboxed">
              <div className="apple-saved-empty-icon hero-truck-icon">
                <Truck size={36} strokeWidth={1.75} />
              </div>

              <div className="apple-lookup-header centered">
                <Editable as="h1" widgetId="orderlookup-1" className="apple-lookup-heading">
                  Localize seu pedido.
                </Editable>
                <p className="apple-lookup-description">
                  Digite o número do pedido ou o código de rastreio.
                </p>
              </div>

              {errorMsg && (
                <div className="apple-lookup-alert" role="alert">
                  <AlertCircle size={18} className="apple-lookup-alert-icon" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLookupSubmit} className="apple-lookup-form minimal-search-form" noValidate>
                <div className="apple-lookup-input-wrapper minimal">
                  <Search size={18} className="input-search-icon" />
                  <input
                    id="order-number-input"
                    type="text"
                    className="apple-lookup-input compact-light-input"
                    placeholder="Número do pedido ou código de rastreio"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="apple-lookup-submit-btn lime-btn compact-search-btn"
                  disabled={loading}
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </form>

              {/* Link: Se logado → vai pra /pedidos; se não → abre modal */}
              <div className="lookup-help-hint-row">
                <span className="lookup-help-hint-text">
                  {user ? 'Quer ver seus pedidos?' : 'Onde encontrar o número do pedido?'}
                </span>
                {user ? (
                  <Link to="/pedidos" className="lookup-help-hint-link">
                    Ver meus pedidos
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="lookup-help-hint-link"
                    onClick={() => setShowHowToFindModal(true)}
                  >
                    Ver instruções
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer de Atendimento ── */}
        <div className="apple-lookup-chatnow">
          <a
            href="https://api.whatsapp.com/send?phone=5511920505472&text=Ol%C3%A1%2C%20gostaria%20de%20consultar%20meu%20pedido%20TEKNIX"
            target="_blank"
            rel="noreferrer"
            className="chatnow-title"
          >
            Dúvidas sobre o pedido?
          </a>
          <div className="chatnow-links">
            <a
              href="https://api.whatsapp.com/send?phone=5511920505472&text=Ol%C3%A1%2C%20gostaria%20de%20consultar%20meu%20pedido%20TEKNIX"
              target="_blank"
              rel="noreferrer"
              className="chatnow-cta"
            >
              Falar no WhatsApp
            </a>
            <span className="chatnow-sep">•</span>
            <Link to="/conta" className="chatnow-cta">
              Minha conta
            </Link>
          </div>
        </div>
      </div>

      {/* ── Modal Como localizar o número do pedido ── */}
      {showHowToFindModal && (
        <div className="apple-modal-overlay" onClick={() => setShowHowToFindModal(false)}>
          <div className="apple-modal-card-apple" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="apple-overlay-close-btn"
              onClick={() => setShowHowToFindModal(false)}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <div className="apple-overlay-inner">
              <Editable as="h2" widgetId="orderlookup-6" className="apple-overlay-heading">
                Como localizar o número do seu pedido TEKNIX
              </Editable>

              <div className="apple-overlay-steps">
                <div className="apple-overlay-step-item">
                  <span className="step-number">1</span>
                  <div>
                    <strong>E-mail de confirmação de compra</strong>
                    <p>Enviamos um e-mail com o assunto "Seu pedido foi confirmado!". O código começa com <strong>W</strong> (ex: W849204128) ou <strong>TK-</strong>.</p>
                  </div>
                </div>

                <div className="apple-overlay-step-item">
                  <span className="step-number">2</span>
                  <div>
                    <strong>Histórico na sua Conta TEKNIX</strong>
                    <p>Se você estava conectado ao finalizar a compra, acesse <Link to="/pedidos" style={{ color: '#059669', fontWeight: 600 }}>Meus Pedidos</Link> para ver todas as suas transações.</p>
                  </div>
                </div>

                <div className="apple-overlay-step-item">
                  <span className="step-number">3</span>
                  <div>
                    <strong>Fale com nosso Suporte</strong>
                    <p>Não encontrou o e-mail? Fale conosco informando seu CPF ou telefone cadastrado para localizarmos na hora.</p>
                  </div>
                </div>
              </div>

              <div className="apple-overlay-actions">
                <button
                  type="button"
                  className="apple-overlay-save-btn"
                  onClick={() => setShowHowToFindModal(false)}
                >
                  Entendi, voltar à busca
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Animação Passo 1: Nome em cima e efeito de carregamento embaixo ── */}
      {animStage === 'tracking' && (
        <div className="lookup-tracking-overlay" aria-live="polite">
          <div className="tracking-spinner-wrap">
            <span className="tracking-status-text">Carregando seu pedido...</span>
            <div className="tracking-loader-spinner" />
          </div>
        </div>
      )}

      {/* ── Animação Passo 2: Bolinha verde limão que expande na tela toda (sem texto) ── */}
      {animStage === 'expand-circle' && (
        <div className="lookup-circle-reveal-overlay" aria-hidden="true">
          <div className="lookup-expanding-circle" />
        </div>
      )}
    </div>
  )
}
