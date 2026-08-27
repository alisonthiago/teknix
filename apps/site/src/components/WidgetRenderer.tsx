import React, { useState, useEffect } from 'react'
import { getProducts } from '../services/products'
import type { Product } from '../types/database'
import {
  ShoppingBag, ArrowRight, ChevronRight, Sparkles, Zap, Star, Heart, Check, Download, Play, ExternalLink, Phone, Mail
} from 'lucide-react'


interface PageWidget {
  id: string
  container_id: string
  type: string
  order: number
  content: Record<string, unknown>
  style: Record<string, unknown> | React.CSSProperties
}

interface WidgetRendererProps {
  widget: PageWidget
  product?: Product
}

export function getProductPrice(product?: any): { price: number; promoPrice: number | null; isPromo: boolean } {
  if (!product) return { price: 0, promoPrice: null, isPromo: false }
  const meta = Array.isArray(product.store_meta) ? product.store_meta[0] : product.store_meta
  const salePrice = Number(meta?.sale_price ?? product.sale_price ?? product.sell_price ?? product.price ?? product.cost_purchase ?? 0)
  const promoPrice = meta?.promotional_price ?? product.promotional_price ?? product.promo_price ?? null
  const numPromo = promoPrice && Number(promoPrice) > 0 ? Number(promoPrice) : null
  const isPromo = numPromo !== null && numPromo < salePrice

  return { price: salePrice, promoPrice: numPromo, isPromo }
}

import { resolveDynamicTags } from '../services/styleEngine'

function resolveDynamicValue(value: unknown, product?: Product): unknown {
  if (typeof value !== 'string') return value
  if (value.includes('{{') || value.startsWith('product.')) {
    return resolveDynamicTags(value, { product })
  }
  return value
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

function buildInlineStyle(widget: any): React.CSSProperties {
  if (!widget) return {}
  const raw = (widget.style || {}) as Record<string, any>
  const settings = (widget.settings || {}) as Record<string, any>
  const s: React.CSSProperties = {}

  const fontFamily = widget.font_family || settings.font_family || raw.fontFamily
  if (fontFamily) s.fontFamily = fontFamily

  const fontSize = widget.font_size || settings.font_size || raw.fontSize
  if (fontSize) s.fontSize = fontSize

  const fontWeight = widget.font_weight || settings.font_weight || raw.fontWeight
  if (fontWeight) s.fontWeight = fontWeight

  const lineHeight = widget.line_height || settings.line_height || raw.lineHeight
  if (lineHeight) s.lineHeight = lineHeight

  const letterSpacing = widget.letter_spacing || settings.letter_spacing || raw.letterSpacing
  if (letterSpacing) s.letterSpacing = letterSpacing

  const textTransform = widget.text_transform || settings.text_transform || raw.textTransform
  if (textTransform && textTransform !== 'none') s.textTransform = textTransform

  const textAlign = widget.text_align || settings.text_align || widget.content?.align || widget.content?.text_align || raw.textAlign
  if (textAlign) s.textAlign = textAlign

  const color = widget.color || settings.color || raw.color
  if (color) s.color = color

  const bgType = widget.bg_type || settings.bg_type || raw.bg_type
  const bgColor = widget.bg_color || settings.bg_color || raw.backgroundColor || raw.bg_color
  const bgGradient = widget.bg_gradient || settings.bg_gradient || raw.background
  const bgImage = widget.bg_image || settings.bg_image || raw.backgroundImage

  if (bgType === 'gradient' && bgGradient) {
    s.background = bgGradient
  } else if (bgType === 'image' && bgImage) {
    s.background = `url(${bgImage}) center/cover`
  } else if (bgColor && bgColor !== 'transparent') {
    s.backgroundColor = bgColor
  }

  const pTop = widget.padding_top || settings.padding_top || raw.paddingTop || '0'
  const pRight = widget.padding_right || settings.padding_right || raw.paddingRight || '0'
  const pBottom = widget.padding_bottom || settings.padding_bottom || raw.paddingBottom || '0'
  const pLeft = widget.padding_left || settings.padding_left || raw.paddingLeft || '0'
  if (pTop !== '0' || pRight !== '0' || pBottom !== '0' || pLeft !== '0') {
    s.padding = `${pTop} ${pRight} ${pBottom} ${pLeft}`
  }

  const mTop = widget.margin_top || settings.margin_top || raw.marginTop || '0'
  const mRight = widget.margin_right || settings.margin_right || raw.marginRight || '0'
  const mBottom = widget.margin_bottom || settings.margin_bottom || raw.marginBottom || '0'
  const mLeft = widget.margin_left || settings.margin_left || raw.marginLeft || '0'
  if (mTop !== '0' || mRight !== '0' || mBottom !== '0' || mLeft !== '0') {
    s.margin = `${mTop} ${mRight} ${mBottom} ${mLeft}`
  }

  if (widget.width || settings.width || raw.width) s.width = widget.width || settings.width || raw.width
  if (widget.max_width || settings.max_width || raw.maxWidth) s.maxWidth = widget.max_width || settings.max_width || raw.maxWidth
  if (widget.min_width || settings.min_width || raw.minWidth) s.minWidth = widget.min_width || settings.min_width || raw.minWidth
  if (widget.height || settings.height || raw.height) s.height = widget.height || settings.height || raw.height
  if (widget.min_height || settings.min_height || raw.minHeight) s.minHeight = widget.min_height || settings.min_height || raw.minHeight
  if (widget.max_height || settings.max_height || raw.maxHeight) s.maxHeight = widget.max_height || settings.max_height || raw.maxHeight

  const borderStyle = widget.border_style || settings.border_style || widget.border_type || raw.borderStyle
  const borderWidth = widget.border_width || settings.border_width || raw.borderWidth || '1px'
  const borderColor = widget.border_color || settings.border_color || raw.borderColor || '#e8e8ed'
  if (borderStyle && borderStyle !== 'none') {
    s.border = `${borderWidth} ${borderStyle} ${borderColor}`
  }

  const borderRadius = widget.border_radius || settings.border_radius || raw.borderRadius
  if (borderRadius) s.borderRadius = borderRadius

  const boxShadow = widget.box_shadow || settings.box_shadow || raw.boxShadow
  if (boxShadow) s.boxShadow = boxShadow

  const opacity = widget.opacity || settings.opacity || raw.opacity
  if (opacity !== undefined && opacity !== '') s.opacity = opacity as any

  return s
}

export default function WidgetRenderer({ widget, product }: WidgetRendererProps) {
  const { type, content } = widget
  const s = buildInlineStyle(widget)
  
  const rawStyle = (widget.style || {}) as Record<string, any>
  const classes = []
  if (rawStyle.custom_class || (widget as any).custom_class) classes.push(rawStyle.custom_class || (widget as any).custom_class)
  if (rawStyle.animation_type && rawStyle.animation_type !== 'none') {
    classes.push(`animate-${rawStyle.animation_type}`)
  }
  if (rawStyle.hide_on_desktop || (widget as any).hide_on_desktop) classes.push('hide-desktop')
  if (rawStyle.hide_on_tablet || (widget as any).hide_on_tablet) classes.push('hide-tablet')
  if (rawStyle.hide_on_mobile || (widget as any).hide_on_mobile) classes.push('hide-mobile')
  
  const className = classes.join(' ')
  const id = rawStyle.html_id || (widget as any).html_id || undefined

  switch (type) {
    case 'heading': {
      const Tag = ((content.tag as string) || 'h2') as any
      const text = resolveDynamicValue(content.text, product) as string
      return <Tag id={id} className={className} style={{ letterSpacing: '-0.03em', lineHeight: '1.1', width: '100%', ...s }}>{text}</Tag>
    }

    case 'text': {
      const text = resolveDynamicValue(content.text, product) as string
      return (
        <div id={id} className={className} style={{ color: '#6e6e73', lineHeight: '1.7', width: '100%', ...s }} dangerouslySetInnerHTML={{ __html: text || '' }} />
      )
    }

    case 'image': {
      const src = resolveDynamicValue(content.image || (content as any).url, product) as string
      const alt = resolveDynamicValue(content.alt, product) as string
      const imgAlign = s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start'
      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: imgAlign }}>
          <img
            id={id}
            className={className}
            src={src}
            alt={alt || ''}
            style={{
              maxWidth: '100%',
              borderRadius: 12,
              display: 'block',
              ...s
            }}
            loading="lazy"
          />
        </div>
      )
    }

    case 'button': {
      const label = resolveDynamicValue(content.label || content.text, product) as string
      const align = s.textAlign || 'left'
      const btnAlign = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
      const isJustify = align === 'justify' || content.full_width
      const iconName = content.icon as string | undefined
      const iconPos = (content.icon_position as string) || 'before'
      const iconSpacing = Number(content.icon_spacing) || 8
      const iconSize = Number(content.icon_size) || 16
      const href = (content.button_link as string) || (content.link as string) || (content.url as string) || '#'
      const openNewTab = !!content.open_in_new_tab
      const isNofollow = !!content.nofollow

      const renderIcon = (name?: string) => {
        if (!name || name === 'none') return null
        switch (name) {
          case 'shopping-bag': return <ShoppingBag size={iconSize} />
          case 'arrow-right': return <ArrowRight size={iconSize} />
          case 'chevron-right': return <ChevronRight size={iconSize} />
          case 'sparkles': return <Sparkles size={iconSize} />
          case 'zap': return <Zap size={iconSize} />
          case 'star': return <Star size={iconSize} />
          case 'heart': return <Heart size={iconSize} />
          case 'check': return <Check size={iconSize} />
          case 'download': return <Download size={iconSize} />
          case 'play': return <Play size={iconSize} />
          case 'external-link': return <ExternalLink size={iconSize} />
          case 'phone': return <Phone size={iconSize} />
          case 'mail': return <Mail size={iconSize} />
          default: return null
        }
      }

      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: isJustify ? 'stretch' : btnAlign }}>
          <a
            href={href}
            target={openNewTab ? '_blank' : undefined}
            rel={isNofollow ? 'nofollow noopener noreferrer' : (openNewTab ? 'noopener noreferrer' : undefined)}
            style={{ textDecoration: 'none', width: isJustify ? '100%' : 'auto' }}
          >
            <button
              id={id}
              className={className}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: iconSpacing,
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '14px 28px',
                borderRadius: 980,
                cursor: 'pointer',
                background: '#1d1d1f',
                color: '#fff',
                border: 'none',
                width: isJustify ? '100%' : 'auto',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                ...s
              }}
            >
              {iconPos === 'before' && renderIcon(iconName)}
              <span>{label || 'Clique aqui'}</span>
              {iconPos === 'after' && renderIcon(iconName)}
            </button>
          </a>
        </div>
      )
    }

    case 'spacer':
      return <div style={{ height: (content.height as number) || 50, ...s }} />

    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #e8e8ed', ...s }} />

    case 'video': {
      const url = resolveDynamicValue(content.url || content.video_url, product) as string
      return url ? (
        <iframe src={url} style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 12, ...s }} allowFullScreen />
      ) : (
        <div style={{ background: '#f5f5f7', padding: 40, textAlign: 'center', borderRadius: 12, color: '#86868b', ...s }}>
          Vídeo
        </div>
      )
    }

    case 'icon':
      return <span style={{ fontSize: '2rem', ...s }}>{String(content.icon || '')}</span>

    case 'product': {
      const name = resolveDynamicValue(content.name || 'product.name', product) as string
      const { price, promoPrice, isPromo } = getProductPrice(product)
      const image = resolveDynamicValue(content.image || 'product.image_url', product) as string
      return (
        <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...s }}>
          {image && <img src={image} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />}
          <div style={{ padding: 20 }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4, color: '#1d1d1f' }}>{name || 'Produto'}</p>
            {isPromo ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontWeight: 800, color: '#00cc6a', fontSize: '1.1rem' }}>{formatPrice(promoPrice!)}</span>
                <span style={{ fontSize: '0.85rem', color: '#86868b', textDecoration: 'line-through' }}>{formatPrice(price)}</span>
              </div>
            ) : (
              Boolean(price) && <p style={{ fontWeight: 700, color: '#1d1d1f' }}>{formatPrice(price)}</p>
            )}
          </div>
        </div>
      )
    }

    case 'productHero': {
      const name = (resolveDynamicValue('product.name', product) as string) || (content.title as string) || 'Produto TEKNIX'
      const image = (resolveDynamicValue('product.image_url', product) as string) || (content.image as string)
      const sku = (resolveDynamicValue('product.sku', product) as string) || (content.sku as string)
      const description = (resolveDynamicValue('product.description', product) as string) || (content.description as string) || (resolveDynamicValue('product.notes', product) as string)
      const { price, promoPrice, isPromo } = getProductPrice(product)
      const stock = Number(resolveDynamicValue('product.stock', product) || 0)

      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center', ...s }}>
          <div style={{ background: '#f5f5f7', borderRadius: 24, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 340 }}>
            {image ? (
              <img src={image} alt={name} style={{ maxWidth: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 16 }} />
            ) : (
              <div style={{ fontSize: '4rem', opacity: 0.3 }}>📦</div>
            )}
          </div>
          <div>
            {sku && <p style={{ color: '#86868b', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>SKU: {sku}</p>}
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1 }}>{name}</h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              {isPromo ? (
                <>
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#00cc6a', letterSpacing: '-0.02em' }}>{formatPrice(promoPrice!)}</span>
                  <span style={{ fontSize: '1.2rem', color: '#86868b', textDecoration: 'line-through' }}>{formatPrice(price)}</span>
                  <span style={{ background: '#e6f9f0', color: '#00cc6a', padding: '4px 10px', borderRadius: 980, fontSize: 12, fontWeight: 700 }}>OFERTA</span>
                </>
              ) : (
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.02em' }}>{formatPrice(price || Number(content.price) || 0)}</span>
              )}
            </div>
            {stock > 0 ? (
              <p style={{ color: '#00cc6a', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                ● Em estoque ({stock} un.)
              </p>
            ) : (
              <p style={{ color: '#86868b', fontSize: 13, marginBottom: 20 }}>Disponível sob consulta</p>
            )}
            {description && <p style={{ color: '#6e6e73', lineHeight: 1.7, marginBottom: 24, fontSize: '0.95rem' }}>{description.substring(0, 300)}</p>}
            <a href={`/produtos/${sku || product?.id || ''}`} style={{ textDecoration: 'none' }}>
              <button style={{ background: '#1d1d1f', color: '#fff', padding: '14px 32px', borderRadius: 980, border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                {String(content.button_text || 'Comprar Agora')}
              </button>
            </a>
          </div>
        </div>
      )
    }


    case 'orderItem': {
      const itemName = (resolveDynamicValue(content.name || 'product.name', product) as string) || 'Produto'
      const itemImage = (resolveDynamicValue(content.image || 'product.image_url', product) as string) || ''
      const { price: itemPrice, promoPrice: itemPromoPrice, isPromo: itemIsPromo } = getProductPrice(product)
      const displayItemPrice = itemIsPromo ? itemPromoPrice : (itemPrice || Number(content.price) || 0)
      const itemQty = Number(content.quantity) || 1
      const orderNum = (content.order_number as string) || 'W849204128'
      const orderDate = (content.order_date as string) || '25/08/2026'
      const statusText = (content.status_text as string) || 'Pagamento Aprovado'
      const statusPaid = content.status_paid !== false
      const trackingCode = (content.tracking_code as string) || 'BR948291048TK'
      const showHeader = content.show_header !== false
      const showFooter = content.show_footer !== false
      const shippingLabel = (content.shipping_label as string) || 'Faça seu pedido.'
      const shippingDate = (content.shipping_date as string) || '21 Set. — 28 Set.'
      const shippingFree = content.shipping_free !== false
      const shippingPrice = Number(content.shipping_price) || 0

      return (
        <div
          id={id}
          className={`apple-order-tile ${className}`}
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #d2d2d7',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
            ...s,
          }}
        >
          {showHeader && (
            <div
              className="apple-order-tile-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: '1px solid #e8e8ed',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div className="tile-header-left" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="tile-order-num" style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                  Pedido nº {orderNum}
                </span>
                <span className="tile-order-date" style={{ fontSize: 12, color: '#86868b' }}>
                  Realizado em {orderDate}
                </span>
              </div>
              <div className="tile-header-right">
                <span
                  className={`tile-status-badge ${statusPaid ? 'paid' : ''}`}
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 980,
                    fontSize: 12,
                    fontWeight: 600,
                    background: statusPaid ? '#e6f9f0' : '#fff3cd',
                    color: statusPaid ? '#00cc6a' : '#b45309',
                  }}
                >
                  {statusText}
                </span>
              </div>
            </div>
          )}

          <div
            className="apple-order-tile-items"
            style={{ padding: '16px 20px' }}
          >
            <div
              className="apple-order-product-row"
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              <div
                className="product-image-box"
                style={{
                  width: 120,
                  height: 120,
                  flexShrink: 0,
                  background: '#f5f5f7',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {itemImage ? (
                  <img
                    alt={itemName}
                    src={itemImage}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                    loading="lazy"
                  />
                ) : (
                  <span style={{ fontSize: '2rem', opacity: 0.3 }}>📦</span>
                )}
              </div>

              <div
                className="product-info-box"
                style={{ flex: 1, minWidth: 0 }}
              >
                <h3
                  className="product-title"
                  style={{
                    margin: '0 0 6px',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#1d1d1f',
                    lineHeight: 1.3,
                  }}
                >
                  {itemName}
                </h3>
                <p
                  className="product-meta"
                  style={{
                    margin: '0 0 4px',
                    fontSize: 13,
                    color: '#6e6e73',
                  }}
                >
                  Quantidade: {itemQty}
                </p>
                <p
                  className="product-price"
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#1d1d1f',
                  }}
                >
                  {Boolean(displayItemPrice) && formatPrice(displayItemPrice!)}
                </p>
              </div>
            </div>
          </div>

          {showFooter && (
            <div
              className="apple-order-tile-footer"
              style={{
                borderTop: '1px solid #e8e8ed',
                padding: '14px 20px',
              }}
            >
              <div
                className="footer-total"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1d1d1f',
                  marginBottom: 10,
                }}
              >
                Total: <strong>{Boolean(displayItemPrice) && formatPrice(displayItemPrice!)}</strong>
              </div>

              <div
                className="footer-actions"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {Boolean(trackingCode) && (
                  <span
                    className="tracking-info"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: '#6e6e73',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                      <circle cx="17" cy="18" r="2" />
                      <circle cx="7" cy="18" r="2" />
                    </svg>
                    Rastreamento: <code style={{ fontFamily: 'monospace', background: '#f5f5f7', padding: '1px 5px', borderRadius: 4 }}>{trackingCode}</code>
                  </span>
                )}

                {Boolean(shippingLabel) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#6e6e73' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <rect width="16" height="13" x="6" y="4" rx="2" />
                      <path d="m22 7-7.5 5L13 7" />
                    </svg>
                    <div>
                      <span>{shippingLabel} Entrega em</span>{' '}
                      <span style={{ color: '#1d1d1f', fontWeight: 500 }}>{shippingDate}</span>
                      {shippingFree && (
                        <span style={{ color: '#6e6e73' }}> — <strong style={{ color: '#1d1d1f' }}>Grátis</strong></span>
                      )}
                      {!shippingFree && shippingPrice > 0 && (
                        <span style={{ color: '#6e6e73' }}> — {formatPrice(shippingPrice)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <style>{`
            @media (max-width: 600px) {
              .apple-order-tile .apple-order-product-row {
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
              }
              .apple-order-tile .product-image-box {
                width: 100% !important;
                height: 180px !important;
              }
              .apple-order-tile .product-info-box {
                text-align: center !important;
              }
              .apple-order-tile .apple-order-tile-header {
                flex-direction: column !important;
                align-items: flex-start !important;
              }
            }
          `}</style>
        </div>
      )
    }

    case 'productGrid':
      return <DynamicProductGrid content={content} style={s} />

    case 'categories':
      return (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', ...s }}>
          {(Array.isArray(content.categories) ? content.categories : ['Ferramentas', 'Informática', 'Casa']).map((cat: string) => (
            <div key={cat} style={{ background: '#f5f5f7', borderRadius: 18, padding: 20, minWidth: 140, textAlign: 'center', fontWeight: 600, color: '#1d1d1f', cursor: 'pointer', transition: 'all 0.2s' }}>
              {cat}
            </div>
          ))}
        </div>
      )

    case 'cta':
      return (
        <div style={{ background: (content.bg_color as string) || '#1d1d1f', color: '#fff', padding: '60px 32px', textAlign: 'center', borderRadius: 24, ...s }}>
          {Boolean(content.cta_title) && <h2 style={{ margin: '0 0 12px', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{String(content.cta_title)}</h2>}
          {Boolean(content.cta_text) && <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.7)' }}>{String(content.cta_text)}</p>}
          {Boolean(content.cta_button) && (
            <a href={content.cta_link as string || '#'} style={{ textDecoration: 'none' }}>
              <button style={{ background: '#fff', color: (content.bg_color as string) || '#1d1d1f', border: 'none', padding: '14px 28px', borderRadius: 980, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                {String(content.cta_button)}
              </button>
            </a>
          )}
        </div>
      )

    case 'html':
      return <div style={s} dangerouslySetInnerHTML={{ __html: (content.html_code as string) || '' }} />

    case 'gallery':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, ...s }}>
          {(Array.isArray(content.gallery_items) ? content.gallery_items : []).map((item: Record<string, unknown>, i: number) => (
            <img key={i} src={(item.image as string) || ''} alt={(item.alt as string) || ''} style={{ width: '100%', borderRadius: 12, objectFit: 'cover', aspectRatio: '1' }} loading="lazy" />
          ))}
        </div>
      )

    case 'carousel':
      return (
        <div style={{ display: 'flex', overflowX: 'auto', gap: 16, scrollSnapType: 'x mandatory', paddingBottom: 8, ...s }}>
          {(Array.isArray(content.carousel_items) ? content.carousel_items : []).map((item: Record<string, unknown>, i: number) => (
            <div key={i} style={{ minWidth: 320, borderRadius: 12, scrollSnapAlign: 'start', overflow: 'hidden' }}>
              {Boolean(item.image) && <img src={item.image as string} alt="" style={{ width: '100%', objectFit: 'cover' }} />}
              {Boolean(item.title) && <div style={{ padding: 16 }}><h4 style={{ margin: 0, color: '#1d1d1f' }}>{String(item.title)}</h4></div>}
            </div>
          ))}
        </div>
      )

    case 'faq':
      return (
        <div style={{ maxWidth: 720, ...s }}>
          {(Array.isArray(content.faq_items) ? content.faq_items : []).map((item: Record<string, unknown>, i: number) => (
            <details key={i} style={{ borderBottom: '1px solid #e8e8ed', padding: '20px 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#1d1d1f', fontSize: '1.05rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {String(item.question || '')}
                <span style={{ color: '#86868b', fontSize: '1.2rem' }}>+</span>
              </summary>
              <p style={{ marginTop: 12, color: '#6e6e73', lineHeight: 1.7 }}>{String(item.answer || '')}</p>
            </details>
          ))}
        </div>
      )

    case 'testimonials':
      return (
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8, ...s }}>
          {(Array.isArray(content.testimonials) ? content.testimonials : []).map((item: Record<string, unknown>, i: number) => (
            <div key={i} style={{ minWidth: 280, background: '#f5f5f7', borderRadius: 18, padding: 28 }}>
              <p style={{ fontStyle: 'italic', color: '#1d1d1f', lineHeight: 1.6 }}>"{String(item.text || '')}"</p>
              <p style={{ fontWeight: 600, marginTop: 12, color: '#6e6e73', fontSize: '0.9rem' }}>— {String(item.author || '')}</p>
            </div>
          ))}
        </div>
      )

    case 'specifications': {
      const items = (content.spec_items || content.items) as any
      return (
        <div style={{ maxWidth: 720, ...s }}>
          {(Array.isArray(items) ? items : []).map((item: Record<string, unknown>, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #e8e8ed' }}>
              <span style={{ fontWeight: 600, color: '#1d1d1f', width: '40%' }}>{String(item.label || '')}</span>
              <span style={{ color: '#6e6e73', width: '60%', textAlign: 'right' }}>{String(item.value || '')}</span>
            </div>
          ))}
        </div>
      )
    }

    case 'banner':
      return (
        <div style={{
          background: content.image ? `url(${content.image}) center/cover` : (content.bg_color as string) || '#f5f5f7',
          color: content.image ? '#fff' : '#1d1d1f',
          padding: '80px 32px',
          textAlign: 'center',
          borderRadius: 24,
          ...s,
        }}>
          {Boolean(content.title) && <h1 style={{ margin: '0 0 12px', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{String(content.title)}</h1>}
          {Boolean(content.subtitle) && <p style={{ margin: 0, opacity: 0.8 }}>{String(content.subtitle)}</p>}
        </div>
      )

    case 'newsletter':
      return (
        <div style={{ background: '#f5f5f7', padding: 48, borderRadius: 24, textAlign: 'center', ...s }}>
          {Boolean(content.title) && <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>{String(content.title)}</h3>}
          {Boolean(content.text) && <p style={{ margin: '0 0 24px', color: '#6e6e73' }}>{String(content.text)}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
            <input type="email" placeholder="Seu e-mail" style={{ flex: 1, padding: '12px 16px', borderRadius: 980, border: '1px solid #d2d2d7', fontSize: '0.9rem', outline: 'none' }} />
            <button style={{ background: '#1d1d1f', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 980, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              {String(content.btn_text || 'Inscrever')}
            </button>
          </div>
        </div>
      )

    case 'price': {
      const { price, promoPrice, isPromo } = getProductPrice(product)
      const displayPrice = isPromo ? promoPrice : (price || Number(content.price) || 0)
      return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, ...s }}>
          {isPromo && <span style={{ fontSize: '1.2rem', color: '#86868b', textDecoration: 'line-through' }}>{formatPrice(price)}</span>}
          {Boolean(displayPrice) && (
            <span style={{ fontSize: 36, fontWeight: 800, color: isPromo ? '#00cc6a' : '#1d1d1f', letterSpacing: '-0.02em' }}>
              {formatPrice(displayPrice!)}
            </span>
          )}
        </div>
      )
    }


    case 'buyButton':
      return (
        <button style={{
          background: '#1d1d1f',
          color: '#fff',
          border: 'none',
          padding: '16px 32px',
          borderRadius: 980,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          ...s,
        }}>
          {String(content.label || 'Tenho Interesse')}
        </button>
      )

    case 'quote':
      return (
        <blockquote style={{
          borderLeft: '3px solid #d2d2d7',
          margin: 0,
          padding: '20px 28px',
          background: '#f5f5f7',
          borderRadius: '0 12px 12px 0',
          fontStyle: 'italic',
          color: '#1d1d1f',
          lineHeight: 1.7,
          ...s,
        }}>
          {String(content.quote_text || content.text || '')}
          {Boolean(content.quote_author) && <cite style={{ display: 'block', marginTop: 12, fontStyle: 'normal', fontWeight: 600, fontSize: '0.9rem', color: '#6e6e73' }}>— {String(content.quote_author)}</cite>}
        </blockquote>
      )

    case 'list':
      return (
        <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8, color: '#6e6e73', lineHeight: 1.7, ...s }}>
          {(Array.isArray(content.list_items) ? content.list_items : []).map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    case 'table':
      return (
        <div style={{ overflowX: 'auto', ...s }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {Boolean(content.table_headers) && (
              <thead>
                <tr>
                  {(content.table_headers as string[]).map((h, i) => (
                    <th key={i} style={{ borderBottom: '2px solid #e8e8ed', padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(Array.isArray(content.table_rows) ? content.table_rows : []).map((row: string[], i: number) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ borderBottom: '1px solid #e8e8ed', padding: '12px 16px', color: '#6e6e73' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'breadcrumb':
      return null

    case 'relatedProducts':
      return null

    case 'menu':
      return null

    case 'form':
      return (
        <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 18, textAlign: 'center', ...s }}>
          <p style={{ color: '#6e6e73' }}>Formulário</p>
        </div>
      )

    case 'embed':
      return (
        <div style={s} dangerouslySetInnerHTML={{ __html: (content.html_code as string) || '<p>Embed</p>' }} />
      )

    case 'code':
      return (
        <pre style={{ background: '#1d1d1f', color: '#f5f5f7', padding: 24, borderRadius: 12, overflow: 'auto', ...s }}>
          <code>{(content.html_code as string) || ''}</code>
        </pre>
      )

    case 'comparison':
      return (
        <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 18, ...s }}>
          <p style={{ color: '#6e6e73', textAlign: 'center' }}>Comparação de produtos</p>
        </div>
      )

    case 'steps':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, ...s }}>
          {(Array.isArray(content.list_items) ? content.list_items : []).map((item: Record<string, unknown>, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1d1d1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                {Boolean(item.text) && <h4 style={{ margin: 0, color: '#1d1d1f' }}>{String(item.text)}</h4>}
                {Boolean(item.html) && <p style={{ margin: '4px 0 0', color: '#6e6e73' }}>{String(item.html)}</p>}
              </div>
            </div>
          ))}
        </div>
      )

    case 'imageText':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', ...s }}>
          <div>
            {Boolean(content.image) && <img src={content.image as string} alt="" style={{ width: '100%', borderRadius: 18 }} />}
          </div>
          <div>
            {Boolean(content.title) && <h2 style={{ margin: '0 0 16px', fontSize: '2rem', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em' }}>{String(content.title)}</h2>}
            {Boolean(content.text) && <div style={{ color: '#6e6e73', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content.text as string }} />}
          </div>
        </div>
      )

    case 'tabs':
      return (
        <div style={s}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e8e8ed', marginBottom: 24 }}>
            {(Array.isArray(content.list_items) ? content.list_items : []).slice(0, 3).map((item: Record<string, unknown>, i: number) => (
              <button key={i} style={{ padding: '12px 24px', border: 'none', background: i === 0 ? '#1d1d1f' : 'transparent', color: i === 0 ? '#fff' : '#6e6e73', fontWeight: 600, cursor: 'pointer', borderRadius: '8px 8px 0 0' }}>
                {String(item.text || `Aba ${i + 1}`)}
              </button>
            ))}
          </div>
          <div style={{ color: '#6e6e73', lineHeight: 1.7 }}>
            Conteúdo da aba
          </div>
        </div>
      )

    case 'accordion':
      return (
        <div style={{ maxWidth: 720, ...s }}>
          {(Array.isArray(content.list_items) ? content.list_items : []).map((item: Record<string, unknown>, i: number) => (
            <details key={i} style={{ borderBottom: '1px solid #e8e8ed', padding: '20px 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#1d1d1f', fontSize: '1.05rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {String(item.text || item.html || `Item ${i + 1}`)}
                <span style={{ color: '#86868b', fontSize: '1.2rem' }}>+</span>
              </summary>
              <p style={{ marginTop: 12, color: '#6e6e73', lineHeight: 1.7 }}>{String(item.html || '')}</p>
            </details>
          ))}
        </div>
      )

    case 'toggle':
      return (
        <div style={{ padding: '16px 0', borderBottom: '1px solid #e8e8ed', ...s }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{String(content.text || 'Toggle')}</span>
            <span style={{ color: '#86868b' }}>+</span>
          </div>
        </div>
      )

    case 'columns':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, ...s }}>
          <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12 }}>Coluna 1</div>
          <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12 }}>Coluna 2</div>
        </div>
      )

    case 'grid':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, ...s }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: 16, background: '#f5f5f7', borderRadius: 12, textAlign: 'center' }}>Item {i}</div>
          ))}
        </div>
      )

    case 'priceTable':
      return (
        <div style={{ padding: '32px 24px', background: '#fff', border: '2px solid #00ff88', borderRadius: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', ...s }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#00ff88', fontWeight: 700 }}>{String(content.plan || 'Plano Profissional')}</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '12px 0', color: '#1d1d1f' }}>
            R$ {String(content.price || '149')}<span style={{ fontSize: '0.9rem', color: '#86868b' }}>{String(content.period || '/mês')}</span>
          </div>
          <button style={{ width: '100%', padding: '12px 24px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 16 }}>
            {String(content.button_label || 'Assinar Agora')}
          </button>
        </div>
      )

    case 'countdown':
      return (
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: 20, background: '#1d1d1f', borderRadius: 12, color: '#fff', ...s }}>
          {[{ n: '02', l: 'Dias' }, { n: '14', l: 'Horas' }, { n: '35', l: 'Min' }, { n: '42', l: 'Seg' }].map((c, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 50 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00ff88' }}>{c.n}</div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7 }}>{c.l}</div>
            </div>
          ))}
        </div>
      )

    case 'counter':
      return (
        <div style={{ textAlign: 'center', padding: 24, ...s }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1d1d1f' }}>{String(content.prefix || '+')}{String(content.number || '10.000')}</div>
          <div style={{ fontSize: '1rem', color: '#86868b', textTransform: 'uppercase', fontWeight: 600 }}>{String(content.title || 'Clientes Satisfeitos')}</div>
        </div>
      )

    case 'progressBar':
      return (
        <div style={{ width: '100%', ...s }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6, fontWeight: 600, color: '#1d1d1f' }}>
            <span>{String(content.title || 'Performance')}</span>
            <span>{String(content.percent || '95')}%</span>
          </div>
          <div style={{ height: 10, background: '#e8e8ed', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${content.percent || 95}%`, height: '100%', background: '#00ff88', borderRadius: 5 }} />
          </div>
        </div>
      )

    case 'alert':
      return (
        <div style={{ padding: 16, background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, color: '#b45309', fontSize: '0.95rem', ...s }}>
          {String(content.text || 'Atenção: Mensagem informativa.')}
        </div>
      )

    case 'googleMaps':
      return (
        <div style={{ height: 260, background: '#e8e8ed', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', ...s }}>
          📍 Mapa: {String(content.address || 'São Paulo, Brasil')}
        </div>
      )

    case 'form':
      return (
        <form style={{ padding: 24, background: '#f5f5f7', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, ...s }} onSubmit={(e) => e.preventDefault()}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Formulário de Contato</h3>
          <input placeholder="Seu Nome" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d2d2d7' }} />
          <input placeholder="Seu E-mail" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d2d2d7' }} />
          <textarea placeholder="Sua Mensagem" rows={3} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d2d2d7' }} />
          <button type="submit" style={{ padding: '12px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Enviar</button>
        </form>
      )

    case 'newsletter':
      return (
        <div style={{ padding: 32, background: '#1d1d1f', color: '#fff', borderRadius: 16, textAlign: 'center', ...s }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem' }}>Receba Novidades TEKNIX</h3>
          <p style={{ margin: '0 0 20px', opacity: 0.8, fontSize: '0.9rem' }}>Fique por dentro dos lançamentos e ofertas exclusivas.</p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 440, margin: '0 auto' }}>
            <input placeholder="Seu melhor e-mail" style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none' }} />
            <button style={{ padding: '10px 20px', background: '#00ff88', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Cadastrar</button>
          </div>
        </div>
      )

    case 'socialIcons':
    case 'shareButtons':
      return (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', ...s }}>
          {['WhatsApp', 'Instagram', 'YouTube', 'Facebook'].map((net, idx) => (
            <a
              key={idx}
              href="#"
              onClick={e => e.preventDefault()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 980,
                background: net === 'WhatsApp' ? '#25D366' : net === 'Instagram' ? '#E1306C' : net === 'YouTube' ? '#FF0000' : '#1877F2',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{net}</span>
            </a>
          ))}
        </div>
      )

    case 'iconList':
      return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, ...s }}>
          {['Motor Brushless 21V de alto torque', 'Bateria Íon-Lítio com autonomia estendida', 'Mandril de aperto rápido metálico 1/2"', 'Garantia oficial de 12 meses TEKNIX'].map((item, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: '#1d1d1f' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#00cc6a', color: '#fff', fontSize: 12 }}>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'search':
      return (
        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 480, ...s }}>
          <input
            type="text"
            placeholder={String(content.placeholder || 'Buscar produtos, modelos e acessórios...')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 980,
              border: '1px solid #d2d2d7',
              fontSize: '0.9rem',
              outline: 'none',
              background: '#f5f5f7'
            }}
          />
          <button
            style={{
              padding: '12px 24px',
              borderRadius: 980,
              border: 'none',
              background: '#1d1d1f',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Buscar
          </button>
        </div>
      )

    case 'lottie':
      return (
        <div style={{ height: 160, background: '#f5f5f7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', gap: 10, ...s }}>
          <Sparkles size={24} style={{ color: '#8b5cf6' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d1d1f' }}>Animação Interativa (Lottie Player)</span>
        </div>
      )

    case 'chapterNav': {
      const navItems = (Array.isArray(content.nav_items) ? content.nav_items : [
        { label: 'MacBook Air', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/keyboards_c8202d7ef.png', link: '/mac' },
        { label: 'MacBook Pro', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/keyboards_c8202d7ef.png', link: '/mac' },
        { label: 'iMac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/compare_b74d7a1e3.png', link: '/mac' },
        { label: 'Mac mini', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_mini_6884caafc.png', link: '/mac' },
        { label: 'Mac Studio', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_pro_8c6c9576c.png', link: '/mac' },
        { label: 'Accessories', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/accessories_d7234e26e.png', link: '/mac' },
      ]) as Record<string, unknown>[]

      return (
        <nav
          id={id}
          className={className}
          aria-label={String(content.aria_label || 'Navegação de produtos')}
          style={{
            background: '#fff',
            borderBottom: '1px solid #e8e8ed',
            overflow: 'hidden',
            ...s,
          }}
        >
          <div style={{
            maxWidth: 980,
            margin: '0 auto',
            padding: '0 20px',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            <ul style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: '12px 0',
              gap: 0,
              justifyContent: 'space-between',
              minWidth: 'max-content',
            }}>
              {navItems.map((item, i) => (
                <li key={i} style={{ flexShrink: 0, textAlign: 'center' }}>
                  <a
                    href={String(item.link || '#')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      textDecoration: 'none',
                      color: '#1d1d1f',
                      padding: '8px 16px',
                      borderRadius: 8,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  >
                    <figure style={{ margin: 0, width: 48, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {Boolean(item.image) && (
                        <img
                          alt={String(item.label || '')}
                          src={String(item.image)}
                          width={48}
                          height={56}
                          loading="lazy"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      )}
                    </figure>
                    <span style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                      {String(item.label || '')}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <style>{`
            .chapter-nav-scroll::-webkit-scrollbar { display: none; }
          `}</style>
        </nav>
      )
    }

    case 'productTileGallery': {
      const headline = (content.headline as string) || 'Explore a linha de produtos.'
      const galleryItems = (Array.isArray(content.gallery_items) ? content.gallery_items : [
        { badge: 'Novo', title: 'iPad Pro', image: 'https://www.apple.com/v/ipad-pro/ao/images/overview/hero/hero__e2z86z500dqq_large.jpg', copy: 'Inacreditavelmente fino. Poder colossal com chip M4 e tela Tandem OLED.', price: 'A partir de R$ 12.299', link_saber: '/ipad', link_comprar: '/produtos', colors: ['#1d1d1f', '#e2e4e9'] },
        { badge: 'Novo', title: 'iPad Air', image: 'https://www.apple.com/v/ipad-air/x/images/overview/design/colors__en3iud8nawya_large.jpg', copy: 'Feito para levar a qualquer lugar com o poder do chip M2.', price: 'A partir de R$ 6.999', link_saber: '/ipad', link_comprar: '/produtos', colors: ['#3e434f', '#c9d7e8', '#e5dacb', '#95a18d'] },
        { badge: '', title: 'iPad (10ª geração)', image: 'https://www.apple.com/v/ipad-10.9/d/images/overview/design/colors__dcv37x8n7dme_large.jpg', copy: 'O iPad colorido e indispensável para todas as tarefas do dia a dia.', price: 'A partir de R$ 3.999', link_saber: '/ipad', link_comprar: '/produtos', colors: ['#e45050', '#2d6ae3', '#e4db54', '#d2d5dc'] },
        { badge: 'Novo', title: 'iPad mini', image: 'https://www.apple.com/v/ipad-mini/r/images/overview/design/colors__en3iud8nawya_large.jpg', copy: 'Poder ultraportátil de 8,3 polegadas com chip A17 Pro.', price: 'A partir de R$ 5.999', link_saber: '/ipad', link_comprar: '/produtos', colors: ['#4b4f58', '#d0d8e8', '#e5d7cb', '#d8ceda'] },
      ]) as Record<string, unknown>[]

      const showNavArrows = content.show_nav_arrows !== false

      return (
        <div
          id={id}
          className={className}
          style={{
            padding: '48px 0',
            overflow: 'hidden',
            ...s,
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{
                margin: 0,
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: '#1d1d1f',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}>
                {headline}
              </h2>
              {showNavArrows && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    aria-label="Anterior"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px solid #d2d2d7',
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1d1d1f',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f7' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                  >
                    <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                      <path d="M8.5 15L1.5 8L8.5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    aria-label="Próximo"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px solid #d2d2d7',
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1d1d1f',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f7' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                  >
                    <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                      <path d="M1.5 1L8.5 8L1.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: 24,
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              paddingBottom: 16,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}>
              {galleryItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    minWidth: 280,
                    maxWidth: 320,
                    flex: '0 0 auto',
                    background: '#fff',
                    borderRadius: 20,
                    overflow: 'hidden',
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {Boolean(item.badge) && (
                    <div style={{
                      padding: '12px 20px 0',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#bf4800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}>
                        {String(item.badge)}
                      </span>
                    </div>
                  )}

                  <div style={{ padding: '12px 20px 0' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#1d1d1f',
                      letterSpacing: '-0.02em',
                    }}>
                      {String(item.title || '')}
                    </h3>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200,
                    padding: 16,
                  }}>
                    {Boolean(item.image) && (
                      <img
                        alt={String(item.title || '')}
                        src={String(item.image)}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    )}
                  </div>

                  {Array.isArray(item.colors) && item.colors.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, padding: '0 20px', justifyContent: 'center' }}>
                      {(item.colors as string[]).map((color: string, ci: number) => (
                        <span
                          key={ci}
                          title={`Opção ${ci + 1}`}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: color,
                            border: '1px solid rgba(0,0,0,0.1)',
                            display: 'inline-block',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {Boolean(item.copy) && (
                    <p style={{
                      margin: '12px 20px 0',
                      fontSize: 14,
                      color: '#6e6e73',
                      lineHeight: 1.5,
                      textAlign: 'center',
                    }}>
                      {String(item.copy)}
                    </p>
                  )}

                  {Boolean(item.price) && (
                    <p style={{
                      margin: '12px 20px 0',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#1d1d1f',
                      textAlign: 'center',
                    }}>
                      {String(item.price)}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    padding: '16px 20px 20px',
                    marginTop: 'auto',
                  }}>
                    {Boolean(item.link_saber) && (
                      <a
                        href={String(item.link_saber)}
                        style={{
                          display: 'inline-block',
                          padding: '10px 20px',
                          borderRadius: 980,
                          background: '#0071e3',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#0077ed' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0071e3' }}
                      >
                        Saber mais
                      </a>
                    )}
                    {Boolean(item.link_comprar) && (
                      <a
                        href={String(item.link_comprar)}
                        style={{
                          fontSize: 14,
                          color: '#0071e3',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
                      >
                        Comprar &gt;
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <style>{`
            .product-tile-gallery-scroll::-webkit-scrollbar { display: none; }
          `}</style>
        </div>
      )
    }

    default:
      return <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 12, color: '#86868b' }}>Widget: {type}</div>
  }
}

function DynamicProductGrid({ content, style }: { content: Record<string, unknown>; style: React.CSSProperties }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts({
          category: (content.product_filter as string) || undefined,
          limit: Number(content.product_limit) || 8,
        })
        if (data) setProducts(data)
      } catch (err) {
        console.error('Error loading products for dynamic grid:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [content])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', ...style }}><div className="spinner" /></div>
  }

  const columns = Number(content.product_columns) || 4
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(calc(100% / ${columns} - 20px), 1fr))`,
    gap: 20,
    ...style,
  }

  return (
    <div style={gridStyle}>
      {products.map(product => {
        const { price, promoPrice, isPromo } = getProductPrice(product)
        const displayPrice = isPromo ? promoPrice : price
        const image = product.image_url || (Array.isArray((product as any).images) ? (product as any).images[0] : '')

        return (
          <a key={product.id} href={`/produtos/${product.sku || product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                textAlign: 'center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ background: '#f5f5f7', height: 220, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {image ? (
                  <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
                ) : (
                  <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>
                )}
                {isPromo && (
                  <span style={{ position: 'absolute', top: 12, right: 12, background: '#00cc6a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 980 }}>
                    OFERTA
                  </span>
                )}
              </div>
              <div style={{ padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {product.brand && <span style={{ display: 'block', fontSize: 11, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{product.brand}</span>}
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1d1d1f', margin: '0 0 10px', lineHeight: 1.3, minHeight: '2.6em' }}>{product.name}</h3>
                </div>
                <div>
                  {isPromo ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, color: '#00cc6a', fontSize: '1.15rem' }}>{formatPrice(displayPrice!)}</span>
                      <span style={{ fontSize: '0.8rem', color: '#86868b', textDecoration: 'line-through' }}>{formatPrice(price)}</span>
                    </div>
                  ) : (
                    <p style={{ fontWeight: 800, color: '#1d1d1f', fontSize: '1.15rem', margin: 0 }}>
                      {formatPrice(displayPrice || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}

