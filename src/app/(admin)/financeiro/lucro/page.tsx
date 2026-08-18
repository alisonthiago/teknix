import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default async function LucroPage() {
  await requirePermission('profit.view')
  const supabase = await createClient()

  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('profit, margin, quantity, total_revenue, cogs, fees, taxes')
    .order('profit', { ascending: false })

  const { data: sales } = await supabase
    .from('sales')
    .select('id, order_id, date, marketplaces(name)')

  const totalProfit = saleItems?.reduce((a, s) => a + Number(s.profit || 0), 0) || 0
  const totalRevenue = saleItems?.reduce((a, s) => a + Number(s.total_revenue || 0), 0) || 0
  const totalCost = saleItems?.reduce((a, s) => a + Number(s.cogs || 0), 0) || 0
  const avgMargin = saleItems?.length ? saleItems.reduce((a, s) => a + Number(s.margin || 0), 0) / saleItems.length : 0

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Lucro</h2>
        <p className="text-sm text-[#999] mt-1">Análise detalhada do lucro por venda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-green-100 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Lucro Total</p>
            <p className="text-xl font-bold text-green-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProfit)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#e6e6e6]">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Receita Total</p>
            <p className="text-xl font-bold text-[#333]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#e6e6e6]">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Custo Total</p>
            <p className="text-xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Margem Média</p>
            <p className="text-xl font-bold text-purple-700">{avgMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-[#e6e6e6]">
        <CardHeader><CardTitle>Lucro por Venda</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!saleItems?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[#999]">Nenhum dado disponível.</TableCell>
                </TableRow>
              )}
              {saleItems?.slice(0, 50).map((item, i) => {
                const sale = sales?.[i] as Record<string, unknown> | undefined
                const mp = sale?.marketplaces as { name?: string } | undefined
                return (
                <TableRow key={i}>
                  <TableCell className="text-sm">{sale?.date ? new Date(String(sale.date)).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{String(sale?.order_id || '-')}</TableCell>
                  <TableCell className="text-sm">{mp?.name || '-'}</TableCell>
                  <TableCell className="text-right text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_revenue || 0)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-red-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.cogs || 0)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    <span className={Number(item.profit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.profit || 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <span className={Number(item.margin) >= 15 ? 'text-green-600' : Number(item.margin) > 0 ? 'text-lime-600' : 'text-red-600'}>
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
