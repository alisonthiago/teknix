import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react'

export const metadata = {
  title: 'Relatórios | TEKNIX',
}

export default async function ReportsPage() {
  const supabase = await createClient()

  // Sales data
  const { data: sales } = await supabase
    .from('sales')
    .select('*, marketplaces(name, code)')
    .order('date', { ascending: false })

  const { data: saleItems } = await supabase.from('sale_items').select('*, products(name, category)')
  const { data: products } = await supabase.from('products').select('*')
  const { data: purchases } = await supabase.from('purchases').select('*, suppliers(name)')

  // --- Overview ---
  const totalRevenue = sales?.reduce((acc: number, s: { total_revenue?: number }) => acc + Number(s.total_revenue || 0), 0) || 0
  const totalProfit = saleItems?.reduce((acc: number, s: { profit?: number }) => acc + Number(s.profit || 0), 0) || 0
  const totalPurchases = purchases?.reduce((acc: number, p: { total_cost?: number }) => acc + Number(p.total_cost || 0), 0) || 0
  const totalProductCount = products?.length || 0
  const lowStockProducts = products?.filter((p: { stock: number; min_stock: number }) => p.stock <= p.min_stock) || []

  // --- Top Products by Revenue ---
  const productRevenue: Record<string, { name: string; revenue: number; quantity: number; profit: number }> = {}
  saleItems?.forEach((item: { products?: { name?: string }; sale_price?: number; quantity?: number; profit?: number }) => {
    const name = item.products?.name || 'Desconhecido'
    if (!productRevenue[name]) productRevenue[name] = { name, revenue: 0, quantity: 0, profit: 0 }
    productRevenue[name].revenue += Number(item.sale_price || 0) * Number(item.quantity || 0)
    productRevenue[name].quantity += Number(item.quantity || 0)
    productRevenue[name].profit += Number(item.profit || 0)
  })
  const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  // --- Sales by Marketplace ---
  const mpRevenue: Record<string, { name: string; revenue: number; count: number; profit: number }> = {}
  sales?.forEach((sale: { total_revenue?: number; profit?: number; marketplaces?: { name?: string } }) => {
    const name = sale.marketplaces?.name || 'Desconhecido'
    if (!mpRevenue[name]) mpRevenue[name] = { name, revenue: 0, count: 0, profit: 0 }
    mpRevenue[name].revenue += Number(sale.total_revenue || 0)
    mpRevenue[name].count += 1
  })
  saleItems?.forEach((item: { profit?: number }) => {
    // Accumulate profit globally
  })
  const marketplaceRanking = Object.values(mpRevenue).sort((a, b) => b.revenue - a.revenue)

  // --- Purchases by Supplier ---
  const supplierCost: Record<string, { name: string; total: number; count: number }> = {}
  purchases?.forEach((p: { total_cost?: number; suppliers?: { name?: string } }) => {
    const name = p.suppliers?.name || 'Desconhecido'
    if (!supplierCost[name]) supplierCost[name] = { name, total: 0, count: 0 }
    supplierCost[name].total += Number(p.total_cost || 0)
    supplierCost[name].count += 1
  })
  const supplierRanking = Object.values(supplierCost).sort((a, b) => b.total - a.total)

  // --- Low Stock Products ---
  const lowStock = products
    ?.filter((p: { stock: number; min_stock: number }) => p.stock <= p.min_stock)
    .sort((a: { stock: number }, b: { stock: number }) => a.stock - b.stock)
    .slice(0, 15) || []

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="mp-stack">
      <p className="text-sm text-[#999]">Visão consolidada do seu negócio.</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 text-[#3483fa] mx-auto mb-2" />
            <p className="text-xs text-[#999]">Faturamento</p>
            <p className="text-base sm:text-lg font-bold text-[#333]">{fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-[#999]">Lucro Líquido</p>
            <p className={`text-base sm:text-lg font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(totalProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-5 h-5 text-orange-600 mx-auto mb-2" />
            <p className="text-xs text-[#999]">Total Compras</p>
            <p className="text-base sm:text-lg font-bold text-[#333]">{fmt(totalPurchases)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-[#999]">Margem Média</p>
            <p className="text-base sm:text-lg font-bold text-[#333]">
              {saleItems?.length ? (saleItems.reduce((a: number, s: { margin?: number }) => a + Number(s.margin || 0), 0) / saleItems.length).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 text-red-600 mx-auto mb-2" />
            <p className="text-xs text-[#999]">Estoque Baixo</p>
            <p className="text-base sm:text-lg font-bold text-red-600">{lowStockProducts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Produtos por Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#999] text-center py-4">Nenhum dado de vendas disponível.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd Vendida</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p, i) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-bold text-[#999]">{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(p.revenue)}</TableCell>
                    <TableCell className={`text-right font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(p.profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Marketplace Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendas por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {marketplaceRanking.length === 0 ? (
              <p className="text-sm text-[#999] text-center py-4">Nenhum dado.</p>
            ) : (
              <div className="space-y-3">
                {marketplaceRanking.map((mp) => {
                  const pct = totalRevenue > 0 ? (mp.revenue / totalRevenue * 100) : 0
                  return (
                    <div key={mp.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{mp.name}</span>
                        <span className="text-[#999] text-xs sm:text-sm text-right shrink-0 ml-2">{mp.count} vendas — {fmt(mp.revenue)}</span>
                      </div>
                      <div className="w-full bg-[#f5f5f5] rounded-full h-2">
                        <div className="bg-[#3483fa] h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compras por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            {supplierRanking.length === 0 ? (
              <p className="text-sm text-[#999] text-center py-4">Nenhum dado.</p>
            ) : (
              <div className="space-y-3">
                {supplierRanking.map((s) => {
                  const pct = totalPurchases > 0 ? (s.total / totalPurchases * 100) : 0
                  return (
                    <div key={s.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-[#999] text-xs sm:text-sm text-right shrink-0 ml-2">{s.count} compras — {fmt(s.total)}</span>
                      </div>
                      <div className="w-full bg-[#f5f5f5] rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-red-500" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Déficit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((p: { id: string; name: string; stock: number; min_stock: number }) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">{p.stock}</TableCell>
                    <TableCell className="text-right text-[#999]">{p.min_stock}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">-{p.min_stock - p.stock}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
