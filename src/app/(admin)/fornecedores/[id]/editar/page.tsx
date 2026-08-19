import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateSupplier } from '@/app/(admin)/suppliers/actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" name="cnpj" defaultValue={supplier.cnpj || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Pessoa de Contato</Label>
                <Input id="contact" name="contact" defaultValue={supplier.contact || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" defaultValue={supplier.phone || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" defaultValue={supplier.whatsapp || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" defaultValue={supplier.email || ''} placeholder="exemplo@dominio.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" name="city" defaultValue={supplier.city || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input id="state" name="state" maxLength={2} defaultValue={supplier.state || ''} />
              </div>
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

            <div className="space-y-2 pt-2">
              <Label htmlFor="payment_terms">Condições de Pagamento</Label>
              <Input id="payment_terms" name="payment_terms" defaultValue={supplier.payment_terms || ''} placeholder="Ex: 30 dias, PIX, etc." />
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" name="notes" placeholder="Restrições, observações, etc." defaultValue={supplier.notes || ''} />
            </div>
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
