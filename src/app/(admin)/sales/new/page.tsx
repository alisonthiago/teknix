import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createSale } from '../actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function NewSalePage() {
  const supabase = await createClient()
  const { data: marketplaces } = await supabase.from('marketplaces').select('id, name').order('name')
  const { data: products } = await supabase.from('products').select('id, name, sku, stock').order('name')

  return (
    <div className="mp-stack max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registrar Venda</h2>
          <p className="text-[#999]">Registre uma saída e calcule a rentabilidade real da operação.</p>
        </div>
        <Link href="/sales">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form action={createSale} className="mp-stack">
        <Card>
          <CardHeader>
            <CardTitle>Dados Gerais da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marketplace_id">Canal de Venda *</Label>
                <select 
                  id="marketplace_id" 
                  name="marketplace_id" 
                  required
                  className="flex h-9 w-full items-center justify-between rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-[#999] focus:outline-none focus:ring-1 focus:ring-[#3483fa] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um canal</option>
                  {marketplaces?.map(mp => (
                    <option key={mp.id} value={mp.id}>{mp.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data da Venda *</Label>
                <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_id">Nº do Pedido</Label>
                <Input id="order_id" name="order_id" placeholder="Ex: MLB123456" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Vendido e Valores</CardTitle>
            <CardDescription>Insira o produto e os custos cobrados nesta venda.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">Produto Vendido *</Label>
                <select 
                  id="product_id" 
                  name="product_id" 
                  required
                  className="flex h-9 w-full items-center justify-between rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-[#999] focus:outline-none focus:ring-1 focus:ring-[#3483fa] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um produto</option>
                  {products?.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name} (Estoque: {product.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input id="quantity" name="quantity" type="number" min="1" required defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Preço de Venda Unitário (R$) *</Label>
                <Input id="unit_price" name="unit_price" type="number" step="0.01" min="0" required defaultValue="0" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#e6e6e6]">
              <div className="space-y-2">
                <Label htmlFor="fees">Comissão do Canal (R$)</Label>
                <Input id="fees" name="fees" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxes">Imposto NF (R$)</Label>
                <Input id="taxes" name="taxes" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freight">Frete Pago (R$)</Label>
                <Input id="freight" name="freight" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_costs">Publicidade / Outros (R$)</Label>
                <Input id="other_costs" name="other_costs" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button type="submit" className="bg-[#3483fa] hover:bg-[#2968c8]">
                Registrar Venda e Abater Estoque
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
