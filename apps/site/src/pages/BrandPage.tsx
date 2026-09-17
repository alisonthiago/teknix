import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { getProducts } from '../services/products'
import type { Product } from '../types/database'
import SEOHead from '../components/SEOHead'
import { buildBrandSchema, buildBreadcrumbSchema, buildCategoryPageSchema } from '../components/SchemaOrg'
import { ShoppingBag, ChevronRight, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import './CategoryPage.css'

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BrandPage() {
  const { brand: rawBrand } = useParams<{ brand: string }>()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [allBrands, setAllBrands] = useState<{ name: string; count: number; slug: string }[]>([])
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Limpa o slug da marca
  const brandSlug = rawBrand ? decodeURIComponent(rawBrand).trim() : ''

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)

    async function loadBrandData() {
      // Busca produtos
      const all = await getProducts({ limit: 100 })
      
      // Monta índice de todas as marcas com contagem
      const brandMap = new Map<string, number>()
      all.forEach(p => {
        const b = (p.brand || 'TEKNIX').trim()
        if (b) brandMap.set(b, (brandMap.get(b) || 0) + 1)
      })

      const brandsList = Array.from(brandMap.entries())
        .map(([name, count]) => ({ name, count, slug: slugify(name) }))
        .sort((a, b) => b.count - a.count)
      setAllBrands(brandsList)

      if (brandSlug) {
        // Encontra a marca que bate com o slug ou nome
        const matched = brandsList.find(b => b.slug === brandSlug || slugify(b.name) === slugify(brandSlug))
        const actualBrandName = matched ? matched.name : brandSlug

        const brandProducts = all.filter(p => {
          const pBrand = slugify(p.brand || 'TEKNIX')
          return pBrand === slugify(brandSlug) || (matched && slugify(p.brand || '') === matched.slug)
        })

        setProducts(brandProducts)
      } else {
        setProducts([])
      }
      setLoading(false)
    }

    loadBrandData()
  }, [brandSlug])

  // Nome formatado da marca atual
  const currentBrandInfo = allBrands.find(b => b.slug === brandSlug || slugify(b.name) === slugify(brandSlug))
  const brandDisplayName = currentBrandInfo?.name || (brandSlug ? brandSlug.toUpperCase() : 'Marcas')

  // Categorias únicas dos produtos desta marca
  const availableCategories = Array.from(
    new Set(products.map(p => p.category).filter(Boolean) as string[])
  )

  // Filtra por categoria e ordena
  let filteredProducts = products.filter(p => !selectedCategory || p.category === selectedCategory)
  if (sortBy === 'price_asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => (a.price || 0) - (b.price || 0))
  } else if (sortBy === 'price_desc') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.price || 0) - (a.price || 0))
  }

  // SEO Schemas
  const brandCanonical = brandSlug
    ? `https://teknixbrasil.com.br/marca/${brandSlug}`
    : `https://teknixbrasil.com.br/marcas`

  const brandJsonLd = brandSlug ? [
    buildBrandSchema({
      name: brandDisplayName,
      slug: brandSlug,
      description: `Produtos e ferramentas oficiais da marca ${brandDisplayName} na TEKNIX.`
    }),
    buildCategoryPageSchema(brandDisplayName, `/marca/${brandSlug}`, `Catálogo de produtos ${brandDisplayName}`),
    buildBreadcrumbSchema([
      { name: 'TEKNIX', url: 'https://teknixbrasil.com.br' },
      { name: 'Marcas', url: 'https://teknixbrasil.com.br/marcas' },
      { name: brandDisplayName, url: brandCanonical }
    ])
  ] : [
    buildBreadcrumbSchema([
      { name: 'TEKNIX', url: 'https://teknixbrasil.com.br' },
      { name: 'Marcas', url: 'https://teknixbrasil.com.br/marcas' }
    ])
  ]

  // Se não tem marca selecionada (/marcas), lista o diretório de marcas
  if (!brandSlug) {
    return (
      <div className="category-page" style={{ minHeight: '60vh', padding: '40px 20px' }}>
        <SEOHead
          title="Marcas Parceiras e Fabricantes | TEKNIX"
          description="Explore todas as marcas oficiais e fabricantes disponíveis na TEKNIX. Ferramentas elétricas, manuais e industriais."
          canonical="https://teknixbrasil.com.br/marcas"
          jsonLd={brandJsonLd}
        />
        <div className="ui container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <nav className="category-breadcrumb" style={{ marginBottom: 24 }}>
            <Link to="/">Home</Link>
            <span>/</span>
            <span className="current">Marcas</span>
          </nav>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>Marcas Oficiais</h1>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: 32 }}>
            Selecione uma marca para visualizar todo o catálogo de produtos e equipamentos disponíveis.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16
          }}>
            {allBrands.map(b => (
              <Link
                key={b.slug}
                to={`/marca/${b.slug}`}
                style={{
                  padding: '24px 20px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#0f172a' }}>{b.name}</span>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {b.count} {b.count === 1 ? 'produto' : 'produtos'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="category-page">
      <SEOHead
        title={`${brandDisplayName} — Produtos e Catálogo Oficial | TEKNIX`}
        description={`Confira todos os produtos da marca ${brandDisplayName} na TEKNIX. Ferramentas com garantia, nota fiscal e entrega rápida para todo o Brasil.`}
        canonical={brandCanonical}
        ogType="website"
        jsonLd={brandJsonLd}
      />

      <div className="category-hero">
        <div className="category-hero-inner">
          <nav className="category-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/marcas">Marcas</Link>
            <span>/</span>
            <span className="current">{brandDisplayName}</span>
          </nav>
          <h1 className="category-title">{brandDisplayName}</h1>
          <p className="category-description-text">
            Catálogo completo de produtos e acessórios da {brandDisplayName}. Qualidade profissional comprovada para seu projeto.
          </p>

          {/* Filtros de Categoria da Marca */}
          {availableCategories.length > 1 && (
            <div className="category-subcategories-bar">
              <button
                type="button"
                className={`subcategory-pill ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                Todos ({products.length})
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`subcategory-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="category-products-section">
        <div className="category-products-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px' }}>
          {/* Barra de Ordenação */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Mostrando <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'produto' : 'produtos'} de <strong>{brandDisplayName}</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowUpDown size={16} color="#64748b" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.85rem'
                }}
              >
                <option value="relevance">Mais relevantes</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              Carregando catálogo da {brandDisplayName}...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 12 }}>
              <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: 16 }}>
                Nenhum produto encontrado para este filtro.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className="teknix-btn-secondary"
                style={{ padding: '8px 20px', borderRadius: 8 }}
              >
                Ver todos os produtos de {brandDisplayName}
              </button>
            </div>
          ) : (
            <div className="category-products-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20
            }}>
              {filteredProducts.map(prod => {
                const prodSlug = prod.slug || prod.sku || prod.id
                const prodPrice = prod.promo_price || prod.price || 0
                const prodImage = prod.images?.[0] || prod.image_url || '/placeholder.png'

                return (
                  <article key={prod.id} className="category-product-card" style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                  }}>
                    <Link to={`/${prodSlug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{
                        height: 220,
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16
                      }}>
                        <img
                          src={prodImage}
                          alt={prod.name}
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                          loading="lazy"
                        />
                      </div>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                          {prod.brand || brandDisplayName}
                        </span>
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.3, marginBottom: 8, flex: 1 }}>
                          {prod.name}
                        </h2>
                        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                          {prod.promo_price && prod.price && prod.promo_price < prod.price && (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', display: 'block' }}>
                              {formatMoney(prod.price)}
                            </span>
                          )}
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                            {formatMoney(prodPrice)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: 2 }}>
                            Em até 10x sem juros
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
