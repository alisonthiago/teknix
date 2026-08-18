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
    <div className="mp-stack">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[#999]">Gerencie os fornecedores da sua operação.</p>
        <Link href="/suppliers/new">
          <Button className="bg-[#3483fa] hover:bg-[#2968c8]">
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
                    <TableCell colSpan={6} className="text-center py-6 text-[#999]">
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
