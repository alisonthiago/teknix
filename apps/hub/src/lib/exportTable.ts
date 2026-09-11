/**
 * exportTable.ts — Utilitário de exportação para XLSX e PDF
 * Usado pelo HubExportMenu em todas as tabelas do HUB
 */

export interface ExportColumn {
  key: string
  label: string
}

export type ExportRow = Record<string, string | number | boolean | null | undefined>

function cellValue(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não'
  return String(val)
}

/** Exporta para Excel (.xlsx) usando SheetJS */
export async function exportToXLSX(
  rows: ExportRow[],
  columns: ExportColumn[],
  filename = 'exportacao'
): Promise<void> {
  const { utils, writeFile } = await import('xlsx')

  const header = columns.map(c => c.label)
  const data = rows.map(row => columns.map(c => cellValue(row[c.key])))

  const ws = utils.aoa_to_sheet([header, ...data])

  // Largura automática das colunas
  ws['!cols'] = columns.map(c => ({ wch: Math.max(c.label.length + 4, 16) }))

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Exportação')
  writeFile(wb, `${filename}_${formatDateFilename()}.xlsx`)
}

/** Exporta para PDF usando jsPDF + autoTable */
export async function exportToPDF(
  rows: ExportRow[],
  columns: ExportColumn[],
  title = 'Relatório',
  filters?: string,
  filename = 'exportacao'
): Promise<void> {
  const jsPDFModule = await import('jspdf')
  const { default: jsPDF } = jsPDFModule
  await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any

  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  // Cabeçalho
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 17, 17)
  doc.text(`TEKNIX HUB — ${title}`, 14, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`Exportado em: ${dateStr}`, 14, 26)

  if (filters) {
    doc.text(`Filtros: ${filters}`, 14, 31)
  }

  doc.text(`Total de registros: ${rows.length}`, 14, filters ? 36 : 31)

  const startY = filters ? 42 : 38

  // Tabela
  doc.autoTable({
    startY,
    head: [columns.map(c => c.label)],
    body: rows.map(row => columns.map(c => cellValue(row[c.key]))),
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
      textColor: [17, 17, 17],
    },
    headStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`${filename}_${formatDateFilename()}.pdf`)
}

function formatDateFilename(): string {
  const now = new Date()
  const d = String(now.getDate()).padStart(2, '0')
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const y = now.getFullYear()
  return `${d}-${m}-${y}`
}
