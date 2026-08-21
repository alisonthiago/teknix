import { redirect } from 'next/navigation'

export default function ComprasRedirect() {
  redirect('/operacao?tab=compras')
}
