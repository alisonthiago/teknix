import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MarketplacesPage() {
  const supabase = await createClient()
  const { data: marketplaces, error } = await supabase
    .from('marketplaces')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplaces</h2>
          <p className="text-muted-foreground">Gerencie canais de venda e suas taxas padrão.</p>
        </div>
        <Link href="/marketplaces/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Canal
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canais de Venda Cadastrados</CardTitle>
          <CardDescription>As taxas padrão são usadas no simulador caso o produto não tenha taxa específica.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Erro ao carregar marketplaces.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Taxa (%)</TableHead>
                  <TableHead className="text-right">Taxa Fixa (R$)</TableHead>
                  <TableHead className="text-right">Imposto (%)</TableHead>
                  <TableHead className="text-right">Frete Padrão (R$)</TableHead>
                  <TableHead className="text-right">Publicidade (%)</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketplaces?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Nenhum canal de venda cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {marketplaces?.map((mp) => (
                  <TableRow key={mp.id}>
                    <TableCell className="font-semibold">{mp.name}</TableCell>
                    <TableCell className="text-right">{Number(mp.default_percentage_fee).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">R$ {Number(mp.default_fixed_fee).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(mp.default_tax).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">R$ {Number(mp.default_freight).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(mp.default_ads_fee).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{mp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
