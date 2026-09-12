import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutGrid, List, FileText, CircleCheck, FilePenLine, Plus, Eye, Edit, Trash2, ExternalLink } from 'lucide-react'
import { HubDataTable, type HubColumn, useBulkDelete } from '../components/ui/HubDataTable'
import { HubTableToolbar } from '../components/ui/HubDataTable/HubTableToolbar'
import '../components/ui/HubDataTable/HubDataTable.css'
import './BlogList.css'
import './BlogViews.css'
import '../components/ui/HubDataTable/HubKpi.css'

interface BlogPost {
  id: string
  title: string
  slug: string
  summary: string
  cover_image: string | null
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  author_name: string | null
}

const TABLE_COLUMNS: HubColumn<BlogPost>[] = [
  {
    key: 'title',
    label: 'Título',
    render: (p) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {p.cover_image ? (
          <img src={p.cover_image} alt={p.title} style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 30, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={14} color="#9ca3af" />
          </div>
        )}
        <div>
          <div className="hub-cell-bold" style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
          {p.slug && <div style={{ fontSize: 11, color: '#9ca3af' }}>/blog/{p.slug}</div>}
        </div>
      </div>
    ),
    exportValue: (p) => p.title,
  },
  {
    key: 'author_name',
    label: 'Autor',
    width: '140px',
    render: (p) => <span className="hub-cell-muted">{p.author_name || '—'}</span>,
    exportValue: (p) => p.author_name || '',
  },
  {
    key: 'status',
    label: 'Status',
    width: '120px',
    render: (p) => (
      <span className={`hub-status-badge ${p.status === 'published' ? 'hub-badge-green' : 'hub-badge-yellow'}`}>
        <span className="hub-badge-dot" />
        {p.status === 'published' ? 'Publicado' : 'Rascunho'}
      </span>
    ),
    exportValue: (p) => p.status === 'published' ? 'Publicado' : 'Rascunho',
  },
  {
    key: 'created_at',
    label: 'Criado em',
    width: '120px',
    render: (p) => (
      <span className="hub-cell-muted">
        {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </span>
    ),
    exportValue: (p) => new Date(p.created_at).toLocaleDateString('pt-BR'),
  },
]

export default function BlogList() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, summary, cover_image, status, published_at, created_at, author_name')
        .order('created_at', { ascending: false })
      if (data) setPosts(data)
    } catch { setPosts([]) }
    finally { setLoading(false) }
  }

  async function handleToggleStatus(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      await supabase.from('blog_posts').update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null
      }).eq('id', post.id)
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus as any } : p))
    } catch { alert('Erro ao alterar status.') }
  }

  async function handleDeletePosts(ids: string[]) {
    try {
      await supabase.from('blog_posts').delete().in('id', ids)
      setPosts(prev => prev.filter(p => !ids.includes(p.id)))
    } catch { alert('Erro ao excluir post(s).') }
  }

  const confirmDelete = useBulkDelete(handleDeletePosts, 'post')

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.summary || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="hub-page-container">
      <div className="hub-page-wrapper">

        {/* Top Actions */}
        <div className="hub-table-top-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
          <button className="hub-btn hub-btn-secondary" onClick={() => navigate('/hub/blog/analytics')}>Analytics</button>
          <button className="hub-btn hub-btn-secondary" onClick={() => navigate('/hub/blog/seo')}>SEO</button>
          <button className="hub-btn hub-btn-primary" onClick={() => navigate('/hub/blog/add')}>
            <Plus size={14} /> Novo Post
          </button>
        </div>

        {/* Stats */}
        <div className="hub-kpi-grid">
          {[
            { label: 'Total de Posts', value: posts.length, icon: <FileText size={18} />, color: '#6b7280' },
            { label: 'Publicados', value: posts.filter(p => p.status === 'published').length, icon: <CircleCheck size={18} />, color: '#16a34a' },
            { label: 'Rascunhos', value: posts.filter(p => p.status === 'draft').length, icon: <FilePenLine size={18} />, color: '#ca8a04' },
          ].map((s, i) => (
            <div key={i} className="hub-kpi-card hub-kpi-card--compact">
              <div className="hub-kpi-header"><span className="hub-kpi-label">{s.label}</span><div className="hub-kpi-icon">{s.icon}</div></div>
              <div className="hub-kpi-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar + View Toggle */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <HubTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar posts por título ou resumo"
            exportColumns={TABLE_COLUMNS.filter(c => c.exportValue).map(c => ({ key: c.key, label: c.label }))}
            exportRows={filtered.map(p => {
              const r: Record<string, any> = {}
              TABLE_COLUMNS.forEach(c => { if (c.exportValue) r[c.key] = c.exportValue(p) })
              return r
            })}
            exportTitle="Blog"
            exportFilename="blog-posts"
          />
          {/* Status filter */}
          {(['all', 'published', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid',
                cursor: 'pointer', fontSize: 13, fontWeight: filterStatus === s ? 700 : 500,
                background: filterStatus === s ? '#1a1a1a' : '#fff',
                color: filterStatus === s ? '#fff' : '#374151',
                borderColor: filterStatus === s ? '#1a1a1a' : '#e5e7eb',
                fontFamily: 'inherit'
              }}
            >
              {s === 'all' ? 'Todos' : s === 'published' ? 'Publicados' : 'Rascunhos'}
            </button>
          ))}
          {/* View mode */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 2, gap: 2, marginLeft: 'auto' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? '#fff' : 'transparent', color: viewMode === 'grid' ? '#111' : '#9ca3af', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
              aria-label="Visualizar em grade"
            ><LayoutGrid size={16} /></button>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#111' : '#9ca3af', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
              aria-label="Visualizar em lista"
            ><List size={16} /></button>
          </div>
        </div>

        {/* Grid Mode */}
        {viewMode === 'grid' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>Carregando posts...</div>
          ) : filtered.length === 0 ? (
            <div className="hub-empty-state">
              <div className="hub-empty-icon"><FileText size={22} /></div>
              <p className="hub-empty-title">{search ? 'Nenhum post encontrado' : 'Nenhum post criado ainda'}</p>
              <p className="hub-empty-desc">{search ? 'Tente outro termo.' : 'Clique em "Novo Post" para começar.'}</p>
            </div>
          ) : (
            <div className="blog-posts-grid">
              {filtered.map(post => (
                <div key={post.id} className="blog-post-card">
                  {post.cover_image && (
                    <div className="blog-post-cover">
                      <img src={post.cover_image} alt={post.title} />
                    </div>
                  )}
                  <div className="blog-post-body">
                    <div className="blog-post-meta-top">
                      <span className={`blog-status-badge ${post.status}`}>
                        {post.status === 'published' ? '● Publicado' : '○ Rascunho'}
                      </span>
                      <span className="blog-post-date">
                        {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="blog-post-title">{post.title}</h3>
                    {post.summary && <p className="blog-post-summary">{post.summary}</p>}
                    {post.slug && (
                      <div className="blog-post-url">
                        <ExternalLink size={12} />
                        <span>/blog/{post.slug}</span>
                      </div>
                    )}
                  </div>
                  <div className="blog-post-actions">
                    <Link to={`/hub/blog/editar/${post.id}`} className="blog-action-btn edit">
                      <Edit size={14} /> Editar
                    </Link>
                    <button className={`blog-action-btn ${post.status === 'published' ? 'unpublish' : 'publish'}`}
                      onClick={() => handleToggleStatus(post)}>
                      {post.status === 'published' ? 'Despublicar' : 'Publicar'}
                    </button>
                    {post.status === 'published' && (
                      <a href={`http://localhost:5173/blog/${post.slug}`} target="_blank" rel="noreferrer" className="blog-action-btn view">
                        <Eye size={14} /> Ver
                      </a>
                    )}
                    <button className="blog-action-btn delete" onClick={() => confirmDelete([post.id])}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* List/Table Mode */}
        {viewMode === 'list' && (
          <HubDataTable
            title=""
            columns={TABLE_COLUMNS}
            rows={filtered}
            loading={loading}
            entityLabel="post"
            emptyMessage="Nenhum post encontrado."
            bulkActions={[
              { label: 'Excluir', icon: <Trash2 size={13} />, action: confirmDelete, variant: 'danger' },
            ]}
            renderRowActions={(post, onClose) => (
              <>
                <Link to={`/hub/blog/editar/${post.id}`} className="hub-dropdown-item" onClick={onClose}>
                  <Edit size={14} color="#2563eb" /> Editar post
                </Link>
                <button className="hub-dropdown-item" onClick={() => { onClose(); handleToggleStatus(post) }}>
                  {post.status === 'published' ? '○ Despublicar' : '● Publicar'}
                </button>
                {post.status === 'published' && (
                  <a href={`http://localhost:5173/blog/${post.slug}`} target="_blank" rel="noreferrer"
                    className="hub-dropdown-item" onClick={onClose}>
                    <Eye size={14} color="#16a34a" /> Ver no site
                  </a>
                )}
                <div className="hub-dropdown-divider" />
                <button className="hub-dropdown-item delete" onClick={() => { onClose(); confirmDelete([post.id]) }}>
                  <Trash2 size={14} color="#dc2626" /> Excluir post
                </button>
              </>
            )}
          />
        )}
      </div>
    </div>
  )
}
