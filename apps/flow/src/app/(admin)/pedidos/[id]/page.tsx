import { getOrderDetail } from '@/lib/supabase-detail-queries'
import PedidoDetailClient from '@/components/PedidoDetailClient'
import { notFound } from 'next/navigation'

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderDetail(id)

  if (!order) {
    notFound()
  }

  return (
    <div className="-mx-5 sm:-mx-8 lg:-mx-12 xl:-mx-16">
      <PedidoDetailClient order={order} />
    </div>
  )
}
