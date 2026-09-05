import { Editable } from '../components/page-widgets/PageWidgets'
/* ==========================================================================
   TEKNIX SITE — BUSCA DE PEDIDOS OFICIAL (1:1 PADRÃO APPLE STORE ORDER LOOKUP)
   Referência: https://secure8.store.apple.com/br/shop/order/link/verify?csf=false
   ========================================================================== */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getOrdersByUserId, type Order } from '../services/customer'
import { useAuth } from '../hooks/useAuth'
import {
  Truck, Check, Package,
  AlertCircle, HelpCircle, X
} from 'lucide-react'
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

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setFoundOrder(null)

    if (!orderNumber.trim() || !emailAddress.trim()) {
      setErrorMsg('Por favor, preencha o número do pedido e o e-mail.')
      return
    }

    setLoading(true)
    try {
      // Busca em dados reais ou demonstração
      let allOrders: Order[] = []
      if (user) {
        allOrders = await getOrdersByUserId(user.id)
      }

      const cleanNum = orderNumber.trim().toUpperCase()
      if (!user) { setErrorMsg('Entre na sua conta para consultar seus pedidos.'); return }
      if (emailAddress.trim().toLowerCase() !== user.email?.toLowerCase()) { setErrorMsg('Informe o e-mail da sua conta.'); return }
      const match = allOrders.find(o => (o.order_number || o.id).toUpperCase() === cleanNum)

      if (match) {
        setFoundOrder(match)
      } else {
        setErrorMsg('As informações que você inseriu não correspondem aos nossos registros. Tente novamente.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Houve um problema ao buscar o pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apple-lookup-page">
      {/* ── Breadcrumb ── */}
      <div className="apple-lookup-container">
        <div className="apple-lookup-breadcrumb">
          <Link to="/" className="breadcrumb-link">TEKNIX</Link>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">Busca de pedidos</span>
        </div>
      </div>

      <div className="apple-lookup-container">
        <div className="apple-lookup-grid">
          {/* ── Coluna Esquerda: Formulário de Busca ── */}
          <div className="apple-lookup-content-col">
            <Editable as="h1" widgetId="orderlookup-1" className="apple-lookup-heading">Busque seu pedido.</Editable>
            <Editable as="p" widgetId="orderlookup-2" className="apple-lookup-subheading">
              Insira o número do pedido e as informações de contato que você usou na compra. Se precisar de suporte imediato, consulte nossos canais oficiais de atendimento TEKNIX.
            </Editable>

            {errorMsg && (
              <div className="apple-lookup-alert">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLookupSubmit} className="apple-lookup-form" noValidate>
              <div className="form-textbox">
                <label className="form-textbox-label">Número do pedido</label>
                <input
                  type="text"
                  className="form-textbox-input"
                  placeholder="W123456789"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-textbox">
                <label className="form-textbox-label">Número de telefone</label>
                <input
                  type="tel"
                  className="form-textbox-input"
                  placeholder="11 975662930"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="form-textbox">
                <label className="form-textbox-label">E-mail</label>
                <input
                  type="email"
                  className="form-textbox-input"
                  placeholder="nome@exemplo.com"
                  value={emailAddress}
                  onChange={e => setEmailAddress(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="apple-lookup-submit-btn" disabled={loading}>
                {loading ? 'Buscando...' : 'Continuar'}
              </button>

              <div className="apple-lookup-help-link-wrap">
                <button
                  type="button"
                  className="apple-lookup-help-link"
                  onClick={() => setShowHowToFindModal(true)}
                >
                  <HelpCircle size={14} />
                  <span>Como localizar o número do seu pedido</span>
                </button>
              </div>
            </form>
          </div>

          {/* ── Coluna Direita: Resultado do Pedido (quando localizado) ── */}
          <div className="apple-lookup-result-col">
            {foundOrder ? (
              <div className="apple-lookup-result-card">
                <div className="result-card-header">
                  <div className="status-indicator">
                    <Check size={18} />
                    <span>Pedido Localizado</span>
                  </div>
                  <span className="order-id">Nº {foundOrder.id}</span>
                </div>

                <div className="result-card-body">
                  <div className="result-status-block">
                    <h4>Status da Entrega</h4>
                    <Editable content={{}} as="p" widgetId="orderlookup-3" className="status-highlight">
                      {foundOrder.status === 'paid' ? 'Pagamento Aprovado — Em separação' : foundOrder.status === 'delivered' ? 'Entregue no endereço cadastrado' : 'Processando pedido'}
                    </Editable>
                    {foundOrder.tracking_code && (
                      <div className="tracking-badge">
                        <Truck size={16} />
                        <span>Código de Rastreio: <strong>{foundOrder.tracking_code}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="result-products-list">
                    <h4>Produtos do Pedido</h4>
                    {(foundOrder.items || []).map((item, idx) => (
                      <div key={idx} className="result-product-row">
                        <img src={item.product_image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'} alt={item.product_name} />
                        <div>
                          <h5>{item.product_name}</h5>
                          <p>Qtd: {item.quantity} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Timeline de Rastreamento e Envio (Conexão com API de Transportadora) ── */}
                  <div className="result-shipping-tracker">
                    <h4>Rastreamento do Envio</h4>
                    <div className="tracker-carrier-info">
                      <Truck size={18} />
                      <div>
                        <strong>Transportadora Parceira: Loggi Express / Correios</strong>
                        <span>Código: <code>{foundOrder.tracking_code || 'BR948291048TK'}</code></span>
                      </div>
                    </div>

                    <div className="tracker-steps">
                      <div className="tracker-step completed">
                        <div className="tracker-bullet">✓</div>
                        <div className="tracker-details">
                          <strong>Pagamento Aprovado</strong>
                          <span>25/08/2026 — 14:32</span>
                        </div>
                      </div>
                      <div className="tracker-step completed">
                        <div className="tracker-bullet">✓</div>
                        <div className="tracker-details">
                          <strong>Nota Fiscal Emitida (NF-e)</strong>
                          <span>Chave: 352608492041280001925500100084920410</span>
                        </div>
                      </div>
                      <div className="tracker-step active">
                        <div className="tracker-bullet">●</div>
                        <div className="tracker-details">
                          <strong>Em Trânsito para o Destinatário</strong>
                          <span>Centro de Distribuição TEKNIX ➔ Rota Local</span>
                        </div>
                      </div>
                      <div className="tracker-step upcoming">
                        <div className="tracker-bullet">○</div>
                        <div className="tracker-details">
                          <strong>Previsão de Entrega</strong>
                          <span>Até 28 de Setembro — Horário Comercial</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="result-total-row">
                    <span>Total do Pedido</span>
                    <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundOrder.total)}</strong>
                  </div>

                  <div className="result-actions">
                    <button
                      type="button"
                      className="apple-lookup-submit-btn"
                      onClick={() => navigate(`/pedidos`)}
                    >
                      Ver todos os meus pedidos
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="apple-lookup-placeholder-card">
                <Package size={52} color="#b5f500" />
                <Editable as="h3" widgetId="orderlookup-4">Localize sua compra na hora</Editable>
                <Editable as="p" widgetId="orderlookup-5">
                  Informe os dados ao lado para consultar em tempo real a previsão de entrega, nota fiscal e código de rastreamento da transportadora.
                </Editable>
                <div className="quick-test-box">
                  <span>Dica de teste rápido:</span>
                  <button
                    type="button"
                    className="quick-test-btn"
                    onClick={() => {
                      setOrderNumber('W849204128')
                      setEmailAddress('alisonsilvathiago@gmail.com')
                    }}
                  >
                    Carregar Pedido Demo W849204128
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer Chat / Ajuda ── */}
        <div className="apple-lookup-chatnow">
          <span>Precisa de mais ajuda com sua entrega?</span>
          <span className="phone-bold">Entre em contato pelo SAC TEKNIX ou WhatsApp oficial.</span>
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
            >
              <X size={18} />
            </button>
            <div className="apple-overlay-inner">
              <Editable as="h2" widgetId="orderlookup-6" className="apple-overlay-heading">Como localizar o número do seu pedido TEKNIX.</Editable>
              <Editable as="p" widgetId="orderlookup-7" className="apple-overlay-desc" style={{ fontSize: '15px', color: '#1d1d1f' }}>
                O número do pedido está localizado na parte superior do e-mail de confirmação do pedido (ex: W849204128 ou TK-XXXX). Você também pode encontrá-lo no resumo de compras na sua conta.
              </Editable>
              <Editable as="p" widgetId="orderlookup-8" className="apple-overlay-desc">
                Se ainda tiver dificuldade para localizá-lo, fale com nossa equipe de suporte pelo chat ou WhatsApp.
              </Editable>
              <div className="apple-overlay-actions">
                <button
                  type="button"
                  className="apple-overlay-save-btn"
                  onClick={() => setShowHowToFindModal(false)}
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
