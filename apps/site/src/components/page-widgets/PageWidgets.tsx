import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, createElement, type ReactNode, type CSSProperties } from 'react'
import { computeWidgetStyles, generateCompiledCSS } from '../../services/styleEngine'
import {useSiteStandards} from './SiteStandards'
import { supabase } from '../../lib/supabase'
import { mergeWidgetEdit, readWidgetEdits, safeMediaUrl, safeStyle, scopeSlug, type WidgetDescriptor, type WidgetEdits } from '../../../../../packages/core/src/pageWidgets'
import { renderDynamicIcon } from '../IconPickerModal'
import { useFlowContext } from './FlowContext'

const Context = createContext<{ edits: WidgetEdits; register: (widget: WidgetDescriptor) => () => void; select: (id: string, global?:boolean) => void; preview: boolean; scope: string; width: number; selected: string } | null>(null)
const hubOrigin = import.meta.env.VITE_HUB_URL || (import.meta.env.DEV ? 'http://localhost:5174' : '')
export function PageWidgets({scope,children}:{scope:string;children:ReactNode}){const parent=useContext(Context);return parent?.scope===scope?<>{children}</>:<PageWidgetsProvider scope={scope}>{children}</PageWidgetsProvider>}
function PageWidgetsProvider({ scope, children }: { scope: string; children: ReactNode }) {
  const [edits, setEdits] = useState<WidgetEdits>({})
  const [width, setWidth] = useState(window.innerWidth)
  const [selected,setSelected]=useState('')
  useEffect(() => { const resize = () => setWidth(window.innerWidth); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, [])
  const registry = useRef(new Map<string, WidgetDescriptor>())
  const preview = !!hubOrigin && window.parent !== window && new URLSearchParams(window.location.search).get('widgetPreview') === '1'
  const sendTimerRef = useRef<any>(null)
  const lastPublishedSigRef = useRef<string>('')

  const send = useCallback(() => {
    if (!preview) return
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current)
    sendTimerRef.current = setTimeout(() => {
      const widgets = [...registry.current.values()].filter(w =>
        !w.id.startsWith('header-') && !w.id.startsWith('footer-') && !w.id.startsWith('internal:') && !w.id.includes('-repeat')
      )
      const sig = widgets.map(w => `${w.id}:${w.label}:${w.widgetType}`).join('|')
      if (sig === lastPublishedSigRef.current) return
      lastPublishedSigRef.current = sig
      window.parent.postMessage({ type: 'teknix:widgets', scope, widgets }, hubOrigin)
    }, 50)
  }, [preview, scope])

  useEffect(() => {
    return () => {
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let query = supabase.from('pages').select('page_styles').eq('status', 'published')
    query = scope === 'native:/' ? query.in('slug',['/','']).limit(1) : scope.startsWith('page:') ? query.eq('id', scope.slice(5)) : query.eq('slug', scopeSlug(scope))
    query.maybeSingle().then(({ data }) => {
      if (cancelled) return
      if (!preview && data) {
        const raw = data.page_styles?.published_snapshot_v2?.page?.page_styles || data.page_styles?.published_snapshot_v2?.page_styles || data.page_styles
        let parsed = readWidgetEdits(raw)
        if (!parsed || Object.keys(parsed).length === 0) {
          parsed = readWidgetEdits(data.page_styles)
        }
        setEdits(parsed || {})
      }
    })
    return () => { cancelled = true }
  }, [scope, preview])
  useEffect(() => {
    if (!preview) return
    const receive = (event: MessageEvent) => {
      if (event.origin !== hubOrigin || event.source !== window.parent || event.data?.scope !== scope) return
      if (event.data.type === 'teknix:patches') {
        const incoming = event.data.edits || {}
        setEdits(prev => (JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming))
        const pageBg = incoming['page:settings']?.content?.page_bg || incoming['page:settings']?.style?.background
        if (pageBg) {
          document.body.style.backgroundColor = pageBg
        }
      }
      if (event.data.type === 'teknix:page-bg') {
        if (event.data.bg) {
          document.body.style.backgroundColor = event.data.bg
        }
      }
      if (event.data.type === 'teknix:inspect') send()
      if (event.data.type === 'teknix:focus') {
        setSelected(event.data.id)
        const element = [...document.querySelectorAll('[data-widget-key]')].find(el => el.getAttribute('data-widget-key') === `pw-${encodeURIComponent(scope).replace(/%/g, '-')}-${String(event.data.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`)
        element?.scrollIntoView({block:'center',behavior:'smooth'})
      }
    }
    window.addEventListener('message', receive)
    send()
    return () => window.removeEventListener('message', receive)
  }, [preview, scope, send])
  useEffect(() => {
    if (!preview) return
    const preventNavigation = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.('a')
      if (anchor && !anchor.getAttribute('href')?.startsWith('#')) event.preventDefault()
    }
    const preventSubmit = (event: Event) => event.preventDefault()
    const handleCanvasClick = () => {
      window.parent.postMessage({ type: 'teknix:canvas-click' }, hubOrigin)
    }
    const handleCanvasContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const targetEl = (event.target as HTMLElement)?.closest?.('[data-widget-key], [data-canvas-node], [data-widget-id]')
      let targetId = ''
      let targetLabel = ''
      let targetKind = 'widget'
      let isGlobal = false

      if (targetEl) {
        const canvasNodeId = targetEl.getAttribute('data-canvas-node')
        const widgetKey = targetEl.getAttribute('data-widget-key')
        const explicitId = targetEl.getAttribute('data-widget-id')
        targetId = canvasNodeId || explicitId || ''

        if (!targetId && widgetKey) {
          for (const [id, desc] of registry.current.entries()) {
            const token = `pw-${encodeURIComponent(scope).replace(/%/g, '-')}-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
            if (token === widgetKey) {
              targetId = id
              targetLabel = desc.label || ''
              targetKind = desc.kind || 'widget'
              isGlobal = !!desc.globalKey
              break
            }
          }
        }
        if (targetId && !targetLabel) {
          const desc = registry.current.get(targetId)
          if (desc) {
            targetLabel = desc.label || ''
            targetKind = desc.kind || 'widget'
            isGlobal = !!desc.globalKey
          }
        }
      }

      if (targetId) {
        setSelected(targetId)
      }

      window.parent.postMessage({
        type: 'teknix:contextmenu',
        scope,
        id: targetId,
        clientX: event.clientX,
        clientY: event.clientY,
        label: targetLabel,
        kind: targetKind,
        global: isGlobal
      }, hubOrigin)
    }
    document.addEventListener('click', preventNavigation, true)
    document.addEventListener('click', handleCanvasClick, false)
    document.addEventListener('submit', preventSubmit, true)
    document.addEventListener('contextmenu', handleCanvasContextMenu, true)
    return () => {
      document.removeEventListener('click', preventNavigation, true)
      document.removeEventListener('click', handleCanvasClick, false)
      document.removeEventListener('submit', preventSubmit, true)
      document.removeEventListener('contextmenu', handleCanvasContextMenu, false)
    }
  }, [preview, scope])
  const register = useCallback((widget: WidgetDescriptor) => {
    const existing = registry.current.get(widget.id)
    if (existing &&
        existing.label === widget.label &&
        existing.widgetType === widget.widgetType &&
        existing.kind === widget.kind &&
        existing.globalKey === widget.globalKey &&
        existing.regionId === widget.regionId &&
        JSON.stringify(existing.content || {}) === JSON.stringify(widget.content || {})) {
      return () => {}
    }
    registry.current.set(widget.id, widget)
    send()
    return () => { registry.current.delete(widget.id); send() }
  }, [send])
  const select = useCallback((id: string, global=false) => {
    setSelected(id)
    if (preview) window.parent.postMessage({ type: 'teknix:select', scope, id, global }, hubOrigin)
  }, [preview, scope])
  const value = useMemo(() => ({ edits, register, select, preview, scope, width, selected }), [edits, register, select, preview, scope, width, selected])
  return <Context.Provider value={value}>{preview && <style>{`[data-widget-key]:hover:not(:has([data-widget-key]:hover)){outline:1px solid #db468e;outline-offset:2px;cursor:pointer}[data-editor-selected="true"],[data-editor-selected="true"] > :first-child{outline:1px solid #db468e;outline-offset:2px}`}</style>}{children}</Context.Provider>
}
export function usePageWidgetState() { return useContext(Context) }
export function useWidgetEdit(id: string, globalKey?: string) {
  const standards = useSiteStandards()
  const ctx = useContext(Context)
  const globalBase = (globalKey && standards[globalKey]) || standards[id]
  const local = ctx?.edits[id]
  const edit = globalBase || local ? mergeWidgetEdit(globalBase, local) : undefined
  return edit ? { ...edit, schema: edit.schema, style: safeStyle({ ...edit.style, ...((ctx?.width || window.innerWidth) <= 1024 ? edit.responsive?.tablet : {}), ...((ctx?.width || window.innerWidth) <= 767 ? edit.responsive?.mobile : {}) }) } : undefined
}

function scopeIsBuilder(scope?:string){return !!scope?.startsWith('page:')}

function extractTextFromChildren(node: any): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join('')
  if (typeof node === 'object' && node.props && node.props.children) return extractTextFromChildren(node.props.children)
  return ''
}

/** Keeps the original HTML tag, classes, handlers and live commerce behavior. */
export function Editable({ as = 'div', widgetId, label, children, content, style, editorKind, editorSchema, globalKey, productId, widgetType, locked=false, renderContent = true, ...props }: {
  globalKey?:string;productId?:string;widgetType?:string;locked?:boolean;renderContent?: boolean; editorKind?: 'widget' | 'section' | 'container'; editorSchema?: Record<string,any>; as?: any; widgetId: string; label?: string; children?: ReactNode; content?: Record<string, unknown>; style?: CSSProperties; [key: string]: any
}) {
  const ctx = useContext(Context)
  const standards = useSiteStandards()
  const flow = useFlowContext()
  const [unlocked, setUnlocked] = useState(!locked)
  const [dropIndicator, setDropIndicator] = useState<'before' | 'after' | 'inside' | null>(null)
  const token = `pw-${encodeURIComponent(ctx?.scope || '').replace(/%/g, '-')}-${widgetId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const globalBase = (globalKey && standards[globalKey]) || standards[widgetId]
  const matchedEdit = ctx?.edits[widgetId] || (token ? ctx?.edits[token] : undefined)
  const edit = globalBase || matchedEdit ? mergeWidgetEdit(globalBase, matchedEdit) : undefined
  const width = ctx?.width || window.innerWidth
  const extractedText = extractTextFromChildren(children)
  const rawBase: Record<string, unknown> = content || (as === 'img' ? { src: props.src || '', alt: props.alt || '' } : extractedText ? { text: extractedText } : typeof children === 'string' || typeof children === 'number' ? { text: String(children) } : {})
  const signature = JSON.stringify(rawBase)
  const base: Record<string, unknown> = useMemo(() => JSON.parse(signature), [signature])
  const register = ctx?.register
  const widgetLabel = label || `${({ img: 'Imagem', input: 'Campo', textarea: 'Campo de texto', label: 'Rótulo', h1: 'Título principal', h2: 'Título', h3: 'Subtítulo', p: 'Texto', button: 'Botão', section: 'Área', div: 'Área', span: 'Texto' } as Record<string, string>)[as] || as}: ${String(base.text || base.alt || props.id || widgetId).slice(0, 65)}`
  useEffect(() => register?.({ id: widgetId, label: widgetLabel, content: base, kind:editorKind, globalKey, productId, regionId: flow?.regionId, widgetType:widgetType || (as === 'img' ? 'image' : /^h[1-6]$/.test(as) ? 'heading' : as === 'button' ? 'button' : 'text') }), [register, widgetId, widgetLabel, base, editorKind, as,globalKey,productId,widgetType,flow?.regionId])
  const css = (styles: Record<string, string> = {}) => Object.entries(safeStyle(styles)).map(([key, value]) => `${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}:${value} !important`).join(';')
  const responsive = [ ['tablet', 1024], ['mobile', 767] ].map(([mode, width]) => {
    const rules = css(edit?.responsive?.[mode as 'tablet' | 'mobile'])
    return rules ? `@media(max-width:${width}px){[data-widget-key="${token}"]{${rules}}}` : ''
  }).join('')
  const nativeCss=edit?.schema && !scopeIsBuilder(ctx?.scope) ? generateCompiledCSS([{id:`${token}-section`,containers:[{id:`${token}-container`,widgets:[{...edit.schema,id:token}]}]}]) : ''
  const mode=width<=767?'mobile':width<=1024?'tablet':'desktop'
  const schema=edit?.schema || {}
  const hidden=edit?.hidden || schema[`hide_on_${mode}`] || schema[`hide_${mode}`] || schema.settings?.[`hide_on_${mode}`] || schema.settings?.[`hide_${mode}`]
  const elementProps: Record<string, any> = { ...props, style: { ...style, ...computeWidgetStyles(edit?.schema, width <= 767 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop'), ...safeStyle(edit?.style), ...(hidden ? { display: edit?.hidden ? 'none' : (ctx?.preview && !locked ? undefined : 'none'), opacity: edit?.hidden ? 0 : (ctx?.preview ? 0.3 : undefined) } : {}), ...(dropIndicator === 'inside' ? { outline: '2px dashed #db468e !important', outlineOffset: '2px' } : {}) }, 'data-widget-key': token, 'data-widget-id': props['data-widget-id'] || widgetId, 'data-editor-selected':ctx?.preview && ctx.selected===widgetId ? 'true':undefined,
    ...(ctx?.preview ? {
      onDoubleClickCapture: (event: any) => { if(locked){event.preventDefault();event.stopPropagation();setUnlocked(true);ctx.select(widgetId,true)} },
      onClickCapture: (event: any) => {
        if(locked&&!unlocked){event.preventDefault();event.stopPropagation();ctx.select(widgetId);return}
        if (event.target.closest('[data-widget-key]') !== event.currentTarget) return
        const control = event.target.closest('button,input,select,textarea')
        if (control && control !== event.currentTarget) return
        event.preventDefault()
        event.stopPropagation()
        ctx.select(widgetId)
      },
      onContextMenuCapture: (event: any) => {
        event.preventDefault()
        event.stopPropagation()
        ctx.select(widgetId)
        window.parent.postMessage({
          type: 'teknix:contextmenu',
          scope: ctx.scope,
          id: widgetId,
          clientX: event.clientX,
          clientY: event.clientY,
          label: widgetLabel,
          kind: editorKind || 'widget',
          global: !!globalKey
        }, hubOrigin)
      },
      onDragOverCapture: (event: any) => {
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'copy'
        const rect = event.currentTarget.getBoundingClientRect()
        const relY = event.clientY - rect.top
        const isContainer = widgetType === 'container' || editorKind === 'container'
        if (isContainer && relY > rect.height * 0.25 && relY < rect.height * 0.75) {
          setDropIndicator('inside')
        } else if (relY <= rect.height / 2) {
          setDropIndicator('before')
        } else {
          setDropIndicator('after')
        }
      },
      onDragLeaveCapture: (event: any) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setDropIndicator(null)
        }
      },
      onDropCapture: (event: any) => {
        event.preventDefault()
        event.stopPropagation()
        const pos = dropIndicator || 'after'
        setDropIndicator(null)
        let payload: any = {}
        try {
          const raw = event.dataTransfer.getData('application/teknix-widget')
          if (raw) payload = JSON.parse(raw)
        } catch {}
        const activeType = payload.widgetType || (window as any).__teknixActiveDragWidget
        if (!activeType && !payload.nodeId) return

        window.parent.postMessage({
          type: 'teknix:layout-action',
          scope: ctx.scope,
          action: payload.nodeId ? (payload.regionId === flow?.regionId ? 'move' : 'move-cross-region') : 'insert',
          widgetType: activeType,
          nodeId: payload.nodeId,
          sourceRegionId: payload.regionId,
          target: widgetId,
          inside: pos === 'inside',
          position: pos,
          regionId: flow?.regionId,
          globalKey: flow?.globalKey || globalKey
        }, hubOrigin)
        ;(window as any).__teknixActiveDragWidget = null
      }
    } : {}) }
  if (as === 'img' && edit?.content) {
    elementProps.src = safeMediaUrl(edit.content.src||edit.content.image||edit.content.url) || props.src
    elementProps.alt = typeof edit.content.alt === 'string' ? edit.content.alt : props.alt
  }
  if ((as === 'input' || as === 'textarea') && edit?.content) {
    if (typeof edit.content.placeholder === 'string') elementProps.placeholder = edit.content.placeholder
    if (as === 'input' && typeof edit.content.input_type === 'string' && /^(text|email|tel|number|url|search|password|radio|checkbox|range)$/.test(edit.content.input_type)) {
      elementProps.type = edit.content.input_type
    }
  }
  const destination=edit?.content?.button_link || edit?.content?.link
  if(renderContent && typeof destination==='string' && /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i.test(destination)) {
    elementProps.onClick=(event:any)=>{event.preventDefault();event.stopPropagation();if(!ctx?.preview)window.location.assign(destination)}
    if(as==='a')elementProps.href=destination
  }
  const tag = /^h[1-6]$/.test(as) && typeof edit?.content?.tag==='string' && /^(h[1-6]|div|span|p)$/.test(edit.content.tag) ? edit.content.tag : as
  const editedText = edit?.content?.text ?? edit?.content?.label
  const iconName = typeof edit?.content?.icon === 'string' && edit.content.icon.trim() ? edit.content.icon.trim() : undefined
  const iconElement = iconName ? renderDynamicIcon(iconName, Number(edit?.content?.icon_size || (as === 'button' ? 18 : 20)), String(edit?.content?.icon_color || 'currentColor')) : null

  let renderedChildren = children
  if (widgetType === 'icon' && iconElement) {
    renderedChildren = iconElement
  } else if (as === 'button' && iconElement) {
    if (renderContent && typeof editedText === 'string') {
      const pos = edit?.content?.icon_position || 'before'
      const spacing = Number(edit?.content?.icon_spacing ?? 8)
      renderedChildren = (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing }}>
          {pos === 'before' && iconElement}
          <span>{editedText}</span>
          {pos === 'after' && iconElement}
        </span>
      )
    } else {
      renderedChildren = iconElement
    }
  } else if (renderContent && typeof editedText === 'string') {
    renderedChildren = editedText
  }

  const isVoidElement = as === 'img' || as === 'input'
  const result = createElement(tag, elementProps, ...(isVoidElement ? [] : [renderedChildren]))
  return (
    <>
      {responsive && <style>{responsive}</style>}
      {nativeCss && <style>{nativeCss}</style>}
      {ctx?.preview && dropIndicator === 'before' && <div className="editor-flow-drop-line" />}
      {result}
      {ctx?.preview && dropIndicator === 'after' && <div className="editor-flow-drop-line" />}
    </>
  )
}
