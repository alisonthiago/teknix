import EditableFlow from '../components/page-widgets/EditableFlow'
import { Editable, PageWidgets } from '../components/page-widgets/PageWidgets'
/* ==========================================================================
   TEKNIX SITE — PÁGINA OFICIAL DE DETALHES DO PRODUTO (1:1 PADRÃO HAGOR/TEKNIX)
   ========================================================================== */

import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getProductBySku, getProductById, getProducts } from '../services/products'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import type { Product as ProductType } from '../types/database'
import './Product.css'
import { Ads } from '../components/Ads'
import { DEMO_PRODUCT, DEMO_SIGNALS, DEMO_REVIEWS } from '../services/demoProduct'
import ProductReviews from '../components/ProductReviews'
import './ProductResponsive.css'
import { productPricing } from '../../../../packages/core/src/productCommerce'
import { commerceSignals } from '../services/storefrontCommerce'
import { remainingOfferTime } from '../services/productPresentation'

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
  const [searchParams] = useSearchParams()
  const isDemo = import.meta.env.DEV && searchParams.get('demo') === '1' && productId === DEMO_PRODUCT.sku
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
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showStickyNav, setShowStickyNav] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [pricingTime,setPricingTime] = useState(Date.now)
  useEffect(()=>{
    if (!product?.commerce?.offerEnabled) return
    const timer=window.setInterval(()=>setPricingTime(Date.now()),1000)
    return ()=>clearInterval(timer)
  },[product?.commerce?.offerEnabled])

  const { addToCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!productId) return
    if (isDemo) {
      setProduct(DEMO_PRODUCT)
      setRelated([])
      setActiveImageIndex(0)
      setLoading(false)
      return
    }
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
  }, [productId, isDemo])

  useEffect(() => {
    const updateStickyNav = () => {
      setShowStickyNav(window.scrollY > 420)
      const sections = ['overview', 'specifications', 'differentials', 'warranty', 'reviews']
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

  const currentSignals = isDemo ? DEMO_SIGNALS : commerceSignals(currentProduct, pricingTime)
  const remSec = remainingOfferTime(currentSignals?.offerEndsAt, pricingTime)
  const remainingSeconds = remSec > 0 ? remSec : 5 * 3600 + 2 * 60 + 47
  const pixInt = Math.floor(pixPrice).toLocaleString('pt-BR')
  const pixCents = (pixPrice % 1).toFixed(2).substring(2)

  const productImages = (currentProduct.images && currentProduct.images.length > 0)
    ? currentProduct.images
    : [currentProduct.image_url || '']

  const fav = isFavorite(currentProduct.id)

  const handleAddToCart = () => {
    if (isDemo) return
    addToCart({
      id: currentProduct.id,
      name: currentProduct.name,
      sku: currentProduct.sku || currentProduct.id,
      price: basePrice,
      promo_price: finalPrice,
      image: productImages[0],
      quantity: quantity,
      stock: currentProduct.stock || 0
    })
    showToast(`Adicionado à sacola (${quantity}x)`)
  }

  const handleOneClickBuy = () => {
    if (isDemo) return
    handleAddToCart()
    navigate('/checkout')
  }

  const handleCalculateFreight = (e: React.FormEvent) => {
    e.preventDefault()
    if (isDemo) return
    if (!cep.replace(/\D/g, '')) return
    setFreightLoading(true)
    setTimeout(() => {
      setFreightLoading(false)
      setFreightCalculated(true)
    }, 600)
  }

  return (
    <PageWidgets key={currentProduct.id} scope={`product:${currentProduct.id}`}><div className="product-detail-page-root"><EditableFlow id="product-page" label="Página do produto">
      <Ads position="product-header" />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="hagor-toast" role="status">
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* ── STICKY NAV (ESTILO SANDISK) ── */}
      <div className={`pdp-sticky-nav ${showStickyNav ? 'is-visible' : ''}`} id="pdp-sticky-nav" aria-hidden={!showStickyNav} inert={!showStickyNav}>
        <div className="pdp-sticky-nav-inner">
          <div className="pdp-sticky-nav-title">
            <span className="pdp-sticky-nav-name">{currentProduct.name}</span>
            <span className="pdp-sticky-nav-sku">{formatMoney(pixPrice)} no Pix {isDemo && '· Demonstração'}</span>
          </div>
          <nav className="pdp-sticky-nav-links">
            {[['overview','Produto'],['specifications','Especificações'],['differentials','Detalhes'],['warranty','Garantia'],['reviews','Avaliações']].map(([id,label]) => <a key={id} href={`#${id}`} className={activeSection===id ? 'active' : ''} aria-current={activeSection===id ? 'location' : undefined}>{label}</a>)}
          </nav>
        </div>
      </div>

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
                <Link to="/categoria/ferramentas-eletricas" title="Ferramentas Elétricas">Ferramentas Elétricas</Link>
                <Editable as="span" widgetId="product-control-2" className="divider">/</Editable>
              </li>
              <li>
                <Link to="/categoria/ferramentas-eletricas" title="Máquinas de Solda">
                  {currentProduct.category || 'Máquinas de Solda'}
                </Link>
                <Editable as="span" widgetId="product-control-3" className="divider">/</Editable>
              </li>
              <li className="active-breadcrumb">{currentProduct.name}</li>
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
                      setActiveImageIndex((activeImageIndex - 1 + productImages.length) % productImages.length)
                    }}
                    aria-label="Imagem anterior"
                    hidden={productImages.length < 2}
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
                        src={productImages[activeImageIndex] || productImages[0]}
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
                      setActiveImageIndex((activeImageIndex + 1) % productImages.length)
                    }}
                    aria-label="Próxima imagem"
                    hidden={productImages.length < 2}
                  >
                    ›
                  </Editable>
                </div>

                {/* Miniaturas Horizontais (abaixo da foto principal) */}
                <div className="thumbs-horizontal-wrapper">
                  <div className="thumbs-horizontal-list">
                    {productImages.map((imgUrl, idx) => (
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
            </div>

            {/* LADO DIREITO: INFORMAÇÕES, PREÇOS, QUANTIDADE, BOTÕES E FRETE */}
            {/* LADO DIREITO: INFORMAÇÕES, PREÇOS, QUANTIDADE, BOTÕES E FRETE (PADRÃO 1:1 MERCADO LIVRE) */}
            {/* LADO DIREITO: INFORMAÇÕES DO PRODUTO E CARD DE COMPRA COMPACTO (1:1 MERCADO LIVRE) */}
            <Editable as="div" widgetId="product-control-12" className="container-info ml-pdp-container">

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
                  disabled={isDemo}
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
              <Editable as="h1" widgetId="product-5" className="ml-pdp-title notranslate">{currentProduct.name}</Editable>

              {/* 3. Avaliação Estrelas */}
              <div className="ml-pdp-rating-row">
                <Editable as="span" widgetId="product-control-16" className="ml-pdp-rating-num">4.9</Editable>
                <div className="ml-pdp-stars">
                  <Editable as="span" widgetId="product-control-17">★</Editable><Editable as="span" widgetId="product-control-18">★</Editable><Editable as="span" widgetId="product-control-19">★</Editable><Editable as="span" widgetId="product-control-20">★</Editable><Editable as="span" widgetId="product-control-21">★</Editable>
                </div>
                <Editable as="span" widgetId="product-control-22" className="ml-pdp-rating-count">(4455)</Editable>
              </div>

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
                <a href="#pagamento" className="ml-pdp-payment-link" onClick={e => { e.preventDefault(); alert('Formas de pagamento aceitas: Cartão de Crédito em até 12x, Boleto Bancário e Pix com desconto imediato.'); }}>
                  Ver meios de pagamento
                </a>
              </Editable>

              {/* 5. CARD DE COMPRA COMPACTO (BUY BOX MERCADO LIVRE) */}
              <div className="ml-pdp-buy-box">
                {/* Frete */}
                <div className="ml-pdp-box-shipping">
                  <div className="ml-pdp-shipping-title-row">
                    <Editable as="span" widgetId="product-control-26" className="ml-pdp-shipping-title">Chegará grátis amanhã</Editable>
                  </div>
                  <Editable as="button" widgetId="product-control-27"
                    type="button"
                    className="ml-pdp-shipping-details-link"
                    onClick={() => setShowFreightCalc(v => !v)}
                  >
                    Mais detalhes e formas de entrega {showFreightCalc ? '▲' : '▼'}
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
                        <Editable as="button" widgetId="product-control-28" type="submit" className="ml-pdp-freight-btn" disabled={freightLoading || isDemo}>
                          {freightLoading ? '...' : 'OK'}
                        </Editable>
                      </form>
                      {freightCalculated && (
                        <Editable as="p" widgetId="product-6" className="ml-pdp-freight-result">
                          {commerce.freeShipping ? '✓ Frete grátis confirmado!' : 'Consulte prazos para sua região.'}
                        </Editable>
                      )}
                    </div>
                  )}
                </div>

                {/* Estoque e Quantidade */}
                <div className="ml-pdp-box-stock">
                  <div className="ml-pdp-stock-status">
                    <Editable as="span" widgetId="product-control-29" className="green-dot"></Editable>
                    <Editable as="span" widgetId="product-control-30">Estoque disponível</Editable>
                  </div>
                  <div className="ml-pdp-qty-row">
                    <Editable as="span" widgetId="product-control-31">Quantidade:</Editable>
                    <div className="ml-pdp-qty-controls">
                      <Editable as="button" widgetId="product-control-32" type="button" className="ml-pdp-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Diminuir">-</Editable>
                      <input type="tel" aria-label="Quantidade" className="ml-pdp-qty-val" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                      <Editable as="button" widgetId="product-control-33" type="button" className="ml-pdp-qty-btn" onClick={() => setQuantity(q => q + 1)} aria-label="Aumentar">+</Editable>
                    </div>
                    <span className="ml-pdp-qty-avail">({currentProduct.stock || 15} disponíveis)</span>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="ml-pdp-box-actions">
                  <Editable as="button" widgetId="product-control-34" type="button" className="ml-pdp-btn-buy" onClick={handleOneClickBuy} disabled={isDemo}>
                    Comprar agora
                  </Editable>
                  <Editable as="button" widgetId="product-control-35" type="button" className="ml-pdp-btn-cart" onClick={handleAddToCart} disabled={isDemo}>
                    Adicionar ao carrinho
                  </Editable>
                </div>

                {/* Garantias */}
                <div className="ml-pdp-box-guarantee">
                  <div className="ml-pdp-guar-item">
                    <span className="ml-pdp-guar-icon" aria-hidden="true" />
                    <span><strong>Devolução grátis.</strong> 30 dias a partir do recebimento.</span>
                  </div>
                  <div className="ml-pdp-guar-item">
                    <span className="ml-pdp-guar-icon" aria-hidden="true" />
                    <span><strong>Compra Garantida</strong> com recebimento ou dinheiro de volta.</span>
                  </div>
                </div>

                {/* Suporte WhatsApp */}
                <div className="ml-pdp-box-support">
                  <a
                    href={`https://api.whatsapp.com/send?phone=5546999155875&text=${encodeURIComponent(`Olá, tenho dúvidas sobre o produto: ${currentProduct.name} - Código: ${currentProduct.sku || '58'}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-pdp-support-link"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#25d366">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
                    </svg>
                    Dúvidas sobre o produto? Fale conosco
                  </a>
                </div>
              </div>
            </Editable>
          </div>
        </div>
      </div>

      {/* ── 3. VISÃO GERAL EDITORIAL ── */}
      <Editable as="section" widgetId="product-7" className="product-editorial" id="overview-content">
        <div className="product-editorial-inner">
          <Editable as="h2" widgetId="product-8">{currentProduct.name}</Editable>
          <Editable as="p" widgetId="product-9" className="product-editorial-intro">
            {conciseDescription(currentProduct.description || currentProduct.short_description)}
          </Editable>
          {!isDemo && <div className="product-editorial-features">
            <article>
              <Editable as="h3" widgetId="product-10">Desempenho para o trabalho</Editable>
              <Editable as="p" widgetId="product-11">Construção confiável e recursos pensados para entregar resultados consistentes em aplicações exigentes.</Editable>
            </article>
            <article>
              <Editable as="h3" widgetId="product-12">Qualidade profissional</Editable>
              <Editable as="p" widgetId="product-13">Materiais selecionados e acabamento robusto para acompanhar a rotina de quem usa ferramentas todos os dias.</Editable>
            </article>
            <article>
              <Editable as="h3" widgetId="product-14">Praticidade e segurança</Editable>
              <Editable as="p" widgetId="product-15">Uso intuitivo, suporte especializado e condições que tornam a compra mais tranquila.</Editable>
            </article>
          </div>}
        </div>
      </Editable>

      {/* ── ESPECIFICAÇÕES TÉCNICAS ── */}
      <Editable as="div" widgetId="product-control-36" className="ui container fluid description-section product-specifications-section" id="specifications">
        <div className="ui container">
          <div className="first-box-main-description">
            <Editable as="span" widgetId="product-control-37" className="section-headline">Especificações</Editable>
            <div className="specs-description-flex-box">
              {/* Lado Esquerdo: Tabelas */}
              <div className="specs-tables-col">
                <Editable as="span" widgetId="product-control-38" className="table-lead-title">Características gerais</Editable>
                <div className="table-responsive">
                  <table className="tech-table">
                    <tbody>
                      <tr><td>Marca</td><td><strong>{currentProduct.brand || 'TEKNIX'}</strong></td></tr>
                      <tr><td>Modelo</td><td><strong>{currentProduct.model || currentProduct.name}</strong></td></tr>
                      <tr><td>Categoria</td><td><strong>{currentProduct.category || 'Geral'}</strong></td></tr>
                      {currentProduct.sku && <tr><td>SKU / Código</td><td><strong>{currentProduct.sku}</strong></td></tr>}
                      {(currentProduct.ean || (currentProduct as any).barcode) && (
                        <tr><td>Código de Barras (EAN)</td><td><strong>{currentProduct.ean || (currentProduct as any).barcode}</strong></td></tr>
                      )}
                      {currentProduct.weight && (
                        <tr><td>Peso</td><td><strong>{currentProduct.weight} kg</strong></td></tr>
                      )}
                      {(currentProduct.length || currentProduct.width || currentProduct.height) && (
                        <tr>
                          <td>Dimensões (C x L x A)</td>
                          <td><strong>{currentProduct.length || 0} x {currentProduct.width || 0} x {currentProduct.height || 0} cm</strong></td>
                        </tr>
                      )}
                      <tr><td>Condição</td><td><strong>Novo com Garantia Oficial</strong></td></tr>
                      <tr>
                        <td>Disponibilidade</td>
                        <td>
                          <strong>{currentProduct.stock !== undefined && currentProduct.stock > 0 ? `Em estoque (${currentProduct.stock} unid.)` : 'Disponível'}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {currentProduct.specifications && currentProduct.specifications.length > 0 && (
                  <>
                    <Editable as="span" widgetId="product-control-39" className="table-lead-title" style={{ marginTop: '24px' }}>Especificações técnicas</Editable>
                    <div className="table-responsive">
                      <table className="tech-table">
                        <tbody>
                          {currentProduct.specifications.map((spec, idx) => {
                            const [key, ...valueParts] = spec.split(':')
                            return (
                              <tr key={idx}>
                                <td>{key.trim()}</td>
                                <td><strong>{valueParts.join(':').trim()}</strong></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Lado Direito: Texto Editorial + Recursos Principais */}
              <div className="specs-editorial-col">
                <Editable as="h2" widgetId="product-16" className="editorial-title">{currentProduct.name}</Editable>
                {currentProduct.short_description && (
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #10b981', marginBottom: '14px', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                    {currentProduct.short_description}
                  </div>
                )}
                {currentProduct.description && (
                  <Editable as="p" widgetId="product-17" className="editorial-text" style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>{currentProduct.description}</Editable>
                )}

                {!isDemo && <><Editable as="span" widgetId="product-control-40" className="resources-title">Diferenciais e Garantia</Editable>
                <ul className="resources-list">
                  <li>Produto de <strong>alta qualidade</strong> com nota fiscal e garantia oficial</li>
                  {commerce.freeShipping && <li><strong>Frete grátis</strong> para este produto</li>}
                  <li><strong>Devolução gratuita</strong> em até 30 dias após o recebimento</li>
                  <li><strong>Suporte técnico</strong> e atendimento especializado TEKNIX</li>
                  {commerce.pixDiscountPercent > 0 && (
                    <li>Desconto especial de <strong>{commerce.pixDiscountPercent}% no Pix</strong></li>
                  )}
                  {commerce.installments > 1 && (
                    <li>Parcelamento em até <strong>{commerce.installments}x sem juros</strong> no cartão</li>
                  )}
                </ul></>}
              </div>
            </div>
          </div>
        </div>
      </Editable>



      {/* ── 4. DIFERENCIAIS DO PRODUTO ── */}
      {isDemo ? <Editable as="section" widgetId="product-18" className="product-editorial" id="differentials">
        <div className="product-editorial-inner">
          <Editable as="h2" widgetId="product-19">Detalhes do produto</Editable>
          <Editable as="p" widgetId="product-20">Esta prévia utiliza a imagem enviada. Compatibilidade, pressão de trabalho e acessórios devem ser informados no cadastro definitivo.</Editable>
          <Editable as="h2" widgetId="product-21" id="warranty">Garantia</Editable>
          <Editable as="p" widgetId="product-22">Prazo e condições de garantia serão informados após a confirmação dos dados do fabricante.</Editable>
        </div>
      </Editable> : <>
      <Editable as="div" widgetId="product-control-41" className="ui container fluid description-section" id="differentials">
        <div className="ui container">
          <div className="second-box-main-description">
            <Editable as="span" widgetId="product-control-42" className="section-headline">Diferenciais do produto</Editable>
            <div className="feature-split-box">
              <div className="feature-left-text">
                <Editable as="h3" widgetId="product-23" className="feature-subheading">Performance Industrial Comprovada</Editable>
                <Editable as="p" widgetId="product-24">
                  A linha TEKNIX Pro se destaca por sua alta eficiência energética e pela precisão milimétrica exigida em processos industriais e de funilaria técnica.
                </Editable>
                <ol className="feature-bullets-list">
                  <li><strong>Ciclo de trabalho elevado:</strong> 350A a 60% para jornadas contínuas sem sobreaquecimento.</li>
                  <li><strong>Eficiência de 85%:</strong> menor consumo na rede elétrica e máxima estabilidade de arco.</li>
                  <li><strong>Construção monobloco com ventilação forçada túnel:</strong> protege os componentes eletrônicos contra pó de metal.</li>
                  <li><strong>Frequência ajustável até 200Hz:</strong> arco focado e penetração controlada em chapas finas e grossas.</li>
                </ol>
              </div>
              <div className="feature-right-img">
                <Editable as="img" widgetId="product-25"
                  src={productImages[1] || productImages[0]}
                  alt="Diferenciais em Detalhes"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </Editable>

      {/* ── 5. INSTRUÇÕES DE USO ── */}
      <Editable as="div" widgetId="product-control-43" className="ui container fluid description-section">
        <div className="ui container">
          <div className="third-box-main-description">
            <div className="feature-split-box reverse">
              <div className="feature-right-img">
                <Editable as="img" widgetId="product-26"
                  src="https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80"
                  alt="Instruções e Boas Práticas"
                  loading="lazy"
                />
              </div>
              <div className="feature-left-text">
                <Editable as="span" widgetId="product-control-44" className="section-headline">Instruções de uso</Editable>
                <Editable as="h3" widgetId="product-27" className="feature-subheading">Operação Segura e Eficiente</Editable>
                <Editable as="p" widgetId="product-28">
                  Para operar o equipamento com máxima segurança e durabilidade, certifique-se de que todas as conexões do cabo terra e tocha estejam firmes antes de ligar à rede.
                </Editable>
                <ol className="feature-bullets-list">
                  <li>Leia atentamente o manual de instruções incluso na embalagem.</li>
                  <li>Verifique a voltagem e o disjuntor da rede antes de plugar o equipamento.</li>
                  <li>Regule a amperagem e o fluxo de gás de acordo com a espessura do material base.</li>
                  <li>Utilize sempre EPIs completos (máscara de solda automática, luvas de vaqueta e avental de raspa).</li>
                </ol>
              </div>
            </div>
          </div>

          {/* ── 6. GARANTIA OFICIAL E CARDS DE SUPORTE ── */}
          <div className="fourth-box-main-description" id="warranty">
            <div className="warranty-header-row">
              <Editable as="span" widgetId="product-control-45" className="section-headline">Garantia TEKNIX</Editable>
              <div className="warranty-text-content">
                <Editable as="p" widgetId="product-29">
                  Este produto possui <strong>garantia oficial de fábrica de 1 ano</strong> contra defeitos de fabricação, a partir da data de emissão da Nota Fiscal de compra.
                </Editable>
                <Editable as="p" widgetId="product-30">
                  A garantia cobre reparos, substituição de componentes originais e mão de obra especializada em nossa rede credenciada de assistência técnica em todo o território nacional.
                </Editable>
              </div>
            </div>

            <div className="warranty-cards-grid">
              <div className="warranty-badge-card">
                <div className="warranty-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#B5F500" strokeWidth="2" width="28" height="28">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <strong>Garantia de fábrica</strong>
                <Editable as="span" widgetId="product-control-46">12 meses de cobertura total</Editable>
              </div>

              <div className="warranty-badge-card">
                <div className="warranty-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#B5F500" strokeWidth="2" width="28" height="28">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <strong>Suporte técnico SAC</strong>
                <Editable as="span" widgetId="product-control-47">Atendimento direto com especialistas</Editable>
              </div>

              <div className="warranty-badge-card">
                <div className="warranty-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#B5F500" strokeWidth="2" width="28" height="28">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <strong>Atendimento pós-venda</strong>
                <Editable as="span" widgetId="product-control-48">Reposição de peças e acessórios originais</Editable>
              </div>
            </div>
          </div>
        </div>
      </Editable>

      </>}
      <Ads position="product-middle" />
      <ProductReviews reviews={isDemo ? DEMO_REVIEWS : []} demo={isDemo} />
      {/* ── 7. VOCÊ TAMBÉM PODE GOSTAR ── */}
      {related.length > 0 && (
        <div className="pd__footer-also-like">
          <div className="ui container">
            <Editable as="h2" widgetId="product-31" className="pd__footer-also-like-title">Você também pode gostar</Editable>
          </div>
          <div className="ui container">
            <div className="pd__footer-also-like-list">
              {related.map((rel) => {
                const relPrice = rel.promo_price || rel.price || 0
                return (
                  <Link
                    key={rel.id}
                    to={`/produtos/${rel.slug || rel.id}`}
                    className="pd__footer-also-like-item"
                  >
                    <div className="pd__footer-also-like-item-picture">
                      <img
                        src={rel.image_url || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&auto=format&fit=crop&q=80'}
                        alt={rel.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="pd__footer-also-like-item-content">
                      <h3 className="pd__footer-also-like-item-title">{rel.name}</h3>
                      {rel.description && (
                        <p className="pd__footer-also-like-item-description">
                          {rel.description.substring(0, 80)}...
                        </p>
                      )}
                      <div className="pd__footer-also-like-item-settlement">
                        <div className="pd__footer-also-like-item-price">
                          <span className="pd__footer-also-like-item-current-price">
                            {formatMoney(relPrice)}
                          </span>
                        </div>
                        <div className="pd__footer-also-like-item-cart-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <Ads position="product-footer" />
    </EditableFlow></div></PageWidgets>
  )
}
