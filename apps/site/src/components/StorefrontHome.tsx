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
import { DEMO_SIGNALS, DEMO_REVIEWS } from '../services/demoProduct'
import { OfferCountdown } from './ProductSignals'
import { getProducts } from '../services/products'
import { storefrontCard } from '../services/storefrontCommerce'
import type { Product } from '../types/database'

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
      name: 'Use: DESCONTO',
      link: '/produtos',
      bgType: 'promo',
      badge: 'até 20%',
      badgeSub: 'OFF',
      iconUrl: '',
      promoBg: '#22c55e'
    },
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
    return rawMosaicItems.map(item => ({
      name: String(item.name || item.title || ''),
      link: String(item.link || item.url || '/produtos'),
      bgType: item.bgType === 'promo' ? 'promo' : 'blue',
      iconUrl: String(item.iconUrl || item.image || item.src || ''),
      badge: item.badge ? String(item.badge) : undefined,
      badgeSub: item.badgeSub ? String(item.badgeSub) : undefined,
      is_cutout: item.is_cutout !== false,
      promoBg: item.promoBg,
      cardBg: item.cardBg
    }))
  }, [rawMosaicItems])

  const money = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Mock de fallback se o catálogo estiver vazio (DEVE estar ANTES do useMemo que o referencia)
  const flashSaleProducts = [
    {
      id: 'flash-1',
      to: '/produtos',
      title: "Smart TV Samsung 32'' Polegadas HD...",
      img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=260&auto=format&fit=crop&q=80',
      oldPrice: 'R$ 1.319,00',
      discount: 'Baixou 10%',
      price: 'R$ 1.192,62',
      ratingCount: null,
      pixInfo: null
    },
    {
      id: 'flash-2',
      to: '/produtos',
      title: 'Geladeira Brastemp BRM46MK Frost Fre...',
      img: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=260&auto=format&fit=crop&q=80',
      oldPrice: 'R$ 3.407,11',
      discount: 'Baixou 9%',
      price: 'R$ 2.849,00',
      ratingCount: null,
      pixInfo: 'Exclusivo Pix 10% OFF'
    },
    {
      id: 'flash-3',
      to: '/produtos',
      title: 'Lavadora de Roupas Electrolux 11Kg LES...',
      img: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=260&auto=format&fit=crop&q=80',
      oldPrice: 'R$ 2.049,00',
      discount: 'Baixou 17%',
      price: 'R$ 1.699,00',
      ratingCount: '(7)',
      pixInfo: null
    },
    {
      id: 'flash-4',
      to: '/produtos',
      title: 'Fritadeira Elétrica Sem Óleo Air Fryer...',
      img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=260&auto=format&fit=crop&q=80',
      oldPrice: 'R$ 343,10',
      discount: 'Baixou 19%',
      price: 'R$ 278,07',
      ratingCount: '(283)',
      pixInfo: 'Exclusivo Pix 7% OFF'
    },
    {
      id: 'flash-5',
      to: '/produtos',
      title: 'Smartphone Motorola Moto G34 5G 128GB...',
      img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=260&auto=format&fit=crop&q=80',
      oldPrice: 'R$ 1.099,00',
      discount: 'Baixou 18%',
      price: 'R$ 899,00',
      ratingCount: '(112)',
      pixInfo: 'Exclusivo Pix'
    }
  ]

  // ── 1. PRODUTOS DAS OFERTAS RELÂMPAGO (AUTOMÁTICO / MANUAL / CATÁLOGO) ──
  const flashSaleItems = useMemo(() => {
    let targetList: any[] = []
    const source = (fsc.product_source as string) || 'auto'

    if (source === 'manual' && fsc.manual_skus) {
      const skus = String(fsc.manual_skus).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      targetList = rawProducts.filter(p => skus.includes(String(p.sku || '').toLowerCase()) || skus.includes(String(p.id || '').toLowerCase()))
      if (targetList.length === 0) {
        targetList = flashSaleProducts.filter(p => skus.includes(String(p.id).toLowerCase()) || skus.includes(String((p as any).sku || '').toLowerCase()))
      }
    } else if (source === 'catalog') {
      targetList = rawProducts.length > 0 ? rawProducts : flashSaleProducts
    } else {
      // 'auto' (produtos em oferta ou com desconto)
      const offerProducts = rawProducts.filter(p => {
        const hasOfferFlag = Boolean(p.commerce?.offerEnabled)
        const hasPromo = Boolean(p.promo_price && Number(p.promo_price) < Number(p.price))
        const hasBadgeOffer = p.commerce?.badge === 'daily' || p.commerce?.badge === 'special'
        return hasOfferFlag || hasPromo || hasBadgeOffer
      })
      targetList = offerProducts.length > 0 ? offerProducts : (rawProducts.length > 0 ? rawProducts : flashSaleProducts)
    }

    if (targetList.length === 0) {
      return flashSaleProducts
    }

    const maxItems = Number(fsc.limit) || 8

    return targetList.slice(0, maxItems).map(p => {
      if (p.price && !p.name) {
        return p
      }
      const base = Number(p.price) || 0
      const promo = Number(p.promo_price) || base
      const hasDiscount = promo < base && base > 0
      const discountPct = hasDiscount ? Math.round(((base - promo) / base) * 100) : null

      return {
        id: p.id,
        sku: p.sku,
        to: `/produtos/${encodeURIComponent(p.sku || p.id)}`,
        title: p.name,
        img: p.image_url || p.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=260&auto=format&fit=crop&q=80',
        oldPrice: hasDiscount ? money(base) : null,
        discount: discountPct ? `Baixou ${discountPct}%` : (p.commerce?.badge === 'bestseller' ? 'Mais Vendido' : null),
        price: money(promo),
        ratingCount: '(120)',
        pixInfo: (fsc.pix_text as string) || 'à vista no Pix com desconto'
      }
    })
  }, [rawProducts, fsc.product_source, fsc.manual_skus, fsc.limit, fsc.pix_text])

  // ── 2. PRODUTOS DA VITRINE: COMPRE HOJE E RETIRE EM 2H (1:1 COM SCREENSHOT 2) ──
  const retireEm2hProducts: CbProductItem[] = [
    {
      id: 'retire-1',
      topBadge: 'PRODUTO EXCLUSIVO',
      topBadgeType: 'circle-blue',
      title: 'Fritadeira Air Fryer Oven Mondial AFON-12L-FG 12L...',
      img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=320&auto=format&fit=crop&q=80',
      reviews: '(173)',
      oldPrice: 'R$ 571,00',
      discountBadge: 'Baixou 13%',
      installments: 'R$ 499,00 ou em até 10x de R$ 49,90 sem juros ou',
      pricePix: 'R$ 499,00',
      hasNoPixLabel: false,
      bottomTags: [{ text: 'RETIRA RÁPIDO', type: 'blue' }]
    },
    {
      id: 'retire-2',
      topBadge: null,
      title: 'Lixadeira roto-orbital — Demonstração',
      img: '/images/referencias/lixadeira.webp',
      reviews: '',
      signals: DEMO_SIGNALS,
      reviewData: DEMO_REVIEWS,
      oldPrice: null,
      discountBadge: null,
      installments: 'Imagem de exemplo • sem venda',
      pricePix: 'Prévia do produto',
      hasNoPixLabel: false,
      bottomTags: [{ text: 'Demonstração', type: 'yellow' }]
    },
    {
      id: 'retire-3',
      topBadge: '3% OFF',
      topBadgeType: 'pill-light-blue',
      title: 'Smart TV 43" AOC 43S5155/78G Full HD LED...',
      img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=320&auto=format&fit=crop&q=80',
      reviews: '(246)',
      oldPrice: 'R$ 1.834,92',
      discountBadge: 'Baixou 7%',
      installments: 'R$ 1.699,00 ou em até 10x de R$ 169,90 sem juros ou',
      pricePix: 'R$ 1.580,07',
      hasNoPixLabel: true,
      bottomTags: [
        { text: '*CONFIRA AS REGRAS', type: 'yellow' },
        { text: 'LANÇAMENTO★', type: 'blue' },
        { text: 'CARTÃO CASAS BAHIA*', type: 'blue' }
      ]
    },
    {
      id: 'retire-4',
      topBadge: null,
      title: 'Geladeira Consul CRM53MB Duplex Inverter 455L Frost...',
      img: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=320&auto=format&fit=crop&q=80',
      reviews: '(418)',
      oldPrice: 'R$ 3.664,45',
      discountBadge: 'Baixou 6%',
      installments: 'R$ 3.442,22 ou em até 10x de R$ 344,22 sem juros ou',
      pricePix: 'R$ 3.098,00',
      hasNoPixLabel: true,
      bottomTags: [
        { text: 'CARTÃO CASAS BAHIA*', type: 'blue' },
        { text: 'RETIRA RÁPIDO', type: 'blue' }
      ]
    },
    {
      id: 'retire-5',
      topBadge: null,
      title: 'Aspirador de Pó e Água Electrolux 1400W 12 Litros...',
      img: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=320&auto=format&fit=crop&q=80',
      reviews: '(8332)',
      oldPrice: 'R$ 306,90',
      discountBadge: 'Baixou 25%',
      installments: 'R$ 229,00 ou em até 4x de R$ 57,25 sem juros ou',
      pricePix: 'R$ 217,55',
      hasNoPixLabel: true,
      bottomTags: [{ text: 'RETIRA RÁPIDO', type: 'blue' }]
    }
  ]

  // ── 4. PRODUTOS DA VITRINE: INDICADOS COM BASE NAS SUAS VISITAS (SCREENSHOTS 1, 2, 3) ──
  const indicadosVisitasProducts: CbProductItem[] = [
    {
      id: 'ind-1',
      topBadge: '3% OFF',
      topBadgeType: 'pill-light-blue',
      title: 'Smart TV 43" Philco Roku TV LED FHD PTV43G7ER2CPBL',
      img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=320&auto=format&fit=crop&q=80',
      reviews: '(182)',
      oldPrice: 'R$ 1.749,00',
      discountBadge: 'Baixou 8%',
      installments: 'R$ 1.599,00 ou em até 10x de R$ 159,90 sem juros ou',
      pricePix: 'R$ 1.487,07',
      hasNoPixLabel: true,
      bottomTags: [{ text: '*CONFIRA AS REGRAS', type: 'yellow' }]
    },
    {
      id: 'ind-2',
      topBadge: null,
      title: 'Smart TV 50" Crystal UHD 4K Samsung 50DU7700 Gaming Hub',
      img: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=320&auto=format&fit=crop&q=80',
      reviews: '(734)',
      oldPrice: 'R$ 2.499,00',
      discountBadge: 'Baixou 12%',
      installments: 'R$ 2.199,00 ou em até 12x de R$ 183,25 sem juros ou',
      pricePix: 'R$ 2.089,05',
      hasNoPixLabel: true,
      bottomTags: [{ text: 'RETIRA RÁPIDO', type: 'blue' }]
    },
    {
      id: 'ind-3',
      topBadge: null,
      title: 'Lavadora de Roupas Brastemp 12Kg BWK12AB Branca',
      img: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=320&auto=format&fit=crop&q=80',
      reviews: '(512)',
      oldPrice: 'R$ 2.299,00',
      discountBadge: 'Baixou 10%',
      installments: 'R$ 1.999,00 ou em até 10x de R$ 199,90 sem juros ou',
      pricePix: 'R$ 1.899,05',
      hasNoPixLabel: true,
      bottomTags: [{ text: 'CARTÃO CASAS BAHIA*', type: 'blue' }]
    },
    {
      id: 'ind-4',
      topBadge: null,
      title: 'Smart TV 43" Full HD LED TCL 43S5400A Android TV HDR',
      img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=320&auto=format&fit=crop&q=80',
      reviews: '(98)',
      oldPrice: 'R$ 1.699,00',
      discountBadge: 'Baixou 5%',
      installments: 'R$ 1.589,00 ou em até 10x de R$ 158,90 sem juros ou',
      pricePix: 'R$ 1.499,00',
      hasNoPixLabel: true,
      bottomTags: [{ text: '*CONFIRA AS REGRAS', type: 'yellow' }]
    },
    {
      id: 'ind-5',
      topBadge: 'PRODUTO EXCLUSIVO',
      topBadgeType: 'circle-blue',
      title: 'Smart TV 55" 4K UHD LG 55UT8000 Processador α5 Gen 7 AI',
      img: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=320&auto=format&fit=crop&q=80',
      reviews: '(1420)',
      oldPrice: 'R$ 2.999,00',
      discountBadge: 'Baixou 15%',
      installments: 'R$ 2.549,00 ou em até 12x de R$ 212,41 sem juros ou',
      pricePix: 'R$ 2.399,00',
      hasNoPixLabel: true,
      bottomTags: [{ text: 'RETIRA RÁPIDO', type: 'blue' }]
    }
  ]

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

      {/* ── 2. CARROSSEL DE MOSAICOS / CATEGORIAS (1:1 COM SCREENSHOT 1) ── */}
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
              {mc.title && <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: ms.title_color || '#111827' }}>{mc.title}</h2>}
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

      {/* ── 3. BANNER PRINCIPAL GERENCIADO PELO HUB ── */}
      <Ads position="home-hero" />

      {/* Faixa compacta administrável: imagem única ou carrossel. */}
      <Ads position="home-promo-strip" />

      {/* ── 5. OFERTAS RELÂMPAGO ⚡ COM CRONÔMETRO (1:1 COM SCREENSHOT 1) ── */}
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
                  to={p.to || `/produtos/${encodeURIComponent((p as any).sku || p.id)}`}
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
                    {fsc.show_pix !== false && (p.pixInfo || fsc.pix_text) && (
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

      {/* ── 6. VITRINE 1: COMPRE HOJE E RETIRE EM 2H (SCREENSHOT 2) ── */}
      {renderCbVerticalShelf('featured', catalogProducts.length ? 'Produtos em destaque' : 'Compre hoje e Retire em 2h', catalogProducts.length ? catalogProducts.slice(0,6) : retireEm2hProducts)}

      {/* ── 7. VITRINE 2: INDICADOS COM BASE NAS SUAS VISITAS (SCREENSHOT 2) ── */}
      {renderCbVerticalShelf('recommended', catalogProducts.length ? 'Explore nossos produtos' : 'Indicados com base nas suas visitas', catalogProducts.length ? catalogProducts.slice(6).length ? catalogProducts.slice(6,12) : catalogProducts.slice(0,6) : indicadosVisitasProducts)}

      {/* ── 14. RODAPÉ OFICIAL CASAS BAHIA COMPLETO ── */}
      <Ads position="global-footer" />
      <TeknixFooter />

      {/* Cart Tray flutuante */}
      <CartTray />

      {/* Compare Tray flutuante */}
      <CompareTray />

      {/* ── 13. FLOATING WHATSAPP BUTTON ── */}
      <a
        href="https://api.whatsapp.com/send?phone=5546999155875&text=Ol%C3%A1%2C%20estou%20no%20site%20da%20TEKNIX"
        target="_blank"
        rel="noreferrer"
        className="floatingWpp"
        title="Fale conosco no WhatsApp"
        aria-label="Fale conosco no WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </a>

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
