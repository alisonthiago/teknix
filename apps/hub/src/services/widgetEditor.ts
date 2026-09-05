import { supabase } from '../lib/supabase'
import { readWidgetEdits, scopeSlug, WIDGET_EDITOR_KEY, type WidgetEdits } from '../../../../packages/core/src/pageWidgets'
export const PUBLICATION_KEY = 'published_snapshot_v2'
const DRAFT_KEY = 'editor_draft_v2'
export interface EditorTarget {
  scope: string; title: string; path: string; row: any; edits: WidgetEdits; previewData?: any; draft?: any
}
async function checked(query: any) { const { data, error } = await query; if (error) throw error; return data }
export function pagePath(slug: string) { return '/' + (slug || '').replace(/^\/+|\/+$/g, '') }
async function readTree(row: any) {
  const sections = await checked(supabase.from('page_sections').select('*').eq('page_id', row.id).order('order'))
  const containers = sections.length ? await checked(supabase.from('page_containers').select('*').in('section_id', sections.map((s: any) => s.id)).order('order')) : []
  const widgets = containers.length ? await checked(supabase.from('page_widgets').select('*').in('container_id', containers.map((c: any) => c.id)).order('order')) : []
  return { page: { ...row, page_styles: { ...row.page_styles, [PUBLICATION_KEY]: undefined } }, sections, containers, widgets }
}
async function replaceRow(row: any, updates: any) {
  const data = await checked(supabase.from('pages').update(updates).eq('id', row.id).select('*').maybeSingle())
  if (!data) throw new Error('Não foi possível salvar a página. Reabra o editor ou verifique suas permissões.')
  return data
}
/** Freeze the existing public presentation once; never overwrite an existing snapshot. */
export async function ensurePublishedSnapshot(row: any) {
  if (row.status !== 'published' || row.page_styles?.[PUBLICATION_KEY] || row.type === 'editor_draft') return row
  const tree = await readTree(row)
  return replaceRow(row, { page_styles: { ...row.page_styles, [PUBLICATION_KEY]: tree } })
}
export async function loadEditorTarget(kind: string, id: string): Promise<EditorTarget> {
  let scope = `${kind}:${id}`, title = id, path = id, row: any = null, previewData: any
  if(kind==='global'){scope='global:site';title='Padrões do site';path='/'}
  else if (kind === 'product') {
    const product = await checked(supabase.from('products').select('id,name,sku').eq('id', id).single())
    title = product.name; path = `/produtos/${encodeURIComponent(product.id)}`
  } else if (kind === 'page') {
    row = await checked(supabase.from('pages').select('*').eq('id', id).single())
    title = row.title; path = pagePath(row.slug)
    if(path==='/')return loadEditorTarget('native','/')
  } else {
    if (!id.startsWith('/') || id.startsWith('//') || /[?#]/.test(id)) throw new Error('Endereço de página inválido.')
    scope = `native:${id}`; title = id === '/' ? 'Página inicial' : id
  }
  if (!row && scope === 'native:/') row = await checked(supabase.from('pages').select('*').in('slug',['/','']).limit(1).maybeSingle())
  if (!row) row = await checked(supabase.from('pages').select('*').eq('slug', scopeSlug(scope)).maybeSingle())
  if (row) row = await ensurePublishedSnapshot(row)
  const draft = await checked(supabase.from('pages').select('*').eq('slug', `__draft__/${encodeURIComponent(scope)}`).eq('type', 'editor_draft').maybeSingle())
  const saved = draft?.page_styles?.[DRAFT_KEY]
  if (kind === 'page') previewData = saved?.tree || row.page_styles?.[PUBLICATION_KEY] || await readTree(row)
  return { scope, title, path, row, draft, previewData, edits: { ...(saved?.edits || readWidgetEdits(row?.page_styles)), ...(previewData ? {__tree__:{tree:previewData}} : {}) } }
}
/** Drafts live on a separate unpublished row. SITE only reads the atomic public snapshot. */
export async function saveEditorTarget(target: EditorTarget, edits: WidgetEdits, publish = false) {
  if (!publish) {
    const cleanEdits = {...edits};delete cleanEdits.__tree__;delete cleanEdits.__global__
    const styles = { [DRAFT_KEY]: { edits:cleanEdits, tree: edits.__tree__?.tree || target.previewData, scope: target.scope } }
    const draft = target.draft ? await replaceRow(target.draft, { page_styles: styles }) : await checked(supabase.from('pages').insert({title:target.title,slug:`__draft__/${encodeURIComponent(target.scope)}`,type:'editor_draft',status:'draft',page_styles:styles}).select('*').single())
    target.draft = draft
    return target.row
  }
  await saveEditorTarget(target, edits, false)
  let row = target.row
  if (!row) {
    row = await checked(supabase.from('pages').insert({title:target.title,slug:scopeSlug(target.scope),type:'widget_overrides',status:'draft',page_styles:{}}).select('*').single())
    target.row = row
  }
  const cleanEdits = {...edits};delete cleanEdits.__tree__;delete cleanEdits.__global__
  const styles = { ...(row.page_styles || {}), [WIDGET_EDITOR_KEY]: cleanEdits, ...(target.scope === 'native:/' ? { render_source:'site' } : {}) }
  delete styles[PUBLICATION_KEY]
  const tree = edits.__tree__?.tree || target.previewData || { page: row, sections: [], containers: [], widgets: [] }
  const pageSettings = edits['page:settings']?.content || {}
  const version = (row.version || 0) + 1
  const snapshot = { ...tree, page: { ...tree.page, id: row.id, status: 'published', version, page_styles: styles, ...pageSettings } }
  // History is logged safely before switching the public state.
  try {
    await supabase.from('page_publications').insert({page_id:row.id,version,snapshot})
  } catch (pubErr) {
    console.warn('Registro de histórico de publicação não bloqueante:', pubErr)
  }
  const pageUpdates: any = {}
  if (pageSettings.title || snapshot.page?.title) pageUpdates.title = pageSettings.title || snapshot.page?.title || target.title
  if (pageSettings.seo_title !== undefined || snapshot.page?.seo_title !== undefined) pageUpdates.seo_title = pageSettings.seo_title ?? snapshot.page?.seo_title
  if (pageSettings.seo_description !== undefined || snapshot.page?.seo_description !== undefined) pageUpdates.seo_description = pageSettings.seo_description ?? snapshot.page?.seo_description
  if (pageSettings.seo_image !== undefined || snapshot.page?.seo_image !== undefined) pageUpdates.seo_image = pageSettings.seo_image ?? snapshot.page?.seo_image

  return replaceRow(row, { ...pageUpdates, status:'published',version,published_at:new Date().toISOString(),page_styles:{...styles,[PUBLICATION_KEY]:snapshot} })
}
export async function setPublicationStatus(id: string, status: 'draft' | 'published') {
  const row = await checked(supabase.from('pages').select('slug').eq('id',id).single())
  const target = await loadEditorTarget(pagePath(row.slug)==='/'?'native':'page',pagePath(row.slug)==='/'?'/':id)
  if (status === 'published') return saveEditorTarget(target, target.edits, true)
  return replaceRow(target.row, {status:'draft'})
}
export async function createEditorPage(title: string, slug: string) {
  const path = pagePath(slug)
  if (!title.trim() || path === '/' || /[?#\s]/.test(path) || /^\/(__|hub(?:\/|$))/.test(path)) throw new Error('Informe um título e um endereço válido para a nova página.')
  const reserved=['/contato','/produtos','/conta','/pedidos','/buscar-pedido','/itens-salvos','/sacola','/checkout','/login','/cadastro','/password','/comparar','/busca','/blog']
  if(reserved.some(route=>path===route || path.startsWith(route+'/')) || /^\/(produto|categoria|preview)(\/|$)/.test(path))throw new Error('Esse endereço pertence a uma página existente do site. Abra essa página para editar seus widgets.')
  const existing=await checked(supabase.from('pages').select('id').in('slug',[path,path.slice(1)]).limit(1).maybeSingle())
  if(existing)throw new Error('Já existe uma página com este endereço.')
  return checked(supabase.from('pages').insert({title:title.trim(),slug:path,type:'custom',status:'draft',page_styles:{}}).select('*').single())
}
export async function duplicateEditorPage(id: string, title: string, slug: string) {
  const source = await loadEditorTarget('page',id)
  if(!source.previewData)throw new Error('A página inicial usa os widgets nativos do site. Edite sua apresentação pelo editor da Home.')
  const row = await createEditorPage(title,slug)
  const tree = structuredClone(source.previewData)
  tree.page = { ...tree.page, ...row }
  const sectionIds = new Map<string,string>(), containerIds = new Map<string,string>()
  const edits:WidgetEdits = {}
  tree.sections.forEach((s:any) => {const previous=s.id;s.id=crypto.randomUUID();s.page_id=row.id;sectionIds.set(previous,s.id);if(source.edits[previous])edits[s.id]=structuredClone(source.edits[previous])})
  tree.containers.forEach((c:any) => {const previous=c.id;c.id=crypto.randomUUID();c.section_id=sectionIds.get(c.section_id);containerIds.set(previous,c.id);if(source.edits[previous])edits[c.id]=structuredClone(source.edits[previous])})
  tree.widgets.forEach((w:any) => {const previous=w.id;w.id=crypto.randomUUID();w.container_id=containerIds.get(w.container_id);if(source.edits[previous])edits[w.id]=structuredClone(source.edits[previous])})
  const target = {scope:`page:${row.id}`,title:row.title,path:pagePath(row.slug),row,edits,previewData:tree}
  await saveEditorTarget(target,edits)
  return row
}
export async function deleteEditorPage(id:string) {
  await checked(supabase.from('pages').delete().eq('slug',`__draft__/${encodeURIComponent(`page:${id}`)}`).eq('type','editor_draft'))
  await checked(supabase.from('pages').delete().eq('id',id))
}
