import { createClient } from '@/utils/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import { format } from 'date-fns'

export default async function SalesPage() {
  const supabase = await createClient()
  const userPerms = await getUserPermissions()
  const canViewProfit = userPerms?.permissions.has('profit.view') ?? false
  const canViewMargin = userPerms?.permissions.has('margin.view') ?? false
  const canViewRevenue = userPerms?.permissions.has('revenue.view') ?? false

  const { data: sales, error } = await supabase
    .from('sales')
    .select(`
      *,
      marketplaces ( name ),
      sale_items ( quantity, profit, margin )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="mp-stack">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[#999]">Acompanhe as saídas e a rentabilidade real de cada venda.</p>
        <Link href="/sales/new">
          <Button className="bg-[#1f2328] hover:bg-[#111827]">
            <Plus className="w-4 h-4 mr-2" /> Registrar Venda
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
          <CardDescription>O lucro exibe o valor após desconto de taxas, impostos e custo real do produto.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Erro ao carregar vendas.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Canal</TableHead>
                  {canViewRevenue && <TableHead className="text-right">Faturamento</TableHead>}
                  {canViewProfit && <TableHead className="text-right">Lucro</TableHead>}
                  {canViewMargin && <TableHead className="text-right">Margem</TableHead>}
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-[#999]">
                      Nenhuma venda registrada.
                    </TableCell>
                  </TableRow>
                )}
                {sales?.map((sale) => {
                  const totalProfit = canViewProfit ? (sale.sale_items?.reduce((acc: number, item: { profit?: number }) => acc + Number(item.profit || 0), 0) || 0) : 0
                  const avgMargin = canViewMargin ? (sale.sale_items?.reduce((acc: number, item: { margin?: number }) => acc + Number(item.margin || 0), 0) / (sale.sale_items?.length || 1) || 0) : 0

                  return (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-semibold">{sale.order_id || '-'}</TableCell>
                      <TableCell>{sale.marketplaces?.name}</TableCell>
                      {canViewRevenue && (
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_revenue)}
                        </TableCell>
                      )}
                      {canViewProfit && (
                        <TableCell className={`text-right font-bold ${totalProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProfit)}
                        </TableCell>
                      )}
                      {canViewMargin && (
                        <TableCell className="text-right">
                          <Badge variant={avgMargin >= 20 ? 'default' : avgMargin > 0 ? 'secondary' : 'destructive'} className={avgMargin >= 20 ? 'bg-green-600' : ''}>
                            {avgMargin.toFixed(2)}%
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Badge variant="outline">{sale.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/sales/${sale.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-1" /> Ver</Button>
                        </Link>
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
