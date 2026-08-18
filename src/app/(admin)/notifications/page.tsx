import { createClient } from '@/utils/supabase/server'
import NotificationsClient from './NotificationsClient'

export const metadata = {
  title: 'Notificações | TEKNIX',
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  resource?: string
  resource_id?: string
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let notifications: Notification[] = []
  if (user) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    notifications = (data || []) as Notification[]
  }

  return <NotificationsClient initialNotifications={notifications} />
}
