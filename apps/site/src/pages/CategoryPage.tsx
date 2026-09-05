import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageRenderer from '../components/PageRenderer'
import StorefrontProductCard from '../components/StorefrontProductCard'
import { storefrontCard } from '../services/storefrontCommerce'
import { getProducts, getProductById } from '../services/products'
import type { Product } from '../types/database'
import { findCoreCategory } from '../services/categories'
import ProductPage from './Product'
import './CategoryPage.css'

interface PageData {
  id: string
  title: string
  slug: string
  status: string
  type: string
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CategoryPage() {
  const { segmento, categoria, slug } = useParams<{ segmento: string; categoria: string; slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState<PageData | null>(null)
  const [category, setCategory] = useState<{ id: string; name: string; slug: string; category_type?: string; rules?: Record<string, unknown> } | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isProductPage, setIsProductPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 })
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || searchParams.get('marca') || '')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const PAGE_SIZE = 12

  // Resolve o identificador da categoria: slug único (/categoria/:slug) ou segmento/categoria
  const categorySlug = slug || categoria || ''
  const searchTerm = searchParams.get('q') || searchParams.get('search') || ''

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!categorySlug) return
    setLoading(true)
    setPage(null)
    setCategory(null)
    setNotFound(false)
    setIsProductPage(false)

    let cancelled = false
    async function load() {
      // 3. Verifica se existe página personalizada da categoria no PageBuilder
      const categoryPath = slug ? `/categoria/${slug}` : `/${segmento}/${categoria}`
      const { data: pageData } = await supabase
        .from('pages')
        .select('id, title, slug, status, type,page_styles')
        .in('slug', [categoryPath, categoryPath.replace(/^\//, '')])
        .eq('status', 'published')
        .maybeSingle()

      if (cancelled) return
      if (pageData?.page_styles?.published_snapshot_v2) {
        setPage(pageData.page_styles.published_snapshot_v2.page)
        if (!['category', 'segment'].includes(pageData.type)) { setLoading(false); return }
      }


      // 1. Verifica primeiro se é um produto (por ID, SKU ou slug)
      const foundProduct = await getProductById(categorySlug)
      if (cancelled) return
      if (foundProduct) {
        setIsProductPage(true)
        setLoading(false)
        return
      }

      // 2. Resolve a categoria pelo slug para obter o category_id real
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .maybeSingle()

      if (cancelled) return
      const resolvedCategory = catData || findCoreCategory(categorySlug) || null
      if (resolvedCategory) setCategory(resolvedCategory)
      else if(!pageData?.page_styles?.published_snapshot_v2){setNotFound(true);setLoading(false);return}

      // 4. Busca produtos vinculados à categoria (por category_id ou slug)
      const categoryProducts = await getProducts({
        segment: catData?.id || categorySlug,
        category: categorySlug,
        brand: selectedBrand || undefined,
        search: searchTerm || undefined,
        limit: 40,
        sort: sortBy,
        categoryRules: catData?.category_type === 'smart' ? catData.rules : undefined
      })

      if (cancelled) return
      if (!pageData && !resolvedCategory && (!categoryProducts || categoryProducts.length === 0)) {
        setNotFound(true)
      } else {
        setProducts(categoryProducts)
      }

      setLoading(false)
    }

    load().catch(() => { if (!cancelled) { setNotFound(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [categorySlug, segmento, categoria, slug, sortBy, searchTerm, selectedBrand])

  const sortedAndFilteredProducts = useMemo(() => {
    return products.filter(
      (p) => (p.price || 0) >= priceRange.min && (p.price || 0) <= priceRange.max
    )
  }, [products, priceRange])

  // Paginação
  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredProducts.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return sortedAndFilteredProducts.slice(start, start + PAGE_SIZE)
  }, [sortedAndFilteredProducts, safePage])

  // Reseta para a página 1 quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy, selectedBrand, priceRange, searchTerm, categorySlug])

  const goToPage = (p: number) => {
    setCurrentPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const uniqueBrands = useMemo(() => {
    const brands = new Set(products.map((p) => p.brand).filter(Boolean))
    return Array.from(brands).sort()
  }, [products])

  const handleBrandChange = (brand: string) => {
    const newBrand = selectedBrand === brand ? '' : brand
    setSelectedBrand(newBrand)
    if (newBrand) {
      searchParams.set('brand', newBrand)
    } else {
      searchParams.delete('brand')
    }
    setSearchParams(searchParams)
  }

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    setPriceRange((prev) => ({ ...prev, [type]: value }))
  }

  if (isProductPage) {
    return <ProductPage />
  }

  if (loading) {
    return (
      <div className="category-loading">
        <div className="spinner" />
      </div>
    )
  }

  if (page && !['category', 'segment'].includes(page.type)) return <PageRenderer pageId={page.id} />

  if (notFound) {
    return (
      <div className="category-not-found">
        <EditableFlow id="category-page" label="Conteúdo da categoria">
          <Editable as="h1" widgetId="categorypage-1">404</Editable>
          <Editable as="p" widgetId="categorypage-2">Categoria não encontrada</Editable>
          <Editable as={Link} widgetId="categorypage-back-btn" widgetType="button" label="Botão Voltar" to="/" className="btn-back">Voltar ao início</Editable>
        </EditableFlow>
      </div>
    )
  }

  return (
    <div className="category-page">
      <EditableFlow id="category-page" label="Estrutura da categoria">
      {(page || category) && (
        <Editable as="div" widgetId="category-hero" label="Cabeçalho da categoria" widgetType="container" editorKind="container" renderContent={false} className="category-hero">
          <div className="category-hero-inner">
            <nav className="category-breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <span className="current">{category?.name || page?.title}</span>
            </nav>
            <Editable as="h1" widgetId="categorypage-3" className="category-title">{category?.name || page?.title}</Editable>
          </div>
        </Editable>
      )}

      {page && (
        <Editable as="div" widgetId="category-builder-content" label="Conteúdo publicado da categoria" widgetType="container" editorKind="container" renderContent={false} style={{ display: 'contents' }}><PageRenderer pageId={page.id} /></Editable>
      )}

      <Editable as="section" widgetId="categorypage-4" label="Catálogo da categoria" widgetType="container" editorKind="container" renderContent={false} className="category-products-section">
        <div className="category-products-container">
          <EditableFlow id="category-columns" label="Filtros e produtos">
          {/* ── SIDEBAR DE FILTROS (ESQUERDA) ── */}
          <Editable as="aside" widgetId="category-filters" label="Filtros da categoria" widgetType="container" editorKind="container" renderContent={false} className={`category-filters ${mobileFiltersOpen?'mobile-open':''}`}>
            <div className="filter-group">
              <Editable as="h3" widgetId="categorypage-5" className="filter-title">Ordenar</Editable>
              <div className="filter-options">
                <label>
                  <input type="radio" name="sort" value="newest" checked={sortBy === 'newest'} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} />
                  <span>Mais recentes</span>
                </label>
                <label>
                  <input type="radio" name="sort" value="price_asc" checked={sortBy === 'price_asc'} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} />
                  <span>Menor preço</span>
                </label>
                <label>
                  <input type="radio" name="sort" value="price_desc" checked={sortBy === 'price_desc'} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} />
                  <span>Maior preço</span>
                </label>
              </div>
            </div>

            {/* ── FILTRO DE MARCA ── */}
            {uniqueBrands.length > 0 && (
              <div className="filter-group">
                <Editable as="h3" widgetId="categorypage-6" className="filter-title">Marca</Editable>
                <div className="filter-options">
                  {uniqueBrands.map((brand) => (
                    <label key={brand}>
                      <input type="checkbox" checked={selectedBrand === (brand || '')} onChange={() => handleBrandChange(brand || '')} />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── FILTRO DE PREÇO ── */}
            <div className="filter-group">
              <Editable as="h3" widgetId="categorypage-7" className="filter-title">Preço</Editable>
              <div className="price-range">
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="100"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                  className="price-slider"
                />
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="100"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                  className="price-slider"
                />
                <div className="price-display">
                  <span>{formatMoney(priceRange.min)}</span>
                  <span> - </span>
                  <span>{formatMoney(priceRange.max)}</span>
                </div>
              </div>
            </div>
          </Editable>

          {/* ── GRID DE PRODUTOS (DIREITA) ── */}
          <Editable as="section" widgetId="categorypage-8" label="Resultados da categoria" widgetType="container" editorKind="container" renderContent={false} className="category-products-content">
            <div className="category-mobile-controls">
              <button type="button" onClick={()=>setMobileFiltersOpen(v=>!v)}>{mobileFiltersOpen?'Fechar filtros':'Filtrar'}</button>
              <label>Ordenar:
                <select value={sortBy} onChange={e=>setSortBy(e.target.value as typeof sortBy)}>
                  <option value="newest">Mais relevantes</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                </select>
              </label>
            </div>
            <div className="category-products-header">
              <Editable as="h2" widgetId="categorypage-9" className="category-section-title">
                {sortedAndFilteredProducts.length > 0 ? `${sortedAndFilteredProducts.length} produtos encontrados` : 'Produtos'}
              </Editable>
              <div className="category-view-toggle" aria-label="Modo de visualização">
                <button type="button" className={viewMode==='grid'?'active':''} onClick={()=>setViewMode('grid')} title="Visualização em grade">▦</button>
                <button type="button" className={viewMode==='list'?'active':''} onClick={()=>setViewMode('list')} title="Visualização em lista">☷</button>
              </div>
            </div>

            {sortedAndFilteredProducts.length > 0 ? (
              <>
                <div className={`category-products-grid ${viewMode==='list'?'list-view':''}`}>
                  <EditableFlow id="category-products" label="Produtos da categoria">
                  {paginatedProducts.map((product) => (
                    <Editable as="div" key={product.id} widgetId={`category-product-${product.id}`} productId={product.id} label={`Produto: ${product.name}`} widgetType="storefrontCard" editorKind="container" renderContent={false} style={{ display: 'contents' }}>
                      <StorefrontProductCard
                        to={`/produtos/${encodeURIComponent(product.sku || product.id)}`}
                        product={{
                          ...storefrontCard(product),
                          id: product.id,
                          title: product.name,
                          img: product.image_url || '',
                          oldPrice: product.promo_price && product.promo_price < (product.price || 0) ? formatMoney(product.price || 0) : null,
                          pricePix: storefrontCard(product).pricePix,
                          hasNoPixLabel: true,
                          commerceProduct: product,
                        }}
                      />
                    </Editable>
                  ))}
                  </EditableFlow>
                </div>

                {/* ── PAGINAÇÃO ── */}
                {totalPages > 1 && (
                  <div className="category-pagination">
                    <button
                      className="pagination-btn"
                      disabled={safePage === 1}
                      onClick={() => goToPage(safePage - 1)}
                    >
                      ‹ Anterior
                    </button>
                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          className={`pagination-page ${p === safePage ? 'active' : ''}`}
                          onClick={() => goToPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      className="pagination-btn"
                      disabled={safePage === totalPages}
                      onClick={() => goToPage(safePage + 1)}
                    >
                      Próxima ›
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="category-empty">
                <Editable as="p" widgetId="categorypage-10">Nenhum produto encontrado com os filtros selecionados.</Editable>
              </div>
            )}
          </Editable>
          </EditableFlow>
        </div>
      </Editable>
      </EditableFlow>
    </div>
  )
}
