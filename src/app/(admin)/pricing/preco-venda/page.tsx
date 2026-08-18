import { requirePermission } from '@/lib/permissions'
import PrecoVendaClient from './PrecoVendaClient'

export default async function PrecoVendaPage() {
  await requirePermission('products.view')
  return <PrecoVendaClient />
}
