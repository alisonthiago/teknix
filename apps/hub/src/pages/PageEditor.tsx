import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getPageWithSections,
  createPage,
  updatePage,
  publishPage,
  unpublishPage,
  savePageTree,
  getDefaultSectionSettings,
  WIDGET_CATEGORIES,
  WIDGET_DEFINITIONS,
  getPages,
} from '../services/pageBuilder'
import { PRESETS } from '../presets'
import { PAGE_TEMPLATES, PageTemplateDefinition } from '../presets/templates'
import type { Page, PageSection, PageContainer, PageWidget, EditorTab, ViewportMode, WidgetContent } from '../types/pageBuilder'
import Inspector from '../components/editor/Inspector'
import Navigator from '../components/editor/Navigator'
import PageSettingsSidebar from '../components/editor/PageSettingsSidebar'
import HeaderInspector from '../components/editor/HeaderInspector'
import TemplateLibraryModal from '../components/editor/TemplateLibraryModal'
import ThemeBuilderModal from '../components/editor/ThemeBuilderModal'
import DisplayConditionsModal, { DisplayCondition } from '../components/editor/DisplayConditionsModal'
import GlobalHeaderRenderer from '../components/editor/GlobalHeaderRenderer'
import GlobalFooterRenderer from '../components/editor/GlobalFooterRenderer'
import LoadingScreen from '../components/ui/LoadingScreen'
import { usePermissions } from '../hooks/usePermissions'
import {
  computeSectionStyles,
  computeContainerOuterStyles,
  computeContainerInnerStyles,
  computeWidgetStyles,
  generateCompiledCSS,
  initMotionEffectsRuntime,
  resolveResponsiveValue,
} from '../services/styleEngine'
import {
  Settings, Eye, Undo, Redo, Smartphone, Tablet as TabletIcon, Monitor, ChevronLeft, Layers,
  Heading, Type, MousePointer, Star, Minus, ArrowUpDown,
  Columns, Grid as GridIcon, AlignLeft, List, ToggleLeft,
  Image as ImageIcon, Images, GalleryHorizontalEnd, Video, PanelTop,
  Target, Presentation, HelpCircle, MessageSquare, ListTree, Activity, Table, MoreHorizontal, Quote, ListOrdered,
  Package, LayoutGrid, Award, Server, DollarSign, ShoppingCart, RefreshCw,
  Menu, ChevronRight,
  FormInput, Mail,
  Code, AppWindow, FileCode2,
  Plus, Trash2, Copy, X, Edit2, Clipboard, Paintbrush, RotateCcw, Download, Check,
  MapPin, CheckSquare, Sparkles, Timer, Gauge, Share2, Search, User, AlertCircle, TableProperties, Box, Compass, Film, LayoutDashboard, Layout,
  Keyboard, ChevronDown, FileText, History, Sliders, Globe, LogOut, Folder, Network,
  ShoppingBag, ArrowRight, Zap, Heart, Play, ExternalLink, Phone,
  Lock, ShieldCheck
} from 'lucide-react'
import './PageEditor.css'

function getWidgetIcon(type: string, size = 18) {
  switch (type) {
    case 'heading': return <Heading size={size} />
    case 'text': return <Type size={size} />
    case 'button': return <MousePointer size={size} />
    case 'icon': return <Star size={size} />
    case 'divider': return <Minus size={size} />
    case 'spacer': return <ArrowUpDown size={size} />
    case 'googleMaps': return <MapPin size={size} />
    case 'iconBox': return <CheckSquare size={size} />
    case 'imageBox': return <ImageIcon size={size} />
    case 'starRating': return <Star size={size} />
    case 'columns': return <Columns size={size} />
    case 'grid': return <GridIcon size={size} />
    case 'tabs': return <AlignLeft size={size} />
    case 'accordion': return <List size={size} />
    case 'toggle': return <ToggleLeft size={size} />
    case 'image': return <ImageIcon size={size} />
    case 'gallery': return <Images size={size} />
    case 'carousel': return <GalleryHorizontalEnd size={size} />
    case 'mediaCarousel': return <Film size={size} />
    case 'video': return <Video size={size} />
    case 'videoPlaylist': return <Film size={size} />
    case 'imageText': return <PanelTop size={size} />
    case 'hotspot': return <Compass size={size} />
    case 'lottie': return <Sparkles size={size} />
    case 'cta': return <Target size={size} />
    case 'banner': return <Presentation size={size} />
    case 'animatedHeadline': return <Sparkles size={size} />
    case 'flipBox': return <Box size={size} />
    case 'priceTable': return <DollarSign size={size} />
    case 'priceList': return <DollarSign size={size} />
    case 'countdown': return <Timer size={size} />
    case 'counter': return <Gauge size={size} />
    case 'progressBar': return <Gauge size={size} />
    case 'faq': return <HelpCircle size={size} />
    case 'testimonials': return <MessageSquare size={size} />
    case 'testimonialCarousel': return <MessageSquare size={size} />
    case 'reviews': return <Star size={size} />
    case 'specifications': return <ListTree size={size} />
    case 'comparison': return <Activity size={size} />
    case 'table': return <Table size={size} />
    case 'list': return <MoreHorizontal size={size} />
    case 'quote': return <Quote size={size} />
    case 'steps': return <ListOrdered size={size} />
    case 'alert': return <AlertCircle size={size} />
    case 'product': return <Package size={size} />
    case 'productGrid': return <LayoutGrid size={size} />
    case 'productHero': return <Award size={size} />
    case 'categories': return <Server size={size} />
    case 'price': return <DollarSign size={size} />
    case 'buyButton': return <ShoppingCart size={size} />
    case 'relatedProducts': return <RefreshCw size={size} />
    case 'menu': return <Menu size={size} />
    case 'breadcrumb': return <ChevronRight size={size} />
    case 'tableOfContents': return <TableProperties size={size} />
    case 'shareButtons': return <Share2 size={size} />
    case 'search': return <Search size={size} />
    case 'form': return <FormInput size={size} />
    case 'newsletter': return <Mail size={size} />
    case 'login': return <User size={size} />
    case 'html': return <Code size={size} />
    case 'embed': return <AppWindow size={size} />
    case 'code': return <FileCode2 size={size} />
    // Elementor Pro
    case 'containerPro': return <LayoutDashboard size={size} />
    case 'nestedCarousel': return <GalleryHorizontalEnd size={size} />
    case 'loopGrid': return <LayoutGrid size={size} />
    case 'navMenu': return <Menu size={size} />
    case 'megaMenu': return <LayoutDashboard size={size} />
    case 'breadcrumbsPro': return <ChevronRight size={size} />
    case 'posts': return <FileText size={size} />
    case 'portfolio': return <LayoutGrid size={size} />
    case 'slides': return <Film size={size} />
    case 'imageGalleryPro': return <Images size={size} />
    case 'siteLogo': return <ImageIcon size={size} />
    case 'siteTitle': return <Heading size={size} />
    case 'pageTitle': return <Heading size={size} />
    case 'postTitle': return <Heading size={size} />
    case 'postContent': return <Type size={size} />
    case 'postExcerpt': return <AlignLeft size={size} />
    case 'featuredImage': return <ImageIcon size={size} />
    case 'postInfo': return <Sliders size={size} />
    case 'postNavigation': return <ChevronRight size={size} />
    case 'authorBox': return <User size={size} />
    case 'searchForm': return <Search size={size} />
    case 'formPro': return <FormInput size={size} />
    case 'loginPro': return <User size={size} />
    case 'socialIcons': return <Share2 size={size} />
    case 'shareButtonsPro': return <Share2 size={size} />
    case 'mediaCarouselPro': return <Film size={size} />
    case 'testimonialCarouselPro': return <MessageSquare size={size} />
    case 'postsCarousel': return <RefreshCw size={size} />
    case 'paypalButton': return <DollarSign size={size} />
    case 'stripeButton': return <DollarSign size={size} />
    case 'offCanvas': return <AppWindow size={size} />
    case 'sticky': return <Globe size={size} />
    case 'progressTracker': return <Activity size={size} />
    case 'pageTransitions': return <RefreshCw size={size} />
    case 'customCodePro': return <Code size={size} />
    case 'customCssPro': return <FileCode2 size={size} />
    case 'displayConditions': return <Eye size={size} />
    case 'floatingButtons': return <MessageSquare size={size} />
    case 'linkInBio': return <Globe size={size} />
    case 'tableOfContentsPro': return <TableProperties size={size} />
    case 'codeHighlightPro': return <Code size={size} />
    case 'lottiePro': return <Sparkles size={size} />
    case 'googleMapsPro': return <MapPin size={size} />
    case 'countdownPro': return <Timer size={size} />
    case 'ctaPro': return <Target size={size} />
    case 'flipBoxPro': return <Box size={size} />
    case 'priceTablePro': return <DollarSign size={size} />
    case 'priceListPro': return <DollarSign size={size} />
    case 'animatedHeadlinePro': return <Sparkles size={size} />
    case 'reviewsPro': return <Star size={size} />
    case 'shareButtonsEl': return <Share2 size={size} />
    case 'subscribe': return <Mail size={size} />
    case 'paypal': return <DollarSign size={size} />
    case 'stripe': return <DollarSign size={size} />
    default: return <Package size={size} />
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function getDefaultContainerSettings() {
  return {
    direction: 'column', gap: '8px', align_items: 'stretch', justify_content: 'flex-start',
    flex_wrap: 'nowrap', flex_grow: '1', flex_shrink: '1', width: '100%', max_width: 'none',
    min_height: 'auto', bg_type: 'color', bg_color: 'transparent', bg_image: '',
    bg_gradient: '', bg_overlay: 'transparent', bg_opacity: 1, padding_top: '0',
    padding_bottom: '0', padding_left: '0', padding_right: '0', margin_top: '0',
    margin_bottom: '0', border: 'none', border_color: 'transparent', border_radius: '0',
    box_shadow: 'none', hide_on_desktop: false, hide_on_tablet: false, hide_on_mobile: false,
    custom_css: '', custom_class: ''
  }
}

function getDefaultWidgetSettings() {
  return {
    font_family: '', font_size: '', font_weight: '', line_height: '', letter_spacing: '',
    text_transform: '', text_align: '', color: '', bg_type: '', bg_color: '', bg_image: '',
    bg_gradient: '', bg_overlay: '', bg_opacity: 1, padding_top: '', padding_bottom: '',
    padding_left: '', padding_right: '', margin_top: '', margin_bottom: '', margin_left: '',
    margin_right: '', width: '', max_width: '', min_width: '', height: '', min_height: '',
    max_height: '', border_style: '', border_width: '', border_color: '', border_radius: '',
    box_shadow: '', opacity: '', filter_blur: '', filter_brightness: '', filter_contrast: '',
    filter_saturation: '', position: '', z_index: '', overflow: '', hide_on_desktop: false,
    hide_on_tablet: false, hide_on_mobile: false, animation_type: '', animation_duration: '',
    animation_delay: '', custom_css: '', custom_class: '', html_id: '', aria_label: '',
    hover: {}
  }
}

const LAYOUT_PRESETS = [
  { id: '100', cols: [100], label: '1 Coluna', type: 'columns' },
  { id: '50-50', cols: [50, 50], label: '2 Colunas (50/50)', type: 'columns' },
  { id: '33-33-33', cols: [33.33, 33.33, 33.33], label: '3 Colunas (33/33/33)', type: 'columns' },
  { id: '25x4', cols: [25, 25, 25, 25], label: '4 Colunas (25%)', type: 'columns' },
  { id: '33-66', cols: [33.33, 66.66], label: '2 Colunas (1/3 + 2/3)', type: 'columns' },
  { id: '66-33', cols: [66.66, 33.33], label: '2 Colunas (2/3 + 1/3)', type: 'columns' },
  { id: '25-50-25', cols: [25, 50, 25], label: '3 Colunas (25/50/25)', type: 'columns' },
  { id: '50-25-25', cols: [50, 25, 25], label: '3 Colunas (50/25/25)', type: 'columns' },
  { id: '25-25-50', cols: [25, 25, 50], label: '3 Colunas (25/25/50)', type: 'columns' },
  { id: '20x5', cols: [20, 20, 20, 20, 20], label: '5 Colunas (20%)', type: 'columns' },
  { id: '16x6', cols: [16.66, 16.66, 16.66, 16.66, 16.66, 16.66], label: '6 Colunas', type: 'columns' },
  { id: 'flex-row', cols: [100], label: 'Flexbox (Linha →)', type: 'flex-row' },
  { id: 'flex-col', cols: [100], label: 'Flexbox (Coluna ↓)', type: 'flex-col' },
]

type DragPayload =
  | { kind: 'widget-new'; widgetType: string }
  | { kind: 'widget-move'; widgetId: string; fromContainerId: string }

let _dragPayload: DragPayload | null = null

export default function PageEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nova'
  const { can } = usePermissions()

  const [page, setPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [inspectorTab, setInspectorTab] = useState<EditorTab>('content')
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [showNavigator, setShowNavigator] = useState(false)
  const [showPageSettings, setShowPageSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'globals'>('elements')
  const [showLayoutSelector, setShowLayoutSelector] = useState(false)
  const [showInlineStructure, setShowInlineStructure] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const [insertSectionIndex, setInsertSectionIndex] = useState<number | null>(null)
  const [structureMode, setStructureMode] = useState<'columns' | 'flex'>('columns')
  const [sidebarView, setSidebarView] = useState<'widgets' | 'inspector' | 'page_settings' | 'header_editor'>('widgets')
  const [allPages, setAllPages] = useState<Page[]>([])
  const [showPagesDropdown, setShowPagesDropdown] = useState(false)
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showThemeBuilder, setShowThemeBuilder] = useState(false)
  const [showPublishDropdown, setShowPublishDropdown] = useState(false)
  const [showDisplayConditionsModal, setShowDisplayConditionsModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [searchParams] = useSearchParams()
  const isThemePartMode = searchParams.get('mode') === 'theme_part'
  const partType = searchParams.get('part_type') || 'header'
  const modelParam = searchParams.get('model')

  const [clipboard, setClipboard] = useState<{
    type: 'section' | 'container' | 'widget'
    data: any
  } | null>(() => {
    try {
      const saved = localStorage.getItem('teknix_editor_clipboard')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    x: number
    y: number
    targetType: 'section' | 'container' | 'widget' | 'canvas'
    targetId: string
    sectionId?: string
    containerId?: string
  } | null>(null)

  // ── Bottom Toast Notification (Projeto Publicado / Alterações Salvas) ──
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    actionUrl?: string
    actionLabel?: string
  } | null>(null)

  useEffect(() => {
    if (isNew) createNewPage()
    else if (id) loadPage(id)
  }, [id])

  // Central Style Engine: Compile live CSS for canvas preview
  const compiledCanvasCSS = React.useMemo(() => {
    return generateCompiledCSS(sections, (page as any)?.page_styles?.custom_css || '', id || '')
  }, [sections, (page as any)?.page_styles, id])

  // Initialize runtime motion effects (Parallax, Tilt, Entrance) inside editor
  useEffect(() => {
    if (!loading && sections.length > 0) {
      const cleanup = initMotionEffectsRuntime()
      return cleanup
    }
  }, [loading, sections])

  useEffect(() => {
    if (isThemePartMode) {
      if (partType === 'header') {
        setSidebarView('header_editor')
      }
    }
  }, [isThemePartMode, partType])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }

      // ⌘+D: Duplicar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (selectedWidgetId) handleDuplicateWidget(selectedWidgetId)
        else if (selectedContainerId) handleDuplicateContainer(selectedContainerId)
        else if (selectedSectionId) handleDuplicateSection(selectedSectionId)
      }

      // ⌘+C: Copiar (fora de inputs)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && !e.shiftKey && !isInput) {
        e.preventDefault()
        handleCopySelected()
      }

      // ⌘+V: Colar (fora de inputs)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v' && !e.shiftKey && !isInput) {
        e.preventDefault()
        handlePasteFromClipboard()
      }

      // ⌘+⇧+V: Colar estilo (fora de inputs)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v' && e.shiftKey && !isInput) {
        e.preventDefault()
        handlePasteStyleFromClipboard()
      }

      // ⌘+I: Estrutura / Navigator
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        setShowNavigator(prev => !prev)
      }

      // Delete / Backspace: Excluir item selecionado (fora de inputs)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedWidgetId) { e.preventDefault(); handleDeleteWidget(selectedWidgetId) }
        else if (selectedContainerId) { e.preventDefault(); handleDeleteContainer(selectedContainerId) }
        else if (selectedSectionId) { e.preventDefault(); handleDeleteSection(selectedSectionId) }
      }

      if (e.key === 'Escape') {
        setSelectedWidgetId(null)
        setSelectedContainerId(null)
        setSelectedSectionId(null)
        setSidebarView('widgets')
        setShowHamburgerMenu(false)
        setShowPagesDropdown(false)
        setShowPublishDropdown(false)
        setContextMenu(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [historyIndex, history, page, sections, selectedWidgetId, selectedContainerId, selectedSectionId, clipboard])

  function schemaToSection(schema: any, pageId: string, order: number): PageSection {
    const sId = generateId()
    return {
      id: sId,
      page_id: pageId,
      type: schema.type || 'section',
      order: order,
      ...getDefaultSectionSettings(schema.type || 'section'),
      ...(schema.settings || {}),
      responsive: {},
      hide_on_desktop: false,
      hide_on_tablet: false,
      hide_on_mobile: false,
      animation_type: '',
      animation_duration: '',
      animation_delay: '',
      animation_offset: '',
      custom_css: '',
      custom_class: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      containers: (schema.containers || []).map((c: any, cIdx: number) => {
        const cId = generateId()
        return {
          id: cId,
          section_id: sId,
          type: 'container',
          order: cIdx,
          ...getDefaultContainerSettings(),
          ...(c.settings || {}),
          responsive: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          widgets: (c.widgets || []).map((w: any, wIdx: number) => ({
            id: generateId(),
            container_id: cId,
            type: w.type,
            order: wIdx,
            content: w.content || {},
            ...getDefaultWidgetSettings(),
            ...(w.settings || {}),
            responsive: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        }
      })
    } as unknown as PageSection
  }

  function initializePageSections(p: Page, existingSections?: PageSection[]): PageSection[] {
    if (existingSections && existingSections.length > 0) {
      return existingSections
    }
    if (p.type === 'home' || p.slug === '/' || p.slug === '' || p.slug === 'home' || p.id === 'page-home-default') {
      const homeTemplate = PAGE_TEMPLATES.find(t => t.id === 'template-home-teknix')
      if (homeTemplate && homeTemplate.sections.length > 0) {
        return homeTemplate.sections.map((s, idx) => schemaToSection(s, p.id, idx))
      }
    }
    if (p.type === 'product' || p.type === 'segment' || p.type === 'category' || p.id.includes('ferramentas') || p.id.includes('iluminacao')) {
      const prodTemplate = PAGE_TEMPLATES.find(t => t.id === 'template-product-presentation')
      if (prodTemplate && prodTemplate.sections.length > 0) {
        return prodTemplate.sections.map((s, idx) => schemaToSection(s, p.id, idx))
      }
    }
    if (p.type === 'landing' || p.id.includes('black-friday')) {
      const landingTemplate = PAGE_TEMPLATES.find(t => t.id === 'template-landing-campaign')
      if (landingTemplate && landingTemplate.sections.length > 0) {
        return landingTemplate.sections.map((s, idx) => schemaToSection(s, p.id, idx))
      }
    }
    return []
  }

  async function createNewPage() {
    try {
      const newPage = await createPage({ slug: `pagina-${Date.now()}`, title: 'Nova página', type: 'custom' })
      setPage(newPage); setSections([]); setLoading(false)
      navigate(`/hub/paginas/editar/${newPage.id}`, { replace: true })
    } catch (e) { console.error(e); setLoading(false) }
  }

  async function loadPage(pageId: string) {
    try {
      // 1. Try fetching by ID
      const res = await getPageWithSections(pageId).catch(() => null)
      if (res && res.page) {
        setPage(res.page)
        setSections(initializePageSections(res.page, res.sections))
      } else {
        // 2. Try finding by slug in pages table
        const cleanSlug = pageId.startsWith('/') ? pageId : `/${pageId}`
        const { data: pageBySlug } = await supabase
          .from('pages')
          .select('*')
          .or(`slug.eq.${pageId},slug.eq.${cleanSlug},slug.eq./`)
          .limit(1)
          .maybeSingle()

        if (pageBySlug) {
          const { page: p, sections: s } = await getPageWithSections(pageBySlug.id)
          setPage(p)
          setSections(initializePageSections(p, s))
        } else {
          // 3. Check if pageId is a product ID or slug
          const { data: prod } = await supabase
            .from('products')
            .select('*')
            .or(`id.eq.${pageId},slug.eq.${pageId}`)
            .maybeSingle()

          if (prod) {
            const targetSlug = `/produto/${prod.slug || prod.id}`
            const { data: existingP } = await supabase
              .from('pages')
              .select('id')
              .or(`slug.eq.${targetSlug},slug.eq.${prod.slug || prod.id}`)
              .maybeSingle()

            if (existingP?.id) {
              const { page: p, sections: s } = await getPageWithSections(existingP.id)
              setPage(p)
              setSections(initializePageSections(p, s))
            } else {
              // Auto-create product page
              const newP = await createPage({
                title: prod.name || 'Apresentação do Produto',
                slug: targetSlug,
                type: 'product',
                status: 'published'
              })
              const { page: p, sections: s } = await getPageWithSections(newP.id)
              setPage(p)
              setSections(initializePageSections(p, s))
            }
          } else {
            // 4. Fallback for Theme Part Mode or unknown ID: fetch first available page or create a virtual draft
            const existingPages = await getPages().catch(() => [])
            if (existingPages && existingPages.length > 0) {
              const { page: p, sections: s } = await getPageWithSections(existingPages[0].id)
              if (p) {
                setPage(p)
                setSections(initializePageSections(p, s))
              }
            } else {
              // Auto-create home page
              const newP = await createPage({
                title: 'Página Inicial TEKNIX',
                slug: '/',
                type: 'home',
                status: 'published'
              })
              const { page: p, sections: s } = await getPageWithSections(newP.id)
              setPage(p)
              setSections(initializePageSections(p, s))
            }
          }
        }
      }
      getPages().then(ps => setAllPages(ps || [])).catch(() => {})
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function pushHistory(description: string, currentSections = sections) {
    const snapshot = JSON.stringify({ sections: currentSections })
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ description, snapshot, timestamp: Date.now() })
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory); setHistoryIndex(newHistory.length - 1)
  }

  function undo() {
    if (historyIndex <= 0) return
    const prev = JSON.parse(history[historyIndex - 1].snapshot)
    setSections(prev.sections); setHistoryIndex(historyIndex - 1)
  }

  function redo() {
    if (historyIndex >= history.length - 1) return
    const next = JSON.parse(history[historyIndex + 1].snapshot)
    setSections(next.sections); setHistoryIndex(historyIndex + 1)
  }

  async function handleSave() {
    if (!page) return
    if (!can('pages.edit')) {
      setToast({
        message: 'Acesso negado: Você não possui permissão para editar páginas.',
        type: 'error'
      })
      setTimeout(() => setToast(null), 4000)
      return
    }
    setSaving(true); setSaveError(null)
    try {
      await updatePage(page.id, page)
      await savePageTree(page.id, sections)
      if (page.status === 'published') {
        if (can('pages.publish')) {
          await publishPage(page.id)
        }
      }
      setToast({
        message: page.status === 'published' ? 'Projeto publicado com sucesso!' : 'Alterações salvas com sucesso!',
        type: 'success',
        actionUrl: `http://localhost:5173${page.slug?.startsWith('/') ? page.slug : `/${page.slug}`}`,
        actionLabel: 'Ver no Site'
      })
      setTimeout(() => setToast(null), 4500)
    } catch (e: any) {
      console.error('Save error:', e)
      setSaveError(e?.message || 'Erro ao salvar. Tente novamente.')
      setToast({
        message: e?.message || 'Erro ao salvar o projeto.',
        type: 'error'
      })
      setTimeout(() => setToast(null), 4000)
    }
    setSaving(false)
  }

  async function handlePublish() {
    if (!page) return
    if (!can('pages.publish')) {
      setToast({
        message: 'Acesso negado: Você não possui permissão para publicar páginas.',
        type: 'error'
      })
      setTimeout(() => setToast(null), 4000)
      return
    }
    setSaving(true); setSaveError(null)
    try {
      await updatePage(page.id, page)
      await savePageTree(page.id, sections)
      await publishPage(page.id)
      setPage({ ...page, status: 'published' })
      setToast({
        message: 'Projeto publicado com sucesso!',
        type: 'success',
        actionUrl: `http://localhost:5173${page.slug?.startsWith('/') ? page.slug : `/${page.slug}`}`,
        actionLabel: 'Ver no Site'
      })
      setTimeout(() => setToast(null), 5000)
    } catch (e: any) {
      console.error('Publish error:', e)
      setSaveError(e?.message || 'Erro ao publicar. Tente novamente.')
      setToast({
        message: e?.message || 'Erro ao publicar.',
        type: 'error'
      })
      setTimeout(() => setToast(null), 4000)
    }
    setSaving(false)
  }

  async function handleUnpublish() {
    if (!page) return
    if (!can('pages.publish')) {
      setToast({
        message: 'Acesso negado: Você não possui permissão para despublicar páginas.',
        type: 'error'
      })
      setTimeout(() => setToast(null), 4000)
      return
    }
    setSaving(true); setSaveError(null)
    try {
      await unpublishPage(page.id); setPage({ ...page, status: 'draft' })
      setToast({
        message: 'Página despublicada e salva como rascunho.',
        type: 'info'
      })
      setTimeout(() => setToast(null), 4000)
    } catch (e: any) {
      console.error('Unpublish error:', e)
      setSaveError(e?.message || 'Erro ao despublicar.')
    }
    setSaving(false)
  }

  function handleAddSection(index?: number) { 
    setShowInlineStructure(true); 
    setInsertSectionIndex(index ?? null);
  }

  function handleCreateSectionWithLayout(preset?: any) {
    if (!page || !preset) return
    const sId = generateId()
    const defaults = getDefaultSectionSettings('section')
    const cols = preset.cols || [100]
    const dir = preset.direction || (preset.type === 'flex-col' ? 'column' : 'row')

    const newContainers: PageContainer[] = cols.map((widthPercent: number, idx: number) => ({
      id: generateId(),
      section_id: sId,
      type: 'container',
      order: idx,
      ...getDefaultContainerSettings(),
      width: cols.length === 1 ? '100%' : `${widthPercent}%`,
      direction: 'column',
      responsive: {},
      widgets: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) as unknown as PageContainer[]

    const newSection: PageSection = {
      id: sId,
      page_id: page.id,
      type: 'section',
      order: sections.length,
      ...defaults,
      direction: dir,
      responsive: {},
      hide_on_desktop: false,
      hide_on_tablet: false,
      hide_on_mobile: false,
      animation_type: '',
      animation_duration: '',
      animation_delay: '',
      animation_offset: '',
      custom_css: '',
      custom_class: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      containers: newContainers
    } as unknown as PageSection

    const newSections = insertSectionIndex !== null
      ? [...sections.slice(0, insertSectionIndex), newSection, ...sections.slice(insertSectionIndex)]
      : [...sections, newSection]

    setSections(newSections)
    pushHistory(`Adicionar seção (${preset.label || 'Estrutura'})`, newSections)
    setSelectedSectionId(sId)
    setSelectedContainerId(newContainers[0]?.id || null)
    setSelectedWidgetId(null)
    setSidebarView('widgets')
    setShowLayoutSelector(false)
    setShowInlineStructure(false)
    setInsertSectionIndex(null)
  }

  function handleUpdateSection(sectionId: string, updates: Partial<PageSection>) {
    setSections(prevSections => prevSections.map(s => s.id === sectionId ? {
      ...s,
      ...updates,
      settings: (updates as any).settings !== undefined ? { ...((s as any).settings || {}), ...(updates as any).settings } : (s as any).settings,
      style: (updates as any).style !== undefined ? { ...((s as any).style || {}), ...(updates as any).style } : (s as any).style,
      responsive: updates.responsive !== undefined ? { ...(s.responsive || {}), ...updates.responsive } : s.responsive,
    } : s))
  }

  function handleDeleteSection(sectionId: string) {
    const newSections = sections.filter(s => s.id !== sectionId)
    setSections(newSections); pushHistory('Excluir seção', newSections)
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null); setSelectedContainerId(null); setSelectedWidgetId(null)
      setSidebarView('widgets')
    }
  }

  function handleDuplicateSection(sectionId: string) {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    const cloned = JSON.parse(JSON.stringify(section))
    cloned.id = generateId()
    cloned.containers?.forEach((c: any) => {
      c.id = generateId(); c.section_id = cloned.id
      c.widgets?.forEach((w: any) => { w.id = generateId(); w.container_id = c.id })
    })
    const idx = sections.findIndex(sec => sec.id === sectionId)
    const newSections = [...sections]; newSections.splice(idx + 1, 0, cloned)
    setSections(newSections); pushHistory('Duplicar seção', newSections)
  }

  function handleSectionReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= sections.length || toIndex >= sections.length) return
    const reordered = [...sections]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setSections(reordered)
    pushHistory('Reordenar seção', reordered)
  }

  function handleInsertPreset(preset: any) {
    if (!page) return
    const newSection = schemaToSection(preset.schema, page.id, sections.length)
    const newSections = [...sections, newSection]
    setSections(newSections)
    pushHistory(`Inserir seção: ${preset.name}`, newSections)
    setSelectedSectionId(newSection.id)
    setSidebarView('inspector')
  }

  function handleApplyTemplate(template: PageTemplateDefinition) {
    if (!page) return
    const confirmed = sections.length === 0 || confirm(`Deseja substituir o conteúdo atual pelo template "${template.name}"?`)
    if (!confirmed) return
    const newSections = template.sections.map((s, idx) => schemaToSection(s, page.id, idx))
    setSections(newSections)
    pushHistory(`Aplicar Template: ${template.name}`, newSections)
    setSelectedSectionId(null)
    setSelectedContainerId(null)
    setSelectedWidgetId(null)
  }

  function handleAddContainer(sectionId: string) {
    const cId = generateId()
    const newContainer = {
      id: cId, section_id: sectionId, type: 'container', order: 99,
      ...getDefaultContainerSettings(), responsive: {}, widgets: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as unknown as PageContainer
    const newSections = sections.map(s => s.id === sectionId ? { ...s, containers: [...(s.containers || []), newContainer] } : s)
    setSections(newSections); pushHistory('Adicionar coluna', newSections)
    setSelectedContainerId(cId)
    setSidebarView('inspector')
  }

  function handleUpdateContainer(containerId: string, updates: Partial<PageContainer>) {
    setSections(prevSections => prevSections.map(s => ({
      ...s, containers: (s.containers || []).map(c => c.id === containerId ? {
        ...c,
        ...updates,
        settings: (updates as any).settings !== undefined ? { ...((c as any).settings || {}), ...(updates as any).settings } : (c as any).settings,
        style: (updates as any).style !== undefined ? { ...((c as any).style || {}), ...(updates as any).style } : (c as any).style,
        responsive: updates.responsive !== undefined ? { ...(c.responsive || {}), ...updates.responsive } : c.responsive,
      } : c)
    })))
  }

  function handleDeleteContainer(containerId: string) {
    const newSections = sections.map(s => ({ ...s, containers: (s.containers || []).filter(c => c.id !== containerId) }))
    setSections(newSections); pushHistory('Excluir coluna', newSections)
    if (selectedContainerId === containerId) {
      setSelectedContainerId(null); setSelectedWidgetId(null)
      setSidebarView('widgets')
    }
  }

  function handleDuplicateContainer(containerId: string) {
    const newSections = sections.map(s => {
      const cIdx = (s.containers || []).findIndex(c => c.id === containerId)
      if (cIdx < 0) return s
      const source = s.containers![cIdx]
      const cloned: PageContainer = {
        ...JSON.parse(JSON.stringify(source)),
        id: generateId(),
        widgets: (source.widgets || []).map((w: any) => ({ ...w, id: generateId() }))
      }
      const containers = [...s.containers!]
      containers.splice(cIdx + 1, 0, cloned)
      return { ...s, containers: containers.map((c, i) => ({ ...c, order: i })) }
    })
    setSections(newSections)
    pushHistory('Duplicar contêiner', newSections)
  }

  function handleAddWidget(containerId: string, type: string, insertBeforeId?: string) {
    const wId = generateId()
    const defaultContent: any = {}
    if (type === 'text') defaultContent.text = 'Novo texto'
    if (type === 'heading') defaultContent.text = 'Novo Título'
    if (type === 'button') defaultContent.label = 'Clique aqui'

    const newWidget = {
      id: wId, container_id: containerId, type, order: 99,
      content: defaultContent as WidgetContent,
      ...getDefaultWidgetSettings(), responsive: {},
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as unknown as PageWidget

    setSections(prevSections => {
      const newSections = prevSections.map(s => ({
        ...s, containers: (s.containers || []).map(c => {
          if (c.id !== containerId) return c
          const widgets = [...(c.widgets || [])]
          if (insertBeforeId) {
            const idx = widgets.findIndex(w => w.id === insertBeforeId)
            widgets.splice(idx >= 0 ? idx : widgets.length, 0, newWidget)
          } else {
            widgets.push(newWidget)
          }
          return { ...c, widgets: widgets.map((w, i) => ({ ...w, order: i })) }
        })
      }))
      pushHistory('Adicionar widget', newSections)
      return newSections
    })

    setSelectedWidgetId(wId)
    setSelectedContainerId(containerId)
    setSelectedSectionId(null)
    setSidebarView('inspector')
  }

  function handleAddContainerWithWidget(sectionId: string, type: string) {
    const cId = generateId()
    const wId = generateId()
    const defaultContent: any = {}
    if (type === 'text') defaultContent.text = 'Novo texto'
    if (type === 'heading') defaultContent.text = 'Novo Título'
    if (type === 'button') defaultContent.label = 'Clique aqui'

    const newWidget = {
      id: wId, container_id: cId, type, order: 0,
      content: defaultContent as WidgetContent,
      ...getDefaultWidgetSettings(), responsive: {},
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as unknown as PageWidget

    const newContainer = {
      id: cId, section_id: sectionId, type: 'container', order: 0,
      ...getDefaultContainerSettings(), responsive: {}, widgets: [newWidget],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as unknown as PageContainer

    setSections(prevSections => {
      const newSections = prevSections.map(s => s.id === sectionId ? { ...s, containers: [...(s.containers || []), newContainer] } : s)
      pushHistory('Adicionar widget na seção', newSections)
      return newSections
    })

    setSelectedWidgetId(wId)
    setSelectedContainerId(cId)
    setSelectedSectionId(null)
    setSidebarView('inspector')
  }

  function handleCreateSectionWithWidget(type: string) {
    const sId = generateId()
    const cId = generateId()
    const wId = generateId()
    const defaultContent: any = {}
    if (type === 'text') defaultContent.text = 'Novo texto'
    if (type === 'heading') defaultContent.text = 'Novo Título'
    if (type === 'button') defaultContent.label = 'Clique aqui'

    const newWidget = {
      id: wId, container_id: cId, type, order: 0,
      content: defaultContent as WidgetContent,
      ...getDefaultWidgetSettings(), responsive: {},
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as unknown as PageWidget

    const newContainer = {
      id: cId, section_id: sId, type: 'container', order: 0,
      ...getDefaultContainerSettings(), responsive: {}, widgets: [newWidget],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as unknown as PageContainer

    const newSection = {
      id: sId, type: 'section', order: sections.length,
      ...getDefaultSectionSettings('section'), responsive: {}, containers: [newContainer],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as unknown as PageSection

    setSections(prevSections => {
      const newSections = [...prevSections, newSection]
      pushHistory('Criar seção com widget', newSections)
      return newSections
    })

    setSelectedWidgetId(wId)
    setSelectedContainerId(cId)
    setSelectedSectionId(null)
    setSidebarView('inspector')
  }

  function handleUpdateWidget(widgetId: string, updates: Partial<PageWidget>) {
    setSections(prevSections => prevSections.map(s => ({
      ...s, containers: (s.containers || []).map(c => ({
        ...c, widgets: (c.widgets || []).map(w => w.id === widgetId ? {
          ...w,
          ...updates,
          content: updates.content !== undefined ? { ...(typeof w.content === 'object' && w.content ? w.content : {}), ...updates.content } : w.content,
          settings: (updates as any).settings !== undefined ? { ...((w as any).settings || {}), ...(updates as any).settings } : (w as any).settings,
          style: (updates as any).style !== undefined ? { ...((w as any).style || {}), ...(updates as any).style } : (w as any).style,
          responsive: updates.responsive !== undefined ? { ...(w.responsive || {}), ...updates.responsive } : w.responsive,
        } : w)
      }))
    })))
  }

  function handleDeleteWidget(widgetId: string) {
    const newSections = sections.map(s => ({
      ...s, containers: (s.containers || []).map(c => ({
        ...c, widgets: (c.widgets || []).filter(w => w.id !== widgetId)
      }))
    }))
    setSections(newSections); pushHistory('Excluir widget', newSections)
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null)
      setSidebarView('widgets')
    }
  }

  function handleDuplicateWidget(widgetId: string) {
    setSections(prevSections => {
      const newSections = prevSections.map(s => ({
        ...s, containers: (s.containers || []).map(c => {
          const wIdx = (c.widgets || []).findIndex(w => w.id === widgetId)
          if (wIdx < 0) return c
          const cloned = { ...c.widgets![wIdx], id: generateId() }
          const widgets = [...c.widgets!]; widgets.splice(wIdx + 1, 0, cloned)
          return { ...c, widgets: widgets.map((w, i) => ({ ...w, order: i })) }
        })
      }))
      pushHistory('Duplicar widget', newSections)
      return newSections
    })
  }

  function handleMoveWidget(widgetId: string, _fromContainerId: string, toContainerId: string, insertBeforeId?: string | null) {
    setSections(prevSections => {
      let movedWidget: PageWidget | null = null

      const sectionsWithoutWidget = prevSections.map(s => ({
        ...s,
        containers: (s.containers || []).map(c => {
          const w = (c.widgets || []).find(w => w.id === widgetId)
          if (w) movedWidget = { ...w }
          return {
            ...c,
            widgets: (c.widgets || []).filter(w => w.id !== widgetId)
          }
        })
      }))

      if (!movedWidget) return prevSections
      const targetWidget: PageWidget = movedWidget
      const w: PageWidget = { ...(targetWidget as any), container_id: toContainerId }

      const finalSections = sectionsWithoutWidget.map(s => ({
        ...s,
        containers: (s.containers || []).map(c => {
          if (c.id !== toContainerId) return c
          const widgets = [...(c.widgets || [])]
          if (insertBeforeId) {
            const idx = widgets.findIndex(ww => ww.id === insertBeforeId)
            if (idx >= 0) {
              widgets.splice(idx, 0, w)
            } else {
              widgets.push(w)
            }
          } else {
            widgets.push(w)
          }
          return {
            ...c,
            widgets: widgets.map((ww, i) => ({ ...ww, order: i }))
          }
        })
      }))

      pushHistory('Mover widget', finalSections)
      return finalSections
    })

    setSelectedWidgetId(widgetId)
    setSelectedContainerId(toContainerId)
    setSidebarView('inspector')
  }

  function handleReorderWidget(containerId: string, widgetId: string, insertBeforeId: string | null) {
    handleMoveWidget(widgetId, containerId, containerId, insertBeforeId)
  }

  function handleContextMenu(e: React.MouseEvent, type: 'section' | 'container' | 'widget' | 'canvas', id: string, sectionId?: string, containerId?: string) {
    e.preventDefault()
    e.stopPropagation()
    if (type === 'widget') {
      setSelectedWidgetId(id)
      if (containerId) setSelectedContainerId(containerId)
      if (sectionId) setSelectedSectionId(sectionId)
    } else if (type === 'container') {
      setSelectedWidgetId(null)
      setSelectedContainerId(id)
      if (sectionId) setSelectedSectionId(sectionId)
    } else if (type === 'section') {
      setSelectedWidgetId(null)
      setSelectedContainerId(null)
      setSelectedSectionId(id)
    }
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetType: type,
      targetId: id,
      sectionId,
      containerId
    })
  }

  function handleCopySelected() {
    if (selectedWidgetId) {
      for (const s of sections) {
        for (const c of s.containers || []) {
          const w = (c.widgets || []).find(w => w.id === selectedWidgetId)
          if (w) {
            const clip = { type: 'widget' as const, data: JSON.parse(JSON.stringify(w)) }
            setClipboard(clip)
            localStorage.setItem('teknix_editor_clipboard', JSON.stringify(clip))
            return
          }
        }
      }
    } else if (selectedContainerId) {
      for (const s of sections) {
        const c = (s.containers || []).find(c => c.id === selectedContainerId)
        if (c) {
          const clip = { type: 'container' as const, data: JSON.parse(JSON.stringify(c)) }
          setClipboard(clip)
          localStorage.setItem('teknix_editor_clipboard', JSON.stringify(clip))
          return
        }
      }
    } else if (selectedSectionId) {
      const s = sections.find(s => s.id === selectedSectionId)
      if (s) {
        const clip = { type: 'section' as const, data: JSON.parse(JSON.stringify(s)) }
        setClipboard(clip)
        localStorage.setItem('teknix_editor_clipboard', JSON.stringify(clip))
      }
    }
  }

  function handlePasteFromClipboard() {
    if (!clipboard) return
    if (clipboard.type === 'widget') {
      const clonedWidget: PageWidget = {
        ...JSON.parse(JSON.stringify(clipboard.data)),
        id: generateId(),
      }
      let targetContainerId = selectedContainerId
      if (!targetContainerId && sections.length > 0 && sections[0].containers?.length) {
        targetContainerId = sections[0].containers[0].id
      }
      if (!targetContainerId) return

      const newSections = sections.map(s => ({
        ...s,
        containers: (s.containers || []).map(c => {
          if (c.id !== targetContainerId) return c
          const widgets = [...(c.widgets || [])]
          if (selectedWidgetId) {
            const idx = widgets.findIndex(w => w.id === selectedWidgetId)
            widgets.splice(idx >= 0 ? idx + 1 : widgets.length, 0, clonedWidget)
          } else {
            widgets.push(clonedWidget)
          }
          return { ...c, widgets: widgets.map((w, i) => ({ ...w, order: i })) }
        })
      }))
      setSections(newSections)
      pushHistory('Colar widget', newSections)
      setSelectedWidgetId(clonedWidget.id)
    } else if (clipboard.type === 'container') {
      const clonedContainer: PageContainer = {
        ...JSON.parse(JSON.stringify(clipboard.data)),
        id: generateId(),
        widgets: (clipboard.data.widgets || []).map((w: any) => ({ ...w, id: generateId() }))
      }
      let targetSectionId = selectedSectionId
      if (!targetSectionId && sections.length > 0) targetSectionId = sections[0].id
      if (!targetSectionId) return

      const newSections = sections.map(s => {
        if (s.id !== targetSectionId) return s
        const containers = [...(s.containers || [])]
        containers.push(clonedContainer)
        return { ...s, containers: containers.map((c, i) => ({ ...c, order: i })) }
      })
      setSections(newSections)
      pushHistory('Colar contêiner', newSections)
      setSelectedContainerId(clonedContainer.id)
    } else if (clipboard.type === 'section') {
      const clonedSection: PageSection = {
        ...JSON.parse(JSON.stringify(clipboard.data)),
        id: generateId(),
        containers: (clipboard.data.containers || []).map((c: any) => ({
          ...c,
          id: generateId(),
          widgets: (c.widgets || []).map((w: any) => ({ ...w, id: generateId() }))
        }))
      }
      const newSections = [...sections, clonedSection]
      setSections(newSections)
      pushHistory('Colar seção', newSections)
      setSelectedSectionId(clonedSection.id)
    }
  }

  function handlePasteStyleFromClipboard() {
    if (!clipboard) return
    const styleFields = [
      'bg_color', 'bg_type', 'bg_gradient', 'bg_image', 'font_family', 'font_size',
      'font_weight', 'text_align', 'color', 'padding_top', 'padding_bottom',
      'padding_left', 'padding_right', 'margin_top', 'margin_bottom',
      'margin_left', 'margin_right', 'border_style', 'border_width',
      'border_color', 'border_radius', 'box_shadow', 'opacity', 'style', 'settings'
    ]
    const extractedStyles: any = {}
    for (const f of styleFields) {
      if (clipboard.data[f] !== undefined) extractedStyles[f] = clipboard.data[f]
    }
    if (selectedWidgetId) {
      handleUpdateWidget(selectedWidgetId, extractedStyles)
    } else if (selectedContainerId) {
      handleUpdateContainer(selectedContainerId, extractedStyles)
    } else if (selectedSectionId) {
      handleUpdateSection(selectedSectionId, extractedStyles)
    }
  }

  function handleResetStyle() {
    const resetStyles: any = {
      bg_color: '', bg_type: '', bg_gradient: '', bg_image: '',
      color: '', border_style: 'none', border_width: '0',
      border_radius: '0', box_shadow: '', opacity: '', style: {}, settings: {}
    }
    if (selectedWidgetId) handleUpdateWidget(selectedWidgetId, resetStyles)
    else if (selectedContainerId) handleUpdateContainer(selectedContainerId, resetStyles)
    else if (selectedSectionId) handleUpdateSection(selectedSectionId, resetStyles)
  }

  function handleAIVariations() {
    if (selectedWidgetId) {
      for (const s of sections) {
        for (const c of s.containers || []) {
          const w = (c.widgets || []).find(w => w.id === selectedWidgetId)
          if (w) {
            if (w.type === 'heading') {
              const current = w.content?.text || ''
              const variations = [
                'Inovação e Alta Performance TEKNIX',
                'Engenharia de Precisão e Máxima Eficiência',
                'A Nova Geração de Ferramentas Profissionais',
                'Potência Suprema para os Melhores Resultados'
              ]
              const next = variations[(variations.indexOf(current) + 1) % variations.length]
              handleUpdateWidget(selectedWidgetId, { content: { ...w.content, text: next } })
            } else if (w.type === 'button') {
              const btnVariations = ['Descobrir Mais', 'Comprar Agora', 'Garantir Desconto', 'Conhecer Linha']
              const current = w.content?.label || w.content?.text || ''
              const next = btnVariations[(btnVariations.indexOf(current) + 1) % btnVariations.length]
              handleUpdateWidget(selectedWidgetId, { content: { ...w.content, label: next, text: next } })
            } else if (w.type === 'text') {
              const textVariations = [
                'Desenvolvido com padrão industrial para máxima durabilidade e precisão inigualável.',
                'Tecnologia de ponta pensada para transformar seu fluxo de trabalho com velocidade e controle.',
                'Qualidade e confiabilidade comprovadas por profissionais em todo o país.'
              ]
              const current = w.content?.text || ''
              const next = textVariations[(textVariations.indexOf(current) + 1) % textVariations.length]
              handleUpdateWidget(selectedWidgetId, { content: { ...w.content, text: next } })
            }
            return
          }
        }
      }
    }
  }

  function selectWidget(widgetId: string, containerId?: string) {
    setSelectedWidgetId(widgetId)
    if (containerId) setSelectedContainerId(containerId)
    setSelectedSectionId(null)
    setSidebarView('inspector')
  }

  function selectContainer(containerId: string) {
    setSelectedContainerId(containerId)
    setSelectedWidgetId(null)
    setSelectedSectionId(null)
    setSidebarView('inspector')
  }

  function selectSection(sectionId: string) {
    setSelectedSectionId(sectionId)
    setSelectedContainerId(null)
    setSelectedWidgetId(null)
    setSidebarView('inspector')
  }

  async function handleUpdatePage(updates: Partial<Page>) {
    if (!page) return
    const updated = { ...page, ...updates }
    setPage(updated)
    try {
      await updatePage(page.id, updates)
    } catch (e) {
      console.error('Error updating page:', e)
    }
  }

  function getHeaderConfig(): import('../components/editor/GlobalHeaderRenderer').HeaderConfig {
    if (!page) return {}
    const p = page as any
    const hs = p.header_settings || {}
    return {
      ...hs,
      model: hs.model || p.header_model || 'apple_dark',
      mobileModel: hs.mobileModel || p.mobile_menu_model || 'apple_drawer',
      logoType: hs.logoType || p.header_logo_type || 'full_logo',
      logoSource: hs.logoSource,
      logoIconType: hs.logoIconType,
      logoFullType: hs.logoFullType,
      logoSvgCode: hs.logoSvgCode,
      logoIconImage: hs.logoIconImage,
      logoImage: hs.logoImage ?? p.header_logo_image,
      logoText: hs.logoText ?? p.header_logo_text ?? 'TEKNIX',
      logoHeight: hs.logoHeight ?? p.header_logo_height ?? 28,
      logoWidth: hs.logoWidth ?? p.header_logo_width ?? 160,
      logoIconSize: hs.logoIconSize ?? 22,
      logoFontSize: hs.logoFontSize ?? 15,
      mobileForceIcon: hs.mobileForceIcon !== false,
      links: hs.links || p.header_links,
      bgColor: hs.bgColor ?? p.header_bg_color,
      textColor: hs.textColor ?? p.header_text_color,
      isSticky: hs.isSticky !== undefined ? hs.isSticky : (p.sticky_header !== false),
      stickyOffset: hs.stickyOffset ?? p.sticky_offset ?? 0,
      stickyDuration: hs.stickyDuration ?? 350,
      stickyDelay: hs.stickyDelay ?? 0,
      stickyEffect: hs.stickyEffect || p.sticky_effect || 'slide',
      stickyOnScrollUp: hs.stickyOnScrollUp ?? !!p.sticky_on_scroll_up,
      stickyBlur: hs.stickyBlur ?? (p.sticky_blur !== false),
      showAnnouncementRibbon: hs.showAnnouncementRibbon ?? p.header_show_announcement,
      announcementText: hs.announcementText ?? p.header_announcement_text,
      announcementLink: hs.announcementLink ?? p.header_announcement_link,
      headerHeight: hs.headerHeight ?? p.header_height ?? 44,
      headerWidthMode: hs.headerWidthMode || p.header_width_mode || 'boxed',
      headerMaxWidth: hs.headerMaxWidth ?? p.header_max_width ?? 1024,
      headerTransparent: hs.headerTransparent ?? !!p.header_transparent,
      menuItemGap: hs.menuItemGap ?? p.header_menu_item_gap ?? 24,
      fontFamily: hs.fontFamily ?? p.header_font_family,
      fontSize: hs.fontSize ?? p.header_font_size,
      fontWeight: hs.fontWeight ?? p.header_font_weight,
      textTransform: hs.textTransform ?? p.header_text_transform,
      letterSpacing: hs.letterSpacing ?? p.header_letter_spacing,
      lineHeight: hs.lineHeight ?? p.header_line_height,
      marginTop: hs.marginTop ?? p.header_margin_top,
      marginRight: hs.marginRight ?? p.header_margin_right,
      marginBottom: hs.marginBottom ?? p.header_margin_bottom,
      marginLeft: hs.marginLeft ?? p.header_margin_left,
      paddingTop: hs.paddingTop ?? p.header_padding_top,
      paddingRight: hs.paddingRight ?? p.header_padding_right,
      paddingBottom: hs.paddingBottom ?? p.header_padding_bottom,
      paddingLeft: hs.paddingLeft ?? p.header_padding_left,
      zIndex: hs.zIndex ?? p.header_z_index,
      cssId: hs.cssId ?? p.header_css_id,
      cssClasses: hs.cssClasses ?? p.header_css_classes,
      isLocalOnly: hs.isLocalOnly ?? !!p.header_is_local_only,
    }
  }

  function handleHeaderConfigChange(newCfg: import('../components/editor/GlobalHeaderRenderer').HeaderConfig) {
    if (!page) return
    handleUpdatePage({
      ...page,
      header_settings: newCfg,
      header_model: newCfg.model,
      mobile_menu_model: newCfg.mobileModel,
      header_logo_type: newCfg.logoType,
      header_logo_image: newCfg.logoImage,
      header_logo_text: newCfg.logoText,
      header_logo_height: newCfg.logoHeight,
      header_logo_width: newCfg.logoWidth,
      header_links: newCfg.links,
      header_bg_color: newCfg.bgColor,
      header_text_color: newCfg.textColor,
      sticky_header: newCfg.isSticky,
      sticky_offset: newCfg.stickyOffset,
      sticky_effect: newCfg.stickyEffect,
      sticky_on_scroll_up: newCfg.stickyOnScrollUp,
      sticky_blur: newCfg.stickyBlur,
      header_show_announcement: newCfg.showAnnouncementRibbon,
      header_announcement_text: newCfg.announcementText,
      header_announcement_link: newCfg.announcementLink,
      header_height: newCfg.headerHeight,
      header_width_mode: newCfg.headerWidthMode,
      header_max_width: newCfg.headerMaxWidth,
      header_transparent: newCfg.headerTransparent,
      header_menu_item_gap: newCfg.menuItemGap,
      header_font_family: newCfg.fontFamily,
      header_font_size: newCfg.fontSize,
      header_font_weight: newCfg.fontWeight,
      header_text_transform: newCfg.textTransform,
      header_letter_spacing: newCfg.letterSpacing,
      header_line_height: newCfg.lineHeight,
      header_margin_top: newCfg.marginTop,
      header_margin_right: newCfg.marginRight,
      header_margin_bottom: newCfg.marginBottom,
      header_margin_left: newCfg.marginLeft,
      header_padding_top: newCfg.paddingTop,
      header_padding_right: newCfg.paddingRight,
      header_padding_bottom: newCfg.paddingBottom,
      header_padding_left: newCfg.paddingLeft,
      header_z_index: newCfg.zIndex,
      header_css_id: newCfg.cssId,
      header_css_classes: newCfg.cssClasses,
      header_is_local_only: newCfg.isLocalOnly,
    } as any)
  }

  function getSelectedItem() {
    if (selectedWidgetId) {
      for (const s of sections) {
        for (const c of s.containers || []) {
          const w = (c.widgets || []).find(w => w.id === selectedWidgetId)
          if (w) return { type: 'widget' as const, item: w, sectionId: s.id, containerId: c.id }
        }
      }
    }
    if (selectedContainerId) {
      for (const s of sections) {
        const c = (s.containers || []).find(c => c.id === selectedContainerId)
        if (c) return { type: 'container' as const, item: c, sectionId: s.id }
      }
    }
    if (selectedSectionId) {
      const s = sections.find(s => s.id === selectedSectionId)
      if (s) return { type: 'section' as const, item: s }
    }
    return null
  }

  function renderInlineAddSectionBox(targetIdx: number | null) {
    const isShowingPresets = targetIdx !== null ? true : showInlineStructure

    return (
      <div
        className="elementor-add-section-box"
        key={targetIdx !== null ? `inline-add-${targetIdx}` : 'bottom-add-box'}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          let payload: any = _dragPayload
          if (!payload) {
            try {
              const raw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json')
              if (raw) payload = JSON.parse(raw)
            } catch {}
          }
          _dragPayload = null
          if (payload && (payload.kind === 'widget-new' || payload.type === 'widget-new')) {
            const wType = payload.widgetType || payload.type
            if (targetIdx !== null) setInsertSectionIndex(targetIdx)
            handleCreateSectionWithWidget(wType)
          }
        }}
      >
        {!isShowingPresets ? (
          <div className="elementor-add-section-inner">
            {targetIdx !== null && (
              <button
                type="button"
                className="elementor-add-section-close-corner"
                onClick={() => {
                  setInsertSectionIndex(null)
                  setShowInlineStructure(false)
                }}
                title="Fechar"
              >
                <X size={15} />
              </button>
            )}
            <div className="elementor-add-section-actions">
              <button
                type="button"
                className="elementor-add-btn circle-plus"
                onClick={() => {
                  setInsertSectionIndex(targetIdx)
                  setShowInlineStructure(true)
                }}
                title="Adicionar Nova Seção / Estrutura"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                className="elementor-add-btn circle-folder"
                onClick={() => {
                  setInsertSectionIndex(targetIdx)
                  setShowLibraryModal(true)
                }}
                title="Adicionar Modelo / Seção Pronta (Biblioteca)"
              >
                <Folder size={16} />
              </button>
            </div>
            <div className="elementor-add-section-hint">
              Arraste o widget para cá
            </div>
          </div>
        ) : (
          <div className="elementor-select-structure-box">
            <div className="elementor-select-structure-header">
              <div className="structure-title">Qual layout você gostaria de usar?</div>
              <button
                className="structure-close-btn"
                onClick={() => {
                  setInsertSectionIndex(null)
                  setShowInlineStructure(false)
                }}
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Layout Type Tabs: Flexbox / Grid */}
            <div className="elementor-layout-type-tabs">
              <button
                className={`layout-type-tab ${structureMode === 'flex' ? 'active' : ''}`}
                onClick={() => setStructureMode('flex')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="9" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <rect x="13" y="4" width="9" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
                <span>Flexbox</span>
              </button>
              <button
                className={`layout-type-tab ${structureMode === 'columns' ? 'active' : ''}`}
                onClick={() => setStructureMode('columns')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="3" width="20" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <line x1="8" y1="3" x2="8" y2="21" stroke="currentColor" strokeWidth="1.2"/>
                  <line x1="16" y1="3" x2="16" y2="21" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                <span>Grid / Colunas</span>
              </button>
            </div>

            {/* Structure Presets Grid */}
            <div className="elementor-structure-grid">
              {structureMode === 'flex' ? (
                <>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout(LAYOUT_PRESETS.find(p => p.id === 'flex-row'))} title="Linha 50/50">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="41" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="47" y="4" width="41" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">Linha 50/50</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout({ id: 'flex-row-3', type: 'flex-row', cols: [33.33, 33.33, 33.33], label: 'Linha 33/33/33', direction: 'row' })} title="Linha 3 Colunas">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="27" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="32" y="4" width="26" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="61" y="4" width="27" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">Linha 33/33/33</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout({ id: 'flex-row-4', type: 'flex-row', cols: [25, 25, 25, 25], label: 'Linha 4 Colunas', direction: 'row' })} title="Linha 4 Colunas">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="19" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="24" y="4" width="19" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="46" y="4" width="19" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="68" y="4" width="20" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">Linha 4 Colunas</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout({ id: 'flex-single', type: 'flex-row', cols: [100], label: 'Linha Única', direction: 'row' })} title="Coluna Única (100%)">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="86" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">Coluna Única</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout(LAYOUT_PRESETS.find(p => p.id === '100'))} title="100%">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="86" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">100</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout(LAYOUT_PRESETS.find(p => p.id === '50-50'))} title="50 / 50">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="41" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="47" y="4" width="41" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">50 / 50</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout(LAYOUT_PRESETS.find(p => p.id === '33-66'))} title="33 / 66">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="27" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="32" y="4" width="56" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">33 / 66</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout(LAYOUT_PRESETS.find(p => p.id === '66-33'))} title="66 / 33">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="56" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="61" y="4" width="27" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">66 / 33</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout(LAYOUT_PRESETS.find(p => p.id === '33-33-33'))} title="33 / 33 / 33">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="27" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="32" y="4" width="26" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="61" y="4" width="27" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">33 / 33 / 33</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout(LAYOUT_PRESETS.find(p => p.id === '25x4'))} title="25 / 25 / 25 / 25">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="19" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="24" y="4" width="19" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="46" y="4" width="19" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="68" y="4" width="20" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">25 / 25 / 25 / 25</span>
                  </div>
                  <div className="elementor-structure-tile" onClick={() => handleCreateSectionWithLayout(LAYOUT_PRESETS.find(p => p.id === '25-50-25'))} title="25 / 50 / 25">
                    <div className="structure-tile-visual">
                      <svg viewBox="0 0 90 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="19" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="24" y="4" width="42" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                        <rect x="69" y="4" width="19" height="42" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    <span className="structure-tile-label">25 / 50 / 25</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const selectedItem = getSelectedItem()
  const filteredWidgets = searchQuery
    ? WIDGET_DEFINITIONS.filter(w => w.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : null

  if (loading) return <LoadingScreen message="Carregando Editor TEKNIX..." subtitle="Carregando componentes e layout da página" />
  if (!page) return <div className="editor-error"><p>Página não encontrada</p></div>

  const isSystemProtectedPage = (page as any)?.page_type === 'system' ||
    (page as any)?.is_system ||
    page.type === 'system' ||
    page.slug === 'conta' ||
    page.slug === '/conta' ||
    page.slug === 'minha-conta' ||
    page.slug === '/minha-conta'

  if (isSystemProtectedPage) {
    return (
      <div className="editor-system-locked-screen">
        <div className="system-locked-card">
          <div className="system-locked-icon-wrap">
            <Lock size={32} />
          </div>
          <div className="system-locked-tag">Página Nativa do Sistema</div>
          <h1 className="system-locked-title">Conta — Página Protegida</h1>
          <p className="system-locked-desc">
            A rota <code>/conta</code> é a área oficial do cliente TEKNIX. Ela possui autenticação, histórico de compras, pedidos e segurança gerenciados nativamente pelo sistema e está <strong>100% protegida contra edições visuais</strong> para garantir a integridade dos dados dos clientes.
          </p>
          <div className="system-locked-actions">
            <Link to="/paginas" className="btn-locked-back">
              Voltar ao Gerenciador de Páginas
            </Link>
            <a href="http://localhost:5176/conta" target="_blank" rel="noreferrer" className="btn-locked-preview">
              <ExternalLink size={14} />
              Visualizar no Site
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`page-editor elementor-style-editor ${isPreviewing ? 'preview-mode' : ''}`}>
      {/* ── UNIFIED MASTER SIDEBAR (300px) ── */}
      {!isPreviewing && (
        <aside className={`elementor-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {/* Elementor Floating Collapse/Expand Handle (Middle of Right Border) */}
          <div
            className="elementor-sidebar-collapse-handle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expandir Painel Lateral" : "Recolher Painel Lateral"}
          >
            {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </div>

          {/* Header of Sidebar — Elementor Toolbar */}
          <div className="elementor-sidebar-header">
            <div className="elementor-sidebar-header-left">
              <button
                className={`elementor-hamburger-btn ${showHamburgerMenu ? 'active' : ''}`}
                onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                title="Menu Principal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <button
                className={`sidebar-header-btn ${sidebarView === 'widgets' && sidebarTab === 'elements' ? 'active' : ''}`}
                onClick={() => {
                  setSidebarView('widgets')
                  setSidebarTab('elements')
                  setSelectedWidgetId(null); setSelectedContainerId(null); setSelectedSectionId(null)
                }}
                title="Adicionar Elementos"
              >
                <Plus size={16} />
              </button>
              <button
                className={`sidebar-header-btn ${showNavigator ? 'active' : ''}`}
                onClick={() => setShowNavigator(!showNavigator)}
                title="Estrutura (Navigator)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.6645 3.32918C11.8757 3.22361 12.1242 3.22361 12.3353 3.32918L20.3353 7.32918C20.5894 7.45622 20.7499 7.71592 20.7499 8C20.7499 8.28408 20.5894 8.54378 20.3353 8.67082L12.3353 12.6708C12.1242 12.7764 11.8757 12.7764 11.6645 12.6708L3.66451 8.67082C3.41042 8.54378 3.24992 8.28408 3.24992 8C3.24992 7.71592 3.41042 7.45622 3.66451 7.32918L11.6645 3.32918ZM5.67697 8L11.9999 11.1615L18.3229 8L11.9999 4.83853L5.67697 8ZM3.3291 11.6646C3.51434 11.2941 3.96485 11.1439 4.33533 11.3292L11.9999 15.1615L19.6645 11.3292C20.035 11.1439 20.4855 11.2941 20.6707 11.6646C20.856 12.0351 20.7058 12.4856 20.3353 12.6708L12.3353 16.6708C12.1242 16.7764 11.8757 16.7764 11.6645 16.6708L3.66451 12.6708C3.29403 12.4856 3.14386 12.0351 3.3291 11.6646ZM3.3291 15.6646C3.51434 15.2941 3.96485 15.1439 4.33533 15.3292L11.9999 19.1615L19.6645 15.3292C20.035 15.1439 20.4855 15.2941 20.6707 15.6646C20.856 16.0351 20.7058 16.4856 20.3353 16.6708L12.3353 20.6708C12.1242 20.7764 11.8757 20.7764 11.6645 20.6708L3.66451 16.6708C3.29403 16.4856 3.14386 16.0351 3.3291 15.6646Z"/>
                </svg>
              </button>
              <button
                className={`sidebar-header-btn ${sidebarView === 'page_settings' ? 'active' : ''}`}
                onClick={() => {
                  setSidebarView(sidebarView === 'page_settings' ? 'widgets' : 'page_settings')
                  setSelectedWidgetId(null); setSelectedContainerId(null); setSelectedSectionId(null)
                }}
                title="Configurações da Página"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <circle cx="12" cy="14" r="2" />
                </svg>
              </button>
              <button
                className="sidebar-header-btn"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Histórico / Desfazer (Ctrl+Z)"
              >
                <History size={15} />
              </button>
            </div>

            {/* Top-right collapse button in header */}
            <button
              className="sidebar-header-btn sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed(true)}
              title="Recolher Painel Lateral"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Hamburger Dropdown Popup (1:1 Elementor) */}
            {showHamburgerMenu && (
              <div className="elementor-menu-dropdown">
                <button className="elementor-menu-item" onClick={() => { setShowHamburgerMenu(false); setSidebarView('page_settings') }}>
                  <Settings size={15} /> Configurações do site
                </button>
                <button className="elementor-menu-item" onClick={() => { setShowHamburgerMenu(false); window.open('/hub/theme-builder', '_blank') }}>
                  <Layout size={15} /> Construtor de temas
                </button>
                <button className="elementor-menu-item" onClick={() => { setShowHamburgerMenu(false) }}>
                  <MessageSquare size={15} /> Notes
                </button>
                <button className="elementor-menu-item" onClick={() => { setShowHamburgerMenu(false) }}>
                  <Sliders size={15} /> Preferências do usuário
                </button>
                <button className="elementor-menu-item" onClick={() => { setShowHamburgerMenu(false); setShowShortcutsModal(true) }}>
                  <Keyboard size={15} /> Atalhos do teclado
                </button>
                <div className="elementor-menu-divider" />
                <button className="elementor-menu-item" onClick={() => { setShowHamburgerMenu(false) }}>
                  <HelpCircle size={15} /> Central de ajuda
                </button>
                <button className="elementor-menu-item" onClick={() => { setShowHamburgerMenu(false) }}>
                  <User size={15} /> Meu TEKNIX
                </button>
                <div className="elementor-menu-divider" />
                <button className="elementor-menu-item" onClick={() => navigate('/hub/paginas')}>
                  <LogOut size={15} style={{ color: '#ff4d4f' }} /> Sair para o HUB TEKNIX
                </button>
              </div>
            )}
          </div>

          {/* Body of Sidebar */}
          <div className="elementor-sidebar-body">
            {sidebarView === 'header_editor' ? (
              <HeaderInspector
                config={getHeaderConfig()}
                onChangeConfig={handleHeaderConfigChange}
                onOpenLibrary={() => setShowLibraryModal(true)}
                onClose={() => setSidebarView('widgets')}
              />
            ) : sidebarView === 'page_settings' ? (
              <PageSettingsSidebar
                page={page}
                onUpdatePage={handleUpdatePage}
              />
            ) : sidebarView === 'inspector' && selectedItem ? (
              <Inspector
                item={selectedItem}
                tab={inspectorTab}
                viewportMode={viewportMode}
                onViewportChange={setViewportMode}
                onTabChange={setInspectorTab}
                onUpdateSection={(updates) => { if (selectedItem.type === 'section') handleUpdateSection(selectedItem.item.id, updates) }}
                onUpdateContainer={(updates) => { if (selectedItem.type === 'container') handleUpdateContainer(selectedItem.item.id, updates) }}
                onUpdateWidget={(updates) => { if (selectedItem.type === 'widget') handleUpdateWidget(selectedItem.item.id, updates) }}
                onDelete={() => {
                  if (selectedItem.type === 'section') handleDeleteSection(selectedItem.item.id)
                  if (selectedItem.type === 'container') handleDeleteContainer(selectedItem.item.id)
                  if (selectedItem.type === 'widget') handleDeleteWidget(selectedItem.item.id)
                }}
                onBack={() => {
                  setSelectedWidgetId(null); setSelectedContainerId(null); setSelectedSectionId(null)
                  setSidebarView('widgets'); setSidebarTab('elements')
                }}
              />
            ) : (
              <>
                {/* Sidebar Title — Elementor style */}
                <div className="elementor-sidebar-title">
                  {sidebarTab === 'elements' ? 'Elementos' : 'Globais'}
                </div>

                {/* Search */}
                <div className="elementor-sidebar-search">
                  <Search size={14} className="search-icon" />
                  <input placeholder="Pesquisar widget..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="elementor-sidebar-tabs">
                  <button className={`elementor-tab-btn ${sidebarTab === 'elements' ? 'active' : ''}`} onClick={() => setSidebarTab('elements')}>Elementos</button>
                  <button className={`elementor-tab-btn ${sidebarTab === 'globals' ? 'active' : ''}`} onClick={() => setSidebarTab('globals')}>Globais</button>
                </div>

                <div className="elementor-widgets-scroll">
                  {sidebarTab === 'elements' && (filteredWidgets ? (
                    <div className="widget-category">
                      <div className="category-widgets">
                        {filteredWidgets.map(w => (
                          <div
                            key={w.type}
                            className="widget-item"
                            draggable
                            onDragStart={(e) => {
                              const p: DragPayload = { kind: 'widget-new', widgetType: w.type }
                              _dragPayload = p
                              e.dataTransfer.setData('text/plain', JSON.stringify(p))
                              e.dataTransfer.setData('application/json', JSON.stringify(p))
                              e.dataTransfer.effectAllowed = 'copy'
                            }}
                          >
                            {w.category === 'pro' && <span className="pro-badge">PRO</span>}
                            {w.category === 'elementor-pro' && <span className="pro-badge" style={{ background: '#8b5cf6' }}>EP</span>}
                            <span className="widget-icon">{getWidgetIcon(w.type, 22)}</span>
                            <span className="widget-label">{w.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : WIDGET_CATEGORIES.map(cat => {
                    const widgets = WIDGET_DEFINITIONS.filter(w => w.category === cat.key)
                    if (!widgets.length) return null
                    return <WidgetCategory key={cat.key} label={cat.label} widgets={widgets} />
                  }))}

                  {sidebarTab === 'globals' && (
                    <div style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center', padding: 32 }}>
                      Componentes Globais (Header &amp; Footer) sincronizados automaticamente com o SITE.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar Footer (minimal — main controls are in topbar now) */}
          <div className="elementor-sidebar-footer">
            <button className="footer-tool-btn" onClick={undo} disabled={historyIndex <= 0} title="Desfazer">
              <Undo size={16} />
            </button>
            <span style={{ fontSize: '0.65rem', color: '#71808b' }}>
              {sections.reduce((acc, s) => acc + (s.containers || []).reduce((a2, c) => a2 + (c.widgets || []).length, 0), 0)} alterações
            </span>
            <button className="footer-tool-btn" onClick={() => setShowPageSettings(true)} title="Configurações">
              <Settings size={16} />
            </button>
          </div>
        </aside>
      )}

      {/* ── MAIN AREA (TopBar + Canvas) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* ── ELEMENTOR TOP BAR (Full Header Toolbar) ── */}
        {!isPreviewing ? (
          <div className="elementor-topbar">
            {/* Left: Voltar ao HUB, Nome da Página, Status */}
            <div className="topbar-left" style={{ position: 'relative' }}>
              <button className="topbar-back-btn" onClick={() => navigate('/hub/paginas')} title="Voltar ao HUB">
                <ChevronLeft size={18} />
              </button>
              <div style={{ position: 'relative' }}>
                <button className="topbar-collections-btn" onClick={() => setShowPagesDropdown(!showPagesDropdown)}>
                  <span>{page.title}</span>
                  <ChevronDown size={14} />
                </button>
                {showPagesDropdown && (
                  <div className="elementor-collections-dropdown">
                    <div className="collections-header">Recente</div>
                    {allPages.slice(0, 8).map(p => (
                      <button key={p.id} className="collections-item" onClick={() => { setShowPagesDropdown(false); navigate(`/hub/paginas/editar/${p.id}`) }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.title}</span>
                        <span className={`collections-badge ${p.type === 'product' ? 'post' : ''}`}>{p.type === 'product' ? 'Produto' : p.type === 'home' ? 'Home' : 'Single Page'}</span>
                      </button>
                    ))}
                    <button className="collections-add-btn" onClick={() => { setShowPagesDropdown(false); createNewPage() }}>
                      <Plus size={14} /> Adicionar nova página
                    </button>
                  </div>
                )}
              </div>
              <span className={`topbar-status ${page.status === 'published' ? 'published' : 'draft'}`}>
                {page.status === 'published' ? '● Publicado' : '○ Rascunho'}
              </span>
            </div>

            {/* Center: Device Switcher (Desktop, Tablet, Mobile) */}
            <div className="topbar-center">
              <div className="topbar-device-switcher">
                <button
                  className={`topbar-device-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
                  onClick={() => setViewportMode('desktop')}
                  title="Desktop (100%)"
                >
                  <Monitor size={15} />
                </button>
                <button
                  className={`topbar-device-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
                  onClick={() => setViewportMode('tablet')}
                  title="Tablet (768px)"
                >
                  <TabletIcon size={15} />
                </button>
                <button
                  className={`topbar-device-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
                  onClick={() => setViewportMode('mobile')}
                  title="Mobile (375px)"
                >
                  <Smartphone size={15} />
                </button>
              </div>
            </div>

            {/* Right: History, Navigator, Settings, Preview & Publish */}
            <div className="topbar-right">
              <button
                className="topbar-icon-btn"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Desfazer (Ctrl+Z)"
              >
                <Undo size={16} />
              </button>
              <button
                className="topbar-icon-btn"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Refazer (Ctrl+Y)"
              >
                <Redo size={16} />
              </button>
              <button
                className={`topbar-icon-btn ${showNavigator ? 'active' : ''}`}
                onClick={() => setShowNavigator(!showNavigator)}
                title="Navegador de Estrutura (Navigator)"
              >
                <Layers size={16} />
              </button>
              <button
                className="topbar-icon-btn"
                onClick={() => setShowPageSettings(true)}
                title="Configurações da Página"
              >
                <Settings size={16} />
              </button>
              <button
                className="topbar-preview-btn"
                onClick={() => setIsPreviewing(true)}
                title="Visualizar no Site"
              >
                <Eye size={15} />
                <span>Visualizar</span>
              </button>

              <div className="elementor-publish-btn-group">
                <button
                  className="topbar-publish-btn-pro"
                  onClick={handlePublish}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : page.status === 'published' ? 'Atualizar' : 'Publicar'}
                </button>
                <button
                  className="topbar-publish-arrow"
                  onClick={() => setShowPublishDropdown(!showPublishDropdown)}
                  title="Opções de Salvamento"
                >
                  <ChevronDown size={14} />
                </button>
                {showPublishDropdown && (
                  <div className="elementor-collections-dropdown" style={{ right: 0, left: 'auto', width: 220, top: 40 }}>
                    <button className="collections-item" onClick={() => { setShowPublishDropdown(false); handleSave() }}>
                      <FileText size={14} style={{ marginRight: 8 }} /> Salvar rascunho
                    </button>
                    <button className="collections-item" onClick={() => { setShowPublishDropdown(false); handlePublish() }}>
                      <Folder size={14} style={{ marginRight: 8 }} /> Salvar como modelo
                    </button>
                    <button className="collections-item" onClick={() => { setShowPublishDropdown(false); setShowDisplayConditionsModal(true) }}>
                      <Network size={14} style={{ marginRight: 8, color: '#db468e' }} /> Display Conditions
                    </button>
                    <button className="collections-item" onClick={() => { setShowPublishDropdown(false); window.open(`http://localhost:5173${page.slug?.startsWith('/') ? page.slug : `/${page.slug}`}`, '_blank') }}>
                      <Eye size={14} style={{ marginRight: 8 }} /> Ver página no Site (5173)
                    </button>
                    {page.status === 'published' && (
                      <button className="collections-item" style={{ color: '#ff4d4f' }} onClick={() => { setShowPublishDropdown(false); handleUnpublish() }}>
                        Despublicar Página
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Preview Top Bar (Elementor Pro Glass Floating Pill) */
          <div
            style={{
              position: 'fixed',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(29, 29, 31, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 980,
              padding: '6px 14px 6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: '#ffffff',
              zIndex: 999999,
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background: '#00d2b4',
                  color: '#083b32',
                  padding: '2px 8px',
                  borderRadius: 980,
                  fontWeight: 800,
                  fontSize: 9.5,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                Preview
              </span>
              <span style={{ fontWeight: 600, fontSize: 12.5, color: '#f5f5f7' }}>{page.title}</span>
              <span style={{ color: '#86868b', fontSize: 11 }}>
                ({page.status === 'published' ? '● Publicado' : '○ Rascunho'})
              </span>
            </div>

            <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.12)' }} />

            {/* Viewport Device Switcher */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                padding: 2,
                gap: 2
              }}
            >
              <button
                type="button"
                className={`footer-device-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
                onClick={() => setViewportMode('desktop')}
                title="Desktop"
                style={{ width: 26, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Monitor size={13} />
              </button>
              <button
                type="button"
                className={`footer-device-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
                onClick={() => setViewportMode('tablet')}
                title="Tablet"
                style={{ width: 26, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <TabletIcon size={13} />
              </button>
              <button
                type="button"
                className={`footer-device-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
                onClick={() => setViewportMode('mobile')}
                title="Mobile"
                style={{ width: 26, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Smartphone size={13} />
              </button>
            </div>

            <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.12)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a
                href={`http://localhost:5173/preview/${page.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#ffffff',
                  fontSize: 11.5,
                  fontWeight: 500,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Abrir no Site ↗
              </a>

              <button
                type="button"
                onClick={() => setIsPreviewing(false)}
                style={{
                  background: '#0071e3',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontWeight: 600,
                  fontSize: 11.5,
                  cursor: 'pointer'
                }}
              >
                Voltar à Edição
              </button>
            </div>
          </div>
        )}

        {/* ── CANVAS AREA ── */}
        <div className={`elementor-canvas-wrapper viewport-${viewportMode}`} style={{ flex: 1, overflow: 'auto' }}>
          <style id="teknix-editor-compiled-css" dangerouslySetInnerHTML={{ __html: compiledCanvasCSS }} />
          <div
            className="elementor-canvas-inner"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={(e) => {
              // If dropped directly on the canvas inner root (outside any container)
              if ((e.target as HTMLElement).classList.contains('elementor-canvas-inner') || (e.target as HTMLElement).classList.contains('elementor-canvas-wrapper')) {
                e.preventDefault()
                e.stopPropagation()
                let payload: any = _dragPayload
                if (!payload) {
                  try {
                    const raw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json')
                    if (raw) payload = JSON.parse(raw)
                  } catch {}
                }
                _dragPayload = null
                if (payload && (payload.kind === 'widget-new' || payload.type === 'widget-new')) {
                  const wType = payload.widgetType || payload.type
                  handleCreateSectionWithWidget(wType)
                }
              }
            }}
          >
            {/* Header Global TEKNIX no Canvas */}
            {!page.is_landing_mode && (
              <GlobalHeaderRenderer
                isEditor
                viewportMode={viewportMode}
                isSelected={sidebarView === 'header_editor'}
                config={getHeaderConfig()}
                onSelect={() => {
                  setSelectedWidgetId(null)
                  setSelectedContainerId(null)
                  setSelectedSectionId(null)
                  setSidebarView('header_editor')
                }}
                onOpenLibrary={() => {
                  setShowLibraryModal(true)
                }}
                onChangeConfig={handleHeaderConfigChange}
                onHideHeader={() => handleUpdatePage({ is_landing_mode: true })}
              />
            )}

            {/* Only show page sections if not in isolated header theme editing mode */}
            {(!isThemePartMode || partType !== 'header') && sections.map((section, secIdx) => (
              <React.Fragment key={section.id}>
                {/* Inline Add Section box when user clicks + on handle above this section */}
                {insertSectionIndex === secIdx && renderInlineAddSectionBox(secIdx)}

                <SectionBlock
                  key={section.id}
                  section={section}
                  sectionIndex={secIdx}
                  totalSections={sections.length}
                  isSelected={selectedSectionId === section.id}
                  selectedContainerId={selectedContainerId}
                  selectedWidgetId={selectedWidgetId}
                  viewportMode={viewportMode}
                  onSelect={() => selectSection(section.id)}
                  onSelectContainer={selectContainer}
                  onSelectWidget={selectWidget}
                  onAddAbove={(index: number) => {
                    setInsertSectionIndex(index)
                    setShowInlineStructure(false)
                  }}
                  onAddContainer={() => handleAddContainer(section.id)}
                  onDelete={() => handleDeleteSection(section.id)}
                  onDuplicate={() => handleDuplicateSection(section.id)}
                  onDeleteContainer={handleDeleteContainer}
                  onContextMenu={handleContextMenu}
                  onWidgetDrop={(containerId: string, type: string, insertBeforeId?: string) => handleAddWidget(containerId, type, insertBeforeId)}
                  onAddContainerWithWidget={handleAddContainerWithWidget}
                  onWidgetMove={handleMoveWidget}
                  onWidgetReorder={handleReorderWidget}
                  onWidgetDelete={handleDeleteWidget}
                  onWidgetDuplicate={handleDuplicateWidget}
                  onMoveUp={() => {
                    if (secIdx === 0) return
                    const ns = [...sections]; [ns[secIdx - 1], ns[secIdx]] = [ns[secIdx], ns[secIdx - 1]]; setSections(ns)
                  }}
                  onMoveDown={() => {
                    if (secIdx === sections.length - 1) return
                    const ns = [...sections]; [ns[secIdx], ns[secIdx + 1]] = [ns[secIdx + 1], ns[secIdx]]; setSections(ns)
                  }}
                  onSectionReorder={handleSectionReorder}
                />
              </React.Fragment>
            ))}

            {/* ── BOTTOM ELEMENTOR ADD SECTION / STRUCTURE SELECTOR ── */}
            {insertSectionIndex === null && renderInlineAddSectionBox(null)}

            {/* Footer Global TEKNIX no Canvas */}
            {!page.is_landing_mode && (
              <GlobalFooterRenderer
                isEditor
                config={{
                  model: (page as any).footer_model || 'apple_directory_5cols_light',
                  companyName: 'TEKNIX Industrial Inc.',
                  copyrightYear: new Date().getFullYear(),
                }}
                onChangeConfig={(newCfg) => {
                  handleUpdatePage({
                    ...page,
                    footer_model: newCfg.model
                  } as any)
                }}
                onHideFooter={() => handleUpdatePage({ is_landing_mode: true })}
              />
            )}
          </div>
        </div>
      </div>

      {/* SAVE ERROR TOAST */}
      {saveError && (
        <div className="save-error-toast" onClick={() => setSaveError(null)}>
          <span>Erro ao salvar: {saveError}</span>
          <span style={{ marginLeft: 8, opacity: 0.7, fontSize: '0.7rem' }}>(clique para fechar)</span>
        </div>
      )}

      {/* NAVIGATOR TREE */}
      {showNavigator && !isPreviewing && (
        <Navigator
          sections={sections}
          selectedId={selectedWidgetId || selectedContainerId || selectedSectionId}
          onSelect={(type, id) => {
            if (type === 'section') selectSection(id)
            if (type === 'container') selectContainer(id)
            if (type === 'widget') selectWidget(id)
          }}
          onClose={() => setShowNavigator(false)}
          onUpdateSection={(id, updates) => handleUpdateSection(id, updates)}
          onUpdateContainer={(id, updates) => handleUpdateContainer(id, updates)}
          onUpdateWidget={(id, updates) => handleUpdateWidget(id, updates)}
        />
      )}

      {/* PAGE SETTINGS MODAL */}
      {showPageSettings && (
        <div className="modal-overlay" onClick={() => setShowPageSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configurações da Página</h3>
              <button onClick={() => setShowPageSettings(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Título da Página</label><input value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} /></div>
              <div className="form-group"><label>Slug / URL</label><input value={page.seo_slug || page.slug} onChange={(e) => setPage({ ...page, seo_slug: e.target.value })} /></div>
              <div className="form-group"><label>Meta Title (SEO)</label><input value={page.seo_title} onChange={(e) => setPage({ ...page, seo_title: e.target.value })} /></div>
              <div className="form-group"><label>Meta Description (SEO)</label><textarea value={page.seo_description} onChange={(e) => setPage({ ...page, seo_description: e.target.value })} /></div>
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div className="modal-overlay" onClick={() => setShowShortcutsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3><Keyboard size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Atalhos do Teclado</h3>
              <button onClick={() => setShowShortcutsModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #383c40', fontSize: '0.85rem' }}>
                <span style={{ color: '#aaa' }}>Salvar Página</span>
                <kbd style={{ background: '#1c1c1c', border: '1px solid #444', padding: '2px 8px', borderRadius: 4, color: '#00ff88' }}>Ctrl / Cmd + S</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #383c40', fontSize: '0.85rem' }}>
                <span style={{ color: '#aaa' }}>Desfazer (Undo)</span>
                <kbd style={{ background: '#1c1c1c', border: '1px solid #444', padding: '2px 8px', borderRadius: 4, color: '#00ff88' }}>Ctrl / Cmd + Z</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #383c40', fontSize: '0.85rem' }}>
                <span style={{ color: '#aaa' }}>Refazer (Redo)</span>
                <kbd style={{ background: '#1c1c1c', border: '1px solid #444', padding: '2px 8px', borderRadius: 4, color: '#00ff88' }}>Ctrl / Cmd + Shift + Z</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
                <span style={{ color: '#aaa' }}>Fechar Painel / Limpar Seleção</span>
                <kbd style={{ background: '#1c1c1c', border: '1px solid #444', padding: '2px 8px', borderRadius: 4, color: '#00ff88' }}>Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT SELECTOR MODAL */}
      {showLayoutSelector && (
        <div className="modal-overlay" onClick={() => setShowLayoutSelector(false)}>
          <div className="modal layout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Escolha a Estrutura da Seção</h3>
              <button onClick={() => setShowLayoutSelector(false)}><X size={16} /></button>
            </div>
            <div className="layout-presets-grid">
              {LAYOUT_PRESETS.map(preset => (
                <div key={preset.id} className="layout-preset-card" onClick={() => handleCreateSectionWithLayout(preset)}>
                  <div className="layout-preset-visual">
                    {preset.cols.map((width, idx) => <div key={idx} className="layout-preset-col" style={{ width: `${width}%` }} />)}
                  </div>
                  <div className="layout-preset-label">{preset.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ELEMENTOR TEMPLATE & SECTION LIBRARY MODAL */}
      <TemplateLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onInsertPreset={handleInsertPreset}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* THEME BUILDER MODAL (1:1 ELEMENTOR SITE PARTS) */}
      <ThemeBuilderModal
        isOpen={showThemeBuilder}
        onClose={() => setShowThemeBuilder(false)}
        onSelectHeaderModel={(model) => {
          handleUpdatePage({
            ...page,
            header_model: model
          } as any)
        }}
      />

      {/* DISPLAY CONDITIONS MODAL (1:1 ELEMENTOR PUBLISH SETTINGS) */}
      <DisplayConditionsModal
        isOpen={showDisplayConditionsModal}
        onClose={() => setShowDisplayConditionsModal(false)}
        onSave={(conditions) => {
          handleUpdatePage({
            ...page,
            display_conditions: conditions
          } as any)
        }}
        initialConditions={(page as any)?.display_conditions}
        modelName={(page as any)?.title || 'Modelo'}
        availablePages={allPages.map(p => ({ id: p.id, title: p.title, slug: p.slug }))}
      />

      {/* ── BOTTOM TOAST NOTIFICATION (Projeto Publicado / Alterações Salvas) ── */}
      {toast && (
        <div className="editor-bottom-toast">
          <div className={`toast-icon ${toast.type === 'error' ? 'error' : ''}`}>
            {toast.type === 'error' ? <X size={14} /> : <Check size={14} strokeWidth={3} />}
          </div>
          <span className="toast-message">{toast.message}</span>
          {toast.actionUrl && (
            <a
              href={toast.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="toast-action-btn"
            >
              <Eye size={12} />
              {toast.actionLabel || 'Visualizar'}
            </a>
          )}
          <button
            type="button"
            className="toast-close"
            onClick={() => setToast(null)}
            title="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── ELEMENTOR RIGHT CLICK CONTEXT MENU (1:1) ── */}
      {contextMenu?.isOpen && (
        <ElementorContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetType={contextMenu.targetType}
          targetId={contextMenu.targetId}
          clipboard={clipboard}
          onClose={() => setContextMenu(null)}
          onEdit={() => {
            if (contextMenu.targetType === 'widget') selectWidget(contextMenu.targetId, contextMenu.containerId)
            else if (contextMenu.targetType === 'container') selectContainer(contextMenu.targetId)
            else if (contextMenu.targetType === 'section') selectSection(contextMenu.targetId)
          }}
          onDuplicate={() => {
            if (contextMenu.targetType === 'widget') handleDuplicateWidget(contextMenu.targetId)
            else if (contextMenu.targetType === 'container') handleDuplicateContainer(contextMenu.targetId)
            else if (contextMenu.targetType === 'section') handleDuplicateSection(contextMenu.targetId)
          }}
          onAddContainer={() => {
            if (contextMenu.sectionId) handleAddContainer(contextMenu.sectionId)
            else if (selectedSectionId) handleAddContainer(selectedSectionId)
            else if (sections.length > 0) handleAddContainer(sections[0].id)
          }}
          onCopy={handleCopySelected}
          onPaste={handlePasteFromClipboard}
          onPasteStyle={handlePasteStyleFromClipboard}
          onResetStyle={handleResetStyle}
          onAIVariations={handleAIVariations}
          onSaveAsTemplate={() => setShowLibraryModal(true)}
          onSaveAsDefault={() => {
            alert('Configurações salvas como padrão com sucesso.')
          }}
          onOpenNotes={() => {
            alert('Notes: Recurso de notas e colaboração ativado.')
          }}
          onOpenNavigator={() => setShowNavigator(true)}
          onDelete={() => {
            if (contextMenu.targetType === 'widget') handleDeleteWidget(contextMenu.targetId)
            else if (contextMenu.targetType === 'container') handleDeleteContainer(contextMenu.targetId)
            else if (contextMenu.targetType === 'section') handleDeleteSection(contextMenu.targetId)
          }}
        />
      )}
    </div>
  )
}

// ============================================================
// ELEMENTOR RIGHT-CLICK CONTEXT MENU (1:1 Oficial)
// ============================================================
function ElementorContextMenu({
  x, y,
  targetType,
  targetId,
  clipboard,
  onClose,
  onEdit,
  onDuplicate,
  onAddContainer,
  onCopy,
  onPaste,
  onPasteStyle,
  onResetStyle,
  onAIVariations,
  onSaveAsTemplate,
  onSaveAsDefault,
  onOpenNotes,
  onOpenNavigator,
  onDelete
}: any) {
  useEffect(() => {
    function handleClickOutside() {
      onClose()
    }
    window.addEventListener('click', handleClickOutside)
    return () => {
      window.removeEventListener('click', handleClickOutside)
    }
  }, [onClose])

  const editLabel = targetType === 'widget' ? 'Editar Widget' : targetType === 'container' ? 'Editar Contêiner' : 'Editar Seção'
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmd = isMac ? '⌘' : 'Ctrl'

  return (
    <div
      className="elementor-context-menu-wrapper"
      style={{ top: Math.min(y, window.innerHeight - 380), left: Math.min(x, window.innerWidth - 250) }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="elementor-context-menu-list" role="menu">
        {/* GROUP 1: General */}
        <div className="elementor-context-menu-list__group" role="group">
          <div className="elementor-context-menu-list__item" onClick={() => { onEdit(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Edit2 size={13} /></div>
              <div className="elementor-context-menu-list__item__title">{editLabel}</div>
            </div>
          </div>
          <div className="elementor-context-menu-list__item" onClick={() => { onDuplicate(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Copy size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Duplicar</div>
            </div>
            <div className="elementor-context-menu-list__item__shortcut">{cmd}+D</div>
          </div>
        </div>

        {/* GROUP 2: New Container */}
        <div className="elementor-context-menu-list__group" role="group">
          <div className="elementor-context-menu-list__item" onClick={() => { onAddContainer(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Plus size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Adicionar novo contêiner</div>
            </div>
          </div>
        </div>

        {/* GROUP 3: Clipboard */}
        <div className="elementor-context-menu-list__group" role="group">
          <div className="elementor-context-menu-list__item" onClick={() => { onCopy(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Copy size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Copiar</div>
            </div>
            <div className="elementor-context-menu-list__item__shortcut">{cmd}+C</div>
          </div>
          <div className={`elementor-context-menu-list__item ${!clipboard ? 'elementor-context-menu-list__item--disabled' : ''}`} onClick={() => { if (clipboard) { onPaste(); onClose() } }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Clipboard size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Colar</div>
            </div>
            <div className="elementor-context-menu-list__item__shortcut">{cmd}+V</div>
          </div>
          <div className={`elementor-context-menu-list__item ${!clipboard ? 'elementor-context-menu-list__item--disabled' : ''}`} onClick={() => { if (clipboard) { onPasteStyle(); onClose() } }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Paintbrush size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Colar estilo</div>
            </div>
            <div className="elementor-context-menu-list__item__shortcut">{cmd}+⇧+V</div>
          </div>
          <div className="elementor-context-menu-list__item elementor-context-menu-list__item--disabled" role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"></div>
              <div className="elementor-context-menu-list__item__title">Colar interações</div>
            </div>
          </div>
          <div className="elementor-context-menu-list__item" onClick={() => { onPaste(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Share2 size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Colar de outro site</div>
            </div>
          </div>
          <div className="elementor-context-menu-list__item" onClick={() => { onResetStyle(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><RotateCcw size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Redefinir estilo</div>
            </div>
          </div>
        </div>

        {/* GROUP 4: Save & AI */}
        <div className="elementor-context-menu-list__group" role="group">
          <div className="elementor-context-menu-list__item" onClick={() => { onAIVariations(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Sparkles size={13} style={{ color: '#00e5ff' }} /></div>
              <div className="elementor-context-menu-list__item__title">Gerar variações com IA</div>
            </div>
          </div>
          <div className="elementor-context-menu-list__item" onClick={() => { onSaveAsTemplate(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Download size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Salvar como um modelo</div>
            </div>
            <div className="elementor-context-menu-list__item__shortcut">
              <span className="elementor-context-menu-list__item__shortcut__new-badge">Novo</span>
            </div>
          </div>
          <div className="elementor-context-menu-list__item" onClick={() => { onSaveAsDefault(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><CheckSquare size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Salvar como padrão</div>
            </div>
          </div>
        </div>

        {/* GROUP 5: Notes & Tools */}
        <div className="elementor-context-menu-list__group" role="group">
          <div className="elementor-context-menu-list__item" onClick={() => { onOpenNotes(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><MessageSquare size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Notes</div>
            </div>
            <div className="elementor-context-menu-list__item__shortcut">⇧+C</div>
          </div>
          <div className="elementor-context-menu-list__item" onClick={() => { onOpenNavigator(); onClose() }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon"><Layers size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Estrutura</div>
            </div>
            <div className="elementor-context-menu-list__item__shortcut">{cmd}+I</div>
          </div>
        </div>

        {/* GROUP 6: Delete */}
        <div className="elementor-context-menu-list__group" role="group">
          <div className="elementor-context-menu-list__item" onClick={() => { onDelete(); onClose() }} style={{ color: '#ff6b6b' }} role="menuitem">
            <div className="elementor-context-menu-list__item-left">
              <div className="elementor-context-menu-list__item__icon" style={{ color: '#ff6b6b' }}><Trash2 size={13} /></div>
              <div className="elementor-context-menu-list__item__title">Excluir</div>
            </div>
            <div className="elementor-context-menu-list__item__shortcut">⌦</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper to read responsive values per active viewport mode
function getResponsiveVal(obj: any, key: string, viewportMode: string = 'desktop', fallback: any = undefined) {
  if (!obj) return fallback
  if (viewportMode !== 'desktop') {
    if (obj.responsive?.[viewportMode]?.[key] !== undefined && obj.responsive[viewportMode][key] !== '') {
      return obj.responsive[viewportMode][key]
    }
    if (obj[`${key}_${viewportMode}`] !== undefined && obj[`${key}_${viewportMode}`] !== '') {
      return obj[`${key}_${viewportMode}`]
    }
    if (viewportMode === 'mobile' && obj.responsive?.tablet?.[key] !== undefined && obj.responsive.tablet[key] !== '') {
      return obj.responsive.tablet[key]
    }
    if (viewportMode === 'mobile' && obj[`${key}_tablet`] !== undefined && obj[`${key}_tablet`] !== '') {
      return obj[`${key}_tablet`]
    }
  }
  return obj[key] ?? obj.settings?.[key] ?? obj.style?.[key] ?? fallback
}

// ============================================================
// SECTION BLOCK (Elementor Section Handle)
// ============================================================
function SectionBlock({
  section, sectionIndex, totalSections, isSelected, selectedContainerId, selectedWidgetId, viewportMode,
  onSelect, onSelectContainer, onSelectWidget, onAddAbove, onAddContainer, onDelete, onDuplicate, onDeleteContainer, onContextMenu,
  onWidgetDrop, onAddContainerWithWidget, onWidgetMove, onWidgetReorder, onWidgetDelete, onWidgetDuplicate,
  onMoveUp, onMoveDown, onSectionReorder
}: any) {
  const [isDragOver, setIsDragOver] = useState(false)

  const sectionStyle: React.CSSProperties = {
    ...computeSectionStyles(section, viewportMode),
    width: '100%',
    margin: '0 auto',
  }

  const gap = resolveResponsiveValue(section, 'gap', viewportMode, '0px')
  const direction = resolveResponsiveValue(section, 'direction', viewportMode, 'row')

  return (
    <div
      data-section-id={section.id}
      className={`canvas-section ${isSelected ? 'selected' : ''} ${isDragOver ? 'section-drag-target' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, 'section', section.id) }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'copy'
        setIsDragOver(true)
      }}
      onDragLeave={(e) => {
        e.stopPropagation()
        setIsDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        let payload: any = _dragPayload
        if (!payload) {
          try {
            const raw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json')
            if (raw) payload = JSON.parse(raw)
          } catch {}
        }
        _dragPayload = null

        if (!payload) return

        if (payload.type === 'section-reorder' && typeof payload.index === 'number' && onSectionReorder) {
          onSectionReorder(payload.index, sectionIndex)
          return
        }

        if (payload.kind === 'widget-new' || payload.type === 'widget-new') {
          const wType = payload.widgetType || payload.type
          const containers = section.containers || []
          if (containers.length === 0) {
            if (onAddContainerWithWidget) onAddContainerWithWidget(section.id, wType)
          } else {
            const targetContainer = containers[containers.length - 1]
            onWidgetDrop(targetContainer.id, wType)
          }
          return
        }

        if (payload.kind === 'widget-move' || payload.type === 'widget-move') {
          const containers = section.containers || []
          if (containers.length > 0) {
            const targetContainer = containers[containers.length - 1]
            onWidgetMove(payload.widgetId, payload.fromContainerId, targetContainer.id)
          }
        }
      }}
      style={sectionStyle}
    >
      {/* Official Elementor Section/Container Handle (Exact 1:1 Print 2) */}
      <ul
        className={`elementor-editor-element-settings elementor-editor-container-settings elementor-editor-element-overlay-settings ${isSelected ? 'selected' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Botão + : Adicionar Seção / Contêiner acima */}
        <li
          className="elementor-editor-element-setting elementor-editor-element-add"
          title="Adicionar Contêiner / Seção Acima"
          aria-label="Adicionar Contêiner"
          onClick={(e) => {
            e.stopPropagation()
            onAddAbove(sectionIndex)
          }}
        >
          <Plus size={10} strokeWidth={2.5} />
        </li>

        {/* 2. Botão ⠿ (6 pontos) : Clicar para selecionar e arrastar para mover seção para cima ou para baixo */}
        <li
          className="elementor-editor-element-setting elementor-editor-element-edit ui-sortable-handle"
          title="Arrastar para reordenar seção / Clicar para editar"
          aria-label="Editar Contêiner"
          draggable={true}
          onDragStart={(e) => {
            e.stopPropagation()
            e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'section-reorder', index: sectionIndex }))
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          onContextMenu={(e) => onContextMenu(e, 'section', section.id)}
        >
          <svg width="12" height="7" viewBox="0 0 12 7" fill="currentColor">
            <circle cx="2" cy="1.5" r="1" />
            <circle cx="6" cy="1.5" r="1" />
            <circle cx="10" cy="1.5" r="1" />
            <circle cx="2" cy="5.5" r="1" />
            <circle cx="6" cy="5.5" r="1" />
            <circle cx="10" cy="5.5" r="1" />
          </svg>
        </li>

        {/* 3. Botão ✕ : Excluir seção inteira */}
        <li
          className="elementor-editor-element-setting elementor-editor-element-remove"
          title="Excluir Seção Inteira"
          aria-label="Excluir Contêiner"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <X size={10} strokeWidth={2.5} />
        </li>
      </ul>

      <div className={`section-containers ${viewportMode === 'mobile' ? 'mobile-stack' : ''}`}
        style={{ display: 'flex', gap: gap, flexDirection: direction === 'row' ? 'row' : 'column', flexWrap: 'wrap', margin: '0 auto' }}>
        {(section.containers || []).sort((a: any, b: any) => a.order - b.order).map((container: PageContainer) => (
          <ContainerBlock
            key={container.id}
            container={container}
            isSelected={selectedContainerId === container.id}
            selectedWidgetId={selectedWidgetId}
            viewportMode={viewportMode}
            onSelect={() => onSelectContainer(container.id)}
            onSelectWidget={(wId: string) => onSelectWidget(wId, container.id)}
            onAddContainer={onAddContainer}
            onDeleteContainer={() => onDeleteContainer && onDeleteContainer(container.id)}
            onContextMenu={onContextMenu}
            onWidgetDrop={(type: string, beforeId?: string) => onWidgetDrop(container.id, type, beforeId)}
            onWidgetMove={(widgetId: string, fromContainerId: string, insertBeforeId?: string) =>
              onWidgetMove(widgetId, fromContainerId, container.id, insertBeforeId)}
            onWidgetReorder={(widgetId: string, insertBeforeId: string | null) =>
              onWidgetReorder(container.id, widgetId, insertBeforeId)}
            onWidgetDelete={onWidgetDelete}
            onWidgetDuplicate={onWidgetDuplicate}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// CONTAINER BLOCK (Elementor Outer Container + Inner Content)
// ============================================================
function ContainerBlock({ container, isSelected, selectedWidgetId, viewportMode, onSelect, onSelectWidget, onAddContainer, onDeleteContainer, onWidgetDrop, onWidgetMove, onWidgetReorder, onWidgetDelete, onWidgetDuplicate, onContextMenu }: any) {
  const [dragOver, setDragOver] = useState(false)
  const [insertBeforeId, setInsertBeforeId] = useState<string | null>(null)

  const outerContainerStyle: React.CSSProperties = {
    ...computeContainerOuterStyles(container, viewportMode),
    position: 'relative',
  }

  const innerContentStyle: React.CSSProperties = computeContainerInnerStyles(container, viewportMode)

  function handleDrop(e: React.DragEvent, beforeId?: string) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    setInsertBeforeId(null)

    let payload: any = _dragPayload
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json')
        if (raw) payload = JSON.parse(raw)
      } catch {}
    }
    _dragPayload = null

    if (!payload) return

    if (payload.kind === 'widget-new' || payload.type === 'widget-new') {
      const widgetType = payload.widgetType || payload.type
      onWidgetDrop(widgetType, beforeId)
    } else if (payload.kind === 'widget-move' || payload.type === 'widget-move') {
      if (payload.fromContainerId === container.id) {
        onWidgetReorder(payload.widgetId, beforeId || null)
      } else {
        onWidgetMove(payload.widgetId, payload.fromContainerId, beforeId)
      }
    }
  }

  const widgets = [...(container.widgets || [])].sort((a: any, b: any) => a.order - b.order)
  const isBoxed = resolveResponsiveValue<string>(container, 'content_width', viewportMode, 'boxed') !== 'full'
  const dirVal = resolveResponsiveValue<string>(container, 'direction', viewportMode, container.direction || 'column')

  return (
    <div className={`canvas-container e-con ${isBoxed ? 'e-con-boxed' : 'e-con-full'} ${isSelected ? 'selected' : ''} ${dragOver ? 'drag-over' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, 'container', container.id, container.section_id) }}
      style={outerContainerStyle}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'copy'
        setDragOver(true)
      }}
      onDragLeave={(e) => {
        e.stopPropagation()
        setDragOver(false)
      }}
      onDrop={(e) => handleDrop(e)}>

      {/* Official Elementor Container Handle (1:1 Print 2) */}
      <ul
        className={`elementor-editor-element-settings elementor-editor-container-settings elementor-editor-element-overlay-settings ${isSelected ? 'selected' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <li
          className="elementor-editor-element-setting elementor-editor-element-add"
          title="Adicionar Contêiner"
          aria-label="Adicionar Contêiner"
          onClick={(e) => { e.stopPropagation(); onAddContainer && onAddContainer() }}
        >
          <Plus size={10} strokeWidth={2.5} />
        </li>
        <li
          className="elementor-editor-element-setting elementor-editor-element-edit ui-sortable-handle"
          title="Editar Contêiner"
          aria-label="Editar Contêiner"
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          onContextMenu={(e) => onContextMenu(e, 'container', container.id, container.section_id)}
        >
          <svg width="12" height="7" viewBox="0 0 12 7" fill="currentColor">
            <circle cx="2" cy="1.5" r="1" />
            <circle cx="6" cy="1.5" r="1" />
            <circle cx="10" cy="1.5" r="1" />
            <circle cx="2" cy="5.5" r="1" />
            <circle cx="6" cy="5.5" r="1" />
            <circle cx="10" cy="5.5" r="1" />
          </svg>
        </li>
        <li
          className="elementor-editor-element-setting elementor-editor-element-remove"
          title="Excluir Contêiner"
          aria-label="Excluir Contêiner"
          onClick={(e) => { e.stopPropagation(); onDeleteContainer && onDeleteContainer() }}
        >
          <X size={10} strokeWidth={2.5} />
        </li>
      </ul>

      <div className="e-con-inner" style={innerContentStyle}>
        {widgets.length === 0 ? (
          <div
            className={`widget-drop-zone ${dragOver ? 'drag-over' : ''}`}
            style={{ width: '100%' }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.dataTransfer.dropEffect = 'copy'
              setDragOver(true)
            }}
            onDrop={(e) => handleDrop(e)}
          >
            <Plus size={14} />
            <span>Arraste aqui</span>
          </div>
        ) : (
          <>
            {widgets.map((widget: PageWidget) => (
              <div
                key={widget.id}
                style={{
                  width: container.display_type === 'grid' ? 'auto' : (dirVal === 'row' ? 'auto' : '100%'),
                  position: 'relative'
                }}
              >
                <div
                  className={`widget-insert-zone ${insertBeforeId === widget.id && dragOver ? 'active' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.dataTransfer.dropEffect = 'copy'
                    setDragOver(true)
                    setInsertBeforeId(widget.id)
                  }}
                  onDrop={(e) => handleDrop(e, widget.id)}
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.dataTransfer.dropEffect = 'copy'
                    setDragOver(true)
                    const rect = e.currentTarget.getBoundingClientRect()
                    const isTopHalf = (e.clientY - rect.top) < (rect.height / 2)
                    if (isTopHalf) {
                      setInsertBeforeId(widget.id)
                    } else {
                      const idx = widgets.findIndex((w: any) => w.id === widget.id)
                      setInsertBeforeId(idx + 1 < widgets.length ? widgets[idx + 1].id : null)
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    const isTopHalf = (e.clientY - rect.top) < (rect.height / 2)
                    if (isTopHalf) {
                      handleDrop(e, widget.id)
                    } else {
                      const idx = widgets.findIndex((w: any) => w.id === widget.id)
                      handleDrop(e, idx + 1 < widgets.length ? widgets[idx + 1].id : undefined)
                    }
                  }}
                >
                  <WidgetBlock
                    widget={widget}
                    viewportMode={viewportMode}
                    isSelected={selectedWidgetId === widget.id}
                    onSelect={() => onSelectWidget(widget.id)}
                    onDelete={() => onWidgetDelete(widget.id)}
                    onDuplicate={() => onWidgetDuplicate(widget.id)}
                    onContextMenu={(e: any) => onContextMenu(e, 'widget', widget.id, undefined, container.id)}
                    onDragStart={(e: any) => {
                      const payload = { kind: 'widget-move' as const, widgetId: widget.id, fromContainerId: container.id }
                      _dragPayload = payload as any
                      if (e && e.dataTransfer) {
                        try {
                          e.dataTransfer.setData('text/plain', JSON.stringify(payload))
                          e.dataTransfer.setData('application/json', JSON.stringify(payload))
                        } catch {}
                      }
                    }}
                  />
                </div>
              </div>
            ))}
            <div
              className={`widget-insert-zone ${dragOver && !insertBeforeId ? 'active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
                setDragOver(true)
                setInsertBeforeId(null)
              }}
              onDrop={(e) => handleDrop(e)}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// WIDGET BLOCK
// ============================================================
function WidgetBlock({ widget, viewportMode = 'desktop', isSelected, onSelect, onDelete, onDuplicate, onDragStart, onContextMenu }: any) {
  const typeLabel = WIDGET_DEFINITIONS.find(w => w.type === widget.type)?.label || widget.type
  return (
    <div
      className={`canvas-widget ${isSelected ? 'selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e) }}
      draggable
      onDragStart={(e) => {
        if (onDragStart) onDragStart(e)
        e.dataTransfer.effectAllowed = 'move'
        try {
          const payload = JSON.stringify({ kind: 'widget-move', widgetId: widget.id, fromContainerId: widget.container_id })
          e.dataTransfer.setData('text/plain', payload)
          e.dataTransfer.setData('application/json', payload)
        } catch {}
      }}
    >
      {/* Elementor Widget Handle (Small Blue Edit Button in Top-Right) */}
      <div className="elementor-widget-edit-handle" onClick={(e) => { e.stopPropagation(); onSelect() }} title={`Editar ${typeLabel}`}>
        <Edit2 size={10} />
      </div>
      <WidgetPreview widget={widget} viewportMode={viewportMode} />
    </div>
  )
}

// ============================================================
// BUILD EDITOR WIDGET STYLE (maps individual DB fields, settings & style → CSS)
// ============================================================
function buildEditorWidgetStyle(widget: PageWidget, viewportMode: string = 'desktop'): React.CSSProperties {
  return computeWidgetStyles(widget, viewportMode as any)
}

// ============================================================
// WIDGET PREVIEW
// ============================================================
function WidgetPreview({ widget, viewportMode = 'desktop' }: { widget: PageWidget; viewportMode?: string }) {
  const { type, content } = widget
  const es = buildEditorWidgetStyle(widget, viewportMode)
  const align = resolveResponsiveValue<string>(widget, 'text_align', viewportMode as any, (widget as any).settings?.text_align || (widget.content as any)?.align || (widget.content as any)?.text_align || (widget as any).style?.textAlign || 'left')

  switch (type) {
    case 'heading': {
      const Tag = ((content?.tag as string) || 'h2') as any
      return <Tag style={{ margin: 0, letterSpacing: '-0.03em', lineHeight: '1.1', width: '100%', ...es, textAlign: align as any }}>{content?.text as string || (typeof content === 'string' ? content : '') || 'Título'}</Tag>
    }
    case 'text':
      return <div style={{ color: '#6e6e73', lineHeight: '1.7', width: '100%', ...es, textAlign: align as any }} dangerouslySetInnerHTML={{ __html: (content?.text as string) || (content?.html as string) || (typeof content === 'string' ? content : '') || 'Texto aqui...' }} />
    case 'image': {
      const src = (content?.image as string) || (content?.url as string)
      const imgAlign = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
      const customWidth = resolveResponsiveValue(widget, 'width', viewportMode as any, (widget as any).settings?.width || content?.width || '')
      const customHeight = resolveResponsiveValue(widget, 'height', viewportMode as any, (widget as any).settings?.height || content?.height || '')
      const customMaxWidth = resolveResponsiveValue(widget, 'max_width', viewportMode as any, (widget as any).settings?.max_width || content?.max_width || '')
      const objectFit = resolveResponsiveValue(widget, 'object_fit', viewportMode as any, (widget as any).settings?.object_fit || content?.object_fit || 'cover')
      const objectPosition = resolveResponsiveValue(widget, 'object_position', viewportMode as any, (widget as any).settings?.object_position || content?.object_position || 'center center')
      const opacity = resolveResponsiveValue(widget, 'opacity', viewportMode as any, (widget as any).settings?.opacity ?? content?.opacity ?? 1)
      const borderRadius = resolveResponsiveValue(widget, 'border_radius', viewportMode as any, (widget as any).settings?.border_radius || '')
      const boxShadow = resolveResponsiveValue(widget, 'box_shadow', viewportMode as any, (widget as any).settings?.box_shadow || '')

      if (!src) return <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 12, textAlign: 'center', color: '#86868b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...es }}><ImageIcon size={18} /> Imagem</div>
      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: imgAlign }}>
          <img
            src={src}
            alt={content?.alt as string || ''}
            style={{
              ...es,
              width: customWidth || es.width || '100%',
              maxWidth: customMaxWidth || es.maxWidth || '100%',
              height: customHeight || es.height || 'auto',
              objectFit: (objectFit as any) || (es as any).objectFit || 'cover',
              objectPosition: (objectPosition as any) || (es as any).objectPosition || 'center center',
              opacity: opacity !== undefined && opacity !== '' ? Number(opacity) : 1,
              borderRadius: borderRadius || es.borderRadius || 12,
              boxShadow: boxShadow || es.boxShadow || undefined,
              display: 'block',
              transition: 'all 0.2s ease',
            }}
          />
        </div>
      )
    }
    case 'button': {
      const btnAlign = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
      const isJustify = align === 'justify' || content?.full_width || widget.width === '100%'
      const iconName = content?.icon as string | undefined
      const iconPos = (content?.icon_position as string) || 'before'
      const iconSpacing = Number(content?.icon_spacing) || 8
      const iconSize = Number(content?.icon_size) || 16

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
          <button
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
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              ...es,
              width: isJustify ? '100%' : (es.width || 'auto'),
            }}
          >
            {iconPos === 'before' && renderIcon(iconName)}
            <span>{content?.label as string || content?.text as string || 'Botão'}</span>
            {iconPos === 'after' && renderIcon(iconName)}
          </button>
        </div>
      )
    }
    case 'spacer':
      return <div style={{ height: Number(content?.height) || 50, ...es }} />
    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #e8e8ed', ...es }} />
    case 'googleMaps':
      return <div style={{ height: 260, background: '#e8e8ed', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', gap: 8, ...es }}><MapPin size={20} /> Mapa Interativo (Google Maps)</div>
    case 'iconBox':
      return <div style={{ padding: 24, border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', ...es }}>
        <CheckSquare size={24} style={{ color: '#1d1d1f', marginBottom: 8 }} />
        <h4 style={{ margin: '0 0 4px', color: '#1d1d1f' }}>Título do Destaque</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6e6e73' }}>Descrição detalhada do recurso em destaque.</p>
      </div>
    case 'imageBox':
      return <div style={{ padding: 24, border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', ...es }}>
        <div style={{ height: 120, background: '#f5f5f7', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}><ImageIcon size={24} /></div>
        <h4 style={{ margin: '0 0 4px', color: '#1d1d1f' }}>Caixa de Imagem</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6e6e73' }}>Legenda ou descrição da imagem.</p>
      </div>
    case 'starRating':
      return <div style={{ display: 'flex', gap: 4, color: '#f59e0b', alignItems: 'center', ...es }}>
        {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#f59e0b" />)}
        <span style={{ fontSize: '0.85rem', color: '#86868b', marginLeft: 6 }}>5.0 (128 avaliações)</span>
      </div>
    case 'animatedHeadline':
      return <h2 style={{ margin: 0, color: '#1d1d1f', fontSize: '1.8rem', fontWeight: 700, ...es }}>
        Inovação <span style={{ color: '#00cc6a', borderBottom: '2px solid #00cc6a' }}>Extraordinária</span>
      </h2>
    case 'flipBox':
      return <div style={{ padding: 24, background: '#f5f5f7', border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', cursor: 'pointer', ...es }}>
        <Box size={24} style={{ color: '#00cc6a', marginBottom: 8 }} />
        <h4 style={{ margin: '0 0 4px', color: '#1d1d1f' }}>Frente do Card (Passe o mouse)</h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#86868b' }}>Efeito 3D Flip Box Interativo</p>
      </div>
    case 'priceTable':
      return <div style={{ padding: '32px 24px', background: '#fff', border: '2px solid #00ff88', borderRadius: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', ...es }}>
        <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#00ff88', fontWeight: 700 }}>Plano Profissional</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '12px 0', color: '#1d1d1f' }}>R$ 149<span style={{ fontSize: '0.9rem', color: '#86868b' }}>/mês</span></div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', fontSize: '0.85rem', color: '#6e6e73', lineHeight: 2 }}>
          <li>✓ Todas as Funcionalidades</li>
          <li>✓ Suporte Prioritário</li>
          <li>✓ Atualizações Vitalícias</li>
        </ul>
        <button style={{ width: '100%', padding: '12px 24px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Assinar Agora</button>
      </div>
    case 'priceList':
      return <div style={{ border: '1px solid #e8e8ed', borderRadius: 12, padding: 16, background: '#fff', ...es }}>
        {['Item 1 - Serviço Premium', 'Item 2 - Consultoria Avançada', 'Item 3 - Suporte Técnico'].map((it, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < 2 ? '1px dashed #e8e8ed' : 'none' }}>
            <span style={{ color: '#1d1d1f', fontSize: '0.9rem' }}>{it}</span>
            <span style={{ color: '#00cc6a', fontWeight: 700, fontSize: '0.9rem' }}>R$ 99,00</span>
          </div>
        ))}
      </div>
    case 'countdown':
      return <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: 20, background: '#1d1d1f', borderRadius: 12, color: '#fff', ...es }}>
        {[{ n: '02', l: 'Dias' }, { n: '14', l: 'Horas' }, { n: '35', l: 'Min' }, { n: '42', l: 'Seg' }].map((c, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: 50 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00ff88' }}>{c.n}</div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7 }}>{c.l}</div>
          </div>
        ))}
      </div>
    case 'counter':
      return <div style={{ textAlign: 'center', padding: 24, ...es }}>
        <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1d1d1f' }}>+10.000</div>
        <div style={{ fontSize: '1rem', color: '#86868b', textTransform: 'uppercase', fontWeight: 600 }}>Clientes Satisfeitos</div>
      </div>
    case 'progressBar':
      return <div style={{ width: '100%', ...es }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6, fontWeight: 600, color: '#1d1d1f' }}>
          <span>Progresso / Performance</span>
          <span>95%</span>
        </div>
        <div style={{ height: 10, background: '#e8e8ed', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: '95%', height: '100%', background: '#00ff88', borderRadius: 5 }} />
        </div>
      </div>
    case 'alert':
      return <div style={{ padding: 16, background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, color: '#b45309', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8, ...es }}>
        <AlertCircle size={18} /> <strong>Atenção:</strong> Mensagem informativa de alerta para os clientes.
      </div>
    case 'video':
      return <div style={{ aspectRatio: '16/9', background: '#f5f5f7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', gap: 8, ...es }}><Video size={20} /> Player de Vídeo</div>
    case 'cta':
      return <div style={{ background: '#1d1d1f', color: '#fff', padding: '60px 32px', textAlign: 'center', borderRadius: 24, ...es }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>{String(content.cta_title || 'Pronto para Transformar sua Experiência?')}</h2>
        <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{String(content.cta_text || 'Conheça nossa linha completa com condições exclusivas.')}</p>
        <button style={{ background: '#fff', color: '#1d1d1f', border: 'none', padding: '14px 28px', borderRadius: 980, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>{String(content.cta_button || 'Garantir Agora')}</button>
      </div>
    case 'banner':
      return <div style={{ background: content.image ? `url(${content.image}) center/cover` : '#f5f5f7', color: content.image ? '#fff' : '#1d1d1f', padding: '80px 32px', textAlign: 'center', borderRadius: 24, ...es }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'inherit' }}>{String(content.title || 'Super Oferta TEKNIX')}</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>{String(content.subtitle || 'Tecnologia de ponta ao seu alcance.')}</p>
      </div>
    case 'productGrid':
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, ...es }}>
        {[1,2,3].map(i => <div key={i} style={{ background: '#fff', border: '1px solid #e8e8ed', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ height: 120, background: '#f5f5f7' }} />
          <div style={{ padding: 16 }}><div style={{ fontWeight: 600, color: '#1d1d1f', marginBottom: 4, fontSize: '0.95rem' }}>Produto TEKNIX #{i}</div><div style={{ fontWeight: 700, color: '#1d1d1f' }}>R$ 299,90</div></div>
        </div>)}
      </div>
    case 'form':
      return <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 12, ...es }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1d1d1f' }}>Formulário de Contato</div>
        <input disabled placeholder="Seu Nome..." style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d2d2d7' }} />
        <input disabled placeholder="Seu E-mail..." style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d2d2d7' }} />
        <textarea disabled placeholder="Sua Mensagem..." rows={2} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d2d2d7' }} />
        <button style={{ padding: 12, background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Enviar</button>
      </div>
    case 'newsletter':
      return <div style={{ background: '#f5f5f7', padding: 48, borderRadius: 24, textAlign: 'center', ...es }}>
        <h4 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>Receba Novidades Exclusivas</h4>
        <p style={{ margin: '0 0 24px', color: '#6e6e73' }}>Fique por dentro dos lançamentos e ofertas exclusivas.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
          <input disabled placeholder="Seu melhor e-mail..." style={{ flex: 1, padding: '12px 16px', borderRadius: 980, border: '1px solid #d2d2d7', fontSize: '0.9rem' }} />
          <button style={{ padding: '12px 24px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 980, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Inscrever</button>
        </div>
      </div>
    case 'search':
      return <div style={{ display: 'flex', gap: 6, background: '#f5f5f7', border: '1px solid #e8e8ed', padding: 6, borderRadius: 8, ...es }}>
        <Search size={14} style={{ color: '#86868b', margin: 'auto 4px' }} />
        <input disabled placeholder="Buscar produtos na loja..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#1d1d1f', outline: 'none', fontSize: '0.85rem' }} />
      </div>
    case 'shareButtons':
      return <div style={{ display: 'flex', gap: 8, ...es }}>
        {['WhatsApp', 'Instagram', 'Facebook', 'Copiar Link'].map((s, i) => (
          <button key={i} style={{ padding: '6px 12px', background: '#f5f5f7', border: '1px solid #e8e8ed', borderRadius: 8, color: '#1d1d1f', fontSize: '0.75rem' }}>{s}</button>
        ))}
      </div>
    case 'tableOfContents':
      return <div style={{ padding: 16, background: '#f5f5f7', border: '1px solid #e8e8ed', borderRadius: 8, ...es }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d1d1f', marginBottom: 8 }}>Índice de Conteúdo</div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.85rem', color: '#6e6e73', lineHeight: 1.8 }}>
          <li>1. Visão Geral</li>
          <li>2. Especificações Técnicas</li>
          <li>3. Garantia e Entrega</li>
        </ul>
      </div>
    case 'icon':
      return <div style={{ textAlign: 'center', padding: 16, ...es }}><Star size={36} style={{ color: '#f59e0b' }} /></div>
    case 'features':
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, ...es }}>
        {['Performance', 'Segurança', 'Durabilidade'].map((f, i) => (
          <div key={i} style={{ padding: 20, background: '#f5f5f7', borderRadius: 12, textAlign: 'center' }}>
            <Star size={24} style={{ color: '#00cc6a', marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d1d1f' }}>{f}</div>
            <div style={{ fontSize: '0.8rem', color: '#86868b', marginTop: 4 }}>Descrição do recurso</div>
          </div>
        ))}
      </div>
    case 'specifications':
      return <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8ed', ...es }}>
        {[['Voltagem', '12V'], ['Potência', '550W'], ['Torque', '30 Nm'], ['Peso', '1.2 kg']].map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e8e8ed', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: '#1d1d1f', width: '40%' }}>{k}</span>
            <span style={{ color: '#6e6e73', width: '60%', textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>
    case 'gallery':
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, ...es }}>
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ aspectRatio: '1', background: '#e8e8ed', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}><ImageIcon size={18} /></div>)}
      </div>
    case 'carousel':
      return <div style={{ display: 'flex', overflowX: 'auto', gap: 16, scrollSnapType: 'x mandatory', paddingBottom: 8, ...es }}>
        {[1,2,3].map(i => <div key={i} style={{ minWidth: 320, height: 200, background: '#f5f5f7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', flexShrink: 0, scrollSnapAlign: 'start' }}><GalleryHorizontalEnd size={20} /> Slide {i}</div>)}
      </div>
    case 'mediaCarousel':
      return <div style={{ height: 200, background: '#f5f5f7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', gap: 8, border: '1px solid #e8e8ed', ...es }}><Film size={20} /> Carrossel de Mídia 3D</div>
    case 'videoPlaylist':
      return <div style={{ height: 200, background: '#1d1d1f', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', gap: 8, ...es }}><Film size={20} /> Playlist de Vídeo</div>
    case 'hotspot':
      return <div style={{ height: 200, background: '#f5f5f7', borderRadius: 12, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', border: '1px solid #e8e8ed', ...es }}>
        <ImageIcon size={24} />
        <div style={{ position: 'absolute', top: '30%', left: '40%', width: 20, height: 20, borderRadius: '50%', background: '#00cc6a', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        <div style={{ position: 'absolute', top: '60%', left: '65%', width: 20, height: 20, borderRadius: '50%', background: '#3b82f6', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </div>
    case 'lottie':
      return <div style={{ height: 120, background: '#f5f5f7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', gap: 8, border: '1px dashed #d2d2d7', ...es }}><Sparkles size={24} style={{ color: '#8b5cf6' }} /> Animação Lottie</div>
    case 'tabs':
      return <div style={{ ...es }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e8e8ed', marginBottom: 24 }}>
          {['Detalhes', 'Especificações', 'Avaliações'].map((t, i) => (
            <button key={i} style={{ padding: '12px 24px', border: 'none', background: i === 0 ? '#1d1d1f' : 'transparent', color: i === 0 ? '#fff' : '#6e6e73', fontWeight: 600, cursor: 'pointer', borderRadius: '8px 8px 0 0', fontSize: '0.85rem' }}>{t}</button>
          ))}
        </div>
        <div style={{ color: '#6e6e73', fontSize: '0.85rem', lineHeight: 1.6 }}>Conteúdo da aba selecionada...</div>
      </div>
    case 'accordion':
      return <div style={{ maxWidth: 720, ...es }}>
        {['Como funciona a garantia?', 'Qual o prazo de entrega?', 'Posso devolver?'].map((q, i) => (
          <div key={i} style={{ borderBottom: '1px solid #e8e8ed', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: '1.05rem' }}>{q}</span>
              <span style={{ color: '#86868b', fontSize: '1.2rem' }}>+</span>
            </div>
          </div>
        ))}
      </div>
    case 'toggle':
      return <div style={{ padding: '16px 0', borderBottom: '1px solid #e8e8ed', ...es }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <span style={{ fontWeight: 600, color: '#1d1d1f' }}>Opção de Alternância</span>
          <div style={{ width: 36, height: 20, borderRadius: 10, background: '#00cc6a', position: 'relative' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, right: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></div>
        </div>
      </div>
    case 'faq':
      return <div style={{ maxWidth: 720, ...es }}>
        {['Qual a voltagem?', 'Tem garantia?', 'Prazo de entrega?'].map((q, i) => (
          <div key={i} style={{ borderBottom: '1px solid #e8e8ed', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: '1.05rem' }}>{q}</span>
              <span style={{ color: '#86868b', fontSize: '1.2rem' }}>+</span>
            </div>
          </div>
        ))}
      </div>
    case 'testimonials':
      return <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8, ...es }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ minWidth: 280, background: '#f5f5f7', borderRadius: 18, padding: 28 }}>
            <p style={{ fontStyle: 'italic', color: '#1d1d1f', lineHeight: 1.6 }}>"Produto excelente, superou minhas expectativas!"</p>
            <p style={{ fontWeight: 600, marginTop: 12, color: '#6e6e73', fontSize: '0.9rem' }}>— Maria Silva</p>
          </div>
        ))}
      </div>
    case 'testimonialCarousel':
      return <div style={{ padding: 28, background: '#f5f5f7', borderRadius: 18, textAlign: 'center', position: 'relative', ...es }}>
        <Quote size={20} style={{ color: '#86868b', marginBottom: 8 }} />
        <p style={{ fontSize: '0.95rem', color: '#1d1d1f', lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic' }}>"Entrega rápida e embalagem impecável."</p>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#6e6e73' }}>— João Pedro</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#1d1d1f' : '#d2d2d7' }} />)}
        </div>
      </div>
    case 'reviews':
      return <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, ...es }}>
        <div style={{ display: 'flex', gap: 4, color: '#f59e0b', marginBottom: 8 }}>{[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#f59e0b" />)}<span style={{ fontSize: '0.8rem', color: '#86868b', marginLeft: 6 }}>5.0 (256)</span></div>
        <p style={{ fontSize: '0.85rem', color: '#6e6e73', margin: 0 }}>"Produto fantástico, recomendo!" — Carlos M.</p>
      </div>
    case 'comparison':
      return <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8ed', ...es }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#f5f5f7', fontWeight: 600, fontSize: '0.8rem' }}>
          {['Recurso', 'Modelo A', 'Modelo B'].map((h, i) => <div key={i} style={{ padding: '8px 12px', borderRight: i < 2 ? '1px solid #e8e8ed' : 'none', color: '#1d1d1f' }}>{h}</div>)}
        </div>
        {[['Potência', '550W', '450W'], ['Torque', '30 Nm', '25 Nm']].map(([f, a, b], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #e8e8ed', fontSize: '0.8rem' }}>
            <div style={{ padding: '8px 12px', fontWeight: 500, color: '#1d1d1f', borderRight: '1px solid #e8e8ed' }}>{f}</div>
            <div style={{ padding: '8px 12px', color: '#6e6e73', borderRight: '1px solid #e8e8ed' }}>{a}</div>
            <div style={{ padding: '8px 12px', color: '#6e6e73' }}>{b}</div>
          </div>
        ))}
      </div>
    case 'table':
      return <div style={{ overflowX: 'auto', ...es }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Produto', 'Preço', 'Estoque'].map((h, i) => <th key={i} style={{ borderBottom: '2px solid #e8e8ed', padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[['Furadeira 12V', 'R$ 299', '45'], ['Parafusadeira', 'R$ 199', '32']].map(([a, b, c], i) => (
              <tr key={i}>
                <td style={{ borderBottom: '1px solid #e8e8ed', padding: '12px 16px', color: '#1d1d1f' }}>{a}</td>
                <td style={{ borderBottom: '1px solid #e8e8ed', padding: '12px 16px', color: '#6e6e73' }}>{b}</td>
                <td style={{ borderBottom: '1px solid #e8e8ed', padding: '12px 16px', color: '#6e6e73' }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    case 'list':
      return <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8, color: '#6e6e73', lineHeight: 1.7, ...es }}>
        <li>Bateria de longa duração</li>
        <li>Motor brushless de alta eficiência</li>
        <li>LED integrado para áreas escuras</li>
        <li>Maleta de transporte incluída</li>
      </ul>
    case 'quote':
      return <blockquote style={{ borderLeft: '3px solid #d2d2d7', margin: 0, padding: '20px 28px', background: '#f5f5f7', borderRadius: '0 12px 12px 0', fontStyle: 'italic', color: '#1d1d1f', lineHeight: 1.7, ...es }}>
        <p style={{ margin: '0 0 8px' }}>"A inovação distingue um líder de um seguidor."</p>
        <cite style={{ fontSize: '0.9rem', color: '#6e6e73', fontStyle: 'normal', fontWeight: 600 }}>— Steve Jobs</cite>
      </blockquote>
    case 'steps':
      return <div style={{ display: 'flex', flexDirection: 'column', gap: 24, ...es }}>
        {[{n: '1', t: 'Escolha o Produto', d: 'Navegue pelo catálogo'}, {n: '2', t: 'Adicione ao Carrinho', d: 'Selecione quantidade'}, {n: '3', t: 'Finalize a Compra', d: 'Pagamento seguro'}].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1d1d1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{s.n}</div>
            <div><div style={{ fontWeight: 600, color: '#1d1d1f' }}>{s.t}</div><div style={{ fontSize: '0.85rem', color: '#6e6e73' }}>{s.d}</div></div>
          </div>
        ))}
      </div>
    case 'product':
      return <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...es }}>
        <div style={{ background: '#f5f5f7', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} style={{ color: '#86868b' }} /></div>
        <div style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>Produto TEKNIX</div>
          <div style={{ fontWeight: 700, color: '#1d1d1f' }}>R$ 299,90</div>
          <div style={{ fontSize: '0.8rem', color: '#86868b', marginTop: 4 }}>SKU: TKN-001</div>
        </div>
      </div>
    case 'productHero':
      return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', ...es }}>
        <div style={{ background: '#f5f5f7', aspectRatio: '1', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Award size={40} style={{ color: '#86868b' }} /></div>
        <div>
          <div style={{ color: '#6e6e73', fontSize: 14, marginBottom: 8 }}>SKU: TKN-001</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: 16 }}>Produto Premium</h1>
          <div style={{ fontWeight: 700, fontSize: '2rem', color: '#1d1d1f', marginBottom: 24 }}>R$ 499,90</div>
          <div style={{ color: '#6e6e73', lineHeight: 1.7 }}>Descrição do produto em destaque com especificações detalhadas.</div>
        </div>
      </div>
    case 'categories':
      return <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', ...es }}>
        {['Furadeiras', 'Serras', 'Lixadeiras', 'Acessórios'].map((c, i) => (
          <div key={i} style={{ padding: 20, background: '#f5f5f7', borderRadius: 18, minWidth: 140, textAlign: 'center', fontWeight: 600, color: '#1d1d1f', cursor: 'pointer' }}>
            <Server size={24} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: '0.85rem' }}>{c}</div>
          </div>
        ))}
      </div>
    case 'price':
      return <div style={{ ...es }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>R$ 299,90</span>
        <span style={{ fontSize: '0.9rem', color: '#86868b', fontWeight: 400, marginLeft: 8 }}>à vista</span>
      </div>
    case 'buyButton':
      return <button style={{ background: '#1d1d1f', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: 980, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease', ...es }}>Comprar Agora</button>
    case 'relatedProducts':
      return <div style={{ ...es }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1d1d1f', marginBottom: 20 }}>Produtos Relacionados</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ height: 120, background: '#f5f5f7' }} />
            <div style={{ padding: 12 }}><div style={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem' }}>Produto #{i}</div><div style={{ fontWeight: 700, color: '#1d1d1f' }}>R$ 199</div></div>
          </div>)}
        </div>
      </div>
    case 'menu':
      return <nav style={{ display: 'flex', gap: 24, padding: '12px 0', borderBottom: '1px solid #e8e8ed', ...es }}>
        {['Home', 'Produtos', 'Categorias', 'Sobre', 'Contato'].map((m, i) => (
          <span key={i} style={{ fontSize: '0.9rem', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#1d1d1f' : '#86868b', cursor: 'pointer' }}>{m}</span>
        ))}
      </nav>
    case 'breadcrumb':
      return <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#86868b', ...es }}>
        <span style={{ color: '#00cc6a', cursor: 'pointer' }}>Home</span> <ChevronRight size={12} /> <span style={{ color: '#00cc6a', cursor: 'pointer' }}>Ferramentas</span> <ChevronRight size={12} /> <span style={{ color: '#1d1d1f' }}>Furadeiras</span>
      </div>
    case 'login':
      return <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 12, maxWidth: 320, margin: '0 auto', ...es }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', textAlign: 'center', color: '#1d1d1f' }}>Entrar na sua conta</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input disabled placeholder="E-mail" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d2d2d7' }} />
          <input disabled placeholder="Senha" type="password" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d2d2d7' }} />
          <button style={{ padding: 12, background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Entrar</button>
        </div>
      </div>
    case 'html':
      return <div style={{ padding: 24, background: '#1d1d1f', borderRadius: 12, fontFamily: 'monospace', fontSize: '0.85rem', color: '#f5f5f7', lineHeight: 1.8, ...es }} dangerouslySetInnerHTML={{ __html: (content.html_code as string) || '<div>HTML Customizado</div>' }} />
    case 'embed':
      return <div style={{ ...es }} dangerouslySetInnerHTML={{ __html: (content.html_code as string) || '<p>Embed</p>' }} />
    case 'code':
      return <pre style={{ background: '#1d1d1f', color: '#f5f5f7', padding: 24, borderRadius: 12, overflow: 'auto', ...es }}>
        <code>{(content.html_code as string) || ''}</code>
      </pre>
    case 'imageText':
      return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', ...es }}>
        <div>
          {Boolean(content.image) && <img src={content.image as string} alt="" style={{ width: '100%', borderRadius: 18 }} />}
        </div>
        <div>
          {Boolean(content.title) && <h2 style={{ margin: '0 0 16px', fontSize: '2rem', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em' }}>{String(content.title)}</h2>}
          {Boolean(content.text) && <div style={{ color: '#6e6e73', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content.text as string }} />}
        </div>
      </div>
    // ── ELEMENTOR PRO WIDGETS ──
    case 'containerPro':
      return <div style={{ padding: 12, border: '2px dashed #d2d2d7', borderRadius: 8, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: '0.8rem' }}><LayoutDashboard size={18} style={{ marginRight: 6 }} /> Container Pro (arraste widgets aqui)</div>
    case 'nestedCarousel':
      return <div style={{ display: 'flex', gap: 8, overflow: 'hidden', borderRadius: 8 }}>{[1,2,3].map(i => <div key={i} style={{ minWidth: '55%', height: 120, background: '#f5f5f7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', flexShrink: 0, border: '1px solid #e8e8ed' }}><GalleryHorizontalEnd size={16} /> Slide {i}</div>)}</div>
    case 'loopGrid':
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>{[1,2,3].map(i => <div key={i} style={{ background: '#f5f5f7', borderRadius: 6, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', border: '1px solid #e8e8ed' }}><LayoutGrid size={14} /> Post {i}</div>)}</div>
    case 'navMenu':
      return <nav style={{ display: 'flex', gap: 20, padding: '12px 0', borderBottom: '1px solid #e8e8ed' }}>{['Home', 'Produtos', 'Blog', 'Contato'].map((m, i) => <span key={i} style={{ fontSize: '0.85rem', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#1d1d1f' : '#86868b' }}>{m}</span>)}</nav>
    case 'megaMenu':
      return <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}><div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: '#1d1d1f' }}>Mega Menu</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>{['Categoria A', 'Categoria B', 'Categoria C'].map((c, i) => <div key={i} style={{ fontSize: '0.75rem', color: '#6e6e73' }}>{c}<div style={{ marginTop: 4, color: '#86868b' }}>Item 1<br/>Item 2<br/>Item 3</div></div>)}</div></div>
    case 'breadcrumbsPro':
      return <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#86868b' }}><span style={{ color: '#00cc6a' }}>Home</span> <ChevronRight size={10} /> <span style={{ color: '#00cc6a' }}>Categoria</span> <ChevronRight size={10} /> <span style={{ color: '#1d1d1f' }}>Página Atual</span></div>
    case 'posts':
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>{[1,2,3].map(i => <div key={i} style={{ background: '#f5f5f7', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8e8ed' }}><div style={{ height: 80, background: '#e8e8ed' }} /><div style={{ padding: 8 }}><div style={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem' }}>Post Title {i}</div><div style={{ fontSize: '0.7rem', color: '#86868b', marginTop: 2 }}>Excerpt do post...</div></div></div>)}</div>
    case 'portfolio':
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>{[1,2,3].map(i => <div key={i} style={{ height: 120, background: '#e8e8ed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}><LayoutGrid size={16} /> Projeto {i}</div>)}</div>
    case 'slides':
      return <div style={{ height: 160, background: '#1d1d1f', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative' }}><div style={{ textAlign: 'center' }}><h2 style={{ margin: 0, fontSize: '1.5rem' }}>Slide Principal</h2><p style={{ margin: '4px 0 12px', opacity: 0.7, fontSize: '0.85rem' }}>Descrição do slide</p><button style={{ padding: '6px 16px', background: '#00cc6a', border: 'none', borderRadius: 6, fontWeight: 600, color: '#000', fontSize: '0.8rem' }}>Saiba Mais</button></div><div style={{ position: 'absolute', bottom: 10, display: 'flex', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#555' }} /><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#555' }} /></div></div>
    case 'imageGalleryPro':
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>{[1,2,3,4,5,6].map(i => <div key={i} style={{ aspectRatio: '1', background: '#e8e8ed', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}><ImageIcon size={14} /></div>)}</div>
    case 'siteLogo':
      return <div style={{ padding: 8 }}><div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1d1d1f' }}>TEKNIX</div></div>
    case 'siteTitle':
      return <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1d1d1f' }}>Minha Loja TEKNIX</div>
    case 'pageTitle':
      return <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1d1d1f' }}>Título da Página</h1>
    case 'postTitle':
      return <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1d1d1f' }}>Título do Artigo</h1>
    case 'postContent':
      return <div style={{ color: '#6e6e73', fontSize: '0.9rem', lineHeight: 1.7 }}><p>Conteúdo completo do post será renderizado aqui automaticamente...</p></div>
    case 'postExcerpt':
      return <p style={{ color: '#6e6e73', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>Resumo do artigo com até 55 palavras, puxado automaticamente do conteúdo do post...</p>
    case 'featuredImage':
      return <div style={{ height: 160, background: '#e8e8ed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}><ImageIcon size={24} /> Imagem Destaque</div>
    case 'postInfo':
      return <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: '#86868b' }}><span>26 Ago 2026</span><span>Admin</span><span>5 comentários</span></div>
    case 'postNavigation':
      return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #e8e8ed', borderBottom: '1px solid #e8e8ed', fontSize: '0.85rem' }}><span style={{ color: '#86868b' }}>Post Anterior</span><span style={{ color: '#86868b' }}>Próximo Post</span></div>
    case 'authorBox':
      return <div style={{ display: 'flex', gap: 16, padding: 16, background: '#f5f5f7', borderRadius: 12, alignItems: 'center' }}><div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8e8ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} style={{ color: '#86868b' }} /></div><div><div style={{ fontWeight: 600, color: '#1d1d1f' }}>Autor do Post</div><div style={{ fontSize: '0.8rem', color: '#86868b' }}>Bio do autor aparece aqui...</div></div></div>
    case 'searchForm':
      return <div style={{ display: 'flex', gap: 6, background: '#f5f5f7', border: '1px solid #e8e8ed', padding: 6, borderRadius: 8 }}><Search size={14} style={{ color: '#86868b', margin: 'auto 4px' }} /><input disabled placeholder="Buscar..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#1d1d1f', outline: 'none', fontSize: '0.85rem' }} /><button style={{ padding: '6px 14px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem' }}>Buscar</button></div>
    case 'formPro':
      return <div style={{ padding: 16, background: '#f5f5f7', border: '1px solid #e8e8ed', borderRadius: 8 }}><div style={{ fontWeight: 600, marginBottom: 10, color: '#1d1d1f', fontSize: '0.9rem' }}>Formulário Pro</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><input disabled placeholder="Nome completo" style={{ padding: 8, borderRadius: 4, border: '1px solid #d2d2d7' }} /><input disabled placeholder="E-mail" style={{ padding: 8, borderRadius: 4, border: '1px solid #d2d2d7' }} /><input disabled placeholder="Telefone" style={{ padding: 8, borderRadius: 4, border: '1px solid #d2d2d7' }} /><textarea disabled placeholder="Mensagem" rows={2} style={{ padding: 8, borderRadius: 4, border: '1px solid #d2d2d7' }} /><button style={{ padding: 8, background: '#00cc6a', border: 'none', borderRadius: 4, fontWeight: 600 }}>Enviar</button></div></div>
    case 'loginPro':
      return <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 12, maxWidth: 300 }}><h3 style={{ margin: '0 0 14px', fontSize: '1rem', textAlign: 'center', color: '#1d1d1f' }}>Login Pro</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><input disabled placeholder="E-mail" style={{ padding: 8, borderRadius: 6, border: '1px solid #d2d2d7' }} /><input disabled placeholder="Senha" type="password" style={{ padding: 8, borderRadius: 6, border: '1px solid #d2d2d7' }} /><label style={{ fontSize: '0.75rem', color: '#6e6e73' }}><input type="checkbox" disabled /> Lembrar-me</label><button style={{ padding: 8, background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>Entrar</button><div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#00cc6a' }}>Criar conta</div></div></div>
    case 'socialIcons':
      return <div style={{ display: 'flex', gap: 10 }}>{['Instagram', 'WhatsApp', 'YouTube'].map((s, i) => <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: '#1d1d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' }}>{s[0]}</div>)}</div>
    case 'shareButtonsPro':
      return <div style={{ display: 'flex', gap: 6 }}>{['WhatsApp', 'Facebook', 'Twitter', 'Copiar'].map((s, i) => <button key={i} style={{ padding: '5px 10px', background: '#f5f5f7', border: '1px solid #e8e8ed', borderRadius: 4, fontSize: '0.7rem', color: '#1d1d1f' }}>{s}</button>)}</div>
    case 'mediaCarouselPro':
      return <div style={{ display: 'flex', gap: 8, overflow: 'hidden', borderRadius: 8 }}>{[1,2,3].map(i => <div key={i} style={{ minWidth: '50%', height: 120, background: '#f5f5f7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', flexShrink: 0, border: '1px solid #e8e8ed' }}><Film size={16} /> Mídia {i}</div>)}</div>
    case 'testimonialCarouselPro':
      return <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 12, textAlign: 'center' }}><p style={{ fontStyle: 'italic', color: '#1d1d1f', fontSize: '0.9rem', margin: '0 0 8px' }}>"Excelente produto!"</p><div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Cliente Pro</div><div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>{[1,2,3].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === 1 ? '#1d1d1f' : '#d2d2d7' }} />)}</div></div>
    case 'postsCarousel':
      return <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>{[1,2,3].map(i => <div key={i} style={{ minWidth: '45%', background: '#f5f5f7', borderRadius: 8, padding: 10, border: '1px solid #e8e8ed', flexShrink: 0 }}><div style={{ height: 60, background: '#e8e8ed', borderRadius: 4, marginBottom: 6 }} /><div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1d1d1f' }}>Post {i}</div></div>)}</div>
    case 'paypalButton':
      return <button style={{ padding: '8px 20px', background: '#ffc439', border: 'none', borderRadius: 6, fontWeight: 700, color: '#003087', fontSize: '0.85rem' }}>PayPal</button>
    case 'stripeButton':
      return <button style={{ padding: '8px 20px', background: '#635bff', border: 'none', borderRadius: 6, fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>Pagar com Stripe</button>
    case 'offCanvas':
      return <div style={{ padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#6e6e73' }}><AppWindow size={16} /> Off Canvas Panel (menu lateral)</div>
    case 'sticky':
      return <div style={{ padding: 8, background: '#e8e8ed', borderRadius: 4, fontSize: '0.75rem', color: '#6e6e73', textAlign: 'center' }}>Elemento Fixo (Sticky)</div>
    case 'progressTracker':
      return <div style={{ width: '100%' }}><div style={{ height: 6, background: '#e8e8ed', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: '65%', height: '100%', background: '#0071e3', borderRadius: 3 }} /></div><div style={{ fontSize: '0.7rem', color: '#86868b', marginTop: 4, textAlign: 'center' }}>65% lido</div></div>
    case 'pageTransitions':
      return <div style={{ padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed', textAlign: 'center', color: '#6e6e73', fontSize: '0.8rem' }}><RefreshCw size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Transição de Página (fade)</div>
    case 'customCodePro':
      return <div style={{ padding: 12, background: '#1d1d1f', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.75rem', color: '#00ff88' }}>{'<!-- Custom Code Pro -->'}</div>
    case 'customCssPro':
      return <div style={{ padding: 12, background: '#1d1d1f', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.75rem', color: '#c084fc' }}>{'.custom-class { color: red; }'}</div>
    case 'displayConditions':
      return <div style={{ padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed', fontSize: '0.8rem', color: '#6e6e73' }}><Eye size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Condição: Se logado → mostrar</div>
    case 'floatingButtons':
      return <div style={{ position: 'relative', padding: 20, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}><div style={{ position: 'absolute', bottom: 10, right: 10, width: 36, height: 36, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><MessageSquare size={16} /></div></div>
    case 'linkInBio':
      return <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 12, textAlign: 'center' }}><div style={{ fontWeight: 700, marginBottom: 8, color: '#1d1d1f' }}>linktr.ee/teknix</div><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{['Meu Site', 'Instagram', 'WhatsApp'].map((l, i) => <div key={i} style={{ padding: '6px 12px', background: '#1d1d1f', color: '#fff', borderRadius: 6, fontSize: '0.8rem' }}>{l}</div>)}</div></div>
    case 'tableOfContentsPro':
      return <div style={{ padding: 12, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}><div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 6, color: '#1d1d1f' }}>Índice</div><ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.75rem', color: '#6e6e73', lineHeight: 1.8 }}><li>Seção 1</li><li>Seção 2</li><li>Seção 3</li></ul></div>
    case 'codeHighlightPro':
      return <pre style={{ padding: 12, background: '#1d1d1f', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.75rem', color: '#e8e8ed', margin: 0, overflow: 'auto' }}>{'const x = 42;\nconsole.log(x);'}</pre>
    case 'lottiePro':
      return <div style={{ height: 100, background: '#f5f5f7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', border: '1px dashed #d2d2d7' }}><Sparkles size={20} style={{ color: '#8b5cf6' }} /> Lottie Pro</div>
    case 'googleMapsPro':
      return <div style={{ height: 140, background: '#e8e8ed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', gap: 6 }}><MapPin size={18} /> Mapa Pro (raio + marcadores)</div>
    case 'countdownPro':
      return <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 10, background: '#f5f5f7', borderRadius: 8, border: '1px solid #e8e8ed' }}>{[{ n: '05', l: 'Dias' }, { n: '12', l: 'Horas' }, { n: '30', l: 'Min' }, { n: '15', l: 'Seg' }].map((c, i) => <div key={i} style={{ textAlign: 'center', minWidth: 40 }}><div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d1d1f' }}>{c.n}</div><div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: '#86868b' }}>{c.l}</div></div>)}</div>
    case 'ctaPro':
      return <div style={{ background: '#1d1d1f', color: '#fff', padding: '30px 20px', textAlign: 'center', borderRadius: 10 }}><h2 style={{ margin: '0 0 6px', fontSize: '1.3rem' }}>Call to Action Pro</h2><p style={{ margin: '0 0 12px', opacity: 0.7, fontSize: '0.85rem' }}>Descrição do CTA</p><button style={{ background: '#00cc6a', color: '#000', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem' }}>Ação Agora</button></div>
    case 'flipBoxPro':
      return <div style={{ padding: 20, background: '#f5f5f7', border: '1px solid #e8e8ed', borderRadius: 8, textAlign: 'center' }}><Box size={22} style={{ color: '#00cc6a', marginBottom: 6 }} /><h4 style={{ margin: '0 0 4px', color: '#1d1d1f', fontSize: '0.9rem' }}>Flip Box Pro</h4><p style={{ margin: 0, fontSize: '0.75rem', color: '#86868b' }}>Passe o mouse para ver o verso</p></div>
    case 'priceTablePro':
      return <div style={{ padding: 16, background: '#f5f5f7', border: '2px solid #00cc6a', borderRadius: 10, textAlign: 'center' }}><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#00cc6a', fontWeight: 700 }}>Plano Pro</div><div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0', color: '#1d1d1f' }}>R$ 199<span style={{ fontSize: '0.7rem', color: '#86868b' }}>/mês</span></div><ul style={{ listStyle: 'none', padding: 0, margin: '10px 0', fontSize: '0.75rem', color: '#6e6e73', lineHeight: 1.8 }}><li>Tudo incluso</li><li>Suporte VIP</li></ul><button style={{ width: '100%', padding: '7px', background: '#00cc6a', border: 'none', borderRadius: 5, fontWeight: 700, color: '#000', fontSize: '0.8rem' }}>Assinar</button></div>
    case 'priceListPro':
      return <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10, background: '#fff' }}>{['Serviço Premium', 'Consultoria', 'Suporte'].map((it, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: idx < 2 ? '1px dashed #e8e8ed' : 'none', fontSize: '0.8rem' }}><span style={{ color: '#1d1d1f' }}>{it}</span><span style={{ color: '#00cc6a', fontWeight: 700 }}>R$ 99</span></div>)}</div>
    case 'animatedHeadlinePro':
      return <h2 style={{ margin: 0, color: '#1d1d1f', fontSize: '1.6rem', fontWeight: 700 }}>Promova <span style={{ color: '#00cc6a', borderBottom: '2px solid #00cc6a' }}>Produtos Incríveis</span></h2>
    case 'reviewsPro':
      return <div style={{ padding: 12, border: '1px solid #e8e8ed', borderRadius: 8 }}><div style={{ display: 'flex', gap: 3, color: '#f59e0b', marginBottom: 6 }}>{[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#f59e0b" />)}<span style={{ fontSize: '0.75rem', color: '#86868b', marginLeft: 4 }}>5.0 (128)</span></div><p style={{ fontSize: '0.8rem', color: '#6e6e73', margin: 0 }}>"Produto incrível!" — Cliente Pro</p></div>
    case 'shareButtonsEl':
      return <div style={{ display: 'flex', gap: 6 }}>{['FB', 'TW', 'WA', 'LI'].map((s, i) => <div key={i} style={{ width: 30, height: 30, borderRadius: 6, background: '#1d1d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem' }}>{s}</div>)}</div>
    case 'subscribe':
      return <div style={{ padding: 14, background: '#f5f5f7', borderRadius: 8, textAlign: 'center' }}><Mail size={20} style={{ color: '#00cc6a', marginBottom: 4 }} /><div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Inscreva-se</div><div style={{ display: 'flex', gap: 4 }}><input disabled placeholder="E-mail" style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #d2d2d7', fontSize: '0.8rem' }} /><button style={{ padding: '6px 12px', background: '#00cc6a', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: '0.8rem' }}>OK</button></div></div>
    case 'paypal':
      return <button style={{ padding: '8px 20px', background: '#ffc439', border: 'none', borderRadius: 6, fontWeight: 700, color: '#003087', fontSize: '0.85rem' }}>PayPal Checkout</button>
    case 'stripe':
      return <button style={{ padding: '8px 20px', background: '#635bff', border: 'none', borderRadius: 6, fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>Stripe Checkout</button>
    default:
      return <div style={{ padding: 16, background: '#f5f5f7', border: '1px dashed #d2d2d7', borderRadius: 8, color: '#86868b', fontSize: '0.85rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 60 }}>
        {getWidgetIcon(type, 18)} <span style={{ fontWeight: 500 }}>{type}</span>
      </div>
  }
}

// ============================================================
// WIDGET CATEGORY (Sidebar)
// ============================================================
function WidgetCategory({ label, widgets }: { label: string; widgets: typeof WIDGET_DEFINITIONS }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="widget-category">
      <button className="category-header" onClick={() => setOpen(!open)}>
        <ChevronRight size={11} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
        {label}
      </button>
      {open && (
        <div className="category-widgets">
          {widgets.map(w => (
            <div
              key={w.type}
              className="widget-item"
              draggable
              onDragStart={(e) => {
                const p: DragPayload = { kind: 'widget-new', widgetType: w.type }
                _dragPayload = p
                e.dataTransfer.setData('text/plain', JSON.stringify(p))
                e.dataTransfer.setData('application/json', JSON.stringify(p))
                e.dataTransfer.effectAllowed = 'copy'
              }}
            >
              {w.category === 'pro' && <span className="pro-badge">PRO</span>}
              <span className="widget-icon">{getWidgetIcon(w.type, 22)}</span>
              <span className="widget-label">{w.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
