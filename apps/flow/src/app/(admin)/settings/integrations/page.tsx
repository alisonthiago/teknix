import { createClient } from '@/utils/supabase/server'
import IntegrationsClient from './IntegrationsClient'

export const metadata = {
  title: 'Integrações | TEKNIX',
}

interface Connection {
  id: string
  user_id: string
  marketplace_id: string
  seller_id: string
  status: string
  updated_at: string
  account_name?: string
  last_sync_at?: string
}

interface Marketplace {
  id: string
  name: string
  code: string
  status: string
  type: string
  api_available: boolean
  oauth_available: boolean
  webhook_available: boolean
}

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let connections: Connection[] = []
  if (user) {
    const { data } = await supabase
      .from('marketplace_connections')
      .select('*')
      .eq('user_id', user.id)
    connections = (data || []) as Connection[]
  }

  const { data: marketplaces } = await supabase
    .from('marketplaces')
    .select('*')
    .order('name')

  return <IntegrationsClient initialConnections={connections} marketplaces={(marketplaces || []) as Marketplace[]} />
}
