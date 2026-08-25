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
export interface Page {
  id: string
  type: string
  slug: string
  title: string
  status: 'draft' | 'published'
  is_landing_mode: boolean
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

  animation_type: string
  animation_duration: string
  animation_delay: string
  animation_offset: string

  custom_css: string
  custom_class: string

  containers?: PageContainer[]
  created_at: string
  updated_at: string
}

// ============================================================
// CONTAINER
// ============================================================
export interface PageContainer {
  id: string
  section_id: string
  order: number

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

  border: string
  border_color: string
  border_radius: string
  box_shadow: string

  hide_on_desktop: boolean
  hide_on_tablet: boolean
  hide_on_mobile: boolean

  custom_css: string
  custom_class: string

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
  html_id: string
  aria_label: string

  // Hover
  hover: WidgetHover

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
  | 'layout'
  | 'media'
  | 'content'
  | 'commerce'
  | 'navigation'
  | 'form'
  | 'advanced'

export const WIDGET_CATEGORIES: { key: WidgetCategory; label: string }[] = [
  { key: 'basic', label: 'Básicos' },
  { key: 'layout', label: 'Layout' },
  { key: 'media', label: 'Mídia' },
  { key: 'content', label: 'Conteúdo' },
  { key: 'commerce', label: 'E-commerce' },
  { key: 'navigation', label: 'Navegação' },
  { key: 'form', label: 'Formulários' },
  { key: 'advanced', label: 'Avançado' },
]

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // Basic
  { type: 'heading', label: 'Título', icon: 'H', category: 'basic' },
  { type: 'text', label: 'Texto', icon: 'T', category: 'basic' },
  { type: 'button', label: 'Botão', icon: '▣', category: 'basic' },
  { type: 'icon', label: 'Ícone', icon: '★', category: 'basic' },
  { type: 'divider', label: 'Divisor', icon: '—', category: 'basic' },
  { type: 'spacer', label: 'Espaço', icon: '↕', category: 'basic' },

  // Layout
  { type: 'columns', label: 'Colunas', icon: '▥', category: 'layout' },
  { type: 'grid', label: 'Grid', icon: '⊞', category: 'layout' },
  { type: 'tabs', label: 'Abas', icon: '☰', category: 'layout' },
  { type: 'accordion', label: 'Accordion', icon: '≡', category: 'layout' },
  { type: 'toggle', label: 'Toggle', icon: '◎', category: 'layout' },

  // Media
  { type: 'image', label: 'Imagem', icon: '🖼', category: 'media' },
  { type: 'gallery', label: 'Galeria', icon: '🎨', category: 'media' },
  { type: 'carousel', label: 'Carrossel', icon: '🎠', category: 'media' },
  { type: 'video', label: 'Vídeo', icon: '▶', category: 'media' },
  { type: 'imageText', label: 'Imagem + Texto', icon: '⇚', category: 'media' },

  // Content
  { type: 'cta', label: 'CTA', icon: '◉', category: 'content' },
  { type: 'banner', label: 'Banner', icon: '▬', category: 'content' },
  { type: 'faq', label: 'FAQ', icon: '?', category: 'content' },
  { type: 'testimonials', label: 'Depoimentos', icon: '❝', category: 'content' },
  { type: 'specifications', label: 'Especificações', icon: '☰', category: 'content' },
  { type: 'comparison', label: 'Comparação', icon: '⚖', category: 'content' },
  { type: 'table', label: 'Tabela', icon: '▦', category: 'content' },
  { type: 'list', label: 'Lista', icon: '•', category: 'content' },
  { type: 'quote', label: 'Citação', icon: '❝', category: 'content' },
  { type: 'steps', label: 'Passos', icon: '①', category: 'content' },

  // Commerce
  { type: 'product', label: 'Produto', icon: '▣', category: 'commerce' },
  { type: 'productGrid', label: 'Grade de Produtos', icon: '⊞', category: 'commerce' },
  { type: 'productHero', label: 'Produto Hero', icon: '★', category: 'commerce' },
  { type: 'categories', label: 'Categorias', icon: '▦', category: 'commerce' },
  { type: 'price', label: 'Preço', icon: '$', category: 'commerce' },
  { type: 'buyButton', label: 'Botão Comprar', icon: '🛒', category: 'commerce' },
  { type: 'relatedProducts', label: 'Produtos Relacionados', icon: '↻', category: 'commerce' },

  // Navigation
  { type: 'menu', label: 'Menu', icon: '≡', category: 'navigation' },
  { type: 'breadcrumb', label: 'Breadcrumb', icon: '›', category: 'navigation' },

  // Form
  { type: 'form', label: 'Formulário', icon: '▭', category: 'form' },
  { type: 'newsletter', label: 'Newsletter', icon: '✉', category: 'form' },

  // Advanced
  { type: 'html', label: 'HTML', icon: '<>', category: 'advanced' },
  { type: 'embed', label: 'Embed', icon: '⧉', category: 'advanced' },
  { type: 'code', label: 'Código', icon: '{ }', category: 'advanced' },
]
