/* ==========================================================================
   TEKNIX FOCUS NFE FISCAL SERVICE (SERVER-SIDE VIA EDGE PROXY)
   Nenhuma chamada direta para api.focusnfe.com.br no navegador.
   Tudo é processado no servidor (Edge Function) sem expor tokens.
   ========================================================================== */

import { EdgeProxy } from './EdgeProxy'
import { IntegrationStorage } from './storage'
import { HealthCheckResult } from './types'

export class FocusNfeService {
  /**
   * Executa teste de conexão no SERVIDOR via Edge Proxy.
   */
  static async testConnection(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const config = await IntegrationStorage.getConfig('focus_nfe')

    if (!config?.has_credentials && config?.status === 'pending_credentials') {
      return {
        providerId: 'focus_nfe',
        providerName: 'Focus NFe',
        status: 'pending_credentials',
        latencyMs: 0,
        checkedAt: new Date().toISOString(),
        message: 'Aguardando credencial. Insira seu Token da Focus NFe no painel.'
      }
    }

    try {
      const response = await EdgeProxy.invoke('focus_nfe', 'health_check')
      const latencyMs = Date.now() - startTime
      const status = response.status || 'connected'

      await IntegrationStorage.updateHealthStatus('focus_nfe', status, latencyMs)

      return {
        providerId: 'focus_nfe',
        providerName: 'Focus NFe',
        status,
        latencyMs,
        checkedAt: new Date().toISOString(),
        message: response.message || `Autenticado na SEFAZ.`,
        details: response
      }
    } catch (e: any) {
      return {
        providerId: 'focus_nfe',
        providerName: 'Focus NFe',
        status: 'error',
        latencyMs: Date.now() - startTime,
        checkedAt: new Date().toISOString(),
        message: `Falha na requisição: ${e.message}`
      }
    }
  }

  /**
   * Emite NF-e NO SERVIDOR via Edge Proxy.
   */
  static async emitNfe(order: any) {
    const ref = `TK-${order.order_number?.replace(/\D/g, '') || order.id || Date.now()}`
    return await EdgeProxy.invoke('focus_nfe', 'emit_nfe', { ref, nfeData: order })
  }

  /**
   * Consulta status de uma NF-e NO SERVIDOR.
   */
  static async consultNfe(ref: string) {
    return await EdgeProxy.invoke('focus_nfe', 'consult_nfe', { ref })
  }
}
