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

const AMAZON_NOTIFICATION_TYPES = [
  'ANY_OFFER_CHANGED',
  'B2B_ANY_OFFER_CHANGED',
  'ORDER_CHANGE',
  'FBA_INVENTORY_AVAILABILITY_CHANGES',
  'FBA_OUTBOUND_SHIPMENT_STATUS',
  'FULFILLMENT_ORDER_STATUS',
  'ITEM_INVENTORY_EVENT_CHANGE',
  'ITEM_SALES_EVENT_CHANGE',
  'REPORT_PROCESSING_FINISHED',
  'FEED_PROCESSING_FINISHED',
  'TRANSACTION_UPDATE',
  'PRICING_HEALTH',
  'FEE_PROMOTION',
  'SHIPMENT_TRACKING_MILESTONE_CHANGED',
  'ACCOUNT_STATUS_CHANGED',
  'EXTERNAL_FULFILLMENT_SHIPMENT_STATUS_CHANGE',
  'DETAIL_PAGE_TRAFFIC_EVENT',
  'LISTINGS_ITEM_ISSUES_CHANGE',
  'LISTINGS_ITEM_MFN_QUANTITY_CHANGE',
  'LISTINGS_ITEM_STATUS_CHANGE',
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

    const notificationType = String(
      payload.NotificationType ||
      payload.messageType ||
      payload.event_type ||
      payload.type ||
      'unknown'
    )
    const messageId = String(
      payload.MessageId ||
      payload.messageId ||
      payload.subscription_id ||
      `${Date.now()}-${Math.random()}`
    )

    const { error: insertError } = await supabase
      .from('marketplace_webhook_events')
      .insert({
        marketplace_id: 'amazon',
        marketplace_account_id: null,
        event_type: notificationType,
        event_id: messageId,
        payload: payload,
        status: 'received',
        source_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      })

    if (insertError) {
      if (insertError.code === '23505') {
        console.log(`[Amazon] Duplicate notification: ${messageId}`)
        return NextResponse.json({ success: true }, { status: 200 })
      }
      console.error('[Amazon] Webhook insert error:', insertError)
    }

    console.log(`[Amazon] Received: type=${notificationType} id=${messageId}`)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Amazon] Webhook error:', error)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    marketplace: 'amazon',
    status: 'healthy',
    note: 'Amazon uses SQS for notifications. This endpoint accepts forwarded webhooks from bridge services.',
    supported_notification_types: AMAZON_NOTIFICATION_TYPES,
    uptime: process.uptime(),
  })
}
