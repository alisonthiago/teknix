'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PrecoVendaClient() {
  const [realCost, setRealCost] = useState(80)
  const [salePrice, setSalePrice] = useState(149.90)
  const [feePercent, setFeePercent] = useState(16)
  const [taxPercent, setTaxPercent] = useState(12)

  const fees = salePrice * (feePercent / 100)
  const taxes = salePrice * (taxPercent / 100)
  const profit = salePrice - realCost - fees - taxes
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0
  const minPrice = realCost / (1 - (feePercent + taxPercent) / 100)

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Preço de Venda</h2>
        <p className="text-sm text-[#999] mt-1">Compare e defina o melhor preço para seus produtos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-[#e6e6e6]">
          <CardHeader><CardTitle>Definir Preço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Custo Real (R$)</Label>
              <Input type="number" step="0.01" value={realCost} onChange={e => setRealCost(Number(e.target.value))} />
            </div>
            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input type="number" step="0.01" value={salePrice} onChange={e => setSalePrice(Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Taxa (%)</Label>
                <Input type="number" step="0.1" value={feePercent} onChange={e => setFeePercent(Number(e.target.value))} />
              </div>
              <div>
                <Label>Imposto (%)</Label>
                <Input type="number" step="0.1" value={taxPercent} onChange={e => setTaxPercent(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-[#e6e6e6]">
            <CardHeader><CardTitle>Comparação</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between p-3 bg-[#ecf3fe] rounded-lg">
                <span className="text-sm font-medium text-[#2968c8]">Preço Atual</span>
                <span className="text-sm font-bold text-[#2968c8]">R$ {salePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-lime-50 rounded-lg">
                <span className="text-sm font-medium text-lime-700">Preço Mínimo</span>
                <span className="text-sm font-bold text-lime-700">R$ {minPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#fafafa] rounded-lg">
                <span className="text-sm text-[#999]">Custo Real</span>
                <span className="text-sm font-medium">R$ {realCost.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-2xl ${margin >= 20 ? 'border-green-200 bg-green-50/50' : margin > 0 ? 'border-lime-200' : 'border-red-200 bg-red-50/50'}`}>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-[#999]">Lucro</p>
                  <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {profit.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#999]">Margem</p>
                  <p className={`text-xl font-bold ${margin >= 20 ? 'text-green-600' : margin > 0 ? 'text-lime-600' : 'text-red-600'}`}>
                    {margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
