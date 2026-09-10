export type FlowChannelCode = 'MERCADO_LIVRE' | 'SHOPEE' | 'AMAZON' | 'MAGALU' | 'TIKTOK_SHOP' | (string & {})

export interface FlowListingInput {
  channelId: string
  externalId: string
  sku?: string | null
  title?: string | null
  price?: number | null
  stockQuantity?: number | null
  rawData?: Record<string, unknown>
}

export interface FlowWebhookInput {
  channelId?: string | null
  eventKey: string
  topic: string
  resource?: string | null
  payload: Record<string, unknown>
}

export interface FlowMatchResult {
  status: 'MATCHED' | 'PENDING' | 'NONE'
  productId?: string
  reason: string
}