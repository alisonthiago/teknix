import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  FileText,
  Sparkles,
  X,
  ArrowRight,
  AlertCircle,
  Layout,
  Megaphone,
  Layers
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
import { getSiteOrigin } from '../../../../packages/core/src/pageWidgets'

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

const siteOrigin = getSiteOrigin(import.meta.env.VITE_SITE_URL)

const RESERVED_ROUTES = [
  'contato',
  'produtos',
  'conta',
  'pedidos',
  'buscar-pedido',
  'itens-salvos',
  'sacola',
  'checkout',
  'login',
  'cadastro',
  'password',
  'comparar',
  'busca',
  'blog',
  'admin',
  'hub',
  'api'
]

interface Entry {
  id: string
  title: string
  path: string
  edit: string
  status: string
  kind: string
  pageId?: string
}

function slugify(text: string) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('pages')
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null)

  // Dialog State para Criar ou Duplicar
  const [dialog, setDialog] = useState<{ kind: 'create' | 'duplicate'; entry?: Entry } | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [template, setTemplate] = useState<'standard' | 'landing' | 'blank'>('standard')
  const [autoSlug, setAutoSlug] = useState(true)
  const [formError, setFormError] = useState('')

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

  function openCreateModal() {
    setTitle('')
    setSlug('')
    setAutoSlug(true)
    setTemplate('standard')
    setFormError('')
    setDialog({ kind: 'create' })
  }

  function openDuplicateModal(entry: Entry) {
    const copyTitle = `${entry.title} — cópia`
    const copySlug = `${entry.path.replace(/^\/+/, '')}-copia`
    setTitle(copyTitle)
    setSlug(`/${copySlug}`)
    setAutoSlug(false)
    setTemplate('standard')
    setFormError('')
    setDialog({ kind: 'duplicate', entry })
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    setFormError('')
    if (autoSlug && dialog?.kind === 'create') {
      const generated = slugify(val)
      setSlug(generated ? `/${generated}` : '')
    }
  }

  function handleSlugChange(val: string) {
    setAutoSlug(false)
    setFormError('')
    let cleaned = val.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_/]/g, '')
    if (cleaned && !cleaned.startsWith('/')) cleaned = `/${cleaned}`
    setSlug(cleaned)
  }

  async function handleCreateOrDuplicate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Por favor, informe o título da página.')
      return
    }

    const finalSlug = (slug.trim() || `/${slugify(title)}`).replace(/^\/*/, '/')
    if (finalSlug === '/' || finalSlug === '') {
      setFormError('O endereço da página não pode ser vazio ou a raiz "/".')
      return
    }

    const baseSlug = finalSlug.replace(/^\/+/, '').split('/')[0]
    if (RESERVED_ROUTES.includes(baseSlug)) {
      setFormError(`O endereço "${finalSlug}" é reservado pelo sistema da loja. Escolha outro endereço.`)
      return
    }

    setBusy(true)
    setFormError('')
    try {
      if (dialog?.kind === 'duplicate') {
        const row = await duplicateEditorPage(dialog.entry!.pageId!, title, finalSlug)
        setDialog(null)
        navigate(`/hub/editor/page/${row.id}`)
      } else {
        // 1. Cria a página com status draft e slug sanitizado
        const row = await createEditorPage(title, finalSlug)

        // 2. Insere a estrutura inicial com base no modelo selecionado
        try {
          const { data: section } = await supabase.from('page_sections').insert({
            page_id: row.id,
            type: 'section',
            order: 0,
            layout: 'boxed',
            direction: 'column',
            max_width: '1200px',
            padding_top: template === 'blank' ? '40px' : '70px',
            padding_bottom: template === 'blank' ? '40px' : '70px',
            bg_type: 'color',
            bg_color: '#ffffff'
          }).select().single()

          if (section?.id) {
            const { data: container } = await supabase.from('page_containers').insert({
              section_id: section.id,
              order: 0,
              direction: 'column',
              gap: '16px',
              align_items: 'center',
              justify_content: 'center',
              width: '100%',
              max_width: '1000px'
            }).select().single()

            if (container?.id) {
              // Widget 1: Título principal
              await supabase.from('page_widgets').insert({
                container_id: container.id,
                widget_type: 'heading',
                order: 0,
                content: {
                  title: title.trim(),
                  tag: 'h1',
                  align: 'center'
                },
                style: {
                  fontSize: '38px',
                  fontWeight: '700',
                  color: '#111827',
                  textAlign: 'center',
                  margin: '0 0 10px 0'
                }
              })

              // Se for padrão: subtítulo de apresentação
              if (template === 'standard') {
                await supabase.from('page_widgets').insert({
                  container_id: container.id,
                  widget_type: 'text',
                  order: 1,
                  content: {
                    text: 'Edite este texto e adicione novos blocos, produtos e imagens através do editor visual da Teknix.'
                  },
                  style: {
                    fontSize: '16px',
                    color: '#6b7280',
                    textAlign: 'center',
                    maxWidth: '680px',
                    margin: '0 auto'
                  }
                })
              }

              // Se for landing: subtítulo chamativo + botão de conversão
              if (template === 'landing') {
                await supabase.from('page_widgets').insert({
                  container_id: container.id,
                  widget_type: 'text',
                  order: 1,
                  content: {
                    text: 'Aproveite ofertas imperdíveis e condições exclusivas com alta performance e garantia.'
                  },
                  style: {
                    fontSize: '18px',
                    color: '#4b5563',
                    textAlign: 'center',
                    maxWidth: '640px',
                    margin: '0 auto 16px auto'
                  }
                })

                await supabase.from('page_widgets').insert({
                  container_id: container.id,
                  widget_type: 'button',
                  order: 2,
                  content: {
                    text: 'Explorar Ofertas',
                    link: '/produtos',
                    variant: 'primary'
                  },
                  style: {
                    background: '#0071e3',
                    color: '#ffffff',
                    padding: '12px 28px',
                    borderRadius: '980px',
                    fontWeight: '600',
                    fontSize: '15px'
                  }
                })
              }
            }
          }
        } catch (structErr) {
          console.warn('Erro ao criar estrutura inicial da página:', structErr)
        }

        setDialog(null)
        // Redireciona imediatamente para o editor da nova página!
        navigate(`/hub/editor/page/${row.id}`)
      }
    } catch (err: any) {
      setFormError(err.message || 'Não foi possível criar a página. Verifique os dados informados.')
    } finally {
      setBusy(false)
    }
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

  const currentSlugClean = (slug || (dialog?.kind === 'create' ? `/${slugify(title)}` : '')).replace(/^\/+/, '')
  const publicPreviewUrl = `${siteOrigin || 'http://localhost:5173'}/${currentSlugClean}`
  const isReservedRoute = currentSlugClean ? RESERVED_ROUTES.includes(currentSlugClean.split('/')[0]) : false

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
          onClick={openCreateModal}
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

      {/* POPUP / MODAL DE CRIAR OU DUPLICAR PÁGINA */}
      {dialog && (
        <div
          className="pages-confirm-overlay"
          onClick={e => {
            if (e.target === e.currentTarget && !busy) setDialog(null)
          }}
        >
          <form
            className="pages-modal-card"
            style={{
              maxWidth: 580,
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
            onSubmit={handleCreateOrDuplicate}
          >
            {/* Cabeçalho do Modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #f0f0f2',
              background: '#fafafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#e8f2ff',
                  color: '#0071e3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
                    {dialog.kind === 'create' ? 'Criar Nova Página' : 'Duplicar Página'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                    {dialog.kind === 'create'
                      ? 'Defina o nome e a URL pública da página. Você será redirecionado ao editor.'
                      : 'Crie uma cópia independente com novo nome e endereço.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={busy}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#86868b',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corpo do Formulário */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Campo Título */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>
                  <span>Título da Página <span style={{ color: '#ef4444' }}>*</span></span>
                  {dialog.kind === 'create' && autoSlug && (
                    <span style={{ fontSize: 11, color: '#0071e3', fontWeight: 500 }}>
                      Gerando URL automaticamente
                    </span>
                  )}
                </label>
                <input
                  required
                  autoFocus
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Ex: Black Friday 2026, Saldão de Ferramentas, Linha Titanium..."
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    border: '1px solid #d2d2d7',
                    borderRadius: 8,
                    fontSize: 14,
                    color: '#1d1d1f',
                    outline: 'none',
                    transition: 'border-color 0.15s'
                  }}
                />
              </div>

              {/* Campo Slug / URL */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>
                  Endereço Público (URL / Slug) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: isReservedRoute ? '1px solid #ef4444' : '1px solid #d2d2d7',
                  borderRadius: 8,
                  background: '#ffffff',
                  overflow: 'hidden'
                }}>
                  <span style={{
                    padding: '0 12px',
                    height: 42,
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f5f5f7',
                    color: '#6e6e73',
                    fontSize: 13,
                    fontFamily: 'ui-monospace, monospace',
                    borderRight: '1px solid #e5e5ea',
                    userSelect: 'none'
                  }}>
                    /
                  </span>
                  <input
                    required
                    value={slug.replace(/^\/+/, '')}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="exemplo-pagina"
                    style={{
                      flex: 1,
                      height: 42,
                      padding: '0 12px',
                      border: 'none',
                      outline: 'none',
                      fontSize: 13,
                      fontFamily: 'ui-monospace, monospace',
                      color: '#1d1d1f'
                    }}
                  />
                </div>
              </div>

              {/* Card de Prévia da URL Oficial no SITE (Porta 5173) */}
              <div style={{
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Globe size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      URL Pública no SITE:
                    </div>
                    <div style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#0f172a',
                      fontFamily: 'ui-monospace, monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {publicPreviewUrl}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  Porta 5173
                </span>
              </div>

              {/* Alerta de Rota Reservada ou Erro */}
              {(isReservedRoute || formError) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: 12.5
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    {formError || `O endereço "/${currentSlugClean}" é reservado pelo sistema da loja. Escolha outro endereço.`}
                  </div>
                </div>
              )}

              {/* Seleção de Modelo / Estrutura Inicial (apenas para criação) */}
              {dialog.kind === 'create' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                    Estrutura Inicial da Página
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      {
                        id: 'standard',
                        title: 'Padrão da Loja',
                        desc: 'Cabeçalho oficial, container com título e rodapé oficial.',
                        icon: Layout
                      },
                      {
                        id: 'landing',
                        title: 'Landing Page',
                        desc: 'Hero de destaque, chamada para ação e botão de ofertas.',
                        icon: Megaphone
                      },
                      {
                        id: 'blank',
                        title: 'Página em Branco',
                        desc: 'Canvas limpo pronto para adicionar qualquer widget.',
                        icon: Layers
                      }
                    ].map(item => {
                      const isSelected = template === item.id
                      const IconComp = item.icon
                      return (
                        <div
                          key={item.id}
                          onClick={() => setTemplate(item.id as any)}
                          style={{
                            padding: '12px 10px',
                            borderRadius: 10,
                            border: isSelected ? '2px solid #0071e3' : '1px solid #e5e5ea',
                            background: isSelected ? '#f5f9ff' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              background: isSelected ? '#0071e3' : '#f5f5f7',
                              color: isSelected ? '#ffffff' : '#6e6e73',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <IconComp size={14} />
                            </div>
                            {isSelected && <Check size={14} color="#0071e3" />}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#0071e3' : '#1d1d1f' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#86868b', lineHeight: 1.3 }}>
                            {item.desc}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé de Ações */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '16px 24px',
              background: '#fafafc',
              borderTop: '1px solid #f0f0f2'
            }}>
              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={busy}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid #d2d2d7',
                  background: '#ffffff',
                  color: '#1d1d1f',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy || !title.trim() || !slug.trim() || isReservedRoute}
                className="pages-primary-btn"
                style={{
                  padding: '9px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: (busy || !title.trim() || !slug.trim() || isReservedRoute) ? 0.5 : 1,
                  cursor: (busy || !title.trim() || !slug.trim() || isReservedRoute) ? 'not-allowed' : 'pointer'
                }}
              >
                {busy ? (
                  <span>Criando página…</span>
                ) : (
                  <>
                    <span>{dialog.kind === 'create' ? 'Criar e Abrir no Editor' : 'Duplicar e Abrir no Editor'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
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
                            onClick={() => openDuplicateModal(e)}
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
