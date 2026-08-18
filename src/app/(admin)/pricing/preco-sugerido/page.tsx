import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/permissions'
import PrecoSugeridoClient from './PrecoSugeridoClient'

export default async function PrecoSugeridoPage() {
  await requirePermission('products.view')
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name, cost_purchase, freight_purchase, packaging_cost, other_costs')
    .order('name')

  return <PrecoSugeridoClient products={products || []} />
}
