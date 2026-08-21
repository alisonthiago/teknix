import { createClient } from '@/utils/supabase/server'
import SuppliersClient from '../suppliers/SuppliersClient'

export default async function FornecedoresPage() {
  const supabase = await createClient()
  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-red-500 p-4">Erro ao carregar fornecedores.</div>
  }

  return (
    <SuppliersClient suppliers={suppliers || []} />
  )
}
