import { useState, useEffect } from 'react'
import { storeClient, ensureCatalogAuth } from '../services/products'

const SITE_URL = 'https://teknixbrasil.com.br'

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default function MerchantFeedPage() {
  const [xml, setXml] = useState('')
  const [loading, setLoading] = useState(true)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    generateMerchantFeed()
  }, [])

  async function generateMerchantFeed() {
    setLoading(true)

    try {
      await ensureCatalogAuth()

      // 1. Busca metadados publicados
      const { data: storeMetas } = await storeClient
        .from('product_store_metadata')
        .select(`
          product_id,
          slug,
          sale_price,
          promotional_price,
          short_description,
          store_description,
          specifications,
          published,
          updated_at
        `)
        .eq('published', true)

      if (!storeMetas || storeMetas.length === 0) {
        setXml('<!-- Nenhum produto publicado encontrado no catálogo -->')
        setLoading(false)
        return
      }

      const productIds = storeMetas.map(m => m.product_id)

      // 2. Busca dados completos dos produtos correspondentes
      const { data: products } = await storeClient
        .from('products')
        .select('*')
        .in('id', productIds)

      const productMap = new Map<string, any>()
      products?.forEach(p => productMap.set(p.id, p))

      // 3. Categorias para taxonomia
      const { data: categories } = await storeClient
        .from('store_categories')
        .select('id, name, slug, parent_id')

      const categoryMap = new Map<string, any>()
      categories?.forEach(c => categoryMap.set(c.id, c))

      const itemsXml: string[] = []

      for (const meta of storeMetas) {
        if (!meta.slug) continue
        const prod = productMap.get(meta.product_id)
        if (!prod || prod.status !== 'active') continue

        const id = escapeXml(prod.sku || prod.id)
        const title = escapeXml(prod.name)
        const rawDesc = meta.store_description || meta.short_description || prod.description || prod.notes || prod.name
        const description = escapeXml(rawDesc.replace(/<[^>]*>?/gm, '').trim())
        const link = `${SITE_URL}/${meta.slug}`

        const allImages: string[] = []
        if (prod.images && Array.isArray(prod.images)) {
          prod.images.forEach((img: any) => {
            if (typeof img === 'string' && img.startsWith('http')) allImages.push(img)
          })
        }
        if (prod.image_url && !allImages.includes(prod.image_url)) allImages.push(prod.image_url)
        if (allImages.length === 0) allImages.push(`${SITE_URL}/placeholder.png`)

        const imageLink = escapeXml(allImages[0])
        const additionalImageLinks = allImages.slice(1, 10).map(img => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n')

        const availableStock = Math.max(0, Math.floor(Number(prod.stock_quantity ?? prod.stock ?? 1)))
        const availability = availableStock > 0 ? 'in_stock' : 'out_of_stock'

        const regularPrice = Number(meta.sale_price ?? prod.price ?? 0)
        const promoPrice = meta.promotional_price ? Number(meta.promotional_price) : null

        const brand = escapeXml(prod.brand || 'TEKNIX')
        const mpn = escapeXml(prod.sku || prod.id)
        const gtin = prod.ean || prod.barcode ? escapeXml(prod.ean || prod.barcode) : null

        let categoryName = 'Ferramentas'
        if (prod.category_id && categoryMap.has(prod.category_id)) {
          const cat = categoryMap.get(prod.category_id)
          categoryName = cat.name
        } else if (prod.category) {
          categoryName = prod.category
        }

        itemsXml.push(`    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
${additionalImageLinks ? `${additionalImageLinks}\n` : ''}      <g:availability>${availability}</g:availability>
      <g:price>${regularPrice.toFixed(2)} BRL</g:price>
${promoPrice && promoPrice < regularPrice ? `      <g:sale_price>${promoPrice.toFixed(2)} BRL</g:sale_price>\n` : ''}      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${escapeXml(categoryName)}</g:product_type>
      <g:mpn>${mpn}</g:mpn>
${gtin ? `      <g:gtin>${gtin}</g:gtin>\n` : '      <g:identifier_exists>no</g:identifier_exists>\n'}      <g:shipping>
        <g:country>BR</g:country>
        <g:service>Envio Padrão</g:service>
        <g:price>0.00 BRL</g:price>
      </g:shipping>
    </item>`)
      }

      const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TEKNIX Ferramentas — Feed Google Shopping</title>
    <link>${SITE_URL}</link>
    <description>Feed oficial de produtos do catálogo TEKNIX para o Google Merchant Center</description>
${itemsXml.join('\n')}
  </channel>
</rss>`

      setXml(feedXml)
      setProductCount(itemsXml.length)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao gerar Google Merchant Feed:', err)
      setLoading(false)
    }
  }

  function handleDownload() {
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'merchant-feed.xml'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '30px 20px', maxWidth: 1200, margin: '0 auto', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Google Merchant Center Feed (RSS 2.0 / XML)
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {loading ? 'Processando produtos...' : `${productCount} produtos públicos sincronizados para Google Shopping`}
          </span>
        </div>

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
          Baixar merchant-feed.xml
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
          Gerando feed compatível com Google Merchant Center...
        </div>
      ) : (
        <pre style={{
          background: '#090d16',
          color: '#34d399',
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
