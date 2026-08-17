import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createPurchase } from '../actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function NewPurchasePage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase.from('suppliers').select('id, name').order('name')
  const { data: products } = await supabase.from('products').select('id, name, sku').order('name')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nova Compra</h2>
          <p className="text-muted-foreground">Registre a entrada de mercadorias no estoque.</p>
        </div>
        <Link href="/purchases">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form action={createPurchase} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Gerais da Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Fornecedor *</Label>
                <select 
                  id="supplier_id" 
                  name="supplier_id" 
                  required
                  className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data da Compra *</Label>
                <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice">Nota Fiscal</Label>
                <Input id="invoice" name="invoice" placeholder="Número da NF" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                <Input id="payment_method" name="payment_method" placeholder="Boleto, Pix, etc." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Comprado (Entrada Rápida)</CardTitle>
            <CardDescription>Para fins de protótipo, insira 1 produto por formulário.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">Produto *</Label>
                <select 
                  id="product_id" 
                  name="product_id" 
                  required
                  className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um produto</option>
                  {products?.map(product => (
                    <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade Comprada *</Label>
                <Input id="quantity" name="quantity" type="number" min="1" required defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_cost">Custo Unitário (R$) *</Label>
                <Input id="unit_cost" name="unit_cost" type="number" step="0.01" min="0" required defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freight">Frete Total do Item (R$)</Label>
                <Input id="freight" name="freight" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_costs">Outros Custos (R$)</Label>
                <Input id="other_costs" name="other_costs" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" name="notes" placeholder="" />
            </div>

            <div className="pt-6 flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Registrar Compra e Estoque
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
