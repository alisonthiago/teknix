import { createClient } from '@/utils/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function StockPage() {
  const supabase = await createClient()
  const userPerms = await getUserPermissions()

  if (!userPerms) return null

  const canViewCost = userPerms.permissions.has('cost.view')

  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name, stock, min_stock, status, cost_purchase')
    .order('name')

  const lowStock = products?.filter(p => p.stock <= p.min_stock) || []
  const normalStock = products?.filter(p => p.stock > p.min_stock) || []

  return (
    <div className="mp-stack">
      <p className="text-sm text-[#999]">Visualize e gerencie o estoque dos seus produtos.</p>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#999] font-medium">Total Itens</p>
              <div className="p-2 bg-[#f5f5f5] rounded-full">
                <Package className="h-5 w-5 text-[#1f2328]" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#333]">{products?.length || 0}</h3>
            <p className="text-sm text-[#999] mt-2">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#999] font-medium">Estoque Total</p>
              <div className="p-2 bg-[#f5f5f5] rounded-full">
                <Package className="h-5 w-5 text-[#1f2328]" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#333]">
              {products?.reduce((acc, p) => acc + p.stock, 0) || 0}
            </h3>
            <p className="text-sm text-[#999] mt-2">Unidades em estoque</p>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#999] font-medium">Estoque Cr\u00edtico</p>
              <div className="p-2 bg-red-50 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-red-600">{lowStock.length}</h3>
            <p className="text-sm text-[#999] mt-2">Abaixo do m\u00ednimo</p>
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className=" border-red-100 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Estoque Cr\u00edtico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">M\u00ednimo</TableHead>
                  <TableHead className="text-center">Diferen\u00e7a</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                    <TableCell>
                      <Link href={`/products/${p.id}`} className="text-[#1f2328] hover:underline">{p.name}</Link>
                    </TableCell>
                    <TableCell className="text-center font-bold text-red-600">{p.stock}</TableCell>
                    <TableCell className="text-center">{p.min_stock}</TableCell>
                    <TableCell className="text-center text-red-600 font-medium">
                      {p.stock - p.min_stock}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="">
        <CardHeader>
          <CardTitle>Todos os Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-center">M\u00ednimo</TableHead>
                <TableHead>Status</TableHead>
                {canViewCost && <TableHead className="text-right">Custo Unit.</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products?.length && (
                <TableRow>
                  <TableCell colSpan={canViewCost ? 6 : 5} className="text-center py-8 text-[#999]">
                    Nenhum produto cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {normalStock.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                  <TableCell>
                    <Link href={`/products/${p.id}`} className="text-[#1f2328] hover:underline">{p.name}</Link>
                  </TableCell>
                  <TableCell className="text-center font-medium">{p.stock}</TableCell>
                  <TableCell className="text-center">{p.min_stock}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-[#e6f9ef] text-[#00a650] border-[#b8e6d0]">
                      Normal
                    </Badge>
                  </TableCell>
                  {canViewCost && (
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.cost_purchase || 0)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
