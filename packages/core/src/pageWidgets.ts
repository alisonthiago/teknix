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

export interface FooterSearchedItem {
  title: string
  link: string
}

export const DEFAULT_FOOTER_SEARCHED_ITEMS: FooterSearchedItem[] = [
  // Coluna 1
  { title: 'Furadeira de impacto', link: '/produtos?q=furadeira+de+impacto' },
  { title: 'Parafusadeira a bateria', link: '/produtos?q=parafusadeira+bateria' },
  { title: 'Serra circular', link: '/produtos?q=serra+circular' },
  { title: 'Serra tico-tico', link: '/produtos?q=serra+tico-tico' },
  { title: 'Esmerilhadeira angular', link: '/produtos?q=esmerilhadeira+angular' },
  { title: 'Martelete perfurador', link: '/produtos?q=martelete+perfurador' },
  // Coluna 2
  { title: 'Chave de impacto', link: '/produtos?q=chave+de+impacto' },
  { title: 'Jogo de ferramentas', link: '/produtos?q=jogo+de+ferramentas' },
  { title: 'Maleta de ferramentas', link: '/produtos?q=maleta+de+ferramentas' },
  { title: 'Nível laser', link: '/produtos?q=nivel+laser' },
  { title: 'Trena a laser', link: '/produtos?q=trena+laser' },
  { title: 'Lixadeira orbital', link: '/produtos?q=lixadeira+orbital' },
  // Coluna 3
  { title: 'Compressor de ar', link: '/produtos?q=compressor+de+ar' },
  { title: 'Inversora de solda', link: '/produtos?q=inversora+de+solda' },
  { title: 'Lavadora alta pressão', link: '/produtos?q=lavadora+alta+pressao' },
  { title: 'Aspirador profissional', link: '/produtos?q=aspirador+industrial' },
  { title: 'Politriz automotiva', link: '/produtos?q=politriz' },
  { title: 'Plaina elétrica', link: '/produtos?q=plaina+eletrica' },
  // Coluna 4
  { title: 'Bateria 20V Max', link: '/produtos?q=bateria+20v' },
  { title: 'Carregador rápido', link: '/produtos?q=carregador+rapido' },
  { title: 'Brocas e pontas', link: '/produtos?q=brocas+e+pontas' },
  { title: 'Discos de corte', link: '/produtos?q=disco+de+corte' },
  { title: 'Caixa organizadora', link: '/produtos?q=maleta+organizadora' },
  { title: 'Kit marcenaria', link: '/produtos?q=kit+marcenaria' },
  // Coluna 5
  { title: 'Ferramentas a bateria', link: '/produtos?q=ferramentas+a+bateria' },
  { title: 'Ferramentas elétricas', link: '/produtos?q=ferramentas+eletricas' },
  { title: 'Acessórios para ferramentas', link: '/produtos?q=acessorios' },
  { title: 'Equipamentos industriais', link: '/produtos?q=equipamentos' },
  { title: 'Kits profissionais', link: '/produtos?q=kits+profissionais' },
  { title: 'Bancadas de trabalho', link: '/produtos?q=bancada+de+trabalho' },
  // Coluna 6
  { title: 'Furadeira 1/2 Pol.', link: '/produtos?q=furadeira+12' },
  { title: 'Parafusadeira 12V', link: '/produtos?q=parafusadeira+12v' },
  { title: 'Parafusadeira 20V Brushless', link: '/produtos?q=parafusadeira+20v' },
  { title: 'Serra de esquadria', link: '/produtos?q=serra+esquadria' },
  { title: 'Soprador térmico', link: '/produtos?q=soprador+termico' },
  { title: 'Tupia de coluna', link: '/produtos?q=tupia+coluna' },
  // Coluna 7
  { title: 'Gerador de energia', link: '/produtos?q=gerador+energia' },
  { title: 'Multímetro digital', link: '/produtos?q=multimetro' },
  { title: 'Alicate amperímetro', link: '/produtos?q=alicate+amperimetro' },
  { title: 'Chaves combinadas', link: '/produtos?q=chave+combinada' },
  { title: 'Caixa metálica sanfonada', link: '/produtos?q=caixa+sanfonada' },
  { title: 'Torquímetro profissional', link: '/produtos?q=torquimetro' }
]

/**
 * Resolução oficial de domínios e origens do ecossistema TEKNIX.
 * Regra Permanente 44:
 * - SITE SEMPRE roda na porta 5173 / https://www.teknixbrasil.com.br
 * - HUB SEMPRE roda na porta 5174 / https://hub.teknixbrasil.com.br
 */
export function getSiteOrigin(envOverride?: string): string {
  if (envOverride) return envOverride
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5173'
    }
    if (hostname.endsWith('teknixbrasil.com.br')) {
      return 'https://www.teknixbrasil.com.br'
    }
    if (hostname.startsWith('hub.')) {
      return `${window.location.protocol}//www.${hostname.slice(4)}`
    }
    return window.location.origin
  }
  return 'https://www.teknixbrasil.com.br'
}

export function getHubOrigin(envOverride?: string): string {
  if (envOverride) return envOverride
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5174'
    }
    if (hostname.endsWith('teknixbrasil.com.br')) {
      return 'https://hub.teknixbrasil.com.br'
    }
    return window.location.origin
  }
  return 'https://hub.teknixbrasil.com.br'
}

export function isAllowedHubOrigin(origin?: string | null, envOverride?: string): boolean {
  if (!origin) return false
  const target = getHubOrigin(envOverride)
  if (origin === target) return true
  try {
    const u = new URL(origin)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true
    if (u.hostname.endsWith('teknixbrasil.com.br')) return true
    if (u.hostname.endsWith('.vercel.app')) return true
  } catch {}
  return false
}

export function isAllowedSiteOrigin(origin?: string | null, envOverride?: string): boolean {
  if (!origin) return false
  const target = getSiteOrigin(envOverride)
  if (origin === target) return true
  try {
    const u = new URL(origin)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true
    if (u.hostname.endsWith('teknixbrasil.com.br')) return true
    if (u.hostname.endsWith('.vercel.app')) return true
  } catch {}
  return false
}

