import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/server'
import NewPurchaseForm from '@/components/NewPurchaseForm'

export default async function NewPurchasePage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase.from('suppliers').select('id, name').order('name')
  const { data: products } = await supabase.from('products').select('id, name, sku, supplier_id').order('name')

  return (
    <div className="mp-stack max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nova Compra</h2>
          <p className="text-[#999]">Registre a entrada de mercadorias no estoque e gere a Nota Interna.</p>
        </div>
        <Link href="/operacao">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <NewPurchaseForm 
        suppliers={suppliers || []} 
        products={products || []} 
      />
    </div>
  )
}
