import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './BlogList.css'
import './BlogViews.css'
import { LayoutGrid, List, FileText, CircleCheck, FilePenLine } from 'lucide-react'

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

export default function BlogList() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [viewMode,setViewMode] = useState<'grid'|'list'>('grid')

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, summary, cover_image, status, published_at, created_at, author_name')
        .order('created_at', { ascending: false })
      if (data) setPosts(data)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este post permanentemente?')) return
    setDeleting(id)
    try {
      await supabase.from('blog_posts').delete().eq('id', id)
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Erro ao excluir post.')
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleStatus(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const update: any = {
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null
    }
    try {
      await supabase.from('blog_posts').update(update).eq('id', post.id)
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...update } : p))
    } catch {
      alert('Erro ao alterar status.')
    }
  }

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.summary || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const publishedCount = posts.filter(p => p.status === 'published').length
  const draftCount = posts.filter(p => p.status === 'draft').length

  return (
    <div className="blog-list-page">
      <div className="blog-list-header">
        <div className="blog-list-header-left">
          <h2 className="blog-list-title">Blog</h2>
          <p className="blog-list-subtitle">Crie e gerencie artigos publicados no site público</p>
        </div>
        <div className="blog-header-actions">
        <button className="blog-tool-btn" onClick={() => navigate('/hub/blog/analytics')}>Analytics</button>
        <button className="blog-tool-btn" onClick={() => navigate('/hub/blog/seo')}>SEO</button>
        <button className="blog-new-btn" onClick={() => navigate('/hub/blog/add')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Post
        </button>
        </div>
      </div>

      <div className="blog-stats-row">
        <div className="blog-stat-card">
          <FileText size={20} className="blog-stat-icon" aria-hidden="true" />
          <span className="blog-stat-num">{posts.length}</span>
          <span className="blog-stat-label">Total de posts</span>
        </div>
        <div className="blog-stat-card published">
          <CircleCheck size={20} className="blog-stat-icon" aria-hidden="true" />
          <span className="blog-stat-num">{publishedCount}</span>
          <span className="blog-stat-label">Publicados</span>
        </div>
        <div className="blog-stat-card draft">
          <FilePenLine size={20} className="blog-stat-icon" aria-hidden="true" />
          <span className="blog-stat-num">{draftCount}</span>
          <span className="blog-stat-label">Rascunhos</span>
        </div>
      </div>

      <div className="blog-filters-row">
        <div className="blog-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="blog-search-input"
          />
        </div>
        <div className="blog-view-toggle" role="group" aria-label="Visualização dos posts">
          <button type="button" aria-label="Visualizar em grade" aria-pressed={viewMode==='grid'} onClick={()=>setViewMode('grid')}><LayoutGrid size={18}/></button>
          <button type="button" aria-label="Visualizar em lista" aria-pressed={viewMode==='list'} onClick={()=>setViewMode('list')}><List size={18}/></button>
        </div>
        <div className="blog-status-tabs">
          {(['all', 'published', 'draft'] as const).map(s => (
            <button
              key={s}
              className={`blog-status-tab ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? 'Todos' : s === 'published' ? 'Publicados' : 'Rascunhos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="blog-loading">
          <div className="blog-loading-spinner" />
          <span>Carregando posts...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="blog-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="56" height="56">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h3>{search ? 'Nenhum post encontrado' : 'Nenhum post criado ainda'}</h3>
          <p>{search ? 'Tente outro termo de busca.' : 'Clique em "Novo Post" para começar.'}</p>
          {!search && (
            <button className="blog-new-btn" onClick={() => navigate('/hub/blog/add')}>
              Criar primeiro post
            </button>
          )}
        </div>
      ) : (
        <div className={`blog-posts-grid ${viewMode==='list' ? 'is-list' : ''}`}>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>/blog/{post.slug}</span>
                  </div>
                )}
              </div>
              <div className="blog-post-actions">
                <Link to={`/hub/blog/editar/${post.id}`} className="blog-action-btn edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar
                </Link>
                <button
                  className={`blog-action-btn ${post.status === 'published' ? 'unpublish' : 'publish'}`}
                  onClick={() => handleToggleStatus(post)}
                >
                  {post.status === 'published' ? 'Despublicar' : 'Publicar'}
                </button>
                {post.status === 'published' && (
                  <a
                    href={`http://localhost:5173/blog/${post.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="blog-action-btn view"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Ver
                  </a>
                )}
                <button
                  className="blog-action-btn delete"
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
