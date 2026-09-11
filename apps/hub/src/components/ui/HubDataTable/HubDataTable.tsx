/**
 * HubDataTable — Componente Global de Tabela do TEKNIX HUB
 *
 * Padrão oficial para TODAS as listagens administrativas.
 * Inclui: checkbox, busca, filtros, ordenação, exportação, bulk actions, paginação.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { MoreVertical, Package } from 'lucide-react'
import { HubTableToolbar, type SortOption } from './HubTableToolbar'
import { HubBulkActions, type BulkAction } from './HubBulkActions'
import type { ExportColumn, ExportRow } from '../../../lib/exportTable'
import './HubDataTable.css'

// ── Column definition ─────────────────────────────────────────
export interface HubColumn<T = any> {
  key: string
  label: string
  width?: string
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  /** Função de render da célula */
  render?: (row: T) => React.ReactNode
  /** Campo para exportação (valor texto) */
  exportValue?: (row: T) => string | number
}

// ── Props ─────────────────────────────────────────────────────
export interface HubDataTableProps<T extends { id: string }> {
  /** Título da página */
  title: string
  /** Subtítulo / descrição */
  description?: string
  /** Botões do header (Novo, Importar, etc.) */
  headerActions?: React.ReactNode
  /** Colunas */
  columns: HubColumn<T>[]
  /** Dados já filtrados e carregados */
  rows: T[]
  /** Loading state */
  loading?: boolean
  /** Campo de busca */
  searchValue?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  /** Filtros */
  onFilter?: () => void
  filterActive?: boolean
  /** Ordenação */
  sortOptions?: SortOption[]
  currentSort?: string
  onSortChange?: (v: string) => void
  /** Ações em massa */
  bulkActions?: BulkAction[]
  entityLabel?: string
  /** Ações da linha (menu 3 pontos) */
  renderRowActions?: (row: T, onClose: () => void) => React.ReactNode
  /** Exportação */
  exportColumns?: ExportColumn[]
  exportTitle?: string
  exportFilename?: string
  activeFilters?: string
  /** Estado vazio */
  emptyMessage?: string
  emptyDescription?: string
  /** Paginação */
  pageSize?: number
  /** Contador */
  totalCount?: number
  /** Extra na toolbar */
  toolbarExtra?: React.ReactNode
}

// ── Skeleton ──────────────────────────────────────────────────
function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <div className="hub-table-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="hub-skeleton-row"
          style={{ gridTemplateColumns: `20px repeat(${columns - 1}, 1fr) 40px` }}
        >
          <div className="hub-skeleton-cell" style={{ width: 15, height: 15, borderRadius: 4 }} />
          {Array.from({ length: columns - 1 }).map((_, j) => (
            <div key={j} className="hub-skeleton-cell" style={{ width: j === 0 ? '60%' : '80%' }} />
          ))}
          <div className="hub-skeleton-cell" style={{ width: 20, height: 20, borderRadius: 8, margin: '0 auto' }} />
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export function HubDataTable<T extends { id: string }>({
  title,
  description,
  headerActions,
  columns,
  rows,
  loading = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  onFilter,
  filterActive,
  sortOptions,
  currentSort,
  onSortChange,
  bulkActions = [],
  entityLabel = 'registro',
  renderRowActions,
  exportColumns,
  exportTitle,
  exportFilename,
  activeFilters,
  emptyMessage = 'Nenhum registro encontrado.',
  emptyDescription,
  pageSize = 50,
  totalCount,
  toolbarExtra,
}: HubDataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handle() { setOpenMenuId(null) }
    window.addEventListener('click', handle)
    return () => window.removeEventListener('click', handle)
  }, [])

  // Reset seleção ao mudar dados
  useEffect(() => {
    setSelectedIds([])
    setPage(1)
  }, [rows.length])

  // ── Paginação ──
  const totalPages = Math.ceil(rows.length / pageSize)
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  // ── Seleção ──
  const allSelected = paginatedRows.length > 0 && paginatedRows.every(r => selectedIds.includes(r.id))
  const someSelected = paginatedRows.some(r => selectedIds.includes(r.id)) && !allSelected

  const headerCheckboxRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !paginatedRows.find(r => r.id === id)))
    } else {
      const newIds = paginatedRows.map(r => r.id)
      setSelectedIds(prev => [...new Set([...prev, ...newIds])])
    }
  }, [allSelected, paginatedRows])

  const toggleRow = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }, [])

  // ── Grid template columns ──
  const colWidths = [
    '20px', // checkbox
    ...columns.map(c => c.width || '1fr'),
    renderRowActions ? '44px' : undefined // ações
  ].filter(Boolean).join(' ')

  // ── Export rows ──
  const exportRows: ExportRow[] = rows.map(row => {
    const r: ExportRow = {}
    const cols = exportColumns || columns.filter(c => c.exportValue).map(c => ({ key: c.key, label: c.label }))
    cols.forEach(col => {
      const hubCol = columns.find(c => c.key === col.key)
      r[col.key] = hubCol?.exportValue ? hubCol.exportValue(row) : String((row as any)[col.key] ?? '')
    })
    return r
  })

  const getRowById = (id: string): ExportRow | undefined =>
    exportRows.find((_, i) => rows[i]?.id === id)

  const displayCount = totalCount ?? rows.length
  const displayLabel = displayCount === 1 ? `1 ${entityLabel}` : `${displayCount} ${entityLabel}s`

  return (
    <div className="hub-page-container">
      <div className="hub-page-wrapper">

        {/* ── Page Header ── */}
        <div className="hub-page-header">
          <div className="hub-header-info">
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {headerActions && (
            <div className="hub-header-actions">
              {headerActions}
            </div>
          )}
        </div>

        {/* ── Toolbar ── */}
        {onSearchChange && (
          <HubTableToolbar
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            onFilter={onFilter}
            filterActive={filterActive}
            sortOptions={sortOptions}
            currentSort={currentSort}
            onSortChange={onSortChange}
            exportColumns={exportColumns || columns.filter(c => c.exportValue).map(c => ({ key: c.key, label: c.label }))}
            exportRows={exportRows}
            selectedIds={selectedIds}
            getRowById={getRowById}
            exportTitle={exportTitle || title}
            exportFilename={exportFilename}
            activeFilters={activeFilters}
            extra={toolbarExtra}
          />
        )}

        {/* ── Bulk actions ── */}
        {selectedIds.length > 0 && bulkActions.length > 0 && (
          <HubBulkActions
            selectedIds={selectedIds}
            onClear={() => setSelectedIds([])}
            actions={bulkActions}
            entityLabel={entityLabel}
          />
        )}

        {/* ── Contador ── */}
        {!loading && (
          <div className="hub-table-count">
            {selectedIds.length > 0
              ? `${selectedIds.length} selecionado${selectedIds.length !== 1 ? 's' : ''} de ${displayCount}`
              : displayLabel
            }
          </div>
        )}

        {/* ── Table Card ── */}
        <div className="hub-table-card">

          {/* Header */}
          <div
            className="hub-table-header"
            style={{ gridTemplateColumns: colWidths }}
            role="row"
          >
            {/* Checkbox header */}
            <div className="hub-checkbox-cell">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                className="hub-checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label="Selecionar todos"
                disabled={loading || rows.length === 0}
              />
            </div>

            {/* Column headers */}
            {columns.map(col => (
              <div
                key={col.key}
                className="hub-table-header-cell"
                style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}
                role="columnheader"
              >
                {col.label}
              </div>
            ))}

            {/* Ações header */}
            {renderRowActions && (
              <div className="hub-table-header-cell" style={{ justifyContent: 'flex-end' }}>
                Ações
              </div>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <TableSkeleton columns={columns.length + 2} />
          ) : paginatedRows.length === 0 ? (
            <div className="hub-empty-state" role="status">
              <div className="hub-empty-icon">
                <Package size={22} />
              </div>
              <p className="hub-empty-title">{emptyMessage}</p>
              {emptyDescription && <p className="hub-empty-desc">{emptyDescription}</p>}
            </div>
          ) : (
            paginatedRows.map(row => {
              const isSelected = selectedIds.includes(row.id)
              return (
                <div
                  key={row.id}
                  className={`hub-table-row${isSelected ? ' selected' : ''}`}
                  style={{ gridTemplateColumns: colWidths }}
                  role="row"
                  aria-selected={isSelected}
                >
                  {/* Checkbox */}
                  <div className="hub-checkbox-cell">
                    <input
                      type="checkbox"
                      className="hub-checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Selecionar registro ${row.id}`}
                    />
                  </div>

                  {/* Cells */}
                  {columns.map(col => (
                    <div
                      key={col.key}
                      style={{
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start'
                      }}
                    >
                      {col.render ? col.render(row) : (
                        <span className="hub-cell-text">
                          {String((row as any)[col.key] ?? '—')}
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Row actions */}
                  {renderRowActions && (
                    <div className="hub-actions-cell">
                      <div className="hub-action-wrapper">
                        <button
                          type="button"
                          className={`hub-action-dots-btn${openMenuId === row.id ? ' active' : ''}`}
                          title="Mais opções"
                          aria-label="Mais opções"
                          onClick={e => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === row.id ? null : row.id)
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenuId === row.id && (
                          <div
                            className="hub-action-dropdown"
                            onClick={e => e.stopPropagation()}
                            role="menu"
                          >
                            {renderRowActions(row, () => setOpenMenuId(null))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer / Paginação ── */}
        {!loading && rows.length > 0 && (
          <div className="hub-table-footer">
            <span>
              {paginatedRows.length < rows.length
                ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, rows.length)} de ${rows.length}`
                : `${rows.length} ${entityLabel}${rows.length !== 1 ? 's' : ''} no total`
              }
            </span>
            {totalPages > 1 && (
              <div className="hub-pagination">
                <button
                  className="hub-page-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Página anterior"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1
                  return (
                    <button
                      key={p}
                      className={`hub-page-btn${page === p ? ' active' : ''}`}
                      onClick={() => setPage(p)}
                      aria-label={`Página ${p}`}
                      aria-current={page === p ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  className="hub-page-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Próxima página"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
