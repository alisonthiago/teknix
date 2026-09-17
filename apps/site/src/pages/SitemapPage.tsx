import { useState, useEffect } from 'react'
import { useLocation, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SITE_URL = 'https://teknixbrasil.com.br'

const PRIVATE_SLUGS = [
  'login', 'cadastro', 'password', 'conta', 'checkout',
  'pedidos', 'order/list', 'order/link/verify', 'sacola',
  'hub', 'editor', 'configuracoes', 'integracoes', 'busca', 'buscar',
  'email-preview', 'emails', 'preview', '__widget-preview'
]

function isPrivateSlug(slug: string): boolean {
  if (!slug) return true
  const clean = slug.replace(/^\//, '').toLowerCase().split('/')[0]
  return PRIVATE_SLUGS.includes(clean)
}

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type SitemapSection = 'all' | 'products' | 'categories' | 'brands' | 'stores' | 'blog' | 'pages' | 'index'

interface SitemapItem {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: string
}

export default function SitemapPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [xml, setXml] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SitemapSection>('all')
  const [totalUrls, setTotalUrls] = useState(0)

  // Determina a seção a partir da URL ou query param (?type=)
  useEffect(() => {
    const path = location.pathname.toLowerCase()
    const queryType = searchParams.get('type') as SitemapSection | null

    let section: SitemapSection = 'all'
    if (path.includes('sitemap-products') || queryType === 'products') section = 'products'
    else if (path.includes('sitemap-categories') || queryType === 'categories') section = 'categories'
    else if (path.includes('sitemap-brands') || queryType === 'brands') section = 'brands'
    else if (path.includes('sitemap-stores') || queryType === 'stores') section = 'stores'
    else if (path.includes('sitemap-blog') || queryType === 'blog') section = 'blog'
    else if (path.includes('sitemap-pages') || queryType === 'pages') section = 'pages'
    else if (queryType === 'index') section = 'index'

    setActiveSection(section)
    generateSitemap(section)
  }, [location.pathname, searchParams])

  async function generateSitemap(section: SitemapSection) {
    setLoading(true)

    // Se o usuário/crawler requisitou explicitamente o sitemap index
    if (section === 'index') {
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-products.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-categories.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-brands.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-stores.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`
      setXml(sitemapIndex)
      setTotalUrls(6)
      setLoading(false)
      return
    }

    const items: SitemapItem[] = []
    const now = new Date().toISOString().split('T')[0]

    // 1. PÁGINAS INSTITUCIONAIS E PÁGINAS DO BUILDER
    if (section === 'all' || section === 'pages') {
      // Home
      items.push({
        loc: `${SITE_URL}`,
        lastmod: now,
        changefreq: 'daily',
        priority: '1.0'
      })

      try {
        const { data: pages } = await supabase
          .from('pages')
          .select('slug, type, status, seo_slug, seo_priority, visibility, page_expires_at, updated_at, published_at')
          .eq('status', 'published')

        for (const page of pages || []) {
          if (isPrivateSlug(page.slug)) continue
          if (page.visibility === 'paused') continue
          if (page.page_expires_at && new Date(page.page_expires_at) < new Date()) continue

          const cleanSlug = (page.seo_slug || page.slug || '').replace(/^\//, '')
          if (!cleanSlug) continue

          const lastmod = new Date(page.updated_at || page.published_at || Date.now()).toISOString().split('T')[0]
          const priority = page.seo_priority ? Number(page.seo_priority).toFixed(1) : (page.type === 'home' ? '1.0' : '0.6')

          items.push({
            loc: `${SITE_URL}/${cleanSlug}`,
            lastmod,
            changefreq: page.type === 'home' ? 'daily' : 'weekly',
            priority
          })
        }
      } catch (err) {
        console.warn('Erro ao carregar páginas para sitemap:', err)
      }
    }

    // 2. PRODUTOS PUBLICADOS
    if (section === 'all' || section === 'products') {
      try {
        const { data: prods } = await supabase
          .from('product_store_metadata')
          .select('slug, published, updated_at')
          .eq('published', true)

        for (const p of prods || []) {
          if (!p.slug) continue
          const lastmod = new Date(p.updated_at || Date.now()).toISOString().split('T')[0]
          items.push({
            loc: `${SITE_URL}/${p.slug}`,
            lastmod,
            changefreq: 'weekly',
            priority: '0.9'
          })
        }
      } catch (err) {
        console.warn('Erro ao carregar produtos para sitemap:', err)
      }
    }

    // 3. CATEGORIAS E SUBCATEGORIAS
    if (section === 'all' || section === 'categories') {
      try {
        const { data: categories } = await supabase
          .from('store_categories')
          .select('id, name, slug, parent_id, status, updated_at')
          .eq('status', 'active')

        const parentMap = new Map<string, string>()
        categories?.forEach(c => parentMap.set(c.id, c.slug))

        for (const cat of categories || []) {
          if (!cat.slug) continue
          const lastmod = new Date(cat.updated_at || Date.now()).toISOString().split('T')[0]

          if (cat.parent_id && parentMap.has(cat.parent_id)) {
            const parentSlug = parentMap.get(cat.parent_id)
            items.push({
              loc: `${SITE_URL}/categoria/${parentSlug}/${cat.slug}`,
              lastmod,
              changefreq: 'weekly',
              priority: '0.8'
            })
          } else {
            items.push({
              loc: `${SITE_URL}/categoria/${cat.slug}`,
              lastmod,
              changefreq: 'weekly',
              priority: '0.8'
            })
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar categorias para sitemap:', err)
      }
    }

    // 4. MARCAS
    if (section === 'all' || section === 'brands') {
      items.push({
        loc: `${SITE_URL}/marcas`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.7'
      })

      try {
        const { data: brandProducts } = await supabase
          .from('products')
          .select('brand')
          .not('brand', 'is', null)

        const distinctBrands = new Set<string>()
        brandProducts?.forEach(p => {
          const b = (p.brand || '').trim()
          if (b && b.length > 1) distinctBrands.add(slugify(b))
        })

        for (const bSlug of distinctBrands) {
          items.push({
            loc: `${SITE_URL}/marca/${bSlug}`,
            lastmod: now,
            changefreq: 'weekly',
            priority: '0.7'
          })
        }
      } catch (err) {
        console.warn('Erro ao carregar marcas para sitemap:', err)
      }
    }

    // 5. LOJAS / VENDEDORES MARKETPLACE
    if (section === 'all' || section === 'stores') {
      items.push({
        loc: `${SITE_URL}/lojas`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.7'
      })
      items.push({
        loc: `${SITE_URL}/loja/teknix`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.8'
      })
    }

    // 6. BLOG E ARTIGOS
    if (section === 'all' || section === 'blog') {
      items.push({
        loc: `${SITE_URL}/blog`,
        lastmod: now,
        changefreq: 'daily',
        priority: '0.7'
      })

      try {
        const { data: posts } = await supabase
          .from('blog_posts')
          .select('slug, status, updated_at, published_at')
          .eq('status', 'published')

        for (const post of posts || []) {
          if (!post.slug) continue
          const lastmod = new Date(post.updated_at || post.published_at || Date.now()).toISOString().split('T')[0]
          items.push({
            loc: `${SITE_URL}/blog/${post.slug}`,
            lastmod,
            changefreq: 'monthly',
            priority: '0.6'
          })
        }
      } catch {
        // Tabela blog_posts pode estar vazia ou ausente
      }
    }

    // Remove duplicatas de loc
    const uniqueMap = new Map<string, SitemapItem>()
    items.forEach(it => uniqueMap.set(it.loc, it))
    const uniqueItems = Array.from(uniqueMap.values())

    const urlEntries = uniqueItems.map(it => `  <url>
    <loc>${it.loc}</loc>
    <lastmod>${it.lastmod}</lastmod>
    <changefreq>${it.changefreq}</changefreq>
    <priority>${it.priority}</priority>
  </url>`).join('\n')

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`

    setXml(sitemapXml)
    setTotalUrls(uniqueItems.length)
    setLoading(false)
  }

  function handleDownload() {
    const filename = activeSection === 'all' ? 'sitemap.xml' : `sitemap-${activeSection}.xml`
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '30px 20px', maxWidth: 1200, margin: '0 auto', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Sitemap TEKNIX ({activeSection.toUpperCase()})
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {loading ? 'Gerando XML dinâmico...' : `${totalUrls} URLs públicas indexáveis`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Baixar {activeSection === 'all' ? 'sitemap.xml' : `sitemap-${activeSection}.xml`}
          </button>
        </div>
      </div>

      {/* Navegador de fatias do sitemap */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {(['all', 'products', 'categories', 'brands', 'stores', 'blog', 'pages', 'index'] as SitemapSection[]).map(sec => (
          <Link
            key={sec}
            to={sec === 'all' ? '/sitemap.xml' : `/sitemap.xml?type=${sec}`}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeSection === sec ? '#2563eb' : '#e2e8f0',
              color: activeSection === sec ? '#ffffff' : '#334155'
            }}
          >
            {sec === 'all' ? 'Completo' : sec.toUpperCase()}
          </Link>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
          Gerando sitemap dinâmico a partir do catálogo e banco de dados...
        </div>
      ) : (
        <pre style={{
          background: '#090d16',
          color: '#38bdf8',
          padding: 20,
          borderRadius: 8,
          fontSize: 12,
          lineHeight: 1.5,
          overflow: 'auto',
          maxHeight: '75vh',
          whiteSpace: 'pre'
        }}>
          {xml}
        </pre>
      )}
    </div>
  )
}
