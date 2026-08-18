import { BaseMarketplaceIntegration } from './base'
import { IntegrationCapability, IntegrationResult, MarketplaceOrder } from './types'

export class MercadoLivreIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'MERCADO_LIVRE'
  readonly marketplaceName = 'Mercado Livre'
  readonly capabilities: IntegrationCapability[] = [
    'connect', 'disconnect', 'refreshToken',
    'getOrders', 'getOrder', 'getListings', 'getProducts',
    'processWebhook', 'syncOrders', 'syncProducts',
    'updateInventory', 'updatePrice', 'getMessages',
    'subscribeWebhooks'
  ]

  private getApiBase() {
    return 'https://api.mercadolibre.com'
  }

  private async makeRequest(token: string, endpoint: string) {
    const res = await fetch(`${this.getApiBase()}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      throw new Error(`ML API error: ${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  async refreshToken(userId: string): Promise<IntegrationResult<string>> {
    const conn = await this.getConnection(userId)
    if (!conn) return { success: false, error: 'Conexão não encontrada' }
    if (!conn.refresh_token) return { success: false, error: 'Refresh token não encontrado' }

    const res = await fetch(`${this.getApiBase()}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.MERCADOLIVRE_CLIENT_ID!,
        client_secret: process.env.MERCADOLIVRE_CLIENT_SECRET!,
        refresh_token: conn.refresh_token
      })
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: 'Falha ao renovar token' }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
    const { error } = await getSupabase()
      .from('marketplace_connections')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', conn.id)

    if (error) return { success: false, error: error.message }
    return { success: true, data: data.access_token }
  }

  async getValidToken(userId: string): Promise<IntegrationResult<string>> {
    const conn = await this.getConnection(userId)
    if (!conn) return { success: false, error: 'ML não conectado' }
    if (conn.status !== 'CONNECTED') return { success: false, error: 'Conexão precisa de reautenticação' }

    const isExpired = new Date(conn.token_expires_at).getTime() - 5 * 60000 < Date.now()
    if (!isExpired) return { success: true, data: conn.access_token }

    return this.refreshToken(userId)
  }

  async getOrder(token: string, orderId: string): Promise<IntegrationResult<MarketplaceOrder>> {
    try {
      const data = await this.makeRequest(token, `/orders/${orderId}`)
      const order: MarketplaceOrder = {
        external_order_id: String(data.id),
        status: data.status,
        total_amount: data.total_amount,
        currency: data.currency_id || 'BRL',
        order_date: data.date_created,
        paid_at: data.payments?.[0]?.date_approved,
        items: (data.order_items || []).map((item: Record<string, unknown>) => ({
          external_item_id: String((item.item as Record<string, unknown>)?.id || ''),
          seller_sku: String((item.item as Record<string, unknown>)?.seller_sku || ''),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: Number(item.unit_price) * Number(item.quantity),
          sale_fee: Number(item.sale_fee || 0)
        })),
        raw_data: data
      }
      return { success: true, data: order }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async getOrders(token: string): Promise<IntegrationResult<MarketplaceOrder[]>> {
    try {
      const data = await this.makeRequest(token, '/orders/search?sort=date_desc&limit=50')
      const orders: MarketplaceOrder[] = (data.results || []).map((o: Record<string, unknown>) => ({
        external_order_id: String(o.id),
        status: String(o.status),
        total_amount: Number(o.total_amount),
        currency: String(o.currency_id || 'BRL'),
        order_date: String(o.date_created),
        paid_at: (o.payments as Array<Record<string, unknown>>)?.[0]?.date_approved as string,
        items: [],
        raw_data: o
      }))
      return { success: true, data: orders }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async subscribeWebhooks(_userId: string, _token: string): Promise<IntegrationResult> {
    // ML webhooks are configured via the ML app settings, not API
    return { success: true, data: null }
  }

  async processWebhook(event: { topic: string; resource: string; user_id?: string }): Promise<IntegrationResult> {
    // Handled by the existing webhookProcessor
    return { success: true, data: null }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
