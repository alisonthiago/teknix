import { createClient } from '@supabase/supabase-js'

type VercelRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  url?: string
}

type VercelResponse = {
  status(code: number): VercelResponse
  json(body: unknown): VercelResponse
}

type TokenResponse = {
  access_token?: unknown
  refresh_token?: unknown
  expires_in?: unknown
  token_type?: unknown
}

const TOKEN_URL = 'https://melhorenvio.com.br/oauth/token'
const ACCOUNT_KEY = 'melhor-envio'

function header(request: VercelRequest, name: string): string | undefined {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

function errorResponse(response: VercelResponse, status: number, error: string) {
  return response.status(status).json({ success: false, error })
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function hasMatchingState(request: VercelRequest, state: string | null): boolean {
  if (!state) return false

  const cookieHeader = header(request, 'cookie') || ''
  const cookie = cookieHeader.match(/(?:^|;\s*)melhor_envio_oauth_state=([^;]+)/)?.[1]
  if (!cookie) return false

  try {
    return decodeURIComponent(cookie) === state
  } catch {
    return false
  }
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuração do Supabase ausente')

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ success: false, error: 'Método não permitido.' })
  }

  const requestUrl = new URL(request.url || '/', 'https://api.teknixbrasil.com.br')
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const providerError = requestUrl.searchParams.get('error')

  if (!hasMatchingState(request, state)) return errorResponse(response, 400, 'State OAuth inválido.')
  if (providerError) return errorResponse(response, 400, 'O Melhor Envio recusou a autorização.')
  if (!code) return errorResponse(response, 400, 'Código de autorização ausente.')

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
    return errorResponse(response, 500, 'Integração Melhor Envio não configurada.')
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
    })

    const tokenData = await tokenResponse.json().catch(() => ({})) as TokenResponse
    const accessToken = readString(tokenData.access_token)
    const refreshToken = readString(tokenData.refresh_token)
    const expiresIn = typeof tokenData.expires_in === 'number' ? tokenData.expires_in : 2592000

    if (!tokenResponse.ok || !accessToken || !refreshToken) {
      console.error('[Melhor Envio OAuth] troca do código falhou', { status: tokenResponse.status })
      return errorResponse(response, 502, 'Não foi possível obter o token do Melhor Envio.')
    }

    const supabase = getAdminClient()
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    const { data: marketplace, error: marketplaceError } = await supabase
      .from('marketplaces')
      .select('id')
      .eq('code', 'MELHOR_ENVIO')
      .maybeSingle()

    if (marketplaceError || !marketplace) {
      console.error('[Melhor Envio OAuth] marketplace não encontrado', { code: marketplaceError?.code })
      return errorResponse(response, 500, 'Integração Melhor Envio não disponível.')
    }

    const { data: existingAccount, error: lookupError } = await supabase
      .from('marketplace_accounts')
      .select('id')
      .eq('marketplace_id', marketplace.id)
      .eq('seller_id', ACCOUNT_KEY)
      .maybeSingle()

    if (lookupError) {
      console.error('[Melhor Envio OAuth] consulta de credencial falhou', { code: lookupError.code })
      return errorResponse(response, 500, 'Não foi possível persistir a autorização.')
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
      return errorResponse(response, 500, 'Não foi possível persistir a autorização.')
    }

    return response.status(200).json({ success: true, message: 'Autorização do Melhor Envio concluída.' })
  } catch (error) {
    console.error('[Melhor Envio OAuth] erro interno', {
      message: error instanceof Error ? error.message : 'unknown_error',
    })
    return errorResponse(response, 500, 'Erro interno ao concluir a autorização.')
  }
}