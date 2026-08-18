import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sale } = await supabase
    .from('sales')
    .select(`
      *,
      marketplaces ( name, code ),
      sale_items ( *, products ( name, sku, cost_price ) )
    `)
    .eq('id', id)
    .single()

  if (!sale) notFound()

  const totalCost = sale.sale_items?.reduce((acc: number, item: { products?: { cost_price?: number }; quantity: number }) =>
    acc + (Number(item.products?.cost_price || 0) * item.quantity), 0) || 0
  const totalProfit = sale.sale_items?.reduce((acc: number, item: { profit?: number }) => acc + Number(item.profit || 0), 0) || 0
  const totalRevenue = Number(sale.total_revenue || 0)
  const avgMargin = sale.sale_items?.length
    ? sale.sale_items.reduce((acc: number, item: { margin?: number }) => acc + Number(item.margin || 0), 0) / sale.sale_items.length
    : 0

  return (
    <div className="mp-stack">
      <div className="flex items-center gap-4">
        <Link href="/sales">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Venda #{sale.order_id || sale.id.slice(0, 8)}</h2>
          <p className="text-[#999] text-sm">{format(new Date(sale.date), 'dd/MM/yyyy')} — {sale.marketplaces?.name}</p>
        </div>
        <Badge variant="outline" className="ml-auto">{sale.status}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Faturamento</p>
            <p className="text-xl font-bold text-[#333]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Custo Total</p>
            <p className="text-xl font-bold text-[#333]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Lucro Líquido</p>
            <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProfit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Margem Média</p>
            <Badge variant={avgMargin >= 20 ? 'default' : avgMargin > 0 ? 'secondary' : 'destructive'} className={`text-lg ${avgMargin >= 20 ? 'bg-green-600' : ''}`}>
              {avgMargin.toFixed(1)}%
            </Badge>
          </CardContent>
        </Card>
      </div>

      {sale.tracking_code && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#999]">Código de Rastreio</p>
            <p className="font-mono text-sm">{sale.tracking_code}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Itens da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço Venda</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.sale_items?.map((item: { id: string; products?: { name?: string; sku?: string }; quantity: number; sale_price: number; profit: number; margin: number }) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.products?.name || '-'}</TableCell>
                  <TableCell className="text-[#999]">{item.products?.sku || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.sale_price)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.profit) > 0 ? Number(item.sale_price) - Number(item.profit) : 0)}</TableCell>
                  <TableCell className={`text-right font-bold ${Number(item.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={Number(item.margin) >= 20 ? 'default' : 'secondary'} className={Number(item.margin) >= 20 ? 'bg-green-600' : ''}>
                      {Number(item.margin).toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {sale.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#999] mb-1">Observações</p>
            <p className="text-sm">{sale.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
