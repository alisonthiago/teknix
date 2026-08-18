import { createClient } from '@/utils/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getValidToken(userId: string) {
  const supabase = await createClient()

  const { data: conn, error } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('marketplace_id', 'mercadolivre')
    .single()

  if (error || !conn) {
    throw new Error('Mercado Livre não conectado.')
  }

  if (conn.status !== 'CONNECTED') {
    throw new Error('Conexão do Mercado Livre precisa de reautenticação.')
  }

  // Check if token is expired (adding 5 min buffer)
  const isExpired = new Date(conn.token_expires_at).getTime() - 5 * 60000 < Date.now()

  if (!isExpired) {
    return conn.access_token
  }

  // Token is expired, refresh it
  if (!conn.refresh_token) {
    await setStatus(supabase, conn.id, 'REAUTH_REQUIRED')
    throw new Error('Refresh token não encontrado.')
  }

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.MERCADOLIVRE_CLIENT_ID!,
        client_secret: process.env.MERCADOLIVRE_CLIENT_SECRET!,
        refresh_token: conn.refresh_token
      })
    })

    const tokenData = await res.json()

    if (!res.ok) {
      console.error('Failed to refresh token:', tokenData)
      await setStatus(supabase, conn.id, 'REAUTH_REQUIRED')
      throw new Error('Falha ao renovar token.')
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    await supabase
      .from('marketplace_connections')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', conn.id)

    return tokenData.access_token

  } catch (error) {
    console.error('Refresh token error:', error)
    await setStatus(supabase, conn.id, 'REAUTH_REQUIRED')
    throw new Error('Erro ao renovar token com o Mercado Livre.')
  }
}

async function setStatus(supabase: SupabaseClient, id: string, status: string) {
  await supabase.from('marketplace_connections').update({ status }).eq('id', id)
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
