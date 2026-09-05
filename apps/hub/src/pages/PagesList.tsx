import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './PagesList.css'
import {ensurePublishedSnapshot,createEditorPage,duplicateEditorPage,deleteEditorPage,setPublicationStatus} from '../services/widgetEditor'

const nativePages: [string, string, string?][] = [
  ['Página inicial', '/'],
  ['Cabeçalho Oficial da Loja', '/', 'chrome:header'],
  ['Rodapé Oficial da Loja', '/', 'chrome:footer'],
  ['Contato', '/contato'],
  ['Catálogo / busca', '/produtos'],
  ['Conta do cliente', '/conta'],
  ['Pedidos', '/pedidos'],
  ['Localizar pedido', '/buscar-pedido'],
  ['Itens salvos', '/itens-salvos'],
  ['Sacola', '/sacola'],
  ['Checkout', '/checkout'],
  ['Login', '/login'],
  ['Cadastro', '/cadastro'],
  ['Recuperar senha', '/password'],
  ['Comparar produtos', '/comparar']
]
const siteOrigin = import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '')
interface Entry { id: string; title: string; path: string; edit: string; status: string; kind: string; pageId?: string }
export default function PagesList() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('pages')
  const [filter,setFilter]=useState('all')
  const [busy,setBusy]=useState(false)
  const [deleteTarget,setDeleteTarget]=useState<Entry|null>(null)
  const [dialog,setDialog]=useState<{kind:'create'|'duplicate';entry?:Entry}|null>(null)
  const [title,setTitle]=useState('')
  const [slug,setSlug]=useState('')
  const request = useRef(0)
  async function action(fn:()=>Promise<unknown>) {setBusy(true);setError('');try{await fn();await load()}catch(e:any){setError(e.message || 'Não foi possível concluir a ação.')}finally{setBusy(false)}}
  function openDialog(kind:'create'|'duplicate',entry?:Entry){setTitle(entry?`${entry.title} — cópia`:'');setSlug(entry?`${entry.path}-copia`:'');setDialog({kind,entry})}

  async function load() {
    const current=++request.current; setLoading(true); setError('')
    try {
      const results: Entry[] = nativePages.map(([title, path, focus]) => ({
        id: focus ? `native:${path}:${focus}` : `native:${path}`,
        title,
        path,
        edit: `/hub/editor/native?path=${encodeURIComponent(path)}${focus ? `&focus=${encodeURIComponent(focus)}` : ''}`,
        status: 'Padrão do site',
        kind: 'pages'
      }))
      for (const table of ['pages', 'products', 'store_categories']) {
        for (let offset = 0; ; offset += 1000) {
          let query = supabase.from(table).select(table === 'pages' ? '*' : table === 'products' ? 'id,name,sku' : 'id,name,slug').order('id').range(offset, offset + 999)
          if (table === 'pages') query = query.neq('type','editor_draft').neq('type', 'product')
          const { data, error } = await query
          if (error) throw error
          for (const row of data as any[]) {
            if(table==='pages' && row.type==='widget_overrides'){await ensurePublishedSnapshot(row);continue}
            const path = table === 'products' ? `/produtos/${encodeURIComponent(row.id)}` : table === 'store_categories' ? `/categoria/${row.slug}` : '/' + row.slug.replace(/^\/+/, '')
            if(table === 'pages') {
              await ensurePublishedSnapshot(row)
              const existing=results.findIndex(e=>e.path===path && e.id.startsWith('native:'))
              if(existing>=0) results.splice(existing,1)
            }
            results.push({ pageId:table==='pages'?row.id:undefined, id: `${table}:${row.id}`, title: row.title || row.name || 'Sem título', path, edit: path==='/' ? '/hub/editor/native?path=%2F' : table === 'products' ? `/hub/editor/product/${row.id}` : table === 'store_categories' ? `/hub/editor/native?path=${encodeURIComponent(path)}` : `/hub/editor/page/${row.id}`, status: table === 'pages' ? row.status === 'published' ? 'Publicada' : 'Rascunho' : table === 'products' ? 'Produto real' : 'Categoria', kind: table === 'products' ? 'products' : 'pages' })
          }
          if (data.length < 1000) break
        }
      }
      if(current===request.current)setEntries(results)
    } catch (e: any) { if(current!==request.current)return;setError(e.message || 'Não foi possível carregar as páginas.'); setEntries([]) }
    finally { if(current===request.current)setLoading(false) }
  }
  useEffect(() => { load();return () => {request.current++} }, [])
  const published=(e:Entry)=>e.status !== 'Rascunho'
  const visible = entries.filter(e => e.kind === tab && (filter==='all' || (filter==='published'?published(e):!published(e))) && `${e.title} ${e.path}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="pages-page-container">
    <div className="pages-page-header"><div className="pages-header-titles"><h1 className="pages-main-title">Páginas</h1><p className="pages-main-subtitle">Edite os widgets da página atual. Cada produto mantém sua própria apresentação.</p></div><button disabled={busy} onClick={() => openDialog('create')}>Criar página</button></div>
    <div className="pages-toolbar-row"><div className="pages-search-box"><input className="pages-search-input" placeholder="Buscar página ou produto..." aria-label="Buscar página ou produto" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="pages-segmented-tabs">{[['pages','Páginas'],['products','Produtos reais']].map(([key,label]) => <button key={key} className={`pages-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label} ({entries.filter(e => e.kind === key).length})</button>)}</div></div>
    <div className="pages-segmented-tabs">{[['all','Todas'],['published','Publicadas'],['draft','Rascunhos']].map(([key,label])=><button key={key} className={`pages-tab ${filter===key?'active':''}`} onClick={()=>setFilter(key)}>{label} ({entries.filter(e=>e.kind===tab && (key==='all'||(key==='published'?published(e):!published(e)))).length})</button>)}</div>
    {deleteTarget && <div className="pages-confirm-overlay"><section role="dialog" aria-modal="true" aria-labelledby="delete-page-title"><h2 id="delete-page-title">Excluir página</h2><p>Excluir “{deleteTarget.title}” e seu rascunho?</p><button disabled={busy} onClick={()=>action(async()=>{await deleteEditorPage(deleteTarget.pageId!);setDeleteTarget(null)})}>Excluir página</button><button disabled={busy} onClick={()=>setDeleteTarget(null)}>Cancelar</button></section></div>}
    {dialog && <form className="pages-empty-state" onSubmit={e=>{e.preventDefault();action(async()=>{if(dialog.kind==='duplicate')await duplicateEditorPage(dialog.entry!.pageId!,title,slug);else await createEditorPage(title,slug);setDialog(null)})}}><h2>{dialog.kind==='create'?'Criar página':'Duplicar página'}</h2><label>Título<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Endereço<input required value={slug} placeholder="/campanha/oferta" onChange={e=>setSlug(e.target.value)}/></label><button disabled={busy} type="submit">Salvar</button><button type="button" onClick={()=>setDialog(null)}>Cancelar</button></form>}
    {error && <div role="alert" className="pages-empty-state"><p>{error}</p><button onClick={load}>Tentar novamente</button></div>}
    {loading ? <p>Carregando páginas e produtos…</p> : !error && <div className="pages-table-wrapper"><table className="pages-table"><thead><tr><th>Página</th><th>Endereço</th><th>Tipo / status</th><th>Ações</th></tr></thead><tbody>{visible.map(e => <tr key={e.id}><td>{e.title}</td><td>{e.path}</td><td>{e.status}</td><td><Link to={e.edit}>Editar widgets</Link>{siteOrigin && <> · <a href={new URL(e.path,siteOrigin).href} target="_blank" rel="noopener noreferrer">Ver no site</a></>} · <Link to={`${e.edit}${e.edit.includes('?')?'&':'?'}preview=1`}>Pré-visualizar</Link> · <button onClick={()=>action(()=>navigator.clipboard.writeText(new URL(e.path,siteOrigin).href))}>Copiar URL</button>{e.pageId && <> · <button disabled={busy || e.path==='/'} onClick={()=>openDialog('duplicate',e)}>Duplicar</button> · <button disabled={busy} onClick={()=>action(()=>setPublicationStatus(e.pageId!,e.status==='Publicada'?'draft':'published'))}>{e.status==='Publicada'?'Despublicar':'Publicar'}</button> · <button disabled={busy} onClick={()=>setDeleteTarget(e)}>Excluir</button></>}</td></tr>)}</tbody></table>{!visible.length && <p className="pages-empty-state">Nenhuma página encontrada.</p>}</div>}
  </div>
}
