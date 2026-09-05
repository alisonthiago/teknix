import {Editable, useWidgetEdit} from './page-widgets/PageWidgets'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './StorefrontHome.css'
import ProductSignals from './ProductSignals'
import type { ProductSignalsData, ProductReview } from '../services/productPresentation'
import type { Product } from '../types/database'
import { productPricing } from '../../../../packages/core/src/productCommerce'
import { commerceSignals } from '../services/storefrontCommerce'
import { useFavorites } from '../context/FavoritesContext'

export interface CbProductItem {
  images?: string[]
  to?: string
  commerceProduct?: Product
  signals?: ProductSignalsData
  reviewData?: ProductReview[]
  id: string
  title: string
  img: string
  reviews: string
  rating?: number | string
  ratingCount?: number | string
  oldPrice?: string | null
  discountBadge?: string | null
  installments?: string | null
  pricePix: string
  hasNoPixLabel?: boolean
  topBadge?: string | null
  topBadgeType?: string
  isSponsored?: boolean
  bottomTags?: { text: string; type: string }[]
}

function splitPrice(val: number) {
  const parts = Number(val || 0).toFixed(2).split('.')
  return {
    int: Number(parts[0]).toLocaleString('pt-BR'),
    cents: parts[1]
  }
}

export default function StorefrontProductCard({ product: p, to, instance="catalog" }: { product: CbProductItem; to?: string; instance?:string }) {
  const [hovered, setHovered] = useState(false)
  const [now, setNow] = useState(Date.now)
  const { isFavorite, toggleFavorite } = useFavorites()

  const fav = isFavorite(p.id)

  // Cálculo da avaliação (score, estrelas e total de avaliações)
  const getRatingInfo = () => {
    if (p.reviewData && p.reviewData.length > 0) {
      const sum = p.reviewData.reduce((acc, r) => acc + (r.rating || 5), 0)
      return {
        score: (sum / p.reviewData.length).toFixed(1),
        count: p.reviewData.length
      }
    }
    if (p.rating) {
      return {
        score: Number(p.rating).toFixed(1),
        count: p.ratingCount ? String(p.ratingCount).replace(/\D/g, '') : '84'
      }
    }
    // Hash determinístico baseado no id/título para avaliação realista consistente
    const seed = (p.id || p.title || '1').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const scores = ['4.8', '4.9', '4.7', '4.9', '4.8']
    const counts = [68, 124, 186, 245, 312, 420, 580, 890, 1420]
    return {
      score: scores[seed % scores.length],
      count: counts[seed % counts.length]
    }
  }

  const ratingInfo = getRatingInfo()

  useEffect(() => {
    if (!p.commerceProduct?.commerce?.offerEnabled) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [p.commerceProduct?.commerce?.offerEnabled])

  const pricing = p.commerceProduct ? productPricing(p.commerceProduct.price, p.commerceProduct.promo_price, p.commerceProduct.commerce, now) : null
  const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const alternate = p.images?.find(src => src !== p.img)

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite({
      id: p.id,
      name: p.title,
      price: pricing ? pricing.pix : Number(p.pricePix?.replace(/\D/g, '') || 0) / 100,
      promo_price: pricing ? pricing.pix : undefined,
      image_url: p.img,
      sku: p.id
    })
  }

  // Preços calculados
  const basePrice = pricing ? pricing.base : Number(p.oldPrice?.replace(/\D/g, '') || 0) / 100
  const currentPrice = pricing ? pricing.current : Number(p.pricePix?.replace(/\D/g, '') || 0) / 100
  const pixPrice = pricing ? pricing.pix : currentPrice
  const discountPercent = pricing ? pricing.discount : (p.discountBadge ? parseInt(p.discountBadge) : (basePrice > pixPrice && basePrice > 0 ? Math.round(((basePrice - pixPrice) / basePrice) * 100) : 0))

  const cardWidgetId = `card-${instance}-${p.id}`
  const cardEdit = useWidgetEdit(cardWidgetId, 'component:product-card')
  const rawTitle = (cardEdit?.content?.title as string) || p.title || ''
  const displayTitle = rawTitle.split('\n')[0].replace(/\s+\d{10,}$/, '').trim()
  const displayImg = (cardEdit?.content?.img as string) || (cardEdit?.content?.image as string) || (hovered && alternate ? alternate : p.img)
  const displayOldPrice = (cardEdit?.content?.oldPrice as string) ?? (basePrice > pixPrice && basePrice > 0 ? money(basePrice) : p.oldPrice || null)
  const displayDiscount = (cardEdit?.content?.discount as string) ?? (cardEdit?.content?.discountBadge as string) ?? (discountPercent > 0 ? `${discountPercent}% OFF` : p.discountBadge || null)

  const { int: pixInt, cents: pixCents } = splitPrice(pixPrice)

  // Vendas acumuladas para exibir no card (+100mil / +10mil / +1000 vendidos)
  const stockCount = p.commerceProduct?.stock ?? 15
  const soldLabel = stockCount > 50 ? '+100mil vendidos' : stockCount > 20 ? '+10mil vendidos' : stockCount > 5 ? '+1000 vendidos' : '+500 vendidos'

  const cardSchema = cardEdit?.schema || {}
  const [btnHovered, setBtnHovered] = useState(false)

  const showFav = cardSchema.show_favorite !== false
  const showPrice = cardSchema.show_price !== false
  const showOldPrice = cardSchema.show_old_price !== false
  const showDiscount = cardSchema.show_discount !== false
  const showInstallments = cardSchema.show_installments !== false
  const showRating = cardSchema.show_rating !== false
  const showShipping = cardSchema.show_shipping !== false
  const showButton = cardSchema.show_button === true || !!cardSchema.button_text
  const buttonText = (cardEdit?.content?.button_text as string) || cardSchema.button_text || 'Comprar Agora'
  const buttonLink = (cardEdit?.content?.button_link as string) || cardSchema.button_link || to || `/produtos/${p.id}`

  const cardCustomStyles: React.CSSProperties = {
    // Card container
    backgroundColor: cardSchema.card_bg || cardSchema.backgroundColor || 'var(--card-bg, #ffffff)',
    borderRadius: cardSchema.card_radius ? (typeof cardSchema.card_radius === 'number' ? `${cardSchema.card_radius}px` : cardSchema.card_radius) : 'var(--card-radius, 8px)',
    padding: cardSchema.card_padding ? (typeof cardSchema.card_padding === 'number' ? `${cardSchema.card_padding}px` : cardSchema.card_padding) : undefined,
    border: cardSchema.card_border_style && cardSchema.card_border_style !== 'none'
      ? `${cardSchema.card_border_width || 1}px ${cardSchema.card_border_style} ${cardSchema.card_border_color || '#e5e7eb'}`
      : undefined,
    boxShadow: cardSchema.card_box_shadow === 'none' ? 'none'
      : cardSchema.card_box_shadow === 'sm' ? '0 1px 3px rgba(0,0,0,0.06)'
      : cardSchema.card_box_shadow === 'md' ? '0 4px 12px rgba(0,0,0,0.08)'
      : cardSchema.card_box_shadow === 'lg' ? '0 8px 24px rgba(0,0,0,0.12)'
      : cardSchema.card_box_shadow || undefined,
    margin: cardSchema.margin_top || cardSchema.margin_bottom || cardSchema.margin_left || cardSchema.margin_right
      ? `${cardSchema.margin_top || 0}px ${cardSchema.margin_right || 0}px ${cardSchema.margin_bottom || 0}px ${cardSchema.margin_left || 0}px`
      : undefined,

    // CSS variables for inner elements
    ['--card-title-size' as any]: cardSchema.title_size ? (typeof cardSchema.title_size === 'number' ? `${cardSchema.title_size}px` : cardSchema.title_size) : undefined,
    ['--card-title-color' as any]: cardSchema.title_color || cardSchema.titleColor,
    ['--card-title-font' as any]: cardSchema.title_font_family || undefined,
    ['--card-title-weight' as any]: cardSchema.title_weight || undefined,
    ['--card-title-line-height' as any]: cardSchema.title_line_height || undefined,
    ['--card-title-transform' as any]: cardSchema.title_transform || undefined,
    ['--card-title-align' as any]: cardSchema.title_align || 'left',
    ['--card-title-margin-bottom' as any]: cardSchema.title_margin_bottom ? `${cardSchema.title_margin_bottom}px` : undefined,

    ['--card-price-size' as any]: cardSchema.price_size ? (typeof cardSchema.price_size === 'number' ? `${cardSchema.price_size}px` : cardSchema.price_size) : undefined,
    ['--card-price-color' as any]: cardSchema.price_color || cardSchema.priceColor,
    ['--card-price-weight' as any]: cardSchema.price_weight || undefined,
    ['--card-old-price-color' as any]: cardSchema.old_price_color || undefined,

    ['--card-star-size' as any]: cardSchema.star_size ? `${cardSchema.star_size}px` : '13px',
    ['--card-star-color' as any]: cardSchema.star_color || cardSchema.starColor || '#2563eb',
    ['--card-badge-bg' as any]: cardSchema.badge_bg || cardSchema.badgeBg,
    ['--card-badge-color' as any]: cardSchema.badge_color || cardSchema.badgeColor,
  }

  const TitleTag = (cardSchema.title_tag && /^(h[1-6]|p|span|div)$/.test(cardSchema.title_tag) ? cardSchema.title_tag : 'h3') as any
  const starSymbol = cardSchema.star_style === 'outline' ? '☆' : '★'

  const cardInner = (
    <>
      {/* Botão de Coração (Favoritos no canto superior direito do card) */}
      {showFav && (
        <Editable
          as="button"
          widgetId={`${cardWidgetId}-favorite`}
          globalKey="component:product-card:favorite"
          label="Ícone de favorito do card"
          widgetType="icon"
          content={{ icon: 'heart', icon_size: 18 }}
          renderContent={false}
          type="button"
          className={`cb-card-fav-btn ${fav ? 'is-fav' : ''}`}
          onClick={handleToggleFav}
          title={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <svg viewBox="0 0 24 24" fill={fav ? 'var(--site-favorite-active, #3483fa)' : 'rgba(255, 255, 255, 0.85)'} stroke={fav ? 'var(--site-favorite-active, #3483fa)' : '#6b7280'} strokeWidth="1.8" width="18" height="18">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </Editable>
      )}

      {/* Imagem do Produto */}
      <Editable
        as="div"
        widgetId={`${cardWidgetId}-img`}
        label={`Imagem: ${displayTitle ? displayTitle.slice(0, 20) : 'Produto'}`}
        widgetType="image"
        renderContent={false}
        content={{ src: displayImg, alt: displayTitle }}
        style={{ display: 'contents' }}
      >
        <div
          className="cb-card-img-wrap"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            borderRadius: cardSchema.img_radius ? `${cardSchema.img_radius}px` : undefined,
            border: cardSchema.img_border || undefined,
            maxWidth: cardSchema.img_width ? `${cardSchema.img_width}px` : undefined,
            height: cardSchema.img_height ? `${cardSchema.img_height}px` : undefined
          }}
        >
          <img
            src={displayImg}
            alt={displayTitle}
            loading="lazy"
            style={{
              borderRadius: cardSchema.img_radius ? `${cardSchema.img_radius}px` : undefined
            }}
          />
          {/* Selo único da Imagem (Oferta Relâmpago prioritária) */}
          <ProductSignals overlay data={p.commerceProduct ? commerceSignals(p.commerceProduct, now) : p.signals} />
        </div>
      </Editable>

      {/* Corpo do Card */}
      <div className="cb-card-body" style={{ textAlign: (cardSchema.title_align as any) || 'left' }}>
        {/* 1. Título do Produto */}
        <Editable
          as={TitleTag}
          widgetId={`${cardWidgetId}-title`}
          label={`Título: ${displayTitle ? displayTitle.slice(0, 20) : 'Produto'}`}
          widgetType="heading"
          renderContent={true}
          content={{ text: displayTitle }}
          className="cb-card-title"
          style={{
            fontSize: 'var(--card-title-size, inherit)',
            color: 'var(--card-title-color, inherit)',
            fontFamily: 'var(--card-title-font, inherit)',
            fontWeight: 'var(--card-title-weight, inherit)',
            lineHeight: 'var(--card-title-line-height, inherit)',
            textTransform: 'var(--card-title-transform, inherit)',
            textAlign: 'var(--card-title-align, left)' as any,
            marginBottom: 'var(--card-title-margin-bottom, 8px)'
          }}
        >
          {displayTitle}
        </Editable>

        {/* 2. Avaliação em Estrelas Azuis */}
        {showRating && (
          <Editable as="div" widgetId={`${cardWidgetId}-rating`} globalKey="component:product-card:rating" label="Avaliação do produto" widgetType="container" editorKind="container" renderContent={false} className="ml-card-rating-row" style={{ justifyContent: cardSchema.title_align === 'center' ? 'center' : cardSchema.title_align === 'right' ? 'flex-end' : 'flex-start' }}>
            <Editable as="span" widgetId={`${cardWidgetId}-rating-score`} globalKey="component:product-card:rating-score" label="Nota do produto" className="ml-card-rating-score" style={{ color: 'var(--card-star-color, #2563eb)', fontSize: cardSchema.review_count_size ? `${cardSchema.review_count_size}px` : undefined }}>
              {ratingInfo.score}
            </Editable>
            <Editable as="div" widgetId={`${cardWidgetId}-stars`} globalKey="component:product-card:stars" label="Estrelas do produto" widgetType="container" editorKind="container" renderContent={false} className="ml-card-stars" style={{ color: 'var(--card-star-color, #2563eb)', fontSize: 'var(--card-star-size, 13px)' }} aria-label={`Avaliação ${ratingInfo.score} de 5 estrelas`}>
              <span>{starSymbol}</span>
              <span>{starSymbol}</span>
              <span>{starSymbol}</span>
              <span>{starSymbol}</span>
              <span>{starSymbol}</span>
            </Editable>
            <Editable as="span" widgetId={`${cardWidgetId}-rating-count`} globalKey="component:product-card:rating-count" label="Quantidade de avaliações" className="ml-card-rating-count" style={{ fontSize: cardSchema.review_count_size ? `${cardSchema.review_count_size}px` : undefined }}>
              ({ratingInfo.count})
            </Editable>
          </Editable>
        )}

        {/* 3. Linha de Desconto e Preço Antigo */}
        {(showDiscount || showOldPrice) && (displayDiscount || displayOldPrice) && (
          <Editable as="div" widgetId={`${cardWidgetId}-discount-row`} globalKey="component:product-card:discount-row" label="Desconto e preço anterior" widgetType="container" editorKind="container" renderContent={false} className="ml-discount-line" style={{ justifyContent: cardSchema.title_align === 'center' ? 'center' : cardSchema.title_align === 'right' ? 'flex-end' : 'flex-start' }}>
            {showDiscount && displayDiscount && (
              <Editable as="span" widgetId={`${cardWidgetId}-discount`} globalKey="component:product-card:discount" label="Selo de desconto" className="ml-discount-badge" style={{ background: 'var(--card-badge-bg, rgba(0, 166, 80, 0.1))', color: 'var(--card-badge-color, #00a650)' }}>
                {displayDiscount}
              </Editable>
            )}
            {showOldPrice && displayOldPrice && (
              <Editable as="span" widgetId={`${cardWidgetId}-old-price`} globalKey="component:product-card:old-price" label="Preço anterior" className="ml-old-price" style={{ color: 'var(--card-old-price-color, #9ca3af)' }}>{displayOldPrice}</Editable>
            )}
          </Editable>
        )}

        {/* 3. Linha do Preço Principal + Vendidos */}
        {showPrice && (
          <Editable as="div" widgetId={`${cardWidgetId}-price-row`} globalKey="component:product-card:price-row" label="Preço e vendas" widgetType="container" editorKind="container" renderContent={false} className="ml-main-price-row" style={{ justifyContent: cardSchema.title_align === 'center' ? 'center' : cardSchema.title_align === 'right' ? 'flex-end' : 'space-between' }}>
            <Editable as="span" widgetId={`${cardWidgetId}-price`} globalKey="component:product-card:price" label="Preço atual"
              className="ml-current-price"
              style={{
                fontSize: 'var(--card-price-size, inherit)',
                color: 'var(--card-price-color, inherit)',
                fontWeight: 'var(--card-price-weight, inherit)'
              }}
            >
              R$ {pixInt}<sup className="ml-cents">{pixCents}</sup>
            </Editable>
            <Editable as="span" widgetId={`${cardWidgetId}-sold`} globalKey="component:product-card:sold" label="Quantidade vendida" className="ml-card-sold">{soldLabel}</Editable>
          </Editable>
        )}

        {/* 4. Linha de Condição de Pagamento */}
        {showInstallments && (
          pricing && pricing.commerce.installments > 1 ? (
            <Editable as="div" widgetId={`${cardWidgetId}-installments`} globalKey="component:product-card:installments" label="Parcelamento" widgetType="container" editorKind="container" renderContent={false} className="ml-installment-line">
              <Editable as="span" widgetId={`${cardWidgetId}-installments-text`} globalKey="component:product-card:installments-text" label="Texto do parcelamento" className="ml-installment-text">
                {pricing.commerce.installments}x {money(pricing.installment)} sem juros
              </Editable>
            </Editable>
          ) : (
            <Editable as="div" widgetId={`${cardWidgetId}-pix`} globalKey="component:product-card:pix" label="Condição de pagamento Pix" widgetType="container" editorKind="container" renderContent={false} className="ml-pix-block">
              <Editable as="div" widgetId={`${cardWidgetId}-pix-label`} globalKey="component:product-card:pix-label" label="Texto do Pix" className="ml-pix-label">à vista no Pix com desconto</Editable>
              {currentPrice !== pixPrice && (
                <Editable as="div" widgetId={`${cardWidgetId}-other-methods`} globalKey="component:product-card:other-methods" label="Outros meios de pagamento" className="ml-other-methods">ou {money(currentPrice)} em outros meios</Editable>
              )}
            </Editable>
          )
        )}

        {/* 5. Linha de Frete Grátis e Envio Rápido TEKNIX / Express */}
        {showShipping && (
          <Editable as="div" widgetId={`${cardWidgetId}-shipping`} globalKey="component:product-card:shipping" label="Informações de entrega" widgetType="container" editorKind="container" renderContent={false} className="ml-shipping-row" style={{ justifyContent: cardSchema.title_align === 'center' ? 'center' : cardSchema.title_align === 'right' ? 'flex-end' : 'flex-start' }}>
            <Editable as="span" widgetId={`${cardWidgetId}-shipping-tag`} globalKey="component:product-card:shipping-tag" label="Prazo de entrega" className="ml-shipping-tag">Chegará grátis amanhã</Editable>
            <Editable as="span" widgetId={`${cardWidgetId}-express`} globalKey="component:product-card:express" label="Selo Express"
              className="ml-full-badge teknix-express"
              style={{
                backgroundColor: cardSchema.express_bg || undefined,
                color: cardSchema.express_color || undefined
              }}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M13 2 4 14h7l-1 8 10-13h-7z" />
              </svg>
              {cardSchema.express_label || 'EXPRESS'}
            </Editable>
            <Editable as="span" widgetId={`${cardWidgetId}-shipping-sub`} globalKey="component:product-card:shipping-sub" label="Texto de envio" className="ml-shipping-sub">Envio Imediato</Editable>
          </Editable>
        )}

        {/* 6. Botão de Compra Customizado (Elementor Button Controls) */}
        {showButton && (
          <div style={{ marginTop: '10px' }}>
            <Editable
              as="div"
              widgetId={`${cardWidgetId}-btn`}
              label={`Botão: ${buttonText}`}
              widgetType="button"
              renderContent={false}
              content={{ text: buttonText, button_link: buttonLink }}
              style={{ display: 'block', width: '100%' }}
            >
              <a
                href={buttonLink}
                className="cb-card-custom-buy-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: cardSchema.btn_padding || '9px 16px',
                  backgroundColor: btnHovered ? (cardSchema.btn_hover_bg || '#1d4ed8') : (cardSchema.btn_bg || '#2563eb'),
                  color: btnHovered ? (cardSchema.btn_hover_color || '#ffffff') : (cardSchema.btn_color || '#ffffff'),
                  fontSize: cardSchema.btn_font_size ? `${cardSchema.btn_font_size}px` : '13px',
                  fontWeight: cardSchema.btn_font_weight || 600,
                  borderRadius: cardSchema.btn_radius ? `${cardSchema.btn_radius}px` : '6px',
                  border: cardSchema.btn_border || 'none',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                onClick={(e) => {
                  if (!to) {
                    e.preventDefault()
                    window.location.assign(buttonLink)
                  }
                }}
              >
                {buttonText}
              </a>
            </Editable>
          </div>
        )}
      </div>
    </>
  )

  return (
    <Editable
      as={to ? Link : 'div'}
      to={to}
      widgetId={cardWidgetId}
      globalKey="component:product-card"
      widgetType="storefrontCard"
      label={`Card: ${displayTitle ? displayTitle.slice(0, 32) : 'Produto'}`}
      productId={p.commerceProduct?.id || p.id}
      renderContent={false}
      className="cb-product-vertical-card"
      style={{
        color: 'inherit',
        textDecoration: 'none',
        ...cardCustomStyles
      }}
      content={{
        title: displayTitle,
        price: p.pricePix,
        oldPrice: displayOldPrice || '',
        discount: displayDiscount || '',
        img: displayImg,
        button_text: buttonText,
        button_link: buttonLink,
        productId: p.commerceProduct?.id || p.id
      }}
    >
      {cardInner}
    </Editable>
  )
}
