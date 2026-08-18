'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { calculateSuggestedPrice } from '@/lib/calculations'

export default function PrecoSugeridoClient({ products }: { products: Array<{ id: string; sku: string; name: string; cost_purchase: number; freight_purchase: number; packaging_cost: number; other_costs: number }> }) {
  const [realCost, setRealCost] = useState(0)
  const [feePercent, setFeePercent] = useState(16)
  const [taxPercent, setTaxPercent] = useState(12)
  const [marginPercent, setMarginPercent] = useState(20)
  const [fixedFees, setFixedFees] = useState(0)

  const suggestedPrice = calculateSuggestedPrice({
    realCost,
    marketplaceFeePercent: feePercent,
    taxPercent,
    desiredMarginPercent: marginPercent,
    fixedFees,
  })

  const minimumPrice = calculateSuggestedPrice({
    realCost,
    marketplaceFeePercent: feePercent,
    taxPercent,
    desiredMarginPercent: 0,
    fixedFees,
  })

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Preço Sugerido</h2>
        <p className="text-sm text-[#999] mt-1">Calcule o preço ideal para atingir sua margem desejada.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-[#e6e6e6]">
          <CardHeader><CardTitle>Parâmetros</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Margem Desejada (%)</Label>
                <Input type="number" step="0.1" value={marginPercent} onChange={e => setMarginPercent(Number(e.target.value))} />
              </div>
              <div>
                <Label>Taxas Fixas (R$)</Label>
                <Input type="number" step="0.01" value={fixedFees} onChange={e => setFixedFees(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#dbeafe] bg-[#ecf3fe]/50">
          <CardHeader><CardTitle className="text-[#2968c8]">Resultado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-[#dbeafe] text-center">
              <p className="text-sm text-[#999] mb-1">Preço Sugerido</p>
              <p className="text-4xl font-bold text-[#2968c8]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(suggestedPrice)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-lime-100 text-center">
              <p className="text-sm text-[#999] mb-1">Preço Mínimo (margem 0%)</p>
              <p className="text-2xl font-bold text-lime-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(minimumPrice)}
              </p>
            </div>
            <div className="text-center text-sm text-[#999]">
              <p>Custo Real: R$ {realCost.toFixed(2)}</p>
              <p>Taxas: {feePercent}% + {taxPercent}% = {(feePercent + taxPercent).toFixed(1)}%</p>
              <p>Margem: {marginPercent}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
