import { createClient } from '@/utils/supabase/server'
import SuppliersClient from './SuppliersClient'

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-red-500">Erro ao carregar fornecedores.</div>
  }

  return (
    <SuppliersClient suppliers={suppliers || []} />
  )
}
