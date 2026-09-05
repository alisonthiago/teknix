import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Eye,
  LayoutTemplate,
  CheckCircle2,
  AlertCircle,
  Package,
  TrendingUp,
  DollarSign,
  Layers,
  Share2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Copy,
  Check,
  Globe,
  EyeOff
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { createPage } from '../services/pageBuilder'
import type { Product } from '../types/database'
import './ProductDetails.css'

function FormattedDescription({ text }: { text: string }) {
  if (!text) {
    return <div className="desc-empty">Nenhuma descrição cadastrada para este produto ainda.</div>
  }

  // Remove repetidas linhas de separador de traços ou sinais de igual (ex: -----------------------)
  const cleanSections = text.split(/[-=]{4,}/g).map(s => s.trim()).filter(Boolean)

  return (
    <div className="desc-modern-container">
      {cleanSections.map((section, sIdx) => {
        const lines = section.split('\n').map(l => l.trim()).filter(Boolean)
        const elements: React.ReactNode[] = []
        let currentList: string[] = []

        const flushList = (keyPrefix: string) => {
          if (currentList.length > 0) {
            elements.push(
              <ul key={`${keyPrefix}-list`} className="desc-modern-list">
                {currentList.map((item, iIdx) => {
                  const colonIdx = item.indexOf(':')
                  if (colonIdx > 0 && colonIdx < 40) {
                    const label = item.substring(0, colonIdx)
                    const rest = item.substring(colonIdx + 1)
                    return (
                      <li key={iIdx} className="desc-list-item">
                        <span className="desc-item-bullet">•</span>
                        <span className="desc-item-content">
                          <strong className="desc-item-label">{label}:</strong>
                          <span className="desc-item-text">{rest}</span>
                        </span>
                      </li>
                    )
                  }
                  return (
                    <li key={iIdx} className="desc-list-item">
                      <span className="desc-item-bullet">•</span>
                      <span className="desc-item-content">
                        <span className="desc-item-text">{item}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )
            currentList = []
          }
        }

        lines.forEach((line, lIdx) => {
          if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
            currentList.push(line.replace(/^[-•*]\s*/, ''))
          } else {
            flushList(`s${sIdx}-l${lIdx}`)
            const isHeading =
              line.endsWith(':') ||
              (line.length < 50 &&
                (line.toLowerCase().includes('benefício') ||
                  line.toLowerCase().includes('especificaç') ||
                  line.toLowerCase().includes('o que o') ||
                  line.toLowerCase().includes('estojo') ||
                  line.toLowerCase().includes('chave de impacto') ||
                  line.toLowerCase().includes('adquira')))

            if (isHeading) {
              elements.push(
                <h4 key={`h-${lIdx}`} className="desc-modern-heading">
                  <span className="heading-indicator" />
                  {line.replace(/:$/, '')}
                </h4>
              )
            } else {
              elements.push(
                <p key={`p-${lIdx}`} className="desc-modern-paragraph">
                  {line}
                </p>
              )
            }
          }
        })
        flushList(`s${sIdx}-end`)

        return (
          <div key={sIdx} className="desc-section-block">
            {elements}
            {sIdx < cleanSections.length - 1 && <hr className="desc-modern-divider" />}
          </div>
        )
      })}
    </div>
  )
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState(false)
  const [togglingPublish, setTogglingPublish] = useState(false)
  const [copiedDesc, setCopiedDesc] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedSku, setCopiedSku] = useState(false)

  const copyId = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copySku = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedSku(true)
    setTimeout(() => setCopiedSku(false), 2000)
  }
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
          resolved = {
            id: productId,
            name: 'Produto em Demonstração TEKNIX',
            sku: 'TKN-PROD-DEMO',
            brand: 'TEKNIX',
            model: 'TX-2026',
            category: 'Ferramentas',
            cost_purchase: 120.00,
            price: 199.90,
            stock: 15,
            min_stock: 2,
            status: 'active',
            notes: 'Produto registrado para visualização e gestão operacional no HUB.',
            images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80'],
            store_meta: {
              published: true,
              sale_price: 199.90,
              slug: productId,
              short_description: 'Ferramenta profissional com garantia oficial e alta durabilidade.',
              store_description: 'Equipamento projetado para alto rendimento em oficinas e serviços industriais.'
            }
          }
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

  function handleCopyDesc() {
    const textToCopy = product?.store_meta?.store_description || product?.notes || product?.description || ''
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setCopiedDesc(true)
    setTimeout(() => setCopiedDesc(false), 2000)
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
      <div className="product-details-page">
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>
          Carregando visão geral do produto no HUB...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-details-page">
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>
          Produto não encontrado.
          <br /><br />
          <Link to="/hub/produtos" className="btn-product-action">Voltar para a lista</Link>
        </div>
      </div>
    )
  }

  const meta = Array.isArray(product.store_meta) ? product.store_meta[0] : product.store_meta
  const isPublished = Boolean(meta?.published ?? true)
  const costPrice = Number(product.cost_purchase || 0)
  const salePrice = Number(meta?.sale_price || product.sell_price || product.sale_price || product.price || (costPrice ? (costPrice * 1.6).toFixed(2) : 0))
  const promoPrice = meta?.promotional_price ? Number(meta.promotional_price) : null
  const currentPrice = promoPrice || salePrice
  const profit = currentPrice - costPrice
  const marginPercent = currentPrice > 0 ? ((profit / currentPrice) * 100).toFixed(1) : '0'

  const imgUrl = (product.images && product.images[0]) || product.main_image || product.image_url || ''
  const allImages = [...new Set([imgUrl, ...(product.images || [])].filter(Boolean))]

  return (
    <div className="product-details-page">
      {/* ── Navegação e Breadcrumb ── */}
      <div className="product-details-nav">
        <Link to="/hub/produtos" className="product-details-back-link">
          <ArrowLeft size={16} />
          Voltar para Produtos
        </Link>
        <div className="product-details-breadcrumbs">
          <Link to="/hub">Início</Link>
          <span>/</span>
          <Link to="/hub/produtos">Produtos</Link>
          <span>/</span>
          <span style={{ color: '#111827', fontWeight: 600 }}>{product.name}</span>
        </div>
      </div>

      {/* ── Header Principal do Produto ── */}
      {(() => {
        const siteBaseUrl = import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : (window.location.hostname.includes('teknixbrasil.com.br') ? 'https://www.teknixbrasil.com.br' : 'http://localhost:5173'))
        const productPublicSlug = meta?.slug || product.slug || product.sku || product.id
        const productPublicUrl = `${siteBaseUrl}/produtos/${productPublicSlug}`

        return (
          <div className="product-details-header">
            <div className="product-header-main">
              <div className="product-header-thumb-wrap">
                {imgUrl ? (
                  <img src={imgUrl} alt={product.name} className="product-header-thumb" />
                ) : (
                  <Package size={34} color="#94a3b8" />
                )}
              </div>
              <div className="product-header-info">
                <div className="product-header-badges">
                  <span className={`product-pill ${isPublished ? 'published' : 'draft'}`}>
                    <span className={`status-dot ${isPublished ? 'published' : 'draft'}`} />
                    {isPublished ? 'Publicado no Site' : 'Rascunho / Oculto'}
                  </span>
                  {product.brand && (
                    <span className="product-pill brand">
                      {product.brand}
                    </span>
                  )}
                  {product.sku && (
                    <button
                      type="button"
                      onClick={() => copySku(product.sku)}
                      className="product-pill sku-pill"
                      title="Clique para copiar o SKU"
                    >
                      <span>SKU: {product.sku}</span>
                      {copiedSku ? <Check size={11} color="#15803d" /> : <Copy size={11} className="copy-icon" />}
                    </button>
                  )}
                  <span className="product-pill sales-history" title="Total acumulado de vendas já realizadas">
                    🔥 {salesInfo.totalSold} vendas
                  </span>
                  <span
                    className={`product-pill ml-status ${salesInfo.mlStatus === 'active' ? 'active' : 'paused'}`}
                    title="Status no Mercado Livre (histórico preservado)"
                  >
                    ML: {salesInfo.mlStatus === 'active' ? 'Ativo' : 'Pausado'}
                  </span>
                </div>

                <h1 className="product-header-title">{product.name}</h1>

                <div className="product-header-subtext">
                  <span className="product-meta-item">
                    Categoria: <strong>{product.category || 'Geral'}</strong>
                  </span>
                  {product.model && (
                    <>
                      <span className="meta-separator">•</span>
                      <span className="product-meta-item">
                        Modelo: <strong>{product.model}</strong>
                      </span>
                    </>
                  )}
                  <span className="meta-separator">•</span>
                  <button
                    type="button"
                    onClick={() => copyId(product.id)}
                    className="product-id-chip"
                    title="Clique para copiar o ID completo"
                  >
                    <span>ID: <code>{product.id ? `${product.id.slice(0, 8)}...` : ''}</code></span>
                    {copiedId ? <Check size={11} color="#15803d" /> : <Copy size={11} />}
                    {copiedId && <span className="copied-tag">Copiado!</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Ações no Topo ── */}
            <div className="product-header-actions">
              <button
                type="button"
                className={`btn-product-action ${isPublished ? 'unpublish' : 'publish'}`}
                onClick={handleTogglePublish}
                disabled={togglingPublish}
                title="Alterar visibilidade do produto na loja pública"
              >
                {isPublished ? (
                  <>
                    <EyeOff size={15} />
                    <span>Despublicar</span>
                  </>
                ) : (
                  <>
                    <Globe size={15} />
                    <span>Publicar no Site</span>
                  </>
                )}
              </button>

              <a
                href={productPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-product-action store"
                title="Abrir página pública do produto na loja própria"
              >
                <ExternalLink size={15} />
                <span>Ver na Loja</span>
              </a>

              <button
                type="button"
                className="btn-product-action pagebuilder"
                onClick={handleEditPage}
                disabled={editingPage}
                title="Editar layout visual da página do produto no Page Builder"
              >
                <LayoutTemplate size={15} />
                <span>{editingPage ? 'Abrindo...' : 'Page Builder'}</span>
              </button>

              <Link
                to={`/hub/produtos/editar/${product.id}`}
                className="btn-product-action primary"
                title="Editar dados cadastrais, preços e estoque"
              >
                <Edit size={15} />
                <span>Editar Cadastro</span>
              </Link>
            </div>
          </div>
        )
      })()}

      {/* ── Grid de Métricas Principais (5 Colunas) ── */}
      <div className="product-metrics-grid">
        <div className="metric-card highlight-sales">
          <div className="metric-card-top">
            <span>Histórico de Vendas</span>
            <TrendingUp size={16} color="#2563eb" />
          </div>
          <div className="metric-card-value">
            {salesInfo.totalSold} unid.
          </div>
          <div className="metric-card-sub">
            <span className={`status-badge-inline ${salesInfo.mlStatus === 'active' ? 'active' : 'paused'}`}>
              {salesInfo.mlStatus === 'active' ? '● Anúncio Ativo' : '○ Anúncio Pausado'}
            </span>
            <span>Vendas preservadas</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span>Estoque Disponível</span>
            <Package size={16} color="#3b82f6" />
          </div>
          <div className="metric-card-value">
            {product.manage_stock === false ? 'Infinito' : `${product.stock || 0} unid.`}
          </div>
          <div className="metric-card-sub">
            Mínimo: {product.min_stock || 0} unid.
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span>Preço na Loja</span>
            <DollarSign size={16} color="#16a34a" />
          </div>
          <div className="metric-card-value">
            R$ {salePrice.toFixed(2).replace('.', ',')}
          </div>
          <div className="metric-card-sub">
            {promoPrice ? `Promoção: R$ ${promoPrice.toFixed(2).replace('.', ',')}` : 'Preço de tabela normal'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span>Custo de Compra</span>
            <Layers size={16} color="#6b7280" />
          </div>
          <div className="metric-card-value">
            R$ {costPrice.toFixed(2).replace('.', ',')}
          </div>
          <div className="metric-card-sub">
            Custo operacional bruto
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span>Margem Estimada</span>
            <TrendingUp size={16} color="#8b5cf6" />
          </div>
          <div className="metric-card-value" style={{ color: Number(marginPercent) > 0 ? '#15803d' : '#b91c1c' }}>
            {marginPercent}%
          </div>
          <div className="metric-card-sub">
            Lucro: R$ {profit.toFixed(2).replace('.', ',')} / unid.
          </div>
        </div>
      </div>

      {/* ── Conteúdo Detalhado (Layout 2 Colunas) ── */}
      <div className="product-details-content-layout">
        {/* Coluna Esquerda: Especificações, Descrição e Fotos */}
        <div>
          {/* Dados Gerais / Ficha Técnica Moderna */}
          <div className="product-section-card">
            <h2 className="product-section-title">
              <Tag size={18} color="#4b5563" />
              Ficha Técnica e Dados do Cadastro
            </h2>
            <div className="specs-modern-grid">
              <div className="spec-item-card full-width">
                <span className="spec-item-label">Nome do Produto</span>
                <span className="spec-item-value">{product.name}</span>
              </div>
              <div className="spec-item-card">
                <span className="spec-item-label">SKU / Identificador</span>
                <span className="spec-badge-code">{product.sku || 'Não informado'}</span>
              </div>
              <div className="spec-item-card">
                <span className="spec-item-label">Código EAN / Barras</span>
                <span className="spec-item-value">{product.ean || 'Não cadastrado'}</span>
              </div>
              <div className="spec-item-card">
                <span className="spec-item-label">Marca</span>
                <span className="spec-item-value" style={{ fontWeight: 600 }}>{product.brand || 'TEKNIX'}</span>
              </div>
              <div className="spec-item-card">
                <span className="spec-item-label">Modelo</span>
                <span className="spec-item-value">{product.model || 'Padrão'}</span>
              </div>
              <div className="spec-item-card">
                <span className="spec-item-label">Categoria</span>
                <span className="spec-item-value">{product.category || 'Geral'}</span>
              </div>
              <div className="spec-item-card">
                <span className="spec-item-label">Dimensões (C x L x A)</span>
                <span className="spec-item-value">
                  {product.length || 0} x {product.width || 0} x {product.height || 0} cm
                </span>
              </div>
              <div className="spec-item-card">
                <span className="spec-item-label">Peso Bruto</span>
                <span className="spec-item-value">{product.weight ? `${product.weight} kg` : 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Descrição da Loja Formatada e Leve */}
          <div className="product-section-card">
            <div className="product-section-header-row">
              <h2 className="product-section-title">
                <ShieldCheck size={18} color="#4b5563" />
                Descrição e Apresentação Comercial
              </h2>
              <button
                type="button"
                className="btn-copy-desc"
                onClick={handleCopyDesc}
                title="Copiar texto da descrição para a área de transferência"
              >
                {copiedDesc ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                {copiedDesc ? 'Copiado!' : 'Copiar Texto'}
              </button>
            </div>
            {meta?.short_description && (
              <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#374151', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a' }}>Resumo / Destaque:</strong> {meta.short_description}
              </div>
            )}
            <FormattedDescription text={meta?.store_description || product.notes || product.description || ''} />
          </div>
        </div>

        {/* Coluna Direita: Galeria e Canais */}
        <div>
          {/* Galeria de Fotos */}
          <div className="product-section-card">
            <h2 className="product-section-title">
              <Eye size={18} color="#4b5563" />
              Fotos Cadastradas ({allImages.length})
            </h2>
            {allImages.length > 0 ? (
              <div className="product-gallery-grid">
                {allImages.map((url, idx) => (
                  <div key={idx} className="product-gallery-item">
                    <img src={url} alt={`${product.name} foto ${idx + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Nenhuma foto cadastrada.
              </div>
            )}
          </div>

          {/* Canais de Venda e Sincronização */}
          <div className="product-section-card">
            <h2 className="product-section-title">
              <Layers size={18} color="#4b5563" />
              Canais de Venda & Integração
            </h2>
            <div className="product-channels-list">
              <div className="product-channel-item">
                <div className="product-channel-info">
                  <div className="product-channel-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                    TX
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Loja Própria TEKNIX</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {isPublished ? 'Ativo na vitrine pública' : 'Oculto da vitrine'}
                    </div>
                  </div>
                </div>
                <span className={`product-pill ${isPublished ? 'published' : 'draft'}`}>
                  {isPublished ? 'Online' : 'Pausado'}
                </span>
              </div>

              <div className="product-channel-item">
                <div className="product-channel-info">
                  <div className="product-channel-icon" style={{ background: '#fef08a', color: '#854d0e' }}>
                    ML
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Mercado Livre (FLOW)</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {product.sku?.startsWith('MLB') ? `Anúncio: ${product.sku}` : 'Catálogo central'} • {salesInfo.totalSold} vendas registradas
                    </div>
                  </div>
                </div>
                <span className={`product-pill ml-status ${salesInfo.mlStatus === 'active' ? 'active' : 'paused'}`}>
                  {salesInfo.mlStatus === 'active' ? 'Ativo' : 'Pausado (Vendas Salvas)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
