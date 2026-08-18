import { getSaleDetail } from '@/lib/supabase-detail-queries'
import VendaDetailClient from '@/components/VendaDetailClient'
import { notFound } from 'next/navigation'

export default async function VendaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sale = await getSaleDetail(id)

  if (!sale) {
    notFound()
  }

  return (
    <div className="px-0 sm:px-0">
      <VendaDetailClient sale={sale} />
    </div>
  )
}
