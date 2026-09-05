import {Children,isValidElement,useEffect,useMemo,useState,type ReactNode} from 'react'
import {Editable,usePageWidgetState,useWidgetEdit} from './PageWidgets'
import {type CanvasNode,type CanvasLayout} from '../../../../../packages/core/src/pageWidgets'
import CatalogWidget from './CatalogWidget'
import WidgetRenderer from '../WidgetRenderer'
import {Ads} from '../Ads'
import {FlowContext, type FlowContextValue} from './FlowContext'
import ElementorAddSection from './ElementorAddSection'
import './EditableFlow.css'
import { computeWidgetStyles } from '../../services/styleEngine'

export {FlowContext, type FlowContextValue}
export {useFlowContext} from './FlowContext'

// Sincronização global do tipo de widget arrastado a partir da sidebar do Hub
let globalDraggedWidgetType: string | null = null
let dragClearTimeout: any = null
const globalFlowSources = new Map<string, { element: ReactNode; node: CanvasNode }>()
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'teknix:drag-start') {
      if (dragClearTimeout) clearTimeout(dragClearTimeout)
      globalDraggedWidgetType = event.data.widgetType || null
      ;(window as any).__teknixActiveDragWidget = event.data.widgetType || null
    }
    if (event.data?.type === 'teknix:drag-end') {
      if (dragClearTimeout) clearTimeout(dragClearTimeout)
      dragClearTimeout = setTimeout(() => {
        globalDraggedWidgetType = null
        ;(window as any).__teknixActiveDragWidget = null
      }, 3000)
    }
  })
}

export default function EditableFlow({
  id,
  label,
  children,
  globalKey,
  compact = false,
  as: Component,
  className,
  style,
  ...restProps
}: {
  id: string
  label: string
  children: ReactNode
  globalKey?: string
  compact?: boolean
  as?: any
  className?: string
  style?: React.CSSProperties
  [key: string]: any
}) {
  const ctx = usePageWidgetState()
  const edit = useWidgetEdit(`layout:${id}`, globalKey)
  const [dragTarget, setDragTarget] = useState<{ id: string; position: 'before' | 'after' | 'inside' } | null>(null)
  const [openAddSectionFor, setOpenAddSectionFor] = useState<string | null>(null)
  const entries = Children.toArray(children).filter(isValidElement)
  const sources = new Map(entries.map((node: any, i) => {
    const position = node.props.position
    const key = position ? `ads:${position}` : String(node.props.widgetId || node.key || i)
    const name = position ? `Anúncio: ${position}` : node.props['aria-label'] || node.props.label || node.props.editorLabel || node.type.editorLabel || node.props.id || node.props.className || `${label} · ${i + 1}`
    return [key, { element: node, node: { id: `${id}:${key}`, source: key, label: name, ...(position ? { adPlacement: position } : {}) } as CanvasNode }] as const
  }))
  for (const source of sources.values()) globalFlowSources.set(source.node.id, source)
  const signature = JSON.stringify([...sources.values()].map(source => source.node))
  const initial = useMemo<CanvasLayout>(() => ({ nodes: JSON.parse(signature) }), [signature])
  const layout: CanvasLayout = edit?.tree || initial
  useEffect(() => ctx?.register({ id: `layout:${id}`, label, kind: 'container', widgetType: 'layoutRegion', globalKey, regionId: id, layout: initial, content: {} }), [ctx?.register, id, label, globalKey, initial])
  function action(actionData: object) { if (ctx?.preview) window.parent.postMessage({ type: 'teknix:layout-action', scope: ctx.scope, regionId: id, globalKey, initial, ...actionData }, import.meta.env.VITE_HUB_URL || 'http://localhost:5174') }
  function autoScroll(clientY: number) {
    const edge = 96
    if (clientY < edge) window.scrollBy({ top: -18, behavior: 'auto' })
    else if (clientY > window.innerHeight - edge) window.scrollBy({ top: 18, behavior: 'auto' })
  }
  function drop(event: React.DragEvent, target?: string, inside = false, position: 'before' | 'after' | 'inside' = 'after') {
    if (!ctx?.preview) return
    event.preventDefault()
    event.stopPropagation()
    setDragTarget(null)
    let payload: any = {}
    try {
      const raw = event.dataTransfer.getData('application/teknix-widget') || event.dataTransfer.getData('text/plain')
      if (raw) {
        if (raw.trim().startsWith('{')) payload = JSON.parse(raw)
        else payload = { widgetType: raw.trim() }
      }
    } catch { /* cross-origin fallback */ }
    let parentDrag: string | null = null
    try {
      parentDrag = (window.parent as any)?.__teknixGlobalDrag || null
    } catch {}
    const activeType = payload.widgetType || globalDraggedWidgetType || (window as any).__teknixActiveDragWidget || parentDrag
    if (payload.nodeId && payload.regionId === id) {
      action({ action: 'move', nodeId: payload.nodeId, target, inside, position })
    } else if (payload.nodeId && payload.regionId) {
      action({ action: 'move-cross-region', nodeId: payload.nodeId, sourceRegionId: payload.regionId, target, inside, position })
    } else if (activeType) {
      action({ action: 'insert', widgetType: activeType, target, inside, position })
    }
    setTimeout(() => {
      globalDraggedWidgetType = null
      ;(window as any).__teknixActiveDragWidget = null
    }, 250)
  }
  function computeNodeFlexStyle(node: CanvasNode, parentLayout?: { direction?: string; gap?: string; type?: string }): React.CSSProperties {
    // Native elements already own their sizing and responsive visibility.
    // A box here would reserve space even when its child is hidden.
    if (node.source && !parentLayout) return { display: 'contents' }
    if (parentLayout?.type === 'grid') {
      return { width: '100%', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }
    }
    const isRow = parentLayout?.direction?.startsWith('row')
    if (!isRow) {
      return { width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }
    }
    const w = (node.content?.width || (node as any).schema?.width) as string | undefined
    const f = (node.content?.flex || (node as any).schema?.flex) as string | undefined
    const gap = parentLayout?.gap || '16px'

    if (typeof w === 'string' && w.includes('%')) {
      const pct = parseFloat(w)
      if (pct >= 99) {
        return { flex: '1 1 100%', width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }
      }
      const gapDeduction = `(${gap} * ${((100 - pct) / 100).toFixed(2)})`
      const calcWidth = `calc(${w} - ${gapDeduction})`
      return {
        flex: f ? `${f} ${f} ${calcWidth}` : `1 1 ${calcWidth}`,
        width: calcWidth,
        maxWidth: calcWidth,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }
    }
    if (f) {
      return { flex: `${f} ${f} 0%`, minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }
    }
    return { flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }
  }

  function render(nodes: CanvasNode[], parentLayout?: { direction?: string; gap?: string; type?: string }): ReactNode {
    return nodes.map(node => {
      const source = node.source ? (sources.get(node.source) || globalFlowSources.get(node.id)) : undefined
      if (node.source && !source) return null
      if (node.hidden && !ctx?.preview) return null
      const isTarget = dragTarget?.id === node.id
      const isOpenAddSection = openAddSectionFor === node.id
      const isSelected = ctx?.preview && (ctx.selected === node.id || ctx.selected === node.source || (node.source && ctx.selected === `layout:${id}`))
      const flexStyle = computeNodeFlexStyle(node, parentLayout)
      return (
        <div key={node.id} style={{ display: 'contents' }}>
          {ctx?.preview && isOpenAddSection && (
            <div className="elementor-inline-add-section-wrap">
              <ElementorAddSection
                initialView="select-type"
                onClose={() => setOpenAddSectionFor(null)}
                onInsertContainer={(presetNode) => {
                  action({
                    action: 'insert',
                    widgetType: presetNode.type,
                    content: presetNode.content,
                    children: presetNode.children,
                    label: presetNode.label,
                    target: node.id,
                    position: 'before'
                  })
                  setOpenAddSectionFor(null)
                }}
                onChooseWidget={() => {
                  action({ action: 'choose', target: node.id, position: 'before' })
                  setOpenAddSectionFor(null)
                }}
                onDropWidget={(e) => {
                  drop(e, node.id, false, 'before')
                  setOpenAddSectionFor(null)
                }}
              />
            </div>
          )}
          {ctx?.preview && isTarget && dragTarget.position === 'before' && (
            <div className="editor-flow-drop-line" />
          )}
          <div
            className={ctx?.preview ? 'editor-flow-node' : 'published-flow-node'}
            style={{
              ...flexStyle,
              ...(node.hidden ? { opacity: 0.3 } : {})
            }}
            data-canvas-node={node.id}
            data-editor-selected={isSelected ? 'true' : undefined}
            onDragOver={ctx?.preview ? event => {
              event.preventDefault()
              event.stopPropagation()
              autoScroll(event.clientY)
              event.dataTransfer.dropEffect = 'copy'
              const isContainer = node.type === 'container' || node.type === 'grid'
              if (isContainer) {
                setDragTarget({ id: node.id, position: 'inside' })
                return
              }
              const rect = event.currentTarget.getBoundingClientRect()
              const relY = event.clientY - rect.top
              if (relY <= rect.height / 2) {
                setDragTarget({ id: node.id, position: 'before' })
              } else {
                setDragTarget({ id: node.id, position: 'after' })
              }
            } : undefined}
            onDragLeave={ctx?.preview ? event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setDragTarget(null)
              }
            } : undefined}
            onDrop={event => {
              event.preventDefault()
              event.stopPropagation()
              const isContainer = node.type === 'container' || node.type === 'grid'
              const isInside = isContainer || (dragTarget?.id === node.id && dragTarget.position === 'inside')
              const pos = isInside ? 'inside' : (dragTarget?.id === node.id ? dragTarget.position : 'after')
              drop(event, node.id, isInside, pos)
            }}
            draggable={ctx?.preview}
            onDragStart={ctx?.preview ? event => {
              event.stopPropagation()
              event.dataTransfer.setData('application/teknix-widget', JSON.stringify({ nodeId: node.id, regionId: id }))
              event.dataTransfer.effectAllowed = 'move'
            } : undefined}
            onClickCapture={ctx?.preview ? event => {
              if ((event.target as HTMLElement).closest('[data-widget-key]') && (event.target as HTMLElement).closest('[data-widget-key]') !== event.currentTarget) return
              event.preventDefault()
              event.stopPropagation()
              ctx.select(node.source ? `layout:${id}` : node.id)
              action({ action: 'select', nodeId: node.id })
            } : undefined}
            onContextMenuCapture={ctx?.preview ? event => {
              event.preventDefault()
              event.stopPropagation()
              ctx.select(node.source ? `layout:${id}` : node.id)
              action({ action: 'select', nodeId: node.id })
              window.parent.postMessage({
                type: 'teknix:contextmenu',
                scope: ctx.scope,
                id: node.id,
                regionId: id,
                clientX: event.clientX,
                clientY: event.clientY,
                label: node.label,
                kind: node.type === 'container' || node.type === 'grid' ? 'container' : 'widget',
                global: !!globalKey
              }, import.meta.env.VITE_HUB_URL || 'http://localhost:5174')
            } : undefined}
          >
            {ctx?.preview && !compact && !id.includes('header') && !id.includes('footer') && !node.id.startsWith('chrome:') && (
              <div className={`elementor-section-handle-tab ${isOpenAddSection ? 'is-active' : ''}`}>
                <button
                  type="button"
                  className="elementor-section-handle-btn elementor-section-handle-add"
                  title="Adicionar Seção acima"
                  aria-label="Adicionar Seção acima"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpenAddSectionFor(prev => prev === node.id ? null : node.id)
                  }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2.6" fill="none">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                <div
                  className="elementor-section-handle-btn elementor-section-handle-drag"
                  title="Editar / Mover Seção"
                  aria-label="Editar Seção"
                  draggable
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    ctx.select(node.source ? `layout:${id}` : node.id)
                    action({ action: 'select', nodeId: node.id })
                  }}
                  onDragStart={(e) => {
                    e.stopPropagation()
                    e.dataTransfer.setData('application/teknix-widget', JSON.stringify({ nodeId: node.id, regionId: id }))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <svg viewBox="0 0 20 14" width="16" height="11" fill="currentColor">
                    <circle cx="3" cy="3.5" r="1.6" />
                    <circle cx="10" cy="3.5" r="1.6" />
                    <circle cx="17" cy="3.5" r="1.6" />
                    <circle cx="3" cy="10.5" r="1.6" />
                    <circle cx="10" cy="10.5" r="1.6" />
                    <circle cx="17" cy="10.5" r="1.6" />
                  </svg>
                </div>

                <button
                  type="button"
                  className="elementor-section-handle-btn elementor-section-handle-delete"
                  title="Excluir Seção"
                  aria-label="Excluir Seção"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    action({ action: 'delete', nodeId: node.id })
                  }}
                >
                  <svg viewBox="0 0 14 14" width="10" height="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none">
                    <line x1="2" y1="2" x2="12" y2="12" />
                    <line x1="12" y1="2" x2="2" y2="12" />
                  </svg>
                </button>
              </div>
            )}
            {source ? source.element : (node.type === 'container' || node.type === 'grid') ? <ContainerNode node={node} regionId={id} globalKey={globalKey ? `global:${node.id}` : undefined} renderChildNodes={render} onDrop={drop} onChoose={action} preview={!!ctx?.preview} isDropActive={isTarget && dragTarget.position === 'inside'} parentLayout={parentLayout} /> : node.type === 'ads' ? <Ads position={String(node.content?.placement || 'middle_screen')} /> : <Editable widgetId={node.id} globalKey={globalKey ? `global:${node.id}` : undefined} label={node.label} widgetType={node.type} content={node.content || {}} renderContent={false}><FlowWidget node={node} globalKey={globalKey ? `global:${node.id}` : undefined} /></Editable>}
          </div>
          {ctx?.preview && isTarget && dragTarget.position === 'after' && (
            <div className="editor-flow-drop-line" />
          )}
        </div>
      )
    })
  }

  const renderedContent = (
    <FlowContext.Provider value={{ regionId: id, globalKey, action, drop }}>
      {render(layout.nodes)}
      {ctx?.preview && !compact && (
        <ElementorAddSection
          isEmpty={layout.nodes.length === 0}
          onInsertContainer={(presetNode) => {
            action({
              action: 'insert',
              widgetType: presetNode.type,
              content: presetNode.content,
              children: presetNode.children,
              label: presetNode.label
            })
          }}
          onChooseWidget={() => {
            action({ action: 'choose' })
          }}
          onDropWidget={(e) => drop(e)}
        />
      )}
    </FlowContext.Provider>
  )

  const viewport = (ctx?.width || window.innerWidth) <= 767 ? 'mobile' : (ctx?.width || window.innerWidth) <= 1024 ? 'tablet' : 'desktop'
  const regionStyle = { ...style, ...computeWidgetStyles(edit?.schema, viewport), ...edit?.style }
  if (Component) {
    return (
      <Component className={className} style={regionStyle} {...restProps}>
        {renderedContent}
      </Component>
    )
  }

  return Object.keys(regionStyle).length ? <div style={regionStyle}>{renderedContent}</div> : renderedContent
}

function ContainerNode({ node, globalKey, renderChildNodes, onDrop, onChoose, preview, isDropActive, parentLayout }: any) {
  const ctx = usePageWidgetState()
  const edit = useWidgetEdit(node.id, globalKey)
  const content = { ...node.content, ...edit?.content }
  const schema = { ...node.schema, ...edit?.schema }
  const style = { ...node.style, ...edit?.style }
  const mode = (ctx?.width || window.innerWidth) <= 767 ? 'mobile' : (ctx?.width || window.innerWidth) <= 1024 ? 'tablet' : 'desktop'
  const responsiveLayout = mode === 'desktop' ? {} : (schema.responsive?.[mode] || {})
  const layoutContent = { ...schema, ...content, ...responsiveLayout }

  const formatDim = (val: any, fallbackUnit = 'px') => {
    if (val === undefined || val === null || val === '') return undefined
    const str = String(val).trim()
    if (/^[0-9.-]+$/.test(str)) return `${str}${fallbackUnit}`
    return str
  }

  const Tag = ((layoutContent.tag || schema.tag || 'div').toLowerCase()) as any

  const isChildOfRow = parentLayout?.direction?.startsWith('row')
  const isBoxed = (layoutContent.width_type || schema.width_type || (isChildOfRow ? 'full' : 'boxed')) === 'boxed'
  const customMaxWidth = formatDim(layoutContent.max_width || schema.max_width)
  const minHeightVal = formatDim(layoutContent.min_height || schema.min_height) || (isChildOfRow ? '100px' : '48px')
  const gapVal = formatDim(layoutContent.gap || schema.gap) || '16px'

  // Flexbox values
  const directionVal = (layoutContent.direction || schema.direction || 'column') as any
  const justifyVal = layoutContent.justify || schema.justify || 'flex-start'
  const alignVal = layoutContent.align || schema.align || 'stretch'
  const wrapVal = (layoutContent.wrap || schema.wrap || 'wrap') as any

  // Spacing (margins & paddings)
  const mTop = formatDim(responsiveLayout.margin_top ?? schema.margin_top, schema.margin_unit || 'px')
  const mRight = formatDim(responsiveLayout.margin_right ?? schema.margin_right, schema.margin_unit || 'px')
  const mBottom = formatDim(responsiveLayout.margin_bottom ?? schema.margin_bottom, schema.margin_unit || 'px')
  const mLeft = formatDim(responsiveLayout.margin_left ?? schema.margin_left, schema.margin_unit || 'px')

  const pTop = formatDim(responsiveLayout.padding_top ?? schema.padding_top, schema.padding_unit || 'px')
  const pRight = formatDim(responsiveLayout.padding_right ?? schema.padding_right, schema.padding_unit || 'px')
  const pBottom = formatDim(responsiveLayout.padding_bottom ?? schema.padding_bottom, schema.padding_unit || 'px')
  const pLeft = formatDim(responsiveLayout.padding_left ?? schema.padding_left, schema.padding_unit || 'px')
  const shorthandPadding = responsiveLayout.padding || schema.padding || layoutContent.padding || style.padding

  const hasIndividualPadding = pTop !== undefined || pRight !== undefined || pBottom !== undefined || pLeft !== undefined

  // Background, Border & Shadow
  const bgColor = responsiveLayout.bg_color || schema.bg_color || layoutContent.bg_color || style.backgroundColor
  const bgImg = responsiveLayout.bg_image || schema.bg_image || layoutContent.bg_image
  const borderRadius = responsiveLayout.border_radius ?? schema.border_radius ?? layoutContent.border_radius
  const borderVal = responsiveLayout.border || schema.border || layoutContent.border
  const rawShadow = responsiveLayout.box_shadow || schema.box_shadow || layoutContent.box_shadow
  const shadowVal = (rawShadow && rawShadow !== 'none') ? rawShadow : undefined
  const zIndexVal = responsiveLayout.z_index ?? schema.z_index

  const containerStyle: React.CSSProperties = {
    position: (schema.position as any) || 'relative',
    display: node.type === 'grid' ? 'grid' : 'flex',
    gridTemplateColumns: node.type === 'grid' ? `repeat(${Number(layoutContent.columns) || 2}, minmax(0, 1fr))` : undefined,
    flexDirection: directionVal,
    flexWrap: wrapVal,
    justifyContent: justifyVal,
    alignItems: alignVal,
    gap: gapVal,
    width: '100%',
    maxWidth: isChildOfRow ? undefined : (isBoxed ? (customMaxWidth || '1352px') : (customMaxWidth || '100%')),
    minHeight: minHeightVal,
    marginTop: mTop,
    marginRight: mRight || (isBoxed ? 'auto' : undefined),
    marginBottom: mBottom,
    marginLeft: mLeft || (isBoxed ? 'auto' : undefined),
    paddingTop: hasIndividualPadding ? (pTop || '0px') : undefined,
    paddingRight: hasIndividualPadding ? (pRight || '0px') : undefined,
    paddingBottom: hasIndividualPadding ? (pBottom || '0px') : undefined,
    paddingLeft: hasIndividualPadding ? (pLeft || '0px') : undefined,
    padding: hasIndividualPadding ? undefined : (formatDim(shorthandPadding) || '16px'),
    backgroundColor: bgColor,
    backgroundImage: bgImg ? `url(${bgImg})` : undefined,
    backgroundSize: bgImg ? 'cover' : undefined,
    backgroundPosition: bgImg ? 'center' : undefined,
    borderRadius: borderRadius !== undefined ? formatDim(borderRadius) : undefined,
    border: borderVal || undefined,
    boxShadow: shadowVal,
    zIndex: zIndexVal ? Number(zIndexVal) : undefined,
    boxSizing: 'border-box'
  }

  const hasChildren = node.children && node.children.length > 0

  return (
    <Editable
      widgetId={node.id}
      globalKey={globalKey}
      label={node.label}
      editorKind="container"
      widgetType={node.type || 'container'}
      renderContent={false}
      style={{
        width: '100%',
        height: isChildOfRow ? '100%' : undefined,
        display: 'flex',
        flexDirection: 'column',
        flex: isChildOfRow ? '1 1 auto' : undefined,
        position: 'relative'
      }}
    >
      <Tag
        className={`editor-flow-container-wrap ${isDropActive ? 'editor-flow-container-drop-active' : ''}`}
        style={{
          ...containerStyle,
          height: isChildOfRow ? '100%' : undefined,
          flex: isChildOfRow ? '1 1 auto' : undefined
        }}
        onDragOver={(event: any) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'copy' }}
        onDrop={(event: any) => onDrop(event, node.id, true, 'inside')}
      >
        {hasChildren ? (
          renderChildNodes(node.children, { direction: directionVal, gap: gapVal, type: node.type })
        ) : (
          preview && (
            <div
              className="elementor-empty-view"
              onDragOver={(e: any) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={(e: any) => {
                e.preventDefault()
                e.stopPropagation()
                onDrop(e, node.id, true, 'inside')
              }}
              onClick={(e: any) => {
                e.stopPropagation()
                onChoose({ action: 'choose', target: node.id, inside: true })
              }}
            >
              <div className="elementor-first-add" title="Adicionar widget ou arrastar para cá">
                <div className="elementor-icon eicon-plus">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
              </div>
              {node.type === 'grid' && (
                <div
                  className="e-grid-outline"
                  style={{
                    gridTemplateColumns: `repeat(${node.content?.columns || 2}, 1fr)`,
                    gridTemplateRows: `repeat(${node.content?.rows || 1}, 1fr)`
                  }}
                >
                  {Array.from({ length: (Number(node.content?.columns) || 2) * (Number(node.content?.rows) || 1) }).map((_, i) => (
                    <div key={i} className="e-grid-outline-item" />
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </Tag>
    </Editable>
  )
}
function FlowWidget({node,globalKey}:{node:CanvasNode;globalKey?:string}){
  const edit=useWidgetEdit(node.id,globalKey)
  if(node.type==='storefrontCard'||node.type==='storefrontShelf')return <CatalogWidget id={node.id} content={{...node.content,...edit?.content}} shelf={node.type==='storefrontShelf'}/>
  const aliases:Record<string,string>={imageCarousel:'carousel',basicGallery:'gallery',progress:'progressBar',testimonial:'testimonials',reviews:'testimonials',loopCarousel:'carousel',categoryMosaic:'categories',flashSaleSection:'productGrid'}
  return <WidgetRenderer widget={{id:node.id,type:aliases[node.type||'']||node.type,content:{...node.content,...edit?.content},...edit?.schema,style:{...edit?.schema?.style,...edit?.style}} as any}/>
}
