import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateProduct } from '@/app/(admin)/products/actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch product data
  const { data: product } = await supabase.from('products').select('*').eq('id', id).single()
  
  if (!product) {
    notFound()
  }

  // Fetch suppliers to populate the dropdown
  const { data: suppliers } = await supabase.from('suppliers').select('id, name').order('name')

  return (
    <div className="mp-stack max-w-4xl mx-auto px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#333]">Editar Produto</h2>
          <p className="text-[#999]">Atualize as informações básicas e custos.</p>
        </div>
        <Link href={`/produtos/${id}`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form action={updateProduct.bind(null, id)} className="mp-stack">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
            <CardDescription>Dados principais do produto.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" required defaultValue={product.sku} placeholder="Ex: BVK-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input id="name" name="name" required defaultValue={product.name} placeholder="Ex: Parafusadeira X" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" name="brand" defaultValue={product.brand || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" name="model" defaultValue={product.model || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ean">EAN / GTIN</Label>
                <Input id="ean" name="ean" defaultValue={product.ean || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" name="category" defaultValue={product.category || ''} />
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
                  defaultValue={product.supplier_id || ''}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-[#e6e6e6] bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-[#999] focus:outline-none focus:ring-1 focus:ring-[#3483fa] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_purchase">Custo de Compra (R$) *</Label>
                <Input id="cost_purchase" name="cost_purchase" type="number" step="0.01" min="0" required defaultValue={product.cost_purchase || 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freight_purchase">Frete de Compra (R$)</Label>
                <Input id="freight_purchase" name="freight_purchase" type="number" step="0.01" min="0" defaultValue={product.freight_purchase || 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packaging_cost">Custo Embalagem (R$)</Label>
                <Input id="packaging_cost" name="packaging_cost" type="number" step="0.01" min="0" defaultValue={product.packaging_cost || 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_costs">Outros Custos (R$)</Label>
                <Input id="other_costs" name="other_costs" type="number" step="0.01" min="0" defaultValue={product.other_costs || 0} />
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
                <Input id="weight" name="weight" type="number" step="0.01" min="0" defaultValue={product.weight || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Largura (cm)</Label>
                <Input id="width" name="width" type="number" step="0.01" min="0" defaultValue={product.width || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input id="height" name="height" type="number" step="0.01" min="0" defaultValue={product.height || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Comprimento (cm)</Label>
                <Input id="length" name="length" type="number" step="0.01" min="0" defaultValue={product.length || ''} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_stock">Estoque Mínimo</Label>
                <Input id="min_stock" name="min_stock" type="number" min="0" defaultValue={product.min_stock || 0} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/produtos/${id}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" className="bg-[#3483fa] hover:bg-[#2968c8]">
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
