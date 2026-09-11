import { Trash2, X } from 'lucide-react'
import './HubDataTable.css'

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  action: (ids: string[]) => void
  variant?: 'default' | 'danger'
}

interface HubBulkActionsProps {
  selectedIds: string[]
  onClear: () => void
  actions?: BulkAction[]
  entityLabel?: string
}

export function HubBulkActions({
  selectedIds,
  onClear,
  actions = [],
  entityLabel = 'registro'
}: HubBulkActionsProps) {
  if (selectedIds.length === 0) return null

  const count = selectedIds.length
  const label = count === 1 ? `${count} ${entityLabel} selecionado` : `${count} ${entityLabel}s selecionados`

  return (
    <div className="hub-bulk-bar" role="toolbar" aria-label="Ações em massa">
      <span className="hub-bulk-count">{label}</span>

      {actions.map((action, i) => (
        <button
          key={i}
          className={`hub-bulk-action-btn${action.variant === 'danger' ? ' danger' : ''}`}
          onClick={() => action.action(selectedIds)}
          aria-label={action.label}
        >
          {action.icon}
          {action.label}
        </button>
      ))}

      <button
        className="hub-bulk-clear"
        onClick={onClear}
        aria-label="Desmarcar seleção"
        title="Desmarcar tudo"
      >
        <X size={13} style={{ marginRight: 3 }} />
        Desmarcar
      </button>
    </div>
  )
}

/** Hook utilitário para exclusão em massa com confirmação */
export function useBulkDelete(
  onDelete: (ids: string[]) => Promise<void> | void,
  entityLabel = 'registro'
) {
  return async function handleBulkDelete(ids: string[]) {
    const label = ids.length === 1 ? `este ${entityLabel}` : `estes ${ids.length} ${entityLabel}s`
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir ${label}?\nEssa ação não pode ser desfeita.`
    )
    if (confirmed) {
      await onDelete(ids)
    }
  }
}
