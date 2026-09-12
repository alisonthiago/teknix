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
  CheckCircle2
} from 'lucide-react'
import './ProductsList.css'

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

      const items = data as Product[]
      setFlashSaleProducts(items.filter(p => p.flash_sale))
      setFeaturedProducts(items.filter(p => p.featured))
    } catch (e) {
      console.error('Erro ao buscar destaques:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
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
          .limit(10)

        if (error) throw error
        setSearchResults(data as Product[])
      } catch (e) {
        console.error('Erro na busca:', e)
      } finally {
        setSearching(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  function handleOpenSearch(target: 'flash_sale' | 'featured') {
    setTargetList(target)
    setSearchQuery('')
    setSearchResults([])
    setShowSearchModal(true)
  }

  function handleSelectProduct(product: Product) {
    if (!targetList) return

    // Verifica se já está em alguma lista
    if (flashSaleProducts.some(p => p.id === product.id)) {
      setFlashSaleProducts(prev => prev.filter(p => p.id !== product.id))
    }
    if (featuredProducts.some(p => p.id === product.id)) {
      setFeaturedProducts(prev => prev.filter(p => p.id !== product.id))
    }

    // Adiciona na lista desejada
    if (targetList === 'flash_sale') {
      setFlashSaleProducts(prev => [...prev, product])
    } else {
      setFeaturedProducts(prev => [...prev, product])
    }

    setShowSearchModal(false)
  }

  function handleRemoveProduct(id: string, list: 'flash_sale' | 'featured') {
    if (list === 'flash_sale') {
      setFlashSaleProducts(prev => prev.filter(p => p.id !== id))
    } else {
      setFeaturedProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // 1. Zera todos (poderia ser otimizado para não alterar todos)
      // Como não temos um update em massa simples no Supabase v2 sem rpc, vamos atualizar 1 a 1 ou em pequenos lotes
      // Para evitar resetar todos os produtos (pode dar timeout), vamos buscar os atuais e zerar os que saíram.
      const { data: currentSelected } = await supabase
        .from('products')
        .select('id')
        .or('flash_sale.eq.true,featured.eq.true')
      
      const currentIds = (currentSelected || []).map(p => p.id)
      const newFlashIds = flashSaleProducts.map(p => p.id)
      const newFeaturedIds = featuredProducts.map(p => p.id)
      const newIds = [...newFlashIds, ...newFeaturedIds]

      const toReset = currentIds.filter(id => !newIds.includes(id))

      // Reseta
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

      alert('Destaques salvos com sucesso na loja!')
    } catch (e) {
      console.error('Erro ao salvar destaques:', e)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Carregando vitrines...</div>
  }

  return (
    <div className="products-page-container" style={{ paddingBottom: 100 }}>
      <div className="products-wrapper">
        <div className="page-header" style={{ marginBottom: 30 }}>
          <div className="header-info">
            <Link to="/hub/produtos" className="btn btn-icon" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Voltar aos produtos
            </Link>
            <h1>Organização de Vitrines</h1>
            <p style={{ color: '#6b7280', marginTop: 4 }}>Defina quais produtos aparecem nas áreas VIP da página inicial da loja.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="tkn-spin" /> : <Save size={16} />}
              Salvar alterações
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
          
          {/* OFERTAS RELÂMPAGO */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#fee2e2', color: '#dc2626', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Ofertas Relâmpago</h2>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Exibe contador e destaque em vermelho</span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => handleOpenSearch('flash_sale')}>
                <Plus size={16} /> Adicionar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {flashSaleProducts.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', border: '1px dashed #d1d5db', borderRadius: 8 }}>
                  Nenhum produto em oferta relâmpago.
                </div>
              ) : (
                flashSaleProducts.map(product => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                    <img src={product.image_url || '/placeholder.png'} alt={product.name} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, background: '#f9fafb' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#111827' }}>{product.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>SKU: {product.sku || 'N/A'}</span>
                    </div>
                    <button onClick={() => handleRemoveProduct(product.id, 'flash_sale')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8 }}>
                      <X size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PRODUTOS EM DESTAQUE */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#fef3c7', color: '#d97706', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={20} fill="currentColor" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Produtos em Destaque</h2>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Vitrine principal da Home (Grid Vertical)</span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => handleOpenSearch('featured')}>
                <Plus size={16} /> Adicionar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {featuredProducts.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', border: '1px dashed #d1d5db', borderRadius: 8 }}>
                  Nenhum produto em destaque.
                </div>
              ) : (
                featuredProducts.map(product => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                    <img src={product.image_url || '/placeholder.png'} alt={product.name} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, background: '#f9fafb' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#111827' }}>{product.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>SKU: {product.sku || 'N/A'}</span>
                    </div>
                    <button onClick={() => handleRemoveProduct(product.id, 'featured')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8 }}>
                      <X size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Busca */}
      {showSearchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: 12, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                Adicionar à vitrine: {targetList === 'flash_sale' ? 'Ofertas Relâmpago' : 'Produtos em Destaque'}
              </h3>
              <button onClick={() => setShowSearchModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: 14, color: '#9ca3af' }} />
              <input 
                type="text" 
                placeholder="Busque por nome ou SKU..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none' }}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {searching ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Buscando...</div>
              ) : searchResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {searchResults.map(product => {
                    const isFlash = flashSaleProducts.some(p => p.id === product.id)
                    const isFeatured = featuredProducts.some(p => p.id === product.id)
                    const isSelected = targetList === 'flash_sale' ? isFlash : isFeatured

                    return (
                      <div key={product.id} onClick={() => handleSelectProduct(product)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: isSelected ? '#f0fdf4' : '#fff', opacity: isSelected ? 0.6 : 1 }}>
                        <img src={product.image_url || '/placeholder.png'} alt={product.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, background: '#f9fafb' }} />
                        <div style={{ flex: 1 }}>
                          <strong style={{ display: 'block', fontSize: '0.95rem', color: '#111827' }}>{product.name}</strong>
                          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {isFlash && targetList !== 'flash_sale' && <span style={{ color: '#dc2626' }}>Já está em Relâmpago (será movido)</span>}
                            {isFeatured && targetList !== 'featured' && <span style={{ color: '#d97706' }}>Já está em Destaque (será movido)</span>}
                            {!isFlash && !isFeatured && `SKU: ${product.sku || 'N/A'}`}
                          </span>
                        </div>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: isSelected ? 'none' : '1px solid #d1d5db', background: isSelected ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <CheckCircle2 size={16} color="#fff" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : searchQuery.length >= 3 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Nenhum produto encontrado.</div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Digite pelo menos 3 caracteres para buscar.</div>
              )}
            </div>

          </div>
        </div>
      )}
      
    </div>
  )
}
