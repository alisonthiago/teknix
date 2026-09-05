import React, { useState, useEffect } from 'react'
import type { PageSection, PageContainer, PageWidget, EditorTab } from '../../types/pageBuilder'
import { WIDGET_DEFINITIONS } from '../../types/pageBuilder'
import {
  ChevronLeft, ChevronRight, Trash2, Monitor, Tablet, Smartphone, Globe, Link, Unlink,
  Edit2, X, Upload, HelpCircle, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ArrowDown, ArrowRight, ArrowUp, ArrowLeft, Paintbrush, Video, Image as ImageIcon,
  MoveHorizontal, GitBranch, Plus, Sparkles, RotateCcw,
  Star, Heart, Zap, CheckSquare, Check, ShoppingBag, Shield, Truck, Package,
  Wrench, Phone, Mail, Play, Download, MapPin, Box, Award, Clock
} from 'lucide-react'
import MediaLibraryModal from './MediaLibraryModal'
import DisplayConditionsModal from './DisplayConditionsModal'
import IconPickerModal, { ICON_LIBRARY, renderDynamicIcon } from './IconPickerModal'
import { DEFAULT_BENEFIT_COLUMNS } from './AppleStoreBenefitsScroller'
import { DEFAULT_OFFER_ITEMS } from './AppleStoreOffersScroller'
import './Inspector.css'

export const ViewportContext = React.createContext<{
  viewportMode: 'desktop' | 'tablet' | 'mobile'
  onViewportChange?: (mode: 'desktop' | 'tablet' | 'mobile') => void
}>({ viewportMode: 'desktop' })

interface InspectorItem {
  type: 'section' | 'container' | 'widget'
  item: PageSection | PageContainer | PageWidget
  sectionId?: string
  containerId?: string
}

interface Props {
  item: InspectorItem
  tab: EditorTab
  viewportMode?: 'desktop' | 'tablet' | 'mobile'
  onViewportChange?: (mode: 'desktop' | 'tablet' | 'mobile') => void
  onTabChange: (tab: EditorTab) => void
  onUpdateSection: (updates: Partial<PageSection>) => void
  onUpdateContainer: (updates: Partial<PageContainer>) => void
  onUpdateWidget: (updates: Partial<PageWidget>) => void
  onDelete: () => void
  onBack?: () => void
}

export default function Inspector({
  item,
  tab,
  viewportMode = 'desktop',
  onViewportChange,
  onTabChange,
  onUpdateSection,
  onUpdateContainer,
  onUpdateWidget,
  onDelete,
  onBack
}: Props) {
  const obj = (item.item || {}) as any
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>(tab)
  const [bgHoverTab, setBgHoverTab] = useState<'normal' | 'hover'>('normal')
  const [overlayHoverTab, setOverlayHoverTab] = useState<'normal' | 'hover'>('normal')
  const [borderHoverTab, setBorderHoverTab] = useState<'normal' | 'hover'>('normal')
  const [transformHoverTab, setTransformHoverTab] = useState<'normal' | 'hover'>('normal')
  const [isLinkedPadding, setIsLinkedPadding] = useState(true)
  const [isLinkedMargin, setIsLinkedMargin] = useState(true)

  // Helper: bg key prefix based on active tab (normal = 'bg_', hover = 'hover_bg_')
  const bgKey = (key: string) => bgHoverTab === 'hover' ? `hover_${key}` : key
  const getBgVal = (key: string, def: any = '') => {
    const k = bgKey(key)
    return obj[k] ?? obj.settings?.[k] ?? obj.style?.[k] ?? def
  }
  const updateBg = (key: string, value: any) => {
    const k = bgKey(key)
    update(k, value)
    if (item.type === 'widget') updateWidgetStyle(k, value)
  }
  const [openTypography, setOpenTypography] = useState(false)
  const [showDisplayConditionsModal, setShowDisplayConditionsModal] = useState(false)
  const [showIconLibraryModal, setShowIconLibraryModal] = useState(false)
  const [iconPickerTarget, setIconPickerTarget] = useState<'icon' | 'iconBox'>('icon')
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [galleryEditIndex, setGalleryEditIndex] = useState<number | null>(null)
  const [expandedFieldIndex, setExpandedFieldIndex] = useState<number | null>(0)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    layout: true,
    background: true,
    overlay: false,
    border: false,
    shape: false,
    motion: false,
    sticky: false,
    transform: false,
    responsive: false,
    customCss: false,
    widgetContent: true,
    widgetStyle: true,
    onepage: false
  })

  // Live hover preview on the active canvas element when Hover tab is selected
  useEffect(() => {
    const id = obj.id || (obj as any).key
    if (!id) return
    const el = document.querySelector(`[data-widget-id="${id}"], [data-container-id="${id}"], [data-section-id="${id}"]`) as HTMLElement
    if (!el) return

    const isHoverActive = bgHoverTab === 'hover' || borderHoverTab === 'hover' || transformHoverTab === 'hover' || overlayHoverTab === 'hover'
    if (isHoverActive) {
      el.setAttribute('data-hover-preview', 'true')
    } else {
      el.removeAttribute('data-hover-preview')
    }

    return () => {
      el.removeAttribute('data-hover-preview')
    }
  }, [bgHoverTab, borderHoverTab, transformHoverTab, overlayHoverTab, obj.id, (obj as any).key])

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Helper to read value considering active viewport
  function getVal(key: string, defaultVal: any = '') {
    if (viewportMode !== 'desktop') {
      const respVal = obj.responsive?.[viewportMode]?.[key] ?? obj[`${key}_${viewportMode}`]
      if (respVal !== undefined && respVal !== '') return respVal
    }
    return obj[key] ?? obj.settings?.[key] ?? obj.style?.[key] ?? defaultVal
  }

  // Update responsive properties per viewport
  function updateResponsive(key: string, value: any) {
    if (viewportMode === 'desktop') {
      update(key, value)
    } else {
      const currentResp = obj.responsive || {}
      const deviceResp = currentResp[viewportMode] || {}
      const newResponsive = {
        ...currentResp,
        [viewportMode]: {
          ...deviceResp,
          [key]: value
        }
      }
      if (item.type === 'section') {
        onUpdateSection({
          responsive: newResponsive,
          [`${key}_${viewportMode}`]: value
        } as any)
      } else if (item.type === 'container') {
        onUpdateContainer({
          responsive: newResponsive,
          [`${key}_${viewportMode}`]: value
        } as any)
      } else if (item.type === 'widget') {
        const prevSettings = obj.settings || {}
        const prevStyle = obj.style || {}
        onUpdateWidget({
          responsive: newResponsive,
          [`${key}_${viewportMode}`]: value,
          settings: { ...prevSettings, [`${key}_${viewportMode}`]: value },
          style: { ...prevStyle, [`${key}_${viewportMode}`]: value }
        } as any)
      }
    }
  }

  function updateResponsiveMulti(updates: Record<string, any>) {
    if (viewportMode === 'desktop') {
      if (item.type === 'section') {
        onUpdateSection(updates as any)
      } else if (item.type === 'container') {
        onUpdateContainer(updates as any)
      } else if (item.type === 'widget') {
        const prevSettings = obj.settings || {}
        const prevStyle = obj.style || {}
        onUpdateWidget({
          ...updates,
          settings: { ...prevSettings, ...updates },
          style: { ...prevStyle, ...updates }
        } as any)
      }
    } else {
      const currentResp = obj.responsive || {}
      const deviceResp = currentResp[viewportMode] || {}
      const newResponsive = {
        ...currentResp,
        [viewportMode]: {
          ...deviceResp,
          ...updates
        }
      }
      const suffixedUpdates: Record<string, any> = {}
      Object.keys(updates).forEach(k => {
        suffixedUpdates[`${k}_${viewportMode}`] = updates[k]
      })
      if (item.type === 'section') {
        onUpdateSection({ responsive: newResponsive, ...suffixedUpdates } as any)
      } else if (item.type === 'container') {
        onUpdateContainer({ responsive: newResponsive, ...suffixedUpdates } as any)
      } else if (item.type === 'widget') {
        const prevSettings = obj.settings || {}
        const prevStyle = obj.style || {}
        onUpdateWidget({
          responsive: newResponsive,
          ...suffixedUpdates,
          settings: { ...prevSettings, ...suffixedUpdates },
          style: { ...prevStyle, ...suffixedUpdates }
        } as any)
      }
    }
  }

  // Update top-level, settings, and style fields uniformly across all consumers
  function update(key: string, value: any) {
    if (item.type === 'section') {
      onUpdateSection({ [key]: value } as any)
    } else if (item.type === 'container') {
      onUpdateContainer({ [key]: value } as any)
    } else if (item.type === 'widget') {
      const prevSettings = obj.settings || {}
      const prevStyle = obj.style || {}
      onUpdateWidget({
        [key]: value,
        settings: { ...prevSettings, [key]: value },
        style: { ...prevStyle, [key]: value }
      } as any)
    }
  }

  // Update widget content properties cleanly (never exposing raw JSON to user)
  function updateWidgetContent(key: string, value: any) {
    const prevContent = typeof obj.content === 'object' && obj.content !== null
      ? obj.content
      : { text: String(obj.content || '') }
    const updated = { ...prevContent, [key]: value }
    onUpdateWidget({ content: updated } as any)
  }

  // Update widget styling in all places
  function updateWidgetStyle(key: string, value: any) {
    const prevSettings = obj.settings || {}
    const prevStyle = obj.style || {}
    onUpdateWidget({
      [key]: value,
      settings: { ...prevSettings, [key]: value },
      style: { ...prevStyle, [key]: value }
    } as any)
  }

  function updateWidgetContents(entries: Record<string, any>) {
    const prevContent = typeof obj.content === 'object' && obj.content !== null
      ? obj.content
      : { text: String(obj.content || '') }
    const updated = { ...prevContent, ...entries }
    onUpdateWidget({ content: updated } as any)
  }

  const isLayoutType = item.type === 'container' || item.type === 'section'
  const isOnlyImage = obj.type === 'image' || obj.type === 'featuredImage' || obj.type === 'logo' || obj.type === 'svg' || obj.type === 'gif'
  const isImageBox = obj.type === 'imageBox'
  const isImage = isOnlyImage || isImageBox
  const isIconBox = obj.type === 'iconBox'
  const isIcon = obj.type === 'icon'
  const isVideo = obj.type === 'video' || obj.type === 'videoPlaylist'
  const isTextOrHeading = obj.type === 'heading' || obj.type === 'title' || obj.type === 'text' || obj.type === 'paragraph' || obj.type === 'rich_text'
  const isButton = obj.type === 'button' || obj.type === 'buyButton' || obj.type === 'cta'
  const isStarRating = obj.type === 'starRating'
  const isCounter = obj.type === 'counter'
  const isCountdown = obj.type === 'countdown' || obj.type === 'countdownPro'
  const isProgressBar = obj.type === 'progressBar'
  const isTestimonials = obj.type === 'testimonials' || obj.type === 'testimonial'
  const isTabs = obj.type === 'tabs'
  const isAccordion = obj.type === 'accordion' || obj.type === 'toggle' || obj.type === 'faq'
  const isAlert = obj.type === 'alert'
  const isDivider = obj.type === 'divider'
  const isSpacer = obj.type === 'spacer'
  const isGoogleMaps = obj.type === 'googleMaps'
  const isProduct = obj.type === 'product' || obj.type === 'productHero'
  const isProductGrid = obj.type === 'productGrid' || obj.type === 'categories' || obj.type === 'relatedProducts'
  const isHtml = obj.type === 'html' || obj.type === 'code'
  const isLottie = obj.type === 'lottie'
  const isNewsletter = obj.type === 'newsletter'
  const isPriceTable = obj.type === 'priceTable' || obj.type === 'priceList'
  const isAnimatedHeadline = obj.type === 'animatedHeadline'
  const isFlipBox = obj.type === 'flipBox' || obj.type === 'flipBoxPro'
  const isMediaCarousel = obj.type === 'mediaCarousel' || obj.type === 'mediaCarouselPro'
  const isEntertainmentGallery = obj.type === 'entertainmentGallery' || obj.type === 'mediaGallery' || obj.type === 'endlessEntertainment'
  const isChapterNav = obj.type === 'chapterNav' || obj.type === 'productNav' || obj.type === 'categoryNav'
  const isProductLineupGallery = obj.type === 'productLineupGallery' || obj.type === 'productTileGallery'
  const isCards = obj.type === 'cards' || obj.type === 'storeBenefits' || obj.type === 'appleStoreBenefits' || obj.type === 'storeCardsScroller'
  const isOffersCarousel = obj.type === 'carrossel' || obj.type === 'offersCarousel' || obj.type === 'appleOffersCarousel' || obj.type === 'specialOffers'
  const isFeatureCardsGallery = obj.type === 'featureCardsGallery' || obj.type === 'appleFeatureCards'
  const isAppleImageAccordion = obj.type === 'appleImageAccordion' || obj.type === 'imageAccordion'
  const isHotspot = obj.type === 'hotspot'
  const isNavMenu = obj.type === 'navMenu' || obj.type === 'megaMenu'
  const isPosts = obj.type === 'posts' || obj.type === 'postsCarousel'
  const isPortfolio = obj.type === 'portfolio'
  const isPaypal = obj.type === 'paypal' || obj.type === 'paypalButton'
  const isStripe = obj.type === 'stripe' || obj.type === 'stripeButton'
  const isLinkInBio = obj.type === 'linkInBio'
  const isCtaPro = obj.type === 'ctaPro'
  const isPriceTablePro = obj.type === 'priceTablePro'
  const isPriceListPro = obj.type === 'priceListPro'
  const isReviewsPro = obj.type === 'reviewsPro'
  const isAnimatedHeadlinePro = obj.type === 'animatedHeadlinePro'
  const isSubscribe = obj.type === 'subscribe'
  const isSlides = obj.type === 'slides'
  const isVideoPlaylist = obj.type === 'videoPlaylist' || obj.type === 'video'
  const isFeatures = obj.type === 'features'
  const isTestimonialCarousel = obj.type === 'testimonialCarousel' || obj.type === 'testimonialCarouselPro'
  const isCart = obj.type === 'cart' || obj.type === 'minicarrinho'
  const isMyAccount = obj.type === 'minhaConta' || obj.type === 'account'
  const isCheckout = obj.type === 'checkout'
  const isBreadcrumbsPro = obj.type === 'breadcrumbsPro'
  const isShareButtonsPro = obj.type === 'shareButtonsEl' || obj.type === 'shareButtonsPro'
  const isTableOfContentsPro = obj.type === 'tableOfContentsPro'
  const isCodeHighlightPro = obj.type === 'codeHighlightPro'
  const isLottiePro = obj.type === 'lottiePro'
  const isFloatingButtons = obj.type === 'floatingButtons'
  const isCustomCodePro = obj.type === 'customCodePro'
  const isImageGallery = obj.type === 'imageGalleryPro' || obj.type === 'gallery' || obj.type === 'image-gallery-pro' || obj.type === 'imageGallery'
  const isForm = obj.type === 'form' || obj.type === 'formPro' || obj.type === 'form-pro'
  const isLogin = obj.type === 'login' || obj.type === 'loginPro' || obj.type === 'login-pro'

  const hasTypography = item.type === 'widget' && (
    isTextOrHeading || isButton ||
    isPriceTable || isAnimatedHeadline ||
    !!obj.content?.text || !!obj.content?.title || !!obj.content?.label || !!obj.content?.heading
  )

  const [showTypographyPopover, setShowTypographyPopover] = useState(false)
  const [imageWidthUnit, setImageWidthUnit] = useState<'%' | 'px' | 'vw'>('%')
  const [imageHeightUnit, setImageHeightUnit] = useState<'px' | 'vh' | 'auto'>('px')
  const [minHeightUnit, setMinHeightUnit] = useState<'px' | 'vh' | 'auto'>('px')
  const [fontSizeUnit, setFontSizeUnit] = useState<'px' | 'rem' | 'em' | 'vw'>('px')

  const itemTitle = item.type === 'widget'
    ? (WIDGET_DEFINITIONS.find(w => w.type === obj.type)?.label || obj.type)
    : item.type === 'container' ? 'Contêiner' : 'Seção'

  // Current alignment computed from active viewport and all fallback source fields
  const currentAlign = (viewportMode !== 'desktop' && (obj.responsive?.[viewportMode]?.text_align || obj[`text_align_${viewportMode}`]))
    || obj.text_align || obj.settings?.text_align || obj.content?.align || obj.content?.text_align || obj.style?.textAlign || 'left'

  return (
    <ViewportContext.Provider value={{ viewportMode, onViewportChange }}>
      <div className="elementor-dark-inspector">
        {/* ── 1. TITLEBAR (Elementor exact) ── */}
        <div className="inspector-titlebar-elementor">
          {onBack && (
            <button onClick={onBack} className="inspector-titlebar-back" title="Voltar">
              <ChevronLeft size={18} />
            </button>
          )}
          <span className="inspector-titlebar-heading">Editar {itemTitle}</span>
          <button onClick={onDelete} className="inspector-titlebar-delete" title="Excluir">
            <Trash2 size={15} />
          </button>
        </div>

        {/* ── 2. TABS BAR (Layout/Conteúdo, Estilo, Avançado) ── */}
        <div className="inspector-tabs-elementor">
          <button
            className={`inspector-tab-btn-elementor ${tab === 'content' ? 'active' : ''}`}
            onClick={() => onTabChange('content')}
          >
            {isLayoutType ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            )}
            {isLayoutType ? 'Layout' : 'Conteúdo'}
          </button>
          <button
            className={`inspector-tab-btn-elementor ${tab === 'style' ? 'active' : ''}`}
            onClick={() => onTabChange('style')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20Z" fill="currentColor" /></svg>
            Estilo
          </button>
          <button
            className={`inspector-tab-btn-elementor ${tab === 'advanced' ? 'active' : ''}`}
            onClick={() => onTabChange('advanced')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Avançado
          </button>
        </div>

        {/* ── 3. INSPECTOR BODY ── */}
        <div className="inspector-body-elementor">
          {/* ============================================================
              TAB 1: CONTENT / LAYOUT
             ============================================================ */}
          {tab === 'content' && (
            <>
              {/* Section / Container Layout */}
              {isLayoutType && (
                <AccordionSection
                  title="Contêiner"
                  isOpen={openAccordions.layout}
                  onToggle={() => toggleAccordion('layout')}
                >
                  <ControlRow label="Largura do conteúdo">
                    <select
                      className="elementor-select"
                      value={obj.content_width || (obj.layout === 'full' ? 'full' : 'boxed')}
                      onChange={e => {
                        const val = e.target.value
                        update('content_width', val)
                        update('layout', val)
                        if (val === 'full') {
                          updateResponsive('width', '100%')
                          updateResponsive('max_width', '100%')
                        }
                      }}
                    >
                      <option value="boxed">Boxed</option>
                      <option value="full">Largura total (Full Width)</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Largura" responsive>
                    <input
                      className="elementor-input"
                      value={getVal('content_width_value', getVal('width', getVal('max_width', '')))}
                      onChange={e => {
                        const val = e.target.value
                        const formatted = val === '' ? '' : (val.includes('%') || val.includes('px') || val.includes('vw') || val.includes('em') ? val : (parseFloat(val) <= 100 ? `${val}%` : `${val}px`))
                        updateResponsive('content_width_value', val)
                        updateResponsive('width', formatted)
                        updateResponsive('max_width', formatted)
                        update('content_width_value', val)
                        update('width', formatted)
                        update('max_width', formatted)
                      }}
                      placeholder={viewportMode === 'mobile' ? '100%' : '1200'}
                    />
                  </ControlRow>

                  {/* Altura mínima — Formato de Linha com Slider, Stepper e Unidades (px, vh, auto) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Altura mínima</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {(['px', 'vh', 'auto'] as const).map(u => {
                          const currentVal = String(getVal('min_height', 'auto'))
                          const isAutoVal = currentVal === 'auto' || currentVal === ''
                          const isActive = u === 'auto' ? isAutoVal : (currentVal.includes(u) || (minHeightUnit === u && !isAutoVal))
                          return (
                            <button
                              key={u}
                              type="button"
                              className={`elementor-segmented-btn ${isActive ? 'active' : ''}`}
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                              onClick={() => {
                                setMinHeightUnit(u)
                                if (u === 'auto') {
                                  updateResponsive('min_height', 'auto')
                                  update('min_height', 'auto')
                                } else {
                                  const currentNum = parseInt(currentVal.replace(/[^0-9]/g, ''), 10) || (u === 'vh' ? 50 : 500)
                                  const val = `${currentNum}${u}`
                                  updateResponsive('min_height', val)
                                  update('min_height', val)
                                }
                              }}
                            >
                              {u}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {(() => {
                      const currentVal = String(getVal('min_height', 'auto'))
                      const isAutoVal = currentVal === 'auto' || currentVal === ''
                      const activeUnit = currentVal.includes('vh') ? 'vh' : (minHeightUnit === 'vh' ? 'vh' : 'px')
                      const numVal = parseInt(currentVal.replace(/[^0-9]/g, ''), 10) || (isAutoVal ? 0 : 500)
                      return (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="0"
                            max={activeUnit === 'vh' ? 100 : 1400}
                            step={activeUnit === 'vh' ? 1 : 10}
                            value={numVal}
                            onChange={e => {
                              setMinHeightUnit(activeUnit)
                              const val = `${e.target.value}${activeUnit}`
                              updateResponsive('min_height', val)
                              update('min_height', val)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <div style={{ width: '90px' }}>
                            <StepperNumberInput
                              value={getVal('min_height', isAutoVal ? 'auto' : `${numVal}${activeUnit}`)}
                              onChange={v => {
                                updateResponsive('min_height', v)
                                update('min_height', v)
                              }}
                              placeholder={isAutoVal ? 'auto' : `500${activeUnit}`}
                            />
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Direção: 4 vetores SVG [ → ] [ ↓ ] [ ← ] [ ↑ ] */}
                  <ControlRow label="Direção" responsive>
                    <IconGroupSelector
                      value={getVal('direction', 'column')}
                      onChange={v => updateResponsive('direction', v)}
                      options={[
                        { value: 'row', icon: <ArrowRight size={13} />, title: 'Linha (Horizontal)' },
                        { value: 'column', icon: <ArrowDown size={13} />, title: 'Coluna (Vertical)' },
                        { value: 'row-reverse', icon: <ArrowLeft size={13} />, title: 'Linha Invertida' },
                        { value: 'column-reverse', icon: <ArrowUp size={13} />, title: 'Coluna Invertida' },
                      ]}
                    />
                  </ControlRow>

                  {/* Justificar conteúdo: 6 vetores SVG */}
                  <ControlRow label="Justificar conteúdo" responsive>
                    <IconGroupSelector
                      value={getVal('justify_content', 'flex-start')}
                      onChange={v => updateResponsive('justify_content', v)}
                      options={[
                        {
                          value: 'flex-start',
                          title: 'Início',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 8h10M4 12h14" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'center',
                          title: 'Centro',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M7 8h10M5 12h14" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'flex-end',
                          title: 'Fim',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M10 8h10M6 12h14" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'space-between',
                          title: 'Espaço entre',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M4 10h6M14 10h6" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'space-around',
                          title: 'Espaço ao redor',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M6 11h4M14 11h4" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'space-evenly',
                          title: 'Espaço uniforme',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M8 12h8" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                      ]}
                    />
                  </ControlRow>

                  {/* Alinhar itens: 4 vetores SVG */}
                  <ControlRow label="Alinhar itens" responsive>
                    <IconGroupSelector
                      value={getVal('align_items', 'stretch')}
                      onChange={v => updateResponsive('align_items', v)}
                      options={[
                        {
                          value: 'flex-start',
                          title: 'Início',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 8v10M8 8v6M12 8v8" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'center',
                          title: 'Centro',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 12h16M6 7v10M10 9v6M14 8v8" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'flex-end',
                          title: 'Fim',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 20h16M4 6v10M8 10v6M12 8v8" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'stretch',
                          title: 'Esticar',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M8 4v16M16 4v16" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                      ]}
                    />
                  </ControlRow>

                  <div className="elementor-divider-row" />

                  {/* Espaçamentos: 2 caixas Coluna e Linha vinculadas */}
                  {(() => {
                    const rawG = getVal('gap', '16')
                    const cleanGapCol = String(getVal('gap_column', '') || (String(rawG).includes(' ') ? String(rawG).split(' ')[1] : rawG)).replace(/[^0-9.-]/g, '') || '16'
                    const cleanGapRow = String(getVal('gap_row', '') || (String(rawG).includes(' ') ? String(rawG).split(' ')[0] : rawG)).replace(/[^0-9.-]/g, '') || '16'
                    return (
                      <GapsTwoControl
                        label="Espaçamentos"
                        responsive
                        colValue={cleanGapCol}
                        rowValue={cleanGapRow}
                        onChange={(col, row) => {
                          const c = String(col).replace(/[^0-9.-]/g, '') || '0'
                          const r = String(row).replace(/[^0-9.-]/g, '') || '0'
                          updateResponsive('gap_column', `${c}px`)
                          updateResponsive('gap_row', `${r}px`)
                          updateResponsive('gap', `${r}px ${c}px`)
                        }}
                      />
                    )
                  })()}

                  <ControlRow label="Quebra de linha (Wrap)">
                    <select
                      className="elementor-select"
                      value={obj.wrap || 'nowrap'}
                      onChange={e => update('wrap', e.target.value)}
                    >
                      <option value="nowrap">Não quebrar</option>
                      <option value="wrap">Quebrar (Wrap)</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Tag HTML">
                    <select
                      className="elementor-select"
                      value={obj.html_tag || 'div'}
                      onChange={e => update('html_tag', e.target.value)}
                    >
                      <option value="div">div (Padrão)</option>
                      <option value="header">header</option>
                      <option value="footer">footer</option>
                      <option value="main">main</option>
                      <option value="article">article</option>
                      <option value="section">section</option>
                      <option value="aside">aside</option>
                      <option value="nav">nav</option>
                      <option value="a">a (Link Clicável)</option>
                      <option value="p">p</option>
                      <option value="span">span</option>
                    </select>
                  </ControlRow>

                  {obj.html_tag === 'a' && (
                    <div style={{ background: '#f8f9fa', padding: '8px 10px', borderRadius: 6, margin: '6px 0', border: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <ControlRow label="Link (URL)">
                        <input
                          className="elementor-input"
                          value={obj.link_url || ''}
                          onChange={e => update('link_url', e.target.value)}
                          placeholder="https://seusite.com ou #ancora"
                        />
                      </ControlRow>
                      <ControlRow label="Abrir em nova aba">
                        <ToggleSwitch
                          checked={!!obj.link_new_tab}
                          onChange={v => update('link_new_tab', v)}
                        />
                      </ControlRow>
                    </div>
                  )}
                </AccordionSection>
              )}

              {/* Image Widget (Primeiro na lista e aberto por padrão) */}
              {item.type === 'widget' && isImage && (
                <AccordionSection
                  title="Imagem"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Escolher Imagem</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#ea9cfb', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        title="Variações com IA"
                        onClick={() => {
                          const randomAssets = [
                            'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=1200&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1200&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80'
                          ]
                          const next = randomAssets[Math.floor(Math.random() * randomAssets.length)]
                          updateWidgetContent('image', next)
                          updateWidgetContent('url', next)
                        }}
                      >
                        <Sparkles size={14} />
                      </button>
                    </div>
                    <ImageThumbnailBox
                      src={obj.content?.image || obj.content?.url || obj.url || obj.image || ''}
                      onChange={url => {
                        updateWidgetContent('image', url)
                        updateWidgetContent('url', url)
                        update('image', url)
                        update('url', url)
                        updateWidgetStyle('image', url)
                        updateWidgetStyle('url', url)
                      }}
                    />
                  </div>

                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={currentAlign === 'right' ? 'right' : currentAlign === 'center' ? 'center' : 'left'}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                      ]}
                    />
                  </ControlRow>

                  <ControlRow label="Texto Alternativo (Alt)">
                    <input
                      className="elementor-input"
                      value={obj.content?.alt || ''}
                      onChange={e => updateWidgetContent('alt', e.target.value)}
                      placeholder="Descrição da imagem"
                    />
                  </ControlRow>

                  {/* imageBox (Caixa de Imagem) - Título e Descrição */}
                  {obj.type === 'imageBox' && (
                    <>
                      <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                        <span className="elementor-control-label">Título</span>
                        <input
                          className="elementor-input"
                          value={obj.content?.title ?? obj.content?.heading ?? ''}
                          onChange={e => {
                            updateWidgetContent('title', e.target.value)
                            updateWidgetContent('heading', e.target.value)
                          }}
                          placeholder="Título da Caixa"
                        />
                      </div>

                      <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                        <span className="elementor-control-label">Descrição / Legenda</span>
                        <textarea
                          className="elementor-textarea"
                          rows={3}
                          value={obj.content?.description ?? obj.content?.text ?? ''}
                          onChange={e => {
                            updateWidgetContent('description', e.target.value)
                            updateWidgetContent('text', e.target.value)
                          }}
                          placeholder="Legenda ou descrição da imagem..."
                        />
                      </div>

                      <ControlRow label="Tag do Título">
                        <select
                          className="elementor-select"
                          value={obj.content?.title_tag || 'h3'}
                          onChange={e => updateWidgetContent('title_tag', e.target.value)}
                        >
                          <option value="h1">H1</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                          <option value="h4">H4</option>
                          <option value="h5">H5</option>
                          <option value="h6">H6</option>
                          <option value="div">div</option>
                          <option value="span">span</option>
                          <option value="p">p</option>
                        </select>
                      </ControlRow>
                    </>
                  )}
                </AccordionSection>
              )}

              {/* Text / Heading Widgets (Título / Editor de Texto) */}
              {item.type === 'widget' && isTextOrHeading && (
                <AccordionSection
                  title={itemTitle}
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <textarea
                      className="elementor-textarea"
                      value={obj.content?.text || (typeof obj.content === 'string' ? obj.content : '') || ''}
                      onChange={e => updateWidgetContent('text', e.target.value)}
                      placeholder="Digite seu texto ou título..."
                      rows={3}
                    />
                  </div>

                  <ControlRow label="Link">
                    <input
                      className="elementor-input"
                      value={obj.content?.link || ''}
                      onChange={e => updateWidgetContent('link', e.target.value)}
                      placeholder="https://seusite.com"
                    />
                  </ControlRow>

                  <ControlRow label="Tag HTML">
                    <select
                      className="elementor-select"
                      value={obj.content?.tag || (obj.type === 'text' ? 'p' : 'h2')}
                      onChange={e => updateWidgetContent('tag', e.target.value)}
                    >
                      <option value="h1">H1</option>
                      <option value="h2">H2</option>
                      <option value="h3">H3</option>
                      <option value="h4">H4</option>
                      <option value="h5">H5</option>
                      <option value="h6">H6</option>
                      <option value="div">div</option>
                      <option value="span">span</option>
                      <option value="p">p</option>
                    </select>
                  </ControlRow>

                  {/* Alinhamento de Texto */}
                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={currentAlign}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                        { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificado' },
                      ]}
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Button Widget */}
              {item.type === 'widget' && isButton && (
                <AccordionSection
                  title="Botão"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.label || obj.content?.text || ''}
                      onChange={e => {
                        updateWidgetContent('label', e.target.value)
                        updateWidgetContent('text', e.target.value)
                      }}
                      placeholder="Comprar agora"
                    />
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Link / URL</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.link || obj.content?.url || ''}
                      onChange={e => {
                        updateWidgetContent('link', e.target.value)
                        updateWidgetContent('url', e.target.value)
                      }}
                      placeholder="https://... ou /produtos"
                    />
                  </div>

                  {/* Opções de Link: Nova Aba e Nofollow */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0', background: '#f5f5f7', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e5ea' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', cursor: 'pointer' }}>
                      <span>Abrir em Nova Aba</span>
                      <input
                        type="checkbox"
                        checked={!!obj.content?.open_in_new_tab}
                        onChange={e => updateWidgetContent('open_in_new_tab', e.target.checked)}
                        style={{ accentColor: '#0071e3' }}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', cursor: 'pointer' }}>
                      <span>Adicionar nofollow</span>
                      <input
                        type="checkbox"
                        checked={!!obj.content?.nofollow}
                        onChange={e => updateWidgetContent('nofollow', e.target.checked)}
                        style={{ accentColor: '#0071e3' }}
                      />
                    </label>
                  </div>

                  {/* Ícone do Botão */}
                  <ControlRow label="Ícone">
                    <select
                      className="elementor-select"
                      value={obj.content?.icon || 'none'}
                      onChange={e => updateWidgetContent('icon', e.target.value)}
                    >
                      <option value="none">Nenhum</option>
                      <option value="shopping-bag">Sacola / Carrinho</option>
                      <option value="arrow-right">Seta para Direita</option>
                      <option value="chevron-right">Chevron Direita</option>
                      <option value="sparkles">Brilho (IA / Destaque)</option>
                      <option value="zap">Raio (Ação Rápida)</option>
                      <option value="star">Estrela</option>
                      <option value="heart">Coração (Favorito)</option>
                      <option value="check">Check (Confirmar)</option>
                      <option value="download">Download</option>
                      <option value="play">Play (Vídeo)</option>
                      <option value="external-link">Link Externo</option>
                      <option value="phone">Telefone / WhatsApp</option>
                      <option value="mail">E-mail</option>
                    </select>
                  </ControlRow>

                  {obj.content?.icon && obj.content.icon !== 'none' && (
                    <>
                      <ControlRow label="Posição do Ícone">
                        <select
                          className="elementor-select"
                          value={obj.content?.icon_position || 'before'}
                          onChange={e => updateWidgetContent('icon_position', e.target.value)}
                        >
                          <option value="before">Antes do Texto (Esquerda)</option>
                          <option value="after">Depois do Texto (Direita)</option>
                        </select>
                      </ControlRow>

                      <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                        <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                          <span>Espaçamento do Ícone</span>
                          <span style={{ fontSize: 10, color: '#86868b' }}>{obj.content?.icon_spacing ?? 8}px</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="32"
                          value={obj.content?.icon_spacing ?? 8}
                          onChange={e => updateWidgetContent('icon_spacing', parseInt(e.target.value) || 8)}
                          style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer' }}
                        />
                      </div>

                      <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                        <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                          <span>Tamanho do Ícone</span>
                          <span style={{ fontSize: 10, color: '#86868b' }}>{obj.content?.icon_size ?? 16}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="36"
                          value={obj.content?.icon_size ?? 16}
                          onChange={e => updateWidgetContent('icon_size', parseInt(e.target.value) || 16)}
                          style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer' }}
                        />
                      </div>
                    </>
                  )}

                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={currentAlign}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                        { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificado' },
                      ]}
                    />
                  </ControlRow>

                  <ControlRow label="Tamanho">
                    <select
                      className="elementor-select"
                      value={obj.content?.button_size || 'md'}
                      onChange={e => updateWidgetContent('button_size', e.target.value)}
                    >
                      <option value="xs">Extra Pequeno</option>
                      <option value="sm">Pequeno</option>
                      <option value="md">Médio</option>
                      <option value="lg">Grande</option>
                      <option value="xl">Extra Grande</option>
                    </select>
                  </ControlRow>

                  <div className="elementor-control-row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                    <span className="elementor-control-label">Largura Total (100%)</span>
                    <label className="header-toggle-switch">
                      <input
                        type="checkbox"
                        checked={obj.content?.full_width || obj.width === '100%'}
                        onChange={e => {
                          updateWidgetContent('full_width', e.target.checked)
                          if (e.target.checked) {
                            update('width', '100%')
                            updateWidgetStyle('width', '100%')
                          } else {
                            update('width', '')
                            updateWidgetStyle('width', '')
                          }
                        }}
                      />
                      <span className="toggle-track" />
                    </label>
                  </div>
                </AccordionSection>
              )}

              {/* Video Widget */}
              {item.type === 'widget' && isVideo && (
                <AccordionSection
                  title="Vídeo"
                  isOpen={openAccordions.widgetContent}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Origem">
                    <select
                      className="elementor-select"
                      value={obj.content?.provider || 'youtube'}
                      onChange={e => updateWidgetContent('provider', e.target.value)}
                    >
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                      <option value="self">Auto-hospedado (MP4)</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Link do Vídeo" style={{ marginTop: 8 }}>
                    <input
                      className="elementor-input"
                      value={obj.content?.url || ''}
                      onChange={e => updateWidgetContent('url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </ControlRow>

                  <ControlRow label="Título do Vídeo" style={{ marginTop: 8 }}>
                    <input
                      className="elementor-input"
                      value={obj.content?.title || ''}
                      onChange={e => updateWidgetContent('title', e.target.value)}
                      placeholder="Meu Vídeo"
                    />
                  </ControlRow>

                  <ControlRow label="Autoplay" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.autoplay || false} onChange={v => updateWidgetContent('autoplay', v)} />
                  </ControlRow>

                  <ControlRow label="Loop" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.loop || false} onChange={v => updateWidgetContent('loop', v)} />
                  </ControlRow>

                  <ControlRow label="Mudo" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.muted || false} onChange={v => updateWidgetContent('muted', v)} />
                  </ControlRow>

                  <ControlRow label="Mostrar Controles" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.controls !== false} onChange={v => updateWidgetContent('controls', v)} />
                  </ControlRow>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                     <span className="elementor-control-label">Imagem de Capa (Poster)</span>
                     <input
                       className="elementor-input"
                       value={obj.content?.poster || ''}
                       onChange={e => updateWidgetContent('poster', e.target.value)}
                       placeholder="URL da imagem de capa"
                     />
                   </div>

                  {/* Tempo de Início */}
                  <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                    <span className="elementor-control-label">Iniciar em (segundos)</span>
                    <input
                      className="elementor-input"
                      type="number"
                      min="0"
                      step="1"
                      value={obj.content?.start_time || ''}
                      onChange={e => updateWidgetContent('start_time', Number(e.target.value) || 0)}
                      placeholder="0"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d2d2d7', fontSize: '0.9rem', outline: 'none' }}
                    />
                    <span style={{ fontSize: '11px', color: '#86868b', marginTop: 4 }}>Deixe 0 para iniciar automaticamente</span>
                  </div>

                  {/* Overlay de Texto */}
                  <AccordionSection
                    title="Texto sobre o Vídeo"
                    isOpen={openAccordions.widgetContent !== false}
                    onToggle={() => toggleAccordion('widgetContent')}
                  >
                    <ControlRow label="Ativar Texto">
                      <ToggleSwitch checked={obj.content?.overlay_text ? true : false} onChange={v => updateWidgetContent('overlay_text', v ? (obj.content?.overlay_text || 'Título do Vídeo') : '')} />
                    </ControlRow>
                    {obj.content?.overlay_text && (
                      <>
                        <ControlRow label="Texto" style={{ marginTop: 8 }}>
                          <input className="elementor-input" value={obj.content?.overlay_text || ''} onChange={e => updateWidgetContent('overlay_text', e.target.value)} placeholder="Texto sobre o vídeo" />
                        </ControlRow>
                        <ControlRow label="Posição" style={{ marginTop: 8 }}>
                          <select className="elementor-select" value={obj.content?.overlay_text_pos || 'center'} onChange={e => updateWidgetContent('overlay_text_pos', e.target.value)}>
                            <option value="top">Superior</option>
                            <option value="center">Centro</option>
                            <option value="bottom">Inferior</option>
                          </select>
                        </ControlRow>
                        <ControlRow label="Cor" style={{ marginTop: 8 }}>
                          <input type="color" value={obj.content?.overlay_text_color || '#ffffff'} onChange={e => updateWidgetContent('overlay_text_color', e.target.value)} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                        </ControlRow>
                        <ControlRow label="Tamanho" style={{ marginTop: 8 }}>
                          <input className="elementor-input" type="number" min="12" max="72" value={obj.content?.overlay_text_size || 36} onChange={e => updateWidgetContent('overlay_text_size', Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d2d2d7', fontSize: '0.9rem', outline: 'none' }} />
                        </ControlRow>
                        <ControlRow label="Fundo do Texto" style={{ marginTop: 8 }}>
                          <input type="color" value={obj.content?.overlay_text_bg || 'rgba(0,0,0,0.5)'} onChange={e => updateWidgetContent('overlay_text_bg', e.target.value)} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                        </ControlRow>
                      </>
                    )}
                  </AccordionSection>

                  {/* Overlay de Botão */}
                  <AccordionSection
                    title="Botão sobre o Vídeo"
                    isOpen={openAccordions.widgetContent !== false}
                    onToggle={() => toggleAccordion('widgetContent')}
                  >
                    <ControlRow label="Ativar Botão">
                      <ToggleSwitch checked={obj.content?.overlay_btn_label ? true : false} onChange={v => updateWidgetContent('overlay_btn_label', v ? (obj.content?.overlay_btn_label || 'Saiba Mais') : '')} />
                    </ControlRow>
                    {obj.content?.overlay_btn_label && (
                      <>
                        <ControlRow label="Texto do Botão" style={{ marginTop: 8 }}>
                          <input className="elementor-input" value={obj.content?.overlay_btn_label || ''} onChange={e => updateWidgetContent('overlay_btn_label', e.target.value)} placeholder="Botão" />
                        </ControlRow>
                        <ControlRow label="Link" style={{ marginTop: 8 }}>
                          <input className="elementor-input" value={obj.content?.overlay_btn_url || ''} onChange={e => updateWidgetContent('overlay_btn_url', e.target.value)} placeholder="https://..." />
                        </ControlRow>
                        <ControlRow label="Cor do Texto" style={{ marginTop: 8 }}>
                          <input type="color" value={obj.content?.overlay_btn_color || '#ffffff'} onChange={e => updateWidgetContent('overlay_btn_color', e.target.value)} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                        </ControlRow>
                        <ControlRow label="Cor de Fundo" style={{ marginTop: 8 }}>
                          <input type="color" value={obj.content?.overlay_btn_bg || '#0071e3'} onChange={e => updateWidgetContent('overlay_btn_bg', e.target.value)} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                        </ControlRow>
                      </>
                    )}
                  </AccordionSection>

                  {/* Altura Responsiva */}
                  <AccordionSection
                    title="Altura Responsiva"
                    isOpen={openAccordions.widgetContent !== false}
                    onToggle={() => toggleAccordion('widgetContent')}
                  >
                    <ControlRow label="Altura Desktop">
                      <select className="elementor-select" value={obj.content?.video_height || '16/9'} onChange={e => updateWidgetContent('video_height', e.target.value)}>
                        <option value="16/9">16:9 (Padrão)</option>
                        <option value="9/16">9:16 (Vertical)</option>
                        <option value="4/3">4:3</option>
                        <option value="21/9">21:9 (Cinema)</option>
                        <option value="auto">Auto</option>
                      </select>
                    </ControlRow>
                    <ControlRow label="Altura Mínima" style={{ marginTop: 8 }}>
                      <select className="elementor-select" value={obj.content?.video_min_height || '200px'} onChange={e => updateWidgetContent('video_min_height', e.target.value)}>
                        <option value="150px">150px</option>
                        <option value="200px">200px</option>
                        <option value="300px">300px</option>
                        <option value="400px">400px</option>
                        <option value="500px">500px</option>
                        <option value="600px">600px</option>
                      </select>
                    </ControlRow>
                    <ControlRow label="Mobile Responsivo" style={{ marginTop: 8 }}>
                      <ToggleSwitch checked={obj.content?.video_mobile !== false} onChange={v => updateWidgetContent('video_mobile', v)} />
                    </ControlRow>
                    {obj.content?.video_mobile !== false && (
                      <ControlRow label="Altura Mobile" style={{ marginTop: 8 }}>
                        <select className="elementor-select" value={obj.content?.video_mobile_height || '16/9'} onChange={e => updateWidgetContent('video_mobile_height', e.target.value)}>
                          <option value="16/9">16:9</option>
                          <option value="9/16">9:16 (Vertical)</option>
                          <option value="4/3">4:3</option>
                          <option value="auto">Auto</option>
                        </select>
                      </ControlRow>
                    )}
                  </AccordionSection>

                 </AccordionSection>
              )}

              {/* Icon Box Widget (Caixa de Ícone) */}
              {item.type === 'widget' && isIconBox && (
                <AccordionSection
                  title="Caixa de Ícone"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Ícone">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                      <div
                        onClick={() => {
                          setIconPickerTarget('iconBox')
                          setShowIconLibraryModal(true)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: 8,
                          border: '1px solid #d2d2d7',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title="Clique para abrir a Biblioteca de Ícones"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d1d1f' }}>
                            {renderDynamicIcon(obj.content?.icon || obj.content?.selected_icon || 'check-square', 16, '#1d1d1f', 1.6)}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>
                            {ICON_LIBRARY.find(i => i.id === (obj.content?.icon || obj.content?.selected_icon || 'check-square'))?.name || 'Ícone Selecionado'}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0071e3', backgroundColor: '#f0f7ff', padding: '3px 7px', borderRadius: 5 }}>
                          Biblioteca
                        </span>
                      </div>

                      <select
                        className="elementor-select"
                        value={obj.content?.icon || obj.content?.selected_icon || 'check-square'}
                        onChange={e => updateWidgetContents({ icon: e.target.value, selected_icon: e.target.value })}
                      >
                        {ICON_LIBRARY.map(ic => (
                          <option key={ic.id} value={ic.id}>{ic.name}</option>
                        ))}
                      </select>
                    </div>
                  </ControlRow>

                  <ControlRow label="Posição do Ícone">
                    <select
                      className="elementor-select"
                      value={obj.content?.icon_position || 'top'}
                      onChange={e => updateWidgetContent('icon_position', e.target.value)}
                    >
                      <option value="top">Topo</option>
                      <option value="left">Esquerda</option>
                      <option value="right">Direita</option>
                    </select>
                  </ControlRow>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.title ?? obj.content?.heading ?? ''}
                      onChange={e => {
                        updateWidgetContent('title', e.target.value)
                        updateWidgetContent('heading', e.target.value)
                      }}
                      placeholder="Título do Destaque"
                    />
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Descrição</span>
                    <textarea
                      className="elementor-textarea"
                      rows={3}
                      value={obj.content?.description ?? obj.content?.text ?? ''}
                      onChange={e => {
                        updateWidgetContent('description', e.target.value)
                        updateWidgetContent('text', e.target.value)
                      }}
                      placeholder="Descrição detalhada do recurso em destaque..."
                    />
                  </div>

                  <ControlRow label="Tag do Título" style={{ marginTop: 8 }}>
                    <select
                      className="elementor-select"
                      value={obj.content?.title_tag || 'h4'}
                      onChange={e => updateWidgetContent('title_tag', e.target.value)}
                    >
                      <option value="h1">H1</option>
                      <option value="h2">H2</option>
                      <option value="h3">H3</option>
                      <option value="h4">H4</option>
                      <option value="h5">H5</option>
                      <option value="div">div</option>
                      <option value="p">p</option>
                    </select>
                  </ControlRow>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Link (URL)</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.link || obj.content?.url || ''}
                      onChange={e => updateWidgetContent('link', e.target.value)}
                      placeholder="https://... ou /pagina"
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Icon Widget (Ícone Solitário) */}
              {item.type === 'widget' && isIcon && (
                <AccordionSection
                  title="Ícone"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={getVal('text_align', obj.content?.align || obj.content?.text_align || 'center')}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetStyle('textAlign', v)
                        update('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Alinhar à Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centralizar' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Alinhar à Direita' },
                      ]}
                    />
                  </ControlRow>

                  <ControlRow label="Ícone">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                      <div
                        onClick={() => {
                          setIconPickerTarget('icon')
                          setShowIconLibraryModal(true)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: 8,
                          border: '1px solid #d2d2d7',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title="Clique para abrir a Biblioteca de Ícones"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d1d1f' }}>
                            {renderDynamicIcon(obj.content?.icon || obj.content?.selected_icon || 'star', 16, '#1d1d1f', 1.6)}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>
                            {ICON_LIBRARY.find(i => i.id === (obj.content?.icon || obj.content?.selected_icon || 'star'))?.name || 'Estrela'}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0071e3', backgroundColor: '#f0f7ff', padding: '3px 7px', borderRadius: 5 }}>
                          Biblioteca
                        </span>
                      </div>

                      <select
                        className="elementor-select"
                        value={obj.content?.icon || obj.content?.selected_icon || 'star'}
                        onChange={e => updateWidgetContents({ icon: e.target.value, selected_icon: e.target.value })}
                      >
                        {ICON_LIBRARY.map(ic => (
                          <option key={ic.id} value={ic.id}>{ic.name}</option>
                        ))}
                      </select>
                    </div>
                  </ControlRow>

                  <ControlRow label="Tamanho do Ícone (px)" responsive>
                    <SliderRangeControl
                      label="Tamanho"
                      min={12}
                      max={120}
                      step={2}
                      unit="px"
                      value={parseInt(String(getVal('icon_size', obj.content?.icon_size || obj.settings?.icon_size || 36)))}
                      onChange={v => {
                        updateResponsive('icon_size', v)
                        updateWidgetContent('icon_size', v)
                        updateWidgetStyle('icon_size', v)
                        update('icon_size', v)
                      }}
                    />
                  </ControlRow>

                  <ControlRow label="Cor do Ícone">
                    <ColorControl
                      value={obj.content?.icon_color || obj.settings?.icon_color || obj.style?.color || '#0071e3'}
                      onChange={v => {
                        updateWidgetContent('icon_color', v)
                        updateWidgetStyle('color', v)
                        updateWidgetStyle('icon_color', v)
                        update('icon_color', v)
                      }}
                    />
                  </ControlRow>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Link</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.link || ''}
                      onChange={e => updateWidgetContent('link', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Star Rating Widget */}
              {item.type === 'widget' && isStarRating && (
                <AccordionSection
                  title="Avaliação por Estrelas"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={getVal('text_align', obj.content?.align || obj.content?.text_align || 'left')}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetStyle('textAlign', v)
                        update('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Alinhar à Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centralizar' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Alinhar à Direita' },
                        { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificado' },
                      ]}
                    />
                  </ControlRow>

                  <ControlRow label="Classificação (0 a 5)">
                    <input
                      type="number"
                      className="elementor-input"
                      min="0"
                      max="5"
                      step="0.1"
                      value={obj.content?.rating ?? 5}
                      onChange={e => updateWidgetContent('rating', parseFloat(e.target.value) || 5)}
                    />
                  </ControlRow>

                  <ControlRow label="Total de Avaliações">
                    <input
                      type="number"
                      className="elementor-input"
                      value={obj.content?.review_count ?? 128}
                      onChange={e => updateWidgetContent('review_count', parseInt(e.target.value) || 0)}
                    />
                  </ControlRow>

                  <ControlRow label="Tamanho da estrela" responsive>
                    <SliderRangeControl
                      label="Tamanho"
                      min={10}
                      max={48}
                      step={1}
                      unit="px"
                      value={parseInt(String(obj.content?.star_size || obj.settings?.star_size || 16))}
                      onChange={v => {
                        updateWidgetContent('star_size', v)
                        updateWidgetStyle('star_size', v)
                        update('star_size', v)
                      }}
                    />
                  </ControlRow>

                  <ControlRow label="Cor da estrela">
                    <ColorControl
                      value={obj.content?.star_color || obj.settings?.star_color || '#f59e0b'}
                      onChange={v => {
                        updateWidgetContent('star_color', v)
                        updateWidgetStyle('star_color', v)
                        update('star_color', v)
                      }}
                    />
                  </ControlRow>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto Personalizado</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.text || ''}
                      onChange={e => updateWidgetContent('text', e.target.value)}
                      placeholder="5.0 (128 avaliações)"
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Counter Widget */}
              {item.type === 'widget' && isCounter && (
                <AccordionSection
                  title="Contador"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Número Inicial">
                    <input
                      type="number"
                      className="elementor-input"
                      value={obj.content?.starting_number ?? 0}
                      onChange={e => updateWidgetContent('starting_number', parseInt(e.target.value) || 0)}
                    />
                  </ControlRow>

                  <ControlRow label="Número Final">
                    <input
                      type="number"
                      className="elementor-input"
                      value={obj.content?.ending_number ?? 100}
                      onChange={e => updateWidgetContent('ending_number', parseInt(e.target.value) || 100)}
                    />
                  </ControlRow>

                  <ControlRow label="Prefixo">
                    <input
                      className="elementor-input"
                      value={obj.content?.prefix || ''}
                      onChange={e => updateWidgetContent('prefix', e.target.value)}
                      placeholder="+"
                    />
                  </ControlRow>

                  <ControlRow label="Sufixo">
                    <input
                      className="elementor-input"
                      value={obj.content?.suffix || ''}
                      onChange={e => updateWidgetContent('suffix', e.target.value)}
                      placeholder="%"
                    />
                  </ControlRow>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título / Legenda</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.title || 'Clientes Satisfeitos'}
                      onChange={e => updateWidgetContent('title', e.target.value)}
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Countdown: content controls must drive the actual timer, not
                  leave the widget as an alignment-only placeholder. */}
              {item.type === 'widget' && isCountdown && (
                <AccordionSection
                  title="Contador Regressivo"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Data e hora de término">
                    <input
                      type="datetime-local"
                      className="elementor-input"
                      value={obj.content?.target_date || ''}
                      onChange={e => updateWidgetContent('target_date', e.target.value)}
                    />
                  </ControlRow>
                  <ControlRow label="Dias">
                    <ToggleSwitch checked={obj.content?.show_days !== false} onChange={v => updateWidgetContent('show_days', v)} />
                  </ControlRow>
                  <ControlRow label="Horas">
                    <ToggleSwitch checked={obj.content?.show_hours !== false} onChange={v => updateWidgetContent('show_hours', v)} />
                  </ControlRow>
                  <ControlRow label="Minutos">
                    <ToggleSwitch checked={obj.content?.show_minutes !== false} onChange={v => updateWidgetContent('show_minutes', v)} />
                  </ControlRow>
                  <ControlRow label="Segundos">
                    <ToggleSwitch checked={obj.content?.show_seconds !== false} onChange={v => updateWidgetContent('show_seconds', v)} />
                  </ControlRow>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Mensagem ao terminar</span>
                    <input className="elementor-input" value={obj.content?.expired_message || ''} placeholder="Oferta encerrada"
                      onChange={e => updateWidgetContent('expired_message', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* Progress Bar Widget */}
              {item.type === 'widget' && isProgressBar && (
                <AccordionSection
                  title="Barra de Progresso"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.title || 'Desempenho'}
                      onChange={e => updateWidgetContent('title', e.target.value)}
                    />
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Porcentagem</span>
                      <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.percent ?? obj.content?.percentage ?? 80}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={obj.content?.percent ?? obj.content?.percentage ?? 80}
                      onChange={e => { const v = parseInt(e.target.value) || 0; updateWidgetContent('percent', v); updateWidgetContent('percentage', v) }}
                      style={{ width: '100%', accentColor: '#0071e3' }}
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Testimonials Widget */}
              {item.type === 'widget' && isTestimonials && (
                <AccordionSection
                  title="Depoimento"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto do Depoimento</span>
                    <textarea
                      className="elementor-textarea"
                      rows={3}
                      value={obj.content?.text || 'Excelente produto e atendimento impecável!'}
                      onChange={e => updateWidgetContent('text', e.target.value)}
                    />
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Foto do Autor</span>
                    <ImageThumbnailBox
                      src={obj.content?.image || ''}
                      onChange={url => updateWidgetContent('image', url)}
                      title="Foto do Autor"
                    />
                  </div>

                  <ControlRow label="Nome do Autor" style={{ marginTop: 8 }}>
                    <input
                      className="elementor-input"
                      value={obj.content?.name || 'Cliente Verificado'}
                      onChange={e => updateWidgetContent('name', e.target.value)}
                    />
                  </ControlRow>

                  <ControlRow label="Cargo / Empresa">
                    <input
                      className="elementor-input"
                      value={obj.content?.role || 'Comprador Oficial'}
                      onChange={e => updateWidgetContent('role', e.target.value)}
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Tabs Widget */}
              {item.type === 'widget' && isTabs && (
                <AccordionSection
                  title="Abas"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Títulos das Abas (Separados por vírgula)</span>
                    <input
                      className="elementor-input"
                      value={Array.isArray(obj.content?.tabs) ? obj.content.tabs.map((t: any) => t.title || t).join(', ') : (obj.content?.tab_titles || 'Detalhes, Especificações, Avaliações')}
                      onChange={e => {
                        const titles = e.target.value.split(',').map(s => s.trim())
                        const tabs = titles.map((t, i) => ({ title: t, content: `Conteúdo da aba ${t}...` }))
                        updateWidgetContents({ tab_titles: e.target.value, tabs })
                      }}
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Accordion / Toggle Widget */}
              {item.type === 'widget' && isAccordion && (
                <AccordionSection
                  title="Acordeão / FAQ"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Itens (Separados por vírgula)</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.items_titles || 'Qual é o prazo de entrega?, Possui garantia?, Como funciona o suporte?'}
                      onChange={e => {
                        const items = e.target.value.split(',').map(s => s.trim()).map(t => ({ title: t, content: 'Resposta detalhada para este item...' }))
                        updateWidgetContents({ items_titles: e.target.value, items })
                      }}
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Alert Widget */}
              {item.type === 'widget' && isAlert && (
                <AccordionSection
                  title="Alerta"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Tipo de Alerta">
                    <select
                      className="elementor-select"
                      value={obj.content?.alert_type || 'info'}
                      onChange={e => updateWidgetContent('alert_type', e.target.value)}
                    >
                      <option value="info">Informação (Azul)</option>
                      <option value="success">Sucesso (Verde)</option>
                      <option value="warning">Aviso (Amarelo)</option>
                      <option value="danger">Erro / Perigo (Vermelho)</option>
                    </select>
                  </ControlRow>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.title || 'Aviso Importante'}
                      onChange={e => updateWidgetContent('title', e.target.value)}
                    />
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Mensagem</span>
                    <textarea
                      className="elementor-textarea"
                      rows={2}
                      value={obj.content?.description || obj.content?.text || 'Conteúdo do aviso para o visitante.'}
                      onChange={e => updateWidgetContent('description', e.target.value)}
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Divider Widget */}
              {item.type === 'widget' && isDivider && (
                <AccordionSection
                  title="Divisor"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Estilo da Linha">
                    <select
                      className="elementor-select"
                      value={obj.content?.style || obj.settings?.border_style || obj.style?.borderStyle || 'solid'}
                      onChange={e => {
                        updateWidgetContent('style', e.target.value)
                        updateWidgetStyle('borderStyle', e.target.value)
                        update('border_style', e.target.value)
                      }}
                    >
                      <option value="solid">Sólida</option>
                      <option value="dashed">Tracejada</option>
                      <option value="dotted">Pontilhada</option>
                      <option value="double">Dupla</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Largura (%)" responsive>
                    <SliderRangeControl
                      label="Largura"
                      min={5}
                      max={100}
                      step={1}
                      unit="%"
                      value={parseInt(String(getVal('width', obj.content?.width || '100')).replace(/[^0-9]/g, '')) || 100}
                      onChange={v => {
                        updateResponsive('width', `${v}%`)
                        updateWidgetContent('width', `${v}%`)
                        updateWidgetStyle('width', `${v}%`)
                        update('width', `${v}%`)
                      }}
                    />
                  </ControlRow>

                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={getVal('text_align', obj.content?.align || obj.content?.text_align || 'center')}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetStyle('textAlign', v)
                        update('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Alinhar à Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centralizar' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Alinhar à Direita' },
                      ]}
                    />
                  </ControlRow>

                  <ControlRow label="Espessura (px)">
                    <StepperNumberInput
                      value={String(obj.content?.weight || obj.settings?.border_width || '1px')}
                      min={1}
                      max={20}
                      onChange={v => {
                        const formatted = v.includes('px') ? v : `${v}px`
                        updateWidgetContent('weight', parseInt(v) || 1)
                        updateWidgetStyle('borderWidth', formatted)
                        update('border_width', formatted)
                      }}
                    />
                  </ControlRow>

                  <ControlRow label="Cor da Linha">
                    <ColorControl
                      value={obj.content?.color || obj.settings?.border_color || obj.style?.borderColor || '#e8e8ed'}
                      onChange={v => {
                        updateWidgetContent('color', v)
                        updateWidgetStyle('borderColor', v)
                        update('border_color', v)
                      }}
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Spacer Widget */}
              {item.type === 'widget' && isSpacer && (
                <AccordionSection
                  title="Espaçador"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Altura do Espaço</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <span style={{ fontSize: 11, color: '#86868b' }}>{getVal('height', '50px')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="5"
                        max="300"
                        value={parseInt(String(getVal('height', '50')).replace(/[^0-9]/g, ''), 10) || 50}
                        onChange={e => {
                          const val = `${e.target.value}px`
                          updateResponsive('height', val)
                          updateWidgetContent('height', parseInt(e.target.value) || 50)
                          updateWidgetStyle('height', val)
                        }}
                        style={{ flex: 1, accentColor: '#0071e3' }}
                      />
                      <div style={{ width: '80px' }}>
                        <StepperNumberInput
                          value={getVal('height', '50px')}
                          onChange={v => {
                            const clean = String(v).replace(/[^0-9.-]/g, '')
                            const formatted = clean === '' ? '' : `${clean}px`
                            updateResponsive('height', formatted)
                            updateWidgetContent('height', parseInt(clean) || 50)
                            updateWidgetStyle('height', formatted)
                          }}
                          placeholder="50px"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionSection>
              )}

              {/* Google Maps Widget */}
              {item.type === 'widget' && (isGoogleMaps || obj.type === 'googleMapsPro') && (
                <AccordionSection
                  title="Google Maps"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Localização / Endereço</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.address || 'Av. Paulista, 1000, São Paulo - SP'}
                      onChange={e => updateWidgetContent('address', e.target.value)}
                      placeholder="Endereço ou Cidade"
                    />
                  </div>

                  <ControlRow label="Alinhamento" responsive style={{ marginTop: 8 }}>
                    <IconGroupSelector
                      value={getVal('text_align', obj.content?.align || obj.content?.text_align || 'center')}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetStyle('textAlign', v)
                        update('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Alinhar à Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centralizar' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Alinhar à Direita' },
                      ]}
                    />
                  </ControlRow>

                  <ControlRow label="Largura (%)" responsive>
                    <SliderRangeControl
                      label="Largura"
                      min={10}
                      max={100}
                      step={1}
                      unit="%"
                      value={parseInt(String(getVal('width', obj.content?.width || '100')).replace(/[^0-9]/g, '')) || 100}
                      onChange={v => {
                        updateResponsive('width', `${v}%`)
                        updateWidgetContent('width', `${v}%`)
                        updateWidgetStyle('width', `${v}%`)
                        update('width', `${v}%`)
                      }}
                    />
                  </ControlRow>

                  <ControlRow label="Altura do Mapa (px)" responsive>
                    <SliderRangeControl
                      label="Altura"
                      min={150}
                      max={800}
                      step={10}
                      unit="px"
                      value={parseInt(String(getVal('height', obj.content?.height || 350)))}
                      onChange={v => {
                        updateResponsive('height', `${v}px`)
                        updateWidgetContent('height', v)
                        updateWidgetStyle('height', `${v}px`)
                        update('height', `${v}px`)
                      }}
                    />
                  </ControlRow>

                  <ControlRow label="Zoom (1 a 20)">
                    <input
                      type="number"
                      className="elementor-input"
                      min="1"
                      max="20"
                      value={obj.content?.zoom || 14}
                      onChange={e => updateWidgetContent('zoom', parseInt(e.target.value) || 14)}
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* HTML Widget */}
              {item.type === 'widget' && isHtml && (
                <AccordionSection
                  title="Código HTML"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Código HTML / CSS / Embed</span>
                    <textarea
                      className="elementor-textarea"
                      rows={8}
                      style={{ fontFamily: 'monospace', fontSize: '11px' }}
                      value={obj.content?.code || obj.content?.html || ''}
                      onChange={e => updateWidgetContents({ code: e.target.value, html: e.target.value })}
                      placeholder="<div>Seu código HTML aqui...</div>"
                    />
                  </div>
                </AccordionSection>
              )}

              {/* Lottie Widget */}
              {item.type === 'widget' && isLottie && (
                <AccordionSection
                  title="Animação Lottie"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">URL do JSON da Animação</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.url || ''}
                      onChange={e => updateWidgetContent('url', e.target.value)}
                      placeholder="https://assets.../animation.json"
                    />
                  </div>
                  <ControlRow label="Reproduzir Automaticamente" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.autoplay !== false} onChange={v => updateWidgetContent('autoplay', v)} />
                  </ControlRow>
                  <ControlRow label="Loop" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.loop !== false} onChange={v => updateWidgetContent('loop', v)} />
                  </ControlRow>
                  <ControlRow label="Velocidade" style={{ marginTop: 8 }}>
                    <input type="range" min="0.1" max="3" step="0.1" value={obj.content?.speed || 1}
                      onChange={e => updateWidgetContent('speed', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#0071e3' }} />
                  </ControlRow>
                  <ControlRow label="Altura" style={{ marginTop: 8 }}>
                    <input className="elementor-input" value={obj.content?.height || ''} placeholder="200"
                      onChange={e => updateWidgetContent('height', e.target.value)} />
                  </ControlRow>
                  <ControlRow label="Largura" style={{ marginTop: 8 }}>
                    <input className="elementor-input" value={obj.content?.width || ''} placeholder="100%"
                      onChange={e => updateWidgetContent('width', e.target.value)} />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Newsletter / Leads Widget */}
              {item.type === 'widget' && isNewsletter && (
                <AccordionSection
                  title="Newsletter & Leads"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.title || 'Receba Novidades e Ofertas Exclusivas'}
                      onChange={e => updateWidgetContent('title', e.target.value)}
                    />
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.subtitle || 'Cadastre seu e-mail para receber cupons em primeira mão.'}
                      onChange={e => updateWidgetContent('subtitle', e.target.value)}
                    />
                  </div>

                  <ControlRow label="Texto do Botão" style={{ marginTop: 8 }}>
                    <input
                      className="elementor-input"
                      value={obj.content?.button_text || 'Cadastrar'}
                      onChange={e => updateWidgetContent('button_text', e.target.value)}
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Product / Product Grid Widget */}
              {item.type === 'widget' && (isProduct || isProductGrid) && (
                <AccordionSection
                  title="Produtos da Loja"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Categoria">
                    <select
                      className="elementor-select"
                      value={obj.content?.category || 'all'}
                      onChange={e => updateWidgetContent('category', e.target.value)}
                    >
                      <option value="all">Todos os Produtos</option>
                      <option value="ferramentas">Ferramentas Elétricas</option>
                      <option value="baterias">Baterias & Carregadores</option>
                      <option value="acessorios">Acessórios</option>
                      <option value="promocoes">Promoções</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Limite de Produtos">
                    <input
                      type="number"
                      className="elementor-input"
                      min="1"
                      max="24"
                      value={obj.content?.limit || 4}
                      onChange={e => updateWidgetContent('limit', parseInt(e.target.value) || 4)}
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Image Gallery Pro Widget (Galeria de Imagens Pro) */}
              {item.type === 'widget' && isImageGallery && (
                <AccordionSection
                  title="Galeria"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Skin / Layout">
                    <select
                      className="elementor-select"
                      value={obj.content?.layout || obj.content?.skin || 'grid'}
                      onChange={e => {
                        updateWidgetContent('layout', e.target.value)
                        updateWidgetContent('skin', e.target.value)
                      }}
                    >
                      <option value="grid">Grade (Grid)</option>
                      <option value="justified">Justificada (Justified)</option>
                      <option value="masonry">Mosaico (Masonry)</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Número de Colunas" responsive>
                    <select
                      className="elementor-select"
                      value={String(getVal('columns', obj.content?.columns || 3))}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 3
                        updateResponsive('columns', val)
                        updateWidgetContent('columns', val)
                        updateWidgetStyle('columns', val)
                        update('columns', val)
                      }}
                    >
                      <option value="1">1 Coluna</option>
                      <option value="2">2 Colunas</option>
                      <option value="3">3 Colunas</option>
                      <option value="4">4 Colunas</option>
                      <option value="5">5 Colunas</option>
                      <option value="6">6 Colunas</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Espaçamento (Gap)" responsive>
                    <SliderRangeControl
                      label="Espaçamento"
                      min={0}
                      max={40}
                      step={2}
                      unit="px"
                      value={parseInt(String(getVal('gap', obj.content?.gap || obj.style?.gap || 16)))}
                      onChange={v => {
                        updateResponsive('gap', `${v}px`)
                        updateWidgetContent('gap', `${v}px`)
                        updateWidgetStyle('gap', `${v}px`)
                        update('gap', `${v}px`)
                      }}
                    />
                  </ControlRow>

                  <ControlRow label="Proporção da Foto">
                    <select
                      className="elementor-select"
                      value={obj.content?.aspect_ratio || '16/9'}
                      onChange={e => updateWidgetContent('aspect_ratio', e.target.value)}
                    >
                      <option value="16/9">16:9 (Widescreen)</option>
                      <option value="4/3">4:3 (Retângulo)</option>
                      <option value="1/1">1:1 (Quadrada)</option>
                      <option value="3/2">3:2 (Fotográfica)</option>
                      <option value="auto">Original / Automática</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Raio da Borda (px)">
                    <SliderRangeControl
                      label="Raio"
                      min={0}
                      max={32}
                      step={1}
                      unit="px"
                      value={parseInt(String(obj.content?.border_radius || obj.style?.borderRadius || 12))}
                      onChange={v => {
                        updateWidgetContent('border_radius', `${v}px`)
                        updateWidgetStyle('borderRadius', `${v}px`)
                        update('border_radius', `${v}px`)
                      }}
                    />
                  </ControlRow>

                  <ControlRow label="Lightbox (Zoom ao Clicar)">
                    <ToggleSwitch
                      checked={obj.content?.lightbox !== false}
                      onChange={v => updateWidgetContent('lightbox', v)}
                    />
                  </ControlRow>

                  {/* Repeater: Items da Galeria (1:1 com o print do usuário) */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1d1d1f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Itens da Galeria ({((obj.content?.gallery || obj.content?.items || obj.content?.images) as any[])?.length || 0})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                      {((() => {
                        const raw = obj.content?.gallery || obj.content?.items || obj.content?.images
                        return Array.isArray(raw) && raw.length > 0
                          ? raw
                          : [
                              { id: '1', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=80', title: 'Item #1' },
                              { id: '2', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', title: 'Item #2' },
                              { id: '3', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80', title: 'Item #3' },
                              { id: '4', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80', title: 'Item #4' },
                              { id: '5', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', title: 'Item #5' },
                              { id: '6', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop&q=80', title: 'Item #6' },
                            ]
                      })()).map((gItem: any, idx: number, arr: any[]) => (
                        <div
                          key={gItem.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e8e8ed',
                            borderRadius: 10,
                            gap: 8,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                            {gItem.url ? (
                              <img
                                src={gItem.url}
                                alt={gItem.title || `Item #${idx + 1}`}
                                style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid #e8e8ed', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', flexShrink: 0 }}>
                                <ImageIcon size={16} />
                              </div>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {gItem.title || `Item #${idx + 1}`}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {/* Choose / Change Image button */}
                            <button
                              type="button"
                              onClick={() => {
                                setGalleryEditIndex(idx)
                                setGalleryModalOpen(true)
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: '1px solid #d2d2d7',
                                backgroundColor: '#f5f5f7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#1d1d1f',
                              }}
                              title="Escolher Foto da Biblioteca"
                            >
                              <ImageIcon size={14} />
                            </button>

                            {/* Duplicate Item */}
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...arr]
                                newItems.splice(idx + 1, 0, {
                                  ...gItem,
                                  id: String(Date.now()),
                                  title: `${gItem.title || `Item #${idx + 1}`} (Cópia)`
                                })
                                updateWidgetContents({ gallery: newItems, items: newItems, images: newItems })
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: '1px solid #e8e8ed',
                                backgroundColor: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#86868b',
                              }}
                              title="Duplicar Item"
                            >
                              <span style={{ fontSize: 12 }}>❐</span>
                            </button>

                            {/* Delete Item */}
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = arr.filter((_, i) => i !== idx)
                                updateWidgetContents({ gallery: newItems, items: newItems, images: newItems })
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: '1px solid #e8e8ed',
                                backgroundColor: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#ff3b30',
                              }}
                              title="Remover Foto"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Item Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const raw = obj.content?.gallery || obj.content?.items || obj.content?.images
                        const current = Array.isArray(raw) ? raw : [
                          { id: '1', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=80', title: 'Item #1' },
                          { id: '2', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', title: 'Item #2' },
                          { id: '3', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80', title: 'Item #3' },
                          { id: '4', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80', title: 'Item #4' },
                          { id: '5', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', title: 'Item #5' },
                          { id: '6', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop&q=80', title: 'Item #6' },
                        ]
                        const nextIndex = current.length
                        const newItem = {
                          id: String(Date.now()),
                          title: `Item #${nextIndex + 1}`,
                          url: ''
                        }
                        const newItems = [...current, newItem]
                        updateWidgetContents({ gallery: newItems, items: newItems, images: newItems })
                        setGalleryEditIndex(nextIndex)
                        setGalleryModalOpen(true)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px dashed #0071e3',
                        backgroundColor: '#f0f7ff',
                        color: '#0071e3',
                        fontSize: 13,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Plus size={15} strokeWidth={2.5} /> Adicionar Item
                    </button>
                  </div>
                </AccordionSection>
              )}

              {/* Form Pro Widget (Formulário Pro) */}
              {item.type === 'widget' && isForm && (
                <>
                  <AccordionSection
                    title="Campos do Formulário"
                    isOpen={openAccordions.widgetContent !== false}
                    onToggle={() => toggleAccordion('widgetContent')}
                  >
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Nome do Formulário</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.form_name || 'Formulário Pro'}
                        onChange={e => updateWidgetContent('form_name', e.target.value)}
                        placeholder="Nome interno do formulário"
                      />
                    </div>

                    <ControlRow label="Exibir Rótulos (Labels)" style={{ marginTop: 8 }}>
                      <ToggleSwitch
                        checked={obj.content?.show_labels !== false}
                        onChange={v => updateWidgetContent('show_labels', v)}
                      />
                    </ControlRow>

                    {/* Form Fields Repeater */}
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1d1d1f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Campos ({((obj.content?.form_fields || obj.content?.fields) as any[])?.length || 0})
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                        {((() => {
                          const raw = obj.content?.form_fields || obj.content?.fields
                          return Array.isArray(raw) && raw.length > 0
                            ? raw
                            : [
                                { id: '1', field_type: 'text', field_label: 'Nome Completo', placeholder: 'Digite seu nome', column_width: '100%', required: true },
                                { id: '2', field_type: 'email', field_label: 'E-mail', placeholder: 'seu@email.com', column_width: '50%', required: true },
                                { id: '3', field_type: 'tel', field_label: 'Telefone / WhatsApp', placeholder: '(11) 99999-9999', column_width: '50%', required: false },
                                { id: '4', field_type: 'textarea', field_label: 'Mensagem', placeholder: 'Como podemos te ajudar?', column_width: '100%', required: false },
                              ]
                        })()).map((fItem: any, idx: number, arr: any[]) => {
                          const isExpanded = expandedFieldIndex === idx
                          return (
                            <div
                              key={fItem.id || idx}
                              style={{
                                backgroundColor: '#ffffff',
                                border: isExpanded ? '1.5px solid #0071e3' : '1px solid #e8e8ed',
                                borderRadius: 10,
                                overflow: 'hidden',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {/* Field Header */}
                              <div
                                onClick={() => setExpandedFieldIndex(isExpanded ? null : idx)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 12px',
                                  backgroundColor: isExpanded ? '#f0f7ff' : '#ffffff',
                                  cursor: 'pointer',
                                  gap: 8,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0071e3', backgroundColor: '#e1effe', padding: '2px 6px', borderRadius: 4 }}>
                                    {fItem.field_type || 'text'}
                                  </span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {fItem.field_label || `Campo #${idx + 1}`}
                                  </span>
                                  {fItem.required && (
                                    <span style={{ color: '#ff3b30', fontSize: 12, fontWeight: 700 }}>*</span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                                  {/* Duplicate */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newFields = [...arr]
                                      newFields.splice(idx + 1, 0, {
                                        ...fItem,
                                        id: String(Date.now()),
                                        field_label: `${fItem.field_label || `Campo #${idx + 1}`} (Cópia)`
                                      })
                                      updateWidgetContents({ form_fields: newFields, fields: newFields })
                                      setExpandedFieldIndex(idx + 1)
                                    }}
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 6,
                                      border: '1px solid #e8e8ed',
                                      backgroundColor: '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      color: '#86868b',
                                    }}
                                    title="Duplicar Campo"
                                  >
                                    <span style={{ fontSize: 12 }}>❐</span>
                                  </button>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newFields = arr.filter((_, i) => i !== idx)
                                      updateWidgetContents({ form_fields: newFields, fields: newFields })
                                      if (expandedFieldIndex === idx) setExpandedFieldIndex(null)
                                    }}
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 6,
                                      border: '1px solid #e8e8ed',
                                      backgroundColor: '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      color: '#ff3b30',
                                    }}
                                    title="Remover Campo"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Field Controls */}
                              {isExpanded && (
                                <div style={{ padding: '12px 14px', borderTop: '1px solid #e8e8ed', display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: '#fafafc' }}>
                                  <ControlRow label="Tipo do Campo">
                                    <select
                                      className="elementor-select"
                                      value={fItem.field_type || 'text'}
                                      onChange={e => {
                                        const newFields = [...arr]
                                        newFields[idx] = { ...fItem, field_type: e.target.value }
                                        updateWidgetContents({ form_fields: newFields, fields: newFields })
                                      }}
                                    >
                                      <option value="text">Texto Simples</option>
                                      <option value="email">E-mail</option>
                                      <option value="tel">Telefone / WhatsApp</option>
                                      <option value="textarea">Área de Texto (Mensagem)</option>
                                      <option value="number">Número</option>
                                      <option value="cpf">CPF / CNPJ (Identificação)</option>
                                      <option value="cep">CEP / Endereço</option>
                                      <option value="credit_card">Cartão de Crédito / Pagamento</option>
                                      <option value="select">Seleção (Dropdown)</option>
                                      <option value="checkbox">Caixa de Seleção (Checkbox)</option>
                                      <option value="date">Data</option>
                                      <option value="password">Senha</option>
                                      <option value="file">Upload de Arquivo</option>
                                    </select>
                                  </ControlRow>

                                  <div className="elementor-control-row stacked">
                                    <span className="elementor-control-label">Rótulo (Label)</span>
                                    <input
                                      className="elementor-input"
                                      value={fItem.field_label || ''}
                                      onChange={e => {
                                        const newFields = [...arr]
                                        newFields[idx] = { ...fItem, field_label: e.target.value }
                                        updateWidgetContents({ form_fields: newFields, fields: newFields })
                                      }}
                                      placeholder="Ex: Nome Completo"
                                    />
                                  </div>

                                  <div className="elementor-control-row stacked">
                                    <span className="elementor-control-label">Placeholder</span>
                                    <input
                                      className="elementor-input"
                                      value={fItem.placeholder || ''}
                                      onChange={e => {
                                        const newFields = [...arr]
                                        newFields[idx] = { ...fItem, placeholder: e.target.value }
                                        updateWidgetContents({ form_fields: newFields, fields: newFields })
                                      }}
                                      placeholder="Ex: Digite seu nome..."
                                    />
                                  </div>

                                  <ControlRow label="Largura da Coluna">
                                    <select
                                      className="elementor-select"
                                      value={fItem.column_width || '100%'}
                                      onChange={e => {
                                        const newFields = [...arr]
                                        newFields[idx] = { ...fItem, column_width: e.target.value }
                                        updateWidgetContents({ form_fields: newFields, fields: newFields })
                                      }}
                                    >
                                      <option value="100%">100% (Linha Inteira)</option>
                                      <option value="50%">50% (2 por Linha)</option>
                                      <option value="33.33%">33% (3 por Linha)</option>
                                      <option value="25%">25% (4 por Linha)</option>
                                      <option value="75%">75% (3/4 da Linha)</option>
                                    </select>
                                  </ControlRow>

                                  <ControlRow label="Campo Obrigatório">
                                    <ToggleSwitch
                                      checked={!!fItem.required}
                                      onChange={v => {
                                        const newFields = [...arr]
                                        newFields[idx] = { ...fItem, required: v }
                                        updateWidgetContents({ form_fields: newFields, fields: newFields })
                                      }}
                                    />
                                  </ControlRow>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Add Field Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const raw = obj.content?.form_fields || obj.content?.fields
                          const current = Array.isArray(raw) ? raw : [
                            { id: '1', field_type: 'text', field_label: 'Nome Completo', placeholder: 'Digite seu nome', column_width: '100%', required: true },
                            { id: '2', field_type: 'email', field_label: 'E-mail', placeholder: 'seu@email.com', column_width: '50%', required: true },
                            { id: '3', field_type: 'tel', field_label: 'Telefone / WhatsApp', placeholder: '(11) 99999-9999', column_width: '50%', required: false },
                            { id: '4', field_type: 'textarea', field_label: 'Mensagem', placeholder: 'Como podemos te ajudar?', column_width: '100%', required: false },
                          ]
                          const nextIdx = current.length
                          const newField = {
                            id: String(Date.now()),
                            field_type: 'text',
                            field_label: `Campo #${nextIdx + 1}`,
                            placeholder: 'Preencha este campo...',
                            column_width: '100%',
                            required: false,
                          }
                          const newFields = [...current, newField]
                          updateWidgetContents({ form_fields: newFields, fields: newFields })
                          setExpandedFieldIndex(nextIdx)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px dashed #0071e3',
                          backgroundColor: '#f0f7ff',
                          color: '#0071e3',
                          fontSize: 13,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Plus size={15} strokeWidth={2.5} /> Adicionar Campo
                      </button>
                    </div>
                  </AccordionSection>

                  {/* 2. Submit Button */}
                  <AccordionSection
                    title="Botão de Envio"
                    isOpen={openAccordions.buttonSection !== false}
                    onToggle={() => toggleAccordion('buttonSection')}
                  >
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Texto do Botão</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.button_text || 'Enviar Mensagem'}
                        onChange={e => updateWidgetContent('button_text', e.target.value)}
                        placeholder="Ex: Enviar Mensagem, Finalizar Cadastro"
                      />
                    </div>

                    <ControlRow label="Tamanho do Botão" style={{ marginTop: 8 }}>
                      <select
                        className="elementor-select"
                        value={obj.content?.button_size || 'md'}
                        onChange={e => updateWidgetContent('button_size', e.target.value)}
                      >
                        <option value="sm">Pequeno (SM)</option>
                        <option value="md">Médio (MD)</option>
                        <option value="lg">Grande (LG)</option>
                        <option value="full">Largura Total (100%)</option>
                      </select>
                    </ControlRow>

                    <ControlRow label="Alinhamento do Botão" responsive>
                      <IconGroupSelector
                        value={getVal('button_align', obj.content?.button_align || 'left')}
                        onChange={v => {
                          updateResponsive('button_align', v)
                          updateWidgetContent('button_align', v)
                        }}
                        options={[
                          { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                          { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                          { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                          { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificado (100%)' },
                        ]}
                      />
                    </ControlRow>

                    <ControlRow label="Cor de Fundo do Botão">
                      <ColorControl
                        value={obj.content?.button_bg || obj.settings?.button_bg || '#1d1d1f'}
                        onChange={v => {
                          updateWidgetContent('button_bg', v)
                          updateWidgetStyle('button_bg', v)
                        }}
                      />
                    </ControlRow>

                    <ControlRow label="Cor do Texto do Botão">
                      <ColorControl
                        value={obj.content?.button_color || obj.settings?.button_color || '#ffffff'}
                        onChange={v => {
                          updateWidgetContent('button_color', v)
                          updateWidgetStyle('button_color', v)
                        }}
                      />
                    </ControlRow>
                  </AccordionSection>

                  {/* 3. Actions After Submit (Ações Após o Envio) */}
                  <AccordionSection
                    title="Ações Após o Envio"
                    isOpen={openAccordions.formActions || false}
                    onToggle={() => toggleAccordion('formActions')}
                  >
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Ações ao Enviar</span>
                      <p style={{ fontSize: 11, color: '#86868b', margin: '3px 0 8px 0', lineHeight: 1.4 }}>
                        Selecione as integrações ativadas quando o usuário enviar este formulário.
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[
                          { id: 'email', label: 'E-mail' },
                          { id: 'email2', label: 'E-mail 2' },
                          { id: 'redirect', label: 'Redirecionamento (URL)' },
                          { id: 'webhook', label: 'Webhook' },
                          { id: 'whatsapp', label: 'WhatsApp' },
                        ].map(act => {
                          const currentActions: string[] = obj.content?.submit_actions || ['email']
                          const isSelected = currentActions.includes(act.id)
                          return (
                            <button
                              key={act.id}
                              type="button"
                              onClick={() => {
                                const next = isSelected
                                  ? currentActions.filter(a => a !== act.id)
                                  : [...currentActions, act.id]
                                updateWidgetContent('submit_actions', next)
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 500,
                                border: isSelected ? '1px solid #0071e3' : '1px solid #d2d2d7',
                                backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                                color: isSelected ? '#0071e3' : '#1d1d1f',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {isSelected ? `✓ ${act.label}` : `+ ${act.label}`}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {(obj.content?.submit_actions || ['email']).includes('redirect') && (
                      <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                        <span className="elementor-control-label">URL de Redirecionamento</span>
                        <input
                          className="elementor-input"
                          value={obj.content?.redirect_url || ''}
                          onChange={e => updateWidgetContent('redirect_url', e.target.value)}
                          placeholder="https://... ou /obrigado"
                        />
                      </div>
                    )}

                    {(obj.content?.submit_actions || ['email']).includes('webhook') && (
                      <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                        <span className="elementor-control-label">URL do Webhook</span>
                        <input
                          className="elementor-input"
                          value={obj.content?.webhook_url || ''}
                          onChange={e => updateWidgetContent('webhook_url', e.target.value)}
                          placeholder="https://sua-api.com/webhook"
                        />
                      </div>
                    )}
                  </AccordionSection>

                  {/* 4. Email Section */}
                  <AccordionSection
                    title="E-mail"
                    isOpen={openAccordions.formEmail || false}
                    onToggle={() => toggleAccordion('formEmail')}
                  >
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Para (Destinatário)</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.email_to || 'contato@teknix.com.br'}
                        onChange={e => updateWidgetContent('email_to', e.target.value)}
                        placeholder="admin@sua-loja.com"
                      />
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Assunto</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.email_subject || 'Novo contato via Formulário TEKNIX'}
                        onChange={e => updateWidgetContent('email_subject', e.target.value)}
                        placeholder="Assunto da notificação por e-mail"
                      />
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Mensagem (Corpo do E-mail)</span>
                      <textarea
                        className="elementor-textarea"
                        rows={3}
                        value={obj.content?.email_body || '[all-fields]'}
                        onChange={e => updateWidgetContent('email_body', e.target.value)}
                        placeholder="[all-fields]"
                      />
                      <span style={{ fontSize: 11, color: '#86868b', marginTop: 3 }}>
                        Use <code>[all-fields]</code> para enviar automaticamente todos os dados preenchidos.
                      </span>
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">E-mail do Remetente (From)</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.email_from || 'noreply@teknix.com.br'}
                        onChange={e => updateWidgetContent('email_from', e.target.value)}
                        placeholder="noreply@sua-loja.com"
                      />
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Nome do Remetente</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.email_from_name || 'TEKNIX Store'}
                        onChange={e => updateWidgetContent('email_from_name', e.target.value)}
                        placeholder="Ex: Minha Loja"
                      />
                    </div>
                  </AccordionSection>

                  {/* 5. Additional Options (Opções Adicionais) - 1:1 Elementor Pro */}
                  <AccordionSection
                    title="Opções Adicionais"
                    isOpen={openAccordions.formAdditional !== false}
                    onToggle={() => toggleAccordion('formAdditional')}
                  >
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">ID do Formulário</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.form_id || obj.content?.custom_id || 'form_11'}
                        onChange={e => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')
                          updateWidgetContent('form_id', val)
                          updateWidgetContent('custom_id', val)
                        }}
                        placeholder="Ex: form_11"
                        style={{ fontFamily: 'monospace', fontWeight: 600 }}
                      />
                      <p style={{ fontSize: 11, color: '#86868b', margin: '4px 0 0 0', lineHeight: 1.4, fontStyle: 'italic' }}>
                        Certifique-se de que o ID seja único e não seja usado em outro lugar da página onde este formulário é exibido. Este campo permite caracteres A-z, 0-9 e sublinhado (_) sem espaços.
                      </p>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f0f0f2' }}>
                      <ControlRow label="Mensagens Personalizadas">
                        <ToggleSwitch
                          checked={!!obj.content?.custom_messages}
                          onChange={v => updateWidgetContent('custom_messages', v)}
                        />
                      </ControlRow>
                    </div>

                    {obj.content?.custom_messages && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, padding: '10px 12px', backgroundColor: '#f5f5f7', borderRadius: 8 }}>
                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Mensagem de Sucesso</span>
                          <input
                            className="elementor-input"
                            value={obj.content?.success_message || 'O formulário foi enviado com sucesso.'}
                            onChange={e => updateWidgetContent('success_message', e.target.value)}
                            placeholder="O formulário foi enviado com sucesso."
                          />
                        </div>

                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Mensagem de Erro</span>
                          <input
                            className="elementor-input"
                            value={obj.content?.error_message || 'Ocorreu um erro ao enviar o formulário.'}
                            onChange={e => updateWidgetContent('error_message', e.target.value)}
                            placeholder="Ocorreu um erro ao enviar o formulário."
                          />
                        </div>

                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Mensagem de Campo Obrigatório</span>
                          <input
                            className="elementor-input"
                            value={obj.content?.required_field_message || 'Este campo é obrigatório.'}
                            onChange={e => updateWidgetContent('required_field_message', e.target.value)}
                            placeholder="Este campo é obrigatório."
                          />
                        </div>

                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Mensagem de Formulário Inválido</span>
                          <input
                            className="elementor-input"
                            value={obj.content?.invalid_form_message || 'Verifique os campos preenchidos e tente novamente.'}
                            onChange={e => updateWidgetContent('invalid_form_message', e.target.value)}
                            placeholder="Verifique os campos preenchidos."
                          />
                        </div>
                      </div>
                    )}
                  </AccordionSection>
                </>
              )}

              {/* Login Widget (1:1 Elementor Pro Login) */}
              {item.type === 'widget' && isLogin && (
                <>
                  {/* 1. Form Fields */}
                  <AccordionSection
                    title="Form Fields"
                    isOpen={openAccordions.widgetContent !== false}
                    onToggle={() => toggleAccordion('widgetContent')}
                  >
                    <ControlRow label="Rótulos (Labels)">
                      <ToggleSwitch
                        checked={obj.content?.show_labels !== false}
                        onChange={v => updateWidgetContent('show_labels', v)}
                      />
                    </ControlRow>

                    <ControlRow label="Tamanho dos Campos" style={{ marginTop: 8 }}>
                      <select
                        className="elementor-select"
                        value={obj.content?.input_size || 'md'}
                        onChange={e => updateWidgetContent('input_size', e.target.value)}
                      >
                        <option value="xs">Extra Pequeno (XS)</option>
                        <option value="sm">Pequeno (Small)</option>
                        <option value="md">Médio (Medium)</option>
                        <option value="lg">Grande (Large)</option>
                        <option value="xl">Extra Grande (XL)</option>
                      </select>
                    </ControlRow>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Rótulo de Usuário / E-mail</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.username_label || 'Nome de Usuário ou E-mail'}
                        onChange={e => updateWidgetContent('username_label', e.target.value)}
                        placeholder="Nome de Usuário ou E-mail"
                      />
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Placeholder de Usuário</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.username_placeholder || 'Digite seu e-mail ou usuário...'}
                        onChange={e => updateWidgetContent('username_placeholder', e.target.value)}
                        placeholder="Digite seu e-mail ou usuário..."
                      />
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Rótulo da Senha</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.password_label || 'Senha'}
                        onChange={e => updateWidgetContent('password_label', e.target.value)}
                        placeholder="Senha"
                      />
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Placeholder da Senha</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.password_placeholder || 'Digite sua senha...'}
                        onChange={e => updateWidgetContent('password_placeholder', e.target.value)}
                        placeholder="Digite sua senha..."
                      />
                    </div>
                  </AccordionSection>

                  {/* 2. Button */}
                  <AccordionSection
                    title="Button"
                    isOpen={openAccordions.buttonSection !== false}
                    onToggle={() => toggleAccordion('buttonSection')}
                  >
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Texto do Botão</span>
                      <input
                        className="elementor-input"
                        value={obj.content?.button_text || 'Iniciar Sessão'}
                        onChange={e => updateWidgetContent('button_text', e.target.value)}
                        placeholder="Ex: Iniciar Sessão, Entrar na Conta"
                      />
                    </div>

                    <ControlRow label="Tamanho do Botão" style={{ marginTop: 8 }}>
                      <select
                        className="elementor-select"
                        value={obj.content?.button_size || 'md'}
                        onChange={e => updateWidgetContent('button_size', e.target.value)}
                      >
                        <option value="sm">Pequeno (SM)</option>
                        <option value="md">Médio (MD)</option>
                        <option value="lg">Grande (LG)</option>
                        <option value="full">Largura Total (100%)</option>
                      </select>
                    </ControlRow>

                    <ControlRow label="Alinhamento do Botão" responsive>
                      <IconGroupSelector
                        value={getVal('button_align', obj.content?.button_align || 'left')}
                        onChange={v => {
                          updateResponsive('button_align', v)
                          updateWidgetContent('button_align', v)
                        }}
                        options={[
                          { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                          { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                          { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                          { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificado (100%)' },
                        ]}
                      />
                    </ControlRow>

                    <ControlRow label="Cor de Fundo do Botão">
                      <ColorControl
                        value={obj.content?.button_bg || obj.settings?.button_bg || '#0071e3'}
                        onChange={v => {
                          updateWidgetContent('button_bg', v)
                          updateWidgetStyle('button_bg', v)
                        }}
                      />
                    </ControlRow>

                    <ControlRow label="Cor do Texto do Botão">
                      <ColorControl
                        value={obj.content?.button_color || obj.settings?.button_color || '#ffffff'}
                        onChange={v => {
                          updateWidgetContent('button_color', v)
                          updateWidgetStyle('button_color', v)
                        }}
                      />
                    </ControlRow>
                  </AccordionSection>

                  {/* 3. Additional Options */}
                  <AccordionSection
                    title="Additional Options"
                    isOpen={openAccordions.loginAdditional !== false}
                    onToggle={() => toggleAccordion('loginAdditional')}
                  >
                    <ControlRow label="Redirecionar Após Login">
                      <ToggleSwitch
                        checked={!!obj.content?.redirect_after_login}
                        onChange={v => updateWidgetContent('redirect_after_login', v)}
                      />
                    </ControlRow>

                    {obj.content?.redirect_after_login && (
                      <div className="elementor-control-row stacked" style={{ marginTop: 6, marginBottom: 8 }}>
                        <span className="elementor-control-label">URL de Redirecionamento</span>
                        <input
                          className="elementor-input"
                          value={obj.content?.redirect_url || ''}
                          onChange={e => updateWidgetContent('redirect_url', e.target.value)}
                          placeholder="https://... ou /minha-conta"
                        />
                      </div>
                    )}

                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f2' }}>
                      <ControlRow label="Lembrar de Mim">
                        <ToggleSwitch
                          checked={obj.content?.show_remember_me !== false}
                          onChange={v => updateWidgetContent('show_remember_me', v)}
                        />
                      </ControlRow>
                    </div>

                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f2' }}>
                      <ControlRow label="Esqueci Minha Senha">
                        <ToggleSwitch
                          checked={obj.content?.show_lost_password !== false}
                          onChange={v => updateWidgetContent('show_lost_password', v)}
                        />
                      </ControlRow>
                    </div>

                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f2' }}>
                      <ControlRow label="Link de Cadastro (Criar Conta)">
                        <ToggleSwitch
                          checked={obj.content?.show_register_link !== false}
                          onChange={v => updateWidgetContent('show_register_link', v)}
                        />
                      </ControlRow>
                    </div>

                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f2' }}>
                      <ControlRow label="Mensagens Personalizadas">
                        <ToggleSwitch
                          checked={!!obj.content?.custom_messages}
                          onChange={v => updateWidgetContent('custom_messages', v)}
                        />
                      </ControlRow>
                    </div>

                    {obj.content?.custom_messages && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, padding: '10px 12px', backgroundColor: '#f5f5f7', borderRadius: 8 }}>
                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Mensagem de Erro de Login</span>
                          <input
                            className="elementor-input"
                            value={obj.content?.login_error_message || 'Usuário ou senha inválidos.'}
                            onChange={e => updateWidgetContent('login_error_message', e.target.value)}
                            placeholder="Usuário ou senha inválidos."
                          />
                        </div>
                      </div>
                    )}
                  </AccordionSection>
                </>
              )}

              {/* ── FLIP BOX ── */}
              {item.type === 'widget' && isFlipBox && (
                <AccordionSection title="Flip Box 3D" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título (Frente)</span>
                    <input className="elementor-input" value={obj.content?.front_title || ''} placeholder="Frente" onChange={e => updateWidgetContent('front_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo (Frente)</span>
                    <input className="elementor-input" value={obj.content?.front_subtitle || ''} placeholder="Subtítulo frente" onChange={e => updateWidgetContent('front_subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo (Frente)</span>
                    <input type="color" value={obj.content?.front_bg || '#1d1d1f'} onChange={e => updateWidgetContent('front_bg', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título (Verso)</span>
                    <input className="elementor-input" value={obj.content?.back_title || ''} placeholder="Verso" onChange={e => updateWidgetContent('back_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo (Verso)</span>
                    <input className="elementor-input" value={obj.content?.back_subtitle || ''} placeholder="Subtítulo verso" onChange={e => updateWidgetContent('back_subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo (Verso)</span>
                    <input type="color" value={obj.content?.back_bg || '#0071e3'} onChange={e => updateWidgetContent('back_bg', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── CTA PRO ── */}
              {item.type === 'widget' && isCtaPro && (
                <AccordionSection title="Call to Action" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || ''} placeholder="Call to Action" onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo</span>
                    <textarea className="elementor-textarea" rows={2} value={obj.content?.subtitle || ''} placeholder="Descrição..." onChange={e => updateWidgetContent('subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input className="elementor-input" value={obj.content?.button_text || ''} placeholder="Saiba Mais" onChange={e => updateWidgetContent('button_text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">URL do Botão</span>
                    <input className="elementor-input" value={obj.content?.button_url || ''} placeholder="https://..." onChange={e => updateWidgetContent('button_url', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo</span>
                    <input type="color" value={obj.content?.background || '#0071e3'} onChange={e => updateWidgetContent('background', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── PRICE TABLE PRO ── */}
              {item.type === 'widget' && isPriceTablePro && (
                <AccordionSection title="Tabela de Preços" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título Plano 1</span>
                    <input className="elementor-input" value={obj.content?.plan1_name || 'Básico'} onChange={e => updateWidgetContent('plan1_name', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Preço Plano 1</span>
                    <input className="elementor-input" value={obj.content?.plan1_price || 'R$ 99'} onChange={e => updateWidgetContent('plan1_price', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título Plano 2</span>
                    <input className="elementor-input" value={obj.content?.plan2_name || 'Pro'} onChange={e => updateWidgetContent('plan2_name', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Preço Plano 2</span>
                    <input className="elementor-input" value={obj.content?.plan2_price || 'R$ 199'} onChange={e => updateWidgetContent('plan2_price', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── MEDIA CAROUSEL ── */}
              {item.type === 'widget' && isMediaCarousel && (
                <AccordionSection title="Carrossel de Mídia" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  {(Array.isArray(obj.content?.images) ? obj.content.images : []).map((item: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: 10, padding: 10, background: '#f5f5f7', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 12, color: '#1d1d1f' }}>Slide {idx + 1}</span>
                        <button onClick={() => { const imgs = [...(Array.isArray(obj.content?.images) ? obj.content.images : [])]; imgs.splice(idx, 1); updateWidgetContent('images', imgs); }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                      </div>
                      <input className="elementor-input" value={item.url || ''} placeholder="URL da imagem" onChange={e => { const imgs = [...(Array.isArray(obj.content?.images) ? obj.content.images : [])]; imgs[idx] = { ...imgs[idx], url: e.target.value }; updateWidgetContent('images', imgs); }} />
                      <input className="elementor-input" style={{ marginTop: 4 }} value={item.text || ''} placeholder="Texto da legenda" onChange={e => { const imgs = [...(Array.isArray(obj.content?.images) ? obj.content.images : [])]; imgs[idx] = { ...imgs[idx], text: e.target.value }; updateWidgetContent('images', imgs); }} />
                      <input className="elementor-input" style={{ marginTop: 4 }} value={item.link || ''} placeholder="Link (URL)" onChange={e => { const imgs = [...(Array.isArray(obj.content?.images) ? obj.content.images : [])]; imgs[idx] = { ...imgs[idx], link: e.target.value }; updateWidgetContent('images', imgs); }} />
                    </div>
                  ))}
                  <button onClick={() => { const imgs = [...(Array.isArray(obj.content?.images) ? obj.content.images : []), { url: '', text: '', link: '' }]; updateWidgetContent('images', imgs); }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Slide</button>
                </AccordionSection>
              )}

              {/* ── ENDLESS ENTERTAINMENT GALLERY ── */}
              {item.type === 'widget' && isEntertainmentGallery && (
                <>
                  <AccordionSection title="Título & Reprodução" isOpen={openAccordions.entGeneral !== false} onToggle={() => toggleAccordion('entGeneral')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Título da Seção</span>
                      <input className="elementor-input" value={obj.content?.headline ?? 'Endless entertainment.'} placeholder="Endless entertainment." onChange={e => updateWidgetContent('headline', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tag do Título</span>
                      <select className="elementor-select" value={obj.content?.headlineTag || 'h2'} onChange={e => updateWidgetContent('headlineTag', e.target.value)}>
                        <option value="h1">H1</option>
                        <option value="h2">H2</option>
                        <option value="h3">H3</option>
                        <option value="div">Div</option>
                      </select>
                    </div>
                    <div className="elementor-control-row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                      <span className="elementor-control-label">Autoplay</span>
                      <input type="checkbox" checked={obj.content?.autoplay !== false} onChange={e => updateWidgetContent('autoplay', e.target.checked)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <span>Duração por Slide (segundos)</span>
                        <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{((Number(obj.content?.interval || 4160)) / 1000).toFixed(1)}s</span>
                      </div>
                      <input type="range" min="1000" max="10000" step="500" value={obj.content?.interval || 4160} onChange={e => updateWidgetContent('interval', Number(e.target.value))} />
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Shows & Filmes (Apple TV+)" isOpen={openAccordions.entShows !== false} onToggle={() => toggleAccordion('entShows')}>
                    {((Array.isArray(obj.content?.tvShows) && obj.content.tvShows.length > 0) ? obj.content.tvShows : [
                      { id: 'mls', title: 'MLS', genre: 'Esportes', description: 'Assista a todos os clubes, todos os jogos ao vivo.', button_text: 'MLS on Apple TV', button_link: '#', bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/78/57/f6/7857f6ec-a4ed-87dc-dea9-a6ed02888722/ebd59c17-8e95-49b1-aec0-44aec57388ee.png/1250x668sr.jpg', logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/Kc1Xx3Z1QBOuXe1EHDu4TA/220x54.png' },
                      { id: 'ted-lasso', title: 'Ted Lasso', genre: 'Comédia', description: 'A comédia de sucesso está de volta e mais divertida do que nunca.', button_text: 'Assista agora', button_link: '#', bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features221/v4/3d/b5/d5/3db5d5c0-808b-d357-a2f1-2240d614e2b0/e6663278-3bd4-4114-9f97-082e7c192453.png/1250x668sr.jpg', logo_image: 'https://is1-ssl.mzstatic.com/image/thumb/Cc6MMzxFzD1gVqnd6IslKA/220x54.png' }
                    ]).map((show: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 12, padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: '#1d1d1f' }}>Show {idx + 1}: {show.title || 'Sem título'}</span>
                          <button onClick={() => {
                            const list = [...(obj.content?.tvShows || [])]
                            list.splice(idx, 1)
                            updateWidgetContent('tvShows', list)
                          }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                        </div>
                        <input className="elementor-input" value={show.title || ''} placeholder="Título (ex: Ted Lasso)" onChange={e => {
                          const list = [...(obj.content?.tvShows || [])]
                          list[idx] = { ...list[idx], title: e.target.value }
                          updateWidgetContent('tvShows', list)
                        }} />
                        <input className="elementor-input" style={{ marginTop: 6 }} value={show.genre || ''} placeholder="Gênero (ex: Comédia, Ficção)" onChange={e => {
                          const list = [...(obj.content?.tvShows || [])]
                          list[idx] = { ...list[idx], genre: e.target.value }
                          updateWidgetContent('tvShows', list)
                        }} />
                        <textarea className="elementor-textarea" style={{ marginTop: 6 }} rows={2} value={show.description || ''} placeholder="Descrição curta" onChange={e => {
                          const list = [...(obj.content?.tvShows || [])]
                          list[idx] = { ...list[idx], description: e.target.value }
                          updateWidgetContent('tvShows', list)
                        }} />
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <span className="elementor-control-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Imagem de Fundo (Poster)</span>
                          <ImageThumbnailBox
                            src={show.bg_image || ''}
                            title="Poster do Show"
                            onChange={url => {
                              const list = [...(obj.content?.tvShows || [])]
                              list[idx] = { ...list[idx], bg_image: url }
                              updateWidgetContent('tvShows', list)
                            }}
                          />
                        </div>
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <span className="elementor-control-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Logo Oficial (PNG transparente)</span>
                          <ImageThumbnailBox
                            src={show.logo_image || ''}
                            title="Logo Oficial"
                            onChange={url => {
                              const list = [...(obj.content?.tvShows || [])]
                              list[idx] = { ...list[idx], logo_image: url }
                              updateWidgetContent('tvShows', list)
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                          <input className="elementor-input" value={show.button_text || ''} placeholder="Texto do Botão" onChange={e => {
                            const list = [...(obj.content?.tvShows || [])]
                            list[idx] = { ...list[idx], button_text: e.target.value }
                            updateWidgetContent('tvShows', list)
                          }} />
                          <input className="elementor-input" value={show.button_link || ''} placeholder="Link do Botão" onChange={e => {
                            const list = [...(obj.content?.tvShows || [])]
                            list[idx] = { ...list[idx], button_link: e.target.value }
                            updateWidgetContent('tvShows', list)
                          }} />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const list = [...(obj.content?.tvShows || []), { id: `show-${Date.now()}`, title: 'Novo Show', genre: 'Destaque', description: 'Assista agora em alta definição.', button_text: 'Assista agora', button_link: '#', bg_image: '', logo_image: '' }]
                      updateWidgetContent('tvShows', list)
                    }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Show</button>
                  </AccordionSection>

                  <AccordionSection title="Serviços (Música, Arcade & Fitness)" isOpen={openAccordions.entServices !== false} onToggle={() => toggleAccordion('entServices')}>
                    {((Array.isArray(obj.content?.famServices) && obj.content.famServices.length > 0) ? obj.content.famServices : [
                      { id: 'fam-music-1', service: 'music', title: 'Sabrina Carpenter: The Zane Lowe Interview', bg_color: '#000000', bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/55/2b/5f/552b5f86-46e6-d848-ee06-5395bf09c206/83e0ed3d-c824-4ed9-9572-ae9e784568cb.png/452x452sr.jpg', button_text: 'Ouvir agora', button_link: '#' },
                      { id: 'fam-arcade-1', service: 'arcade', title: 'Hello Kitty Island Adventure', bg_color: '#f4f8fb', bg_image: 'https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/5b/b3/4a/5bb34a60-695c-a96f-75ec-8a957fc2a20b/45899847-e52c-44a1-9ce5-09aedebb7a78.png/940x528.jpg', button_text: 'Jogar agora', button_link: '#' }
                    ]).map((srv: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 12, padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: '#1d1d1f' }}>Serviço {idx + 1}: {srv.service?.toUpperCase()}</span>
                          <button onClick={() => {
                            const list = [...(obj.content?.famServices || [])]
                            list.splice(idx, 1)
                            updateWidgetContent('famServices', list)
                          }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                        </div>
                        <select className="elementor-select" value={srv.service || 'music'} onChange={e => {
                          const list = [...(obj.content?.famServices || [])]
                          list[idx] = { ...list[idx], service: e.target.value }
                          updateWidgetContent('famServices', list)
                        }}>
                          <option value="music">Apple Music</option>
                          <option value="arcade">Apple Arcade</option>
                          <option value="fitness">Apple Fitness+</option>
                        </select>
                        <input className="elementor-input" style={{ marginTop: 6 }} value={srv.title || ''} placeholder="Título do Card" onChange={e => {
                          const list = [...(obj.content?.famServices || [])]
                          list[idx] = { ...list[idx], title: e.target.value }
                          updateWidgetContent('famServices', list)
                        }} />
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <span className="elementor-control-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Imagem / Artwork</span>
                          <ImageThumbnailBox
                            src={srv.bg_image || ''}
                            title="Artwork do Serviço"
                            onChange={url => {
                              const list = [...(obj.content?.famServices || [])]
                              list[idx] = { ...list[idx], bg_image: url }
                              updateWidgetContent('famServices', list)
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <span style={{ fontSize: 11, color: '#6e6e73' }}>Cor de Fundo:</span>
                          <input type="color" value={srv.bg_color || '#000000'} onChange={e => {
                            const list = [...(obj.content?.famServices || [])]
                            list[idx] = { ...list[idx], bg_color: e.target.value }
                            updateWidgetContent('famServices', list)
                          }} style={{ width: 40, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                          <input className="elementor-input" value={srv.button_text || ''} placeholder="Texto do Botão" onChange={e => {
                            const list = [...(obj.content?.famServices || [])]
                            list[idx] = { ...list[idx], button_text: e.target.value }
                            updateWidgetContent('famServices', list)
                          }} />
                          <input className="elementor-input" value={srv.button_link || ''} placeholder="Link do Botão" onChange={e => {
                            const list = [...(obj.content?.famServices || [])]
                            list[idx] = { ...list[idx], button_link: e.target.value }
                            updateWidgetContent('famServices', list)
                          }} />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const list = [...(obj.content?.famServices || []), { id: `srv-${Date.now()}`, service: 'music', title: 'Novo Card', bg_color: '#000000', bg_image: '', button_text: 'Explorar', button_link: '#' }]
                      updateWidgetContent('famServices', list)
                    }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Serviço</button>
                  </AccordionSection>
                </>
              )}

              {/* ── CHAPTERNAV (APPLE PRODUCT / CATEGORY BAR) ── */}
              {item.type === 'widget' && isChapterNav && (
                <>
                  <AccordionSection title="Itens do ChapterNav (Modelos)" isOpen={openAccordions.chItems !== false} onToggle={() => toggleAccordion('chItems')}>
                    {((Array.isArray(obj.content?.items) && obj.content.items.length > 0) ? obj.content.items : [
                      { id: 'item-ipad-pro', label: 'iPad Pro', href: '/ipad-pro', image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_pro_light__dyaaecs32huu_large.svg', badge: 'Novo', is_new: true },
                      { id: 'item-ipad-air', label: 'iPad Air', href: '/ipad-air', image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_air_light__d9omv1pt7fme_large.svg', badge: 'Novo', is_new: true },
                      { id: 'item-ipad-11', label: 'iPad', href: '/ipad', image_url: 'https://www.apple.com/v/ipad/home/ck/images/chapternav/ipad_light__b1cl7u80agae_large.svg' }
                    ]).map((chItem: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 12, padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: '#1d1d1f' }}>Item {idx + 1}: {chItem.label || 'Sem nome'}</span>
                          <button onClick={() => {
                            const list = [...(obj.content?.items || [])]
                            list.splice(idx, 1)
                            updateWidgetContent('items', list)
                          }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                        </div>
                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Nome / Rótulo</span>
                          <input className="elementor-input" value={chItem.label || ''} placeholder="Ex: iPad Pro" onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], label: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginTop: 6 }}>
                          <span className="elementor-control-label">Link (URL de destino)</span>
                          <input className="elementor-input" value={chItem.href || ''} placeholder="/ipad-pro ou https://..." onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], href: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <span className="elementor-control-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Ícone / Imagem (SVG/PNG)</span>
                          <ImageThumbnailBox
                            src={chItem.image_url || ''}
                            title="Ícone do Modelo"
                            onChange={url => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], image_url: url }
                              updateWidgetContent('items', list)
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                          <div className="elementor-control-row stacked">
                            <span className="elementor-control-label">Badge (Texto)</span>
                            <input className="elementor-input" value={chItem.badge || ''} placeholder="Ex: Novo" onChange={e => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], badge: e.target.value }
                              updateWidgetContent('items', list)
                            }} />
                          </div>
                          <div className="elementor-control-row stacked">
                            <span className="elementor-control-label">Cor do Badge</span>
                            <input className="elementor-input" value={chItem.badge_color || '#bf4800'} placeholder="#bf4800" onChange={e => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], badge_color: e.target.value }
                              updateWidgetContent('items', list)
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const list = [...(obj.content?.items || []), { id: `item-${Date.now()}`, label: 'Novo Item', href: '#', image_url: '', badge: '' }]
                      updateWidgetContent('items', list)
                    }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Modelo</button>
                  </AccordionSection>

                  <AccordionSection title="Layout & Estilo do ChapterNav" isOpen={openAccordions.chLayout !== false} onToggle={() => toggleAccordion('chLayout')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Alinhamento</span>
                      <select className="elementor-select" value={obj.content?.align || 'center'} onChange={e => updateWidgetContent('align', e.target.value)}>
                        <option value="center">Centralizado</option>
                        <option value="flex-start">À Esquerda</option>
                        <option value="space-between">Espaçamento Total</option>
                      </select>
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <span>Espaçamento entre Itens (px)</span>
                        <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.item_gap ?? 32}px</span>
                      </div>
                      <input type="range" min="12" max="64" step="4" value={obj.content?.item_gap ?? 32} onChange={e => updateWidgetContent('item_gap', Number(e.target.value))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <span>Altura do Ícone (px)</span>
                        <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.icon_height ?? 54}px</span>
                      </div>
                      <input type="range" min="32" max="96" step="2" value={obj.content?.icon_height ?? 54} onChange={e => updateWidgetContent('icon_height', Number(e.target.value))} />
                    </div>
                    <div className="elementor-control-row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                      <span className="elementor-control-label">Exibir Badges (Novo)</span>
                      <input type="checkbox" checked={obj.content?.show_badges !== false} onChange={e => updateWidgetContent('show_badges', e.target.checked)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Cor do Texto</span>
                      <input className="elementor-input" value={obj.content?.text_color || '#1d1d1f'} placeholder="#1d1d1f" onChange={e => updateWidgetContent('text_color', e.target.value)} />
                    </div>
                  </AccordionSection>
                </>
              )}

              {/* ── EXPLORE THE LINEUP (PRODUCT CAROUSEL WIDGET - JETENGINE DYNAMIC) ── */}
              {item.type === 'widget' && isProductLineupGallery && (
                <>
                  <AccordionSection title="Fonte de Dados (JetEngine / Loja)" isOpen={openAccordions.lineupData !== false} onToggle={() => toggleAccordion('lineupData')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Modo da Fonte</span>
                      <select className="elementor-select" value={obj.content?.data_source || 'dynamic'} onChange={e => updateWidgetContent('data_source', e.target.value)}>
                        <option value="dynamic">⚡ Dinâmico (Banco de Dados / JetEngine)</option>
                        <option value="manual">✎ Manual (Itens Personalizados)</option>
                      </select>
                    </div>

                    {obj.content?.data_source !== 'manual' && (
                      <>
                        <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                          <span className="elementor-control-label">Categoria / Segmento do Banco</span>
                          <input className="elementor-input" value={obj.content?.category || obj.content?.segment || ''} placeholder="Ex: ipad, ferramentas, eletrônicos (ou vazio para todos)" onChange={e => updateWidgetContent('category', e.target.value)} />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                          <span className="elementor-control-label">Ordenação</span>
                          <select className="elementor-select" value={obj.content?.sort || 'relevance'} onChange={e => updateWidgetContent('sort', e.target.value)}>
                            <option value="relevance">Mais Relevantes</option>
                            <option value="newest">Mais Recentes</option>
                            <option value="price_asc">Menor Preço</option>
                            <option value="price_desc">Maior Preço</option>
                          </select>
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                          <span className="elementor-control-label">Limite de Produtos</span>
                          <input
                            className="elementor-input"
                            type="number"
                            min="1"
                            max="50"
                            step="1"
                            value={obj.content?.limit ?? 8}
                            onChange={e => updateWidgetContent('limit', Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>
                      </>
                    )}
                  </AccordionSection>

                  <AccordionSection title="Cabeçalho da Seção" isOpen={openAccordions.lineupHeader !== false} onToggle={() => toggleAccordion('lineupHeader')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Título Principal</span>
                      <input className="elementor-input" value={obj.content?.headline ?? 'Explore a linha completa.'} placeholder="Ex: Explore a linha completa." onChange={e => updateWidgetContent('headline', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Texto do Link de Comparação</span>
                      <input className="elementor-input" value={obj.content?.compare_text ?? 'Comparar todos os modelos'} placeholder="Ex: Comparar todos os modelos" onChange={e => updateWidgetContent('compare_text', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">URL do Link de Comparação</span>
                      <input className="elementor-input" value={obj.content?.compare_link || '/comparar'} placeholder="/comparar" onChange={e => updateWidgetContent('compare_link', e.target.value)} />
                    </div>
                    <div className="elementor-control-row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                      <span className="elementor-control-label">Exibir Setas de Navegação</span>
                      <input type="checkbox" checked={obj.content?.show_nav_arrows !== false} onChange={e => updateWidgetContent('show_nav_arrows', e.target.checked)} />
                    </div>
                    <div className="elementor-control-row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                      <span className="elementor-control-label">Exibir Seletor de Cores</span>
                      <input type="checkbox" checked={obj.content?.show_swatches !== false} onChange={e => updateWidgetContent('show_swatches', e.target.checked)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                      <span className="elementor-control-label">Limite de Caracteres do Título</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="5"
                        max="300"
                        step="1"
                        value={obj.content?.title_max_chars ?? 30}
                        onChange={e => updateWidgetContent('title_max_chars', Math.max(5, parseInt(e.target.value) || 30))}
                      />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Limite de Caracteres da Descrição</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="10"
                        max="500"
                        step="1"
                        value={obj.content?.copy_max_chars ?? 80}
                        onChange={e => updateWidgetContent('copy_max_chars', Math.max(10, parseInt(e.target.value) || 80))}
                      />
                    </div>
                  </AccordionSection>

                  {obj.content?.data_source === 'manual' && (
                    <AccordionSection title="Itens Manuais dos Cards" isOpen={openAccordions.lineupItems !== false} onToggle={() => toggleAccordion('lineupItems')}>
                      {((Array.isArray(obj.content?.items) && obj.content.items.length > 0) ? obj.content.items : [
                        { id: 'ipad-pro', title: 'iPad Pro', badge: 'Novo', image: 'https://www.apple.com/v/ipad-pro/ao/images/overview/hero/hero__e2z86z500dqq_large.jpg', copy: 'A experiência definitiva com chip M4.', price: 'A partir de R$ 11.999', installments: 'ou 12x de R$ 999,91 sem juros', link_saber: '/ipad-pro', link_comprar: '/checkout?product=ipad-pro' }
                      ]).map((itemProd: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 12, padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 12, color: '#1d1d1f' }}>Card {idx + 1}: {itemProd.title}</span>
                            <button onClick={() => {
                              const list = [...(obj.content?.items || [])]
                              list.splice(idx, 1)
                              updateWidgetContent('items', list)
                            }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                          </div>
                          <input className="elementor-input" value={itemProd.title || ''} placeholder="Nome do Produto" onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], title: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                          <input className="elementor-input" style={{ marginTop: 6 }} value={itemProd.badge || ''} placeholder="Badge (ex: Novo)" onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], badge: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                          <div style={{ marginTop: 8, marginBottom: 8 }}>
                            <span className="elementor-control-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Foto do Produto</span>
                            <ImageThumbnailBox
                              src={itemProd.image || ''}
                              title="Foto do Produto"
                              onChange={url => {
                                const list = [...(obj.content?.items || [])]
                                list[idx] = { ...list[idx], image: url }
                                updateWidgetContent('items', list)
                              }}
                            />
                          </div>
                          <input className="elementor-input" style={{ marginTop: 6 }} value={itemProd.copy || ''} placeholder="Texto de Destaque / Subtítulo" onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], copy: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                            <input className="elementor-input" value={itemProd.price || ''} placeholder="Preço (ex: A partir de R$ 999)" onChange={e => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], price: e.target.value }
                              updateWidgetContent('items', list)
                            }} />
                            <input className="elementor-input" value={itemProd.installments || ''} placeholder="Parcelamento (ex: ou 12x de R$ 99)" onChange={e => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], installments: e.target.value }
                              updateWidgetContent('items', list)
                            }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                            <input className="elementor-input" value={itemProd.link_saber || ''} placeholder="Link Saber mais" onChange={e => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], link_saber: e.target.value }
                              updateWidgetContent('items', list)
                            }} />
                            <input className="elementor-input" value={itemProd.link_comprar || ''} placeholder="Link Comprar / Checkout" onChange={e => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], link_comprar: e.target.value }
                              updateWidgetContent('items', list)
                            }} />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => {
                        const list = [...(obj.content?.items || []), { id: `prod-${Date.now()}`, title: 'Novo Modelo', badge: 'Novo', image: '', copy: 'Tecnologia avançada.', price: 'A partir de R$ 1.999', installments: 'ou 12x de R$ 166,58', link_saber: '#', link_comprar: '#' }]
                        updateWidgetContent('items', list)
                      }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Card de Produto</button>
                    </AccordionSection>
                  )}
                </>
              )}

              {/* ── CARDS (O DIFERENCIAL DA LOJA / APPLE STORE BENEFITS SCROLLER) ── */}
              {item.type === 'widget' && isCards && (
                <>
                  <AccordionSection title="Cabeçalho da Seção" isOpen={openAccordions.cardsHeader !== false} onToggle={() => toggleAccordion('cardsHeader')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Título em Negrito</span>
                      <input className="elementor-input" value={obj.content?.headline_bold ?? 'O diferencial da TEKNIX.'} placeholder="Ex: O diferencial da Loja." onChange={e => updateWidgetContent('headline_bold', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Subtítulo (Cinza)</span>
                      <input className="elementor-input" value={obj.content?.headline_normal ?? 'Mais razões para comprar conosco.'} placeholder="Ex: Mais razões para comprar conosco." onChange={e => updateWidgetContent('headline_normal', e.target.value)} />
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Card Principal (Destaque Grande)" isOpen={openAccordions.cardsFeatured !== false} onToggle={() => toggleAccordion('cardsFeatured')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Badge Superior</span>
                      <input className="elementor-input" value={obj.content?.featured_badge ?? 'NOVO'} placeholder="NOVO" onChange={e => updateWidgetContent('featured_badge', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Título do Card</span>
                      <input className="elementor-input" value={obj.content?.featured_title ?? 'TEKNIX Pro Upgrade'} placeholder="Título de destaque" onChange={e => updateWidgetContent('featured_title', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Descrição</span>
                      <textarea className="elementor-textarea" rows={3} value={obj.content?.featured_desc ?? ''} placeholder="Texto descritivo..." onChange={e => updateWidgetContent('featured_desc', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tipo de Mídia Inferior</span>
                      <select className="elementor-select" value={obj.content?.featured_media_type || 'video'} onChange={e => updateWidgetContent('featured_media_type', e.target.value)}>
                        <option value="video">Vídeo MP4 (Autoplay/Loop)</option>
                        <option value="image">Imagem Estática</option>
                      </select>
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">URL do Vídeo / Imagem</span>
                      <input className="elementor-input" value={obj.content?.featured_media_url ?? ''} placeholder="https://..." onChange={e => updateWidgetContent('featured_media_url', e.target.value)} />
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Colunas de Cards Duplos" isOpen={openAccordions.cardsCols !== false} onToggle={() => toggleAccordion('cardsCols')}>
                    {(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS).map((col: any, cIdx: number) => (
                      <div key={col.id || cIdx} style={{ background: '#f5f5f7', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #e5e5ea' }}>
                        <strong style={{ fontSize: 12, display: 'block', marginBottom: 8, color: '#1d1d1f' }}>Coluna {cIdx + 1}</strong>
                        
                        {/* Card Superior */}
                        <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, marginBottom: 8, border: '1px solid #e0e0e0' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#0071e3', display: 'block', marginBottom: 4 }}>Card Superior:</span>
                          <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                            <span className="elementor-control-label">Ícone</span>
                            <select className="elementor-select" value={col.top_card?.icon_type || 'tradein'} onChange={e => {
                              const newCols = JSON.parse(JSON.stringify(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS))
                              newCols[cIdx].top_card.icon_type = e.target.value
                              updateWidgetContent('columns', newCols)
                            }}>
                              <option value="tradein">Troca / Aparelho</option>
                              <option value="truck">Caminhão / Frete</option>
                              <option value="creditcard">Cartão de Crédito</option>
                              <option value="bag">Bolsa de Compras / App</option>
                              <option value="emoji">Emoji / Gravação</option>
                              <option value="logo">Logo / Custom</option>
                            </select>
                          </div>
                          <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                            <span className="elementor-control-label">Texto Normal (Antes)</span>
                            <input className="elementor-input" value={col.top_card?.title_prefix ?? ''} placeholder="Ex: Desfrute " onChange={e => {
                              const newCols = JSON.parse(JSON.stringify(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS))
                              newCols[cIdx].top_card.title_prefix = e.target.value
                              updateWidgetContent('columns', newCols)
                            }} />
                          </div>
                          <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                            <span className="elementor-control-label">Texto Destacado (Colorido)</span>
                            <input className="elementor-input" value={col.top_card?.title_highlight ?? ''} placeholder="Ex: de entrega expressa" onChange={e => {
                              const newCols = JSON.parse(JSON.stringify(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS))
                              newCols[cIdx].top_card.title_highlight = e.target.value
                              updateWidgetContent('columns', newCols)
                            }} />
                          </div>
                          <div className="elementor-control-row stacked">
                            <span className="elementor-control-label">Texto Normal (Depois)</span>
                            <input className="elementor-input" value={col.top_card?.title_suffix ?? ''} placeholder="Ex: e retire na loja." onChange={e => {
                              const newCols = JSON.parse(JSON.stringify(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS))
                              newCols[cIdx].top_card.title_suffix = e.target.value
                              updateWidgetContent('columns', newCols)
                            }} />
                          </div>
                        </div>

                        {/* Card Inferior */}
                        <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, border: '1px solid #e0e0e0' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#34c759', display: 'block', marginBottom: 4 }}>Card Inferior:</span>
                          <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                            <span className="elementor-control-label">Ícone</span>
                            <select className="elementor-select" value={col.bottom_card?.icon_type || 'truck'} onChange={e => {
                              const newCols = JSON.parse(JSON.stringify(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS))
                              newCols[cIdx].bottom_card.icon_type = e.target.value
                              updateWidgetContent('columns', newCols)
                            }}>
                              <option value="tradein">Troca / Aparelho</option>
                              <option value="truck">Caminhão / Frete</option>
                              <option value="creditcard">Cartão de Crédito</option>
                              <option value="bag">Bolsa de Compras / App</option>
                              <option value="emoji">Emoji / Gravação</option>
                              <option value="logo">Logo / Custom</option>
                            </select>
                          </div>
                          <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                            <span className="elementor-control-label">Texto Normal (Antes)</span>
                            <input className="elementor-input" value={col.bottom_card?.title_prefix ?? ''} placeholder="Ex: Pague com " onChange={e => {
                              const newCols = JSON.parse(JSON.stringify(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS))
                              newCols[cIdx].bottom_card.title_prefix = e.target.value
                              updateWidgetContent('columns', newCols)
                            }} />
                          </div>
                          <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                            <span className="elementor-control-label">Texto Destacado (Colorido)</span>
                            <input className="elementor-input" value={col.bottom_card?.title_highlight ?? ''} placeholder="Ex: desconto especial" onChange={e => {
                              const newCols = JSON.parse(JSON.stringify(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS))
                              newCols[cIdx].bottom_card.title_highlight = e.target.value
                              updateWidgetContent('columns', newCols)
                            }} />
                          </div>
                          <div className="elementor-control-row stacked">
                            <span className="elementor-control-label">Texto Normal (Depois)</span>
                            <input className="elementor-input" value={col.bottom_card?.title_suffix ?? ''} placeholder="Ex: à vista." onChange={e => {
                              const newCols = JSON.parse(JSON.stringify(obj.content?.columns || DEFAULT_BENEFIT_COLUMNS))
                              newCols[cIdx].bottom_card.title_suffix = e.target.value
                              updateWidgetContent('columns', newCols)
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </AccordionSection>
                </>
              )}

              {/* ── CARROSSEL (ECONOMIAS E OFERTAS / SPECIAL OFFERS SCROLLER) ── */}
              {item.type === 'widget' && isOffersCarousel && (
                <>
                  <AccordionSection title="Cabeçalho da Seção" isOpen={openAccordions.offersHeader !== false} onToggle={() => toggleAccordion('offersHeader')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Título em Negrito</span>
                      <input className="elementor-input" value={obj.content?.headline_bold ?? 'Economias e ofertas.'} placeholder="Ex: Economias e ofertas." onChange={e => updateWidgetContent('headline_bold', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Subtítulo (Cinza)</span>
                      <input className="elementor-input" value={obj.content?.headline_normal ?? 'Ofertas exclusivas, lojas especiais e muito mais.'} placeholder="Ex: Ofertas exclusivas..." onChange={e => updateWidgetContent('headline_normal', e.target.value)} />
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Cards de Ofertas" isOpen={openAccordions.offersCards !== false} onToggle={() => toggleAccordion('offersCards')}>
                    {(obj.content?.items || DEFAULT_OFFER_ITEMS).map((card: any, cIdx: number) => (
                      <div key={card.id || cIdx} style={{ background: '#f5f5f7', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #e5e5ea' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <strong style={{ fontSize: 12, color: '#1d1d1f' }}>Card #{cIdx + 1}</strong>
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...(obj.content?.items || DEFAULT_OFFER_ITEMS)]
                              list.splice(cIdx, 1)
                              updateWidgetContent('items', list)
                            }}
                            style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Excluir
                          </button>
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                          <span className="elementor-control-label">Sobretítulo (Eyebrow em Caixa Alta)</span>
                          <input className="elementor-input" value={card.eyebrow ?? ''} placeholder="OFERTAS ESPECIAIS" onChange={e => {
                            const list = [...(obj.content?.items || DEFAULT_OFFER_ITEMS)]
                            list[cIdx] = { ...list[cIdx], eyebrow: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                          <span className="elementor-control-label">Título Principal</span>
                          <textarea className="elementor-textarea" rows={2} value={card.title ?? ''} placeholder="Título do card..." onChange={e => {
                            const list = [...(obj.content?.items || DEFAULT_OFFER_ITEMS)]
                            list[cIdx] = { ...list[cIdx], title: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                          <span className="elementor-control-label">Descrição (Opcional)</span>
                          <input className="elementor-input" value={card.desc ?? ''} placeholder="Texto secundário..." onChange={e => {
                            const list = [...(obj.content?.items || DEFAULT_OFFER_ITEMS)]
                            list[cIdx] = { ...list[cIdx], desc: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                          <span className="elementor-control-label">URL da Imagem</span>
                          <input className="elementor-input" value={card.image ?? ''} placeholder="https://..." onChange={e => {
                            const list = [...(obj.content?.items || DEFAULT_OFFER_ITEMS)]
                            list[cIdx] = { ...list[cIdx], image: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginBottom: 6 }}>
                          <span className="elementor-control-label">Tema do Card</span>
                          <select className="elementor-select" value={card.theme || 'light'} onChange={e => {
                            const list = [...(obj.content?.items || DEFAULT_OFFER_ITEMS)]
                            list[cIdx] = { ...list[cIdx], theme: e.target.value }
                            updateWidgetContent('items', list)
                          }}>
                            <option value="light">Claro (Fundo Branco / Texto Escuro)</option>
                            <option value="dark">Escuro (Fundo Preto / Texto Branco)</option>
                          </select>
                        </div>
                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Link de Destino</span>
                          <input className="elementor-input" value={card.link ?? ''} placeholder="/ofertas" onChange={e => {
                            const list = [...(obj.content?.items || DEFAULT_OFFER_ITEMS)]
                            list[cIdx] = { ...list[cIdx], link: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const list = [...(obj.content?.items || DEFAULT_OFFER_ITEMS), {
                          id: `offer-${Date.now()}`,
                          eyebrow: 'NOVA OFERTA',
                          title: 'Economize em novos produtos selecionados.',
                          desc: 'Condições exclusivas por tempo limitado.',
                          image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
                          link: '#',
                          theme: 'light'
                        }]
                        updateWidgetContent('items', list)
                      }}
                      style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      + Adicionar Card de Oferta
                    </button>
                  </AccordionSection>
                </>
              )}

              {/* ── FEATURE CARDS GALLERY (GET TO KNOW APPLE CAROUSEL) ── */}
              {item.type === 'widget' && isFeatureCardsGallery && (
                <>
                  <AccordionSection title="Configurações do Carrossel" isOpen={openAccordions.fcConfig !== false} onToggle={() => toggleAccordion('fcConfig')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Título da Seção</span>
                      <input className="elementor-input" value={obj.content?.headline ?? 'Get to know iPad.'} placeholder="Ex: Conheça os Recursos" onChange={e => updateWidgetContent('headline', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Fonte de Dados</span>
                      <select className="elementor-select" value={obj.content?.data_source || 'manual'} onChange={e => updateWidgetContent('data_source', e.target.value)}>
                        <option value="manual">✎ Cards Personalizados (Manual)</option>
                        <option value="dynamic">⚡ Puxar Produtos / Categorias do Banco</option>
                      </select>
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Enquadramento / Sangria da Largura</span>
                      <select className="elementor-select" value={obj.content?.container_layout || 'bleed-right'} onChange={e => updateWidgetContent('container_layout', e.target.value)}>
                        <option value="bleed-right">Sangria Direita (100% Direita — Padrão Apple)</option>
                        <option value="bleed-left">Sangria Esquerda (100% Esquerda)</option>
                        <option value="full-width">Largura Total (100% Tela)</option>
                        <option value="boxed">Caixa Centralizada (1280px)</option>
                      </select>
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <span>Cards que rolam por clique</span>
                        <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.slides_to_scroll || 1} por vez</span>
                      </div>
                      <input type="range" min="1" max="4" step="1" value={obj.content?.slides_to_scroll || 1} onChange={e => updateWidgetContent('slides_to_scroll', Number(e.target.value))} />
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <span>Altura do Card (px)</span>
                        <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.card_height || 620}px</span>
                      </div>
                      <input type="range" min="460" max="780" step="20" value={obj.content?.card_height || 620} onChange={e => updateWidgetContent('card_height', Number(e.target.value))} />
                    </div>

                    <div className="elementor-control-row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                      <span className="elementor-control-label">Autoplay (Rolagem Automática)</span>
                      <input type="checkbox" checked={obj.content?.autoplay === true} onChange={e => updateWidgetContent('autoplay', e.target.checked)} />
                    </div>

                    <div className="elementor-control-row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                      <span className="elementor-control-label">Pausar ao passar o mouse</span>
                      <input type="checkbox" checked={obj.content?.pause_on_hover !== false} onChange={e => updateWidgetContent('pause_on_hover', e.target.checked)} />
                    </div>

                    <div className="elementor-control-row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                      <span className="elementor-control-label">Exibir Setas de Navegação</span>
                      <input type="checkbox" checked={obj.content?.show_arrows !== false} onChange={e => updateWidgetContent('show_arrows', e.target.checked)} />
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Posição das Setas</span>
                      <select className="elementor-select" value={obj.content?.arrows_position || 'bottom-right'} onChange={e => updateWidgetContent('arrows_position', e.target.value)}>
                        <option value="bottom-right">Inferior Direita (Padrão Apple)</option>
                        <option value="top-right">Superior Direita (Ao lado do Título)</option>
                        <option value="sides">Flutuantes nas Laterais</option>
                      </select>
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Cards da Galeria" isOpen={openAccordions.fcCards !== false} onToggle={() => toggleAccordion('fcCards')}>
                    {((Array.isArray(obj.content?.items) && obj.content.items.length > 0) ? obj.content.items : [
                      { id: 'ipados-apps', topic: 'iPadOS + Apps', headline: 'Janelas flexíveis. O paraíso dos multitarefas.', bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_ipados__e45197f15_large.jpg', link_url: '#' },
                      { id: 'apple-intelligence', topic: 'Apple Intelligence', headline: 'Útil sem esforço em todas as tarefas do dia.', bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_apple_intelligence__c2351ccf7_large.jpg', link_url: '#' },
                      { id: 'productivity', topic: 'Produtividade', headline: 'Seu local de trabalho agora é qualquer lugar.', bg_image: 'https://www.apple.com/v/ipad/home/ck/images/overview/get-to-know/fc_productivity__28abd3acd_large.jpg', link_url: '#' }
                    ]).map((cardItem: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 12, padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: '#1d1d1f' }}>Card {idx + 1}: {cardItem.topic}</span>
                          <button onClick={() => {
                            const list = [...(obj.content?.items || [])]
                            list.splice(idx, 1)
                            updateWidgetContent('items', list)
                          }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                        </div>
                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Tópico Superior</span>
                          <input className="elementor-input" value={cardItem.topic || ''} placeholder="Ex: iPadOS + Apps" onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], topic: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginTop: 6 }}>
                          <span className="elementor-control-label">Frase de Impacto (Headline)</span>
                          <input className="elementor-input" value={cardItem.headline || ''} placeholder="Ex: Janelas flexíveis..." onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], headline: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <span className="elementor-control-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Imagem de Fundo</span>
                          <ImageThumbnailBox
                            src={cardItem.bg_image || ''}
                            title="Foto do Card"
                            onChange={url => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], bg_image: url }
                              updateWidgetContent('items', list)
                            }}
                          />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginTop: 6 }}>
                          <span className="elementor-control-label">Link ou Conteúdo do Modal (+)</span>
                          <input className="elementor-input" value={cardItem.modal_content || cardItem.link_url || ''} placeholder="Texto do modal ao clicar ou /link" onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], modal_content: e.target.value, link_url: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const list = [...(obj.content?.items || []), { id: `card-${Date.now()}`, topic: 'Novo Destaque', headline: 'Inovação e performance.', bg_image: '', link_url: '#' }]
                      updateWidgetContent('items', list)
                    }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Card</button>
                  </AccordionSection>
                </>
              )}

              {/* ── APPLE IMAGE ACCORDION / FAQ (SIGNIFICANT OTHERS) ── */}
              {item.type === 'widget' && isAppleImageAccordion && (
                <>
                  <AccordionSection title="Cabeçalho & Layout" isOpen={openAccordions.imgAccLayout !== false} onToggle={() => toggleAccordion('imgAccLayout')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Título da Seção</span>
                      <input className="elementor-input" value={obj.content?.headline ?? 'Significant others.'} placeholder="Ex: Perguntas Frequentes" onChange={e => updateWidgetContent('headline', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Posição da Imagem</span>
                      <select className="elementor-select" value={obj.content?.image_position || 'right'} onChange={e => updateWidgetContent('image_position', e.target.value)}>
                        <option value="right">Direita (Texto à Esquerda)</option>
                        <option value="left">Esquerda (Texto à Direita)</option>
                      </select>
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Cor de Fundo do Card</span>
                      <input className="elementor-input" value={obj.content?.card_bg_color || '#fafafc'} placeholder="#fafafc" onChange={e => updateWidgetContent('card_bg_color', e.target.value)} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <span>Arredondamento da Imagem (px)</span>
                        <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.image_border_radius ?? 20}px</span>
                      </div>
                      <input type="range" min="0" max="40" step="2" value={obj.content?.image_border_radius ?? 20} onChange={e => updateWidgetContent('image_border_radius', Number(e.target.value))} />
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Itens do Acordeão / FAQ" isOpen={openAccordions.imgAccItems !== false} onToggle={() => toggleAccordion('imgAccItems')}>
                    {((Array.isArray(obj.content?.items) && obj.content.items.length > 0) ? obj.content.items : [
                      { id: 'item-1', title: 'iPad e iPhone', description: 'O iPad é perfeito para pegar o conteúdo que você captura no iPhone e dar vida a ele em uma tela imersiva.', image_url: 'https://www.apple.com/v/ipad/home/ck/images/overview/significant-others/ipad_iphone__fe7dacf06_large.jpg' },
                      { id: 'item-2', title: 'iPad e Mac', description: 'O iPad e o Mac foram feitos para trabalhar juntos no setup criativo definitivo.', image_url: 'https://www.apple.com/v/ipad/home/ck/images/overview/significant-others/ipad_mac__173801b7c_large.jpg' },
                      { id: 'item-3', title: 'iPad e Apple Watch', description: 'O iPad é uma ótima maneira de otimizar seus treinos enquanto acompanha seu progresso no Apple Watch.', image_url: 'https://www.apple.com/v/ipad/home/ck/images/overview/significant-others/ipad_watch__0802b0a9c_large.jpg' }
                    ]).map((accItem: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 12, padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: '#1d1d1f' }}>Pergunta / Item {idx + 1}</span>
                          <button onClick={() => {
                            const list = [...(obj.content?.items || [])]
                            list.splice(idx, 1)
                            updateWidgetContent('items', list)
                          }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                        </div>
                        <div className="elementor-control-row stacked">
                          <span className="elementor-control-label">Título da Pergunta / Destaque</span>
                          <input className="elementor-input" value={accItem.title || ''} placeholder="Ex: iPad e iPhone" onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], title: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div className="elementor-control-row stacked" style={{ marginTop: 6 }}>
                          <span className="elementor-control-label">Descrição / Resposta</span>
                          <textarea className="elementor-input" rows={3} value={accItem.description || ''} placeholder="Texto explicativo detalhado..." onChange={e => {
                            const list = [...(obj.content?.items || [])]
                            list[idx] = { ...list[idx], description: e.target.value }
                            updateWidgetContent('items', list)
                          }} />
                        </div>
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <span className="elementor-control-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Imagem Sincronizada</span>
                          <ImageThumbnailBox
                            src={accItem.image_url || ''}
                            title="Foto Sincronizada"
                            onChange={url => {
                              const list = [...(obj.content?.items || [])]
                              list[idx] = { ...list[idx], image_url: url }
                              updateWidgetContent('items', list)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const list = [...(obj.content?.items || []), { id: `item-${Date.now()}`, title: 'Nova Pergunta / Título', description: 'Descrição detalhada do recurso ou resposta da dúvida.', image_url: '' }]
                      updateWidgetContent('items', list)
                    }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Pergunta / Item</button>
                  </AccordionSection>
                </>
              )}

              {/* ── LINK IN BIO ── */}
              {item.type === 'widget' && isLinkInBio && (
                <AccordionSection title="Link in Bio" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Nome</span>
                    <input className="elementor-input" value={obj.content?.name || ''} placeholder="Meu Nome" onChange={e => updateWidgetContent('name', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Links (Label | URL por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.links) ? obj.content.links.map((l: any) => `${l.label || ''} | ${l.url || ''}`).join('\n') : ''} placeholder="Meu Site | https://meusite.com&#10;Instagram | https://instagram.com/..." onChange={e => updateWidgetContent('links', e.target.value.split('\n').filter(Boolean).map((line: string) => { const [label, url] = line.split('|').map((s: string) => s.trim()); return { label, url }; }))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── SUBSCRIBE ── */}
              {item.type === 'widget' && isSubscribe && (
                <AccordionSection title="Inscreva-se" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Placeholder do E-mail</span>
                    <input className="elementor-input" value={obj.content?.placeholder || 'Seu e-mail'} onChange={e => updateWidgetContent('placeholder', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input className="elementor-input" value={obj.content?.button_text || 'Inscrever'} onChange={e => updateWidgetContent('button_text', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── FEATURES ── */}
              {item.type === 'widget' && isFeatures && (
                <AccordionSection title="Recursos" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título 1</span>
                    <input className="elementor-input" value={obj.content?.feature1_title || 'Recurso 1'} onChange={e => updateWidgetContent('feature1_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Descrição 1</span>
                    <input className="elementor-input" value={obj.content?.feature1_desc || ''} onChange={e => updateWidgetContent('feature1_desc', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título 2</span>
                    <input className="elementor-input" value={obj.content?.feature2_title || 'Recurso 2'} onChange={e => updateWidgetContent('feature2_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título 3</span>
                    <input className="elementor-input" value={obj.content?.feature3_title || 'Recurso 3'} onChange={e => updateWidgetContent('feature3_title', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── SLIDES ── */}
              {item.type === 'widget' && isSlides && (
                <AccordionSection title="Slides" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || 'Slide'} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo</span>
                    <input className="elementor-input" value={obj.content?.subtitle || ''} onChange={e => updateWidgetContent('subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo</span>
                    <input type="color" value={obj.content?.bg_color || '#0071e3'} onChange={e => updateWidgetContent('bg_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── NAV MENU / MEGA MENU ── */}
              {item.type === 'widget' && isNavMenu && (
                <AccordionSection title="Menu de Navegação" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Itens (Label | URL por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.items) ? obj.content.items.map((i: any) => `${i.label || ''} | ${i.url || ''}`).join('\n') : ''} placeholder="Início | /&#10;Produtos | /produtos&#10;Contato | /contato" onChange={e => updateWidgetContent('items', e.target.value.split('\n').filter(Boolean).map((line: string) => { const [label, url] = line.split('|').map((s: string) => s.trim()); return { label, url }; }))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── POSTS ── */}
              {item.type === 'widget' && isPosts && (
                <AccordionSection title="Posts" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || 'Posts'} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Colunas</span>
                      <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.columns || 3}</span>
                    </div>
                    <input type="range" min="1" max="6" value={obj.content?.columns || 3} onChange={e => updateWidgetContent('columns', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0071e3' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── REVIEWS PRO ── */}
              {item.type === 'widget' && isReviewsPro && (
                <AccordionSection title="Avaliações" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Reviewer 1</span>
                    <input className="elementor-input" value={obj.content?.review1_author || 'Cliente'} onChange={e => updateWidgetContent('review1_author', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto 1</span>
                    <textarea className="elementor-textarea" rows={2} value={obj.content?.review1_text || ''} onChange={e => updateWidgetContent('review1_text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Reviewer 2</span>
                    <input className="elementor-input" value={obj.content?.review2_author || 'Empresa'} onChange={e => updateWidgetContent('review2_author', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto 2</span>
                    <textarea className="elementor-textarea" rows={2} value={obj.content?.review2_text || ''} onChange={e => updateWidgetContent('review2_text', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── ANIMATED HEADLINE PRO ── */}
              {item.type === 'widget' && isAnimatedHeadlinePro && (
                <AccordionSection title="Título Animado" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto</span>
                    <input className="elementor-input" value={obj.content?.text || ''} placeholder="Meu título" onChange={e => updateWidgetContent('text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Palavra Animada</span>
                    <input className="elementor-input" value={obj.content?.animated_word || ''} placeholder="Animado" onChange={e => updateWidgetContent('animated_word', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── BREADCRUMBS PRO ── */}
              {item.type === 'widget' && isBreadcrumbsPro && (
                <AccordionSection title="Breadcrumb" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Página Atual</span>
                    <input className="elementor-input" value={obj.content?.current || 'Página'} onChange={e => updateWidgetContent('current', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── SHARE BUTTONS PRO ── */}
              {item.type === 'widget' && isShareButtonsPro && (
                <AccordionSection title="Botões de Compartilhar" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || 'Compartilhar'} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">URL para Compartilhar</span>
                    <input className="elementor-input" value={obj.content?.share_url || ''} placeholder="https://..." onChange={e => updateWidgetContent('share_url', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Redes Sociais</span>
                    {['facebook', 'twitter', 'whatsapp', 'linkedin', 'telegram', 'email', 'pinterest'].map(network => (
                      <label key={network} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>
                        <input type="checkbox" checked={(obj.content?.networks || ['facebook', 'twitter', 'whatsapp', 'linkedin']).includes(network)} onChange={e => { const current = obj.content?.networks || ['facebook', 'twitter', 'whatsapp', 'linkedin']; const updated = e.target.checked ? [...current, network] : current.filter((n: string) => n !== network); updateWidgetContent('networks', updated); }} />
                        <span style={{ textTransform: 'capitalize' }}>{network}</span>
                      </label>
                    ))}
                  </div>
                </AccordionSection>
              )}

              {/* ── TABLE OF CONTENTS PRO ── */}
              {item.type === 'widget' && isTableOfContentsPro && (
                <AccordionSection title="Índice de Conteúdo" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Itens (um por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.items) ? obj.content.items.map((i: any) => i.label || i).join('\n') : 'Seção 1\nSeção 2\nSeção 3'} onChange={e => updateWidgetContent('items', e.target.value.split('\n').filter(Boolean).map((label: string) => ({ label })))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── CUSTOM CODE PRO ── */}
              {item.type === 'widget' && isCustomCodePro && (
                <AccordionSection title="Código Customizado" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Código HTML/JS</span>
                    <textarea className="elementor-textarea" rows={6} style={{ fontFamily: 'monospace', fontSize: 12 }} value={obj.content?.code || ''} placeholder="<div>Seu código aqui</div>" onChange={e => updateWidgetContent('code', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── PAYPAL ── */}
              {item.type === 'widget' && isPaypal && (
                <AccordionSection title="PayPal" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input className="elementor-input" value={obj.content?.label || 'Pagar com PayPal'} onChange={e => updateWidgetContent('label', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── STRIPE ── */}
              {item.type === 'widget' && isStripe && (
                <AccordionSection title="Stripe" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Nome do Produto</span>
                    <input className="elementor-input" value={obj.content?.product_name || ''} placeholder="Produto" onChange={e => updateWidgetContent('product_name', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Preço (centavos)</span>
                    <input className="elementor-input" type="number" value={obj.content?.price || ''} placeholder="5000" onChange={e => updateWidgetContent('price', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Moeda</span>
                    <select className="elementor-select" value={obj.content?.currency || 'BRL'} onChange={e => updateWidgetContent('currency', e.target.value)}>
                      <option value="BRL">BRL (R$)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input className="elementor-input" value={obj.content?.label || 'Pagar com Stripe'} onChange={e => updateWidgetContent('label', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor do Botão</span>
                    <input type="color" value={obj.content?.btn_color || '#635bff'} onChange={e => updateWidgetContent('btn_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── CART / MINI CART ── */}
              {item.type === 'widget' && isCart && (
                <AccordionSection title="Carrinho" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || 'Carrinho'} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── MY ACCOUNT ── */}
              {item.type === 'widget' && isMyAccount && (
                <AccordionSection title="Minha Conta" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || 'Minha Conta'} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── CHECKOUT ── */}
              {item.type === 'widget' && isCheckout && (
                <AccordionSection title="Checkout" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || 'Checkout'} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── LOTTIE PRO ── */}
              {item.type === 'widget' && isLottiePro && (
                <AccordionSection title="Lottie Pro" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">URL da Animação JSON</span>
                    <input className="elementor-input" value={obj.content?.url || ''} placeholder="https://lottie.host/..." onChange={e => updateWidgetContent('url', e.target.value)} />
                  </div>
                  <ControlRow label="Reproduzir Automaticamente" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.autoplay !== false} onChange={v => updateWidgetContent('autoplay', v)} />
                  </ControlRow>
                  <ControlRow label="Loop" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.loop !== false} onChange={v => updateWidgetContent('loop', v)} />
                  </ControlRow>
                  <ControlRow label="Velocidade" style={{ marginTop: 8 }}>
                    <input type="range" min="0.1" max="3" step="0.1" value={obj.content?.speed || 1}
                      onChange={e => updateWidgetContent('speed', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#0071e3' }} />
                  </ControlRow>
                  <ControlRow label="Altura" style={{ marginTop: 8 }}>
                    <input className="elementor-input" value={obj.content?.height || ''} placeholder="200"
                      onChange={e => updateWidgetContent('height', e.target.value)} />
                  </ControlRow>
                  <ControlRow label="Largura" style={{ marginTop: 8 }}>
                    <input className="elementor-input" value={obj.content?.width || ''} placeholder="100%"
                      onChange={e => updateWidgetContent('width', e.target.value)} />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* ── CODE HIGHLIGHT PRO ── */}
              {item.type === 'widget' && isCodeHighlightPro && (
                <AccordionSection title="Code Highlight" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <ControlRow label="Linguagem">
                    <select className="elementor-select" value={obj.content?.language || 'javascript'} onChange={e => updateWidgetContent('language', e.target.value)}>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="python">Python</option>
                      <option value="php">PHP</option>
                      <option value="json">JSON</option>
                      <option value="sql">SQL</option>
                      <option value="bash">Bash</option>
                      <option value="markdown">Markdown</option>
                      <option value="jsx">JSX</option>
                      <option value="yaml">YAML</option>
                    </select>
                  </ControlRow>
                  <ControlRow label="Tema" style={{ marginTop: 8 }}>
                    <select className="elementor-select" value={obj.content?.theme || 'dark'} onChange={e => updateWidgetContent('theme', e.target.value)}>
                      <option value="dark">Escuro</option>
                      <option value="light">Claro</option>
                      <option value="monokai">Monokai</option>
                      <option value="solarized">Solarized</option>
                    </select>
                  </ControlRow>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Código</span>
                    <textarea className="elementor-textarea" rows={8} style={{ fontFamily: 'monospace', fontSize: 12, background: '#1d1d1f', color: '#f5f5f7', borderRadius: 8, padding: 12 }} value={obj.content?.code || ''} placeholder="// Seu código aqui" onChange={e => updateWidgetContent('code', e.target.value)} />
                  </div>
                  <ControlRow label="Mostrar Numeros de Linha" style={{ marginTop: 8 }}>
                    <ToggleSwitch checked={obj.content?.show_line_numbers !== false} onChange={v => updateWidgetContent('show_line_numbers', v)} />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* ── BOTÕES FLUTUANTES ── */}
              {item.type === 'widget' && isFloatingButtons && (
                <AccordionSection title="Botões Flutuantes" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  {(Array.isArray(obj.content?.buttons) ? obj.content.buttons : []).map((btn: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: 10, padding: 10, background: '#f5f5f7', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 12, color: '#1d1d1f' }}>Botão {idx + 1}</span>
                        <button onClick={() => { const btns = [...(Array.isArray(obj.content?.buttons) ? obj.content.buttons : [])]; btns.splice(idx, 1); updateWidgetContent('buttons', btns); }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                      </div>
                      <input className="elementor-input" value={btn.label || ''} placeholder="Texto do botão" onChange={e => { const btns = [...(Array.isArray(obj.content?.buttons) ? obj.content.buttons : [])]; btns[idx] = { ...btns[idx], label: e.target.value }; updateWidgetContent('buttons', btns); }} />
                      <input className="elementor-input" style={{ marginTop: 4 }} value={btn.url || ''} placeholder="Link (URL)" onChange={e => { const btns = [...(Array.isArray(obj.content?.buttons) ? obj.content.buttons : [])]; btns[idx] = { ...btns[idx], url: e.target.value }; updateWidgetContent('buttons', btns); }} />
                      <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                        <input className="elementor-input" style={{ flex: 1 }} value={btn.icon || ''} placeholder="Ícone" onChange={e => { const btns = [...(Array.isArray(obj.content?.buttons) ? obj.content.buttons : [])]; btns[idx] = { ...btns[idx], icon: e.target.value }; updateWidgetContent('buttons', btns); }} />
                        <input type="color" value={btn.color || '#0071e3'} onChange={e => { const btns = [...(Array.isArray(obj.content?.buttons) ? obj.content.buttons : [])]; btns[idx] = { ...btns[idx], color: e.target.value }; updateWidgetContent('buttons', btns); }} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                        <input type="color" value={btn.bg_color || '#ffffff'} onChange={e => { const btns = [...(Array.isArray(obj.content?.buttons) ? obj.content.buttons : [])]; btns[idx] = { ...btns[idx], bg_color: e.target.value }; updateWidgetContent('buttons', btns); }} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { const btns = [...(Array.isArray(obj.content?.buttons) ? obj.content.buttons : []), { label: '', url: '', icon: '', color: '#ffffff', bg_color: '#0071e3' }]; updateWidgetContent('buttons', btns); }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Botão</button>
                  <ControlRow label="Posição" style={{ marginTop: 8 }}>
                    <select className="elementor-select" value={obj.content?.position || 'bottom-right'} onChange={e => updateWidgetContent('position', e.target.value)}>
                      <option value="bottom-right">Inferior Direita</option>
                      <option value="bottom-left">Inferior Esquerda</option>
                      <option value="top-right">Superior Direita</option>
                      <option value="top-left">Superior Esquerda</option>
                    </select>
                  </ControlRow>
                </AccordionSection>
              )}

              {/* ── CTA (Call to Action) ── */}
              {item.type === 'widget' && obj.type === 'cta' && (
                <AccordionSection title="Call to Action" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.cta_title || ''} placeholder="Título CTA" onChange={e => updateWidgetContent('cta_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto</span>
                    <textarea className="elementor-textarea" rows={2} value={obj.content?.cta_text || ''} onChange={e => updateWidgetContent('cta_text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input className="elementor-input" value={obj.content?.cta_button || ''} placeholder="Saiba Mais" onChange={e => updateWidgetContent('cta_button', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Link do Botão</span>
                    <input className="elementor-input" value={obj.content?.cta_link || ''} placeholder="https://..." onChange={e => updateWidgetContent('cta_link', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo</span>
                    <input type="color" value={obj.content?.bg_color || '#0071e3'} onChange={e => updateWidgetContent('bg_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── PREÇO ── */}
              {item.type === 'widget' && obj.type === 'price' && (
                <AccordionSection title="Preço" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Preço</span>
                    <input className="elementor-input" value={obj.content?.price || ''} placeholder="R$ 199,90" onChange={e => updateWidgetContent('price', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── CITAÇÃO ── */}
              {item.type === 'widget' && obj.type === 'quote' && (
                <AccordionSection title="Citação" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto da Citação</span>
                    <textarea className="elementor-textarea" rows={3} value={obj.content?.quote_text || obj.content?.text || ''} onChange={e => { updateWidgetContent('quote_text', e.target.value); updateWidgetContent('text', e.target.value) }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Autor</span>
                    <input className="elementor-input" value={obj.content?.quote_author || ''} onChange={e => updateWidgetContent('quote_author', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── LISTA ── */}
              {item.type === 'widget' && obj.type === 'list' && (
                <AccordionSection title="Lista de Ícones" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Itens (um por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.list_items) ? obj.content.list_items.join('\n') : ''} placeholder="Item 1&#10;Item 2&#10;Item 3" onChange={e => updateWidgetContent('list_items', e.target.value.split('\n').filter(Boolean))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── TABELA ── */}
              {item.type === 'widget' && obj.type === 'table' && (
                <AccordionSection title="Tabela" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Cabeçalhos (separados por |)</span>
                    <input className="elementor-input" value={Array.isArray(obj.content?.table_headers) ? obj.content.table_headers.join(' | ') : ''} placeholder="Coluna 1 | Coluna 2 | Coluna 3" onChange={e => updateWidgetContent('table_headers', e.target.value.split('|').map((s: string) => s.trim()))} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Linhas (valores separados por |, linhas por ;)</span>
                    <textarea className="elementor-textarea" rows={3} value={Array.isArray(obj.content?.table_rows) ? obj.content.table_rows.map((r: any) => Array.isArray(r) ? r.join(' | ') : r).join('\n') : ''} placeholder="A1 | A2 | A3&#10;B1 | B2 | B3" onChange={e => updateWidgetContent('table_rows', e.target.value.split('\n').filter(Boolean).map((line: string) => line.split('|').map((s: string) => s.trim())))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── EMBED ── */}
              {item.type === 'widget' && obj.type === 'embed' && (
                <AccordionSection title="Embed" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Código HTML/Embed</span>
                    <textarea className="elementor-textarea" rows={4} style={{ fontFamily: 'monospace', fontSize: 12 }} value={obj.content?.html_code || ''} placeholder="<iframe src='...' />" onChange={e => updateWidgetContent('html_code', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── PASSOS ── */}
              {item.type === 'widget' && obj.type === 'steps' && (
                <AccordionSection title="Passos" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  {(Array.isArray(obj.content?.steps) ? obj.content.steps : []).map((step: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: 12, padding: 12, background: '#f5f5f7', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#1d1d1f' }}>Passo {idx + 1}</span>
                        <button onClick={() => { const steps = [...(Array.isArray(obj.content?.steps) ? obj.content.steps : [])]; steps.splice(idx, 1); updateWidgetContent('steps', steps); }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 12 }}>Remover</button>
                      </div>
                      <input className="elementor-input" value={step.title || ''} placeholder="Título do passo" onChange={e => { const steps = [...(Array.isArray(obj.content?.steps) ? obj.content.steps : [])]; steps[idx] = { ...steps[idx], title: e.target.value }; updateWidgetContent('steps', steps); }} />
                      <textarea className="elementor-textarea" rows={2} style={{ marginTop: 6 }} value={step.content || ''} placeholder="Descrição do passo" onChange={e => { const steps = [...(Array.isArray(obj.content?.steps) ? obj.content.steps : [])]; steps[idx] = { ...steps[idx], content: e.target.value }; updateWidgetContent('steps', steps); }} />
                      <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                        <input className="elementor-input" style={{ flex: 1 }} value={step.icon || ''} placeholder="Ícone (ex: check, star)" onChange={e => { const steps = [...(Array.isArray(obj.content?.steps) ? obj.content.steps : [])]; steps[idx] = { ...steps[idx], icon: e.target.value }; updateWidgetContent('steps', steps); }} />
                        <input type="color" value={step.color || '#0071e3'} onChange={e => { const steps = [...(Array.isArray(obj.content?.steps) ? obj.content.steps : [])]; steps[idx] = { ...steps[idx], color: e.target.value }; updateWidgetContent('steps', steps); }} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { const steps = [...(Array.isArray(obj.content?.steps) ? obj.content.steps : []), { title: '', content: '', icon: '', color: '#0071e3' }]; updateWidgetContent('steps', steps); }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Passo</button>
                </AccordionSection>
              )}

              {/* ── IMAGEM + TEXTO ── */}
              {item.type === 'widget' && obj.type === 'imageText' && (
                <AccordionSection title="Imagem + Texto" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">URL da Imagem</span>
                    <input className="elementor-input" value={obj.content?.image || ''} placeholder="https://..." onChange={e => updateWidgetContent('image', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || ''} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto</span>
                    <textarea className="elementor-textarea" rows={3} value={obj.content?.text || ''} onChange={e => updateWidgetContent('text', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── ESPECIFICAÇÕES ── */}
              {item.type === 'widget' && obj.type === 'specifications' && (
                <AccordionSection title="Especificações" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Itens (Chave: Valor por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.spec_items) ? obj.content.spec_items.map((s: any) => `${s.key || ''}: ${s.value || ''}`).join('\n') : ''} placeholder="Peso: 1.5kg&#10;Dimensões: 30x20x10cm" onChange={e => updateWidgetContent('spec_items', e.target.value.split('\n').filter(Boolean).map((line: string) => { const [key, ...rest] = line.split(':'); return { key: key?.trim() || '', value: rest.join(':').trim() }; }))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── BANNER ── */}
              {item.type === 'widget' && obj.type === 'banner' && (
                <AccordionSection title="Banner" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">URL da Imagem</span>
                    <input className="elementor-input" value={obj.content?.image || ''} placeholder="https://..." onChange={e => updateWidgetContent('image', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || ''} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo</span>
                    <input className="elementor-input" value={obj.content?.subtitle || ''} onChange={e => updateWidgetContent('subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo</span>
                    <input type="color" value={obj.content?.bg_color || '#0071e3'} onChange={e => updateWidgetContent('bg_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── CARROSSEL ── */}
              {item.type === 'widget' && obj.type === 'carousel' && (
                <AccordionSection title="Carrossel" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">URLs das Imagens (uma por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.carousel_items) ? obj.content.carousel_items.map((i: any) => i.url || i).join('\n') : ''} placeholder="https://img1.jpg&#10;https://img2.jpg" onChange={e => updateWidgetContent('carousel_items', e.target.value.split('\n').filter(Boolean).map((url: string) => ({ url: url.trim() })))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── HOTSPOT ── */}
              {item.type === 'widget' && isHotspot && (
                <AccordionSection title="Hotspot" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">URL da Imagem</span>
                    <input className="elementor-input" value={obj.content?.image || ''} placeholder="https://..." onChange={e => updateWidgetContent('image', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor dos Pontos</span>
                    <input type="color" value={obj.content?.dot_color || '#0071e3'} onChange={e => updateWidgetContent('dot_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Hotspots (X% | Y% | Texto por linha)</span>
                    <textarea className="elementor-textarea" rows={3} value={Array.isArray(obj.content?.hotspots) ? obj.content.hotspots.map((h: any) => `${h.x || 50} | ${h.y || 50} | ${h.text || ''}`).join('\n') : ''} placeholder="50 | 30 | Texto do ponto&#10;20 | 70 | Outro ponto" onChange={e => updateWidgetContent('hotspots', e.target.value.split('\n').filter(Boolean).map((line: string) => { const parts = line.split('|').map((s: string) => s.trim()); return { x: parseInt(parts[0]) || 50, y: parseInt(parts[1]) || 50, text: parts[2] || '' }; }))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── PORTFOLIO ── */}
              {item.type === 'widget' && isPortfolio && (
                <AccordionSection title="Portfólio" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Colunas</span>
                      <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.columns || 3}</span>
                    </div>
                    <input type="range" min="1" max="6" value={obj.content?.columns || 3} onChange={e => updateWidgetContent('columns', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0071e3' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── PREÇO TABLE (original) ── */}
              {item.type === 'widget' && isPriceTable && (
                <AccordionSection title="Tabela de Preços" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Plano</span>
                    <input className="elementor-input" value={obj.content?.plan || 'Básico'} onChange={e => updateWidgetContent('plan', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Preço</span>
                    <input className="elementor-input" value={obj.content?.price || 'R$ 99'} onChange={e => updateWidgetContent('price', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Período</span>
                    <input className="elementor-input" value={obj.content?.period || '/mês'} onChange={e => updateWidgetContent('period', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input className="elementor-input" value={obj.content?.button_label || 'Escolher'} onChange={e => updateWidgetContent('button_label', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── LISTA DE PREÇOS ── */}
              {item.type === 'widget' && obj.type === 'priceList' && (
                <AccordionSection title="Lista de Preços" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Itens (Label | Preço por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.items) ? obj.content.items.map((i: any) => `${i.label || ''} | ${i.price || ''}`).join('\n') : ''} placeholder="Serviço 1 | R$ 100&#10;Serviço 2 | R$ 200" onChange={e => updateWidgetContent('items', e.target.value.split('\n').filter(Boolean).map((line: string) => { const [label, price] = line.split('|').map((s: string) => s.trim()); return { label, price }; }))} />
                  </div>
                </AccordionSection>
              )}

              {/* ── LISTA DE PREÇOS PRO ── */}
              {item.type === 'widget' && isPriceListPro && (
                <AccordionSection title="Lista de Preços Pro" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  {(Array.isArray(obj.content?.items) ? obj.content.items : []).map((item: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: 10, padding: 10, background: '#f5f5f7', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 12, color: '#1d1d1f' }}>Item {idx + 1}</span>
                        <button onClick={() => { const items = [...(Array.isArray(obj.content?.items) ? obj.content.items : [])]; items.splice(idx, 1); updateWidgetContent('items', items); }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                      </div>
                      <input className="elementor-input" value={item.label || ''} placeholder="Nome do serviço" onChange={e => { const items = [...(Array.isArray(obj.content?.items) ? obj.content.items : [])]; items[idx] = { ...items[idx], label: e.target.value }; updateWidgetContent('items', items); }} />
                      <input className="elementor-input" style={{ marginTop: 4 }} value={item.price || ''} placeholder="R$ 0,00" onChange={e => { const items = [...(Array.isArray(obj.content?.items) ? obj.content.items : [])]; items[idx] = { ...items[idx], price: e.target.value }; updateWidgetContent('items', items); }} />
                      <input className="elementor-input" style={{ marginTop: 4 }} value={item.description || ''} placeholder="Descrição (opcional)" onChange={e => { const items = [...(Array.isArray(obj.content?.items) ? obj.content.items : [])]; items[idx] = { ...items[idx], description: e.target.value }; updateWidgetContent('items', items); }} />
                    </div>
                  ))}
                  <button onClick={() => { const items = [...(Array.isArray(obj.content?.items) ? obj.content.items : []), { label: '', price: '', description: '' }]; updateWidgetContent('items', items); }} style={{ width: '100%', padding: '10px 0', border: '2px dashed #0071e3', borderRadius: 8, background: 'transparent', color: '#0071e3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Adicionar Item</button>
                  <ControlRow label="Alinhamento" style={{ marginTop: 8 }}>
                    <select className="elementor-select" value={obj.content?.align || 'left'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateWidgetContent('align', e.target.value)}>
                      <option value="left">Esquerda</option>
                      <option value="center">Centro</option>
                      <option value="right">Direita</option>
                    </select>
                  </ControlRow>
                </AccordionSection>
              )}

              {/* ── TÍTULO ANIMADO ── */}
              {item.type === 'widget' && isAnimatedHeadline && (
                <AccordionSection title="Título Animado" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto</span>
                    <input className="elementor-input" value={obj.content?.text || ''} placeholder="Meu título" onChange={e => updateWidgetContent('text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Palavra Animada</span>
                    <input className="elementor-input" value={obj.content?.animated_word || ''} placeholder="Animado" onChange={e => updateWidgetContent('animated_word', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor do Destaque</span>
                    <input type="color" value={obj.content?.highlight_color || '#0071e3'} onChange={e => updateWidgetContent('highlight_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── TESTIMONIAL CAROUSEL ── */}
              {item.type === 'widget' && isTestimonialCarousel && (
                <AccordionSection title="Carrossel de Depoimentos" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Autor 1</span>
                    <input className="elementor-input" value={obj.content?.author || 'Cliente'} onChange={e => updateWidgetContent('author', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto 1</span>
                    <textarea className="elementor-textarea" rows={2} value={obj.content?.text || ''} onChange={e => updateWidgetContent('text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cargo</span>
                    <input className="elementor-input" value={obj.content?.role || ''} onChange={e => updateWidgetContent('role', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── DEPOIMENTOS ── */}
              {item.type === 'widget' && isTestimonials && (
                <AccordionSection title="Depoimento" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto do Depoimento</span>
                    <textarea className="elementor-textarea" rows={3} value={obj.content?.text || ''} onChange={e => updateWidgetContent('text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Autor</span>
                    <input className="elementor-input" value={obj.content?.author || obj.content?.name || ''} onChange={e => { updateWidgetContent('author', e.target.value); updateWidgetContent('name', e.target.value) }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cargo</span>
                    <input className="elementor-input" value={obj.content?.role || ''} onChange={e => updateWidgetContent('role', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── FLIP BOX COLORS ── */}
              {item.type === 'widget' && isFlipBox && (
                <AccordionSection title="Flip Box 3D" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título (Frente)</span>
                    <input className="elementor-input" value={obj.content?.front_title || ''} placeholder="Frente" onChange={e => updateWidgetContent('front_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo (Frente)</span>
                    <input className="elementor-input" value={obj.content?.front_subtitle || ''} onChange={e => updateWidgetContent('front_subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor Fundo (Frente)</span>
                    <input type="color" value={obj.content?.front_bg || '#1d1d1f'} onChange={e => updateWidgetContent('front_bg', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor Texto (Frente)</span>
                    <input type="color" value={obj.content?.front_color || '#ffffff'} onChange={e => updateWidgetContent('front_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título (Verso)</span>
                    <input className="elementor-input" value={obj.content?.back_title || ''} placeholder="Verso" onChange={e => updateWidgetContent('back_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo (Verso)</span>
                    <input className="elementor-input" value={obj.content?.back_subtitle || ''} onChange={e => updateWidgetContent('back_subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor Fundo (Verso)</span>
                    <input type="color" value={obj.content?.back_bg || '#0071e3'} onChange={e => updateWidgetContent('back_bg', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor Texto (Verso)</span>
                    <input type="color" value={obj.content?.back_color || '#ffffff'} onChange={e => updateWidgetContent('back_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── CTA PRO COMPLETO ── */}
              {item.type === 'widget' && isCtaPro && (
                <AccordionSection title="Call to Action" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || ''} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo</span>
                    <textarea className="elementor-textarea" rows={2} value={obj.content?.subtitle || ''} onChange={e => updateWidgetContent('subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input className="elementor-input" value={obj.content?.button_text || ''} onChange={e => updateWidgetContent('button_text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">URL do Botão</span>
                    <input className="elementor-input" value={obj.content?.button_url || ''} onChange={e => updateWidgetContent('button_url', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo</span>
                    <input type="color" value={obj.content?.background || '#0071e3'} onChange={e => updateWidgetContent('background', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor do Texto</span>
                    <input type="color" value={obj.content?.color || '#ffffff'} onChange={e => updateWidgetContent('color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor Fundo Botão</span>
                    <input type="color" value={obj.content?.btn_bg || '#ffffff'} onChange={e => updateWidgetContent('btn_bg', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor Texto Botão</span>
                    <input type="color" value={obj.content?.btn_color || '#1d1d1f'} onChange={e => updateWidgetContent('btn_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── POSTS COMPLETO ── */}
              {item.type === 'widget' && isPosts && (
                <AccordionSection title="Posts" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || 'Posts'} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Colunas</span>
                      <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.columns || 3}</span>
                    </div>
                    <input type="range" min="1" max="6" value={obj.content?.columns || 3} onChange={e => updateWidgetContent('columns', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0071e3' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Quantidade</span>
                      <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.count || 3}</span>
                    </div>
                    <input type="range" min="1" max="12" value={obj.content?.count || 3} onChange={e => updateWidgetContent('count', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0071e3' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── ANIMATED HEADLINE PRO COMPLETO ── */}
              {item.type === 'widget' && isAnimatedHeadlinePro && (
                <AccordionSection title="Título Animado" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto</span>
                    <input className="elementor-input" value={obj.content?.text || ''} onChange={e => updateWidgetContent('text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Palavra Animada</span>
                    <input className="elementor-input" value={obj.content?.animated_word || ''} onChange={e => updateWidgetContent('animated_word', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor do Destaque</span>
                    <input type="color" value={obj.content?.highlight_color || '#0071e3'} onChange={e => updateWidgetContent('highlight_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── SLIDES COMPLETO ── */}
              {item.type === 'widget' && isSlides && (
                <AccordionSection title="Slides" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || ''} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Subtítulo</span>
                    <input className="elementor-input" value={obj.content?.subtitle || ''} onChange={e => updateWidgetContent('subtitle', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo 1</span>
                    <input type="color" value={obj.content?.bg_color || '#0071e3'} onChange={e => updateWidgetContent('bg_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo 2</span>
                    <input type="color" value={obj.content?.bg_color2 || '#00b4d8'} onChange={e => updateWidgetContent('bg_color2', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── NAV MENU COMPLETO ── */}
              {item.type === 'widget' && isNavMenu && (
                <AccordionSection title="Menu de Navegação" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Itens (Label | URL por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.items) ? obj.content.items.map((i: any) => `${i.label || ''} | ${i.url || ''}`).join('\n') : ''} placeholder="Início | /&#10;Produtos | /produtos" onChange={e => updateWidgetContent('items', e.target.value.split('\n').filter(Boolean).map((line: string) => { const [label, url] = line.split('|').map((s: string) => s.trim()); return { label, url }; }))} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor de Fundo</span>
                    <input type="color" value={obj.content?.background || '#ffffff'} onChange={e => updateWidgetContent('background', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor dos Links</span>
                    <input type="color" value={obj.content?.link_color || '#1d1d1f'} onChange={e => updateWidgetContent('link_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── FEATURES COMPLETO ── */}
              {item.type === 'widget' && isFeatures && (
                <AccordionSection title="Recursos" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Colunas</span>
                      <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.columns || 3}</span>
                    </div>
                    <input type="range" min="1" max="6" value={obj.content?.columns || 3} onChange={e => updateWidgetContent('columns', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0071e3' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor do Ícone</span>
                    <input type="color" value={obj.content?.icon_bg || '#0071e3'} onChange={e => updateWidgetContent('icon_bg', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título 1</span>
                    <input className="elementor-input" value={obj.content?.feature1_title || ''} onChange={e => updateWidgetContent('feature1_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Descrição 1</span>
                    <input className="elementor-input" value={obj.content?.feature1_desc || ''} onChange={e => updateWidgetContent('feature1_desc', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título 2</span>
                    <input className="elementor-input" value={obj.content?.feature2_title || ''} onChange={e => updateWidgetContent('feature2_title', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Título 3</span>
                    <input className="elementor-input" value={obj.content?.feature3_title || ''} onChange={e => updateWidgetContent('feature3_title', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── REVIEWS PRO COMPLETO ── */}
              {item.type === 'widget' && isReviewsPro && (
                <AccordionSection title="Avaliações" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Reviewer 1</span>
                    <input className="elementor-input" value={obj.content?.review1_author || 'Cliente'} onChange={e => updateWidgetContent('review1_author', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto 1</span>
                    <textarea className="elementor-textarea" rows={2} value={obj.content?.review1_text || ''} onChange={e => updateWidgetContent('review1_text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Reviewer 2</span>
                    <input className="elementor-input" value={obj.content?.review2_author || 'Empresa'} onChange={e => updateWidgetContent('review2_author', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto 2</span>
                    <textarea className="elementor-textarea" rows={2} value={obj.content?.review2_text || ''} onChange={e => updateWidgetContent('review2_text', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── LINK IN BIO COMPLETO ── */}
              {item.type === 'widget' && isLinkInBio && (
                <AccordionSection title="Link in Bio" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Nome</span>
                    <input className="elementor-input" value={obj.content?.name || ''} onChange={e => updateWidgetContent('name', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Links (Label | URL por linha)</span>
                    <textarea className="elementor-textarea" rows={4} value={Array.isArray(obj.content?.links) ? obj.content.links.map((l: any) => `${l.label || ''} | ${l.url || ''}`).join('\n') : ''} onChange={e => updateWidgetContent('links', e.target.value.split('\n').filter(Boolean).map((line: string) => { const [label, url] = line.split('|').map((s: string) => s.trim()); return { label, url }; }))} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor Fundo Link</span>
                    <input type="color" value={obj.content?.link_bg || '#1d1d1f'} onChange={e => updateWidgetContent('link_bg', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor Texto Link</span>
                    <input type="color" value={obj.content?.link_color || '#ffffff'} onChange={e => updateWidgetContent('link_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── BREADCRUMBS COMPLETO ── */}
              {item.type === 'widget' && isBreadcrumbsPro && (
                <AccordionSection title="Breadcrumb" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Página Atual</span>
                    <input className="elementor-input" value={obj.content?.current || 'Página'} onChange={e => updateWidgetContent('current', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor do Texto</span>
                    <input type="color" value={obj.content?.color || '#86868b'} onChange={e => updateWidgetContent('color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor do Atual</span>
                    <input type="color" value={obj.content?.active_color || '#1d1d1f'} onChange={e => updateWidgetContent('active_color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── ORDER ITEM ── */}
              {item.type === 'widget' && obj.type === 'orderItem' && (
                <AccordionSection title="Item do Pedido" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Nome do Produto</span>
                    <input className="elementor-input" value={obj.content?.name || ''} onChange={e => updateWidgetContent('name', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Preço</span>
                    <input className="elementor-input" value={obj.content?.price || ''} placeholder="R$ 199,90" onChange={e => updateWidgetContent('price', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Quantidade</span>
                    <input className="elementor-input" type="number" value={obj.content?.quantity || 1} onChange={e => updateWidgetContent('quantity', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Número do Pedido</span>
                    <input className="elementor-input" value={obj.content?.order_number || ''} onChange={e => updateWidgetContent('order_number', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Data do Pedido</span>
                    <input className="elementor-input" value={obj.content?.order_date || ''} onChange={e => updateWidgetContent('order_date', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Status</span>
                    <input className="elementor-input" value={obj.content?.status_text || ''} placeholder="Pago" onChange={e => updateWidgetContent('status_text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Código de Rastreio</span>
                    <input className="elementor-input" value={obj.content?.tracking_code || ''} onChange={e => updateWidgetContent('tracking_code', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── PRODUCT TILE GALLERY ── */}
              {item.type === 'widget' && obj.type === 'productTileGallery' && (
                <AccordionSection title="Galeria de Tiles" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.headline || ''} onChange={e => updateWidgetContent('headline', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Mostrar Navegação</span>
                    <ToggleSwitch checked={obj.content?.show_nav_arrows !== false} onChange={v => updateWidgetContent('show_nav_arrows', v)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── VIDEO PLAYLIST ── */}
              {item.type === 'widget' && obj.type === 'videoPlaylist' && (
                <AccordionSection title="Playlist de Vídeo" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.title || 'Playlist'} onChange={e => updateWidgetContent('title', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── PAGE TITLE ── */}
              {item.type === 'widget' && obj.type === 'pageTitle' && (
                <AccordionSection title="Título da Página" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <input className="elementor-input" value={obj.content?.text || ''} onChange={e => updateWidgetContent('text', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Cor</span>
                    <input type="color" value={obj.content?.color || '#1d1d1f'} onChange={e => updateWidgetContent('color', e.target.value)} style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── POST WIDGETS (Theme Builder) ── */}
              {item.type === 'widget' && obj.type === 'postExcerpt' && (
                <AccordionSection title="Resumo do Post" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Excerto Customizado</span>
                    <textarea className="elementor-textarea" rows={3} value={obj.content?.custom_excerpt || obj.content?.excerpt || ''} onChange={e => { updateWidgetContent('custom_excerpt', e.target.value); updateWidgetContent('excerpt', e.target.value) }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Mostrar "Leia Mais"</span>
                    <ToggleSwitch checked={obj.content?.show_read_more !== false} onChange={v => updateWidgetContent('show_read_more', v)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto "Leia Mais"</span>
                    <input className="elementor-input" value={obj.content?.read_more_text || 'Leia Mais'} onChange={e => updateWidgetContent('read_more_text', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {item.type === 'widget' && obj.type === 'postTitle' && (
                <AccordionSection title="Título do Post" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Tag HTML</span>
                    <select className="elementor-select" value={obj.content?.tag || 'h1'} onChange={e => updateWidgetContent('tag', e.target.value)}>
                      <option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option><option value="h5">H5</option><option value="h6">H6</option>
                    </select>
                  </div>
                </AccordionSection>
              )}

              {item.type === 'widget' && obj.type === 'postContent' && (
                <AccordionSection title="Conteúdo do Post" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Conteúdo Customizado</span>
                    <textarea className="elementor-textarea" rows={4} value={obj.content?.body || obj.content?.text || ''} onChange={e => { updateWidgetContent('body', e.target.value); updateWidgetContent('text', e.target.value) }} />
                  </div>
                </AccordionSection>
              )}

              {item.type === 'widget' && obj.type === 'featuredImage' && (
                <AccordionSection title="Imagem Destaque" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">URL da Imagem</span>
                    <input className="elementor-input" value={obj.content?.url || obj.content?.image || ''} onChange={e => { updateWidgetContent('url', e.target.value); updateWidgetContent('image', e.target.value) }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Texto Alternativo</span>
                    <input className="elementor-input" value={obj.content?.alt || ''} onChange={e => updateWidgetContent('alt', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {item.type === 'widget' && obj.type === 'postInfo' && (
                <AccordionSection title="Info do Post" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <ControlRow label="Mostrar Data"><ToggleSwitch checked={obj.content?.show_date !== false} onChange={v => updateWidgetContent('show_date', v)} /></ControlRow>
                  <ControlRow label="Mostrar Autor"><ToggleSwitch checked={obj.content?.show_author !== false} onChange={v => updateWidgetContent('show_author', v)} /></ControlRow>
                  <ControlRow label="Mostrar Categoria"><ToggleSwitch checked={obj.content?.show_category !== false} onChange={v => updateWidgetContent('show_category', v)} /></ControlRow>
                </AccordionSection>
              )}

              {item.type === 'widget' && obj.type === 'authorBox' && (
                <AccordionSection title="Box do Autor" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Nome</span>
                    <input className="elementor-input" value={obj.content?.name || ''} onChange={e => updateWidgetContent('name', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Bio</span>
                    <textarea className="elementor-textarea" rows={3} value={obj.content?.bio || ''} onChange={e => updateWidgetContent('bio', e.target.value)} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">URL do Avatar</span>
                    <input className="elementor-input" value={obj.content?.avatar || ''} onChange={e => updateWidgetContent('avatar', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── SEARCH ── */}
              {item.type === 'widget' && obj.type === 'search' && (
                <AccordionSection title="Busca" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Placeholder</span>
                    <input className="elementor-input" value={obj.content?.placeholder || 'Buscar...'} onChange={e => updateWidgetContent('placeholder', e.target.value)} />
                  </div>
                </AccordionSection>
              )}

              {/* ── LOOP GRID ── */}
              {item.type === 'widget' && obj.type === 'loopGrid' && (
                <AccordionSection title="Grid Dinâmico" isOpen={openAccordions.widgetContent !== false} onToggle={() => toggleAccordion('widgetContent')}>
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Colunas</span>
                      <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.columns || 3}</span>
                    </div>
                    <input type="range" min="1" max="6" value={obj.content?.columns || 3} onChange={e => updateWidgetContent('columns', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0071e3' }} />
                  </div>
                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Quantidade</span>
                      <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 600 }}>{obj.content?.count || 6}</span>
                    </div>
                    <input type="range" min="1" max="20" value={obj.content?.count || 6} onChange={e => updateWidgetContent('count', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0071e3' }} />
                  </div>
                </AccordionSection>
              )}

              {/* ── Fallback for other widgets ── */}
              {item.type === 'widget' && !isTextOrHeading && !isButton && !isImage && !isVideo && !isIconBox && !isIcon && !isStarRating && !isCounter && !isCountdown && !isProgressBar && !isTestimonials && !isTabs && !isAccordion && !isAlert && !isDivider && !isSpacer && !isGoogleMaps && !isHtml && !isLottie && !isNewsletter && !isProduct && !isProductGrid && !isImageGallery && !isForm && !isLogin && !isFlipBox && !isCtaPro && !isPriceTablePro && !isMediaCarousel && !isEntertainmentGallery && !isChapterNav && !isProductLineupGallery && !isCards && !isOffersCarousel && !isFeatureCardsGallery && !isAppleImageAccordion && !isLinkInBio && !isSubscribe && !isFeatures && !isSlides && !isNavMenu && !isPosts && !isReviewsPro && !isAnimatedHeadlinePro && !isBreadcrumbsPro && !isShareButtonsPro && !isTableOfContentsPro && !isCustomCodePro && !isPaypal && !isStripe && !isCart && !isMyAccount && !isCheckout && !isLottiePro && !isCodeHighlightPro && !isFloatingButtons && !isPriceListPro && obj.type !== 'cta' && obj.type !== 'price' && obj.type !== 'quote' && obj.type !== 'list' && obj.type !== 'table' && obj.type !== 'embed' && obj.type !== 'steps' && obj.type !== 'imageText' && obj.type !== 'specifications' && obj.type !== 'banner' && obj.type !== 'carousel' && !isHotspot && !isPortfolio && !isPriceTable && !isAnimatedHeadline && !isTestimonialCarousel && obj.type !== 'orderItem' && obj.type !== 'productTileGallery' && obj.type !== 'videoPlaylist' && obj.type !== 'pageTitle' && obj.type !== 'postExcerpt' && obj.type !== 'postTitle' && obj.type !== 'postContent' && obj.type !== 'featuredImage' && obj.type !== 'postInfo' && obj.type !== 'authorBox' && obj.type !== 'search' && obj.type !== 'loopGrid' && (
                <AccordionSection
                  title={itemTitle}
                  isOpen={openAccordions.widgetContent}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={currentAlign}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                      ]}
                    />
                  </ControlRow>
                </AccordionSection>
              )}
            </>
          )}

          {/* ============================================================
              TAB 2: STYLE (Estilo)
             ============================================================ */}
          {tab === 'style' && (
            <>
              {/* ── ESTILO ESPECÍFICO: CARROSSEL PRODUTOS (APPLE LINEUP) ── */}
              {item.type === 'widget' && isProductLineupGallery && (
                <>
                  <AccordionSection
                    title="Cabeçalho da Seção"
                    isOpen={openAccordions.lineupStyleHeader !== false}
                    onToggle={() => toggleAccordion('lineupStyleHeader')}
                  >
                    <ControlRow label="Cor do Título">
                      <ColorControl
                        value={obj.content?.headline_color || '#1d1d1f'}
                        onChange={v => updateWidgetContent('headline_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte do Título (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="16"
                        max="80"
                        step="1"
                        value={obj.content?.headline_size ?? 36}
                        onChange={e => updateWidgetContent('headline_size', Math.max(16, parseInt(e.target.value) || 36))}
                      />
                    </div>
                    <ControlRow label="Cor do Link Comparar">
                      <ColorControl
                        value={obj.content?.compare_color || '#0071e3'}
                        onChange={v => updateWidgetContent('compare_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte do Link (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="10"
                        max="30"
                        step="1"
                        value={obj.content?.compare_size ?? 15}
                        onChange={e => updateWidgetContent('compare_size', Math.max(10, parseInt(e.target.value) || 15))}
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Card do Produto (Caixa)"
                    isOpen={openAccordions.lineupStyleCard !== false}
                    onToggle={() => toggleAccordion('lineupStyleCard')}
                  >
                    <ControlRow label="Cor de Fundo do Card">
                      <ColorControl
                        value={obj.content?.card_bg_color || '#ffffff'}
                        onChange={v => updateWidgetContent('card_bg_color', v)}
                      />
                    </ControlRow>
                    <ControlRow label="Cor da Borda">
                      <ColorControl
                        value={obj.content?.card_border_color || 'rgba(0,0,0,0.06)'}
                        onChange={v => updateWidgetContent('card_border_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Arredondamento / Raio da Borda (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="0"
                        max="60"
                        step="1"
                        value={obj.content?.card_border_radius ?? 24}
                        onChange={e => updateWidgetContent('card_border_radius', Math.max(0, parseInt(e.target.value) || 0))}
                      />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Largura Mínima do Card (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="200"
                        max="600"
                        step="10"
                        value={obj.content?.card_width ?? 320}
                        onChange={e => updateWidgetContent('card_width', Math.max(200, parseInt(e.target.value) || 320))}
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Título do Produto & Badge"
                    isOpen={openAccordions.lineupStyleTitle !== false}
                    onToggle={() => toggleAccordion('lineupStyleTitle')}
                  >
                    <ControlRow label="Cor do Nome do Produto">
                      <ColorControl
                        value={obj.content?.title_color || '#1d1d1f'}
                        onChange={v => updateWidgetContent('title_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte do Nome (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="14"
                        max="50"
                        step="1"
                        value={obj.content?.title_font_size ?? 26}
                        onChange={e => updateWidgetContent('title_font_size', Math.max(14, parseInt(e.target.value) || 26))}
                      />
                    </div>
                    <ControlRow label="Cor do Badge (Ex: Novo)">
                      <ColorControl
                        value={obj.content?.badge_color || '#bf4800'}
                        onChange={v => updateWidgetContent('badge_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte do Badge (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="8"
                        max="20"
                        step="1"
                        value={obj.content?.badge_font_size ?? 11}
                        onChange={e => updateWidgetContent('badge_font_size', Math.max(8, parseInt(e.target.value) || 11))}
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Foto / Imagem do Produto"
                    isOpen={openAccordions.lineupStyleImage !== false}
                    onToggle={() => toggleAccordion('lineupStyleImage')}
                  >
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Altura da Imagem (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="120"
                        max="500"
                        step="10"
                        value={obj.content?.image_height ?? 240}
                        onChange={e => updateWidgetContent('image_height', Math.max(120, parseInt(e.target.value) || 240))}
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Descrição / Texto do Card"
                    isOpen={openAccordions.lineupStyleCopy !== false}
                    onToggle={() => toggleAccordion('lineupStyleCopy')}
                  >
                    <ControlRow label="Cor do Texto">
                      <ColorControl
                        value={obj.content?.copy_color || '#1d1d1f'}
                        onChange={v => updateWidgetContent('copy_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="10"
                        max="30"
                        step="1"
                        value={obj.content?.copy_font_size ?? 14}
                        onChange={e => updateWidgetContent('copy_font_size', Math.max(10, parseInt(e.target.value) || 14))}
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Preço & Parcelamento"
                    isOpen={openAccordions.lineupStylePrice !== false}
                    onToggle={() => toggleAccordion('lineupStylePrice')}
                  >
                    <ControlRow label="Cor do Preço">
                      <ColorControl
                        value={obj.content?.price_color || '#1d1d1f'}
                        onChange={v => updateWidgetContent('price_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte do Preço (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="11"
                        max="36"
                        step="1"
                        value={obj.content?.price_font_size ?? 14}
                        onChange={e => updateWidgetContent('price_font_size', Math.max(11, parseInt(e.target.value) || 14))}
                      />
                    </div>
                    <ControlRow label="Cor do Parcelamento">
                      <ColorControl
                        value={obj.content?.installments_color || '#86868b'}
                        onChange={v => updateWidgetContent('installments_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte do Parcelamento (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="9"
                        max="24"
                        step="1"
                        value={obj.content?.installments_font_size ?? 12}
                        onChange={e => updateWidgetContent('installments_font_size', Math.max(9, parseInt(e.target.value) || 12))}
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Botão Saber Mais"
                    isOpen={openAccordions.lineupStyleBtnSaber !== false}
                    onToggle={() => toggleAccordion('lineupStyleBtnSaber')}
                  >
                    <ControlRow label="Cor de Fundo do Botão">
                      <ColorControl
                        value={obj.content?.btn_saber_bg || '#0071e3'}
                        onChange={v => updateWidgetContent('btn_saber_bg', v)}
                      />
                    </ControlRow>
                    <ControlRow label="Cor do Texto">
                      <ColorControl
                        value={obj.content?.btn_saber_color || '#ffffff'}
                        onChange={v => updateWidgetContent('btn_saber_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte do Botão (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="10"
                        max="24"
                        step="1"
                        value={obj.content?.btn_saber_font_size ?? 13}
                        onChange={e => updateWidgetContent('btn_saber_font_size', Math.max(10, parseInt(e.target.value) || 13))}
                      />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Arredondamento / Raio da Borda (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="0"
                        max="1000"
                        step="1"
                        value={obj.content?.btn_saber_radius ?? 980}
                        onChange={e => updateWidgetContent('btn_saber_radius', Math.max(0, parseInt(e.target.value) || 0))}
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Link Comprar"
                    isOpen={openAccordions.lineupStyleBtnComprar !== false}
                    onToggle={() => toggleAccordion('lineupStyleBtnComprar')}
                  >
                    <ControlRow label="Cor do Link">
                      <ColorControl
                        value={obj.content?.btn_comprar_color || '#0071e3'}
                        onChange={v => updateWidgetContent('btn_comprar_color', v)}
                      />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Fonte do Link (px)</span>
                      <input
                        className="elementor-input"
                        type="number"
                        min="10"
                        max="24"
                        step="1"
                        value={obj.content?.btn_comprar_font_size ?? 13}
                        onChange={e => updateWidgetContent('btn_comprar_font_size', Math.max(10, parseInt(e.target.value) || 13))}
                      />
                    </div>
                  </AccordionSection>
                </>
              )}

              {/* ── CARDS (ESTILO — O DIFERENCIAL DA LOJA) ── */}
              {item.type === 'widget' && isCards && (
                <>
                  <AccordionSection title="Cabeçalho" isOpen={openAccordions.cardsStyleHeader !== false} onToggle={() => toggleAccordion('cardsStyleHeader')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Tamanho do Título Negrito (px)</span>
                      <input className="elementor-input" type="number" min="14" max="72" step="1" value={obj.content?.style_headline_bold_size ?? 28} onChange={e => updateWidgetContent('style_headline_bold_size', Math.max(14, parseInt(e.target.value) || 28))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho do Subtítulo (px)</span>
                      <input className="elementor-input" type="number" min="12" max="48" step="1" value={obj.content?.style_headline_normal_size ?? 21} onChange={e => updateWidgetContent('style_headline_normal_size', Math.max(12, parseInt(e.target.value) || 21))} />
                    </div>
                    <ControlRow label="Cor do Título Negrito">
                      <ColorControl value={obj.content?.style_headline_bold_color || '#1d1d1f'} onChange={v => updateWidgetContent('style_headline_bold_color', v)} />
                    </ControlRow>
                    <ControlRow label="Cor do Subtítulo">
                      <ColorControl value={obj.content?.style_headline_normal_color || '#6e6e73'} onChange={v => updateWidgetContent('style_headline_normal_color', v)} />
                    </ControlRow>
                  </AccordionSection>

                  <AccordionSection title="Card Principal (Destaque)" isOpen={openAccordions.cardsStyleFeatured !== false} onToggle={() => toggleAccordion('cardsStyleFeatured')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Tamanho do Título (px)</span>
                      <input className="elementor-input" type="number" min="14" max="60" step="1" value={obj.content?.style_featured_title_size ?? 28} onChange={e => updateWidgetContent('style_featured_title_size', Math.max(14, parseInt(e.target.value) || 28))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Descrição (px)</span>
                      <input className="elementor-input" type="number" min="10" max="24" step="1" value={obj.content?.style_featured_desc_size ?? 15} onChange={e => updateWidgetContent('style_featured_desc_size', Math.max(10, parseInt(e.target.value) || 15))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho do Badge (px)</span>
                      <input className="elementor-input" type="number" min="8" max="20" step="1" value={obj.content?.style_featured_badge_size ?? 11} onChange={e => updateWidgetContent('style_featured_badge_size', Math.max(8, parseInt(e.target.value) || 11))} />
                    </div>
                    <ControlRow label="Cor do Fundo do Card">
                      <ColorControl value={obj.content?.style_featured_bg || '#f5f5f7'} onChange={v => updateWidgetContent('style_featured_bg', v)} />
                    </ControlRow>
                    <ControlRow label="Cor do Título">
                      <ColorControl value={obj.content?.style_featured_title_color || '#1d1d1f'} onChange={v => updateWidgetContent('style_featured_title_color', v)} />
                    </ControlRow>
                    <ControlRow label="Cor da Descrição">
                      <ColorControl value={obj.content?.style_featured_desc_color || '#6e6e73'} onChange={v => updateWidgetContent('style_featured_desc_color', v)} />
                    </ControlRow>
                    <ControlRow label="Cor do Badge">
                      <ColorControl value={obj.content?.style_featured_badge_color || '#ff6900'} onChange={v => updateWidgetContent('style_featured_badge_color', v)} />
                    </ControlRow>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Altura Mínima do Card (px)</span>
                      <input className="elementor-input" type="number" min="300" max="900" step="10" value={obj.content?.style_featured_min_height ?? 560} onChange={e => updateWidgetContent('style_featured_min_height', Math.max(300, parseInt(e.target.value) || 560))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Raio da Borda (px)</span>
                      <input className="elementor-input" type="number" min="0" max="40" step="1" value={obj.content?.style_featured_radius ?? 18} onChange={e => updateWidgetContent('style_featured_radius', Math.max(0, parseInt(e.target.value) || 18))} />
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Cards Duplos (Colunas)" isOpen={openAccordions.cardsStyleDouble !== false} onToggle={() => toggleAccordion('cardsStyleDouble')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Tamanho do Texto dos Cards (px)</span>
                      <input className="elementor-input" type="number" min="10" max="28" step="1" value={obj.content?.style_double_text_size ?? 17} onChange={e => updateWidgetContent('style_double_text_size', Math.max(10, parseInt(e.target.value) || 17))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho do Ícone (px)</span>
                      <input className="elementor-input" type="number" min="20" max="80" step="1" value={obj.content?.style_icon_size ?? 36} onChange={e => updateWidgetContent('style_icon_size', Math.max(20, parseInt(e.target.value) || 36))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Raio da Borda dos Cards (px)</span>
                      <input className="elementor-input" type="number" min="0" max="40" step="1" value={obj.content?.style_double_radius ?? 18} onChange={e => updateWidgetContent('style_double_radius', Math.max(0, parseInt(e.target.value) || 18))} />
                    </div>
                    <ControlRow label="Fundo dos Cards">
                      <ColorControl value={obj.content?.style_double_bg || '#f5f5f7'} onChange={v => updateWidgetContent('style_double_bg', v)} />
                    </ControlRow>
                    <ControlRow label="Cor do Texto Normal">
                      <ColorControl value={obj.content?.style_double_text_color || '#1d1d1f'} onChange={v => updateWidgetContent('style_double_text_color', v)} />
                    </ControlRow>
                    <ControlRow label="Cor de Destaque (Palavras em Cor)">
                      <ColorControl value={obj.content?.style_highlight_color || '#0071e3'} onChange={v => updateWidgetContent('style_highlight_color', v)} />
                    </ControlRow>
                  </AccordionSection>

                  <AccordionSection title="Cores Gerais" isOpen={openAccordions.cardsStyleGeneral !== false} onToggle={() => toggleAccordion('cardsStyleGeneral')}>
                    <ControlRow label="Cor de Fundo da Seção">
                      <ColorControl value={obj.content?.style_section_bg || '#ffffff'} onChange={v => updateWidgetContent('style_section_bg', v)} />
                    </ControlRow>
                  </AccordionSection>
                </>
              )}

              {/* ── CARROSSEL (ESTILO — ECONOMIAS E OFERTAS) ── */}
              {item.type === 'widget' && isOffersCarousel && (
                <>
                  <AccordionSection title="Cabeçalho" isOpen={openAccordions.offersStyleHeader !== false} onToggle={() => toggleAccordion('offersStyleHeader')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Tamanho do Título Negrito (px)</span>
                      <input className="elementor-input" type="number" min="14" max="72" step="1" value={obj.content?.style_headline_bold_size ?? 28} onChange={e => updateWidgetContent('style_headline_bold_size', Math.max(14, parseInt(e.target.value) || 28))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho do Subtítulo (px)</span>
                      <input className="elementor-input" type="number" min="12" max="48" step="1" value={obj.content?.style_headline_normal_size ?? 21} onChange={e => updateWidgetContent('style_headline_normal_size', Math.max(12, parseInt(e.target.value) || 21))} />
                    </div>
                    <ControlRow label="Cor do Título Negrito">
                      <ColorControl value={obj.content?.style_headline_bold_color || '#1d1d1f'} onChange={v => updateWidgetContent('style_headline_bold_color', v)} />
                    </ControlRow>
                    <ControlRow label="Cor do Subtítulo">
                      <ColorControl value={obj.content?.style_headline_normal_color || '#6e6e73'} onChange={v => updateWidgetContent('style_headline_normal_color', v)} />
                    </ControlRow>
                  </AccordionSection>

                  <AccordionSection title="Cards de Oferta — Dimensões" isOpen={openAccordions.offersStyleCard !== false} onToggle={() => toggleAccordion('offersStyleCard')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Largura do Card (px)</span>
                      <input className="elementor-input" type="number" min="200" max="600" step="10" value={obj.content?.style_card_width ?? 340} onChange={e => updateWidgetContent('style_card_width', Math.max(200, parseInt(e.target.value) || 340))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Altura do Card (px)</span>
                      <input className="elementor-input" type="number" min="300" max="800" step="10" value={obj.content?.style_card_height ?? 480} onChange={e => updateWidgetContent('style_card_height', Math.max(300, parseInt(e.target.value) || 480))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Raio da Borda (px)</span>
                      <input className="elementor-input" type="number" min="0" max="40" step="1" value={obj.content?.style_card_radius ?? 18} onChange={e => updateWidgetContent('style_card_radius', Math.max(0, parseInt(e.target.value) || 18))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Altura da Imagem (px)</span>
                      <input className="elementor-input" type="number" min="100" max="600" step="10" value={obj.content?.style_image_height ?? 220} onChange={e => updateWidgetContent('style_image_height', Math.max(100, parseInt(e.target.value) || 220))} />
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Tipografia dos Cards" isOpen={openAccordions.offersStyleTypo !== false} onToggle={() => toggleAccordion('offersStyleTypo')}>
                    <div className="elementor-control-row stacked">
                      <span className="elementor-control-label">Tamanho do Eyebrow / Sobretítulo (px)</span>
                      <input className="elementor-input" type="number" min="8" max="20" step="1" value={obj.content?.style_eyebrow_size ?? 11} onChange={e => updateWidgetContent('style_eyebrow_size', Math.max(8, parseInt(e.target.value) || 11))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho do Título do Card (px)</span>
                      <input className="elementor-input" type="number" min="12" max="48" step="1" value={obj.content?.style_card_title_size ?? 21} onChange={e => updateWidgetContent('style_card_title_size', Math.max(12, parseInt(e.target.value) || 21))} />
                    </div>
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <span className="elementor-control-label">Tamanho da Descrição (px)</span>
                      <input className="elementor-input" type="number" min="10" max="24" step="1" value={obj.content?.style_card_desc_size ?? 14} onChange={e => updateWidgetContent('style_card_desc_size', Math.max(10, parseInt(e.target.value) || 14))} />
                    </div>
                    <ControlRow label="Cor do Eyebrow (Card Claro)">
                      <ColorControl value={obj.content?.style_eyebrow_color_light || '#6e6e73'} onChange={v => updateWidgetContent('style_eyebrow_color_light', v)} />
                    </ControlRow>
                    <ControlRow label="Cor do Título (Card Claro)">
                      <ColorControl value={obj.content?.style_card_title_color_light || '#1d1d1f'} onChange={v => updateWidgetContent('style_card_title_color_light', v)} />
                    </ControlRow>
                    <ControlRow label="Cor do Eyebrow (Card Escuro)">
                      <ColorControl value={obj.content?.style_eyebrow_color_dark || 'rgba(255,255,255,0.7)'} onChange={v => updateWidgetContent('style_eyebrow_color_dark', v)} />
                    </ControlRow>
                    <ControlRow label="Cor do Título (Card Escuro)">
                      <ColorControl value={obj.content?.style_card_title_color_dark || '#f5f5f7'} onChange={v => updateWidgetContent('style_card_title_color_dark', v)} />
                    </ControlRow>
                  </AccordionSection>

                  <AccordionSection title="Cores Gerais" isOpen={openAccordions.offersStyleGeneral !== false} onToggle={() => toggleAccordion('offersStyleGeneral')}>
                    <ControlRow label="Cor de Fundo da Seção">
                      <ColorControl value={obj.content?.style_section_bg || '#ffffff'} onChange={v => updateWidgetContent('style_section_bg', v)} />
                    </ControlRow>
                    <ControlRow label="Cor dos Botões de Navegação">
                      <ColorControl value={obj.content?.style_nav_color || '#1d1d1f'} onChange={v => updateWidgetContent('style_nav_color', v)} />
                    </ControlRow>
                  </AccordionSection>
                </>
              )}

              {/* ── SEÇÃO: IMAGEM (ESTILO & DIMENSÕES) QUANDO FOR WIDGET DE IMAGEM ── */}
              {item.type === 'widget' && isImage && (
                <AccordionSection
                  title="Imagem"
                  isOpen={openAccordions.widgetStyle !== false}
                  onToggle={() => toggleAccordion('widgetStyle')}
                >
                  {/* Largura (Width) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Largura</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {(['%', 'px', 'vw'] as const).map(u => (
                          <button
                            key={u}
                            type="button"
                            className={`elementor-segmented-btn ${imageWidthUnit === u ? 'active' : ''}`}
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                            onClick={() => setImageWidthUnit(u)}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="1"
                        max={imageWidthUnit === '%' ? 100 : (imageWidthUnit === 'vw' ? 100 : 1600)}
                        value={parseInt(String(getVal('width', '100%')).replace(/[^0-9]/g, ''), 10) || (imageWidthUnit === '%' ? 100 : 400)}
                        onChange={e => {
                          const val = `${e.target.value}${imageWidthUnit}`
                          updateResponsive('width', val)
                          updateWidgetStyle('width', val)
                        }}
                        style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                      <div style={{ width: '90px' }}>
                        <StepperNumberInput
                          value={getVal('width', `100${imageWidthUnit}`)}
                          onChange={v => {
                            const formatted = v.includes('%') || v.includes('px') || v.includes('vw') ? v : `${v}${imageWidthUnit}`
                            updateResponsive('width', formatted)
                            updateWidgetStyle('width', formatted)
                          }}
                          placeholder={`100${imageWidthUnit}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Largura Máxima (Max Width) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Largura Máxima</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <span style={{ fontSize: '11px', color: '#86868b' }}>
                        {getVal('max_width', '100%')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={parseInt(String(getVal('max_width', '100%')).replace(/[^0-9]/g, ''), 10) || 100}
                        onChange={e => {
                          const val = `${e.target.value}%`
                          updateResponsive('max_width', val)
                          updateWidgetStyle('max_width', val)
                        }}
                        style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                      <div style={{ width: '90px' }}>
                        <StepperNumberInput
                          value={getVal('max_width', '100%')}
                          onChange={v => {
                            const formatted = v.includes('%') || v.includes('px') ? v : `${v}%`
                            updateResponsive('max_width', formatted)
                            updateWidgetStyle('max_width', formatted)
                          }}
                          placeholder="100%"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Altura (Height) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Altura</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {(['px', 'vh', 'auto'] as const).map(u => (
                          <button
                            key={u}
                            type="button"
                            className={`elementor-segmented-btn ${imageHeightUnit === u ? 'active' : ''}`}
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                            onClick={() => {
                              setImageHeightUnit(u)
                              if (u === 'auto') {
                                updateResponsive('height', 'auto')
                                updateWidgetStyle('height', 'auto')
                              }
                            }}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    {imageHeightUnit !== 'auto' && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="range"
                          min="50"
                          max={imageHeightUnit === 'vh' ? 100 : 1200}
                          value={parseInt(String(getVal('height', '400px')).replace(/[^0-9]/g, ''), 10) || 400}
                          onChange={e => {
                            const val = `${e.target.value}${imageHeightUnit}`
                            updateResponsive('height', val)
                            updateWidgetStyle('height', val)
                          }}
                          style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                        />
                        <div style={{ width: '90px' }}>
                          <StepperNumberInput
                            value={getVal('height', `400${imageHeightUnit}`)}
                            onChange={v => {
                              const formatted = v.includes('px') || v.includes('vh') || v === 'auto' ? v : `${v}${imageHeightUnit}`
                              updateResponsive('height', formatted)
                              updateWidgetStyle('height', formatted)
                            }}
                            placeholder={`400${imageHeightUnit}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ajuste do Objeto (Object Fit) */}
                  <ControlRow label="Ajuste do Objeto (Object Fit)">
                    <select
                      className="elementor-select"
                      value={obj.object_fit || obj.settings?.object_fit || obj.style?.objectFit || 'cover'}
                      onChange={e => {
                        update('object_fit', e.target.value)
                        updateWidgetStyle('object_fit', e.target.value)
                      }}
                    >
                      <option value="cover">Preencher (Cover — sem distorcer)</option>
                      <option value="contain">Conter (Contain — imagem inteira)</option>
                      <option value="fill">Preenchimento Total (Fill)</option>
                      <option value="none">Padrão Original (None)</option>
                      <option value="scale-down">Reduzir Proporcional (Scale Down)</option>
                    </select>
                  </ControlRow>

                  {/* Posição do Objeto (Object Position) */}
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Posição do Objeto</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: 120 }}>
                      {[
                        { val: 'top left', icon: '↖' }, { val: 'top center', icon: '↑' }, { val: 'top right', icon: '↗' },
                        { val: 'center left', icon: '←' }, { val: 'center center', icon: '●' }, { val: 'center right', icon: '→' },
                        { val: 'bottom left', icon: '↙' }, { val: 'bottom center', icon: '↓' }, { val: 'bottom right', icon: '↘' },
                      ].map(({ val, icon }) => {
                        const current = obj.object_position || obj.settings?.object_position || obj.style?.objectPosition || 'center center'
                        const isActive = current === val
                        return (
                          <button
                            key={val}
                            onClick={() => { update('object_position', val); updateWidgetStyle('object_position', val) }}
                            title={val}
                            style={{
                              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isActive ? '#0071e3' : '#f5f5f7', color: isActive ? '#fff' : '#6e6e73',
                              border: isActive ? '2px solid #0071e3' : '2px solid #e8e8ed', borderRadius: 8,
                              cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all 0.15s ease'
                            }}
                          >{icon}</button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Opacidade */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Opacidade</span>
                      <span style={{ fontSize: '11px', color: '#86868b' }}>
                        {obj.opacity !== undefined ? obj.opacity : '1.0'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={parseFloat(String(obj.opacity !== undefined ? obj.opacity : 1.0)) || 1.0}
                      onChange={e => {
                        update('opacity', e.target.value)
                        updateWidgetStyle('opacity', e.target.value)
                      }}
                      style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Arredondamento da Borda (Border Radius) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Arredondamento da Borda (Radius)</span>
                      <span style={{ fontSize: '11px', color: '#86868b' }}>
                        {getVal('border_radius', '12px')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={parseInt(String(getVal('border_radius', '12')).replace(/[^0-9]/g, ''), 10) || 12}
                        onChange={e => {
                          const val = `${e.target.value}px`
                          updateResponsive('border_radius', val)
                          updateWidgetStyle('border_radius', val)
                        }}
                        style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                      <div style={{ width: '90px' }}>
                        <StepperNumberInput
                          value={getVal('border_radius', '12px')}
                          onChange={v => {
                            const formatted = v.includes('px') || v.includes('%') ? v : `${v}px`
                            updateResponsive('border_radius', formatted)
                            updateWidgetStyle('border_radius', formatted)
                          }}
                          placeholder="12px"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sombra da Imagem */}
                  <ControlRow label="Sombra da imagem">
                    <ColorControl
                      value={obj.box_shadow || ''}
                      onChange={v => {
                        const shadowVal = v ? `0 8px 24px ${v}` : ''
                        update('box_shadow', shadowVal)
                        updateWidgetStyle('box_shadow', shadowVal)
                      }}
                    />
                  </ControlRow>
                  {/* Máscara de Imagem (Image Mask) */}
                  <ControlRow label="Máscara de Imagem (Mask)">
                    <select
                      className="elementor-select"
                      value={obj.mask_shape || obj.settings?.mask_shape || 'none'}
                      onChange={e => {
                        update('mask_shape', e.target.value)
                        updateWidgetStyle('mask_shape', e.target.value)
                      }}
                    >
                      <option value="none">Nenhuma</option>
                      <option value="circle">Círculo</option>
                      <option value="blob">Blob Orgânico</option>
                      <option value="hexagon">Hexágono</option>
                      <option value="triangle">Triângulo</option>
                      <option value="custom">URL / SVG Personalizado</option>
                    </select>
                  </ControlRow>

                  {(obj.mask_shape === 'custom' || obj.settings?.mask_shape === 'custom') && (
                    <ControlRow label="URL da Máscara SVG">
                      <input
                        className="elementor-input"
                        value={obj.mask_custom_url || obj.settings?.mask_custom_url || ''}
                        onChange={e => {
                          update('mask_custom_url', e.target.value)
                          updateWidgetStyle('mask_custom_url', e.target.value)
                        }}
                        placeholder="https://.../mascara.svg"
                      />
                    </ControlRow>
                  )}
                </AccordionSection>
              )}

              {/* ── TIPOGRAFIA & ESTILOS DE TEXTO DO WIDGET (QUANDO FOR WIDGET DE TEXTO/TÍTULO/BOTÃO) ── */}
              {hasTypography && (
                <AccordionSection
                  title="Título / Tipografia"
                  isOpen={openAccordions.widgetStyle !== false}
                  onToggle={() => toggleAccordion('widgetStyle')}
                >
                  {/* Cor do Texto (Color) */}
                  <ControlRow label="Cor">
                    <ColorControl
                      value={obj.color || obj.settings?.color || obj.style?.color || '#1d1d1f'}
                      onChange={v => {
                        update('color', v)
                        updateWidgetStyle('color', v)
                      }}
                    />
                  </ControlRow>

                  {/* Cor ao passar o mouse (Hover Color) */}
                  <ControlRow label="Cor ao passar o mouse">
                    <ColorControl
                      value={obj.hover_color || obj.settings?.hover_color || ''}
                      onChange={v => {
                        update('hover_color', v)
                        updateWidgetStyle('hover_color', v)
                      }}
                    />
                  </ControlRow>

                  {/* Sombra do texto */}
                  <ControlRow label="Sombra do texto">
                    <ColorControl
                      value={obj.text_shadow_color || ''}
                      onChange={v => {
                        update('text_shadow_color', v)
                        updateWidgetStyle('text_shadow_color', v)
                      }}
                    />
                  </ControlRow>

                  {/* Alinhamento com switcher responsivo */}
                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={
                        (viewportMode !== 'desktop' && (obj.responsive?.[viewportMode]?.text_align || obj[`text_align_${viewportMode}`]))
                        || obj.text_align || obj.settings?.text_align || obj.content?.align || obj.content?.text_align || obj.style?.textAlign || 'left'
                      }
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetContent('align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Alinhar à esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centralizar' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Alinhar à direita' },
                        { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificar' },
                      ]}
                    />
                  </ControlRow>

                  {/* Tipografia Trigger Row (Ícone Global 🌐 e Lápis ✏️) */}
                  <div className="elementor-control-row" style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span className="elementor-control-label" style={{ fontWeight: 600, color: '#1d1d1f' }}>
                      Tipografia
                    </span>
                    <div className="elementor-typography-trigger-group">
                      <button
                        type="button"
                        className="elementor-typography-trigger-btn"
                        title="Fontes Globais"
                        onClick={() => {
                          update('font_family', 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif')
                          updateWidgetStyle('font_family', 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif')
                        }}
                      >
                        <Globe size={13} />
                      </button>
                      <button
                        type="button"
                        className={`elementor-typography-trigger-btn ${showTypographyPopover ? 'active' : ''}`}
                        title="Editar Tipografia Completa"
                        onClick={() => setShowTypographyPopover(!showTypographyPopover)}
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* ── FLOATING / INLINE TYPOGRAPHY POPOVER (LIGHT THEME MATCHING SYSTEM) ── */}
                  {showTypographyPopover && (
                    <div className="elementor-typography-popover">
                      <div className="elementor-typography-popover-header">
                        <span className="elementor-typography-popover-title">Tipografia</span>
                        <div className="elementor-typography-popover-actions">
                          <button
                            type="button"
                            title="Redefinir tipografia"
                            onClick={() => {
                              update('font_family', '')
                              update('font_size', '')
                              update('font_weight', '')
                              update('line_height', '')
                              update('letter_spacing', '')
                              update('text_transform', '')
                              updateWidgetStyle('font_family', '')
                              updateWidgetStyle('font_size', '')
                              updateWidgetStyle('font_weight', '')
                              updateWidgetStyle('line_height', '')
                              updateWidgetStyle('letter_spacing', '')
                              updateWidgetStyle('text_transform', '')
                            }}
                          >
                            <RotateCcw size={12} />
                          </button>
                          <button
                            type="button"
                            title="Fechar"
                            onClick={() => setShowTypographyPopover(false)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Família */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Família</label>
                        <select
                          value={obj.font_family || obj.settings?.font_family || obj.style?.fontFamily || ''}
                          onChange={e => {
                            update('font_family', e.target.value)
                            updateWidgetStyle('font_family', e.target.value)
                          }}
                        >
                          <option value="">Padrão (SF Pro Apple)</option>
                          <option value='Inter, -apple-system, sans-serif'>Inter</option>
                          <option value='Roboto, -apple-system, sans-serif'>Roboto</option>
                          <option value='Outfit, -apple-system, sans-serif'>Outfit</option>
                          <option value='Montserrat, sans-serif'>Montserrat</option>
                          <option value='Poppins, sans-serif'>Poppins</option>
                          <option value='"Plus Jakarta Sans", sans-serif'>Plus Jakarta Sans</option>
                          <option value='system-ui, -apple-system, sans-serif'>System UI</option>
                          <option value='Georgia, serif'>Georgia</option>
                          <option value='"SF Mono", Menlo, monospace'>SF Mono</option>
                        </select>
                      </div>

                      {/* Tamanho */}
                      <div className="elementor-control-row">
                        <div className="elementor-control-label">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Tamanho</span>
                            <ResponsiveLabelSwitcher />
                          </div>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {(['px', 'rem', 'em', 'vw'] as const).map(u => (
                              <button
                                key={u}
                                type="button"
                                style={{
                                  background: fontSizeUnit === u ? '#0071e3' : '#f5f5f7',
                                  color: fontSizeUnit === u ? '#fff' : '#6e6e73',
                                  border: '1px solid #e5e5ea',
                                  borderRadius: 3,
                                  fontSize: 9,
                                  fontWeight: 600,
                                  padding: '1px 4px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setFontSizeUnit(u)}
                              >
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="8"
                            max={fontSizeUnit === 'rem' || fontSizeUnit === 'em' ? 8 : (fontSizeUnit === 'vw' ? 10 : 120)}
                            step={fontSizeUnit === 'rem' || fontSizeUnit === 'em' ? '0.1' : '1'}
                            value={parseFloat(String(getVal('font_size', '16')).replace(/[^0-9.]/g, '')) || 16}
                            onChange={e => {
                              const val = `${e.target.value}${fontSizeUnit}`
                              updateResponsive('font_size', val)
                              updateWidgetStyle('font_size', val)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <div style={{ width: '80px' }}>
                            <StepperNumberInput
                              value={getVal('font_size', `16${fontSizeUnit}`)}
                              step={fontSizeUnit === 'rem' || fontSizeUnit === 'em' ? 0.1 : 1}
                              min={1}
                              max={300}
                              onChange={v => {
                                const cleanNum = String(v).replace(/[^0-9.-]/g, '')
                                const formatted = cleanNum === '' ? '' : `${cleanNum}${fontSizeUnit}`
                                updateResponsive('font_size', formatted)
                                updateWidgetStyle('font_size', formatted)
                              }}
                              placeholder={`16${fontSizeUnit}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Peso */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Peso</label>
                        <select
                          value={obj.font_weight || obj.settings?.font_weight || obj.style?.fontWeight || '400'}
                          onChange={e => {
                            update('font_weight', e.target.value)
                            updateWidgetStyle('font_weight', e.target.value)
                          }}
                        >
                          <option value="100">100 (Fininho)</option>
                          <option value="200">200 (Extra Fino)</option>
                          <option value="300">300 (Fino / Light)</option>
                          <option value="400">400 (Normal / Regular)</option>
                          <option value="500">500 (Médio / Medium)</option>
                          <option value="600">600 (Semi-Bold)</option>
                          <option value="700">700 (Negrito / Bold)</option>
                          <option value="800">800 (Extra Bold)</option>
                          <option value="900">900 (Preto / Black)</option>
                        </select>
                      </div>

                      {/* Transformação */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Transformação</label>
                        <select
                          value={obj.text_transform || obj.settings?.text_transform || 'none'}
                          onChange={e => {
                            update('text_transform', e.target.value)
                            updateWidgetStyle('text_transform', e.target.value)
                          }}
                        >
                          <option value="none">Padrão</option>
                          <option value="uppercase">Maiúsculas</option>
                          <option value="lowercase">Minúsculas</option>
                          <option value="capitalize">Capitalizada</option>
                        </select>
                      </div>

                      {/* Estilo */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Estilo</label>
                        <select
                          value={obj.font_style || obj.settings?.font_style || 'normal'}
                          onChange={e => {
                            update('font_style', e.target.value)
                            updateWidgetStyle('font_style', e.target.value)
                          }}
                        >
                          <option value="normal">Padrão (Normal)</option>
                          <option value="italic">Itálico</option>
                          <option value="oblique">Oblíquo</option>
                        </select>
                      </div>

                      {/* Decoração */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Decoração</label>
                        <select
                          value={obj.text_decoration || obj.settings?.text_decoration || 'none'}
                          onChange={e => {
                            update('text_decoration', e.target.value)
                            updateWidgetStyle('text_decoration', e.target.value)
                          }}
                        >
                          <option value="none">Padrão</option>
                          <option value="underline">Sublinhado</option>
                          <option value="line-through">Tachado</option>
                          <option value="overline">Sobrelinha</option>
                        </select>
                      </div>

                      {/* Altura da Linha */}
                      <div className="elementor-control-row">
                        <div className="elementor-control-label">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Altura da linha</span>
                            <ResponsiveLabelSwitcher />
                          </div>
                          <span className="elementor-unit-badge">em</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="0.8"
                            max="3.0"
                            step="0.05"
                            value={parseFloat(String(obj.line_height || obj.settings?.line_height || '1.2')) || 1.2}
                            onChange={e => {
                              update('line_height', e.target.value)
                              updateWidgetStyle('line_height', e.target.value)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            style={{ width: '60px', textAlign: 'center' }}
                            value={obj.line_height || obj.settings?.line_height || '1.2'}
                            onChange={e => {
                              update('line_height', e.target.value)
                              updateWidgetStyle('line_height', e.target.value)
                            }}
                          />
                        </div>
                      </div>

                      {/* Espaçamento entre Letras */}
                      <div className="elementor-control-row">
                        <div className="elementor-control-label">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Espaçamento entre letras</span>
                            <ResponsiveLabelSwitcher />
                          </div>
                          <span className="elementor-unit-badge">px</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="-5"
                            max="20"
                            step="0.5"
                            value={parseFloat(String(obj.letter_spacing || obj.settings?.letter_spacing || '0').replace(/[^0-9.-]/g, '')) || 0}
                            onChange={e => {
                              const val = `${e.target.value}px`
                              update('letter_spacing', val)
                              updateWidgetStyle('letter_spacing', val)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <div style={{ width: '80px' }}>
                            <StepperNumberInput
                              value={obj.letter_spacing || obj.settings?.letter_spacing || '0px'}
                              step={0.5}
                              min={-10}
                              max={50}
                              onChange={v => {
                                const cleanNum = String(v).replace(/[^0-9.-]/g, '')
                                const formatted = cleanNum === '' ? '' : `${cleanNum}px`
                                update('letter_spacing', formatted)
                                updateWidgetStyle('letter_spacing', formatted)
                              }}
                              placeholder="0px"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Espaçamento entre Palavras */}
                      <div className="elementor-control-row">
                        <div className="elementor-control-label">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Espaçamento entre palavras</span>
                            <ResponsiveLabelSwitcher />
                          </div>
                          <span className="elementor-unit-badge">em</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={parseFloat(String(obj.word_spacing || obj.settings?.word_spacing || '0').replace(/[^0-9.-]/g, '')) || 0}
                            onChange={e => {
                              const val = `${e.target.value}em`
                              update('word_spacing', val)
                              updateWidgetStyle('word_spacing', val)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <div style={{ width: '80px' }}>
                            <StepperNumberInput
                              value={obj.word_spacing || obj.settings?.word_spacing || '0em'}
                              step={0.1}
                              min={0}
                              max={20}
                              onChange={v => {
                                const cleanNum = String(v).replace(/[^0-9.-]/g, '')
                                const formatted = cleanNum === '' ? '' : `${cleanNum}em`
                                update('word_spacing', formatted)
                                updateWidgetStyle('word_spacing', formatted)
                              }}
                              placeholder="0em"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionSection>
              )}

              {/* ── ESTILO DA CAIXA DE ÍCONE (Ícone, Título e Descrição independentes) ── */}
              {item.type === 'widget' && isIconBox && (
                <>
                  <AccordionSection
                    title="Ícone"
                    isOpen={openAccordions.iconBoxIcon !== false}
                    onToggle={() => toggleAccordion('iconBoxIcon')}
                  >
                    <ControlRow label="Cor do Ícone">
                      <ColorControl
                        value={obj.icon_color || obj.settings?.icon_color || obj.content?.icon_color || '#1d1d1f'}
                        onChange={v => {
                          update('icon_color', v)
                          updateWidgetStyle('icon_color', v)
                          updateWidgetContent('icon_color', v)
                        }}
                      />
                    </ControlRow>

                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Tamanho do Ícone</span>
                          <ResponsiveLabelSwitcher />
                        </div>
                        <span style={{ fontSize: 11, color: '#86868b' }}>{getVal('icon_size', '32px')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="range"
                          min="12"
                          max="120"
                          value={parseInt(String(getVal('icon_size', '32')).replace(/[^0-9]/g, ''), 10) || 32}
                          onChange={e => {
                            const val = `${e.target.value}px`
                            updateResponsive('icon_size', val)
                            updateWidgetStyle('icon_size', val)
                            updateWidgetContent('icon_size', parseInt(e.target.value) || 32)
                          }}
                          style={{ flex: 1, accentColor: '#0071e3' }}
                        />
                        <div style={{ width: '80px' }}>
                          <StepperNumberInput
                            value={getVal('icon_size', '32px')}
                            onChange={v => {
                              const clean = String(v).replace(/[^0-9.-]/g, '')
                              const formatted = clean === '' ? '' : `${clean}px`
                              updateResponsive('icon_size', formatted)
                              updateWidgetStyle('icon_size', formatted)
                              updateWidgetContent('icon_size', parseInt(clean) || 32)
                            }}
                            placeholder="32px"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Espaçamento do Ícone</span>
                          <ResponsiveLabelSwitcher />
                        </div>
                        <span style={{ fontSize: 11, color: '#86868b' }}>{getVal('icon_spacing', '12px')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          value={parseInt(String(getVal('icon_spacing', '12')).replace(/[^0-9]/g, ''), 10) || 12}
                          onChange={e => {
                            const val = `${e.target.value}px`
                            updateResponsive('icon_spacing', val)
                            updateWidgetStyle('icon_spacing', val)
                            updateWidgetContent('icon_spacing', parseInt(e.target.value) || 12)
                          }}
                          style={{ flex: 1, accentColor: '#0071e3' }}
                        />
                        <div style={{ width: '80px' }}>
                          <StepperNumberInput
                            value={getVal('icon_spacing', '12px')}
                            onChange={v => {
                              const clean = String(v).replace(/[^0-9.-]/g, '')
                              const formatted = clean === '' ? '' : `${clean}px`
                              updateResponsive('icon_spacing', formatted)
                              updateWidgetStyle('icon_spacing', formatted)
                              updateWidgetContent('icon_spacing', parseInt(clean) || 12)
                            }}
                            placeholder="12px"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Título"
                    isOpen={openAccordions.iconBoxTitle !== false}
                    onToggle={() => toggleAccordion('iconBoxTitle')}
                  >
                    <ControlRow label="Cor do Título">
                      <ColorControl
                        value={obj.title_color || obj.settings?.title_color || obj.content?.title_color || '#1d1d1f'}
                        onChange={v => {
                          update('title_color', v)
                          updateWidgetStyle('title_color', v)
                          updateWidgetContent('title_color', v)
                        }}
                      />
                    </ControlRow>

                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Tamanho da Fonte (Título)</span>
                          <ResponsiveLabelSwitcher />
                        </div>
                        <span style={{ fontSize: 11, color: '#86868b' }}>{getVal('title_size', '20px')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="range"
                          min="12"
                          max="80"
                          value={parseInt(String(getVal('title_size', '20')).replace(/[^0-9]/g, ''), 10) || 20}
                          onChange={e => {
                            const val = `${e.target.value}px`
                            updateResponsive('title_size', val)
                            updateWidgetStyle('title_size', val)
                            updateWidgetContent('title_size', parseInt(e.target.value) || 20)
                          }}
                          style={{ flex: 1, accentColor: '#0071e3' }}
                        />
                        <div style={{ width: '80px' }}>
                          <StepperNumberInput
                            value={getVal('title_size', '20px')}
                            onChange={v => {
                              const clean = String(v).replace(/[^0-9.-]/g, '')
                              const formatted = clean === '' ? '' : `${clean}px`
                              updateResponsive('title_size', formatted)
                              updateWidgetStyle('title_size', formatted)
                              updateWidgetContent('title_size', parseInt(clean) || 20)
                            }}
                            placeholder="20px"
                          />
                        </div>
                      </div>
                    </div>

                    <ControlRow label="Peso da Fonte (Título)" style={{ marginTop: 8 }}>
                      <select
                        className="elementor-select"
                        value={obj.title_weight || obj.settings?.title_weight || '600'}
                        onChange={e => {
                          update('title_weight', e.target.value)
                          updateWidgetStyle('title_weight', e.target.value)
                          updateWidgetContent('title_weight', e.target.value)
                        }}
                      >
                        <option value="400">Normal (400)</option>
                        <option value="500">Médio (500)</option>
                        <option value="600">Semi-Bold (600)</option>
                        <option value="700">Negrito (700)</option>
                        <option value="800">Extra Bold (800)</option>
                      </select>
                    </ControlRow>
                  </AccordionSection>

                  <AccordionSection
                    title="Descrição"
                    isOpen={openAccordions.iconBoxDesc !== false}
                    onToggle={() => toggleAccordion('iconBoxDesc')}
                  >
                    <ControlRow label="Cor da Descrição">
                      <ColorControl
                        value={obj.description_color || obj.settings?.description_color || obj.content?.description_color || '#6e6e73'}
                        onChange={v => {
                          update('description_color', v)
                          updateWidgetStyle('description_color', v)
                          updateWidgetContent('description_color', v)
                        }}
                      />
                    </ControlRow>

                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Tamanho da Fonte (Descrição)</span>
                          <ResponsiveLabelSwitcher />
                        </div>
                        <span style={{ fontSize: 11, color: '#86868b' }}>{getVal('description_size', '14px')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="range"
                          min="10"
                          max="32"
                          value={parseInt(String(getVal('description_size', '14')).replace(/[^0-9]/g, ''), 10) || 14}
                          onChange={e => {
                            const val = `${e.target.value}px`
                            updateResponsive('description_size', val)
                            updateWidgetStyle('description_size', val)
                            updateWidgetContent('description_size', parseInt(e.target.value) || 14)
                          }}
                          style={{ flex: 1, accentColor: '#0071e3' }}
                        />
                        <div style={{ width: '80px' }}>
                          <StepperNumberInput
                            value={getVal('description_size', '14px')}
                            onChange={v => {
                              const clean = String(v).replace(/[^0-9.-]/g, '')
                              const formatted = clean === '' ? '' : `${clean}px`
                              updateResponsive('description_size', formatted)
                              updateWidgetStyle('description_size', formatted)
                              updateWidgetContent('description_size', parseInt(clean) || 14)
                            }}
                            placeholder="14px"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionSection>
                </>
              )}

              {/* ── ESTILO DO ÍCONE ── */}
              {item.type === 'widget' && isIcon && (
                <AccordionSection
                  title="Ícone"
                  isOpen={openAccordions.widgetStyle !== false}
                  onToggle={() => toggleAccordion('widgetStyle')}
                >
                  <ControlRow label="Cor do Ícone">
                    <ColorControl
                      value={obj.icon_color || obj.style?.color || '#f59e0b'}
                      onChange={v => {
                        update('icon_color', v)
                        updateWidgetStyle('color', v)
                        updateWidgetContent('icon_color', v)
                      }}
                    />
                  </ControlRow>

                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Tamanho do Ícone</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <span style={{ fontSize: 11, color: '#86868b' }}>{getVal('icon_size', '36px')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="12"
                        max="160"
                        value={parseInt(String(getVal('icon_size', '36')).replace(/[^0-9]/g, ''), 10) || 36}
                        onChange={e => {
                          const val = `${e.target.value}px`
                          updateResponsive('icon_size', val)
                          updateWidgetStyle('icon_size', val)
                          updateWidgetContent('icon_size', parseInt(e.target.value) || 36)
                        }}
                        style={{ flex: 1, accentColor: '#0071e3' }}
                      />
                      <div style={{ width: '80px' }}>
                        <StepperNumberInput
                          value={getVal('icon_size', '36px')}
                          onChange={v => {
                            const clean = String(v).replace(/[^0-9.-]/g, '')
                            const formatted = clean === '' ? '' : `${clean}px`
                            updateResponsive('icon_size', formatted)
                            updateWidgetStyle('icon_size', formatted)
                            updateWidgetContent('icon_size', parseInt(clean) || 36)
                          }}
                          placeholder="36px"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionSection>
              )}

              {/* ── PLANO DE FUNDO & BORDAS GENÉRICAS (OCULTAS EM WIDGETS DEDICADOS) ── */}
              {!isProductLineupGallery && !isCards && !isOffersCarousel && (
                <>
                  <AccordionSection
                    title="Plano de fundo"
                isOpen={openAccordions.background}
                onToggle={() => toggleAccordion('background')}
              >
                {/* Normal / Ao passar o mouse */}
                <SegmentedTabs
                  active={bgHoverTab}
                  onChange={(v) => setBgHoverTab(v as 'normal' | 'hover')}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'hover', label: 'Ao passar o mouse' },
                  ]}
                />

                {bgHoverTab === 'hover' && (
                  <p className="elementor-note-caption" style={{ marginTop: -6 }}>
                    ✦ Ao passar o mouse — configurações de estado hover.
                  </p>
                )}

                {/* Tipo de plano de fundo (apenas no modo Normal) */}
                {bgHoverTab === 'normal' && (
                  <ControlRow label="Tipo de plano de fundo">
                    <IconGroupSelector
                      value={obj.bg_type || 'color'}
                      onChange={v => {
                        update('bg_type', v)
                        if (item.type === 'widget') updateWidgetStyle('bg_type', v)
                      }}
                      options={[
                        { value: 'color', icon: <Paintbrush size={13} />, title: 'Clássico (Cor ou Imagem)' },
                        { value: 'gradient', icon: <svg width="13" height="13" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" strokeWidth="2" /><path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" /></svg>, title: 'Gradiente' },
                        { value: 'video', icon: <Video size={13} />, title: 'Vídeo' },
                        { value: 'slideshow', icon: <ImageIcon size={13} />, title: 'Slideshow' },
                      ]}
                    />
                  </ControlRow>
                )}

                {/* ── COR (presente em ambas as abas) ── */}
                <ControlRow label="Cor">
                  <ColorControl
                    value={getBgVal('bg_color', bgHoverTab === 'hover' ? '' : (obj.bg_color || obj.settings?.bg_color || obj.style?.backgroundColor || ''))}
                    onChange={v => updateBg('bg_color', v)}
                  />
                </ControlRow>

                {/* ── 1. CLÁSSICO — IMAGEM (apenas no modo Normal quando bg_type === color) ── */}
                {bgHoverTab === 'normal' && (!obj.bg_type || obj.bg_type === 'color') && (
                  <>
                    {/* Imagem */}
                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Imagem</span>
                          <ResponsiveLabelSwitcher />
                        </div>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', color: '#ea9cfb', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                          title="Variações com IA"
                          onClick={() => {
                            const randomAssets = [
                              'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
                              'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=1200&auto=format&fit=crop&q=80',
                              'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
                              'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80'
                            ]
                            const next = randomAssets[Math.floor(Math.random() * randomAssets.length)]
                            update('bg_image', next)
                            if (item.type === 'widget') updateWidgetStyle('bg_image', next)
                          }}
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                      <ImageThumbnailBox
                        src={obj.bg_image || obj.settings?.bg_image || ''}
                        onChange={url => {
                          update('bg_image', url)
                          if (item.type === 'widget') updateWidgetStyle('bg_image', url)
                        }}
                      />
                    </div>

                    {/* Resolução da imagem */}
                    <ControlRow label="Resolução">
                      <select
                        className="elementor-select"
                        value={obj.bg_resolution || 'full'}
                        onChange={e => update('bg_resolution', e.target.value)}
                      >
                        <option value="full">Completo</option>
                        <option value="large">Grande (1024px)</option>
                        <option value="medium">Médio (300px)</option>
                        <option value="thumbnail">Miniatura (150px)</option>
                      </select>
                    </ControlRow>
                    <p className="elementor-note-caption">Não se aplica a imagens dinâmicas.</p>

                    {/* Posição */}
                    <ControlRow label="Posição" responsive>
                      <select
                        className="elementor-select"
                        value={obj.bg_position || 'center center'}
                        onChange={e => update('bg_position', e.target.value)}
                      >
                        <option value="default">Padrão</option>
                        <option value="center center">Centro ao centro</option>
                        <option value="center left">Centro à esquerda</option>
                        <option value="center right">Centro à direita</option>
                        <option value="top center">Superior ao centro</option>
                        <option value="top left">Superior à esquerda</option>
                        <option value="top right">Superior à direita</option>
                        <option value="bottom center">Inferior ao centro</option>
                        <option value="bottom left">Inferior à esquerda</option>
                        <option value="bottom right">Inferior à direita</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </ControlRow>

                    {/* Anexo */}
                    <ControlRow label="Anexo">
                      <select
                        className="elementor-select"
                        value={obj.bg_attachment || 'scroll'}
                        onChange={e => update('bg_attachment', e.target.value)}
                      >
                        <option value="scroll">Padrão</option>
                        <option value="fixed">Fixo (Parallax)</option>
                        <option value="local">Rolar</option>
                      </select>
                    </ControlRow>

                    {/* Repetir */}
                    <ControlRow label="Repetir" responsive>
                      <select
                        className="elementor-select"
                        value={obj.bg_repeat || 'no-repeat'}
                        onChange={e => update('bg_repeat', e.target.value)}
                      >
                        <option value="no-repeat">Não repetir</option>
                        <option value="repeat">Repetir</option>
                        <option value="repeat-x">Repetir-x</option>
                        <option value="repeat-y">Repetir-y</option>
                      </select>
                    </ControlRow>

                    {/* Tamanho de exibição */}
                    <ControlRow label="Tamanho de exibição" responsive>
                      <select
                        className="elementor-select"
                        value={obj.bg_size || 'cover'}
                        onChange={e => update('bg_size', e.target.value)}
                      >
                        <option value="cover">Cobertura</option>
                        <option value="contain">Conter</option>
                        <option value="auto">Automático</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </ControlRow>
                  </>
                )}

                {/* ── 2. GRADIENTE (COR 1, COR 2, ÂNGULO, TIPO) ── */}
                {obj.bg_type === 'gradient' && (
                  <>
                    <ControlRow label="Cor Principal">
                      <ColorControl
                        value={obj.bg_gradient_color1 || '#0071e3'}
                        onChange={v => {
                          const l1 = obj.bg_gradient_loc1 ?? 0
                          const c2 = obj.bg_gradient_color2 || '#000000'
                          const l2 = obj.bg_gradient_loc2 ?? 100
                          const angle = obj.bg_gradient_angle ?? 90
                          const grad = `linear-gradient(${angle}deg, ${v} ${l1}%, ${c2} ${l2}%)`
                          update('bg_gradient_color1', v)
                          update('bg_gradient', grad)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_gradient_color1', v)
                            updateWidgetStyle('bg_gradient', grad)
                          }
                        }}
                      />
                    </ControlRow>

                    <SliderRangeControl
                      label="Localização 1"
                      value={obj.bg_gradient_loc1 ?? 0}
                      min={0}
                      max={100}
                      unit="%"
                      onChange={v => {
                        const c1 = obj.bg_gradient_color1 || '#0071e3'
                        const c2 = obj.bg_gradient_color2 || '#000000'
                        const l2 = obj.bg_gradient_loc2 ?? 100
                        const angle = obj.bg_gradient_angle ?? 90
                        const grad = `linear-gradient(${angle}deg, ${c1} ${v}%, ${c2} ${l2}%)`
                        update('bg_gradient_loc1', v)
                        update('bg_gradient', grad)
                        if (item.type === 'widget') {
                          updateWidgetStyle('bg_gradient_loc1', v)
                          updateWidgetStyle('bg_gradient', grad)
                        }
                      }}
                    />

                    <ControlRow label="Segunda Cor">
                      <ColorControl
                        value={obj.bg_gradient_color2 || '#000000'}
                        onChange={v => {
                          const c1 = obj.bg_gradient_color1 || '#0071e3'
                          const l1 = obj.bg_gradient_loc1 ?? 0
                          const l2 = obj.bg_gradient_loc2 ?? 100
                          const angle = obj.bg_gradient_angle ?? 90
                          const grad = `linear-gradient(${angle}deg, ${c1} ${l1}%, ${v} ${l2}%)`
                          update('bg_gradient_color2', v)
                          update('bg_gradient', grad)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_gradient_color2', v)
                            updateWidgetStyle('bg_gradient', grad)
                          }
                        }}
                      />
                    </ControlRow>

                    <SliderRangeControl
                      label="Localização 2"
                      value={obj.bg_gradient_loc2 ?? 100}
                      min={0}
                      max={100}
                      unit="%"
                      onChange={v => {
                        const c1 = obj.bg_gradient_color1 || '#0071e3'
                        const l1 = obj.bg_gradient_loc1 ?? 0
                        const c2 = obj.bg_gradient_color2 || '#000000'
                        const angle = obj.bg_gradient_angle ?? 90
                        const grad = `linear-gradient(${angle}deg, ${c1} ${l1}%, ${c2} ${v}%)`
                        update('bg_gradient_loc2', v)
                        update('bg_gradient', grad)
                        if (item.type === 'widget') {
                          updateWidgetStyle('bg_gradient_loc2', v)
                          updateWidgetStyle('bg_gradient', grad)
                        }
                      }}
                    />

                    <ControlRow label="Tipo">
                      <select
                        className="elementor-select"
                        value={obj.bg_gradient_type || 'linear'}
                        onChange={e => {
                          const t = e.target.value
                          const c1 = obj.bg_gradient_color1 || '#0071e3'
                          const l1 = obj.bg_gradient_loc1 ?? 0
                          const c2 = obj.bg_gradient_color2 || '#000000'
                          const l2 = obj.bg_gradient_loc2 ?? 100
                          const angle = obj.bg_gradient_angle ?? 90
                          const grad = t === 'radial'
                            ? `radial-gradient(circle, ${c1} ${l1}%, ${c2} ${l2}%)`
                            : `linear-gradient(${angle}deg, ${c1} ${l1}%, ${c2} ${l2}%)`
                          update('bg_gradient_type', t)
                          update('bg_gradient', grad)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_gradient_type', t)
                            updateWidgetStyle('bg_gradient', grad)
                          }
                        }}
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    </ControlRow>

                    {(!obj.bg_gradient_type || obj.bg_gradient_type === 'linear') && (
                      <SliderRangeControl
                        label="Ângulo"
                        value={obj.bg_gradient_angle ?? 90}
                        min={0}
                        max={360}
                        unit="°"
                        onChange={v => {
                          const c1 = obj.bg_gradient_color1 || '#0071e3'
                          const l1 = obj.bg_gradient_loc1 ?? 0
                          const c2 = obj.bg_gradient_color2 || '#000000'
                          const l2 = obj.bg_gradient_loc2 ?? 100
                          const grad = `linear-gradient(${v}deg, ${c1} ${l1}%, ${c2} ${l2}%)`
                          update('bg_gradient_angle', v)
                          update('bg_gradient', grad)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_gradient_angle', v)
                            updateWidgetStyle('bg_gradient', grad)
                          }
                        }}
                      />
                    )}

                    {/* Gradient preview swatch */}
                    <div style={{
                      height: 28,
                      borderRadius: 6,
                      border: '1px solid rgba(0,0,0,0.12)',
                      background: obj.bg_gradient || `linear-gradient(${obj.bg_gradient_angle ?? 90}deg, ${obj.bg_gradient_color1 || '#0071e3'} ${obj.bg_gradient_loc1 ?? 0}%, ${obj.bg_gradient_color2 || '#000000'} ${obj.bg_gradient_loc2 ?? 100}%)`,
                      marginTop: 6,
                      marginBottom: 10,
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
                    }} />
                  </>
                )}

                {/* ── 3. VÍDEO (LINK DO VÍDEO, START, END, LOOP, MOBILE FALLBACK) ── */}
                {obj.bg_type === 'video' && (
                  <>
                    <ControlRow label="Formato do Vídeo">
                      <SegmentedTabs
                        active={obj.bg_video_source || 'link'}
                        onChange={v => {
                          update('bg_video_source', v)
                          if (item.type === 'widget') updateWidgetStyle('bg_video_source', v)
                        }}
                        options={[
                          { value: 'link', label: 'Link Externo' },
                          { value: 'upload', label: 'Upload / GIF' },
                        ]}
                      />
                    </ControlRow>

                    {(obj.bg_video_source !== 'upload') ? (
                      <>
                        <ControlRow label="Link do Vídeo">
                          <input
                            className="elementor-input"
                            value={obj.bg_video_url || ''}
                            onChange={e => {
                              update('bg_video_url', e.target.value)
                              if (item.type === 'widget') updateWidgetStyle('bg_video_url', e.target.value)
                            }}
                            placeholder="YouTube, Vimeo ou link MP4..."
                          />
                        </ControlRow>
                        <p className="elementor-note-caption">YouTube, Vimeo ou MP4 direto.</p>
                      </>
                    ) : (
                      <div className="elementor-control-row stacked">
                        <div className="elementor-control-label">
                          <span>Vídeo Leve / GIF Animado</span>
                        </div>
                        <ImageThumbnailBox
                          src={obj.bg_video_file || obj.bg_video_url || ''}
                          title="Vídeo ou GIF"
                          onChange={url => {
                            update('bg_video_file', url)
                            update('bg_video_url', url)
                            if (item.type === 'widget') {
                              updateWidgetStyle('bg_video_file', url)
                              updateWidgetStyle('bg_video_url', url)
                            }
                          }}
                        />
                        <p className="elementor-note-caption">MP4, WebM ou GIF da biblioteca.</p>
                      </div>
                    )}

                    <ControlRow label="Hora de Início (s)">
                      <StepperNumberInput
                        value={obj.bg_video_start || 0}
                        min={0}
                        max={3600}
                        step={1}
                        className="elementor-input"
                        onChange={v => update('bg_video_start', parseInt(v, 10) || 0)}
                      />
                    </ControlRow>

                    <ControlRow label="Hora de Término (s)">
                      <StepperNumberInput
                        value={obj.bg_video_end || 30}
                        min={0}
                        max={3600}
                        step={1}
                        className="elementor-input"
                        onChange={v => update('bg_video_end', parseInt(v, 10) || 0)}
                      />
                    </ControlRow>

                    <ControlRow label="Repetir (Loop)">
                      <ToggleSwitch
                        checked={obj.bg_video_loop !== false}
                        onChange={v => update('bg_video_loop', v)}
                      />
                    </ControlRow>

                    <ControlRow label="Reproduzir uma vez">
                      <ToggleSwitch
                        checked={!!obj.bg_video_play_once}
                        onChange={v => update('bg_video_play_once', v)}
                      />
                    </ControlRow>

                    {/* Mobile Fallback Image */}
                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label">
                        <span>Fallback para celular (Imagem)</span>
                      </div>
                      <ImageThumbnailBox
                        src={obj.bg_video_fallback || obj.bg_image || ''}
                        onChange={url => {
                          update('bg_video_fallback', url)
                          update('bg_image', url)
                          if (item.type === 'widget') updateWidgetStyle('bg_image', url)
                        }}
                      />
                      <p className="elementor-note-caption">
                        Substitui o vídeo em celular/conexões lentas.
                      </p>
                    </div>
                  </>
                )}

                {/* ── 4. SLIDESHOW (GALERIA DE IMAGENS, DURAÇÃO, TRANSIÇÃO) ── */}
                {obj.bg_type === 'slideshow' && (
                  <>
                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Imagens do Slideshow</span>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', color: '#ea9cfb', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                          title="Inserir imagens com IA"
                          onClick={() => {
                            const sampleImages = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80, https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=1200&q=80, https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80'
                            update('bg_slideshow_images', sampleImages)
                            update('bg_image', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80')
                          }}
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                      <ImageThumbnailBox
                        src={obj.bg_image || (typeof obj.bg_slideshow_images === 'string' ? obj.bg_slideshow_images.split(',')[0]?.trim() : '') || ''}
                        onChange={url => {
                          update('bg_image', url)
                          update('bg_slideshow_images', url)
                        }}
                      />
                    </div>

                    <SliderRangeControl
                      label="Duração do Slide"
                      value={obj.bg_slideshow_duration || 5000}
                      min={1000}
                      max={10000}
                      step={500}
                      unit="ms"
                      onChange={v => update('bg_slideshow_duration', v)}
                    />

                    <ControlRow label="Transição">
                      <select
                        className="elementor-select"
                        value={obj.bg_slideshow_transition || 'fade'}
                        onChange={e => update('bg_slideshow_transition', e.target.value)}
                      >
                        <option value="fade">Fade</option>
                        <option value="slide_right">Deslizar para a Direita</option>
                        <option value="slide_left">Deslizar para a Esquerda</option>
                        <option value="slide_up">Deslizar para Cima</option>
                        <option value="slide_down">Deslizar para Baixo</option>
                        <option value="ken_burns">Ken Burns (Zoom Suave)</option>
                      </select>
                    </ControlRow>

                    <SliderRangeControl
                      label="Duração da Transição"
                      value={obj.bg_slideshow_transition_duration || 500}
                      min={200}
                      max={3000}
                      step={100}
                      unit="ms"
                      onChange={v => update('bg_slideshow_transition_duration', v)}
                    />

                    <ControlRow label="Tamanho de exibição">
                      <select
                        className="elementor-select"
                        value={obj.bg_slideshow_size || 'cover'}
                        onChange={e => update('bg_slideshow_size', e.target.value)}
                      >
                        <option value="cover">Cobertura</option>
                        <option value="contain">Conter</option>
                        <option value="auto">Automático</option>
                      </select>
                    </ControlRow>
                  </>
                )}

                {/* Scrolling Effects & Mouse Effects (apenas no modo Normal) */}
                {bgHoverTab === 'normal' && (
                  <>
                    {/* Scrolling Effects */}
                    <ControlRow label="Scrolling Effects">
                      <ToggleSwitch
                        checked={!!obj.scrolling_effects}
                        onChange={v => update('scrolling_effects', v)}
                      />
                    </ControlRow>

                    {obj.scrolling_effects && (
                      <div style={{ background: '#f8f9fa', padding: '8px 10px', borderRadius: 6, margin: '6px 0', border: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <ControlRow label="Rolagem Vertical">
                          <ToggleSwitch
                            checked={!!obj.vertical_scroll}
                            onChange={v => update('vertical_scroll', v)}
                          />
                        </ControlRow>
                        {obj.vertical_scroll && (
                          <SliderRangeControl
                            label="Velocidade Vertical"
                            value={obj.vertical_scroll_speed || 4}
                            min={1}
                            max={10}
                            onChange={v => update('vertical_scroll_speed', v)}
                          />
                        )}

                        <ControlRow label="Rolagem Horizontal">
                          <ToggleSwitch
                            checked={!!obj.horizontal_scroll}
                            onChange={v => update('horizontal_scroll', v)}
                          />
                        </ControlRow>
                        {obj.horizontal_scroll && (
                          <SliderRangeControl
                            label="Velocidade Horizontal"
                            value={obj.horizontal_scroll_speed || 4}
                            min={1}
                            max={10}
                            onChange={v => update('horizontal_scroll_speed', v)}
                          />
                        )}

                        <ControlRow label="Transparência ao rolar">
                          <ToggleSwitch
                            checked={!!obj.fade_scroll}
                            onChange={v => update('fade_scroll', v)}
                          />
                        </ControlRow>

                        <ControlRow label="Desfoque ao rolar">
                          <ToggleSwitch
                            checked={!!obj.blur_scroll}
                            onChange={v => update('blur_scroll', v)}
                          />
                        </ControlRow>
                      </div>
                    )}

                    {/* Mouse Effects */}
                    <ControlRow label="Mouse Effects">
                      <ToggleSwitch
                        checked={!!obj.mouse_effects}
                        onChange={v => update('mouse_effects', v)}
                      />
                    </ControlRow>

                    {obj.mouse_effects && (
                      <div style={{ background: '#f8f9fa', padding: '8px 10px', borderRadius: 6, margin: '6px 0', border: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <ControlRow label="Mouse Track">
                          <ToggleSwitch
                            checked={!!obj.mouse_track}
                            onChange={v => update('mouse_track', v)}
                          />
                        </ControlRow>
                        {obj.mouse_track && (
                          <ControlRow label="Direção do Mouse">
                            <select
                              className="elementor-select"
                              value={obj.mouse_track_direction || 'opposite'}
                              onChange={e => update('mouse_track_direction', e.target.value)}
                            >
                              <option value="opposite">Oposta (Inversa)</option>
                              <option value="direct">Direta</option>
                            </select>
                          </ControlRow>
                        )}

                        <ControlRow label="3D Tilt (Inclinação 3D)">
                          <ToggleSwitch
                            checked={!!obj.mouse_tilt}
                            onChange={v => update('mouse_tilt', v)}
                          />
                        </ControlRow>
                        {obj.mouse_tilt && (
                          <SliderRangeControl
                            label="Intensidade da Inclinação"
                            value={obj.mouse_tilt_speed || 5}
                            min={1}
                            max={10}
                            onChange={v => update('mouse_tilt_speed', v)}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Controles da aba Hover: Opacidade + Imagem + Gradiente + Duração da Transição */}
                {bgHoverTab === 'hover' && (
                  <>
                    {/* Opacidade no Hover */}
                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <span>Opacidade</span>
                        <span style={{ fontSize: '11px', color: '#86868b' }}>
                          {obj.hover_opacity !== undefined ? obj.hover_opacity : '1.0'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1.0"
                        step="0.05"
                        value={parseFloat(String(obj.hover_opacity !== undefined ? obj.hover_opacity : 1.0)) || 1.0}
                        onChange={e => {
                          update('hover_opacity', e.target.value)
                          if (item.type === 'widget') updateWidgetStyle('hover_opacity', e.target.value)
                        }}
                        style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Imagem de Fundo no Hover */}
                    <ControlRow label="Imagem (Hover)">
                      <input
                        className="elementor-input"
                        type="text"
                        placeholder="URL da imagem no hover"
                        value={obj.hover_bg_image || ''}
                        onChange={e => {
                          update('hover_bg_image', e.target.value)
                          if (item.type === 'widget') updateWidgetStyle('hover_bg_image', e.target.value)
                        }}
                      />
                    </ControlRow>

                    {/* Gradiente no Hover */}
                    <ControlRow label="Gradiente (Hover)">
                      <input
                        className="elementor-input"
                        type="text"
                        placeholder="linear-gradient(135deg, #0071e3, #5856d6)"
                        value={obj.hover_bg_gradient || ''}
                        onChange={e => {
                          update('hover_bg_gradient', e.target.value)
                          if (item.type === 'widget') updateWidgetStyle('hover_bg_gradient', e.target.value)
                        }}
                      />
                    </ControlRow>

                    <SliderRangeControl
                      label="Duração da transição"
                      value={parseFloat(String(obj.transition_duration || '0.3s').replace('s', '')) || 0.3}
                      min={0.1}
                      max={3.0}
                      step={0.1}
                      unit="s"
                      onChange={v => update('transition_duration', `${v}s`)}
                    />
                  </>
                )}
              </AccordionSection>

              {/* ── SOBREPOSIÇÃO DE FUNDO ── */}
              <AccordionSection
                title="Sobreposição de fundo"
                isOpen={openAccordions.overlay}
                onToggle={() => toggleAccordion('overlay')}
              >
                <SegmentedTabs
                  active={overlayHoverTab}
                  onChange={(v) => setOverlayHoverTab(v as 'normal' | 'hover')}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'hover', label: 'Ao passar o mouse' },
                  ]}
                />

                {overlayHoverTab === 'normal' ? (
                  <>
                    <ControlRow label="Cor / Gradiente">
                      <ColorControl
                        value={obj.bg_overlay || obj.settings?.bg_overlay || ''}
                        onChange={v => {
                          update('bg_overlay', v)
                          if (item.type === 'widget') updateWidgetStyle('bg_overlay', v)
                        }}
                      />
                    </ControlRow>
                    <ControlRow label="Opacidade (%)">
                      <input
                        className="elementor-input"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={
                          obj.bg_opacity !== undefined
                            ? (Number(obj.bg_opacity) <= 1 ? Math.round(Number(obj.bg_opacity) * 100) : String(obj.bg_opacity))
                            : (obj.bg_overlay_opacity !== undefined ? String(obj.bg_overlay_opacity) : '50')
                        }
                        onChange={e => {
                          const num = parseFloat(e.target.value) || 0
                          const val = num > 1 ? num / 100 : num
                          update('bg_opacity', val)
                          update('bg_overlay_opacity', num)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_opacity', val)
                            updateWidgetStyle('bg_overlay_opacity', num)
                          }
                        }}
                        placeholder="50"
                      />
                    </ControlRow>
                    <ControlRow label="Modo de mesclagem">
                      <select
                        className="elementor-select"
                        value={obj.bg_overlay_blend_mode || obj.blend_mode || 'normal'}
                        onChange={e => {
                          update('bg_overlay_blend_mode', e.target.value)
                          update('blend_mode', e.target.value)
                          if (item.type === 'widget') updateWidgetStyle('bg_overlay_blend_mode', e.target.value)
                        }}
                      >
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiplicação (Multiply)</option>
                        <option value="screen">Tela (Screen)</option>
                        <option value="overlay">Sobreposição (Overlay)</option>
                        <option value="darken">Escurecer (Darken)</option>
                        <option value="lighten">Clarear (Lighten)</option>
                        <option value="color-dodge">Subexposição de cores</option>
                        <option value="color-burn">Superexposição de cores</option>
                        <option value="hard-light">Luz direta (Hard Light)</option>
                        <option value="soft-light">Luz suave (Soft Light)</option>
                        <option value="difference">Diferença</option>
                        <option value="exclusion">Exclusão</option>
                        <option value="luminosity">Luminosidade</option>
                      </select>
                    </ControlRow>
                  </>
                ) : (
                  <>
                    <ControlRow label="Cor / Gradiente (Hover)">
                      <ColorControl
                        value={obj.hover_bg_overlay || obj.settings?.hover_bg_overlay || ''}
                        onChange={v => {
                          update('hover_bg_overlay', v)
                          if (item.type === 'widget') updateWidgetStyle('hover_bg_overlay', v)
                        }}
                      />
                    </ControlRow>
                    <ControlRow label="Opacidade no Hover (%)">
                      <input
                        className="elementor-input"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={
                          obj.hover_bg_opacity !== undefined
                            ? (Number(obj.hover_bg_opacity) <= 1 ? Math.round(Number(obj.hover_bg_opacity) * 100) : String(obj.hover_bg_opacity))
                            : (obj.hover_bg_overlay_opacity !== undefined ? String(obj.hover_bg_overlay_opacity) : '80')
                        }
                        onChange={e => {
                          const num = parseFloat(e.target.value) || 0
                          const val = num > 1 ? num / 100 : num
                          update('hover_bg_opacity', val)
                          update('hover_bg_overlay_opacity', num)
                          if (item.type === 'widget') {
                            updateWidgetStyle('hover_bg_opacity', val)
                            updateWidgetStyle('hover_bg_overlay_opacity', num)
                          }
                        }}
                        placeholder="80"
                      />
                    </ControlRow>
                    <ControlRow label="Duração da transição">
                      <input
                        className="elementor-input"
                        type="text"
                        value={obj.overlay_transition_duration || '0.3s'}
                        onChange={e => {
                          update('overlay_transition_duration', e.target.value)
                          if (item.type === 'widget') updateWidgetStyle('overlay_transition_duration', e.target.value)
                        }}
                        placeholder="0.3s"
                      />
                    </ControlRow>
                  </>
                )}
              </AccordionSection>

              {/* ── BORDA ── */}
              <AccordionSection
                title="Borda"
                isOpen={openAccordions.border}
                onToggle={() => toggleAccordion('border')}
              >
                {/* Normal / Ao passar o mouse */}
                <SegmentedTabs
                  active={borderHoverTab}
                  onChange={(v) => setBorderHoverTab(v as 'normal' | 'hover')}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'hover', label: 'Ao passar o mouse' },
                  ]}
                />

                {borderHoverTab === 'normal' ? (
                  <>
                    <ControlRow label="Tipo de borda">
                      <select
                        className="elementor-select"
                        value={obj.border_style || obj.border_type || 'none'}
                        onChange={e => {
                          update('border_style', e.target.value)
                          update('border_type', e.target.value)
                        }}
                      >
                        <option value="none">Nenhuma</option>
                        <option value="solid">Sólida</option>
                        <option value="double">Dupla</option>
                        <option value="dashed">Tracejada</option>
                        <option value="dotted">Pontilhada</option>
                      </select>
                    </ControlRow>

                    <DimensionsFourControl
                      label="Largura da borda"
                      top={obj.border_width_top || '0'}
                      right={obj.border_width_right || '0'}
                      bottom={obj.border_width_bottom || '0'}
                      left={obj.border_width_left || '0'}
                      onChange={(side, val) => update(`border_width_${side}`, val)}
                    />

                    <ControlRow label="Cor da borda">
                      <ColorControl
                        value={obj.border_color || ''}
                        onChange={v => update('border_color', v)}
                      />
                    </ControlRow>

                    <DimensionsFourControl
                      label="Raio da borda (Border Radius)"
                      top={obj.border_radius_top || obj.border_radius || '0'}
                      right={obj.border_radius_right || obj.border_radius || '0'}
                      bottom={obj.border_radius_bottom || obj.border_radius || '0'}
                      left={obj.border_radius_left || obj.border_radius || '0'}
                      onChange={(side, val) => {
                        update(`border_radius_${side}`, val)
                        update('border_radius', val)
                      }}
                    />

                    <ControlRow label="Sombra da caixa">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <select
                            className="elementor-select"
                            value={
                              !obj.box_shadow || obj.box_shadow === 'none'
                                ? 'none'
                                : obj.box_shadow.includes('0 4px 14px')
                                ? 'soft'
                                : obj.box_shadow.includes('0 8px 24px')
                                ? 'medium'
                                : obj.box_shadow.includes('0 20px 40px')
                                ? 'floating'
                                : obj.box_shadow.includes('0 0 25px')
                                ? 'glow'
                                : 'custom'
                            }
                            onChange={e => {
                              const v = e.target.value
                              let shadowVal = ''
                              if (v === 'soft') shadowVal = '0 4px 14px rgba(0, 0, 0, 0.10)'
                              else if (v === 'medium') shadowVal = '0 8px 24px rgba(0, 0, 0, 0.18)'
                              else if (v === 'floating') shadowVal = '0 20px 40px rgba(0, 0, 0, 0.28)'
                              else if (v === 'glow') shadowVal = '0 0 25px rgba(0, 113, 227, 0.5)'
                              else shadowVal = ''
                              update('box_shadow', shadowVal)
                              if (item.type === 'widget') updateWidgetStyle('box_shadow', shadowVal)
                            }}
                          >
                            <option value="none">Nenhuma</option>
                            <option value="soft">Suave (0 4px 14px)</option>
                            <option value="medium">Média (0 8px 24px)</option>
                            <option value="floating">Flutuante Apple (0 20px 40px)</option>
                            <option value="glow">Brilho / Glow (Neon)</option>
                            <option value="custom">Personalizada</option>
                          </select>
                          <ColorControl
                            value={(() => {
                              const s = obj.box_shadow || ''
                              if (!s || s === 'none') return ''
                              const match = s.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/i)
                              return match ? match[1] : s
                            })()}
                            onChange={c => {
                              if (!c) {
                                update('box_shadow', '')
                                if (item.type === 'widget') updateWidgetStyle('box_shadow', '')
                              } else {
                                const shadowVal = `0 8px 24px ${c}`
                                update('box_shadow', shadowVal)
                                if (item.type === 'widget') updateWidgetStyle('box_shadow', shadowVal)
                              }
                            }}
                          />
                        </div>
                      </div>
                    </ControlRow>
                  </>
                ) : (
                  <>
                    <p className="elementor-note-caption" style={{ marginTop: -6 }}>
                      ✦ Ao passar o mouse — borda e sombra no estado hover.
                    </p>

                    <ControlRow label="Cor da borda (Hover)">
                      <ColorControl
                        value={obj.hover_border_color || ''}
                        onChange={v => update('hover_border_color', v)}
                      />
                    </ControlRow>

                    <DimensionsFourControl
                      label="Raio da borda (Hover Radius)"
                      top={obj.hover_border_radius_top || obj.hover_border_radius || obj.border_radius || '0'}
                      right={obj.hover_border_radius_right || obj.hover_border_radius || obj.border_radius || '0'}
                      bottom={obj.hover_border_radius_bottom || obj.hover_border_radius || obj.border_radius || '0'}
                      left={obj.hover_border_radius_left || obj.hover_border_radius || obj.border_radius || '0'}
                      onChange={(side, val) => {
                        update(`hover_border_radius_${side}`, val)
                        update('hover_border_radius', val)
                      }}
                    />

                    <ControlRow label="Sombra da caixa (Hover)">
                      <ColorControl
                        value={obj.hover_box_shadow || ''}
                        onChange={v => {
                          const shadowVal = v ? `0 12px 32px ${v}` : ''
                          update('hover_box_shadow', shadowVal)
                          if (item.type === 'widget') updateWidgetStyle('hover_box_shadow', shadowVal)
                        }}
                      />
                    </ControlRow>

                    <ControlRow label="Duração da transição">
                      <input
                        className="elementor-input"
                        value={obj.transition_duration || '0.3s'}
                        onChange={e => update('transition_duration', e.target.value)}
                        placeholder="0.3s"
                      />
                    </ControlRow>
                  </>
                )}
              </AccordionSection>

              {/* ── DIVISOR DE FORMA ── */}
              <AccordionSection
                title="Divisor de forma"
                isOpen={openAccordions.shape}
                onToggle={() => toggleAccordion('shape')}
              >
                <ControlRow label="Tipo superior">
                  <select
                    className="elementor-select"
                    value={obj.shape_divider_top || 'none'}
                    onChange={e => update('shape_divider_top', e.target.value)}
                  >
                    <option value="none">Nenhum</option>
                    <option value="waves">Ondas</option>
                    <option value="curve">Curva</option>
                    <option value="tilt">Inclinação</option>
                  </select>
                </ControlRow>
              </AccordionSection>
                </>
              )}
            </>
          )}

          {/* ============================================================
              TAB 3: ADVANCED
             ============================================================ */}
          {tab === 'advanced' && (
            <>
              {/* ── LAYOUT ── */}
              <AccordionSection
                title="Layout"
                isOpen={openAccordions.layout}
                onToggle={() => toggleAccordion('layout')}
              >
                {/* Margem: 4 inputs conectados + [ 🔗 ] */}
                <DimensionsFourControl
                  label="Margem"
                  responsive
                  top={getVal('margin_top', '0')}
                  right={getVal('margin_right', '0')}
                  bottom={getVal('margin_bottom', '0')}
                  left={getVal('margin_left', '0')}
                  onChange={(side, val) => {
                    updateResponsive(`margin_${side}`, val)
                    if (item.type === 'widget') updateWidgetStyle(`margin_${side}`, val)
                  }}
                  onChangeAll={(val) => {
                    updateResponsiveMulti({
                      margin_top: val,
                      margin_right: val,
                      margin_bottom: val,
                      margin_left: val,
                    })
                  }}
                />

                {/* Preenchimento: 4 inputs conectados + [ 🔗 ] */}
                <DimensionsFourControl
                  label="Preenchimento"
                  responsive
                  top={getVal('padding_top', '0')}
                  right={getVal('padding_right', '0')}
                  bottom={getVal('padding_bottom', '0')}
                  left={getVal('padding_left', '0')}
                  onChange={(side, val) => {
                    updateResponsive(`padding_${side}`, val)
                    if (item.type === 'widget') updateWidgetStyle(`padding_${side}`, val)
                  }}
                  onChangeAll={(val) => {
                    updateResponsiveMulti({
                      padding_top: val,
                      padding_right: val,
                      padding_bottom: val,
                      padding_left: val,
                    })
                  }}
                />

                {/* Alinhar-se: 4 vetores SVG */}
                <ControlRow label="Alinhar-se" responsive>
                  <IconGroupSelector
                    value={getVal('align_self', 'auto')}
                    onChange={v => {
                      updateResponsive('align_self', v)
                      if (item.type === 'widget') updateWidgetStyle('align_self', v)
                    }}
                    options={[
                      { value: 'auto', title: 'Auto', icon: <svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="2" /><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" /></svg> },
                      { value: 'flex-start', title: 'Início', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 8v10M8 8v6M12 8v8" stroke="currentColor" strokeWidth="2.5" /></svg> },
                      { value: 'center', title: 'Centro', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 12h16M6 7v10M10 9v6M14 8v8" stroke="currentColor" strokeWidth="2.5" /></svg> },
                      { value: 'flex-end', title: 'Fim', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 20h16M4 6v10M8 10v6M12 8v8" stroke="currentColor" strokeWidth="2.5" /></svg> },
                      { value: 'stretch', title: 'Esticar', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M8 4v16M16 4v16" stroke="currentColor" strokeWidth="2.5" /></svg> },
                    ]}
                  />
                </ControlRow>
                <p className="elementor-note-caption">Afeta apenas este elemento.</p>

                {/* Ordem: 3 vetores SVG */}
                <ControlRow label="Ordem" responsive>
                  <IconGroupSelector
                    value={getVal('order_mode', 'start')}
                    onChange={v => {
                      updateResponsive('order_mode', v)
                      if (item.type === 'widget') updateWidgetStyle('order_mode', v)
                    }}
                    options={[
                      { value: 'start', title: 'Início', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4v16M20 12H8m0 0l4-4m-4 4l4 4" stroke="currentColor" strokeWidth="2.5" fill="none" /></svg> },
                      { value: 'end', title: 'Fim', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M20 4v16M4 12h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2.5" fill="none" /></svg> },
                      { value: 'custom', title: 'Personalizado', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 5v9M12 18h.01" stroke="currentColor" strokeWidth="3" /></svg> },
                    ]}
                  />
                </ControlRow>
                {getVal('order_mode', '') === 'custom' && (
                  <ControlRow label="Valor da Ordem" responsive>
                    <input
                      type="number"
                      className="elementor-input"
                      value={getVal('order', '1')}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10) || 0
                        updateResponsive('order', val)
                        if (item.type === 'widget') updateWidgetStyle('order', val)
                      }}
                      placeholder="1"
                    />
                  </ControlRow>
                )}
                <p className="elementor-note-caption">Afeta apenas este elemento.</p>

                {/* Tamanho: 4 vetores SVG */}
                <ControlRow label="Tamanho" responsive>
                  <IconGroupSelector
                    value={getVal('size_mode', 'default')}
                    onChange={v => {
                      updateResponsive('size_mode', v)
                      if (item.type === 'widget') updateWidgetStyle('size_mode', v)
                    }}
                    options={[
                      { value: 'default', title: 'Padrão', icon: <svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="2" /><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" /></svg> },
                      { value: 'full', title: 'Total (100%)', icon: <MoveHorizontal size={13} /> },
                      { value: 'inline', title: 'Linha', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" /></svg> },
                      { value: 'custom', title: 'Personalizado', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 5v9M12 18h.01" stroke="currentColor" strokeWidth="3" /></svg> },
                    ]}
                  />
                </ControlRow>
                {getVal('size_mode', '') === 'custom' && (
                  <ControlRow label="Largura Customizada" responsive>
                    <input
                      type="text"
                      className="elementor-input"
                      value={getVal('width', '50%')}
                      onChange={e => {
                        const val = e.target.value
                        updateResponsive('width', val)
                        if (item.type === 'widget') updateWidgetStyle('width', val)
                      }}
                      placeholder="50% ou 300px"
                    />
                  </ControlRow>
                )}

                {/* Posição */}
                <ControlRow label="Posição" responsive>
                  <select
                    className="elementor-select"
                    value={getVal('position', 'static')}
                    onChange={e => {
                      const val = e.target.value
                      updateResponsive('position', val)
                      if (item.type === 'widget') updateWidgetStyle('position', val)
                    }}
                  >
                    <option value="static">Padrão</option>
                    <option value="relative">Relativa</option>
                    <option value="absolute">Absoluta</option>
                    <option value="fixed">Fixa (Viewport / Flutuante)</option>
                    <option value="sticky">Aderente (Sticky no Container)</option>
                  </select>
                </ControlRow>

                {/* Coordenadas e Sliders de Posicionamento Fixo ou Absoluto */}
                {(getVal('position', '') === 'fixed' || getVal('position', '') === 'absolute') && (
                  <div style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: 8, margin: '8px 0', border: '1px solid #e5e5ea' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#1d1d1f', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Deslocamento / Offset ({getVal('position', '') === 'fixed' ? 'Fixed Viewport' : 'Absolute'})</span>
                      <ResponsiveLabelSwitcher />
                    </div>

                    {/* Orientação Horizontal */}
                    {(() => {
                      const hAlign = getVal('pos_h_align', '') || (getVal('right', '') && !getVal('left', '') ? 'right' : 'left')
                      const currentHVal = hAlign === 'right' ? getVal('right', '0px') : getVal('left', '0px')
                      return (
                        <>
                          <ControlRow label="Orientação Horizontal">
                            <IconGroupSelector
                              value={hAlign}
                              onChange={v => {
                                updateResponsive('pos_h_align', v)
                                const cur = getVal('left', '') || getVal('right', '') || '0px'
                                if (v === 'right') {
                                  updateResponsive('right', cur)
                                  updateResponsive('left', '')
                                  if (item.type === 'widget') {
                                    updateWidgetStyle('right', cur)
                                    updateWidgetStyle('left', '')
                                  }
                                } else {
                                  updateResponsive('left', cur)
                                  updateResponsive('right', '')
                                  if (item.type === 'widget') {
                                    updateWidgetStyle('left', cur)
                                    updateWidgetStyle('right', '')
                                  }
                                }
                              }}
                              options={[
                                { value: 'left', title: 'Esquerda (Início)', icon: <ArrowLeft size={13} /> },
                                { value: 'right', title: 'Direita (Fim)', icon: <ArrowRight size={13} /> },
                              ]}
                            />
                          </ControlRow>

                          {/* Slider Deslocamento Horizontal */}
                          <SliderUnitControl
                            label="Deslocamento Horizontal"
                            value={currentHVal}
                            onChange={val => {
                              if (hAlign === 'right') {
                                updateResponsive('right', val)
                                updateResponsive('left', '')
                                if (item.type === 'widget') {
                                  updateWidgetStyle('right', val)
                                  updateWidgetStyle('left', '')
                                }
                              } else {
                                updateResponsive('left', val)
                                updateResponsive('right', '')
                                if (item.type === 'widget') {
                                  updateWidgetStyle('left', val)
                                  updateWidgetStyle('right', '')
                                }
                              }
                            }}
                            units={['px', '%', 'vw']}
                            defaultUnit="px"
                            min={-500}
                            max={1200}
                          />
                        </>
                      )
                    })()}

                    <div className="elementor-divider-row" style={{ margin: '8px 0' }} />

                    {/* Orientação Vertical */}
                    {(() => {
                      const vAlign = getVal('pos_v_align', '') || (getVal('bottom', '') && !getVal('top', '') ? 'bottom' : 'top')
                      const currentVVal = vAlign === 'bottom' ? getVal('bottom', '0px') : getVal('top', '0px')
                      return (
                        <>
                          <ControlRow label="Orientação Vertical">
                            <IconGroupSelector
                              value={vAlign}
                              onChange={v => {
                                updateResponsive('pos_v_align', v)
                                const cur = getVal('top', '') || getVal('bottom', '') || '0px'
                                if (v === 'bottom') {
                                  updateResponsive('bottom', cur)
                                  updateResponsive('top', '')
                                  if (item.type === 'widget') {
                                    updateWidgetStyle('bottom', cur)
                                    updateWidgetStyle('top', '')
                                  }
                                } else {
                                  updateResponsive('top', cur)
                                  updateResponsive('bottom', '')
                                  if (item.type === 'widget') {
                                    updateWidgetStyle('top', cur)
                                    updateWidgetStyle('bottom', '')
                                  }
                                }
                              }}
                              options={[
                                { value: 'top', title: 'Superior (Início)', icon: <ArrowUp size={13} /> },
                                { value: 'bottom', title: 'Inferior (Fim)', icon: <ArrowDown size={13} /> },
                              ]}
                            />
                          </ControlRow>

                          {/* Slider Deslocamento Vertical */}
                          <SliderUnitControl
                            label="Deslocamento Vertical"
                            value={currentVVal}
                            onChange={val => {
                              if (vAlign === 'bottom') {
                                updateResponsive('bottom', val)
                                updateResponsive('top', '')
                                if (item.type === 'widget') {
                                  updateWidgetStyle('bottom', val)
                                  updateWidgetStyle('top', '')
                                }
                              } else {
                                updateResponsive('top', val)
                                updateResponsive('bottom', '')
                                if (item.type === 'widget') {
                                  updateWidgetStyle('top', val)
                                  updateWidgetStyle('bottom', '')
                                }
                              }
                            }}
                            units={['px', '%', 'vh']}
                            defaultUnit="px"
                            min={-500}
                            max={1000}
                          />
                        </>
                      )
                    })()}
                  </div>
                )}

                {/* Sticky Position Offset */}
                {getVal('position', '') === 'sticky' && (
                  <SliderUnitControl
                    label="Distância do Topo (Offset)"
                    value={getVal('top', '0px')}
                    onChange={val => {
                      updateResponsive('top', val)
                      if (item.type === 'widget') updateWidgetStyle('top', val)
                    }}
                    units={['px', '%', 'vh']}
                    defaultUnit="px"
                    min={0}
                    max={500}
                  />
                )}

                {/* Z-Index */}
                <ControlRow label="Z-Index" responsive>
                  <input
                    className="elementor-input"
                    type="number"
                    value={getVal('z_index', '')}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0
                      updateResponsive('z_index', val)
                      if (item.type === 'widget') updateWidgetStyle('z_index', val)
                    }}
                    placeholder="0"
                  />
                </ControlRow>

                {/* ID CSS */}
                <ControlRow label="ID CSS">
                  <input
                    className="elementor-input"
                    value={obj.css_id || ''}
                    onChange={e => update('css_id', e.target.value)}
                    placeholder="meu-id"
                  />
                </ControlRow>

                {/* Classes CSS */}
                <ControlRow label="Classes CSS">
                  <input
                    className="elementor-input"
                    value={obj.css_class || ''}
                    onChange={e => update('css_class', e.target.value)}
                    placeholder="classe-1 classe-2"
                  />
                </ControlRow>

                {/* Display Conditions */}
                <ControlRow label="Display Conditions">
                  <button
                    type="button"
                    className="elementor-icon-btn active"
                    title="Condições de exibição"
                    onClick={() => setShowDisplayConditionsModal(true)}
                  >
                    <GitBranch size={13} />
                  </button>
                </ControlRow>
              </AccordionSection>

              {/* ── EFEITOS DE MOVIMENTO (MOTION EFFECTS) ── */}
              <AccordionSection
                title="Efeitos de movimento"
                isOpen={openAccordions.motion}
                onToggle={() => toggleAccordion('motion')}
              >
                <ControlRow label="Animação de entrada">
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%' }}>
                    <select
                      className="elementor-select"
                      value={obj.animation_entrance || obj.animation_type || 'none'}
                      onChange={e => {
                        const val = e.target.value
                        update('animation_entrance', val)
                        update('animation_type', val)
                        if (item.type === 'widget') updateWidgetStyle('animation_entrance', val)

                        // Trigger live replay on screen immediately
                        const targetId = (item as any).widget?.id || (item as any).container?.id || (item as any).section?.id || (item as any).id || obj.id || (obj as any).key
                        const el = document.querySelector(`[data-widget-id="${targetId}"], [data-container-id="${targetId}"], [data-section-id="${targetId}"]`) as HTMLElement
                        if (el && val !== 'none') {
                          el.style.animation = 'none'
                          void el.offsetWidth
                          const animName = `teknix${val.charAt(0).toUpperCase() + val.slice(1)}`
                          const duration = obj.animation_duration || '800ms'
                          const delay = obj.animation_delay || '0ms'
                          el.style.animation = `${animName} ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`
                        }
                      }}
                    >
                      <option value="none">Nenhuma</option>
                      <optgroup label="✨ Modernas (Framer & Apple)">
                        <option value="blurFadeIn">Blur Fade In (Framer)</option>
                        <option value="framerSpringUp">Spring Bounce Up (Framer)</option>
                        <option value="appleReveal">Apple Clean Scale Up</option>
                        <option value="elasticPop">Pop Elástico</option>
                        <option value="glowPulse">Pulso com Glow</option>
                        <option value="floatBob">Flutuante Suave (Bob)</option>
                        <option value="revealSlide">Reveal com Máscara</option>
                      </optgroup>
                      <optgroup label="Fading (Desvanecer)">
                        <option value="fadeIn">Fade In</option>
                        <option value="fadeInUp">Fade In Up</option>
                        <option value="fadeInDown">Fade In Down</option>
                        <option value="fadeInLeft">Fade In Left</option>
                        <option value="fadeInRight">Fade In Right</option>
                      </optgroup>
                      <optgroup label="Sliding (Deslizar)">
                        <option value="slideInUp">Slide In Up</option>
                        <option value="slideInDown">Slide In Down</option>
                        <option value="slideInLeft">Slide In Left</option>
                        <option value="slideInRight">Slide In Right</option>
                      </optgroup>
                      <optgroup label="Zoom">
                        <option value="zoomIn">Zoom In</option>
                        <option value="zoomOut">Zoom Out</option>
                      </optgroup>
                      <optgroup label="Especiais">
                        <option value="bounceIn">Bounce In</option>
                        <option value="rotateIn">Rotate In</option>
                        <option value="flipInX">Flip In X</option>
                        <option value="flipInY">Flip In Y</option>
                        <option value="rollIn">Roll In</option>
                      </optgroup>
                    </select>
                    <button
                      type="button"
                      className="elementor-icon-btn active"
                      title="Testar animação no canvas"
                      onClick={() => {
                        const val = obj.animation_entrance || obj.animation_type
                        const targetId = (item as any).widget?.id || (item as any).container?.id || (item as any).section?.id || (item as any).id || obj.id || (obj as any).key
                        const el = document.querySelector(`[data-widget-id="${targetId}"], [data-container-id="${targetId}"], [data-section-id="${targetId}"]`) as HTMLElement
                        if (el && val && val !== 'none') {
                          el.style.animation = 'none'
                          void el.offsetWidth
                          const animName = `teknix${val.charAt(0).toUpperCase() + val.slice(1)}`
                          const duration = obj.animation_duration || '800ms'
                          const delay = obj.animation_delay || '0ms'
                          el.style.animation = `${animName} ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`
                        }
                      }}
                      style={{ flexShrink: 0, width: 28, height: 28 }}
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                  </div>
                </ControlRow>

                <ControlRow label="Duração da animação">
                  <input
                    className="elementor-input"
                    value={obj.animation_duration || '800ms'}
                    onChange={e => update('animation_duration', e.target.value)}
                    placeholder="800ms ou 0.8s"
                  />
                </ControlRow>

                <ControlRow label="Atraso / Delay">
                  <input
                    className="elementor-input"
                    value={obj.animation_delay || '0ms'}
                    onChange={e => update('animation_delay', e.target.value)}
                    placeholder="200ms ou 0.2s"
                  />
                </ControlRow>

                {/* Rolagem Vertical / Parallax */}
                <ControlRow label="Efeito Parallax / Rolagem">
                  <ToggleSwitch
                    checked={!!obj.vertical_scroll}
                    onChange={v => {
                      update('vertical_scroll', v)
                      if (item.type === 'widget') updateWidgetStyle('vertical_scroll', v)
                    }}
                  />
                </ControlRow>

                {obj.vertical_scroll && (
                  <>
                    <ControlRow label="Direção do Parallax">
                      <select
                        className="elementor-select"
                        value={obj.vertical_scroll_dir || 'up'}
                        onChange={e => {
                          update('vertical_scroll_dir', e.target.value)
                          if (item.type === 'widget') updateWidgetStyle('vertical_scroll_dir', e.target.value)
                        }}
                      >
                        <option value="up">Para Cima</option>
                        <option value="down">Para Baixo</option>
                      </select>
                    </ControlRow>
                    <ControlRow label="Velocidade (1 a 10)">
                      <input
                        className="elementor-input"
                        type="number"
                        min="1"
                        max="10"
                        value={obj.vertical_scroll_speed ?? 4}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 4
                          update('vertical_scroll_speed', val)
                          if (item.type === 'widget') updateWidgetStyle('vertical_scroll_speed', val)
                        }}
                      />
                    </ControlRow>
                  </>
                )}

                {/* Efeito Mouse Tilt 3D */}
                <ControlRow label="Efeito Mouse Tilt 3D">
                  <ToggleSwitch
                    checked={!!obj.mouse_tilt}
                    onChange={v => {
                      update('mouse_tilt', v)
                      if (item.type === 'widget') updateWidgetStyle('mouse_tilt', v)
                    }}
                  />
                </ControlRow>

                {/* Opacidade ao Rolar */}
                <ControlRow label="Opacidade ao Rolar">
                  <ToggleSwitch
                    checked={!!obj.opacity_scroll}
                    onChange={v => {
                      update('opacity_scroll', v)
                      if (item.type === 'widget') updateWidgetStyle('opacity_scroll', v)
                    }}
                  />
                </ControlRow>

                {/* Escala ao Rolar */}
                <ControlRow label="Escala ao Rolar">
                  <ToggleSwitch
                    checked={!!obj.scale_scroll}
                    onChange={v => {
                      update('scale_scroll', v)
                      if (item.type === 'widget') updateWidgetStyle('scale_scroll', v)
                    }}
                  />
                </ControlRow>
              </AccordionSection>

              {/* ── STICKY HEADER EFFECTS (PRO) ── */}
              <AccordionSection
                title="Sticky Header Effects"
                proBadge
                isOpen={openAccordions.sticky}
                onToggle={() => toggleAccordion('sticky')}
              >
                <ControlRow label="Ativar Header Fixo (Sticky)">
                  <ToggleSwitch
                    checked={!!obj.sticky_header || obj.sticky === 'top'}
                    onChange={v => {
                      update('sticky_header', v)
                      update('sticky', v ? 'top' : 'none')
                      if (item.type === 'widget') {
                        updateWidgetStyle('sticky_header', v)
                        updateWidgetStyle('sticky', v ? 'top' : 'none')
                      }
                    }}
                  />
                </ControlRow>

                <ControlRow label="Distância para ativar (Offset px)">
                  <input
                    type="number"
                    className="elementor-input"
                    value={obj.sticky_offset ?? 0}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0
                      update('sticky_offset', val)
                      if (item.type === 'widget') updateWidgetStyle('sticky_offset', val)
                    }}
                    placeholder="0px (Imediato)"
                  />
                </ControlRow>

                <ControlRow label="Efeito de Transição">
                  <select
                    className="elementor-select"
                    value={obj.sticky_effect || 'fade'}
                    onChange={e => {
                      update('sticky_effect', e.target.value)
                      if (item.type === 'widget') updateWidgetStyle('sticky_effect', e.target.value)
                    }}
                  >
                    <option value="immediate">Imediato (Sem animação)</option>
                    <option value="fade">Fade suave</option>
                    <option value="slide">Slide Down do topo</option>
                  </select>
                </ControlRow>

                <ControlRow label="Aparecer ao rolar para cima">
                  <ToggleSwitch
                    checked={!!obj.sticky_on_scroll_up}
                    onChange={v => {
                      update('sticky_on_scroll_up', v)
                      if (item.type === 'widget') updateWidgetStyle('sticky_on_scroll_up', v)
                    }}
                  />
                </ControlRow>

                <ControlRow label="Efeito Blur Translúcido">
                  <ToggleSwitch
                    checked={obj.sticky_blur !== false}
                    onChange={v => {
                      update('sticky_blur', v)
                      if (item.type === 'widget') updateWidgetStyle('sticky_blur', v)
                    }}
                  />
                </ControlRow>

                <ControlRow label="Dispositivos Ativos">
                  <div style={{ display: 'flex', gap: 6, fontSize: '11px', color: '#c9d1d9' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={obj.sticky_desktop !== false}
                        onChange={e => {
                          update('sticky_desktop', e.target.checked)
                          if (item.type === 'widget') updateWidgetStyle('sticky_desktop', e.target.checked)
                        }}
                      />
                      Desktop
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={obj.sticky_tablet !== false}
                        onChange={e => {
                          update('sticky_tablet', e.target.checked)
                          if (item.type === 'widget') updateWidgetStyle('sticky_tablet', e.target.checked)
                        }}
                      />
                      Tablet
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={obj.sticky_mobile !== false}
                        onChange={e => {
                          update('sticky_mobile', e.target.checked)
                          if (item.type === 'widget') updateWidgetStyle('sticky_mobile', e.target.checked)
                        }}
                      />
                      Mobile
                    </label>
                  </div>
                </ControlRow>
              </AccordionSection>

              {/* ── TRANSFORMAR ── */}
              <AccordionSection
                title="Transformar"
                isOpen={openAccordions.transform}
                onToggle={() => toggleAccordion('transform')}
              >
                {/* Normal / Ao passar o mouse */}
                <SegmentedTabs
                  active={transformHoverTab}
                  onChange={(v) => setTransformHoverTab(v as 'normal' | 'hover')}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'hover', label: 'Ao passar o mouse' },
                  ]}
                />

                {transformHoverTab === 'normal' ? (
                  <>
                    <ControlRow label="Girar (Rotate)" responsive>
                      <input
                        className="elementor-input"
                        value={getVal('transform_rotate', '')}
                        onChange={e => updateResponsive('transform_rotate', e.target.value)}
                        placeholder="ex: 45deg"
                      />
                    </ControlRow>
                    <ControlRow label="Escala (Scale)" responsive>
                      <input
                        className="elementor-input"
                        value={getVal('transform_scale', '')}
                        onChange={e => updateResponsive('transform_scale', e.target.value)}
                        placeholder="ex: 1.05"
                      />
                    </ControlRow>
                    <ControlRow label="Translação X (Translate X)" responsive>
                      <input
                        className="elementor-input"
                        value={getVal('transform_translate_x', '')}
                        onChange={e => updateResponsive('transform_translate_x', e.target.value)}
                        placeholder="ex: 10px"
                      />
                    </ControlRow>
                    <ControlRow label="Translação Y (Translate Y)" responsive>
                      <input
                        className="elementor-input"
                        value={getVal('transform_translate_y', '')}
                        onChange={e => updateResponsive('transform_translate_y', e.target.value)}
                        placeholder="ex: -10px"
                      />
                    </ControlRow>
                  </>
                ) : (
                  <>
                    <p className="elementor-note-caption" style={{ marginTop: -6 }}>
                      ✦ Ao passar o mouse — transformação no estado hover.
                    </p>
                    <ControlRow label="Girar ao Hover (Rotate)" responsive>
                      <input
                        className="elementor-input"
                        value={getVal('hover_transform_rotate', '')}
                        onChange={e => updateResponsive('hover_transform_rotate', e.target.value)}
                        placeholder="ex: 5deg"
                      />
                    </ControlRow>
                    <ControlRow label="Escala ao Hover (Scale)" responsive>
                      <input
                        className="elementor-input"
                        value={getVal('hover_transform_scale', '')}
                        onChange={e => updateResponsive('hover_transform_scale', e.target.value)}
                        placeholder="ex: 1.08"
                      />
                    </ControlRow>
                    <ControlRow label="Translação X (Hover)" responsive>
                      <input
                        className="elementor-input"
                        value={getVal('hover_transform_translate_x', '')}
                        onChange={e => updateResponsive('hover_transform_translate_x', e.target.value)}
                        placeholder="ex: 0px"
                      />
                    </ControlRow>
                    <ControlRow label="Translação Y (Hover)" responsive>
                      <input
                        className="elementor-input"
                        value={getVal('hover_transform_translate_y', '')}
                        onChange={e => updateResponsive('hover_transform_translate_y', e.target.value)}
                        placeholder="ex: -6px"
                      />
                    </ControlRow>
                    <ControlRow label="Duração da transição">
                      <input
                        className="elementor-input"
                        value={obj.transition_duration || '0.3s'}
                        onChange={e => update('transition_duration', e.target.value)}
                        placeholder="0.3s"
                      />
                    </ControlRow>
                  </>
                )}
              </AccordionSection>

              {/* ── RESPONSIVO ── */}
              <AccordionSection
                title="Responsivo (Visibilidade)"
                isOpen={openAccordions.responsive}
                onToggle={() => toggleAccordion('responsive')}
              >
                <ControlRow label="Ocultar no Desktop">
                  <ToggleSwitch
                    checked={!!(obj.hide_desktop || obj.hide_on_desktop)}
                    onChange={v => {
                      update('hide_desktop', v)
                      update('hide_on_desktop', v)
                    }}
                  />
                </ControlRow>
                <ControlRow label="Ocultar no Tablet">
                  <ToggleSwitch
                    checked={!!(obj.hide_tablet || obj.hide_on_tablet)}
                    onChange={v => {
                      update('hide_tablet', v)
                      update('hide_on_tablet', v)
                    }}
                  />
                </ControlRow>
                <ControlRow label="Ocultar no Mobile">
                  <ToggleSwitch
                    checked={!!(obj.hide_mobile || obj.hide_on_mobile)}
                    onChange={v => {
                      update('hide_mobile', v)
                      update('hide_on_mobile', v)
                    }}
                  />
                </ControlRow>
              </AccordionSection>

              {/* ── CUSTOM CSS ── */}
              <AccordionSection
                title="Custom CSS (Escopado)"
                isOpen={openAccordions.customCss}
                onToggle={() => toggleAccordion('customCss')}
              >
                <div className="elementor-control-row stacked">
                  <span className="elementor-control-label">Adicionar CSS Personalizado</span>
                  <p style={{ fontSize: '11px', color: '#8b949e', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                    Use <code>selector &#123; ... &#125;</code> para aplicar estilos isolados apenas neste elemento.
                  </p>
                  <textarea
                    className="elementor-textarea"
                    value={obj.custom_css || ''}
                    onChange={e => update('custom_css', e.target.value)}
                    placeholder="selector { color: #0071e3; border: 1px solid #0071e3; }"
                    rows={4}
                  />
                </div>
              </AccordionSection>
            </>
          )}

          {/* ── 4. FOOTER HELP ── */}
          <div className="elementor-inspector-footer">
            <span>Preciso de ajuda</span>
            <HelpCircle size={14} />
          </div>
        </div>

        {/* Display Conditions Modal */}
        <DisplayConditionsModal
          isOpen={showDisplayConditionsModal}
          onClose={() => setShowDisplayConditionsModal(false)}
          initialConditions={obj.display_conditions || []}
          onSave={(conditions) => {
            update('display_conditions', conditions)
            if (item.type === 'widget') updateWidgetStyle('display_conditions', conditions)
          }}
          modelName={itemTitle}
        />

        {/* Icon Library Modal (Apple-style 60+ categorized icons) */}
        <IconPickerModal
          isOpen={showIconLibraryModal}
          currentIcon={obj.content?.icon || obj.content?.selected_icon || 'star'}
          onClose={() => setShowIconLibraryModal(false)}
          onSelectIcon={(iconId) => {
            updateWidgetContents({ icon: iconId, selected_icon: iconId })
            update('icon', iconId)
            update('selected_icon', iconId)
          }}
        />

        {/* Gallery Image Selection Modal */}
        <MediaLibraryModal
          isOpen={galleryModalOpen}
          onClose={() => {
            setGalleryModalOpen(false)
            setGalleryEditIndex(null)
          }}
          onSelectMedia={(url) => {
            if (galleryEditIndex !== null) {
              const raw = obj.content?.gallery || obj.content?.items || obj.content?.images
              const current = Array.isArray(raw) ? [...raw] : [
                { id: '1', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=80', title: 'Item #1' },
                { id: '2', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', title: 'Item #2' },
                { id: '3', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80', title: 'Item #3' },
                { id: '4', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80', title: 'Item #4' },
                { id: '5', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', title: 'Item #5' },
                { id: '6', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop&q=80', title: 'Item #6' },
              ]
              if (current[galleryEditIndex]) {
                current[galleryEditIndex] = { ...current[galleryEditIndex], url }
              } else {
                current.push({ id: String(Date.now()), title: `Item #${galleryEditIndex + 1}`, url })
              }
              updateWidgetContents({ gallery: current, items: current, images: current })
            }
            setGalleryModalOpen(false)
            setGalleryEditIndex(null)
          }}
          title="Selecionar Imagem da Galeria"
        />
      </div>
    </ViewportContext.Provider>
  )
}

// ============================================================
// ELEMENTOR 1:1 REUSABLE UI PRIMITIVES (100% SVG VECTORS)
// ============================================================

function AccordionSection({
  title, children, isOpen, onToggle, proBadge
}: {
  title: string
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  proBadge?: boolean
}) {
  return (
    <div className="inspector-accordion">
      <button className="inspector-accordion-header" onClick={onToggle} type="button">
        <div className="accordion-title-left">
          <span className={`accordion-arrow ${isOpen ? 'open' : ''}`}>
            <ChevronRight size={12} />
          </span>
          <span>{title}</span>
        </div>
        {proBadge && <span className="accordion-pro-badge">PRO</span>}
      </button>
      {isOpen && <div className="inspector-accordion-content">{children}</div>}
    </div>
  )
}

function ControlRow({
  label, children, responsive, stacked, style
}: {
  label: string
  children: React.ReactNode
  responsive?: boolean
  stacked?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div className={`elementor-control-row ${stacked ? 'stacked' : ''}`} style={style}>
      <div className="elementor-control-label">
        <span>{label}</span>
        {responsive && <ResponsiveLabelSwitcher />}
      </div>
      <div className={`elementor-control-field ${stacked ? 'full-width' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function ResponsiveLabelSwitcher() {
  const { viewportMode, onViewportChange } = React.useContext(ViewportContext)
  return (
    <div className="responsive-label-switcher">
      <button
        type="button"
        className={`responsive-mini-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); onViewportChange?.('desktop') }}
        title="Desktop (100%)"
      >
        <Monitor size={10} />
      </button>
      <button
        type="button"
        className={`responsive-mini-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); onViewportChange?.('tablet') }}
        title="Tablet (768px)"
      >
        <Tablet size={10} />
      </button>
      <button
        type="button"
        className={`responsive-mini-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); onViewportChange?.('mobile') }}
        title="Mobile (375px)"
      >
        <Smartphone size={10} />
      </button>
    </div>
  )
}

function SegmentedTabs({
  active, onChange, options
}: {
  active: string
  onChange: (val: any) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="elementor-segmented-tabs">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`elementor-segmented-btn ${active === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function IconGroupSelector({
  value, onChange, options
}: {
  value: string
  onChange: (val: string) => void
  options: { value: string; icon: React.ReactNode; title?: string }[]
}) {
  return (
    <div className="elementor-icon-group">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`elementor-icon-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
          title={opt.title}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}

function ColorControl({
  value, onChange
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [showPalette, setShowPalette] = useState(false)
  const [hexInput, setHexInput] = useState(value || '')

  const THEME_PALETTE = [
    { label: 'Preto Profundo', color: '#000000' },
    { label: 'Apple Dark', color: '#161617' },
    { label: 'Texto Primário', color: '#1d1d1f' },
    { label: 'Cinza Secundário', color: '#86868b' },
    { label: 'Cinza Fundo Light', color: '#f5f5f7' },
    { label: 'Branco Puro', color: '#ffffff' },
    { label: 'Azul Apple', color: '#0071e3' },
    { label: 'Azul Claro Destaque', color: '#2997ff' },
    { label: 'Verde Destaque', color: '#30d158' },
    { label: 'Laranja / Âmbar', color: '#ff9f0a' },
    { label: 'Vermelho Alerta', color: '#ff453a' },
    { label: 'Transparente', color: 'transparent' },
  ]

  const pickerHex = value && value.startsWith('#') && (value.length === 7 || value.length === 4)
    ? (value.length === 4 ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}` : value)
    : '#000000'

  return (
    <div className="elementor-color-control" style={{ position: 'relative' }}>
      <button
        type="button"
        className={`elementor-global-btn ${showPalette ? 'active' : ''}`}
        title="Cores Globais do Tema"
        onClick={() => setShowPalette(!showPalette)}
      >
        <Globe size={13} />
      </button>

      <div className="elementor-color-swatch-box" title="Escolher cor">
        {value && value !== 'transparent' ? (
          <div className="elementor-color-preview-fill" style={{ background: value }} />
        ) : (
          <div className="elementor-color-transparent-line" />
        )}
        <input
          type="color"
          className="elementor-color-picker-input"
          value={pickerHex}
          onChange={e => {
            onChange(e.target.value)
            setHexInput(e.target.value)
          }}
        />
      </div>

      {/* Popover de Cores Globais do Tema */}
      {showPalette && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            width: 220,
            background: '#ffffff',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            border: '1px solid #e5e5ea',
            padding: 12,
            zIndex: 999999,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1d1d1f' }}>Paleta Oficial TEKNIX</span>
            <button
              type="button"
              onClick={() => setShowPalette(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#86868b' }}
            >
              <X size={12} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 10 }}>
            {THEME_PALETTE.map(item => (
              <button
                key={item.color}
                type="button"
                title={`${item.label} (${item.color})`}
                onClick={() => {
                  onChange(item.color)
                  setHexInput(item.color)
                  setShowPalette(false)
                }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: item.color === 'transparent' ? '1px dashed #c7c7cc' : (item.color === '#ffffff' || item.color === '#f5f5f7' ? '1px solid #d2d2d7' : 'none'),
                  background: item.color === 'transparent' ? 'repeating-linear-gradient(45deg, #eee 0, #eee 3px, #fff 3px, #fff 6px)' : item.color,
                  cursor: 'pointer',
                  outline: value === item.color ? '2px solid #0071e3' : 'none',
                  outlineOffset: 1,
                  padding: 0,
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              className="elementor-input"
              value={hexInput}
              onChange={e => setHexInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onChange(hexInput)
                  setShowPalette(false)
                }
              }}
              placeholder="#0071e3 ou transparent"
              style={{ fontSize: 11, padding: '4px 6px', flex: 1 }}
            />
            <button
              type="button"
              className="elementor-btn-primary"
              style={{ fontSize: 10, padding: '4px 8px', height: 'auto' }}
              onClick={() => {
                onChange(hexInput)
                setShowPalette(false)
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ImageThumbnailBox({
  src, onChange, title = 'Imagem'
}: {
  src: string
  onChange: (url: string) => void
  title?: string
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="elementor-control-media-box">
      <div
        className="elementor-control-media__preview"
        onClick={() => setShowModal(true)}
        title="Clique para escolher uma imagem da biblioteca"
      >
        {src ? (
          <div className="elementor-control-media__filled">
            <img src={src} alt="Preview" className="elementor-control-media__image" />
            <div className="elementor-control-media__overlay-actions" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="elementor-control-media__action-btn"
                onClick={() => setShowModal(true)}
                title="Alterar mídia"
              >
                <Edit2 size={12} />
                <span>Alterar</span>
              </button>
              <button
                type="button"
                className="elementor-control-media__action-btn delete"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange('')
                }}
                title="Remover imagem"
              >
                <Trash2 size={12} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="elementor-control-media__empty-btn" title="Inserir mídia">
            <Plus size={20} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <MediaLibraryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectMedia={(url) => {
          onChange(url)
          setShowModal(false)
        }}
        title={`Inserir ${title}`}
      />
    </div>
  )
}

function DimensionsFourControl({
  label, top, right, bottom, left, onChange, onChangeAll, responsive
}: {
  label: string
  top: string
  right: string
  bottom: string
  left: string
  onChange: (side: 'top' | 'right' | 'bottom' | 'left', val: string) => void
  onChangeAll?: (val: string) => void
  responsive?: boolean
}) {
  const [linked, setLinked] = useState(true)

  const handleValChange = (side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    if (linked) {
      if (onChangeAll) {
        onChangeAll(val)
      } else {
        onChange('top', val)
        onChange('right', val)
        onChange('bottom', val)
        onChange('left', val)
      }
    } else {
      onChange(side, val)
    }
  }

  return (
    <div className="elementor-dimensions-control">
      <div className="dimensions-header-row">
        <div className="elementor-control-label">
          <span>{label}</span>
          {responsive && <ResponsiveLabelSwitcher />}
        </div>
        <span className="dimensions-unit-tag">px ▾</span>
      </div>

      <div className="dimensions-boxes-row">
        <div className="dimension-single-box">
          <StepperNumberInput
            className="dimension-input"
            value={top}
            onChange={v => handleValChange('top', v)}
            placeholder="0"
          />
          <span className="dimension-box-caption">Superior</span>
        </div>

        <div className="dimension-single-box">
          <StepperNumberInput
            className="dimension-input"
            value={right}
            onChange={v => handleValChange('right', v)}
            placeholder="0"
          />
          <span className="dimension-box-caption">Direita</span>
        </div>

        <div className="dimension-single-box">
          <StepperNumberInput
            className="dimension-input"
            value={bottom}
            onChange={v => handleValChange('bottom', v)}
            placeholder="0"
          />
          <span className="dimension-box-caption">Inferior</span>
        </div>

        <div className="dimension-single-box">
          <StepperNumberInput
            className="dimension-input"
            value={left}
            onChange={v => handleValChange('left', v)}
            placeholder="0"
          />
          <span className="dimension-box-caption">Esquerda</span>
        </div>

        <button
          type="button"
          className={`dimension-link-btn ${linked ? 'linked' : ''}`}
          onClick={() => setLinked(!linked)}
          title={linked ? 'Valores vinculados' : 'Valores independentes'}
        >
          {linked ? <Link size={12} /> : <Unlink size={12} />}
        </button>
      </div>
    </div>
  )
}

function SliderUnitControl({
  label,
  value,
  onChange,
  units = ['px', '%', 'vw'],
  defaultUnit = 'px',
  min = 0,
  max = 1000,
  step = 1,
  responsive = true
}: {
  label: string
  value: string
  onChange: (val: string) => void
  units?: string[]
  defaultUnit?: string
  min?: number
  max?: number
  step?: number
  responsive?: boolean
}) {
  const strVal = String(value || '')
  const currentUnit = units.find(u => strVal.endsWith(u)) || defaultUnit
  const cleanNum = strVal.replace(/[^0-9.-]/g, '')
  const numericVal = parseFloat(cleanNum) || 0

  const activeMin = currentUnit === '%' ? -100 : (currentUnit === 'vw' || currentUnit === 'vh' ? -100 : min)
  const activeMax = currentUnit === '%' ? 100 : (currentUnit === 'vw' || currentUnit === 'vh' ? 100 : max)

  const handleSliderChange = (newNum: number) => {
    onChange(`${newNum}${currentUnit}`)
  }

  const handleUnitChange = (newUnit: string) => {
    onChange(`${numericVal}${newUnit}`)
  }

  return (
    <div className="elementor-slider-control">
      <div className="elementor-slider-header">
        <div className="elementor-control-label">
          <span>{label}</span>
          {responsive && <ResponsiveLabelSwitcher />}
        </div>
        <div className="elementor-unit-switcher">
          {units.map(u => (
            <button
              key={u}
              type="button"
              className={`elementor-unit-btn ${currentUnit === u ? 'active' : ''}`}
              onClick={() => handleUnitChange(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="elementor-slider-track-wrap">
        <input
          type="range"
          className="elementor-range-input"
          min={activeMin}
          max={activeMax}
          step={step}
          value={numericVal}
          onChange={e => handleSliderChange(parseFloat(e.target.value) || 0)}
        />
        <div className="elementor-slider-number-box">
          <StepperNumberInput
            value={cleanNum}
            onChange={val => onChange(`${val}${currentUnit}`)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  )
}

function GapsTwoControl({
  label, colValue, rowValue, onChange, responsive
}: {
  label: string
  colValue: string
  rowValue: string
  onChange: (col: string, row: string) => void
  responsive?: boolean
}) {
  const [linked, setLinked] = useState(true)

  const handleValChange = (side: 'col' | 'row', val: string) => {
    if (linked) {
      onChange(val, val)
    } else if (side === 'col') {
      onChange(val, rowValue)
    } else {
      onChange(colValue, val)
    }
  }

  return (
    <div className="elementor-gaps-control">
      <div className="dimensions-header-row">
        <div className="elementor-control-label">
          <span>{label}</span>
          {responsive && <ResponsiveLabelSwitcher />}
        </div>
        <span className="dimensions-unit-tag">px ▾</span>
      </div>

      <div className="gaps-boxes-row">
        <div className="gaps-single-box">
          <StepperNumberInput
            className="gaps-input"
            value={colValue}
            onChange={v => handleValChange('col', v)}
          />
          <span className="gaps-box-caption">Coluna</span>
        </div>

        <div className="gaps-single-box">
          <StepperNumberInput
            className="gaps-input"
            value={rowValue}
            onChange={v => handleValChange('row', v)}
          />
          <span className="gaps-box-caption">Linha</span>
        </div>

        <button
          type="button"
          className={`dimension-link-btn ${linked ? 'linked' : ''}`}
          onClick={() => setLinked(!linked)}
          title={linked ? 'Valores vinculados' : 'Valores independentes'}
        >
          {linked ? <Link size={12} /> : <Unlink size={12} />}
        </button>
      </div>
    </div>
  )
}

function StepperNumberInput({
  value,
  onChange,
  className = 'dimension-input',
  min = 0,
  max = 9999,
  step = 1,
  placeholder
}: {
  value: string | number
  onChange: (val: string) => void
  className?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
}) {
  const cleanNumeric = String(value ?? '').replace(/[^0-9.-]/g, '')
  const numVal = parseFloat(cleanNumeric) || 0

  const increment = (delta: number) => {
    const rawNext = numVal + delta
    const next = Math.max(min, Math.min(max, Math.round(rawNext * 100) / 100))
    onChange(String(next))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      increment(e.shiftKey ? step * 10 : step)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      increment(e.shiftKey ? -(step * 10) : -step)
    }
  }

  return (
    <div className="stepper-input-container">
      <input
        type="text"
        className={className}
        value={cleanNumeric}
        onChange={e => {
          const raw = e.target.value.replace(/[^0-9.-]/g, '')
          onChange(raw)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ? placeholder.replace(/[^0-9.-]/g, '') : ''}
      />
      <div className="stepper-buttons-col">
        <button
          type="button"
          tabIndex={-1}
          className="stepper-btn up"
          onClick={() => increment(step)}
          title="Aumentar (Seta Cima / ArrowUp)"
        >
          ▲
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="stepper-btn down"
          onClick={() => increment(-step)}
          title="Diminuir (Seta Baixo / ArrowDown)"
        >
          ▼
        </button>
      </div>
    </div>
  )
}

function ToggleSwitch({
  checked, onChange
}: {
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div
      className={`elementor-toggle-switch-wrapper ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <div className="elementor-switch-track">
        <div className="elementor-switch-thumb" />
      </div>
      <span className="elementor-switch-state-text">{checked ? 'On' : 'Off'}</span>
    </div>
  )
}

function SliderRangeControl({
  label, value, min = 0, max = 100, step = 1, unit = '%', onChange, responsive
}: {
  label: string
  value: number | string
  min?: number
  max?: number
  step?: number
  unit?: string
  onChange: (val: number) => void
  responsive?: boolean
}) {
  const num = typeof value === 'number' ? value : (parseFloat(String(value)) || min)
  return (
    <div className="elementor-control-row stacked" style={{ gap: 6 }}>
      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{label}</span>
          {responsive && <ResponsiveLabelSwitcher />}
        </div>
        <span style={{ fontSize: 11, color: '#86868b', fontWeight: 600 }}>{num}{unit}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={num}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
        />
        <input
          type="number"
          className="elementor-input"
          style={{ width: 54, padding: '4px 6px', textAlign: 'center', fontSize: 11 }}
          min={min}
          max={max}
          step={step}
          value={num}
          onChange={e => onChange(parseFloat(e.target.value) || min)}
        />
      </div>
    </div>
  )
}
