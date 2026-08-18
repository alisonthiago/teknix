import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.MERCADOLIVRE_CLIENT_ID
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Mercado Livre integration not configured' }, { status: 500 })
  }

  // Mercado Livre OAuth URL (Brazil)
  // For other countries, the base URL changes (e.g. auth.mercadolibre.com.ar)
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`

  return NextResponse.redirect(authUrl)
}
