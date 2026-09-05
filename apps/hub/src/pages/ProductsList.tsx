import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { createPage } from '../services/pageBuilder'
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
  ListFilter,
  LayoutTemplate,
  Eye,
  MoreVertical,
  Edit,
  Package
} from 'lucide-react'
import './ProductsList.css'

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ProductsList() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [inlinePrices, setInlinePrices] = useState<Record<string, { price: string; promo: string }>>({})
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    function handleClickOutside() {
      setOpenMenuId(null)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, store_meta:product_store_metadata(*)')
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

  async function toggleProductPublish(productId: string, willPublish: boolean) {
    try {
      const { data: existing } = await supabase
        .from('product_store_metadata')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle()

      if (existing?.id) {
        await supabase
          .from('product_store_metadata')
          .update({ published: willPublish, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('product_store_metadata')
          .insert({
            product_id: productId,
            published: willPublish,
            updated_at: new Date().toISOString()
          })
      }

      setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p
        const currentMeta = Array.isArray((p as any).store_meta) ? (p as any).store_meta[0] : (p as any).store_meta
        return {
          ...p,
          store_meta: { ...(currentMeta || {}), published: willPublish }
        }
      }))
    } catch (e) {
      console.error('Erro ao alternar publicação:', e)
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

  const [editingPageId, setEditingPageId] = useState<string | null>(null)

  async function handleEditProductPage(product: Product) {
    setEditingPageId(product.id)
    try {
      // 1. Verifica se o produto já tem página vinculada
      const { data: productRow } = await supabase
        .from('products')
        .select('id, slug, name, presentation_page_id')
        .eq('id', product.id)
        .maybeSingle()

      if (productRow?.presentation_page_id) {
        const { data: linkedPage } = await supabase
          .from('pages')
          .select('id')
          .eq('id', productRow.presentation_page_id)
          .maybeSingle()

        if (linkedPage?.id) {
          window.open(`/editor/page/${linkedPage.id}`, '_blank', 'noopener,noreferrer')
          setEditingPageId(null)
          return
        }
      }

      // 2. Busca página existente pelo slug do produto
      const productSlug = (productRow?.slug || product.slug || `produto-${product.id}`).replace(/^\/+/, '')
      const targetSlug = `produto/${productSlug}`

      const { data: existingPage } = await supabase
        .from('pages')
        .select('id')
        .or(`slug.eq.${targetSlug},slug.eq./${targetSlug}`)
        .maybeSingle()

      if (existingPage?.id) {
        // Vincula a página encontrada ao produto
        await supabase.from('products').update({ presentation_page_id: existingPage.id }).eq('id', product.id)
        window.open(`/editor/page/${existingPage.id}`, '_blank', 'noopener,noreferrer')
        setEditingPageId(null)
        return
      }

      // 3. Cria nova página de produto (template padrão)
      const newPage = await createPage({
        title: (productRow?.name || product.name) + ' — Página do Produto',
        slug: targetSlug,
        type: 'product',
        status: 'published',
        seo_title: `${productRow?.name || product.name} — TEKNIX`,
        seo_description: ''
      })

      // 4. Vincula ao produto via presentation_page_id
      await supabase.from('products').update({ presentation_page_id: newPage.id }).eq('id', product.id)

      window.open(`/editor/page/${newPage.id}`, '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.error('Erro ao abrir editor do produto:', e)
      alert('Não foi possível abrir o editor. Tente novamente.')
    } finally {
      setEditingPageId(null)
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
            <div>Publicação (Loja)</div>
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
              const storeMeta = Array.isArray((product as any).store_meta) ? (product as any).store_meta[0] : (product as any).store_meta
              const rawPrice = storeMeta?.sale_price ?? (product as any).sell_price ?? product.price ?? 0
              const salePrice = Number(rawPrice)
              const rawPromo = storeMeta?.promotional_price ?? product.promo_price ?? null
              const promoPrice = (rawPromo && Number(rawPromo) > 0) ? Number(rawPromo) : null
              const imgUrl = (product.images && product.images[0]) || product.image_url || (product as any).main_image || ''
              const isPub = Boolean(storeMeta?.published ?? (product as any).published)

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
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="product-thumb"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const next = e.currentTarget.nextElementSibling as HTMLElement
                          if (next) next.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      className="product-thumb-placeholder"
                      style={{ display: imgUrl ? 'none' : 'flex' }}
                      title="Sem foto cadastrada"
                    >
                      <Package size={18} color="#9ca3af" />
                    </div>
                    <Link to={`/hub/produtos/${product.id}`} className="product-name-link" title="Ver visão geral do produto no HUB">
                      {product.name}
                    </Link>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 600 }}>
                    {product.manage_stock === false ? '∞ Infinito' : `${product.stock || 0} unid.`}
                  </div>

                  <div>
                    <span className="product-price-text">
                      {salePrice > 0 ? formatMoney(salePrice) : 'R$ 0,00'}
                    </span>
                  </div>

                  <div>
                    <span className={promoPrice ? "product-promo-text" : "product-no-promo-text"}>
                      {promoPrice ? formatMoney(promoPrice) : '—'}
                    </span>
                  </div>

                  <div>
                    <button
                      type="button"
                      className={`product-status-badge ${isPub ? 'published' : 'draft'}`}
                      onClick={() => toggleProductPublish(product.id, !isPub)}
                      title={isPub ? "Publicado no site. Clique para despublicar da vitrine pública." : "Rascunho. Clique para publicar na vitrine oficial da loja."}
                    >
                      <span className="status-badge-dot" />
                      {isPub ? 'Publicado' : 'Rascunho'}
                    </button>
                  </div>

                  <div className="product-actions-cell">
                    <div className="product-dropdown-wrapper">
                      <button
                        type="button"
                        className={`product-dots-btn ${openMenuId === product.id ? 'active' : ''}`}
                        title="Mais opções"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === product.id ? null : product.id)
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenuId === product.id && (
                        <div className="product-action-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <Link
                            to={`/hub/produtos/${product.id}`}
                            className="product-dropdown-item"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <Package size={15} color="#4b5563" />
                            <span>Ver Visão Geral no HUB</span>
                          </Link>

                          <Link
                            to={`/hub/produtos/editar/${product.id}`}
                            className="product-dropdown-item"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <Edit size={15} color="#2563eb" />
                            <span>Editar Cadastro</span>
                          </Link>

                          <button
                            type="button"
                            className="product-dropdown-item"
                            disabled={editingPageId === product.id}
                            onClick={() => {
                              setOpenMenuId(null)
                              handleEditProductPage(product)
                            }}
                          >
                            <LayoutTemplate size={15} color="#6366f1" />
                            <span>{editingPageId === product.id ? 'Abrindo...' : 'Editar Página (Page Builder)'}</span>
                          </button>

                          <a
                            className="product-dropdown-item"
                            href={`http://localhost:5173/produtos/${product.slug || product.id}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <Eye size={15} color="#16a34a" />
                            <span>Ver na Loja Pública</span>
                          </a>

                          <button
                            type="button"
                            className="product-dropdown-item"
                            onClick={() => {
                              setOpenMenuId(null)
                              navigator.clipboard?.writeText(`http://localhost:5173/produtos/${product.slug || product.id}`)
                              alert('Link público do produto copiado!')
                            }}
                          >
                            <Share2 size={15} color="#8b5cf6" />
                            <span>Copiar Link / Compartilhar</span>
                          </button>

                          <button
                            type="button"
                            className="product-dropdown-item"
                            onClick={() => {
                              setOpenMenuId(null)
                              handleDuplicate(product)
                            }}
                          >
                            <Copy size={15} color="#6b7280" />
                            <span>Duplicar Produto</span>
                          </button>

                          <div className="product-dropdown-divider" />

                          <button
                            type="button"
                            className="product-dropdown-item delete"
                            onClick={() => {
                              setOpenMenuId(null)
                              handleDelete(product.id)
                            }}
                          >
                            <Trash2 size={15} color="#dc2626" />
                            <span>Excluir Produto</span>
                          </button>
                        </div>
                      )}
                    </div>
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
