'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SupplierModal from '@/components/SupplierModal'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function SuppliersClient({ suppliers }: { suppliers: { id: string, name: string, cnpj?: string, contact?: string, whatsapp?: string, city?: string, state?: string }[] }) {
  const router = useRouter()
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<string | undefined>()
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<{ id: string, name: string } | null>(null)

  const handleOpenNew = () => {
    setEditingSupplierId(undefined)
    setIsSupplierModalOpen(true)
  }

  const handleOpenEdit = (id: string) => {
    setEditingSupplierId(id)
    setIsSupplierModalOpen(true)
  }

  const handleOpenDelete = (supplier: { id: string; name: string }) => {
    setSupplierToDelete({ id: supplier.id, name: supplier.name })
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!supplierToDelete) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('suppliers').delete().eq('id', supplierToDelete.id)
      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error deleting supplier:', err)
      alert('Erro ao excluir fornecedor.')
    } finally {
      setShowDeleteModal(false)
      setSupplierToDelete(null)
    }
  }

  const handleBlock = (supplierName: string) => {
    alert(`O bloqueio do fornecedor ${supplierName} será implementado em breve.`)
  }

  return (
    <div className="mp-stack">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[#999]">Gerencie os fornecedores da sua operação.</p>
        <Button onClick={handleOpenNew} className="bg-[#3483fa] hover:bg-[#2968c8]">
          <Plus className="w-4 h-4 mr-2" /> Novo Fornecedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(supplier.id)}>
                      Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1.5 rounded-md border border-[#e6e6e6] text-[#999] hover:bg-[#f5f5f5] transition-colors focus:outline-none">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleBlock(supplier.name)} className="cursor-pointer">
                          Bloquear fornecedor
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-[#e74c3c] focus:text-[#e74c3c] focus:bg-[#fff5f5] cursor-pointer"
                          onClick={() => handleOpenDelete(supplier)}
                        >
                          Excluir fornecedor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SupplierModal 
        isOpen={isSupplierModalOpen} 
        onClose={() => setIsSupplierModalOpen(false)} 
        supplierId={editingSupplierId} 
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={supplierToDelete?.name}
      />
    </div>
  )
}
