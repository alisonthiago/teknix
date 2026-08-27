/* ==========================================================================
   TEKNIX SECURE INTEGRATION STORAGE (Write-Only / Sanitized Statuses)
   O frontend NUNCA tem acesso de leitura aos tokens.
   Apenas grava (Write-Only) e lê status (Conectado / Aguardando / Erro).
   ========================================================================== */

import { supabase } from '../../lib/supabase'
import { IntegrationConfig, IntegrationLog, HealthCheckResult } from './types'

export class IntegrationStorage {
  /**
   * Obtém todas as configurações sanitizadas (SEM tokens expostos).
   * Usa a RPC segura fn_get_integration_statuses ou a view higienizada.
   */
  static async getConfigs(): Promise<IntegrationConfig[]> {
    try {
      const { data, error } = await supabase.rpc('fn_get_integration_statuses')

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          ...row,
          credentials: {}, // Zero tokens no frontend
          has_credentials: Boolean(row.has_credentials)
        }))
      }

      // Fallback para select na view higienizada
      const { data: viewData, error: viewError } = await supabase
        .from('vw_integration_statuses')
        .select('*')

      if (!viewError && viewData && viewData.length > 0) {
        return viewData.map((row: any) => ({
          ...row,
          credentials: {},
          has_credentials: Boolean(row.has_credentials)
        }))
      }

      // Fallback seguro da tabela se a migration 006 ainda não foi aplicada
      const { data: rawData } = await supabase
        .from('integration_configs')
        .select('id, name, category, status, environment, enabled, webhook_url, last_sync_at, last_health_check_at, health_latency_ms, error_message, created_at, updated_at')

      return (rawData || []).map((row: any) => ({
        ...row,
        credentials: {},
        has_credentials: row.status === 'connected' || row.status === 'sandbox'
      }))
    } catch (err: any) {
      console.warn('Aviso ao carregar integrações:', err.message)
      return []
    }
  }

  /**
   * Obtém configuração sanitizada de um único provedor.
   */
  static async getConfig(id: string): Promise<IntegrationConfig | null> {
    const configs = await this.getConfigs()
    return configs.find(c => c.id === id) || null
  }

  /**
   * Salva credenciais em modo WRITE-ONLY.
   * O token é transmitido ao banco via RPC segura e nunca retorna ao frontend.
   */
  static async saveConfig(config: Partial<IntegrationConfig> & { id: string }): Promise<void> {
    try {
      const webhookUrl = config.webhookUrl || (config as any).webhook_url || null
      const { error: rpcError } = await supabase.rpc('fn_save_integration_credentials', {
        p_id: config.id,
        p_credentials: config.credentials && Object.keys(config.credentials).length > 0 ? config.credentials : null,
        p_environment: config.environment || 'sandbox',
        p_enabled: config.enabled ?? true,
        p_webhook_url: webhookUrl
      })

      if (rpcError) {
        // Fallback para update direto caso a RPC ainda não exista
        await supabase
          .from('integration_configs')
          .update({
            credentials: config.credentials || {},
            environment: config.environment || 'sandbox',
            enabled: config.enabled ?? true,
            webhook_url: webhookUrl,
            status: config.credentials && Object.values(config.credentials).some(Boolean) ? 'connected' : 'pending_credentials',
            updated_at: new Date().toISOString()
          })
          .eq('id', config.id)
      }
    } catch (err: any) {
      console.error('Erro ao salvar credenciais:', err)
      throw err
    }
  }

  /**
   * Atualiza status de saúde do provedor.
   */
  static async updateHealthStatus(
    id: string,
    status: 'connected' | 'sandbox' | 'error' | 'pending_credentials',
    latencyMs?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('integration_configs')
        .update({
          status,
          last_health_check_at: new Date().toISOString(),
          health_latency_ms: latencyMs || 0,
          error_message: errorMessage || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    } catch (err) {
      console.warn('Aviso ao atualizar status de saúde:', err)
    }
  }

  /**
   * Registra log de auditoria da integração.
   */
  static async addLog(log: Omit<IntegrationLog, 'id' | 'created_at'>): Promise<void> {
    try {
      await supabase
        .from('integration_logs')
        .insert({
          provider_id: log.providerId,
          category: log.category,
          action: log.action,
          status: log.status,
          order_id: log.orderId,
          order_number: log.orderNumber,
          latency_ms: log.latencyMs,
          request_payload: log.requestPayload ? JSON.parse(JSON.stringify(log.requestPayload)) : null,
          response_payload: log.responsePayload ? JSON.parse(JSON.stringify(log.responsePayload)) : null,
          error_message: log.errorMessage,
          can_reprocess: log.canReprocess || false,
          created_at: new Date().toISOString()
        })
    } catch (err) {
      console.warn('Aviso ao salvar log de integração:', err)
    }
  }

  /**
   * Limpa histórico de logs.
   */
  static async clearLogs(): Promise<void> {
    try {
      await supabase.from('integration_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    } catch (err) {
      console.warn('Aviso ao limpar logs:', err)
    }
  }

  /**
   * Busca logs de auditoria recentes.
   */
  static async getLogs(limit = 50, providerId?: string): Promise<IntegrationLog[]> {
    try {
      let query = supabase
        .from('integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (providerId) {
        query = query.eq('provider_id', providerId)
      }

      const { data, error } = await query
      if (error) return []

      return (data || []).map((row: any) => ({
        id: row.id,
        providerId: row.provider_id,
        category: row.category,
        action: row.action,
        status: row.status,
        orderId: row.order_id,
        orderNumber: row.order_number,
        latencyMs: row.latency_ms,
        requestPayload: row.request_payload,
        responsePayload: row.response_payload,
        errorMessage: row.error_message,
        canReprocess: row.can_reprocess,
        createdAt: row.created_at
      }))
    } catch {
      return []
    }
  }
}
