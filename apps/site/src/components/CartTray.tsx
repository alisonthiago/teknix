/* ==========================================================================
   TEKNIX SITE — CART TRAY (BANDEJA FIXA DE CARRINHO)
   --------------------------------------------------------------------------
   Bandeja fixa no rodapé (estilo SanDisk) que mostra os produtos adicionados
   ao carrinho enquanto o usuário navega pela loja.
   ========================================================================== */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './CartTray.css'

export default function CartTray() {
  const { items, totalItems, removeFromCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [prevCount, setPrevCount] = useState(0)

  useEffect(() => {
    if (items.length > 0 && items.length > prevCount) {
      setIsOpen(true)
    }
    setPrevCount(items.length)
  }, [items.length])

  if (items.length === 0) return null

  const toggle = () => setIsOpen(prev => !prev)

  return (
    <section className={`teknix-cart-tray-wrap ${isOpen ? 'tray-open' : ''}`}>
      {/* Botão único no topo da bandeja: Mais informações (abre e fecha) */}
      <button
        type="button"
        className="teknix-cart-tray-more"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Recolher carrinho' : 'Expandir carrinho'}
      >
        <span aria-hidden="true">i</span>
        Mais informações
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" className="teknix-cart-tray-caret">
          <path d="M8 10.5 3 5.5l1.4-1.4L8 7.7l3.6-3.6L13 5.5z" fill="currentColor" />
        </svg>
      </button>

      <div className="teknix-cart-tray-body">
        {/* Texto lateral */}
        <div className="teknix-cart-tray-info">
          <div className="teknix-cart-tray-title">Seu carrinho</div>
          <div className="teknix-cart-tray-sub">Adicione até 4 produtos</div>
        </div>

        {/* Lista de produtos */}
        <ul className="teknix-cart-tray-list">
          {items.slice(0, 4).map((item) => (
            <li key={item.id} className="teknix-cart-tray-item">
              <div className="teknix-cart-tray-has-item">
                <button
                  className="teknix-cart-tray-remove"
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Remover ${item.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="16" fill="#141414" />
                    <g transform="translate(1 1)">
                      <line x1="10" y1="10" x2="20" y2="20" stroke="#fff" strokeLinecap="round" strokeWidth="1.5" />
                      <line x1="20" y1="10" x2="10" y2="20" stroke="#fff" strokeLinecap="round" strokeWidth="1.5" />
                    </g>
                  </svg>
                </button>
                <Link to={`/produtos/${item.sku || item.id}`}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="teknix-cart-tray-img" />
                  ) : (
                    <div className="teknix-cart-tray-img-placeholder" />
                  )}
                </Link>
              </div>
              <div className="teknix-cart-tray-item-name" title={item.name}>
                {item.name.length > 18 ? item.name.slice(0, 18) + '…' : item.name}
              </div>
            </li>
          ))}
          {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
            <li key={`empty-${i}`} className="teknix-cart-tray-item">
              <div className="teknix-cart-tray-item-empty" />
            </li>
          ))}
        </ul>

        {/* Ações */}
        <div className="teknix-cart-tray-actions">
          <Link to="/checkout" className="teknix-cart-tray-btn-primary">
            Comprar agora
          </Link>
        </div>
      </div>
      {isOpen && (
        <div className="teknix-cart-tray-details">
          <strong>Resumo da sacola</strong>
          <span>{totalItems} {totalItems === 1 ? 'produto selecionado' : 'produtos selecionados'}.</span>
          <span>Você pode revisar quantidades, entrega e pagamento antes de concluir a compra.</span>
        </div>
      )}
    </section>
  )
}
