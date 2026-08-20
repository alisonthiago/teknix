import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getBaseUrl } from '@/utils/url'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/marketplaces?error=No_code', request.url))
  }

  const clientId = process.env.MERCADOLIVRE_CLIENT_ID || '8874323668438382'
  const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET || 'JQrkHL7X2ieJdxPpevL9b9PX3iffwfFm'
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI || `${getBaseUrl()}/api/auth/mercadolivre/callback`

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error('ML Token Error:', tokenData)
      return NextResponse.redirect(new URL(`/marketplaces?error=${encodeURIComponent(tokenData.message || 'Falha na autenticação do Mercado Livre')}`, request.url))
    }

    const { access_token, refresh_token, expires_in, user_id: seller_id, scope } = tokenData

    // 2. Fetch seller profile information (store nickname, email, etc.)
    let sellerNickname = `Vendedor ML #${seller_id}`
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

    // 3. Save to Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const expiresAt = new Date(Date.now() + (expires_in || 21600) * 1000).toISOString()

    // 4. Find or create marketplace record
    let marketplaceId: string | null = null
    const { data: mp } = await supabase
      .from('marketplaces')
      .select('id')
      .eq('code', 'MERCADO_LIVRE')
      .single()

    if (mp) marketplaceId = mp.id

    // 5. Upsert the connection
    const { error: dbError } = await supabase
      .from('marketplace_connections')
      .upsert({
        user_id: user.id,
        marketplace_id: 'mercadolivre',
        seller_id: seller_id.toString(),
        account_name: sellerNickname,
        access_token,
        refresh_token,
        token_expires_at: expiresAt,
        scope,
        is_active: true,
        status: 'CONNECTED',
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('DB Insert Error on marketplace_connections:', dbError)
    }

    // 6. Upsert marketplace_accounts for multi-account management
    if (marketplaceId) {
      await supabase
        .from('marketplace_accounts')
        .upsert({
          marketplace_id: marketplaceId,
          user_id: user.id,
          account_name: sellerNickname,
          seller_id: seller_id.toString(),
          access_token,
          refresh_token,
          token_expires_at: expiresAt,
          status: 'ACTIVE',
          auto_sync_stock: true,
          auto_sync_prices: true,
          auto_import_orders: true,
          last_sync_at: new Date().toISOString()
        })
    }

    // 7. Create notification in system
    await supabase.from('notifications').insert({
      title: 'Mercado Livre Conectado!',
      message: `A conta "${sellerNickname}" do Mercado Livre foi conectada com sucesso. Webhooks e sincronização de estoque estão ativos.`,
      type: 'SUCCESS',
      user_id: user.id
    })

    // Redirect back to marketplaces page with success parameter
    return NextResponse.redirect(new URL('/marketplaces?success=ml', request.url))

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/marketplaces?error=internal_error', request.url))
  }
}
