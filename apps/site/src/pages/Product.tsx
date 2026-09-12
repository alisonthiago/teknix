import EditableFlow from '../components/page-widgets/EditableFlow'
import { Editable, PageWidgets } from '../components/page-widgets/PageWidgets'
/* ==========================================================================
   TEKNIX SITE — PÁGINA OFICIAL DE DETALHES DO PRODUTO (1:1 PADRÃO HAGOR/TEKNIX)
   ========================================================================== */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getProductBySku, getProductById, getProducts } from '../services/products'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import type { Product as ProductType } from '../types/database'
import './Product.css'
import { Ads } from '../components/Ads'
import { FileText, ShieldCheck, Truck, RotateCcw, Headphones, Zap, BatteryCharging, Wrench, ChevronDown, CheckCircle2 } from 'lucide-react'
import StockNotifyModal from '../components/StockNotifyModal'
import './ProductResponsive.css'
import { productPricing, cleanProductTitle, normalizeShowcase, type ProductEditorialShowcase } from '../../../../packages/core/src/productCommerce'
import { commerceSignals } from '../services/storefrontCommerce'
import { remainingOfferTime } from '../services/productPresentation'

function renderBenefitIcon(iconName?: string) {
  switch (iconName) {
    case 'battery':
      return <BatteryCharging size={15} />
    case 'shield':
      return <ShieldCheck size={15} />
    case 'wrench':
      return <Wrench size={15} />
    case 'truck':
      return <Truck size={15} />
    case 'zap':
    default:
      return <Zap size={15} />
  }
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function conciseDescription(value?: string) {
  const clean = value?.replace(/[-–—_]{3,}/g, ' ').replace(/\s+/g, ' ').trim() || ''
  if (!clean) return 'Produto desenvolvido para profissionais que precisam de desempenho, segurança e durabilidade no dia a dia.'
  if (clean.length <= 440) return clean
  const excerpt = clean.slice(0, 440)
  const ending = Math.max(excerpt.lastIndexOf('. '), excerpt.lastIndexOf('; '), excerpt.lastIndexOf(', '))
  return `${excerpt.slice(0, ending > 180 ? ending + 1 : 440).trim()}…`
}

function OfferCountdownParts({ seconds }: { seconds: number }) {
  const parts = [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60
  ].map(n => String(Math.max(0, n)).padStart(2, '0'))

  return (
    <div className="ml-pdp-timer-boxes">
      <span className="ml-pdp-timer-box">{parts[0]}</span>
      <b className="ml-pdp-timer-sep">:</b>
      <span className="ml-pdp-timer-box">{parts[1]}</span>
      <b className="ml-pdp-timer-sep">:</b>
      <span className="ml-pdp-timer-box">{parts[2]}</span>
    </div>
  )
}

function isDirectVideoUrl(url?: string) {
  if (!url) return false
  return Boolean(url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || url.startsWith('blob:') || url.startsWith('data:video/'))
}

function getEmbedVideoUrl(url?: string) {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[3]}`
  return null
}

function getYoutubeVideoId(url?: string) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

export default function Product() {
  const params = useParams<{ sku?: string; slug?: string; categoria?: string; segmento?: string }>()
  const productId = params.slug || params.categoria || params.sku || ''
  const navigate = useNavigate()

  const [product, setProduct] = useState<ProductType | null>(null)
  const [related, setRelated] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showVideoMain, setShowVideoMain] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isMuted, setIsMuted] = useState(true)

  const handleToggleVideoPlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsVideoPlaying(true)
    } else {
      videoRef.current.pause()
      setIsVideoPlaying(false)
    }
  }

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    const nextMuted = !videoRef.current.muted
    videoRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }

  useEffect(() => {
    if (!showVideoMain && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.muted = true
      setIsVideoPlaying(false)
    }
  }, [showVideoMain])
  const [quantity, setQuantity] = useState(1)
  const [cep, setCep] = useState('')
  const [freightCalculated, setFreightCalculated] = useState(false)
  const [freightLoading, setFreightLoading] = useState(false)
  const [showFreightCalc, setShowFreightCalc] = useState(false)
  const [showCepModal, setShowCepModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentPopover, setShowPaymentPopover] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'credit' | 'pix' | 'boleto'>('credit')
  const paymentPopoverRef = useRef<HTMLDivElement>(null)
  const [deliveryCep, setDeliveryCep] = useState(() => localStorage.getItem('teknix_user_cep') || '')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [activeOverviewTab, setActiveOverviewTab] = useState<'desc' | 'specs'>('desc')
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [showStickyNav, setShowStickyNav] = useState(false)
  const [mobileStickyNavOpen, setMobileStickyNavOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [showStockNotifyModal, setShowStockNotifyModal] = useState(false)
  const [pricingTime,setPricingTime] = useState(Date.now)
  useEffect(()=>{
    if (!product?.commerce?.offerEnabled) return
    const timer=window.setInterval(()=>setPricingTime(Date.now()),1000)
    return ()=>clearInterval(timer)
  },[product?.commerce?.offerEnabled])

  useEffect(() => {
    const handlePopClickOutside = (e: MouseEvent) => {
      if (paymentPopoverRef.current && !paymentPopoverRef.current.contains(e.target as Node)) {
        setShowPaymentPopover(false)
      }
    }
    if (showPaymentPopover) {
      document.addEventListener('mousedown', handlePopClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handlePopClickOutside)
    }
  }, [showPaymentPopover])
  useEffect(() => {
    const handleCepChange = (event: Event) => {
      const detail = (event as CustomEvent<{ cep?: string }>).detail
      if (!detail?.cep) return
      setDeliveryCep(detail.cep)
      setCep(detail.cep)
      setFreightCalculated(true)
    }
    window.addEventListener('teknix:cep-changed', handleCepChange)
    return () => window.removeEventListener('teknix:cep-changed', handleCepChange)
  }, [])

  const { addToCart, clearCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!productId) return
    setLoading(true)
    let cancelled = false

    async function load() {
      let data = await getProductBySku(productId)
      if (!data) {
        data = await getProductById(productId)
      }
      if (cancelled) return
      setProduct(data)
      setLoading(false)

      if (data) {
        const rel = await getProducts({ limit: 4, category: data.category || data.category_id })
        if (!cancelled) setRelated(rel.filter((p) => p.id !== data!.id))
      }
    }

    load()
    return () => { cancelled = true }
  }, [productId])

  useEffect(() => {
    const updateStickyNav = () => {
      const isVisible = window.scrollY > 420
      setShowStickyNav(isVisible)
      if (!isVisible) setMobileStickyNavOpen(false)
      const sections = ['overview', 'specifications']
      const current = sections.filter(id => {
        const el = document.getElementById(id)
        return el && el.getBoundingClientRect().top <= 150
      }).at(-1)
      setActiveSection(current || 'overview')
    }

    updateStickyNav()
    window.addEventListener('scroll', updateStickyNav, { passive: true })
    return () => window.removeEventListener('scroll', updateStickyNav)
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner" />
        <Editable as="p" widgetId="product-1">Carregando produto...</Editable>
      </div>
    )
  }

  if (!product) return <div className="ui container" style={{paddingBlock:48}}><Editable as="h1" widgetId="product-2">Produto não encontrado</Editable><Link to="/produtos">Ver produtos</Link></div>
  const currentProduct = product

  const pricing = productPricing(currentProduct.price,currentProduct.promo_price,currentProduct.commerce,pricingTime)
  const {base:basePrice,current:finalPrice,pix:pixPrice,discount:discountPercent,commerce} = pricing
  const oldPrice=basePrice
  const cardPrice=finalPrice

  const currentSignals = commerceSignals(currentProduct, pricingTime)
  const remSec = remainingOfferTime(currentSignals?.offerEndsAt, pricingTime)
  // O contador só pode aparecer quando existe uma oferta ativa com prazo válido.
  // Não usar um prazo demonstrativo aqui, pois isso fazia todo produto parecer em oferta.
  const remainingSeconds = remSec > 0 ? remSec : 0
  const pixInt = Math.floor(pixPrice).toLocaleString('pt-BR')
  const pixCents = (pixPrice % 1).toFixed(2).substring(2)

  const productImages = (currentProduct.images && currentProduct.images.length > 0)
    ? currentProduct.images
    : [currentProduct.image_url || '']

  const fav = isFavorite(currentProduct.id)

  const handleAddToCart = () => {
    addToCart({
      id: currentProduct.id,
      name: currentProduct.name,
      sku: currentProduct.sku || currentProduct.id,
      price: basePrice,
      promo_price: finalPrice,
      image: displayProductImages[0] || productImages[0],
      quantity: quantity,
      stock: currentProduct.stock || 0
    })
    showToast(`Adicionado à sacola (${quantity}x)`)
  }

  const handleOneClickBuy = () => {
    const productCode = currentProduct.sku || (currentProduct as any).slug || currentProduct.id
    // Isola esta compra para o produto específico (não acumula itens anteriores)
    clearCart()
    addToCart({
      id: currentProduct.id,
      name: currentProduct.name,
      sku: currentProduct.sku || currentProduct.id,
      price: basePrice,
      promo_price: finalPrice,
      image: displayProductImages[0] || productImages[0],
      quantity: quantity,
      stock: currentProduct.stock || 0
    })

    const isProd = typeof window !== 'undefined' && (
      window.location.hostname === 'teknixbrasil.com.br' ||
      window.location.hostname === 'www.teknixbrasil.com.br' ||
      window.location.hostname.endsWith('teknixbrasil.com.br')
    )

    if (isProd) {
      window.location.href = `https://play.teknixbrasil.com.br/${encodeURIComponent(productCode)}`
    } else {
      navigate(`/checkout/${encodeURIComponent(productCode)}`)
    }
  }

  const handleCalculateFreight = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cep.replace(/\D/g, '')) return
    setFreightLoading(true)
    setTimeout(() => {
      setFreightLoading(false)
      setFreightCalculated(true)
      setShowCepModal(false)
    }, 600)
  }

  const editorialHeroTitle = (() => {
    let clean = cleanProductTitle(currentProduct.name || '')
    clean = clean.replace(/\s*(cor\s+[a-z]+|frequ[eê]ncia[^,]*|127\/220v|50hz\/60|bivolt|voltagem[^,]*).*/i, '').trim()
    if (!clean || clean.length < 5) return currentProduct.name || 'este equipamento'
    return clean
  })()

  const rawShowcase = (currentProduct as any)?.editorial_showcase || (currentProduct.store_meta?.specifications as any)?.editorial_showcase
  const showcase: ProductEditorialShowcase = normalizeShowcase(rawShowcase, editorialHeroTitle, productImages)
  const presentationImages = ((rawShowcase as any)?.presentation_images || []).filter((image: unknown): image is string => typeof image === 'string' && image.trim().length > 0).slice(0, 3)
  const displayProductImages = productImages.filter((image) => !presentationImages.includes(image))
  const customFaqs = ((rawShowcase as any)?.custom_faqs || []).filter((item: any) => item?.question?.trim() && item?.answer?.trim())
  const displayFaqs = customFaqs


  return (
    <PageWidgets key={currentProduct.id} scope={`product:${currentProduct.id}`} product={currentProduct}><div className="product-detail-page-root">
      {showCepModal && (
        <div className="pdp-cep-modal" role="dialog" aria-modal="true" aria-labelledby="pdp-cep-title" onMouseDown={() => setShowCepModal(false)}>
          <div className="pdp-cep-modal-card" onMouseDown={event => event.stopPropagation()}>
            <button type="button" className="pdp-cep-modal-close" onClick={() => setShowCepModal(false)} aria-label="Fechar">×</button>
            <h2 id="pdp-cep-title">Onde vamos entregar?</h2>
            <form onSubmit={handleCalculateFreight}>
              <label htmlFor="pdp-cep-modal-input">Enviar para</label>
              <div className="pdp-cep-modal-input-row">
                <span aria-hidden="true">⌖</span>
                <input id="pdp-cep-modal-input" type="tel" inputMode="numeric" placeholder="CEP" maxLength={9} value={cep} onChange={e => setCep(e.target.value)} autoFocus />
                <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">Não sei o meu CEP</a>
              </div>
              <button type="submit" disabled={freightLoading || !cep.replace(/\D/g, '')}>{freightLoading ? 'Calculando…' : 'Confirmar'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE MEIOS DE PAGAMENTO (1:1 MERCADO LIVRE / TEKNIX) ── */}
      {showPaymentModal && (
        <div className="pdp-payment-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="pdp-payment-title" onMouseDown={() => setShowPaymentModal(false)}>
          <div className="pdp-payment-modal-card" onMouseDown={event => event.stopPropagation()}>
            <div className="pdp-payment-modal-header">
              <div>
                <h2 id="pdp-payment-title" className="pdp-payment-modal-title">Meios de pagamento</h2>
                <p className="pdp-payment-modal-subtitle">Condições oficiais e simulação de parcelas para este produto</p>
              </div>
              <button type="button" className="pdp-payment-modal-close" onClick={() => setShowPaymentModal(false)} aria-label="Fechar">✕</button>
            </div>

            {/* Abas */}
            <div className="pdp-payment-tabs">
              <button
                type="button"
                className={`pdp-payment-tab ${paymentTab === 'credit' ? 'active' : ''}`}
                onClick={() => setPaymentTab('credit')}
              >
                Cartão de crédito
              </button>
              <button
                type="button"
                className={`pdp-payment-tab ${paymentTab === 'pix' ? 'active' : ''}`}
                onClick={() => setPaymentTab('pix')}
              >
                Pix <span className="pdp-tab-discount">{discountPercent > 0 ? `-${discountPercent}%` : 'Desconto'}</span>
              </button>
              <button
                type="button"
                className={`pdp-payment-tab ${paymentTab === 'boleto' ? 'active' : ''}`}
                onClick={() => setPaymentTab('boleto')}
              >
                Boleto Bancário
              </button>
            </div>

            {/* Conteúdo */}
            <div className="pdp-payment-tab-content">
              {paymentTab === 'credit' && (
                <div className="pdp-payment-credit-panel">
                  <div className="pdp-payment-flags-row">
                    <img className="pdp-flag-logo" src="https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368aaf-m.svg" alt="Visa" />
                    <img className="pdp-flag-logo" src="https://http2.mlstatic.com/storage/logos-api-admin/9cf818e0-723a-11f0-a459-cf21d0937aeb-m.svg" alt="Mastercard" />
                    <img className="pdp-flag-logo" src="https://http2.mlstatic.com/storage/logos-api-admin/bb7c7bb0-adec-11f0-92e6-59fb0bcb38c2-m.svg" alt="Elo" />
                    <img className="pdp-flag-logo" src="https://http2.mlstatic.com/storage/logos-api-admin/b2c93a40-f3be-11eb-9984-b7076edb0bb7-m.svg" alt="American Express" />
                    <img className="pdp-flag-logo" src="https://http2.mlstatic.com/storage/logos-api-admin/f3e8e940-f549-11ef-bad6-e9962bcd76e5-m.svg" alt="Mercado Crédito" />
                  </div>
                  <div className="pdp-payment-installments-list">
                    {Array.from({ length: Math.min(commerce.installments || 10, 12) }, (_, i) => i + 1).map(n => {
                      const installmentPrice = cardPrice / n
                      return (
                        <div className="pdp-installment-row" key={n}>
                          <span className="pdp-installment-times"><strong>{n}x</strong> de {formatMoney(installmentPrice)}</span>
                          <span className="pdp-installment-tag">sem juros</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {paymentTab === 'pix' && (
                <div className="pdp-payment-pix-panel">
                  <div className="pdp-pix-price-highlight">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src="https://http2.mlstatic.com/storage/logos-api-admin/f99fcca0-f3bd-11eb-9984-b7076edb0bb7-m.svg" alt="Pix" style={{ height: 26 }} />
                      <span className="pdp-pix-total">{formatMoney(pixPrice)}</span>
                    </div>
                    <span className="pdp-pix-badge">Aprovação imediata</span>
                  </div>
                  <ul className="pdp-pix-instructions">
                    <li>✓ Pagamento à vista com o menor preço garantido.</li>
                    <li>✓ O código Pix e o QR Code são gerados na etapa de checkout.</li>
                    <li>✓ Liberação e separação do estoque com máxima prioridade.</li>
                  </ul>
                </div>
              )}

              {paymentTab === 'boleto' && (
                <div className="pdp-payment-boleto-panel">
                  <div className="pdp-boleto-price-highlight">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src="https://http2.mlstatic.com/storage/logos-api-admin/00174300-571e-11e8-8364-bff51f08d440-m.svg" alt="Boleto" style={{ height: 24 }} />
                      <span className="pdp-boleto-total">{formatMoney(cardPrice)}</span>
                    </div>
                    <span className="pdp-boleto-sub">à vista no boleto</span>
                  </div>
                  <ul className="pdp-boleto-instructions">
                    <li>✓ Pague em qualquer banco, casa lotérica ou internet banking.</li>
                    <li>✓ Vencimento do boleto em até 3 dias corridos.</li>
                    <li>✓ A compensação bancária é realizada de 1 a 2 dias úteis.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Rodapé Seguro */}
            <div className="pdp-payment-modal-footer">
              <div className="pdp-security-note">
                <ShieldCheck size={16} />
                <span>Transação 100% segura com criptografia ponta a ponta e proteção ao comprador TEKNIX.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Aviso de Produto Esgotado */}
      {showStockNotifyModal && currentProduct && (
        <StockNotifyModal
          productId={currentProduct.id}
          productName={currentProduct.name || ''}
          onClose={() => setShowStockNotifyModal(false)}
        />
      )}
      <EditableFlow id="product-page" label="Página do produto">
      <Ads position="product-header" />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="hagor-toast" role="status">
          <span>✓ {toastMessage}</span>
        </div>
      )}


      {/* ── 1. BREADCRUMBS OFICIAIS ── */}
      <div className="ui container fluid bread-detail">
        <div className="ui container">
          <div className="flex">
            <ul className="ui breadcrumb">
              <li>
                <Link to="/" title="Home">Home</Link>
                <Editable as="span" widgetId="product-control-1" className="divider">/</Editable>
              </li>
              <li>
                <Link to="/produtos" title="Produtos">Produtos</Link>
                <Editable as="span" widgetId="product-control-2" className="divider">/</Editable>
              </li>
              <li>
                <Link to="/categoria/ferramentas-eletricas" title="Máquinas de Solda">
                  {currentProduct.category || 'Máquinas de Solda'}
                </Link>
                <Editable as="span" widgetId="product-control-3" className="divider">/</Editable>
              </li>
              <li className="active-breadcrumb" title={cleanProductTitle(currentProduct.name)}>{cleanProductTitle(currentProduct.name)}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── 2. CONTAINER PRINCIPAL DO PRODUTO (IMAGENS + INFO) ── */}
      <div className="ui container fluid container-detail" id="overview">
        <div className="ui container">
          <div className="flex details-product-row">

            {/* LADO ESQUERDO: FOTO PRINCIPAL + MINIATURAS ABAIXO (ESTILO SANDISK) */}
            <div className="container-image">
              <Editable as="div" widgetId="product-control-4" className="jet-product-images">
                {/* Foto Principal em Destaque com Zoom */}
                <div className="main-image-container">
                  <Editable as="button" widgetId="product-control-5"
                    type="button"
                    className="main-image-nav prev"
                    onClick={() => {
                      setShowVideoMain(false)
                      setActiveImageIndex((activeImageIndex - 1 + displayProductImages.length) % displayProductImages.length)
                    }}
                    aria-label="Imagem anterior"
                        hidden={displayProductImages.length < 2}
                  >
                    ‹
                  </Editable>
                  <div className="main-image-frame" style={{ position: 'relative' }}>
                    {showVideoMain && currentProduct.video_url ? (
                      isDirectVideoUrl(currentProduct.video_url) ? (
                        <div className="product-video-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' }}>
                          <video
                            ref={videoRef}
                            src={currentProduct.video_url}
                            controls
                            muted={isMuted}
                            autoPlay={false}
                            preload="metadata"
                            playsInline
                            controlsList="nodownload"
                            onPlay={() => setIsVideoPlaying(true)}
                            onPause={() => setIsVideoPlaying(false)}
                            onEnded={() => setIsVideoPlaying(false)}
                            onVolumeChange={() => setIsMuted(videoRef.current?.muted ?? true)}
                            onContextMenu={(e) => e.preventDefault()}
                            className="product-main-video"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 520,
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              background: 'transparent',
                              borderRadius: 8,
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                            }}
                          />

                          {/* Botão de Som Explícito (Ativar Som / Silenciar) */}
                          <Editable as="button" widgetId="product-control-6"
                            type="button"
                            className="product-video-sound-btn"
                            onClick={handleToggleMute}
                            aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
                            title={isMuted ? 'Clique para ativar som' : 'Clique para silenciar'}
                          >
                            {isMuted ? (
                              <>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                </svg>
                                <Editable as="span" widgetId="product-control-7">Ativar som</Editable>
                              </>
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                                <Editable as="span" widgetId="product-control-8">Som ligado</Editable>
                              </>
                            )}
                          </Editable>

                          {/* Botão Central de Play (quando pausado) */}
                          {!isVideoPlaying && (
                            <Editable as="button" widgetId="product-control-9"
                              type="button"
                              className="product-video-center-play-btn"
                              onClick={handleToggleVideoPlay}
                              aria-label="Dar Play no vídeo"
                              title="Reproduzir vídeo"
                            >
                              <span className="product-video-center-play-icon">
                                <svg viewBox="0 0 24 24" width="30" height="30" fill="#2563eb">
                                  <polygon points="6 3 20 12 6 21 6 3" />
                                </svg>
                              </span>
                            </Editable>
                          )}
                        </div>
                      ) : getEmbedVideoUrl(currentProduct.video_url) ? (
                        <iframe
                          src={getEmbedVideoUrl(currentProduct.video_url)!}
                          title={`Vídeo demonstrativo - ${currentProduct.name}`}
                          style={{ width: '100%', height: '100%', border: 'none', minHeight: 340, borderRadius: 8 }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : null
                    ) : (
                      <Editable as="img" widgetId={activeImageIndex === 0 ? 'product-3' : `product-photo-${activeImageIndex}`}
                        src={displayProductImages[activeImageIndex] || displayProductImages[0]}
                        alt={currentProduct.name}
                        className="main-product-img"
                      />
                    )}
                  </div>
                  <Editable as="button" widgetId="product-control-10"
                    type="button"
                    className="main-image-nav next"
                    onClick={() => {
                      setShowVideoMain(false)
                      setActiveImageIndex((activeImageIndex + 1) % displayProductImages.length)
                    }}
                    aria-label="Próxima imagem"
                    hidden={displayProductImages.length < 2}
                  >
                    ›
                  </Editable>
                </div>

                {/* Miniaturas Horizontais (abaixo da foto principal) */}
                <div className="thumbs-horizontal-wrapper">
                  <div className="thumbs-horizontal-list">
                    {displayProductImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`thumb-item-btn ${!showVideoMain && idx === activeImageIndex ? 'active' : ''}`}
                        onClick={() => {
                          setShowVideoMain(false)
                          setActiveImageIndex(idx)
                        }}
                        onMouseEnter={() => {
                          if (!showVideoMain) {
                            setActiveImageIndex(idx)
                          }
                        }}
                        aria-label={`Ver imagem ${idx + 1}`}
                      >
                        <img src={imgUrl} alt={`${currentProduct.name} - foto ${idx + 1}`} />
                      </button>
                    ))}

                    {/* Miniatura do Vídeo na Galeria com CAPA REAL DO VÍDEO */}
                    {currentProduct.video_url && (
                      <Editable as="button" widgetId="product-control-11"
                        type="button"
                        className={`thumb-item-btn thumb-video-btn ${showVideoMain ? 'active' : ''}`}
                        onClick={() => setShowVideoMain(true)}
                        title="Assistir ao vídeo do produto"
                        aria-label="Ver vídeo do produto"
                        style={{ position: 'relative', overflow: 'hidden' }}
                      >
                        {getYoutubeVideoId(currentProduct.video_url) ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <Editable as="img" widgetId="product-4"
                              src={`https://img.youtube.com/vi/${getYoutubeVideoId(currentProduct.video_url)}/hqdefault.jpg`}
                              alt="Capa do Vídeo"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div className="thumb-video-overlay">
                              <div className="thumb-video-play-badge">
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="#2563eb" style={{ marginLeft: 1 }}>
                                  <polygon points="6 3 20 12 6 21 6 3" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#f8fafc' }}>
                            <video
                              src={`${currentProduct.video_url}#t=0.2`}
                              preload="metadata"
                              muted
                              playsInline
                              autoPlay={false}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                            />
                            <div className="thumb-video-overlay">
                              <div className="thumb-video-play-badge">
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="#2563eb" style={{ marginLeft: 1 }}>
                                  <polygon points="6 3 20 12 6 21 6 3" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </Editable>
                    )}
                  </div>
                </div>
              </Editable>

              {/* TABS ABAIXO DA GALERIA: DESCRIÇÃO E ESPECIFICAÇÃO (COM RESUMO E BOTÃO VER MAIS) */}
              <div className="pdp-gallery-description-block" id="pdp-main-description">
                <div className="pdp-tabs-nav" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeOverviewTab === 'desc'}
                    className={`pdp-tab-btn ${activeOverviewTab === 'desc' ? 'active' : ''}`}
                    onClick={() => setActiveOverviewTab('desc')}
                  >
                    Descrição
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeOverviewTab === 'specs'}
                    className={`pdp-tab-btn ${activeOverviewTab === 'specs' ? 'active' : ''}`}
                    onClick={() => setActiveOverviewTab('specs')}
                  >
                    Especificações
                  </button>
                </div>

                <div className="pdp-tabs-content">
                  {/* TAB 1: DESCRIÇÃO */}
                  {activeOverviewTab === 'desc' && (
                    <div className="pdp-gallery-description-content">
                      <div className={`pdp-tab-collapsible-wrapper ${!isDescriptionExpanded ? 'collapsed' : ''}`}>
                        <div className="pdp-gallery-description-text">
                          {currentProduct.description || (
                            `Experimente a máxima potência e versatilidade com o Kit Chave de Impacto 21V e Jogo de Soquetes 46 Peças!

Tenha uma ferramenta profissional, ergonômica e robusta, com torque elevado de 350 N.m capaz de atender desde manutenções automotivas e trocas de rodas até montagens estruturais pesadas em canteiros de obras.

O kit acompanha bateria de íons de lítio 21V com indicador de nível de carga, carregador inteligente rápido bivolt (127V/220V) e estojo completo com 46 peças e soquetes forjados em cromo-vanádio de alta resistência ao impacto.

Principais Destaques:
• Motor Brushless de alta performance sem escovas de carvão, garantindo menor aquecimento e maior durabilidade.
• Iluminação LED frontal embutida para trabalho em áreas de pouca luminosidade ou caixas de rodas.
• Seletor eletrônico de velocidade variável e reversão de sentido de rotação instantâneo.
• Empunhadura emborrachada antiderrapante com distribuição de peso balanceada para longas jornadas de trabalho.`
                          )}
                        </div>
                        {!isDescriptionExpanded && <div className="pdp-tab-fade-overlay" />}
                      </div>

                      <button
                        type="button"
                        className="pdp-tab-toggle-btn"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        aria-expanded={isDescriptionExpanded}
                      >
                        {isDescriptionExpanded ? (
                          <>
                            <span>Ver menos</span>
                            <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
                          </>
                        ) : (
                          <>
                            <span>Ver mais</span>
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* TAB 2: ESPECIFICAÇÕES */}
                  {activeOverviewTab === 'specs' && (
                    <div className="pdp-tab-specs-pane">
                      <div className={`pdp-tab-collapsible-wrapper ${!isSpecsExpanded ? 'collapsed' : ''}`}>
                        <div className="pdp-specs-table-wrapper">
                          <table className="pdp-specs-table">
                            <tbody>
                              <tr>
                                <th>Marca</th>
                                <td>{currentProduct.brand || 'Bomvink'}</td>
                              </tr>
                              <tr>
                                <th>Modelo</th>
                                <td>{currentProduct.name || 'Kit Chave De Impacto 21V'}</td>
                              </tr>
                              <tr>
                                <th>SKU / Código</th>
                                <td><code>{currentProduct.sku || 'BOM-9146-21V'}</code></td>
                              </tr>
                              <tr>
                                <th>Tensão da Bateria</th>
                                <td>21V Íon-Lítio Recarregável</td>
                              </tr>
                              <tr>
                                <th>Torque Máximo</th>
                                <td>350 N.m</td>
                              </tr>
                              <tr>
                                <th>Velocidade sem Carga</th>
                                <td>0 a 2.800 RPM</td>
                              </tr>
                              <tr>
                                <th>Frequência de Impactos</th>
                                <td>0 a 3.200 IPM</td>
                              </tr>
                              <tr>
                                <th>Encaixe do Mandril</th>
                                <td>Quadrado de 1/2" (12.7 mm) com pino trava</td>
                              </tr>
                              <tr>
                                <th>Alimentação do Carregador</th>
                                <td>Bivolt Automático (110V / 220V — 50Hz/60Hz)</td>
                              </tr>
                              <tr>
                                <th>Acessórios Inclusos</th>
                                <td>Jogo de Soquetes 46 Peças, Maleta Rígida Reforçada, Bateria 21V, Carregador</td>
                              </tr>
                              <tr>
                                <th>Garantia de Fábrica</th>
                                <td>90 dias oficiais contra defeitos de fabricação</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        {!isSpecsExpanded && <div className="pdp-tab-fade-overlay" />}
                      </div>

                      <button
                        type="button"
                        className="pdp-tab-toggle-btn"
                        onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                        aria-expanded={isSpecsExpanded}
                      >
                        {isSpecsExpanded ? (
                          <>
                            <span>Ver menos</span>
                            <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
                          </>
                        ) : (
                          <>
                            <span>Ver mais</span>
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LADO DIREITO: INFORMAÇÕES, PREÇOS, QUANTIDADE, BOTÕES E FRETE */}
            {/* LADO DIREITO: INFORMAÇÕES, PREÇOS, QUANTIDADE, BOTÕES E FRETE (PADRÃO 1:1 MERCADO LIVRE) */}
            {/* LADO DIREITO: INFORMAÇÕES DO PRODUTO E CARD DE COMPRA COMPACTO (1:1 MERCADO LIVRE) */}
            <Editable as="div" widgetId="product-control-12" className="container-info ml-pdp-container">
              <EditableFlow id="product-info-column" label="Informações do produto" compact>

              {/* 1. Linha superior: Condição, Vendas, Selo e Favoritar */}
              <div className="ml-pdp-top-line">
                <div className="ml-pdp-status-tags">
                  <span className="ml-pdp-condition-sold">
                    {commerce?.condition || (currentProduct as any).condition || 'Novo'}
                    <Editable as="span" widgetId="product-control-13" className="ml-pdp-sep">|</Editable>
                    {commerce?.soldCount || (currentProduct as any).sold_count || '+10 mil vendidos'}
                  </span>
                  {(currentProduct as any).bestSeller || commerce?.badge === 'bestseller' ? (
                    <Editable as="span" widgetId="product-control-14" className="ml-pdp-bestseller-tag">MAIS VENDIDO</Editable>
                  ) : null}
                </div>

                <Editable as="button" widgetId="product-control-15"
                  type="button"
                  className={`ml-pdp-fav-btn ${fav ? 'active' : ''}`}
                  onClick={() => toggleFavorite({
                    id: currentProduct.id,
                    name: currentProduct.name,
                    price: pixPrice,
                    promo_price: pixPrice,
                    image_url: productImages[0],
                    sku: currentProduct.sku
                  })}
                  title={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  aria-label="Favoritar produto"
                >
                  <svg viewBox="0 0 24 24" fill={fav ? '#3483fa' : 'none'} stroke="#3483fa" strokeWidth="1.8" width="20" height="20">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </Editable>
              </div>

              {/* 2. Título do Produto */}
              <Editable as="h1" widgetId="product-5" className="ml-pdp-title notranslate">{cleanProductTitle(currentProduct.name)}</Editable>

              {/* 3. Avaliação Estrelas */}
              <Editable as="div" widgetId="product-rating" widgetType="productRating" editorKind="widget" renderContent={false} className="ml-pdp-rating-row">
                <span className="ml-pdp-rating-num">4.9</span>
                <div className="ml-pdp-stars">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <span className="ml-pdp-rating-count">(4455)</span>
              </Editable>

              {/* 4. Bloco de Preço e Oferta Compacto */}
              <Editable as="div" widgetId="product-control-23" className="ml-pdp-price-section">
                {/* Faixa de Oferta Relâmpago (se ativa) */}
                {pricing.offerActive && remainingSeconds > 0 && (
                  <div className="ml-pdp-flash-ribbon">
                    <Editable as="span" widgetId="product-control-24" className="ml-pdp-flash-tag">⚡ OFERTA RELÂMPAGO</Editable>
                    <div className="ml-pdp-flash-time">
                      <Editable as="span" widgetId="product-control-25">Termina em</Editable>
                      <OfferCountdownParts seconds={remainingSeconds} />
                    </div>
                  </div>
                )}

                {/* Preço Original Riscado */}
                {discountPercent > 0 && (
                  <span className="ml-pdp-old-price">{formatMoney(oldPrice)}</span>
                )}

                <div className="ml-pdp-main-price-row">
                  <span className="ml-pdp-price-amount">
                    R$ {pixInt}<sup className="ml-pdp-price-cents">{pixCents}</sup>
                  </span>
                  {discountPercent > 0 && (
                    <span className="ml-pdp-discount-badge">{discountPercent}% OFF</span>
                  )}
                </div>

                <div className="ml-pdp-installment-line">
                  ou {formatMoney(cardPrice)} em <strong style={{ color: '#059669' }}>{commerce.installments || 10}x {formatMoney(pricing.installment || (cardPrice / (commerce.installments || 10)))} sem juros</strong>
                </div>

                <div className="ml-pdp-payment-wrapper" ref={paymentPopoverRef}>
                  <div className="ml-pdp-payment-trigger-row">
                    <div
                      className="ml-pdp-mini-flags"
                      onClick={() => setShowPaymentPopover(!showPaymentPopover)}
                      title="Ver opções de pagamento"
                    >
                      <img src="https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368aaf-m.svg" alt="Visa" className="ml-mini-flag" />
                      <img src="https://http2.mlstatic.com/storage/logos-api-admin/9cf818e0-723a-11f0-a459-cf21d0937aeb-m.svg" alt="Mastercard" className="ml-mini-flag" />
                      <img src="https://http2.mlstatic.com/storage/logos-api-admin/bb7c7bb0-adec-11f0-92e6-59fb0bcb38c2-m.svg" alt="Elo" className="ml-mini-flag" />
                      <img src="https://http2.mlstatic.com/storage/logos-api-admin/b2c93a40-f3be-11eb-9984-b7076edb0bb7-m.svg" alt="American Express" className="ml-mini-flag" />
                      <img src="https://http2.mlstatic.com/storage/logos-api-admin/f99fcca0-f3bd-11eb-9984-b7076edb0bb7-m.svg" alt="Pix" className="ml-mini-flag" />
                    </div>
                    <button
                      type="button"
                      className="ml-pdp-payment-link"
                      onClick={() => setShowPaymentPopover(!showPaymentPopover)}
                      aria-expanded={showPaymentPopover}
                    >
                      Ver meios de pagamento
                    </button>
                  </div>

                  {/* POPUP / POPOVER LOGO ABAIXO */}
                  {showPaymentPopover && (
                    <div className="ml-pdp-payment-popover" role="dialog" aria-label="Opções de pagamento">
                      <div className="ml-pdp-popover-header">
                        <strong>Opções de pagamento</strong>
                        <button
                          type="button"
                          className="ml-pdp-popover-close"
                          onClick={() => setShowPaymentPopover(false)}
                          aria-label="Fechar popup de pagamento"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="ml-pdp-popover-body">
                        <div className="ml-pdp-popover-item">
                          <span className="ml-pdp-popover-item-title">Cartão de crédito</span>
                          <span className="ml-pdp-popover-item-desc">
                            Em até <strong>{commerce.installments || 10}x {formatMoney(pricing.installment || (cardPrice / (commerce.installments || 10)))} sem juros</strong>
                          </span>
                          <div className="ml-pdp-popover-flags">
                            <img src="https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368aaf-m.svg" alt="Visa" />
                            <img src="https://http2.mlstatic.com/storage/logos-api-admin/9cf818e0-723a-11f0-a459-cf21d0937aeb-m.svg" alt="Mastercard" />
                            <img src="https://http2.mlstatic.com/storage/logos-api-admin/bb7c7bb0-adec-11f0-92e6-59fb0bcb38c2-m.svg" alt="Elo" />
                            <img src="https://http2.mlstatic.com/storage/logos-api-admin/b2c93a40-f3be-11eb-9984-b7076edb0bb7-m.svg" alt="American Express" />
                          </div>
                        </div>

                        <div className="ml-pdp-popover-item">
                          <span className="ml-pdp-popover-item-title">Pix à vista</span>
                          <span className="ml-pdp-popover-item-desc">
                            <strong style={{ color: '#059669' }}>{formatMoney(pixPrice)}</strong> com aprovação imediata
                          </span>
                        </div>

                        <div className="ml-pdp-popover-item">
                          <span className="ml-pdp-popover-item-title">Boleto bancário</span>
                          <span className="ml-pdp-popover-item-desc">
                            <strong>{formatMoney(cardPrice)}</strong> à vista (vencimento em 3 dias)
                          </span>
                        </div>
                      </div>

                      <div className="ml-pdp-popover-footer">
                        <button
                          type="button"
                          className="ml-pdp-popover-saiba-mais-btn"
                          onClick={() => {
                            setShowPaymentPopover(false)
                            setShowPaymentModal(true)
                          }}
                        >
                          Saiba mais
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Editable>

              {/* 5. CARD DE COMPRA RESUMIDO & MODERNO */}
              <div className="ml-pdp-buy-box">
                {/* Frete Rápido */}
                <div className="ml-pdp-box-shipping">
                  <div className="ml-pdp-shipping-title-row">
                    <span className="ml-pdp-shipping-badge">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <path d="m13 2-9 12h7l-1 8 10-13h-7z" />
                      </svg>
                      Chegará grátis amanhã
                    </span>
                  </div>
                  <Editable as="button" widgetId="product-control-27"
                    type="button"
                    className="ml-pdp-shipping-details-link"
                    onClick={() => setShowCepModal(true)}
                  >
                    {deliveryCep || cep ? `Enviar para ${deliveryCep || cep}` : 'Calcular prazo de entrega'}
                  </Editable>

                  {showFreightCalc && (
                    <div className="ml-pdp-freight-mini">
                      <form onSubmit={handleCalculateFreight} className="ml-pdp-freight-form">
                        <input
                          type="tel"
                          placeholder="00000-000"
                          maxLength={9}
                          id="zipcode"
                          value={cep}
                          onChange={e => setCep(e.target.value)}
                          className="ml-pdp-freight-input"
                        />
                        <Editable as="button" widgetId="product-control-28" type="submit" className="ml-pdp-freight-btn" disabled={freightLoading}>
                          {freightLoading ? '...' : 'OK'}
                        </Editable>
                      </form>
                      {freightCalculated && (
                        <Editable as="p" widgetId="product-6" className="ml-pdp-freight-result">
                          {commerce.freeShipping ? `✓ Frete grátis confirmado para ${deliveryCep || cep}!` : `Consulte prazos para ${deliveryCep || cep}.`}
                        </Editable>
                      )}
                    </div>
                  )}
                </div>

                {/* Estoque e Quantidade em Linha Única Resumida */}
                {(currentProduct.stock ?? 1) > 0 ? (
                  <div className="ml-pdp-box-stock-compact">
                    <div className="ml-pdp-stock-inline">
                      <span className="ml-pdp-stock-status-text">Estoque disponível</span>
                      <span className="ml-pdp-qty-avail">({currentProduct.stock || 15} disponíveis)</span>
                    </div>
                    <div className="ml-pdp-qty-row-compact">
                      <span className="ml-pdp-qty-label">Quantidade:</span>
                      <div className="ml-pdp-qty-controls">
                        <Editable as="button" widgetId="product-control-32" type="button" className="ml-pdp-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Diminuir">-</Editable>
                        <input type="tel" aria-label="Quantidade" className="ml-pdp-qty-val" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                        <Editable as="button" widgetId="product-control-33" type="button" className="ml-pdp-qty-btn" onClick={() => setQuantity(q => q + 1)} aria-label="Aumentar">+</Editable>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ml-pdp-out-of-stock-banner">
                    <p className="ml-pdp-out-of-stock-text">Produto esgotado, clique no botão abaixo para ser avisado quando chegar</p>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="ml-pdp-box-actions">
                  {(currentProduct.stock ?? 1) > 0 ? (
                    <>
                      <Editable as="button" widgetId="product-control-34" type="button" className="ml-pdp-btn-buy" onClick={handleOneClickBuy}>
                        Comprar agora
                      </Editable>
                      <Editable as="button" widgetId="product-control-35" type="button" className="ml-pdp-btn-cart" onClick={handleAddToCart}>
                        Adicionar ao carrinho
                      </Editable>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="ml-pdp-btn-notify-stock"
                      onClick={() => setShowStockNotifyModal(true)}
                    >
                      Quero ser avisado
                    </button>
                  )}
                </div>

                {/* Garantias Resumidas (1 Linha cada) */}
                <div className="ml-pdp-box-guarantee-compact">
                  <div className="ml-pdp-guar-compact-item">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#00a650" strokeWidth="2.2">
                      <path d="M20 7h-9a4 4 0 1 0 4 4" /><path d="m20 7-3-3" /><path d="m20 7-3 3" />
                    </svg>
                    <span><strong>Devolução grátis</strong> em até 30 dias</span>
                  </div>
                  <div className="ml-pdp-guar-compact-item">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#00a650" strokeWidth="2.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" />
                    </svg>
                    <span><strong>Compra Garantida</strong> receba o produto ou seu dinheiro</span>
                  </div>
                </div>

                {/* Suporte WhatsApp Compacto */}
                <div className="ml-pdp-box-support">
                  <a
                    href={`https://api.whatsapp.com/send?phone=5546999155875&text=${encodeURIComponent(`Olá, tenho dúvidas sobre o produto: ${currentProduct.name} - Código: ${currentProduct.sku || '58'}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-pdp-support-link"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="#25d366">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
                    </svg>
                    <span>Dúvidas? <strong>Fale conosco</strong></span>
                  </a>
                </div>
              </div>

              <aside className="ml-pdp-store-card" aria-label="Informações da loja TEKNIX">
                <h2>Informações da loja</h2>
                <div className="ml-pdp-store-heading">
                  <div className="ml-pdp-store-logo" aria-hidden="true">
                    <img src="/teknix-company-logo.png" alt="Logo TEKNIX" />
                  </div>
                  <div>
                    <strong>TEKNIX</strong>
                    <span>Loja oficial TEKNIX <b aria-label="Loja verificada">✓</b></span>
                  </div>
                </div>
                <div className="ml-pdp-store-actions">
                  <a href="https://api.whatsapp.com/send?phone=5546999155875" target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path d="M8 10h8M8 14h5" /></svg>
                    Fale conosco
                  </a>
                  <a href="https://www.instagram.com/teknixbrasil/" target="_blank" rel="noreferrer">+ Seguir</a>
                </div>
                <div className="ml-pdp-store-meter" aria-label="Reputação excelente"><span /></div>
                <div className="ml-pdp-store-metrics">
                  <div><b>+20 mil</b><span>Produtos vendidos</span></div>
                  <div><b>Entrega</b><span>No prazo</span></div>
                  <div><b>Atendimento</b><span>Responde rápido</span></div>
                </div>
                <Link to="/loja" className="ml-pdp-store-link">Ver mais sobre a loja</Link>
              </aside>
              </EditableFlow>
            </Editable>
          </div>
        </div>
      </div>

      {presentationImages.length > 0 && (
        <section className="teknix-product-presentation-images" aria-label="Apresentação do produto">
          <div className="teknix-ref-container" style={{ width: '100%', maxWidth: 1292, padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
              {presentationImages.map((image: string, index: number) => (
                <img key={`${image}-${index}`} src={image} alt={`${currentProduct.name} — imagem ${index + 1}`} style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {displayFaqs.length > 0 && (
        <section className="teknix-product-questions" aria-label="Perguntas e respostas">
          <div className="teknix-ref-container" style={{ padding: '64px 24px 32px', boxSizing: 'border-box' }}>
            <h2 className="teknix-questions-title">Perguntas e respostas sobre o produto</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {displayFaqs.map((item: any, index: number) => (
                <details key={index} style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{item.question || item.q}</summary>
                  <p style={{ margin: '10px 0 0', lineHeight: 1.6, color: '#4b5563' }}>{item.answer || item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Showcase editorial — ativo para visualização */}
      {true && <Editable as="div" widgetId="product-control-36" className="ui container fluid description-section product-specifications-section" id="specifications">
        <div className="teknix-ref-showcase-root">
          
          {/* SEÇÃO 1: HERO SPOTLIGHT (FUNDO PRETO PURO #000 — FOCO NO VALOR & POR QUE COMPRAR) */}
          <section className="teknix-ref-hero-section">
            <div className="teknix-ref-container">
              <div className="teknix-ref-hero-grid">
                <div className="teknix-ref-hero-text">
                  <Editable as="span" widgetId="showcase-hero-eyebrow" className="teknix-ref-hero-eyebrow">
                    {showcase.hero.eyebrow}
                  </Editable>
                  <Editable as="h2" widgetId="showcase-hero-title" className="teknix-ref-hero-title">
                    {showcase.hero.title}
                  </Editable>
                  <Editable as="p" widgetId="showcase-hero-desc" className="teknix-ref-hero-desc">
                    {showcase.hero.description}
                  </Editable>

                  <div className="teknix-ref-hero-benefits">
                    {showcase.hero.benefits.map((b, bIdx) => (
                      <div key={bIdx} className="teknix-ref-hero-benefit-item">
                        <div className="teknix-ref-hero-benefit-icon">
                          {renderBenefitIcon(b.icon)}
                        </div>
                        <span><strong>{b.title}:</strong> {b.desc}</span>
                      </div>
                    ))}
                  </div>

                  <div className="teknix-ref-hero-actions">
                    <a href="#overview" className="teknix-ref-hero-btn">
                      {showcase.hero.cta_primary_text || 'Garantir agora'}
                    </a>
                    <a href="#compare-specs" className="teknix-ref-hero-secondary-btn">
                      {showcase.hero.cta_secondary_text || 'Comparar versões'}
                    </a>
                  </div>
                </div>

                <div className="teknix-ref-hero-media">
                  <div className="teknix-ref-hero-platform">
                    {showcase.hero.top_badge && (
                      <span className="teknix-ref-hero-pill-badge top-badge">{showcase.hero.top_badge}</span>
                    )}
                    <img
                      src={showcase.hero.image_url || productImages[0]}
                      alt={showcase.hero.title}
                      className="teknix-ref-hero-img"
                    />
                    {showcase.hero.bottom_badge && (
                      <span className="teknix-ref-hero-pill-badge bottom-badge">{showcase.hero.bottom_badge}</span>
                    )}
                    <div className="teknix-ref-hero-glow" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: PERFORMANCE E RENDIMENTO DE ALTA VELOCIDADE (FUNDO PRETO PURO #000) */}
          <section className="teknix-ref-speed-section">
            <div className="teknix-ref-container">
              <div className="teknix-ref-speed-grid">
                <div className="teknix-ref-speed-media">
                  <div className="teknix-ref-tech-stage">
                    <div className="teknix-ref-screen-backdrop" />
                    <img
                      src={showcase.performance.image_url || productImages[1] || productImages[0]}
                      alt={showcase.performance.title}
                      className="teknix-ref-speed-img"
                    />
                  </div>
                </div>

                <div className="teknix-ref-speed-content">
                  <Editable as="h2" widgetId="showcase-perf-title" className="teknix-ref-speed-title">
                    {showcase.performance.title}
                  </Editable>
                  <Editable as="p" widgetId="showcase-perf-desc" className="teknix-ref-speed-lead">
                    {showcase.performance.description}
                  </Editable>

                  <div className="teknix-ref-feature-items">
                    {showcase.performance.features.map((f, fIdx) => (
                      <div key={fIdx} className="teknix-ref-feature-item">
                        <h4 className="teknix-ref-feature-title">
                          {f.title}
                        </h4>
                        <p className="teknix-ref-feature-text">
                          {f.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 4: EXPLORE MODELOS DA LINHA (FUNDO BRANCO #FFF) */}
          <section className="teknix-ref-explore-section">
            <div className="teknix-ref-container">
              <div className="teknix-ref-section-header text-center">
                <Editable as="h2" widgetId="showcase-models-title" className="teknix-ref-title-dark">
                  {showcase.explore_models.title}
                </Editable>
              </div>

              <div className="teknix-ref-explore-grid">
                {showcase.explore_models.models.map((m, mIdx) => (
                  <div key={mIdx} className="teknix-ref-explore-card">
                    {m.badge && (
                      <span className="teknix-ref-explore-badge">
                        {m.badge}
                      </span>
                    )}
                    <div className="teknix-ref-explore-thumb">
                      <img
                        src={m.image_url || productImages[mIdx] || productImages[0]}
                        alt={m.name}
                      />
                    </div>
                    <h3 className="teknix-ref-explore-name">{m.name}</h3>
                    <p className="teknix-ref-explore-specs">{m.specs}</p>
                    <a href={m.link || '#overview'} className="teknix-ref-explore-link">
                      Ver detalhes
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SEÇÃO 5: TABELA COMPARATIVA DE VERSÕES (FUNDO BRANCO #FFF) */}
          <section className="teknix-ref-compare-section" id="compare-specs">
            <div className="teknix-ref-container">
              <div className="teknix-ref-section-header text-center">
                <Editable as="h2" widgetId="showcase-comp-title" className="teknix-ref-title-dark">
                  {showcase.comparison.title}
                </Editable>
              </div>

              <div className="teknix-ref-table-wrap">
                <table className="teknix-ref-compare-table">
                  <thead>
                    <tr>
                      <th className="th-attr">&nbsp;</th>
                      <th className="th-model">{showcase.comparison.col1_title}</th>
                      <th className="th-model">{showcase.comparison.col2_title}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showcase.comparison.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="td-attr">{row.attr}</td>
                        <td>{row.col1_val}</td>
                        <td>{row.col2_val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* SEÇÃO 7: PERGUNTAS FREQUENTES (FUNDO BRANCO #FFF) */}
          <section className="teknix-ref-faq-section">
            <div className="teknix-ref-container">
              <div className="teknix-ref-faq-content">
                <h2 className="teknix-ref-faq-title">
                  Perguntas Frequentes
                </h2>

                <div className="teknix-ref-faq-list">
                  {showcase.faqs.map((item, idx) => {
                    const isOpen = openFaq === idx
                    return (
                      <div key={idx} className={`teknix-ref-faq-row ${isOpen ? 'open' : ''}`}>
                        <button
                          type="button"
                          className="teknix-ref-faq-trigger"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.q}</span>
                          <span className="teknix-ref-faq-icon">{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen && (
                          <div className="teknix-ref-faq-body">
                            <p>{item.a}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 8: NOTAS LEGAIS E ISENÇÕES TÉCNICAS (FUNDO CINZA CLARO #F5F5F7) */}
          <section className="teknix-ref-notes-section">
            <div className="teknix-ref-container">
              <h5 className="teknix-ref-notes-heading">NOTAS E ISENÇÕES DE RESPONSABILIDADE:</h5>
              <ol className="teknix-ref-notes-list">
                <li>
                  Os valores nominais de torque e rotação foram aferidos sob condições laboratoriais de teste com baterias totalmente carregadas. O rendimento real pode variar dependendo do material, bitola do parafuso e temperatura ambiente de trabalho.
                </li>
                <li>
                  A durabilidade e autonomia das baterias de íons de lítio 21V dependem dos ciclos de carga e descarga realizados, além da observância das instruções de armazenagem constantes no manual do usuário.
                </li>
                <li>
                  A garantia oficial TEKNIX cobre eventuais defeitos de fabricação mediante a apresentação da Nota Fiscal Eletrônica (NF-e) emitida no momento da compra.
                </li>
                <li>
                  Imagens meramente ilustrativas para fins de demonstração. As especificações técnicas estão sujeitas a contínuas melhorias de projeto sem aviso prévio.
                </li>
              </ol>
            </div>
          </section>

        </div>
      </Editable>}


    </EditableFlow></div></PageWidgets>
  )
}
