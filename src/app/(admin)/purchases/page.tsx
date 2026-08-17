// @ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default async function PurchasesPage() {
  const supabase = await createClient()
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers ( name ),
      purchase_items ( quantity, total_cost )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Compras</h2>
          <p className="text-muted-foreground">Histórico de entrada de mercadorias.</p>
        </div>
        <Link href="/purchases/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Nova Compra
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Compras</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Erro ao carregar compras.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead>Itens (Qtd)</TableHead>
                  <TableHead>Custo Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Nenhuma compra registrada.
                    </TableCell>
                  </TableRow>
                )}
                {purchases?.map((purchase) => {
                  const totalItems = purchase.purchase_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0
                  
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-semibold">{purchase.suppliers?.name}</TableCell>
                      <TableCell>{purchase.invoice || '-'}</TableCell>
                      <TableCell>{totalItems} un</TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchase.total_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Ver Detalhes</Button>
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
