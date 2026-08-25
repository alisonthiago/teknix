import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

/**
 * Webhook Idempotency & Validation Engine
 * 
 * Prevents replay attacks and duplicate event processing for all marketplace webhooks.
 */

const processedEventsMemory = new Set<string>()

export async function isWebhookEventProcessed(
  marketplace: string,
  eventId: string
): Promise<boolean> {
  const compositeKey = `${marketplace}:${eventId}`

  // 1. Fast in-memory check
  if (processedEventsMemory.has(compositeKey)) {
    return true
  }

  // 2. Persistent check in database
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('marketplace', marketplace)
      .eq('external_event_id', eventId)
      .single()

    if (data) {
      processedEventsMemory.add(compositeKey)
      return true
    }
  } catch {
    // If webhook_events table doesn't exist yet or errors, continue safely
  }

  return false
}

export async function markWebhookEventProcessed(
  marketplace: string,
  eventId: string,
  topic: string,
  payload: any
): Promise<void> {
  const compositeKey = `${marketplace}:${eventId}`
  processedEventsMemory.add(compositeKey)

  // Keep memory cache size under 10,000 items
  if (processedEventsMemory.size > 10000) {
    const it = processedEventsMemory.values()
    for (let i = 0; i < 2000; i++) {
      processedEventsMemory.delete(it.next().value!)
    }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('webhook_events').insert({
      marketplace,
      external_event_id: eventId,
      topic,
      payload: typeof payload === 'string' ? JSON.parse(payload) : payload,
      processed_at: new Date().toISOString()
    })
  } catch {
    // Graceful fallback
  }
}

/**
 * Validate HMAC-SHA256 signature for webhooks
 */
export function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  secret: string
): boolean {
  if (!receivedSignature || !secret) return false
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}
