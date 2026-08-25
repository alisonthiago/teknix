'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Package, Check } from 'lucide-react'

interface Shipment {
  id: string
  order_id: string
  order_number: string
  status: string
  carrier?: string
  tracking_code?: string
  items: Array<{ name: string; sku: string; quantity: number }>
}

export default function ShippingClient({ shipments }: { shipments: Shipment[] }) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleAction = async (shipmentId: string, action: string) => {
    setProcessing(shipmentId)
    try {
      const res = await fetch('/api/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shipmentId, action }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao processar')
      }
    } catch {
      alert('Erro ao processar expedição')
    }
    setProcessing(null)
  }

  if (shipments.length === 0) {
    return (
      <Card className="rounded-2xl border-[#e6e6e6]">
        <CardContent className="py-12 text-center">
          <Truck className="w-12 h-12 text-[#999] mx-auto mb-3" />
          <p className="text-[#999] text-lg">Nenhum pedido para expedir.</p>
          <p className="text-[#999] text-sm mt-1">Separe os pedidos primeiro.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {shipments.map(shipment => (
        <Card key={shipment.id} className="rounded-2xl border-[#e6e6e6] overflow-hidden">
          <CardHeader className="p-4 bg-[#fafafa] border-b border-[#e6e6e6]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">
                Pedido #{shipment.order_number}
              </CardTitle>
              <Badge variant="outline" className={
                shipment.status === 'ENVIADO'
                  ? 'bg-[#f5f5f5] text-[#111827] border-[#cbd5e1]'
                  : 'bg-cyan-100 text-cyan-700 border-cyan-200'
              }>
                {shipment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {shipment.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#e6e6e6]">
                <Package className="w-5 h-5 text-[#999] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#333] truncate">{item.name}</p>
                  <p className="text-xs text-[#999]">SKU: {item.sku} | Qtd: {item.quantity}</p>
                </div>
              </div>
            ))}

            {shipment.carrier && (
              <p className="text-xs text-[#999]">Transportadora: <span className="font-medium">{shipment.carrier}</span></p>
            )}
            {shipment.tracking_code && (
              <p className="text-xs text-[#999]">Rastreio: <span className="font-mono text-[#666]">{shipment.tracking_code}</span></p>
            )}

            <div className="flex gap-2 pt-2">
              {shipment.status === 'PREPARANDO' && (
                <button
                  onClick={() => handleAction(shipment.id, 'embalar')}
                  disabled={processing === shipment.id}
                  className="flex-1 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                >
                  Confirmar Embalagem
                </button>
              )}
              {shipment.status === 'EMBALADO' && (
                <button
                  onClick={() => handleAction(shipment.id, 'enviar')}
                  disabled={processing === shipment.id}
                  className="flex-1 py-2.5 bg-[#1f2328] text-white text-sm font-medium rounded-lg hover:bg-[#111827] disabled:opacity-50 transition-colors"
                >
                  Marcar Enviado
                </button>
              )}
              {shipment.status === 'ENVIADO' && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Enviado</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
