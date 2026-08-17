// @ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default async function SalesPage() {
  const supabase = await createClient()
  const { data: sales, error } = await supabase
    .from('sales')
    .select(`
      *,
      marketplaces ( name ),
      sale_items ( quantity, profit, margin )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendas Realizadas</h2>
          <p className="text-muted-foreground">Acompanhe as saídas e a rentabilidade real de cada venda.</p>
        </div>
        <Link href="/sales/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
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
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Nenhuma venda registrada.
                    </TableCell>
                  </TableRow>
                )}
                {sales?.map((sale) => {
                  const totalProfit = sale.sale_items?.reduce((acc: number, item: any) => acc + item.profit, 0) || 0
                  const avgMargin = sale.sale_items?.reduce((acc: number, item: any) => acc + item.margin, 0) / (sale.sale_items?.length || 1) || 0
                  
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-semibold">{sale.order_id || '-'}</TableCell>
                      <TableCell>{sale.marketplaces?.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_revenue)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${totalProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProfit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={avgMargin >= 20 ? 'default' : avgMargin > 0 ? 'secondary' : 'destructive'} className={avgMargin >= 20 ? 'bg-green-600' : ''}>
                          {avgMargin.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{sale.status}</Badge>
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
