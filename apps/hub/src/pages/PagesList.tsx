import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Edit2,
  ExternalLink,
  Eye,
  Link2,
  Check,
  CopyPlus,
  Globe,
  EyeOff,
  Trash2,
  Plus,
  Search,
  PanelTop,
  PanelBottom,
  Home,
  Package,
  FolderTree,
  ShoppingCart,
  User,
  FileText
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './PagesList.css'
import {
  ensurePublishedSnapshot,
  createEditorPage,
  duplicateEditorPage,
  deleteEditorPage,
  setPublicationStatus
} from '../services/widgetEditor'

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

interface Entry {
  id: string
  title: string
  path: string
  edit: string
  status: string
  kind: string
  pageId?: string
}

function getPageIcon(e: Entry) {
  if (e.id.includes('chrome:header')) return <PanelTop size={16} color="#0071e3" />
  if (e.id.includes('chrome:footer')) return <PanelBottom size={16} color="#6b7280" />
  if (e.path === '/') return <Home size={16} color="#0071e3" />
  if (e.kind === 'products') return <Package size={16} color="#7c3aed" />
  if (e.id.startsWith('store_categories')) return <FolderTree size={16} color="#059669" />
  if (e.path === '/sacola' || e.path === '/checkout') return <ShoppingCart size={16} color="#f59e0b" />
  if (e.path === '/conta' || e.path === '/login' || e.path === '/cadastro') return <User size={16} color="#6366f1" />
  return <FileText size={16} color="#4b5563" />
}

export default function PagesList() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('pages')
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null)
  const [dialog, setDialog] = useState<{ kind: 'create' | 'duplicate'; entry?: Entry } | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const request = useRef(0)

  async function action(fn: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await fn()
      await load()
    } catch (e: any) {
      setError(e.message || 'Não foi possível concluir a ação.')
    } finally {
      setBusy(false)
    }
  }

  function openDialog(kind: 'create' | 'duplicate', entry?: Entry) {
    setTitle(entry ? `${entry.title} — cópia` : '')
    setSlug(entry ? `${entry.path}-copia` : '')
    setDialog({ kind, entry })
  }

  async function load() {
    const current = ++request.current
    setLoading(true)
    setError('')
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
          if (table === 'pages') query = query.neq('type', 'editor_draft').neq('type', 'product')
          const { data, error } = await query
          if (error) throw error
          for (const row of data as any[]) {
            if (table === 'pages' && row.type === 'widget_overrides') {
              await ensurePublishedSnapshot(row)
              continue
            }
            const path = table === 'products' ? `/produtos/${encodeURIComponent(row.id)}` : table === 'store_categories' ? `/categoria/${row.slug}` : '/' + row.slug.replace(/^\/+/, '')
            if (table === 'pages') {
              await ensurePublishedSnapshot(row)
              const existing = results.findIndex(e => e.path === path && e.id.startsWith('native:'))
              if (existing >= 0) results.splice(existing, 1)
            }
            results.push({
              pageId: table === 'pages' ? row.id : undefined,
              id: `${table}:${row.id}`,
              title: row.title || row.name || 'Sem título',
              path,
              edit: path === '/' ? '/hub/editor/native?path=%2F' : table === 'products' ? `/hub/editor/product/${row.id}` : table === 'store_categories' ? `/hub/editor/native?path=${encodeURIComponent(path)}` : `/hub/editor/page/${row.id}`,
              status: table === 'pages' ? (row.status === 'published' ? 'Publicada' : 'Rascunho') : table === 'products' ? 'Produto real' : 'Categoria',
              kind: table === 'products' ? 'products' : 'pages'
            })
          }
          if (data.length < 1000) break
        }
      }
      if (current === request.current) setEntries(results)
    } catch (e: any) {
      if (current !== request.current) return
      setError(e.message || 'Não foi possível carregar as páginas.')
      setEntries([])
    } finally {
      if (current === request.current) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => { request.current++ }
  }, [])

  const published = (e: Entry) => e.status !== 'Rascunho'
  const visible = entries.filter(e =>
    e.kind === tab &&
    (filter === 'all' || (filter === 'published' ? published(e) : !published(e))) &&
    `${e.title} ${e.path}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pages-page-container">
      <div className="pages-page-header">
        <div className="pages-header-titles">
          <h1 className="pages-main-title">Páginas</h1>
          <p className="pages-main-subtitle">Gerencie e edite os widgets e a apresentação visual da loja.</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => openDialog('create')}
          className="pages-primary-btn"
        >
          <Plus size={15} />
          <span>Criar página</span>
        </button>
      </div>

      <div className="pages-toolbar-row">
        <div className="pages-search-box">
          <Search size={15} className="pages-search-icon" />
          <input
            className="pages-search-input"
            placeholder="Buscar por nome ou endereço..."
            aria-label="Buscar página ou produto"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="pages-segmented-tabs">
          {[['pages', 'Páginas'], ['products', 'Produtos reais']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`pages-tab ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              {label} ({entries.filter(e => e.kind === key).length})
            </button>
          ))}
        </div>
      </div>

      <div className="pages-segmented-tabs">
        {[['all', 'Todas'], ['published', 'Publicadas'], ['draft', 'Rascunhos']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`pages-tab ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label} ({entries.filter(e => e.kind === tab && (key === 'all' || (key === 'published' ? published(e) : !published(e)))).length})
          </button>
        ))}
      </div>

      {deleteTarget && (
        <div className="pages-confirm-overlay">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-page-title">
            <h2 id="delete-page-title" style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#111827' }}>Excluir página</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#4b5563' }}>Tem certeza que deseja excluir “{deleteTarget.title}” e suas configurações?</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setDeleteTarget(null)}
                style={{ background: '#f3f4f6', border: '1px solid #d1d5db', color: '#374151' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => action(async () => {
                  await deleteEditorPage(deleteTarget.pageId!)
                  setDeleteTarget(null)
                })}
                style={{ background: '#ef4444', border: 'none', color: '#ffffff' }}
              >
                Excluir página
              </button>
            </div>
          </section>
        </div>
      )}

      {dialog && (
        <div className="pages-confirm-overlay">
          <form
            className="pages-modal-card"
            style={{ maxWidth: 460, padding: 24 }}
            onSubmit={e => {
              e.preventDefault()
              action(async () => {
                if (dialog.kind === 'duplicate') await duplicateEditorPage(dialog.entry!.pageId!, title, slug)
                else await createEditorPage(title, slug)
                setDialog(null)
              })
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: 17, fontWeight: 700, color: '#111827' }}>
              {dialog.kind === 'create' ? 'Criar nova página' : 'Duplicar página'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Título da página
                </label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Black Friday 2026"
                  style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Endereço público (slug)
                </label>
                <input
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="/campanha/oferta"
                  style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setDialog(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="pages-primary-btn"
              >
                <span>Salvar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div role="alert" className="pages-empty-box" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
          <p style={{ color: '#dc2626', margin: 0, fontWeight: 600 }}>{error}</p>
          <button type="button" onClick={load} style={{ marginTop: 12, padding: '6px 14px', borderRadius: 6, border: '1px solid #dc2626', background: '#ffffff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="pages-loading-box">
          <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando páginas e produtos…</p>
        </div>
      ) : !error && (
        <div className="pages-table-wrapper">
          <table className="pages-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Página</th>
                <th style={{ width: '22%' }}>Endereço</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '28%', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="table-info-cell">
                      <div className="table-icon-pill">
                        {getPageIcon(e)}
                      </div>
                      <div className="table-title-column">
                        <span className="table-title-main" style={{ fontWeight: 600 }}>{e.title}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: 11.5, color: '#4b5563', background: '#f3f4f6', padding: '3px 8px', borderRadius: 4, fontFamily: 'ui-monospace, monospace' }}>
                      {e.path}
                    </code>
                  </td>
                  <td>
                    <span className={`table-status-pill ${e.status === 'Publicada' ? 'published' : e.status === 'Rascunho' ? 'draft' : 'system-active'}`}>
                      <span className="status-bullet" />
                      <span>{e.status}</span>
                    </span>
                  </td>
                  <td>
                    <div className="table-actions-group">
                      {/* Editar widgets */}
                      <Link
                        to={e.edit}
                        className="table-action-btn edit"
                        title="Editar widgets desta página"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </Link>

                      {/* Ver no site */}
                      {siteOrigin && (
                        <a
                          href={new URL(e.path, siteOrigin).href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-icon-btn"
                          title="Ver página ao vivo no site"
                          aria-label="Ver no site"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}

                      {/* Pré-visualizar */}
                      <Link
                        to={`${e.edit}${e.edit.includes('?') ? '&' : '?'}preview=1`}
                        className="table-action-icon-btn"
                        title="Pré-visualizar no editor"
                        aria-label="Pré-visualizar"
                      >
                        <Eye size={13} />
                      </Link>

                      {/* Copiar URL */}
                      <button
                        type="button"
                        className="table-action-icon-btn"
                        title={copiedId === e.id ? 'URL copiada com sucesso!' : 'Copiar URL pública'}
                        aria-label="Copiar URL"
                        onClick={() => {
                          const url = new URL(e.path, siteOrigin).href
                          navigator.clipboard.writeText(url)
                          setCopiedId(e.id)
                          setTimeout(() => setCopiedId(null), 2000)
                        }}
                      >
                        {copiedId === e.id ? <Check size={13} color="#16a34a" /> : <Link2 size={13} />}
                      </button>

                      {/* Ações para páginas criadas (com pageId) */}
                      {e.pageId && (
                        <>
                          <button
                            type="button"
                            className="table-action-icon-btn"
                            disabled={busy || e.path === '/'}
                            title="Duplicar página"
                            aria-label="Duplicar página"
                            onClick={() => openDialog('duplicate', e)}
                          >
                            <CopyPlus size={13} />
                          </button>
                          <button
                            type="button"
                            className="table-action-icon-btn"
                            disabled={busy}
                            title={e.status === 'Publicada' ? 'Despublicar (Mover para rascunho)' : 'Publicar no site oficial'}
                            aria-label={e.status === 'Publicada' ? 'Despublicar' : 'Publicar'}
                            onClick={() => action(() => setPublicationStatus(e.pageId!, e.status === 'Publicada' ? 'draft' : 'published'))}
                          >
                            {e.status === 'Publicada' ? <EyeOff size={13} /> : <Globe size={13} />}
                          </button>
                          <button
                            type="button"
                            className="table-action-icon-btn delete"
                            disabled={busy}
                            title="Excluir página permanentemente"
                            aria-label="Excluir página"
                            onClick={() => setDeleteTarget(e)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <p className="pages-empty-box" style={{ margin: '30px 20px', color: '#6b7280' }}>
              Nenhuma página encontrada.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
