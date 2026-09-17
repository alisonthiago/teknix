'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Plus, 
  Layers, 
  Store, 
  Search, 
  CheckCircle2, 
  Clock, 
  Pencil, 
  ExternalLink, 
  Sparkles, 
  DollarSign, 
  ShieldCheck, 
  Package, 
  Award,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import LoadingState from '@/components/ui/LoadingState'
import { matchesSearchQuery } from '@/lib/utils'

function formatBRL(val: number) {
  return `R$ ${(Number(val) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface ListingItem {
  id: string
  product_id: string
  channel: string
  external_id: string
  price: number
  stock_synced: number
  status: string
  title: string
  listing_type?: string
  catalog_product_id?: string | null
  permalink?: string | null
  sold_quantity?: number
  total_revenue?: number
  is_best_seller?: boolean
  account_name?: string
  last_synced_at?: string
}

interface ProductWithOffers {
  id: string
  name: string
  sku: string
  stock: number
  price: number
  site_price: number | null
  site_published: boolean
  image_url: string | null
  brand: string | null
  model: string | null
  ean: string | null
  marketplace_listings: ListingItem[]
}

export default function MulticanalPage() {
  const router = useRouter()

  // Filtros
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal de edição de preço isolado
  const [priceModal, setPriceModal] = useState<{
    open: boolean
    productId: string
    productName: string
    productSku: string
    channelName: string
    externalId: string
    listingId?: string
    isSite?: boolean
    currentPrice: number
  } | null>(null)

  const [inputPrice, setInputPrice] = useState('')
  const [inputReason, setInputReason] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Consulta ao banco de dados: Produtos com todas as suas ofertas conectadas
  const { data: rawProducts, loading, error, refetch } = useSupabaseQuery<ProductWithOffers[]>(async (supabase) => {
    const { data, error: err } = await supabase
      .from('products')
      .select('id, name, sku, stock, price, site_price, site_published, image_url, brand, model, ean, marketplace_listings(*)')
      .order('created_at', { ascending: false })

    if (err) throw err
    return data || []
  })

  const products = rawProducts || []

  // Métricas do Topo
  const metrics = useMemo(() => {
    const totalProducts = products.length
    let totalActiveOffers = 0
    let totalStock = 0
    const channelsSet = new Set<string>()

    products.forEach(p => {
      totalStock += Number(p.stock || 0)
      if (p.site_published) {
        totalActiveOffers += 1
        channelsSet.add('site')
      }
      (p.marketplace_listings || []).forEach(l => {
        if (l.status === 'active' || l.status === 'ACTIVE') {
          totalActiveOffers += 1
        }
        if (l.channel) channelsSet.add(l.channel.toLowerCase())
      })
    })

    return {
      totalProducts,
      totalActiveOffers,
      uniqueChannels: channelsSet.size || 1,
      totalStock
    }
  }, [products])

  // Filtragem de Produtos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Busca inteligente por nome, SKU, marca, modelo ou anúncio vinculado (sem sensibilidade a acentos)
      if (searchQuery) {
        const listingTerms = (p.marketplace_listings || []).flatMap(l => [l.external_id, l.title, l.channel])
        const match = matchesSearchQuery(
          [p.name, p.sku, p.brand, p.model, p.ean, ...listingTerms],
          searchQuery
        )
        if (!match) return false
      }

      // 2. Filtro de Canal
      if (selectedChannel !== 'ALL') {
        if (selectedChannel === 'site') {
          if (!p.site_published) return false
        } else {
          const hasChannel = (p.marketplace_listings || []).some(
            l => l.channel?.toLowerCase() === selectedChannel.toLowerCase()
          )
          if (!hasChannel) return false
        }
      }

      // 3. Filtro de Status
      if (selectedStatus !== 'ALL') {
        const wantsActive = selectedStatus === 'ACTIVE'
        const hasMatchingListing = (p.marketplace_listings || []).some(l => {
          const isActive = l.status === 'active' || l.status === 'ACTIVE'
          return wantsActive ? isActive : !isActive
        })
        const siteMatches = wantsActive ? p.site_published : !p.site_published
        if (!hasMatchingListing && !siteMatches) return false
      }

      return true
    })
  }, [products, searchQuery, selectedChannel, selectedStatus])

  // Salvar Preço Isolado
  const handleSavePrice = async () => {
    if (!priceModal) return
    const num = Number(inputPrice.replace(',', '.'))
    if (!num || num <= 0) {
      setModalFeedback({ type: 'error', text: 'Informe um preço válido maior que zero.' })
      return
    }

    setSavingPrice(true)
    setModalFeedback(null)

    try {
      const res = await fetch(`/api/products/${priceModal.productId}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: priceModal.listingId,
          isSitePrice: priceModal.isSite,
          newPrice: num,
          reason: inputReason || `Ajuste multicanal em ${priceModal.channelName}`
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar novo preço')

      setModalFeedback({
        type: 'success',
        text: `Preço atualizado com sucesso para ${formatBRL(num)}! Os demais canais foram rigorosamente preservados.`
      })

      setTimeout(() => {
        setPriceModal(null)
        refetch()
      }, 1200)
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Falha ao atualizar preço' })
    } finally {
      setSavingPrice(false)
    }
  }

  return (
    <div className="multichannel-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-7">
      {/* Topo Oficial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="hub-mobile-header-title-row !justify-start gap-3 mb-3">
            <button type="button" className="hub-mobile-back-btn" aria-label="Voltar" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="hub-mobile-page-title !text-[16px]">Multicanal</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Gestão unificada: <strong>1 produto físico central</strong> → <strong>1 estoque central</strong> → <strong>múltiplas ofertas independentes</strong>.
          </p>
        </div>

        <Link
          href="/produtos/publicacao"
          className="btn btn-primary w-full sm:w-auto self-start sm:self-auto"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus className="w-[15px] h-[15px]" strokeWidth={2} />
          Publicar Nova Oferta
        </Link>
      </div>

      {/* Resumo / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1.5">
            Produtos Centrais
          </span>
          <div className="text-2xl font-black text-[#111111]">
            {metrics.totalProducts}
          </div>
          <div className="text-xs text-[#666666] mt-0.5">Itens físicos no galpão</div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1.5">
            Ofertas Ativas
          </span>
          <div className="text-2xl font-black text-[#16a34a]">
            {metrics.totalActiveOffers}
          </div>
          <div className="text-xs text-[#666666] mt-0.5">Anúncios no ar</div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1.5">
            Canais Conectados
          </span>
          <div className="text-2xl font-black text-[#2563eb]">
            {metrics.uniqueChannels}
          </div>
          <div className="text-xs text-[#666666] mt-0.5">Site, ML, Shopee, Magalu</div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1.5">
            Estoque Sincronizado
          </span>
          <div className="text-2xl font-black text-[#111111]">
            {metrics.totalStock} un
          </div>
          <div className="text-xs text-[#16a34a] font-medium mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Baixa automática unificada
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Filtros de Canais */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'ALL', label: 'Todos os Canais' },
            { id: 'site', label: 'Loja Própria (Site)', logo: null },
            { id: 'mercadolivre', label: 'Mercado Livre', logo: 'Mercado Livre' },
            { id: 'shopee', label: 'Shopee', logo: 'Shopee' },
            { id: 'magalu', label: 'Magalu', logo: 'Magalu' },
            { id: 'tiktok', label: 'TikTok Shop', logo: null }
          ].map(ch => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedChannel(ch.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedChannel === ch.id
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#f5f5f5] text-[#555555] hover:bg-[#e5e7eb] hover:text-[#111111]'
              }`}
            >
              {ch.logo && <MarketplaceLogo name={ch.logo} className="w-3.5 h-3.5 object-contain" />}
              {ch.label}
            </button>
          ))}
        </div>

        {/* Busca e Status */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#f0f0f0]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999] pointer-events-none select-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do produto, modelo ou SKU..."
              style={{ paddingLeft: '40px', paddingRight: '36px' }}
              className="raw-input w-full py-2 text-xs bg-[#fafafa] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111111] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#111111] text-xs font-bold p-1 cursor-pointer z-10"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                selectedStatus === 'ALL' ? 'bg-[#111111] text-white' : 'bg-[#fafafa] text-[#666] hover:bg-[#f0f0f0]'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                selectedStatus === 'ACTIVE' ? 'bg-[#16a34a] text-white' : 'bg-[#fafafa] text-[#666] hover:bg-[#f0f0f0]'
              }`}
            >
              Ativas
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('PAUSED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                selectedStatus === 'PAUSED' ? 'bg-[#d97706] text-white' : 'bg-[#fafafa] text-[#666] hover:bg-[#f0f0f0]'
              }`}
            >
              Pausadas
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Produtos Multicanal */}
      {loading ? (
        <LoadingState message="Carregando produtos e ofertas multicanal..." padding={60} />
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#e6e6e6] rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#fafafa] border border-[#e6e6e6] flex items-center justify-center mx-auto text-[#999999]">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111111]">Nenhuma oferta encontrada</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            Tente ajustar os filtros ou a busca por SKU, ou crie uma nova publicação multicanal.
          </p>
          <Link
            href="/produtos/publicacao"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-black transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Publicar Nova Oferta
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProducts.map(prod => {
            const listings = prod.marketplace_listings || []
            const totalOffersCount = listings.length + (prod.site_published ? 1 : 0)

            return (
              <div
                key={prod.id}
                className="bg-white border border-[#e6e6e6] rounded-3xl p-5 sm:p-7 shadow-xs hover:border-[#cbd5e1] transition-all space-y-5"
              >
                {/* Cabeçalho do Produto Central */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0f0f0]">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-[#fafafa] border border-[#e6e6e6] p-1.5 shrink-0 flex items-center justify-center shadow-2xs">
                      <img
                        src={prod.image_url || '/placeholder-product.png'}
                        alt={prod.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/produtos/${prod.id}`}
                          className="text-base font-bold text-[#111111] hover:underline truncate"
                        >
                          {prod.name}
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="px-2.5 py-0.5 bg-[#f5f5f5] text-[#111111] border border-[#e5e7eb] rounded-lg font-mono font-bold">
                          SKU: {prod.sku}
                        </span>
                        {prod.brand && (
                          <span className="px-2.5 py-0.5 bg-[#f5f5f5] text-[#555] border border-[#e5e7eb] rounded-lg">
                            {prod.brand}
                          </span>
                        )}
                        <span className="text-xs text-[#888888] font-medium">
                          • {totalOffersCount} {totalOffersCount === 1 ? 'oferta' : 'ofertas'} no total
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estoque Central e Botão de Nova Publicação */}
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 flex-wrap">
                    <div className="px-3.5 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl text-right">
                      <div className="text-[10px] uppercase font-bold text-[#16a34a] tracking-wider">
                        Estoque Central
                      </div>
                      <div className="text-base font-black text-[#16a34a]">
                        {prod.stock || 0} un
                      </div>
                    </div>

                    <Link
                      href={`/produtos/publicacao?productId=${prod.id}`}
                      className="btn btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      title="Publicar nova oferta para este produto"
                    >
                      <Plus className="w-[15px] h-[15px]" strokeWidth={2} />
                      <span>Publicar em Outro Canal</span>
                    </Link>
                  </div>
                </div>

                {/* Grade de Ofertas Vinculadas a este Produto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Oferta 1: Loja Própria TEKNIX (SITE) */}
                  <div className="p-4 rounded-2xl border border-[#e6e6e6] bg-[#fafafa] flex flex-col justify-between gap-3 shadow-2xs hover:border-[#cbd5e1] transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-black text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          SITE
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#111111]">Loja Oficial (Site)</div>
                          <div className="text-[10px] text-[#666666]">teknixbrasil.com.br</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.site_published
                          ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                          : 'bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]'
                      }`}>
                        {prod.site_published ? 'Publicado' : 'Não Publicado'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#e9ecef]">
                      <div>
                        <div className="text-[10px] text-[#888888] uppercase font-bold">Preço Loja Própria</div>
                        <div className="text-sm font-black text-[#111111]">
                          {formatBRL(prod.site_price || prod.price || 0)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPriceModal({
                            open: true,
                            productId: prod.id,
                            productName: prod.name,
                            productSku: prod.sku,
                            channelName: 'Loja Oficial TEKNIX (Site)',
                            externalId: prod.sku,
                            isSite: true,
                            currentPrice: Number(prod.site_price || prod.price || 0)
                          })
                          setInputPrice(String(prod.site_price || prod.price || ''))
                          setInputReason('')
                          setModalFeedback(null)
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-[#e2e8f0] text-[#111111] border border-[#e2e8f0] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Pencil className="w-3 h-3 text-[#666]" /> Editar
                      </button>
                    </div>
                  </div>

                  {/* Ofertas de Marketplaces (Mercado Livre, Shopee, Magalu...) */}
                  {listings.map(l => {
                    const isCatalog = Boolean(l.catalog_product_id)
                    const channelLabel = l.channel === 'mercadolivre' 
                      ? (isCatalog ? 'Mercado Livre - Catálogo / Buy Box' : 'Mercado Livre - Anúncio Tradicional')
                      : l.channel === 'shopee' ? 'Shopee Brasil'
                      : l.channel === 'magalu' ? 'Magazine Luiza'
                      : l.channel.toUpperCase()

                    return (
                      <div
                        key={l.id || l.external_id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-2xs transition-all ${
                          l.is_best_seller 
                            ? 'bg-[#fffdf5] border-[#fde68a] hover:border-[#f59e0b]' 
                            : 'bg-white border-[#e6e6e6] hover:border-[#cbd5e1]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <MarketplaceLogo name={l.channel} className="w-6 h-6 object-contain shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#111111] truncate" title={channelLabel}>
                                {channelLabel}
                              </div>
                              <div className="text-[10px] text-[#666666] font-mono truncate">
                                ID: {l.external_id}
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            l.status === 'active' || l.status === 'ACTIVE'
                              ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                              : 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
                          }`}>
                            {l.status === 'active' || l.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
                          <div>
                            <div className="text-[10px] text-[#888888] uppercase font-bold">Preço Desta Oferta</div>
                            <div className="text-sm font-black text-[#111111]">
                              {formatBRL(l.price)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {l.permalink && (
                              <a
                                href={l.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 flex items-center justify-center bg-[#fafafa] hover:bg-[#e2e8f0] rounded-xl text-[#666] hover:text-[#111] transition-colors"
                                title="Abrir anúncio oficial"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPriceModal({
                                  open: true,
                                  productId: prod.id,
                                  productName: prod.name,
                                  productSku: prod.sku,
                                  channelName: channelLabel,
                                  externalId: l.external_id,
                                  listingId: l.id,
                                  isSite: false,
                                  currentPrice: Number(l.price || 0)
                                })
                                setInputPrice(String(l.price || ''))
                                setInputReason('')
                                setModalFeedback(null)
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-[#e2e8f0] text-[#111111] border border-[#e2e8f0] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Pencil className="w-3 h-3 text-[#666]" /> Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Ajuste de Preço Isolado */}
      {priceModal?.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start justify-between border-b border-[#f0f0f0] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb]">
                  Ajuste de Preço Isolado
                </span>
                <h3 className="text-base font-bold text-[#111111] mt-0.5">
                  {priceModal.channelName}
                </h3>
                <p className="text-xs text-[#666666]">
                  {priceModal.productName} ({priceModal.productSku})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPriceModal(null)}
                className="text-[#999999] hover:text-[#111111] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#fafafa] border border-[#e5e7eb] rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
              <p className="text-xs text-[#555555] leading-relaxed">
                <strong>Garantia de Isolamento:</strong> Esta alteração afeta <strong>apenas esta oferta</strong> ({priceModal.externalId}). O Site Próprio e os demais canais permanecerão intactos.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Novo Preço (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#666666] pointer-events-none select-none z-10">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputPrice}
                    onChange={e => setInputPrice(e.target.value)}
                    placeholder="0.00"
                    style={{ paddingLeft: '44px', paddingRight: '16px' }}
                    className="raw-input w-full py-2.5 text-base font-bold bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Motivo da Alteração (Opcional)
                </label>
                <input
                  type="text"
                  value={inputReason}
                  onChange={e => setInputReason(e.target.value)}
                  placeholder="Ex: Campanha de fim de semana, alinhamento de margem..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
            </div>

            {modalFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                modalFeedback.type === 'success'
                  ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                  : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
              }`}>
                {modalFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {modalFeedback.text}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#f0f0f0]">
              <button
                type="button"
                onClick={() => setPriceModal(null)}
                disabled={savingPrice}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePrice}
                disabled={savingPrice}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {savingPrice ? (
                  <RefreshCw className="w-[15px] h-[15px] animate-spin" />
                ) : (
                  <CheckCircle2 className="w-[15px] h-[15px]" strokeWidth={2} />
                )}
                Confirmar Novo Preço
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
