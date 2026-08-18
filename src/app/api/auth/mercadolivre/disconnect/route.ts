import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete or mark as disconnected
  const { error } = await supabase
    .from('marketplace_connections')
    .update({
      status: 'DISCONNECTED',
      disconnected_at: new Date().toISOString(),
      access_token: 'REMOVED',
      refresh_token: 'REMOVED'
    })
    .eq('user_id', user.id)
    .eq('marketplace_id', 'mercadolivre')

  if (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
