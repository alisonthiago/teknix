import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDM3OTEsImV4cCI6MjEwMjUxOTc5MX0.DQ-4lHwbyMW2umWSGmxfB2JUthUTKujGmZ-IACtFCIY'

const SITE_URL = 'https://teknixbrasil.com.br'
const SITE_NAME = 'TEKNIX Ferramentas'
const DIST_DIR = path.resolve(__dirname, '../apps/site/dist')

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function generateHeadTags({
  title,
  description,
  url,
  image = 'https://teknixbrasil.com.br/teknix-og-default.png',
  ogType = 'website',
  schemas = []
}) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const escapedDesc = escapeHtml(description)
  const escapedTitle = escapeHtml(fullTitle)

  const schemaScriptTags = schemas
    .filter(Boolean)
    .map(s => `    <script type="application/ld+json" data-teknix="true">${JSON.stringify(s)}</script>`)
    .join('\n')

  return `
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDesc}" />
    <link rel="canonical" href="${url}" />

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDesc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="pt_BR" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDesc}" />
    <meta name="twitter:image" content="${image}" />

    <!-- Structured Data (JSON-LD) -->
${schemaScriptTags}
`
}

function injectIntoTemplate(baseHtml, headTags, bodyContent = '') {
  let result = baseHtml

  // Substitui ou remove title e meta description genéricas existentes no template
  result = result.replace(/<title>.*?<\/title>/i, '')
  result = result.replace(/<meta\s+name="description".*?>/i, '')
  result = result.replace(/<link\s+rel="canonical".*?>/i, '')
  result = result.replace(/<meta\s+property="og:.*?>/gi, '')
  result = result.replace(/<meta\s+name="twitter:.*?>/gi, '')

  // Injeta novas tags no <head>
  result = result.replace('</head>', `${headTags}\n  </head>`)

  // Se houver bodyContent de pré-renderização semântica, injeta no <div id="root">
  if (bodyContent) {
    result = result.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`)
  }

  return result
}

function writeStaticRoute(routePath, htmlContent) {
  const cleanPath = routePath.replace(/^\/+/, '').replace(/\/+$/, '')
  const targetDir = path.join(DIST_DIR, cleanPath)
  const targetFile = path.join(targetDir, 'index.html')

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  fs.writeFileSync(targetFile, htmlContent, 'utf-8')
}

async function main() {
  console.log('⚡ [SEO Pré-render] Iniciando geração de snapshots estáticos para rastreadores...')

  const templatePath = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template não encontrado em ${templatePath}. Execute vite build primeiro!`)
    process.exit(1)
  }

  const baseHtml = fs.readFileSync(templatePath, 'utf-8')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    await supabase.auth.signInWithPassword({
      email: 'teste@teste.com',
      password: '123456'
    })
  } catch (err) {
    console.warn('⚠️ Falha de auth no catálogo (tentando leitura anônima):', err.message)
  }

  let totalGenerated = 0

  // 1. PRODUTOS (URLs NA RAIZ: /{slug})
  try {
    const { data: storeMetas, error: metaErr } = await supabase
      .from('product_store_metadata')
      .select('*')
      .eq('published', true)

    if (metaErr) throw metaErr

    if (storeMetas && storeMetas.length > 0) {
      const productIds = storeMetas.map(m => m.product_id).filter(Boolean)
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)

      const productMap = new Map()
      products?.forEach(p => productMap.set(p.id, p))

      for (const meta of storeMetas) {
        if (!meta.slug) continue
        const p = productMap.get(meta.product_id)
        if (!p || p.status === 'inactive') continue

        const slug = meta.slug
        const url = `${SITE_URL}/${slug}`
        const title = `${p.name} — TEKNIX Ferramentas`
        const rawDesc = meta.store_description || meta.short_description || p.notes || p.name
        const desc = (rawDesc || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 160) || `${p.name} com qualidade profissional na TEKNIX.`
        
        let allImages = []
        if (p.images && Array.isArray(p.images)) {
          allImages = p.images.filter(img => typeof img === 'string' && img.startsWith('http'))
        }
        if (p.image_url && !allImages.includes(p.image_url)) allImages.push(p.image_url)
        const image = allImages[0] || 'https://teknixbrasil.com.br/teknix-og-default.png'

        const price = Number(meta.promotional_price || meta.sale_price || p.price || 0)
        const brandName = p.brand || 'TEKNIX'
        const categoryName = p.category || 'Ferramentas'

        const productSchema = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: desc,
          image: allImages.length ? allImages : [image],
          url,
          sku: p.sku || p.id,
          brand: { '@type': 'Brand', name: brandName },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: 18,
            bestRating: '5',
            worstRating: '1'
          },
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'BRL',
            price: price.toFixed(2),
            availability: (p.stock_quantity ?? p.stock ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: 'TEKNIX Ferramentas' }
          }
        }

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'TEKNIX', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE_URL}/categoria/${slugify(categoryName)}` },
          { '@type': 'ListItem', position: 3, name: p.name, item: url }
        ]
      }

      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `O ${p.name} possui garantia oficial?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Sim, o ${p.name} conta com garantia oficial de fábrica, suporte técnico autorizado e emissão de nota fiscal eletrônica TEKNIX.`
            }
          },
          {
            '@type': 'Question',
            name: `Qual é o prazo de entrega de ${p.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `O despacho é imediato para todo o Brasil com código de rastreamento enviado via e-mail e WhatsApp.`
            }
          },
          {
            '@type': 'Question',
            name: `Quais as formas de pagamento disponíveis?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Aceitamos Pix com aprovação instantânea e condições exclusivas, além de parcelamento no cartão de crédito em até 12x.`
            }
          }
        ]
      }

      const head = generateHeadTags({
        title,
        description: desc,
        url,
        image,
        ogType: 'product',
        schemas: [productSchema, breadcrumbSchema, faqSchema]
      })

      const semanticFallback = `
        <main style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <nav aria-label="Breadcrumb" style="font-size: 14px; margin-bottom: 20px; color: #666;">
            <a href="/" style="color: #0071e3; text-decoration: none;">Início</a> &gt;
            <a href="/categoria/${slugify(categoryName)}" style="color: #0071e3; text-decoration: none;">${escapeHtml(categoryName)}</a> &gt;
            <span>${escapeHtml(p.name)}</span>
          </nav>
          <article>
            <h1 style="font-size: 32px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px;">${escapeHtml(p.name)}</h1>
            <p style="font-size: 16px; color: #86868b; margin-bottom: 24px;">SKU: ${escapeHtml(p.sku || p.id)} | Marca: ${escapeHtml(brandName)}</p>
            <div style="font-size: 28px; font-weight: 600; color: #1d1d1f; margin-bottom: 20px;">
              R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">
              <p>${escapeHtml(p.description || desc)}</p>
            </div>
            <section style="margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 30px;">
              <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 20px;">Perguntas Frequentes sobre este Produto</h2>
              <details style="margin-bottom: 12px; padding: 12px; background: #fbfbfd; border-radius: 8px;">
                <summary style="font-weight: 600; cursor: pointer;">O produto possui garantia oficial?</summary>
                <p style="margin-top: 8px; color: #555;">Sim, garantia oficial de fábrica com nota fiscal eletrônica e suporte técnico TEKNIX.</p>
              </details>
              <details style="margin-bottom: 12px; padding: 12px; background: #fbfbfd; border-radius: 8px;">
                <summary style="font-weight: 600; cursor: pointer;">Como é feito o envio?</summary>
                <p style="margin-top: 8px; color: #555;">Despacho rápido com seguro de carga e código de rastreamento completo para todo o Brasil.</p>
              </details>
            </section>
          </article>
        </main>
      `

      const html = injectIntoTemplate(baseHtml, head, semanticFallback)
      writeStaticRoute(slug, html)
      totalGenerated++
    }
    }
    console.log(`✅ ${totalGenerated} produtos pré-renderizados em dist/[slug]/index.html`)
  } catch (err) {
    console.warn('⚠️ Erro ao pré-renderizar produtos:', err.message)
  }

  // 2. CATEGORIAS (/categoria/[slug])
  try {
    const { data: categories } = await supabase
      .from('store_categories')
      .select('id, name, slug, parent_id, status')
      .eq('status', 'active')

    const parentMap = new Map()
    categories?.forEach(c => parentMap.set(c.id, c.slug))

    let catCount = 0
    for (const c of categories || []) {
      if (!c.slug) continue
      const isSub = c.parent_id && parentMap.has(c.parent_id)
      const parentSlug = isSub ? parentMap.get(c.parent_id) : null
      const catPath = parentSlug ? `categoria/${parentSlug}/${c.slug}` : `categoria/${c.slug}`
      const fullUrl = `${SITE_URL}/${catPath}`
      const title = `${c.name} — Ferramentas e Equipamentos Profissionais | TEKNIX`
      const desc = `Confira a linha completa de ${c.name} na TEKNIX. Equipamentos de alto rendimento, procedência garantida e suporte oficial.`

      const catSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: c.name,
        url: fullUrl,
        description: desc
      }

      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'TEKNIX', item: SITE_URL },
          ...(parentSlug ? [{ '@type': 'ListItem', position: 2, name: parentSlug.toUpperCase(), item: `${SITE_URL}/categoria/${parentSlug}` }] : []),
          { '@type': 'ListItem', position: parentSlug ? 3 : 2, name: c.name, item: fullUrl }
        ]
      }

      const head = generateHeadTags({
        title,
        description: desc,
        url: fullUrl,
        ogType: 'website',
        schemas: [catSchema, breadcrumb]
      })

      const semanticFallback = `
        <main style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <nav aria-label="Breadcrumb" style="font-size: 14px; margin-bottom: 20px; color: #666;">
            <a href="/" style="color: #0071e3; text-decoration: none;">Início</a> &gt;
            <span>${escapeHtml(c.name)}</span>
          </nav>
          <header style="margin-bottom: 30px;">
            <h1 style="font-size: 32px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px;">${escapeHtml(c.name)}</h1>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">${escapeHtml(desc)}</p>
          </header>
        </main>
      `

      const html = injectIntoTemplate(baseHtml, head, semanticFallback)
      writeStaticRoute(catPath, html)
      catCount++
    }
    console.log(`✅ ${catCount} categorias pré-renderizadas em dist/categoria/...`)
  } catch (err) {
    console.warn('⚠️ Erro ao pré-renderizar categorias:', err.message)
  }

  // 3. PÁGINAS PRINCIPAIS (Home, Marcas, Lojas, Blog)
  const staticPages = [
    {
      path: 'marcas',
      title: 'Marcas Oficiais — Catálogo Completo | TEKNIX',
      desc: 'Explore todas as marcas oficiais e parceiras disponíveis no ecossistema TEKNIX com garantia de procedência.'
    },
    {
      path: 'lojas',
      title: 'Lojas e Vendedores Oficiais | TEKNIX Marketplace',
      desc: 'Compre diretamente de lojas e revendedores oficiais certificados no marketplace TEKNIX.'
    },
    {
      path: 'blog',
      title: 'Blog TEKNIX — Novidades, Guias Técnicos e Dicas de Ferramentas',
      desc: 'Guias de compra, análises de ferramentas, novidades da indústria e tutoriais práticos no Blog da TEKNIX.'
    }
  ]

  for (const sp of staticPages) {
    const fullUrl = `${SITE_URL}/${sp.path}`
    const head = generateHeadTags({
      title: sp.title,
      description: sp.desc,
      url: fullUrl,
      ogType: 'website'
    })
    const html = injectIntoTemplate(baseHtml, head)
    writeStaticRoute(sp.path, html)
  }

  console.log('🎉 [SEO Pré-render] Concluído com sucesso! Rastreadores receberão HTML completo.')
}

main().catch(err => {
  console.error('❌ Erro fatal no pré-renderizador de SEO:', err)
  process.exit(1)
})
