// @ts-nocheck
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/client'

export default function ImportExportClient({ type }: { type: 'import' | 'export' }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleExport = async () => {
    setLoading(true)
    setMessage('Gerando arquivo...')
    try {
      const supabase = createClient()
      const { data: products } = await supabase.from('products').select('*')
      
      if (!products) throw new Error('Nenhum dado encontrado.')

      const worksheet = XLSX.utils.json_to_sheet(products)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos')
      
      XLSX.writeFile(workbook, 'tektou_produtos_export.xlsx')
      setMessage('Exportação concluída com sucesso.')
    } catch (err: Error) {
      console.error(err)
      setMessage(`Erro na exportação: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage('Lendo arquivo...')
    
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        setMessage(`Arquivo lido. ${json.length} registros encontrados. Processamento em lote em desenvolvimento...`)
        setLoading(false)
      }
      reader.readAsArrayBuffer(file)
    } catch (err: Error) {
      console.error(err)
      setMessage(`Erro na importação: ${err.message}`)
      setLoading(false)
    }
  }

  if (type === 'export') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Módulo a exportar</Label>
          <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm">
            <option>Produtos (Completo)</option>
            <option>Vendas</option>
            <option>Compras</option>
            <option>Fornecedores</option>
          </select>
        </div>
        <Button onClick={handleExport} disabled={loading} className="w-full bg-slate-900">
          <Download className="w-4 h-4 mr-2" />
          {loading ? 'Exportando...' : 'Fazer Download (.xlsx)'}
        </Button>
        {message && <p className="text-sm text-center text-slate-600">{message}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Arquivo (.xlsx, .csv)</Label>
        <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleImport} disabled={loading} />
      </div>
      <Button variant="outline" className="w-full" disabled={true}>
        <Upload className="w-4 h-4 mr-2" />
        Processar Importação
      </Button>
      {message && <p className="text-sm text-center text-slate-600">{message}</p>}
      <p className="text-xs text-muted-foreground text-center">A gravação no banco via Excel está em fase de homologação.</p>
    </div>
  )
}
