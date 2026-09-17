'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Store, 
  Package, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  DollarSign,
  AlertCircle,
  Plus
} from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { createClient } from '@/utils/supabase/client'
import { matchesSearchQuery } from '@/lib/utils'

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function slugify(text?: string | null): string {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getProductPublicSlug(p: any): string {
  if (!p) return ''
  const meta = Array.isArray(p.store_meta) ? p.store_meta[0] : p.store_meta
  return meta?.slug || slugify(p.name) || p.slug || p.sku || ''
}

function PublicacaoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialProductId = searchParams.get('productId') || searchParams.get('id') || ''

  // Estado do Produto Central
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId)
  const [product, setProduct] = useState<any | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState('')

  // Canais & Formulário de Oferta
  const [selectedChannel, setSelectedChannel] = useState<'site' | 'mercadolivre' | 'shopee' | 'magalu'>('site')
  const [sitePublishActive, setSitePublishActive] = useState(true)
  const [mlMode, setMlMode] = useState<'CATALOG' | 'TRADITIONAL'>('CATALOG')
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [catalogSearching, setCatalogSearching] = useState(false)
  const [catalogCandidates, setCatalogCandidates] = useState<any[]>([])
  const [selectedCatalogId, setSelectedCatalogId] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [listingType, setListingType] = useState<'gold_special' | 'gold_pro'>('gold_special')
  const [customTitle, setCustomTitle] = useState('')

  // Submissão
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 1. Carrega catálogo para busca rápida instantânea (via API central sem falha de RLS ou colunas)
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setAllProducts(data)
            return
          }
        }
      } catch (e) {
        console.warn('Fallback para cliente Supabase local:', e)
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('name')
        .limit(1000)
      if (data) {
        setAllProducts(data.map(p => ({
          ...p,
          price: p.site_price || p.cost_purchase || 0
        })))
      }
    }
    loadProducts()
  }, [])

  // Filtragem inteligente: só pesquisa quando o usuário digitar (não lista nada por padrão)
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return []
    return allProducts.filter(p =>
      matchesSearchQuery([p.name, p.sku, p.brand, p.model, p.ean], productSearch)
    )
  }, [allProducts, productSearch])

  // 2. Busca dados detalhados do produto selecionado
  useEffect(() => {
    if (!selectedProductId) return
    let isCancelled = false
    async function fetchProduct() {
      setLoadingProduct(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', selectedProductId)
        .single()

      if (!isCancelled && data) {
        setProduct(data)
        setSitePublishActive(data.is_site_published ?? true)
        const initialPrice = selectedChannel === 'site' 
          ? (data.site_price || data.cost_purchase || '')
          : (data.site_price || data.cost_purchase || '')
        setOfferPrice(String(initialPrice))
        setCustomTitle(data.name || '')
        setCatalogSearchQuery(data.name || '')
        // Dispara busca no catálogo com os dados do produto que está sendo publicado
        triggerCatalogSearch(data.name, data.ean, data.brand, data.model, data.image_url, data.site_price || data.cost_purchase)
      }
      if (!isCancelled) setLoadingProduct(false)
    }
    fetchProduct()
    return () => { isCancelled = true }
  }, [selectedProductId])

  const triggerCatalogSearch = async (
    overrideQuery?: string,
    ean?: string,
    brand?: string,
    model?: string,
    imageUrl?: string,
    price?: number
  ) => {
    setCatalogSearching(true)
    try {
      const query = overrideQuery !== undefined ? overrideQuery : (catalogSearchQuery || product?.name || '')
      const res = await fetch('/api/mercadolivre/catalog/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          gtin: ean && ean !== '—' ? ean : product?.ean,
          brand: brand && brand !== '—' ? brand : product?.brand,
          model: model && model !== '—' ? model : product?.model,
          imageUrl: imageUrl || product?.image_url,
          price: price || (product?.site_price ? Number(product.site_price) : undefined)
        })
      })
      const json = await res.json()
      if (json.candidates && json.candidates.length > 0) {
        setCatalogCandidates(json.candidates)
        setSelectedCatalogId(json.candidates[0].catalog_product_id)
      }
    } catch (e) {
      console.warn('Erro na busca do catálogo ML:', e)
    } finally {
      setCatalogSearching(false)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) {
      setFeedback({ type: 'error', text: 'Selecione um produto central antes de publicar.' })
      return
    }

    const numPrice = Number(offerPrice.replace(',', '.'))
    if (!numPrice || numPrice <= 0) {
      setFeedback({ type: 'error', text: 'Informe um preço de venda válido para a nova oferta.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    // Publicação direta no Site Próprio (Loja Oficial D2C)
    // Sincronização em via de mão dupla com o HUB e SITE
    if (selectedChannel === 'site') {
      try {
        const supabase = createClient()
        // 1. Atualiza na tabela central products (FLOW / Operação)
        const { error: siteErr } = await supabase
          .from('products')
          .update({
            is_site_published: sitePublishActive,
            site_price: numPrice,
            status: sitePublishActive ? 'ACTIVE' : 'PAUSED',
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)

        if (siteErr) throw siteErr

        // 2. Atualiza em mão dupla no product_store_metadata (HUB / SITE)
        const { data: existingMeta } = await supabase
          .from('product_store_metadata')
          .select('id')
          .eq('product_id', product.id)
          .maybeSingle()

        const publicSlug = getProductPublicSlug(product)
        if (existingMeta?.id) {
          await supabase
            .from('product_store_metadata')
            .update({
              published: sitePublishActive,
              sale_price: numPrice,
              slug: publicSlug,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMeta.id)
        } else {
          await supabase
            .from('product_store_metadata')
            .insert({
              product_id: product.id,
              published: sitePublishActive,
              sale_price: numPrice,
              slug: publicSlug,
              updated_at: new Date().toISOString()
            })
        }

        setFeedback({
          type: 'success',
          text: sitePublishActive
            ? `Produto publicado com sucesso no Site Oficial! Preço: R$ ${numPrice.toFixed(2).replace('.', ',')} (Canal Direto D2C)`
            : 'Produto ocultado do Site Oficial com sucesso!'
        })

        setProduct((prev: any) => ({
          ...prev,
          is_site_published: sitePublishActive,
          site_price: numPrice
        }))

        setTimeout(() => {
          router.push(`/produtos/${product.id}`)
        }, 1500)
      } catch (err: any) {
        setFeedback({ type: 'error', text: err.message || 'Falha ao atualizar publicação no Site' })
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (selectedChannel === 'mercadolivre' && mlMode === 'CATALOG' && !selectedCatalogId) {
      setFeedback({ type: 'error', text: 'Informe ou selecione um Catalog Product ID válido do Mercado Livre.' })
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/marketplaces/publish-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          channel: selectedChannel,
          mode: mlMode,
          catalogProductId: selectedCatalogId,
          price: numPrice,
          listingType,
          title: customTitle || product.name
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao publicar oferta')

      setFeedback({
        type: 'success',
        text: json.message || 'Oferta publicada e vinculada com sucesso ao produto central!'
      })

      setTimeout(() => {
        router.push(`/produtos/${product.id}`)
      }, 1500)
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Falha na publicação da oferta.' })
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="max-w-5xl mx-auto px-1 sm:px-3 lg:px-4 py-6 pb-20 space-y-7">
      {/* Navegação e Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={product ? `/produtos/${product.id}` : '/operacao'}
              className="hub-mobile-back-btn"
              aria-label={product ? `Voltar ao Produto ${product.sku}` : 'Voltar para Operação'}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="!text-[24px] !leading-[1.2] font-black text-[#111111] tracking-tight">
              Publicação Multicanal
            </h1>
          </div>
        </div>

        {product && (
          <Link
            href={`/produtos/${product.id}`}
            className="btn btn-secondary self-start sm:self-auto"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            Ver Ficha do Produto
          </Link>
        )}
      </div>

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Bloco 1: Produto Central */}
        <div className="bg-white border border-[#e6e6e6] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-4">
            <h2 className="!text-[18px] !leading-[1.25] font-bold text-[#111111] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#666666]" /> 1. Produto Central de Origem
            </h2>
            {product && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#ecfdf5] border border-[#bbf7d0] text-[#16a34a]">
                Estoque Central: {product.stock || 0} un
              </span>
            )}
          </div>

          {!product ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#111111]">
                  Pesquisar Produto Central:
                </label>
                {productSearch.trim() && (
                  <span className="text-[11px] text-[#666666]">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999] pointer-events-none select-none z-10" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (filteredProducts.length > 0) {
                        setSelectedProductId(filteredProducts[0].id)
                        setProductSearch('')
                      }
                    }
                  }}
                  placeholder="Digite o nome ou SKU para buscar..."
                  style={{ paddingLeft: '40px', paddingRight: '36px' }}
                  className="raw-input w-full py-2.5 text-xs bg-[#fafafa] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111111] transition-all"
                  autoFocus
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#111111] text-xs font-bold p-1 cursor-pointer z-10"
                    title="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>

              {productSearch.trim() && (
                filteredProducts.length === 0 ? (
                  <div className="p-5 text-center bg-[#fafafa] border border-dashed border-[#e2e8f0] rounded-2xl">
                    <p className="text-xs font-bold text-[#111111]">
                      Nenhum produto encontrado para &quot;{productSearch}&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="mt-2.5 px-3 py-1.5 text-xs font-semibold text-[#111111] bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f5f5f5] transition-all cursor-pointer shadow-2xs"
                    >
                      Limpar pesquisa
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pt-1">
                    {filteredProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id)
                          setProductSearch('')
                        }}
                        className="p-3 border border-[#e2e8f0] hover:border-[#111111] hover:ring-1 hover:ring-[#111111] rounded-2xl flex items-center gap-3 cursor-pointer bg-white transition-all shadow-2xs hover:shadow-xs group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#fafafa] border border-[#e6e6e6] p-1 shrink-0 flex items-center justify-center">
                          <img src={p.image_url || '/placeholder-product.png'} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#111111] line-clamp-2 leading-snug group-hover:text-[#2563eb] transition-colors">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#666666] mt-1 font-mono">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span className="text-[#16a34a] font-semibold">{p.stock || 0} un</span>
                            {p.price && (
                              <>
                                <span>•</span>
                                <span className="text-[#111111] font-bold">R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start gap-5 p-4 bg-[#fafafa] border border-[#e6e6e6] rounded-2xl">
              <div className="w-20 h-20 rounded-xl bg-white border border-[#e6e6e6] p-2 shrink-0 flex items-center justify-center shadow-2xs">
                <img src={product.image_url || '/placeholder-product.png'} alt="" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-[#111111] leading-snug">
                  {product.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <span className="px-2.5 py-0.5 bg-white border border-[#e5e7eb] rounded-lg font-mono text-[#333]">
                    SKU: <strong>{product.sku}</strong>
                  </span>
                  {product.brand && (
                    <span className="px-2.5 py-0.5 bg-white border border-[#e5e7eb] rounded-lg text-[#333]">
                      Marca: <strong>{product.brand}</strong>
                    </span>
                  )}
                  {product.ean && product.ean !== '—' && (
                    <span className="px-2.5 py-0.5 bg-white border border-[#e5e7eb] rounded-lg font-mono text-[#333]">
                      EAN: <strong>{product.ean}</strong>
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] rounded-lg font-bold">
                    Estoque Físico Central: {product.stock || 0} un
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProduct(null)
                  setSelectedProductId('')
                }}
                className="text-xs text-[#666666] hover:text-[#111111] underline font-medium self-end sm:self-center cursor-pointer"
              >
                Trocar produto
              </button>
            </div>
          )}
        </div>

        {/* Bloco 2: Seleção do Canal de Destino */}
        <div className="bg-white border border-[#e6e6e6] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#f0f0f0] pb-4">
            <h2 className="!text-[18px] !leading-[1.25] font-bold text-[#111111] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#666666]" /> 2. Canal de Publicação
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Canal 1: Loja Oficial TEKNIX (Site Próprio) */}
            <div
              onClick={() => {
                setSelectedChannel('site')
                if (product) {
                  setOfferPrice(String(product.site_price || product.price || ''))
                  setSitePublishActive(product.is_site_published ?? true)
                }
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                selectedChannel === 'site'
                  ? 'border-[#111111] bg-[#fafafa] ring-2 ring-[#111111]/15 shadow-sm'
                  : 'border-[#e6e6e6] hover:border-[#cbd5e1] bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#111111] text-white flex items-center justify-center font-black text-xs shrink-0">
                    TKX
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#111111] block leading-tight">Loja Oficial (Site)</span>
                    <span className="text-[10px] text-[#2563eb] font-medium">Canal Direto D2C</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#888888] leading-snug">
                  Publicação direta no e-commerce Teknix com estoque unificado.
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold pt-1">
                <span className={selectedChannel === 'site' ? 'text-[#111111]' : 'text-[#888888]'}>
                  {selectedChannel === 'site' ? '✓ Selecionado' : 'Selecionar'}
                </span>
                {product?.is_site_published && (
                  <span className="text-[#16a34a] text-[9px] font-bold">Publicado</span>
                )}
              </div>
            </div>

            {/* Canal 2: Mercado Livre */}
            <div
              onClick={() => {
                setSelectedChannel('mercadolivre')
                if (product) setOfferPrice(String(product.price || ''))
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                selectedChannel === 'mercadolivre'
                  ? 'border-[#ffe600] bg-[#fffde7]/60 ring-2 ring-[#ffe600]/50 shadow-sm'
                  : 'border-[#e6e6e6] hover:border-[#cbd5e1] bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <MarketplaceLogo name="Mercado Livre" className="w-7 h-7 object-contain shrink-0" />
                  <span className="text-sm font-bold text-[#111111]">Mercado Livre</span>
                </div>
                <p className="text-[10px] text-[#888888] leading-snug">
                  Catálogo oficial Buy Box ou anúncio tradicional clássico/premium.
                </p>
              </div>
              <span className={`text-[10px] font-bold pt-1 ${selectedChannel === 'mercadolivre' ? 'text-[#111111]' : 'text-[#888888]'}`}>
                {selectedChannel === 'mercadolivre' ? '✓ Selecionado' : 'Selecionar'}
              </span>
            </div>

            {/* Canal 3: Shopee */}
            <div
              onClick={() => {
                setSelectedChannel('shopee')
                if (product) setOfferPrice(String(product.price || ''))
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                selectedChannel === 'shopee'
                  ? 'border-[#ee4d2d] bg-[#fff5f5] ring-2 ring-[#ee4d2d]/15 shadow-sm'
                  : 'border-[#e6e6e6] hover:border-[#cbd5e1] bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <MarketplaceLogo name="Shopee" className="w-7 h-7 object-contain shrink-0" />
                  <span className="text-sm font-bold text-[#111111]">Shopee Brasil</span>
                </div>
                <p className="text-[10px] text-[#888888] leading-snug">
                  Sincronização de catálogo e estoque na conta oficial Shopee.
                </p>
              </div>
              <span className={`text-[10px] font-bold pt-1 ${selectedChannel === 'shopee' ? 'text-[#ee4d2d]' : 'text-[#888888]'}`}>
                {selectedChannel === 'shopee' ? '✓ Selecionado' : 'Selecionar'}
              </span>
            </div>

            {/* Canal 4: Magazine Luiza */}
            <div
              onClick={() => {
                setSelectedChannel('magalu')
                if (product) setOfferPrice(String(product.price || ''))
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                selectedChannel === 'magalu'
                  ? 'border-[#0086ff] bg-[#f0f7ff] ring-2 ring-[#0086ff]/15 shadow-sm'
                  : 'border-[#e6e6e6] hover:border-[#cbd5e1] bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <MarketplaceLogo name="Magalu" className="w-7 h-7 object-contain shrink-0" />
                  <span className="text-sm font-bold text-[#111111]">Magazine Luiza</span>
                </div>
                <p className="text-[10px] text-[#888888] leading-snug">
                  Integração de ofertas e controle de estoque no marketplace Magalu.
                </p>
              </div>
              <span className={`text-[10px] font-bold pt-1 ${selectedChannel === 'magalu' ? 'text-[#0086ff]' : 'text-[#888888]'}`}>
                {selectedChannel === 'magalu' ? '✓ Selecionado' : 'Selecionar'}
              </span>
            </div>
          </div>

          {/* Configurações específicas da Loja Oficial (Site) */}
          {selectedChannel === 'site' && (
            <div className="pt-4 border-t border-[#f0f0f0] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#f8faff] border border-[#bfdbfe] rounded-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2563eb]">
                      Canal Oficial D2C
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      sitePublishActive ? 'bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]' : 'bg-[#f3f4f6] text-[#6b7280]'
                    }`}>
                      {sitePublishActive ? '● Ativo no Site' : '○ Oculto no Site'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#111111]">
                    Loja Própria TEKNIX (teknixbrasil.com.br)
                  </h4>
                </div>
                {product && (
                  <a
                    href={`http://localhost:5173/${getProductPublicSlug(product)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-white border border-[#bfdbfe] text-[#2563eb] rounded-xl text-xs font-bold hover:bg-[#eff6ff] transition-all flex items-center gap-1.5 shrink-0 shadow-2xs self-start sm:self-auto"
                  >
                    Ver no Site <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-[#e2e8f0] bg-white space-y-2">
                  <label className="block text-xs font-bold text-[#111111]">
                    Status no Site:
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#111111]">
                      <input
                        type="radio"
                        name="sitePublishRadio"
                        checked={sitePublishActive}
                        onChange={() => setSitePublishActive(true)}
                        className="text-[#16a34a]"
                      />
                      Ativo no Site
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#666666]">
                      <input
                        type="radio"
                        name="sitePublishRadio"
                        checked={!sitePublishActive}
                        onChange={() => setSitePublishActive(false)}
                      />
                      Ocultar / Pausar
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[#e2e8f0] bg-white space-y-1">
                  <span className="text-[11px] text-[#666666] font-medium block">
                    URL Pública do Produto:
                  </span>
                  <div className="text-xs font-mono font-bold text-[#111111] truncate">
                    http://localhost:5173/{product ? getProductPublicSlug(product) : 'nome-do-produto'}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Configurações específicas do Mercado Livre */}
          {selectedChannel === 'mercadolivre' && (
            <div className="pt-4 border-t border-[#f0f0f0] space-y-5">
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                Modo de Publicação no Mercado Livre:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setMlMode('CATALOG')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    mlMode === 'CATALOG'
                      ? 'border-[#2563eb] bg-[#f8faff] ring-2 ring-[#2563eb]/20'
                      : 'border-[#e6e6e6] hover:border-[#cbd5e1]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mlMode"
                      checked={mlMode === 'CATALOG'}
                      onChange={() => setMlMode('CATALOG')}
                      className="text-[#2563eb]"
                    />
                    <span className="text-xs font-bold text-[#111111]">Catálogo Oficial (Buy Box)</span>
                  </div>
                </div>

                <div
                  onClick={() => setMlMode('TRADITIONAL')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    mlMode === 'TRADITIONAL'
                      ? 'border-[#111111] bg-[#fafafa] ring-2 ring-[#111111]/20'
                      : 'border-[#e6e6e6] hover:border-[#cbd5e1]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mlMode"
                      checked={mlMode === 'TRADITIONAL'}
                      onChange={() => setMlMode('TRADITIONAL')}
                      className="text-[#111111]"
                    />
                    <span className="text-xs font-bold text-[#111111]">Anúncio Tradicional</span>
                  </div>
                </div>
              </div>

              {/* Se for Catálogo: Busca e Seleção de Ficha */}
              {mlMode === 'CATALOG' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#111111]">
                      Buscar Ficha Oficial no Catálogo:
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999] pointer-events-none select-none z-10" />
                        <input
                          type="text"
                          value={catalogSearchQuery}
                          onChange={e => setCatalogSearchQuery(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              triggerCatalogSearch(catalogSearchQuery)
                            }
                          }}
                          placeholder="Buscar no catálogo do ML..."
                          style={{ paddingLeft: '40px', paddingRight: '36px' }}
                          className="raw-input w-full py-2.5 text-xs bg-[#fafafa] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all"
                        />
                        {catalogSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCatalogSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#111111] text-xs font-bold p-1 cursor-pointer z-10"
                            title="Limpar busca"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerCatalogSearch(catalogSearchQuery)}
                        disabled={catalogSearching}
                        className="btn btn-primary shrink-0"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Search className="w-[15px] h-[15px]" />
                        {catalogSearching ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-[#2563eb]" /> 
                      Fichas do Mercado Livre ({catalogCandidates.length}):
                    </span>
                    {product && (
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogSearchQuery(product.name || '')
                          triggerCatalogSearch(product.name, product.ean, product.brand, product.model, product.image_url, product.price)
                        }}
                        className="text-xs text-[#2563eb] hover:underline font-bold cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${catalogSearching ? 'animate-spin' : ''}`} />
                        Restaurar produto original
                      </button>
                    )}
                  </div>

                  {catalogCandidates.length > 0 ? (
                    <div className="space-y-2.5">
                      {catalogCandidates.map(c => {
                        const isSelected = selectedCatalogId === c.catalog_product_id
                        return (
                          <div
                            key={c.catalog_product_id}
                            onClick={() => setSelectedCatalogId(c.catalog_product_id)}
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#2563eb] bg-[#f0f7ff] ring-2 ring-[#2563eb]/20 shadow-xs'
                                : 'border-[#e2e8f0] hover:border-[#cbd5e1] bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-14 h-14 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                {c.thumbnail ? (
                                  <img src={c.thumbnail} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <Package className="w-6 h-6 text-[#999999]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#111111] line-clamp-2 leading-snug">
                                  {c.title}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#666666] font-mono mt-1">
                                  <span className="text-[#111111] font-bold">Catalog ID: {c.catalog_product_id}</span>
                                  {c.brand && <span>• Marca: {c.brand}</span>}
                                  {c.buy_box_winner_price && (
                                    <span className="text-[#16a34a] font-bold">
                                      • Buy Box: R$ {Number(c.buy_box_winner_price).toFixed(2).replace('.', ',')}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${
                                    c.confidence >= 95 ? 'bg-[#ecfdf5] text-[#16a34a]' : 'bg-[#eff6ff] text-[#2563eb]'
                                  }`}>
                                    {c.confidence}% Confiança
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 self-end sm:self-auto transition-all ${
                              isSelected
                                ? 'bg-[#2563eb] text-white shadow-xs'
                                : 'bg-white text-[#2563eb] border border-[#cbd5e1] hover:bg-[#f8faff]'
                            }`}>
                              {isSelected ? '✓ Selecionado' : 'Selecionar'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-5 bg-[#fafafa] border border-dashed border-[#cbd5e1] rounded-2xl text-center space-y-2">
                      <p className="text-xs text-[#666666]">
                        {catalogSearching
                          ? 'Buscando fichas oficiais no Mercado Livre...'
                          : `Nenhuma ficha encontrada para "${catalogSearchQuery}".`}
                      </p>
                      {product && (
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSearchQuery(product.name || '')
                            triggerCatalogSearch(product.name, product.ean, product.brand, product.model, product.image_url, product.price)
                          }}
                          className="px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-semibold text-[#111111] hover:bg-[#f5f5f5] cursor-pointer shadow-2xs"
                        >
                          Usar Ficha do Produto Central ({product.name})
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1.5">
                      Catalog Product ID (MLB...)
                    </label>
                    <input
                      type="text"
                      value={selectedCatalogId}
                      onChange={e => setSelectedCatalogId(e.target.value)}
                      placeholder="Ex: MLB28472948"
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-bold"
                    />
                  </div>
                </div>
              )}


              {/* Se for Tradicional: Título Customizado */}
              {mlMode === 'TRADITIONAL' && (
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Título do Anúncio no Canal
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="Ex: Pistola De Água Lavadora Alta Pressão Recarregável 21V"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bloco 3: Precificação Isolada da Oferta */}
        <div className="bg-white border border-[#e6e6e6] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="border-b border-[#f0f0f0] pb-4">
            <h2 className="!text-[18px] !leading-[1.25] font-bold text-[#111111] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#666666]" /> 3. Precificação {selectedChannel === 'site' ? 'da Loja Oficial (Site)' : 'da Oferta'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                {selectedChannel === 'site' ? 'Preço de Venda no Site Próprio (R$) *' : 'Preço de Venda da Oferta (R$) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#666666] pointer-events-none select-none z-10">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={offerPrice}
                  onChange={e => setOfferPrice(e.target.value)}
                  placeholder="0.00"
                  style={{ paddingLeft: '44px', paddingRight: '16px' }}
                  className="raw-input w-full py-3 text-base font-black bg-white border border-[#cbd5e1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
            </div>

            {selectedChannel === 'mercadolivre' && (
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Modalidade do Anúncio no Mercado Livre
                </label>
                <select
                  value={listingType}
                  onChange={e => setListingType(e.target.value as any)}
                  className="w-full px-3.5 py-3 text-xs bg-white border border-[#cbd5e1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#111111] cursor-pointer"
                >
                  <option value="gold_special">Clássico (Comissão padrão ML)</option>
                  <option value="gold_pro">Premium (10x a 12x Sem Juros)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
              : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {feedback.text}
          </div>
        )}

        {/* Botões de Ação Final */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Link
            href={product ? `/produtos/${product.id}` : '/operacao'}
            className="btn btn-secondary w-full sm:w-auto"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            Cancelar e Voltar
          </Link>

          <button
            type="submit"
            disabled={submitting || !product}
            className="btn btn-primary w-full sm:w-auto"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {submitting ? (
              <RefreshCw className="w-[15px] h-[15px] animate-spin" />
            ) : (
              <Plus className="w-[15px] h-[15px]" strokeWidth={2} />
            )}
            {selectedChannel === 'site'
              ? 'Confirmar e Publicar na Loja Oficial (Site)'
              : 'Confirmar e Publicar Oferta no Canal'}
          </button>
        </div>

      </form>
    </div>
  )
}

export default function PublicacaoOfertaPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-[#888888]">
        Carregando painel de publicação multicanal...
      </div>
    }>
      <PublicacaoContent />
    </Suspense>
  )
}
