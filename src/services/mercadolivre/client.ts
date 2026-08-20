import { createClient as createServerClient } from '@/utils/supabase/server'
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
    .single()

  if (conn && (conn.access_token || conn.refresh_token)) {
    return refreshOrReturnToken(supabase, conn)
  }

  // 2. Try marketplace_accounts
  const { data: acc } = await supabase
    .from('marketplace_accounts')
    .select('*')
    .eq('seller_id', sellerId)
    .single()

  if (acc && (acc.access_token || acc.refresh_token)) {
    return refreshOrReturnToken(supabase, acc)
  }

  // 3. Fallback: search any connection with mercadolivre
  const { data: fallbackConn } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('marketplace_id', 'mercadolivre')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (fallbackConn && (fallbackConn.access_token || fallbackConn.refresh_token)) {
    return refreshOrReturnToken(supabase, fallbackConn)
  }

  throw new Error(`Conexão ativa do Mercado Livre não encontrada para a conta ${sellerId}. Por favor, clique em "Conectar / Autorizar Mercado Livre" na aba Marketplaces.`)
}

async function refreshOrReturnToken(supabase: SupabaseClient<any>, conn: any): Promise<string> {
  // Check if token is expired (buffer of 5 minutes)
  const isExpired = !conn.token_expires_at || (new Date(conn.token_expires_at).getTime() - 5 * 60000 < Date.now())

  if (!isExpired && conn.access_token) {
    return conn.access_token
  }

  // Token is expired, refresh it
  if (!conn.refresh_token) {
    if (conn.access_token) return conn.access_token // return existing as last resort
    throw new Error('Refresh token não encontrado.')
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
      console.error('Failed to refresh token:', tokenData)
      if (conn.access_token) return conn.access_token
      throw new Error(`Falha ao renovar token: ${tokenData.message || tokenData.error}`)
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 21600) * 1000).toISOString()

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

    // Also update marketplace_accounts if present
    await supabase
      .from('marketplace_accounts')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        status: 'ACTIVE',
        connection_status: 'CONNECTED',
        updated_at: new Date().toISOString()
      })
      .eq('seller_id', conn.seller_id)

    return tokenData.access_token
  } catch (error) {
    console.error('Refresh token error:', error)
    if (conn.access_token) return conn.access_token
    throw new Error('Erro ao renovar token com o Mercado Livre.')
  }
}

export async function getValidToken(userId: string): Promise<string> {
  const supabase = getServiceSupabase()

  const { data: conn, error } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('marketplace_id', 'mercadolivre')
    .single()

  if (error || !conn) {
    throw new Error('Mercado Livre não conectado.')
  }

  return refreshOrReturnToken(supabase, conn)
}

// ----------------------------------------------------
// API Callers
// ----------------------------------------------------

export async function fetchMLOrder(token: string, orderId: string) {
  const res = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  if (!res.ok) {
    throw new Error(`Error fetching ML order ${orderId}: ${res.statusText}`)
  }
  return res.json()
}

export async function fetchMLItem(token: string, itemId: string) {
  const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  if (!res.ok) {
    throw new Error(`Error fetching ML item ${itemId}: ${res.statusText}`)
  }
  return res.json()
}
