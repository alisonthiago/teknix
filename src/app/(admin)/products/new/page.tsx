import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createProduct } from '../actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function NewProductPage() {
  const supabase = await createClient()
  // Fetch suppliers to populate the dropdown
  const { data: suppliers } = await supabase.from('suppliers').select('id, name').order('name')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Produto</h2>
          <p className="text-muted-foreground">Cadastre as informações básicas e custos.</p>
        </div>
        <Link href="/products">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form action={createProduct} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
            <CardDescription>Dados principais do produto.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" required placeholder="Ex: BVK-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input id="name" name="name" required placeholder="Ex: Parafusadeira X" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" name="brand" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" name="model" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ean">EAN / GTIN</Label>
                <Input id="ean" name="ean" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" name="category" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custos e Fornecedor</CardTitle>
            <CardDescription>Custo base e logística de compra.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Fornecedor</Label>
                <select 
                  id="supplier_id" 
                  name="supplier_id" 
                  className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_purchase">Custo de Compra (R$) *</Label>
                <Input id="cost_purchase" name="cost_purchase" type="number" step="0.01" min="0" required defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freight_purchase">Frete de Compra (R$)</Label>
                <Input id="freight_purchase" name="freight_purchase" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packaging_cost">Custo Embalagem (R$)</Label>
                <Input id="packaging_cost" name="packaging_cost" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_costs">Outros Custos (R$)</Label>
                <Input id="other_costs" name="other_costs" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logística e Estoque</CardTitle>
            <CardDescription>Dimensões e controle de quantidade.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input id="weight" name="weight" type="number" step="0.01" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Largura (cm)</Label>
                <Input id="width" name="width" type="number" step="0.01" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input id="height" name="height" type="number" step="0.01" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Comprimento (cm)</Label>
                <Input id="length" name="length" type="number" step="0.01" min="0" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_stock">Estoque Mínimo</Label>
                <Input id="min_stock" name="min_stock" type="number" min="0" defaultValue="0" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/products">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Salvar Produto
          </Button>
        </div>
      </form>
    </div>
  )
}
