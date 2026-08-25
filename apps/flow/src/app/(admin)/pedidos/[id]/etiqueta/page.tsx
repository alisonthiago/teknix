import { getOrderDetail } from '@/lib/supabase-detail-queries'
import { notFound } from 'next/navigation'
import PrintLabelClient from './PrintLabelClient'

export default async function EtiquetaEnvioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderDetail(id)

  if (!order) {
    notFound()
  }

  return <PrintLabelClient order={order} />
}
