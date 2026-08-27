/* ==========================================================================
   TEKNIX SITE — CART DRAWER
   Painel lateral que abre quando o usuário adiciona um produto.
   ========================================================================== */

import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './CartDrawer.css'

export default function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, totalPrice, removeFromCart, updateQuantity } = useCart()

  function formatPrice(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay ${isOpen ? 'open' : ''}`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h2>Carrinho <span className="cart-badge">{totalItems}</span></h2>
          <button className="cart-close-btn" onClick={closeCart} aria-label="Fechar carrinho">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="52" height="52">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <p>Seu carrinho está vazio</p>
            <button className="btn-continue" onClick={closeCart}>Continuar comprando</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => {
                const price = item.promo_price && item.promo_price > 0 ? item.promo_price : item.price
                return (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-img">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="cart-item-img-placeholder" />
                      )}
                    </div>
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      {item.sku && <span className="cart-item-sku">SKU: {item.sku}</span>}
                      <span className="cart-item-price">{formatPrice(price)}</span>
                      <div className="cart-item-qty">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Diminuir quantidade"
                        >−</button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Aumentar quantidade"
                        >+</button>
                      </div>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remover item"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
              <p className="cart-shipping-note">
                Frete calculado no checkout
              </p>
              <Link
                to="/checkout"
                className="btn-checkout"
                onClick={closeCart}
              >
                Finalizar Compra
              </Link>
              <button className="btn-continue-shopping" onClick={closeCart}>
                Continuar Comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
