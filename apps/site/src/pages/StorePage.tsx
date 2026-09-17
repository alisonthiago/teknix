import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProducts } from '../services/products'
import type { Product } from '../types/database'
import SEOHead from '../components/SEOHead'
import { buildStoreSchema, buildBreadcrumbSchema, buildCategoryPageSchema } from '../components/SchemaOrg'
import { ShieldCheck, Award, Truck, CheckCircle2, ChevronRight, ArrowUpDown, Store as StoreIcon } from 'lucide-react'
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

export default function StorePage() {
  const { store: rawStore } = useParams<{ store: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance')

  const storeSlug = rawStore ? decodeURIComponent(rawStore).trim() : ''
  const isOfficial = !storeSlug || storeSlug === 'teknix' || storeSlug === 'teknix-oficial'

  const storeName = isOfficial
    ? 'TEKNIX Loja Oficial'
    : storeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)

    async function loadStoreProducts() {
      // Carrega produtos da loja
      const all = await getProducts({ limit: 60 })
      setProducts(all)
      setLoading(false)
    }

    loadStoreProducts()
  }, [storeSlug])

  let sortedProducts = [...products]
  if (sortBy === 'price_asc') {
    sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0))
  } else if (sortBy === 'price_desc') {
    sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0))
  }

  const storeCanonical = storeSlug
    ? `https://teknixbrasil.com.br/loja/${storeSlug}`
    : `https://teknixbrasil.com.br/loja/teknix`

  const storeJsonLd = [
    buildStoreSchema({
      name: storeName,
      slug: storeSlug || 'teknix',
      description: `Loja oficial e verificada ${storeName} no TEKNIX Marketplace. Compre com segurança, nota fiscal e envio rápido.`
    }),
    buildCategoryPageSchema(storeName, `/loja/${storeSlug || 'teknix'}`, `Produtos da ${storeName}`),
    buildBreadcrumbSchema([
      { name: 'TEKNIX', url: 'https://teknixbrasil.com.br' },
      { name: 'Lojas Oficiais', url: 'https://teknixbrasil.com.br/lojas' },
      { name: storeName, url: storeCanonical }
    ])
  ]

  return (
    <div className="category-page">
      <SEOHead
        title={`${storeName} — Loja Oficial e Verificada | TEKNIX`}
        description={`Confira o catálogo da loja ${storeName} no TEKNIX Marketplace. Produtos originais com garantia, nota fiscal e entrega rápida para todo o Brasil.`}
        canonical={storeCanonical}
        ogType="website"
        jsonLd={storeJsonLd}
      />

      {/* Hero da Loja com Identidade de Marketplace Oficial */}
      <div className="category-hero" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', borderBottom: '1px solid #e2e8f0', padding: '40px 20px 30px' }}>
        <div className="category-hero-inner" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <nav className="category-breadcrumb" style={{ marginBottom: 16 }}>
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/lojas">Lojas</Link>
            <span>/</span>
            <span className="current">{storeName}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <StoreIcon size={36} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {storeName}
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  <CheckCircle2 size={13} /> Vendedor Verificado
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: 6, marginBottom: 0 }}>
                Vendido e entregue pela rede TEKNIX • Nota fiscal e garantia em 100% dos pedidos
              </p>
            </div>
          </div>

          {/* Destaques de confiança do vendedor */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 16,
            padding: '16px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} color="#2563eb" />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Garantia Oficial</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Direto do fabricante</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Award size={20} color="#16a34a" />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Reputação 4.9 / 5.0</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Mais de 10.000 avaliações</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Truck size={20} color="#d97706" />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Envio Seguro</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Rastreamento em tempo real</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Catálogo da Loja */}
      <section className="category-products-section">
        <div className="category-products-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px 60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Mostrando <strong>{sortedProducts.length}</strong> produtos disponíveis
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
              Carregando produtos da {storeName}...
            </div>
          ) : (
            <div className="category-products-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20
            }}>
              {sortedProducts.map(prod => {
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
                    flexDirection: 'column'
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
                          {prod.brand || 'TEKNIX'}
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
