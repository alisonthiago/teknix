import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function RealCostPage() {
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Custo Real</h2>
          <p className="text-muted-foreground">Composição do custo real de mercadoria em estoque.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Painel de Custo Real</CardTitle>
          <CardDescription>Esta tela nunca deve ser confundida com Preço de Venda. Aqui visualizamos apenas o que foi gasto.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Erro ao carregar custos.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Custo Compra</TableHead>
                  <TableHead className="text-right">Frete Unit.</TableHead>
                  <TableHead className="text-right">Embalagem</TableHead>
                  <TableHead className="text-right">Outros</TableHead>
                  <TableHead className="text-right bg-slate-50 font-bold">Custo Real</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right bg-blue-50 text-blue-900 font-bold">Total em Estoque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                      Nenhum produto cadastrado para calcular custo.
                    </TableCell>
                  </TableRow>
                )}
                {products?.map((product) => {
                  const cost = Number(product.cost_purchase) || 0
                  const freight = Number(product.freight_purchase) || 0
                  const packaging = Number(product.packaging_cost) || 0
                  const other = Number(product.other_costs) || 0
                  const realCost = cost + freight + packaging + other
                  const totalInStock = realCost * product.stock
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-slate-500">{product.sku}</TableCell>
                      <TableCell className="font-semibold">{product.name}</TableCell>
                      <TableCell className="text-right">R$ {cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {freight.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {packaging.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {other.toFixed(2)}</TableCell>
                      <TableCell className="text-right bg-slate-50 font-bold">R$ {realCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.stock} un</TableCell>
                      <TableCell className="text-right bg-blue-50 text-blue-900 font-bold">
                        R$ {totalInStock.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
