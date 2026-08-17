import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      suppliers ( name )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">Catálogo de produtos da sua operação.</p>
        </div>
        <Link href="/products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Produto
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Erro ao carregar produtos. O banco de dados está configurado?</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Custo Base</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Nenhum produto cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {products?.map((product) => {
                  const totalCost = Number(product.cost_purchase) + Number(product.freight_purchase) + Number(product.packaging_cost) + Number(product.other_costs)
                  const isLowStock = product.stock <= product.min_stock
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-slate-500">{product.sku}</TableCell>
                      <TableCell className="font-semibold">{product.name}</TableCell>
                      <TableCell className="text-slate-500">{product.suppliers?.name || '-'}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
                          {product.stock} un
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'ACTIVE' ? 'default' : 'outline'}>
                          {product.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Editar</Button>
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
