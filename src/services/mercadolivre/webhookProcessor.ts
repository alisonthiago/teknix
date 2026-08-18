/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { syncOrder } from './syncOrder'

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

const PROCESSED_TOPICS = [
  'orders_v2',
  'orders',
  'items',
  'items_prices',
  'questions',
  'messages',
  'shipments',
  'payments',
  'catalog',
  'promotions',
  'user_products_families',
]

const LOG_ONLY_TOPICS = [
  'orders feedback',
  'insurance messages',
  'stock-locations',
  'item competition',
  'catalog suggestions',
  'fbm stock operations',
  'flex-handshakes',
  'public offers',
  'public candidates',
  'Price Suggestion',
  'vis leads',
  'whatsapp',
  'call',
  'quotations',
  'Visit Request',
  'Contact Request',
  'Reservation',
  'Post Purchase',
  'Claims',
  'Claims Actions',
  'payments',
  'invoices',
  'leads-credits',
]

export async function processWebhook(eventId: string, payload: Record<string, unknown>) {
  try {
    await updateStatus(eventId, 'PROCESSING')

    const { topic, resource, user_id } = payload as { topic: string; resource: string; user_id: string }

    if (topic === 'orders_v2' || topic === 'orders') {
      await syncOrder(resource, user_id)
    } else if (topic === 'items') {
      await syncItem(resource, user_id)
    } else if (topic === 'items_prices') {
      console.log(`[ML] Items prices update: ${resource}`)
    } else if (topic === 'questions') {
      console.log(`[ML] Question update: ${resource}`)
    } else if (topic === 'messages') {
      console.log(`[ML] Message update: ${resource}`)
    } else if (topic === 'shipments') {
      await syncShipment(resource, user_id)
    } else if (topic === 'payments') {
      console.log(`[ML] Payment update: ${resource}`)
    } else if (topic === 'catalog') {
      console.log(`[ML] Catalog update: ${resource}`)
    } else if (topic === 'promotions') {
      console.log(`[ML] Promotion update: ${resource}`)
    } else if (topic === 'user_products_families') {
      console.log(`[ML] Product families update: ${resource}`)
    } else if (LOG_ONLY_TOPICS.includes(topic)) {
      console.log(`[ML] Logged topic (no action): ${topic} - ${resource}`)
    } else {
      console.log(`[ML] Unknown topic: ${topic} - ${resource}`)
    }

    await updateStatus(eventId, 'PROCESSED')

  } catch (error: unknown) {
    const err = error as Error
    console.error(`Error processing webhook ${eventId}:`, err)
    await getSupabase()
      .from('marketplace_webhook_events')
      .update({
        status: 'FAILED',
        error_message: err.message || 'Unknown error',
        processed_at: new Date().toISOString()
      })
      .eq('id', eventId)
  }
}

async function syncItem(resource: string, userId: string) {
  try {
    const connection = await getSupabase()
      .from('marketplace_connections')
      .select('access_token')
      .eq('user_id', userId)
      .eq('marketplace_id', 'mercadolivre')
      .single()

    if (!connection?.data?.access_token) return

    const itemId = resource.split('/').pop()
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: { Authorization: `Bearer ${connection.data.access_token}` }
    })

    if (!response.ok) return

    const item = await response.json()
    const listings = await getSupabase()
      .from('marketplace_listings')
      .select('id')
      .eq('external_id', item.id)
      .single()

    if (listings?.data) {
      await getSupabase()
        .from('marketplace_listings')
        .update({
          title: item.title,
          price: item.price,
          stock_synced: item.available_quantity,
          status: item.status === 'active' ? 'ACTIVE' : item.status === 'paused' ? 'PAUSED' : 'INACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', listings.data.id)
    }
  } catch (err) {
    console.error('[ML] Error syncing item:', err)
  }
}

async function syncShipment(resource: string, userId: string) {
  try {
    const connection = await getSupabase()
      .from('marketplace_connections')
      .select('access_token')
      .eq('user_id', userId)
      .eq('marketplace_id', 'mercadolivre')
      .single()

    if (!connection?.data?.access_token) return

    const shipmentId = resource.split('/').pop()
    const response = await fetch(`https://api.mercadolibre.com/shipments/${shipmentId}`, {
      headers: { Authorization: `Bearer ${connection.data.access_token}` }
    })

    if (!response.ok) return

    const shipment = await response.json()

    const existing = await getSupabase()
      .from('shipments')
      .select('id')
      .eq('external_id', shipment.id)
      .single()

    if (existing?.data) {
      const mlStatus = shipment.status
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'ready_to_ship': 'READY_TO_SHIP',
        'shipped': 'SHIPPED',
        'delivered': 'DELIVERED',
        'not_delivered': 'NOT_DELIVERED',
        'returned': 'RETURNED',
      }
      await getSupabase()
        .from('shipments')
        .update({
          status: statusMap[mlStatus] || 'PENDING',
          tracking_code: shipment.tracking_number || null,
          carrier: shipment.tracking_number ? shipment.tracking_company : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.data.id)
    }
  } catch (err) {
    console.error('[ML] Error syncing shipment:', err)
  }
}

async function updateStatus(eventId: string, status: string) {
  await getSupabase()
    .from('marketplace_webhook_events')
    .update({ 
      status, 
      processed_at: status === 'PROCESSED' ? new Date().toISOString() : null 
    })
    .eq('id', eventId)
}
