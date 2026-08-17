import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">Visualize estatísticas e gráficos de vendas e estoque.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">
            A seção de relatórios avançados (gráficos temporais, Curva ABC de produtos, rentabilidade por fornecedor) 
            está programada para a próxima fase de desenvolvimento. 
            No momento, você pode extrair os dados na aba &quot;Importar / Exportar&quot; para visualizar em Excel.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
