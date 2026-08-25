import * as XLSX from 'xlsx'

/**
 * Exports an array of JSON objects to an Excel file and downloads it.
 */
export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar.')
    return
  }
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
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
