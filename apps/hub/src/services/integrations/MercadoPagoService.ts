/* ==========================================================================
   TEKNIX MERCADO PAGO INTEGRATION SERVICE (SERVER-SIDE VIA EDGE PROXY)
   Nenhuma chamada direta para api.mercadopago.com no navegador.
   Tudo é processado no servidor (Edge Function) sem expor tokens.
   ========================================================================== */

import { EdgeProxy } from './EdgeProxy'
import { IntegrationStorage } from './storage'
import { HealthCheckResult } from './types'

export interface MercadoPagoPaymentRequest {
  orderId: string
  orderNumber: string
  amount: number
  description: string
  paymentMethod: 'pix' | 'credit_card' | 'ticket'
  payer: {
    email: string
    firstName: string
    lastName?: string
    identification?: {
      type: 'CPF' | 'CNPJ'
      number: string
    }
  }
  installments?: number
  token?: string
}

export class MercadoPagoService {
  /**
   * Executa teste de conexão no SERVIDOR via Edge Proxy.
   * O navegador NUNCA recebe o Access Token.
   */
  static async testConnection(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const config = await IntegrationStorage.getConfig('mercado_pago')

    if (!config?.has_credentials && config?.status === 'pending_credentials') {
      return {
        providerId: 'mercado_pago',
        providerName: 'Mercado Pago',
        status: 'pending_credentials',
        latencyMs: 0,
        checkedAt: new Date().toISOString(),
        message: 'Aguardando credencial. Insira seu Access Token no painel.'
      }
    }

    try {
      const response = await EdgeProxy.invoke('mercado_pago', 'health_check')
      const latencyMs = Date.now() - startTime
      const status = response.status || 'connected'

      await IntegrationStorage.updateHealthStatus('mercado_pago', status, latencyMs)

      return {
        providerId: 'mercado_pago',
        providerName: 'Mercado Pago',
        status,
        latencyMs,
        checkedAt: new Date().toISOString(),
        message: response.message || `Conectado com sucesso ao Mercado Pago.`,
        details: response
      }
    } catch (err: any) {
      return {
        providerId: 'mercado_pago',
        providerName: 'Mercado Pago',
        status: 'error',
        latencyMs: Date.now() - startTime,
        checkedAt: new Date().toISOString(),
        message: `Falha na verificação: ${err.message}`
      }
    }
  }

  /**
   * Cria Pagamento Pix Transparente NO SERVIDOR.
   */
  static async createPixPayment(req: MercadoPagoPaymentRequest) {
    return await EdgeProxy.invoke('mercado_pago', 'create_pix', req)
  }

  /**
   * Cria Preferência de Checkout Pro NO SERVIDOR.
   */
  static async createPreference(order: {
    id: string
    title: string
    price: number
    quantity: number
  }) {
    return await EdgeProxy.invoke('mercado_pago', 'create_preference', {
      ...order,
      originUrl: window.location.origin
    })
  }
}
