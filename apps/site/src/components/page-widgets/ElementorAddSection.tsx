import React, { useState } from 'react'
import type { CanvasNode } from '../../../../../packages/core/src/pageWidgets'

interface ElementorAddSectionProps {
  onInsertContainer: (node: CanvasNode) => void
  onChooseWidget?: () => void
  onDropWidget?: (e: React.DragEvent) => void
  onClose?: () => void
  initialView?: 'select-type' | 'select-flex' | 'select-grid'
  isEmpty?: boolean
}

export function createFlexPresetNode(preset: string): CanvasNode {
  const containerId = crypto.randomUUID()

  if (preset === 'c100') {
    return {
      id: containerId,
      label: 'Contêiner (Coluna)',
      type: 'container',
      content: {
        direction: 'column',
        gap: '16px',
        width_type: 'boxed',
        tag: 'div'
      },
      children: []
    }
  }

  if (preset === 'r100') {
    return {
      id: containerId,
      label: 'Contêiner (Linha)',
      type: 'container',
      content: {
        direction: 'row',
        gap: '16px',
        width_type: 'boxed',
        tag: 'div'
      },
      children: []
    }
  }

  if (preset === 'c100-c50-50') {
    return {
      id: containerId,
      label: 'Contêiner Flexbox',
      type: 'container',
      content: { direction: 'row', wrap: 'wrap', gap: '16px', width_type: 'boxed', tag: 'div' },
      children: [
        {
          id: crypto.randomUUID(),
          label: 'Coluna 1',
          type: 'container',
          content: { direction: 'column', flex: '1', width: '50%', gap: '12px', tag: 'div' },
          children: []
        },
        {
          id: crypto.randomUUID(),
          label: 'Coluna 2',
          type: 'container',
          content: { direction: 'column', flex: '1', width: '50%', gap: '12px', tag: 'div' },
          children: [
            {
              id: crypto.randomUUID(),
              label: 'Contêiner 1',
              type: 'container',
              content: { direction: 'column', width: '100%', gap: '12px', tag: 'div' },
              children: []
            },
            {
              id: crypto.randomUUID(),
              label: 'Contêiner 2',
              type: 'container',
              content: { direction: 'column', width: '100%', gap: '12px', tag: 'div' },
              children: []
            }
          ]
        }
      ]
    }
  }

  let widths: string[] = []
  if (preset === '50-50') widths = ['50%', '50%']
  else if (preset === '33-66') widths = ['33.333%', '66.666%']
  else if (preset === '25-25-25-25') widths = ['25%', '25%', '25%', '25%']
  else if (preset === '25-50-25') widths = ['25%', '50%', '25%']
  else if (preset === '50-50-50-50') widths = ['50%', '50%', '50%', '50%']
  else if (preset === '50-50-100') widths = ['50%', '50%', '100%']
  else if (preset === '33-33-33-33-33-33') widths = ['33.333%', '33.333%', '33.333%', '33.333%', '33.333%', '33.333%']
  else if (preset === '33-33-33-33-66') widths = ['33.333%', '33.333%', '33.333%', '33.333%', '66.666%']
  else if (preset === '66-33-33-66') widths = ['66.666%', '33.333%', '33.333%', '66.666%']
  else widths = ['50%', '50%']

  const children: CanvasNode[] = widths.map((w, i) => ({
    id: crypto.randomUUID(),
    label: `Coluna ${i + 1}`,
    type: 'container',
    content: {
      direction: 'column',
      flex: widths.length <= 4 && !widths.includes('100%') ? '1' : undefined,
      width: w,
      gap: '12px',
      tag: 'div'
    },
    children: []
  }))

  return {
    id: containerId,
    label: 'Contêiner Flexbox',
    type: 'container',
    content: {
      direction: 'row',
      wrap: 'wrap',
      gap: '16px',
      justify: 'flex-start',
      align: 'stretch',
      width_type: 'boxed',
      tag: 'div'
    },
    children
  }
}

export function createGridPresetNode(structure: string): CanvasNode {
  const containerId = crypto.randomUUID()
  let cols = 2
  let rows = 1
  let count = 2

  if (structure === '1-2') { cols = 2; rows = 1; count = 2 }
  else if (structure === '2-1') { cols = 1; rows = 2; count = 2 }
  else if (structure === '1-3') { cols = 3; rows = 1; count = 3 }
  else if (structure === '3-1') { cols = 1; rows = 3; count = 3 }
  else if (structure === '2-2') { cols = 2; rows = 2; count = 4 }
  else if (structure === '2-3') { cols = 3; rows = 2; count = 6 }

  const children: CanvasNode[] = Array.from({ length: count }).map((_, i) => ({
    id: crypto.randomUUID(),
    label: `Célula ${i + 1}`,
    type: 'container',
    content: {
      direction: 'column',
      gap: '12px',
      tag: 'div'
    },
    children: []
  }))

  return {
    id: containerId,
    label: 'Grade',
    type: 'grid',
    content: {
      columns: cols,
      rows: rows,
      gap: '16px',
      width_type: 'boxed',
      tag: 'div',
      grid_outline: structure
    },
    children
  }
}

export default function ElementorAddSection({
  onInsertContainer,
  onChooseWidget: _onChooseWidget,
  onDropWidget,
  onClose,
  initialView = 'select-type',
  isEmpty = false
}: ElementorAddSectionProps) {
  const [view, setView] = useState<'select-type' | 'select-flex' | 'select-grid'>(initialView)

  const handleSelectFlex = (preset: string) => {
    const node = createFlexPresetNode(preset)
    onInsertContainer(node)
    if (onClose) onClose()
    else setView('select-type')
  }

  const handleSelectGrid = (structure: string) => {
    const node = createGridPresetNode(structure)
    onInsertContainer(node)
    if (onClose) onClose()
    else setView('select-type')
  }

  return (
    <section
      aria-label="Adicionar novo elemento ao layout"
      data-view={view}
      id="elementor-add-new-section"
      className={`elementor-add-section elementor-visible-desktop ${isEmpty ? 'elementor-section-empty' : ''}`}
      onDragOver={e => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={e => {
        e.preventDefault()
        e.stopPropagation()
        if (onDropWidget) onDropWidget(e)
      }}
    >
      <div className="elementor-add-section-inner">
        {onClose ? (
          <button
            type="button"
            className="elementor-add-section-close"
            data-tooltip="Fechar"
            aria-label="Fechar"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        ) : (
          view !== 'select-type' && (
            <button
              type="button"
              className="elementor-add-section-close"
              data-tooltip="Fechar"
              aria-label="Fechar"
              onClick={() => setView('select-type')}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )
        )}

        {(view === 'select-flex' || view === 'select-grid') && (
          <button
            type="button"
            className="elementor-add-section-back"
            data-tooltip="Voltar"
            aria-label="Voltar"
            onClick={() => setView('select-type')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {view === 'select-type' && (
          <div className="e-view e-con-shared-styles e-con-select-type">
            <div className="e-con-select-type__title">Qual layout você gostaria de usar?</div>
            <div className="e-con-select-type__icons">
              <button
                type="button"
                className="e-con-select-type__icons__icon flex-preset-button"
                onClick={() => setView('select-flex')}
              >
                <svg width="85" height="85" viewBox="0 0 85 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="41.698" height="84.9997" fill="#D5DADE"></rect>
                  <rect x="43.3018" width="41.698" height="41.6498" fill="#D5DADE"></rect>
                  <rect x="43.3018" y="43.3506" width="41.698" height="41.6498" fill="#D5DADE"></rect>
                </svg>
                <div className="e-con-select-type__icons__icon__subtitle">Flexbox</div>
              </button>
              <button
                type="button"
                className="e-con-select-type__icons__icon grid-preset-button"
                onClick={() => setView('select-grid')}
              >
                <svg width="85" height="85" viewBox="0 0 85 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="83.9997" height="84" stroke="#9DA5AE" strokeDasharray="2 2"></rect>
                  <path d="M42.501 0.484375V84.6259" stroke="#9DA5AE" strokeDasharray="1 1"></path>
                  <path d="M84.623 42.501L-0.00038953 42.501" stroke="#9DA5AE" strokeDasharray="1 1"></path>
                </svg>
                <div className="e-con-select-type__icons__icon__subtitle">Grade</div>
              </button>
            </div>
          </div>
        )}

        {view === 'select-flex' && (
          <div className="e-view e-con-select-preset e-con-select-preset-flex">
            <div className="e-con-select-header-row">
              <div className="e-con-select-preset__title">Selecione sua estrutura</div>
              <div className="e-con-type-toggle">
                <button
                  type="button"
                  className="e-con-toggle-btn active"
                  onClick={() => setView('select-flex')}
                >
                  Flexbox
                </button>
                <button
                  type="button"
                  className="e-con-toggle-btn"
                  onClick={() => setView('select-grid')}
                >
                  Grade
                </button>
              </div>
            </div>
            <div className="e-con-select-preset__list">
              <button type="button" className="e-con-preset" data-preset="c100" onClick={() => handleSelectFlex('c100')}>
                <svg viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <title>Direção da coluna</title>
                  <rect width="89" height="44" fill="#EAECEE"></rect>
                  <path d="M43.956 24.644L42 22.748C41.848 22.596 41.672 22.52 41.472 22.52C41.28 22.52 41.108 22.596 40.956 22.748C40.804 22.9 40.728 23.076 40.728 23.276C40.728 23.476 40.804 23.652 40.956 23.804L44.304 27.056C44.456 27.208 44.628 27.284 44.82 27.284C45.02 27.284 45.196 27.208 45.348 27.056L48.504 23.852C48.656 23.7 48.732 23.524 48.732 23.324C48.732 23.124 48.656 22.948 48.504 22.796C48.352 22.644 48.176 22.568 47.976 22.568C47.776 22.568 47.6 22.644 47.448 22.796L45.456 24.848L45.504 17.048C45.504 16.848 45.428 16.676 45.276 16.532C45.124 16.38 44.948 16.304 44.748 16.304C44.548 16.304 44.372 16.38 44.22 16.532C44.076 16.676 44.004 16.848 44.004 17.048L43.956 24.644Z" fill="#717A84"></path>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="r100" onClick={() => handleSelectFlex('r100')}>
                <svg className="exclude-rtl-scale" viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <title>Direção da linha</title>
                  <rect width="89" height="44" fill="#EAECEE"></rect>
                  <path d="M47.856 23.352L45.948 25.296C45.796 25.448 45.72 25.624 45.72 25.824C45.72 26.024 45.796 26.2 45.948 26.352C46.1 26.504 46.276 26.58 46.476 26.58C46.676 26.58 46.852 26.504 47.004 26.352L50.256 23.004C50.408 22.852 50.484 22.676 50.484 22.476C50.484 22.276 50.408 22.1 50.256 21.948L47.052 18.804C46.9 18.652 46.724 18.576 46.524 18.576C46.324 18.576 46.148 18.652 45.996 18.804C45.844 18.956 45.768 19.132 45.768 19.332C45.768 19.524 45.844 19.696 45.996 19.848L48.048 21.852L40.248 21.804C40.048 21.804 39.872 21.88 39.72 22.032C39.576 22.176 39.504 22.348 39.504 22.548C39.504 22.748 39.576 22.924 39.72 23.076C39.872 23.228 40.048 23.304 40.248 23.304L47.856 23.352Z" fill="#717A84"></path>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="50-50" onClick={() => handleSelectFlex('50-50')}>
                <svg viewBox="0 0 90 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" width="44" height="44" fill="#D5DADE"></rect>
                  <rect x="45.5" width="44" height="44" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="33-66" onClick={() => handleSelectFlex('33-66')}>
                <svg viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="29" height="44" fill="#D5DADE"></rect>
                  <rect x="30" width="59" height="44" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="25-25-25-25" onClick={() => handleSelectFlex('25-25-25-25')}>
                <svg viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="21.5" height="44" fill="#D5DADE"></rect>
                  <rect x="22.5" width="21.5" height="44" fill="#D5DADE"></rect>
                  <rect x="45" width="21.5" height="44" fill="#D5DADE"></rect>
                  <rect x="67.5" width="21.5" height="44" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="25-50-25" onClick={() => handleSelectFlex('25-50-25')}>
                <svg viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="21.5" height="44" fill="#D5DADE"></rect>
                  <rect x="22.5" width="44" height="44" fill="#D5DADE"></rect>
                  <rect x="67.5" width="21.5" height="44" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="50-50-50-50" onClick={() => handleSelectFlex('50-50-50-50')}>
                <svg viewBox="0 0 90 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" width="44" height="21.5" fill="#D5DADE"></rect>
                  <rect x="45.5" width="44" height="21.5" fill="#D5DADE"></rect>
                  <rect x="0.5" y="22.5" width="44" height="21.5" fill="#D5DADE"></rect>
                  <rect x="45.5" y="22.5" width="44" height="21.5" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="50-50-100" onClick={() => handleSelectFlex('50-50-100')}>
                <svg viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="44" height="21.5" fill="#D5DADE"></rect>
                  <rect x="45" width="44" height="21.5" fill="#D5DADE"></rect>
                  <rect y="22.5" width="89" height="21.5" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="c100-c50-50" onClick={() => handleSelectFlex('c100-c50-50')}>
                <svg viewBox="0 0 90 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" width="44" height="44" fill="#D5DADE"></rect>
                  <rect x="45.5" width="44" height="21.5" fill="#D5DADE"></rect>
                  <rect x="45.5" y="22.5" width="44" height="21.5" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="33-33-33-33-33-33" onClick={() => handleSelectFlex('33-33-33-33-33-33')}>
                <svg viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect x="30" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect x="60" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect y="22.5" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect x="30" y="22.5" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect x="60" y="22.5" width="29" height="21.5" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="33-33-33-33-66" onClick={() => handleSelectFlex('33-33-33-33-66')}>
                <svg viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect x="30" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect x="60" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect y="22.5" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect x="30" y="22.5" width="59" height="21.5" fill="#D5DADE"></rect>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-preset="66-33-33-66" onClick={() => handleSelectFlex('66-33-33-66')}>
                <svg viewBox="0 0 89 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="59" height="21.5" fill="#D5DADE"></rect>
                  <rect x="60" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect y="22.5" width="29" height="21.5" fill="#D5DADE"></rect>
                  <rect x="30" y="22.5" width="59" height="21.5" fill="#D5DADE"></rect>
                </svg>
              </button>
            </div>
          </div>
        )}

        {view === 'select-grid' && (
          <div className="e-view e-con-shared-styles e-con-select-preset-grid">
            <div className="e-con-select-header-row">
              <div className="e-con-select-preset__title">Selecione sua estrutura</div>
              <div className="e-con-type-toggle">
                <button
                  type="button"
                  className="e-con-toggle-btn"
                  onClick={() => setView('select-flex')}
                >
                  Flexbox
                </button>
                <button
                  type="button"
                  className="e-con-toggle-btn active"
                  onClick={() => setView('select-grid')}
                >
                  Grade
                </button>
              </div>
            </div>
            <div className="e-con-select-preset__list">
              <button type="button" className="e-con-preset" data-structure="1-2" onClick={() => handleSelectGrid('1-2')}>
                <svg width="92" height="46" viewBox="0 0 92 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.8">
                    <rect x="0.941406" y="1" width="90" height="44.5" fill="white" stroke="#515962" strokeDasharray="3 3"></rect>
                    <path d="M45.9414 1.12402V45.3768" stroke="#515962" strokeDasharray="3 3"></path>
                  </g>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-structure="2-1" onClick={() => handleSelectGrid('2-1')}>
                <svg width="92" height="47" viewBox="0 0 92 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="91.2227" y="1.35059" width="44.5" height="90" transform="rotate(90 91.2227 1.35059)" fill="white" stroke="#515962" strokeDasharray="3 3"></rect>
                  <path d="M91.0957 23.6006L1.34961 23.6006" stroke="#515962" strokeDasharray="3 3"></path>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-structure="1-3" onClick={() => handleSelectGrid('1-3')}>
                <svg width="92" height="46" viewBox="0 0 92 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.8">
                    <rect x="0.941895" y="0.944336" width="90" height="44.5" fill="white" stroke="#515962" strokeDasharray="3 3"></rect>
                    <path d="M30.9419 1.19824V45.4443" stroke="#515962" strokeDasharray="3 3"></path>
                    <path d="M60.9419 1.19824V45.4443" stroke="#515962" strokeDasharray="3 3"></path>
                  </g>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-structure="3-1" onClick={() => handleSelectGrid('3-1')}>
                <svg width="92" height="46" viewBox="0 0 92 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.8">
                    <rect x="90.9419" y="0.944336" width="44.5" height="90" transform="rotate(90 90.9419 0.944336)" fill="white" stroke="#515962" strokeDasharray="3 3"></rect>
                    <path d="M90.6155 15.5654L1.26713 15.5654" stroke="#515962" strokeDasharray="3 3"></path>
                    <path d="M90.6155 30.1875L1.26713 30.1875" stroke="#515962" strokeDasharray="3 3"></path>
                  </g>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-structure="2-2" onClick={() => handleSelectGrid('2-2')}>
                <svg width="92" height="46" viewBox="0 0 92 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.8">
                    <rect x="0.941895" y="0.944336" width="90" height="44.5" fill="white" stroke="#515962" strokeDasharray="3 3"></rect>
                    <path d="M45.9419 1.19727V45.4443" stroke="#515962" strokeDasharray="3 3"></path>
                    <path d="M90.9419 23.3213L0.941896 23.3213" stroke="#515962" strokeDasharray="3 3"></path>
                  </g>
                </svg>
              </button>

              <button type="button" className="e-con-preset" data-structure="2-3" onClick={() => handleSelectGrid('2-3')}>
                <svg width="92" height="46" viewBox="0 0 92 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect opacity="0.8" x="90.9419" y="0.944336" width="44.5" height="90" transform="rotate(90 90.9419 0.944336)" fill="white" stroke="#515962" strokeDasharray="3 3"></rect>
                  <path d="M0.941895 22.3711L90.9419 22.3711" stroke="#515962" strokeDasharray="3 3"></path>
                  <path d="M60.9419 45.4443L60.9419 1.56836" stroke="#515962" strokeDasharray="3 3"></path>
                  <path d="M30.9419 45.4443L30.9419 1.56836" stroke="#515962" strokeDasharray="3 3"></path>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
