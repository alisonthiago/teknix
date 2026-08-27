// ============================================================
// TEKNIX PAGE BUILDER — CENTRALIZED STYLE & RESPONSIVE ENGINE
// ============================================================

export type ViewportMode = 'desktop' | 'tablet' | 'mobile'

export interface BreakpointConfig {
  desktop: { minWidth: number }
  tablet: { maxWidth: number; minWidth: number }
  mobile: { maxWidth: number }
}

export const BREAKPOINTS: BreakpointConfig = {
  desktop: { minWidth: 1025 },
  tablet: { maxWidth: 1024, minWidth: 768 },
  mobile: { maxWidth: 767 }
}

// ------------------------------------------------------------
// 1. RESPONSIVE INHERITANCE RESOLVER
// ------------------------------------------------------------

export function resolveResponsiveValue<T = any>(
  obj: any,
  property: string,
  viewport: ViewportMode = 'desktop',
  fallback?: any
): T {
  if (!obj || typeof obj !== 'object') return fallback as T

  const resp = obj.responsive || {}
  let val: any = undefined

  if (viewport === 'mobile') {
    if (resp.mobile?.[property] !== undefined && resp.mobile[property] !== '') {
      val = resp.mobile[property]
    } else if (obj[`${property}_mobile`] !== undefined && obj[`${property}_mobile`] !== '') {
      val = obj[`${property}_mobile`]
    } else if (resp.tablet?.[property] !== undefined && resp.tablet[property] !== '') {
      val = resp.tablet[property]
    } else if (obj[`${property}_tablet`] !== undefined && obj[`${property}_tablet`] !== '') {
      val = obj[`${property}_tablet`]
    } else {
      val = getBaseProperty(obj, property, fallback)
    }
  } else if (viewport === 'tablet') {
    if (resp.tablet?.[property] !== undefined && resp.tablet[property] !== '') {
      val = resp.tablet[property]
    } else if (obj[`${property}_tablet`] !== undefined && obj[`${property}_tablet`] !== '') {
      val = obj[`${property}_tablet`]
    } else {
      val = getBaseProperty(obj, property, fallback)
    }
  } else {
    if (resp.desktop?.[property] !== undefined && resp.desktop[property] !== '') {
      val = resp.desktop[property]
    } else if (obj[`${property}_desktop`] !== undefined && obj[`${property}_desktop`] !== '') {
      val = obj[`${property}_desktop`]
    } else {
      val = getBaseProperty(obj, property, fallback)
    }
  }

  return (val !== undefined && val !== '' ? val : fallback) as T
}

function getBaseProperty<T>(obj: any, property: string, fallback?: T): T {
  if (obj[property] !== undefined && obj[property] !== '') return obj[property] as T
  if (obj.settings?.[property] !== undefined && obj.settings[property] !== '') return obj.settings[property] as T
  if (obj.style?.[property] !== undefined && obj.style[property] !== '') return obj.style[property] as T
  return fallback as T
}

// ------------------------------------------------------------
// 2. SCOPED CUSTOM CSS
// ------------------------------------------------------------

export function scopeCustomCss(customCss: string, targetSelector: string): string {
  if (!customCss || typeof customCss !== 'string') return ''
  const trimmed = customCss.trim()
  if (!trimmed) return ''

  if (trimmed.includes('selector')) {
    return trimmed.replace(/\bselector\b/g, targetSelector)
  }

  if (!trimmed.includes('{') && !trimmed.includes('}')) {
    return `${targetSelector} { ${trimmed} }`
  }

  return `${targetSelector} ${trimmed}`
}

// ------------------------------------------------------------
// 3. COMPUTED STYLES FOR SITE RENDERING
// ------------------------------------------------------------

export function computeSectionStyles(section: any, viewport: ViewportMode = 'desktop'): React.CSSProperties {
  const s: React.CSSProperties = {}

  const bgType = resolveResponsiveValue<string>(section, 'bg_type', viewport, 'color')
  const bgColor = resolveResponsiveValue<string>(section, 'bg_color', viewport, '')
  const bgImage = resolveResponsiveValue<string>(section, 'bg_image', viewport, '')
  const bgGradient = resolveResponsiveValue<string>(section, 'bg_gradient', viewport, '')
  const bgPos = resolveResponsiveValue<string>(section, 'bg_position', viewport, 'center')
  const bgSize = resolveResponsiveValue<string>(section, 'bg_size', viewport, 'cover')
  const bgRepeat = resolveResponsiveValue<string>(section, 'bg_repeat', viewport, 'no-repeat')
  const bgAttachment = resolveResponsiveValue<string>(section, 'bg_attachment', viewport, 'scroll')

  if (bgType === 'color' && bgColor && bgColor !== 'transparent') {
    s.backgroundColor = bgColor
  } else if (bgType === 'gradient' && bgGradient) {
    s.background = bgGradient
  } else if (bgType === 'image' && bgImage) {
    s.backgroundImage = `url(${bgImage})`
    s.backgroundPosition = bgPos
    s.backgroundSize = bgSize
    s.backgroundRepeat = bgRepeat
    s.backgroundAttachment = bgAttachment
  }

  const pt = resolveResponsiveValue<string>(section, 'padding_top', viewport, '80px')
  const pr = resolveResponsiveValue<string>(section, 'padding_right', viewport, '0px')
  const pb = resolveResponsiveValue<string>(section, 'padding_bottom', viewport, '80px')
  const pl = resolveResponsiveValue<string>(section, 'padding_left', viewport, '0px')
  s.paddingTop = pt
  s.paddingRight = pr
  s.paddingBottom = pb
  s.paddingLeft = pl

  const mt = resolveResponsiveValue<string>(section, 'margin_top', viewport, '0px')
  const mb = resolveResponsiveValue<string>(section, 'margin_bottom', viewport, '0px')
  s.marginTop = mt
  s.marginBottom = mb

  const minHeight = resolveResponsiveValue<string>(section, 'min_height', viewport, '')
  if (minHeight && minHeight !== 'auto') s.minHeight = minHeight

  const borderTop = resolveResponsiveValue<string>(section, 'border_top', viewport, '')
  const borderBottom = resolveResponsiveValue<string>(section, 'border_bottom', viewport, '')
  const borderColor = resolveResponsiveValue<string>(section, 'border_color', viewport, '')
  const borderRadius = resolveResponsiveValue<string>(section, 'border_radius', viewport, '')
  const boxShadow = resolveResponsiveValue<string>(section, 'box_shadow', viewport, '')

  if (borderTop && borderTop !== 'none') s.borderTop = `${borderTop} solid ${borderColor || '#e8e8ed'}`
  if (borderBottom && borderBottom !== 'none') s.borderBottom = `${borderBottom} solid ${borderColor || '#e8e8ed'}`
  if (borderRadius && borderRadius !== '0') s.borderRadius = borderRadius
  if (boxShadow && boxShadow !== 'none') s.boxShadow = boxShadow

  const pos = resolveResponsiveValue<string>(section, 'position', viewport, 'relative')
  if (pos) s.position = pos as any
  const zIdx = resolveResponsiveValue(section, 'z_index', viewport, '')
  if (zIdx !== '') s.zIndex = parseInt(String(zIdx), 10)

  return s
}

export function computeContainerOuterStyles(container: any, viewport: ViewportMode = 'desktop'): React.CSSProperties {
  const s: React.CSSProperties = {}

  // 1. Width & Flexbox Distribution (50/50, 33/33/33, 25/25/25/25, etc.)
  const rawWidth = resolveResponsiveValue<string>(container, 'width', viewport, '')
  const widthVal = rawWidth && rawWidth !== '' ? rawWidth : '100%'
  s.width = widthVal
  s.boxSizing = 'border-box'

  if (widthVal && widthVal !== '100%') {
    s.flex = `0 0 ${widthVal}`
    s.maxWidth = widthVal
  } else {
    s.flex = '1 1 0%'
    s.maxWidth = '100%'
  }

  const minHeight = resolveResponsiveValue<string>(container, 'min_height', viewport, '')
  if (minHeight && minHeight !== 'auto' && minHeight !== 'none') {
    s.minHeight = minHeight
  }

  const bgType = resolveResponsiveValue<string>(container, 'bg_type', viewport, 'color')
  const bgColor = resolveResponsiveValue<string>(container, 'bg_color', viewport, '')
  const bgImage = resolveResponsiveValue<string>(container, 'bg_image', viewport, '')
  const bgGradient = resolveResponsiveValue<string>(container, 'bg_gradient', viewport, '')

  if (bgType === 'color' && bgColor && bgColor !== 'transparent') {
    s.backgroundColor = bgColor
  } else if (bgType === 'gradient' && bgGradient) {
    s.background = bgGradient
  } else if (bgType === 'image' && bgImage) {
    s.backgroundImage = `url(${bgImage})`
    s.backgroundPosition = 'center'
    s.backgroundSize = 'cover'
  }

  s.paddingTop = resolveResponsiveValue<string>(container, 'padding_top', viewport, '0px')
  s.paddingRight = resolveResponsiveValue<string>(container, 'padding_right', viewport, '0px')
  s.paddingBottom = resolveResponsiveValue<string>(container, 'padding_bottom', viewport, '0px')
  s.paddingLeft = resolveResponsiveValue<string>(container, 'padding_left', viewport, '0px')
  s.marginTop = resolveResponsiveValue<string>(container, 'margin_top', viewport, '0px')
  s.marginBottom = resolveResponsiveValue<string>(container, 'margin_bottom', viewport, '0px')
  s.marginLeft = resolveResponsiveValue<string>(container, 'margin_left', viewport, '0px')
  s.marginRight = resolveResponsiveValue<string>(container, 'margin_right', viewport, '0px')

  const border = resolveResponsiveValue<string>(container, 'border', viewport, '')
  const borderColor = resolveResponsiveValue<string>(container, 'border_color', viewport, '')
  const borderRadius = resolveResponsiveValue<string>(container, 'border_radius', viewport, '')
  const boxShadow = resolveResponsiveValue<string>(container, 'box_shadow', viewport, '')

  if (border && border !== 'none') s.border = `${border} solid ${borderColor || '#e8e8ed'}`
  if (borderRadius && borderRadius !== '0') s.borderRadius = borderRadius
  if (boxShadow && boxShadow !== 'none') s.boxShadow = boxShadow

  const pos = resolveResponsiveValue<string>(container, 'position', viewport, 'relative')
  if (pos && pos !== 'static') s.position = pos as any
  const zIdx = resolveResponsiveValue(container, 'z_index', viewport, '')
  if (zIdx !== '') s.zIndex = parseInt(String(zIdx), 10)

  return s
}

export function computeContainerInnerStyles(container: any, viewport: ViewportMode = 'desktop'): React.CSSProperties {
  const s: React.CSSProperties = {}
  const contentWidthType = resolveResponsiveValue<string>(container, 'content_width', viewport, 'boxed')
  const isBoxed = contentWidthType !== 'full'
  const customWidthVal = resolveResponsiveValue<string>(container, 'content_width_value', viewport, '')
  const maxWidthVal = resolveResponsiveValue<string>(container, 'max_width', viewport, '1200px')

  s.width = '100%'
  s.maxWidth = isBoxed ? (customWidthVal || maxWidthVal || '1200px') : '100%'
  s.margin = '0 auto'
  s.boxSizing = 'border-box'

  const displayType = resolveResponsiveValue<string>(container, 'display_type', viewport, 'flex')

  if (displayType === 'grid') {
    s.display = 'grid'
    s.gridTemplateColumns = resolveResponsiveValue<string>(container, 'grid_columns', viewport, 'repeat(auto-fit, minmax(250px, 1fr))')
    const gridRows = resolveResponsiveValue<string>(container, 'grid_rows', viewport, '')
    if (gridRows) s.gridTemplateRows = gridRows
    const gridGap = resolveResponsiveValue<string>(container, 'grid_gap', viewport, resolveResponsiveValue<string>(container, 'gap', viewport, '16px'))
    s.gap = gridGap
  } else if (displayType === 'block') {
    s.display = 'block'
  } else {
    s.display = 'flex'
    s.flexDirection = resolveResponsiveValue<string>(container, 'direction', viewport, 'column') as any
    s.gap = resolveResponsiveValue<string>(container, 'gap', viewport, '16px')
    s.alignItems = resolveResponsiveValue<string>(container, 'align_items', viewport, 'stretch') as any
    s.justifyContent = resolveResponsiveValue<string>(container, 'justify_content', viewport, 'flex-start') as any
    s.flexWrap = resolveResponsiveValue<string>(container, 'flex_wrap', viewport, 'nowrap') as any
  }

  return s
}

export function computeWidgetStyles(widget: any, viewport: ViewportMode = 'desktop'): React.CSSProperties {
  const s: React.CSSProperties = {}
  if (!widget) return s

  const fontFamily = resolveResponsiveValue<string>(widget, 'font_family', viewport, '')
  if (fontFamily) s.fontFamily = fontFamily
  const fontSize = resolveResponsiveValue<string>(widget, 'font_size', viewport, '')
  if (fontSize) s.fontSize = fontSize
  const fontWeight = resolveResponsiveValue(widget, 'font_weight', viewport, '')
  if (fontWeight) s.fontWeight = fontWeight as any
  const lineHeight = resolveResponsiveValue<string>(widget, 'line_height', viewport, '')
  if (lineHeight) s.lineHeight = lineHeight
  const letterSpacing = resolveResponsiveValue<string>(widget, 'letter_spacing', viewport, '')
  if (letterSpacing) s.letterSpacing = letterSpacing
  const textTransform = resolveResponsiveValue<string>(widget, 'text_transform', viewport, '')
  if (textTransform && textTransform !== 'none') s.textTransform = textTransform as any
  const textAlign = resolveResponsiveValue<string>(widget, 'text_align', viewport, widget.content?.align || widget.content?.text_align || '')
  if (textAlign) s.textAlign = textAlign as any
  const color = resolveResponsiveValue<string>(widget, 'color', viewport, '')
  if (color) s.color = color

  const bgType = resolveResponsiveValue<string>(widget, 'bg_type', viewport, '')
  const bgColor = resolveResponsiveValue<string>(widget, 'bg_color', viewport, '')
  const bgGradient = resolveResponsiveValue<string>(widget, 'bg_gradient', viewport, '')
  const bgImage = resolveResponsiveValue<string>(widget, 'bg_image', viewport, '')

  if (bgType === 'gradient' && bgGradient) {
    s.background = bgGradient
  } else if (bgType === 'image' && bgImage) {
    s.background = `url(${bgImage}) center/cover`
  } else if (bgColor && bgColor !== 'transparent') {
    s.backgroundColor = bgColor
  }

  s.paddingTop = resolveResponsiveValue<string>(widget, 'padding_top', viewport, '')
  s.paddingRight = resolveResponsiveValue<string>(widget, 'padding_right', viewport, '')
  s.paddingBottom = resolveResponsiveValue<string>(widget, 'padding_bottom', viewport, '')
  s.paddingLeft = resolveResponsiveValue<string>(widget, 'padding_left', viewport, '')
  s.marginTop = resolveResponsiveValue<string>(widget, 'margin_top', viewport, '')
  s.marginRight = resolveResponsiveValue<string>(widget, 'margin_right', viewport, '')
  s.marginBottom = resolveResponsiveValue<string>(widget, 'margin_bottom', viewport, '')
  s.marginLeft = resolveResponsiveValue<string>(widget, 'margin_left', viewport, '')

  const width = resolveResponsiveValue<string>(widget, 'width', viewport, '')
  if (width) s.width = width
  const maxWidth = resolveResponsiveValue<string>(widget, 'max_width', viewport, '')
  if (maxWidth) s.maxWidth = maxWidth
  const minWidth = resolveResponsiveValue<string>(widget, 'min_width', viewport, '')
  if (minWidth) s.minWidth = minWidth
  const height = resolveResponsiveValue<string>(widget, 'height', viewport, '')
  if (height) s.height = height
  const minHeight = resolveResponsiveValue<string>(widget, 'min_height', viewport, '')
  if (minHeight) s.minHeight = minHeight
  const maxHeight = resolveResponsiveValue<string>(widget, 'max_height', viewport, '')
  if (maxHeight) s.maxHeight = maxHeight

  const borderStyle = resolveResponsiveValue<string>(widget, 'border_style', viewport, widget.border_type || '')
  const borderWidth = resolveResponsiveValue<string>(widget, 'border_width', viewport, '1px')
  const borderColor = resolveResponsiveValue<string>(widget, 'border_color', viewport, '#e8e8ed')
  if (borderStyle && borderStyle !== 'none') {
    s.border = `${borderWidth} ${borderStyle} ${borderColor}`
  }
  const borderRadius = resolveResponsiveValue<string>(widget, 'border_radius', viewport, '')
  if (borderRadius) s.borderRadius = borderRadius
  const boxShadow = resolveResponsiveValue<string>(widget, 'box_shadow', viewport, '')
  if (boxShadow && boxShadow !== 'none') s.boxShadow = boxShadow

  const objectFit = resolveResponsiveValue<string>(widget, 'object_fit', viewport, widget.settings?.object_fit || widget.content?.object_fit || widget.style?.objectFit || '')
  if (objectFit) s.objectFit = objectFit as any
  const objectPosition = resolveResponsiveValue<string>(widget, 'object_position', viewport, widget.settings?.object_position || widget.content?.object_position || widget.style?.objectPosition || '')
  if (objectPosition) s.objectPosition = objectPosition as any

  const opacity = resolveResponsiveValue(widget, 'opacity', viewport, widget.settings?.opacity ?? widget.content?.opacity ?? '')
  if (opacity !== '' && opacity !== undefined) s.opacity = Number(opacity) as any
  const blur = resolveResponsiveValue<string>(widget, 'filter_blur', viewport, '')
  if (blur) s.filter = `blur(${blur})`

  const position = resolveResponsiveValue<string>(widget, 'position', viewport, '')
  if (position && position !== 'static') {
    s.position = position as any
    const top = resolveResponsiveValue<string>(widget, 'top', viewport, '')
    const right = resolveResponsiveValue<string>(widget, 'right', viewport, '')
    const bottom = resolveResponsiveValue<string>(widget, 'bottom', viewport, '')
    const left = resolveResponsiveValue<string>(widget, 'left', viewport, '')
    if (top) s.top = top
    if (right) s.right = right
    if (bottom) s.bottom = bottom
    if (left) s.left = left
  }
  const zIndex = resolveResponsiveValue(widget, 'z_index', viewport, '')
  if (zIndex !== '') s.zIndex = parseInt(String(zIndex), 10)
  const overflow = resolveResponsiveValue<string>(widget, 'overflow', viewport, '')
  if (overflow) s.overflow = overflow as any

  const transforms: string[] = []
  const transX = resolveResponsiveValue<string>(widget, 'transform_translate_x', viewport, widget.transform?.translate_x || '')
  const transY = resolveResponsiveValue<string>(widget, 'transform_translate_y', viewport, widget.transform?.translate_y || '')
  if (transX || transY) transforms.push(`translate(${transX || '0'}, ${transY || '0'})`)
  const scale = resolveResponsiveValue(widget, 'transform_scale', viewport, widget.transform?.scale || '')
  if (scale && scale !== 1 && scale !== '1') transforms.push(`scale(${scale})`)
  // Image Mask (Elementor Shape Masking)
  const maskShape = resolveResponsiveValue<string>(widget, 'mask_shape', viewport, widget.settings?.mask_shape || '')
  if (maskShape && maskShape !== 'none') {
    let maskUrl = ''
    if (maskShape === 'circle') {
      maskUrl = `radial-gradient(circle at center, black 65%, transparent 70%)`
    } else if (maskShape === 'blob') {
      maskUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23000' d='M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,41.9C64.8,54.7,53.8,65.6,40.8,72.9C27.8,80.2,13.9,83.9,-0.6,84.9C-15.1,86,-30.2,84.4,-43.3,77.5C-56.4,70.5,-67.5,58.3,-75.4,44.4C-83.3,30.5,-88,15.2,-87.3,0.4C-86.6,-14.5,-80.5,-28.9,-72.1,-41.7C-63.7,-54.5,-53.1,-65.7,-40.4,-73.6C-27.7,-81.4,-13.8,-85.9,0.7,-87.1C15.3,-88.3,30.6,-83.6,44.7,-76.4Z' transform='translate(100 100)' /%3E%3C/svg%3E")`
    } else if (maskShape === 'hexagon') {
      maskUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon fill='%23000' points='50 0, 100 25, 100 75, 50 100, 0 75, 0 25'/%3E%3C/svg%3E")`
    } else if (maskShape === 'triangle') {
      maskUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon fill='%23000' points='50 0, 100 100, 0 100'/%3E%3C/svg%3E")`
    } else if (maskShape === 'custom' && (widget.mask_custom_url || widget.settings?.mask_custom_url)) {
      maskUrl = `url("${widget.mask_custom_url || widget.settings?.mask_custom_url}")`
    }
    if (maskUrl) {
      const maskSize = resolveResponsiveValue<string>(widget, 'mask_size', viewport, 'contain')
      const maskPosition = resolveResponsiveValue<string>(widget, 'mask_position', viewport, 'center center')
      const maskRepeat = resolveResponsiveValue<string>(widget, 'mask_repeat', viewport, 'no-repeat')
      ;(s as any).WebkitMaskImage = maskUrl
      ;(s as any).maskImage = maskUrl
      ;(s as any).WebkitMaskSize = maskSize
      ;(s as any).maskSize = maskSize
      ;(s as any).WebkitMaskPosition = maskPosition
      ;(s as any).maskPosition = maskPosition
      ;(s as any).WebkitMaskRepeat = maskRepeat
      ;(s as any).maskRepeat = maskRepeat
    }
  }

  // Transitions for smooth hover
  const transDuration = resolveResponsiveValue<string>(widget, 'transition_duration', viewport, '0.3s')
  const transTiming = resolveResponsiveValue<string>(widget, 'transition_timing', viewport, 'cubic-bezier(0.16, 1, 0.3, 1)')
  s.transition = `all ${String(transDuration).includes('s') ? transDuration : `${transDuration}ms`} ${transTiming}`

  return s
}

// ------------------------------------------------------------
// DYNAMIC TAGS RESOLVER
// ------------------------------------------------------------
export function resolveDynamicTags(
  template: string | unknown,
  context?: {
    product?: any
    customer?: any
    site?: any
    order?: any
  }
): string {
  if (typeof template !== 'string') return String(template ?? '')
  if (!template.includes('{{') && !template.startsWith('product.')) return template

  const product = context?.product || {}
  const customer = context?.customer || {}
  const site = context?.site || { name: 'TEKNIX', url: 'https://teknix.com.br' }

  const fmtCurrency = (val: any) => {
    const num = Number(val)
    if (isNaN(num)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
  }

  const priceNum = Number(product.sale_price ?? product.price ?? 0)
  const promoPriceNum = Number(product.promotional_price ?? product.promo_price ?? 0)
  const isPromo = promoPriceNum > 0 && promoPriceNum < priceNum
  const currentPrice = isPromo ? promoPriceNum : priceNum
  const originalPrice = isPromo ? priceNum : 0
  const discountPercent = isPromo ? Math.round(((priceNum - promoPriceNum) / priceNum) * 100) : 0
  const installmentVal = currentPrice > 0 ? (currentPrice / 12).toFixed(2).replace('.', ',') : '0,00'

  const tags: Record<string, string> = {
    'product.name': product.name || product.title || 'Kit Chave de Impacto TEKNIX 21V',
    'product.title': product.name || product.title || 'Kit Chave de Impacto TEKNIX 21V',
    'product.sku': product.sku || 'TK-IMP-21V-PRO',
    'product.price': fmtCurrency(currentPrice || 299.9),
    'product.compare_price': originalPrice > 0 ? fmtCurrency(originalPrice) : fmtCurrency(399.9),
    'product.original_price': originalPrice > 0 ? fmtCurrency(originalPrice) : fmtCurrency(399.9),
    'product.discount': discountPercent > 0 ? `${discountPercent}% OFF` : '25% OFF',
    'product.installments': `12x de R$ ${installmentVal} sem juros`,
    'product.stock': String(product.stock ?? product.stock_quantity ?? 48),
    'product.image': product.image_url || (Array.isArray(product.images) ? product.images[0] : '') || '',
    'product.gallery': product.image_url || '',
    'product.description': product.description || 'Equipamento profissional de alta precisão com motor brushless e bateria íon-lítio 21V.',
    'product.short_description': product.short_description || 'Motor Brushless 21V com alto torque e durabilidade industrial.',
    'product.category': product.category || product.category_name || 'Ferramentas Elétricas',
    'product.brand': product.brand || 'TEKNIX',
    'product.rating': '4.9',
    'product.reviews_count': '1.240 avaliações',
    'product.shipping': 'Frete Grátis para todo o Brasil',
    'product.availability': 'Em estoque (Envio imediato)',
    'product.url': product.slug ? `/produto/${product.slug}` : '/produto/parafusadeira-impacto-21v',
    'customer.name': customer.name || 'Alison Thiago',
    'customer.first_name': (customer.name || 'Alison').split(' ')[0],
    'customer.email': customer.email || 'alison@teknix.com.br',
    'site.name': site.name || 'TEKNIX',
    'site.url': site.url || 'https://teknix.com.br',
    'site.logo': site.logo || '/brand/logo.svg'
  }

  if (tags[template]) return tags[template]

  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    return tags[key] !== undefined ? tags[key] : `{{${key}}}`
  })
}

// ------------------------------------------------------------
// 4. MOTION KEYFRAMES & CSS GENERATOR
// ------------------------------------------------------------

export function getMotionKeyframesCSS(): string {
  return `
@keyframes teknixFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes teknixFadeInUp { from { opacity: 0; transform: translate3d(0, 40px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes teknixFadeInDown { from { opacity: 0; transform: translate3d(0, -40px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes teknixFadeInLeft { from { opacity: 0; transform: translate3d(-40px, 0, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes teknixFadeInRight { from { opacity: 0; transform: translate3d(40px, 0, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes teknixSlideInUp { from { transform: translate3d(0, 100%, 0); visibility: visible; } to { transform: translate3d(0, 0, 0); } }
@keyframes teknixSlideInDown { from { transform: translate3d(0, -100%, 0); visibility: visible; } to { transform: translate3d(0, 0, 0); } }
@keyframes teknixSlideInLeft { from { transform: translate3d(-100%, 0, 0); visibility: visible; } to { transform: translate3d(0, 0, 0); } }
@keyframes teknixSlideInRight { from { transform: translate3d(100%, 0, 0); visibility: visible; } to { transform: translate3d(0, 0, 0); } }
@keyframes teknixZoomIn { from { opacity: 0; transform: scale3d(0.7, 0.7, 0.7); } 50% { opacity: 1; } to { transform: scale3d(1, 1, 1); } }
@keyframes teknixZoomOut { from { opacity: 1; } 50% { opacity: 0; transform: scale3d(0.3, 0.3, 0.3); } to { opacity: 0; } }
@keyframes teknixBounceIn { from, 20%, 40%, 60%, 80%, to { animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); } 0% { opacity: 0; transform: scale3d(0.3, 0.3, 0.3); } 20% { transform: scale3d(1.1, 1.1, 1.1); } 40% { transform: scale3d(0.9, 0.9, 0.9); } 60% { opacity: 1; transform: scale3d(1.03, 1.03, 1.03); } 80% { transform: scale3d(0.97, 0.97, 0.97); } to { opacity: 1; transform: scale3d(1, 1, 1); } }
@keyframes teknixRotateIn { from { transform: rotate3d(0, 0, 1, -200deg); opacity: 0; } to { transform: translate3d(0, 0, 0); opacity: 1; } }
@keyframes teknixFlipInX { from { transform: perspective(400px) rotate3d(1, 0, 0, 90deg); animation-timing-function: ease-in; opacity: 0; } 40% { transform: perspective(400px) rotate3d(1, 0, 0, -20deg); animation-timing-function: ease-in; } 60% { transform: perspective(400px) rotate3d(1, 0, 0, 10deg); opacity: 1; } 80% { transform: perspective(400px) rotate3d(1, 0, 0, -5deg); } to { transform: perspective(400px); } }
@keyframes teknixFlipInY { from { transform: perspective(400px) rotate3d(0, 1, 0, 90deg); animation-timing-function: ease-in; opacity: 0; } 40% { transform: perspective(400px) rotate3d(0, 1, 0, -20deg); animation-timing-function: ease-in; } 60% { transform: perspective(400px) rotate3d(0, 1, 0, 10deg); opacity: 1; } 80% { transform: perspective(400px) rotate3d(0, 1, 0, -5deg); } to { transform: perspective(400px); } }
@keyframes teknixRollIn { from { opacity: 0; transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg); } to { opacity: 1; transform: translate3d(0, 0, 0); } }

.teknix-animated { animation-fill-mode: both; }
.teknix-anim-fadeIn { animation-name: teknixFadeIn; }
.teknix-anim-fadeInUp { animation-name: teknixFadeInUp; }
.teknix-anim-fadeInDown { animation-name: teknixFadeInDown; }
.teknix-anim-fadeInLeft { animation-name: teknixFadeInLeft; }
.teknix-anim-fadeInRight { animation-name: teknixFadeInRight; }
.teknix-anim-slideInUp { animation-name: teknixSlideInUp; }
.teknix-anim-slideInDown { animation-name: teknixSlideInDown; }
.teknix-anim-slideInLeft { animation-name: teknixSlideInLeft; }
.teknix-anim-slideInRight { animation-name: teknixSlideInRight; }
.teknix-anim-zoomIn { animation-name: teknixZoomIn; }
.teknix-anim-zoomOut { animation-name: teknixZoomOut; }
.teknix-anim-bounceIn { animation-name: teknixBounceIn; }
.teknix-anim-rotateIn { animation-name: teknixRotateIn; }
.teknix-anim-flipInX { animation-name: teknixFlipInX; }
.teknix-anim-flipInY { animation-name: teknixFlipInY; }
.teknix-anim-rollIn { animation-name: teknixRollIn; }

.teknix-fixed-element { position: fixed !important; z-index: 9999; }
.teknix-sticky-element { position: -webkit-sticky !important; position: sticky !important; }

@media (min-width: 1025px) { .teknix-hide-desktop { display: none !important; } }
@media (min-width: 768px) and (max-width: 1024px) { .teknix-hide-tablet { display: none !important; } }
@media (max-width: 767px) { .teknix-hide-mobile { display: none !important; } }
`
}

export function generateCompiledCSS(
  sections: any[],
  customGlobalCss: string = '',
  pageId: string = ''
): string {
  const desktopRules: string[] = []
  const tabletRules: string[] = []
  const mobileRules: string[] = []
  const scopedCustomRules: string[] = []

  sections.forEach((section) => {
    const sId = section.id
    const secSelector = `[data-section-id="${sId}"]`

    if (section.custom_css) {
      scopedCustomRules.push(scopeCustomCss(section.custom_css, secSelector))
    }

    const containers = section.containers || []
    containers.forEach((container: any) => {
      const cId = container.id
      const conSelector = `[data-container-id="${cId}"]`
      const conInnerSelector = `[data-container-inner-id="${cId}"]`

      if (container.custom_css) {
        scopedCustomRules.push(scopeCustomCss(container.custom_css, conSelector))
      }

      // Tablet
      const cTabletDir = resolveResponsiveValue<string>(container, 'direction', 'tablet', '')
      const cTabletGap = resolveResponsiveValue<string>(container, 'gap', 'tablet', '')
      const cTabletAlign = resolveResponsiveValue<string>(container, 'align_items', 'tablet', '')
      const cTabletJustify = resolveResponsiveValue<string>(container, 'justify_content', 'tablet', '')
      const cTabletPt = resolveResponsiveValue<string>(container, 'padding_top', 'tablet', '')
      const cTabletPb = resolveResponsiveValue<string>(container, 'padding_bottom', 'tablet', '')
      const cTabletPl = resolveResponsiveValue<string>(container, 'padding_left', 'tablet', '')
      const cTabletPr = resolveResponsiveValue<string>(container, 'padding_right', 'tablet', '')
      const cTabletWidth = resolveResponsiveValue<string>(container, 'width', 'tablet', '')

      const cTabletDecls: string[] = []
      if (cTabletPt) cTabletDecls.push(`padding-top: ${cTabletPt};`)
      if (cTabletPb) cTabletDecls.push(`padding-bottom: ${cTabletPb};`)
      if (cTabletPl) cTabletDecls.push(`padding-left: ${cTabletPl};`)
      if (cTabletPr) cTabletDecls.push(`padding-right: ${cTabletPr};`)
      if (cTabletWidth) cTabletDecls.push(`width: ${cTabletWidth};`)
      if (cTabletDecls.length > 0) tabletRules.push(`${conSelector} { ${cTabletDecls.join(' ')} }`)

      const cInnerTabletDecls: string[] = []
      if (cTabletDir) cInnerTabletDecls.push(`flex-direction: ${cTabletDir};`)
      if (cTabletGap) cInnerTabletDecls.push(`gap: ${cTabletGap};`)
      if (cTabletAlign) cInnerTabletDecls.push(`align-items: ${cTabletAlign};`)
      if (cTabletJustify) cInnerTabletDecls.push(`justify-content: ${cTabletJustify};`)
      if (cInnerTabletDecls.length > 0) tabletRules.push(`${conInnerSelector} { ${cInnerTabletDecls.join(' ')} }`)

      // Mobile
      const cMobileDir = resolveResponsiveValue<string>(container, 'direction', 'mobile', '')
      const cMobileGap = resolveResponsiveValue<string>(container, 'gap', 'mobile', '')
      const cMobileAlign = resolveResponsiveValue<string>(container, 'align_items', 'mobile', '')
      const cMobileJustify = resolveResponsiveValue<string>(container, 'justify_content', 'mobile', '')
      const cMobilePt = resolveResponsiveValue<string>(container, 'padding_top', 'mobile', '')
      const cMobilePb = resolveResponsiveValue<string>(container, 'padding_bottom', 'mobile', '')
      const cMobilePl = resolveResponsiveValue<string>(container, 'padding_left', 'mobile', '')
      const cMobilePr = resolveResponsiveValue<string>(container, 'padding_right', 'mobile', '')
      const cMobileWidth = resolveResponsiveValue<string>(container, 'width', 'mobile', '100%')

      const cMobileDecls: string[] = []
      if (cMobilePt) cMobileDecls.push(`padding-top: ${cMobilePt};`)
      if (cMobilePb) cMobileDecls.push(`padding-bottom: ${cMobilePb};`)
      if (cMobilePl) cMobileDecls.push(`padding-left: ${cMobilePl};`)
      if (cMobilePr) cMobileDecls.push(`padding-right: ${cMobilePr};`)
      if (cMobileWidth) cMobileDecls.push(`width: ${cMobileWidth};`)
      if (cMobileDecls.length > 0) mobileRules.push(`${conSelector} { ${cMobileDecls.join(' ')} }`)

      const cInnerMobileDecls: string[] = []
      if (cMobileDir) cInnerMobileDecls.push(`flex-direction: ${cMobileDir};`)
      if (cMobileGap) cInnerMobileDecls.push(`gap: ${cMobileGap};`)
      if (cMobileAlign) cInnerMobileDecls.push(`align-items: ${cMobileAlign};`)
      if (cMobileJustify) cInnerMobileDecls.push(`justify-content: ${cMobileJustify};`)
      if (cInnerMobileDecls.length > 0) mobileRules.push(`${conInnerSelector} { ${cInnerMobileDecls.join(' ')} }`)

      const widgets = container.widgets || []
      widgets.forEach((widget: any) => {
        const wId = widget.id
        const wSelector = `[data-widget-id="${wId}"]`

        if (widget.custom_css) {
          scopedCustomRules.push(scopeCustomCss(widget.custom_css, wSelector))
        }

        const hover = widget.hover || widget.states?.hover
        if (hover && typeof hover === 'object') {
          const hoverDecls: string[] = []
          if (hover.color) hoverDecls.push(`color: ${hover.color} !important;`)
          if (hover.bg_color || hover.backgroundColor) hoverDecls.push(`background-color: ${hover.bg_color || hover.backgroundColor} !important;`)
          if (hover.border_color || hover.borderColor) hoverDecls.push(`border-color: ${hover.border_color || hover.borderColor} !important;`)
          if (hover.shadow || hover.boxShadow) hoverDecls.push(`box-shadow: ${hover.shadow || hover.boxShadow} !important;`)
          if (hover.transform) hoverDecls.push(`transform: ${hover.transform} !important;`)
          if (hover.opacity !== undefined) hoverDecls.push(`opacity: ${hover.opacity} !important;`)
          if (hoverDecls.length > 0) {
            desktopRules.push(`${wSelector}:hover { ${hoverDecls.join(' ')} }`)
            desktopRules.push(`${wSelector} { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }`)
          }
        }

        const pos = resolveResponsiveValue<string>(widget, 'position', 'desktop', '')
        if (pos === 'fixed') {
          const top = resolveResponsiveValue<string>(widget, 'top', 'desktop', '')
          const right = resolveResponsiveValue<string>(widget, 'right', 'desktop', '')
          const bottom = resolveResponsiveValue<string>(widget, 'bottom', 'desktop', '')
          const left = resolveResponsiveValue<string>(widget, 'left', 'desktop', '')
          const zIndex = resolveResponsiveValue(widget, 'z_index', 'desktop', '9999')

          const fixedDecls = ['position: fixed !important;', `z-index: ${zIndex};`]
          if (top) fixedDecls.push(`top: ${top};`)
          if (right) fixedDecls.push(`right: ${right};`)
          if (bottom) fixedDecls.push(`bottom: ${bottom};`)
          if (left) fixedDecls.push(`left: ${left};`)
          desktopRules.push(`${wSelector} { ${fixedDecls.join(' ')} }`)

          const tTop = resolveResponsiveValue<string>(widget, 'top', 'tablet', '')
          const tRight = resolveResponsiveValue<string>(widget, 'right', 'tablet', '')
          const tBottom = resolveResponsiveValue<string>(widget, 'bottom', 'tablet', '')
          const tLeft = resolveResponsiveValue<string>(widget, 'left', 'tablet', '')
          const tDecls: string[] = []
          if (tTop) tDecls.push(`top: ${tTop};`)
          if (tRight) tDecls.push(`right: ${tRight};`)
          if (tBottom) tDecls.push(`bottom: ${tBottom};`)
          if (tLeft) tDecls.push(`left: ${tLeft};`)
          if (tDecls.length > 0) tabletRules.push(`${wSelector} { ${tDecls.join(' ')} }`)

          const mTop = resolveResponsiveValue<string>(widget, 'top', 'mobile', '')
          const mRight = resolveResponsiveValue<string>(widget, 'right', 'mobile', '')
          const mBottom = resolveResponsiveValue<string>(widget, 'bottom', 'mobile', '')
          const mLeft = resolveResponsiveValue<string>(widget, 'left', 'mobile', '')
          const mDecls: string[] = []
          if (mTop) mDecls.push(`top: ${mTop};`)
          if (mRight) mDecls.push(`right: ${mRight};`)
          if (mBottom) mDecls.push(`bottom: ${mBottom};`)
          if (mLeft) mDecls.push(`left: ${mLeft};`)
          if (mDecls.length > 0) mobileRules.push(`${wSelector} { ${mDecls.join(' ')} }`)
        }

        if (pos === 'sticky') {
          const stickyTop = resolveResponsiveValue<string>(widget, 'top', 'desktop', '20px')
          const stickyZIndex = resolveResponsiveValue(widget, 'z_index', 'desktop', '100')
          desktopRules.push(`${wSelector} { position: -webkit-sticky !important; position: sticky !important; top: ${stickyTop}; z-index: ${stickyZIndex}; }`)
        }

        // Tablet Widget Overrides
        const wTabletFontSize = resolveResponsiveValue<string>(widget, 'font_size', 'tablet', '')
        const wTabletTextAlign = resolveResponsiveValue<string>(widget, 'text_align', 'tablet', '')
        const wTabletPt = resolveResponsiveValue<string>(widget, 'padding_top', 'tablet', '')
        const wTabletPr = resolveResponsiveValue<string>(widget, 'padding_right', 'tablet', '')
        const wTabletPb = resolveResponsiveValue<string>(widget, 'padding_bottom', 'tablet', '')
        const wTabletPl = resolveResponsiveValue<string>(widget, 'padding_left', 'tablet', '')
        const wTabletMt = resolveResponsiveValue<string>(widget, 'margin_top', 'tablet', '')
        const wTabletMr = resolveResponsiveValue<string>(widget, 'margin_right', 'tablet', '')
        const wTabletMb = resolveResponsiveValue<string>(widget, 'margin_bottom', 'tablet', '')
        const wTabletMl = resolveResponsiveValue<string>(widget, 'margin_left', 'tablet', '')
        const wTabletWidth = resolveResponsiveValue<string>(widget, 'width', 'tablet', '')

        const wTabletDecls: string[] = []
        if (wTabletFontSize) wTabletDecls.push(`font-size: ${wTabletFontSize};`)
        if (wTabletTextAlign) wTabletDecls.push(`text-align: ${wTabletTextAlign};`)
        if (wTabletPt) wTabletDecls.push(`padding-top: ${wTabletPt};`)
        if (wTabletPr) wTabletDecls.push(`padding-right: ${wTabletPr};`)
        if (wTabletPb) wTabletDecls.push(`padding-bottom: ${wTabletPb};`)
        if (wTabletPl) wTabletDecls.push(`padding-left: ${wTabletPl};`)
        if (wTabletMt) wTabletDecls.push(`margin-top: ${wTabletMt};`)
        if (wTabletMr) wTabletDecls.push(`margin-right: ${wTabletMr};`)
        if (wTabletMb) wTabletDecls.push(`margin-bottom: ${wTabletMb};`)
        if (wTabletMl) wTabletDecls.push(`margin-left: ${wTabletMl};`)
        if (wTabletWidth) wTabletDecls.push(`width: ${wTabletWidth};`)
        if (wTabletDecls.length > 0) tabletRules.push(`${wSelector} { ${wTabletDecls.join(' ')} }`)

        // Mobile Widget Overrides
        const wMobileFontSize = resolveResponsiveValue<string>(widget, 'font_size', 'mobile', '')
        const wMobileTextAlign = resolveResponsiveValue<string>(widget, 'text_align', 'mobile', '')
        const wMobilePt = resolveResponsiveValue<string>(widget, 'padding_top', 'mobile', '')
        const wMobilePr = resolveResponsiveValue<string>(widget, 'padding_right', 'mobile', '')
        const wMobilePb = resolveResponsiveValue<string>(widget, 'padding_bottom', 'mobile', '')
        const wMobilePl = resolveResponsiveValue<string>(widget, 'padding_left', 'mobile', '')
        const wMobileMt = resolveResponsiveValue<string>(widget, 'margin_top', 'mobile', '')
        const wMobileMr = resolveResponsiveValue<string>(widget, 'margin_right', 'mobile', '')
        const wMobileMb = resolveResponsiveValue<string>(widget, 'margin_bottom', 'mobile', '')
        const wMobileMl = resolveResponsiveValue<string>(widget, 'margin_left', 'mobile', '')
        const wMobileWidth = resolveResponsiveValue<string>(widget, 'width', 'mobile', '')

        const wMobileDecls: string[] = []
        if (wMobileFontSize) wMobileDecls.push(`font-size: ${wMobileFontSize};`)
        if (wMobileTextAlign) wMobileDecls.push(`text-align: ${wMobileTextAlign};`)
        if (wMobilePt) wMobileDecls.push(`padding-top: ${wMobilePt};`)
        if (wMobilePr) wMobileDecls.push(`padding-right: ${wMobilePr};`)
        if (wMobilePb) wMobileDecls.push(`padding-bottom: ${wMobilePb};`)
        if (wMobilePl) wMobileDecls.push(`padding-left: ${wMobilePl};`)
        if (wMobileMt) wMobileDecls.push(`margin-top: ${wMobileMt};`)
        if (wMobileMr) wMobileDecls.push(`margin-right: ${wMobileMr};`)
        if (wMobileMb) wMobileDecls.push(`margin-bottom: ${wMobileMb};`)
        if (wMobileMl) wMobileDecls.push(`margin-left: ${wMobileMl};`)
        if (wMobileWidth) wMobileDecls.push(`width: ${wMobileWidth};`)
        if (wMobileDecls.length > 0) mobileRules.push(`${wSelector} { ${wMobileDecls.join(' ')} }`)
      })
    })
  })

  if (customGlobalCss) {
    scopedCustomRules.push(`/* Page Custom CSS */\n${customGlobalCss}`)
  }

  return `
/* TEKNIX Page Builder Compiled CSS: ${pageId || 'site'} */
${getMotionKeyframesCSS()}
${desktopRules.join('\n')}
@media (max-width: 1024px) {
${tabletRules.join('\n')}
}
@media (max-width: 767px) {
${mobileRules.join('\n')}
}
${scopedCustomRules.join('\n\n')}
`
}

export function initMotionEffectsRuntime() {
  if (typeof window === 'undefined') return () => {}

  const entranceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const anim = el.dataset.teknixEntrance
          const delay = el.dataset.teknixDelay || '0'
          const duration = el.dataset.teknixDuration || '800ms'

          if (anim) {
            el.style.animationDuration = duration.includes('ms') || duration.includes('s') ? duration : `${duration}ms`
            el.style.animationDelay = delay.includes('ms') || delay.includes('s') ? delay : `${delay}ms`
            el.classList.add('teknix-animated', `teknix-anim-${anim}`)
          }
          entranceObserver.unobserve(el)
        }
      })
    },
    { threshold: 0.15 }
  )

  const animEls = document.querySelectorAll('[data-teknix-entrance]')
  animEls.forEach((el) => entranceObserver.observe(el))

  const scrollEls = document.querySelectorAll('[data-teknix-scroll]')
  const onScroll = () => {
    const winHeight = window.innerHeight

    scrollEls.forEach((rawEl) => {
      const el = rawEl as HTMLElement
      const rect = el.getBoundingClientRect()
      const inView = rect.top < winHeight && rect.bottom > 0
      if (!inView) return

      const progress = Math.min(Math.max((winHeight - rect.top) / (winHeight + rect.height), 0), 1)

      const vSpeed = parseFloat(el.dataset.teknixVspeed || '0')
      const vDir = el.dataset.teknixVdir || 'up'
      if (vSpeed !== 0) {
        const offset = (progress - 0.5) * vSpeed * 60 * (vDir === 'up' ? -1 : 1)
        el.style.transform = `translate3d(0, ${offset}px, 0)`
      }

      if (el.dataset.teknixOpacityScroll === 'true') {
        const startOp = parseFloat(el.dataset.teknixOpStart || '0')
        const endOp = parseFloat(el.dataset.teknixOpEnd || '1')
        const currentOp = startOp + (endOp - startOp) * progress
        el.style.opacity = String(currentOp)
      }

      if (el.dataset.teknixScaleScroll === 'true') {
        const startSc = parseFloat(el.dataset.teknixScStart || '0.8')
        const endSc = parseFloat(el.dataset.teknixScEnd || '1.0')
        const currentSc = startSc + (endSc - startSc) * progress
        el.style.transform = `scale(${currentSc})`
      }
    })
  }

  if (scrollEls.length > 0) {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

  const tiltEls = document.querySelectorAll('[data-teknix-tilt]')
  const handleMouseMove = (e: MouseEvent) => {
    tiltEls.forEach((rawEl) => {
      const el = rawEl as HTMLElement
      const rect = el.getBoundingClientRect()
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        const maxAngle = parseFloat(el.dataset.teknixTiltMax || '10')
        const rotX = -(y / (rect.height / 2)) * maxAngle
        const rotY = (x / (rect.width / 2)) * maxAngle
        el.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`
      } else {
        el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'
      }
    })
  }

  if (tiltEls.length > 0) {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
  }

  return () => {
    entranceObserver.disconnect()
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('mousemove', handleMouseMove)
  }
}
