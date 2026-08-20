import { createClient as createDirectClient, SupabaseClient } from '@supabase/supabase-js'

function getServiceSupabase(): SupabaseClient<any> {
  return createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getValidTokenBySellerId(sellerId: string): Promise<string> {
  const supabase = getServiceSupabase()

  // 1. Try marketplace_connections
  const { data: conn } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('seller_id', sellerId)
    .eq('marketplace_id', 'mercadolivre')
    .maybeSingle()

  if (conn && (conn.access_token || conn.refresh_token)) {
    return refreshOrReturnToken(supabase, conn)
  }

  // 2. Try marketplace_accounts
  const { data: acc } = await supabase
    .from('marketplace_accounts')
    .select('*')
    .eq('seller_id', sellerId)
    .maybeSingle()

  if (acc && (acc.access_token || acc.refresh_token)) {
    return refreshOrReturnToken(supabase, acc)
  }

  // 3. Fallback: search any active connection with mercadolivre
  const { data: fallbackConn } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('marketplace_id', 'mercadolivre')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fallbackConn && (fallbackConn.access_token || fallbackConn.refresh_token)) {
    return refreshOrReturnToken(supabase, fallbackConn)
  }

  throw new Error(`Conexão ativa do Mercado Livre não encontrada para a conta ${sellerId}.`)
}

async function refreshOrReturnToken(supabase: SupabaseClient<any>, conn: any): Promise<string> {
  // Proactive refresh buffer: 60 minutes before expiration
  const isExpiringSoon = !conn.token_expires_at || 
    (new Date(conn.token_expires_at).getTime() - 60 * 60 * 1000 < Date.now())

  // If token is completely fresh and exists, return immediately
  if (!isExpiringSoon && conn.access_token) {
    return conn.access_token
  }

  // Token needs refresh
  if (!conn.refresh_token) {
    if (conn.access_token) return conn.access_token
    throw new Error('Refresh token não encontrado para renovação.')
  }

  const clientId = process.env.MERCADOLIVRE_CLIENT_ID || process.env.MERCADOLIVRE_APP_ID || '8874323668438382'
  const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET || 'JQrkHL7X2ieJdxPpevL9b9PX3iffwfFm'

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: conn.refresh_token
      })
    })

    const tokenData = await res.json()

    if (!res.ok) {
      console.warn('Silent refresh warning:', tokenData)
      // If refresh failed temporarily, return current access token if present
      if (conn.access_token) return conn.access_token
      throw new Error(`Falha ao renovar token: ${tokenData.message || tokenData.error}`)
    }

    // Mercado Livre tokens typically last 6 hours (21600s)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 21600) * 1000).toISOString()

    // 1. Update marketplace_connections
    if (conn.id) {
      await supabase
        .from('marketplace_connections')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', conn.id)
    }

    // 2. Also update marketplace_accounts
    if (conn.seller_id) {
      await supabase
        .from('marketplace_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          status: 'ACTIVE',
          last_sync_at: new Date().toISOString()
        })
        .eq('seller_id', conn.seller_id)
    }

    return tokenData.access_token
  } catch (error) {
    console.error('Refresh token error:', error)
    if (conn.access_token) return conn.access_token
    throw error
  }
}

export async function getValidToken(userId: string): Promise<string> {
  const supabase = getServiceSupabase()

  const { data: conn, error } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('marketplace_id', 'mercadolivre')
    .maybeSingle()

  if (error || !conn) {
    // Fallback to seller_id search
    return getValidTokenBySellerId('470831049')
  }

  return refreshOrReturnToken(supabase, conn)
}

export async function fetchMLOrder(token: string, orderId: string) {
  const res = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ML order ${orderId}: ${res.statusText}`)
  }

  return res.json()
}
