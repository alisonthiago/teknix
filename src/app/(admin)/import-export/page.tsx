import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ImportExportClient from './ImportExportClient'

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Importar / Exportar (Excel e CSV)</h2>
          <p className="text-muted-foreground">Movimente dados em massa no seu sistema TEKTOU.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Importar Dados</CardTitle>
            <CardDescription>Carregue produtos ou atualize estoques usando planilhas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImportExportClient type="import" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportar Dados</CardTitle>
            <CardDescription>Baixe relatórios completos em formato Excel (.xlsx) ou CSV.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImportExportClient type="export" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
