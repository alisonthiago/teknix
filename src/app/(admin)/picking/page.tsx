import { createClient } from '@/utils/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import PickingClient from './PickingClient'

export default async function PickingPage() {
  const supabase = await createClient()
  const userPerms = await getUserPermissions()
  if (!userPerms) return null

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, created_at')
    .in('status', ['AGUARDANDO_SEPARACAO', 'EM_SEPARACAO'])
    .order('created_at')

  const orderIds = orders?.map(o => o.id) || []

  const { data: items } = orderIds.length > 0
    ? await supabase
        .from('order_items')
        .select('*, products(name, sku, stock, image_url)')
        .in('order_id', orderIds)
    : { data: [] }

  const ordersWithItems = orders?.map(order => ({
    ...order,
    items: items?.filter(i => i.order_id === order.id) || [],
  })) || []

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Separação</h2>
        <p className="text-sm text-[#999] mt-1">Pedidos aguardando separação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="rounded-xl border-lime-100 bg-lime-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-lime-700">
              {ordersWithItems.filter(o => o.status === 'AGUARDANDO_SEPARACAO').length}
            </p>
            <p className="text-xs text-lime-600">Aguardando</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-orange-100 bg-orange-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">
              {ordersWithItems.filter(o => o.status === 'EM_SEPARACAO').length}
            </p>
            <p className="text-xs text-orange-600">Em Separação</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#e6e6e6]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#333]">
              {items?.length || 0}
            </p>
            <p className="text-xs text-[#999]">Itens para Separar</p>
          </CardContent>
        </Card>
      </div>

      <PickingClient orders={ordersWithItems} />
    </div>
  )
}
