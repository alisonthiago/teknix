import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fornecedores</h2>
          <p className="text-muted-foreground">Gerencie os fornecedores da sua operação.</p>
        </div>
        <Link href="/suppliers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Fornecedor
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Erro ao carregar fornecedores. O banco de dados está configurado?</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Nenhum fornecedor cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {suppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.cnpj || '-'}</TableCell>
                    <TableCell>{supplier.contact || '-'}</TableCell>
                    <TableCell>{supplier.whatsapp || '-'}</TableCell>
                    <TableCell>{supplier.city ? `${supplier.city}/${supplier.state}` : '-'}</TableCell>
                    <TableCell className="text-right">
                      {/* TODO: Add actions like Edit/Delete */}
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
