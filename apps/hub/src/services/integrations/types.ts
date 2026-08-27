/* ==========================================================================
   TEKNIX INTEGRATION HUB — TYPES & CONTRACTS
   ========================================================================== */

export type IntegrationProviderId =
  | 'mercado_pago'
  | 'asaas'
  | 'stripe'
  | 'pagarme'
  | 'focus_nfe'
  | 'bling'
  | 'enotas'
  | 'melhor_envio'
  | 'frenet'
  | 'kangu'
  | 'correios'
  | 'site_teknix'
  | 'mercadolivre'

export type IntegrationCategory = 'payment' | 'fiscal' | 'shipping' | 'channel'

export type IntegrationStatus = 'connected' | 'sandbox' | 'disconnected' | 'error' | 'pending_credentials'

export interface IntegrationConfig {
  id: IntegrationProviderId
  name: string
  category: IntegrationCategory
  status: IntegrationStatus
  environment: 'production' | 'sandbox'
  enabled: boolean
  credentials?: Record<string, string>
  has_credentials?: boolean
  lastSyncAt?: string
  lastHealthCheckAt?: string
  healthLatencyMs?: number
  errorMessage?: string
  webhookUrl?: string
  webhookSecret?: string
}

export interface IntegrationLog {
  id: string
  timestamp?: string
  providerId: IntegrationProviderId
  category: IntegrationCategory
  action: string // e.g. 'payment.create', 'nfe.emit', 'shipping.label', 'webhook.receive'
  status: 'success' | 'error' | 'pending' | 'reprocessed'
  orderId?: string
  orderNumber?: string
  latencyMs?: number
  requestPayload?: any
  responsePayload?: any
  errorMessage?: string
  canReprocess?: boolean
  createdAt?: string
}

export interface WebhookEventRecord {
  eventId: string
  providerId: IntegrationProviderId
  eventType: string
  receivedAt: string
  processedAt?: string
  status: 'processed' | 'ignored_duplicate' | 'failed'
  payloadHash: string
  rawPayload: any
  errorMessage?: string
}

export interface HealthCheckResult {
  providerId: IntegrationProviderId
  providerName: string
  status: IntegrationStatus
  latencyMs: number
  checkedAt: string
  message: string
  details?: any
}
