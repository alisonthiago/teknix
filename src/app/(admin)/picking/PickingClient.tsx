'use client'

import { useState } from 'react'
import { updateOrderStatus } from '@/app/(admin)/orders/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PickingOrder {
  id: string
  order_number: string
  status: string
  items: Array<{
    id: string
    sku: string
    quantity: number
    products?: { name?: string; sku?: string; stock?: number; image_url?: string }
  }>
}

export default function PickingClient({ orders }: { orders: PickingOrder[] }) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleStart = async (orderId: string) => {
    setProcessing(orderId)
    try {
      await updateOrderStatus(orderId, 'EM_SEPARACAO')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar status')
    }
    setProcessing(null)
  }

  const handleComplete = async (orderId: string) => {
    setProcessing(orderId)
    try {
      await updateOrderStatus(orderId, 'SEPARADO')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar status')
    }
    setProcessing(null)
  }

  if (orders.length === 0) {
    return (
      <Card className="rounded-2xl border-[#e6e6e6]">
        <CardContent className="py-12 text-center">
          <p className="text-[#999] text-lg">Nenhum pedido para separar.</p>
          <p className="text-[#999] text-sm mt-1">Todos os pedidos foram separados.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orders.map(order => (
        <Card key={order.id} className="rounded-2xl border-[#e6e6e6] overflow-hidden">
          <CardHeader className="p-4 bg-[#fafafa] border-b border-[#e6e6e6]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">
                Pedido #{order.order_number}
              </CardTitle>
              <Badge variant="outline" className={
                order.status === 'EM_SEPARACAO'
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-lime-100 text-lime-700 border-lime-200'
              }>
                {order.status === 'EM_SEPARACAO' ? 'Em Separação' : 'Aguardando'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#e6e6e6]">
                <div className="w-10 h-10 bg-[#f5f5f5] rounded-lg flex items-center justify-center shrink-0">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-xs text-[#999]">PKG</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#333] truncate">{item.products?.name || item.sku}</p>
                  <p className="text-xs text-[#999]">SKU: {item.sku}</p>
                  <p className="text-xs text-[#999]">Qtd: <span className="font-bold text-[#333]">{item.quantity}</span></p>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              {order.status === 'AGUARDANDO_SEPARACAO' && (
                <button
                  onClick={() => handleStart(order.id)}
                  disabled={processing === order.id}
                  className="flex-1 py-2.5 bg-[#0f172a] text-white text-sm font-semibold rounded-xl hover:bg-[#1e293b] disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {processing === order.id ? 'Iniciando...' : 'Iniciar Separação'}
                </button>
              )}
              {order.status === 'EM_SEPARACAO' && (
                <button
                  onClick={() => handleComplete(order.id)}
                  disabled={processing === order.id}
                  className="flex-1 py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-xl hover:bg-[#15803d] disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {processing === order.id ? 'Salvando...' : 'Marcar como Separado ✓'}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
