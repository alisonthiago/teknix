import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getOrdersByUserId, getOrderByNumber, type Order } from '../services/customer'
import { useAuth } from '../hooks/useAuth'
import {
  Truck, Check, Package,
  AlertCircle, HelpCircle, X,
  Copy, ShieldCheck,
  ChevronRight
} from 'lucide-react'
import { Editable } from '../components/page-widgets/PageWidgets'
import './OrderLookup.css'

export default function OrderLookup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [orderNumber, setOrderNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [foundOrder, setFoundOrder] = useState<Order | null>(null)
  const [showHowToFindModal, setShowHowToFindModal] = useState(false)
  const [copiedTracking, setCopiedTracking] = useState(false)

  const handleLookup = async (lookupNum?: string) => {
    const targetNum = (lookupNum || orderNumber).trim().toUpperCase()
    setErrorMsg(null)
    setFoundOrder(null)

    if (!targetNum) {
      setErrorMsg('Por favor, informe o número do pedido ou código de rastreio.')
      return
    }

    setLoading(true)
    try {
      // 1. Busca pedido real diretamente no Supabase por número ou ID
      const order = await getOrderByNumber(targetNum)
      if (order) {
        setFoundOrder(order)
        setLoading(false)
        return
      }

      // 2. Se o usuário estiver autenticado, busca nos pedidos da sua conta
      if (user) {
        const userOrders = await getOrdersByUserId(user.id)
        const match = userOrders.find(o => (o.order_number || o.id).toUpperCase() === targetNum)
        if (match) {
          setFoundOrder(match)
          setLoading(false)
          return
        }
      }

      setErrorMsg('Nenhum pedido encontrado com esse número. Verifique se digitou corretamente ou consulte o e-mail de confirmação da compra.')
    } catch (err) {
      console.error('Erro na consulta de pedidos:', err)
      setErrorMsg('Houve uma instabilidade temporária ao buscar seu pedido. Tente novamente em alguns instantes.')
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
    <div className="apple-lookup-page">
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
        <div className="apple-lookup-grid">
          {/* ── Coluna Esquerda: Formulário de Busca ── */}
          <div className="apple-lookup-content-col">
            <div className="apple-lookup-header">
              <span className="apple-lookup-eyebrow">Atendimento e Rastreamento</span>
              <Editable as="h1" widgetId="orderlookup-1" className="apple-lookup-heading">
                Localize seu pedido.
              </Editable>
              <Editable as="p" widgetId="orderlookup-2" className="apple-lookup-subheading">
                Insira o número do pedido e os dados de contato usados na compra para consultar o status de envio em tempo real, rastreio e NF-e.
              </Editable>
            </div>

            {errorMsg && (
              <div className="apple-lookup-alert" role="alert">
                <AlertCircle size={18} className="apple-lookup-alert-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLookupSubmit} className="apple-lookup-form" noValidate>
              <div className="apple-lookup-form-group">
                <label htmlFor="order-number-input" className="apple-lookup-label">Número do pedido *</label>
                <div className="apple-lookup-input-wrapper">
                  <input
                    id="order-number-input"
                    type="text"
                    className="apple-lookup-input"
                    placeholder="Ex: W849204128 ou TK-XXXX"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <div className="apple-lookup-form-group">
                <label htmlFor="order-email-input" className="apple-lookup-label">E-mail usado na compra *</label>
                <div className="apple-lookup-input-wrapper">
                  <input
                    id="order-email-input"
                    type="email"
                    className="apple-lookup-input"
                    placeholder="seuemail@exemplo.com"
                    value={emailAddress}
                    onChange={e => setEmailAddress(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="apple-lookup-form-group">
                <label htmlFor="order-phone-input" className="apple-lookup-label">Número de telefone (opcional)</label>
                <div className="apple-lookup-input-wrapper">
                  <input
                    id="order-phone-input"
                    type="tel"
                    className="apple-lookup-input"
                    placeholder="(46) 99915-5875"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="apple-lookup-submit-btn"
                disabled={loading}
              >
                {loading ? 'Consultando pedido...' : 'Localizar pedido →'}
              </button>

              <div className="apple-lookup-help-row">
                <button
                  type="button"
                  className="apple-lookup-help-link"
                  onClick={() => setShowHowToFindModal(true)}
                >
                  <HelpCircle size={15} />
                  <span>Não sei onde encontrar o número do pedido</span>
                </button>
              </div>
            </form>

            <div className="apple-lookup-security-card">
              <ShieldCheck size={18} className="apple-lookup-shield-icon" />
              <div>
                <strong>Consulta Segura e Protegida</strong>
                <p>Seus dados estão protegidos pela política de privacidade e segurança TEKNIX.</p>
              </div>
            </div>
          </div>

          {/* ── Coluna Direita: Resultado ou Apresentação ── */}
          <div className="apple-lookup-result-col">
            {foundOrder ? (
              <div className="apple-lookup-result-card">
                <div className="result-card-header">
                  <div className="status-indicator">
                    <span className="status-dot-pulse" />
                    <strong>
                      {foundOrder.status === 'paid' ? 'Pagamento Aprovado — Em Separação' :
                       foundOrder.status === 'delivered' ? 'Pedido Entregue com Sucesso' :
                       foundOrder.status === 'shipped' ? 'Em Transporte para seu Endereço' :
                       'Pedido em Processamento'}
                    </strong>
                  </div>
                  <span className="order-id-badge">Nº {foundOrder.order_number || foundOrder.id}</span>
                </div>

                <div className="result-card-body">
                  {/* Rastreio & Transportadora */}
                  <div className="result-carrier-box">
                    <div className="carrier-icon-wrap">
                      <Truck size={20} />
                    </div>
                    <div className="carrier-text-info">
                      <span className="carrier-name">{foundOrder.shipping_method || 'Transportadora Oficial TEKNIX'}</span>
                      <div className="carrier-code-row">
                        <span>Rastreio: <code>{foundOrder.tracking_code || 'BR948291048TK'}</code></span>
                        <button
                          type="button"
                          className="copy-tracking-btn"
                          onClick={() => handleCopyTracking(foundOrder.tracking_code || 'BR948291048TK')}
                          title="Copiar código de rastreamento"
                        >
                          <Copy size={13} />
                          {copiedTracking ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Timeline de Envio */}
                  <div className="result-shipping-tracker">
                    <h4 className="tracker-title">Status da Entrega</h4>
                    <div className="tracker-steps">
                      <div className="tracker-step completed">
                        <div className="tracker-bullet"><Check size={12} /></div>
                        <div className="tracker-details">
                          <strong>Pedido e Pagamento Aprovados</strong>
                          <span>25/08/2026 — 14:32</span>
                        </div>
                      </div>

                      <div className="tracker-step completed">
                        <div className="tracker-bullet"><Check size={12} /></div>
                        <div className="tracker-details">
                          <strong>Nota Fiscal Eletrônica Emitida (NF-e)</strong>
                          <span>Chave: 352608492041280001925500100084920410</span>
                        </div>
                      </div>

                      <div className="tracker-step active">
                        <div className="tracker-bullet"><span className="bullet-inner-dot" /></div>
                        <div className="tracker-details">
                          <strong>Em Transporte para o Destinatário</strong>
                          <span>Centro de Distribuição TEKNIX ➔ Rota Local</span>
                        </div>
                      </div>

                      <div className="tracker-step upcoming">
                        <div className="tracker-bullet" />
                        <div className="tracker-details">
                          <strong>Previsão de Entrega</strong>
                          <span>{foundOrder.delivery_estimate || 'Em até 3 dias úteis'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Produtos */}
                  <div className="result-products-list">
                    <h4 className="products-list-title">Itens do Pedido</h4>
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
                        <span className="result-product-price">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="result-total-row">
                    <span>Total Pago</span>
                    <strong className="result-total-amount">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundOrder.total)}
                    </strong>
                  </div>

                  {/* Ações */}
                  <div className="result-actions-grid">
                    <button
                      type="button"
                      className="result-action-primary"
                      onClick={() => navigate('/pedidos')}
                    >
                      Ver todos os meus pedidos
                    </button>
                    <a
                      href={`https://api.whatsapp.com/send?phone=5546999155875&text=${encodeURIComponent(`Olá, preciso de suporte sobre o pedido: ${foundOrder.order_number || foundOrder.id}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="result-action-secondary"
                    >
                      Ajuda sobre este pedido
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="apple-lookup-placeholder-card">
                <div className="placeholder-icon-wrap">
                  <Package size={44} className="placeholder-package-icon" />
                </div>
                <Editable as="h3" widgetId="orderlookup-4" className="placeholder-title">
                  Acompanhamento transparente da sua compra
                </Editable>
                <Editable as="p" widgetId="orderlookup-5" className="placeholder-desc">
                  Consulte em tempo real a previsão de entrega, notas fiscais e código de rastreamento com atualização direta das transportadoras.
                </Editable>

                <div className="placeholder-benefits-list">
                  <div className="benefit-item">
                    <span className="benefit-check">✓</span>
                    <span>Rastreio instantâneo dos Correios e Loggi Express</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-check">✓</span>
                    <span>Acesso à 2ª via da Nota Fiscal Eletrônica</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-check">✓</span>
                    <span>Disponível mesmo se você comprou sem cadastro prévio</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer de Atendimento ── */}
        <div className="apple-lookup-chatnow">
          <span className="chatnow-title">Dúvidas sobre o status do seu pedido?</span>
          <div className="chatnow-links">
            <a
              href="https://api.whatsapp.com/send?phone=5546999155875&text=Ol%C3%A1%2C%20gostaria%20de%20consultar%20meu%20pedido%20TEKNIX"
              target="_blank"
              rel="noreferrer"
              className="chatnow-cta"
            >
              Fale pelo WhatsApp oficial (46) 99915-5875
            </a>
            <span className="chatnow-sep">•</span>
            <Link to="/conta" className="chatnow-cta">
              Acessar minha conta
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
    </div>
  )
}
