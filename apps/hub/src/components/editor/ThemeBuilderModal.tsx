import React, { useState } from 'react'
import {
  X, Plus, Edit3, MoreHorizontal, Layout, Columns, Check, Eye, Trash2,
  Copy, Sparkles, FileText, Image as ImageIcon, Search, RefreshCw
} from 'lucide-react'
import type { HeaderConfig, HeaderModel } from './GlobalHeaderRenderer'
import './ThemeBuilderModal.css'

export type ThemePartType =
  | 'all'
  | 'header'
  | 'footer'
  | 'single_post'
  | 'single_page'
  | 'archive'
  | 'search_results'
  | 'loop_item'
  | 'error_404'

export interface ThemePartItem {
  id: string
  name: string
  type: ThemePartType
  status: 'published' | 'draft'
  instance: string // 'Entire site' | 'Specific Pages' | 'No instances'
  author: string
  updatedAt: string
  modelId?: HeaderModel | string
  previewType?: string
}

const DEFAULT_PARTS: ThemePartItem[] = [
  {
    id: 'header-global-main',
    name: 'Header Oficial TEKNIX (Apple Dark)',
    type: 'header',
    status: 'published',
    instance: 'Entire site',
    author: 'TEKNIX Admin',
    updatedAt: 'Hoje',
    modelId: 'apple_dark'
  },
  {
    id: 'header-apple-light',
    name: 'Header Editorial Light (Branco Clean)',
    type: 'header',
    status: 'draft',
    instance: 'No instances',
    author: 'TEKNIX Admin',
    updatedAt: 'Ontem',
    modelId: 'apple_light'
  },
  {
    id: 'header-industrial-pro',
    name: 'Header Industrial Pro Solid (Black)',
    type: 'header',
    status: 'draft',
    instance: 'No instances',
    author: 'TEKNIX Admin',
    updatedAt: '2 dias atrás',
    modelId: 'industrial_pro'
  },
  {
    id: 'header-ecommerce-search',
    name: 'Header E-commerce Search Express',
    type: 'header',
    status: 'draft',
    instance: 'No instances',
    author: 'TEKNIX Admin',
    updatedAt: '3 dias atrás',
    modelId: 'ecommerce_search'
  },
  {
    id: 'footer-apple-directory',
    name: 'Rodapé Oficial 5 Colunas (Sosumi Light)',
    type: 'footer',
    status: 'published',
    instance: 'Entire site',
    author: 'TEKNIX Admin',
    updatedAt: 'Hoje',
    modelId: 'apple_directory_5cols_light'
  },
  {
    id: 'footer-apple-dark',
    name: 'Rodapé Oficial Dark Premium',
    type: 'footer',
    status: 'draft',
    instance: 'No instances',
    author: 'TEKNIX Admin',
    updatedAt: 'Ontem',
    modelId: 'apple_directory_5cols_dark'
  },
  {
    id: 'footer-editorial-studio',
    name: 'Rodapé Studio Editorial Dark (Newsletter & Contato)',
    type: 'footer',
    status: 'draft',
    instance: 'No instances',
    author: 'TEKNIX Admin',
    updatedAt: '2 dias atrás',
    modelId: 'editorial_dark_studio'
  },
  {
    id: 'footer-tech-enterprise',
    name: 'Rodapé Tech Enterprise (Samsung Style)',
    type: 'footer',
    status: 'draft',
    instance: 'No instances',
    author: 'TEKNIX Admin',
    updatedAt: '3 dias atrás',
    modelId: 'ecommerce_enterprise'
  },
  {
    id: 'single-product-showcase',
    name: 'Modelo de Página de Produto (Apple Marquee)',
    type: 'single_page',
    status: 'published',
    instance: 'Todos os Produtos',
    author: 'TEKNIX Admin',
    updatedAt: 'Hoje',
  },
  {
    id: 'archive-category-grid',
    name: 'Grade de Produtos & Filtros da Categoria',
    type: 'archive',
    status: 'published',
    instance: 'Todas as Categorias',
    author: 'TEKNIX Admin',
    updatedAt: 'Ontem',
  },
  {
    id: 'search-results-official',
    name: 'Página de Resultados de Busca',
    type: 'search_results',
    status: 'published',
    instance: 'Busca Global',
    author: 'TEKNIX Admin',
    updatedAt: '3 dias atrás',
  },
  {
    id: 'page-404-teknix',
    name: 'Página de Erro 404 Personalizada',
    type: 'error_404',
    status: 'published',
    instance: 'Página 404',
    author: 'TEKNIX Admin',
    updatedAt: 'Semana passada',
  }
]

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelectHeaderModel?: (model: HeaderModel) => void
  onApplyPart?: (part: ThemePartItem) => void
}

export default function ThemeBuilderModal({
  isOpen,
  onClose,
  onSelectHeaderModel,
  onApplyPart
}: Props) {
  const [selectedType, setSelectedType] = useState<ThemePartType>('all')
  const [parts, setParts] = useState<ThemePartItem[]>(DEFAULT_PARTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddNewModal, setShowAddNewModal] = useState(false)
  const [newPartType, setNewPartType] = useState<ThemePartType>('header')
  const [newPartName, setNewPartName] = useState('')

  if (!isOpen) return null

  const filteredParts = parts.filter(item => {
    const matchType = selectedType === 'all' || item.type === selectedType
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchType && matchSearch
  })

  const navItems: { type: ThemePartType; label: string; count: number }[] = [
    { type: 'all', label: 'All Parts', count: parts.length },
    { type: 'header', label: 'Header', count: parts.filter(p => p.type === 'header').length },
    { type: 'footer', label: 'Footer', count: parts.filter(p => p.type === 'footer').length },
    { type: 'single_post', label: 'Single Post', count: parts.filter(p => p.type === 'single_post').length },
    { type: 'single_page', label: 'Single Page', count: parts.filter(p => p.type === 'single_page').length },
    { type: 'archive', label: 'Archive', count: parts.filter(p => p.type === 'archive').length },
    { type: 'search_results', label: 'Search Results', count: parts.filter(p => p.type === 'search_results').length },
    { type: 'loop_item', label: 'Loop Item', count: parts.filter(p => p.type === 'loop_item').length },
    { type: 'error_404', label: 'Error 404', count: parts.filter(p => p.type === 'error_404').length },
  ]

  const handleCreateNew = () => {
    if (!newPartName.trim()) return
    const newItem: ThemePartItem = {
      id: `part-${Date.now()}`,
      name: newPartName.trim(),
      type: newPartType,
      status: 'draft',
      instance: 'No instances',
      author: 'TEKNIX Admin',
      updatedAt: 'Agora'
    }
    setParts([newItem, ...parts])
    setShowAddNewModal(false)
    setNewPartName('')
    setSelectedType(newPartType)
  }

  const handleApply = (part: ThemePartItem) => {
    if (part.type === 'header' && part.modelId && onSelectHeaderModel) {
      onSelectHeaderModel(part.modelId as HeaderModel)
    }
    if (onApplyPart) {
      onApplyPart(part)
    }
    onClose()
  }

  return (
    <div className="theme-builder-overlay" onClick={onClose}>
      <div className="theme-builder-window" onClick={e => e.stopPropagation()}>
        {/* ── TOP HEADER ── */}
        <div className="theme-builder-topbar">
          <div className="tb-top-left">
            <div className="tb-logo-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M11.6645 3.32918C11.8757 3.22361 12.1242 3.22361 12.3353 3.32918L20.3353 7.32918C20.5894 7.45622 20.7499 7.71592 20.7499 8C20.7499 8.28408 20.5894 8.54378 20.3353 8.67082L12.3353 12.6708C12.1242 12.7764 11.8757 12.7764 11.6645 12.6708L3.66451 8.67082C3.41042 8.54378 3.24992 8.28408 3.24992 8C3.24992 7.71592 3.41042 7.45622 3.66451 7.32918ZM5.67697 8L11.9999 11.1615L18.3229 8L11.9999 4.83853L5.67697 8Z"/>
              </svg>
            </div>
            <span className="tb-title">THEME BUILDER</span>
          </div>

          <div className="tb-top-right">
            <button
              type="button"
              className="tb-add-btn"
              onClick={() => setShowAddNewModal(true)}
            >
              <Plus size={14} />
              <span>Add New</span>
            </button>
            <button type="button" className="tb-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── MAIN CONTAINER ── */}
        <div className="theme-builder-main">
          {/* SIDEBAR NAVIGATION */}
          <aside className="theme-builder-sidebar">
            <div className="tb-sidebar-section-title">SITE PARTS</div>
            <nav className="tb-nav-list">
              {navItems.map(item => (
                <button
                  key={item.type}
                  type="button"
                  className={`tb-nav-item ${selectedType === item.type ? 'active' : ''}`}
                  onClick={() => setSelectedType(item.type)}
                >
                  <div className="tb-nav-item-left">
                    {item.type === 'all' && <Layout size={15} />}
                    {item.type === 'header' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>}
                    {item.type === 'footer' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/></svg>}
                    {item.type === 'single_post' && <FileText size={15} />}
                    {item.type === 'single_page' && <ImageIcon size={15} />}
                    {item.type === 'archive' && <Columns size={15} />}
                    {item.type === 'search_results' && <Search size={15} />}
                    {item.type === 'loop_item' && <RefreshCw size={15} />}
                    {item.type === 'error_404' && <span style={{ fontSize: '11px', fontWeight: 800 }}>404</span>}
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && <span className="tb-item-count">{item.count}</span>}
                </button>
              ))}
            </nav>
          </aside>

          {/* CONTENT AREA */}
          <div className="theme-builder-content">
            <div className="tb-content-header">
              <div>
                <h2 className="tb-page-title">
                  {selectedType === 'all' ? "Your Site's Global Parts" : navItems.find(n => n.type === selectedType)?.label}
                </h2>
                <p className="tb-page-sub">
                  Gerencie modelos globais aplicados em todo o site ou crie templates específicos para páginas e produtos.
                </p>
              </div>

              <div className="tb-search-box">
                <Search size={14} className="tb-search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar modelo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* CARDS GRID */}
            <div className="tb-cards-grid">
              {filteredParts.map(item => (
                <div key={item.id} className="tb-part-card">
                  {/* Card Header */}
                  <div className="tb-card-header">
                    <div className="tb-card-header-top">
                      <div className={`tb-card-status-badge ${item.status === 'published' ? 'published' : 'draft'}`}>
                        <span className={`tb-status-dot ${item.status === 'published' ? 'published' : 'draft'}`} />
                        <span>{item.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
                      </div>
                      <span className="tb-card-meta">{item.updatedAt}</span>
                    </div>
                    <div className="tb-card-name" title={item.name}>{item.name}</div>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="tb-card-preview" onClick={() => handleApply(item)}>
                    {item.type === 'header' && (
                      <div className={`tb-preview-header ${item.modelId || 'apple_dark'}`}>
                        <div className="preview-top-bar">
                          <span className="preview-logo">TEKNIX</span>
                          <div className="preview-links">
                            <span>Loja</span>
                            <span>Mac</span>
                            <span>iPad</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, opacity: 0.8 }}>
                            <Search size={9} />
                          </div>
                        </div>
                      </div>
                    )}

                    {item.type === 'footer' && item.modelId === 'editorial_dark_studio' && (
                      <div className="tb-preview-footer dark" style={{ padding: '8px 10px', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: 6, fontSize: '6.5px', color: '#ffffff', opacity: 0.9 }}>
                          <div style={{ flex: 1, border: '1px dashed rgba(255,255,255,0.2)', padding: 3, borderRadius: 2 }}>
                            Newsletter registration
                            <div style={{ height: 6, background: '#fff', borderRadius: 1, margin: '2px 0' }} />
                          </div>
                          <div style={{ flex: 1, border: '1px dashed rgba(255,255,255,0.2)', padding: 3, borderRadius: 2 }}>
                            Talk to us with flowers
                            <div style={{ height: 6, background: '#fff', borderRadius: 1, margin: '2px 0' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 2 }}>
                          <span style={{ background: '#fff', color: '#000', fontSize: '6px', fontWeight: 800, padding: '1px 3px', borderRadius: 1 }}>VISA</span>
                          <span style={{ background: '#fff', color: '#000', fontSize: '6px', fontWeight: 800, padding: '1px 3px', borderRadius: 1 }}>PIX</span>
                        </div>
                      </div>
                    )}

                    {item.type === 'footer' && item.modelId === 'ecommerce_enterprise' && (
                      <div className="tb-preview-footer" style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
                        <div style={{ padding: '6px 8px', display: 'flex', gap: 4 }}>
                          <div style={{ flex: 1, height: 18, background: '#f5f5f7', borderRadius: 2 }} />
                          <div style={{ flex: 1, height: 18, background: '#f5f5f7', borderRadius: 2 }} />
                          <div style={{ flex: 1, height: 18, background: '#f5f5f7', borderRadius: 2 }} />
                        </div>
                        <div style={{ background: '#161617', color: '#a1a1a6', fontSize: '6.5px', padding: '3px 8px', textAlign: 'center', fontWeight: 600 }}>
                          ACESSIBILIDADE | TERMOS | BRASIL
                        </div>
                      </div>
                    )}

                    {item.type === 'footer' && item.modelId !== 'editorial_dark_studio' && item.modelId !== 'ecommerce_enterprise' && (
                      <div className={`tb-preview-footer ${item.modelId?.includes('dark') ? 'dark' : ''}`}>
                        <div className="preview-footer-cols">
                          <div /><div /><div /><div /><div />
                        </div>
                        <div className="preview-footer-bottom">
                          Diretório Oficial TEKNIX • 5 Colunas
                        </div>
                      </div>
                    )}

                    {item.type === 'single_page' && (
                      <div className="tb-preview-page">
                        <div className="preview-hero-mock">
                          PÁGINA DE PRODUTO • MARQUEE
                        </div>
                        <div className="preview-grid-mock">
                          <div /><div />
                        </div>
                      </div>
                    )}

                    {item.type === 'archive' && (
                      <div className="tb-preview-page">
                        <div className="preview-hero-mock minimal" style={{ fontSize: '8px', fontWeight: 600 }}>
                          CATEGORIA &bull; GRADE 2x2
                        </div>
                        <div className="preview-grid-mock">
                          <div /><div /><div />
                        </div>
                      </div>
                    )}

                    {item.type !== 'header' && item.type !== 'footer' && item.type !== 'single_page' && item.type !== 'archive' && (
                      <div className="tb-preview-page">
                        <div className="preview-hero-mock minimal" style={{ fontSize: '8.5px', fontWeight: 600 }}>
                          {item.type === 'error_404' ? '404 • PÁGINA NÃO ENCONTRADA' : 'RESULTADOS DE BUSCA'}
                        </div>
                        <div className="preview-grid-mock">
                          <div /><div />
                        </div>
                      </div>
                    )}

                    <div className="tb-card-hover-overlay">
                      <button type="button" className="tb-edit-action-btn" onClick={() => handleApply(item)}>
                        <Edit3 size={13} />
                        <span>Editar / Aplicar</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="tb-card-footer">
                    <div className="tb-instance-info">
                      <span className="tb-instance-label">Instâncias:</span>
                      <span className={`tb-instance-badge ${item.instance === 'Entire site' ? 'global' : ''}`}>
                        {item.instance}
                      </span>
                    </div>

                    <div className="tb-card-actions">
                      <button
                        type="button"
                        className="tb-btn-edit-link"
                        onClick={() => handleApply(item)}
                        title="Editar modelo"
                      >
                        <Edit3 size={12} />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CREATE NEW PART MODAL ── */}
        {showAddNewModal && (
          <div className="tb-modal-backdrop" onClick={() => setShowAddNewModal(false)}>
            <div className="tb-new-modal" onClick={e => e.stopPropagation()}>
              <div className="tb-new-header">
                <h3>Criar Novo Modelo de Tema</h3>
                <button type="button" onClick={() => setShowAddNewModal(false)}><X size={16} /></button>
              </div>

              <div className="tb-new-body">
                <label>Tipo de Componente</label>
                <select
                  value={newPartType}
                  onChange={e => setNewPartType(e.target.value as ThemePartType)}
                  className="elementor-select"
                >
                  <option value="header">Header (Cabeçalho)</option>
                  <option value="footer">Footer (Rodapé)</option>
                  <option value="single_page">Single Page (Página de Produto / Vendas)</option>
                  <option value="single_post">Single Post (Artigo / Post)</option>
                  <option value="archive">Archive (Categoria / Arquivo)</option>
                  <option value="error_404">Error 404</option>
                </select>

                <label style={{ marginTop: 12 }}>Nome do Modelo</label>
                <input
                  type="text"
                  placeholder="Ex: Header Black Friday 2026"
                  value={newPartName}
                  onChange={e => setNewPartName(e.target.value)}
                  className="elementor-input"
                />
              </div>

              <div className="tb-new-footer">
                <button type="button" className="tb-cancel-btn" onClick={() => setShowAddNewModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="tb-submit-btn" onClick={handleCreateNew}>
                  Criar Modelo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
