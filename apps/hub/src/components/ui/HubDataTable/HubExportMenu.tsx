import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import type { ExportColumn, ExportRow } from '../../../lib/exportTable'
import './HubDataTable.css'

interface HubExportMenuProps {
  /** Colunas a exportar */
  columns: ExportColumn[]
  /** Todos os dados filtrados */
  allRows: ExportRow[]
  /** IDs selecionados (se houver) */
  selectedIds?: string[]
  /** Função para obter linha por id (precisa de keyField) */
  getRowById?: (id: string) => ExportRow | undefined
  /** Título do relatório no PDF */
  exportTitle?: string
  /** Nome do arquivo */
  filename?: string
  /** Filtros ativos (texto para o PDF) */
  activeFilters?: string
}

export function HubExportMenu({
  columns,
  allRows,
  selectedIds = [],
  getRowById,
  exportTitle = 'Relatório',
  filename = 'exportacao',
  activeFilters
}: HubExportMenuProps) {
  const [loading, setLoading] = useState(false)

  function getExportRows(): ExportRow[] {
    if (selectedIds.length > 0 && getRowById) {
      return selectedIds.map(id => getRowById(id)).filter(Boolean) as ExportRow[]
    }
    return allRows
  }

  async function handleExport(type: 'xlsx' | 'pdf') {
    setLoading(true)
    try {
      const rows = getExportRows()
      if (type === 'xlsx') {
        const { exportToXLSX } = await import('../../../lib/exportTable')
        await exportToXLSX(rows, columns, filename)
      } else {
        const { exportToPDF } = await import('../../../lib/exportTable')
        await exportToPDF(rows, columns, exportTitle, activeFilters, filename)
      }
    } catch (e) {
      console.error('Erro ao exportar:', e)
      alert('Erro ao exportar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hub-export-wrapper" aria-label="Exportar dados">
      <button
        className="hub-toolbar-btn hub-export-btn hub-export-xlsx"
        onClick={() => handleExport('xlsx')}
        disabled={loading}
        title="Exportar para Excel"
        aria-label="Exportar para Excel"
      >
        <FileSpreadsheet size={14} /> Excel
      </button>
      <button
        className="hub-toolbar-btn hub-export-btn hub-export-pdf"
        onClick={() => handleExport('pdf')}
        disabled={loading}
        title="Exportar para PDF"
        aria-label="Exportar para PDF"
      >
        <FileText size={14} /> PDF
      </button>
    </div>
  )
}
