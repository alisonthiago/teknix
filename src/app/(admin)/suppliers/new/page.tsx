import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createSupplier } from '../actions'
import Link from 'next/link'

export default function NewSupplierPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Fornecedor</h2>
          <p className="text-muted-foreground">Cadastre um novo fornecedor no sistema.</p>
        </div>
        <Link href="/suppliers">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Fornecedor</CardTitle>
          <CardDescription>Preencha as informações básicas para contato e faturamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSupplier} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Fantasia *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razão Social</Label>
                <Input id="legal_name" name="legal_name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" name="cnpj" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Pessoa de Contato</Label>
                <Input id="contact" name="contact" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" name="city" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input id="state" name="state" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_time">Prazo Médio de Entrega (dias)</Label>
                <Input id="delivery_time" name="delivery_time" type="number" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_order">Pedido Mínimo (R$)</Label>
                <Input id="min_order" name="min_order" type="number" step="0.01" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freight">Custo Médio Frete (R$)</Label>
                <Input id="freight" name="freight" type="number" step="0.01" min="0" />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" name="notes" placeholder="Condições de pagamento, restrições, etc." />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Salvar Fornecedor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
