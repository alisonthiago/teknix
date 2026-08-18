/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
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

const MAGALU_WEBHOOK_TOPICS = [
  'logistic_seller_tracking_updated',
  'ps-chat-notification',
  'order_status_change',
  'sku_event_change',
  'delivery_event',
  'invoice_event',
  'return_event',
  'cancellation_event',
  'payment_event',
  'seller_ticket_event',
  'seller_message_event',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(body)
    } catch {
      payload = { raw: body }
    }

    const supabase = getSupabase()

    const topic = String(payload.topic || payload.event_type || 'unknown')
    const tenantId = String(payload.tenant_id || 'unknown')
    const resourceId = payload.data && typeof payload.data === 'object'
      ? String((payload.data as Record<string, unknown>).id || 'unknown')
      : 'unknown'

    const { error: insertError } = await supabase
      .from('marketplace_webhook_events')
      .insert({
        marketplace_id: 'magalu',
        marketplace_account_id: null,
        event_type: topic,
        payload: payload,
        status: 'received',
        source_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      })

    if (insertError) {
      console.error('[Magalu] Webhook insert error:', insertError)
    }

    console.log(`[Magalu] Received: topic=${topic} tenant=${tenantId} resource=${resourceId}`)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Magalu] Webhook error:', error)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    marketplace: 'magalu',
    status: 'healthy',
    uptime: process.uptime(),
  })
}
