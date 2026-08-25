import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: purchase } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers ( name, cnpj, phone, email ),
      purchase_items ( *, products ( name, sku ) )
    `)
    .eq('id', id)
    .single()

  if (!purchase) notFound()

  const totalItems = purchase.purchase_items?.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0) || 0

  return (
    <div className="mp-stack">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link href="/purchases">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Compra #{purchase.invoice || purchase.id.slice(0, 8)}</h2>
          <p className="text-[#999] text-sm">{format(new Date(purchase.date), 'dd/MM/yyyy')} — {purchase.suppliers?.name}</p>
        </div>
        <Badge variant="outline" className="ml-auto">{purchase.status}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Custo Total</p>
            <p className="text-xl font-bold text-[#333]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchase.total_cost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Total Itens</p>
            <p className="text-xl font-bold text-[#333]">{totalItems} un</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#999] mb-1">Custo Médio/Un</p>
            <p className="text-xl font-bold text-[#333]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalItems > 0 ? purchase.total_cost / totalItems : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {purchase.suppliers && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#999] mb-2">Fornecedor</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><span className="text-[#999] text-xs">Nome:</span> <span className="font-medium">{purchase.suppliers.name}</span></div>
              {purchase.suppliers.cnpj && <div><span className="text-[#999] text-xs">CNPJ:</span> <span className="font-medium">{purchase.suppliers.cnpj}</span></div>}
              {purchase.suppliers.phone && <div><span className="text-[#999] text-xs">Tel:</span> <span className="font-medium">{purchase.suppliers.phone}</span></div>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Itens da Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.purchase_items?.map((item: { id: string; products?: { name?: string; sku?: string }; quantity: number; unit_cost: number }) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.products?.name || '-'}</TableCell>
                  <TableCell className="text-[#999]">{item.products?.sku || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_cost)}</TableCell>
                  <TableCell className="text-right font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_cost * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {purchase.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#999] mb-1">Observações</p>
            <p className="text-sm">{purchase.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
