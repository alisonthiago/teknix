// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function SimulatorClient({ products, marketplaces }: { products: any[], marketplaces: any[] }) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedMarketplace, setSelectedMarketplace] = useState<any | null>(null)
  
  const [sellPrice, setSellPrice] = useState<number>(0)
  const [targetMargin, setTargetMargin] = useState<number>(20)

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prod = products.find((p: any) => p.id === e.target.value)
    setSelectedProduct(prod)
  }

  const handleMarketplaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mp = marketplaces.find((m: any) => m.id === e.target.value)
    setSelectedMarketplace(mp)
  }

  // --- Calculations ---
  // Real Cost
  const realCost = selectedProduct 
    ? Number(selectedProduct.cost_purchase) + Number(selectedProduct.freight_purchase) + Number(selectedProduct.packaging_cost) + Number(selectedProduct.other_costs)
    : 0

  // Marketplace Fees (using defaults since listings aren't fully hooked up for simplicity here)
  const mpPercent = selectedMarketplace ? Number(selectedMarketplace.default_percentage_fee) : 0
  const mpFixed = selectedMarketplace ? Number(selectedMarketplace.default_fixed_fee) : 0
  const mpTax = selectedMarketplace ? Number(selectedMarketplace.default_tax) : 0
  const mpFreight = selectedMarketplace ? Number(selectedMarketplace.default_freight) : 0
  const mpAds = selectedMarketplace ? Number(selectedMarketplace.default_ads_fee) : 0

  // 1. Simulação a partir de um Preço de Venda
  const calculateResult = (price: number) => {
    const feeValue = price * (mpPercent / 100)
    const taxValue = price * (mpTax / 100)
    const adsValue = price * (mpAds / 100)
    const totalDeductions = feeValue + mpFixed + taxValue + mpFreight + adsValue
    
    const profit = price - realCost - totalDeductions
    const margin = price > 0 ? (profit / price) * 100 : 0
    
    return { profit, margin, totalDeductions, feeValue, taxValue, adsValue }
  }

  const result = calculateResult(sellPrice)

  // 2. Cálculo do Preço Sugerido a partir de uma Margem
  // Preço = (Custo Fixo + Frete) / (1 - (Margem% + Taxa% + Imposto% + Ads%) / 100)
  // Onde Custo Fixo = Custo Real + Taxa Fixa ML + Frete ML
  const totalVariablePerc = (targetMargin + mpPercent + mpTax + mpAds) / 100
  const fixedCosts = realCost + mpFixed + mpFreight
  
  let suggestedPrice = 0
  if (totalVariablePerc < 1) {
    suggestedPrice = fixedCosts / (1 - totalVariablePerc)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm" onChange={handleProductChange}>
                <option value="">Selecione um produto</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
              </select>
              {selectedProduct && (
                <p className="text-sm text-muted-foreground mt-1">Custo Real: R$ {realCost.toFixed(2)}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Canal de Venda</Label>
              <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm" onChange={handleMarketplaceChange}>
                <option value="">Selecione um canal</option>
                {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {selectedProduct && selectedMarketplace && (
          <Card className="bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-white">Preço Sugerido</CardTitle>
              <CardDescription className="text-slate-400">Descubra o preço ideal para a sua margem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Margem Alvo (%)</Label>
                <div className="flex gap-2">
                  {[10, 15, 20, 30].map(m => (
                    <Button key={m} size="sm" variant={targetMargin === m ? 'default' : 'secondary'} onClick={() => setTargetMargin(m)} className={targetMargin === m ? 'bg-blue-600' : 'bg-slate-800 text-slate-300'}>
                      {m}%
                    </Button>
                  ))}
                  <Input type="number" className="w-20 bg-slate-800 border-slate-700" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400">Preço Necessário</p>
                <p className="text-3xl font-bold text-green-400">R$ {suggestedPrice.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Simulator Area */}
      <div className="lg:col-span-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Simulador de Preço</CardTitle>
            <CardDescription>Digite o preço que deseja praticar e veja se dá lucro.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedProduct || !selectedMarketplace ? (
              <div className="text-center py-12 text-slate-500">
                Selecione um produto e um canal para começar a simular.
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <Label className="text-lg font-bold">Preço de Venda (R$)</Label>
                    <Input 
                      type="number" 
                      className="text-2xl h-14" 
                      value={sellPrice || ''} 
                      onChange={e => setSellPrice(Number(e.target.value))} 
                      placeholder="Ex: 199.90"
                    />
                  </div>
                  
                  <div className="pt-6">
                    {result.profit > 0 ? (
                      result.margin >= targetMargin ? (
                        <Badge className="bg-green-600 text-sm py-1 px-3">🟢 MARGEM IDEAL ({result.margin.toFixed(2)}%)</Badge>
                      ) : (
                         <Badge className="bg-yellow-500 text-sm py-1 px-3">🟡 MARGEM BAIXA ({result.margin.toFixed(2)}%)</Badge>
                      )
                    ) : (
                      <Badge className="bg-red-600 text-sm py-1 px-3">🔴 PREJUÍZO (R$ {result.profit.toFixed(2)})</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Custo Real</p>
                    <p className="text-lg font-medium text-slate-700">R$ {realCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Taxas ({mpPercent}%)</p>
                    <p className="text-lg font-medium text-red-600">- R$ {result.feeValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Taxa Fixa + Frete</p>
                    <p className="text-lg font-medium text-red-600">- R$ {(mpFixed + mpFreight).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Imposto + Ads</p>
                    <p className="text-lg font-medium text-red-600">- R$ {(result.taxValue + result.adsValue).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-6 bg-slate-900 rounded-lg shadow-inner text-white">
                  <div>
                    <p className="text-sm text-slate-400">Líquido na Conta</p>
                    <p className="text-xl font-medium text-slate-200">R$ {(sellPrice - result.totalDeductions).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Lucro Líquido</p>
                    <p className={`text-4xl font-bold ${result.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      R$ {result.profit.toFixed(2)}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
