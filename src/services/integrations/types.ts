export interface MarketplaceOrder {
  external_order_id: string
  status: string
  total_amount: number
  currency: string
  order_date: string
  paid_at?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  customer_name?: string
  items: MarketplaceOrderItem[]
  raw_data: Record<string, unknown>
}

export interface MarketplaceOrderItem {
  external_item_id: string
  seller_sku?: string
  quantity: number
  unit_price: number
  total_price: number
  sale_fee?: number
}

export interface MarketplaceListing {
  external_id: string
  sku?: string
  title: string
  price: number
  stock_quantity: number
  status: string
  url?: string
  category?: string
  raw_data?: Record<string, unknown>
}

export interface MarketplaceProduct {
  external_id: string
  sku?: string
  title: string
  price: number
  stock_quantity: number
  status: string
  raw_data?: Record<string, unknown>
}

export interface MarketplacePayment {
  external_id: string
  status: string
  amount: number
  fee: number
  net_amount: number
  date: string
}

export interface WebhookEvent {
  topic: string
  resource: string
  resource_id?: string
  user_id?: string
  payload: Record<string, unknown>
}

export type IntegrationCapability = 'connect' | 'disconnect' | 'refreshToken' | 'getOrders' | 'getOrder' | 'getProducts' | 'getProduct' | 'getListings' | 'getListing' | 'getPayments' | 'getShipment' | 'getInventory' | 'updateInventory' | 'updatePrice' | 'getMessages' | 'subscribeWebhooks' | 'processWebhook' | 'syncOrders' | 'syncProducts' | 'syncInventory'

export type IntegrationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export const NOT_SUPPORTED = { success: false as const, error: 'NOT_SUPPORTED', code: 'NOT_SUPPORTED' }
