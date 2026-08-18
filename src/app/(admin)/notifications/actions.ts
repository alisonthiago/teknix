'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAsRead(id: string) {
  const supabase = await createClient()
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  revalidatePath('/notifications')
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }
  revalidatePath('/notifications')
}
