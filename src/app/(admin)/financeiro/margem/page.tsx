import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function MargemPage() {
  await requirePermission('margin.view')
  const supabase = await createClient()

  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('profit, margin, quantity, total_revenue, products(name, sku)')
    .order('margin', { ascending: false })

  const avgMargin = saleItems?.length ? saleItems.reduce((a, s) => a + Number(s.margin || 0), 0) / saleItems.length : 0
  const bestMargin = saleItems?.length ? Math.max(...saleItems.map(s => Number(s.margin || 0))) : 0
  const worstMargin = saleItems?.length ? Math.min(...saleItems.map(s => Number(s.margin || 0))) : 0

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Margem</h2>
        <p className="text-sm text-[#999] mt-1">Análise de margem por venda e produto.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-purple-100 bg-purple-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Margem Média</p>
            <p className="text-2xl font-bold text-purple-700">{avgMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Melhor Margem</p>
            <p className="text-2xl font-bold text-green-700">{bestMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-red-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Pior Margem</p>
            <p className="text-2xl font-bold text-red-600">{worstMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-[#e6e6e6]">
        <CardHeader><CardTitle>Detalhamento por Produto</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Qtd Vendida</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!saleItems?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[#999]">Nenhum dado disponível.</TableCell>
                </TableRow>
              )}
              {saleItems?.slice(0, 50).map((item, i) => {
                const prod = Array.isArray(item.products) ? item.products[0] : item.products as Record<string, unknown> | undefined
                return (
                <TableRow key={i}>
                  <TableCell className="text-sm">{prod?.name ? String(prod.name) : '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{prod?.sku ? String(prod.sku) : '-'}</TableCell>
                  <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-right text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_revenue || 0)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <span className={Number(item.profit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.profit || 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      Number(item.margin) > 25 ? 'bg-green-100 text-green-700' :
                      Number(item.margin) > 15 ? 'bg-blue-100 text-blue-700' :
                      Number(item.margin) > 0 ? 'bg-lime-100 text-lime-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Number(item.margin || 0).toFixed(1)}%
                    </span>
                  </TableCell>
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
