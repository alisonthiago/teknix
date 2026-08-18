import { getProductDetail } from '@/lib/supabase-detail-queries'
import ProductDetailClient from '@/components/ProductDetailClient'
import { notFound } from 'next/navigation'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductDetail(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="px-0 sm:px-0">
      <ProductDetailClient product={product} />
    </div>
  )
}
