import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDM3OTEsImV4cCI6MjEwMjUxOTc5MX0.DQ-4lHwbyMW2umWSGmxfB2JUthUTKujGmZ-IACtFCIY'

const SITE_URL = 'https://teknixbrasil.com.br'
const PUBLIC_DIR = path.resolve(__dirname, '../apps/site/public')

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildXmlUrlSet(urls) {
  const entries = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`
}

async function main() {
  console.log('🚀 Iniciando geração de Sitemaps Estáticos...')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  try {
    await supabase.auth.signInWithPassword({
      email: 'teste@teste.com',
      password: '123456'
    })
  } catch (err) {
    console.warn('Aviso: falha na autenticação do catálogo para sitemaps:', err.message)
  }
  const today = new Date().toISOString().split('T')[0]

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  // 1. Pages
  const pageUrls = [
    { loc: SITE_URL, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/marcas`, lastmod: today, changefreq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/lojas`, lastmod: today, changefreq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/loja/teknix`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_URL}/blog`, lastmod: today, changefreq: 'daily', priority: '0.7' }
  ]

  try {
    const { data: pages } = await supabase
      .from('pages')
      .select('slug, type, status, seo_slug, seo_priority, visibility, updated_at')
      .eq('status', 'published')

    for (const p of pages || []) {
      const slug = (p.seo_slug || p.slug || '').replace(/^\//, '')
      if (!slug || slug.includes('login') || slug.includes('checkout') || slug.includes('conta')) continue
      pageUrls.push({
        loc: `${SITE_URL}/${slug}`,
        lastmod: new Date(p.updated_at || Date.now()).toISOString().split('T')[0],
        changefreq: p.type === 'home' ? 'daily' : 'weekly',
        priority: p.type === 'home' ? '1.0' : '0.6'
      })
    }
  } catch (e) {
    console.warn('Aviso: páginas não carregadas:', e.message)
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-pages.xml'), buildXmlUrlSet(pageUrls), 'utf-8')
  console.log(`✅ sitemap-pages.xml gerado com ${pageUrls.length} URLs`)

  // 2. Products
  const productUrls = []
  try {
    const { data: prods } = await supabase
      .from('product_store_metadata')
      .select('slug, published, updated_at')
      .eq('published', true)

    for (const p of prods || []) {
      if (!p.slug) continue
      productUrls.push({
        loc: `${SITE_URL}/${p.slug}`,
        lastmod: new Date(p.updated_at || Date.now()).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.9'
      })
    }
  } catch (e) {
    console.warn('Aviso: produtos não carregados:', e.message)
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-products.xml'), buildXmlUrlSet(productUrls), 'utf-8')
  console.log(`✅ sitemap-products.xml gerado com ${productUrls.length} URLs`)

  // 3. Categories & Subcategories
  const categoryUrls = []
  try {
    const { data: categories } = await supabase
      .from('store_categories')
      .select('id, name, slug, parent_id, status, updated_at')
      .eq('status', 'active')

    const parentMap = new Map()
    categories?.forEach(c => parentMap.set(c.id, c.slug))

    for (const c of categories || []) {
      if (!c.slug) continue
      const lastmod = new Date(c.updated_at || Date.now()).toISOString().split('T')[0]
      if (c.parent_id && parentMap.has(c.parent_id)) {
        const parentSlug = parentMap.get(c.parent_id)
        categoryUrls.push({
          loc: `${SITE_URL}/categoria/${parentSlug}/${c.slug}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.8'
        })
      } else {
        categoryUrls.push({
          loc: `${SITE_URL}/categoria/${c.slug}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.8'
        })
      }
    }
  } catch (e) {
    console.warn('Aviso: categorias não carregadas:', e.message)
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-categories.xml'), buildXmlUrlSet(categoryUrls), 'utf-8')
  console.log(`✅ sitemap-categories.xml gerado com ${categoryUrls.length} URLs`)

  // 4. Brands
  const brandUrls = []
  try {
    const { data: products } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)

    const distinctBrands = new Set()
    products?.forEach(p => {
      const b = (p.brand || '').trim()
      if (b && b.length > 1) distinctBrands.add(slugify(b))
    })

    for (const b of distinctBrands) {
      brandUrls.push({
        loc: `${SITE_URL}/marca/${b}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.7'
      })
    }
  } catch (e) {
    console.warn('Aviso: marcas não carregadas:', e.message)
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-brands.xml'), buildXmlUrlSet(brandUrls), 'utf-8')
  console.log(`✅ sitemap-brands.xml gerado com ${brandUrls.length} URLs`)

  // 5. Master sitemap.xml
  const allUrls = [...pageUrls, ...productUrls, ...categoryUrls, ...brandUrls]
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), buildXmlUrlSet(allUrls), 'utf-8')
  console.log(`✅ sitemap.xml principal gerado com ${allUrls.length} URLs totais!`)

  // 6. Google Merchant Center Feed (XML / RSS 2.0)
  try {
    const { data: storeMetas } = await supabase
      .from('product_store_metadata')
      .select('product_id, slug, sale_price, promotional_price, short_description, store_description')
      .eq('published', true)

    if (storeMetas && storeMetas.length > 0) {
      const productIds = storeMetas.map(m => m.product_id)
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)

      const productMap = new Map()
      products?.forEach(p => productMap.set(p.id, p))

      function escapeXml(unsafe) {
        if (!unsafe) return ''
        return String(unsafe)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
      }

      const feedItems = []
      for (const meta of storeMetas) {
        if (!meta.slug) continue
        const prod = productMap.get(meta.product_id)
        if (!prod || prod.status !== 'active') continue

        const id = escapeXml(prod.sku || prod.id)
        const title = escapeXml(prod.name)
        const rawDesc = meta.store_description || meta.short_description || prod.description || prod.notes || prod.name
        const description = escapeXml(rawDesc.replace(/<[^>]*>?/gm, '').trim())
        const link = `${SITE_URL}/${meta.slug}`
        const imageLink = escapeXml(prod.image_url || (Array.isArray(prod.images) ? prod.images[0] : null) || `${SITE_URL}/placeholder.png`)
        const availableStock = Math.max(0, Math.floor(Number(prod.stock_quantity ?? prod.stock ?? 1)))
        const availability = availableStock > 0 ? 'in_stock' : 'out_of_stock'
        const regularPrice = Number(meta.sale_price ?? prod.price ?? 0)
        const promoPrice = meta.promotional_price ? Number(meta.promotional_price) : null
        const brand = escapeXml(prod.brand || 'TEKNIX')
        const mpn = escapeXml(prod.sku || prod.id)
        const gtin = prod.ean || prod.barcode ? escapeXml(prod.ean || prod.barcode) : null

        feedItems.push(`    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${regularPrice.toFixed(2)} BRL</g:price>
${promoPrice && promoPrice < regularPrice ? `      <g:sale_price>${promoPrice.toFixed(2)} BRL</g:sale_price>\n` : ''}      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:mpn>${mpn}</g:mpn>
${gtin ? `      <g:gtin>${gtin}</g:gtin>\n` : '      <g:identifier_exists>no</g:identifier_exists>\n'}      <g:shipping>
        <g:country>BR</g:country>
        <g:service>Envio Padrão</g:service>
        <g:price>0.00 BRL</g:price>
      </g:shipping>
    </item>`)
      }

      const merchantFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TEKNIX Ferramentas — Feed Google Shopping</title>
    <link>${SITE_URL}</link>
    <description>Feed oficial de produtos do catálogo TEKNIX para o Google Merchant Center</description>
${feedItems.join('\n')}
  </channel>
</rss>`

      fs.writeFileSync(path.join(PUBLIC_DIR, 'merchant-feed.xml'), merchantFeedXml, 'utf-8')
      console.log(`✅ merchant-feed.xml gerado com ${feedItems.length} produtos para o Google Shopping!`)
    }
  } catch (err) {
    console.warn('Aviso: erro ao gerar merchant-feed:', err.message)
  }
}

main().catch(err => {
  console.error('Erro na geração do sitemap:', err)
  process.exit(1)
})
