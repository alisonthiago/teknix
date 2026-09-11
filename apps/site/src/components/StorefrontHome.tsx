import EditableFlow from './page-widgets/EditableFlow'
import { Editable, useWidgetEdit, usePageWidgetState } from './page-widgets/PageWidgets'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import './StorefrontHome.css'

import TeknixHeader from './TeknixHeader'
import TeknixFooter from './TeknixFooter'
import CartTray from './CartTray'
import CompareTray from './CompareTray'
import { Ads } from './Ads'
import StorefrontProductCard, { type CbProductItem } from './StorefrontProductCard'
import { OfferCountdown } from './ProductSignals'
import { getProducts } from '../services/products'
import { storefrontCard } from '../services/storefrontCommerce'
import type { Product } from '../types/database'
import { DEFAULT_WHATSAPP_SETTINGS, loadWhatsappSettings, type WhatsappSettings } from '../services/storeSettings'

interface MosaicoCategory {
  name: string
  link: string
  bgType: 'promo' | 'blue'
  iconUrl: string
  badge?: string
  badgeSub?: string
  is_cutout?: boolean
  promoBg?: string
  cardBg?: string
}

const DEFAULT_MOSAIC_CONTENT = {
  title: 'Categorias em Destaque',
  subtitle: 'Navegue pelas principais linhas e encontre a ferramenta certa para sua necessidade.',
  show_section_title: false,
  show_arrows: true,
  card_shape: 'rounded',
  card_size: 90,
  items: [
    {
      name: 'Macaco',
      link: '/produtos?q=macaco+hidraulico',
      bgType: 'normal',
      iconUrl: '/images/referencias/macaco-hidraulico.webp',
      is_cutout: true
    },
    {
      name: 'Morsa',
      link: '/produtos?q=morsa',
      bgType: 'normal',
      iconUrl: '/images/referencias/morsa-de-bancada.webp',
      is_cutout: true
    },
    {
      name: 'Pintura',
      link: '/produtos?q=pistola+de+pintura',
      bgType: 'normal',
      iconUrl: '/images/referencias/pistola-de-pintura.webp',
      is_cutout: true
    },
    {
      name: 'Lavagem',
      link: '/produtos?q=pistola+de+lavagem',
      bgType: 'normal',
      iconUrl: '/images/referencias/pistola-de-lavagem.webp',
      is_cutout: true
    },
    {
      name: 'Parafusadeira',
      link: '/produtos?q=parafusadeira',
      bgType: 'normal',
      iconUrl: '/images/referencias/parafusadeira.webp',
      is_cutout: true
    },
    {
      name: 'Lixadeira',
      link: '/produtos?q=lixadeira',
      bgType: 'normal',
      iconUrl: '/images/referencias/lixadeira.webp',
      is_cutout: true
    },
    {
      name: 'Macaco',
      link: '/produtos?q=macaco+hidraulico',
      bgType: 'normal',
      iconUrl: '/images/referencias/macaco-hidraulico.webp',
      is_cutout: true
    },
    {
      name: 'Parafusadeira',
      link: '/produtos?q=parafusadeira',
      bgType: 'normal',
      iconUrl: '/images/referencias/parafusadeira.webp',
      is_cutout: true
    }
  ]
}

const DEFAULT_FLASH_SALE_CONTENT = {
  title: 'Ofertas Relâmpago',
  subtitle: '',
  show_bolt: true,
  bolt_color: '#dc2626',
  bolt_size: 22,
  show_timer: true,
  timer_label: 'As ofertas se encerram em:',
  countdown_title: 'OFERTA RELÂMPAGO',
  end_date: '',
  product_source: 'auto',
  manual_skus: '',
  limit: 8,
  show_stars: true,
  show_old_price: true,
  show_discount_badge: true,
  show_pix: true,
  pix_text: 'à vista no Pix com desconto',
  show_arrow: true
}

export default function StorefrontHome() {
  // State das vitrines oficiais
  const [toastMessage] = useState<string | null>(null)
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsappSettings | null>(null)
  const [rawProducts, setRawProducts] = useState<Product[]>([])
  const [catalogProducts, setCatalogProducts] = useState<CbProductItem[]>([])

  useEffect(() => {
    let cancelled = false
    getProducts({ limit: 40 }).then(products => {
      if (cancelled) return
      const published = products.filter(p => p.store_meta?.published !== false)
      setRawProducts(published)
      setCatalogProducts(published.map(storefrontCard))
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    loadWhatsappSettings().then(settings => {
      if (!cancelled) setWhatsappSettings(settings)
    }).catch(() => {
      if (!cancelled) setWhatsappSettings(DEFAULT_WHATSAPP_SETTINGS)
    })
    return () => { cancelled = true }
  }, [])
  const flashSaleTrackRef = useRef<HTMLDivElement>(null)
  const mosaicoTrackRef = useRef<HTMLDivElement>(null)

  // Cronômetro dinâmico para Ofertas Relâmpago ⚡ (1:1 com referência Casas Bahia)
  const [timeLeft, setTimeLeft] = useState({ hours: 22, minutes: 2, seconds: 50 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Configurações administráveis das Ofertas Relâmpago ⚡ (HUB Page Builder)
  const flashSaleEdit = useWidgetEdit('home-flash-sale')
  const fsc = flashSaleEdit?.content || {}
  const fss = (flashSaleEdit?.style || {}) as Record<string, any>

  const countdownSeconds = useMemo(() => {
    if (fsc.end_date) {
      const endMs = new Date(fsc.end_date as string).getTime()
      const nowMs = Date.now()
      const diffSec = Math.floor((endMs - nowMs) / 1000)
      if (diffSec > 0) return diffSec
    }
    return timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds
  }, [fsc.end_date, timeLeft])

  const scrollMosaico = (dir: 1 | -1) => {
    if (mosaicoTrackRef.current) {
      mosaicoTrackRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' })
    }
  }

  // Configurações administráveis do Mosaico de Categorias (HUB Page Builder)
  const widgetState = usePageWidgetState()
  const mosaicEdit = useWidgetEdit('home-mosaic')
  const mc = (mosaicEdit?.content || {}) as Record<string, any>
  const ms = (mosaicEdit?.style || {}) as Record<string, any>

  const rawMosaicItems: any[] = useMemo(() => {
    if (Array.isArray(mc.items) && mc.items.length > 0) {
      return mc.items
    }
    return DEFAULT_MOSAIC_CONTENT.items
  }, [mc.items])

  const mosaicoCategories: MosaicoCategory[] = useMemo(() => {
    const cleaned = rawMosaicItems
      .map(item => ({
        ...item,
        name: String(item.name || item.title || '').replace(/\s*\((?:cópia|copia)\)/gi, '').trim()
      }))
      .filter(item => {
        const lower = item.name.toLowerCase()
        if (!item.name || lower === 'use: desconto') return false
        return true
      })
      .map(item => ({
        name: item.name,
        link: String(item.link || item.url || '/produtos'),
        bgType: (item.bgType === 'promo' ? 'promo' : 'blue') as 'promo' | 'blue',
        iconUrl: String(item.iconUrl || item.image || item.src || ''),
        badge: item.badge ? String(item.badge) : undefined,
        badgeSub: item.badgeSub ? String(item.badgeSub) : undefined,
        is_cutout: item.is_cutout !== false,
        promoBg: item.promoBg,
        cardBg: item.cardBg
      }))

    let list = cleaned.length > 0 ? cleaned : (DEFAULT_MOSAIC_CONTENT.items as unknown as MosaicoCategory[])

    // Garantir exatamente pelo menos 8 itens duplicando itens existentes conforme solicitado
    if (list.length > 0 && list.length < 8) {
      const needed = 8 - list.length
      const duplicates = list.slice(0, needed).map(item => ({ ...item }))
      list = [...list, ...duplicates]
    }

    return list
  }, [rawMosaicItems])

  const money = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // ── 1. PRODUTOS DAS OFERTAS RELÂMPAGO (SOMENTE DADOS REAIS DO SUPABASE — ZERO MOCK) ──
  const flashSaleItems = useMemo(() => {
    let targetList: any[] = []
    const source = (fsc.product_source as string) || 'auto'

    if (source === 'manual' && fsc.manual_skus) {
      const skus = String(fsc.manual_skus).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      targetList = rawProducts.filter(p => skus.includes(String(p.sku || '').toLowerCase()) || skus.includes(String(p.id || '').toLowerCase()))
    } else if (source === 'catalog') {
      targetList = rawProducts
    } else {
      // 'auto' (produtos reais com oferta ativa ou desconto promocional)
      const offerProducts = rawProducts.filter(p => {
        const hasOfferFlag = Boolean(p.commerce?.offerEnabled)
        const hasPromo = Boolean(p.promo_price && Number(p.promo_price) < Number(p.price))
        const hasBadgeOffer = p.commerce?.badge === 'daily' || p.commerce?.badge === 'special'
        return hasOfferFlag || hasPromo || hasBadgeOffer
      })
      targetList = offerProducts.length > 0 ? offerProducts : rawProducts
    }

    if (targetList.length === 0) {
      return []
    }

    const maxItems = Number(fsc.limit) || 8

    return targetList.slice(0, maxItems).map(p => {
      const base = Number(p.price) || 0
      const rawPromo = Number(p.promo_price) || 0
      const promo = rawPromo > 0 && rawPromo < base ? rawPromo : base
      const hasDiscount = promo < base && base > 0
      const discountPct = hasDiscount ? Math.round(((base - promo) / base) * 100) : null

      return {
        id: p.id,
        sku: p.sku,
        to: `/${encodeURIComponent(p.sku || p.slug || p.id)}`,
        title: p.name,
        img: p.image_url || p.images?.[0] || '',
        oldPrice: hasDiscount ? money(base) : null,
        discount: discountPct ? `Baixou ${discountPct}%` : 'Destaque',
        price: money(promo || base),
        ratingCount: p.store_meta?.reviews_count ? `(${p.store_meta.reviews_count})` : null,
        pixInfo: (fsc.pix_text as string) || 'à vista no Pix com desconto'
      }
    })
  }, [rawProducts, fsc.product_source, fsc.manual_skus, fsc.limit, fsc.pix_text])


  // Vitrines usam apenas produtos reais do catálogo — sem fallback hardcoded


  // ── Renderizador das Vitrines Verticais 1:1 (Compre hoje e Retire em 2h / Ofertas Mais Vendidas do Mês) ──
  const renderCbVerticalShelf = (
    widgetKey: string,
    title: string,
    products: CbProductItem[]
  ) => {
    const shelfLabel = widgetKey === 'featured' ? 'Vitrine: Produtos em Destaque' : 'Vitrine: Explore Nossos Produtos'
    return (
      <Editable
        widgetId={`${widgetKey}-shelf`}
        key={widgetKey}
        label={shelfLabel}
        widgetType="storefrontShelf"
        editorKind="container"
        globalKey="component:product-shelf"
        className="ui container fluid cb-shelf-section"
        content={{ title, limit: products.length, columns: 4 }}
      >
        <div className="ui container">
          <div className="cb-shelf-header">
            <h2 className="cb-shelf-title">{title}</h2>
          </div>
          <div className="cb-shelf-track-wrapper">
            <div className="cb-shelf-cards-grid">
              {(products.length % 2 ? [...products, {...products[0], id: `${products[0].id}-repeat`}] : products).map((p) => (
                <StorefrontProductCard instance={widgetKey} key={p.id} product={p} to={p.to} />
              ))}
            </div>
            <button
              className="cb-shelf-next-arrow"
              onClick={(event) => {
                const track = event.currentTarget.previousElementSibling as HTMLElement
                track.scrollTo({ left: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2 ? 0 : track.scrollLeft + track.clientWidth, behavior: 'smooth' })
              }}
              aria-label="Próximos produtos"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0033c6" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </Editable>
    )
  }

  return (
    <div className="hagor-home-root"><EditableFlow id="home" label="Home">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="hagor-toast" role="status">
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* ── 1. HEADER PADRÃO OFICIAL CASAS BAHIA / TEKNIX ── */}
      <Ads position="promo-bar" />
      <TeknixHeader />
      <Ads position="global-header" />

      {/* ── 2. BANNER PRINCIPAL ── */}
      <Ads position="home-hero" />

      {/* ── 3. CARROSSEL DE MOSAICOS / CATEGORIAS ── */}
      <Editable
        as="div"
        widgetId="home-mosaic"
        label="Mosaico de Categorias"
        widgetType="categoryMosaic"
        className="ui container fluid dsvia-mosaic-section"
        content={DEFAULT_MOSAIC_CONTENT}
        style={{
          ...(ms.background_color ? { backgroundColor: ms.background_color } : {}),
          ...(ms.padding_top ? { paddingTop: typeof ms.padding_top === 'number' ? `${ms.padding_top}px` : ms.padding_top } : {}),
          ...(ms.padding_bottom ? { paddingBottom: typeof ms.padding_bottom === 'number' ? `${ms.padding_bottom}px` : ms.padding_bottom } : {})
        }}
      >
        <div className="ui container">
          {mc.show_section_title && (
            <div className="dsvia-mosaic-header-group" style={{ marginBottom: 12 }}>
              {mc.title && <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: ms.title_color || '#000000' }}>{mc.title}</h2>}
              {mc.subtitle && <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{mc.subtitle}</p>}
            </div>
          )}

          <div
            className="dsvia-mosaic-wrapper"
            onClick={e => {
              if (widgetState?.preview) {
                if ((e.target as HTMLElement)?.closest?.('.dsvia-slider-arrow')) return
                e.preventDefault()
                e.stopPropagation()
                widgetState.select('home-mosaic')
              }
            }}
          >
            {mc.show_arrows !== false && (
              <button
                className="dsvia-slider-arrow prev"
                onClick={() => scrollMosaico(-1)}
                aria-label="Categorias anteriores"
                style={{
                  ...(ms.arrow_color ? { color: ms.arrow_color } : {}),
                  ...(ms.arrow_bg ? { backgroundColor: ms.arrow_bg } : {})
                }}
              >
                ‹
              </button>
            )}

            <div className="dsvia-mosaic-track" ref={mosaicoTrackRef}>
              {mosaicoCategories.map((cat, idx) => {
                const cardSize = Number(mc.card_size || 90)
                const cardBorderRadius = ms.card_border_radius
                  ? (typeof ms.card_border_radius === 'number' ? `${ms.card_border_radius}px` : ms.card_border_radius)
                  : (mc.card_shape === 'circle' ? '50%' : mc.card_shape === 'square' ? '8px' : '20px')

                const cardStyle: React.CSSProperties = {
                  width: `${cardSize}px`,
                  height: `${cardSize}px`,
                  borderRadius: cardBorderRadius,
                  ...(cat.bgType === 'promo'
                    ? {
                        backgroundColor: ms.promo_bg || cat.promoBg || undefined,
                        borderColor: ms.promo_border_color || undefined
                      }
                    : {
                        backgroundColor: ms.card_bg || cat.cardBg || undefined
                      })
                }

                return (
                  <Link
                    to={cat.link}
                    key={idx}
                    className="dsvia-mosaic-item"
                    style={{ width: `${Math.max(100, cardSize + 20)}px` }}
                    onClick={e => {
                      if (widgetState?.preview) {
                        e.preventDefault()
                        e.stopPropagation()
                        widgetState.select('home-mosaic')
                      }
                    }}
                  >
                    <div
                      className={`dsvia-mosaic-card ${cat.bgType === 'promo' ? 'promo' : ''} ${cat.is_cutout ? 'is-cutout' : ''}`}
                      style={cardStyle}
                    >
                      {cat.bgType === 'promo' ? (
                        <div className="mosaico-promo-inner">
                          <span className="mosaico-promo-badge">{cat.badge || 'PROMO'}</span>
                          <span className="mosaico-promo-off">{cat.badgeSub || 'OFF'}</span>
                        </div>
                      ) : (
                        cat.iconUrl ? <img src={cat.iconUrl} alt={cat.name} loading="lazy" /> : null
                      )}
                    </div>
                    <span
                      className="dsvia-mosaic-label"
                      style={{
                        ...(ms.label_color ? { color: ms.label_color } : {}),
                        ...(ms.label_font_size ? { fontSize: typeof ms.label_font_size === 'number' ? `${ms.label_font_size}px` : ms.label_font_size } : {}),
                        maxWidth: `${Math.max(100, cardSize + 20)}px`
                      }}
                    >
                      {cat.name}
                    </span>
                  </Link>
                )
              })}
            </div>

            {mc.show_arrows !== false && (
              <button
                className="dsvia-slider-arrow next"
                onClick={() => scrollMosaico(1)}
                aria-label="Próximas categorias"
                style={{
                  ...(ms.arrow_color ? { color: ms.arrow_color } : {}),
                  ...(ms.arrow_bg ? { backgroundColor: ms.arrow_bg } : {})
                }}
              >
                ›
              </button>
            )}
          </div>
        </div>
      </Editable>

      {/* Faixa compacta administrável: imagem única ou carrossel. */}
      <Ads position="home-promo-strip" />

      {/* ── 5. OFERTAS RELÂMPAGO ⚡ (SOMENTE SE HOUVER PRODUTOS REAIS CADASTRADOS) ── */}
      {flashSaleItems.length > 0 && (
        <Editable
          as="div"
          widgetId="home-flash-sale"
          label="Ofertas Relâmpago (com Cronômetro)"
          widgetType="flashSaleSection"
          className="ui container fluid flash-sale-section"
          id="ofertas-relampago"
          content={DEFAULT_FLASH_SALE_CONTENT}
          style={fss.background_color ? { backgroundColor: fss.background_color } : undefined}
        >
          <div className="ui container">
            <div className="flash-sale-header">
              <div className="flash-sale-title-group">
                <h2 className="flash-sale-title" style={fss.title_color ? { color: fss.title_color } : undefined}>
                  {String(fsc.title || 'Ofertas Relâmpago')}
                </h2>
                {fsc.show_bolt !== false && (
                  <svg
                    viewBox="0 0 24 24"
                    width={Number(fsc.bolt_size || 22)}
                    height={Number(fsc.bolt_size || 22)}
                    fill={fss.bolt_color || fsc.bolt_color || '#dc2626'}
                    className="flash-sale-bolt"
                  >
                    <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" />
                  </svg>
                )}
              </div>

              {fsc.show_timer !== false && (
                <div className="flash-sale-timer-wrap">
                  <span className="flash-sale-timer-label" style={fss.timer_label_color ? { color: fss.timer_label_color } : undefined}>
                    {String(fsc.timer_label || 'As ofertas se encerram em:')}
                  </span>
                  <OfferCountdown
                    seconds={countdownSeconds}
                    badgeTitle={String(fsc.countdown_title || 'OFERTA RELÂMPAGO')}
                    badgeBg={fss.countdown_badge_bg}
                    badgeColor={fss.countdown_badge_color}
                    boxBg={fss.countdown_box_bg}
                    boxColor={fss.countdown_box_color}
                  />
                </div>
              )}
            </div>

            {/* Carrossel Horizontal Compacto de Produtos em Oferta */}
            <div className="flash-sale-cards-track-wrap">
              <div className="flash-sale-cards-track" ref={flashSaleTrackRef}>
                {flashSaleItems.map((p) => (
                  <Link
                    key={p.id}
                    to={p.to || `/${encodeURIComponent((p as any).sku || (p as any).slug || p.id)}`}
                    className="flash-sale-card-item"
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      ...(fss.card_bg ? { background: fss.card_bg } : {}),
                      ...(fss.card_border ? { borderColor: fss.card_border } : {})
                    }}
                  >
                    <div className="flash-sale-card-img-box">
                      <img src={p.img} alt={p.title} loading="lazy" />
                    </div>
                    <div className="flash-sale-card-info">
                      <h3 className="flash-sale-card-title" style={fss.card_title_color ? { color: fss.card_title_color } : undefined}>
                        {p.title}
                      </h3>
                      {fsc.show_stars !== false && p.ratingCount && (
                        <div className="cb-stars-row">
                          <span className="cb-star" style={fss.stars_color ? { color: fss.stars_color } : undefined}>★</span>
                          <span className="cb-star" style={fss.stars_color ? { color: fss.stars_color } : undefined}>★</span>
                          <span className="cb-star" style={fss.stars_color ? { color: fss.stars_color } : undefined}>★</span>
                          <span className="cb-star" style={fss.stars_color ? { color: fss.stars_color } : undefined}>★</span>
                          <span className="cb-star" style={fss.stars_color ? { color: fss.stars_color } : undefined}>★</span>
                          <span className="cb-reviews-count">{p.ratingCount}</span>
                        </div>
                      )}
                      <div className="flash-sale-card-price-row">
                        {fsc.show_old_price !== false && p.oldPrice && (
                          <span className="flash-sale-old-price" style={fss.old_price_color ? { color: fss.old_price_color } : undefined}>
                            {p.oldPrice}
                          </span>
                        )}
                        {fsc.show_discount_badge !== false && p.discount && (
                          <span
                            className="flash-sale-discount-badge"
                            style={{
                              ...(fss.discount_badge_bg ? { background: fss.discount_badge_bg } : {}),
                              ...(fss.discount_badge_color ? { color: fss.discount_badge_color } : {})
                            }}
                          >
                            {p.discount}
                          </span>
                        )}
                      </div>
                      <div className="flash-sale-main-price" style={fss.price_color ? { color: fss.price_color } : undefined}>
                        {p.price}
                      </div>
                      {fsc.show_pix !== false && Boolean(p.pixInfo || fsc.pix_text) && (
                        <div className="flash-sale-pix-info" style={fss.pix_color ? { color: fss.pix_color } : undefined}>
                          {String(fsc.pix_text || p.pixInfo)}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {fsc.show_arrow !== false && (
                <button
                  className="flash-sale-next-arrow"
                  aria-label="Próximas ofertas"
                  style={{
                    ...(fss.arrow_bg ? { background: fss.arrow_bg } : {}),
                    ...(fss.arrow_border ? { borderColor: fss.arrow_border } : {})
                  }}
                  onClick={() => {
                    const track = flashSaleTrackRef.current
                    if (track) track.scrollTo({ left: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2 ? 0 : track.scrollLeft + track.clientWidth, behavior: 'smooth' })
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={fss.arrow_color || '#0033c6'} strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </Editable>
      )}

      {/* ── 6. VITRINE 1: PRODUTOS EM DESTAQUE ── */}
      {catalogProducts.length > 0 && renderCbVerticalShelf('featured', 'Produtos em destaque', catalogProducts.slice(0, 6))}

      {/* ── 7. VITRINE 2: EXPLORE NOSSOS PRODUTOS ── */}
      {catalogProducts.length > 6 && renderCbVerticalShelf('recommended', 'Explore nossos produtos', catalogProducts.slice(6, 12))}

      {/* ── 14. RODAPÉ OFICIAL CASAS BAHIA COMPLETO ── */}
      <Ads position="global-footer" />
      <TeknixFooter />

      {/* Cart Tray flutuante */}
      <CartTray />

      {/* Compare Tray flutuante */}
      <CompareTray />

      {/* ── 13. FLOATING WHATSAPP BUTTON ── */}
      {whatsappSettings?.enabled && /^\d{10,15}$/.test(whatsappSettings.phoneNumber.replace(/\D/g, '')) && (
        <a
          href={`https://api.whatsapp.com/send?phone=${whatsappSettings.phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(whatsappSettings.defaultMessage)}`}
          target="_blank"
          rel="noreferrer"
          className={`floatingWpp floatingWpp-${whatsappSettings.position}`}
          title="Fale conosco no WhatsApp"
          aria-label="Fale conosco no WhatsApp"
        >
          <svg className="floatingWpp-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path fill="#fff" d="M16 3.2A12.8 12.8 0 0 0 5.08 22.7L3.2 28.8l6.3-1.84A12.8 12.8 0 1 0 16 3.2Zm0 23.32a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-3.74 1.09 1.12-3.63-.25-.4A10.5 10.5 0 1 1 16 26.52Zm5.76-7.86c-.31-.16-1.83-.9-2.11-1-.28-.1-.49-.16-.7.16-.21.31-.8 1-.98 1.2-.18.21-.36.23-.67.08-.31-.16-1.32-.49-2.51-1.56-.93-.83-1.56-1.86-1.74-2.17-.18-.31-.02-.48.14-.64.14-.14.31-.36.46-.54.15-.18.2-.31.31-.52.1-.21.05-.39-.03-.54-.08-.16-.7-1.68-.96-2.3-.25-.6-.51-.52-.7-.53h-.59c-.21 0-.54.08-.82.39-.28.31-1.07 1.05-1.07 2.57s1.09 2.98 1.24 3.19c.15.21 2.14 3.27 5.18 4.58.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.83-.75 2.09-1.47.26-.72.26-1.34.18-1.47-.08-.13-.28-.21-.59-.36Z"/>
          </svg>
        </a>
      )}

      {/* Floating pill de pré-visualização quando ?ads-edit=1 */}
      {typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('ads-edit') === '1' || new URLSearchParams(window.location.search).get('editor') === '1') && (
        <aside className="teknix-ads-preview-floating-bar">
          <Editable as="span" widgetId="home-control-7">Visualização de Áreas de ADS Ativa (?ads-edit=1)</Editable>
          <a href="http://localhost:5174/hub/ads" className="teknix-ads-preview-return-hub">
            Voltar para o HUB
          </a>
        </aside>
      )}
    </EditableFlow>
    </div>
  )
}
