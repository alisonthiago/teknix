import { supabase } from '../lib/supabase'

export interface MelhorEnvioQuote {
  id?: number | string
  name?: string
  price?: number | string
  delivery_time?: number | string
  delivery_range?: { min?: number; max?: number }
  company?: { name?: string }
  error?: string
}

interface ProxyResponse {
  success?: boolean
  status?: string
  message?: string
  error?: string
  user?: string
  quotes?: MelhorEnvioQuote[]
}

const originPostalCode = (import.meta.env.VITE_MELHOR_ENVIO_ORIGIN_POSTAL_CODE || '01310-100').replace(/\D/g, '')

async function invoke(action: string, payload: Record<string, unknown> = {}): Promise<ProxyResponse> {
  const { data, error } = await supabase.functions.invoke('integrations-proxy', {
    body: { provider: 'melhor_envio', action, payload },
  })

  if (error) throw new Error(error.message || 'Não foi possível acessar a API da TEKNIX.')
  if (!data || data.success === false) throw new Error(data?.error || 'A API da TEKNIX retornou um erro.')
  return data
}

export async function checkMelhorEnvio(): Promise<ProxyResponse> {
  return invoke('health_check')
}

export async function calculateMelhorEnvioQuote(toPostalCode: string): Promise<MelhorEnvioQuote[]> {
  const response = await invoke('calculate_quote', {
    from: { postal_code: originPostalCode },
    to: { postal_code: toPostalCode.replace(/\D/g, '') },
    products: [{ id: 'teknix-test-item', width: 20, height: 15, length: 30, weight: 1.2, quantity: 1 }],
  })

  if (response.status === 'pending_credentials' || response.status === 'error') {
    throw new Error(response.message || 'A integração Melhor Envio não está disponível para testes.')
  }
  return Array.isArray(response.quotes) ? response.quotes : []
}