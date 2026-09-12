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

/**
 * HubBulkActions — As ações em massa agora são integradas diretamente
 * na HubTableToolbar (substituindo a toolbar durante a seleção),
 * garantindo que nenhuma barra flutuante (.hub-bulk-bar) apareça.
 */
export function HubBulkActions(_props: HubBulkActionsProps) {
  return null
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
