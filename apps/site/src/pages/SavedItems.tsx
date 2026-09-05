import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
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
      <div className="apple-saved-container">
        <EditableFlow id="saved-page" label="Estrutura dos itens salvos">
        {/* ── Breadcrumb ── */}
        <Editable as="div" widgetId="saved-breadcrumb" label="Navegação dos itens salvos" widgetType="container" editorKind="container" renderContent={false} className="apple-saved-breadcrumb">
          <Link to="/" className="breadcrumb-home">
            Início
          </Link>
          <span className="breadcrumb-sep">&gt;</span>
          <Link to="/conta" className="breadcrumb-home">Minha conta</Link>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">Itens salvos</span>
        </Editable>

        {/* ── Header TEKNIX ── */}
        <Editable as="div" widgetId="saved-header" label="Cabeçalho dos itens salvos" widgetType="container" editorKind="container" renderContent={false} className="apple-saved-header">
          <Editable as="h1" widgetId="saveditems-1" className="apple-saved-title">Itens salvos</Editable>
          <Editable as="p" widgetId="saveditems-2" className="apple-saved-desc">
            Seus favoritos reunidos para você escolher no seu tempo.
          </Editable>
        </Editable>

        {/* ── Content Area: Empty State OR Grid ── */}
        {favorites.length === 0 ? (
          <Editable as="div" widgetId="saved-empty" label="Estado vazio dos itens salvos" widgetType="container" editorKind="container" renderContent={false} className="apple-saved-empty-view">
            <div className="apple-saved-empty-icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="currentColor">
                <path fill="none" d="M0 0h56v56H0z" />
                <path d="M35.716 9.125a3.5 3.5 0 0 1 2.53.754 3.6 3.6 0 0 1 .754 2.58v34.197a23 23 0 0 1-.989-.903l-8.444-8.488a2.195 2.195 0 0 0-3.145.01l-8.413 8.458c-.475.464-.794.751-1.009.931V12.458a3.6 3.6 0 0 1 .753-2.58 3.5 3.5 0 0 1 2.531-.753zm0-2H20.284a5.34 5.34 0 0 0-3.949 1.343A5.43 5.43 0 0 0 15 12.458v34.367a2.2 2.2 0 0 0 .479 1.502 1.66 1.66 0 0 0 1.315.548 1.87 1.87 0 0 0 1.098-.368 15 15 0 0 0 1.515-1.343l8.433-8.478a.2.2 0 0 1 .32 0l8.433 8.478a18 18 0 0 0 1.505 1.333 1.82 1.82 0 0 0 1.107.378 1.66 1.66 0 0 0 1.316-.547A2.2 2.2 0 0 0 41 46.825V12.458a5.43 5.43 0 0 0-1.335-3.99 5.34 5.34 0 0 0-3.95-1.343" />
              </svg>
            </div>
            <Editable as="h2" widgetId="saveditems-3" className="apple-saved-empty-heading">Escolha seu próximo produto</Editable>
            <Editable as="p" widgetId="saveditems-4" className="apple-saved-empty-desc">Toque no coração dos produtos que gostar. Eles ficam reunidos aqui para você consultar depois.</Editable>
            <Link to="/produtos" className="apple-saved-empty-shop-link">
              Explorar produtos →
            </Link>
          </Editable>
        ) : (
          <Editable as="div" widgetId="saved-grid" label="Grade de itens salvos" widgetType="grid" editorKind="container" renderContent={false} className="apple-saved-items-grid">
            <EditableFlow id="saved-items" label="Cards dos itens salvos">
            {favorites.map(item => (
              <Editable as="div" key={item.id} widgetId={`saved-card-${item.id}`} productId={item.id} label={`Produto salvo: ${item.name}`} widgetType="storefrontCard" editorKind="container" renderContent={false} className="apple-saved-card">
                <div className="apple-saved-card-thumb">
                  <Editable as="img" widgetId={`saved-card-${item.id}-image`} productId={item.id} label={`Imagem: ${item.name}`} widgetType="image" src={item.image_url || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'} alt={item.name} />
                </div>
                <div className="apple-saved-card-body">
                  <Editable as="h3" widgetId={`saved-card-${item.id}-title`} productId={item.id} label={`Título: ${item.name}`} widgetType="heading" className="apple-saved-card-title">{item.name}</Editable>
                  <Editable as="p" widgetId={`saved-card-${item.id}-price`} productId={item.id} label="Preço" widgetType="text" className="apple-saved-card-price">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                  </Editable>
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
              </Editable>
            ))}
            </EditableFlow>
          </Editable>
        )}
        </EditableFlow>
      </div>
    </div>
  )
}
