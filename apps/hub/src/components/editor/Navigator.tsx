import React, { useState, useRef, useEffect } from 'react'
import type { PageSection, PageContainer, PageWidget } from '../../types/pageBuilder'
import type { CanvasNode } from '../../../../../packages/core/src/pageWidgets'
import {
  X, Sparkles, MinusSquare, PlusSquare, Eye, EyeOff, ChevronRight, ChevronDown,
  LayoutGrid, Heading, Type, Image as ImageIcon, Video, Star, Space, GripVertical, MoreHorizontal
} from 'lucide-react'
import { WIDGET_DEFINITIONS } from '../../types/pageBuilder'
import './Navigator.css'

interface Props {
  sections?: PageSection[]
  canvasNodes?: CanvasNode[]
  selectedId: string | null
  onSelect: (type: 'section' | 'container' | 'widget', id: string) => void
  onClose: () => void
  onUpdateSection?: (id: string, updates: Partial<PageSection>) => void
  onUpdateContainer?: (id: string, updates: Partial<PageContainer>) => void
  onUpdateWidget?: (id: string, updates: Partial<PageWidget>) => void
  onReorderSection?: (draggedId: string, targetId: string) => void
  onReorderContainer?: (sectionId: string, draggedId: string, targetId: string) => void
  onReorderWidget?: (containerId: string, draggedId: string, targetId: string) => void
}


function getWidgetIcon(type: string) {
  if (type === 'heading') return <Heading size={13} />
  if (type === 'text') return <Type size={13} />
  if (type === 'image') return <ImageIcon size={13} />
  if (type === 'video') return <Video size={13} />
  if (type === 'spacer') return <Space size={13} />
  if (type === 'button' || type === 'cta') return <Star size={13} />
  if (type === 'product_grid' || type === 'listing_grid') return <LayoutGrid size={13} />
  return <Type size={13} />
}

function getWidgetDisplayName(widget: PageWidget) {
  if (widget.type === 'heading') return 'Título'
  if (widget.type === 'text') return 'Editor de Texto'
  if (widget.type === 'image') return 'Imagem'
  if (widget.type === 'video') return 'Vídeo'
  if (widget.type === 'spacer') return 'Espaçador'
  if (widget.type === 'button') return 'Botão'
  if (widget.type === 'product_grid') return 'Listing Grid'
  const def = WIDGET_DEFINITIONS.find(w => w.type === widget.type)
  return def?.label || widget.type
}

export default function Navigator({
  sections = [],
  canvasNodes = [],
  selectedId,
  onSelect,
  onClose,
  onUpdateSection,
  onUpdateContainer,
  onUpdateWidget
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set((sections || []).map(s => s.id)))
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(
    new Set([
      ...(sections || []).flatMap(s => (s.containers || []).map(c => c.id)),
      ...(canvasNodes || []).map(n => n.id)
    ])
  )
  const [allExpanded, setAllExpanded] = useState(true)

  // Floating & Draggable window state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: window.innerWidth - 340, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const windowStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  function handleMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return
    }
    setIsDragging(true)
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    windowStartPos.current = { ...position }
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging) return
      const dx = e.clientX - dragStartPos.current.x
      const dy = e.clientY - dragStartPos.current.y
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 300, windowStartPos.current.x + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 200, windowStartPos.current.y + dy))
      })
    }

    function handleMouseUp() {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  function toggleAll() {
    if (allExpanded) {
      setExpandedSections(new Set())
      setExpandedContainers(new Set())
      setAllExpanded(false)
    } else {
      setExpandedSections(new Set(sections.map(s => s.id)))
      setExpandedContainers(new Set(sections.flatMap(s => (s.containers || []).map(c => c.id))))
      setAllExpanded(true)
    }
  }

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(expandedSections)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedSections(next)
  }

  const toggleContainer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(expandedContainers)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedContainers(next)
  }

  function renderContainerChildren(container: PageContainer, depth: number) {
    const isConOpen = expandedContainers.has(container.id)
    if (!isConOpen) return null

    const widgets = (container.widgets || []).sort((a: any, b: any) => a.order - b.order)
    const childContainers = (container.children || []).sort((a: any, b: any) => a.order - b.order)

    return (
      <>
        {widgets.map(widget => {
          const isWidSelected = selectedId === widget.id
          return (
            <div
              key={widget.id}
              className={`structure-row widget-row ${isWidSelected ? 'selected' : ''}`}
              style={{ paddingLeft: `${depth * 14 + 10}px` }}
              onClick={() => onSelect('widget', widget.id)}
            >
              <div className="structure-widget-icon">
                {getWidgetIcon(widget.type)}
              </div>
              <span className="structure-item-label widget-name">
                {getWidgetDisplayName(widget)}
              </span>
              <span className="structure-edit-badge">EDIT</span>
              <button
                type="button"
                className="structure-eye-btn"
                onClick={e => {
                  e.stopPropagation()
                  onUpdateWidget?.(widget.id, { hide_on_desktop: !(widget as any).hide_on_desktop } as any)
                }}
                title={(widget as any).hide_on_desktop ? 'Oculto' : 'Visível'}
              >
                {(widget as any).hide_on_desktop ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          )
        })}

        {childContainers.map(subContainer => {
          const isSubOpen = expandedContainers.has(subContainer.id)
          const isSubSelected = selectedId === subContainer.id
          const hasChildren = (subContainer.widgets && subContainer.widgets.length > 0) || (subContainer.children && subContainer.children.length > 0)

          return (
            <div key={subContainer.id} className="structure-tree-container">
              <div
                className={`structure-row container-row ${isSubSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${depth * 14 + 10}px` }}
                onClick={() => onSelect('container', subContainer.id)}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className="structure-arrow-btn"
                    onClick={e => toggleContainer(subContainer.id, e)}
                  >
                    {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                ) : (
                  <span style={{ width: 16, display: 'inline-block' }} />
                )}
                <div className="structure-grid-icon">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                    <rect x="0" y="0" width="3" height="3" rx="0.5" />
                    <rect x="4.5" y="0" width="3" height="3" rx="0.5" />
                    <rect x="9" y="0" width="3" height="3" rx="0.5" />
                    <rect x="0" y="5" width="3" height="3" rx="0.5" />
                    <rect x="4.5" y="5" width="3" height="3" rx="0.5" />
                    <rect x="9" y="5" width="3" height="3" rx="0.5" />
                  </svg>
                </div>
                <span className="structure-item-label">Contêiner</span>
                <button
                  type="button"
                  className="structure-eye-btn"
                  onClick={e => {
                    e.stopPropagation()
                    onUpdateContainer?.(subContainer.id, { hide_on_desktop: !(subContainer as any).hide_on_desktop } as any)
                  }}
                  title={(subContainer as any).hide_on_desktop ? 'Oculto' : 'Visível'}
                >
                  {(subContainer as any).hide_on_desktop ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>

              {isSubOpen && renderContainerChildren(subContainer, depth + 1)}
            </div>
          )
        })}
      </>
    )
  }

  function renderCanvasNodeTree(nodes: CanvasNode[], depth: number) {
    return nodes.map(node => {
      const isSelected = selectedId === node.id
      const hasChildren = node.children && node.children.length > 0
      const isOpen = expandedContainers.has(node.id)

      return (
        <div key={node.id} className="structure-tree-container">
          <div
            className={`structure-row ${node.type === 'container' ? 'container-row' : 'widget-row'} ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            onClick={() => onSelect(node.type === 'container' ? 'container' : 'widget', node.id)}
          >
            {hasChildren ? (
              <button
                type="button"
                className="structure-arrow-btn"
                onClick={e => {
                  e.stopPropagation()
                  toggleContainer(node.id, e)
                }}
              >
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <span style={{ width: 16, display: 'inline-block' }} />
            )}
            <div className="structure-widget-icon">
              {node.type === 'container' ? <LayoutGrid size={13} /> : getWidgetIcon(node.type || 'text')}
            </div>
            <span className="structure-item-label">
              {node.label}
            </span>
            <span className="structure-edit-badge">EDIT</span>
          </div>
          {hasChildren && isOpen && renderCanvasNodeTree(node.children || [], depth + 1)}
        </div>
      )
    })
  }

  return (
    <div
      className="elementor-structure-window"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* ── HEADER (Draggable) ── */}
      <div className="elementor-structure-header" onMouseDown={handleMouseDown}>
        <div className="elementor-structure-header-left">
          <button
            type="button"
            className="elementor-structure-icon-btn"
            onClick={toggleAll}
            title={allExpanded ? 'Recolher tudo' : 'Expandir tudo'}
          >
            {allExpanded ? <MinusSquare size={14} /> : <PlusSquare size={14} />}
          </button>
          <button
            type="button"
            className="elementor-structure-icon-btn sparkles"
            title="Otimizar estrutura com IA"
          >
            <Sparkles size={14} />
          </button>
        </div>

        <span className="elementor-structure-title">Estrutura</span>

        <button
          type="button"
          className="elementor-structure-icon-btn close"
          onClick={onClose}
          title="Fechar Estrutura"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── TREE BODY ── */}
      <div className="elementor-structure-body">
        {canvasNodes && canvasNodes.length > 0 ? (
          renderCanvasNodeTree(canvasNodes, 0)
        ) : (
          sections.map((section) => {

          const containers = (section.containers || []).sort((a: any, b: any) => a.order - b.order)
          const isSingleContainer = containers.length === 1 && (!containers[0].children || containers[0].children.length === 0)

          if (isSingleContainer) {
            const singleContainer = containers[0]
            const isSecOpen = expandedSections.has(section.id) && expandedContainers.has(singleContainer.id)
            const isSelected = selectedId === section.id || selectedId === singleContainer.id
            const widgets = (singleContainer.widgets || []).sort((a: any, b: any) => a.order - b.order)
            const hasChildren = widgets.length > 0

            return (
              <div key={section.id} className="structure-tree-section">
                {/* Single Root Container Row */}
                <div
                  className={`structure-row section-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect('container', singleContainer.id)}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      className="structure-arrow-btn"
                      onClick={e => {
                        e.stopPropagation()
                        toggleSection(section.id, e)
                        toggleContainer(singleContainer.id, e)
                      }}
                    >
                      {isSecOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  ) : (
                    <span style={{ width: 16, display: 'inline-block' }} />
                  )}
                  <div className="structure-grid-icon">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                      <rect x="0" y="0" width="3" height="3" rx="0.5" />
                      <rect x="4.5" y="0" width="3" height="3" rx="0.5" />
                      <rect x="9" y="0" width="3" height="3" rx="0.5" />
                      <rect x="0" y="5" width="3" height="3" rx="0.5" />
                      <rect x="4.5" y="5" width="3" height="3" rx="0.5" />
                      <rect x="9" y="5" width="3" height="3" rx="0.5" />
                    </svg>
                  </div>
                  <span className="structure-item-label">Contêiner</span>
                  <button
                    type="button"
                    className="structure-eye-btn"
                    onClick={e => {
                      e.stopPropagation()
                      onUpdateSection?.(section.id, { hide_on_desktop: !section.hide_on_desktop })
                      onUpdateContainer?.(singleContainer.id, { hide_on_desktop: !(singleContainer as any).hide_on_desktop } as any)
                    }}
                    title={section.hide_on_desktop || (singleContainer as any).hide_on_desktop ? 'Oculto' : 'Visível'}
                  >
                    {section.hide_on_desktop || (singleContainer as any).hide_on_desktop ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                {/* Direct Widgets under Root Container */}
                {isSecOpen && renderContainerChildren(singleContainer, 1)}
              </div>
            )
          }

          // Multi-container or complex section (2+ columns)
          const isSecOpen = expandedSections.has(section.id)
          const isSecSelected = selectedId === section.id
          const hasChildren = containers.length > 0

          return (
            <div key={section.id} className="structure-tree-section">
              <div
                className={`structure-row section-row ${isSecSelected ? 'selected' : ''}`}
                onClick={() => onSelect('section', section.id)}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className="structure-arrow-btn"
                    onClick={e => toggleSection(section.id, e)}
                  >
                    {isSecOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                ) : (
                  <span style={{ width: 16, display: 'inline-block' }} />
                )}
                <div className="structure-grid-icon">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                    <rect x="0" y="0" width="3" height="3" rx="0.5" />
                    <rect x="4.5" y="0" width="3" height="3" rx="0.5" />
                    <rect x="9" y="0" width="3" height="3" rx="0.5" />
                    <rect x="0" y="5" width="3" height="3" rx="0.5" />
                    <rect x="4.5" y="5" width="3" height="3" rx="0.5" />
                    <rect x="9" y="5" width="3" height="3" rx="0.5" />
                  </svg>
                </div>
                <span className="structure-item-label">Contêiner</span>
                <button
                  type="button"
                  className="structure-eye-btn"
                  onClick={e => {
                    e.stopPropagation()
                    onUpdateSection?.(section.id, { hide_on_desktop: !section.hide_on_desktop })
                  }}
                  title={section.hide_on_desktop ? 'Oculto' : 'Visível'}
                >
                  {section.hide_on_desktop ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>

              {/* Child Containers */}
              {isSecOpen && containers.map(container => {
                const isConOpen = expandedContainers.has(container.id)
                const isConSelected = selectedId === container.id
                const hasConChildren = (container.widgets && container.widgets.length > 0) || (container.children && container.children.length > 0)

                return (
                  <div key={container.id} className="structure-tree-container">
                    <div
                      className={`structure-row container-row ${isConSelected ? 'selected' : ''}`}
                      style={{ paddingLeft: '24px' }}
                      onClick={() => onSelect('container', container.id)}
                    >
                      {hasConChildren ? (
                        <button
                          type="button"
                          className="structure-arrow-btn"
                          onClick={e => toggleContainer(container.id, e)}
                        >
                          {isConOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      ) : (
                        <span style={{ width: 16, display: 'inline-block' }} />
                      )}
                      <div className="structure-grid-icon">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                          <rect x="0" y="0" width="3" height="3" rx="0.5" />
                          <rect x="4.5" y="0" width="3" height="3" rx="0.5" />
                          <rect x="9" y="0" width="3" height="3" rx="0.5" />
                          <rect x="0" y="5" width="3" height="3" rx="0.5" />
                          <rect x="4.5" y="5" width="3" height="3" rx="0.5" />
                          <rect x="9" y="5" width="3" height="3" rx="0.5" />
                        </svg>
                      </div>
                      <span className="structure-item-label">Contêiner</span>
                      <button
                        type="button"
                        className="structure-eye-btn"
                        onClick={e => {
                          e.stopPropagation()
                          onUpdateContainer?.(container.id, { hide_on_desktop: !(container as any).hide_on_desktop } as any)
                        }}
                        title={(container as any).hide_on_desktop ? 'Oculto' : 'Visível'}
                      >
                        {(container as any).hide_on_desktop ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>

                    {isConOpen && renderContainerChildren(container, 2)}
                  </div>
                )
              })}
            </div>
          )
        }))}

        {(!canvasNodes || canvasNodes.length === 0) && sections.length === 0 && (
          <div className="structure-empty">Nenhum contêiner na página</div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="elementor-structure-footer">
        <MoreHorizontal size={14} />
      </div>
    </div>
  )
}
