 
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getValidTokenBySellerId } from './client'
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

/**
 * Enfileira e dispara o processamento assíncrono do webhook com garantia de idempotência.
 */
export async function enqueueAndProcessWebhook(payload: Record<string, any>): Promise<{ eventId: string; duplicate: boolean }> {
  const supabase = getSupabase()
  const { resource, topic, user_id } = payload

  if (!user_id) {
    throw new Error('Webhook recebido sem user_id. Verifique a configuração do webhook no Mercado Livre.')
  }

  const sellerId = String(user_id)
  const eventType = topic || (resource?.startsWith('/orders/') ? 'orders_v2' : resource?.startsWith('/shipments/') ? 'shipments' : 'general')

  // 1. Verificação de Idempotência: Checa se o mesmo recurso foi processado recentemente (últimos 3 minutos)
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString()
  const { data: recentEvent } = await supabase
    .from('marketplace_webhook_events')
    .select('id, processed')
    .eq('marketplace_id', 'mercadolivre')
    .eq('resource', resource || '')
    .eq('event_type', eventType)
    .gte('created_at', threeMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentEvent && recentEvent.processed) {
    console.log(`[ML Webhook Worker] Evento duplicado ignorado (idempotência): ${resource} (${eventType})`)
    return { eventId: recentEvent.id, duplicate: true }
  }

  // 2. Registra na Fila de Eventos (marketplace_webhook_events)
  const { data: event, error: insertErr } = await supabase
    .from('marketplace_webhook_events')
    .insert({
      marketplace_id: 'mercadolivre',
      event_type: eventType,
      resource: resource || '',
      raw_payload: payload,
      processed: false,
      error: null
    })
    .select('id')
    .single()

  if (insertErr || !event) {
    console.error('[ML Webhook Worker] Erro ao enfileirar evento:', insertErr)
    throw insertErr
  }

  // 3. Execução Assíncrona desacoplada do ciclo HTTP
  void processWebhook(event.id, payload, sellerId).catch(err => {
    console.error(`[ML Webhook Worker] Falha no processamento em background (${event.id}):`, err)
  })

  return { eventId: event.id, duplicate: false }
}

/**
 * Worker assíncrono que consulta a API oficial do Mercado Livre e persiste no banco.
 */
export async function processWebhook(eventId: string, payload: Record<string, any>, sellerId: string) {
  const supabase = getSupabase()
  const { topic, resource } = payload

  try {
    const eventType = topic || (resource?.startsWith('/orders/') ? 'orders_v2' : resource?.startsWith('/shipments/') ? 'shipments' : 'general')

    if (eventType === 'orders_v2' || eventType === 'orders' || resource?.startsWith('/orders/')) {
      await syncOrder(resource, sellerId)
    } else if (eventType === 'items' || resource?.startsWith('/items/')) {
      await syncItem(resource, sellerId)
    } else if (eventType === 'shipments' || resource?.startsWith('/shipments/')) {
      await syncShipment(resource, sellerId)
    } else {
      console.log(`[ML Webhook Worker] Tópico recebido para log: ${eventType} - ${resource}`)
    }

    // Marca como processado com sucesso
    await supabase
      .from('marketplace_webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: null
      })
      .eq('id', eventId)

    console.log(`[ML Webhook Worker] Evento ${eventId} (${resource}) processado com sucesso.`)
  } catch (error: any) {
    console.error(`[ML Webhook Worker] Erro ao processar evento ${eventId}:`, error.message)
    await supabase
      .from('marketplace_webhook_events')
      .update({
        processed: false,
        error: error.message || 'Erro no processamento',
        processed_at: new Date().toISOString()
      })
      .eq('id', eventId)
  }
}

async function syncItem(resource: string, sellerId: string) {
  const supabase = getSupabase()
  try {
    const token = await getValidTokenBySellerId(sellerId)
    const itemId = resource.split('/').pop()!

    const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) return
    const item = await res.json()
    const sku = item.seller_custom_field || item.id

    await supabase
      .from('products')
      .update({
        name: item.title,
        stock: Number(item.available_quantity) || 0,
        status: item.status === 'active' ? 'ACTIVE' : item.status === 'paused' ? 'PAUSED' : 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('sku', sku)
  } catch (err: any) {
    console.error('[ML Webhook Worker] Erro ao sincronizar item:', err.message)
  }
}

async function syncShipment(resource: string, sellerId: string) {
  const supabase = getSupabase()
  try {
    const token = await getValidTokenBySellerId(sellerId)
    const shipmentId = resource.split('/').pop()!

    const res = await fetch(`https://api.mercadolibre.com/shipments/${shipmentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) return
    const ship = await res.json()
    const tracking = ship.tracking_number || ship.tracking_id || `MEL${shipmentId}`

    if (ship.order_id) {
      const orderNumber = `MLB-${ship.order_id}`
      await supabase
        .from('orders')
        .update({
          tracking_code: tracking,
          carrier: ship.logistic_type ? `Mercado Envios (${ship.logistic_type.toUpperCase()})` : 'Mercado Envios',
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderNumber)
    }
  } catch (err: any) {
    console.error('[ML Webhook Worker] Erro ao sincronizar envio:', err.message)
  }
}
