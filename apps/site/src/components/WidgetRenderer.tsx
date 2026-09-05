import AnimatedHeadline from './page-widgets/AnimatedHeadline'
import WidgetCarousel from './page-widgets/WidgetCarousel'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getProducts } from '../services/products'
import type { Product } from '../types/database'
import {
  ShoppingBag, ArrowRight, ChevronRight, Sparkles, Zap, Star, Heart, Check, Download, Play, ExternalLink, Phone, Mail,
  Image as ImageIcon
} from 'lucide-react'
import lottie from 'lottie-web'

import { renderDynamicIcon } from './IconPickerModal'
import EndlessEntertainmentGallery from './EndlessEntertainmentGallery'
import ChapterNav from './ChapterNav'
import ProductLineupGallery from './ProductLineupGallery'
import AppleFeatureCardsGallery from './AppleFeatureCardsGallery'
import AppleImageAccordion from './AppleImageAccordion'
import AppleStoreBenefitsScroller from './AppleStoreBenefitsScroller'
import AppleStoreOffersScroller from './AppleStoreOffersScroller'
import { evaluateDisplayConditions, type DisplayCondition } from '../services/displayConditions'

interface PageWidget {
  id: string
  container_id: string
  type: string
  order: number
  content: Record<string, any>
  style: Record<string, any> | React.CSSProperties
  display_conditions?: DisplayCondition[]
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

function resolveDynamicValue(value: any, product?: Product): any {
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

function getEmbedUrl(rawUrl?: string): { isEmbed: boolean; url: string; isVideoFile: boolean } {
  if (!rawUrl) {
    return {
      isEmbed: true,
      url: 'https://www.youtube.com/embed/XHTrA56kH10',
      isVideoFile: false
    }
  }

  const ytMatch = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  if (ytMatch) {
    return {
      isEmbed: true,
      url: `https://www.youtube.com/embed/${ytMatch[1]}`,
      isVideoFile: false
    }
  }

  const vimeoMatch = rawUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
  if (vimeoMatch) {
    return {
      isEmbed: true,
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      isVideoFile: false
    }
  }

  if (rawUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return {
      isEmbed: false,
      url: rawUrl,
      isVideoFile: true
    }
  }

  return {
    isEmbed: true,
    url: rawUrl,
    isVideoFile: false
  }
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

  const objectFit = widget.object_fit || settings.object_fit || widget.content?.object_fit || raw.objectFit || raw.object_fit
  if (objectFit) s.objectFit = objectFit as any

  const objectPosition = widget.object_position || settings.object_position || widget.content?.object_position || raw.objectPosition || raw.object_position
  if (objectPosition) s.objectPosition = objectPosition as any

  const opacity = widget.opacity !== undefined ? widget.opacity : settings.opacity !== undefined ? settings.opacity : raw.opacity
  if (opacity !== undefined && opacity !== '') s.opacity = Number(opacity)

  if (widget.padding || settings.padding || raw.padding) s.padding = widget.padding || settings.padding || raw.padding
  if (widget.margin || settings.margin || raw.margin) s.margin = widget.margin || settings.margin || raw.margin
  if (widget.gap || settings.gap || raw.gap) s.gap = widget.gap || settings.gap || raw.gap

  return s
}

function LottiePlayer({ content, s }: { content: Record<string, any>; s: React.CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || !content.url) return
    if (animRef.current) { animRef.current.destroy(); animRef.current = null }
    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: content.loop !== false,
      autoplay: content.autoplay !== false,
      path: String(content.url),
    })
    if (content.speed) animRef.current.setSpeed(Number(content.speed) || 1)
    return () => { if (animRef.current) { animRef.current.destroy(); animRef.current = null } }
  }, [content.url, content.loop, content.autoplay, content.speed])

  if (!content.url) return <div style={{ height: content.height || 200, background: '#f5f5f7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', ...s }}>
    <Sparkles size={24} style={{ color: '#8b5cf6', marginRight: 8 }} />
    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Animação Lottie</span>
  </div>

  return <div ref={containerRef} style={{ width: content.width || '100%', height: content.height || 200, background: content.background || 'transparent', borderRadius: content.border_radius || 0, ...s }} />
}

function CountdownTimer({ content, s }: { content: Record<string, any>; s: React.CSSProperties }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const target = content.target_date ? new Date(String(content.target_date)).getTime() : now + 2 * 86400000 + 14 * 3600000 + 35 * 60000 + 42000
  const remaining = Math.max(0, target - now)
  const values = { days: Math.floor(remaining / 86400000), hours: Math.floor((remaining % 86400000) / 3600000), minutes: Math.floor((remaining % 3600000) / 60000), seconds: Math.floor((remaining % 60000) / 1000) }
  const units = [
    ['days', values.days, content.days_label || 'Dias'],
    ['hours', values.hours, content.hours_label || 'Horas'],
    ['minutes', values.minutes, content.minutes_label || 'Min'],
    ['seconds', values.seconds, content.seconds_label || 'Seg'],
  ].filter(([key]) => content[`show_${key}`] !== false)
  if (remaining === 0 && content.expired_message) return <div style={{ padding: 20, textAlign: 'center', ...s }}>{String(content.expired_message)}</div>
  return (
    <div className="elementor-countdown-wrapper" style={{ display: 'flex', gap: content.gap || 16, justifyContent: content.align || 'center', padding: 20, background: content.background_color || '#1d1d1f', borderRadius: 12, color: content.label_color || '#fff', ...s }}>
      {units.map(([key, value, label]) => (
        <div key={String(key)} className="elementor-countdown-item" style={{ textAlign: 'center', minWidth: content.item_width || 56, padding: '8px 12px', background: content.item_bg || 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
          <span className="elementor-countdown-digits" style={{ display: 'block', fontSize: content.number_size || '1.8rem', fontWeight: 800, color: content.number_color || '#B5F500', lineHeight: 1.2 }}>
            {String(value).padStart(2, '0')}
          </span>
          <span className="elementor-countdown-label" style={{ display: 'block', fontSize: content.label_size || '0.72rem', textTransform: 'uppercase', opacity: 0.75, letterSpacing: '0.05em', marginTop: 4 }}>
            {String(label)}
          </span>
        </div>
      ))}
    </div>
  )
}

function ElementorTabs({ content, widget, s }: { content: Record<string, any>; widget?: any; s: React.CSSProperties }) {
  const tabItems = (Array.isArray(content.tabs) && content.tabs.length > 0)
    ? content.tabs
    : (Array.isArray(content.tab_titles) && content.tab_titles.length > 0)
    ? content.tab_titles
    : (Array.isArray(content.items) && content.items.length > 0)
    ? content.items
    : [
        { title: 'Visão Geral', content: 'Desenvolvido para máxima durabilidade e performance industrial em qualquer trabalho.' },
        { title: 'Especificações', content: 'Potência: 21V Max | Bateria: 4.0Ah Li-Ion | Mandril: 1/2" metálico | Peso: 1.6kg.' },
        { title: 'Garantia', content: '12 meses de garantia oficial com suporte direto TEKNIX e troca expressa.' },
      ]

  const [activeTab, setActiveTab] = useState(0)
  const activeColor = widget?.tab_active_color || content.tab_active_color || '#1d1d1f'
  const inactiveColor = widget?.tab_color || content.tab_color || '#6e6e73'
  const indicatorColor = widget?.tab_indicator_color || content.tab_indicator_color || '#1d1d1f'
  const tabSize = widget?.tab_size || content.tab_size || '0.95rem'
  const contentColor = widget?.content_color || content.content_color || '#6e6e73'
  const contentSize = widget?.content_size || content.content_size || '0.95rem'
  const align = widget?.tab_align || content.tab_align || 'left'
  const tabJustify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : align === 'justify' ? 'space-between' : 'flex-start'

  return (
    <div className="elementor-tabs" style={{ width: '100%', ...s }}>
      <div className="elementor-tabs-wrapper" style={{ display: 'flex', justifyContent: tabJustify, gap: 4, borderBottom: '1px solid #e8e8ed', marginBottom: 20 }}>
        {tabItems.map((item: any, i: number) => {
          const isActive = activeTab === i
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`elementor-tab-title ${isActive ? 'elementor-active' : ''}`}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: isActive ? `2px solid ${indicatorColor}` : '2px solid transparent',
                background: 'transparent',
                color: isActive ? activeColor : inactiveColor,
                fontWeight: isActive ? 600 : 500,
                fontSize: tabSize,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {String(item.title || item.text || item.label || `Aba ${i + 1}`)}
            </button>
          )
        })}
      </div>
      <div className="elementor-tabs-content-wrapper" style={{ color: contentColor, lineHeight: 1.7, fontSize: contentSize }}>
        <div className="elementor-tab-content elementor-active">
          {tabItems[activeTab]?.content || 'Conteúdo da aba selecionada'}
        </div>
      </div>
    </div>
  )
}

function ElementorAccordionWidget({
  content,
  widget,
  s,
  forcedBehavior
}: {
  content: Record<string, any>
  widget?: any
  s: React.CSSProperties
  forcedBehavior?: 'single' | 'multiple'
}) {
  const sch = {
    ...(widget?.schema || {}),
    ...(widget?.style || {}),
    ...(widget?.settings || {}),
    ...(content || {}),
    ...(widget || {})
  }

  const items: any[] = (Array.isArray(sch.items) && sch.items.length > 0)
    ? sch.items
    : (Array.isArray(sch.items_titles) && sch.items_titles.length > 0)
    ? sch.items_titles
    : (Array.isArray(sch.list_items) && sch.list_items.length > 0)
    ? sch.list_items
    : [
        { title: 'Qual é o prazo de entrega dos pedidos?', content: 'O prazo varia conforme a sua região, com entregas expressas via transportadora rastreada em até 3 a 7 dias úteis.' },
        { title: 'Os produtos possuem garantia oficial TEKNIX?', content: 'Sim, todos os nossos produtos possuem garantia de fábrica de 12 meses contra defeitos de fabricação.' },
        { title: 'Quais são as formas de pagamento disponíveis?', content: 'Aceitamos cartão de crédito em até 12x, Pix com desconto exclusivo e boleto bancário.' },
      ]

  const behavior: 'single' | 'multiple' = forcedBehavior || sch.accordion_behavior || 'single'
  const defaultOpen = sch.default_open

  const initialIndices = useMemo(() => {
    if (defaultOpen === 'none') return []
    if (defaultOpen === 'all') return items.map((_, idx) => idx)
    if (defaultOpen !== undefined && defaultOpen !== '' && !isNaN(Number(defaultOpen))) return [Number(defaultOpen)]
    return [0]
  }, [defaultOpen, items.length])

  const [openIndices, setOpenIndices] = useState<number[]>(initialIndices)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    setOpenIndices(initialIndices)
  }, [initialIndices])

  const toggleItem = (index: number) => {
    if (behavior === 'single') {
      setOpenIndices(prev => (prev.includes(index) ? [] : [index]))
    } else {
      setOpenIndices(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]))
    }
  }

  // Box / Container options
  const itemGap = Number(sch.item_gap ?? 8)
  const borderRadius = Number(sch.border_radius ?? 8)
  const borderStyle = sch.border_style || 'solid'
  const borderWidth = Number(sch.border_width ?? 1)
  const normalBorderColor = sch.border_color || '#e8e8ed'
  const hoverBorderColor = sch.hover_border_color || normalBorderColor
  const activeBorderColor = sch.active_border_color || normalBorderColor
  const boxShadow = sch.box_shadow || 'none'
  const hoverBoxShadow = sch.hover_box_shadow || (boxShadow !== 'none' ? boxShadow : 'none')
  const activeBoxShadow = sch.active_box_shadow || (boxShadow !== 'none' ? boxShadow : 'none')

  // Title options
  const normalTitleColor = sch.title_color || '#1d1d1f'
  const hoverTitleColor = sch.title_hover_color || normalTitleColor
  const activeTitleColor = sch.title_active_color || normalTitleColor
  const normalTitleBg = sch.title_bg || '#ffffff'
  const hoverTitleBg = sch.title_hover_bg || normalTitleBg
  const activeTitleBg = sch.title_active_bg || normalTitleBg
  const titleSize = sch.title_size || '1.05rem'
  const titleWeight = sch.title_weight || 600
  const titlePadding = sch.title_padding || '14px 18px'

  // Icon options
  const iconType = sch.icon_type || 'plus' // 'plus' | 'chevron' | 'arrow'
  const iconAlign = sch.icon_align || 'right' // 'right' | 'left'
  const iconAnimation = sch.icon_animation || 'rotate' // 'rotate' | 'scale' | 'none'
  const normalIconColor = sch.icon_color || '#86868b'
  const hoverIconColor = sch.icon_hover_color || normalIconColor
  const activeIconColor = sch.icon_active_color || normalIconColor
  const iconSize = sch.icon_size || '1.25rem'

  // Content options
  const contentColor = sch.content_color || '#6e6e73'
  const contentBg = sch.content_bg || '#ffffff'
  const contentSize = sch.content_size || '0.95rem'
  const contentLineHeight = sch.content_line_height || 1.7
  const contentPadding = sch.content_padding || '14px 18px'

  return (
    <div
      className="elementor-accordion"
      style={{
        maxWidth: 800,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: itemGap,
        ...s
      }}
    >
      {items.map((item: any, i: number) => {
        const isOpen = openIndices.includes(i)
        const isHovered = hoveredIdx === i

        const currentBorderColor = isOpen ? activeBorderColor : isHovered ? hoverBorderColor : normalBorderColor
        const currentTitleColor = isOpen ? activeTitleColor : isHovered ? hoverTitleColor : normalTitleColor
        const currentTitleBg = isOpen ? activeTitleBg : isHovered ? hoverTitleBg : normalTitleBg
        const currentIconColor = isOpen ? activeIconColor : isHovered ? hoverIconColor : normalIconColor
        const currentBoxShadow = isOpen ? activeBoxShadow : isHovered ? hoverBoxShadow : boxShadow

        let iconTransform = 'none'
        if (iconAnimation === 'rotate') {
          if (iconType === 'plus') {
            iconTransform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
          } else if (iconType === 'chevron') {
            iconTransform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          } else if (iconType === 'arrow') {
            iconTransform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
          }
        } else if (iconAnimation === 'scale') {
          iconTransform = isOpen ? 'scale(1.2)' : 'scale(1)'
        }

        const isBottomOnly = borderStyle === 'bottom_only'

        return (
          <div
            key={i}
            className={`elementor-accordion-item ${isOpen ? 'elementor-active' : ''}`}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              border: isBottomOnly ? 'none' : borderStyle === 'none' ? 'none' : `${borderWidth}px ${borderStyle} ${currentBorderColor}`,
              borderBottom: isBottomOnly ? `${borderWidth}px solid ${currentBorderColor}` : undefined,
              borderRadius: isBottomOnly ? undefined : `${borderRadius}px`,
              boxShadow: currentBoxShadow,
              overflow: 'hidden',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              background: normalTitleBg !== 'transparent' ? normalTitleBg : undefined
            }}
          >
            <button
              type="button"
              className={`elementor-tab-title ${isOpen ? 'elementor-active' : ''}`}
              onClick={() => toggleItem(i)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: iconAlign === 'left' ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: titlePadding,
                background: currentTitleBg,
                color: currentTitleColor,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: titleSize,
                fontWeight: titleWeight,
                transition: 'background 0.2s ease, color 0.2s ease',
                outline: 'none'
              }}
            >
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                {String(item.title || item.text || item.label || `Pergunta #${i + 1}`)}
              </span>

              <span
                className="elementor-accordion-icon"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentIconColor,
                  fontSize: iconSize,
                  transform: iconTransform,
                  transformOrigin: 'center center',
                  transition: 'transform 0.3s cubic-bezier(0.2, 0, 0, 1), color 0.2s ease',
                  flexShrink: 0
                }}
              >
                {iconType === 'chevron' ? (
                  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                ) : iconType === 'arrow' ? (
                  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </span>
            </button>

            <div
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows 0.3s cubic-bezier(0.2, 0, 0, 1)',
                background: contentBg,
                borderTop: isOpen && !isBottomOnly ? `1px solid ${normalBorderColor}` : undefined
              }}
            >
              <div style={{ minHeight: 0, overflow: 'hidden' }}>
                <div
                  className="elementor-tab-content"
                  style={{
                    padding: contentPadding,
                    color: contentColor,
                    fontSize: contentSize,
                    lineHeight: contentLineHeight,
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.25s ease',
                  }}
                  dangerouslySetInnerHTML={{ __html: String(item.content || item.html || item.answer || '') }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function WidgetRenderer({ widget, product }: WidgetRendererProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const conditions = widget.display_conditions as DisplayCondition[] | undefined

  if (conditions && conditions.length > 0) {
    const shouldRender = evaluateDisplayConditions(conditions, {
      pathname,
      product: product as any,
    })
    if (!shouldRender) return null
  }

  const { type, content: _rawContent } = widget
  const content = (_rawContent || {}) as Record<string, any>
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
      return <Tag id={id} className={className} style={{ letterSpacing: '-0.03em', lineHeight: '1.1', width: '100%', textAlign: (s.textAlign as any) || 'inherit', ...s }}>{text}</Tag>
    }

    case 'text': {
      const text = resolveDynamicValue(content.text || (content as any).html, product) as string
      const isHtmlBlock = typeof text === 'string' && (text.includes('<div') || text.includes('<section') || text.includes('<table') || text.includes('<span'))
      return (
        <div
          id={id}
          className={className}
          style={{
            width: '100%',
            color: isHtmlBlock ? 'inherit' : '#6e6e73',
            lineHeight: isHtmlBlock ? 'inherit' : '1.7',
            textAlign: (s.textAlign as any) || 'inherit',
            ...s
          }}
          dangerouslySetInnerHTML={{ __html: text || '' }}
        />
      )
    }

    case 'image': {
      const src = resolveDynamicValue(content.image || (content as any).src || (content as any).url, product) as string
      const alt = resolveDynamicValue(content.alt, product) as string
      const align = (content.align as string) || (content.text_align as string) || s.textAlign || (widget as any).text_align || (widget as any).settings?.text_align || 'left'
      const imgAlign = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'flex-start'

      const w = widget as any
      const rawSettings = w.settings || {}
      const rawStyleObj = w.style || {}
      const bgOverlay = w.bg_overlay || rawSettings.bg_overlay || rawStyleObj.bg_overlay
      const rawBgOpacity = w.bg_opacity ?? rawSettings.bg_opacity ?? rawStyleObj.bg_opacity
      const bgOpacity = rawBgOpacity !== undefined ? (Number(rawBgOpacity) > 1 ? Number(rawBgOpacity) / 100 : Number(rawBgOpacity)) : 0.5

      const customWidth = s.width || w.width || rawSettings.width || content.width || rawStyleObj.width || '100%'
      const customHeight = s.height || w.height || rawSettings.height || content.height || rawStyleObj.height || 'auto'
      const customMaxWidth = s.maxWidth || (s as any).max_width || w.max_width || rawSettings.max_width || content.max_width || rawStyleObj.maxWidth || rawStyleObj.max_width || '100%'
      const objectFit = w.object_fit || rawSettings.object_fit || content.object_fit || rawStyleObj.objectFit || rawStyleObj.object_fit || s.objectFit || 'cover'
      const objectPosition = w.object_position || rawSettings.object_position || content.object_position || rawStyleObj.objectPosition || rawStyleObj.object_position || s.objectPosition || 'center center'
      const rawOpacity = s.opacity ?? w.opacity ?? rawSettings.opacity ?? content.opacity ?? rawStyleObj.opacity ?? 1
      const opacity = rawOpacity !== undefined && rawOpacity !== '' ? (Number(rawOpacity) > 1 ? Number(rawOpacity) / 100 : Number(rawOpacity)) : 1
      const borderRadius = s.borderRadius || (s as any).border_radius || w.border_radius || rawSettings.border_radius || content.border_radius || content.borderRadius || rawStyleObj.borderRadius || rawStyleObj.border_radius || undefined
      const boxShadow = s.boxShadow || (s as any).box_shadow || w.box_shadow || rawSettings.box_shadow || content.box_shadow || rawStyleObj.boxShadow || rawStyleObj.box_shadow || undefined
      const border = s.border || (w.border_style && w.border_style !== 'none' ? `${w.border_width || '1px'} ${w.border_style} ${w.border_color || '#e8e8ed'}` : undefined)

      const anyS = s as any
      const cssFilter = [
        (w.filter_blur || anyS.filter_blur) ? `blur(${w.filter_blur || anyS.filter_blur}px)` : '',
        (w.filter_brightness || anyS.filter_brightness) ? `brightness(${w.filter_brightness || anyS.filter_brightness}%)` : '',
        (w.filter_contrast || anyS.filter_contrast) ? `contrast(${w.filter_contrast || anyS.filter_contrast}%)` : '',
        (w.filter_saturate || anyS.filter_saturate) ? `saturate(${w.filter_saturate || anyS.filter_saturate}%)` : '',
      ].filter(Boolean).join(' ') || undefined

      const linkUrl = (content.link || (content as any).href || (content as any).url_link) as string | undefined

      if (!src) {
        return (
          <div style={{ width: '100%', display: 'flex', justifyContent: imgAlign as any }}>
            <div
              id={id}
              className={className}
              style={{
                width: customWidth,
                maxWidth: customMaxWidth,
                minHeight: 120,
                border: border || '2px dashed #d2d2d7',
                borderRadius: borderRadius || '12px',
                boxShadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 8,
                padding: '24px 16px',
                color: '#86868b',
                background: '#fbfbfd',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                ...s
              }}
            >
              {bgOverlay && bgOverlay !== 'transparent' && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: bgOverlay, opacity: bgOpacity, pointerEvents: 'none', zIndex: 1 }} />
              )}
              <ImageIcon size={30} strokeWidth={1.5} color="#86868b" />
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#86868b' }}>Nenhuma imagem selecionada</span>
            </div>
          </div>
        )
      }

      const imgElement = (
        <img
          id={id}
          className={className}
          src={src}
          alt={alt || ''}
          style={{
            maxWidth: '100%',
            aspectRatio: (content.aspect_ratio as string) || (w.aspect_ratio as string) || undefined,
            borderRadius,
            display: 'block',
            transition: 'all 0.2s ease',
            ...s,
            width: '100%',
            height: customHeight,
            objectFit: objectFit as any,
            objectPosition: objectPosition as any,
            opacity: Number(opacity),
            filter: cssFilter,
            boxShadow: undefined,
            border: undefined
          }}
          loading="lazy"
        />
      )

      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: imgAlign as any }}>
          <div
            style={{
              position: 'relative',
              width: customWidth,
              maxWidth: customMaxWidth,
              borderRadius,
              boxShadow,
              border,
              overflow: 'hidden',
              lineHeight: 0
            }}
          >
            {linkUrl ? (
              <a
                href={linkUrl}
                target={content.target_blank ? '_blank' : undefined}
                rel={content.target_blank ? 'noopener noreferrer' : undefined}
                style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none' }}
              >
                {imgElement}
              </a>
            ) : imgElement}
            {bgOverlay && bgOverlay !== 'transparent' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: bgOverlay,
                  opacity: bgOpacity,
                  pointerEvents: 'none',
                  zIndex: 1,
                  borderRadius
                }}
              />
            )}
          </div>
        </div>
      )
    }

    case 'imageBox': {
      const src = resolveDynamicValue(content.image || content.url, product) as string
      const title = (resolveDynamicValue(content.title || content.heading, product) as string) || 'Caixa de Imagem'
      const desc = (resolveDynamicValue(content.description || content.text, product) as string) || 'Legenda ou descrição da imagem.'
      const Tag = ((content.title_tag as string) || 'h3') as any
      const alignVal = (s.textAlign as string) || (content.align as string) || 'center'
      return (
        <div id={id} className={className} style={{ padding: 24, border: '1px solid #e8e8ed', borderRadius: 16, textAlign: alignVal as any, background: '#fff', ...s }}>
          {src && (
            <img
              src={src}
              alt={title}
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }}
            />
          )}
          <Tag style={{ margin: '0 0 8px', color: '#1d1d1f', fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</Tag>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6e6e73', lineHeight: 1.5 }}>{desc}</p>
        </div>
      )
    }

    case 'iconBox': {
      const iconName = (content.icon as string) || (content.selected_icon as string) || 'check-square'
      const iconPos = (content.icon_position as string) || 'top'
      const iconSize = parseInt(String(content.icon_size || 32)) || 32
      const iconSpacing = parseInt(String(content.icon_spacing || 12)) || 12
      const iconColor = (content.icon_color as string) || '#1d1d1f'

      const title = (resolveDynamicValue(content.title || content.heading, product) as string) || 'Título do Destaque'
      const titleColor = (content.title_color as string) || '#1d1d1f'
      const titleSize = (content.title_size as string) || '20px'
      const titleWeight = (content.title_weight as string) || '600'
      const Tag = ((content.title_tag as string) || 'h4') as any

      const desc = (resolveDynamicValue(content.description || content.text, product) as string) || 'Descrição detalhada do recurso em destaque.'
      const descColor = (content.description_color as string) || '#6e6e73'
      const descSize = (content.description_size as string) || '14px'

      const alignVal = (s.textAlign as string) || (content.align as string) || 'center'
      const isSide = iconPos === 'left' || iconPos === 'right'

      return (
        <div id={id} className={className} style={{
          padding: 24,
          border: '1px solid #e8e8ed',
          borderRadius: 16,
          textAlign: alignVal as any,
          background: '#fff',
          display: 'flex',
          flexDirection: iconPos === 'left' ? 'row' : iconPos === 'right' ? 'row-reverse' : 'column',
          alignItems: isSide ? 'flex-start' : (alignVal === 'center' ? 'center' : alignVal === 'right' ? 'flex-end' : 'flex-start'),
          gap: iconSpacing,
          ...s
        }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderDynamicIcon(iconName, iconSize, iconColor, 1.6)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Tag style={{ margin: '0 0 6px', color: titleColor, fontSize: titleSize, fontWeight: Number(titleWeight) || 600, letterSpacing: '-0.01em' }}>
              {title}
            </Tag>
            <p style={{ margin: 0, color: descColor, fontSize: descSize, lineHeight: 1.5 }}>
              {desc}
            </p>
          </div>
        </div>
      )
    }

    case 'icon': {
      const w = widget as any
      const rawSettings = w.settings || {}
      const rawStyleObj = w.style || {}
      const iconName = (content.icon as string) || (content.selected_icon as string) || rawSettings.icon || 'star'
      const iconSize = parseInt(String(content.icon_size || rawSettings.icon_size || rawStyleObj.icon_size || 36)) || 36
      const iconColor = (content.icon_color as string) || rawSettings.icon_color || (s.color as string) || '#0071e3'
      const alignVal = (s.textAlign as string) || (content.align as string) || (content.text_align as string) || rawSettings.text_align || 'center'
      const flexJustify = alignVal === 'center' ? 'center' : alignVal === 'right' ? 'flex-end' : 'flex-start'

      return (
        <div id={id} className={className} style={{ width: '100%', display: 'flex', justifyContent: flexJustify, padding: 12, ...s }}>
          {renderDynamicIcon(iconName, iconSize, iconColor, 1.6)}
        </div>
      )
    }

    case 'button': {
      const label = resolveDynamicValue(content.label || content.text, product) as string
      const align = (content.align as string) || (content.text_align as string) || s.textAlign || (widget as any).text_align || (widget as any).settings?.text_align || 'left'
      const btnAlign = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'flex-start'
      const isJustify = align === 'justify' || !!content.full_width
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

      const btnVariant = (content.button_variant as string) || (content.variant as string) || (widget as any).settings?.button_variant || 'primary'

      if (btnVariant === 'link') {
        return (
          <div style={{ width: '100%', display: 'flex', justifyContent: isJustify ? 'stretch' : (btnAlign as any) }}>
            <a
              href={href}
              target={openNewTab ? '_blank' : undefined}
              rel={isNofollow ? 'nofollow noopener noreferrer' : (openNewTab ? 'noopener noreferrer' : undefined)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: iconSpacing,
                color: content.color || (widget as any).settings?.color || '#2997ff',
                fontSize: content.font_size || (widget as any).settings?.font_size || '17px',
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              {iconPos === 'before' && renderIcon(iconName)}
              <span>{label || 'Saiba mais'}</span>
              {iconPos === 'after' && renderIcon(iconName)}
            </a>
          </div>
        )
      }

      const defaultBg = btnVariant === 'secondary' ? '#e8e8ed' : btnVariant === 'outline' ? 'transparent' : '#0071e3'
      const defaultColor = btnVariant === 'secondary' ? '#1d1d1f' : btnVariant === 'outline' ? '#0071e3' : '#ffffff'
      const defaultBorder = btnVariant === 'outline' ? '1px solid #0071e3' : 'none'

      const customBg = content.bg_color || (widget as any).settings?.bg_color || (s.backgroundColor && s.backgroundColor !== 'transparent' ? s.backgroundColor : undefined) || defaultBg
      const customColor = content.color || (widget as any).settings?.color || s.color || defaultColor
      const customBorder = (widget as any).settings?.border || defaultBorder
      const borderRadiusVal = content.borderRadius || content.border_radius || (widget as any).settings?.border_radius || s.borderRadius || 980

      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: isJustify ? 'stretch' : (btnAlign as any) }}>
          <a
            href={href}
            target={openNewTab ? '_blank' : undefined}
            rel={isNofollow ? 'nofollow noopener noreferrer' : (openNewTab ? 'noopener noreferrer' : undefined)}
            style={{ textDecoration: 'none', width: isJustify ? '100%' : 'auto', display: isJustify ? 'block' : 'inline-block' }}
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
                fontSize: (widget as any).settings?.font_size || s.fontSize || '0.9rem',
                padding: (s.paddingTop || s.paddingRight || s.paddingBottom || s.paddingLeft || s.padding) ? undefined : '12px 24px',
                borderRadius: borderRadiusVal,
                cursor: 'pointer',
                border: customBorder,
                transition: 'all 0.2s ease',
                ...s,
                background: customBg,
                color: customColor,
                width: isJustify ? '100%' : 'auto',
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

    case 'rating':
    case 'starRating': {
      const w = widget as any
      const alignVal = (s.textAlign as string) || (content.align as string) || (content.text_align as string) || w.settings?.text_align || 'left'
      const flexJustify = alignVal === 'center' ? 'center' : alignVal === 'right' ? 'flex-end' : alignVal === 'justify' ? 'space-between' : 'flex-start'
      const starSize = Number(content.star_size || w.settings?.star_size || w.style?.star_size || 16)
      const starColor = (content.star_color as string) || w.settings?.star_color || w.style?.star_color || '#f59e0b'
      const ratingVal = Number(content.rating ?? 5)
      const reviewCount = content.review_count !== undefined ? String(content.review_count) : '128'
      const showText = content.show_text !== false
      return (
        <div id={id} className={className} style={{ width: '100%', display: 'flex', gap: 8, color: starColor, alignItems: 'center', justifyContent: flexJustify, textAlign: alignVal as any, ...s }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                size={starSize}
                fill={i <= Math.round(ratingVal) ? starColor : 'none'}
                stroke={starColor}
              />
            ))}
          </div>
          {showText && (
            <span style={{ fontSize: s.fontSize || '0.85rem', color: s.color || '#86868b', marginLeft: 4 }}>
              {String(content.text || `${ratingVal.toFixed(1)} (${reviewCount} avaliações)`)}
            </span>
          )}
        </div>
      )
    }

    case 'spacer':
      return <div style={{ height: (content.height as number) || 50, ...s }} />

    case 'divider': {
      const w = widget as any
      const rawSettings = w.settings || {}
      const rawStyleObj = w.style || {}
      const alignVal = (s.textAlign as string) || (content.align as string) || (content.text_align as string) || rawSettings.text_align || 'center'
      const flexJustify = alignVal === 'left' ? 'flex-start' : alignVal === 'right' ? 'flex-end' : 'center'
      const dividerWidth = (content.width as string) || rawSettings.width || rawStyleObj.width || '100%'
      const lineStyle = (content.style as string) || rawSettings.border_style || rawStyleObj.borderStyle || 'solid'
      const lineWeight = parseInt(String(content.weight || rawSettings.border_width || rawStyleObj.borderWidth || 1)) || 1
      const lineColor = (content.color as string) || rawSettings.border_color || rawStyleObj.borderColor || s.color || '#e8e8ed'
      const parsedWidth = String(dividerWidth).includes('%') || String(dividerWidth).includes('px') || String(dividerWidth).includes('vw')
        ? dividerWidth
        : `${dividerWidth}%`

      return (
        <div id={id} className={className} style={{ width: '100%', display: 'flex', justifyContent: flexJustify, padding: '8px 0', ...s }}>
          <div
            style={{
              width: parsedWidth,
              maxWidth: '100%',
              borderTop: `${lineWeight}px ${lineStyle} ${lineColor}`,
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              height: 0,
              margin: 0
            }}
          />
        </div>
      )
    }

    case 'video': {
      const rawUrl = (resolveDynamicValue(content.url || content.video_url, product) as string) || 'https://www.youtube.com/watch?v=XHTrA56kH10'
      const embed = getEmbedUrl(rawUrl)
      let playerUrl = embed.url
      if (!embed.isVideoFile) {
        try {
          const url = new URL(embed.url)
          const youtube = url.hostname.endsWith('youtube.com')
          const vimeo = url.hostname === 'player.vimeo.com'
          if (youtube && content.privacy) url.hostname = 'www.youtube-nocookie.com'
          if (youtube || vimeo) {
            url.searchParams.set('autoplay', content.autoplay ? '1' : '0')
            url.searchParams.set(youtube ? 'mute' : 'muted', (content.muted ?? content.mute) ? '1' : '0')
            url.searchParams.set('controls', content.controls === false ? '0' : '1')
            url.searchParams.set('loop', content.loop ? '1' : '0')
            if (youtube) {
              if (content.loop) url.searchParams.set('playlist', url.pathname.split('/').pop() || '')
              if (content.start_time) url.searchParams.set('start', String(content.start_time))
              if (content.end_time) url.searchParams.set('end', String(content.end_time))
              url.searchParams.set('cc_load_policy', content.captions ? '1' : '0')
            } else {
              if (content.start_time) url.hash = `t=${content.start_time}s`
              if (content.privacy) url.searchParams.set('dnt', '1')
            }
          }
          playerUrl = url.toString()
        } catch { /* Keep existing source when it is a relative URL. */ }
      }
      const videoTitle = content.title || 'Vídeo' 
      const start_time = Number(content.start_time) || 0
      const aspectRatio = content.video_height || '16/9'
      const minH = content.video_min_height || '200px'
      const isMobile = content.video_mobile !== false
      const mobileAspect = content.video_mobile_height || '16/9'
      const heightStyle = aspectRatio === 'auto' ? { minHeight: minH } : { aspectRatio, minHeight: minH }
      const mobileStyle = isMobile ? { aspectRatio: mobileAspect === 'auto' ? undefined : mobileAspect } : {}
      const overlayTextPos = content.overlay_text_pos || 'center'
      const overlayTextBg = content.overlay_text_bg || 'rgba(0,0,0,0.5)'
      const overlayTextSize = content.overlay_text_size || 36
      const overlayTextAlign = overlayTextPos === 'top' ? 'flex-start' : overlayTextPos === 'bottom' ? 'flex-end' : 'center'
      const overlayText = content.overlay_text
      const overlayBtnLabel = content.overlay_btn_label
      const overlayBtnUrl = content.overlay_btn_url || '#'
      const overlayBtnColor = content.overlay_btn_color || '#ffffff'
      const overlayBtnBg = content.overlay_btn_bg || '#0071e3'
      return (
        <div style={{ width: '100%', ...s }}>
          {Boolean(content.title) && <h3 style={{ margin: '0 0 12px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 600, color: '#141414', letterSpacing: '-0.02em' }}>{String(videoTitle)}</h3>}
          <div style={{ ...heightStyle, borderRadius: 12, overflow: 'hidden', background: '#000', position: 'relative', ...mobileStyle }}>
            {content.poster && !content.autoplay && <img src={String(content.poster)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />}
            {embed.isVideoFile ? (
              <video
                src={embed.url}
                controls={content.controls !== false}
                autoPlay={content.autoplay || false}
                loop={content.loop || false}
                muted={content.muted ?? content.mute ?? false}
                poster={content.poster || undefined}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
                onLoadedMetadata={event => { if (start_time > 0) event.currentTarget.currentTime = start_time }}
                onTimeUpdate={event => { if (Number(content.end_time) > start_time && event.currentTarget.currentTime >= Number(content.end_time)) { if (content.loop) event.currentTarget.currentTime = start_time; else event.currentTarget.pause() } }}
              />
            ) : (
              <iframe
                src={playerUrl}
                loading={content.lazy_load ? 'lazy' : 'eager'}
                title={String(videoTitle)}
                style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 1 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            {/* Overlay text */}
            {Boolean(overlayText) && (
              <div style={{
                position: 'absolute', top: overlayTextAlign === 'flex-start' ? 16 : overlayTextAlign === 'flex-end' ? 'auto' : 16, bottom: overlayTextAlign === 'flex-end' ? 16 : 'auto',
                left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: overlayTextAlign, zIndex: 2,
                background: overlayTextBg !== 'rgba(0,0,0,0.5)' ? overlayTextBg : 'rgba(0,0,0,0.5)', padding: '12px 24px',
              }}>
                <span style={{ color: content.overlay_text_color || '#ffffff', fontSize: overlayTextSize, fontWeight: 700, textAlign: 'center', lineHeight: 1.3, textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
                  {String(overlayText)}
                </span>
              </div>
            )}
            {/* Overlay button */}
            {Boolean(overlayBtnLabel) && (
              <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                <a href={overlayBtnUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-block', padding: '12px 32px', background: overlayBtnBg, color: overlayBtnColor, borderRadius: 980, fontWeight: 700, fontSize: '0.95rem',
                  textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', transition: 'all 0.2s ease', cursor: 'pointer'
                }}>
                  {String(overlayBtnLabel)}
                </a>
              </div>
            )}
          </div>
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
                <span style={{ fontWeight: 800, color: '#a2e000', fontSize: '1.1rem' }}>{formatPrice(promoPrice!)}</span>
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
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a2e000', letterSpacing: '-0.02em' }}>{formatPrice(promoPrice!)}</span>
                  <span style={{ fontSize: '1.2rem', color: '#86868b', textDecoration: 'line-through' }}>{formatPrice(price)}</span>
                  <span style={{ background: '#e6f9f0', color: '#a2e000', padding: '4px 10px', borderRadius: 980, fontSize: 12, fontWeight: 700 }}>OFERTA</span>
                </>
              ) : (
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.02em' }}>{formatPrice(price || Number(content.price) || 0)}</span>
              )}
            </div>
            {stock > 0 ? (
              <p style={{ color: '#a2e000', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
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
                    color: statusPaid ? '#a2e000' : '#b45309',
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
          {Boolean(content.cta_title) && <h2 style={{ margin: '0 0 12px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{String(content.cta_title)}</h2>}
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
      return <div style={s} dangerouslySetInnerHTML={{ __html: (content.code as string) || (content.html as string) || (content.html_code as string) || '' }} />

    case 'gallery':
    case 'basicGallery': {
      const rawImgs = (Array.isArray(content.images) && content.images.length > 0)
        ? content.images
        : (Array.isArray(content.gallery_items) ? content.gallery_items : [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80'
          ])
      const cols = Number(content.columns || 3)
      const gap = Number(content.gap || 16)
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, ...s }}>
          {rawImgs.map((item: any, i: number) => {
            const src = typeof item === 'string' ? item : (item.image || item.url || '')
            const alt = typeof item === 'string' ? '' : (item.alt || '')
            return (
              <img
                key={i}
                src={src}
                alt={alt}
                style={{ width: '100%', borderRadius: 12, objectFit: 'cover', aspectRatio: '1', display: 'block' }}
                loading="lazy"
              />
            )
          })}
        </div>
      )
    }

    case 'carousel':
    case 'imageCarousel':
      return <WidgetCarousel content={content} style={s} />

    case 'categoryMosaic': {
      const cats = Array.isArray(content.categories) && content.categories.length > 0
        ? content.categories
        : ['Ferramentas Elétricas', 'Linha a Bateria 21V', 'Acessórios & Brocas', 'Instrumentos de Medição']
      return (
        <div style={{ padding: '32px 0', ...s }}>
          {Boolean(content.title) && <h3 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.02em' }}>{String(content.title)}</h3>}
          {Boolean(content.subtitle) && <p style={{ margin: '0 0 20px', color: '#86868b', fontSize: '0.95rem' }}>{String(content.subtitle)}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {cats.map((cat: string, idx: number) => (
              <div
                key={idx}
                style={{
                  background: 'linear-gradient(135deg, #f5f5f7 0%, #ebebef 100%)',
                  borderRadius: 16,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 140,
                  cursor: 'pointer',
                  border: '1px solid #e8e8ed',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1d1d1f' }}>{cat}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0071e3', fontSize: '0.85rem', fontWeight: 600, marginTop: 12 }}>
                  Explorar linha <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'flashSaleSection': {
      return (
        <div style={{ background: '#1d1d1f', color: '#fff', borderRadius: 20, padding: '36px 32px', margin: '20px 0', ...s }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ff3b30', color: '#fff', padding: '4px 10px', borderRadius: 980, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                <Zap size={12} fill="#fff" /> {String(content.badge_text || 'OFERTA RELÂMPAGO')}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{String(content.title || 'Ofertas Relâmpago TEKNIX')}</h3>
              {Boolean(content.subtitle) && <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: '0.9rem' }}>{String(content.subtitle)}</p>}
            </div>
            {Boolean(content.end_date) && (
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 600 }}>Termina em breve</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#a2e000', marginTop: 2 }}>
                  {new Date(content.end_date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

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

    case 'testimonials': {
      const items = (Array.isArray(content.testimonials) ? content.testimonials : []).length > 0
        ? content.testimonials
        : [{ text: content.text || '', author: content.author || content.name || '', role: content.role || '' }]
      return (
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8, ...s }}>
          {(items as any[]).filter((t: any) => t.text || t.author).map((item: Record<string, unknown>, i: number) => (
            <div key={i} style={{ minWidth: 280, background: '#f5f5f7', borderRadius: 18, padding: 28 }}>
              <p style={{ fontStyle: 'italic', color: '#1d1d1f', lineHeight: 1.6 }}>"{String(item.text || '')}"</p>
              <p style={{ fontWeight: 600, marginTop: 12, color: '#6e6e73', fontSize: '0.9rem' }}>— {String(item.author || '')}</p>
              {Boolean(item.role) && <p style={{ fontSize: '0.8rem', color: '#86868b', marginTop: 4 }}>{String(item.role)}</p>}
            </div>
          ))}
        </div>
      )
    }

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
          {Boolean(content.title) && <h3 style={{ margin: '0 0 8px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#141414', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{String(content.title)}</h3>}
          {Boolean(content.subtitle || content.text) && <p style={{ margin: '0 0 24px', color: '#6e6e73' }}>{String(content.subtitle || content.text)}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
            <input type="email" placeholder="Seu e-mail" style={{ flex: 1, padding: '12px 16px', borderRadius: 980, border: '1px solid #d2d2d7', fontSize: '0.9rem', outline: 'none' }} />
            <button style={{ background: '#1d1d1f', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 980, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              {String(content.button_text || content.btn_text || 'Inscrever')}
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
            <span style={{ fontSize: 36, fontWeight: 800, color: isPromo ? '#a2e000' : '#1d1d1f', letterSpacing: '-0.02em' }}>
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

    case 'embed':
      return (
        <div style={s} dangerouslySetInnerHTML={{ __html: (content.html_code as string) || '<p>Embed</p>' }} />
      )

    case 'code':
      return (
        <pre style={{ background: '#1d1d1f', color: '#f5f5f7', padding: 24, borderRadius: 12, overflow: 'auto', ...s }}>
          <code>{(content.code as string) || (content.html as string) || (content.html_code as string) || ''}</code>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...s }}>
          {(Array.isArray(content.steps) ? content.steps : []).map((step: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 0', borderBottom: i < (content.steps || []).length - 1 ? '1px solid #e8e8ed' : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: step.color || '#1d1d1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                {Boolean(step.title) && <h4 style={{ margin: 0, color: '#1d1d1f', fontWeight: 600, fontSize: '1.05rem' }}>{String(step.title)}</h4>}
                {Boolean(step.content) && <p style={{ margin: '6px 0 0', color: '#6e6e73', lineHeight: 1.6, fontSize: '0.9rem' }}>{String(step.content)}</p>}
              </div>
            </div>
          ))}
          {(!content.steps || (Array.isArray(content.steps) && content.steps.length === 0)) && (
            <div style={{ padding: 20, color: '#86868b', textAlign: 'center' }}>Adicione passos no Inspector</div>
          )}
        </div>
      )

    case 'imageText':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', ...s }}>
          <div>
            {Boolean(content.image) && <img src={content.image as string} alt="" style={{ width: '100%', borderRadius: 18 }} />}
          </div>
          <div>
            {Boolean(content.title) && <h2 style={{ margin: '0 0 16px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, color: '#141414', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{String(content.title)}</h2>}
            {Boolean(content.text) && <div style={{ color: '#6e6e73', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content.text as string }} />}
          </div>
        </div>
      )

    case 'tabs':
      return <ElementorTabs content={content} widget={widget} s={s} />

    case 'accordion':
      return <ElementorAccordionWidget content={content} widget={widget} s={s} />

    case 'toggle':
      return <ElementorAccordionWidget content={content} widget={widget} s={s} forcedBehavior="multiple" />

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
    case 'priceTablePro': {
      const features: string[] = Array.isArray(content.features)
        ? content.features
        : typeof content.features === 'string'
        ? content.features.split('\n').map((f: string) => f.trim()).filter(Boolean)
        : ['Acesso completo ao catálogo', 'Suporte prioritário 24/7', 'Atualizações e novidades']
      return (
        <div className="elementor-price-table" style={{ background: content.card_bg || '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center', position: 'relative', ...s }}>
          {content.ribbon_title && (
            <div className="elementor-price-table__ribbon" style={{ background: content.ribbon_bg || '#db468e', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {String(content.ribbon_title)}
            </div>
          )}
          <div className="elementor-price-table__header" style={{ background: content.header_bg || 'transparent', padding: '28px 20px 12px' }}>
            <h3 className="elementor-price-table__heading" style={{ color: content.title_color || '#1d1d1f', fontSize: 24, fontWeight: 700, margin: 0 }}>
              {String(content.heading || content.title || content.plan || 'Plano Profissional')}
            </h3>
            {(content.subheading || content.subtitle) && (
              <span className="elementor-price-table__subheading" style={{ color: content.subtitle_color || '#86868b', fontSize: 13, marginTop: 4, display: 'block' }}>
                {String(content.subheading || content.subtitle)}
              </span>
            )}
          </div>
          <div className="elementor-price-table__price" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', padding: '20px 0', gap: 4 }}>
            {content.original_price && (
              <span className="elementor-price-table__original-price" style={{ textDecoration: 'line-through', color: '#86868b', fontSize: '1rem', marginRight: 8 }}>
                {String(content.currency || 'R$')} {String(content.original_price)}
              </span>
            )}
            <span className="elementor-price-table__currency" style={{ fontSize: '1.4rem', fontWeight: 700, color: content.price_color || '#1d1d1f' }}>
              {String(content.currency || 'R$')}
            </span>
            <span className="elementor-price-table__integer-part" style={{ fontSize: '3rem', fontWeight: 800, color: content.price_color || '#1d1d1f', lineHeight: 1 }}>
              {String(content.price || '149')}
            </span>
            {content.fractional_part && (
              <span className="elementor-price-table__fractional-part" style={{ fontSize: '1.2rem', fontWeight: 700, color: content.price_color || '#1d1d1f' }}>
                {String(content.fractional_part)}
              </span>
            )}
            <span className="elementor-price-table__period" style={{ fontSize: '0.9rem', color: content.period_color || '#86868b', marginLeft: 4 }}>
              {String(content.period || '/mês')}
            </span>
          </div>
          <ul className="elementor-price-table__features-list" style={{ listStyle: 'none', padding: '0 24px', margin: '16px 0' }}>
            {features.map((feat, idx) => (
              <li key={idx} style={{ padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderTop: idx > 0 ? '1px solid #f0f0f2' : 'none' }}>
                <Check size={16} color={content.check_color || '#0071e3'} />
                <span className="elementor-price-table__feature-inner" style={{ fontSize: 14, color: '#333' }}>{feat}</span>
              </li>
            ))}
          </ul>
          <div className="elementor-price-table__footer" style={{ padding: '20px 24px 32px' }}>
            <button
              className="elementor-price-table__button elementor-button"
              style={{
                width: '100%',
                padding: '14px 24px',
                background: content.button_bg || '#1d1d1f',
                color: content.button_color || '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {String(content.button_label || content.button_text || 'Assinar Agora')}
            </button>
            {content.additional_info && (
              <div className="elementor-price-table__additional_info" style={{ color: '#86868b', fontSize: 12, marginTop: 10 }}>
                {String(content.additional_info)}
              </div>
            )}
          </div>
        </div>
      )
    }

    case 'countdown':
    case 'countdownPro':
      return <CountdownTimer content={content} s={s} />

    case 'counter': {
      const prefix = String(content.prefix || '')
      const numVal = String(content.starting_number || content.ending_number || content.number || '10.000')
      const suffix = String(content.suffix || '+')
      const title = String(content.title || 'Clientes Satisfeitos')
      const numberColor = (widget as any).number_color || (content.number_color as string) || (s.color as string) || '#1d1d1f'
      const numberSize = (widget as any).number_size || (content.number_size as string) || '3rem'
      const titleColor = (widget as any).title_color || (content.title_color as string) || '#86868b'
      const titleSize = (widget as any).title_size || (content.title_size as string) || '0.95rem'
      const alignVal = (s.textAlign as string) || (content.align as string) || 'center'
      return (
        <div className="elementor-counter" style={{ textAlign: alignVal as any, padding: 24, ...s }}>
          <div className="elementor-counter-number-wrapper" style={{ fontSize: numberSize, fontWeight: 900, color: numberColor, display: 'flex', justifyContent: alignVal === 'left' ? 'flex-start' : alignVal === 'right' ? 'flex-end' : 'center', alignItems: 'baseline', gap: 4 }}>
            {prefix && <span className="elementor-counter-number-prefix" style={{ fontSize: '0.6em', opacity: 0.85 }}>{prefix}</span>}
            <span className="elementor-counter-number">{numVal}</span>
            {suffix && <span className="elementor-counter-number-suffix" style={{ fontSize: '0.6em', opacity: 0.85 }}>{suffix}</span>}
          </div>
          <div className="elementor-counter-title" style={{ fontSize: titleSize, color: titleColor, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginTop: 6 }}>
            {title}
          </div>
        </div>
      )
    }

    case 'progress':
    case 'progressBar': {
      const title = String(content.title || 'Performance')
      const percent = Math.min(100, Math.max(0, Number(content.percent ?? 95)))
      const barColor = (widget as any).bar_color || (content.color as string) || (content.bar_color as string) || '#B5F500'
      const barBg = (widget as any).bar_bg || (content.bar_bg as string) || '#e8e8ed'
      const barHeight = Number((widget as any).bar_height || content.bar_height || 10)
      const borderRadius = Number((widget as any).border_radius || content.border_radius || 5)
      const titleColor = (widget as any).title_color || (content.title_color as string) || '#1d1d1f'
      return (
        <div className="elementor-progress-wrapper" style={{ width: '100%', ...s }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8, fontWeight: 600, color: titleColor }}>
            <span className="elementor-title">{title}</span>
            <span>{percent}%</span>
          </div>
          <div style={{ height: barHeight, background: barBg, borderRadius, overflow: 'hidden' }}>
            <div className="elementor-progress-bar" style={{ width: `${percent}%`, height: '100%', background: barColor, borderRadius, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )
    }

    case 'alert': {
      const alertType = (content.alert_type as string) || 'warning'
      const alertColors: Record<string, { bg: string; border: string; color: string }> = {
        success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
        error: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
        info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
        warning: { bg: '#fffbeb', border: '#fef3c7', color: '#b45309' },
      }
      const ac = alertColors[alertType] || alertColors.warning
      return (
        <div style={{ padding: 16, background: ac.bg, border: `1px solid ${ac.border}`, borderRadius: 8, color: ac.color, fontSize: '0.95rem', ...s }}>
          {Boolean(content.title) && <strong style={{ display: 'block', marginBottom: 4 }}>{String(content.title)}</strong>}
          {String(content.description || content.text || 'Atenção: Mensagem informativa.')}
        </div>
      )
    }

    case 'googleMaps':
    case 'googleMapsPro':
    case 'google-maps': {
      const w = widget as any
      const rawSettings = w.settings || {}
      const rawStyleObj = w.style || {}
      const address = (resolveDynamicValue(content.address || (content as any).location, product) as string) || 'Av. Paulista, 1000, São Paulo - SP'
      const zoom = Number(content.zoom || rawSettings.zoom || 14)
      const height = parseInt(String(content.height || rawSettings.height || rawStyleObj.height || 350)) || 350
      const width = (content.width as string) || rawSettings.width || rawStyleObj.width || '100%'
      const alignVal = (s.textAlign as string) || (content.align as string) || (content.text_align as string) || rawSettings.text_align || 'center'
      const flexJustify = alignVal === 'left' ? 'flex-start' : alignVal === 'right' ? 'flex-end' : 'center'
      const borderRadius = s.borderRadius || rawSettings.border_radius || '16px'
      const boxShadow = s.boxShadow || rawSettings.box_shadow || '0 4px 20px rgba(0,0,0,0.06)'
      const border = s.border || (rawSettings.border_style && rawSettings.border_style !== 'none' ? `${rawSettings.border_width || '1px'} ${rawSettings.border_style} ${rawSettings.border_color || '#e8e8ed'}` : undefined)

      const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`

      return (
        <div id={id} className={className} style={{ width: '100%', display: 'flex', justifyContent: flexJustify, ...s }}>
          <div
            style={{
              width,
              maxWidth: '100%',
              height,
              borderRadius,
              boxShadow,
              border,
              overflow: 'hidden',
              position: 'relative',
              background: '#f5f5f7'
            }}
          >
            <iframe
              title={`Google Map - ${address}`}
              src={mapUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
              loading="lazy"
            />
          </div>
        </div>
      )
    }

    case 'newsletter':
      return (
        <div style={{ padding: 32, background: '#1d1d1f', color: '#fff', borderRadius: 16, textAlign: 'center', ...s }}>
          <h3 style={{ margin: '0 0 8px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Receba Novidades TEKNIX</h3>
          <p style={{ margin: '0 0 20px', opacity: 0.8, fontSize: '0.9rem' }}>Fique por dentro dos lançamentos e ofertas exclusivas.</p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 440, margin: '0 auto' }}>
            <input placeholder="Seu melhor e-mail" style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none' }} />
            <button style={{ padding: '10px 20px', background: '#B5F500', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Cadastrar</button>
          </div>
        </div>
      )

    case 'socialIcons':
    case 'shareButtons':
    case 'shareButtonsEl':
    case 'shareButtonsPro': {
      const networkColors: Record<string, string> = { facebook: '#1877F2', twitter: '#1DA1F2', whatsapp: '#25D366', linkedin: '#0A66C2', telegram: '#0088cc', email: '#86868b', pinterest: '#BD081C' }
      const networks = Array.isArray(content.networks) && content.networks.length > 0 ? content.networks : ['facebook', 'twitter', 'whatsapp', 'linkedin']
      const shareUrl = String(content.share_url || '#')
      const shareTitle = content.title || 'Compartilhar'
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...s }}>
          {Boolean(shareTitle) && <h4 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{String(shareTitle)}</h4>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {networks.map((net: string, idx: number) => (
              <a
                key={idx}
                href={shareUrl}
                onClick={e => { if (shareUrl === '#') e.preventDefault() }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 980,
                  background: networkColors[net.toLowerCase()] || '#86868b',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{String(net)}</span>
              </a>
            ))}
          </div>
        </div>
      )
    }

    case 'iconList': {
      const items = (Array.isArray(content.items) && content.items.length > 0)
        ? content.items
        : typeof content.text === 'string' && content.text.includes('\n')
        ? content.text.split('\n').filter(Boolean).map((t: string) => ({ text: t }))
        : [
            { text: 'Motor Brushless 21V de alto torque' },
            { text: 'Bateria Íon-Lítio com autonomia estendida' },
            { text: 'Mandril de aperto rápido metálico 1/2"' },
            { text: 'Garantia oficial de 12 meses TEKNIX' }
          ]
      const iconColor = (content.icon_color as string) || '#a2e000'
      const textColor = (content.text_color as string) || '#1d1d1f'
      return (
        <ul className="elementor-icon-list-items" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, ...s }}>
          {items.map((item: any, idx: number) => {
            const itemText = typeof item === 'string' ? item : item.text || item.title || `Item ${idx + 1}`
            return (
              <li key={idx} className="elementor-icon-list-item" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: textColor }}>
                <span className="elementor-icon-list-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: iconColor, color: '#fff', fontSize: 12, flexShrink: 0 }}>✓</span>
                <span className="elementor-icon-list-text">{itemText}</span>
              </li>
            )
          })}
        </ul>
      )
    }

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
      return <LottiePlayer content={content} s={s} />

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

    case 'productLineupGallery':
    case 'productTileGallery': {
      return (
        <ProductLineupGallery
          content={content}
          style={s}
          className={(widget as any).custom_class || ''}
        />
      )
    }

    case 'featureCardsGallery':
    case 'appleFeatureCards': {
      return (
        <AppleFeatureCardsGallery
          content={content}
          style={s}
          className={(widget as any).custom_class || ''}
        />
      )
    }

    case 'appleImageAccordion':
    case 'imageAccordion': {
      return (
        <AppleImageAccordion
          content={content}
          style={s}
          className={(widget as any).custom_class || ''}
        />
      )
    }

    case 'cards':
    case 'storeBenefits':
    case 'appleStoreBenefits':
    case 'storeCardsScroller': {
      return (
        <AppleStoreBenefitsScroller
          content={content}
          style={s}
          className={(widget as any).custom_class || ''}
        />
      )
    }

    case 'carrossel':
    case 'offersCarousel':
    case 'appleOffersCarousel':
    case 'specialOffers': {
      return (
        <AppleStoreOffersScroller
          content={content}
          style={s}
          className={(widget as any).custom_class || ''}
        />
      )
    }

    // ── GALERIA DE IMAGENS PRO (1:1 Elementor Pro Gallery) ──
    case 'imageGalleryPro':
    case 'gallery':
    case 'image-gallery-pro':
    case 'imageGallery': {
      const w = widget as any
      const rawSettings = w.settings || {}
      const rawStyleObj = w.style || {}
      const columns = parseInt(String(content.columns || rawSettings.columns || 3)) || 3
      const gap = content.gap || rawSettings.gap || rawStyleObj.gap || '16px'
      const aspectRatio = (content.aspect_ratio as string) || rawSettings.aspect_ratio || '16/9'
      const borderRadius = s.borderRadius || content.border_radius || rawSettings.border_radius || '12px'
      const boxShadow = s.boxShadow || rawSettings.box_shadow || '0 4px 14px rgba(0,0,0,0.06)'
      const isLightbox = content.lightbox !== false

      const rawItems = content.gallery || content.items || content.images || rawSettings.gallery || []
      const items: Array<{ id?: string; url?: string; title?: string }> = Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems
        : [
            { id: '1', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=80', title: 'Item #1' },
            { id: '2', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', title: 'Item #2' },
            { id: '3', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80', title: 'Item #3' },
            { id: '4', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80', title: 'Item #4' },
            { id: '5', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', title: 'Item #5' },
            { id: '6', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop&q=80', title: 'Item #6' },
          ]

      return (
        <div id={id} className={className} style={{ width: '100%', boxSizing: 'border-box', ...s }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap,
              width: '100%',
            }}
          >
            {items.map((gItem, idx) => {
              const itemUrl = gItem.url || ''
              return (
                <div
                  key={gItem.id || idx}
                  style={{
                    position: 'relative',
                    borderRadius,
                    boxShadow,
                    overflow: 'hidden',
                    backgroundColor: '#f5f5f7',
                    aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
                    cursor: isLightbox ? 'zoom-in' : 'pointer',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.025)'
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.14)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = boxShadow
                  }}
                >
                  {itemUrl ? (
                    <img
                      src={itemUrl}
                      alt={gItem.title || `Galeria foto ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.4s ease',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', minHeight: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#86868b', gap: 6 }}>
                      <ImageIcon size={24} />
                      <span style={{ fontSize: 11 }}>Sem imagem</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // ── FORMULÁRIO PRO (1:1 Apple / Elementor Pro Form Builder) ──
    case 'form':
    case 'formPro':
    case 'form-pro': {
      const w = widget as any
      const rawSettings = w.settings || {}
      const showLabels = content.show_labels !== false
      const buttonText = (content.button_text as string) || 'Enviar Mensagem'
      const buttonSize = (content.button_size as string) || 'md'
      const buttonAlign = (content.button_align as string) || 'left'
      const buttonBg = (content.button_bg as string) || rawSettings.button_bg || '#1d1d1f'
      const buttonColor = (content.button_color as string) || rawSettings.button_color || '#ffffff'

      const rawFields = content.form_fields || content.fields || rawSettings.form_fields || []
      const fields: Array<{
        id?: string
        field_type?: string
        field_label?: string
        placeholder?: string
        column_width?: string
        required?: boolean
      }> = Array.isArray(rawFields) && rawFields.length > 0
        ? rawFields
        : [
            { id: '1', field_type: 'text', field_label: 'Nome Completo', placeholder: 'Digite seu nome', column_width: '100%', required: true },
            { id: '2', field_type: 'email', field_label: 'E-mail', placeholder: 'seu@email.com', column_width: '50%', required: true },
            { id: '3', field_type: 'tel', field_label: 'Telefone / WhatsApp', placeholder: '(11) 99999-9999', column_width: '50%', required: false },
            { id: '4', field_type: 'textarea', field_label: 'Mensagem', placeholder: 'Como podemos te ajudar?', column_width: '100%', required: false },
          ]

      const btnPadding = buttonSize === 'sm' ? '8px 16px' : buttonSize === 'lg' ? '14px 28px' : '11px 22px'
      const btnFontSize = buttonSize === 'sm' ? '13px' : buttonSize === 'lg' ? '16px' : '14px'
      const isFullWidthBtn = buttonSize === 'full' || buttonAlign === 'justify'

      return (
        <div id={id} className={className} style={{ width: '100%', boxSizing: 'border-box', ...s }}>
          <form
            onSubmit={e => e.preventDefault()}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {fields.map((f, idx) => {
              const colW = f.column_width || '100%'
              const flexBasis = colW === '50%' ? 'calc(50% - 7px)' : colW === '33.33%' || colW === '33%' ? 'calc(33.33% - 10px)' : colW === '25%' ? 'calc(25% - 11px)' : colW === '75%' ? 'calc(75% - 5px)' : '100%'
              const type = f.field_type || 'text'
              const label = f.field_label || `Campo #${idx + 1}`
              const placeholder = f.placeholder || ''

              return (
                <div
                  key={f.id || idx}
                  style={{
                    flexBasis,
                    flexGrow: 1,
                    minWidth: '240px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxSizing: 'border-box',
                  }}
                >
                  {showLabels && (
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f' }}>
                      {label}
                      {f.required && <span style={{ color: '#ff3b30', marginLeft: '3px' }}>*</span>}
                    </label>
                  )}

                  {type === 'textarea' ? (
                    <textarea
                      rows={4}
                      placeholder={placeholder}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #d2d2d7',
                        backgroundColor: '#ffffff',
                        fontSize: '14px',
                        color: '#1d1d1f',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#0071e3'
                        e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#d2d2d7'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  ) : type === 'select' ? (
                    <select
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #d2d2d7',
                        backgroundColor: '#ffffff',
                        fontSize: '14px',
                        color: '#1d1d1f',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">{placeholder || 'Selecione uma opção...'}</option>
                      <option value="1">Opção 1</option>
                      <option value="2">Opção 2</option>
                      <option value="3">Opção 3</option>
                    </select>
                  ) : type === 'checkbox' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                      <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#0071e3' }} />
                      <span style={{ fontSize: '13px', color: '#1d1d1f' }}>{placeholder || label}</span>
                    </div>
                  ) : (
                    <input
                      type={type === 'email' ? 'email' : type === 'tel' ? 'tel' : type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'password' ? 'password' : 'text'}
                      placeholder={placeholder}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #d2d2d7',
                        backgroundColor: '#ffffff',
                        fontSize: '14px',
                        color: '#1d1d1f',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#0071e3'
                        e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#d2d2d7'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  )}
                </div>
              )
            })}

            {/* Submit Button */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: buttonAlign === 'center' ? 'center' : buttonAlign === 'right' ? 'flex-end' : 'flex-start',
                marginTop: '6px',
              }}
            >
              <button
                type="submit"
                style={{
                  width: isFullWidthBtn ? '100%' : 'auto',
                  padding: btnPadding,
                  fontSize: btnFontSize,
                  fontWeight: 600,
                  color: buttonColor,
                  backgroundColor: buttonBg,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease, transform 0.15s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '0.92'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {buttonText}
              </button>
            </div>
          </form>
        </div>
      )
    }

    // ── LOGIN WIDGET (1:1 TEKNIX / Apple IDMS Login Standard) ──
    case 'login':
    case 'loginPro':
    case 'login-pro': {
      const w = widget as any
      const rawSettings = w.settings || {}
      const showLabels = content.show_labels !== false
      const inputSize = (content.input_size as string) || 'md'
      const usernameLabel = (content.username_label as string) || 'Nome de Usuário ou E-mail'
      const usernamePlaceholder = (content.username_placeholder as string) || 'Digite seu e-mail ou usuário...'
      const passwordLabel = (content.password_label as string) || 'Senha'
      const passwordPlaceholder = (content.password_placeholder as string) || 'Digite sua senha...'

      const buttonText = (content.button_text as string) || 'Iniciar Sessão'
      const buttonSize = (content.button_size as string) || 'md'
      const buttonAlign = (content.button_align as string) || 'left'
      const buttonBg = (content.button_bg as string) || rawSettings.button_bg || '#0071e3'
      const buttonColor = (content.button_color as string) || rawSettings.button_color || '#ffffff'

      const showRememberMe = content.show_remember_me !== false
      const showLostPassword = content.show_lost_password !== false
      const showRegisterLink = content.show_register_link !== false

      const inputPadding = inputSize === 'xs' ? '6px 10px' : inputSize === 'sm' ? '8px 12px' : inputSize === 'lg' ? '14px 16px' : inputSize === 'xl' ? '16px 18px' : '11px 14px'
      const inputFontSize = inputSize === 'xs' ? '12px' : inputSize === 'sm' ? '13px' : inputSize === 'lg' ? '15px' : inputSize === 'xl' ? '16px' : '14px'

      const btnPadding = buttonSize === 'sm' ? '8px 16px' : buttonSize === 'lg' ? '14px 28px' : '11px 22px'
      const btnFontSize = buttonSize === 'sm' ? '13px' : buttonSize === 'lg' ? '16px' : '14px'
      const isFullWidthBtn = buttonSize === 'full' || buttonAlign === 'justify'

      return (
        <div id={id} className={className} style={{ width: '100%', maxWidth: 460, margin: '0 auto', boxSizing: 'border-box', ...s }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5ea',
              borderRadius: '16px',
              padding: '32px 28px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#f5f5f7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#1d1d1f', marginBottom: 12 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 600, color: '#1d1d1f', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                Iniciar Sessão
              </h3>
              <p style={{ fontSize: '13px', color: '#86868b', margin: 0 }}>
                Acesse sua conta para gerenciar pedidos e compras
              </p>
            </div>

            <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Username Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {showLabels && (
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f' }}>
                    {usernameLabel}
                  </label>
                )}
                <input
                  type="text"
                  placeholder={usernamePlaceholder}
                  style={{
                    width: '100%',
                    padding: inputPadding,
                    fontSize: inputFontSize,
                    borderRadius: '10px',
                    border: '1px solid #d2d2d7',
                    backgroundColor: '#ffffff',
                    color: '#1d1d1f',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#0071e3'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#d2d2d7'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Password Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {showLabels && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f' }}>
                      {passwordLabel}
                    </label>
                    {showLostPassword && (
                      <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: '12px', color: '#0071e3', textDecoration: 'none' }}>
                        Esqueceu a senha?
                      </a>
                    )}
                  </div>
                )}
                <input
                  type="password"
                  placeholder={passwordPlaceholder}
                  style={{
                    width: '100%',
                    padding: inputPadding,
                    fontSize: inputFontSize,
                    borderRadius: '10px',
                    border: '1px solid #d2d2d7',
                    backgroundColor: '#ffffff',
                    color: '#1d1d1f',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#0071e3'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#d2d2d7'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Remember Me */}
              {showRememberMe && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id={`${id}-remember`} style={{ width: 16, height: 16, accentColor: '#0071e3', cursor: 'pointer' }} />
                  <label htmlFor={`${id}-remember`} style={{ fontSize: '13px', color: '#424245', cursor: 'pointer' }}>
                    Lembrar de mim
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: buttonAlign === 'center' ? 'center' : buttonAlign === 'right' ? 'flex-end' : 'flex-start', marginTop: '4px' }}>
                <button
                  type="submit"
                  style={{
                    width: isFullWidthBtn ? '100%' : 'auto',
                    padding: btnPadding,
                    fontSize: btnFontSize,
                    fontWeight: 600,
                    color: buttonColor,
                    backgroundColor: buttonBg,
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease, transform 0.15s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '0.92'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {buttonText}
                </button>
              </div>

              {/* Register Link */}
              {showRegisterLink && (
                <div style={{ textAlign: 'center', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #f0f0f2', fontSize: '13px', color: '#86868b' }}>
                  Não tem uma conta TEKNIX?{' '}
                  <a href="#" onClick={e => e.preventDefault()} style={{ color: '#0071e3', fontWeight: 500, textDecoration: 'none' }}>
                    Crie a sua agora ›
                  </a>
                </div>
              )}
            </form>
          </div>
        </div>
      )
    }

    // ── THEME BUILDER & POSTS WIDGETS ──
    case 'postExcerpt':
    case 'post-excerpt': {
      const excerpt = resolveDynamicValue(content.excerpt || content.text || (content as any).custom_excerpt, product) as string ||
        'Descubra as novidades mais recentes e inovações da linha TEKNIX. Equipamentos de alta performance projetados para entregar máxima eficiência, durabilidade e precisão profissional.'
      const showReadMore = content.show_read_more !== false
      const readMoreText = (content.read_more_text as string) || 'Ler mais ›'
      const alignVal = (s.textAlign as string) || (content.align as string) || 'left'
      return (
        <div id={id} className={className} style={{ width: '100%', textAlign: alignVal as any, ...s }}>
          <p style={{ margin: '0 0 8px', color: s.color || '#6e6e73', fontSize: s.fontSize || '15px', lineHeight: s.lineHeight || '1.6', fontFamily: s.fontFamily || 'inherit' }}>
            {excerpt}
          </p>
          {showReadMore && (
            <a
              href="#"
              onClick={e => e.preventDefault()}
              style={{
                color: '#0071e3',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {readMoreText}
            </a>
          )}
        </div>
      )
    }

    case 'postTitle':
    case 'post-title': {
      const Tag = ((content.tag as string) || 'h1') as any
      const title = resolveDynamicValue(content.title || content.text, product) as string || 'Título do Artigo / Publicação'
      return (
        <Tag
          id={id}
          className={className}
          style={{
            margin: 0,
            fontSize: s.fontSize || '2.25rem',
            fontWeight: s.fontWeight || 700,
            color: s.color || '#1d1d1f',
            letterSpacing: '-0.025em',
            lineHeight: '1.2',
            textAlign: (s.textAlign as any) || 'inherit',
            ...s
          }}
        >
          {title}
        </Tag>
      )
    }

    case 'postContent':
    case 'post-content': {
      const bodyText = resolveDynamicValue(content.body || content.text, product) as string ||
        'Este é o conteúdo principal do artigo. Aqui são exibidas todas as seções informativas, imagens detalhadas, especificações técnicas e recomendações de uso para os clientes.'
      return (
        <div
          id={id}
          className={className}
          style={{
            width: '100%',
            color: s.color || '#1d1d1f',
            fontSize: s.fontSize || '16px',
            lineHeight: s.lineHeight || '1.75',
            textAlign: (s.textAlign as any) || 'inherit',
            ...s
          }}
        >
          <p style={{ margin: '0 0 16px' }}>{bodyText}</p>
        </div>
      )
    }

    case 'featuredImage':
    case 'featured-image':
    case 'post-featured-image': {
      const src = resolveDynamicValue(content.image || (content as any).url, product) as string || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=80'
      const alt = resolveDynamicValue(content.alt, product) as string || 'Imagem em Destaque'
      const borderRadius = s.borderRadius || '16px'
      const boxShadow = s.boxShadow || '0 8px 30px rgba(0,0,0,0.08)'
      return (
        <div id={id} className={className} style={{ width: '100%', display: 'flex', justifyContent: (s.textAlign as any) || 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: s.maxWidth || '100%', borderRadius, boxShadow, overflow: 'hidden' }}>
            <img src={src} alt={alt} style={{ width: '100%', height: s.height || 'auto', maxHeight: s.maxHeight || 480, objectFit: (s.objectFit as any) || 'cover', display: 'block', ...s }} />
          </div>
        </div>
      )
    }

    case 'postInfo':
    case 'post-info': {
      const date = (content.date as string) || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      const author = (content.author as string) || 'Equipe Editorial TEKNIX'
      const category = (content.category as string) || 'Tecnologia & Inovação'
      const showDate = content.show_date !== false
      const showAuthor = content.show_author !== false
      const showCategory = content.show_category !== false
      return (
        <div id={id} className={className} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: '13px', color: '#86868b', ...s }}>
          {showAuthor && <span>👤 {author}</span>}
          {showDate && <span>📅 {date}</span>}
          {showCategory && <span style={{ background: '#f5f5f7', padding: '2px 8px', borderRadius: 6, color: '#1d1d1f', fontWeight: 500 }}>{category}</span>}
        </div>
      )
    }

    case 'postNavigation':
    case 'post-navigation': {
      return (
        <div id={id} className={className} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '16px 0', borderTop: '1px solid #e8e8ed', borderBottom: '1px solid #e8e8ed', ...s }}>
          <a href="#" onClick={e => e.preventDefault()} style={{ color: '#0071e3', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>← Post Anterior</a>
          <a href="#" onClick={e => e.preventDefault()} style={{ color: '#0071e3', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Próximo Post →</a>
        </div>
      )
    }

    case 'authorBox':
    case 'author-box': {
      const name = (content.name as string) || 'Alison Thiago'
      const bio = (content.bio as string) || 'Especialista em tecnologia, engenharia de software e curadoria de dispositivos premium.'
      const avatar = (content.avatar as string) || ''
      return (
        <div id={id} className={className} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 20, background: '#fbfbfd', border: '1px solid #e8e8ed', borderRadius: 16, ...s }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0071e3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
            {avatar ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0)}
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#1d1d1f' }}>{name}</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#6e6e73', lineHeight: 1.4 }}>{bio}</p>
          </div>
        </div>
      )
    }

    case 'siteLogo':
    case 'site-logo': {
      return (
        <div id={id} className={className} style={{ display: 'inline-flex', alignItems: 'center', ...s }}>
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.04em', color: '#1d1d1f' }}>teknix<span style={{ color: '#0071e3' }}>.</span></span>
        </div>
      )
    }

    case 'siteTitle':
    case 'site-title': {
      return (
        <div id={id} className={className} style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1d1d1f', ...s }}>
          TEKNIX Store
        </div>
      )
    }

    case 'pageTitle':
    case 'page-title': {
      return (
        <h1 id={id} className={className} style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#1d1d1f', ...s }}>
          Título da Página
        </h1>
      )
    }

    case 'searchForm':
    case 'search-form': {
      return (
        <div id={id} className={className} style={{ width: '100%', maxWidth: 400, position: 'relative', ...s }}>
          <input
            type="text"
            placeholder="Buscar produtos, artigos ou categorias..."
            style={{ width: '100%', padding: '10px 16px', paddingRight: 40, border: '1px solid #d2d2d7', borderRadius: 980, fontSize: '14px', background: '#f5f5f7', outline: 'none', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>🔍</span>
        </div>
      )
    }

    case 'chapterNav':
    case 'productNav':
    case 'categoryNav': {
      return (
        <ChapterNav
          content={content}
          style={s}
          className={(widget as any).custom_class || ''}
        />
      )
    }

    case 'entertainmentGallery':
    case 'mediaGallery':
    case 'endlessEntertainment': {
      return (
        <EndlessEntertainmentGallery
          content={content}
          style={s}
          className={(widget as any).custom_class || ''}
        />
      )
    }

    case 'mediaCarousel':
    case 'mediaCarouselPro': {
      const images = Array.isArray(content.images) ? content.images : []
      return <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...s }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: 4 }}>
          {images.map((img: any, i: number) => <div key={i} style={{ flexShrink: 0, minWidth: 200 }}>
            {img.url ? <img src={img.url} alt={img.text || ''} style={{ width: 240, height: 160, borderRadius: 12, objectFit: 'cover' }} /> : <div style={{ width: 240, height: 160, borderRadius: 12, background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: 13 }}>Sem imagem</div>}
            {Boolean(img.text) && <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#1d1d1f', fontWeight: 500 }}>{String(img.text)}</p>}
            {Boolean(img.link) && <a href={String(img.link)} onClick={e => e.preventDefault()} style={{ fontSize: '0.8rem', color: '#0071e3', textDecoration: 'none' }}>Ver mais →</a>}
          </div>)}
          {images.length === 0 && <div style={{ padding: 20, color: '#86868b' }}>Adicione slides no Inspector</div>}
        </div>
      </div>
    }

    case 'flipBox':
    case 'flipBoxPro': {
      const effect = content.effect || 'flip'
      const direction = content.direction || 'right'
      const is3d = content.is_3d !== false
      return (
        <div className={`elementor-widget-flip-box elementor-flip-box--effect-${effect} elementor-flip-box--direction-${direction} ${is3d ? 'elementor-flip-box--3d' : ''}`} style={{ minHeight: content.height || 280, ...s }}>
          <div className="elementor-flip-box">
            <div className="elementor-flip-box__layer elementor-flip-box__front" style={{ backgroundColor: content.front_bg || '#1abc9c', borderRadius: 16, overflow: 'hidden' }}>
              <div className="elementor-flip-box__layer__overlay">
                <div className="elementor-flip-box__layer__inner">
                  {content.front_image && (
                    <div className="elementor-flip-box__image">
                      <img src={String(content.front_image)} alt="" style={{ maxWidth: '80%', maxHeight: 100, objectFit: 'contain', margin: '0 auto 16px' }} />
                    </div>
                  )}
                  {content.front_icon && (
                    <div className="elementor-icon-wrapper" style={{ marginBottom: 16 }}>
                      <div className="elementor-icon">{renderDynamicIcon(content.front_icon, 36, content.front_icon_color || '#fff')}</div>
                    </div>
                  )}
                  <h3 className="elementor-flip-box__layer__title" style={{ color: content.front_color || '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
                    {String(content.front_title || content.title || 'Frente')}
                  </h3>
                  {(content.front_subtitle || content.front_description) && (
                    <div className="elementor-flip-box__layer__description" style={{ color: content.front_color || '#fff', opacity: 0.9, fontSize: 14, lineHeight: 1.5 }}>
                      {String(content.front_subtitle || content.front_description)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="elementor-flip-box__layer elementor-flip-box__back" style={{ backgroundColor: content.back_bg || '#4054b2', borderRadius: 16, overflow: 'hidden' }}>
              <div className="elementor-flip-box__layer__overlay">
                <div className="elementor-flip-box__layer__inner">
                  <h3 className="elementor-flip-box__layer__title" style={{ color: content.back_color || '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
                    {String(content.back_title || 'Verso')}
                  </h3>
                  {(content.back_subtitle || content.back_description) && (
                    <div className="elementor-flip-box__layer__description" style={{ color: content.back_color || '#fff', opacity: 0.9, fontSize: 14, lineHeight: 1.5 }}>
                      {String(content.back_subtitle || content.back_description)}
                    </div>
                  )}
                  {content.button_text && (
                    <a className="elementor-flip-box__button elementor-button" href={content.button_link || '#'} style={{ marginTop: 16, padding: '10px 24px', border: '2px solid #fff', borderRadius: 8, color: '#fff', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
                      {String(content.button_text)}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    case 'hotspot': {
      const spots = Array.isArray(content.hotspots) ? content.hotspots : []
      return <div style={{ position: 'relative', minHeight: 300, background: '#f5f5f7', borderRadius: 12, overflow: 'hidden', ...s }}>
        {content.image ? <img src={String(content.image)} alt="" style={{ width: '100%', height: 300, objectFit: 'cover' }} /> : <div style={{ height: 300 }} />}
        {spots.map((spot: any, i: number) => <div key={i} style={{ position: 'absolute', left: `${spot.x || 50}%`, top: `${spot.y || 50}%`, width: 28, height: 28, borderRadius: '50%', background: content.dot_color || '#0071e3', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transform: 'translate(-50%,-50%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
          {i + 1}
        </div>)}
      </div>
    }

    case 'navMenu':
    case 'megaMenu': {
      const items = Array.isArray(content.items) ? content.items : [{ label: 'Início', url: '/' }, { label: 'Produtos', url: '/produtos' }, { label: 'Contato', url: '/contato' }]
      return <nav style={{ display: 'flex', gap: 8, padding: '12px 24px', background: content.background || 'transparent', borderRadius: 8, ...s }}>
        {items.map((item: any, i: number) => <a key={i} href={item.url || '#'} style={{ color: content.link_color || '#1d1d1f', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem', padding: '8px 12px', borderRadius: 6 }}>{String(item.label || item)}</a>)}
      </nav>
    }

    case 'breadcrumbsPro':
      return <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '12px 0', fontSize: '0.85rem', color: content.color || '#86868b', ...s }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</a>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: content.active_color || '#1d1d1f', fontWeight: 600 }}>{String(content.current || 'Página')}</span>
      </div>

    case 'posts':
    case 'postsCarousel': {
      return <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 12, ...s }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1d1d1f', marginBottom: 12 }}>{String(content.title || 'Posts')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${content.columns || 3}, 1fr)`, gap: 16 }}>
          {Array.from({ length: Math.min(3, Number(content.count || 3)) }).map((_, i) => <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ height: 160, background: '#e8e8ed' }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Post {i + 1}</div>
              <div style={{ fontSize: '0.85rem', color: '#86868b' }}>Resumo do post...</div>
            </div>
          </div>)}
        </div>
      </div>
    }

    case 'portfolio':
      return <div style={{ padding: 24, ...s }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${content.columns || 3}, 1fr)`, gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '#f5f5f7' }}>
            <div style={{ height: 200, background: `hsl(${i * 60}, 40%, 85%)` }} />
            <div style={{ padding: 12, fontWeight: 600 }}>Projeto {i + 1}</div>
          </div>)}
        </div>
      </div>

    case 'paypal':
    case 'paypalButton':
      return <button style={{ background: '#ffc439', color: '#003087', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, ...s }}>
        <span style={{ fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 900 }}>Pay</span><span style={{ fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 900, color: '#009cde' }}>Pal</span>
        {content.label ? <span style={{ marginLeft: 4 }}>{String(content.label)}</span> : null}
      </button>

    case 'stripe':
    case 'stripeButton': {
      const productName = content.product_name || 'Produto'
      const stripePrice = Number(content.price || 0)
      const currency = content.currency || 'BRL'
      const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : '$'
      return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, border: '1px solid #e8e8ed', borderRadius: 16, gap: 16, ...s }}>
        {Boolean(productName) && <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{String(productName)}</div>}
        {stripePrice > 0 && <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currencySymbol} {(stripePrice / 100).toFixed(2)}</div>}
        <button style={{ background: content.btn_color || '#635bff', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 36px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>{String(content.label || 'Pagar com Stripe')}</button>
      </div>
    }

    case 'offCanvas':
      return <div style={{ padding: 16, border: '2px dashed #e8e8ed', borderRadius: 12, textAlign: 'center', color: '#86868b', ...s }}>
        Off Canvas — clique para abrir painel lateral
      </div>

    case 'sticky':
      return <div style={{ padding: 12, background: '#0071e3', color: '#fff', borderRadius: 8, textAlign: 'center', fontWeight: 600, ...s }}>
        {String(content.label || 'Barra Fixa')}
      </div>

    case 'progressTracker':
      return <div style={{ width: '100%', height: 6, background: '#e8e8ed', borderRadius: 3, overflow: 'hidden', ...s }}>
        <div style={{ width: `${content.progress || 60}%`, height: '100%', background: content.color || '#0071e3', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>

    case 'pageTransitions':
      return <div style={{ padding: 16, border: '2px dashed #e8e8ed', borderRadius: 12, textAlign: 'center', color: '#86868b', ...s }}>Transição de Página</div>

    case 'customCodePro':
      return <div style={{ padding: 16, background: '#1d1d1f', color: '#B5F500', borderRadius: 12, fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', overflow: 'auto', ...s }}>
        {String(content.code || '<div>Seu código aqui</div>')}
      </div>

    case 'customCssPro':
      return <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12, fontFamily: 'monospace', fontSize: '0.8rem', color: '#86868b', ...s }}>
        CSS Customizado
      </div>

    case 'displayConditions':
      return <div style={{ padding: 16, border: '2px dashed #e8e8ed', borderRadius: 12, textAlign: 'center', color: '#86868b', ...s }}>
        Condições de Exibição
      </div>

    case 'floatingButtons': {
      const btns = Array.isArray(content.buttons) ? content.buttons : []
      const posMap: Record<string, React.CSSProperties> = { 'bottom-right': { bottom: 24, right: 24 }, 'bottom-left': { bottom: 24, left: 24 }, 'top-right': { top: 24, right: 24 }, 'top-left': { top: 24, left: 24 } }
      const pos = posMap[content.position || 'bottom-right'] || posMap['bottom-right']
      return <div style={{ position: 'fixed', ...pos, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 9999, ...s }}>
        {btns.map((btn: any, i: number) => <a key={i} href={btn.url || '#'} onClick={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 980, background: btn.bg_color || '#0071e3', color: btn.color || '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.2s ease' }}>{String(btn.label || 'Botão')}</a>)}
        {btns.length === 0 && <button style={{ width: 56, height: 56, borderRadius: '50%', background: '#0071e3', color: '#fff', border: 'none', fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>💬</button>}
      </div>
    }

    case 'linkInBio':
      return <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 24, maxWidth: 400, margin: '0 auto', ...s }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>{String(content.name || 'Link in Bio')}</div>
        {(Array.isArray(content.links) ? content.links : [{ label: 'Meu Site', url: '#' }]).map((link: any, i: number) => <a key={i} href={link.url || '#'} style={{ display: 'block', padding: '14px 20px', background: content.link_bg || '#1d1d1f', color: content.link_color || '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600, textAlign: 'center' }}>{String(link.label || link)}</a>)}
      </div>

    case 'tableOfContents':
    case 'tableOfContentsPro':
      return <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 12, ...s }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{String(content.title || 'Índice da Página')}</div>
        {(Array.isArray(content.items) ? content.items : ['Seção 1', 'Seção 2', 'Seção 3']).map((item: any, i: number) => <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #e8e8ed', color: '#0071e3', cursor: 'pointer' }}>{String(item.label || item)}</div>)}
      </div>

    case 'codeHighlightPro': {
      const themeColors: Record<string, { bg: string; text: string; label: string }> = { dark: { bg: '#1d1d1f', text: '#f5f5f7', label: '#86868b' }, light: { bg: '#f5f5f7', text: '#1d1d1f', label: '#86868b' }, monokai: { bg: '#272822', text: '#f8f8f2', label: '#75715e' }, solarized: { bg: '#002b36', text: '#839496', label: '#586e75' } }
      const th = themeColors[content.theme || 'dark'] || themeColors.dark
      return <div style={{ borderRadius: 12, overflow: 'hidden', ...s }}>
        {Boolean(content.language) && <div style={{ padding: '6px 16px', background: th.label, color: th.bg, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{String(content.language)}</div>}
        <pre style={{ margin: 0, padding: 20, background: th.bg, color: th.text, fontFamily: 'monospace', fontSize: '0.85rem', overflow: 'auto', lineHeight: 1.6 }}>
          {String(content.code || '// código aqui')}
        </pre>
      </div>
    }

    case 'lottiePro':
      return <LottiePlayer content={content} s={s} />

    case 'ctaPro':
      return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 48, background: content.background || '#0071e3', color: content.color || '#fff', borderRadius: 16, textAlign: 'center', ...s }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>{String(content.title || 'Call to Action')}</div>
        {content.subtitle && <div style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: 24, maxWidth: 600 }}>{String(content.subtitle)}</div>}
        {content.button_text && <a href={String(content.button_url || '#')} style={{ display: 'inline-block', padding: '14px 36px', background: content.btn_bg || '#fff', color: content.btn_color || '#1d1d1f', borderRadius: 12, fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>{String(content.button_text)}</a>}
      </div>

    case 'priceTablePro': {
      const plans = (Array.isArray(content.plans) ? content.plans : null) || [
        { name: content.plan1_name || 'Básico', price: content.plan1_price || 'R$ 99' },
        { name: content.plan2_name || 'Pro', price: content.plan2_price || 'R$ 199', featured: true },
      ].filter(p => p.name)
      return <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', padding: 24, ...s }}>
        {(plans as any[]).map((plan: any, i: number) => <div key={i} style={{ flex: '1 1 220px', maxWidth: 280, background: plan.featured ? content.featured_bg || '#0071e3' : '#fff', color: plan.featured ? (content.featured_color || '#fff') : '#1d1d1f', borderRadius: 16, padding: 24, textAlign: 'center', border: plan.featured ? 'none' : '1px solid #e8e8ed' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{String(plan.name)}</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{String(plan.price)}</div>
          <button style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: plan.featured ? '#fff' : '#0071e3', color: plan.featured ? '#0071e3' : '#fff', fontWeight: 600, cursor: 'pointer' }}>Escolher</button>
        </div>)}
      </div>
    }

    case 'priceList':
    case 'priceListPro':
      return <div style={{ padding: 24, textAlign: (content.align || 'left') as any, ...s }}>
        {(Array.isArray(content.items) ? content.items : [{ label: 'Item', price: 'R$ 0' }]).map((item: any, i: number) => <div key={i} style={{ padding: '14px 0', borderBottom: i < (content.items || []).length - 1 ? '1px solid #e8e8ed' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontWeight: 500, fontSize: '1rem' }}>{String(item.label || item.name)}</span>
            <span style={{ fontWeight: 700, color: '#0071e3', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>{String(item.price)}</span>
          </div>
          {Boolean(item.description) && <div style={{ fontSize: '0.85rem', color: '#86868b', marginTop: 4 }}>{String(item.description)}</div>}
        </div>)}
        </div>

    case 'animatedHeadline':
    case 'animatedHeadlinePro':
      return <AnimatedHeadline content={content} style={s} />

    case 'reviews':
    case 'reviewsPro': {
      const reviews = (Array.isArray(content.reviews) ? content.reviews : null) || [
        { author: content.review1_author || 'Cliente Satisfeito', text: content.review1_text || 'Produto excelente, entrega super rápida e atendimento impecável!', rating: 5 },
        { author: content.review2_author || 'Mariana Santos', text: content.review2_text || 'Superou todas as minhas expectativas, comprarei novamente com certeza.', rating: 5 },
        { author: content.review3_author || 'Carlos Eduardo', text: content.review3_text || 'Qualidade impressionante, acabamento premium!', rating: 5 }
      ].filter(r => r.text)
      return (
        <div className="elementor-reviews" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 20, padding: 16, ...s }}>
          {reviews.map((r: any, i: number) => (
            <div key={i} className="elementor-testimonial elementor-review" style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e8e8ed', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#f5a623', fontSize: '1.2rem', marginBottom: 12, letterSpacing: 2 }}>
                  {'★'.repeat(Number(r.rating) || 5)}
                </div>
                <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#333', marginBottom: 16, fontStyle: 'italic' }}>
                  "{String(r.text)}"
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #f0f0f2', paddingTop: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#db468e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {String(r.author || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1d1d1f' }}>{String(r.author)}</div>
                  {r.title && <div style={{ fontSize: '0.8rem', color: '#86868b' }}>{String(r.title)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'subscribe':
      return <div style={{ display: 'flex', gap: 8, padding: 16, background: '#f5f5f7', borderRadius: 12, maxWidth: 500, ...s }}>
        <input type="email" placeholder={String(content.placeholder || 'Seu e-mail')} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #e8e8ed', fontSize: '0.95rem', outline: 'none' }} />
        <button style={{ padding: '12px 24px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>{String(content.button_text || 'Inscrever')}</button>
      </div>

    case 'slides':
      return <WidgetCarousel content={content} style={s} slides />

    case 'containerPro':
      return <div style={{ padding: 20, border: '2px dashed #0071e3', borderRadius: 12, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0071e3', ...s }}>Container Pro</div>

    case 'nestedCarousel':
      return <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: 12, ...s }}>
        {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ flex: '0 0 200px', height: 150, background: '#f5f5f7', borderRadius: 12 }} />)}
      </div>

    case 'loopGrid':
      return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${content.columns || 3}, 1fr)`, gap: 16, padding: 16, ...s }}>
        {Array.from({ length: Number(content.count || 6) }).map((_, i) => <div key={i} style={{ background: '#f5f5f7', borderRadius: 12, height: 180 }} />)}
      </div>

    case 'videoPlaylist':
      return <div style={{ padding: 16, background: '#1d1d1f', borderRadius: 12, ...s }}>
        <div style={{ color: '#fff', fontWeight: 600, marginBottom: 12 }}>{String(content.title || 'Playlist')}</div>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #333' }}>
          <div style={{ width: 120, height: 68, background: '#333', borderRadius: 6, flexShrink: 0 }} />
          <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Vídeo {i + 1}</div>
        </div>)}
      </div>

    case 'pageTitle':
      return <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, color: content.color || '#141414', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1, ...s as any }}>{String(content.text || 'Título da Página')}</h1>

    case 'features': {
      const featureItems = (Array.isArray(content.items) ? content.items : null) || [
        { title: content.feature1_title, description: content.feature1_desc },
        { title: content.feature2_title, description: content.feature2_desc },
        { title: content.feature3_title, description: content.feature3_desc },
      ].filter(f => f.title)
      return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${content.columns || 3}, 1fr)`, gap: 24, padding: 24, ...s }}>
        {(featureItems as any[]).map((item: any, i: number) => <div key={i} style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: content.icon_bg || '#0071e3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 20 }}>✦</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{String(item.title)}</div>
          {item.description && <div style={{ fontSize: '0.85rem', color: '#86868b' }}>{String(item.description)}</div>}
        </div>)}
      </div>
    }

    case 'testimonial': {
      const quote = String(content.text || content.quote || content.description || 'Os equipamentos TEKNIX revolucionaram a produtividade da nossa equipe com precisão e durabilidade impressionantes.')
      const name = String(content.name || content.author || 'Carlos Eduardo')
      const job = String(content.job || content.role || content.title || 'Engenheiro Chefe de Obras')
      const avatar = (content.image as string) || (content.avatar as string) || ''
      const align = (content.align as string) || (s.textAlign as string) || 'center'
      const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

      return (
        <div className="elementor-testimonial-wrapper" style={{ padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #e8e8ed', textAlign: align as any, ...s }}>
          <div className="elementor-testimonial-content" style={{ fontSize: '1.05rem', color: '#1d1d1f', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 }}>
            "{quote}"
          </div>
          <div className="elementor-testimonial-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: flexAlign, gap: 4 }}>
            {avatar && (
              <div className="elementor-testimonial-image" style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', marginBottom: 4 }}>
                <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div className="elementor-testimonial-name" style={{ fontWeight: 700, color: '#1d1d1f', fontSize: '0.95rem' }}>
              {name}
            </div>
            {job && (
              <div className="elementor-testimonial-job" style={{ color: '#86868b', fontSize: '0.82rem' }}>
                {job}
              </div>
            )}
          </div>
        </div>
      )
    }

    case 'testimonialCarousel':
    case 'testimonialCarouselPro': {
      const tcItems = (Array.isArray(content.items) ? content.items : null) || [
        { text: content.text || '', author: content.author || '', role: content.role || '' },
      ].filter(t => t.text || t.author)
      return <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: 16, ...s }}>
        {(tcItems as any[]).map((item: any, i: number) => <div key={i} style={{ flex: '0 0 300px', background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e8e8ed' }}>
          <div style={{ fontSize: '0.95rem', marginBottom: 12, lineHeight: 1.5, color: '#333' }}>"{String(item.text)}"</div>
          <div style={{ fontWeight: 600 }}>{String(item.author)}</div>
          {item.role && <div style={{ fontSize: '0.8rem', color: '#86868b' }}>{String(item.role)}</div>}
        </div>)}
      </div>
    }

    case 'cart':
    case 'minicarrinho':
      return <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #e8e8ed', minWidth: 280, ...s }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{String(content.title || 'Carrinho')}</div>
        <div style={{ fontSize: '0.9rem', color: '#86868b' }}>Nenhum item no carrinho</div>
      </div>

    case 'minhaConta':
    case 'account':
      return <div style={{ padding: 24, ...s }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>{String(content.title || 'Minha Conta')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12 }}>Pedidos</div>
          <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12 }}>Dados Pessoais</div>
          <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12 }}>Endereços</div>
          <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12 }}>Segurança</div>
        </div>
      </div>

    case 'checkout':
      return <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', ...s }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>{String(content.title || 'Checkout')}</div>
        <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Dados de Cobrança</div>
          <div style={{ height: 40, background: '#e8e8ed', borderRadius: 8 }} />
        </div>
        <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Pagamento</div>
          <div style={{ height: 40, background: '#e8e8ed', borderRadius: 8 }} />
        </div>
      </div>

    case 'title':
    case 'paragraph':
    case 'rich_text':
      return (() => {
        const Tag = (content.tag as string) || 'p'
        return React.createElement(Tag, { style: s, dangerouslySetInnerHTML: { __html: (content.text as string) || '' } })
      })()

    case 'logo':
    case 'svg':
    case 'gif':
      return content.image || content.url
        ? <img src={(content.image || content.url) as string} alt={(content.alt as string) || ''} style={{ maxWidth: '100%', ...s }} />
        : <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 12, color: '#86868b', textAlign: 'center', ...s }}>{type === 'logo' ? 'Logo' : type === 'svg' ? 'SVG' : 'GIF'}</div>

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
          category: (content.product_filter as string) || (content.category as string) || undefined,
          limit: Number(content.product_limit || content.limit) || 8,
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
                  <span style={{ position: 'absolute', top: 12, right: 12, background: '#a2e000', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 980 }}>
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
                      <span style={{ fontWeight: 800, color: '#a2e000', fontSize: '1.15rem' }}>{formatPrice(displayPrice!)}</span>
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
