// @ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch some metrics
  const { data: salesData } = await supabase.from('sales').select('total_revenue, created_at')
  const { data: saleItems } = await supabase.from('sale_items').select('profit, margin, quantity')
  const { data: products } = await supabase.from('products').select('*')

  const totalRevenue = salesData?.reduce((acc: number, curr: any) => acc + Number(curr.total_revenue), 0) || 0
  const totalProfit = saleItems?.reduce((acc: number, curr: any) => acc + Number(curr.profit), 0) || 0
  const avgMargin = saleItems?.length ? saleItems.reduce((acc: number, curr: any) => acc + Number(curr.margin), 0) / saleItems.length : 0
  const totalSalesCount = salesData?.length || 0

  const lowStockCount = products?.filter(p => p.stock <= p.min_stock).length || 0

  // Recent items
  const { data: recentSales } = await supabase.from('sales').select('id, date, total_revenue, marketplaces(name)').order('created_at', { ascending: false }).limit(5)
  const { data: recentProducts } = await supabase.from('products').select('id, name, sku, stock, cost_purchase').order('created_at', { ascending: false }).limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Painel Principal</h2>
        <p className="text-muted-foreground">Visão geral da sua operação de vendas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Acumulado</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Lucro Líquido</CardTitle>
            <TrendingUp className={`h-4 w-4 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Margem média: {avgMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Vendas (Pedidos)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Pedidos registrados</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Estoque Baixo / Zeros</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Produtos precisando de atenção</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Vendas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales?.length === 0 && <p className="text-sm text-slate-500">Nenhuma venda encontrada.</p>}
              {recentSales?.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{sale.marketplaces?.name}</p>
                    <p className="text-xs text-slate-500">{format(new Date(sale.date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_revenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Produtos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts?.length === 0 && <p className="text-sm text-slate-500">Nenhum produto encontrado.</p>}
              {recentProducts?.map((prod: any) => (
                <div key={prod.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{prod.sku} - {prod.name}</p>
                    <p className="text-xs text-slate-500">Estoque: {prod.stock} un</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    Custo: R$ {Number(prod.cost_purchase).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
