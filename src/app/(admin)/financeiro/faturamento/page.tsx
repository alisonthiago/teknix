import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function FaturamentoPage() {
  await requirePermission('revenue.view')
  const supabase = await createClient()

  const { data: sales } = await supabase
    .from('sales')
    .select('*, marketplaces(name)')
    .order('date', { ascending: false })
    .limit(100)

  const { data: saleItems } = await supabase.from('sale_items').select('fees, taxes, freight')

  const totalRevenue = sales?.reduce((a, s) => a + Number(s.total_revenue || 0), 0) || 0
  const totalFees = saleItems?.reduce((a, s) => a + Number(s.fees || 0), 0) || 0
  const totalTaxes = saleItems?.reduce((a, s) => a + Number(s.taxes || 0), 0) || 0
  const totalFreight = saleItems?.reduce((a, s) => a + Number(s.freight || 0), 0) || 0
  const netRevenue = totalRevenue - totalFees - totalTaxes - totalFreight

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Faturamento</h2>
        <p className="text-sm text-[#999] mt-1">Análise detalhada do faturamento.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-[#e6e6e6]">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Faturamento Bruto</p>
            <p className="text-xl font-bold text-[#333]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-red-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Taxas + Impostos</p>
            <p className="text-xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFees + totalTaxes)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-orange-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Fretes</p>
            <p className="text-xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFreight)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Faturamento Líquido</p>
            <p className="text-xl font-bold text-green-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-[#e6e6e6]">
        <CardHeader><CardTitle>Vendas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{sale.order_id || '-'}</TableCell>
                  <TableCell>{sale.marketplaces?.name || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_revenue || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
