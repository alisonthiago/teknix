import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function CustoRealPage() {
  await requirePermission('products.view')
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name, cost_purchase, freight_purchase, packaging_cost, other_costs')
    .order('name')

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Custo Real</h2>
        <p className="text-sm text-[#999] mt-1">Custo real de cada produto = Compra + Frete + Embalagem + Outros Custos</p>
      </div>

      <Card className="rounded-2xl border-[#e6e6e6]">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Custo Compra</TableHead>
                <TableHead className="text-right">Frete</TableHead>
                <TableHead className="text-right">Embalagem</TableHead>
                <TableHead className="text-right">Outros</TableHead>
                <TableHead className="text-right font-bold">Custo Real</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[#999]">Nenhum produto cadastrado.</TableCell>
                </TableRow>
              )}
              {products?.map(p => {
                const realCost = Number(p.cost_purchase || 0) + Number(p.freight_purchase || 0) + Number(p.packaging_cost || 0) + Number(p.other_costs || 0)
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                    <TableCell className="text-sm">{p.name}</TableCell>
                    <TableCell className="text-right text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.cost_purchase || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.freight_purchase || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.packaging_cost || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.other_costs || 0)}</TableCell>
                    <TableCell className="text-right font-bold text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(realCost)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
