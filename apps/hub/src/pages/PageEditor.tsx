import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getPageWithSections,
  createPage,
  updatePage,
  addSection,
  updateSection,
  deleteSection,
  addContainer,
  updateContainer,
  deleteContainer,
  addWidget,
  updateWidget,
  deleteWidget,
  publishPage,
  unpublishPage,
  WIDGET_CATEGORIES,
  WIDGET_DEFINITIONS,
} from '../services/pageBuilder'
import type { Page, PageSection, PageContainer, PageWidget, EditorTab, ViewportMode } from '../types/pageBuilder'
import Inspector from '../components/editor/Inspector'
import Navigator from '../components/editor/Navigator'
import './PageEditor.css'

export default function PageEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nova'

  const [page, setPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [inspectorTab, setInspectorTab] = useState<EditorTab>('content')
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [showNavigator, setShowNavigator] = useState(false)
  const [showPageSettings, setShowPageSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; id: string; parentId?: string } | null>(null)

  useEffect(() => {
    if (isNew) createNewPage()
    else if (id) loadPage(id)
  }, [id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [historyIndex, history])

  useEffect(() => {
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  async function createNewPage() {
    try {
      const newPage = await createPage({
        slug: `pagina-${Date.now()}`,
        title: 'Nova página',
        type: 'custom',
      })
      setPage(newPage)
      setSections([])
      setLoading(false)
      navigate(`/hub/paginas/editar/${newPage.id}`, { replace: true })
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  async function loadPage(pageId: string) {
    try {
      const { page: p, sections: s } = await getPageWithSections(pageId)
      setPage(p)
      setSections(s)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function pushHistory(description: string) {
    const snapshot = JSON.stringify({ sections })
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ description, snapshot, timestamp: Date.now() })
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  function undo() {
    if (historyIndex <= 0) return
    const prev = JSON.parse(history[historyIndex - 1].snapshot)
    setSections(prev.sections)
    setHistoryIndex(historyIndex - 1)
  }

  function redo() {
    if (historyIndex >= history.length - 1) return
    const next = JSON.parse(history[historyIndex + 1].snapshot)
    setSections(next.sections)
    setHistoryIndex(historyIndex + 1)
  }

  async function handleSave() {
    if (!page) return
    setSaving(true)
    try {
      await updatePage(page.id, page)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handlePublish() {
    if (!page) return
    setSaving(true)
    try {
      await handleSave()
      await publishPage(page.id)
      setPage({ ...page, status: 'published' })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleUnpublish() {
    if (!page) return
    setSaving(true)
    try {
      await unpublishPage(page.id)
      setPage({ ...page, status: 'draft' })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  // Section operations
  async function handleAddSection() {
    if (!page) return
    pushHistory('Adicionar seção')
    const s = await addSection(page.id, 'section')
    setSections([...sections, s])
    setSelectedSectionId(s.id)
    setSelectedContainerId(null)
    setSelectedWidgetId(null)
  }

  async function handleUpdateSection(sectionId: string, updates: Partial<PageSection>) {
    const updated = await updateSection(sectionId, updates)
    setSections(sections.map(s => s.id === sectionId ? updated : s))
  }

  async function handleDeleteSection(sectionId: string) {
    pushHistory('Excluir seção')
    await deleteSection(sectionId)
    setSections(sections.filter(s => s.id !== sectionId))
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null)
      setSelectedContainerId(null)
      setSelectedWidgetId(null)
    }
  }

  async function handleDuplicateSection(sectionId: string) {
    pushHistory('Duplicar seção')
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    const s = await addSection(page!.id, section.type)
    // Copy settings
    await updateSection(s.id, { ...section, id: s.id, page_id: s.page_id })
    const idx = sections.findIndex(sec => sec.id === sectionId)
    const newSections = [...sections]
    newSections.splice(idx + 1, 0, { ...s, ...section, id: s.id })
    setSections(newSections)
  }

  // Container operations
  async function handleAddContainer(sectionId: string) {
    pushHistory('Adicionar container')
    const c = await addContainer(sectionId)
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, containers: [...(s.containers || []), c] }
      }
      return s
    }))
    setSelectedContainerId(c.id)
    setSelectedWidgetId(null)
  }

  async function handleUpdateContainer(containerId: string, updates: Partial<PageContainer>) {
    const updated = await updateContainer(containerId, updates)
    setSections(sections.map(s => ({
      ...s,
      containers: (s.containers || []).map(c => c.id === containerId ? updated : c)
    })))
  }

  async function handleDeleteContainer(containerId: string) {
    pushHistory('Excluir container')
    await deleteContainer(containerId)
    setSections(sections.map(s => ({
      ...s,
      containers: (s.containers || []).filter(c => c.id !== containerId)
    })))
    if (selectedContainerId === containerId) {
      setSelectedContainerId(null)
      setSelectedWidgetId(null)
    }
  }

  // Widget operations
  async function handleAddWidget(containerId: string, type: string) {
    pushHistory('Adicionar widget')
    const w = await addWidget(containerId, type)
    setSections(sections.map(s => ({
      ...s,
      containers: (s.containers || []).map(c => {
        if (c.id === containerId) {
          return { ...c, widgets: [...(c.widgets || []), w] }
        }
        return c
      })
    })))
    setSelectedWidgetId(w.id)
  }

  async function handleUpdateWidget(widgetId: string, updates: Partial<PageWidget>) {
    const updated = await updateWidget(widgetId, updates)
    setSections(sections.map(s => ({
      ...s,
      containers: (s.containers || []).map(c => ({
        ...c,
        widgets: (c.widgets || []).map(w => w.id === widgetId ? updated : w)
      }))
    })))
  }

  async function handleDeleteWidget(widgetId: string) {
    pushHistory('Excluir widget')
    await deleteWidget(widgetId)
    setSections(sections.map(s => ({
      ...s,
      containers: (s.containers || []).map(c => ({
        ...c,
        widgets: (c.widgets || []).filter(w => w.id !== widgetId)
      }))
    })))
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null)
  }

  // Selection
  function selectWidget(widgetId: string) {
    setSelectedWidgetId(widgetId)
    setSelectedContainerId(null)
    setSelectedSectionId(null)
  }

  function selectContainer(containerId: string) {
    setSelectedContainerId(containerId)
    setSelectedWidgetId(null)
    setSelectedSectionId(null)
  }

  function selectSection(sectionId: string) {
    setSelectedSectionId(sectionId)
    setSelectedContainerId(null)
    setSelectedWidgetId(null)
  }

  // Context menu
  function handleContextMenu(e: React.MouseEvent, type: string, id: string, parentId?: string) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, type, id, parentId })
  }

  // Get selected item
  function getSelectedItem() {
    if (selectedWidgetId) {
      for (const s of sections) {
        for (const c of s.containers || []) {
          const w = (c.widgets || []).find(w => w.id === selectedWidgetId)
          if (w) return { type: 'widget' as const, item: w, sectionId: s.id, containerId: c.id }
        }
      }
    }
    if (selectedContainerId) {
      for (const s of sections) {
        const c = (s.containers || []).find(c => c.id === selectedContainerId)
        if (c) return { type: 'container' as const, item: c, sectionId: s.id }
      }
    }
    if (selectedSectionId) {
      const s = sections.find(s => s.id === selectedSectionId)
      if (s) return { type: 'section' as const, item: s }
    }
    return null
  }

  const selectedItem = getSelectedItem()

  const filteredWidgets = searchQuery
    ? WIDGET_DEFINITIONS.filter(w =>
        w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null

  if (loading) {
    return <div className="editor-loading"><div className="spinner" /><p>Carregando editor...</p></div>
  }

  if (!page) {
    return <div className="editor-error"><p>Página não encontrada</p></div>
  }

  return (
    <div className={`page-editor ${isPreviewing ? 'preview-mode' : ''}`}>
      {/* === TOP BAR === */}
      <div className="editor-topbar">
        <div className="topbar-left">
          <button className="topbar-back" onClick={() => navigate('/hub/paginas')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <input
            className="topbar-title"
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            placeholder="Título da página"
          />
          <span className={`topbar-status ${page.status}`}>
            {page.status === 'published' ? '● Publicado' : '○ Rascunho'}
          </span>
        </div>

        <div className="topbar-center">
          <div className="viewport-switcher">
            {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map(mode => (
              <button
                key={mode}
                className={`viewport-btn ${viewportMode === mode ? 'active' : ''}`}
                onClick={() => setViewportMode(mode)}
                title={mode === 'desktop' ? 'Desktop' : mode === 'tablet' ? 'Tablet' : 'Mobile'}
              >
                {mode === 'desktop' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
                {mode === 'tablet' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
                {mode === 'mobile' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
              </button>
            ))}
          </div>
        </div>

        <div className="topbar-right">
          <button className="btn-icon" onClick={() => setIsPreviewing(!isPreviewing)} title="Visualizar">
            {isPreviewing ? '✕' : '👁'}
          </button>
          <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {page.status === 'published' ? (
            <button className="btn btn-outline" onClick={handleUnpublish} disabled={saving}>Despublicar</button>
          ) : (
            <button className="btn btn-primary" onClick={handlePublish} disabled={saving}>Publicar</button>
          )}
        </div>
      </div>

      {/* === MAIN BODY === */}
      <div className="editor-body">
        {/* LEFT SIDEBAR - Widget Library */}
        {!isPreviewing && (
          <aside className="editor-sidebar">
            <div className="sidebar-search">
              <input
                placeholder="Buscar Widget..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sidebar-widgets">
              {filteredWidgets ? (
                <div className="widget-category">
                  <span className="category-label">Resultados</span>
                  {filteredWidgets.map(w => (
                    <div
                      key={w.type}
                      className="widget-item"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('widget-type', w.type)}
                    >
                      <span className="widget-icon">{w.icon}</span>
                      <span className="widget-label">{w.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                WIDGET_CATEGORIES.map(cat => {
                  const widgets = WIDGET_DEFINITIONS.filter(w => w.category === cat.key)
                  if (widgets.length === 0) return null
                  return (
                    <WidgetCategory key={cat.key} label={cat.label} widgets={widgets} />
                  )
                })
              )}
            </div>
          </aside>
        )}

        {/* CANVAS */}
        <div className={`editor-canvas viewport-${viewportMode}`}>
          <div className="canvas-inner">
            {sections.length === 0 ? (
              <div className="canvas-empty">
                <div className="empty-icon">🎨</div>
                <h3>Canvas vazio</h3>
                <p>Clique em "+ Seção" ou arraste um widget para começar</p>
                <button className="btn btn-primary" onClick={handleAddSection}>
                  + Adicionar Seção
                </button>
              </div>
            ) : (
              sections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  selectedContainerId={selectedContainerId}
                  selectedWidgetId={selectedWidgetId}
                  onSelect={() => selectSection(section.id)}
                  onSelectContainer={selectContainer}
                  onSelectWidget={selectWidget}
                  onAddContainer={() => handleAddContainer(section.id)}
                  onDelete={() => handleDeleteSection(section.id)}
                  onDuplicate={() => handleDuplicateSection(section.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'section', section.id)}
                  onWidgetDrag={(containerId, widgetType) => handleAddWidget(containerId, widgetType)}
                />
              ))
            )}

            {sections.length > 0 && (
              <div className="canvas-add-section" onClick={handleAddSection}>
                + Adicionar Seção
              </div>
            )}
          </div>
        </div>

        {/* RIGHT INSPECTOR */}
        {!isPreviewing && (
          <aside className="editor-inspector">
            {selectedItem ? (
              <Inspector
                item={selectedItem}
                tab={inspectorTab}
                onTabChange={setInspectorTab}
                onUpdateSection={(updates) => {
                  if (selectedItem.type === 'section') {
                    handleUpdateSection(selectedItem.item.id, updates)
                  }
                }}
                onUpdateContainer={(updates) => {
                  if (selectedItem.type === 'container') {
                    handleUpdateContainer(selectedItem.item.id, updates)
                  }
                }}
                onUpdateWidget={(updates) => {
                  if (selectedItem.type === 'widget') {
                    handleUpdateWidget(selectedItem.item.id, updates)
                  }
                }}
                onDelete={() => {
                  if (selectedItem.type === 'section') handleDeleteSection(selectedItem.item.id)
                  if (selectedItem.type === 'container') handleDeleteContainer(selectedItem.item.id)
                  if (selectedItem.type === 'widget') handleDeleteWidget(selectedItem.item.id)
                }}
              />
            ) : (
              <div className="inspector-empty">
                <p>Selecione um elemento no canvas para editar suas propriedades</p>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* === BOTTOM TOOLBAR === */}
      {!isPreviewing && (
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <button
              className={`toolbar-btn ${showNavigator ? 'active' : ''}`}
              onClick={() => setShowNavigator(!showNavigator)}
              title="Navigator"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 6h16M4 12h12M4 18h8"/></svg>
              Navigator
            </button>
            <button
              className="toolbar-btn"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Desfazer (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              className="toolbar-btn"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Refazer (Ctrl+Shift+Z)"
            >
              ↷
            </button>
          </div>
          <div className="toolbar-center">
            <button
              className="toolbar-btn"
              onClick={() => setShowPageSettings(!showPageSettings)}
              title="Configurações da página"
            >
              ⚙ Configurações
            </button>
          </div>
          <div className="toolbar-right">
            <span className="toolbar-info">
              {historyIndex + 1}/{history.length} alterações
            </span>
          </div>
        </div>
      )}

      {/* NAVIGATOR PANEL */}
      {showNavigator && !isPreviewing && (
        <Navigator
          sections={sections}
          selectedId={selectedWidgetId || selectedContainerId || selectedSectionId}
          onSelect={(type, id) => {
            if (type === 'section') selectSection(id)
            if (type === 'container') selectContainer(id)
            if (type === 'widget') selectWidget(id)
          }}
          onClose={() => setShowNavigator(false)}
        />
      )}

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'section' && (
            <>
              <button onClick={() => { handleDuplicateSection(contextMenu.id); setContextMenu(null) }}>Duplicar</button>
              <button onClick={() => { handleDeleteSection(contextMenu.id); setContextMenu(null) }} className="danger">Excluir</button>
            </>
          )}
          {contextMenu.type === 'widget' && (
            <>
              <button onClick={() => { setContextMenu(null) }}>Copiar</button>
              <button onClick={() => { handleDeleteWidget(contextMenu.id); setContextMenu(null) }} className="danger">Excluir</button>
            </>
          )}
        </div>
      )}

      {/* PAGE SETTINGS MODAL */}
      {showPageSettings && (
        <div className="modal-overlay" onClick={() => setShowPageSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configurações da página</h3>
              <button onClick={() => setShowPageSettings(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Slug</label>
                <input value={page.seo_slug || page.slug} onChange={(e) => setPage({ ...page, seo_slug: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Meta Title</label>
                <input value={page.seo_title} onChange={(e) => setPage({ ...page, seo_title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Meta Description</label>
                <textarea value={page.seo_description} onChange={(e) => setPage({ ...page, seo_description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>OG Image</label>
                <input value={page.seo_image} onChange={(e) => setPage({ ...page, seo_image: e.target.value })} placeholder="URL" />
              </div>
              <div className="form-group">
                <label>Modo Landing Page (ocultar header/footer)</label>
                <input type="checkbox" checked={page.is_landing_mode} onChange={(e) => setPage({ ...page, is_landing_mode: e.target.checked })} />
              </div>
              <div className="form-group">
                <label>Scripts no &lt;head&gt;</label>
                <textarea value={page.head_scripts} onChange={(e) => setPage({ ...page, head_scripts: e.target.value })} rows={4} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// SECTION BLOCK (Canvas rendering)
// ============================================================
function SectionBlock({
  section, isSelected, selectedContainerId, selectedWidgetId,
  onSelect, onSelectContainer, onSelectWidget,
  onAddContainer, onDelete, onDuplicate, onContextMenu, onWidgetDrag,
}: {
  section: PageSection
  isSelected: boolean
  selectedContainerId: string | null
  selectedWidgetId: string | null
  onSelect: () => void
  onSelectContainer: (id: string) => void
  onSelectWidget: (id: string) => void
  onAddContainer: () => void
  onDelete: () => void
  onDuplicate: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onWidgetDrag: (containerId: string, widgetType: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)

  const sectionStyle: React.CSSProperties = {
    padding: `${section.padding_top || '80px'} ${section.padding_right || '0'} ${section.padding_bottom || '80px'} ${section.padding_left || '0'}`,
    minHeight: section.min_height || undefined,
    maxWidth: section.max_width || undefined,
    margin: `${section.margin_top || '0'} auto ${section.margin_bottom || '0'}`,
    background: section.bg_type === 'color' ? section.bg_color
      : section.bg_type === 'gradient' ? section.bg_gradient
      : section.bg_type === 'image' ? `url(${section.bg_image}) center/cover`
      : undefined,
  }

  return (
    <div
      className={`canvas-section ${isSelected ? 'selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      onContextMenu={onContextMenu}
      style={sectionStyle}
    >
      {/* Section toolbar */}
      <div className="section-chrome">
        <div className="chrome-label">Seção</div>
        <div className="chrome-actions">
          <button onClick={(e) => { e.stopPropagation(); onAddContainer() }} title="Adicionar container">+ Container</button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Duplicar">⧉</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} title="Excluir" className="danger">✕</button>
        </div>
      </div>

      {/* Containers */}
      <div className="section-containers" style={{ display: 'flex', gap: section.gap || '0', flexDirection: section.direction === 'row' ? 'row' : 'column' }}>
        {(section.containers || []).length === 0 ? (
          <div
            className={`container-placeholder ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const widgetType = e.dataTransfer.getData('widget-type')
              if (widgetType) {
                onAddContainer()
              }
            }}
            onClick={(e) => { e.stopPropagation(); onAddContainer() }}
          >
            <span>+ Container</span>
          </div>
        ) : (
          (section.containers || [])
            .sort((a, b) => a.order - b.order)
            .map(container => (
              <ContainerBlock
                key={container.id}
                container={container}
                isSelected={selectedContainerId === container.id}
                selectedWidgetId={selectedWidgetId}
                onSelect={() => onSelectContainer(container.id)}
                onSelectWidget={onSelectWidget}
                onWidgetDrag={onWidgetDrag}
              />
            ))
        )}
      </div>
    </div>
  )
}

// ============================================================
// CONTAINER BLOCK
// ============================================================
function ContainerBlock({
  container, isSelected, selectedWidgetId,
  onSelect, onSelectWidget, onWidgetDrag,
}: {
  container: PageContainer
  isSelected: boolean
  selectedWidgetId: string | null
  onSelect: () => void
  onSelectWidget: (id: string) => void
  onWidgetDrag: (containerId: string, widgetType: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: container.direction === 'row' ? 'row' : 'column',
    gap: container.gap || '16px',
    alignItems: container.align_items as any || 'stretch',
    justifyContent: container.justify_content as any || 'flex-start',
    flex: container.flex_grow || '1',
    padding: `${container.padding_top || '0'} ${container.padding_right || '0'} ${container.padding_bottom || '0'} ${container.padding_left || '0'}`,
    background: container.bg_type === 'color' ? container.bg_color : undefined,
    border: container.border || undefined,
    borderRadius: container.border_radius || undefined,
  }

  return (
    <div
      className={`canvas-container ${isSelected ? 'selected' : ''} ${dragOver ? 'drag-over' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      style={containerStyle}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const widgetType = e.dataTransfer.getData('widget-type')
        if (widgetType) onWidgetDrag(container.id, widgetType)
      }}
    >
      <div className="container-label">Container</div>
      {(container.widgets || []).length === 0 ? (
        <div className="widget-placeholder">
          <span>Arraste um widget aqui</span>
        </div>
      ) : (
        (container.widgets || [])
          .sort((a, b) => a.order - b.order)
          .map(widget => (
            <WidgetBlock
              key={widget.id}
              widget={widget}
              isSelected={selectedWidgetId === widget.id}
              onSelect={() => onSelectWidget(widget.id)}
            />
          ))
      )}
    </div>
  )
}

// ============================================================
// WIDGET BLOCK
// ============================================================
function WidgetBlock({ widget, isSelected, onSelect }: {
  widget: PageWidget
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={`canvas-widget ${isSelected ? 'selected' : ''} widget-${widget.type}`}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      style={{
        padding: `${widget.padding_top || '0'} ${widget.padding_right || '0'} ${widget.padding_bottom || '0'} ${widget.padding_left || '0'}`,
        margin: `${widget.margin_top || '0'} ${widget.margin_right || '0'} ${widget.margin_bottom || '0'} ${widget.margin_left || '0'}`,
        width: widget.width || undefined,
        maxWidth: widget.max_width || undefined,
        textAlign: (widget.text_align as any) || undefined,
      }}
    >
      <div className="widget-label">{widget.type}</div>
      <WidgetPreview widget={widget} />
    </div>
  )
}

// ============================================================
// WIDGET PREVIEW
// ============================================================
function WidgetPreview({ widget }: { widget: PageWidget }) {
  const { content } = widget

  switch (widget.type) {
    case 'heading':
      return <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{content.text || 'Título'}</div>
    case 'text':
      return <div style={{ color: '#666' }}>{content.text || content.html || 'Texto'}</div>
    case 'button':
      return <button style={{ padding: '10px 20px', background: '#00ff88', border: 'none', borderRadius: 8, fontWeight: 600 }}>{content.label || 'Botão'}</button>
    case 'image':
      return content.image ? <img src={content.image} alt={content.alt || ''} style={{ maxWidth: '100%', borderRadius: 8 }} /> : <div style={{ padding: 40, background: '#f0f0f0', borderRadius: 8, textAlign: 'center', color: '#999' }}>Imagem</div>
    case 'spacer':
      return <div style={{ height: content.height || '40px' }} />
    case 'divider':
      return <hr style={{ border: 'none', height: '1px', background: '#e5e5e5' }} />
    case 'video':
      return <div style={{ padding: 40, background: '#0a0a0a', borderRadius: 8, textAlign: 'center', color: '#666' }}>▶ Vídeo</div>
    case 'html':
      return <div style={{ padding: 12, background: '#f5f5f7', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>{'HTML/Código'}</div>
    case 'icon':
      return <div style={{ fontSize: '2rem' }}>{content.icon || '★'}</div>
    case 'product':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>▣ Produto</div>
    case 'productGrid':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>⊞ Grade de Produtos</div>
    case 'categories':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>▦ Categorias</div>
    case 'cta':
      return <div style={{ padding: 24, background: '#00ff88', borderRadius: 8, textAlign: 'center' }}>{content.cta_title || 'CTA'}</div>
    case 'faq':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>?</div>
    case 'testimonials':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>❝ Depoimentos</div>
    case 'specifications':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>☰ Especificações</div>
    case 'gallery':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>🎨 Galeria</div>
    case 'carousel':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>🎠 Carrossel</div>
    case 'banner':
      return <div style={{ padding: 16, background: '#f0f0f0', borderRadius: 8, textAlign: 'center' }}>▬ Banner</div>
    case 'newsletter':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>✉ Newsletter</div>
    case 'form':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>▭ Formulário</div>
    case 'menu':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>≡ Menu</div>
    case 'price':
      return <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>$ Preço</div>
    case 'buyButton':
      return <button style={{ padding: '10px 20px', background: '#00ff88', border: 'none', borderRadius: 8 }}>🛒 Comprar</button>
    case 'comparison':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>⚖ Comparação</div>
    case 'quote':
      return <div style={{ padding: 16, fontStyle: 'italic', borderLeft: '3px solid #00ff88' }}>{content.quote_text || 'Citação'}</div>
    case 'list':
      return <div style={{ padding: 16 }}>• Lista</div>
    case 'table':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>▦ Tabela</div>
    case 'embed':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>⧉ Embed</div>
    case 'steps':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>① Passos</div>
    case 'columns':
      return <div style={{ padding: 16, border: '1px dashed #ccc', borderRadius: 8, textAlign: 'center' }}>▥ Colunas</div>
    case 'grid':
      return <div style={{ padding: 16, border: '1px dashed #ccc', borderRadius: 8, textAlign: 'center' }}>⊞ Grid</div>
    case 'tabs':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>☰ Abas</div>
    case 'accordion':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>≡ Accordion</div>
    case 'toggle':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>◎ Toggle</div>
    case 'breadcrumb':
      return <div style={{ padding: 8, color: '#999', fontSize: '0.85rem' }}>› Breadcrumb</div>
    case 'imageText':
      return <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><div style={{ flex: 1, height: 100, background: '#f0f0f0', borderRadius: 8 }} /><div style={{ flex: 1, color: '#666' }}>Imagem + Texto</div></div>
    case 'relatedProducts':
      return <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>↻ Produtos Relacionados</div>
    case 'productHero':
      return <div style={{ padding: 24, border: '1px solid #eee', borderRadius: 8 }}>★ Produto Hero</div>
    case 'code':
      return <div style={{ padding: 12, background: '#1a1a1a', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.8rem', color: '#00ff88' }}>{'{ } Código'}</div>
    default:
      return <div style={{ padding: 8, color: '#999' }}>{widget.type}</div>
  }
}

// ============================================================
// WIDGET CATEGORY (Sidebar)
// ============================================================
function WidgetCategory({ label, widgets }: { label: string; widgets: typeof WIDGET_DEFINITIONS }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="widget-category">
      <button className="category-header" onClick={() => setOpen(!open)}>
        <span className={`category-arrow ${open ? 'open' : ''}`}>›</span>
        {label}
      </button>
      {open && (
        <div className="category-widgets">
          {widgets.map(w => (
            <div
              key={w.type}
              className="widget-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('widget-type', w.type)}
            >
              <span className="widget-icon">{w.icon}</span>
              <span className="widget-label">{w.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
