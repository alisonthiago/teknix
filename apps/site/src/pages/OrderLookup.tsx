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

      // Dados de demonstração como fallback
      const demoOrders: Order[] = [
        {
          id: 'W849204128',
          user_id: 'demo-user',
          customer_name: 'Alison Thiago',
          total: 14999.00,
          status: 'paid',
          payment_method: 'credit_card',
          payment_status: 'approved',
          tracking_code: 'BR948291048TK',
          created_at: '2026-08-25T14:32:00Z',
          items: [
            {
              id: 'item-1',
              order_id: 'W849204128',
              product_id: 'prod-1',
              product_name: 'TEKNIX Pro Master Max — 256GB Grafite',
              product_image: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80',
              quantity: 1,
              price: 14999.00
            }
          ]
        },
        {
          id: 'W719402849',
          user_id: 'demo-user',
          customer_name: 'Alison Thiago',
          total: 4599.00,
          status: 'delivered',
          payment_method: 'pix',
          payment_status: 'approved',
          tracking_code: 'BR719402849TK',
          created_at: '2026-07-12T10:15:00Z',
          items: [
            {
              id: 'item-2',
              order_id: 'W719402849',
              product_id: 'prod-2',
              product_name: 'TEKNIX AirPods Pro 3 Max',
              product_image: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/airpods-pro-2-hero-select-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80',
              quantity: 1,
              price: 4599.00
            }
          ]
        }
      ]

      const combined = [...allOrders, ...demoOrders]
      const cleanNum = orderNumber.trim().toUpperCase()
      const match = combined.find(o => o.id.toUpperCase().includes(cleanNum) || cleanNum.includes(o.id.toUpperCase()))

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
          <Link to="/" className="breadcrumb-link">Apple</Link>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">Busca de pedidos</span>
        </div>
      </div>

      <div className="apple-lookup-container">
        <div className="apple-lookup-grid">
          {/* ── Coluna Esquerda: Formulário de Busca ── */}
          <div className="apple-lookup-content-col">
            <h1 className="apple-lookup-heading">Busque seu pedido.</h1>
            <p className="apple-lookup-subheading">
              Insira o número do pedido e as informações de cobrança que você usou para fazer o pedido. Se não encontrar seu pedido, ligue para <span className="nowrap">0800-761-0867</span> e fale com nossa equipe de especialistas.
            </p>

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
                    <p className="status-highlight">
                      {foundOrder.status === 'paid' ? 'Pagamento Aprovado — Em separação' : foundOrder.status === 'delivered' ? 'Entregue no endereço cadastrado' : 'Processando pedido'}
                    </p>
                    {foundOrder.tracking_code && (
                      <div className="tracking-badge">
                        <Truck size={16} />
                        <span>Código de Rastreio: <strong>{foundOrder.tracking_code}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="result-products-list">
                    <h4>Produtos</h4>
                    {(foundOrder.items || []).map((item, idx) => (
                      <div key={idx} className="result-product-row">
                        <img src={item.product_image || 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80'} alt={item.product_name} />
                        <div>
                          <h5>{item.product_name}</h5>
                          <p>Qtd: {item.quantity} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
                        </div>
                      </div>
                    ))}
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
                <Package size={48} color="#d2d2d7" />
                <h3>Localize sua compra na hora</h3>
                <p>
                  Informe os dados ao lado para consultar em tempo real a previsão de entrega, nota fiscal e código de rastreamento da transportadora.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer Chat / Ajuda ── */}
        <div className="apple-lookup-chatnow">
          <span>Precisa de mais ajuda?</span>
          <span className="phone-bold">Ligue para 0800-761-0867.</span>
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
              <h2 className="apple-overlay-heading">Como localizar o número do seu pedido.</h2>
              <p className="apple-overlay-desc" style={{ fontSize: '15px', color: '#1d1d1f' }}>
                O número do pedido está localizado na parte superior do e-mail de confirmação do pedido (iniciado por W ou TK). Você também pode encontrá-lo no resumo do pedido contido na embalagem do produto.
              </p>
              <p className="apple-overlay-desc">
                Se ainda tiver dificuldade para localizá-lo, ligue para <strong style={{ color: '#1d1d1f' }}>0800-761-0867</strong> e fale com um de nossos especialistas.
              </p>
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
