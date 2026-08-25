import { getSupplierDetail } from '@/lib/supabase-detail-queries'
import FornecedorDetailClient from '@/components/FornecedorDetailClient'
import { notFound } from 'next/navigation'

export default async function FornecedorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await getSupplierDetail(id)

  if (!supplier) {
    notFound()
  }

  return (
    <div className="px-0 sm:px-0">
      <FornecedorDetailClient supplier={supplier} />
    </div>
  )
}
