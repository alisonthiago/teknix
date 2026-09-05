/** Presentation overrides are scoped to one page or one product; never to a template. */
export type WidgetStyle = Record<string, string>
export interface WidgetEdit {
  content?: Record<string, unknown>
  style?: WidgetStyle
  responsive?: { tablet?: WidgetStyle; mobile?: WidgetStyle }
  hidden?: boolean
  schema?: Record<string, any>
  tree?: any
}
export type WidgetEdits = Record<string, WidgetEdit>
export interface WidgetDescriptor {
  id: string
  label: string
  kind?: 'widget' | 'section' | 'container'
  widgetType?: string
  schema?: Record<string, any>
  globalKey?: string
  productId?: string
  regionId?: string
  layout?: CanvasLayout
  content: Record<string, unknown>
}
export const WIDGET_EDITOR_KEY = 'widget_editor_v1'
export function scopeSlug(scope: string) { return `__widgets__/${encodeURIComponent(scope)}` }
export function readWidgetEdits(styles: unknown): WidgetEdits {
  if (!styles || typeof styles !== 'object') return {}
  const value = (styles as Record<string, unknown>)[WIDGET_EDITOR_KEY]
  return value && typeof value === 'object' && !Array.isArray(value) ? value as WidgetEdits : {}
}
export const EDITABLE_STYLES = ['color', 'backgroundColor', 'fontSize', 'fontWeight', 'lineHeight', 'textAlign', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom', 'borderRadius', 'maxWidth', 'width', 'gap'] as const
export function safeStyle(style: WidgetStyle = {}): WidgetStyle {
  return Object.fromEntries(Object.entries(style).filter(([key, value]) =>
    (EDITABLE_STYLES as readonly string[]).includes(key) && typeof value === 'string' && !/[{};<>]|url\s*\(/i.test(value)))
}
export function safeMediaUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return /^(https?:\/\/|\/(?!\/))/.test(value) ? value : undefined
}

export const GLOBAL_EDITOR_SCOPE = 'global:site'
export interface CanvasNode {
  id: string
  source?: string
  label: string
  type?: string
  content?: Record<string, unknown>
  children?: CanvasNode[]
  hidden?: boolean
  adPlacement?: string
}
export interface CanvasLayout { nodes: CanvasNode[] }
export function mergeWidgetEdit(base?: WidgetEdit, local?: WidgetEdit): WidgetEdit {
  return {...base,...local,content:{...base?.content,...local?.content},style:{...base?.style,...local?.style},schema:{...base?.schema,...local?.schema,settings:{...base?.schema?.settings,...local?.schema?.settings},responsive:{...base?.schema?.responsive,...local?.schema?.responsive}},responsive:{tablet:{...base?.responsive?.tablet,...local?.responsive?.tablet},mobile:{...base?.responsive?.mobile,...local?.responsive?.mobile}}}
}
export function matchNode(n: CanvasNode, searchId: string): boolean {
  if (!n || !searchId) return false
  return (
    n.id === searchId ||
    n.source === searchId ||
    n.id.endsWith(`:${searchId}`) ||
    (n as any).widgetId === searchId ||
    (searchId.includes(':') && n.id === searchId.split(':').pop())
  )
}

/** Pure structural edits keep source/component/ADS identities intact. */
export function moveCanvasNode(layout:CanvasLayout, id:string, target:string, inside=false, position:'before'|'after'|'inside'='after'):CanvasLayout {
  const next=structuredClone(layout)
  const find=(nodes:CanvasNode[],key:string):CanvasNode|undefined=>{
    for(const n of nodes){
      if(matchNode(n, key)) return n
      const child=find(n.children||[],key)
      if(child) return child
    }
  }
  const node=find(next.nodes,id),destination=find(next.nodes,target)
  if(!node||!destination||id===target||find(node.children||[],target))return layout
  if((inside || position==='inside') && destination.type!=='container' && destination.type!=='grid')return layout
  const remove=(nodes:CanvasNode[]):boolean=>{
    const index=nodes.findIndex(n=>matchNode(n, id))
    if(index>=0){nodes.splice(index,1);return true}
    return nodes.some(n=>remove(n.children||[]))
  }
  remove(next.nodes)
  if(inside || position==='inside')(destination.children ||= []).push(node)
  else {
    const insert=(nodes:CanvasNode[]):boolean=>{
      const index=nodes.findIndex(n=>matchNode(n, target))
      if(index>=0){
        nodes.splice(position==='before'?index:index+1,0,node)
        return true
      }
      return nodes.some(n=>insert(n.children||[]))
    }
    insert(next.nodes)
  }
  return next
}

export function findNodePath(layout: CanvasLayout, id: string): CanvasNode[] {
  function search(nodes: CanvasNode[], path: CanvasNode[]): CanvasNode[] | null {
    for (const node of nodes) {
      const currentPath = [...path, node]
      if (matchNode(node, id)) return currentPath
      if (node.children && node.children.length > 0) {
        const found = search(node.children, currentPath)
        if (found) return found
      }
    }
    return null
  }
  return search(layout.nodes, []) || []
}

export function cloneNodeWithNewIds(node: CanvasNode): CanvasNode {
  return {
    ...structuredClone(node),
    id: crypto.randomUUID(),
    label: `${node.label} (Cópia)`,
    children: node.children ? node.children.map(cloneNodeWithNewIds) : undefined
  }
}

export function duplicateCanvasNode(layout: CanvasLayout, id: string): { layout: CanvasLayout; newId: string } | null {
  const next = structuredClone(layout)
  let createdId = ''

  function insertAfter(nodes: CanvasNode[]): boolean {
    const idx = nodes.findIndex(n => matchNode(n, id))
    if (idx >= 0) {
      const cloned = cloneNodeWithNewIds(nodes[idx])
      createdId = cloned.id
      nodes.splice(idx + 1, 0, cloned)
      return true
    }
    return nodes.some(n => n.children && insertAfter(n.children))
  }

  const success = insertAfter(next.nodes)
  return success && createdId ? { layout: next, newId: createdId } : null
}

export function removeCanvasNode(layout: CanvasLayout, id: string): CanvasLayout {
  const next = structuredClone(layout)
  function prune(nodes: CanvasNode[]): boolean {
    const idx = nodes.findIndex(n => matchNode(n, id))
    if (idx >= 0) {
      nodes.splice(idx, 1)
      return true
    }
    return nodes.some(n => n.children && prune(n.children))
  }
  prune(next.nodes)
  return next
}

export function canvasAdSlots(layout:CanvasLayout):Array<{placement:string;path:string}> {
  const result:Array<{placement:string;path:string}>=[]
  const visit=(nodes:CanvasNode[],prefix:string)=>nodes.forEach((node,i)=>{const path=`${prefix}${i+1}. ${node.label}`;if(node.adPlacement)result.push({placement:node.adPlacement,path});visit(node.children||[],path+' → ')})
  visit(layout.nodes,'');return result
}
