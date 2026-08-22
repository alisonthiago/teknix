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

  throw new Error(`Conexão ativa do Mercado Livre não encontrada para a conta ${sellerId}.`)
}

// In-flight refresh promises map to prevent concurrent refresh race conditions
const refreshLocks = new Map<string, Promise<string>>()

async function refreshOrReturnToken(supabase: SupabaseClient<any>, conn: any): Promise<string> {
  const lockKey = String(conn.id || conn.seller_id || 'default')

  // Se já houver um refresh em andamento para esta conta, aguarda o término do mesmo
  if (refreshLocks.has(lockKey)) {
    return refreshLocks.get(lockKey)!
  }

  // Buffer de renovação proativa: 45 minutos antes de expirar
  const isExpiringSoon = !conn.token_expires_at || 
    (new Date(conn.token_expires_at).getTime() - 45 * 60 * 1000 < Date.now())

  // Se o token estiver perfeitamente válido, retorna imediatamente
  if (!isExpiringSoon && conn.access_token) {
    return conn.access_token
  }

  // Token necessita renovação
  if (!conn.refresh_token) {
    if (conn.access_token) return conn.access_token
    throw new Error('Refresh token não encontrado para renovação do Mercado Livre.')
  }

  const clientId = process.env.MERCADOLIVRE_CLIENT_ID || process.env.MERCADOLIVRE_APP_ID || '8874323668438382'
  const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET || 'JQrkHL7X2ieJdxPpevL9b9PX3iffwfFm'

  // Single-flight Promise para garantir 1 único refresh simultâneo
  const refreshPromise = (async () => {
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
        console.warn('[ML Token Service] Aviso na renovação silenciosa:', tokenData)
        if (conn.access_token) return conn.access_token
        throw new Error(`Falha ao renovar token do Mercado Livre: ${tokenData.message || tokenData.error}`)
      }

      // Tokens do Mercado Livre duram 6 horas (21600 segundos)
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 21600) * 1000).toISOString()

      // 1. Atualiza marketplace_connections
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

      // 2. Atualiza marketplace_accounts se existir
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
      console.error('[ML Token Service] Erro no refresh de token:', error)
      if (conn.access_token) return conn.access_token
      throw error
    } finally {
      refreshLocks.delete(lockKey)
    }
  })()

  refreshLocks.set(lockKey, refreshPromise)
  return refreshPromise
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
