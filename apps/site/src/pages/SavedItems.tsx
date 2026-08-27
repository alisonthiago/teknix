/* ==========================================================================
   TEKNIX SITE — ITENS SALVOS (1:1 PADRÃO APPLE STORE YOUR SAVES)
   Referência: https://www.apple.com/br/shop/yoursaves
   Totalmente integrado ao FavoritesContext (LocalStorage + Supabase)
   ========================================================================== */

import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { useCart } from '../context/CartContext'
import { ShoppingBag, Trash2 } from 'lucide-react'
import './SavedItems.css'

export default function SavedItems() {
  const { favorites, removeFavorite } = useFavorites()
  const { addToCart } = useCart()

  return (
    <div className="apple-saved-page">
      {/* ── Local Nav ── */}
      <div className="apple-saved-localnav">
        <div className="apple-saved-container">
          <div className="apple-saved-localnav-inner">
            <h1 className="apple-saved-localnav-title">Itens salvos</h1>
          </div>
        </div>
      </div>

      <div className="apple-saved-container">
        {/* ── Breadcrumb ── */}
        <div className="apple-saved-breadcrumb">
          <Link to="/" className="breadcrumb-home">
            <svg height="14" viewBox="0 0 14 44" width="14" fill="currentColor">
              <path d="m13.0729 17.6825a3.61 3.61 0 0 0 -1.7248 3.0365 3.5132 3.5132 0 0 0 2.1379 3.2223 8.394 8.394 0 0 1 -1.0948 2.2618c-.6816.9812-1.3943 1.9623-2.4787 1.9623s-1.3633-.63-2.613-.63c-1.2187 0-1.6525.6507-2.644.6507s-1.6834-.9089-2.4787-2.0243a9.7842 9.7842 0 0 1 -1.6628-5.2776c0-3.0984 2.014-4.7405 3.9969-4.7405 1.0535 0 1.9314.6919 2.5924.6919.63 0 1.6112-.7333 2.8092-.7333a3.7579 3.7579 0 0 1 3.1604 1.5802zm-3.7284-2.8918a3.5615 3.5615 0 0 0 .8469-2.22 1.5353 1.5353 0 0 0 -.031-.32 3.5686 3.5686 0 0 0 -2.3445 1.2084 3.4629 3.4629 0 0 0 -.8779 2.1585 1.419 1.419 0 0 0 .031.2892 1.19 1.19 0 0 0 .2169.0207 3.0935 3.0935 0 0 0 2.1586-1.1368z" />
            </svg>
          </Link>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">Itens salvos</span>
        </div>

        {/* ── Header 1:1 Apple ── */}
        <div className="apple-saved-header">
          <h1 className="apple-saved-title">Itens salvos</h1>
          <p className="apple-saved-desc">
            Continue comprando os produtos que você já salvou. Compartilhe com a família, amigos e amigas e até com especialistas da TEKNIX para descobrir o que mais combina com você.
          </p>
        </div>

        {/* ── Content Area: Empty State OR Grid ── */}
        {favorites.length === 0 ? (
          <div className="apple-saved-empty-view">
            <div className="apple-saved-empty-icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="currentColor">
                <path fill="none" d="M0 0h56v56H0z" />
                <path d="M35.716 9.125a3.5 3.5 0 0 1 2.53.754 3.6 3.6 0 0 1 .754 2.58v34.197a23 23 0 0 1-.989-.903l-8.444-8.488a2.195 2.195 0 0 0-3.145.01l-8.413 8.458c-.475.464-.794.751-1.009.931V12.458a3.6 3.6 0 0 1 .753-2.58 3.5 3.5 0 0 1 2.531-.753zm0-2H20.284a5.34 5.34 0 0 0-3.949 1.343A5.43 5.43 0 0 0 15 12.458v34.367a2.2 2.2 0 0 0 .479 1.502 1.66 1.66 0 0 0 1.315.548 1.87 1.87 0 0 0 1.098-.368 15 15 0 0 0 1.515-1.343l8.433-8.478a.2.2 0 0 1 .32 0l8.433 8.478a18 18 0 0 0 1.505 1.333 1.82 1.82 0 0 0 1.107.378 1.66 1.66 0 0 0 1.316-.547A2.2 2.2 0 0 0 41 46.825V12.458a5.43 5.43 0 0 0-1.335-3.99 5.34 5.34 0 0 0-3.95-1.343" />
              </svg>
            </div>
            <h2 className="apple-saved-empty-heading">Salvar seu primeiro item</h2>
            <Link to="/produtos" className="apple-saved-empty-shop-link">
              Comprar em teknix.com.br &gt;
            </Link>
          </div>
        ) : (
          <div className="apple-saved-items-grid">
            {favorites.map(item => (
              <div key={item.id} className="apple-saved-card">
                <div className="apple-saved-card-thumb">
                  <img src={item.image_url || 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80'} alt={item.name} />
                </div>
                <div className="apple-saved-card-body">
                  <h3 className="apple-saved-card-title">{item.name}</h3>
                  <p className="apple-saved-card-price">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                  </p>
                  <div className="apple-saved-card-actions">
                    <button
                      type="button"
                      className="apple-saved-btn-buy"
                      onClick={() => {
                        addToCart({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image_url || '',
                          sku: item.sku || item.id,
                          stock: 99
                        })
                      }}
                    >
                      <ShoppingBag size={14} style={{ marginRight: 6 }} />
                      Colocar na sacola
                    </button>
                    <button
                      type="button"
                      className="apple-saved-btn-remove"
                      onClick={() => removeFavorite(item.id)}
                      title="Remover dos salvos"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
