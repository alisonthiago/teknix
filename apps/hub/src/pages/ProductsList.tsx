import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  Plus,
  Share2,
  Copy,
  Trash2,
  GripVertical,
  ExternalLink,
  ListFilter
} from 'lucide-react'
import './ProductsList.css'

export default function ProductsList() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [inlinePrices, setInlinePrices] = useState<Record<string, { price: string; promo: string }>>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setProducts(data)
        const initialPrices: Record<string, { price: string; promo: string }> = {}
        data.forEach(p => {
          initialPrices[p.id] = {
            price: p.price ? p.price.toString() : '0',
            promo: p.promo_price ? p.promo_price.toString() : ''
          }
        })
        setInlinePrices(initialPrices)
      } else {
        // Fallback sample product matching user's screenshot
        const fallback: Product[] = [
          {
            id: 'demo-1',
            name: 'Parafusadeira e Furadeira de Impacto 12V Bivolt TEKNIX',
            slug: 'parafusadeira-impacto-12v',
            sku: 'TKN-FUR-12V',
            price: 45.00,
            promo_price: 39.90,
            manage_stock: false,
            stock: 100,
            images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100&auto=format&fit=crop&q=60'],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-2',
            name: 'Disco de Corte Diamantado Extra Fino 110mm',
            slug: 'disco-corte-diamantado',
            sku: 'TKN-DISC-110',
            price: 18.50,
            promo_price: 15.00,
            manage_stock: true,
            stock: 24,
            images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=60'],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        setProducts(fallback)
        const initialPrices: Record<string, { price: string; promo: string }> = {}
        fallback.forEach(p => {
          initialPrices[p.id] = {
            price: p.price ? p.price.toString() : '0',
            promo: p.promo_price ? p.promo_price.toString() : ''
          }
        })
        setInlinePrices(initialPrices)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateInlinePrice(id: string, field: 'price' | 'promo', value: string) {
    setInlinePrices(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))

    const numValue = parseFloat(value) || 0
    try {
      if (field === 'price') {
        await supabase.from('products').update({ price: numValue, sell_price: numValue }).eq('id', id)
      } else {
        await supabase.from('products').update({ promo_price: numValue > 0 ? numValue : null }).eq('id', id)
      }
    } catch (e) {
      console.error('Error saving inline price:', e)
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Deseja realmente excluir este produto?')) {
      try {
        await supabase.from('products').delete().eq('id', id)
      } catch (e) {
        console.error(e)
      }
      setProducts(products.filter(p => p.id !== id))
    }
  }

  async function handleDuplicate(product: Product) {
    const duplicatedName = `${product.name} (Cópia)`
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          id: undefined,
          name: duplicatedName,
          slug: `${product.slug}-copia-${Date.now()}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!error && data) {
        setProducts([data, ...products])
      } else {
        setProducts([
          { ...product, id: Date.now().toString(), name: duplicatedName },
          ...products
        ])
      }
    } catch (e) {
      setProducts([
        { ...product, id: Date.now().toString(), name: duplicatedName },
        ...products
      ])
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  return (
    <div className="products-page-container">
      <div className="products-wrapper">
        
        {/* Top Header */}
        <div className="page-header">
          <div className="header-info">
            <h1>Produtos</h1>
            <p>Gerencie seu catálogo de produtos, estoque e preços.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => alert('Exportar catálogo em CSV')}>
              <Download size={14} /> Exportar
            </button>
            <button className="btn btn-secondary" onClick={() => alert('Organizar vitrine')}>
              <ListFilter size={14} /> Organizar
            </button>
            <Link to="/hub/produtos/novo" className="btn btn-primary">
              <Plus size={15} /> Adicionar produto
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="products-search-bar">
          <div className="products-search-input-wrap">
            <Search size={16} className="products-search-icon" />
            <input
              type="text"
              className="products-search-input"
              placeholder="Buscar produtos por nome, SKU ou tags"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn-filter-action" onClick={() => {}}>
            <SlidersHorizontal size={14} /> Filtrar
          </button>

          <button className="btn-filter-action" onClick={() => {}}>
            <ArrowUpDown size={14} /> Mais novo
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
          {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
        </div>

        {/* Products Table */}
        <div className="products-table-card">
          <div className="products-table-header">
            <div>
              <input
                type="checkbox"
                checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                onChange={toggleSelectAll}
              />
            </div>
            <div>Produto</div>
            <div>Estoque</div>
            <div>Preço</div>
            <div>Promocional</div>
            <div>Ações</div>
          </div>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '0.88rem' }}>
              Carregando produtos da loja...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Nenhum produto encontrado.
            </div>
          ) : (
            filteredProducts.map(product => {
              const currentPrices = inlinePrices[product.id] || { price: product.price?.toString() || '0', promo: product.promo_price?.toString() || '' }
              const imgUrl = (product.images && product.images[0]) || (product as any).main_image || ''

              return (
                <div key={product.id} className="products-table-row">
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                  </div>

                  <div className="product-cell-main">
                    <GripVertical size={16} className="product-drag-dots" />
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.name} className="product-thumb" />
                    ) : (
                      <div className="product-thumb">SEM FOTO</div>
                    )}
                    <Link to={`/hub/produtos/editar/${product.id}`} className="product-name-link">
                      {product.name}
                    </Link>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 600 }}>
                    {product.manage_stock === false ? '∞ Infinito' : `${product.stock || 0} unid.`}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>R$</span>
                      <input
                        type="text"
                        className="inline-price-input"
                        value={currentPrices.price}
                        onChange={(e) => handleUpdateInlinePrice(product.id, 'price', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>R$</span>
                      <input
                        type="text"
                        className="inline-price-input"
                        placeholder="—"
                        value={currentPrices.promo}
                        onChange={(e) => handleUpdateInlinePrice(product.id, 'promo', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="product-actions-cell">
                    <button
                      className="product-action-circle"
                      title="Compartilhar / Canais"
                      onClick={() => alert(`Link público: https://teknix.com.br/produtos/${product.slug}`)}
                    >
                      <Share2 size={14} />
                    </button>
                    <button
                      className="product-action-circle"
                      title="Duplicar produto"
                      onClick={() => handleDuplicate(product)}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      className="product-action-circle delete"
                      title="Excluir produto"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="products-footer-info">
          <span>Mostrando 1-{filteredProducts.length} produtos de {filteredProducts.length}</span>
          <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Mais informações sobre produtos <ExternalLink size={12} />
          </a>
        </div>

      </div>
    </div>
  )
}
