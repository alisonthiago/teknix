import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createMarketplace } from '../actions'
import Link from 'next/link'

export default function NewMarketplacePage() {
  return (
    <div className="mp-stack max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Canal de Venda</h2>
          <p className="text-[#999]">Cadastre as taxas padrão de um marketplace.</p>
        </div>
        <Link href="/marketplaces">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form action={createMarketplace} className="mp-stack">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome (Ex: Mercado Livre) *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código Interno *</Label>
                <Input id="code" name="code" required placeholder="Ex: MELI" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxas Padrão</CardTitle>
            <CardDescription>
              Essas taxas serão sugeridas nos cálculos se não houver taxa específica no produto. 
              Lembre-se: Use decimais para dinheiro (Ex: 5.50) e porcentagem em números inteiros (Ex: 16 para 16%).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_percentage_fee">Comissão (%)</Label>
                <Input id="default_percentage_fee" name="default_percentage_fee" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_fixed_fee">Taxa Fixa (R$)</Label>
                <Input id="default_fixed_fee" name="default_fixed_fee" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_tax">Impostos NF (%)</Label>
                <Input id="default_tax" name="default_tax" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_freight">Frete Fixo Padrão (R$)</Label>
                <Input id="default_freight" name="default_freight" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_ads_fee">Publicidade / Ads (%)</Label>
                <Input id="default_ads_fee" name="default_ads_fee" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_fees">Outras Taxas (R$)</Label>
                <Input id="other_fees" name="other_fees" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button type="submit" className="bg-[#3483fa] hover:bg-[#2968c8]">
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
