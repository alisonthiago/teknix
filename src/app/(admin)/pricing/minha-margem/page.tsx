import { requirePermission } from '@/lib/permissions'
import MinhaMargemClient from './MinhaMargemClient'

export default async function MinhaMargemPage() {
  await requirePermission('products.view')
  return <MinhaMargemClient />
}
