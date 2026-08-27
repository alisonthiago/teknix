/* ==========================================================================
   TEKNIX WEBHOOK ENGINE — IDEMPOTÊNCIA PERSISTENTE (SUPABASE)
   A verificação de eventos duplicados usa a tabela webhook_events.
   Reinicialização de servidor NÃO perde o histórico de eventos.
   ========================================================================== */

import { supabase } from '../../lib/supabase'
import { IntegrationStorage } from './storage'
import { IntegrationProviderId } from './types'
import { workflowManager } from '../workflow'

export class WebhookEngine {
  /**
   * Gera hash único e determinístico do evento.
   * Formato: provider:eventId:eventType
   */
  private static generateEventHash(
    providerId: string,
    eventId: string,
    eventType: string
  ): string {
    return `${providerId}:${eventId}:${eventType}`
  }

  /**
   * Verifica no banco se o evento já foi processado.
   * Idempotência real — persiste entre restarts.
   */
  private static async isEventAlreadyProcessed(eventHash: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('event_hash', eventHash)
      .in('status', ['processed', 'ignored_duplicate'])
      .maybeSingle()

    if (error) {
      console.error('[WebhookEngine] Erro ao verificar idempotência:', error.message)
      // Em caso de erro de banco, permite processamento (fail-open)
      return false
    }

    return !!data
  }

  /**
   * Registra o início do processamento no banco.
   * Cria o registro com status 'received' antes de processar.
   */
  private static async registerEvent(params: {
    eventHash: string
    providerId: string
    eventType: string
    eventId?: string
    payload: any
  }): Promise<string | null> {
    const { data, error } = await supabase
      .from('webhook_events')
      .insert([{
        event_hash: params.eventHash,
        provider_id: params.providerId,
        event_type: params.eventType,
        event_id: params.eventId,
        status: 'received',
        payload: params.payload,
        received_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (error) {
      console.error('[WebhookEngine] Erro ao registrar evento:', error.message)
      return null
    }

    return data?.id || null
  }

  /**
   * Atualiza o status final do evento no banco.
   */
  private static async updateEventStatus(
    rowId: string,
    status: 'processed' | 'ignored_duplicate' | 'failed',
    result?: any,
    errorMessage?: string
  ): Promise<void> {
    await supabase
      .from('webhook_events')
      .update({
        status,
        result,
        error_message: errorMessage,
        processed_at: new Date().toISOString()
      })
      .eq('id', rowId)
  }

  /**
   * Classifica a categoria do evento pelo provider ID
   */
  private static getCategory(providerId: IntegrationProviderId) {
    if (providerId === 'mercado_pago' || providerId === 'asaas') return 'payment'
    if (providerId === 'focus_nfe' || providerId === 'bling') return 'fiscal'
    if (providerId === 'melhor_envio' || providerId === 'frenet') return 'shipping'
    return 'channel'
  }

  /**
   * Processa Webhook com garantia de Idempotência via banco.
   *
   * Fluxo:
   * 1. Gera hash único do evento
   * 2. Verifica no banco se já foi processado (não em memória!)
   * 3. Se duplicado → retorna 'ignored_duplicate' sem ação
   * 4. Se novo → registra, processa, marca como 'processed'
   */
  static async processWebhook(params: {
    providerId: IntegrationProviderId
    eventId?: string
    eventType: string
    payload: any
  }): Promise<{
    status: 'processed' | 'ignored_duplicate' | 'error'
    message: string
    result?: any
  }> {
    const { providerId, eventId, eventType, payload } = params
    const resolvedEventId = eventId || payload?.id || payload?.data?.id || `auto-${Date.now()}`
    const eventHash = this.generateEventHash(providerId, resolvedEventId, eventType)
    const category = this.getCategory(providerId)

    // -------------------------------------------------------------------------
    // 1. Verificação de Idempotência no banco (persistente)
    // -------------------------------------------------------------------------
    const isDuplicate = await this.isEventAlreadyProcessed(eventHash)
    if (isDuplicate) {
      console.warn(`[WebhookEngine] Evento duplicado ignorado (banco): ${eventHash}`)

      await IntegrationStorage.addLog({
        providerId,
        category,
        action: `webhook.${eventType}.ignored_duplicate`,
        status: 'success',
        requestPayload: payload,
        responsePayload: { reason: 'Duplicate event discarded — idempotency check (Supabase)' }
      })

      return {
        status: 'ignored_duplicate',
        message: 'Evento já processado anteriormente. Nenhuma ação duplicada foi executada.'
      }
    }

    // -------------------------------------------------------------------------
    // 2. Registra evento (status: received) ANTES de processar
    // -------------------------------------------------------------------------
    const rowId = await this.registerEvent({
      eventHash,
      providerId,
      eventType,
      eventId: resolvedEventId,
      payload
    })

    // -------------------------------------------------------------------------
    // 3. Processa de acordo com o tipo de evento
    // -------------------------------------------------------------------------
    try {
      let workflowResult: any = null

      if (
        providerId === 'mercado_pago' &&
        (eventType === 'payment.created' || eventType === 'payment.updated' || eventType === 'payment.approved')
      ) {
        const orderData = {
          id: payload?.data?.id || payload?.order_id || 'unknown',
          order_number: payload?.order_number || `TK-${Date.now()}`,
          total: payload?.transaction_amount || 0,
          customer_name: payload?.payer?.first_name || 'Cliente',
          customer_doc: payload?.payer?.identification?.number || '',
          customer_email: payload?.payer?.email || ''
        }

        workflowResult = await workflowManager.handlePaymentApproved(orderData)
      }

      // 4. Marca como processado no banco
      if (rowId) {
        await this.updateEventStatus(rowId, 'processed', workflowResult)
      }

      await IntegrationStorage.addLog({
        providerId,
        category,
        action: `webhook.${eventType}`,
        status: 'success',
        requestPayload: payload,
        responsePayload: workflowResult
      })

      return {
        status: 'processed',
        message: `Webhook ${eventType} processado com sucesso.`,
        result: workflowResult
      }
    } catch (err: any) {
      console.error(`[WebhookEngine] Erro ao processar ${eventType}:`, err.message)

      if (rowId) {
        await this.updateEventStatus(rowId, 'failed', null, err.message)
      }

      await IntegrationStorage.addLog({
        providerId,
        category,
        action: `webhook.${eventType}`,
        status: 'error',
        requestPayload: payload,
        errorMessage: err.message,
        canReprocess: true
      })

      return {
        status: 'error',
        message: `Falha ao processar webhook: ${err.message}`
      }
    }
  }
}
