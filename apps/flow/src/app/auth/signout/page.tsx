import { logout } from '@/app/login/actions'

export default async function SignOutPage() {
  await logout()
  return null
}
