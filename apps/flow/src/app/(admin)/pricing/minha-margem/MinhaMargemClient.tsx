'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function MinhaMargemClient() {
  const [salePrice, setSalePrice] = useState(149.90)
  const [realCost, setRealCost] = useState(80)
  const [feePercent, setFeePercent] = useState(16)
  const [taxPercent, setTaxPercent] = useState(12)

  const fees = salePrice * (feePercent / 100)
  const taxes = salePrice * (taxPercent / 100)
  const profit = salePrice - realCost - fees - taxes
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Minha Margem</h2>
        <p className="text-sm text-[#999] mt-1">Descubra a margem do seu produto.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-[#e6e6e6]">
          <CardHeader><CardTitle>Informações do Produto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input type="number" step="0.01" value={salePrice} onChange={e => setSalePrice(Number(e.target.value))} />
            </div>
            <div>
              <Label>Custo Real (R$)</Label>
              <Input type="number" step="0.01" value={realCost} onChange={e => setRealCost(Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Taxa Marketplace (%)</Label>
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
          <Card className={`rounded-2xl ${margin >= 20 ? 'border-green-200 bg-green-50/50' : margin > 0 ? 'border-lime-200 bg-lime-50/50' : 'border-red-200 bg-red-50/50'}`}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-[#999] mb-1">Margem</p>
              <p className={`text-5xl font-bold ${margin >= 20 ? 'text-green-700' : margin > 0 ? 'text-lime-700' : 'text-red-700'}`}>
                {margin.toFixed(1)}%
              </p>
              <p className={`text-sm mt-2 ${margin >= 20 ? 'text-green-600' : margin > 0 ? 'text-lime-600' : 'text-red-600'}`}>
                {margin >= 25 ? 'MARGEM BOA' : margin > 15 ? 'LUCRO' : margin > 0 ? 'MARGEM BAIXA' : 'PREJUÍZO'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#e6e6e6]">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#999]">Receita</span><span className="font-medium">R$ {salePrice.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#999]">Custo Real</span><span className="font-medium text-red-600">- R$ {realCost.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#999]">Taxas ({feePercent}%)</span><span className="font-medium text-red-600">- R$ {fees.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#999]">Impostos ({taxPercent}%)</span><span className="font-medium text-red-600">- R$ {taxes.toFixed(2)}</span></div>
              <div className="border-t border-[#e6e6e6] pt-2 flex justify-between">
                <span className="font-medium">Lucro</span>
                <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {profit.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
