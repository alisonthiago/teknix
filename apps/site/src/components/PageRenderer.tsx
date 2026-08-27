import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import WidgetRenderer from './WidgetRenderer'
import type { Product } from '../types/database'
import {
  computeSectionStyles,
  computeContainerOuterStyles,
  computeContainerInnerStyles,
  computeWidgetStyles,
  generateCompiledCSS,
  initMotionEffectsRuntime,
} from '../services/styleEngine'

export interface PageData {
  id: string
  title: string
  slug: string
  status: string
  type?: string
  theme_id?: string
  meta_title?: string
  meta_description?: string
}

interface SectionData {
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
  hide_desktop?: boolean
  hide_tablet?: boolean
  hide_mobile?: boolean
  responsive?: Record<string, Record<string, string>>
  custom_css: string
  custom_class: string
  containers?: ContainerData[]
}

interface ContainerData {
  id: string
  section_id: string
  order: number
  display_type?: 'flex' | 'grid' | 'block'
  content_width?: 'boxed' | 'full'
  content_width_value?: string
  grid_columns?: string
  grid_rows?: string
  grid_gap?: string
  grid_auto_flow?: string
  direction: string
  gap: string
  align_items: string
  justify_content: string
  flex_wrap: string
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
  transform?: { translate_x?: string; translate_y?: string; scale?: number; rotate?: number; skew_x?: number }
  effects?: { opacity?: number; blur?: string; grayscale?: number; brightness?: number; contrast?: number; transition?: string }
  states?: { hover?: Record<string, any>; focus?: Record<string, any>; active?: Record<string, any> }
  hide_on_desktop: boolean
  hide_on_tablet: boolean
  hide_on_mobile: boolean
  hide_desktop?: boolean
  hide_tablet?: boolean
  hide_mobile?: boolean
  responsive?: Record<string, Record<string, string>>
  custom_css: string
  custom_class: string
  widgets?: WidgetData[]
}

interface WidgetData {
  id: string
  container_id: string
  type: string
  order: number
  content: Record<string, unknown>
  font_family: string
  font_size: string
  font_weight: string
  line_height: string
  letter_spacing: string
  text_transform: string
  text_align: string
  color: string
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
  margin_left: string
  margin_right: string
  width: string
  max_width: string
  min_width: string
  height: string
  min_height: string
  max_height: string
  border_style: string
  border_width: string
  border_color: string
  border_radius: string
  box_shadow: string
  opacity: string
  filter_blur: string
  filter_brightness: string
  filter_contrast: string
  filter_saturation: string
  position: string
  z_index: string
  overflow: string
  top?: string
  right?: string
  bottom?: string
  left?: string
  hide_on_desktop: boolean
  hide_on_tablet: boolean
  hide_on_mobile: boolean
  hide_desktop?: boolean
  hide_tablet?: boolean
  hide_mobile?: boolean
  responsive?: Record<string, Record<string, string>>
  animation_type: string
  animation_duration: string
  animation_delay: string
  animation_entrance?: string
  vertical_scroll?: boolean
  vertical_scroll_speed?: number
  vertical_scroll_dir?: string
  opacity_scroll?: boolean
  scale_scroll?: boolean
  mouse_tilt?: boolean
  custom_css: string
  custom_class: string
  html_id: string
  aria_label: string
  hover: Record<string, unknown>
  style?: Record<string, unknown>
}

interface PageRendererProps {
  pageId: string
  product?: Product
  className?: string
}

export default function PageRenderer({ pageId, product, className }: PageRendererProps) {
  const [sections, setSections] = useState<SectionData[]>([])
  const [containers, setContainers] = useState<Record<string, ContainerData[]>>({})
  const [widgets, setWidgets] = useState<Record<string, WidgetData[]>>({})
  const [pageStyles, setPageStyles] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pageId) return
    setLoading(true)

    async function loadPage() {
      // 1. Load page meta/styles
      const { data: pageMeta } = await supabase
        .from('pages')
        .select('page_styles')
        .eq('id', pageId)
        .maybeSingle()

      if (pageMeta?.page_styles && typeof pageMeta.page_styles === 'object') {
        const customCss = (pageMeta.page_styles as any).custom_css || ''
        setPageStyles(customCss)
      }

      // 2. Load sections
      const { data: sectionsData } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_id', pageId)
        .order('order')

      if (!sectionsData) {
        setLoading(false)
        return
      }

      setSections(sectionsData)

      // 3. Load containers
      const sectionIds = sectionsData.map((s) => s.id)
      const { data: containersData } = await supabase
        .from('page_containers')
        .select('*')
        .in('section_id', sectionIds)
        .order('order')

      if (!containersData) {
        setLoading(false)
        return
      }

      const containerMap: Record<string, ContainerData[]> = {}
      for (const c of containersData) {
        if (!containerMap[c.section_id]) containerMap[c.section_id] = []
        containerMap[c.section_id].push(c)
      }
      setContainers(containerMap)

      // 4. Load widgets
      const containerIds = containersData.map((c) => c.id)
      const { data: widgetsData } = await supabase
        .from('page_widgets')
        .select('*')
        .in('container_id', containerIds)
        .order('order')

      const widgetMap: Record<string, WidgetData[]> = {}
      if (widgetsData) {
        for (const w of widgetsData) {
          if (!widgetMap[w.container_id]) widgetMap[w.container_id] = []
          widgetMap[w.container_id].push(w)
        }
      }
      setWidgets(widgetMap)
      setLoading(false)
    }

    loadPage()
  }, [pageId])

  // Initialize runtime motion effects after rendering
  useEffect(() => {
    if (!loading && sections.length > 0) {
      const cleanup = initMotionEffectsRuntime()
      return cleanup
    }
  }, [loading, sections, widgets])

  if (loading) {
    return (
      <div className="page-renderer-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="page-renderer-empty" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ color: '#6e6e73', fontSize: 16 }}>Nenhum conteúdo configurado para esta página.</p>
      </div>
    )
  }

  // Build tree for compiler
  const fullSectionsTree = sections.map((sec) => ({
    ...sec,
    containers: (containers[sec.id] || []).map((con) => ({
      ...con,
      widgets: widgets[con.id] || [],
    })),
  }))

  const compiledCSS = generateCompiledCSS(fullSectionsTree, pageStyles, pageId)

  return (
    <div className={`page-renderer ${className || ''}`}>
      {compiledCSS && <style dangerouslySetInnerHTML={{ __html: compiledCSS }} />}
      {sections.map((section) => {
        const isHideDesktop = section.hide_on_desktop || section.hide_desktop
        const isHideTablet = section.hide_on_tablet || section.hide_tablet
        const isHideMobile = section.hide_on_mobile || section.hide_mobile

        if (isHideDesktop && isHideTablet && isHideMobile) return null

        const visibilityClasses = [
          isHideDesktop ? 'teknix-hide-desktop' : '',
          isHideTablet ? 'teknix-hide-tablet' : '',
          isHideMobile ? 'teknix-hide-mobile' : '',
        ].filter(Boolean).join(' ')

        const sectionContainers = containers[section.id] || []

        return (
          <section
            key={section.id}
            data-section-id={section.id}
            className={`${section.custom_class || ''} ${visibilityClasses}`.trim()}
            style={computeSectionStyles(section, 'desktop')}
          >
            <div style={{
              width: '100%',
              maxWidth: section.max_width || '1200px',
              margin: '0 auto',
              padding: '0 24px',
              display: 'flex',
              flexDirection: (section.direction as any) || (sectionContainers.length > 1 ? 'row' : 'column'),
              gap: section.gap || '24px',
              flexWrap: 'wrap',
              alignItems: 'stretch',
              boxSizing: 'border-box'
            }}>
              {sectionContainers.map((container) => {
                const isBoxed = container.content_width !== 'full'
                const conHideDesktop = container.hide_on_desktop || container.hide_desktop
                const conHideTablet = container.hide_on_tablet || container.hide_tablet
                const conHideMobile = container.hide_on_mobile || container.hide_mobile

                if (conHideDesktop && conHideTablet && conHideMobile) return null

                const conVisibilityClasses = [
                  conHideDesktop ? 'teknix-hide-desktop' : '',
                  conHideTablet ? 'teknix-hide-tablet' : '',
                  conHideMobile ? 'teknix-hide-mobile' : '',
                ].filter(Boolean).join(' ')

                const containerWidgets = widgets[container.id] || []

                return (
                  <div
                    key={container.id}
                    data-container-id={container.id}
                    className={`e-con ${isBoxed ? 'e-con-boxed' : 'e-con-full'} ${container.custom_class || ''} ${conVisibilityClasses}`.trim()}
                    style={computeContainerOuterStyles(container, 'desktop')}
                  >
                    <div
                      data-container-inner-id={container.id}
                      className="e-con-inner"
                      style={computeContainerInnerStyles(container, 'desktop')}
                    >
                      {containerWidgets.map((widget) => {
                        const wHideDesktop = widget.hide_on_desktop || widget.hide_desktop
                        const wHideTablet = widget.hide_on_tablet || widget.hide_tablet
                        const wHideMobile = widget.hide_on_mobile || widget.hide_mobile

                        if (wHideDesktop && wHideTablet && wHideMobile) return null

                        const wVisibilityClasses = [
                          wHideDesktop ? 'teknix-hide-desktop' : '',
                          wHideTablet ? 'teknix-hide-tablet' : '',
                          wHideMobile ? 'teknix-hide-mobile' : '',
                          widget.position === 'fixed' ? 'teknix-fixed-element' : '',
                          widget.position === 'sticky' ? 'teknix-sticky-element' : '',
                        ].filter(Boolean).join(' ')

                        const anim = widget.animation_entrance || widget.animation_type
                        const isScroll = widget.vertical_scroll || (widget as any).onepage_scroll
                        const isTilt = widget.mouse_tilt

                        return (
                          <div
                            key={widget.id}
                            data-widget-id={widget.id}
                            className={`${widget.custom_class || ''} ${wVisibilityClasses}`.trim()}
                            style={computeWidgetStyles(widget, 'desktop')}
                            data-teknix-entrance={anim && anim !== 'none' ? anim : undefined}
                            data-teknix-duration={widget.animation_duration || undefined}
                            data-teknix-delay={widget.animation_delay || undefined}
                            data-teknix-scroll={isScroll ? 'true' : undefined}
                            data-teknix-vspeed={widget.vertical_scroll_speed || '4'}
                            data-teknix-vdir={widget.vertical_scroll_dir || 'up'}
                            data-teknix-opacity-scroll={widget.opacity_scroll ? 'true' : undefined}
                            data-teknix-scale-scroll={widget.scale_scroll ? 'true' : undefined}
                            data-teknix-tilt={isTilt ? 'true' : undefined}
                          >
                            <WidgetRenderer
                              widget={{
                                id: widget.id,
                                container_id: widget.container_id,
                                type: widget.type,
                                order: widget.order,
                                content: widget.content,
                                style: computeWidgetStyles(widget, 'desktop'),
                              }}
                              product={product}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
