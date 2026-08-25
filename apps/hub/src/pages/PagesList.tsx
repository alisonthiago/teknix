import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPages, deletePage } from '../services/pageBuilder'
import type { Page } from '../types/pageBuilder'
import './PagesList.css'

export default function PagesList() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    loadPages()
  }, [])

  async function loadPages() {
    setLoading(true)
    try {
      const data = await getPages()
      setPages(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta página?')) return
    await deletePage(id)
    setPages(pages.filter(p => p.id !== id))
  }

  const filtered = filter
    ? pages.filter(p => p.type === filter)
    : pages

  const typeLabels: Record<string, string> = {
    home: 'Home',
    product: 'Produto',
    category: 'Categoria',
    segmento: 'Segmento',
    campaign: 'Campanha',
    custom: 'Personalizada',
  }

  return (
    <div className="pages-list-page">
      <div className="page-header">
        <div className="header-info">
          <h2>Páginas</h2>
          <p>{pages.length} página{pages.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <Link to="/hub/paginas/nova" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova página
          </Link>
        </div>
      </div>

      <div className="pages-filters">
        <button className={`filter-chip ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>
          Todas
        </button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            className={`filter-chip ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>Nenhuma página encontrada</h3>
          <p>Comece criando sua primeira página</p>
          <Link to="/hub/paginas/nova" className="btn btn-primary">
            Criar página
          </Link>
        </div>
      ) : (
        <div className="pages-grid">
          {filtered.map(page => (
            <div key={page.id} className="page-card">
              <div className="page-card-header">
                <span className={`page-type-badge ${page.type}`}>
                  {typeLabels[page.type] || page.type}
                </span>
                <span className={`page-status ${page.status}`}>
                  {page.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
              <div className="page-card-body">
                <h3>{page.title || 'Sem título'}</h3>
                <span className="page-slug">/{page.slug}</span>
              </div>
              <div className="page-card-footer">
                <Link to={`/hub/paginas/editar/${page.id}`} className="page-action primary">
                  Editar
                </Link>
                <button
                  className="page-action danger"
                  onClick={() => handleDelete(page.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
