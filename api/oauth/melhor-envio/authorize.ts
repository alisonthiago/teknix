import { randomBytes } from 'node:crypto'

type VercelRequest = {
  method?: string
}

type VercelResponse = {
  status(code: number): VercelResponse
  json(body: unknown): VercelResponse
  setHeader(name: string, value: string): VercelResponse
  redirect(url: string): VercelResponse
}

const AUTHORIZATION_URL = 'https://melhorenvio.com.br/oauth/authorize'
const DEFAULT_REDIRECT_URI = 'https://api.teknixbrasil.com.br/oauth/melhor-envio/callback'
const STATE_COOKIE = 'melhor_envio_oauth_state'
const STATE_MAX_AGE_SECONDS = 600

function errorResponse(response: VercelResponse, status: number, error: string) {
  return response.status(status).json({ success: false, error })
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    return errorResponse(response, 405, 'Método não permitido.')
  }

  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID
  const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI || DEFAULT_REDIRECT_URI

  if (!clientId) {
    console.error('[Melhor Envio OAuth] client ID não configurado')
    return errorResponse(response, 500, 'Integração Melhor Envio não configurada.')
  }

  const state = randomBytes(32).toString('hex')
  const authorizationUrl = new URL(AUTHORIZATION_URL)
  authorizationUrl.searchParams.set('client_id', clientId)
  authorizationUrl.searchParams.set('redirect_uri', redirectUri)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('state', state)

  response.setHeader(
    'Set-Cookie',
    `${STATE_COOKIE}=${encodeURIComponent(state)}; Max-Age=${STATE_MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`,
  )

  return response.redirect(authorizationUrl.toString())
}