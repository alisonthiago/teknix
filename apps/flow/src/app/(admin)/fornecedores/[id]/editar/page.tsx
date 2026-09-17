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
    <div className="max-w-3xl mx-auto px-3 sm:px-0 pb-44 sm:pb-48">
      {/* Header Topo */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">Editar Fornecedor</h2>
          <p className="text-xs text-[#888888]">Informações cadastrais, logística e contatos</p>
        </div>
        <Link href={`/fornecedores/${id}`}>
          <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold rounded-xl">
            Cancelar
          </Button>
        </Link>
      </div>

      <form action={updateSupplier.bind(null, id)} className="space-y-4">
        {/* Card 1: Dados Principais */}
        <Card className="rounded-2xl border border-[#e6e6e6] shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-[#f1f5f9] bg-[#fafafa]">
            <CardTitle className="text-sm font-bold text-[#111111]">Dados Cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="pb-4 border-b border-[#f1f5f9]">
              <SupplierLogoEditor supplierId={id} currentLogoUrl={supplier.logo_url || null} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-[#374151]">Nome Fantasia *</Label>
                <Input id="name" name="name" required defaultValue={supplier.name} placeholder="Nome do fornecedor" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legal_name" className="text-xs font-semibold text-[#374151]">Razão Social</Label>
                <Input id="legal_name" name="legal_name" defaultValue={supplier.legal_name || ''} placeholder="Razão social" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="text-xs font-semibold text-[#374151]">CNPJ *</Label>
                <CnpjAutoFillInput defaultValue={supplier.cnpj || ''} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#374151]">E-mail</Label>
                <Input id="email" name="email" type="email" defaultValue={supplier.email || ''} placeholder="contato@empresa.com" className="h-9 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold text-[#374151]">Cidade</Label>
                  <Input id="city" name="city" defaultValue={supplier.city || ''} placeholder="Cidade" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold text-[#374151]">UF</Label>
                  <Input id="state" name="state" defaultValue={supplier.state || ''} placeholder="SP" maxLength={2} className="h-9 text-xs" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Localização & Condições */}
        <Card className="rounded-2xl border border-[#e6e6e6] shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-[#f1f5f9] bg-[#fafafa]">
            <CardTitle className="text-sm font-bold text-[#111111]">Logística & Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="distributor_city" className="text-xs font-semibold text-[#374151]">Cidade (Distribuidor)</Label>
                <Input id="distributor_city" name="distributor_city" defaultValue={supplier.distributor_city || ''} placeholder="São Paulo" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="distributor_state" className="text-xs font-semibold text-[#374151]">UF (Distribuidor)</Label>
                <Input id="distributor_state" name="distributor_state" defaultValue={supplier.distributor_state || ''} placeholder="SP" maxLength={2} className="h-9 text-xs" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pickup_address" className="text-xs font-semibold text-[#374151]">Endereço de Retirada</Label>
              <Input id="pickup_address" name="pickup_address" defaultValue={supplier.pickup_address || ''} placeholder="Rua, número, bairro..." className="h-9 text-xs" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f1f5f9]">
              <div className="space-y-1.5">
                <Label htmlFor="delivery_time" className="text-[11px] font-semibold text-[#374151] truncate block" title="Prazo Entrega (dias)">Prazo (dias)</Label>
                <Input id="delivery_time" name="delivery_time" type="number" min="0" defaultValue={supplier.delivery_time || 0} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min_order" className="text-[11px] font-semibold text-[#374151] truncate block" title="Pedido Mínimo (R$)">Mínimo (R$)</Label>
                <Input id="min_order" name="min_order" type="number" step="0.01" min="0" defaultValue={supplier.min_order || 0} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="freight" className="text-[11px] font-semibold text-[#374151] truncate block" title="Custo Frete (R$)">Frete (R$)</Label>
                <Input id="freight" name="freight" type="number" step="0.01" min="0" defaultValue={supplier.freight || 0} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="payment_terms" className="text-xs font-semibold text-[#374151]">Condições Pagamento</Label>
                <Input id="payment_terms" name="payment_terms" defaultValue={supplier.payment_terms || ''} placeholder="Ex: 30 dias, À vista..." className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pix_key" className="text-xs font-semibold text-[#374151]">Chave PIX</Label>
                <Input id="pix_key" name="pix_key" defaultValue={supplier.pix_key || ''} placeholder="CNPJ, Celular ou Chave aleatória" className="h-9 text-xs font-mono text-[#16a34a]" />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="notes" className="text-xs font-semibold text-[#374151]">Observações Internas</Label>
              <Input id="notes" name="notes" placeholder="Restrições, regras ou notas gerais" defaultValue={supplier.notes || ''} className="h-9 text-xs" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Contatos */}
        <Card className="rounded-2xl border border-[#e6e6e6] shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-[#f1f5f9] bg-[#fafafa]">
            <CardTitle className="text-sm font-bold text-[#111111]">Contatos & Telefones</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <SupplierContactsEditor supplierId={id} />
          </CardContent>
        </Card>

        {/* Card 4: Catálogos */}
        <Card className="rounded-2xl border border-[#e6e6e6] shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-[#f1f5f9] bg-[#fafafa]">
            <CardTitle className="text-sm font-bold text-[#111111]">Catálogos e Tabelas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <SupplierCatalogsEditor supplierId={id} />
          </CardContent>
        </Card>

        {/* Espaço de respiro extra na base para que o conteúdo role livremente acima da barra fixa */}
        <div className="h-12 sm:h-16 w-full" aria-hidden="true" />

        {/* Barra de Ações Fixa no Rodapé (Celular e Desktop) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2e8f0] shadow-lg px-4 py-3 sm:py-3.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between sm:justify-end gap-3">
            <Link href={`/fornecedores/${id}`} className="flex-1 sm:flex-initial">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-10 px-5 text-xs font-semibold rounded-xl border-[#e2e8f0] hover:bg-[#f8fafc]">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="flex-1 sm:flex-initial h-10 px-6 text-xs font-bold rounded-xl bg-[#0071e3] hover:bg-[#0062c4] text-white border border-[#0071e3] shadow-xs cursor-pointer">
              Salvar Alterações
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
