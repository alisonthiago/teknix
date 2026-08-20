import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/utils/url'
import crypto from 'crypto'

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.randomBytes(32))
}

function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest()
  return base64UrlEncode(hash)
}

export async function GET(request: Request) {
  const clientId = process.env.MERCADOLIVRE_CLIENT_ID || '8874323668438382'
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI || `${getBaseUrl()}/api/auth/mercadolivre/callback`

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  // Mercado Livre OAuth URL com suporte a PKCE e sem PKCE
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('ml_code_verifier', codeVerifier, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600,
    sameSite: 'lax'
  })

  return response
}
