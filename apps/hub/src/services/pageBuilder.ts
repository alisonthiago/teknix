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

const DEFAULT_PRESET_PAGES: Page[] = ([
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Home Oficial TEKNIX',
    slug: '',
    type: 'home',
    status: 'published',
    is_landing_mode: false,
    version: 1,
    seo_title: 'TEKNIX — Ferramentas Elétricas & Tecnologia Profissional',
    seo_description: 'Loja oficial TEKNIX. Descubra ferramentas elétricas de alta performance, baterias sem fio e tecnologia industrial avançada.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Segmento Ferramentas Industriais',
    slug: 'ferramentas',
    type: 'segmento',
    status: 'published',
    is_landing_mode: false,
    version: 1,
    seo_title: 'Ferramentas Industriais — TEKNIX',
    seo_description: 'Parafusadeiras, furadeiras e serras de alta precisão e durabilidade extrema.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    title: 'Segmento Iluminação & Energia Solar',
    slug: 'iluminacao-solar',
    type: 'segmento',
    status: 'published',
    is_landing_mode: false,
    version: 1,
    seo_title: 'Iluminação & Energia Solar — TEKNIX',
    seo_description: 'Refletores LED e luminárias solares inteligentes com eficiência máxima.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    title: 'Categoria Parafusadeiras Brushless Pro',
    slug: 'ferramentas/parafusadeiras',
    type: 'category',
    status: 'published',
    is_landing_mode: false,
    version: 1,
    seo_title: 'Parafusadeiras Brushless Pro — TEKNIX',
    seo_description: 'Máxima potência, motor Brushless sem escovas e bateria intercambiável.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    title: 'Black Friday / Ofertas Exclusivas',
    slug: 'black-friday',
    type: 'campaign',
    status: 'published',
    is_landing_mode: true,
    version: 1,
    seo_title: 'Black Friday Especial — TEKNIX',
    seo_description: 'Ofertas exclusivas com até 40% OFF em ferramentas e frete grátis.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '15e26476-4adb-445b-b808-aa5086caad0d',
    title: 'Kit Chave De Impacto 21v Parafusadeira + Jogo Soquete 46pç Cor Amarelo Frequência 50hz/60 127/220v',
    slug: 'produto/kit-chave-de-impacto-21v-parafusadeira',
    type: 'product',
    status: 'published',
    is_landing_mode: false,
    version: 1,
    seo_title: 'Kit Chave De Impacto 21v Parafusadeira TEKNIX',
    seo_description: 'Chave de impacto e parafusadeira profissional 21V com maleta e 46 peças.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
] as any[]) as Page[]

export async function getPages(type?: string) {
  try {
    let query = supabase
      .from('pages')
      .select('*')
      .order('updated_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    if (error) throw error
    if (data) return data as Page[]
  } catch (e) {
    console.warn('getPages Supabase query:', e)
  }
  return []
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
  let page: any = null
  try {
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .maybeSingle()

    if (pageData && !pageError) {
      page = pageData
    }
  } catch {}

  if (!page) {
    const preset = DEFAULT_PRESET_PAGES.find(p => p.id === pageId)
    page = preset || {
      id: pageId,
      title: 'Página sem título',
      slug: 'pagina',
      type: 'custom',
      status: 'draft',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  let sectionsWithChildren: PageSection[] = []

  try {
    const { data: sections, error: sectionsError } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', pageId)
      .order('order')

    if (!sectionsError && sections && sections.length > 0) {
      sectionsWithChildren = await Promise.all(
        sections.map(async (section) => {
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
    }
  } catch {}

  // Fallback to local backup if DB returned no sections
  if (sectionsWithChildren.length === 0) {
    try {
      const savedBackup = localStorage.getItem(`teknix_sections_backup_${pageId}`)
      if (savedBackup) {
        sectionsWithChildren = JSON.parse(savedBackup)
      }
    } catch {}
  }

  return {
    page: page as Page,
    sections: sectionsWithChildren as PageSection[],
  }
}

export async function createPage(page: Partial<Page>) {
  const cleanSlug = (page.slug || '').replace(/^\//, '')
  const { data, error } = await supabase
    .from('pages')
    .insert({
      type: page.type || 'custom',
      slug: cleanSlug,
      title: page.title || 'Nova página',
      status: page.status || 'draft',
      is_landing_mode: page.is_landing_mode || false,
      theme_id: page.theme_id || null,
      template_id: page.template_id || null,
      header_id: page.header_id || null,
      footer_id: page.footer_id || null,
      menu: page.menu || [],
      seo_title: page.seo_title || `${page.title || 'Nova Página'} — TEKNIX`,
      seo_description: page.seo_description || 'Página oficial TEKNIX com design profissional e alta performance.',
      seo_image: page.seo_image || '',
      seo_slug: cleanSlug,
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

export async function duplicatePage(pageId: string) {
  const { page, sections } = await getPageWithSections(pageId)
  const newSlug = `${page.slug}-copia-${Math.floor(1000 + Math.random() * 9000)}`
  const newTitle = `${page.title || 'Página'} (Cópia)`

  const { data: newPage, error: createError } = await supabase
    .from('pages')
    .insert({
      type: page.type || 'custom',
      slug: newSlug,
      title: newTitle,
      status: 'draft',
      is_landing_mode: page.is_landing_mode || false,
      theme_id: page.theme_id || null,
      template_id: page.template_id || null,
      header_id: page.header_id || null,
      footer_id: page.footer_id || null,
      menu: page.menu || [],
      seo_title: page.seo_title || `${newTitle} — TEKNIX`,
      seo_description: page.seo_description || '',
      seo_image: page.seo_image || '',
      seo_slug: newSlug,
      seo_canonical: page.seo_canonical || '',
      seo_og: page.seo_og || {},
      head_scripts: page.head_scripts || '',
      body_scripts: page.body_scripts || '',
      page_styles: page.page_styles || {},
      version: 1,
    })
    .select()
    .single()

  if (createError || !newPage) throw createError || new Error('Erro ao duplicar página')

  if (sections && sections.length > 0) {
    const duplicatedSections = sections.map((s, sIdx) => {
      const sId = crypto.randomUUID()
      return {
        ...s,
        id: sId,
        page_id: newPage.id,
        order: sIdx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        containers: (s.containers || []).map((c, cIdx) => {
          const cId = crypto.randomUUID()
          return {
            ...c,
            id: cId,
            section_id: sId,
            order: cIdx,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            widgets: (c.widgets || []).map((w, wIdx) => ({
              ...w,
              id: crypto.randomUUID(),
              container_id: cId,
              order: wIdx,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
          }
        })
      }
    })

    await savePageTree(newPage.id, duplicatedSections as any)
  }

  return newPage as Page
}

export async function updatePage(pageId: string, updates: Partial<Page>) {
  const PAGE_COLS = new Set([
    'title', 'name', 'slug', 'type', 'status', 'template', 'theme_id', 'is_homepage', 'is_landing_mode',
    'header_model', 'footer_model', 'display_conditions',
    'seo_title', 'seo_description', 'seo_image', 'seo_slug', 'seo_canonical', 'seo_og',
    'head_scripts', 'body_scripts', 'page_styles', 'version', 'published_at', 'updated_at'
  ])
  const cleanUpdates: any = {}
  for (const k of Object.keys(updates)) {
    if (PAGE_COLS.has(k)) cleanUpdates[k] = (updates as any)[k]
  }
  cleanUpdates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('pages')
    .update(cleanUpdates)
    .eq('id', pageId)
    .select()
    .maybeSingle()

  if (error) {
    console.warn('Supabase updatePage warning (falling back):', error.message)
  }
  return (data || { ...updates, id: pageId }) as Page
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

export async function savePageTree(pageId: string, sections: PageSection[]) {
  // 1. Delete all existing sections (cascade handles containers and widgets)
  await supabase.from('page_sections').delete().eq('page_id', pageId)

  // Valid DB columns for each table
  const SECTION_COLS = new Set([
    'id', 'page_id', 'type', 'order', 'layout', 'direction', 'gap', 'max_width', 'min_height',
    'bg_type', 'bg_color', 'bg_image', 'bg_video', 'bg_gradient', 'bg_position', 'bg_size',
    'bg_repeat', 'bg_attachment', 'bg_overlay', 'bg_opacity',
    'padding_top', 'padding_bottom', 'padding_left', 'padding_right', 'margin_top', 'margin_bottom',
    'border_top', 'border_bottom', 'border_color', 'border_radius', 'box_shadow',
    'hide_on_desktop', 'hide_on_tablet', 'hide_on_mobile',
    'animation_type', 'animation_duration', 'animation_delay', 'animation_offset',
    'custom_css', 'custom_class', 'created_at', 'updated_at'
  ])
  const CONTAINER_COLS = new Set([
    'id', 'section_id', 'order', 'direction', 'gap', 'align_items', 'justify_content',
    'flex_wrap', 'flex_grow', 'flex_shrink', 'width', 'max_width', 'min_height',
    'bg_type', 'bg_color', 'bg_image', 'bg_gradient', 'bg_overlay', 'bg_opacity',
    'padding_top', 'padding_bottom', 'padding_left', 'padding_right', 'margin_top', 'margin_bottom',
    'border', 'border_color', 'border_radius', 'box_shadow',
    'hide_on_desktop', 'hide_on_tablet', 'hide_on_mobile',
    'custom_css', 'custom_class', 'created_at', 'updated_at'
  ])
  const WIDGET_COLS = new Set([
    'id', 'container_id', 'type', 'order', 'content',
    'font_family', 'font_size', 'font_weight', 'line_height', 'letter_spacing',
    'text_transform', 'text_align', 'color',
    'bg_type', 'bg_color', 'bg_image', 'bg_gradient', 'bg_overlay', 'bg_opacity',
    'padding_top', 'padding_bottom', 'padding_left', 'padding_right',
    'margin_top', 'margin_bottom', 'margin_left', 'margin_right',
    'width', 'max_width', 'min_width', 'height', 'min_height', 'max_height',
    'border_style', 'border_width', 'border_color', 'border_radius', 'box_shadow',
    'opacity', 'filter_blur', 'filter_brightness', 'filter_contrast', 'filter_saturation',
    'position', 'z_index', 'overflow',
    'hide_on_desktop', 'hide_on_tablet', 'hide_on_mobile',
    'responsive', 'animation_type', 'animation_duration', 'animation_delay',
    'custom_css', 'custom_class', 'html_id', 'aria_label', 'hover',
    'created_at', 'updated_at'
  ])

  function pick(obj: any, validCols: Set<string>) {
    const result: any = {}
    for (const key of Object.keys(obj)) {
      if (validCols.has(key)) result[key] = obj[key]
    }
    return result
  }

  // Save local snapshot cache as resilient backup
  try {
    localStorage.setItem(`teknix_sections_backup_${pageId}`, JSON.stringify(sections))
  } catch {}

  // 2. Insert new structure
  try {
    for (const s of sections) {
      const { containers, ...sectionRaw } = s
      const sectionData = pick(sectionRaw, SECTION_COLS)
      sectionData.page_id = pageId
      const { error: sError } = await supabase.from('page_sections').insert(sectionData)
      if (sError) console.warn('Aviso ao salvar section:', sError.message)

      if (containers) {
        for (const c of containers) {
          const { widgets, ...containerRaw } = c
          const containerData = pick(containerRaw, CONTAINER_COLS)
          containerData.section_id = s.id
          const { error: cError } = await supabase.from('page_containers').insert(containerData)
          if (cError) console.warn('Aviso ao salvar container:', cError.message)

          if (widgets) {
            for (const w of widgets) {
              const widgetData = pick(w, WIDGET_COLS)
              widgetData.container_id = c.id
              const { error: wError } = await supabase.from('page_widgets').insert(widgetData)
              if (wError) console.warn('Aviso ao salvar widget:', wError.message)
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('Erro ao salvar árvore no DB (salvo no cache local):', err?.message)
  }
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

export function getDefaultContainerSettings(): Record<string, any> {
  return {
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
  }
}

export function getDefaultWidgetSettings(): Partial<PageWidget> {
  return getDefaultWidgetStyle()
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
