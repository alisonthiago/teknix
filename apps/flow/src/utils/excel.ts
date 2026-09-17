import * as XLSX from 'xlsx'

export interface ExportColumnDef {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  format?: (value: any, row: Record<string, any>) => string
}

/**
 * Exports an array of JSON objects to an Excel file and downloads it.
 */
export function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Sheet1',
  columns?: ExportColumnDef[]
) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar.')
    return
  }

  let formattedData = data
  if (columns && columns.length > 0) {
    formattedData = data.map(row => {
      const formattedRow: Record<string, any> = {}
      columns.forEach(col => {
        const val = row[col.key]
        formattedRow[col.label] = col.format ? col.format(val, row) : (val ?? '')
      })
      return formattedRow
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(formattedData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Exports an array of records to a formatted PDF printable document with native browser vector print/save dialog.
 */
export function exportToPDF(
  data: Record<string, any>[],
  columns: ExportColumnDef[],
  title: string = 'Relatório Operacional',
  subtitle?: string
) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar em PDF.')
    return
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const printWindow = window.open('', '_blank', 'width=1100,height=850')
  if (!printWindow) {
    alert('Por favor, autorize pop-ups para visualizar e salvar o PDF.')
    return
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${title} — TEKNIX FLOW</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 10mm 12mm 10mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111111;
      margin: 0;
      padding: 16px;
      background: #ffffff;
      font-size: 11px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #111111;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #111111;
    }
    .brand span {
      color: #0071e3;
    }
    .meta {
      text-align: right;
      font-size: 10px;
      color: #666666;
      line-height: 1.4;
    }
    .report-title {
      font-size: 15px;
      font-weight: 700;
      color: #111111;
      margin: 0 0 4px 0;
    }
    .report-sub {
      font-size: 11px;
      color: #666666;
      margin: 0 0 12px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #f5f5f7;
      color: #111111;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.5px;
      padding: 7px 8px;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #111111;
      text-align: left;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10px;
      color: #222222;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background-color: #fafafa;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #888888;
    }
    .no-print {
      margin-bottom: 14px;
      padding: 10px 14px;
      background: #f0f7ff;
      border: 1px solid #bae0ff;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #0071e3;
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <span style="font-size: 12px; color: #0050b3; font-weight: 600;">
      Visualização de Impressão • Pronto para salvar como PDF
    </span>
    <button class="print-btn" onclick="window.print()">Salvar como PDF / Imprimir</button>
  </div>
  <div class="header">
    <div>
      <div class="brand">TEKNIX <span>FLOW</span></div>
      <div style="font-size: 10px; color: #666; margin-top: 2px;">Sistema Integrado de Operação & Estoque</div>
    </div>
    <div class="meta">
      <div><strong>Emissão:</strong> ${dateStr}</div>
      <div><strong>Total de Registros:</strong> ${data.length}</div>
    </div>
  </div>
  <div>
    <h1 class="report-title">${title}</h1>
    ${subtitle ? `<p class="report-sub">${subtitle}</p>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        ${columns.map(c => `<th class="text-${c.align || 'left'}">${c.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${columns.map(c => {
            const rawVal = row[c.key]
            const val = c.format ? c.format(rawVal, row) : (rawVal ?? '—')
            return `<td class="text-${c.align || 'left'}">${String(val)}</td>`
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    <span>TEKNIX FLOW • Relatório Gerencial</span>
    <span>Emissão Oficial</span>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`

  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Reads an Excel file and converts it to JSON objects.
 * Applies a flexible column mapping to match the system's schema.
 * @param file The Excel/CSV file to read
 * @param schemaMapping An object where keys are the expected system fields (e.g. 'name') 
 *                      and values are arrays of possible column names in the excel (e.g. ['nome', 'razão social', 'produto'])
 */
export function importFromExcel(file: File, schemaMapping: Record<string, string[]>): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        
        // rawData is an array of objects where keys are the excel column headers
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })
        
        if (rawData.length === 0) {
          return resolve([])
        }

        // Clean up mapping for case-insensitive search
        const cleanMapping: Record<string, string[]> = {}
        for (const [key, aliases] of Object.entries(schemaMapping)) {
          cleanMapping[key] = aliases.map(a => a.toLowerCase().trim())
        }

        const mappedData = rawData.map(row => {
          const newObj: Record<string, any> = {}
          
          // Lowercase and trim all keys from the excel row for easier matching
          const normalizedRow: Record<string, any> = {}
          for (const [k, v] of Object.entries(row)) {
            normalizedRow[k.toLowerCase().trim()] = v
          }

          // Try to map each field defined in our schema
          for (const [systemKey, aliases] of Object.entries(cleanMapping)) {
            let foundValue = null
            
            for (const alias of aliases) {
              if (normalizedRow[alias] !== undefined && normalizedRow[alias] !== null && normalizedRow[alias] !== '') {
                foundValue = normalizedRow[alias]
                break
              }
            }
            // If not found by exact alias, try partial matching (e.g. if column is "Nome do Produto", match "nome")
            if (foundValue === null) {
              const matchingKey = Object.keys(normalizedRow).find(rowKey => 
                aliases.some(alias => rowKey.includes(alias))
              )
              if (matchingKey) {
                foundValue = normalizedRow[matchingKey]
              }
            }

            if (foundValue !== null) {
              newObj[systemKey] = foundValue
            }
          }

          return newObj
        })
        
        resolve(mappedData)
      } catch (err) {
        reject(err)
      }
    }
    
    reader.onerror = (err) => reject(err)
    
    // Check if it's an array buffer or binary string reader
    reader.readAsBinaryString(file)
  })
}
