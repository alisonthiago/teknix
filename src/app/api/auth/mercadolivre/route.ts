import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/utils/url'

export async function GET(request: Request) {
  const clientId = process.env.MERCADOLIVRE_CLIENT_ID || '8874323668438382'
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI || `${getBaseUrl()}/api/auth/mercadolivre/callback`

  // Mercado Livre OAuth URL (Brazil)
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`

  return NextResponse.redirect(authUrl)
}
