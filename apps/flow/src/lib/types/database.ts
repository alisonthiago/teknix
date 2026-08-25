// Database types matching Supabase schema

export type UserRole = 'ADMIN' | 'OPERATOR' | 'GERENTE' | 'FINANCEIRO' | 'SEPARADOR' | 'EXPEDICAO' | 'VENDEDOR' | 'ESTOQUE' | 'CONSULTA'
export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED'
export type StockMovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'LOSS' | 'TRANSFER' | 'PICKING' | 'SHIPPING'

export interface Profile {
  id: string
  role: UserRole
  name: string
  email: string
  status: string
  last_login?: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  legal_name?: string | null
  cnpj?: string | null
  contact?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  website?: string | null
  city?: string | null
  state?: string | null
  delivery_time?: number | null
  min_order?: number | null
  freight?: number | null
  payment_terms?: string | null
  notes?: string | null
  user_id?: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  brand?: string | null
  model?: string | null
  ean?: string | null
  category?: string | null
  supplier_id?: string | null
  cost_purchase: number
  freight_purchase: number
  packaging_cost: number
  other_costs: number
  weight?: number | null
  width?: number | null
  height?: number | null
  length?: number | null
  stock: number
  min_stock: number
  status: EntityStatus
  notes?: string | null
  user_id?: string | null
  created_at: string
  updated_at: string
  // Joined
  suppliers?: Supplier
}

export interface Marketplace {
  id: string
  name: string
  code: string
  status: string
  type?: string
  logo?: string | null
  api_available?: boolean
  oauth_available?: boolean
  webhook_available?: boolean
  default_percentage_fee: number
  default_fixed_fee: number
  default_tax: number
  default_freight: number
  default_ads_fee: number
  other_fees: number
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface MarketplaceListing {
  id: string
  product_id: string
  marketplace_id: string
  marketplace_account_id?: string | null
  listing_code?: string | null
  listing_type?: string | null
  specific_percentage_fee?: number | null
  specific_fixed_fee?: number | null
  specific_tax?: number | null
  specific_freight?: number | null
  specific_ads_fee?: number | null
  specific_other_fees?: number | null
  price?: number | null
  status: string
  external_id?: string | null
  marketplace_url?: string | null
  category?: string | null
  stock_synced?: number | null
  created_at: string
  updated_at: string
  // Joined
  marketplaces?: Marketplace
  marketplace_accounts?: MarketplaceAccount
  products?: Product
}

export interface Purchase {
  id: string
  date: string
  supplier_id: string
  invoice?: string | null
  total_cost: number
  payment_method?: string | null
  notes?: string | null
  user_id?: string | null
  created_at: string
  updated_at: string
  // Joined
  suppliers?: Supplier
  purchase_items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  sku: string
  quantity: number
  unit_cost: number
  freight: number
  other_costs: number
  total_cost: number
  real_unit_cost: number
  user_id?: string | null
  // Joined
  products?: Product
}

export interface Sale {
  id: string
  date: string
  order_id?: string | null
  marketplace_id: string
  marketplace_account_id?: string | null
  total_revenue: number
  status: string
  user_id?: string | null
  created_at: string
  updated_at: string
  // Joined
  marketplaces?: Marketplace
  marketplace_accounts?: MarketplaceAccount
  sale_items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  sku: string
  quantity: number
  unit_price: number
  total_revenue: number
  fees: number
  taxes: number
  freight: number
  other_costs: number
  cogs: number
  profit: number
  margin: number
  user_id?: string | null
  // Joined
  products?: Product
}

export interface Order {
  id: string
  user_id: string
  marketplace_id?: string | null
  marketplace_account_id?: string | null
  order_number: string
  customer_name?: string | null
  customer_phone?: string | null
  status: string
  total_amount: number
  total_cost: number
  total_fees: number
  total_freight: number
  total_taxes: number
  profit: number
  margin: number
  notes?: string | null
  tracking_code?: string | null
  carrier?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
  // Joined
  marketplaces?: Marketplace
  marketplace_accounts?: MarketplaceAccount
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  sku: string
  quantity: number
  unit_price: number
  unit_cost: number
  fees: number
  freight: number
  taxes: number
  profit: number
  margin: number
  status: string
  // Joined
  products?: Product
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  user_id?: string | null
  from_status?: string | null
  to_status: string
  notes?: string | null
  created_at: string
}

export interface InventoryMovement {
  id: string
  user_id?: string | null
  product_id: string
  type: string
  quantity: number
  reference_id?: string | null
  reference_type?: string | null
  notes?: string | null
  external_order_id?: string | null
  marketplace_id?: string | null
  created_at: string
}

export interface Shipment {
  id: string
  user_id: string
  order_id: string
  marketplace_account_id?: string | null
  carrier?: string | null
  tracking_code?: string | null
  label_url?: string | null
  status: string
  weight?: number | null
  width?: number | null
  height?: number | null
  length?: number | null
  notes?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
  // Joined
  orders?: Order
}

export interface Permission {
  id: string
  code: string
  module: string
  description?: string | null
  created_at: string
}

export interface RolePermission {
  id: string
  role: UserRole
  permission_code: string
}

export interface UserPermission {
  id: string
  user_id: string
  permission_code: string
  granted: boolean
}

export interface AuditLog {
  id: string
  user_id?: string | null
  entity: string
  entity_id: string
  action: string
  old_data?: Record<string, unknown> | null
  new_data?: Record<string, unknown> | null
  created_at: string
}

export interface Notification {
  id: string
  user_id?: string | null
  type: string
  title: string
  message: string
  marketplace_id?: string | null
  resource?: string | null
  resource_id?: string | null
  is_read: boolean
  created_at: string
}

export interface MarketplaceAccount {
  id: string
  marketplace_id: string
  account_name: string
  display_name?: string | null
  seller_id?: string | null
  store_id?: string | null
  external_account_id?: string | null
  cnpj?: string | null
  legal_name?: string | null
  email?: string | null
  phone?: string | null
  status: string
  connection_status: string
  access_token_encrypted?: string | null
  refresh_token_encrypted?: string | null
  token_expires_at?: string | null
  oauth_scopes?: string | null
  last_sync_at?: string | null
  last_webhook_at?: string | null
  last_error_at?: string | null
  last_error_message?: string | null
  default_percentage_fee?: number | null
  default_fixed_fee?: number | null
  default_tax?: number | null
  default_freight?: number | null
  default_ads_fee?: number | null
  created_by?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  // Joined
  marketplaces?: Marketplace
}

export interface UserMarketplaceAccount {
  id: string
  user_id: string
  marketplace_account_id: string
  permission_level: string
  created_at: string
}

export interface MarketplaceWebhookEvent {
  id: string
  marketplace_id: string
  marketplace_account_id?: string | null
  topic?: string | null
  resource?: string | null
  resource_id?: string | null
  external_event_id?: string | null
  seller_id?: string | null
  payload_hash?: string | null
  raw_payload?: Record<string, unknown> | null
  status: string
  attempts: number
  received_at: string
  processed_at?: string | null
  error_message?: string | null
  created_at: string
  // Joined
  marketplaces?: Marketplace
  marketplace_accounts?: MarketplaceAccount
}

export interface IntegrationLog {
  id: string
  marketplace_id?: string | null
  marketplace_account_id?: string | null
  endpoint?: string | null
  method?: string | null
  status_code?: number | null
  duration_ms?: number | null
  request_id?: string | null
  error?: string | null
  created_at: string
}

export interface SyncJob {
  id: string
  marketplace_id: string
  marketplace_account_id: string
  job_type: string
  status: string
  started_at?: string | null
  finished_at?: string | null
  records_processed: number
  records_created: number
  records_updated: number
  errors: number
  error_message?: string | null
  created_at: string
}

export interface MarketplaceConnection {
  id: string
  user_id: string
  marketplace_id: string
  seller_id: string
  access_token: string
  refresh_token?: string | null
  token_expires_at?: string | null
  scope?: string | null
  status: string
  account_name?: string | null
  last_sync_at?: string | null
  last_webhook_at?: string | null
  created_at: string
  updated_at: string
  disconnected_at?: string | null
}
