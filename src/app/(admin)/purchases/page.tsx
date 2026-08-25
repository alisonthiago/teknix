import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
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
    <div className="mp-stack">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[#999]">Histórico de entrada de mercadorias.</p>
        <Link href="/purchases/new">
          <Button className="bg-[#1f2328] hover:bg-[#111827]">
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
                    <TableCell colSpan={6} className="text-center py-6 text-[#999]">
                      Nenhuma compra registrada.
                    </TableCell>
                  </TableRow>
                )}
                {purchases?.map((purchase) => {
                  const totalItems = purchase.purchase_items?.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0) || 0
                  
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-semibold">{purchase.suppliers?.name}</TableCell>
                      <TableCell>{purchase.invoice || '-'}</TableCell>
                      <TableCell>{totalItems} un</TableCell>
                      <TableCell className="font-medium text-[#666]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchase.total_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/purchases/${purchase.id}`}>
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
