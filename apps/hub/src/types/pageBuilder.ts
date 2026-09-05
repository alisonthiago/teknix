// ============================================================
// TEKNIX PAGE BUILDER — FULL TYPE SYSTEM
// ============================================================

// ============================================================
// THEME
// ============================================================
export interface Theme {
  id: string
  name: string
  slug: string
  is_default: boolean
  status: 'active' | 'archived'

  // Typography
  font_heading: string
  font_body: string
  font_button: string
  font_input: string
  font_accent: string
  font_scale: number

  // Colors
  color_primary: string
  color_secondary: string
  color_accent: string
  color_background: string
  color_surface: string
  color_text: string
  color_text_muted: string
  color_text_light: string
  color_border: string
  color_success: string
  color_warning: string
  color_error: string

  // Spacing
  spacing_xs: string
  spacing_sm: string
  spacing_md: string
  spacing_lg: string
  spacing_xl: string
  spacing_2xl: string
  spacing_3xl: string
  spacing_4xl: string

  // Border Radius
  radius_sm: string
  radius_md: string
  radius_lg: string
  radius_xl: string
  radius_full: string

  // Shadows
  shadow_sm: string
  shadow_md: string
  shadow_lg: string
  shadow_xl: string

  // Container
  container_width: string
  container_width_narrow: string
  container_width_wide: string
  container_padding: string

  // Buttons
  button_font_size: string
  button_font_weight: string
  button_padding_x: string
  button_padding_y: string
  button_radius: string
  button_bg: string
  button_color: string
  button_hover_bg: string
  button_hover_color: string

  // Headings
  h1_size: string
  h1_weight: string
  h1_line_height: string
  h2_size: string
  h2_weight: string
  h2_line_height: string
  h3_size: string
  h3_weight: string
  h3_line_height: string
  h4_size: string
  h4_weight: string
  h5_size: string
  h5_weight: string
  h6_size: string
  h6_weight: string

  // Body
  body_size: string
  body_line_height: string
  body_letter_spacing: string

  custom: Record<string, unknown>
  created_by?: string
  created_at: string
  updated_at: string
}

// ============================================================
// TEMPLATE
// ============================================================
export interface Template {
  id: string
  name: string
  slug: string
  type: string
  description: string
  thumbnail: string
  theme_id?: string
  schema: SectionSchema[]
  active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// ============================================================
// PAGE
// ============================================================
export interface PageSeoConfig {
  seo_title: string
  seo_description: string
  seo_image: string
  seo_slug: string
  seo_canonical: string
  seo_og: Record<string, unknown>
  seo_robots_index: boolean
  seo_robots_follow: boolean
  seo_twitter_card: 'summary' | 'summary_large_image'
  seo_twitter_title: string
  seo_twitter_description: string
  seo_twitter_image: string
  seo_schema: Record<string, unknown>
  seo_keywords: string[]
  seo_priority: number
}

export interface PageVisibilityConfig {
  visibility: 'active' | 'paused' | 'redirect'
  paused_behavior: '404' | '410' | 'redirect'
  redirect_url: string
  redirect_status: 301 | 302
  page_expires_at: string
  page_expires_redirect: string
}

export interface PageAnalyticsConfig {
  track_views: boolean
  track_clicks: boolean
  track_add_to_cart: boolean
  track_checkout: boolean
  track_search: boolean
  conversion_goals: Array<{ label: string; url_pattern: string }>
}

export interface Page {
  id: string
  type: string
  slug: string
  title: string
  status: 'draft' | 'published'
  is_landing_mode: boolean
  is_home?: boolean
  is_locked?: boolean
  hide_header?: boolean
  hide_footer?: boolean
  header_is_local_only?: boolean
  footer_is_local_only?: boolean
  header_model?: string
  footer_model?: string
  header_settings?: Record<string, unknown>
  footer_settings?: Record<string, unknown>
  theme_id?: string
  template_id?: string
  header_id?: string
  footer_id?: string
  menu: MenuItem[]
  seo_title: string
  seo_description: string
  seo_image: string
  seo_slug: string
  seo_canonical: string
  seo_og: Record<string, unknown>
  head_scripts: string
  body_scripts: string
  page_styles: Record<string, unknown>
  version: number
  created_by?: string
  created_at: string
  updated_at: string
  published_at?: string
  seo_robots_index?: boolean
  seo_robots_follow?: boolean
  seo_twitter_card?: 'summary' | 'summary_large_image'
  seo_twitter_title?: string
  seo_twitter_description?: string
  seo_twitter_image?: string
  seo_schema?: Record<string, unknown>
  seo_keywords?: string[]
  seo_priority?: number
  visibility?: 'active' | 'paused' | 'redirect'
  paused_behavior?: '404' | '410' | 'redirect'
  redirect_url?: string
  redirect_status?: 301 | 302
  page_expires_at?: string
  page_expires_redirect?: string
  track_views?: boolean
  track_clicks?: boolean
  track_add_to_cart?: boolean
  track_checkout?: boolean
  track_search?: boolean
  conversion_goals?: Array<{ label: string; url_pattern: string }>
  display_conditions?: Array<{
    id: string
    type: 'include' | 'exclude'
    target: 'entire_site' | 'archives' | 'singular'
    subTarget?: string
    specificId?: string
  }>
}

// ============================================================
// SECTION
// ============================================================
export interface PageSection {
  id: string
  page_id: string
  type: string
  order: number

  layout: string
  direction: string
  gap: string
  max_width: string
  min_height: string

  bg_type: string
  bg_color: string
  bg_image: string
  bg_video: string
  bg_gradient: string
  bg_position: string
  bg_size: string
  bg_repeat: string
  bg_attachment: string
  bg_overlay: string
  bg_opacity: number

  padding_top: string
  padding_bottom: string
  padding_left: string
  padding_right: string
  margin_top: string
  margin_bottom: string

  border_top: string
  border_bottom: string
  border_color: string
  border_radius: string
  box_shadow: string

  hide_on_desktop: boolean
  hide_on_tablet: boolean
  hide_on_mobile: boolean
  responsive: Record<string, Record<string, string>>

  animation_type: string
  animation_duration: string
  animation_delay: string
  animation_offset: string

  custom_css: string
  custom_class: string

  is_global?: boolean
  global_ref_id?: string

  containers?: PageContainer[]
  created_at: string
  updated_at: string
}

export interface TransformStyle {
  translate_x?: string
  translate_y?: string
  scale?: number
  rotate?: number
  skew_x?: number
  skew_y?: number
}

export interface EffectsStyle {
  opacity?: number
  blur?: string
  grayscale?: number
  brightness?: number
  contrast?: number
  transition?: string
}

export interface ElementStates {
  hover?: Record<string, any>
  focus?: Record<string, any>
  active?: Record<string, any>
}

// ============================================================
// CONTAINER
// ============================================================
export interface PageContainer {
  id: string
  section_id: string
  parent_container_id?: string
  type: string
  order: number

  display_type?: 'flex' | 'grid' | 'block'
  content_width?: 'boxed' | 'full'
  content_width_value?: string
  content_width_unit?: 'px' | '%' | 'vw'
  grid_columns?: string
  grid_rows?: string
  grid_gap?: string
  grid_auto_flow?: string

  direction: string
  gap: string
  align_items: string
  justify_content: string
  flex_wrap: string
  flex_grow: string
  flex_shrink: string

  width: string
  max_width: string
  min_height: string

  bg_type: string
  bg_color: string
  bg_image: string
  bg_gradient: string
  bg_overlay: string
  bg_opacity: number

  padding_top: string
  padding_bottom: string
  padding_left: string
  padding_right: string
  margin_top: string
  margin_bottom: string
  margin_left?: string
  margin_right?: string

  border: string
  border_color: string
  border_radius: string
  box_shadow: string

  transform?: TransformStyle
  effects?: EffectsStyle
  states?: ElementStates
  global_classes?: string[]

  hide_on_desktop: boolean
  hide_on_tablet: boolean
  hide_on_mobile: boolean
  responsive: Record<string, Record<string, string>>

  custom_css: string
  custom_class: string

  is_global?: boolean
  global_ref_id?: string

  children?: PageContainer[]
  widgets?: PageWidget[]
  created_at: string
  updated_at: string
}

// ============================================================
// WIDGET
// ============================================================
export interface PageWidget {
  id: string
  container_id: string
  type: string
  order: number

  content: WidgetContent

  // Style: Typography
  font_family: string
  font_size: string
  font_weight: string
  line_height: string
  letter_spacing: string
  text_transform: string
  text_align: string
  color: string

  // Style: Background
  bg_type: string
  bg_color: string
  bg_image: string
  bg_gradient: string
  bg_overlay: string
  bg_opacity: number

  // Style: Spacing
  padding_top: string
  padding_bottom: string
  padding_left: string
  padding_right: string
  margin_top: string
  margin_bottom: string
  margin_left: string
  margin_right: string

  // Style: Sizing
  width: string
  max_width: string
  min_width: string
  height: string
  min_height: string
  max_height: string

  // Style: Border
  border_style: string
  border_width: string
  border_color: string
  border_radius: string
  box_shadow: string

  // Style: Effects
  opacity: string
  filter_blur: string
  filter_brightness: string
  filter_contrast: string
  filter_saturation: string

  // Position
  position: string
  z_index: string
  overflow: string

  // Responsive
  hide_on_desktop: boolean
  hide_on_tablet: boolean
  hide_on_mobile: boolean
  responsive: Record<string, Record<string, string>>

  // Animation
  animation_type: string
  animation_duration: string
  animation_delay: string

  // Advanced
  custom_css: string
  custom_class: string
  html_id?: string
  aria_label?: string

  // Hover
  hover?: WidgetHover

  // Transform, Effects & States
  transform?: TransformStyle
  effects?: EffectsStyle
  states?: ElementStates
  global_classes?: string[]

  is_global?: boolean
  global_ref_id?: string

  created_at: string
  updated_at: string
}

// ============================================================
// WIDGET CONTENT (per-type content)
// ============================================================
export type WidgetContent = {
  // Heading
  text?: string
  tag?: string // h1-h6

  // Text / Rich Text
  html?: string
  rich_text?: string

  // Image
  image?: string
  alt?: string
  caption?: string
  link?: string
  lazy?: boolean

  // Video
  video_url?: string
  video_type?: 'youtube' | 'vimeo' | 'mp4' | 'embed'
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  poster?: string

  // Button
  label?: string
  button_link?: string
  button_variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
  button_size?: 'sm' | 'md' | 'lg'
  button_icon?: string
  button_icon_position?: 'left' | 'right'

  // Icon
  icon?: string
  icon_size?: string
  icon_color?: string

  // Spacer
  height?: string

  // Divider
  divider_width?: string
  divider_style?: string
  divider_color?: string

  // Product
  product_id?: string
  product_layout?: 'card' | 'hero' | 'inline'

  // Product Grid
  product_filter?: string
  product_limit?: number
  product_columns?: number

  // Categories
  categories?: string[]
  category_layout?: 'grid' | 'list' | 'carousel'

  // Banner
  banner_height?: string

  // CTA
  cta_title?: string
  cta_text?: string
  cta_button?: string
  cta_link?: string

  // FAQ
  faq_items?: FaqItem[]

  // Testimonials
  testimonials?: TestimonialItem[]

  // Specifications
  spec_items?: SpecItem[]

  // Gallery
  gallery_items?: GalleryItem[]

  // Carousel
  carousel_items?: CarouselItem[]

  // HTML/Embed
  html_code?: string

  // Form
  form_id?: string

  // List
  list_items?: ListItem[]

  // Table
  table_headers?: string[]
  table_rows?: string[][]

  // Quote
  quote_text?: string
  quote_author?: string

  [key: string]: unknown
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  open?: boolean
}

export interface TestimonialItem {
  id: string
  text: string
  author: string
  role?: string
  avatar?: string
  rating?: number
}

export interface SpecItem {
  id: string
  label: string
  value: string
  unit?: string
  icon?: string
}

export interface GalleryItem {
  id: string
  image: string
  alt?: string
  caption?: string
  link?: string
}

export interface CarouselItem {
  id: string
  image?: string
  title?: string
  subtitle?: string
  description?: string
  link?: string
  cta?: string
}

export interface ListItem {
  id: string
  icon?: string
  text?: string
  html?: string
}

export interface WidgetHover {
  color?: string
  bg_color?: string
  transform?: string
  shadow?: string
  transition?: string
  border_color?: string
}

// ============================================================
// SECTION SCHEMA (for templates)
// ============================================================
export interface SectionSchema {
  type: string
  settings?: Record<string, unknown>
  containers?: ContainerSchema[]
}

export interface ContainerSchema {
  settings?: Record<string, unknown>
  widgets?: WidgetSchema[]
}

export interface WidgetSchema {
  type: string
  content?: Record<string, unknown>
  settings?: Record<string, unknown>
}

// ============================================================
// GLOBAL COMPONENT
// ============================================================
export interface GlobalComponent {
  id: string
  name: string
  slug: string
  description: string
  thumbnail: string
  schema: SectionSchema
  created_by?: string
  created_at: string
  updated_at: string
}

// ============================================================
// MENU
// ============================================================
export interface MenuItem {
  id: string
  label: string
  link: string
  type: 'page' | 'category' | 'product' | 'url' | 'segment'
  target?: string
  icon?: string
  children?: MenuItem[]
}

export interface Menu {
  id: string
  name: string
  slug: string
  location: string
  is_global: boolean
  theme_id?: string
  items: MenuItem[]
  status: string
  created_at: string
  updated_at: string
}

// ============================================================
// HEADER / FOOTER
// ============================================================
export interface PageHeader {
  id: string
  name: string
  is_global: boolean
  theme_id?: string
  settings: Record<string, unknown>
  sections: unknown[]
  status: string
  created_at: string
  updated_at: string
}

export interface PageFooter {
  id: string
  name: string
  is_global: boolean
  theme_id?: string
  settings: Record<string, unknown>
  sections: unknown[]
  status: string
  created_at: string
  updated_at: string
}

// ============================================================
// CAMPAIGN
// ============================================================
export interface Campaign {
  id: string
  name: string
  slug: string
  status: 'draft' | 'active' | 'ended'
  start_date?: string
  end_date?: string
  theme_id?: string
  settings: Record<string, unknown>
  page_id?: string
  created_at: string
  updated_at: string
}

// ============================================================
// PUBLICATION
// ============================================================
export interface PagePublication {
  id: string
  page_id: string
  version: number
  snapshot: Record<string, unknown>
  published_by?: string
  published_at: string
  notes: string
}

// ============================================================
// MEDIA
// ============================================================
export interface MediaItem {
  id: string
  name: string
  file_url: string
  file_type: string
  file_size: number
  alt: string
  folder: string
  uploaded_by?: string
  created_at: string
  updated_at?: string
  width?: number
  height?: number
}

// ============================================================
// EDITOR STATE
// ============================================================
export type EditorTab = 'content' | 'style' | 'advanced'
export type ViewportMode = 'desktop' | 'tablet' | 'mobile'

export interface EditorState {
  page: Page | null
  sections: PageSection[]
  selectedSectionId: string | null
  selectedContainerId: string | null
  selectedWidgetId: string | null
  inspectorTab: EditorTab
  viewportMode: ViewportMode
  isDirty: boolean
  isPreviewing: boolean
  showNavigator: boolean
  showPageSettings: boolean
  history: HistoryEntry[]
  historyIndex: number
}

export interface HistoryEntry {
  type: string
  description: string
  snapshot: Record<string, unknown>
  timestamp: number
}

// ============================================================
// WIDGET DEFINITIONS (for sidebar)
// ============================================================
export interface WidgetDefinition {
  type: string
  label: string
  icon: string
  category: WidgetCategory
  description?: string
}

export type WidgetCategory =
  | 'basic'
  | 'pro'
  | 'general'
  | 'site'
  | 'commerce'
  | 'elementor-pro'

export const WIDGET_CATEGORIES: { key: WidgetCategory; label: string }[] = [
  { key: 'basic', label: 'Básico' },
  { key: 'pro', label: 'Pro' },
  { key: 'general', label: 'Geral' },
  { key: 'site', label: 'Site & Header/Footer' },
  { key: 'commerce', label: 'Loja TEKNIX / WooCommerce' },
  { key: 'elementor-pro', label: 'Elementor Pro (Desbloqueado)' },
]

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // ── BÁSICO (Elementor Core Basic) ──
  { type: 'heading', label: 'Título', icon: 'H', category: 'basic' },
  { type: 'text', label: 'Editor de Texto', icon: 'T', category: 'basic' },
  { type: 'image', label: 'Imagem', icon: 'IMG', category: 'basic' },
  { type: 'video', label: 'Vídeo', icon: '▶', category: 'basic' },
  { type: 'button', label: 'Botão', icon: '▣', category: 'basic' },
  { type: 'starRating', label: 'Avaliação Estrelas', icon: '★', category: 'basic' },
  { type: 'divider', label: 'Divisor', icon: '—', category: 'basic' },
  { type: 'spacer', label: 'Espaçador', icon: '↕', category: 'basic' },
  { type: 'googleMaps', label: 'Google Maps', icon: 'MAP', category: 'basic' },
  { type: 'icon', label: 'Ícone', icon: '✦', category: 'basic' },

  // ── PRO (Elementor Pro Core) ──
  { type: 'gallery', label: 'Galeria Pro', icon: 'GAL', category: 'pro' },
  { type: 'form', label: 'Formulário Pro', icon: '▭', category: 'pro' },
  { type: 'login', label: 'Login', icon: 'USR', category: 'pro' },
  { type: 'animatedHeadline', label: 'Título Animado', icon: '✎', category: 'pro' },
  { type: 'priceList', label: 'Lista de Preços', icon: '≡$', category: 'pro' },
  { type: 'priceTable', label: 'Tabela de Preços', icon: '$', category: 'pro' },
  { type: 'flipBox', label: 'Flip Box 3D', icon: '⇄', category: 'pro' },
  { type: 'cta', label: 'Call to Action', icon: '◉', category: 'pro' },
  { type: 'mediaCarousel', label: 'Carrossel de Mídia', icon: '❖', category: 'pro' },
  { type: 'entertainmentGallery', label: 'Endless Entertainment', icon: '▶', category: 'pro' },
  { type: 'testimonialCarousel', label: 'Carrossel Depoimentos', icon: '❝', category: 'pro' },
  { type: 'reviews', label: 'Avaliações / Reviews', icon: '★', category: 'pro' },
  { type: 'tableOfContents', label: 'Índice de Conteúdo', icon: '≣', category: 'pro' },
  { type: 'countdown', label: 'Contador Regressivo', icon: '00:00', category: 'pro' },
  { type: 'shareButtons', label: 'Compartilhar', icon: '⇪', category: 'pro' },
  { type: 'quote', label: 'Citação em Bloco', icon: '❝', category: 'pro' },
  { type: 'lottie', label: 'Lottie Animação', icon: '✦', category: 'pro' },
  { type: 'code', label: 'Code Highlight', icon: '{ }', category: 'pro' },
  { type: 'videoPlaylist', label: 'Playlist de Vídeo', icon: '▶▶', category: 'pro' },
  { type: 'hotspot', label: 'Hotspot Interativo', icon: '⊕', category: 'pro' },

  // ── GERAL (Elementor General) ──
  { type: 'imageBox', label: 'Caixa de Imagem', icon: 'IMG', category: 'general' },
  { type: 'iconBox', label: 'Caixa de Ícone', icon: '◫', category: 'general' },
  { type: 'carousel', label: 'Carrossel de Imagens', icon: 'CAR', category: 'general' },
  { type: 'list', label: 'Lista de Ícones', icon: '•', category: 'general' },
  { type: 'counter', label: 'Contador', icon: '123', category: 'general' },
  { type: 'progressBar', label: 'Barra de Progresso', icon: '▰▰', category: 'general' },
  { type: 'testimonials', label: 'Depoimento', icon: '❝', category: 'general' },
  { type: 'tabs', label: 'Abas / Tabs', icon: '☰', category: 'general' },
  { type: 'accordion', label: 'Acordeão', icon: '≡', category: 'general' },
  { type: 'toggle', label: 'Alternador / Toggle', icon: '◎', category: 'general' },
  { type: 'alert', label: 'Alerta / Aviso', icon: '!', category: 'general' },
  { type: 'features', label: 'Recursos / Features', icon: '★', category: 'general' },
  { type: 'specifications', label: 'Especificações', icon: '☰', category: 'general' },
  { type: 'comparison', label: 'Comparação', icon: 'VS', category: 'general' },
  { type: 'table', label: 'Tabela Comparativa', icon: '▦', category: 'general' },
  { type: 'steps', label: 'Passos / Steps', icon: '1-2', category: 'general' },
  { type: 'html', label: 'HTML Customizado', icon: '<>', category: 'general' },
  { type: 'embed', label: 'Embed de Mídia', icon: '⧉', category: 'general' },

  // ── SITE & NAVEGAÇÃO ──
  { type: 'chapterNav', label: 'Modelos / Categorias', icon: '', category: 'site' },
  { type: 'menu', label: 'Menu de Navegação', icon: '≡', category: 'site' },
  { type: 'breadcrumb', label: 'Breadcrumb (Trilha)', icon: '›', category: 'site' },
  { type: 'search', label: 'Busca ao Vivo', icon: 'SRC', category: 'site' },
  { type: 'banner', label: 'Banner Promocional', icon: '▬', category: 'site' },
  { type: 'newsletter', label: 'Newsletter / Leads', icon: '@', category: 'site' },

  // ── LOJA TEKNIX / WOOCOMMERCE ──
  { type: 'product', label: 'Card de Produto', icon: '▣', category: 'commerce' },
  { type: 'productHero', label: 'Produto Destaque Hero', icon: '★', category: 'commerce' },
  { type: 'productGrid', label: 'Grade de Produtos', icon: '⊞', category: 'commerce' },
  { type: 'categories', label: 'Grade de Categorias', icon: '▦', category: 'commerce' },
  { type: 'price', label: 'Preço Dinâmico', icon: '$', category: 'commerce' },
  { type: 'buyButton', label: 'Botão Comprar / Checkout', icon: 'BUY', category: 'commerce' },
  { type: 'relatedProducts', label: 'Produtos Relacionados', icon: '↻', category: 'commerce' },
  { type: 'productLineupGallery', label: 'Carrossel Produtos', icon: '◈', category: 'commerce' },
  { type: 'cards', label: 'Cards (Diferenciais)', icon: '🂠', category: 'commerce' },
  { type: 'carrossel', label: 'Carrossel Ofertas', icon: '◈', category: 'commerce' },
  { type: 'featureCardsGallery', label: 'Carrossel Destaques', icon: '▦', category: 'commerce' },
  { type: 'appleImageAccordion', label: 'FAQ com Imagem', icon: '≡', category: 'general' },

  // ── ELEMENTOR PRO (Desbloqueado — 70+ widgets) ──
  // Layout & Structure
  { type: 'containerPro', label: 'Container Pro', icon: '▢', category: 'elementor-pro' },
  { type: 'nestedCarousel', label: 'Carrossel Aninhado', icon: '◈', category: 'elementor-pro' },
  { type: 'loopGrid', label: 'Grid Dinâmico (Loop)', icon: '⊞', category: 'elementor-pro' },

  // Navigation
  { type: 'navMenu', label: 'Menu de Navegação Pro', icon: '☰', category: 'elementor-pro' },
  { type: 'megaMenu', label: 'Mega Menu', icon: '⊞', category: 'elementor-pro' },
  { type: 'breadcrumbsPro', label: 'Breadcrumb Pro', icon: '›', category: 'elementor-pro' },

  // Posts & Content
  { type: 'posts', label: 'Posts Dinâmicos', icon: '▦', category: 'elementor-pro' },
  { type: 'portfolio', label: 'Portfólio', icon: '◫', category: 'elementor-pro' },
  { type: 'slides', label: 'Slides / Slideshow', icon: '▶', category: 'elementor-pro' },
  { type: 'imageGalleryPro', label: 'Galeria de Imagens Pro', icon: 'GAL', category: 'elementor-pro' },

  // Theme Builder
  { type: 'siteLogo', label: 'Logo do Site', icon: '◉', category: 'elementor-pro' },
  { type: 'siteTitle', label: 'Título do Site', icon: 'H', category: 'elementor-pro' },
  { type: 'pageTitle', label: 'Título da Página', icon: 'H', category: 'elementor-pro' },
  { type: 'postTitle', label: 'Título do Post', icon: 'H', category: 'elementor-pro' },
  { type: 'postContent', label: 'Conteúdo do Post', icon: 'T', category: 'elementor-pro' },
  { type: 'postExcerpt', label: 'Resumo do Post', icon: '≡', category: 'elementor-pro' },
  { type: 'featuredImage', label: 'Imagem Destaque', icon: 'IMG', category: 'elementor-pro' },
  { type: 'postInfo', label: 'Info do Post (data/autor)', icon: 'i', category: 'elementor-pro' },
  { type: 'postNavigation', label: 'Navegação entre Posts', icon: '⇄', category: 'elementor-pro' },
  { type: 'authorBox', label: 'Box do Autor', icon: 'USR', category: 'elementor-pro' },
  { type: 'searchForm', label: 'Formulário de Busca', icon: 'SRC', category: 'elementor-pro' },

  // Forms & Login
  { type: 'formPro', label: 'Formulário Pro (mais campos)', icon: '▭', category: 'elementor-pro' },
  { type: 'loginPro', label: 'Login Pro', icon: 'USR', category: 'elementor-pro' },

  // Social & Sharing
  { type: 'socialIcons', label: 'Ícones Sociais', icon: '★', category: 'elementor-pro' },
  { type: 'shareButtonsPro', label: 'Botões de Compartilhar', icon: '⇪', category: 'elementor-pro' },

  // Media & Embed
  { type: 'mediaCarouselPro', label: 'Carrossel de Mídia Pro', icon: '❖', category: 'elementor-pro' },
  { type: 'testimonialCarouselPro', label: 'Carrossel de Depoimentos Pro', icon: '❝', category: 'elementor-pro' },
  { type: 'postsCarousel', label: 'Carrossel de Posts', icon: '↻', category: 'elementor-pro' },

  // Payments
  { type: 'paypalButton', label: 'Botão PayPal', icon: '$', category: 'elementor-pro' },
  { type: 'stripeButton', label: 'Botão Stripe', icon: '$', category: 'elementor-pro' },

  // Advanced
  { type: 'offCanvas', label: 'Off Canvas', icon: '◧', category: 'elementor-pro' },
  { type: 'sticky', label: 'Sticky (Fixo ao Scroll)', icon: 'PIN', category: 'elementor-pro' },
  { type: 'progressTracker', label: 'Barra de Progresso Pro', icon: '▰', category: 'elementor-pro' },
  { type: 'pageTransitions', label: 'Transições de Página', icon: '⟳', category: 'elementor-pro' },
  { type: 'customCodePro', label: 'Código Customizado Pro', icon: '<>', category: 'elementor-pro' },
  { type: 'customCssPro', label: 'CSS Customizado Pro', icon: '{}', category: 'elementor-pro' },
  { type: 'displayConditions', label: 'Condições de Exibição', icon: 'EYE', category: 'elementor-pro' },
  { type: 'floatingButtons', label: 'Botões Flutuantes', icon: 'MSG', category: 'elementor-pro' },
  { type: 'linkInBio', label: 'Link in Bio', icon: 'LNK', category: 'elementor-pro' },
  { type: 'tableOfContentsPro', label: 'Índice de Conteúdo Pro', icon: '≣', category: 'elementor-pro' },
  { type: 'codeHighlightPro', label: 'Code Highlight Pro', icon: '{}', category: 'elementor-pro' },
  { type: 'lottiePro', label: 'Lottie Pro', icon: '✦', category: 'elementor-pro' },
  { type: 'googleMapsPro', label: 'Google Maps Pro', icon: 'MAP', category: 'elementor-pro' },
  { type: 'countdownPro', label: 'Contador Regressivo Pro', icon: '00:00', category: 'elementor-pro' },
  { type: 'ctaPro', label: 'Call to Action Pro', icon: '◉', category: 'elementor-pro' },
  { type: 'flipBoxPro', label: 'Flip Box 3D Pro', icon: '⇄', category: 'elementor-pro' },
  { type: 'priceTablePro', label: 'Tabela de Preços Pro', icon: '$', category: 'elementor-pro' },
  { type: 'priceListPro', label: 'Lista de Preços Pro', icon: '≡$', category: 'elementor-pro' },
  { type: 'animatedHeadlinePro', label: 'Título Animado Pro', icon: '✎', category: 'elementor-pro' },
  { type: 'reviewsPro', label: 'Avaliações Pro', icon: '★', category: 'elementor-pro' },
  { type: 'shareButtonsEl', label: 'Compartilhar Pro', icon: '⇪', category: 'elementor-pro' },
  { type: 'subscribe', label: 'Inscreva-se / Subscribe', icon: '@', category: 'elementor-pro' },
  { type: 'paypal', label: 'PayPal Checkout', icon: '$', category: 'elementor-pro' },
  { type: 'stripe', label: 'Stripe Checkout', icon: 'CRD', category: 'elementor-pro' },
]
