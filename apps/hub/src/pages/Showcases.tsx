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
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import './ProductsList.css'

function formatCurrency(val?: number | string | null) {
  const num = Number(val) || 0
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Showcases() {
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal de busca
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [targetList, setTargetList] = useState<'flash_sale' | 'featured' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchShowcases()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function fetchShowcases() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or('flash_sale.eq.true,featured.eq.true')

      if (error) throw error

      const items = data as Product[]
      setFlashSaleProducts(items.filter(p => p.flash_sale))
      setFeaturedProducts(items.filter(p => p.featured))
    } catch (e) {
      console.error('Erro ao buscar destaques:', e)
      setToast({ message: 'Erro ao carregar os dados das vitrines.', type: 'error' })
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
        setSearchResults(data as Product[])
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

      setToast({ message: 'Vitrines atualizadas e salvas com sucesso na loja!', type: 'success' })
    } catch (e) {
      console.error('Erro ao salvar destaques:', e)
      setToast({ message: 'Erro ao salvar alterações. Tente novamente.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Loader2 size={32} className="tkn-spin" style={{ color: '#0066cc' }} />
        <span>Carregando organização de vitrines...</span>
      </div>
    )
  }

  return (
    <div className="products-page-container" style={{ paddingBottom: 100 }}>
      <div className="products-wrapper">
        <div className="page-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div className="header-info">
            <Link to="/hub/produtos" className="btn btn-icon" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
              <ArrowLeft size={16} /> Voltar aos produtos
            </Link>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>Organização de Vitrines</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>Defina quais produtos aparecem nas áreas nobres e de maior conversão da página inicial.</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary" 
              onClick={handleSave} 
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#0066cc',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.95rem',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(0, 102, 204, 0.2)'
              }}
            >
              {saving ? <Loader2 size={16} className="tkn-spin" /> : <Save size={16} />}
              <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
            </button>
          </div>
        </div>

        {/* Grid de Vitrines Responsivo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          
          {/* OFERTAS RELÂMPAGO */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#fef2f2', color: '#dc2626', width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={22} fill="currentColor" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>Ofertas Relâmpago</h2>
                    <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                      {flashSaleProducts.length}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Exibido no carrossel de ofertas com cronômetro</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleOpenSearch('flash_sale')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Adicionar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {flashSaleProducts.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc' }}>
                  <Zap size={28} style={{ color: '#cbd5e1', marginBottom: 8, marginInline: 'auto' }} />
                  <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Nenhum produto em oferta relâmpago</div>
                  <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Clique em "Adicionar" para selecionar itens com desconto especial.</div>
                </div>
              ) : (
                flashSaleProducts.map((product, index) => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff', transition: 'border-color 0.15s' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button 
                        type="button" 
                        disabled={index === 0} 
                        onClick={() => moveProduct(index, 'up', 'flash_sale')}
                        style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.25 : 0.7, padding: 2 }}
                        title="Mover para cima"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        type="button" 
                        disabled={index === flashSaleProducts.length - 1} 
                        onClick={() => moveProduct(index, 'down', 'flash_sale')}
                        style={{ background: 'none', border: 'none', cursor: index === flashSaleProducts.length - 1 ? 'not-allowed' : 'pointer', opacity: index === flashSaleProducts.length - 1 ? 0.25 : 0.7, padding: 2 }}
                        title="Mover para baixo"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <img 
                      src={product.image_url || '/placeholder.png'} 
                      alt={product.name} 
                      style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }} 
                    />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.name}
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: '0.8rem', color: '#64748b' }}>
                        <span>SKU: {product.sku || 'S/N'}</span>
                        <span>•</span>
                        <strong style={{ color: '#0f172a' }}>{formatCurrency(product.promo_price || product.price)}</strong>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveProduct(product.id, 'flash_sale')} 
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none' }}
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
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#fef3c7', color: '#d97706', width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={22} fill="currentColor" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>Produtos em Destaque</h2>
                    <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                      {featuredProducts.length}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Vitrine principal da Home (Grid editorial em destaque)</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleOpenSearch('featured')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Adicionar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {featuredProducts.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc' }}>
                  <Star size={28} style={{ color: '#cbd5e1', marginBottom: 8, marginInline: 'auto' }} />
                  <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Nenhum produto em destaque</div>
                  <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Clique em "Adicionar" para selecionar os produtos que devem brilhar na Home.</div>
                </div>
              ) : (
                featuredProducts.map((product, index) => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff', transition: 'border-color 0.15s' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button 
                        type="button" 
                        disabled={index === 0} 
                        onClick={() => moveProduct(index, 'up', 'featured')}
                        style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.25 : 0.7, padding: 2 }}
                        title="Mover para cima"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        type="button" 
                        disabled={index === featuredProducts.length - 1} 
                        onClick={() => moveProduct(index, 'down', 'featured')}
                        style={{ background: 'none', border: 'none', cursor: index === featuredProducts.length - 1 ? 'not-allowed' : 'pointer', opacity: index === featuredProducts.length - 1 ? 0.25 : 0.7, padding: 2 }}
                        title="Mover para baixo"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <img 
                      src={product.image_url || '/placeholder.png'} 
                      alt={product.name} 
                      style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }} 
                    />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.name}
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: '0.8rem', color: '#64748b' }}>
                        <span>SKU: {product.sku || 'S/N'}</span>
                        <span>•</span>
                        <strong style={{ color: '#0f172a' }}>{formatCurrency(product.promo_price || product.price)}</strong>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveProduct(product.id, 'featured')} 
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none' }}
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
      </div>

      {/* Modal de Busca Modernizado */}
      {showSearchModal && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            style={{ background: '#fff', width: '100%', maxWidth: 580, borderRadius: 14, padding: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Adicionar a {targetList === 'flash_sale' ? 'Ofertas Relâmpago' : 'Produtos em Destaque'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Clique no produto para adicionar ou remover da lista selecionada.</span>
              </div>
              <button 
                onClick={() => setShowSearchModal(false)} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Buscar produto por nome ou SKU..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '11px 16px 11px 40px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#0f172a' }}
                autoFocus
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searching ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Loader2 size={18} className="tkn-spin" />
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
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 14, 
                        padding: '10px 14px', 
                        border: `1.5px solid ${isSelectedInTarget ? '#0066cc' : '#e2e8f0'}`, 
                        borderRadius: 8, 
                        cursor: 'pointer', 
                        background: isSelectedInTarget ? '#f0f7ff' : '#fff',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img 
                        src={product.image_url || '/placeholder.png'} 
                        alt={product.name} 
                        style={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }} 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: '0.8rem', color: '#64748b' }}>
                          <span>SKU: {product.sku || 'S/N'}</span>
                          <span>•</span>
                          <strong style={{ color: '#0f172a' }}>{formatCurrency(product.promo_price || product.price)}</strong>
                          {isFlash && targetList !== 'flash_sale' && <span style={{ color: '#dc2626', fontWeight: 500 }}>(em Relâmpago)</span>}
                          {isFeatured && targetList !== 'featured' && <span style={{ color: '#d97706', fontWeight: 500 }}>(em Destaque)</span>}
                        </div>
                      </div>
                      
                      <div style={{ 
                        width: 22, 
                        height: 22, 
                        borderRadius: '50%', 
                        border: isSelectedInTarget ? 'none' : '1.5px solid #cbd5e1', 
                        background: isSelectedInTarget ? '#0066cc' : 'transparent', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelectedInTarget && <CheckCircle2 size={16} color="#fff" />}
                      </div>
                    </div>
                  )
                })
              ) : searchQuery.length >= 2 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Nenhum produto encontrado para "<strong>{searchQuery}</strong>".
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  Digite pelo menos 2 caracteres para buscar produtos.
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toast.type === 'success' ? '#0f172a' : '#ef4444',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 99999,
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} color="#22c55e" /> : <AlertCircle size={18} color="#ffffff" />}
          <span>{toast.message}</span>
        </div>
      )}
      
    </div>
  )
}
