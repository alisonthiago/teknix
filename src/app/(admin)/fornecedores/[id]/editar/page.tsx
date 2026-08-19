import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateSupplier } from '@/app/(admin)/suppliers/actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SupplierLogoEditor from '@/components/SupplierLogoEditor'
import SupplierCatalogsEditor from '@/components/SupplierCatalogsEditor'
import SupplierContactsEditor from '@/components/SupplierContactsEditor'
import CnpjAutoFillInput from '@/components/CnpjAutoFillInput'

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: supplier } = await supabase.from('suppliers').select('*').eq('id', id).single()

  if (!supplier) {
    notFound()
  }

  return (
    <div className="mp-stack max-w-3xl mx-auto px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#333]">Editar Fornecedor</h2>
          <p className="text-[#999]">Atualize as informações de contato e pagamento.</p>
        </div>
        <Link href={`/fornecedores/${id}`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form action={updateSupplier.bind(null, id)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Fornecedor</CardTitle>
            <CardDescription>Preencha as informações básicas para contato e faturamento.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 pb-6 border-b border-[#f0f0f0]">
              <SupplierLogoEditor supplierId={id} currentLogoUrl={supplier.logo_url || null} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Fantasia *</Label>
                <Input id="name" name="name" required defaultValue={supplier.name} placeholder="Ex: Loja Principal, Loja Eletrônicos..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razão Social</Label>
                <Input id="legal_name" name="legal_name" defaultValue={supplier.legal_name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <CnpjAutoFillInput defaultValue={supplier.cnpj || ''} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" defaultValue={supplier.email || ''} placeholder="exemplo@dominio.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade (Receita)</Label>
                  <Input id="city" name="city" defaultValue={supplier.city || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Input id="state" name="state" defaultValue={supplier.state || ''} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localização & Logística</CardTitle>
            <CardDescription>Informações sobre o distribuidor e retirada de mercadorias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distributor_city">Cidade (Distribuidor)</Label>
                <Input id="distributor_city" name="distributor_city" defaultValue={supplier.distributor_city || ''} placeholder="Ex: São Paulo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distributor_state">Estado (Distribuidor)</Label>
                <Input id="distributor_state" name="distributor_state" defaultValue={supplier.distributor_state || ''} placeholder="Ex: SP" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup_address">Endereço de Retirada / Coleta</Label>
              <Input id="pickup_address" name="pickup_address" defaultValue={supplier.pickup_address || ''} placeholder="Ex: Rua das Flores, 123 - Galpão 2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#f0f0f0]">
              <div className="space-y-2">
                <Label htmlFor="delivery_time">Prazo Médio de Entrega (dias)</Label>
                <Input id="delivery_time" name="delivery_time" type="number" min="0" defaultValue={supplier.delivery_time || 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_order">Pedido Mínimo (R$)</Label>
                <Input id="min_order" name="min_order" type="number" step="0.01" min="0" defaultValue={supplier.min_order || 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freight">Custo Médio Frete (R$)</Label>
                <Input id="freight" name="freight" type="number" step="0.01" min="0" defaultValue={supplier.freight || 0} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                <Input id="payment_terms" name="payment_terms" defaultValue={supplier.payment_terms || ''} placeholder="Ex: 30 dias, PIX, etc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX (Pagamento)</Label>
                <Input id="pix_key" name="pix_key" defaultValue={supplier.pix_key || ''} placeholder="Ex: CNPJ, Email ou Celular" className="text-[#38a169]" />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" name="notes" placeholder="Restrições, observações, etc." defaultValue={supplier.notes || ''} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatos</CardTitle>
            <CardDescription>Gerencie telefones e contatos de WhatsApp deste fornecedor.</CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierContactsEditor supplierId={id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catálogos</CardTitle>
            <CardDescription>Gerencie catálogos em PDF ou links externos (Google Drive, Site, etc).</CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierCatalogsEditor supplierId={id} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-[#3483fa] hover:bg-[#2968c8]">
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
