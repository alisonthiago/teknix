import { useRef, useEffect } from 'react'
import { SlidersHorizontal, ArrowUpDown, Search, X } from 'lucide-react'
import { HubExportMenu } from './HubExportMenu'
import type { BulkAction } from './HubBulkActions'
import type { ExportColumn, ExportRow } from '../../../lib/exportTable'
import './HubDataTable.css'

export interface SortOption {
  label: string
  value: string
}

interface HubTableToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  onFilter?: () => void
  filterActive?: boolean
  sortOptions?: SortOption[]
  currentSort?: string
  onSortChange?: (value: string) => void
  exportColumns?: ExportColumn[]
  exportRows?: ExportRow[]
  selectedIds?: string[]
  getRowById?: (id: string) => ExportRow | undefined
  exportTitle?: string
  exportFilename?: string
  activeFilters?: string
  headerActions?: React.ReactNode
  extra?: React.ReactNode
  bulkActions?: BulkAction[]
  onClearSelection?: () => void
  entityLabel?: string
}

export function HubTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  onFilter,
  filterActive,
  sortOptions,
  currentSort,
  onSortChange,
  exportColumns,
  exportRows = [],
  selectedIds = [],
  getRowById,
  exportTitle,
  exportFilename,
  activeFilters,
  headerActions,
  extra,
  bulkActions,
  onClearSelection,
  entityLabel = 'registro'
}: HubTableToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Atalho: Ctrl+K / Cmd+K foca a busca
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Quando houver itens selecionados, a toolbar se transforma na barra de ações em massa
  if (selectedIds.length > 0 && bulkActions && bulkActions.length > 0) {
    const count = selectedIds.length
    const countText = `${count} ${count === 1 ? entityLabel : `${entityLabel}s`} ${count === 1 ? 'selecionado' : 'selecionados'}`

    return (
      <div className="hub-table-toolbar hub-table-toolbar-selection" role="toolbar" aria-label="Ações de seleção">
        <div className="hub-toolbar-selection-left" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: '1 1 auto' }}>
          <span className="hub-bulk-count">{countText}</span>
          {onClearSelection && (
            <button
              className="hub-toolbar-btn hub-bulk-clear-btn"
              onClick={onClearSelection}
              aria-label="Desmarcar seleção"
              title="Desmarcar tudo"
            >
              <X size={13} style={{ marginRight: 4 }} />
              Desmarcar
            </button>
          )}
          {bulkActions.map((action, i) => (
            <button
              key={i}
              className={`hub-toolbar-btn hub-bulk-action-btn${action.variant === 'danger' ? ' danger' : ''}`}
              onClick={() => action.action(selectedIds)}
              aria-label={action.label}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        <div className="hub-toolbar-selection-right" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {exportColumns && (
            <div className="hub-toolbar-export-container">
              <HubExportMenu
                columns={exportColumns}
                allRows={exportRows}
                selectedIds={selectedIds}
                getRowById={getRowById}
                exportTitle={exportTitle}
                filename={exportFilename}
                activeFilters={activeFilters}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentSortLabel = sortOptions?.find(o => o.value === currentSort)?.label || sortOptions?.[0]?.label || 'Mais novo'

  return (
    <div className="hub-table-toolbar">
      {/* Campo de busca */}
      {onSearchChange && (
        <div className="hub-search-wrap">
          <Search size={14} className="hub-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="hub-search-input"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            aria-label={searchPlaceholder}
          />
          {searchValue && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 4px', fontSize: 16, lineHeight: 1 }}
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Tabs / Ações (ex: Todos, Pendentes, Notificados, Atualizar, etc.) */}
      {headerActions && (
        <div className="hub-toolbar-header-actions">
          {headerActions}
        </div>
      )}

      {/* Filtrar */}
      {onFilter && (
        <button
          className={`hub-toolbar-btn${filterActive ? ' active' : ''}`}
          onClick={onFilter}
          aria-label="Filtrar"
        >
          <SlidersHorizontal size={12} />
          Filtrar
          {filterActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
        </button>
      )}

      {/* Ordenar */}
      {sortOptions && onSortChange && (
        <button
          className="hub-toolbar-btn"
          onClick={() => {
            const idx = sortOptions.findIndex(o => o.value === currentSort)
            const next = sortOptions[(idx + 1) % sortOptions.length]
            onSortChange(next.value)
          }}
          aria-label={`Ordenar por ${currentSortLabel}`}
        >
          <ArrowUpDown size={12} />
          {currentSortLabel}
        </button>
      )}

      {/* Extra (botões adicionais) */}
      {extra}

      {/* Exportar */}
      {exportColumns && (
        <div className="hub-toolbar-export-container">
          <HubExportMenu
            columns={exportColumns}
            allRows={exportRows}
            selectedIds={selectedIds}
            getRowById={getRowById}
            exportTitle={exportTitle}
            filename={exportFilename}
            activeFilters={activeFilters}
          />
        </div>
      )}
    </div>
  )
}
