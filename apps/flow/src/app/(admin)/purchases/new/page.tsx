import { createClient } from '@/utils/supabase/server'
import NewPurchaseForm from '@/components/NewPurchaseForm'

export default async function NewPurchasePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ supplier?: string; product?: string }> 
}) {
  const params = await searchParams
  const preselectedSupplier = params?.supplier || ''
  const preselectedProduct = params?.product || ''

  const supabase = await createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, document, phone, email')
    .order('name')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, supplier_id, stock, cost_purchase, image_url')
    .order('name')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28">
      <NewPurchaseForm 
        suppliers={suppliers || []} 
        products={products || []} 
        initialSupplierId={preselectedSupplier}
        initialProductId={preselectedProduct}
      />
    </div>
  )
}
