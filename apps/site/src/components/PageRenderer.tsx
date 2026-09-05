import { PageWidgets, Editable, useWidgetEdit, usePageWidgetState } from './page-widgets/PageWidgets'
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
import { evaluateDisplayConditions, type DisplayCondition } from '../services/displayConditions'


export interface PageData {
  id: string
  title: string
  slug: string
  status: string
  type?: string
  theme_id?: string
  hide_header?: boolean
  hide_footer?: boolean
  meta_title?: string
  meta_description?: string
  display_conditions?: DisplayCondition[]
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
  display_conditions?: Array<{
    id: string
    type: 'include' | 'exclude'
    target: 'entire_site' | 'archives' | 'singular'
    subTarget?: string
    specificId?: string
  }>
}

interface PageRendererProps {
  pageId: string
  previewData?: any
  product?: Product
  className?: string
  disablePageHeaderFooter?: boolean
}

function ExistingWidget({ widget, ...props }: any) {
  const edit = useWidgetEdit(widget.id)
  const merged = { ...widget, ...edit?.schema, style: { ...widget.style, ...edit?.schema?.style, ...edit?.style }, content: { ...widget.content, ...edit?.content } }
  return <Editable renderContent={false} widgetId={widget.id} label={widget.type} content={widget.content} style={{ display: 'contents' }}><WidgetRenderer widget={merged} {...props} /></Editable>
}
export default function PageRenderer(props: PageRendererProps) {
  return <PageWidgets key={props.pageId} scope={`page:${props.pageId}`}><PageRendererContent {...props} /></PageWidgets>
}
function PageRendererContent({ pageId, product, className, previewData }: PageRendererProps) {
  const [sourceSections, setSections] = useState<SectionData[]>([])
  const [sourceContainers, setContainers] = useState<Record<string, ContainerData[]>>({})
  const [sourceWidgets, setWidgets] = useState<Record<string, WidgetData[]>>({})
  const [pageStyles, setPageStyles] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadError,setLoadError]=useState('')
  const presentation=usePageWidgetState()
  const viewport=presentation && presentation.width<=767?'mobile':presentation && presentation.width<=1024?'tablet':'desktop'
  const merge=(row:any)=>{const edit=presentation?.edits[row.id];return {...row,...edit?.schema,content:row.content,...(edit?.hidden && !presentation?.preview ? {hide_on_desktop:true,hide_on_tablet:true,hide_on_mobile:true}: {})}}
  const sections=sourceSections.map(merge)
  const containers=Object.fromEntries(Object.entries(sourceContainers).map(([id,rows])=>[id,rows.map(merge)]))
  const widgets=Object.fromEntries(Object.entries(sourceWidgets).map(([id,rows])=>[id,rows.map(merge)]))

  useEffect(() => {
    if (!pageId) return
    setLoading(true);setLoadError('')

    let cancelled = false
    async function loadPage() {
      try {
        let tree = previewData
        if (!tree) {
          const {data,error} = await supabase.from('pages').select('page_styles').eq('id',pageId).eq('status','published').maybeSingle()
          if(error) throw error
          tree = data?.page_styles?.published_snapshot_v2
        }
        if(cancelled) return
        setSections([]);setContainers({});setWidgets({});setPageStyles('')
        if(!tree) return
        const conditions = tree.page?.display_conditions as DisplayCondition[] | undefined
        if(conditions?.length && !evaluateDisplayConditions(conditions,{pathname:window.location.pathname,pageType:tree.page.type,pageId,product:product as any})) return
        setPageStyles(tree.page?.page_styles?.custom_css || '')
        setSections(tree.sections || [])
        setContainers((tree.containers || []).reduce((map:any,c:any) => {(map[c.section_id] ||= []).push(c);return map},{}))
        setWidgets((tree.widgets || []).reduce((map:any,w:any) => {(map[w.container_id] ||= []).push(w);return map},{}))
      } catch(error) {
        if(!cancelled) {setSections([]);setContainers({});setWidgets({});setLoadError('Não foi possível carregar a publicação. Atualize a página para tentar novamente.');console.error('Erro carregando a publicação:',error)}
      } finally {if(!cancelled)setLoading(false)}
    }

    loadPage()
    return () => { cancelled = true }
  }, [pageId, product, previewData])

  // Initialize runtime motion effects after rendering
  useEffect(() => {
    if (!loading && sections.length > 0) {
      const cleanup = initMotionEffectsRuntime()
      return cleanup
    }
  }, [loading, sections, widgets])

  if(loadError)return <p role="alert" style={{padding:32}}>{loadError}</p>
  if (loading) {
    return (
      <div className="page-renderer-seamless-loading" style={{ minHeight: '100vh', background: '#000000', opacity: 0, transition: 'opacity 0.2s ease' }} />
    )
  }

  if (sections.length === 0) {
    return (
      <div className="page-renderer-empty" style={{ textAlign: 'center', padding: '120px 24px', minHeight: '50vh' }}>
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
    <div className={`page-renderer-root ${className || ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── CONTEÚDO PRINCIPAL DA PÁGINA ── */}
      <main style={{ flex: '1 0 auto' }}>
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

        const sStyle = computeSectionStyles(section, viewport)
        const secBgOverlay = (section as any).bg_overlay || (section as any).settings?.bg_overlay
        const secBgOpacity = (section as any).bg_opacity !== undefined
          ? (Number((section as any).bg_opacity) > 1 ? Number((section as any).bg_opacity) / 100 : Number((section as any).bg_opacity))
          : ((section as any).settings?.bg_opacity !== undefined ? (Number((section as any).settings?.bg_opacity) > 1 ? Number((section as any).settings?.bg_opacity) / 100 : Number((section as any).settings?.bg_opacity)) : 0.5)
        const secBlendMode = (section as any).bg_overlay_blend_mode || (section as any).blend_mode || (section as any).settings?.bg_overlay_blend_mode

        return (
          <Editable as="section" widgetId={section.id} label="Seção" editorKind="section" content={{}}
            key={section.id}
            data-section-id={section.id}
            className={`teknix-section ${section.custom_class || ''} ${visibilityClasses}`.trim()}
            style={{ ...sStyle, position: 'relative' }}
          >
            {/* Background Overlay */}
            {secBgOverlay && secBgOverlay !== 'transparent' && (
              <div
                className="elementor-background-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: secBgOverlay,
                  opacity: secBgOpacity,
                  mixBlendMode: (secBlendMode as any) || 'normal',
                  pointerEvents: 'none',
                  zIndex: 0,
                  borderRadius: sStyle.borderRadius || 0
                }}
              />
            )}

            <div
              className="section-containers section-containers-wrap"
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: section.layout === 'full' ? '100%' : (section.max_width || '1200px'),
                margin: '0 auto',
                padding: section.layout === 'full' ? '0' : '0 24px',
                display: 'flex',
                flexDirection: (section.direction as any) || (sectionContainers.length > 1 ? 'row' : 'column'),
                gap: section.gap || '24px',
                alignItems: ((section as any).align_items as any) || 'stretch',
                justifyContent: ((section as any).justify_content as any) || 'flex-start',
                boxSizing: 'border-box'
              }}
            >
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
                const conOuterStyles = computeContainerOuterStyles(container, viewport)
                const conBgOverlay = (container as any).bg_overlay || (container as any).settings?.bg_overlay
                const conBgOpacity = (container as any).bg_opacity !== undefined
                  ? (Number((container as any).bg_opacity) > 1 ? Number((container as any).bg_opacity) / 100 : Number((container as any).bg_opacity))
                  : ((container as any).settings?.bg_opacity !== undefined ? (Number((container as any).settings?.bg_opacity) > 1 ? Number((container as any).settings?.bg_opacity) / 100 : Number((container as any).settings?.bg_opacity)) : 0.5)
                const conBlendMode = (container as any).bg_overlay_blend_mode || (container as any).blend_mode || (container as any).settings?.bg_overlay_blend_mode

                return (
                  <Editable as="div" widgetId={container.id} label="Contêiner" editorKind="container" content={{}}
                    key={container.id}
                    data-container-id={container.id}
                    className={`e-con ${isBoxed ? 'e-con-boxed' : 'e-con-full'} ${container.custom_class || ''} ${conVisibilityClasses}`.trim()}
                    style={{
                      ...conOuterStyles,
                      position: 'relative',
                      minWidth: 0,
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Container Background Overlay */}
                    {conBgOverlay && conBgOverlay !== 'transparent' && (
                      <div
                        className="elementor-background-overlay"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: conBgOverlay,
                          opacity: conBgOpacity,
                          mixBlendMode: (conBlendMode as any) || 'normal',
                          pointerEvents: 'none',
                          zIndex: 0,
                          borderRadius: conOuterStyles.borderRadius || 0
                        }}
                      />
                    )}

                    <div
                      data-container-inner-id={container.id}
                      className="e-con-inner"
                      style={{ ...computeContainerInnerStyles(container, viewport), position: 'relative', zIndex: 1 }}
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

                        const customW = (widget as any).width || (widget as any).settings?.width || (widget as any).style?.width || ''
                        const dirVal = container.direction || (container as any).settings?.direction || 'column'
                        const isRow = dirVal === 'row'

                        const computedWidgetStyle = computeWidgetStyles(widget, viewport)
                        const isPositioned = computedWidgetStyle.position === 'absolute' || computedWidgetStyle.position === 'fixed' || computedWidgetStyle.position === 'sticky'
                        const cAlign = container.align_items || 'stretch'

                        return (
                          <div
                            key={widget.id}
                            data-widget-id={widget.id}
                            className={`${widget.custom_class || ''} ${wVisibilityClasses}`.trim()}
                            style={{
                              ...computedWidgetStyle,
                              position: (computedWidgetStyle.position as any) || 'relative',
                              top: computedWidgetStyle.top,
                              right: computedWidgetStyle.right,
                              bottom: computedWidgetStyle.bottom,
                              left: computedWidgetStyle.left,
                              zIndex: computedWidgetStyle.zIndex,
                              alignSelf: computedWidgetStyle.alignSelf,
                              order: computedWidgetStyle.order,
                              flexGrow: computedWidgetStyle.flexGrow,
                              transform: computedWidgetStyle.transform,
                              width: isPositioned
                                ? (computedWidgetStyle.width || 'auto')
                                : (container.display_type === 'grid'
                                  ? 'auto'
                                  : (computedWidgetStyle.width && computedWidgetStyle.width !== '100%'
                                    ? computedWidgetStyle.width
                                    : (customW
                                      ? customW
                                      : (isRow
                                        ? 'auto'
                                        : (computedWidgetStyle.alignSelf && computedWidgetStyle.alignSelf !== 'stretch' && computedWidgetStyle.alignSelf !== 'auto'
                                          ? 'auto'
                                          : (cAlign === 'stretch' ? '100%' : 'auto')))))),
                              flex: isPositioned
                                ? undefined
                                : (isRow ? (customW ? `0 0 ${customW}` : (computedWidgetStyle.flexGrow ? `${computedWidgetStyle.flexGrow} 1 auto` : '0 0 auto')) : undefined),
                              maxWidth: isPositioned ? (computedWidgetStyle.maxWidth || undefined) : (isRow && customW ? customW : undefined),
                              boxSizing: 'border-box',
                            }}
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
                            <ExistingWidget
                              widget={{
                                ...widget,
                                content: widget.content,
                                style: computeWidgetStyles(widget, viewport),
                              }}
                              product={product}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </Editable>
                )
              })}
            </div>
          </Editable>
        )
      })}
      </main>

    </div>
  )
}
