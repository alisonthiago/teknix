import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getPages,
  deletePage,
  createPage,
  updatePage,
  duplicatePage,
  publishPage,
  unpublishPage,
  savePageTree,
  getDefaultSectionSettings,
  getDefaultContainerSettings,
  getDefaultWidgetSettings
} from '../services/pageBuilder'
import { PAGE_TEMPLATES } from '../presets/templates'
import type { Page } from '../types/pageBuilder'
import { usePermissions } from '../hooks/usePermissions'
import {
  Globe,
  Search,
  Plus,
  Pencil,
  Eye,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  X,
  Smartphone,
  Tablet,
  Monitor,
  Layout,
  FileText,
  Files,
  Lock,
  ShieldCheck
} from 'lucide-react'
import './PagesList.css'

const SYSTEM_PAGES: Page[] = [
  {
    id: 'system-page-conta',
    title: 'Conta — Página do Sistema',
    slug: 'conta',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-pedidos',
    title: 'Pedidos — Página do Sistema',
    slug: 'pedidos',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-order-list',
    title: 'Lista de Pedidos — Página do Sistema',
    slug: 'order/list',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-order-verify',
    title: 'Verificar Pedido — Página do Sistema',
    slug: 'order/link/verify',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-salvos',
    title: 'Itens Salvos — Página do Sistema',
    slug: 'salvos',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-sacola',
    title: 'Sacola — Página do Sistema',
    slug: 'sacola',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-login',
    title: 'Iniciar Sessão — Página do Sistema',
    slug: 'login',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-cadastro',
    title: 'Cadastro — Página do Sistema',
    slug: 'cadastro',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-password',
    title: 'Recuperar Senha — Página do Sistema',
    slug: 'password',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-contato',
    title: 'Contato — Página do Sistema',
    slug: 'contato',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  },
  {
    id: 'system-page-checkout',
    title: 'Checkout Oficial — Página do Sistema',
    slug: 'checkout',
    type: 'system' as any,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_system: true,
  }
] as any[]

export default function PagesList() {
  const { can } = usePermissions()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'store' | 'system' | 'published' | 'draft'>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')
  const [newPageType, setNewPageType] = useState<string>('custom')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('template-home-teknix')
  const [isCreating, setIsCreating] = useState(false)

  // Preview Modal
  const [previewPage, setPreviewPage] = useState<Page | null>(null)
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Delete Confirmation Modal
  const [deleteTargetPage, setDeleteTargetPage] = useState<Page | null>(null)
  const [deleteInputText, setDeleteInputText] = useState('')
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    loadPages()
  }, [])

  async function loadPages() {
    setLoading(true)
    try {
      const data = await getPages()
      const systemSlugs = ['conta', 'pedidos', 'order/list', 'order/link/verify', 'salvos', 'sacola', 'login', 'cadastro', 'password', 'contato', 'checkout']

      const missingSystemPages = SYSTEM_PAGES.filter(
        sp => !data.some(p => p.slug === sp.slug || p.slug === `/${sp.slug}`)
      )

      const mappedData = data.map(p => {
        const cleanSlug = p.slug.replace(/^\//, '')
        if (systemSlugs.includes(cleanSlug) || (p as any).page_type === 'system') {
          const sys = SYSTEM_PAGES.find(s => s.slug === cleanSlug)
          return {
            ...p,
            title: sys ? sys.title : `${p.title} — Página do Sistema`,
            type: 'system' as any,
            is_system: true,
          }
        }
        return p
      })
      const storePages = mappedData.filter(p => !(p as any).is_system && p.type !== 'system')
      const systemPages = [
        ...mappedData.filter(p => (p as any).is_system || p.type === 'system'),
        ...missingSystemPages
      ]
      setPages([...storePages, ...systemPages])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleConfirmDelete() {
    if (!deleteTargetPage) return
    if (!can('pages.delete')) {
      alert('Acesso negado: Você não possui permissão para excluir páginas.')
      setDeleteTargetPage(null)
      return
    }
    if (deleteInputText.trim().toUpperCase() !== 'EXCLUIR') return
    setDeleteSubmitting(true)
    try {
      await deletePage(deleteTargetPage.id)
      setPages(pages.filter(p => p.id !== deleteTargetPage.id))
      setDeleteTargetPage(null)
      setDeleteInputText('')
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir página.')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  async function handleTogglePublish(page: Page) {
    if (!can('pages.publish')) {
      alert('Acesso negado: Você não possui permissão para publicar ou despublicar páginas.')
      return
    }
    const isCurrentlyPublished = page.status === 'published'
    setActionLoadingId(page.id)
    try {
      if (isCurrentlyPublished) {
        await unpublishPage(page.id)
        setPages(pages.map(p => p.id === page.id ? { ...p, status: 'draft' as any } : p))
      } else {
        await publishPage(page.id)
        setPages(pages.map(p => p.id === page.id ? { ...p, status: 'published' as any } : p))
      }
    } catch (e) {
      console.error('Erro ao alternar publicação:', e)
      alert('Erro ao alterar status da página.')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDuplicate(page: Page) {
    setActionLoadingId(page.id)
    try {
      const cloned = await duplicatePage(page.id)
      if (cloned) {
        setPages([cloned, ...pages])
      }
    } catch (e) {
      console.error(e)
      alert('Erro ao duplicar página.')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleCopyUrl(slug: string, id: string) {
    const url = `${window.location.origin.replace(':5174', ':5173')}/${slug.replace(/^\//, '')}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault()
    if (!can('pages.create')) {
      alert('Acesso negado: Você não possui permissão para criar novas páginas.')
      setIsModalOpen(false)
      return
    }
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      alert('Preencha título e URL da página.')
      return
    }

    setIsCreating(true)
    try {
      const cleanSlug = newPageSlug.trim().toLowerCase().replace(/^\//, '').replace(/\s+/g, '-')
      const created = await createPage({
        title: newPageTitle.trim(),
        slug: cleanSlug,
        type: newPageType as any,
        status: 'draft',
        is_landing_mode: false,
        version: 1,
        seo_title: `${newPageTitle.trim()} — TEKNIX`,
        seo_description: '',
      })

      if (created) {
        if (selectedTemplateId && selectedTemplateId !== 'blank') {
          const tpl = PAGE_TEMPLATES.find(t => t.id === selectedTemplateId)
          if (tpl && (tpl as any).sections && (tpl as any).sections.length > 0) {
            const seededSections = (tpl as any).sections.map((sSchema: any, sIdx: number) => {
              const sId = `${created.id}-s${sIdx + 1}`
              return {
                id: sId,
                page_id: created.id,
                type: sSchema.type || 'section',
                order: sIdx,
                ...getDefaultSectionSettings(sSchema.type || 'section'),
                ...(sSchema.settings || {}),
                responsive: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                containers: (sSchema.containers || []).map((cSchema: any, cIdx: number) => {
                  const cId = `${created.id}-c${sIdx + 1}-${cIdx + 1}`
                  return {
                    id: cId,
                    section_id: sId,
                    type: 'container',
                    order: cIdx,
                    ...getDefaultContainerSettings(),
                    ...(cSchema.settings || {}),
                    responsive: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    widgets: (cSchema.widgets || []).map((wSchema: any, wIdx: number) => ({
                      id: `${created.id}-w${sIdx + 1}-${cIdx + 1}-${wIdx + 1}`,
                      container_id: cId,
                      type: wSchema.type,
                      order: wIdx,
                      content: wSchema.content || {},
                      ...getDefaultWidgetSettings(),
                      ...(wSchema.settings || {}),
                      responsive: {},
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }))
                  }
                })
              }
            })
            await savePageTree(created.id, seededSections as any)
          }
        }
        setIsModalOpen(false)
        setNewPageTitle('')
        setNewPageSlug('')
        navigate(`/editor/page/${created.id}`)
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao criar página.')
    } finally {
      setIsCreating(false)
    }
  }

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const typeLabels: Record<string, string> = {
    home: 'Home',
    product: 'Produto',
    category: 'Categoria',
    segmento: 'Segmento',
    campaign: 'Campanha',
    custom: 'Personalizada',
    system: 'Sistema',
  }

  const storeCount = pages.filter(p => !(p as any).is_system && p.type !== 'system').length
  const systemCount = pages.filter(p => (p as any).is_system || p.type === 'system').length
  const publishedCount = pages.filter(p => p.status === 'published').length
  const draftCount = pages.filter(p => p.status !== 'published').length

  const filtered = pages.filter(p => {
    if (statusFilter === 'store' && ((p as any).is_system || p.type === 'system')) return false
    if (statusFilter === 'system' && !(p as any).is_system && p.type !== 'system') return false
    if (statusFilter === 'published' && p.status !== 'published') return false
    if (statusFilter === 'draft' && p.status === 'published') return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const titleMatch = (p.title || '').toLowerCase().includes(q)
      const slugMatch = (p.slug || '').toLowerCase().includes(q)
      return titleMatch || slugMatch
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const validCurrentPage = Math.min(currentPage, totalPages)
  const paginatedPages = filtered.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize)

  return (
    <div className="pages-page-container">
      {/* Header */}
      <div className="pages-page-header">
        <div className="pages-header-titles">
          <h1 className="pages-main-title">Páginas</h1>
          <p className="pages-main-subtitle">
            Gerencie todas as páginas públicas, landing pages e rascunhos da loja TEKNIX.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} /> Nova página
        </button>
      </div>

      {/* Toolbar & Filters (FLOW Segmented Tabs) */}
      <div className="pages-toolbar-row">
        <div className="pages-segmented-group">
          <button
            className={`pages-seg-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          >
            Todas <span className="seg-count">{pages.length}</span>
          </button>
          <button
            className={`pages-seg-btn ${statusFilter === 'store' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('store'); setCurrentPage(1); }}
          >
            Páginas da Loja <span className="seg-count">{storeCount}</span>
          </button>
          <button
            className={`pages-seg-btn ${statusFilter === 'system' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('system'); setCurrentPage(1); }}
          >
            Páginas do Sistema <span className="seg-count">{systemCount}</span>
          </button>
          <button
            className={`pages-seg-btn ${statusFilter === 'published' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('published'); setCurrentPage(1); }}
          >
            Publicadas <span className="seg-count">{publishedCount}</span>
          </button>
          <button
            className={`pages-seg-btn ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('draft'); setCurrentPage(1); }}
          >
            Rascunhos <span className="seg-count">{draftCount}</span>
          </button>
        </div>

        <div className="pages-filters-right">
          {/* Search Box */}
          <div className="pages-search-box">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por título ou URL..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pages-search-field"
            />
          </div>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="pages-select-type"
          >
            <option value="all">Todos os tipos</option>
            <option value="home">Home</option>
            <option value="product">Produto</option>
            <option value="category">Categoria</option>
            <option value="segmento">Segmento</option>
            <option value="campaign">Campanha</option>
            <option value="custom">Personalizada</option>
            <option value="system">Sistema</option>
          </select>
        </div>
      </div>

      {/* Pages Table (FLOW Table Design) */}
      {loading ? (
        <div className="pages-loading-box">
          <div className="spinner"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pages-empty-box">
          <Globe size={32} color="#9ca3af" />
          <h3 className="empty-title">Nenhuma página encontrada</h3>
          <p className="empty-desc">Crie uma nova página visual com o Page Builder da TEKNIX.</p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} /> Criar nova página
          </button>
        </div>
      ) : (
        <div className="pages-table-wrapper">
          <table className="pages-data-table">
            <thead>
              <tr>
                <th>Página</th>
                <th>Tipo</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPages.map(page => {
                const isPublished = page.status === 'published'
                const isSystem = (page as any).is_system || page.type === 'system' || page.slug === 'conta' || page.slug === '/conta' || (page as any).page_type === 'system'
                const publicUrl = isSystem ? 'http://localhost:5173/conta' : `http://localhost:5173/${page.slug.replace(/^\//, '')}`

                return (
                  <tr key={page.id} className="pages-table-row">
                    {/* Title + Slug */}
                    <td>
                      <div className="table-info-cell">
                        <div className="table-icon-pill">
                          {isSystem ? (
                            <Lock size={14} />
                          ) : page.type === 'home' ? (
                            <Layout size={14} />
                          ) : (
                            <FileText size={14} />
                          )}
                        </div>
                        <div className="table-title-column">
                          <span className="table-title-main">
                            {page.title || 'Sem título'}
                          </span>
                          <div className="table-url-row">
                            <span className="table-url-text">/{page.slug.replace(/^\//, '')}</span>
                            <button
                              type="button"
                              className="table-copy-icon"
                              onClick={() => handleCopyUrl(page.slug, page.id)}
                              title="Copiar link"
                            >
                              {copiedId === page.id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td>
                      <span className={`table-type-tag ${isSystem ? 'system-tag' : ''}`}>
                        {typeLabels[page.type] || page.type || 'Página'}
                      </span>
                    </td>

                    {/* Status Pill Toggle */}
                    <td>
                      {isSystem ? (
                        <span className="table-status-pill system-active" title="Página nativa do sistema">
                          <span className="status-bullet" /> Nativa
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={`table-status-pill ${isPublished ? 'published' : 'draft'}`}
                          onClick={() => handleTogglePublish(page)}
                          title="Alternar entre Publicada e Rascunho"
                        >
                          <span className="status-bullet" />
                          {isPublished ? 'Publicada' : 'Rascunho'}
                        </button>
                      )}
                    </td>

                    {/* Actions Cell */}
                    <td>
                      <div className="table-actions-group">
                        {isSystem ? (
                          <>
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-action-icon-btn"
                              title="Visualizar no site"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </>
                        ) : (
                          <>
                            <a
                              href={`/editor/page/${page.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-action-btn edit"
                              title="Abrir no Page Builder"
                            >
                              <Pencil size={12} /> Editar
                            </a>

                            <button
                              type="button"
                              className="table-action-icon-btn"
                              onClick={() => setPreviewPage(page)}
                              title="Pré-visualizar"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              type="button"
                              className="table-action-icon-btn"
                              onClick={() => handleDuplicate(page)}
                              disabled={actionLoadingId === page.id}
                              title="Duplicar página"
                            >
                              <Files size={14} />
                            </button>

                            {isPublished && (
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="table-action-icon-btn"
                                title="Abrir página no site oficial"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}

                            <button
                              type="button"
                              className="table-action-icon-btn delete"
                              onClick={() => {
                                setDeleteTargetPage(page)
                                setDeleteInputText('')
                              }}
                              title="Excluir página"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination & Limitador Footer */}
          <div className="pages-pagination-footer">
            <div className="pagination-info">
              <span>
                Exibindo <strong>{filtered.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0}</strong>–<strong>{Math.min(validCurrentPage * pageSize, filtered.length)}</strong> de <strong>{filtered.length}</strong> páginas
              </span>
              <div className="pagination-page-size">
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Exibir:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="pagination-select"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={validCurrentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`pagination-num-btn ${validCurrentPage === num ? 'active' : ''}`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={validCurrentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Próximo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Nova Página */}
      {isModalOpen && (
        <div className="pages-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="pages-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pages-modal-header">
              <h3 className="modal-title">Nova Página</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePage}>
              <div className="pages-modal-body">
                <div className="modal-field-group">
                  <label className="modal-label">Título da página</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Ex: Ofertas de Inverno"
                    value={newPageTitle}
                    onChange={(e) => {
                      setNewPageTitle(e.target.value)
                      if (!newPageSlug || newPageSlug === '') {
                        setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                      }
                    }}
                    required
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">Caminho da URL (Slug)</label>
                  <div className="modal-slug-wrap">
                    <span className="slug-prefix">/</span>
                    <input
                      type="text"
                      className="modal-input slug-input"
                      placeholder="ofertas-de-inverno"
                      value={newPageSlug}
                      onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, ''))}
                    />
                  </div>
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">Tipo de Página</label>
                  <select
                    className="modal-select"
                    value={newPageType}
                    onChange={(e) => setNewPageType(e.target.value)}
                  >
                    <option value="home">Home / Página Inicial</option>
                    <option value="landing">Landing Page / Campanha</option>
                    <option value="product">Apresentação de Produto</option>
                    <option value="segment">Segmento de Loja</option>
                    <option value="category">Categoria de Produtos</option>
                    <option value="institutional">Institucional / Sobre</option>
                    <option value="custom">Página Personalizada</option>
                  </select>
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">Modelo Inicial (Template)</label>
                  <p className="modal-sub-label">Selecione uma estrutura pronta para começar:</p>
                  
                  <div className="modal-template-grid">
                    {PAGE_TEMPLATES.map(t => {
                      const isSelected = selectedTemplateId === t.id
                      return (
                        <div
                          key={t.id}
                          className={`modal-tpl-item ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedTemplateId(t.id)}
                        >
                          <div className="modal-tpl-header">
                            <div className="modal-tpl-icon-box">
                              {t.type === 'home' && <Globe size={18} />}
                              {t.type === 'product' && <Layout size={18} />}
                              {t.type === 'landing' && <FileText size={18} />}
                              {t.type === 'blank' && <Plus size={18} />}
                              {t.type !== 'home' && t.type !== 'product' && t.type !== 'landing' && t.type !== 'blank' && <Files size={18} />}
                            </div>
                            <div className={`modal-tpl-check ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <Check size={12} />}
                            </div>
                          </div>
                          <div className="modal-tpl-name">{t.name}</div>
                          <div className="modal-tpl-desc">{t.description}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="pages-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? 'Criando...' : 'Criar e abrir editor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão (Exigindo Digitar EXCLUIR) */}
      {/* Modal: Confirmação de Exclusão (Direto e Objetivo) */}
      {deleteTargetPage && (
        <div className="pages-modal-overlay" onClick={() => setDeleteTargetPage(null)}>
          <div className="pages-modal-card delete-confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="pages-modal-header" style={{ borderBottom: '1px solid #fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={16} />
                </div>
                <h3 className="modal-title" style={{ color: '#991b1b' }}>Excluir página</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDeleteTargetPage(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="pages-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px' }}>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: 1.5 }}>
                Você está prestes a excluir permanentemente esta página e todo o seu conteúdo.
              </p>

              <div className="modal-field-group" style={{ marginTop: '4px' }}>
                <label className="modal-label" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                  Para confirmar, digite <span style={{ color: '#ef4444', fontWeight: 700 }}>EXCLUIR</span> abaixo:
                </label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="EXCLUIR"
                  value={deleteInputText}
                  onChange={(e) => setDeleteInputText(e.target.value)}
                  autoFocus
                  style={{
                    borderColor: deleteInputText.trim().toUpperCase() === 'EXCLUIR' ? '#22c55e' : '#e5e7eb',
                    fontWeight: 600,
                    letterSpacing: '1px'
                  }}
                />
              </div>
            </div>

            <div className="pages-modal-footer" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTargetPage(null)}
                disabled={deleteSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                disabled={deleteInputText.trim().toUpperCase() !== 'EXCLUIR' || deleteSubmitting}
                onClick={handleConfirmDelete}
                style={{
                  background: deleteInputText.trim().toUpperCase() === 'EXCLUIR' ? '#dc2626' : '#fca5a5',
                  color: '#ffffff',
                  border: 'none',
                  cursor: deleteInputText.trim().toUpperCase() === 'EXCLUIR' ? 'pointer' : 'not-allowed',
                  opacity: deleteInputText.trim().toUpperCase() === 'EXCLUIR' ? 1 : 0.65,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} />
                {deleteSubmitting ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview Responsivo */}
      {previewPage && (
        <div className="pages-modal-overlay" onClick={() => setPreviewPage(null)}>
          <div className="preview-modal-shell" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-topbar">
              <div className="preview-top-info">
                <span className="preview-page-title">{previewPage.title || 'Sem título'}</span>
                <span className="preview-page-url">http://localhost:5173/preview/{previewPage.id}</span>
              </div>

              <div className="preview-viewports-switch">
                <button
                  className={`view-btn ${previewViewport === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewViewport('desktop')}
                >
                  <Monitor size={14} /> Desktop
                </button>
                <button
                  className={`view-btn ${previewViewport === 'tablet' ? 'active' : ''}`}
                  onClick={() => setPreviewViewport('tablet')}
                >
                  <Tablet size={14} /> Tablet
                </button>
                <button
                  className={`view-btn ${previewViewport === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewViewport('mobile')}
                >
                  <Smartphone size={14} /> Mobile
                </button>
                <a
                  href={`http://localhost:5173/preview/${previewPage.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-btn"
                  style={{ textDecoration: 'none', color: '#1d1d1f' }}
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={14} />
                </a>
              </div>

              <button className="modal-close-btn" onClick={() => setPreviewPage(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="preview-frame-area">
              <iframe
                src={`http://localhost:5173/preview/${previewPage.id}`}
                className={`preview-active-iframe ${previewViewport}`}
                title="Pré-visualização da página"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
