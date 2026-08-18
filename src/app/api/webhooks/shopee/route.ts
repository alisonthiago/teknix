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

const SHOPEE_PUSH_CODES: Record<string, string> = {
  '1': 'shop_authorization',
  '2': 'shop_authorization_canceled',
  '3': 'order_status',
  '4': 'order_trackingno',
  '5': 'shopee_updates',
  '6': 'banned_item',
  '7': 'item_promotion_info',
  '8': 'reserved_stock_change',
  '9': 'promotion_update',
  '10': 'webchat',
  '11': 'video_upload',
  '12': 'open_api_authorization_expiry',
  '13': 'brand_register_result',
  '14': 'item_scheduled_publish_failed',
  '15': 'shipping_document_status',
  '22': 'item_price_update',
  '23': 'booking_status',
  '24': 'booking_trackingno',
  '25': 'booking_shipping_document_status',
  '26': 'package_fulfillment_status',
  '27': 'courier_delivery_binding_status',
  '28': 'package_info',
  '50': 'inbound_status',
  '51': 'supplier_create_product',
  '52': 'supplier_product_review_result',
  '53': 'purchase_order',
}

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

    const code = String(payload.push_code || payload.type || 'unknown')
    const topic = SHOPEE_PUSH_CODES[code] || `push_${code}`

    const shopId = String(payload.shop_id || payload.mid || 'unknown')

    const { error: insertError } = await supabase
      .from('marketplace_webhook_events')
      .insert({
        marketplace_id: 'shopee',
        marketplace_account_id: null,
        event_type: topic,
        payload: payload,
        status: 'received',
        source_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      })

    if (insertError) {
      console.error('[Shopee] Webhook insert error:', insertError)
    }

    console.log(`[Shopee] Received: topic=${topic} code=${code} shop=${shopId}`)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Shopee] Webhook error:', error)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    marketplace: 'shopee',
    status: 'healthy',
    uptime: process.uptime(),
  })
}
