import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getBaseUrl } from '@/utils/url'
import { syncMercadoLivreAccount } from '@/services/mercadolivre/syncCatalog'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/marketplaces?error=No_code', request.url))
  }

  const clientId = process.env.MERCADOLIVRE_CLIENT_ID || process.env.MERCADOLIVRE_APP_ID || '8874323668438382'
  const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET || 'JQrkHL7X2ieJdxPpevL9b9PX3iffwfFm'
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI || `${getBaseUrl()}/api/auth/mercadolivre/callback`

  try {
    // 1. Get code_verifier from cookies if PKCE is active
    let codeVerifier: string | undefined
    try {
      const cookieHeader = request.headers.get('cookie') || ''
      const match = cookieHeader.match(/ml_code_verifier=([^;]+)/)
      if (match) {
        codeVerifier = decodeURIComponent(match[1])
      }
    } catch {
      // ignore
    }

    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    }
    if (codeVerifier) {
      tokenParams.code_verifier = codeVerifier
    }

    // 2. Exchange code for access token
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenParams)
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error('ML Token Error:', tokenData)
      return NextResponse.redirect(new URL(`/marketplaces?error=${encodeURIComponent(tokenData.message || 'Falha na autenticação do Mercado Livre')}`, request.url))
    }

    const { access_token, refresh_token, expires_in, user_id: seller_id } = tokenData

    // 2. Fetch seller profile information
    let sellerNickname = `Mercado Livre #${seller_id}`
    try {
      const userRes = await fetch(`https://api.mercadolibre.com/users/${seller_id}`, {
        headers: { Authorization: `Bearer ${access_token}` }
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        if (userData.nickname) {
          sellerNickname = userData.nickname
        }
      }
    } catch (e) {
      console.warn('Could not fetch seller details:', e)
    }

    // 3. Supabase admin client
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const expiresAt = new Date(Date.now() + (expires_in || 21600) * 1000).toISOString()

    // 4. Find or create Mercado Livre marketplace record
    let marketplaceId = 'mercadolivre'
    const { data: mp } = await supabase
      .from('marketplaces')
      .select('id')
      .or('code.eq.MERCADO_LIVRE,code.eq.mercadolivre')
      .single()

    if (mp) marketplaceId = mp.id

    // 5. Check if connection exists in marketplace_connections
    const { data: existingConn } = await supabase
      .from('marketplace_connections')
      .select('id, user_id')
      .eq('seller_id', seller_id.toString())
      .single()

    const connectionUserId = existingConn?.user_id || null

    if (existingConn) {
      await supabase
        .from('marketplace_connections')
        .update({
          account_name: sellerNickname,
          access_token,
          refresh_token,
          token_expires_at: expiresAt,
          is_active: true,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConn.id)
    } else {
      await supabase
        .from('marketplace_connections')
        .insert({
          user_id: connectionUserId,
          marketplace_id: 'mercadolivre',
          seller_id: seller_id.toString(),
          account_name: sellerNickname,
          access_token,
          refresh_token,
          token_expires_at: expiresAt,
          is_active: true,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // 6. Upsert marketplace_accounts
    await supabase
      .from('marketplace_accounts')
      .upsert({
        marketplace_id: marketplaceId,
        user_id: connectionUserId,
        account_name: sellerNickname,
        seller_id: seller_id.toString(),
        access_token,
        refresh_token,
        token_expires_at: expiresAt,
        status: 'ACTIVE',
        connection_status: 'CONNECTED',
        auto_sync_stock: true,
        auto_sync_prices: true,
        auto_import_orders: true,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'seller_id' })

    // 7. Notification
    if (connectionUserId) {
      await supabase.from('notifications').insert({
        title: 'Mercado Livre Conectado!',
        message: `A conta "${sellerNickname}" do Mercado Livre foi conectada com sucesso. Sincronização de estoque e pedidos ativa!`,
        type: 'SUCCESS',
        user_id: connectionUserId
      })
    }

    // 8. Immediate background catalog & order sync
    try {
      await syncMercadoLivreAccount(seller_id.toString())
    } catch (syncErr) {
      console.warn('Initial sync in callback warning:', syncErr)
    }

    // Redirect to the marketplace detail page with success param
    return NextResponse.redirect(new URL(`/marketplaces/${marketplaceId}?success=connected`, request.url))

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/marketplaces?error=internal_error', request.url))
  }
}
