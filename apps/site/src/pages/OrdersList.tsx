/* ==========================================================================
   TEKNIX SITE — PÁGINA DE PEDIDOS OFICIAL (1:1 PADRÃO APPLE STORE ORDER LIST)
   Referência: https://secure8.store.apple.com/br/shop/order/list
   ========================================================================== */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getOrdersByUserId, type Order } from '../services/customer'
import {
  ExternalLink, ChevronDown, Truck, X, Search
} from 'lucide-react'
import './OrdersList.css'

export default function OrdersList() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [faqSectionOpen, setFaqSectionOpen] = useState(true)
  const [showFindOrderModal, setShowFindOrderModal] = useState(false)
  const [findOrderNumber, setFindOrderNumber] = useState('')
  const [findOrderEmail, setFindOrderEmail] = useState('')
  const [searchResultMsg, setSearchResultMsg] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [user])

  async function loadOrders() {
    setLoading(true)
    if (user) {
      try {
        const ords = await getOrdersByUserId(user.id)
        setOrders(ords)
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err)
      } finally {
        setLoading(false)
      }
    } else {
      // Modo demonstração com dados de exemplo
      setTimeout(() => {
        setOrders([
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
        ])
        setLoading(false)
      }, 200)
    }
  }

  // Mascarar e-mail no formato Apple (ex: a•••••••••••••••o@gmail.com)
  const rawEmail = user?.email || 'alisonsilvathiago@gmail.com'
  const emailParts = rawEmail.split('@')
  const maskedEmail = emailParts.length === 2
    ? `${emailParts[0].charAt(0)}•••••••••••••••${emailParts[0].slice(-1)}@${emailParts[1]}`
    : rawEmail

  const faqs = [
    {
      question: 'Quando receberei meus produtos?',
      answer: 'O e-mail de confirmação do pedido informa a data de chegada, e o e-mail de notificação de envio informa o número de rastreamento.'
    },
    {
      question: 'Como posso rastrear meu pedido?',
      answer: 'Sempre que um item sai de nosso depósito, enviamos um e-mail incluindo o nome da transportadora e o número de rastreamento do seu pedido. Você pode usar o link do e-mail para acompanhar o pedido ou clicar em “Acompanhar envio” nos detalhes do pedido.'
    },
    {
      question: 'Preciso assinar quando receber meu pacote?',
      answer: 'Cabe à transportadora decidir se um pedido requer assinatura na entrega. Entre em contato com ela para obter mais detalhes.'
    },
    {
      question: 'Como posso cancelar ou editar meu pedido?',
      answer: 'Para cancelar, clique em “Cancelar item” enquanto seu pedido está sendo processado. Se cancelar um item que está sendo enviado para um endereço, você não será cobrado. Iniciaremos o processo de reembolso assim que você enviar a solicitação de cancelamento. Se o pedido estiver qualificado, você pode editar a mensagem de presente, a gravação ou o endereço de envio.'
    },
    {
      question: 'Como posso devolver um produto?',
      answer: 'Se você quiser devolver algum item, clique em “Iniciar uma devolução” para enviá-lo de volta. O processo de reembolso será iniciado assim que recebermos o produto devolvido.'
    },
    {
      question: 'Quando recebo notificações por mensagem de texto?',
      answer: 'Caso tenha solicitado o recebimento de notificações por mensagem de texto, enviaremos um SMS quando seus itens forem enviados ou quando estiverem prontos para retirada. Também poderemos entrar em contato com você se houver um problema com o pedido. As mensagens são enviadas entre as 8h e as 21h em seu horário local.'
    },
    {
      question: 'Como posso alterar minhas preferências de mensagens de texto?',
      answer: 'Para editar seu número de telefone celular a qualquer momento, acesse sua conta e edite as preferências de notificação de envio ou de retirada de pedido. Para cancelar as notificações, responda a mensagem de texto com a palavra “STOP”.'
    }
  ]

  const handleFindOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!findOrderNumber || !findOrderEmail) {
      setSearchResultMsg('Por favor, informe o número do pedido e o e-mail.')
      return
    }
    const found = orders.find(o => o.id.toLowerCase().includes(findOrderNumber.toLowerCase()))
    if (found) {
      setSearchResultMsg(`Pedido ${found.id} localizado! Status: ${found.status === 'paid' ? 'Pagamento Aprovado' : found.status === 'delivered' ? 'Entregue' : 'Processando'}.`)
    } else {
      setSearchResultMsg(`Nenhum pedido encontrado com o número "${findOrderNumber}" associado ao e-mail informado.`)
    }
  }

  return (
    <div className="apple-orders-page">
      {/* ── Breadcrumb Apple Oficial ── */}
      <div className="apple-orders-container">
        <div className="apple-orders-breadcrumb">
          <Link to="/conta" className="breadcrumb-link">Sua conta</Link>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">Lista de produtos dos pedidos</span>
        </div>
      </div>

      <div className="apple-orders-container">
        {/* ── Header Principal 1:1 Apple ── */}
        <header className="apple-orders-header">
          <h1 className="apple-orders-title">Produtos que você pediu.</h1>
          <p className="apple-orders-subtitle">
            Somente as compras realizadas nos últimos 18 meses são exibidas aqui.
          </p>
        </header>

        {/* ── Lista de Pedidos ── */}
        {loading ? (
          <div className="apple-orders-loading">
            <div className="apple-spinner" />
            <p>Carregando seus pedidos...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="apple-orders-list-section">
            {orders.map(order => (
              <div key={order.id} className="apple-order-tile">
                <div className="apple-order-tile-header">
                  <div className="tile-header-left">
                    <span className="tile-order-num">Pedido nº {order.id}</span>
                    <span className="tile-order-date">
                      Realizado em {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>
                  <div className="tile-header-right">
                    <span className={`tile-status-badge ${order.status}`}>
                      {order.status === 'paid' ? 'Pagamento Aprovado' : order.status === 'delivered' ? 'Entregue' : 'Em Processamento'}
                    </span>
                  </div>
                </div>

                <div className="apple-order-tile-items">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="apple-order-product-row">
                      <div className="product-image-box">
                        <img src={item.product_image || 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80'} alt={item.product_name} />
                      </div>
                      <div className="product-info-box">
                        <h3 className="product-title">{item.product_name}</h3>
                        <div className="product-qty-price-row">
                          <span className="product-qty-selector">{item.quantity} ▾</span>
                          <span className="product-price">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                          </span>
                        </div>
                        <div className="product-links-row">
                          <button className="product-details-toggle">Mostrar detalhes do produto ▾</button>
                          <button className="product-remove-btn">Remover</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="apple-order-tile-shipping">
                  <div className="shipping-row">
                    <Truck size={14} />
                    <span>Faça seu pedido. Entrega em <strong>{order.tracking_code ? '04707-900' : '—'}</strong> ▾</span>
                  </div>
                  <p className="shipping-dates">21 Set. — 28 Set. — <strong>Grátis</strong></p>
                </div>

                <div className="apple-order-tile-footer">
                  <div className="footer-summary">
                    <div className="footer-summary-row">
                      <span>Subtotal</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
                    </div>
                    <div className="footer-summary-row">
                      <span>Envio</span>
                      <span><strong>GRÁTIS</strong></span>
                    </div>
                  </div>
                  <div className="footer-actions">
                    {order.tracking_code && (
                      <span className="tracking-info">
                        <Truck size={14} /> Rastreamento: <code>{order.tracking_code}</code>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* ── Ajuda com o Pedido 1:1 Apple ── */}
        <section className="apple-order-help-section">
          <h2 className="apple-help-heading">Ajuda com o pedido</h2>

          <div className="apple-help-find-box">
            <span className="help-text">Não está encontrando seu pedido?</span>
            <Link
              to="/order/link/verify"
              className="apple-help-link"
            >
              <span>Localizar agora</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="apple-help-account-box">
            <p className="account-email-info">Você iniciou sessão como {maskedEmail}</p>
            <p className="account-note">
              Alguns usuários têm mais de uma Conta TEKNIX. Talvez seja o seu caso. Se você tiver outra conta, encerre a sessão e faça login novamente com outro e-mail ou telefone.
            </p>
          </div>

          <div className="apple-help-phone-box">
            <span>Precisa de mais ajuda?</span>
            <span className="phone-link">Ligue para 0800-761-0867.</span>
          </div>
        </section>

        {/* ── Perguntas Frequentes (FAQ Accordion 1:1 Apple) ── */}
        <section className="apple-faq-section">
          <div className="apple-faq-main-accordion">
            <button
              type="button"
              className="apple-faq-main-toggle"
              onClick={() => setFaqSectionOpen(!faqSectionOpen)}
              aria-expanded={faqSectionOpen}
            >
              <h2 className="apple-faq-main-title">Perguntas frequentes</h2>
              <ChevronDown
                size={22}
                className={`apple-faq-chevron ${faqSectionOpen ? 'open' : ''}`}
              />
            </button>

            {faqSectionOpen && (
              <div className="apple-faq-items-list">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx
                  return (
                    <div key={idx} className="apple-faq-item">
                      <button
                        type="button"
                        className="apple-faq-question-btn"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                      >
                        <span className="faq-question-text">{faq.question}</span>
                        <ChevronDown
                          size={18}
                          className={`apple-faq-item-chevron ${isOpen ? 'open' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="apple-faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Modal Localizar Pedido ── */}
      {showFindOrderModal && (
        <div className="apple-modal-overlay" onClick={() => setShowFindOrderModal(false)}>
          <div className="apple-modal-card" onClick={e => e.stopPropagation()}>
            <div className="apple-modal-header">
              <h3>Localizar um pedido</h3>
              <button
                type="button"
                className="apple-modal-close"
                onClick={() => setShowFindOrderModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="apple-modal-body">
              <form onSubmit={handleFindOrderSubmit} className="apple-form-grid">
                <div className="apple-form-group full">
                  <label>Número do Pedido (Ex: W849204128)</label>
                  <input
                    type="text"
                    placeholder="W123456789"
                    value={findOrderNumber}
                    onChange={e => setFindOrderNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="apple-form-group full">
                  <label>E-mail utilizado na compra</label>
                  <input
                    type="email"
                    placeholder="nome@exemplo.com"
                    value={findOrderEmail}
                    onChange={e => setFindOrderEmail(e.target.value)}
                    required
                  />
                </div>

                {searchResultMsg && (
                  <div className="apple-search-result-box full">
                    <p>{searchResultMsg}</p>
                  </div>
                )}

                <div className="apple-form-actions">
                  <button
                    type="button"
                    className="apple-btn-secondary"
                    onClick={() => setShowFindOrderModal(false)}
                  >
                    Fechar
                  </button>
                  <button type="submit" className="apple-btn-primary">
                    <Search size={14} style={{ marginRight: 6 }} />
                    Buscar Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
