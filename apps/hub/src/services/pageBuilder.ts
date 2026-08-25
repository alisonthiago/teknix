import { supabase } from '../lib/supabase'
import type {
  Page,
  PageSection,
  PageContainer,
  PageWidget,
  Theme,
  Template,
  PagePublication,
  MediaItem,
  WidgetContent,
  WidgetHover,
} from '../types/pageBuilder'

export { WIDGET_CATEGORIES, WIDGET_DEFINITIONS } from '../types/pageBuilder'

// ============================================================
// PAGES
// ============================================================

export async function getPages(type?: string) {
  let query = supabase
    .from('pages')
    .select('*')
    .order('updated_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Page[]
}

export async function getPageBySlug(slug: string) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as Page
}

export async function getPageWithSections(pageId: string) {
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single()

  if (pageError) throw pageError

  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', pageId)
    .order('order')

  if (sectionsError) throw sectionsError

  const sectionsWithChildren = await Promise.all(
    (sections || []).map(async (section) => {
      const { data: containers } = await supabase
        .from('page_containers')
        .select('*')
        .eq('section_id', section.id)
        .order('order')

      const containersWithWidgets = await Promise.all(
        (containers || []).map(async (container) => {
          const { data: widgets } = await supabase
            .from('page_widgets')
            .select('*')
            .eq('container_id', container.id)
            .order('order')

          return { ...container, widgets: (widgets || []) as PageWidget[] }
        })
      )

      return {
        ...section,
        containers: containersWithWidgets as PageContainer[],
      }
    })
  )

  return {
    page: page as Page,
    sections: sectionsWithChildren as PageSection[],
  }
}

export async function createPage(page: Partial<Page>) {
  const { data, error } = await supabase
    .from('pages')
    .insert({
      type: page.type || 'custom',
      slug: page.slug || '',
      title: page.title || 'Nova página',
      status: 'draft',
      is_landing_mode: page.is_landing_mode || false,
      theme_id: page.theme_id || null,
      template_id: page.template_id || null,
      header_id: page.header_id || null,
      footer_id: page.footer_id || null,
      menu: page.menu || [],
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
      seo_image: page.seo_image || '',
      seo_slug: page.seo_slug || page.slug || '',
      seo_canonical: page.seo_canonical || '',
      seo_og: page.seo_og || {},
      head_scripts: page.head_scripts || '',
      body_scripts: page.body_scripts || '',
      page_styles: page.page_styles || {},
      version: 1,
    })
    .select()
    .single()

  if (error) throw error
  return data as Page
}

export async function updatePage(pageId: string, updates: Partial<Page>) {
  const { data, error } = await supabase
    .from('pages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', pageId)
    .select()
    .single()

  if (error) throw error
  return data as Page
}

export async function deletePage(pageId: string) {
  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId)

  if (error) throw error
}

// ============================================================
// SECTIONS
// ============================================================

export async function addSection(pageId: string, type: string, afterSectionId?: string) {
  const { data: existing } = await supabase
    .from('page_sections')
    .select('order')
    .eq('page_id', pageId)
    .order('order', { ascending: false })
    .limit(1)

  let newOrder = (existing?.[0]?.order ?? -1) + 1

  if (afterSectionId) {
    const { data: afterSection } = await supabase
      .from('page_sections')
      .select('order')
      .eq('id', afterSectionId)
      .single()

    if (afterSection) {
      newOrder = afterSection.order + 1
      await supabase.rpc('increment_section_order', {
        p_page_id: pageId,
        p_after_order: afterSection.order,
      })
    }
  }

  const defaults = getDefaultSectionSettings(type)

  const { data, error } = await supabase
    .from('page_sections')
    .insert({
      page_id: pageId,
      type,
      order: newOrder,
      layout: defaults.layout || 'boxed',
      direction: defaults.direction || 'row',
      gap: defaults.gap || '16px',
      max_width: defaults.max_width || '1200px',
      min_height: defaults.min_height || 'auto',
      bg_type: defaults.bg_type || 'color',
      bg_color: defaults.bg_color || 'transparent',
      bg_image: defaults.bg_image || '',
      bg_video: defaults.bg_video || '',
      bg_gradient: defaults.bg_gradient || '',
      bg_position: defaults.bg_position || 'center',
      bg_size: defaults.bg_size || 'cover',
      bg_repeat: defaults.bg_repeat || 'no-repeat',
      bg_attachment: defaults.bg_attachment || 'scroll',
      bg_overlay: defaults.bg_overlay || 'transparent',
      bg_opacity: defaults.bg_opacity ?? 1,
      padding_top: defaults.padding_top || '60px',
      padding_bottom: defaults.padding_bottom || '60px',
      padding_left: defaults.padding_left || '0',
      padding_right: defaults.padding_right || '0',
      margin_top: defaults.margin_top || '0',
      margin_bottom: defaults.margin_bottom || '0',
      border_top: defaults.border_top || 'none',
      border_bottom: defaults.border_bottom || 'none',
      border_color: defaults.border_color || 'transparent',
      border_radius: defaults.border_radius || '0',
      box_shadow: defaults.box_shadow || 'none',
      hide_on_desktop: false,
      hide_on_tablet: false,
      hide_on_mobile: false,
      animation_type: '',
      animation_duration: '',
      animation_delay: '',
      animation_offset: '',
      custom_css: '',
      custom_class: '',
    })
    .select()
    .single()

  if (error) throw error
  return data as PageSection
}

export async function updateSection(sectionId: string, updates: Partial<PageSection>) {
  const { data, error } = await supabase
    .from('page_sections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sectionId)
    .select()
    .single()

  if (error) throw error
  return data as PageSection
}

export async function deleteSection(sectionId: string) {
  const { error } = await supabase
    .from('page_sections')
    .delete()
    .eq('id', sectionId)

  if (error) throw error
}

export async function moveSection(sectionId: string, newOrder: number) {
  const { error } = await supabase
    .from('page_sections')
    .update({ order: newOrder, updated_at: new Date().toISOString() })
    .eq('id', sectionId)

  if (error) throw error
}

// ============================================================
// CONTAINERS
// ============================================================

export async function addContainer(sectionId: string, afterContainerId?: string) {
  const { data: existing } = await supabase
    .from('page_containers')
    .select('order')
    .eq('section_id', sectionId)
    .order('order', { ascending: false })
    .limit(1)

  let newOrder = (existing?.[0]?.order ?? -1) + 1

  if (afterContainerId) {
    const { data: afterContainer } = await supabase
      .from('page_containers')
      .select('order')
      .eq('id', afterContainerId)
      .single()

    if (afterContainer) {
      newOrder = afterContainer.order + 1
      await supabase.rpc('increment_container_order', {
        p_section_id: sectionId,
        p_after_order: afterContainer.order,
      })
    }
  }

  const { data, error } = await supabase
    .from('page_containers')
    .insert({
      section_id: sectionId,
      order: newOrder,
      direction: 'column',
      gap: '16px',
      align_items: 'stretch',
      justify_content: 'flex-start',
      flex_wrap: 'nowrap',
      flex_grow: '1',
      flex_shrink: '1',
      width: '100%',
      max_width: 'none',
      min_height: 'auto',
      bg_type: 'color',
      bg_color: 'transparent',
      bg_image: '',
      bg_gradient: '',
      bg_overlay: 'transparent',
      bg_opacity: 1,
      padding_top: '0',
      padding_bottom: '0',
      padding_left: '0',
      padding_right: '0',
      margin_top: '0',
      margin_bottom: '0',
      border: 'none',
      border_color: 'transparent',
      border_radius: '0',
      box_shadow: 'none',
      hide_on_desktop: false,
      hide_on_tablet: false,
      hide_on_mobile: false,
      custom_css: '',
      custom_class: '',
    })
    .select()
    .single()

  if (error) throw error
  return data as PageContainer
}

export async function updateContainer(containerId: string, updates: Partial<PageContainer>) {
  const { data, error } = await supabase
    .from('page_containers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', containerId)
    .select()
    .single()

  if (error) throw error
  return data as PageContainer
}

export async function deleteContainer(containerId: string) {
  const { error } = await supabase
    .from('page_containers')
    .delete()
    .eq('id', containerId)

  if (error) throw error
}

export async function moveContainer(containerId: string, newOrder: number) {
  const { error } = await supabase
    .from('page_containers')
    .update({ order: newOrder, updated_at: new Date().toISOString() })
    .eq('id', containerId)

  if (error) throw error
}

// ============================================================
// WIDGETS
// ============================================================

export async function addWidget(containerId: string, type: string, afterWidgetId?: string) {
  const { data: existing } = await supabase
    .from('page_widgets')
    .select('order')
    .eq('container_id', containerId)
    .order('order', { ascending: false })
    .limit(1)

  let newOrder = (existing?.[0]?.order ?? -1) + 1

  if (afterWidgetId) {
    const { data: afterWidget } = await supabase
      .from('page_widgets')
      .select('order')
      .eq('id', afterWidgetId)
      .single()

    if (afterWidget) {
      newOrder = afterWidget.order + 1
      await supabase.rpc('increment_widget_order', {
        p_container_id: containerId,
        p_after_order: afterWidget.order,
      })
    }
  }

  const content = getDefaultWidgetContent(type)
  const style = getDefaultWidgetStyle()

  const { data, error } = await supabase
    .from('page_widgets')
    .insert({
      container_id: containerId,
      type,
      order: newOrder,
      content,
      ...style,
    })
    .select()
    .single()

  if (error) throw error
  return data as PageWidget
}

export async function updateWidget(widgetId: string, updates: Partial<PageWidget>) {
  const { data, error } = await supabase
    .from('page_widgets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', widgetId)
    .select()
    .single()

  if (error) throw error
  return data as PageWidget
}

export async function deleteWidget(widgetId: string) {
  const { error } = await supabase
    .from('page_widgets')
    .delete()
    .eq('id', widgetId)

  if (error) throw error
}

export async function moveWidget(widgetId: string, newOrder: number) {
  const { error } = await supabase
    .from('page_widgets')
    .update({ order: newOrder, updated_at: new Date().toISOString() })
    .eq('id', widgetId)

  if (error) throw error
}

// ============================================================
// THEMES
// ============================================================

export async function getThemes() {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Theme[]
}

export async function getTheme(themeId: string) {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('id', themeId)
    .single()

  if (error) throw error
  return data as Theme
}

export async function createTheme(theme: Partial<Theme>) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('themes')
    .insert({
      name: theme.name || 'Novo tema',
      slug: theme.slug || '',
      is_default: theme.is_default || false,
      status: 'active',
      font_heading: theme.font_heading || 'Inter',
      font_body: theme.font_body || 'Inter',
      font_button: theme.font_button || 'Inter',
      font_input: theme.font_input || 'Inter',
      font_accent: theme.font_accent || 'Inter',
      font_scale: theme.font_scale ?? 1,
      color_primary: theme.color_primary || '#00ff88',
      color_secondary: theme.color_secondary || '#1a1a2e',
      color_accent: theme.color_accent || '#e94560',
      color_background: theme.color_background || '#ffffff',
      color_surface: theme.color_surface || '#f8f9fa',
      color_text: theme.color_text || '#1a1a2e',
      color_text_muted: theme.color_text_muted || '#666666',
      color_text_light: theme.color_text_light || '#999999',
      color_border: theme.color_border || '#e5e5e5',
      color_success: theme.color_success || '#28a745',
      color_warning: theme.color_warning || '#ffc107',
      color_error: theme.color_error || '#dc3545',
      spacing_xs: theme.spacing_xs || '4px',
      spacing_sm: theme.spacing_sm || '8px',
      spacing_md: theme.spacing_md || '16px',
      spacing_lg: theme.spacing_lg || '24px',
      spacing_xl: theme.spacing_xl || '32px',
      spacing_2xl: theme.spacing_2xl || '48px',
      spacing_3xl: theme.spacing_3xl || '64px',
      spacing_4xl: theme.spacing_4xl || '96px',
      radius_sm: theme.radius_sm || '4px',
      radius_md: theme.radius_md || '8px',
      radius_lg: theme.radius_lg || '12px',
      radius_xl: theme.radius_xl || '16px',
      radius_full: theme.radius_full || '9999px',
      shadow_sm: theme.shadow_sm || '0 1px 2px rgba(0,0,0,0.05)',
      shadow_md: theme.shadow_md || '0 4px 6px rgba(0,0,0,0.07)',
      shadow_lg: theme.shadow_lg || '0 10px 15px rgba(0,0,0,0.1)',
      shadow_xl: theme.shadow_xl || '0 20px 25px rgba(0,0,0,0.1)',
      container_width: theme.container_width || '1200px',
      container_width_narrow: theme.container_width_narrow || '800px',
      container_width_wide: theme.container_width_wide || '1440px',
      container_padding: theme.container_padding || '16px',
      button_font_size: theme.button_font_size || '14px',
      button_font_weight: theme.button_font_weight || '600',
      button_padding_x: theme.button_padding_x || '24px',
      button_padding_y: theme.button_padding_y || '12px',
      button_radius: theme.button_radius || '8px',
      button_bg: theme.button_bg || '#00ff88',
      button_color: theme.button_color || '#1a1a2e',
      button_hover_bg: theme.button_hover_bg || '#00cc6a',
      button_hover_color: theme.button_hover_color || '#1a1a2e',
      h1_size: theme.h1_size || '3rem',
      h1_weight: theme.h1_weight || '800',
      h1_line_height: theme.h1_line_height || '1.1',
      h2_size: theme.h2_size || '2.25rem',
      h2_weight: theme.h2_weight || '700',
      h2_line_height: theme.h2_line_height || '1.2',
      h3_size: theme.h3_size || '1.75rem',
      h3_weight: theme.h3_weight || '700',
      h3_line_height: theme.h3_line_height || '1.3',
      h4_size: theme.h4_size || '1.25rem',
      h4_weight: theme.h4_weight || '600',
      h5_size: theme.h5_size || '1rem',
      h5_weight: theme.h5_weight || '600',
      h6_size: theme.h6_size || '0.875rem',
      h6_weight: theme.h6_weight || '600',
      body_size: theme.body_size || '16px',
      body_line_height: theme.body_line_height || '1.6',
      body_letter_spacing: theme.body_letter_spacing || '0',
      custom: theme.custom || {},
      created_by: theme.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data as Theme
}

export async function updateTheme(themeId: string, updates: Partial<Theme>) {
  const { data, error } = await supabase
    .from('themes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', themeId)
    .select()
    .single()

  if (error) throw error
  return data as Theme
}

export async function deleteTheme(themeId: string) {
  const { error } = await supabase
    .from('themes')
    .delete()
    .eq('id', themeId)

  if (error) throw error
}

// ============================================================
// TEMPLATES
// ============================================================

export async function getTemplates(type?: string) {
  let query = supabase
    .from('templates')
    .select('*')
    .eq('active', true)
    .order('name')

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Template[]
}

export async function getTemplate(templateId: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) throw error
  return data as Template
}

export async function createTemplate(template: Partial<Template>) {
  const { data, error } = await supabase
    .from('templates')
    .insert({
      name: template.name || 'Novo template',
      slug: template.slug || '',
      type: template.type || 'landing',
      description: template.description || '',
      thumbnail: template.thumbnail || '',
      theme_id: template.theme_id || null,
      schema: template.schema || [],
      active: template.active ?? true,
      created_by: template.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data as Template
}

// ============================================================
// PUBLICATIONS
// ============================================================

export async function publishPage(pageId: string, notes?: string) {
  const { page, sections } = await getPageWithSections(pageId)

  const allContainers: PageContainer[] = []
  const allWidgets: PageWidget[] = []
  for (const section of sections) {
    if (section.containers) {
      allContainers.push(...section.containers)
      for (const container of section.containers) {
        if (container.widgets) {
          allWidgets.push(...container.widgets)
        }
      }
    }
  }

  const { data: lastPub } = await supabase
    .from('page_publications')
    .select('version')
    .eq('page_id', pageId)
    .order('version', { ascending: false })
    .limit(1)

  const newVersion = (lastPub?.[0]?.version ?? 0) + 1

  await supabase.from('page_publications').insert({
    page_id: pageId,
    version: newVersion,
    snapshot: { page, sections, containers: allContainers, widgets: allWidgets },
    notes: notes || '',
  })

  await updatePage(pageId, {
    status: 'published',
    version: newVersion,
    published_at: new Date().toISOString(),
  })
}

export async function unpublishPage(pageId: string) {
  await updatePage(pageId, { status: 'draft' })
}

// ============================================================
// MEDIA
// ============================================================

export async function getMedia(folder?: string) {
  let query = supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })

  if (folder) {
    query = query.eq('folder', folder)
  }

  const { data, error } = await query
  if (error) throw error
  return data as MediaItem[]
}

export async function uploadMedia(file: File, folder?: string) {
  const filePath = `${folder || 'uploads'}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath)

  const { data, error } = await supabase
    .from('media')
    .insert({
      name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      alt: '',
      folder: folder || 'uploads',
    })
    .select()
    .single()

  if (error) throw error
  return data as MediaItem
}

// ============================================================
// DEFAULTS
// ============================================================

export function getDefaultSectionSettings(type: string): Record<string, string | number> {
  const defaults: Record<string, Record<string, string | number>> = {
    hero: {
      layout: 'full',
      direction: 'column',
      gap: '24px',
      max_width: '1200px',
      min_height: '80vh',
      bg_type: 'color',
      bg_color: '#0a0a0a',
      padding_top: '0',
      padding_bottom: '0',
    },
    imageText: {
      layout: 'boxed',
      direction: 'row',
      gap: '48px',
      max_width: '1200px',
      min_height: 'auto',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    text: {
      layout: 'boxed',
      direction: 'column',
      gap: '16px',
      max_width: '800px',
      min_height: 'auto',
      padding_top: '60px',
      padding_bottom: '60px',
    },
    carousel: {
      layout: 'full',
      direction: 'row',
      gap: '0',
      max_width: '1200px',
      min_height: 'auto',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    productGrid: {
      layout: 'boxed',
      direction: 'column',
      gap: '32px',
      max_width: '1200px',
      min_height: 'auto',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    faq: {
      layout: 'boxed',
      direction: 'column',
      gap: '16px',
      max_width: '800px',
      min_height: 'auto',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    cta: {
      layout: 'full',
      direction: 'column',
      gap: '24px',
      max_width: '1200px',
      min_height: 'auto',
      bg_color: '#00ff88',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    banner: {
      layout: 'full',
      direction: 'row',
      gap: '0',
      max_width: '1200px',
      min_height: 'auto',
      padding_top: '0',
      padding_bottom: '0',
    },
    spacer: {
      layout: 'boxed',
      direction: 'row',
      gap: '0',
      max_width: '1200px',
      min_height: '60px',
      padding_top: '0',
      padding_bottom: '0',
    },
    divider: {
      layout: 'full',
      direction: 'row',
      gap: '0',
      max_width: '1200px',
      min_height: 'auto',
      padding_top: '24px',
      padding_bottom: '24px',
    },
    testimonials: {
      layout: 'boxed',
      direction: 'column',
      gap: '32px',
      max_width: '1200px',
      min_height: 'auto',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    specifications: {
      layout: 'boxed',
      direction: 'column',
      gap: '16px',
      max_width: '1000px',
      min_height: 'auto',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    gallery: {
      layout: 'boxed',
      direction: 'row',
      gap: '16px',
      max_width: '1200px',
      min_height: 'auto',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    video: {
      layout: 'boxed',
      direction: 'column',
      gap: '16px',
      max_width: '1000px',
      min_height: 'auto',
      padding_top: '80px',
      padding_bottom: '80px',
    },
    newsletter: {
      layout: 'boxed',
      direction: 'column',
      gap: '16px',
      max_width: '600px',
      min_height: 'auto',
      padding_top: '60px',
      padding_bottom: '60px',
    },
  }

  return defaults[type] || {
    layout: 'boxed',
    direction: 'column',
    gap: '16px',
    max_width: '1200px',
    min_height: 'auto',
    padding_top: '60px',
    padding_bottom: '60px',
  }
}

export function getDefaultWidgetContent(type: string): WidgetContent {
  const defaults: Record<string, WidgetContent> = {
    heading: { text: 'Título', tag: 'h2' },
    text: { text: 'Texto de exemplo' },
    button: { label: 'Clique aqui', button_link: '', button_variant: 'primary', button_size: 'md' },
    icon: { icon: '✦' },
    divider: { divider_width: '100%', divider_style: 'solid', divider_color: '#e5e5e5' },
    spacer: { height: '40px' },
    image: { image: '', alt: '' },
    video: { video_url: '', video_type: 'mp4' },
    gallery: { gallery_items: [] },
    carousel: { carousel_items: [] },
    cta: { cta_title: 'Pronto para começar?', cta_text: 'Entre em contato', cta_button: 'Fale conosco', cta_link: '' },
    banner: { image: '', link: '', banner_height: '400px' },
    faq: { faq_items: [] },
    testimonials: { testimonials: [] },
    specifications: { spec_items: [] },
    product: { product_id: '', product_layout: 'card' },
    productGrid: { product_filter: 'featured', product_limit: 8, product_columns: 4 },
    categories: { categories: [], category_layout: 'grid' },
    list: { list_items: [] },
    table: { table_headers: ['Coluna 1', 'Coluna 2'], table_rows: [['', '']] },
    quote: { quote_text: 'Citação de exemplo', quote_author: 'Autor' },
    html: { html_code: '' },
    form: { form_id: '' },
    menu: {},
    breadcrumb: {},
    price: {},
    buyButton: {},
    relatedProducts: {},
  }

  return defaults[type] || {}
}

export function getDefaultWidgetStyle(): Partial<PageWidget> {
  return {
    font_family: '',
    font_size: '',
    font_weight: '',
    line_height: '',
    letter_spacing: '',
    text_transform: '',
    text_align: '',
    color: '',
    bg_type: 'color',
    bg_color: 'transparent',
    bg_image: '',
    bg_gradient: '',
    bg_overlay: 'transparent',
    bg_opacity: 1,
    padding_top: '0',
    padding_bottom: '0',
    padding_left: '0',
    padding_right: '0',
    margin_top: '0',
    margin_bottom: '0',
    margin_left: '0',
    margin_right: '0',
    width: '',
    max_width: '',
    min_width: '',
    height: '',
    min_height: '',
    max_height: '',
    border_style: 'none',
    border_width: '0',
    border_color: 'transparent',
    border_radius: '0',
    box_shadow: 'none',
    opacity: '1',
    filter_blur: '',
    filter_brightness: '',
    filter_contrast: '',
    filter_saturation: '',
    position: '',
    z_index: '',
    overflow: '',
    hide_on_desktop: false,
    hide_on_tablet: false,
    hide_on_mobile: false,
    responsive: {},
    animation_type: '',
    animation_duration: '',
    animation_delay: '',
    custom_css: '',
    custom_class: '',
    html_id: '',
    aria_label: '',
    hover: {} as WidgetHover,
  }
}
