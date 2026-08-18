import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/permissions'
import ShippingClient from './ShippingClient'

export default async function ShippingPage() {
  await requirePermission('shipping.view')
  const supabase = await createClient()

  const { data: shipments } = await supabase
    .from('shipments')
    .select('*, orders(order_number)')
    .order('created_at', { ascending: false })

  const formatted = (shipments || []).map(s => ({
    ...s,
    order_number: s.orders?.order_number || '-',
    items: [],
  }))

  return (
    <div className="mp-stack">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#333]">Expedição</h2>
        <p className="text-sm text-[#999] mt-1">Pedidos separados aguardando expedição.</p>
      </div>
      <ShippingClient shipments={formatted} />
    </div>
  )
}
