/* ==========================================================================
   TEKNIX — Cliente Roteia AI (OpenAI-compatible)
   Base: https://api.roteia.ai/v1
   Modelo padrão: openai/gpt-5.6-sol
   ========================================================================== */

const ROTEIA_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ROTEIA_BASE_URL) ||
  'https://api.roteia.ai/v1'

const ROTEIA_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ROTEIA_API_KEY) ||
  ''

const ROTEIA_DEFAULT_MODEL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ROTEIA_MODEL) ||
  'openai/gpt-5.6-sol'

export type RoteiaChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type RoteiaChatCompletion = {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: { role: string; content: string }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export function isRoteiaConfigured(): boolean {
  return Boolean(ROTEIA_API_KEY && ROTEIA_BASE_URL)
}

export async function createRoteiaChatCompletion(params: {
  messages: RoteiaChatMessage[]
  model?: string
  temperature?: number
}): Promise<RoteiaChatCompletion> {
  if (!ROTEIA_API_KEY) {
    throw new Error('Roteia não configurada: defina VITE_ROTEIA_API_KEY no .env')
  }

  const res = await fetch(`${ROTEIA_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ROTEIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model || ROTEIA_DEFAULT_MODEL,
      messages: params.messages,
      ...(typeof params.temperature === 'number' ? { temperature: params.temperature } : {}),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.error?.message || data?.message || `Roteia HTTP ${res.status}`
    throw new Error(message)
  }

  return data as RoteiaChatCompletion
}

export async function roteiaQuickReply(prompt: string, model?: string): Promise<string> {
  const result = await createRoteiaChatCompletion({
    model,
    messages: [{ role: 'user', content: prompt }],
  })
  return result.choices?.[0]?.message?.content?.trim() || ''
}
