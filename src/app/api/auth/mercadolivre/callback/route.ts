import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/settings/integrations?error=No code provided', request.url))
  }

  const clientId = process.env.MERCADOLIVRE_CLIENT_ID
  const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/settings/integrations?error=Missing environment variables', request.url))
  }

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
      return NextResponse.redirect(new URL('/settings/integrations?error=Failed to get token', request.url))
    }

    const { access_token, refresh_token, expires_in, user_id: seller_id, scope } = tokenData

    // 2. Save to Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Upsert the connection
    const { error: dbError } = await supabase
      .from('marketplace_connections')
      .upsert({
        user_id: user.id,
        marketplace_id: 'mercadolivre',
        seller_id: seller_id.toString(),
        access_token,
        refresh_token,
        token_expires_at: expiresAt,
        scope,
        status: 'CONNECTED',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, marketplace_id, seller_id' })

    if (dbError) {
      console.error('DB Insert Error:', dbError)
      return NextResponse.redirect(new URL('/settings/integrations?error=Database error', request.url))
    }

    // Redirect back to integrations page with success
    return NextResponse.redirect(new URL('/settings/integrations?success=1', request.url))

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/settings/integrations?error=Internal server error', request.url))
  }
}
