import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
/* ==========================================================================
   TEKNIX SITE — PÁGINA DE RESULTADOS DE BUSCA (1:1 PADRÃO HAGOR)
   ========================================================================== */

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getProducts } from '../services/products'
import type { Product as ProductType } from '../types/database'
import StorefrontProductCard from '../components/StorefrontProductCard'
import { DEMO_PRODUCT, DEMO_SIGNALS, DEMO_REVIEWS } from '../services/demoProduct'
import { storefrontCard } from '../services/storefrontCommerce'
import './SearchResults.css'

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}


export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') || searchParams.get('search') || ''
  const isDemo = import.meta.env.DEV && searchParams.get('demo') === '1'
    && searchTerm.toLowerCase().trim() === 'pistola de lavagem'
  const brandFilter = searchParams.get('brand') || searchParams.get('marca') || ''
  const sortParam = searchParams.get('sort') || 'newest'

  const [products, setProducts] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 })
  const [selectedBrand, setSelectedBrand] = useState(brandFilter)
  const [selectedSort, setSelectedSort] = useState(sortParam)

  useEffect(() => {
    if (isDemo) {
      setProducts(selectedBrand && selectedBrand !== DEMO_PRODUCT.brand ? [] : [DEMO_PRODUCT])
      setLoading(false)
      return
    }

    setLoading(true)
    let active = true
    getProducts({
      search: searchTerm || undefined,
      brand: selectedBrand || undefined,
      limit: 48,
      onlyPublished: true
    })
      .then(data => { if (active) setProducts(data) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [searchTerm, selectedBrand, isDemo])

  const sortedAndFilteredProducts = useMemo(() => {
    let result = [...products].filter(
      (p) => (p.price || 0) >= priceRange.min && (p.price || 0) <= priceRange.max
    )

    switch (selectedSort) {
      case 'price_asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price_desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        break
    }

    return result
  }, [products, priceRange, selectedSort])

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

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort)
    searchParams.set('sort', sort)
    setSearchParams(searchParams)
  }

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    setPriceRange((prev) => ({ ...prev, [type]: value }))
  }

  return (
    <div className="search-results-page">
      <EditableFlow id="catalog-page" label="Catálogo de produtos">
      {/* ── BREADCRUMB ── */}
      <Editable as="div" widgetId="catalog-breadcrumb" label="Breadcrumb do catálogo" widgetType="container" editorKind="container" className="search-breadcrumb" renderContent={false}>
        <div className="ui container">
          <Link to="/">Home</Link>
          <span className="divider">/</span>
          <span>{searchTerm ? `Busca: "${searchTerm}"` : 'Catálogo de Produtos'}</span>
        </div>
      </Editable>

      {/* ── CONTAINER PRINCIPAL ── */}
      <Editable as="div" widgetId="catalog-main" label="Conteúdo principal do catálogo" widgetType="container" editorKind="container" className="search-results-container" renderContent={false}>
        <Editable as="div" widgetId="catalog-columns" label="Colunas do catálogo" widgetType="container" editorKind="container" className="ui container" renderContent={false}>
          <EditableFlow id="catalog-columns" label="Colunas do catálogo" compact>
          {/* ── SIDEBAR DE FILTROS (ESQUERDA) ── */}
          <Editable as="aside" widgetId="catalog-filters" label="Filtros do catálogo" widgetType="container" editorKind="container" className="search-filters" renderContent={false}>
            <EditableFlow id="catalog-filters" label="Grupos de filtros" compact>
            <Editable as="div" widgetId="catalog-filter-sort" label="Filtro de ordenação" widgetType="container" editorKind="container" className="filter-group" renderContent={false}>
              <Editable as="h3" widgetId="searchresults-1" className="filter-title">Ordenar</Editable>
              <div className="filter-options">
                {[
                  ['newest', 'Mais recentes'],
                  ['price_asc', 'Menor preço'],
                  ['price_desc', 'Maior preço']
                ].map(([value, text], index) => (
                  <Editable as="label" key={value} widgetId={`catalog-sort-option-${index}`} label={`Opção ${text}`} widgetType="container" editorKind="container" renderContent={false}>
                    <Editable as="input" widgetId={`catalog-sort-input-${index}`} label={`Seletor ${text}`} widgetType="input" content={{ input_type: 'radio' }} type="radio" name="sort" value={value} checked={selectedSort === value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSortChange(e.target.value)} />
                    <Editable as="span" widgetId={`catalog-sort-label-${index}`}>{text}</Editable>
                  </Editable>
                ))}
              </div>
            </Editable>

            {/* ── FILTRO DE MARCA ── */}
            {uniqueBrands.length > 0 && (
              <Editable as="div" widgetId="catalog-filter-brand" label="Filtro de marcas" widgetType="container" editorKind="container" className="filter-group" renderContent={false}>
                <Editable as="h3" widgetId="searchresults-2" className="filter-title">Marca</Editable>
                <div className="filter-options">
                  {uniqueBrands.map((brand, index) => (
                    <Editable as="label" key={brand} widgetId={`catalog-brand-option-${index}`} label={`Marca ${brand}`} widgetType="container" editorKind="container" renderContent={false}>
                      <Editable as="input" widgetId={`catalog-brand-input-${index}`} label={`Seletor da marca ${brand}`} widgetType="input" content={{ input_type: 'checkbox' }} type="checkbox" checked={selectedBrand === (brand || '')} onChange={() => handleBrandChange(brand || '')} />
                      <Editable as="span" widgetId={`catalog-brand-label-${index}`}>{brand}</Editable>
                    </Editable>
                  ))}
                </div>
              </Editable>
            )}

            {/* ── FILTRO DE PREÇO ── */}
            <Editable as="div" widgetId="catalog-filter-price" label="Filtro de preço" widgetType="container" editorKind="container" className="filter-group" renderContent={false}>
              <Editable as="h3" widgetId="searchresults-3" className="filter-title">Preço</Editable>
              <div className="price-range">
                <Editable as="input" widgetId="catalog-price-min" label="Preço mínimo" widgetType="input" content={{ input_type: 'range' }}
                  type="range"
                  min="0"
                  max="50000"
                  step="100"
                  value={priceRange.min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange('min', Number(e.target.value))}
                  className="price-slider"
                />
                <Editable as="input" widgetId="catalog-price-max" label="Preço máximo" widgetType="input" content={{ input_type: 'range' }}
                  type="range"
                  min="0"
                  max="50000"
                  step="100"
                  value={priceRange.max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange('max', Number(e.target.value))}
                  className="price-slider"
                />
                <Editable as="div" widgetId="catalog-price-display" label="Valores do filtro de preço" widgetType="container" editorKind="container" className="price-display" renderContent={false}>
                  <span>{formatMoney(priceRange.min)}</span>
                  <span> - </span>
                  <span>{formatMoney(priceRange.max)}</span>
                </Editable>
              </div>
            </Editable>
            </EditableFlow>
          </Editable>

          {/* ── GRID DE PRODUTOS (DIREITA) ── */}
          <Editable as="section" widgetId="catalog-results" label="Resultados do catálogo" widgetType="container" editorKind="container" className="search-results-content" renderContent={false}>
            <EditableFlow id="catalog-results" label="Conteúdo dos resultados" compact>
            {isDemo && <Editable as="p" widgetId="searchresults-5" role="status">Demonstração local: produto, preços e condições ilustrativos. Compra e favoritos desativados; nenhum item foi cadastrado no catálogo real.</Editable>}
            <Editable as="div" widgetId="catalog-results-header" label="Cabeçalho dos resultados" widgetType="container" editorKind="container" className="results-header" renderContent={false}>
              <Editable as="h1" widgetId="searchresults-6">
                {searchTerm ? (
                  <>Resultados para "<strong>{searchTerm}</strong>"</>
                ) : (
                  <>Catálogo de Produtos</>
                )}
              </Editable>
              <Editable as="span" widgetId="catalog-results-count" className="results-count">{sortedAndFilteredProducts.length} produtos {searchTerm ? 'encontrados' : 'disponíveis'}</Editable>
            </Editable>

            {loading ? (
              <Editable as="div" widgetId="catalog-loading" label="Carregamento do catálogo" widgetType="container" editorKind="container" className="loading" renderContent={false}>
                <div className="spinner" />
                <Editable as="p" widgetId="searchresults-7">Carregando produtos...</Editable>
              </Editable>
            ) : sortedAndFilteredProducts.length > 0 ? (
              <Editable as="div" widgetId="catalog-products-grid" label="Grade de produtos" widgetType="grid" editorKind="container" className="products-grid" renderContent={false}>
                <EditableFlow id="catalog-products" label="Produtos do catálogo" compact>
                {sortedAndFilteredProducts.map((product) => (
                  <Editable as="div" key={product.id} widgetId={`catalog-product-${product.id}`} label={`Produto ${product.name}`} widgetType="storefrontCard" editorKind="container" style={{ display: 'contents' }} renderContent={false}>
                    <StorefrontProductCard
                      to={`/produtos/${encodeURIComponent(product.sku || product.id)}${isDemo ? '?demo=1' : ''}`}
                      product={{
                        ...storefrontCard(product),
                        id: product.id,
                        signals: isDemo ? DEMO_SIGNALS : storefrontCard(product).signals,
                        reviewData: isDemo ? DEMO_REVIEWS : undefined,
                        title: product.name,
                        img: product.image_url || '',
                        reviews: '',
                        oldPrice: product.promo_price && product.promo_price < (product.price || 0) ? formatMoney(product.price || 0) : null,
                        pricePix: storefrontCard(product).pricePix,
                        hasNoPixLabel: true,
                        bottomTags: isDemo ? [{text: 'Ver demonstração', type: 'green'}] : storefrontCard(product).bottomTags,
                        commerceProduct: isDemo ? undefined : product,
                      }} />
                  </Editable>
                ))}
                </EditableFlow>
              </Editable>
            ) : (
              <Editable as="div" widgetId="catalog-empty" label="Catálogo vazio" widgetType="container" editorKind="container" className="no-results" renderContent={false}>
                <Editable as="h2" widgetId="searchresults-8">{searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto publicado'}</Editable>
                <Editable as="p" widgetId="searchresults-9">{searchTerm ? 'Tente ajustar seus filtros ou termos de busca' : 'Ainda não há produtos publicados na vitrine da loja.'}</Editable>
              </Editable>
            )}
            </EditableFlow>
          </Editable>
          </EditableFlow>
        </Editable>
      </Editable>
      </EditableFlow>
    </div>
  )
}
