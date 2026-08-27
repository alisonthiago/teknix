import React, { useState } from 'react'
import { X, Plus, Network, Check } from 'lucide-react'
import './DisplayConditionsModal.css'

export interface DisplayCondition {
  id: string
  type: 'include' | 'exclude'
  target: 'entire_site' | 'archives' | 'singular'
  subTarget?: string
  specificId?: string
}

interface DisplayConditionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (conditions: DisplayCondition[]) => void
  initialConditions?: DisplayCondition[]
  modelName?: string
  availablePages?: Array<{ id: string; title: string; slug: string }>
}

export default function DisplayConditionsModal({
  isOpen,
  onClose,
  onSave,
  initialConditions = [{ id: '1', type: 'include', target: 'entire_site' }],
  modelName = 'Modelo',
  availablePages = []
}: DisplayConditionsModalProps) {
  const [conditions, setConditions] = useState<DisplayCondition[]>(
    initialConditions.length > 0 ? initialConditions : [{ id: '1', type: 'include', target: 'entire_site' }]
  )

  if (!isOpen) return null

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `cond-${Date.now()}`,
        type: 'include',
        target: 'entire_site'
      }
    ])
  }

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id))
  }

  const handleUpdateCondition = (id: string, updates: Partial<DisplayCondition>) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const handleSaveAndClose = () => {
    onSave(conditions)
    onClose()
  }

  return (
    <div className="publish-settings-overlay" onClick={onClose}>
      <div className="publish-settings-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ps-header">
          <div className="ps-header-left">
            <div className="ps-icon-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M11.6645 3.32918C11.8757 3.22361 12.1242 3.22361 12.3353 3.32918L20.3353 7.32918C20.5894 7.45622 20.7499 7.71592 20.7499 8C20.7499 8.28408 20.5894 8.54378 20.3353 8.67082L12.3353 12.6708C12.1242 12.7764 11.8757 12.7764 11.6645 12.6708L3.66451 8.67082C3.41042 8.54378 3.24992 8.28408 3.24992 8C3.24992 7.71592 3.41042 7.45622 3.66451 7.32918L11.6645 3.32918ZM5.67697 8L11.9999 11.1615L18.3229 8L11.9999 4.83853L5.67697 8Z"/>
              </svg>
            </div>
            <span className="ps-header-title">PUBLISH SETTINGS</span>
          </div>
          <button type="button" className="ps-btn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="ps-body">
          <div className="ps-center-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#db468e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="5" rx="1" />
              <path d="M12 8v4" />
              <path d="M5 12h14" />
              <path d="M5 12v4" />
              <path d="M19 12v4" />
              <rect x="2" y="16" width="6" height="5" rx="1" />
              <rect x="16" y="16" width="6" height="5" rx="1" />
            </svg>
          </div>

          <h2 className="ps-title">Where do you want to display your {modelName}?</h2>
          <p className="ps-description">
            Set the conditions that determine where your {modelName} is used throughout your site.<br />
            For example, choose 'Entire Site' to display the template across your site.
          </p>

          {/* Conditions List */}
          <div className="ps-conditions-list">
            {conditions.map((cond) => (
              <div key={cond.id} className="ps-condition-row">
                {/* Type: Include / Exclude */}
                <select
                  value={cond.type}
                  onChange={e => handleUpdateCondition(cond.id, { type: e.target.value as 'include' | 'exclude' })}
                  className="ps-select ps-select-type"
                >
                  <option value="include">+ Include</option>
                  <option value="exclude">- Exclude</option>
                </select>

                {/* Target Scope */}
                <select
                  value={cond.target}
                  onChange={e => handleUpdateCondition(cond.id, {
                    target: e.target.value as any,
                    subTarget: e.target.value === 'archives' ? 'all_archives' : e.target.value === 'singular' ? 'all_pages' : undefined
                  })}
                  className="ps-select ps-select-target"
                >
                  <option value="entire_site">Entire site</option>
                  <option value="archives">Archives</option>
                  <option value="singular">Singular</option>
                </select>

                {/* Subtarget Selector when Archives or Singular is active */}
                {cond.target === 'archives' && (
                  <select
                    value={cond.subTarget || 'all_archives'}
                    onChange={e => handleUpdateCondition(cond.id, { subTarget: e.target.value })}
                    className="ps-select ps-select-subtarget"
                  >
                    <option value="all_archives">All archives</option>
                    <option value="author_archive">Author archive</option>
                    <option value="date_archive">Date archive</option>
                    <option value="search_results">Search results</option>
                    <option value="posts_archive">Posts archive</option>
                    <option value="categorias">Categorias de Produtos</option>
                    <option value="tags">Tags</option>
                  </select>
                )}

                {cond.target === 'singular' && (
                  <select
                    value={cond.subTarget || 'all_singular'}
                    onChange={e => handleUpdateCondition(cond.id, { subTarget: e.target.value })}
                    className="ps-select ps-select-subtarget"
                  >
                    <option value="all_singular">All singular</option>
                    <option value="front_page">Front page (Home)</option>
                    <option value="all_pages">Todas as Páginas</option>
                    <option value="products">Páginas de Produtos</option>
                    <option value="posts">Posts</option>
                    <option value="404">Página 404</option>
                  </select>
                )}

                {/* Specific Page Selector if singular -> all_pages */}
                {cond.target === 'singular' && cond.subTarget === 'all_pages' && availablePages.length > 0 && (
                  <select
                    value={cond.specificId || ''}
                    onChange={e => handleUpdateCondition(cond.id, { specificId: e.target.value })}
                    className="ps-select ps-select-specific"
                  >
                    <option value="">(Selecione a Página)</option>
                    {availablePages.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.slug})</option>
                    ))}
                  </select>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  className="ps-btn-remove-row"
                  onClick={() => handleRemoveCondition(cond.id)}
                  title="Remover condição"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add condition button */}
          <div className="ps-add-condition-wrap">
            <button type="button" className="ps-btn-add-condition" onClick={handleAddCondition}>
              Add condition
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="ps-footer">
          <button type="button" className="ps-btn-save-close" onClick={handleSaveAndClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}
