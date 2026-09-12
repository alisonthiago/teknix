import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { useCart } from '../context/CartContext'
import { ShoppingBag, Trash2, Check, ArrowRight, Heart, Truck, ShieldCheck, ChevronRight } from 'lucide-react'
import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
import './SavedItems.css'

export default function SavedItems() {
  const { favorites, removeFavorite, clearFavorites } = useFavorites()
  const { addToCart, openCart } = useCart()
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image_url || '',
      sku: item.sku || item.id,
      slug: item.slug || item.id,
      stock: 99
    })
    setAddedIds(prev => ({ ...prev, [item.id]: true }))
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [item.id]: false }))
    }, 2000)
    openCart()
  }

  const handleAddAllToCart = () => {
    favorites.forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image_url || '',
        sku: item.sku || item.id,
        slug: item.slug || item.id,
        stock: 99
      })
    })
    openCart()
  }

  return (
    <div className="apple-saved-page">
      <div className="apple-saved-container">
        <EditableFlow id="saved-page" label="Estrutura dos itens salvos">
          {/* ── Breadcrumb ── */}
          <Editable as="div" widgetId="saved-breadcrumb" label="Navegação dos itens salvos" widgetType="container" editorKind="container" renderContent={false} className="apple-saved-breadcrumb">
            <Link to="/" className="breadcrumb-home">Início</Link>
            <span className="breadcrumb-sep">&gt;</span>
            <Link to="/conta" className="breadcrumb-home">Minha conta</Link>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-current">Itens salvos</span>
          </Editable>

          {/* ── Header TEKNIX ── */}
          <Editable as="div" widgetId="saved-header" label="Cabeçalho dos itens salvos" widgetType="container" editorKind="container" renderContent={false} className="apple-saved-header">
            <div className="apple-saved-header-main">
              <div className="apple-saved-header-text">
                <div className="apple-saved-title-row">
                  <Editable as="h1" widgetId="saveditems-1" className="apple-saved-title">Itens salvos</Editable>
                  {favorites.length > 0 && (
                    <span className="apple-saved-count-badge">
                      {favorites.length} {favorites.length === 1 ? 'item salvo' : 'itens salvos'}
                    </span>
                  )}
                </div>
                <Editable as="p" widgetId="saveditems-2" className="apple-saved-desc">
                  Seus produtos favoritos reunidos com preços atualizados e entrega rápida para você decidir no seu tempo.
                </Editable>
              </div>

              {favorites.length > 0 && (
                <div className="apple-saved-header-actions">
                  <button
                    type="button"
                    className="apple-saved-btn-add-all"
                    onClick={handleAddAllToCart}
                  >
                    <ShoppingBag size={15} />
                    Mover todos para a sacola
                  </button>
                  <button
                    type="button"
                    className="apple-saved-btn-clear"
                    onClick={clearFavorites}
                    title="Limpar todos os favoritos"
                  >
                    Limpar lista
                  </button>
                </div>
              )}
            </div>
          </Editable>

          {/* ── Content Area: Empty State OR Grid ── */}
          {favorites.length === 0 ? (
            <Editable as="div" widgetId="saved-empty" label="Estado vazio dos itens salvos" widgetType="container" editorKind="container" renderContent={false} className="apple-saved-empty-view">
              <div className="apple-saved-empty-icon">
                <Heart size={38} strokeWidth={1.5} />
              </div>
              <Editable as="h2" widgetId="saveditems-3" className="apple-saved-empty-heading">Sua lista de salvos está vazia</Editable>
              <Editable as="p" widgetId="saveditems-4" className="apple-saved-empty-desc">
                Toque no ícone de coração nos produtos que você gostar. Eles ficarão guardados aqui para você consultar, comparar especificações e comprar quando desejar.
              </Editable>
              <Link to="/produtos" className="apple-saved-empty-shop-link">
                Explorar Catálogo TEKNIX
                <ArrowRight size={16} style={{ marginLeft: 8 }} />
              </Link>

              {/* Categorias Rápidas */}
              <div className="apple-saved-empty-suggestions">
                <span className="suggestions-label">Ou navegue por departamento:</span>
                <div className="suggestions-pills">
                  <Link to="/produtos?q=parafusadeira" className="suggestion-pill">Parafusadeiras</Link>
                  <Link to="/produtos?q=furadeira" className="suggestion-pill">Furadeiras & Marteletes</Link>
                  <Link to="/produtos?q=macaco" className="suggestion-pill">Linha Automotiva</Link>
                  <Link to="/produtos?q=ferramentas" className="suggestion-pill">Kits de Ferramentas</Link>
                </div>
              </div>
            </Editable>
          ) : (
            <Editable as="div" widgetId="saved-grid" label="Grade de itens salvos" widgetType="grid" editorKind="container" renderContent={false} className="apple-saved-items-grid">
              <EditableFlow id="saved-items" label="Cards dos itens salvos" compact>
                {favorites.map(item => {
                  const productUrl = `/produto/${item.slug || item.id}`
                  const isAdded = addedIds[item.id]
                  const installmentVal = (item.price / 10).toFixed(2).replace('.', ',')

                  return (
                    <Editable
                      as="div"
                      key={item.id}
                      widgetId={`saved-card-${item.id}`}
                      productId={item.id}
                      label={`Produto salvo: ${item.name}`}
                      widgetType="storefrontCard"
                      editorKind="widget"
                      renderContent={false}
                      className="apple-saved-card"
                    >
                      {/* Botão de exclusão discreto no topo */}
                      <button
                        type="button"
                        className="apple-saved-card-remove-top"
                        onClick={() => removeFavorite(item.id)}
                        title="Remover dos salvos"
                        aria-label="Remover dos salvos"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Thumbnail com link */}
                      <Link to={productUrl} className="apple-saved-card-thumb" aria-label={`Ver detalhes de ${item.name}`}>
                        <Editable
                          as="img"
                          widgetId={`saved-card-${item.id}-image`}
                          productId={item.id}
                          label={`Imagem: ${item.name}`}
                          widgetType="image"
                          src={item.image_url || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'}
                          alt={item.name}
                        />
                      </Link>

                      {/* Corpo do Card */}
                      <div className="apple-saved-card-body">
                        {/* Tags de Confiança e Frete */}
                        <div className="apple-saved-card-tags">
                          <span className="card-tag shipping">
                            <Truck size={12} />
                            Frete Grátis
                          </span>
                          <span className="card-tag stock">
                            <ShieldCheck size={12} />
                            Em estoque
                          </span>
                        </div>

                        {/* Título com Link */}
                        <Link to={productUrl} className="apple-saved-card-title-link">
                          <Editable
                            as="h3"
                            widgetId={`saved-card-${item.id}-title`}
                            productId={item.id}
                            label={`Título: ${item.name}`}
                            widgetType="heading"
                            className="apple-saved-card-title"
                          >
                            {item.name}
                          </Editable>
                        </Link>

                        {/* Preço e Parcelamento */}
                        <div className="apple-saved-card-pricing">
                          <Editable
                            as="p"
                            widgetId={`saved-card-${item.id}-price`}
                            productId={item.id}
                            label="Preço"
                            widgetType="text"
                            className="apple-saved-card-price"
                          >
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                          </Editable>
                          <span className="apple-saved-card-installments">
                            em até <strong>10x de R$ {installmentVal}</strong> sem juros
                          </span>
                        </div>

                        {/* Ações do Card */}
                        <div className="apple-saved-card-actions">
                          <button
                            type="button"
                            className={`apple-saved-btn-buy ${isAdded ? 'is-added' : ''}`}
                            onClick={() => handleAddToCart(item)}
                          >
                            {isAdded ? (
                              <>
                                <Check size={16} />
                                Adicionado à sacola!
                              </>
                            ) : (
                              <>
                                <ShoppingBag size={16} />
                                Colocar na sacola
                              </>
                            )}
                          </button>
                          <Link to={productUrl} className="apple-saved-btn-view">
                            Ver detalhes
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </Editable>
                  )
                })}
              </EditableFlow>
            </Editable>
          )}
        </EditableFlow>
      </div>
    </div>
  )
}
