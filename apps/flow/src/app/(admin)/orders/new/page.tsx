import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createOrder } from '../actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function NewOrderPage() {
  const supabase = await createClient()
  const { data: marketplaces } = await supabase.from('marketplaces').select('id, name').order('name')
  const { data: products } = await supabase.from('products').select('id, name, sku').order('name')

  return (
    <div className="mp-stack max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Pedido</h2>
          <p className="text-[#999]">Registre um pedido manualmente na operação.</p>
        </div>
        <Link href="/orders">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form action={createOrder} className="mp-stack">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Pedido</CardTitle>
            <CardDescription>Informe os dados básicos do pedido.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_number">Número do Pedido *</Label>
                <Input id="order_number" name="order_number" required placeholder="Ex: ML123456" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketplace_id">Marketplace</Label>
                <select
                  id="marketplace_id"
                  name="marketplace_id"
                  className="flex h-9 w-full items-center justify-between rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-[#999] focus:outline-none focus:ring-1 focus:ring-[#1f2328]"
                >
                  <option value="">Selecione um marketplace</option>
                  {marketplaces?.map(mp => (
                    <option key={mp.id} value={mp.id}>{mp.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name">Nome do Cliente</Label>
                <Input id="customer_name" name="customer_name" placeholder="Nome do comprador" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
            <CardDescription>Adicione os produtos deste pedido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {products?.length === 0 && (
              <p className="text-sm text-[#999]">Nenhum produto cadastrado.</p>
            )}
            {products && products.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">Produto *</Label>
                  <select
                    id="product_id"
                    name="product_id"
                    required
                    className="flex h-9 w-full items-center justify-between rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-[#999] focus:outline-none focus:ring-1 focus:ring-[#1f2328]"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.sku} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" required defaultValue="1" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-[#1f2328] hover:bg-[#111827]">
            Criar Pedido
          </Button>
        </div>
      </form>
    </div>
  )
}
