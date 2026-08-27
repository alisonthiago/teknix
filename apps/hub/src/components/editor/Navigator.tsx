import React, { useState, useRef, useEffect } from 'react'
import type { PageSection, PageContainer, PageWidget } from '../../types/pageBuilder'
import {
  X, Sparkles, MinusSquare, PlusSquare, Eye, EyeOff, ChevronRight, ChevronDown,
  LayoutGrid, Heading, Type, Image as ImageIcon, Video, Star, Space, GripVertical, MoreHorizontal
} from 'lucide-react'
import { WIDGET_DEFINITIONS } from '../../types/pageBuilder'
import './Navigator.css'

interface Props {
  sections: PageSection[]
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
  sections,
  selectedId,
  onSelect,
  onClose,
  onUpdateSection,
  onUpdateContainer,
  onUpdateWidget
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)))
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(
    new Set(sections.flatMap(s => (s.containers || []).map(c => c.id)))
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
        {sections.map((section, sIdx) => {
          const isSecOpen = expandedSections.has(section.id)
          const isSecSelected = selectedId === section.id
          const containers = (section.containers || []).sort((a: any, b: any) => a.order - b.order)

          return (
            <div key={section.id} className="structure-tree-section">
              {/* Section Header Row */}
              <div
                className={`structure-row section-row ${isSecSelected ? 'selected' : ''}`}
                onClick={() => onSelect('section', section.id)}
              >
                <button
                  type="button"
                  className="structure-arrow-btn"
                  onClick={e => toggleSection(section.id, e)}
                >
                  {isSecOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
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

              {/* Containers / Children */}
              {isSecOpen && containers.map(container => {
                const isConOpen = expandedContainers.has(container.id)
                const isConSelected = selectedId === container.id
                const widgets = (container.widgets || []).sort((a: any, b: any) => a.order - b.order)

                return (
                  <div key={container.id} className="structure-tree-container">
                    <div
                      className={`structure-row container-row ${isConSelected ? 'selected' : ''}`}
                      onClick={() => onSelect('container', container.id)}
                    >
                      <button
                        type="button"
                        className="structure-arrow-btn"
                        onClick={e => toggleContainer(container.id, e)}
                      >
                        {isConOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
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
                      >
                        {(container as any).hide_on_desktop ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>

                    {/* Widgets list */}
                    {isConOpen && widgets.map(widget => {
                      const isWidSelected = selectedId === widget.id
                      return (
                        <div
                          key={widget.id}
                          className={`structure-row widget-row ${isWidSelected ? 'selected' : ''}`}
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
                          >
                            {(widget as any).hide_on_desktop ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}

        {sections.length === 0 && (
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
