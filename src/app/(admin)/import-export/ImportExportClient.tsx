'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, CheckCircle, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/client'

type Module = 'products' | 'sales' | 'purchases' | 'suppliers'

const MODULES: Record<Module, { label: string; table: string; columns: string[] }> = {
  products:   { label: 'Produtos',      table: 'products',   columns: ['name','sku','ean','category','cost_purchase','current_price','stock','min_stock','supplier_id'] },
  sales:      { label: 'Vendas',        table: 'sales',      columns: ['date','order_id','marketplace_id','total_revenue','status','notes'] },
  purchases:  { label: 'Compras',       table: 'purchases',  columns: ['date','invoice','supplier_id','total_cost','payment_method','notes'] },
  suppliers:  { label: 'Fornecedores',  table: 'suppliers',  columns: ['name','cnpj','phone','email','notes'] },
}

export default function ImportExportClient({ type }: { type: 'import' | 'export' }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module>('products')
  const [importedCount, setImportedCount] = useState(0)

  const handleExport = async () => {
    setLoading(true)
    setMessage('Gerando arquivo...')
    setSuccess(false)
    try {
      const supabase = createClient()
      const mod = MODULES[selectedModule]
      const { data, error } = await supabase.from(mod.table).select('*')
      if (error) throw error
      if (!data?.length) { setMessage('Nenhum dado encontrado.'); setLoading(false); return }

      const clean = data.map(row => {
        const obj: Record<string, unknown> = {}
        mod.columns.forEach(c => { obj[c] = row[c] })
        obj['id'] = row.id
        return obj
      })

      const worksheet = XLSX.utils.json_to_sheet(clean)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, mod.label)
      XLSX.writeFile(workbook, `teknix_${selectedModule}_export.xlsx`)
      setMessage(`Exportação de ${mod.label} concluída (${data.length} registros).`)
      setSuccess(true)
    } catch (err: unknown) {
      setMessage(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMessage('Lendo arquivo...')
    setSuccess(false)
    setImportedCount(0)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

          if (!json.length) { setMessage('Arquivo vazio.'); setLoading(false); return }

          const supabase = createClient()
          const mod = MODULES[selectedModule]
          const rows = json.map(row => {
            const obj: Record<string, unknown> = {}
            mod.columns.forEach(c => {
              if (row[c] !== undefined && row[c] !== '') obj[c] = row[c]
            })
            return obj
          })

          const BATCH = 500
          let inserted = 0
          for (let i = 0; i < rows.length; i += BATCH) {
            const batch = rows.slice(i, i + BATCH)
            const { error } = await supabase.from(mod.table).insert(batch)
            if (error) throw new Error(`Lote ${Math.floor(i / BATCH) + 1}: ${error.message}`)
            inserted += batch.length
            setImportedCount(inserted)
            setMessage(`Importando... ${inserted}/${rows.length}`)
          }

          setMessage(`Importação concluída: ${inserted} registros de ${mod.label}.`)
          setSuccess(true)
        } catch (err: unknown) {
          setMessage(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
          setSuccess(false)
        } finally {
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (err: unknown) {
      setMessage(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Módulo</Label>
        <select
          className="flex h-9 w-full rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm"
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value as Module)}
          disabled={loading}
        >
          {(Object.keys(MODULES) as Module[]).map(k => (
            <option key={k} value={k}>{MODULES[k].label}</option>
          ))}
        </select>
      </div>

      {type === 'export' ? (
        <>
          <p className="text-xs text-[#999]">Colunas exportadas: {MODULES[selectedModule].columns.join(', ')}</p>
          <Button onClick={handleExport} disabled={loading} className="w-full bg-[#333] h-11 text-sm">
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Exportando...' : `Exportar ${MODULES[selectedModule].label} (.xlsx)`}
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Arquivo (.xlsx, .csv)</Label>
            <p className="text-xs text-[#999]">Colunas esperadas: {MODULES[selectedModule].columns.join(', ')}</p>
            <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleImport} disabled={loading} className="w-full text-sm" />
          </div>
          {importedCount > 0 && (
            <div className="w-full bg-[#f5f5f5] rounded-full h-2">
              <div className="bg-[#3483fa] h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (importedCount / (importedCount || 1)) * 100)}%` }}></div>
            </div>
          )}
        </>
      )}

      {message && (
        <div className={`flex items-center gap-2 text-sm text-center justify-center ${success ? 'text-green-600' : 'text-[#666]'}`}>
          {success ? <CheckCircle className="w-4 h-4" /> : loading ? <div className="w-4 h-4 border-2 border-[#e6e6e6] border-t-[#3483fa] rounded-full animate-spin" /> : <AlertCircle className="w-4 h-4" />}
          {message}
        </div>
      )}
    </div>
  )
}
