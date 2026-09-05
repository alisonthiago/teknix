import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Minus, Plus, Trash2, Package, MessageCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import './Bag.css'

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Bag() {
  const { items, totalItems, removeFromCart, updateQuantity, totalPrice } = useCart()
  const [notice, setNotice] = useState('')
  return (
    <div className="cb-bag-page">
      <div className="cb-bag-container">
        <EditableFlow id="bag-page" label="Estrutura da sacola">
        <Editable as="nav" widgetId="bag-breadcrumbs" label="Navegação da sacola" widgetType="container" editorKind="container" renderContent={false} className="cb-bag-breadcrumbs" aria-label="Navegação estrutural">
          <Link to="/">Início</Link><span aria-hidden="true">/</span><span aria-current="page">Sacola</span>
        </Editable>
        <Editable as="header" widgetId="bag-heading" label="Cabeçalho da sacola" widgetType="container" editorKind="container" renderContent={false} className="cb-bag-heading">
          <div><Editable as="h1" widgetId="bag-1">Minha sacola <span>{totalItems}</span></Editable><Editable content={{}} as="p" widgetId="bag-2">{items.length ? 'Revise seus itens.' : 'Escolha seus produtos.'}</Editable></div>
          {items.length > 0 && <Link to="/produtos" className="cb-bag-text-link">Continuar comprando <ArrowRight size={16} /></Link>}
        </Editable>
        <Editable content={{}} as="p" widgetId="bag-3" className="cb-bag-notice" role="status">{notice}</Editable>
        {items.length === 0 ? (
          <Editable as="section" widgetId="bag-4" className="cb-bag-empty">
            <div className="cb-bag-empty-icon"><ShoppingBag size={38} strokeWidth={1.3} /></div>
            <Editable as="h2" widgetId="bag-5">Sua sacola está vazia</Editable>
            <Editable as="p" widgetId="bag-6">Encontre o que você precisa e adicione à sacola.</Editable>
            <Link to="/produtos" className="cb-bag-primary">Explorar produtos <ArrowRight size={18} /></Link>
            <Link to="/salvos" className="cb-bag-text-link">Ver meus itens salvos</Link>
          </Editable>
        ) : (
          <Editable as="div" widgetId="bag-layout" label="Produtos e resumo" widgetType="container" editorKind="container" renderContent={false} className="cb-bag-layout">
            <EditableFlow id="bag-columns" label="Colunas da sacola">
            <Editable content={{}} as="section" widgetId="bag-7" className="cb-bag-items" aria-label="Produtos na sacola">
              <EditableFlow id="bag-items" label="Produtos da sacola">
              {items.map(item => {
                const price = item.promo_price && item.promo_price > 0 ? item.promo_price : item.price
                const productUrl = '/produtos/' + encodeURIComponent(item.id)
                const cardKey = `bag-item-${item.id}`
                return <Editable as="article" key={item.id} widgetId={cardKey} productId={item.id} label={`Produto: ${item.name}`} widgetType="storefrontCard" editorKind="container" renderContent={false} className="cb-bag-item">
                  <Editable as={Link} widgetId={`${cardKey}-image`} productId={item.id} label={`Imagem: ${item.name}`} widgetType="image" content={{ src: item.image || '', alt: item.name }} renderContent={false} to={productUrl} className="cb-bag-item-image" aria-label={'Ver ' + item.name}>
                    {item.image ? <img src={item.image} alt={item.name} /> : <Package size={36} />}
                  </Editable>
                  <div className="cb-bag-item-info">
                    <Editable as={Link} widgetId={`${cardKey}-name`} productId={item.id} label={`Título: ${item.name}`} widgetType="heading" to={productUrl} className="cb-bag-item-name">{item.name}</Editable>
                    {item.sku && <Editable as="p" widgetId={`${cardKey}-sku`} productId={item.id} label="SKU" widgetType="text" className="cb-bag-item-sku">SKU: {item.sku}</Editable>}
                    <Editable as="p" widgetId={`${cardKey}-unit-price`} productId={item.id} label="Preço unitário" widgetType="text" className="cb-bag-unit-price">{formatPrice(price)} por unidade</Editable>
                    <div className="cb-bag-item-controls">
                      <div className="cb-bag-quantity" role="group" aria-label={'Quantidade de ' + item.name}>
                        <button type="button" disabled={item.quantity <= 1} aria-label={'Diminuir quantidade de ' + item.name} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={15} /></button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" disabled={item.stock <= 0 || item.quantity >= item.stock} aria-label={'Aumentar quantidade de ' + item.name} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={15} /></button>
                      </div>
                      <Editable as="button" widgetId={`${cardKey}-remove`} productId={item.id} label="Botão remover" widgetType="button" renderContent={false} type="button" className="cb-bag-remove" aria-label={'Remover ' + item.name} onClick={() => { removeFromCart(item.id); setNotice(item.name + ' removido da sacola.') }}><Trash2 size={15} /><span>Remover</span></Editable>
                    </div>
                  </div>
                  <Editable as="div" widgetId={`${cardKey}-total`} productId={item.id} label="Total do produto" widgetType="text" className="cb-bag-item-total">{formatPrice(price * item.quantity)}</Editable>
                </Editable>
              })}
              </EditableFlow>
            </Editable>
            <Editable as="aside" widgetId="bag-summary" label="Resumo do pedido" widgetType="container" editorKind="container" renderContent={false} className="cb-bag-summary" aria-label="Resumo da sacola">
              <Editable as="h2" widgetId="bag-8">Resumo do pedido</Editable>
              <dl>
                <div><dt>Produtos ({totalItems})</dt><dd>{formatPrice(totalPrice)}</dd></div>
                <div><dt>Entrega</dt><dd>A calcular</dd></div>
                <div className="cb-bag-total"><dt>Subtotal</dt><dd>{formatPrice(totalPrice)}</dd></div>
              </dl>
              <Editable as="p" widgetId="bag-9">Frete e pagamento na próxima etapa.</Editable>
              <Link to="/checkout" className="cb-bag-primary">Continuar para pagamento <ArrowRight size={18} /></Link>
              <span className="cb-bag-summary-note">Revise antes de concluir.</span>
            </Editable>
            </EditableFlow>
          </Editable>
        )}
        <Editable as="div" widgetId="bag-support" label="Ajuda da sacola" widgetType="container" editorKind="container" renderContent={false} className="cb-bag-support"><MessageCircle size={20} /><Editable as="p" widgetId="bag-10">Precisa de ajuda com sua compra?</Editable><Link to="/contato">Fale com a TEKNIX <ArrowRight size={15} /></Link></Editable>
        </EditableFlow>
      </div>
    </div>
  )
}
