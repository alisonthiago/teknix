/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  MarketplaceOrder,
  MarketplaceListing,
  MarketplaceProduct,
  WebhookEvent,
  IntegrationResult,
  NOT_SUPPORTED,
  IntegrationCapability,
} from './types'

let _supabase: SupabaseClient<any> | null = null
function getSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabase
}

export abstract class BaseMarketplaceIntegration {
  abstract readonly marketplaceCode: string
  abstract readonly marketplaceName: string
  abstract readonly capabilities: IntegrationCapability[]

  supports(capability: IntegrationCapability): boolean {
    return this.capabilities.includes(capability)
  }

  async getConnection(userId: string) {
    const { data, error } = await getSupabase()
      .from('marketplace_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('marketplace_id', this.marketplaceCode.toLowerCase())
      .single()

    if (error || !data) return null
    return data
  }

  async connect(userId: string, sellerId: string, accessToken: string, refreshToken?: string, expiresAt?: string, accountName?: string): Promise<IntegrationResult> {
    const { error } = await getSupabase()
      .from('marketplace_connections')
      .upsert({
        user_id: userId,
        marketplace_id: this.marketplaceCode.toLowerCase(),
        seller_id: sellerId,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        token_expires_at: expiresAt || null,
        account_name: accountName || null,
        status: 'CONNECTED',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, marketplace_id, seller_id' })

    if (error) return { success: false, error: error.message }
    return { success: true, data: null }
  }

  async disconnect(userId: string): Promise<IntegrationResult> {
    const { error } = await getSupabase()
      .from('marketplace_connections')
      .update({
        status: 'DISCONNECTED',
        disconnected_at: new Date().toISOString(),
        access_token: 'REMOVED',
        refresh_token: 'REMOVED',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('marketplace_id', this.marketplaceCode.toLowerCase())

    if (error) return { success: false, error: error.message }
    return { success: true, data: null }
  }

  async getOrders(_userId: string, _token: string): Promise<IntegrationResult<MarketplaceOrder[]>> {
    return NOT_SUPPORTED
  }

  async getOrder(_token: string, _orderId: string): Promise<IntegrationResult<MarketplaceOrder>> {
    return NOT_SUPPORTED
  }

  async getListings(_token: string): Promise<IntegrationResult<MarketplaceListing[]>> {
    return NOT_SUPPORTED
  }

  async getProducts(_token: string): Promise<IntegrationResult<MarketplaceProduct[]>> {
    return NOT_SUPPORTED
  }

  async processWebhook(_event: WebhookEvent): Promise<IntegrationResult> {
    return NOT_SUPPORTED
  }

  async syncOrders(_userId: string, _token: string): Promise<IntegrationResult> {
    return NOT_SUPPORTED
  }

  async syncProducts(_userId: string, _token: string): Promise<IntegrationResult> {
    return NOT_SUPPORTED
  }

  async updateInventory(_token: string, _externalId: string, _quantity: number): Promise<IntegrationResult> {
    return NOT_SUPPORTED
  }

  async updatePrice(_token: string, _externalId: string, _price: number): Promise<IntegrationResult> {
    return NOT_SUPPORTED
  }

  async getMessages(_token: string): Promise<IntegrationResult> {
    return NOT_SUPPORTED
  }

  async subscribeWebhooks(_userId: string, _token: string): Promise<IntegrationResult> {
    return NOT_SUPPORTED
  }

  async refreshToken(_userId: string): Promise<IntegrationResult<string>> {
    return NOT_SUPPORTED
  }
}
