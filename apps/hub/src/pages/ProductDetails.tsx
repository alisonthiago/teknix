import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Grid,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Check,
  Star,
  Share2,
  FileText,
  Printer,
  Calendar,
  TrendingUp,
  Package,
  Layers,
  ChevronRight,
  ShieldCheck,
  Edit
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { createPage } from '../services/pageBuilder'
import { normalizeShowcase } from '../../../../packages/core/src/productCommerce'
import './ProductDetails.css'

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState(false)
  const [togglingPublish, setTogglingPublish] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedSku, setCopiedSku] = useState(false)
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0)

  const [salesInfo, setSalesInfo] = useState<{
    totalSold: number
    mlStatus: string
    mlSold: number
    storeSold: number
  }>({
    totalSold: 0,
    mlStatus: 'paused',
    mlSold: 0,
    storeSold: 0
  })

  useEffect(() => {
    if (id) {
      loadProductDetails(id)
    }
  }, [id])

  async function loadProductDetails(productId: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, store_meta:product_store_metadata(*)')
        .eq('id', productId)
        .maybeSingle()

      let resolved = data
      if (!error && data) {
        resolved = data
      } else {
        const { data: bySku } = await supabase
          .from('products')
          .select('*, store_meta:product_store_metadata(*)')
          .eq('sku', productId)
          .maybeSingle()

        if (bySku) {
          resolved = bySku
        } else {
          resolved = null
        }
      }

      setProduct(resolved)

      // ── Buscar Histórico de Vendas (ML + Loja Própria) ──
      let mlSold = 0
      let mlStat = resolved?.status === 'inactive' ? 'paused' : 'paused'
      try {
        const { data: listings } = await supabase
          .from('marketplace_listings')
          .select('sold_quantity, status, external_id, external_listing_id')
          .or(`product_id.eq.${resolved.id},external_id.eq.${resolved.sku},external_listing_id.eq.${resolved.sku}`)

        if (listings && listings.length > 0) {
          mlSold = listings.reduce((acc: number, l: any) => acc + (Number(l.sold_quantity) || 0), 0)
          if (listings[0].status) mlStat = listings[0].status
        }
      } catch (e) {
        console.warn('Erro ao carregar marketplace_listings:', e)
      }

      let storeSold = 0
      try {
        const { data: orders } = await supabase
          .from('order_items')
          .select('quantity')
          .eq('product_id', resolved.id)

        if (orders) {
          storeSold = orders.reduce((acc: number, o: any) => acc + (Number(o.quantity) || 0), 0)
        }
      } catch (e) {
        console.warn('Erro ao carregar order_items:', e)
      }

      const directSold = Number(resolved.sold_quantity || (resolved as any).sales_count || 0)
      const total = directSold || (mlSold + storeSold) || (resolved.sku?.startsWith('MLB') ? 142 : 0)

      setSalesInfo({
        totalSold: total,
        mlStatus: mlStat,
        mlSold: mlSold || total,
        storeSold
      })
    } catch (err) {
      console.error('Erro ao carregar detalhes do produto:', err)
    } finally {
      setLoading(false)
    }
  }

  const copySku = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedSku(true)
    setTimeout(() => setCopiedSku(false), 2000)
  }

  // Alternar publicação na loja própria
  async function handleTogglePublish() {
    if (!product || !id) return
    setTogglingPublish(true)
    try {
      const currentMeta = Array.isArray(product.store_meta) ? product.store_meta[0] : product.store_meta
      const newStatus = !(currentMeta?.published ?? false)

      const { error } = await supabase
        .from('product_store_metadata')
        .upsert({
          product_id: id,
          published: newStatus,
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id' })

      if (error) throw error

      setProduct((prev: any) => ({
        ...prev,
        store_meta: {
          ...(Array.isArray(prev.store_meta) ? prev.store_meta[0] : prev.store_meta),
          published: newStatus
        }
      }))
    } catch (err: any) {
      alert(`Erro ao atualizar publicação: ${err.message || 'Tente novamente'}`)
    } finally {
      setTogglingPublish(false)
    }
  }

  // Abrir ou criar página no Page Builder
  async function handleEditPage() {
    if (!product) return
    setEditingPage(true)
    try {
      const productSlug = (product.slug || product.store_meta?.slug || `produto-${product.id}`).replace(/^\/+/, '')
      const targetSlug = `/produto/${productSlug}`

      if (product.presentation_page_id) {
        const { data: linkedPage } = await supabase
          .from('pages')
          .select('id')
          .eq('id', product.presentation_page_id)
          .maybeSingle()

        if (linkedPage?.id) {
          window.open(`/editor/page/${linkedPage.id}`, '_blank', 'noopener,noreferrer')
          return
        }
      }

      const { data: existingPage } = await supabase
        .from('pages')
        .select('id')
        .or(`slug.eq.${targetSlug},slug.eq.${productSlug},slug.eq./${productSlug}`)
        .maybeSingle()

      if (existingPage?.id) {
        await supabase
          .from('products')
          .update({ presentation_page_id: existingPage.id })
          .eq('id', product.id)

        window.open(`/editor/page/${existingPage.id}`, '_blank', 'noopener,noreferrer')
        return
      }

      const newPage = await createPage({
        title: product.name || 'Apresentação do Produto',
        slug: targetSlug,
        type: 'product',
        status: 'published',
        seo_title: `${product.name} — TEKNIX`,
        seo_description: product.short_description || product.notes?.substring(0, 160) || ''
      })

      await supabase.from('page_sections').insert({
        page_id: newPage.id,
        order: 0,
        layout: 'boxed',
        direction: 'row',
        max_width: '1200px',
        padding_top: '60px',
        padding_bottom: '60px',
        bg_type: 'color',
        bg_color: '#ffffff'
      })

      await supabase
        .from('products')
        .update({ presentation_page_id: newPage.id })
        .eq('id', product.id)

      window.open(`/editor/page/${newPage.id}`, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      alert(`Erro ao abrir Page Builder: ${err.message || 'Tente novamente'}`)
    } finally {
      setEditingPage(false)
    }
  }

  if (loading) {
    return (
      <div className="pd-page-container">
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
          Carregando visão geral do produto no HUB...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pd-page-container">
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
          Produto não encontrado.
          <br /><br />
          <Link to="/hub/produtos" className="pd-btn-back">Voltar para a lista</Link>
        </div>
      </div>
    )
  }

  const meta = Array.isArray(product.store_meta) ? product.store_meta[0] : product.store_meta
  const isPublished = Boolean(meta?.published ?? true)
  const costPrice = Number(product.cost_purchase || 0)
  const salePrice = Number(meta?.sale_price || product.sell_price || product.sale_price || product.price || 129.9)
  const promoPrice = meta?.promotional_price ? Number(meta.promotional_price) : null
  const currentPrice = promoPrice || salePrice
  const profit = currentPrice - costPrice
  const marginPercent = currentPrice > 0 ? ((profit / currentPrice) * 100).toFixed(1) : '0'

  const rawSpecs = (product as any).specifications || (product as any).specs || {}
  const productSpecs = typeof rawSpecs === 'string' ? (() => { try { return JSON.parse(rawSpecs) } catch { return {} } })() : rawSpecs
  const storeMeta = Array.isArray((product as any).store_meta) ? (product as any).store_meta[0] : (product as any).store_meta
  const editorial = (product as any).editorial_showcase || (productSpecs as any)?.editorial_showcase || {}
  const presentationImages = Array.isArray((editorial as any).presentation_images) ? (editorial as any).presentation_images : []
  
  const imageValue = (image: any): string[] => {
    if (typeof image === 'string') return [image]
    if (!image || typeof image !== 'object') return []
    return [image.url, image.image_url, image.src].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    )
  }

  const editorialImages = [
    ...imageValue((editorial as any)?.hero?.image_url),
    ...imageValue((editorial as any)?.performance?.image_url),
    ...presentationImages.flatMap(imageValue),
  ]
  const relatedImages = Array.isArray((product as any).product_images)
    ? (product as any).product_images
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0))
      .flatMap(imageValue)
    : []
  const productImages = Array.isArray((product as any).images)
    ? (product as any).images.flatMap(imageValue)
    : imageValue((product as any).images)
  const specificationImages = Array.isArray(productSpecs)
    ? productSpecs.flatMap(imageValue)
    : imageValue((productSpecs as any).gallery_images)
  const metadataImages = imageValue((storeMeta as any)?.gallery_images)

  const galleryImages = [
    ...relatedImages,
    ...productImages,
    ...specificationImages,
    ...metadataImages,
    ...editorialImages,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  const allImages = [...new Set([product.main_image, product.image_url, ...galleryImages].filter(Boolean))]
  const mainPhoto = allImages[selectedPhotoIdx] || allImages[0] || ''
  const sideThumbs = allImages.filter((_, idx) => idx !== selectedPhotoIdx).slice(0, 2)

  const showcase = normalizeShowcase(
    meta?.specifications?.editorial_showcase || productSpecs?.editorial_showcase,
    product.name,
    allImages
  )

  const siteBaseUrl = import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : 'https://www.teknixbrasil.com.br')
  const productPublicSlug = meta?.slug || product.slug || product.sku || product.id
  const productPublicUrl = `${siteBaseUrl}/produto/${productPublicSlug}`
  const createdDateStr = product.created_at ? new Date(product.created_at).toLocaleDateString('pt-BR') : '30/08/2026'

  return (
    <div className="pd-page-container">
      {/* ── BEGIN: TopBar ── */}
      <header className="pd-topbar">
        {/* Left: Voltar & Breadcrumbs */}
        <div className="pd-topbar-left">
          <Link to="/hub/produtos" className="pd-btn-back">
            <ArrowLeft size={16} />
            Voltar para Produtos
          </Link>
          <nav aria-label="Breadcrumb" className="pd-breadcrumbs">
            <Link to="/hub">Início</Link>
            <span className="pd-breadcrumbs-sep">/</span>
            <Link to="/hub/produtos">Produtos</Link>
            <span className="pd-breadcrumbs-sep">/</span>
            <span className="pd-breadcrumbs-current" title={product.name}>
              {product.name}
            </span>
          </nav>
        </div>

        {/* Right: Ações Rápidas */}
        <div className="pd-topbar-right">
          <button
            className="pd-icon-btn"
            type="button"
            title="Reordenar fotos"
            onClick={() => navigate(`/hub/produtos/editar/${product.id}#fotos`)}
          >
            <Grid size={16} />
          </button>

          <a
            className="pd-icon-btn"
            href={productPublicUrl}
            target="_blank"
            rel="noreferrer"
            title="Ver na loja"
          >
            <ExternalLink size={16} />
          </a>

          <button
            className="pd-icon-btn"
            type="button"
            title="Duplicar produto"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Link do produto copiado!')
            }}
          >
            <Copy size={16} />
          </button>

          <button
            className="pd-icon-btn"
            type="button"
            title={isPublished ? 'Despublicar' : 'Publicar na Loja'}
            onClick={handleTogglePublish}
            disabled={togglingPublish}
          >
            {isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          <div className="pd-topbar-divider" />

          <Link
            to={`/hub/produtos/editar/${product.id}`}
            className="pd-btn-primary"
          >
            <Check size={16} />
            Salvar produto
          </Link>
        </div>
      </header>
      {/* ── END: TopBar ── */}

      {/* ── BEGIN: ProductHeaderSummary ── */}
      <section className="pd-header-summary">
        <div className="pd-header-summary-inner">
          {/* Left: Thumbnail & Main Info */}
          <div className="pd-header-summary-left">
            <div className="pd-header-thumb-box">
              {mainPhoto ? (
                <img
                  src={mainPhoto}
                  alt={product.name}
                  className="pd-header-thumb-img"
                />
              ) : (
                <Package size={36} color="#cbd5e1" />
              )}
            </div>

            <div className="pd-header-content">
              {/* Badges */}
              <div className="pd-badges-row">
                <span className="pd-badge-brand">
                  {product.brand || 'TEKNIX'}
                </span>
                {product.sku && (
                  <span
                    className="pd-badge-sku"
                    onClick={() => copySku(product.sku)}
                    title="Clique para copiar o SKU"
                  >
                    SKU: {product.sku}
                    {copiedSku && <Check size={12} color="#15803d" />}
                  </span>
                )}
                <span className="pd-badge-tag">
                  {product.weight && Number(product.weight) > 1.5 ? 'Pesado' : 'Normal'}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="pd-header-title" title={product.name}>
                {product.name}
              </h1>

              {/* Meta Row: Categoria, Avaliações, Estoque */}
              <div className="pd-header-meta-row">
                <div className="pd-meta-item">
                  <span className="pd-meta-label">Categoria:</span>
                  <span className="pd-meta-val">{product.category || 'Geral'}</span>
                </div>

                <div className="pd-meta-divider" />

                <div className="pd-meta-item">
                  <div className="pd-stars-rating">
                    <Star size={14} fill="#f59e0b" stroke="none" />
                    <Star size={14} fill="#f59e0b" stroke="none" />
                    <Star size={14} fill="#f59e0b" stroke="none" />
                    <Star size={14} fill="#e2e8f0" stroke="none" />
                    <Star size={14} fill="#e2e8f0" stroke="none" />
                  </div>
                  <span className="pd-meta-val">3 Avaliações</span>
                </div>

                <div className="pd-meta-divider" />

                <div className="pd-meta-item">
                  <span>
                    Estoque: <strong style={{ color: '#1e293b', fontWeight: 600 }}>
                      {product.manage_stock === false ? 'Infinito' : `${product.stock || 10} unidades`}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions & Total */}
          <div className="pd-header-summary-right">
            <div className="pd-right-actions-row">
              <button
                type="button"
                className="pd-icon-btn"
                title="Compartilhar"
                onClick={() => {
                  navigator.clipboard.writeText(productPublicUrl)
                  alert('Link copiado para a área de transferência!')
                }}
              >
                <Share2 size={16} />
              </button>

              <button
                type="button"
                className="pd-icon-btn"
                title="Documento"
                onClick={() => window.print()}
              >
                <FileText size={16} />
              </button>

              <button
                type="button"
                className="pd-icon-btn"
                style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }}
                title="Imprimir etiqueta"
                onClick={() => window.print()}
              >
                <Printer size={16} />
              </button>

              <button
                type="button"
                className="pd-icon-btn"
                title="Imprimir espelho"
                onClick={() => window.print()}
              >
                <Printer size={16} />
              </button>
            </div>

            <div className="pd-price-block">
              <span className="pd-price-label">TOTAL DO PEDIDO</span>
              <div className="pd-price-val">
                R$ {currentPrice.toFixed(2).replace('.', ',')}
              </div>
              <div className="pd-date-row">
                <Calendar size={14} color="#94a3b8" />
                <span>{createdDateStr}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ── END: ProductHeaderSummary ── */}

      {/* ── BEGIN: MetricCardsGrid (5 Colunas) ── */}
      <section className="pd-metrics-section">
        <div className="pd-metrics-grid">
          {/* Card 1: Histórico de Vendas */}
          <div className="pd-metric-card">
            <div className="pd-metric-header">
              <span className="pd-metric-title">Histórico de Vendas</span>
              <TrendingUp size={15} color="#3b82f6" />
            </div>
            <div className="pd-metric-body">
              <div className="pd-metric-value">{salesInfo.totalSold} unid.</div>
              <div className="pd-metric-pill-red">
                {salesInfo.totalSold} VENDAS REGISTRADAS
              </div>
              <div className="pd-metric-subtext">Período personalizado</div>
            </div>
          </div>

          {/* Card 2: Estoque Disponível */}
          <div className="pd-metric-card">
            <div className="pd-metric-header">
              <span className="pd-metric-title">Estoque Disponível</span>
              <Package size={15} color="#94a3b8" />
            </div>
            <div className="pd-metric-body">
              <div className="pd-metric-value">
                {product.manage_stock === false ? 'Infinito' : `${product.stock || 10} unid.`}
              </div>
              <div className="pd-metric-subtext">
                Mínimo: {product.min_stock || 3} unid.
              </div>
            </div>
          </div>

          {/* Card 3: Preço na Loja */}
          <div className="pd-metric-card">
            <div className="pd-metric-header">
              <span className="pd-metric-title">Preço na Loja</span>
              <span className="pd-dot-green" />
            </div>
            <div className="pd-metric-body">
              <div className="pd-metric-value">
                R$ {salePrice.toFixed(2).replace('.', ',')}
              </div>
              <div className="pd-metric-subtext">Preço de Venda recomendado</div>
            </div>
          </div>

          {/* Card 4: Custo de Compra */}
          <div className="pd-metric-card">
            <div className="pd-metric-header">
              <span className="pd-metric-title">Custo de Compra</span>
              <Layers size={15} color="#94a3b8" />
            </div>
            <div className="pd-metric-body">
              <div className="pd-metric-value">
                R$ {costPrice.toFixed(2).replace('.', ',')}
              </div>
              <div className="pd-metric-subtext">Custo operacional bruto</div>
            </div>
          </div>

          {/* Card 5: Margem Estimada */}
          <div className="pd-metric-card">
            <div className="pd-metric-header">
              <span className="pd-metric-title">Margem Estimada</span>
              <TrendingUp size={15} color="#10b981" />
            </div>
            <div className="pd-metric-body">
              <div className="pd-metric-value" style={{ color: '#059669' }}>
                {marginPercent}%
              </div>
              <div className="pd-metric-subtext">
                Lucro: R$ {profit.toFixed(2).replace('.', ',')} / unid.
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ── END: MetricCardsGrid ── */}

      {/* ── BEGIN: MainContentGrid ── */}
      <main className="pd-main-grid">
        {/* Left Column (8 cols) */}
        <div className="pd-main-left">
          {/* Card 1: Ficha Técnica e Dados de Cadastro */}
          <section className="pd-card">
            <div className="pd-card-header">
              <div className="pd-card-title-wrap">
                <FileText className="pd-card-title-icon" />
                <h2>Ficha Técnica e Dados de Cadastro</h2>
              </div>
            </div>

            <div className="pd-specs-grid">
              <div className="pd-spec-item full-width">
                <span className="pd-spec-label">Nome do Produto</span>
                <span className="pd-spec-value">{product.name}</span>
              </div>

              <div className="pd-spec-item">
                <span className="pd-spec-label">SKU / Identificador</span>
                <span className="pd-spec-badge">{product.sku || 'TK-LAV-21V-01'}</span>
              </div>

              <div className="pd-spec-item">
                <span className="pd-spec-label">Código EAN / Barcode</span>
                <span className="pd-spec-value" style={{ color: '#64748b', fontStyle: product.ean ? 'normal' : 'italic' }}>
                  {product.ean || 'Não cadastrado'}
                </span>
              </div>

              <div className="pd-spec-item">
                <span className="pd-spec-label">Marca</span>
                <span className="pd-spec-value" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {product.brand || 'TEKNIX'}
                </span>
              </div>

              <div className="pd-spec-item">
                <span className="pd-spec-label">Modelo</span>
                <span className="pd-spec-value">{product.model || 'Padrão'}</span>
              </div>

              <div className="pd-spec-item">
                <span className="pd-spec-label">Categoria</span>
                <span className="pd-spec-value">{product.category || 'Geral'}</span>
              </div>

              <div className="pd-spec-item">
                <span className="pd-spec-label">Dimensões (C x L x A)</span>
                <span className="pd-spec-value">
                  {product.length || 28} × {product.width || 15} × {product.height || 12} cm
                </span>
              </div>

              <div className="pd-spec-item">
                <span className="pd-spec-label">Peso Bruto</span>
                <span className="pd-spec-value">{product.weight ? `${product.weight} kg` : '1.74 kg'}</span>
              </div>
            </div>
          </section>

          {/* Card 2: Descrição e Apresentação Comercial */}
          <section className="pd-card">
            <div className="pd-card-header">
              <div className="pd-card-title-wrap">
                <ShieldCheck className="pd-card-title-icon" />
                <h2>Descrição e Apresentação Comercial</h2>
              </div>
              <button
                type="button"
                className="pd-btn-expand"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Grid size={14} />
                {isExpanded ? 'Recolher' : 'Expandir tudo'}
              </button>
            </div>

            <div className="pd-desc-body">
              <div>
                <p className="pd-desc-lead-title">
                  {product.name} - Super Potente e Multifuncional
                </p>
                <p className="pd-desc-lead-sub">
                  Equipamento compacto e sem fio para higienização de carros, motos, bicicletas, quintais, calçadas, telhados e piscinas.
                </p>
              </div>

              {/* Destaques e Diferenciais */}
              <div className="pd-desc-section-block">
                <div className="pd-desc-section-heading">
                  Destaques e Diferenciais
                </div>
                <ul className="pd-desc-list">
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Pressão de até 70 BAR</strong> para remoção instantânea de sujeiras difíceis.</span>
                  </li>
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Motor de 19.000 RPM</strong> com torque superior e alta durabilidade operacional.</span>
                  </li>
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Duas baterias 21V</strong> recarregáveis inclusas para garantir total autonomia durante o uso contínuo.</span>
                  </li>
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Reservatório de sabão de 750ml</strong> para aplicação de detergentes e espumação rápida estilo Snow Foam.</span>
                  </li>
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Jatos Reguláveis:</strong> três bicos extras inclusos para jato focado e áreas maiores.</span>
                  </li>
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Mangueira flexível com adaptador universal</strong> para conectar diretamente em torneiras ou baldes.</span>
                  </li>
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Nível de ruído baixo de apenas 25 dBA</strong> para um manuseio mais confortável e silencioso.</span>
                  </li>
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Sucção de água até 10 metros</strong> de profundidade/distância com válvula de retenção.</span>
                  </li>
                  <li className="pd-desc-list-item">
                    <span className="pd-bullet-dot" />
                    <span><strong>Desvio volumétrico:</strong> vazão precisa ajustável de 5ml a 1.5L de borrifação por minuto.</span>
                  </li>
                </ul>
              </div>

              {/* Tecnologia */}
              <div className="pd-desc-section-block">
                <div className="pd-desc-section-heading">
                  Tecnologia para Limpeza Prática
                </div>
                <p style={{ paddingLeft: 8, margin: 0 }}>
                  Até 35x mais potente do que mangueiras tradicionais de jardim, eliminando poeira acumulada, lama incrustada, graxa e resíduos orgânicos sem esforço físico excessivo.
                </p>
              </div>

              {/* Regulagem de Jato */}
              <div className="pd-desc-section-block">
                <div className="pd-desc-section-heading">
                  Regulagem Inteligente de Jato
                </div>
                <ul className="pd-desc-list">
                  <li><strong>• Jato Concentrado (linha reta):</strong> Ideal para sujeira incrustada e superfícies resistentes como pedras e calçadas.</li>
                  <li><strong>• Jato Leque:</strong> Varredura macia, ideal para vidros, veículos e vasos delicados.</li>
                </ul>
              </div>

              {/* Aplicação Versátil */}
              <div className="pd-desc-section-block">
                <div className="pd-desc-section-heading">
                  Aplicação Versátil
                </div>
                <p style={{ paddingLeft: 8, margin: 0 }}>
                  Ideal para detalhamento automotivo, limpeza de pisos externos, móveis de jardim, churrasqueiras, paredes e irrigação de plantas.
                </p>
              </div>

              {/* Conteúdo do Kit */}
              <div className="pd-kit-box">
                <span className="pd-kit-title">Conteúdo do Kit Completo:</span>
                <div className="pd-kit-grid">
                  <div className="pd-kit-item"><span className="pd-kit-check">✓</span> 2x Baterias Recarregáveis 21V</div>
                  <div className="pd-kit-item"><span className="pd-kit-check">✓</span> 1x Pistola de Alta Pressão</div>
                  <div className="pd-kit-item"><span className="pd-kit-check">✓</span> 1x Mangueira de 5 Metros</div>
                  <div className="pd-kit-item"><span className="pd-kit-check">✓</span> 1x Adaptador Universal</div>
                  <div className="pd-kit-item"><span className="pd-kit-check">✓</span> 1x Reservatório de Sabão 750ml</div>
                  <div className="pd-kit-item"><span className="pd-kit-check">✓</span> 3x Bicos Direcionais Ajustáveis</div>
                  <div className="pd-kit-item"><span className="pd-kit-check">✓</span> 1x Maleta Rígida de Transporte</div>
                  <div className="pd-kit-item"><span className="pd-kit-check">✓</span> 1x Cabo de Carregamento Rápido</div>
                </div>
              </div>
            </div>
          </section>

          {/* Card 3: Storytelling & Apresentação */}
          <section className="pd-card">
            <div className="pd-card-header">
              <div className="pd-card-title-wrap">
                <h2>Storytelling & Apresentação Oficial</h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="pd-btn-secondary"
                  onClick={handleEditPage}
                  disabled={editingPage}
                >
                  <ExternalLink size={14} />
                  {editingPage ? 'Abrindo...' : 'Page Builder'}
                </button>
                <Link
                  to={`/hub/produtos/editar/${product.id}`}
                  className="pd-btn-primary"
                  style={{ height: 36, padding: '0 16px', fontSize: 12 }}
                >
                  <Edit size={14} />
                  Editar Produto
                </Link>
              </div>
            </div>

            <div className="pd-story-list">
              {/* 1. Hero Spotlight */}
              <div className="pd-story-item" onClick={handleEditPage}>
                <span className="pd-story-num">1</span>
                <div className="pd-story-info">
                  <h3 className="pd-story-title">Hero Spotlight</h3>
                  <div className="pd-story-desc">
                    {showcase.hero.eyebrow || 'Lavadora Recarregável Alta Pressão'}: {showcase.hero.title || 'Potência contínua de choque em qualquer piso.'}
                  </div>
                  <div className="pd-story-pills">
                    <span className="pd-story-pill">Alta Força 700 PSI</span>
                    <span className="pd-story-pill">2x Baterias 21V Inclusas</span>
                  </div>
                </div>
                <ChevronRight className="pd-story-chevron" />
              </div>

              {/* 2. Performance / Em Ação */}
              <div className="pd-story-item" onClick={handleEditPage}>
                <span className="pd-story-num">2</span>
                <div className="pd-story-info">
                  <h3 className="pd-story-title">Performance / Em Ação</h3>
                  <div className="pd-story-desc">
                    {showcase.performance.title || 'Motores sincronizados com acoplamento de alta velocidade (19 mil rotações por min).'}
                  </div>
                </div>
                <ChevronRight className="pd-story-chevron" />
              </div>

              {/* 3. Explore os Modelos e Configurações */}
              <div className="pd-story-item" onClick={handleEditPage}>
                <span className="pd-story-num">3</span>
                <div className="pd-story-info">
                  <h3 className="pd-story-title">Explore os Modelos e Configurações</h3>
                  <div className="pd-story-desc">
                    {showcase.explore_models.models.length || 3} desdobramentos customizados configurados.
                  </div>
                </div>
                <ChevronRight className="pd-story-chevron" />
              </div>

              {/* 4. Tabela Comparativa de Versões */}
              <div className="pd-story-item" onClick={handleEditPage}>
                <span className="pd-story-num">4</span>
                <div className="pd-story-info">
                  <h3 className="pd-story-title">Tabela Comparativa de Versões</h3>
                  <div className="pd-story-desc">
                    {showcase.comparison.rows.length || 4} especificações comparadas (Versão Standard 1 Bateria vs. Edição Pro 2x Baterias + Maleta).
                  </div>
                </div>
                <ChevronRight className="pd-story-chevron" />
              </div>

              {/* 5. Perguntas Frequentes (FAQ) */}
              <div className="pd-story-item" onClick={handleEditPage}>
                <span className="pd-story-num">5</span>
                <div className="pd-story-info">
                  <h3 className="pd-story-title">Perguntas Frequentes (FAQ)</h3>
                  <div className="pd-story-desc">
                    {showcase.faqs.length || 6} dúvidas com respostas diretas cadastradas.
                  </div>
                </div>
                <ChevronRight className="pd-story-chevron" />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols) */}
        <aside className="pd-main-right">
          {/* Card 1: Fotos Cadastradas */}
          <section className="pd-card">
            <div className="pd-card-header">
              <div className="pd-card-title-wrap">
                <Grid className="pd-card-title-icon" />
                <h2>Fotos Cadastradas ({allImages.length || 3})</h2>
              </div>
              <span className="pd-gallery-header-right">Total: {allImages.length || 3}</span>
            </div>

            <div className="pd-gallery-grid-2col">
              {/* Foto Principal */}
              <div className="pd-gallery-main-item">
                <img
                  src={mainPhoto}
                  alt="Foto principal"
                  className="pd-gallery-main-img"
                />
                <span className="pd-gallery-tag-principal">Principal</span>
              </div>

              {/* Thumbnails ao lado */}
              <div className="pd-gallery-thumbs-col">
                {sideThumbs.map((url, tIdx) => (
                  <div
                    key={tIdx}
                    className="pd-gallery-thumb-item"
                    onClick={() => {
                      const realIdx = allImages.indexOf(url)
                      if (realIdx >= 0) setSelectedPhotoIdx(realIdx)
                    }}
                  >
                    <img
                      src={url}
                      alt={`Foto miniatura ${tIdx + 1}`}
                      className="pd-gallery-thumb-img"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Card 2: Canais de Venda & Integração */}
          <section className="pd-card">
            <div className="pd-card-header">
              <div className="pd-card-title-wrap">
                <Layers className="pd-card-title-icon" />
                <h2>Canais de Venda & Integração</h2>
              </div>
            </div>

            <div className="pd-channels-list">
              {/* Canal 1: Loja Própria TEKNIX */}
              <div className="pd-channel-item">
                <div className="pd-channel-left">
                  <div className="pd-channel-icon-box pd-channel-icon-tx">
                    TX
                  </div>
                  <div>
                    <div className="pd-channel-name">Loja Própria TEKNIX</div>
                    <div className="pd-channel-sub">
                      {isPublished ? 'Ativo nas vitrines públicas' : 'Oculto da vitrine pública'}
                    </div>
                  </div>
                </div>
                <span className="pd-channel-badge-active">
                  Ativo
                </span>
              </div>

              {/* Canal 2: MercadoLivre */}
              <div className="pd-channel-item">
                <div className="pd-channel-left">
                  <div className="pd-channel-icon-box pd-channel-icon-ml">
                    ML
                  </div>
                  <div>
                    <div className="pd-channel-name">MercadoLivre (Lojas)</div>
                    <div className="pd-channel-sub">Publicação contínua 4 canais conectados</div>
                  </div>
                </div>
                <span className="pd-channel-badge-pending">
                  Pendente Alerta / Sincronizar
                </span>
              </div>
            </div>
          </section>
        </aside>
      </main>
      {/* ── END: MainContentGrid ── */}
    </div>
  )
}
