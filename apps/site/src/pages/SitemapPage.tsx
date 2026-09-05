import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SITE_URL = 'https://teknix.com.br'

const PRIVATE_SLUGS = [
  'login', 'cadastro', 'password', 'conta', 'checkout',
  'pedidos', 'order/list', 'order/link/verify', 'sacola',
  'hub', 'editor', 'configuracoes', 'integracoes'
]

function isPrivatePage(slug: string): boolean {
  if (!slug) return true
  const clean = slug.replace(/^\//, '').toLowerCase()
  return PRIVATE_SLUGS.includes(clean)
}

function changefreqForType(type: string): string {
  switch (type) {
    case 'home': return 'daily'
    case 'product': return 'weekly'
    case 'category': return 'weekly'
    case 'landing': return 'monthly'
    case 'segment': return 'weekly'
    default: return 'monthly'
  }
}

export function priorityForType(type: string, isHome: boolean): string {
  if (isHome) return '1.0'
  switch (type) {
    case 'product': return '0.9'
    case 'category': return '0.8'
    case 'segment': return '0.8'
    case 'landing': return '0.6'
    case 'institutional': return '0.5'
    default: return '0.5'
  }
}

export default function SitemapPage() {
  const [xml, setXml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateSitemap()
  }, [])

  async function generateSitemap() {
    const urls: string[] = []

    const { data: pages } = await supabase
      .from('pages')
      .select('slug, type, status, seo_slug, seo_priority, visibility, page_expires_at, updated_at, published_at')
      .eq('status', 'published')

    for (const page of pages || []) {
      if (isPrivatePage(page.slug)) continue
      if (page.visibility === 'paused') continue
      if (page.page_expires_at && new Date(page.page_expires_at) < new Date()) continue

      const slug = page.seo_slug || page.slug
      const url = `${SITE_URL}/${slug.replace(/^\//, '')}`
      const lastmod = new Date(page.updated_at || page.published_at || Date.now()).toISOString().split('T')[0]
      const priority = page.seo_priority ?? (page.type === 'home' ? 1.0 : 0.5)

      urls.push(`  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreqForType(page.type)}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`)
    }

    const { data: storeMeta } = await supabase
      .from('product_store_metadata')
      .select('slug, published, updated_at')
      .eq('published', true)

    for (const meta of storeMeta || []) {
      if (!meta.slug) continue
      const url = `${SITE_URL}/produtos/${meta.slug}`
      const lastmod = new Date(meta.updated_at || Date.now()).toISOString().split('T')[0]
      urls.push(`  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`)
    }

    urls.push(`  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`)

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

    setXml(sitemap)
    setLoading(false)

    const blob = new Blob([sitemap], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <p>Gerando sitemap.xml...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <pre style={{
        background: '#111827',
        color: '#a5f3fc',
        padding: 20,
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.5,
        overflow: 'auto',
        maxHeight: '80vh',
        whiteSpace: 'pre'
      }}>
        {xml}
      </pre>
    </div>
  )
}
