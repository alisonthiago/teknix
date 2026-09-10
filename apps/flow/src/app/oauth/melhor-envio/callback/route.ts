import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_URL = 'https://melhorenvio.com.br/oauth/token'
const ACCOUNT_KEY = 'melhor-envio'

type TokenResponse = {
  access_token?: unknown
  refresh_token?: unknown
  expires_in?: unknown
  token_type?: unknown
}

function errorResponse(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status })
}

function hasMatchingState(request: Request, state: string | null) {
  if (!state) return true

  const cookieHeader = request.headers.get('cookie') || ''
  const cookie = cookieHeader.match(/(?:^|;\s*)melhor_envio_oauth_state=([^;]+)/)?.[1]
  return Boolean(cookie && decodeURIComponent(cookie) === state)
}

function readString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const providerError = searchParams.get('error')

  if (providerError) return errorResponse(400, 'O Melhor Envio recusou a autorização.')
  if (!code) return errorResponse(400, 'Código de autorização ausente.')
  if (!hasMatchingState(request, state)) return errorResponse(400, 'State OAuth inválido.')

  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET
  const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI || 'https://api.teknixbrasil.com.br/oauth/melhor-envio/callback'
  const userAgent = process.env.MELHOR_ENVIO_USER_AGENT

  if (!clientId || !clientSecret || !userAgent) {
    console.error('[Melhor Envio OAuth] configuração incompleta', {
      clientIdPresent: Boolean(clientId),
      clientSecretPresent: Boolean(clientSecret),
      userAgentPresent: Boolean(userAgent),
    })
    return errorResponse(500, 'Integração Melhor Envio não configurada.')
  }

  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
      cache: 'no-store',
    })

    const tokenData = await tokenResponse.json().catch(() => ({})) as TokenResponse
    const accessToken = readString(tokenData.access_token)
    const refreshToken = readString(tokenData.refresh_token)
    const expiresIn = typeof tokenData.expires_in === 'number' ? tokenData.expires_in : 2592000

    if (!tokenResponse.ok || !accessToken || !refreshToken) {
      console.error('[Melhor Envio OAuth] troca do código falhou', { status: tokenResponse.status })
      return errorResponse(502, 'Não foi possível obter o token do Melhor Envio.')
    }

    const supabase = createAdminClient()
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    const { data: marketplace, error: marketplaceError } = await supabase
      .from('marketplaces')
      .select('id')
      .eq('code', 'MELHOR_ENVIO')
      .maybeSingle()

    if (marketplaceError || !marketplace) {
      console.error('[Melhor Envio OAuth] marketplace não encontrado', { code: marketplaceError?.code })
      return errorResponse(500, 'Integração Melhor Envio não disponível.')
    }

    const { data: existingAccount, error: lookupError } = await supabase
      .from('marketplace_accounts')
      .select('id')
      .eq('marketplace_id', marketplace.id)
      .eq('seller_id', ACCOUNT_KEY)
      .maybeSingle()

    if (lookupError) {
      console.error('[Melhor Envio OAuth] consulta de credencial falhou', { code: lookupError.code })
      return errorResponse(500, 'Não foi possível persistir a autorização.')
    }

    const account = {
      marketplace_id: marketplace.id,
      account_name: 'Melhor Envio',
      seller_id: ACCOUNT_KEY,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt,
      status: 'ACTIVE',
      metadata: { token_type: readString(tokenData.token_type) || 'Bearer', authorized_at: now },
      updated_at: now,
    }

    const persistence = existingAccount
      ? await supabase.from('marketplace_accounts').update(account).eq('id', existingAccount.id)
      : await supabase.from('marketplace_accounts').insert({ ...account, created_at: now })

    if (persistence.error) {
      console.error('[Melhor Envio OAuth] persistência falhou', { code: persistence.error.code })
      return errorResponse(500, 'Não foi possível persistir a autorização.')
    }

    return NextResponse.json({ success: true, message: 'Autorização do Melhor Envio concluída.' })
  } catch (error) {
    console.error('[Melhor Envio OAuth] erro interno', {
      message: error instanceof Error ? error.message : 'unknown_error',
    })
    return errorResponse(500, 'Erro interno ao concluir a autorização.')
  }
}