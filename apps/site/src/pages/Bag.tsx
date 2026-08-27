/* ==========================================================================
   TEKNIX SITE — PÁGINA OFICIAL DA SACOLA (1:1 PADRÃO APPLE STORE BAG)
   Referência: https://www.apple.com/br/shop/bag
   Totalmente Integrado: CartContext, Recomendações Dinâmicas, CEP Inline, FAQ
   ========================================================================== */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { ChevronDown, ChevronUp } from 'lucide-react'
import './Bag.css'

export default function Bag() {
  const { items, removeFromCart, updateQuantity, totalPrice, addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  // CEP Estimator State por Item
  const [openCepItemId, setOpenCepItemId] = useState<string | null>(null)
  const [cepInput, setCepInput] = useState('')
  const [calculatedCep, setCalculatedCep] = useState<string | null>(null)
  const [saveLocation, setSaveLocation] = useState(false)

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  // Recomendações com Cores Selecionadas (1:1 Apple)
  const [recs, setRecs] = useState([
    {
      id: 'rec-folio',
      name: 'Smart Folio para iPad Air de 11 polegadas (M4) – Violeta-claro',
      price: 899.00,
      image: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MWK83?wid=400&hei=400&fmt=jpeg&qlt=90',
      colors: [
        { name: 'Cinza-carvão', hex: '#43454b', img: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MWK53_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90' },
        { name: 'Sálvia', hex: '#87978d', img: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MWK73_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90' },
        { name: 'Denim', hex: '#475b75', img: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MWK63_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90' },
        { name: 'Violeta-claro', hex: '#b3a9c9', img: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MWK83_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90' }
      ],
      selectedColor: 'Violeta-claro'
    },
    {
      id: 'rec-airpods4',
      name: 'AirPods 4',
      price: 1499.00,
      image: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/airpods-4-select-202409?wid=400&hei=400&fmt=jpeg&qlt=90',
      colors: [],
      selectedColor: ''
    },
    {
      id: 'rec-magickeyboard',
      name: 'Magic Keyboard para iPad Air de 11 polegadas (M4) – Inglês (EUA) – Preto',
      price: 2999.00,
      image: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MGYX4?wid=400&hei=400&fmt=jpeg&qlt=90',
      colors: [
        { name: 'Branco', hex: '#f0f0f2', img: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MDFV4_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90' },
        { name: 'Preto', hex: '#222325', img: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MGYX4_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90' }
      ],
      selectedColor: 'Preto'
    }
  ])

  const faqs = [
    {
      q: 'Quando receberei meus produtos?',
      a: 'Ao inserir o código postal, você receberá datas de entrega estimadas dos itens. Só depois de fazer o pedido você verá a data de entrega final. Todas as datas estimadas variam de acordo com a disponibilidade do produto e a opção de entrega que você escolher.'
    },
    {
      q: 'Quais são as opções de pagamento?',
      a: 'Aceitamos TEKNIX Pay, Pix, boleto e a maioria dos cartões de crédito e débito em até 12x. Algumas opções de pagamento podem não estar disponíveis para todos os produtos.'
    },
    {
      q: 'Como o imposto sobre vendas é calculado?',
      a: 'Os impostos indicados nas páginas da sacola e de pagamento são estimativas. Sua nota fiscal vai apresentar o imposto total, inclusive os impostos estaduais e municipais e quaisquer taxas aplicáveis.'
    },
    {
      q: 'A TEKNIX oferece descontos para a área de educação?',
      a: 'Sim. A TEKNIX oferece preços especiais para estudantes, professores, administradores e funcionários de instituições de ensino superior.'
    },
    {
      q: 'Quais são as opções de financiamento?',
      a: 'Você pode pagar em parcelas com seu cartão de crédito. Na página de finalização da compra, selecione as opções na seção de pagamento.'
    },
    {
      q: 'É possível entregar em um lugar que não seja minha casa?',
      a: 'Sim. Você pode informar o endereço desejado ao finalizar a compra.'
    },
    {
      q: 'Por que preciso autenticar meu cartão de crédito após finalizar a compra?',
      a: 'Para maior segurança, pode ser necessário inserir um código de segurança especial ao usar seu cartão de crédito ou débito para fazer compras na TEKNIX Store. No momento da finalização da compra, você receberá o código por SMS ou no aplicativo do seu banco.'
    }
  ]

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const handleColorChange = (recId: string, colorName: string) => {
    setRecs(prev => prev.map(r => r.id === recId ? { ...r, selectedColor: colorName } : r))
  }

  const handleAddRecToBag = (rec: typeof recs[0]) => {
    addToCart({
      id: rec.id + (rec.selectedColor ? `-${rec.selectedColor}` : ''),
      name: rec.name,
      sku: rec.id,
      price: rec.price,
      image: rec.image,
      stock: 99
    })
  }

  return (
    <div id="bag-container" className="rs-page-content" role="main">
      <div className="rs-bag">
        <div id="bag-content" className="rs-bag-content as-l-container rs-zoom-content">
          
          {items.length === 0 ? (
            /* ══════════════════════════════════════════════════════════
               1. ESTADO DA SACOLA VAZIA (1:1 APPLE STORE)
               ══════════════════════════════════════════════════════════ */
            <div className="rs-bagempty large-9 small-12">
              <h1 className="rs-bag-header" tabIndex={-1}>Sua sacola está vazia.</h1>
              <div className="rs-bagempty-message">
                {user
                  ? 'Compre online e ganhe entrega gratuita em todos os produtos em estoque.'
                  : 'Inicie sessão para ver se possui itens salvos ou continue comprando.'}
              </div>
              <div className="rs-bagempty-actions">
                <div className="row">
                  {!user && (
                    <div className="column rs-bagempty-button">
                      <Link className="form-button" to="/login">
                        Iniciar sessão
                      </Link>
                    </div>
                  )}
                  <div className="column rs-bagempty-button">
                    <Link to="/produtos" className="form-button form-button-secondary">
                      Continuar comprando
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════
               2. ESTADO DA SACOLA PREENCHIDA (1:1 APPLE STORE OFICIAL)
               ══════════════════════════════════════════════════════════ */
            <>
              {/* Banner de Sincronização da Sessão 1:1 Apple */}
              {user && (
                <div className="rs-bag-sync-banner">
                  <div className="rs-bag-sync-banner-content">
                    Agora que você iniciou a sessão com sua Conta TEKNIX, sua sacola contém itens que você adicionou antes.
                  </div>
                </div>
              )}

              {/* Header com Valor e Botão Superior */}
              <div className="rs-bag-button-header large-12">
                <h1 className="rs-bag-header" data-autom="bag-header" tabIndex={-1}>
                  Veja o que está na sua sacola {formatPrice(totalPrice)}.
                </h1>
                <div className="rs-bag-headermessage">
                  Frete grátis em todos os pedidos.
                </div>
                <div className="row rs-bag-checkoutbutton-header">
                  <div className="small-12 small-offset-0 large-12">
                    <div className="rs-bag-checkoutbuttons-wrapper rs-bag-checkout-mainbutton-show">
                      <div className="rs-bag-checkoutbutton rs-bag-checkout-mainbutton">
                        <button
                          id="shoppingCart.actions.navCheckout"
                          type="button"
                          className="button button-block"
                          data-autom="checkout"
                          onClick={() => navigate('/checkout')}
                        >
                          <span>Pagar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ol className="rs-bag-items rs-iteminfos" role="list" data-autom="bag-items">
                {items.map(item => (
                  <li key={item.id} className="rs-bag-item rs-iteminfo-wrap" role="listitem">
                    <div className="rs-iteminfo row">
                      
                      {/* Imagem Ampliada do Item 1:1 Apple */}
                      <div className="rs-iteminfo-image">
                        <Link to={`/produto/${item.id}`}>
                          <img
                            alt={item.name}
                            className="as-util-relatedlink"
                            src={item.image || 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-select-11in-wifi-purple-202405?wid=800&hei=800&fmt=jpeg&qlt=95'}
                          />
                        </Link>
                      </div>

                      {/* Conteúdo e Detalhes do Item */}
                      <div className="rs-iteminfo-content">
                        
                        {/* Linha Principal (Título, Quantidade, Preço) */}
                        <div className="rs-iteminfo-main-grid">
                          {/* Coluna 1: Título e Detalhes */}
                          <div className="rs-iteminfo-title-col">
                            <h2 className="rs-iteminfo-title">
                              <Link to={`/produto/${item.id}`}>
                                {item.name}
                              </Link>
                            </h2>
                            <button
                              type="button"
                              className="rs-show-details-btn as-buttonlink"
                              onClick={() => {}}
                            >
                              <span>Mostrar detalhes do produto</span>
                              <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                            </button>
                          </div>

                          {/* Coluna 2: Seletor de Quantidade Dropdown */}
                          <div className="rs-iteminfo-qty-col">
                            <div className="rs-quantity-wrapper form-dropdown">
                              <label htmlFor={`qty-${item.id}`} className="visuallyhidden">Quantidade</label>
                              <select
                                id={`qty-${item.id}`}
                                className="rs-quantity-dropdown form-dropdown-select"
                                value={item.quantity}
                                onChange={e => updateQuantity(item.id, parseInt(e.target.value))}
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                              <span className="form-dropdown-chevron" />
                            </div>
                          </div>

                          {/* Coluna 3: Preço e Links Remover / Salvar para depois */}
                          <div className="rs-iteminfo-price-col">
                            <span className="rs-item-total-price">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            <button
                              type="button"
                              className="rs-iteminfo-remove-link as-buttonlink"
                              onClick={() => removeFromCart(item.id)}
                            >
                              Remover
                            </button>
                            <button
                              type="button"
                              className="rs-iteminfo-save-later-link as-buttonlink"
                              onClick={() => {
                                removeFromCart(item.id)
                              }}
                            >
                              Salvar para depois
                            </button>
                          </div>
                        </div>

                        {/* Divisor Interno */}
                        <div className="rs-item-inner-divider" />

                        {/* Informações de Entrega / CEP 1:1 Apple */}
                        <div className="rs-item-fulfillment-line">
                          <div className="rs-fulfillment-delivery-wrap">
                            <svg className="rs-truck-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="1" y="3" width="15" height="13"></rect>
                              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                              <circle cx="5.5" cy="18.5" r="2.5"></circle>
                              <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                            <div className="rs-fulfillment-text-block">
                              <button
                                type="button"
                                className="rs-edit-location-button as-buttonlink"
                                onClick={() => setOpenCepItemId(openCepItemId === item.id ? null : item.id)}
                              >
                                <span>Faça seu pedido. Entrega em {calculatedCep || '04707-900'}</span>
                                <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                              </button>
                              <div className="rs-delivery-dates-badge">
                                21 Set. – 28 Set. — <strong>Grátis</strong>
                              </div>
                            </div>
                          </div>

                          {/* Drawer inline do CEP 1:1 Apple */}
                          {openCepItemId === item.id && (
                            <div className="rs-postal-code-editor">
                              <div className="rf-inlineeditor rf-inlineeditor-collapsible">
                                <div className="rf-inlineeditor-content row">
                                  <div className="rf-inlineeditor-input column">
                                    <div className="form-textbox form-textbox-with-button">
                                      <label className="form-textbox-label">CEP</label>
                                      <input
                                        type="text"
                                        className="form-textbox-input form-textbox-number-input"
                                        placeholder="00000-000"
                                        value={cepInput}
                                        onChange={e => setCepInput(e.target.value)}
                                        maxLength={9}
                                        inputMode="numeric"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        className="rf-inlineeditor-apply form-textbox-button"
                                        disabled={!cepInput}
                                        onClick={() => {
                                          if (cepInput) {
                                            setCalculatedCep(cepInput)
                                            setOpenCepItemId(null)
                                          }
                                        }}
                                      >
                                        Aplicar
                                      </button>
                                      <button
                                        type="button"
                                        className="rf-inlineeditor-cancel as-buttonlink"
                                        onClick={() => setOpenCepItemId(null)}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="rs-location-consent">
                                  <div className="form-checkbox">
                                    <label className="form-label">
                                      <input
                                        className="form-checkbox-input"
                                        type="checkbox"
                                        checked={saveLocation}
                                        onChange={e => setSaveLocation(e.target.checked)}
                                      />
                                      <span className="form-checkbox-text">Salvar minha localização para as próximas visitas</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Linha de Status de Entrega */}
                          <div className="rs-item-fulfillment-columns">
                            <div className="rs-delivery-container">
                              <div className="rs-item-shipping rs-item-delivery as-icondetails">
                                <div className="as-icondetails-icon as-svgicon-container">
                                  <svg className="as-svgicon-rtl-mirrored as-svgicon as-svgicon-boxtruck" viewBox="0 0 21 21" role="img" width="21px" height="21px">
                                    <path fill="none" d="M0 0h21v21H0z" />
                                    <path fill="#1d1d1f" d="M19.559 10.274 17.24 7.53A1.69 1.69 0 0 0 15.918 7H15v-.75A2.25 2.25 0 0 0 12.75 4h-8.5A2.25 2.25 0 0 0 2 6.25V13a2.25 2.25 0 0 0 2.25 2.25h.56A2.25 2.25 0 0 0 7 17a2.2 2.2 0 0 0 2.19-2H14a2.214 2.214 0 0 0 2.25 2 2.25 2.25 0 0 0 2.19-1.75h.016A1.4 1.4 0 0 0 20 13.747v-2.363a1.6 1.6 0 0 0-.441-1.11M8.142 15.25a1.245 1.245 0 0 1-2.284 0 1.21 1.21 0 0 1 0-1 1.245 1.245 0 0 1 2.284 0 1.21 1.21 0 0 1 0 1M9.15 14a2.267 2.267 0 0 0-4.34.25h-.56A1.25 1.25 0 0 1 3 13V6.25A1.25 1.25 0 0 1 4.25 5h8.5A1.25 1.25 0 0 1 14 6.25V14Zm8.242 1.25a1.245 1.245 0 0 1-2.284 0 1.21 1.21 0 0 1 0-1 1.245 1.245 0 0 1 2.284 0 1.21 1.21 0 0 1 0 1M19 13.747c0 .334-.084.503-.544.503h-.016A2.246 2.246 0 0 0 15 12.88V8h.918a.68.68 0 0 1 .592.211l2.324 2.752a.62.62 0 0 1 .166.42Z" />
                                  </svg>
                                </div>
                                <div className="as-icondetails-detail">
                                  <div className="rs-item-shipping-detail-line as-icondetails-value">
                                    Em estoque e pronto para envio.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Resumo Final de Valores (Subtotal, Envio, Total e Financiamento) */}
              <div className="rs-summary">
                <div className="large-9 large-offset-3 small-12 small-offset-0">
                  <div className="rs-summary-content rs-summary-subtotal">
                    <div className="rs-summary-labelandvaluecontainer">
                      <div className="rs-summary-label" data-autom="bagrs-summary-subtotallabel">Subtotal</div>
                      <div className="rs-summary-value" data-autom="bagrs-summary-subtotalvalue">{formatPrice(totalPrice)}</div>
                    </div>
                  </div>
                  <div className="rs-summary-content rs-summary-shipping">
                    <div className="rs-summary-labelandvaluecontainer">
                      <div className="rs-summary-label" data-autom="bagrs-summary-shippinglabel">Envio</div>
                      <div className="rs-summary-value" data-autom="bagrs-summary-shippingvalue">GRÁTIS</div>
                    </div>
                  </div>
                  <div className="rs-summary-labelandvaluecontainer rs-summary-total">
                    <div className="rs-summary-label" data-autom="bagtotallabel">Total</div>
                    <div className="rs-summary-value" data-autom="bagtotalvalue">{formatPrice(totalPrice)}</div>
                  </div>
                  <div className="rs-summary-financingmessage-wrapper">
                    <div className="rs-summary-value">
                      <div id="buyflow-message-container" className="rf-ac-messages">
                        <div className="rf-acmessages-defaultmessage">
                          <div className="large-12 rs-summary-financingmessage">
                            <p className="large-8 small-12">
                              <a href="/financiamento" target="_blank" rel="noreferrer" className="icon icon-after icon-external">
                                A partir de {formatPrice(totalPrice / 12)}/mês por 12 meses no cartão de crédito ↗
                              </a>
                              <br />
                              Receba um desconto de 10% ao pagar à vista
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão Final Pagar (1:1 Apple) */}
              <div className="row rs-bag-checkoutbutton-bottom">
                <div className="small-12 small-offset-0 large-9 large-offset-3">
                  <div className="rs-bag-checkoutbuttons-wrapper rs-bag-checkout-mainbutton-show">
                    <div className="rs-bag-checkoutbutton rs-bag-checkout-mainbutton">
                      <button
                        id="shoppingCart.actions.checkout"
                        type="button"
                        className="form-button"
                        data-autom="checkout"
                        onClick={() => navigate('/checkout')}
                      >
                        <span>Pagar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════
                 3. SEÇÃO OUTRAS RECOMENDAÇÕES (1:1 APPLE STORE)
                 ══════════════════════════════════════════════════════════ */}
              <div className="rs-recommendations">
                <div className="rf-recommendations rf-recommendations-grid">
                  <div className="as-l-container">
                    <h2 className="rf-recommendations-title typography-headline-reduced">
                      Outras recomendações
                    </h2>
                  </div>
                  <div className="as-l-container rf-recommendations-tiles">
                    {recs.map(rec => (
                      <div key={rec.id} className="rf-recommendations-tile small-12">
                        <div className="rf-recommendations-accessory rf-recommendations-accessory-inline tile">
                          <div className="rf-recommendations-accessory-image">
                            <img width="200" height="200" src={rec.image} alt={rec.name} className="as-util-relatedlink" />
                          </div>
                          <div className="rf-recommendations-accessory-info">
                            <h3 className="rf-recommendations-accessory-title typography-body">
                              <span>{rec.name}</span>
                            </h3>
                            <div className="rf-recommendations-accessory-price typography-body">
                              <span>{formatPrice(rec.price)}</span>
                            </div>

                            {/* Seletor de cores */}
                            {rec.colors.length > 0 && (
                              <div className="rf-recommendations-productselection">
                                <span className="rf-recommendations-productselection-colortext">
                                  Cor — {rec.selectedColor}
                                </span>
                                <ul className="colornav-items">
                                  {rec.colors.map(col => (
                                    <li key={col.name} className="colornav-item">
                                      <button
                                        type="button"
                                        className={`colornav-link ${rec.selectedColor === col.name ? 'selected' : ''}`}
                                        style={{ backgroundColor: col.hex }}
                                        onClick={() => handleColorChange(rec.id, col.name)}
                                        title={col.name}
                                      />
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="button button-block button-super rf-recommendations-accessory-button"
                            data-autom="recommendations-addToBag-button"
                            onClick={() => handleAddRecToBag(rec)}
                          >
                            <span aria-hidden="true">Colocar na sacola</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="as-l-container rf-recommendations-footer">
                    <Link to="/acessorios" className="as-buttonlink" data-analytics-title="show more products">
                      Mostrar mais produtos <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
             4. BILLBOARD NOVIDADES (1:1 APPLE STORE)
             ══════════════════════════════════════════════════════════ */}
          <div className="rs-bag-productspotlight">
            <div className="dd-billboard dd-checkout-201804-new-arrivals">
              <div className="dd-l-plate">
                <div className="dd-billboard-background">
                  <img
                    src="https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/apple-new-arrivals-checkout-201804?wid=1960&hei=800&fmt=jpeg&qlt=90"
                    alt="Novidades"
                    width="980"
                    height="400"
                    className="dd-invert-classic dd-billboard-hero ir"
                  />
                </div>
                <div className="dd-billboard-info">
                  <h2 className="dd-billboard-header">Novidades</h2>
                  <p className="dd-billboard-subcopy dd-compact-small-20">
                    Confira os acessórios que acabaram de chegar.
                  </p>
                  <p className="dd-billboard-link">
                    <Link to="/acessorios" className="more">
                      Comprar Novidades &gt;
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
             5. PERGUNTAS SOBRE A COMPRA (ACORDEÃO FAQ 1:1 APPLE)
             ══════════════════════════════════════════════════════════ */}
          <div className="rc-accordion rs-faq">
            <div className="rc-accordion-item">
              <h2>
                <button
                  type="button"
                  className="rc-accordion-button"
                  onClick={() => setOpenFaqIndex(openFaqIndex !== null ? null : 0)}
                  data-autom="faq-button"
                >
                  <span className="rc-accordion-title large-10 typography-callout">Perguntas sobre a compra</span>
                  <span className="rc-accordion-chevrondown rc-accordion-collapse-icon">
                    {openFaqIndex !== null ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                </button>
              </h2>
              <div className="rc-accordion-content-box">
                <ul className="rc-accordion rc-accordion-compact" role="list">
                  {faqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index
                    return (
                      <li key={index} className="rc-accordion-item" role="listitem">
                        <h3>
                          <button
                            type="button"
                            className="rc-accordion-button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          >
                            <span className="rc-accordion-title large-10 typography-callout">{faq.q}</span>
                            <span className="rc-accordion-chevrondown rc-accordion-collapse-icon">
                              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </button>
                        </h3>
                        {isOpen && (
                          <div className="rc-accordion-content large-10">
                            <div>{faq.a}</div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Chat / Ajuda Oficial ── */}
          <div className="rs-bag-chat-wrapper rs-bag-chat-hidekeyline">
            <div className="as-chat rs-chat">
              <div className="as-l-container rs-chat-content">
                <div>
                  Precisa de mais ajuda? <a href="/contato" className="as-chat-button" data-autom="chatNowLink">Entre no chat</a> ou ligue para <span>0800-761-0867</span>.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
