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

/**
 * Resolves a property value considering responsive inheritance:
 * Mobile -> inherits Tablet -> inherits Desktop -> fallback
 * Tablet -> inherits Desktop -> fallback
 * Desktop -> Desktop value -> fallback
 */
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

/**
 * Returns metadata about where a value comes from (for Style Inspector / Debug Mode)
 */
export function getInheritanceInfo(
  obj: any,
  property: string,
  currentViewport: ViewportMode
): {
  value: any
  source: 'desktop' | 'tablet' | 'mobile' | 'fallback'
  isInherited: boolean
  isOverridden: boolean
} {
  if (!obj) return { value: '', source: 'fallback', isInherited: false, isOverridden: false }

  const resp = obj.responsive || {}
  const hasMobile = (resp.mobile?.[property] !== undefined && resp.mobile[property] !== '') || (obj[`${property}_mobile`] !== undefined && obj[`${property}_mobile`] !== '')
  const hasTablet = (resp.tablet?.[property] !== undefined && resp.tablet[property] !== '') || (obj[`${property}_tablet`] !== undefined && obj[`${property}_tablet`] !== '')
  const hasDesktop = (resp.desktop?.[property] !== undefined && resp.desktop[property] !== '') || (obj[property] !== undefined && obj[property] !== '') || (obj.settings?.[property] !== undefined && obj.settings[property] !== '')

  if (currentViewport === 'mobile') {
    if (hasMobile) {
      return { value: resolveResponsiveValue(obj, property, 'mobile'), source: 'mobile', isInherited: false, isOverridden: true }
    }
    if (hasTablet) {
      return { value: resolveResponsiveValue(obj, property, 'tablet'), source: 'tablet', isInherited: true, isOverridden: false }
    }
    if (hasDesktop) {
      return { value: resolveResponsiveValue(obj, property, 'desktop'), source: 'desktop', isInherited: true, isOverridden: false }
    }
  }

  if (currentViewport === 'tablet') {
    if (hasTablet) {
      return { value: resolveResponsiveValue(obj, property, 'tablet'), source: 'tablet', isInherited: false, isOverridden: true }
    }
    if (hasDesktop) {
      return { value: resolveResponsiveValue(obj, property, 'desktop'), source: 'desktop', isInherited: true, isOverridden: false }
    }
  }

  if (hasDesktop) {
    return { value: resolveResponsiveValue(obj, property, 'desktop'), source: 'desktop', isInherited: false, isOverridden: false }
  }

  return { value: '', source: 'fallback', isInherited: false, isOverridden: false }
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
// 3. COMPUTED STYLES FOR CANVAS / PREVIEWS
// ------------------------------------------------------------

export function computeSectionStyles(section: any, viewport: ViewportMode = 'desktop'): React.CSSProperties {
  const s: React.CSSProperties = {}

  // Background
  const bgType = resolveResponsiveValue<string>(section, 'bg_type', viewport, 'color')
  const rawBg = section?.bg_color || section?.backgroundColor || section?.settings?.bg_color || section?.settings?.backgroundColor || section?.style?.backgroundColor || ''
  const bgColor = resolveResponsiveValue<string>(section, 'bg_color', viewport, rawBg)
  const rawBgImage = section?.bg_image || section?.settings?.bg_image || ''
  const bgImage = resolveResponsiveValue<string>(section, 'bg_image', viewport, rawBgImage)
  const bgGradient = resolveResponsiveValue<string>(section, 'bg_gradient', viewport, section?.bg_gradient || section?.settings?.bg_gradient || '')
  const bgPos = resolveResponsiveValue<string>(section, 'bg_position', viewport, section?.bg_position || 'center center')
  const bgSize = resolveResponsiveValue<string>(section, 'bg_size', viewport, section?.bg_size || 'cover')
  const bgRepeat = resolveResponsiveValue<string>(section, 'bg_repeat', viewport, section?.bg_repeat || 'no-repeat')
  const bgAttachment = resolveResponsiveValue<string>(section, 'bg_attachment', viewport, section?.bg_attachment || 'scroll')

  if (bgColor && bgColor !== 'transparent' && bgColor !== '') {
    s.backgroundColor = bgColor
  }

  if (bgType === 'gradient' && bgGradient) {
    s.background = bgGradient
  } else if (bgType === 'slideshow') {
    const rawSlides = section.bg_slideshow_images || section.settings?.bg_slideshow_images
    const firstSlide = rawSlides
      ? (typeof rawSlides === 'string' ? rawSlides.split(',')[0].trim() : rawSlides[0])
      : bgImage
    if (firstSlide) {
      s.backgroundImage = `url(${firstSlide})`
      s.backgroundPosition = bgPos === 'default' ? 'center center' : bgPos
      s.backgroundSize = section.bg_slideshow_size || bgSize || 'cover'
      s.backgroundRepeat = 'no-repeat'
    }
  } else if (bgType === 'video') {
    const fallback = section.bg_video_fallback || section.settings?.bg_video_fallback || bgImage
    if (fallback) {
      s.backgroundImage = `url(${fallback})`
      s.backgroundPosition = 'center center'
      s.backgroundSize = 'cover'
      s.backgroundRepeat = 'no-repeat'
    }
  } else if (bgImage) {
    s.backgroundImage = `url(${bgImage})`
    s.backgroundPosition = bgPos === 'default' ? 'center center' : bgPos
    s.backgroundSize = bgSize || 'cover'
    s.backgroundRepeat = bgRepeat || 'no-repeat'
    s.backgroundAttachment = bgAttachment || 'scroll'
  }

  // Spacing
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

  // Sizing
  const minHeight = resolveResponsiveValue<string>(section, 'min_height', viewport, '')
  if (minHeight && minHeight !== 'auto') s.minHeight = minHeight

  // Borders & Radius & Shadow
  const borderTop = resolveResponsiveValue<string>(section, 'border_top', viewport, '')
  const borderBottom = resolveResponsiveValue<string>(section, 'border_bottom', viewport, '')
  const borderColor = resolveResponsiveValue<string>(section, 'border_color', viewport, '')
  const borderRadius = resolveResponsiveValue<string>(section, 'border_radius', viewport, '')
  const boxShadow = resolveResponsiveValue<string>(section, 'box_shadow', viewport, '')

  if (borderTop && borderTop !== 'none') s.borderTop = `${borderTop} solid ${borderColor || '#e8e8ed'}`
  if (borderBottom && borderBottom !== 'none') s.borderBottom = `${borderBottom} solid ${borderColor || '#e8e8ed'}`
  if (borderRadius && borderRadius !== '0') s.borderRadius = borderRadius
  if (boxShadow && boxShadow !== 'none') s.boxShadow = boxShadow

  // Position
  const pos = resolveResponsiveValue<string>(section, 'position', viewport, 'relative')
  if (pos) s.position = pos as any
  const zIdx = resolveResponsiveValue(section, 'z_index', viewport, '')
  if (zIdx !== '') s.zIndex = parseInt(String(zIdx), 10)

  // Visibility in Editor (Grayscale + 35% opacity so it stays visible and editable for the designer)
  const hideDesktop = !!section.hide_on_desktop || !!section.hide_desktop || !!section.settings?.hide_desktop || !!section.settings?.hide_on_desktop
  const hideTablet = !!section.hide_on_tablet || !!section.hide_tablet || !!section.settings?.hide_tablet || !!section.settings?.hide_on_tablet
  const hideMobile = !!section.hide_on_mobile || !!section.hide_mobile || !!section.settings?.hide_mobile || !!section.settings?.hide_on_mobile

  const isHiddenInViewport =
    (viewport === 'desktop' && hideDesktop) ||
    (viewport === 'tablet' && hideTablet) ||
    (viewport === 'mobile' && hideMobile)

  if (isHiddenInViewport) {
    s.filter = 'grayscale(100%)'
    s.opacity = 0.35
  }

  // Sticky Header / Sticky Position
  const isSectionSticky = !!section.sticky_header || section.sticky === 'top' || !!section.isSticky || !!section.settings?.sticky_header
  const isSectionStickyActive = isSectionSticky && (
    (viewport === 'desktop' && section.sticky_desktop !== false) ||
    (viewport === 'tablet' && section.sticky_tablet !== false) ||
    (viewport === 'mobile' && section.sticky_mobile !== false)
  )
  if (isSectionStickyActive) {
    s.position = 'sticky'
    s.top = `${section.sticky_offset ?? 0}px`
    s.zIndex = section.z_index || 9990
    if (section.sticky_blur !== false) {
      ;(s as any).backdropFilter = 'blur(20px)'
      ;(s as any).WebkitBackdropFilter = 'blur(20px)'
      if (!s.backgroundColor || s.backgroundColor === 'transparent') {
        s.backgroundColor = 'rgba(255, 255, 255, 0.85)'
      }
    }
  }

  // Entrance Animation
  const animEntrance = resolveResponsiveValue<string>(section, 'animation_entrance', viewport, section.animation_type || section.settings?.animation_entrance || section.settings?.animation_type || '')
  if (animEntrance && animEntrance !== 'none') {
    const animName = `teknix${animEntrance.charAt(0).toUpperCase() + animEntrance.slice(1)}`
    const duration = section.animation_duration || section.settings?.animation_duration || '800ms'
    const delay = section.animation_delay || section.settings?.animation_delay || '0ms'
    s.animation = `${animName} ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`
  }

  return s
}

export function computeContainerOuterStyles(container: any, viewport: ViewportMode = 'desktop'): React.CSSProperties {
  const s: React.CSSProperties = {}

  // 1. Width & Flexbox Distribution (50/50, 33/33/33, 25/25/25/25, etc.)
  const rawWidth = resolveResponsiveValue<string>(container, 'width', viewport, '') ||
                   resolveResponsiveValue<string>(container, 'content_width_value', viewport, '') ||
                   container?.width ||
                   container?.content_width_value || ''

  let widthVal = rawWidth && rawWidth !== '' ? String(rawWidth).trim() : '100%'
  if (widthVal !== '' && widthVal !== 'auto' && !widthVal.includes('%') && !widthVal.includes('px') && !widthVal.includes('vw') && !widthVal.includes('em') && !isNaN(Number(widthVal))) {
    widthVal = Number(widthVal) <= 100 ? `${widthVal}%` : `${widthVal}px`
  }

  // Automatic mobile full-width stack for fractional columns when no explicit mobile width override is set
  if (viewport === 'mobile' && widthVal !== '100%' && !container.responsive?.mobile?.width && !container.width_mobile) {
    if (widthVal.includes('%') || widthVal.includes('vw')) {
      widthVal = '100%'
    }
  }

  s.width = widthVal
  s.boxSizing = 'border-box'

  if (widthVal && widthVal !== '100%') {
    s.flex = `0 0 ${widthVal}`
    s.maxWidth = widthVal
  } else {
    s.flex = '1 1 0%'
    s.maxWidth = '100%'
  }

  const rawMinHeight = resolveResponsiveValue<string>(container, 'min_height', viewport, '') || container?.min_height || ''
  if (rawMinHeight && rawMinHeight !== 'auto' && rawMinHeight !== 'none' && rawMinHeight !== '') {
    s.minHeight = !String(rawMinHeight).includes('px') && !String(rawMinHeight).includes('vh') && !String(rawMinHeight).includes('%') && !isNaN(Number(rawMinHeight))
      ? `${rawMinHeight}px`
      : rawMinHeight
  }

  // Background
  const bgType = resolveResponsiveValue<string>(container, 'bg_type', viewport, 'color')
  const rawBg = container?.bg_color || container?.backgroundColor || container?.settings?.bg_color || container?.settings?.backgroundColor || container?.style?.backgroundColor || ''
  const bgColor = resolveResponsiveValue<string>(container, 'bg_color', viewport, rawBg)
  const rawBgImage = container?.bg_image || container?.settings?.bg_image || ''
  const bgImage = resolveResponsiveValue<string>(container, 'bg_image', viewport, rawBgImage)
  const bgGradient = resolveResponsiveValue<string>(container, 'bg_gradient', viewport, container?.bg_gradient || container?.settings?.bg_gradient || '')
  const bgPos = resolveResponsiveValue<string>(container, 'bg_position', viewport, container?.bg_position || 'center center')
  const bgSize = resolveResponsiveValue<string>(container, 'bg_size', viewport, container?.bg_size || 'cover')
  const bgRepeat = resolveResponsiveValue<string>(container, 'bg_repeat', viewport, container?.bg_repeat || 'no-repeat')

  if (bgColor && bgColor !== 'transparent' && bgColor !== '') {
    s.backgroundColor = bgColor
  }

  if (bgType === 'gradient' && bgGradient) {
    s.background = bgGradient
  } else if (bgType === 'slideshow') {
    const rawSlides = container.bg_slideshow_images || container.settings?.bg_slideshow_images
    const firstSlide = rawSlides
      ? (typeof rawSlides === 'string' ? rawSlides.split(',')[0].trim() : rawSlides[0])
      : bgImage
    if (firstSlide) {
      s.backgroundImage = `url(${firstSlide})`
      s.backgroundPosition = bgPos === 'default' ? 'center center' : bgPos
      s.backgroundSize = container.bg_slideshow_size || bgSize || 'cover'
      s.backgroundRepeat = 'no-repeat'
    }
  } else if (bgImage) {
    s.backgroundImage = `url(${bgImage})`
    s.backgroundPosition = bgPos === 'default' ? 'center center' : bgPos
    s.backgroundSize = bgSize || 'cover'
    s.backgroundRepeat = bgRepeat || 'no-repeat'
  }

  // Spacing
  s.paddingTop = resolveResponsiveValue<string>(container, 'padding_top', viewport, '0px')
  s.paddingRight = resolveResponsiveValue<string>(container, 'padding_right', viewport, '0px')
  s.paddingBottom = resolveResponsiveValue<string>(container, 'padding_bottom', viewport, '0px')
  s.paddingLeft = resolveResponsiveValue<string>(container, 'padding_left', viewport, '0px')
  s.marginTop = resolveResponsiveValue<string>(container, 'margin_top', viewport, '0px')
  s.marginBottom = resolveResponsiveValue<string>(container, 'margin_bottom', viewport, '0px')
  s.marginLeft = resolveResponsiveValue<string>(container, 'margin_left', viewport, '0px')
  s.marginRight = resolveResponsiveValue<string>(container, 'margin_right', viewport, '0px')

  // Borders & Shadow
  const border = resolveResponsiveValue<string>(container, 'border', viewport, '')
  const borderColor = resolveResponsiveValue<string>(container, 'border_color', viewport, '')
  const borderRadius = resolveResponsiveValue<string>(container, 'border_radius', viewport, '')
  const boxShadow = resolveResponsiveValue<string>(container, 'box_shadow', viewport, '')

  if (border && border !== 'none') s.border = `${border} solid ${borderColor || '#e8e8ed'}`
  if (borderRadius && borderRadius !== '0') s.borderRadius = borderRadius
  if (boxShadow && boxShadow !== 'none') s.boxShadow = boxShadow

  // Position
  const pos = resolveResponsiveValue<string>(container, 'position', viewport, 'relative')
  if (pos && pos !== 'static') s.position = pos as any
  const zIdx = resolveResponsiveValue(container, 'z_index', viewport, '')
  if (zIdx !== '') s.zIndex = parseInt(String(zIdx), 10)

  // Visibility in Editor (Grayscale + 35% opacity so it stays visible and editable for the designer)
  const hideDesktop = !!container.hide_on_desktop || !!container.hide_desktop || !!container.settings?.hide_desktop || !!container.settings?.hide_on_desktop
  const hideTablet = !!container.hide_on_tablet || !!container.hide_tablet || !!container.settings?.hide_tablet || !!container.settings?.hide_on_tablet
  const hideMobile = !!container.hide_on_mobile || !!container.hide_mobile || !!container.settings?.hide_mobile || !!container.settings?.hide_on_mobile

  const isHiddenInViewport =
    (viewport === 'desktop' && hideDesktop) ||
    (viewport === 'tablet' && hideTablet) ||
    (viewport === 'mobile' && hideMobile)

  if (isHiddenInViewport) {
    s.filter = 'grayscale(100%)'
    s.opacity = 0.35
  }

  // Sticky Container
  const isConSticky = !!container.sticky_header || container.sticky === 'top' || !!container.isSticky || !!container.settings?.sticky_header
  const isConStickyActive = isConSticky && (
    (viewport === 'desktop' && container.sticky_desktop !== false) ||
    (viewport === 'tablet' && container.sticky_tablet !== false) ||
    (viewport === 'mobile' && container.sticky_mobile !== false)
  )
  if (isConStickyActive) {
    s.position = 'sticky'
    s.top = `${container.sticky_offset ?? 0}px`
    s.zIndex = container.z_index || 9980
    if (container.sticky_blur !== false) {
      ;(s as any).backdropFilter = 'blur(20px)'
      ;(s as any).WebkitBackdropFilter = 'blur(20px)'
      if (!s.backgroundColor || s.backgroundColor === 'transparent') {
        s.backgroundColor = 'rgba(255, 255, 255, 0.85)'
      }
    }
  }

  // Entrance Animation
  const animEntrance = resolveResponsiveValue<string>(container, 'animation_entrance', viewport, container.animation_type || container.settings?.animation_entrance || container.settings?.animation_type || '')
  if (animEntrance && animEntrance !== 'none') {
    const animName = `teknix${animEntrance.charAt(0).toUpperCase() + animEntrance.slice(1)}`
    const duration = container.animation_duration || container.settings?.animation_duration || '800ms'
    const delay = container.animation_delay || container.settings?.animation_delay || '0ms'
    s.animation = `${animName} ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`
  }

  return s
}

export function computeContainerInnerStyles(container: any, viewport: ViewportMode = 'desktop'): React.CSSProperties {
  const s: React.CSSProperties = {}
  const contentWidthType = resolveResponsiveValue<string>(container, 'content_width', viewport, container?.content_width || (container?.layout === 'full' ? 'full' : 'boxed'))
  const isBoxed = contentWidthType !== 'full'
  const customWidthVal = resolveResponsiveValue<string>(container, 'content_width_value', viewport, container?.content_width_value || '')
  const maxWidthVal = resolveResponsiveValue<string>(container, 'max_width', viewport, container?.max_width || '1200px')

  let parsedWidthVal = customWidthVal
  if (parsedWidthVal && !parsedWidthVal.includes('%') && !parsedWidthVal.includes('px') && !parsedWidthVal.includes('vw') && !isNaN(Number(parsedWidthVal))) {
    parsedWidthVal = Number(parsedWidthVal) <= 100 ? `${parsedWidthVal}%` : `${parsedWidthVal}px`
  }

  s.width = '100%'
  s.maxWidth = isBoxed ? (viewport === 'mobile' ? (parsedWidthVal || '100%') : (parsedWidthVal || maxWidthVal || '1200px')) : (parsedWidthVal || '100%')
  s.margin = '0 auto'
  s.boxSizing = 'border-box'

  const rawMinHeight = resolveResponsiveValue<string>(container, 'min_height', viewport, '') || container?.min_height || ''
  if (rawMinHeight && rawMinHeight !== 'auto' && rawMinHeight !== 'none' && rawMinHeight !== '') {
    s.minHeight = !String(rawMinHeight).includes('px') && !String(rawMinHeight).includes('vh') && !String(rawMinHeight).includes('%') && !isNaN(Number(rawMinHeight))
      ? `${rawMinHeight}px`
      : rawMinHeight
  }

  const displayType = resolveResponsiveValue<string>(container, 'display_type', viewport, container?.display_type || 'flex')

  if (displayType === 'grid') {
    s.display = 'grid'
    const explicitCols = resolveResponsiveValue<string>(container, 'grid_columns', viewport, container?.grid_columns || '')
    if (viewport === 'mobile' && !container.responsive?.mobile?.grid_columns && !container.grid_columns_mobile) {
      s.gridTemplateColumns = '1fr'
    } else if (viewport === 'tablet' && !container.responsive?.tablet?.grid_columns && !container.grid_columns_tablet) {
      s.gridTemplateColumns = container?.grid_columns?.includes('4') ? 'repeat(2, 1fr)' : (container?.grid_columns || 'repeat(auto-fit, minmax(220px, 1fr))')
    } else {
      s.gridTemplateColumns = explicitCols || container?.grid_columns || 'repeat(auto-fit, minmax(250px, 1fr))'
    }
    const gridRows = resolveResponsiveValue<string>(container, 'grid_rows', viewport, container?.grid_rows || '')
    if (gridRows) s.gridTemplateRows = gridRows
    const gridGap = resolveResponsiveValue<string>(container, 'grid_gap', viewport, resolveResponsiveValue<string>(container, 'gap', viewport, container?.gap || '16px'))
    s.gap = gridGap
  } else if (displayType === 'block') {
    s.display = 'block'
  } else {
    s.display = 'flex'
    // Flex Direction responsive
    const explicitDir = resolveResponsiveValue<string>(container, 'direction', viewport, '') || container?.direction
    const baseDir = explicitDir || 'column'
    if (viewport === 'mobile' && !container.responsive?.mobile?.direction && !container.direction_mobile && baseDir === 'row') {
      s.flexDirection = 'column'
      s.flexWrap = 'wrap'
    } else {
      s.flexDirection = baseDir as any
      const wrapVal = resolveResponsiveValue<string>(container, 'wrap', viewport, '') ||
                      resolveResponsiveValue<string>(container, 'flex_wrap', viewport, '') ||
                      container?.wrap ||
                      container?.flex_wrap ||
                      (viewport === 'mobile' ? 'wrap' : 'nowrap')
      s.flexWrap = wrapVal as any
    }

    const rawGap = resolveResponsiveValue<string>(container, 'gap', viewport, '') || container?.gap || ''
    const gapRow = resolveResponsiveValue<string>(container, 'gap_row', viewport, '') || container?.gap_row || ''
    const gapCol = resolveResponsiveValue<string>(container, 'gap_column', viewport, '') || container?.gap_column || ''

    if (gapRow || gapCol) {
      const r = gapRow ? (String(gapRow).includes('px') || String(gapRow).includes('%') || String(gapRow).includes('em') ? gapRow : `${gapRow}px`) : '16px'
      const c = gapCol ? (String(gapCol).includes('px') || String(gapCol).includes('%') || String(gapCol).includes('em') ? gapCol : `${gapCol}px`) : '16px'
      s.gap = `${r} ${c}`
      s.rowGap = r
      s.columnGap = c
    } else if (rawGap) {
      s.gap = String(rawGap).includes('px') || String(rawGap).includes('%') || String(rawGap).includes('em') ? rawGap : `${rawGap}px`
    } else {
      s.gap = '16px'
    }
    s.alignItems = (resolveResponsiveValue<string>(container, 'align_items', viewport, '') || container?.align_items || 'stretch') as any
    s.justifyContent = (resolveResponsiveValue<string>(container, 'justify_content', viewport, '') || container?.justify_content || 'flex-start') as any
  }

  return s
}

function formatPx(val: any): string | undefined {
  if (val === undefined || val === null || val === '') return undefined
  const str = String(val).trim()
  if (str === '' || str === 'auto' || str === 'inherit' || str === 'initial') return str
  if (/^-?\d+(\.\d+)?$/.test(str)) return `${str}px`
  return str
}

export function computeWidgetStyles(widget: any, viewport: ViewportMode = 'desktop'): React.CSSProperties {
  const s: React.CSSProperties = {}
  if (!widget) return s

  // Typography
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

  // Background
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

  // Spacing
  const pTop = formatPx(resolveResponsiveValue(widget, 'padding_top', viewport, ''))
  if (pTop !== undefined) s.paddingTop = pTop
  const pRight = formatPx(resolveResponsiveValue(widget, 'padding_right', viewport, ''))
  if (pRight !== undefined) s.paddingRight = pRight
  const pBottom = formatPx(resolveResponsiveValue(widget, 'padding_bottom', viewport, ''))
  if (pBottom !== undefined) s.paddingBottom = pBottom
  const pLeft = formatPx(resolveResponsiveValue(widget, 'padding_left', viewport, ''))
  if (pLeft !== undefined) s.paddingLeft = pLeft

  const rawPadding = resolveResponsiveValue<string>(widget, 'padding', viewport, '')
  if (rawPadding && pTop === undefined && pRight === undefined && pBottom === undefined && pLeft === undefined) {
    s.padding = rawPadding
  }

  const mTop = formatPx(resolveResponsiveValue(widget, 'margin_top', viewport, ''))
  if (mTop !== undefined) s.marginTop = mTop
  const mRight = formatPx(resolveResponsiveValue(widget, 'margin_right', viewport, ''))
  if (mRight !== undefined) s.marginRight = mRight
  const mBottom = formatPx(resolveResponsiveValue(widget, 'margin_bottom', viewport, ''))
  if (mBottom !== undefined) s.marginBottom = mBottom
  const mLeft = formatPx(resolveResponsiveValue(widget, 'margin_left', viewport, ''))
  if (mLeft !== undefined) s.marginLeft = mLeft

  const rawMargin = resolveResponsiveValue<string>(widget, 'margin', viewport, '')
  if (rawMargin && mTop === undefined && mRight === undefined && mBottom === undefined && mLeft === undefined) {
    s.margin = rawMargin
  }

  // Sizing
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

  // Border & Radius & Shadow
  const borderStyle = resolveResponsiveValue<string>(widget, 'border_style', viewport, widget.border_type || widget.settings?.border_style || widget.settings?.border_type || '')
  const borderWidth = resolveResponsiveValue<string>(widget, 'border_width', viewport, widget.settings?.border_width || '1px')
  const borderColor = resolveResponsiveValue<string>(widget, 'border_color', viewport, widget.settings?.border_color || '#e8e8ed')
  if (borderStyle && borderStyle !== 'none') {
    s.border = `${borderWidth} ${borderStyle} ${borderColor}`
  }
  const borderRadius = resolveResponsiveValue<string>(widget, 'border_radius', viewport, widget.settings?.border_radius || '')
  if (borderRadius) s.borderRadius = borderRadius
  const rawBoxShadow = resolveResponsiveValue<string>(widget, 'box_shadow', viewport, widget.settings?.box_shadow || widget.style?.box_shadow || widget.style?.boxShadow || '')
  if (rawBoxShadow && rawBoxShadow !== 'none' && rawBoxShadow !== '') s.boxShadow = rawBoxShadow

  // Object Fit & Object Position (Images / Videos)
  const objectFit = resolveResponsiveValue<string>(widget, 'object_fit', viewport, widget.settings?.object_fit || widget.content?.object_fit || widget.style?.objectFit || '')
  if (objectFit) s.objectFit = objectFit as any
  const objectPosition = resolveResponsiveValue<string>(widget, 'object_position', viewport, widget.settings?.object_position || widget.content?.object_position || widget.style?.objectPosition || '')
  if (objectPosition) s.objectPosition = objectPosition as any

  // Opacity & Filters
  const opacity = resolveResponsiveValue(widget, 'opacity', viewport, widget.settings?.opacity ?? widget.content?.opacity ?? '')
  if (opacity !== '' && opacity !== undefined) s.opacity = (Number(opacity) > 1 ? Number(opacity) / 100 : Number(opacity)) as any

  const filters: string[] = []
  const blur = resolveResponsiveValue<string>(widget, 'filter_blur', viewport, widget.settings?.filter_blur || '')
  if (blur && blur !== '0' && blur !== '0px') filters.push(`blur(${blur.includes('px') ? blur : `${blur}px`})`)
  const brightness = resolveResponsiveValue<string>(widget, 'filter_brightness', viewport, widget.settings?.filter_brightness || '')
  if (brightness && brightness !== '100' && brightness !== '1') filters.push(`brightness(${Number(brightness) > 2 ? Number(brightness) / 100 : brightness})`)
  const contrast = resolveResponsiveValue<string>(widget, 'filter_contrast', viewport, widget.settings?.filter_contrast || '')
  if (contrast && contrast !== '100' && contrast !== '1') filters.push(`contrast(${Number(contrast) > 2 ? Number(contrast) / 100 : contrast})`)
  const saturation = resolveResponsiveValue<string>(widget, 'filter_saturate', viewport, widget.settings?.filter_saturate || '')
  if (saturation && saturation !== '100' && saturation !== '1') filters.push(`saturate(${Number(saturation) > 2 ? Number(saturation) / 100 : saturation})`)
  if (filters.length > 0) s.filter = filters.join(' ')

  // Position: Static, Relative, Absolute, Fixed, Sticky
  const position = resolveResponsiveValue<string>(widget, 'position', viewport, widget.settings?.position || widget.style?.position || '')
  if (position && position !== 'static') {
    s.position = position as any
    const top = resolveResponsiveValue<any>(widget, 'top', viewport, widget.settings?.top || widget.style?.top || '')
    const right = resolveResponsiveValue<any>(widget, 'right', viewport, widget.settings?.right || widget.style?.right || '')
    const bottom = resolveResponsiveValue<any>(widget, 'bottom', viewport, widget.settings?.bottom || widget.style?.bottom || '')
    const left = resolveResponsiveValue<any>(widget, 'left', viewport, widget.settings?.left || widget.style?.left || '')

    const formatOffset = (val: any) => {
      if (val === undefined || val === null || val === '') return undefined
      const str = String(val).trim()
      if (!str) return undefined
      if (/^-?\d+(\.\d+)?$/.test(str)) return `${str}px`
      return str
    }

    if (top !== undefined && top !== '') s.top = formatOffset(top)
    if (right !== undefined && right !== '') s.right = formatOffset(right)
    if (bottom !== undefined && bottom !== '') s.bottom = formatOffset(bottom)
    if (left !== undefined && left !== '') s.left = formatOffset(left)
  }

  // Z-Index
  const zIndexVal = resolveResponsiveValue<any>(widget, 'z_index', viewport, widget.settings?.z_index || widget.style?.zIndex || '')
  if (zIndexVal !== undefined && zIndexVal !== '') {
    const numZ = parseInt(String(zIndexVal), 10)
    if (!isNaN(numZ)) s.zIndex = numZ
  }
  // Sticky Widget
  const isWidgetSticky = !!widget.sticky_header || widget.sticky === 'top' || !!widget.isSticky || !!widget.settings?.sticky_header
  const isWidgetStickyActive = isWidgetSticky && (
    (viewport === 'desktop' && widget.sticky_desktop !== false) ||
    (viewport === 'tablet' && widget.sticky_tablet !== false) ||
    (viewport === 'mobile' && widget.sticky_mobile !== false)
  )
  if (isWidgetStickyActive) {
    s.position = 'sticky'
    s.top = `${widget.sticky_offset ?? 0}px`
    s.zIndex = widget.z_index || 9970
    if (widget.sticky_blur !== false) {
      ;(s as any).backdropFilter = 'blur(20px)'
      ;(s as any).WebkitBackdropFilter = 'blur(20px)'
      if (!s.backgroundColor || s.backgroundColor === 'transparent') {
        s.backgroundColor = 'rgba(255, 255, 255, 0.85)'
      }
    }
  }

  const overflow = resolveResponsiveValue<string>(widget, 'overflow', viewport, '')
  if (overflow) s.overflow = overflow as any

  // Align Self, Order & Size Mode (Flex Child controls)
  const alignSelf = resolveResponsiveValue<string>(widget, 'align_self', viewport, '')
  if (alignSelf && alignSelf !== 'auto') s.alignSelf = alignSelf as any

  const orderMode = resolveResponsiveValue<string>(widget, 'order_mode', viewport, '')
  if (orderMode === 'start') s.order = -1
  else if (orderMode === 'end') s.order = 999
  else if (orderMode === 'custom') {
    const customOrder = resolveResponsiveValue(widget, 'order', viewport, '')
    if (customOrder !== '') s.order = parseInt(String(customOrder), 10)
  }

  const sizeMode = resolveResponsiveValue<string>(widget, 'size_mode', viewport, '')
  if (sizeMode === 'full') {
    s.width = '100%'
    s.flexGrow = 1
  } else if (sizeMode === 'inline') {
    s.width = 'auto'
    s.display = 'inline-block'
  }

  // Transform
  const transforms: string[] = []
  const transX = resolveResponsiveValue<string>(widget, 'transform_translate_x', viewport, widget.transform?.translate_x || '')
  const transY = resolveResponsiveValue<string>(widget, 'transform_translate_y', viewport, widget.transform?.translate_y || '')
  if (transX || transY) transforms.push(`translate(${transX || '0'}, ${transY || '0'})`)
  const scale = resolveResponsiveValue(widget, 'transform_scale', viewport, widget.transform?.scale || '')
  if (scale && scale !== 1 && scale !== '1') transforms.push(`scale(${scale})`)
  const rotate = resolveResponsiveValue(widget, 'transform_rotate', viewport, widget.transform?.rotate || '')
  if (rotate) transforms.push(`rotate(${String(rotate).includes('deg') ? rotate : `${rotate}deg`})`)
  const skewX = resolveResponsiveValue(widget, 'transform_skew_x', viewport, widget.transform?.skew_x || '')
  if (skewX) transforms.push(`skewX(${String(skewX).includes('deg') ? skewX : `${skewX}deg`})`)
  if (transforms.length > 0) s.transform = transforms.join(' ')

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

  // Entrance Animation
  const animEntrance = resolveResponsiveValue<string>(widget, 'animation_entrance', viewport, widget.animation_type || widget.settings?.animation_entrance || '')
  if (animEntrance && animEntrance !== 'none') {
    const animDuration = resolveResponsiveValue<string>(widget, 'animation_duration', viewport, '800ms')
    const animDelay = resolveResponsiveValue<string>(widget, 'animation_delay', viewport, '0ms')
    const animName = `teknix${animEntrance.charAt(0).toUpperCase() + animEntrance.slice(1)}`
    s.animation = `${animName} ${animDuration} cubic-bezier(0.16, 1, 0.3, 1) ${animDelay} both`
  }

  // Transitions for smooth hover
  const transDuration = resolveResponsiveValue<string>(widget, 'transition_duration', viewport, '0.3s')
  const transTiming = resolveResponsiveValue<string>(widget, 'transition_timing', viewport, 'cubic-bezier(0.16, 1, 0.3, 1)')
  s.transition = `all ${String(transDuration).includes('s') ? transDuration : `${transDuration}ms`} ${transTiming}`

  // Visibility in Editor (Grayscale + 35% opacity so it stays visible and editable for the designer)
  const hideDesktop = !!widget.hide_on_desktop || !!widget.hide_desktop || !!widget.settings?.hide_desktop || !!widget.settings?.hide_on_desktop
  const hideTablet = !!widget.hide_on_tablet || !!widget.hide_tablet || !!widget.settings?.hide_tablet || !!widget.settings?.hide_on_tablet
  const hideMobile = !!widget.hide_on_mobile || !!widget.hide_mobile || !!widget.settings?.hide_mobile || !!widget.settings?.hide_on_mobile

  const isHiddenInViewport =
    (viewport === 'desktop' && hideDesktop) ||
    (viewport === 'tablet' && hideTablet) ||
    (viewport === 'mobile' && hideMobile)

  if (isHiddenInViewport) {
    s.filter = 'grayscale(100%)'
    s.opacity = 0.35
  }

  return s
}

// ------------------------------------------------------------
// 6. DYNAMIC TAGS RESOLVER (Elementor Dynamic Tags Standard)
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
    'product.name': product.name || product.title || '',
    'product.title': product.name || product.title || '',
    'product.sku': product.sku || '',
    'product.price': fmtCurrency(currentPrice || 0),
    'product.compare_price': originalPrice > 0 ? fmtCurrency(originalPrice) : fmtCurrency(currentPrice || 0),
    'product.original_price': originalPrice > 0 ? fmtCurrency(originalPrice) : fmtCurrency(currentPrice || 0),
    'product.discount': discountPercent > 0 ? `${discountPercent}% OFF` : '',
    'product.installments': currentPrice > 0 ? `12x de R$ ${installmentVal} sem juros` : '',
    'product.stock': product.stock ?? product.stock_quantity ?? '',
    'product.image': product.image_url || (Array.isArray(product.images) ? product.images[0] : '') || '',
    'product.gallery': product.image_url || '',
    'product.description': product.description || '',
    'product.short_description': product.short_description || '',
    'product.category': product.category || product.category_name || '',
    'product.brand': product.brand || '',
    'product.rating': '',
    'product.reviews_count': '',
    'product.shipping': '',
    'product.availability': '',
    'product.url': product.slug ? `/produto/${product.slug}` : '',
    'customer.name': customer.name || '',
    'customer.first_name': customer.name ? customer.name.split(' ')[0] : '',
    'customer.email': customer.email || '',
    'site.name': site.name || '',
    'site.url': site.url || '',
    'site.logo': site.logo || ''
  }

  if (tags[template]) return tags[template]

  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    return tags[key] !== undefined ? tags[key] : `{{${key}}}`
  })
}

// ------------------------------------------------------------
// 4. MOTION & SCROLL EFFECTS RUNTIME
// ------------------------------------------------------------

export interface MotionConfig {
  entranceAnimation?: string
  animationDuration?: number | string
  animationDelay?: number | string
  verticalScroll?: { enabled: boolean; direction: 'up' | 'down'; speed: number }
  horizontalScroll?: { enabled: boolean; direction: 'left' | 'right'; speed: number }
  opacityScroll?: { enabled: boolean; from: number; to: number }
  scaleScroll?: { enabled: boolean; from: number; to: number }
  blurScroll?: { enabled: boolean; from: number; to: number }
  rotateScroll?: { enabled: boolean; from: number; to: number }
  mouseTilt?: { enabled: boolean; max: number }
  sticky?: { enabled: boolean; position: 'top' | 'bottom'; offset: number }
}

export function getMotionKeyframesCSS(): string {
  return `
/* TEKNIX Motion Effects & Animations */
@keyframes teknixFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes teknixFadeInUp {
  from { opacity: 0; transform: translate3d(0, 40px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes teknixFadeInDown {
  from { opacity: 0; transform: translate3d(0, -40px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes teknixFadeInLeft {
  from { opacity: 0; transform: translate3d(-40px, 0, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes teknixFadeInRight {
  from { opacity: 0; transform: translate3d(40px, 0, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes teknixSlideInUp {
  from { transform: translate3d(0, 100%, 0); visibility: visible; }
  to { transform: translate3d(0, 0, 0); }
}
@keyframes teknixSlideInDown {
  from { transform: translate3d(0, -100%, 0); visibility: visible; }
  to { transform: translate3d(0, 0, 0); }
}
@keyframes teknixSlideInLeft {
  from { transform: translate3d(-100%, 0, 0); visibility: visible; }
  to { transform: translate3d(0, 0, 0); }
}
@keyframes teknixSlideInRight {
  from { transform: translate3d(100%, 0, 0); visibility: visible; }
  to { transform: translate3d(0, 0, 0); }
}
@keyframes teknixZoomIn {
  from { opacity: 0; transform: scale3d(0.7, 0.7, 0.7); }
  50% { opacity: 1; }
  to { transform: scale3d(1, 1, 1); }
}
@keyframes teknixZoomOut {
  from { opacity: 1; }
  50% { opacity: 0; transform: scale3d(0.3, 0.3, 0.3); }
  to { opacity: 0; }
}
@keyframes teknixBounceIn {
  from, 20%, 40%, 60%, 80%, to { animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); }
  0% { opacity: 0; transform: scale3d(0.3, 0.3, 0.3); }
  20% { transform: scale3d(1.1, 1.1, 1.1); }
  40% { transform: scale3d(0.9, 0.9, 0.9); }
  60% { opacity: 1; transform: scale3d(1.03, 1.03, 1.03); }
  80% { transform: scale3d(0.97, 0.97, 0.97); }
  to { opacity: 1; transform: scale3d(1, 1, 1); }
}
@keyframes teknixRotateIn {
  from { transform: rotate3d(0, 0, 1, -200deg); opacity: 0; }
  to { transform: translate3d(0, 0, 0); opacity: 1; }
}
@keyframes teknixFlipInX {
  from { transform: perspective(400px) rotate3d(1, 0, 0, 90deg); animation-timing-function: ease-in; opacity: 0; }
  40% { transform: perspective(400px) rotate3d(1, 0, 0, -20deg); animation-timing-function: ease-in; }
  60% { transform: perspective(400px) rotate3d(1, 0, 0, 10deg); opacity: 1; }
  80% { transform: perspective(400px) rotate3d(1, 0, 0, -5deg); }
  to { transform: perspective(400px); }
}
@keyframes teknixFlipInY {
  from { transform: perspective(400px) rotate3d(0, 1, 0, 90deg); animation-timing-function: ease-in; opacity: 0; }
  40% { transform: perspective(400px) rotate3d(0, 1, 0, -20deg); animation-timing-function: ease-in; }
  60% { transform: perspective(400px) rotate3d(0, 1, 0, 10deg); opacity: 1; }
  80% { transform: perspective(400px) rotate3d(0, 1, 0, -5deg); }
  to { transform: perspective(400px); }
}
@keyframes teknixRollIn {
  from { opacity: 0; transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes teknixBlurFadeIn {
  from { opacity: 0; filter: blur(12px); transform: translate3d(0, 24px, 0); }
  to { opacity: 1; filter: blur(0px); transform: translate3d(0, 0, 0); }
}
@keyframes teknixFramerSpringUp {
  0% { opacity: 0; transform: translate3d(0, 50px, 0) scale(0.92); }
  65% { opacity: 1; transform: translate3d(0, -6px, 0) scale(1.02); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes teknixAppleReveal {
  0% { opacity: 0; transform: scale(0.94); filter: blur(4px); }
  100% { opacity: 1; transform: scale(1); filter: blur(0px); }
}
@keyframes teknixElasticPop {
  0% { opacity: 0; transform: scale(0.4); }
  70% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes teknixGlowPulse {
  0% { opacity: 0; filter: drop-shadow(0 0 0px rgba(0, 113, 227, 0)); }
  50% { opacity: 1; filter: drop-shadow(0 0 18px rgba(0, 113, 227, 0.65)); }
  100% { opacity: 1; filter: drop-shadow(0 0 0px rgba(0, 113, 227, 0)); }
}
@keyframes teknixFloatBob {
  0% { opacity: 0; transform: translateY(16px); }
  50% { opacity: 1; transform: translateY(-4px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes teknixRevealSlide {
  0% { opacity: 0; clip-path: inset(0 100% 0 0); }
  100% { opacity: 1; clip-path: inset(0 0 0 0); }
}

.teknix-animated {
  animation-fill-mode: both;
}
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
.teknix-anim-blurFadeIn { animation-name: teknixBlurFadeIn; }
.teknix-anim-framerSpringUp { animation-name: teknixFramerSpringUp; }
.teknix-anim-appleReveal { animation-name: teknixAppleReveal; }
.teknix-anim-elasticPop { animation-name: teknixElasticPop; }
.teknix-anim-glowPulse { animation-name: teknixGlowPulse; }
.teknix-anim-floatBob { animation-name: teknixFloatBob; }
.teknix-anim-revealSlide { animation-name: teknixRevealSlide; }

/* Fixed & Sticky Positioning Helpers */
.teknix-fixed-element {
  position: fixed !important;
  z-index: 9999;
}
.teknix-sticky-element {
  position: -webkit-sticky !important;
  position: sticky !important;
}

/* Visibility Rules */
@media (min-width: 1025px) {
  .teknix-hide-desktop { display: none !important; }
}
@media (min-width: 768px) and (max-width: 1024px) {
  .teknix-hide-tablet { display: none !important; }
}
@media (max-width: 767px) {
  .teknix-hide-mobile { display: none !important; }
}
`
}

// ------------------------------------------------------------
// 5. FULL CSS COMPILER (For Hub Preview & Site PageRenderer)
// ------------------------------------------------------------

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

    // Section Hover
    const sHoverBg = section.hover_bg_color || section.settings?.hover_bg_color || section.hover?.bg_color
    const sHoverOpacity = section.hover_opacity ?? section.settings?.hover_opacity ?? section.hover?.opacity
    const sHoverBorder = section.hover_border_color || section.settings?.hover_border_color || section.hover?.border_color
    const sHoverShadow = section.hover_box_shadow || section.settings?.hover_box_shadow || section.hover?.box_shadow
    if (sHoverBg || sHoverOpacity !== undefined || sHoverBorder || sHoverShadow) {
      const sHoverDecls: string[] = []
      if (sHoverBg) sHoverDecls.push(`background-color: ${sHoverBg} !important;`)
      if (sHoverOpacity !== undefined && sHoverOpacity !== '') {
        const num = Number(sHoverOpacity)
        sHoverDecls.push(`opacity: ${num > 1 ? num / 100 : num} !important;`)
      }
      if (sHoverBorder) sHoverDecls.push(`border-color: ${sHoverBorder} !important;`)
      if (sHoverShadow) sHoverDecls.push(`box-shadow: ${sHoverShadow} !important;`)
      desktopRules.push(`${secSelector}:hover, ${secSelector}[data-hover-preview="true"] { ${sHoverDecls.join(' ')} }`)
      desktopRules.push(`${secSelector} { transition: all ${section.transition_duration || '0.3s'} cubic-bezier(0.16, 1, 0.3, 1); }`)
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
      if (cTabletDecls.length > 0) {
        tabletRules.push(`${conSelector} { ${cTabletDecls.join(' ')} }`)
      }

      const cInnerTabletDecls: string[] = []
      if (cTabletDir) cInnerTabletDecls.push(`flex-direction: ${cTabletDir};`)
      if (cTabletGap) cInnerTabletDecls.push(`gap: ${cTabletGap};`)
      if (cTabletAlign) cInnerTabletDecls.push(`align-items: ${cTabletAlign};`)
      if (cTabletJustify) cInnerTabletDecls.push(`justify-content: ${cTabletJustify};`)
      if (cInnerTabletDecls.length > 0) {
        tabletRules.push(`${conInnerSelector} { ${cInnerTabletDecls.join(' ')} }`)
      }

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
      if (cMobileDecls.length > 0) {
        mobileRules.push(`${conSelector} { ${cMobileDecls.join(' ')} }`)
      }

      const cInnerMobileDecls: string[] = []
      if (cMobileDir) cInnerMobileDecls.push(`flex-direction: ${cMobileDir};`)
      if (cMobileGap) cInnerMobileDecls.push(`gap: ${cMobileGap};`)
      if (cMobileAlign) cInnerMobileDecls.push(`align-items: ${cMobileAlign};`)
      if (cMobileJustify) cInnerMobileDecls.push(`justify-content: ${cMobileJustify};`)
      if (cInnerMobileDecls.length > 0) {
        mobileRules.push(`${conInnerSelector} { ${cInnerMobileDecls.join(' ')} }`)
      }

      // Container Hover
      const cHoverBg = container.hover_bg_color || container.settings?.hover_bg_color || container.hover?.bg_color
      const cHoverOpacity = container.hover_opacity ?? container.settings?.hover_opacity ?? container.hover?.opacity
      const cHoverBorder = container.hover_border_color || container.settings?.hover_border_color || container.hover?.border_color
      const cHoverShadow = container.hover_box_shadow || container.settings?.hover_box_shadow || container.hover?.box_shadow
      if (cHoverBg || cHoverOpacity !== undefined || cHoverBorder || cHoverShadow) {
        const cHoverDecls: string[] = []
        if (cHoverBg) cHoverDecls.push(`background-color: ${cHoverBg} !important;`)
        if (cHoverOpacity !== undefined && cHoverOpacity !== '') {
          const num = Number(cHoverOpacity)
          cHoverDecls.push(`opacity: ${num > 1 ? num / 100 : num} !important;`)
        }
        if (cHoverBorder) cHoverDecls.push(`border-color: ${cHoverBorder} !important;`)
        if (cHoverShadow) cHoverDecls.push(`box-shadow: ${cHoverShadow} !important;`)
        desktopRules.push(`${conSelector}:hover, ${conSelector}[data-hover-preview="true"] { ${cHoverDecls.join(' ')} }`)
        desktopRules.push(`${conSelector} { transition: all ${container.transition_duration || '0.3s'} cubic-bezier(0.16, 1, 0.3, 1); }`)
      }

      // Process Widgets
      const widgets = container.widgets || []
      widgets.forEach((widget: any) => {
        const wId = widget.id
        const wSelector = `[data-widget-id="${wId}"]`

        if (widget.custom_css) {
          scopedCustomRules.push(scopeCustomCss(widget.custom_css, wSelector))
        }

        const hover = widget.hover || widget.states?.hover || {}
        const hoverDecls: string[] = []
        const wHoverColor = widget.hover_color || widget.settings?.hover_color || hover.color
        if (wHoverColor) hoverDecls.push(`color: ${wHoverColor} !important;`)
        const wHoverBg = widget.hover_bg_color || widget.settings?.hover_bg_color || hover.bg_color || hover.backgroundColor
        if (wHoverBg) hoverDecls.push(`background-color: ${wHoverBg} !important;`)
        const wHoverBorder = widget.hover_border_color || widget.settings?.hover_border_color || hover.border_color || hover.borderColor
        if (wHoverBorder) hoverDecls.push(`border-color: ${wHoverBorder} !important;`)
        const wHoverShadow = widget.hover_box_shadow || widget.settings?.hover_box_shadow || hover.shadow || hover.boxShadow
        if (wHoverShadow) hoverDecls.push(`box-shadow: ${wHoverShadow} !important;`)
        const wHoverRadius = widget.hover_border_radius || widget.settings?.hover_border_radius || hover.border_radius
        if (wHoverRadius) hoverDecls.push(`border-radius: ${wHoverRadius} !important;`)

        const transforms: string[] = []
        const wHoverScale = widget.hover_transform_scale || widget.settings?.hover_transform_scale
        if (wHoverScale) transforms.push(`scale(${wHoverScale})`)
        const wHoverRotate = widget.hover_transform_rotate || widget.settings?.hover_transform_rotate
        if (wHoverRotate) transforms.push(`rotate(${String(wHoverRotate).includes('deg') ? wHoverRotate : `${wHoverRotate}deg`})`)
        const wHoverTransY = widget.hover_transform_translate_y || widget.settings?.hover_transform_translate_y
        if (wHoverTransY) transforms.push(`translateY(${wHoverTransY})`)
        if (hover.transform) transforms.push(hover.transform)
        if (transforms.length > 0) hoverDecls.push(`transform: ${transforms.join(' ')} !important;`)

        if (hover.opacity !== undefined || widget.hover_opacity !== undefined) {
          hoverDecls.push(`opacity: ${widget.hover_opacity ?? hover.opacity} !important;`)
        }

        if (hoverDecls.length > 0) {
          desktopRules.push(`${wSelector}:hover, ${wSelector}[data-hover-preview="true"] { ${hoverDecls.join(' ')} }`)
          desktopRules.push(`${wSelector} { transition: all ${widget.transition_duration || '0.3s'} cubic-bezier(0.16, 1, 0.3, 1); }`)
        }

        const pos = resolveResponsiveValue<string>(widget, 'position', 'desktop', '')
        if (pos === 'absolute') {
          const top = resolveResponsiveValue<string>(widget, 'top', 'desktop', '')
          const right = resolveResponsiveValue<string>(widget, 'right', 'desktop', '')
          const bottom = resolveResponsiveValue<string>(widget, 'bottom', 'desktop', '')
          const left = resolveResponsiveValue<string>(widget, 'left', 'desktop', '')
          const zIndex = resolveResponsiveValue(widget, 'z_index', 'desktop', '')

          const absDecls = ['position: absolute !important;']
          if (zIndex !== undefined && zIndex !== '') absDecls.push(`z-index: ${zIndex};`)
          if (top) absDecls.push(`top: ${top};`)
          if (right) absDecls.push(`right: ${right};`)
          if (bottom) absDecls.push(`bottom: ${bottom};`)
          if (left) absDecls.push(`left: ${left};`)
          desktopRules.push(`${wSelector} { ${absDecls.join(' ')} }`)

          const tTop = resolveResponsiveValue<string>(widget, 'top', 'tablet', '')
          const tRight = resolveResponsiveValue<string>(widget, 'right', 'tablet', '')
          const tBottom = resolveResponsiveValue<string>(widget, 'bottom', 'tablet', '')
          const tLeft = resolveResponsiveValue<string>(widget, 'left', 'tablet', '')
          const tZIndex = resolveResponsiveValue(widget, 'z_index', 'tablet', '')
          const tDecls: string[] = []
          if (tZIndex !== undefined && tZIndex !== '') tDecls.push(`z-index: ${tZIndex};`)
          if (tTop) tDecls.push(`top: ${tTop};`)
          if (tRight) tDecls.push(`right: ${tRight};`)
          if (tBottom) tDecls.push(`bottom: ${tBottom};`)
          if (tLeft) tDecls.push(`left: ${tLeft};`)
          if (tDecls.length > 0) tabletRules.push(`${wSelector} { ${tDecls.join(' ')} }`)

          const mTop = resolveResponsiveValue<string>(widget, 'top', 'mobile', '')
          const mRight = resolveResponsiveValue<string>(widget, 'right', 'mobile', '')
          const mBottom = resolveResponsiveValue<string>(widget, 'bottom', 'mobile', '')
          const mLeft = resolveResponsiveValue<string>(widget, 'left', 'mobile', '')
          const mZIndex = resolveResponsiveValue(widget, 'z_index', 'mobile', '')
          const mDecls: string[] = []
          if (mZIndex !== undefined && mZIndex !== '') mDecls.push(`z-index: ${mZIndex};`)
          if (mTop) mDecls.push(`top: ${mTop};`)
          if (mRight) mDecls.push(`right: ${mRight};`)
          if (mBottom) mDecls.push(`bottom: ${mBottom};`)
          if (mLeft) mDecls.push(`left: ${mLeft};`)
          if (mDecls.length > 0) mobileRules.push(`${wSelector} { ${mDecls.join(' ')} }`)
        }

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
        if (wTabletDecls.length > 0) {
          tabletRules.push(`${wSelector} { ${wTabletDecls.join(' ')} }`)
        }

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
        if (wMobileDecls.length > 0) {
          mobileRules.push(`${wSelector} { ${wMobileDecls.join(' ')} }`)
        }
      })
    })
  })

  if (customGlobalCss) {
    scopedCustomRules.push(`/* Page Custom CSS */\n${customGlobalCss}`)
  }

  return `
/* ============================================================ */
/* TEKNIX PAGE BUILDER COMPILED STYLES (Page ID: ${pageId || 'current'}) */
/* ============================================================ */

${getMotionKeyframesCSS()}

/* --- GLOBAL LAYOUT & CONTAINER WRAPPER RULES --- */
.section-containers, .section-containers-wrap {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

/* --- DESKTOP RULES --- */
${desktopRules.join('\n')}

/* --- TABLET RULES (max-width: 1024px) --- */
@media (max-width: 1024px) {
  .section-containers, .section-containers-wrap {
    flex-wrap: wrap !important;
  }
${tabletRules.join('\n')}
}

/* --- MOBILE RULES (max-width: 767px) --- */
@media (max-width: 767px) {
  .section-containers, .section-containers-wrap, [data-section-id] > .section-containers, [data-section-id] > div:first-child {
    flex-direction: column !important;
    flex-wrap: wrap !important;
  }
  .e-con, [data-container-id] {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }
  .mobile-stack {
    flex-direction: column !important;
    flex-wrap: wrap !important;
  }
${mobileRules.join('\n')}
}

/* --- SCOPED CUSTOM CSS --- */
${scopedCustomRules.join('\n\n')}
`
}

// ------------------------------------------------------------
// 6. RUNTIME MOTION OBSERVER
// ------------------------------------------------------------

export function initMotionEffectsRuntime() {
  if (typeof window === 'undefined') return () => {}

  // 1. Entrance Animations via IntersectionObserver
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

  // 2. Scroll Effects (Vertical Parallax, Opacity, Scale)
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

  const scrollWrapper = document.querySelector('.elementor-canvas-wrapper')
  if (scrollWrapper) {
    scrollWrapper.addEventListener('scroll', onScroll, { passive: true })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // 3. Mouse Tilt 3D & Mouse Track (Live Dynamic Tracking)
  const handleMouseMove = (e: MouseEvent) => {
    const tiltEls = document.querySelectorAll('[data-teknix-tilt], [data-mouse-tilt="true"]')
    const trackEls = document.querySelectorAll('[data-mouse-track="true"]')

    tiltEls.forEach((rawEl) => {
      const el = rawEl as HTMLElement
      const rect = el.getBoundingClientRect()
      if (
        e.clientX >= rect.left - 60 &&
        e.clientX <= rect.right + 60 &&
        e.clientY >= rect.top - 60 &&
        e.clientY <= rect.bottom + 60
      ) {
        const x = e.clientX - (rect.left + rect.width / 2)
        const y = e.clientY - (rect.top + rect.height / 2)
        const maxAngle = parseFloat(el.dataset.tiltSpeed || el.dataset.teknixTiltMax || '6')
        const rotX = -(y / (rect.height / 2)) * maxAngle
        const rotY = (x / (rect.width / 2)) * maxAngle
        el.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`
      } else {
        el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'
      }
    })

    trackEls.forEach((rawEl) => {
      const el = rawEl as HTMLElement
      const rect = el.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      const speed = parseFloat(el.dataset.trackSpeed || '4')
      const dir = el.dataset.trackDir === 'direct' ? 1 : -1
      const moveX = (x / 20) * (speed / 2) * dir
      const moveY = (y / 20) * (speed / 2) * dir
      el.style.transform = `translate3d(${moveX.toFixed(1)}px, ${moveY.toFixed(1)}px, 0)`
    })
  }

  window.addEventListener('mousemove', handleMouseMove, { passive: true })

  return () => {
    entranceObserver.disconnect()
    window.removeEventListener('scroll', onScroll)
    if (scrollWrapper) scrollWrapper.removeEventListener('scroll', onScroll)
    window.removeEventListener('mousemove', handleMouseMove)
  }
}
