import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'
import {
  ArrowLeft,
  Search,
  Zap,
  Star,
  Plus,
  X,
  Save,
  Loader2,
  Check,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { notifyHub } from '../lib/hubNotifications'
import './Showcases.css'

function formatCurrency(val?: number | string | null) {
  const num = Number(val) || 0
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Showcases() {
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal de busca
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [targetList, setTargetList] = useState<'flash_sale' | 'featured' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchShowcases()
  }, [])

  async function fetchShowcases() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or('flash_sale.eq.true,featured.eq.true')

      if (error) throw error

      const items = (data || []) as Product[]
      setFlashSaleProducts(items.filter(p => p.flash_sale))
      setFeaturedProducts(items.filter(p => p.featured))
    } catch (e) {
      console.error('Erro ao buscar destaques:', e)
      notifyHub('Erro ao carregar os dados das vitrines.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
          .limit(15)

        if (error) throw error
        setSearchResults((data || []) as Product[])
      } catch (e) {
        console.error('Erro na busca:', e)
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  function handleOpenSearch(target: 'flash_sale' | 'featured') {
    setTargetList(target)
    setSearchQuery('')
    setSearchResults([])
    setShowSearchModal(true)
  }

  function handleToggleProduct(product: Product) {
    if (!targetList) return

    if (targetList === 'flash_sale') {
      const exists = flashSaleProducts.some(p => p.id === product.id)
      if (exists) {
        setFlashSaleProducts(prev => prev.filter(p => p.id !== product.id))
      } else {
        setFeaturedProducts(prev => prev.filter(p => p.id !== product.id))
        setFlashSaleProducts(prev => [...prev, product])
      }
    } else {
      const exists = featuredProducts.some(p => p.id === product.id)
      if (exists) {
        setFeaturedProducts(prev => prev.filter(p => p.id !== product.id))
      } else {
        setFlashSaleProducts(prev => prev.filter(p => p.id !== product.id))
        setFeaturedProducts(prev => [...prev, product])
      }
    }
  }

  function handleRemoveProduct(id: string, list: 'flash_sale' | 'featured') {
    if (list === 'flash_sale') {
      setFlashSaleProducts(prev => prev.filter(p => p.id !== id))
    } else {
      setFeaturedProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  function moveProduct(index: number, direction: 'up' | 'down', list: 'flash_sale' | 'featured') {
    const setList = list === 'flash_sale' ? setFlashSaleProducts : setFeaturedProducts
    setList(prev => {
      const copy = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= copy.length) return prev
      const temp = copy[index]
      copy[index] = copy[targetIndex]
      copy[targetIndex] = temp
      return copy
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: currentSelected } = await supabase
        .from('products')
        .select('id')
        .or('flash_sale.eq.true,featured.eq.true')
      
      const currentIds = (currentSelected || []).map(p => p.id)
      const newFlashIds = flashSaleProducts.map(p => p.id)
      const newFeaturedIds = featuredProducts.map(p => p.id)
      const newIds = [...newFlashIds, ...newFeaturedIds]

      const toReset = currentIds.filter(id => !newIds.includes(id))

      // Reseta os que foram removidos
      if (toReset.length > 0) {
        await supabase.from('products').update({ flash_sale: false, featured: false }).in('id', toReset)
      }

      // Atualiza flash sale
      if (newFlashIds.length > 0) {
        await supabase.from('products').update({ flash_sale: true, featured: false }).in('id', newFlashIds)
      }

      // Atualiza featured
      if (newFeaturedIds.length > 0) {
        await supabase.from('products').update({ featured: true, flash_sale: false }).in('id', newFeaturedIds)
      }

      notifyHub('Vitrines atualizadas e salvas com sucesso na loja!')
    } catch (e) {
      console.error('Erro ao salvar destaques:', e)
      notifyHub('Erro ao salvar alterações. Tente novamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#666666', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Loader2 size={32} className="tkn-spin" style={{ color: '#111111' }} />
        <span>Carregando organização de vitrines...</span>
      </div>
    )
  }

  return (
    <div className="showcases-container">
      {/* ── Page Header Oficial do HUB ── */}
      <div className="showcases-header">
        <div className="header-info">
          <Link to="/hub/produtos" className="showcases-back-link">
            <ArrowLeft size={15} /> Voltar aos produtos
          </Link>
          <h1 className="showcases-title">Destaques e Vitrines</h1>
          <p className="showcases-subtitle">
            Defina quais produtos aparecem nas áreas nobres e de maior conversão da página inicial.
          </p>
        </div>

        <div className="header-actions">
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="tkn-spin" /> : <Save size={16} />}
            <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
          </button>
        </div>
      </div>

      {/* ── Grid de Vitrines Responsivo ── */}
      <div className="showcases-grid">
        
        {/* OFERTAS RELÂMPAGO */}
        <div className="showcase-card">
          <div className="showcase-card-header">
            <div className="showcase-card-title-group">
              <div className="showcase-icon-badge flash-sale">
                <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <div className="showcase-title-row">
                  <h2 className="showcase-card-h2">Ofertas Relâmpago</h2>
                  <span className="showcase-count-pill flash-sale">
                    {flashSaleProducts.length}
                  </span>
                </div>
                <p className="showcase-card-desc">Exibido no carrossel de ofertas com cronômetro da Home</p>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => handleOpenSearch('flash_sale')}
            >
              <Plus size={15} /> Adicionar
            </button>
          </div>

          <div className="showcase-products-list">
            {flashSaleProducts.length === 0 ? (
              <div className="showcase-empty-state">
                <Zap size={26} className="showcase-empty-icon" />
                <div className="showcase-empty-title">Nenhum produto em oferta relâmpago</div>
                <div className="showcase-empty-desc">Clique em "Adicionar" para selecionar itens com desconto especial.</div>
              </div>
            ) : (
              flashSaleProducts.map((product, index) => (
                <div key={product.id} className="showcase-product-item">
                  <div className="showcase-reorder-btns">
                    <button 
                      type="button" 
                      disabled={index === 0} 
                      onClick={() => moveProduct(index, 'up', 'flash_sale')}
                      className="showcase-reorder-btn"
                      title="Mover para cima"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      type="button" 
                      disabled={index === flashSaleProducts.length - 1} 
                      onClick={() => moveProduct(index, 'down', 'flash_sale')}
                      className="showcase-reorder-btn"
                      title="Mover para baixo"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <img 
                    src={product.image_url || '/placeholder.png'} 
                    alt={product.name} 
                    className="showcase-product-thumb"
                  />
                  
                  <div className="showcase-product-info">
                    <span className="showcase-product-name" title={product.name}>
                      {product.name}
                    </span>
                    <div className="showcase-product-meta">
                      <span>SKU: {product.sku || 'S/N'}</span>
                      <span>•</span>
                      <span className="showcase-product-price">{formatCurrency(product.promo_price || product.price)}</span>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleRemoveProduct(product.id, 'flash_sale')} 
                    className="showcase-product-remove"
                    title="Remover da vitrine"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PRODUTOS EM DESTAQUE */}
        <div className="showcase-card">
          <div className="showcase-card-header">
            <div className="showcase-card-title-group">
              <div className="showcase-icon-badge featured">
                <Star size={20} fill="currentColor" />
              </div>
              <div>
                <div className="showcase-title-row">
                  <h2 className="showcase-card-h2">Produtos em Destaque</h2>
                  <span className="showcase-count-pill featured">
                    {featuredProducts.length}
                  </span>
                </div>
                <p className="showcase-card-desc">Vitrine principal da Home (Grid editorial em destaque)</p>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => handleOpenSearch('featured')}
            >
              <Plus size={15} /> Adicionar
            </button>
          </div>

          <div className="showcase-products-list">
            {featuredProducts.length === 0 ? (
              <div className="showcase-empty-state">
                <Star size={26} className="showcase-empty-icon" />
                <div className="showcase-empty-title">Nenhum produto em destaque</div>
                <div className="showcase-empty-desc">Clique em "Adicionar" para selecionar os produtos que devem brilhar na Home.</div>
              </div>
            ) : (
              featuredProducts.map((product, index) => (
                <div key={product.id} className="showcase-product-item">
                  <div className="showcase-reorder-btns">
                    <button 
                      type="button" 
                      disabled={index === 0} 
                      onClick={() => moveProduct(index, 'up', 'featured')}
                      className="showcase-reorder-btn"
                      title="Mover para cima"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      type="button" 
                      disabled={index === featuredProducts.length - 1} 
                      onClick={() => moveProduct(index, 'down', 'featured')}
                      className="showcase-reorder-btn"
                      title="Mover para baixo"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <img 
                    src={product.image_url || '/placeholder.png'} 
                    alt={product.name} 
                    className="showcase-product-thumb"
                  />
                  
                  <div className="showcase-product-info">
                    <span className="showcase-product-name" title={product.name}>
                      {product.name}
                    </span>
                    <div className="showcase-product-meta">
                      <span>SKU: {product.sku || 'S/N'}</span>
                      <span>•</span>
                      <span className="showcase-product-price">{formatCurrency(product.promo_price || product.price)}</span>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleRemoveProduct(product.id, 'featured')} 
                    className="showcase-product-remove"
                    title="Remover da vitrine"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── Modal de Busca Padronizado ── */}
      {showSearchModal && (
        <div 
          className="showcase-modal-overlay"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className="showcase-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="showcase-modal-header">
              <div>
                <h3 className="showcase-modal-title">
                  Adicionar a {targetList === 'flash_sale' ? 'Ofertas Relâmpago' : 'Produtos em Destaque'}
                </h3>
                <span className="showcase-modal-subtitle">
                  Clique no produto para adicionar ou remover da lista selecionada.
                </span>
              </div>
              <button 
                type="button"
                className="showcase-modal-close"
                onClick={() => setShowSearchModal(false)} 
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="showcase-search-wrap">
              <Search size={16} className="showcase-search-icon" />
              <input 
                type="text" 
                placeholder="Buscar produto por nome ou SKU..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="showcase-search-input"
                autoFocus
              />
            </div>

            <div className="showcase-search-results">
              {searching ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#666666', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '13px' }}>
                  <Loader2 size={16} className="tkn-spin" />
                  <span>Buscando produtos no catálogo...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(product => {
                  const isFlash = flashSaleProducts.some(p => p.id === product.id)
                  const isFeatured = featuredProducts.some(p => p.id === product.id)
                  const isSelectedInTarget = targetList === 'flash_sale' ? isFlash : isFeatured

                  return (
                    <div 
                      key={product.id} 
                      onClick={() => handleToggleProduct(product)} 
                      className={`showcase-search-item ${isSelectedInTarget ? 'selected' : ''}`}
                    >
                      <img 
                        src={product.image_url || '/placeholder.png'} 
                        alt={product.name} 
                        className="showcase-product-thumb"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: '#111111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: '12px', color: '#666666' }}>
                          <span>SKU: {product.sku || 'S/N'}</span>
                          <span>•</span>
                          <span style={{ color: '#111111', fontWeight: 600 }}>{formatCurrency(product.promo_price || product.price)}</span>
                          {isFlash && targetList !== 'flash_sale' && <span style={{ color: '#dc2626', fontWeight: 600 }}>(em Relâmpago)</span>}
                          {isFeatured && targetList !== 'featured' && <span style={{ color: '#d97706', fontWeight: 600 }}>(em Destaque)</span>}
                        </div>
                      </div>
                      
                      <div className="showcase-select-checkbox">
                        {isSelectedInTarget && <Check size={13} strokeWidth={3} />}
                      </div>
                    </div>
                  )
                })
              ) : searchQuery.length >= 2 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#666666', fontSize: '13px' }}>
                  Nenhum produto encontrado para "<strong>{searchQuery}</strong>".
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#888888', fontSize: '13px' }}>
                  Digite pelo menos 2 caracteres para buscar produtos.
                </div>
              )}
            </div>

            <div className="showcase-modal-footer">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setShowSearchModal(false)}
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
