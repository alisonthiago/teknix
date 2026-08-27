import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getThemes, createTheme, deleteTheme } from '../services/pageBuilder'
import type { Theme } from '../types/pageBuilder'
import { Palette } from 'lucide-react'
import './ThemesList.css'

export default function ThemesList() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | ''>('')
  const navigate = useNavigate()

  useEffect(() => {
    loadThemes()
  }, [])

  async function loadThemes() {
    setLoading(true)
    try {
      const data = await getThemes()
      setThemes(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleCreate() {
    try {
      const theme = await createTheme({
        name: `Tema ${themes.length + 1}`,
        slug: `tema-${Date.now()}`,
      })
      navigate(`/hub/temas/editar/${theme.id}`)
    } catch (e) {
      console.error(e)
      alert('Erro ao criar tema')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir o tema "${name}"?`)) return
    try {
      await deleteTheme(id)
      setThemes(themes.filter(t => t.id !== id))
    } catch (e) {
      console.error(e)
      alert('Erro ao excluir tema')
    }
  }

  const filtered = statusFilter
    ? themes.filter(t => t.status === statusFilter)
    : themes

  return (
    <div className="themes-list-page">
      <div className="page-header">
        <div className="header-info">
          <h1>Temas</h1>
          <p>Personalize cores, tipografia e design tokens da loja TEKNIX.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo tema
          </button>
        </div>
      </div>

      <div className="themes-filters">
        <button
          className={`filter-chip ${!statusFilter ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          Todos
        </button>
        <button
          className={`filter-chip ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          Ativos
        </button>
        <button
          className={`filter-chip ${statusFilter === 'archived' ? 'active' : ''}`}
          onClick={() => setStatusFilter('archived')}
        >
          Arquivados
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Palette size={48} />
          </div>
          <h3>Nenhum tema encontrado</h3>
          <p>Comece criando seu primeiro tema</p>
          <button className="btn btn-primary" onClick={handleCreate}>
            Criar tema
          </button>
        </div>
      ) : (
        <div className="themes-grid">
          {filtered.map(theme => (
            <div key={theme.id} className="theme-card">
              <div className="theme-preview">
                <div className="color-row">
                  <div
                    className="color-dot"
                    style={{ background: theme.color_primary }}
                    title={`Primária: ${theme.color_primary}`}
                  />
                  <div
                    className="color-dot"
                    style={{ background: theme.color_secondary }}
                    title={`Secundária: ${theme.color_secondary}`}
                  />
                  <div
                    className="color-dot"
                    style={{ background: theme.color_accent }}
                    title={`Acento: ${theme.color_accent}`}
                  />
                </div>
                <div className="color-row">
                  <div
                    className="color-dot large"
                    style={{ background: theme.color_background }}
                    title={`Fundo: ${theme.color_background}`}
                  />
                  <div
                    className="color-dot large"
                    style={{ background: theme.color_surface }}
                    title={`Superfície: ${theme.color_surface}`}
                  />
                </div>
                <div className="font-info">
                  <span className="font-item">{theme.font_heading}</span>
                  <span className="font-sep">/</span>
                  <span className="font-item">{theme.font_body}</span>
                </div>
              </div>

              <div className="theme-card-body">
                <div className="theme-card-top">
                  <h3>{theme.name}</h3>
                  <span className={`status-badge ${theme.status}`}>
                    {theme.status === 'active' ? 'Ativo' : 'Arquivado'}
                  </span>
                </div>
                {theme.is_default && (
                  <span className="default-badge">Padrão</span>
                )}
              </div>

              <div className="theme-card-footer">
                <Link to={`/hub/temas/editar/${theme.id}`} className="theme-action primary">
                  Editar
                </Link>
                <button
                  className="theme-action danger"
                  onClick={() => handleDelete(theme.id, theme.name)}
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
