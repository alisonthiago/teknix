 
import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

const TIKTOK_EVENT_TYPES = [
  'ORDER_STATUS_CHANGE',
  'PACKAGE_UPDATE',
  'PRODUCT_STATUS_CHANGE',
  'PRODUCT_INFORMATION_CHANGE',
  'PRODUCT_CREATION',
  'PRODUCT_CATEGORY_CHANGE',
  'SELLER_DEAUTHORIZATION',
  'UPCOMING_AUTHORIZATION_EXPIRATION',
  'CANCELLATION_STATUS_CHANGE',
  'RETURN_STATUS_CHANGE',
  'REVERSE_STATUS_UPDATE',
  'NEW_CONVERSATION',
  'NEW_MESSAGE',
  'NEW_MESSAGE_LISTENER',
  'INVOICE_STATUS_CHANGE',
  'PRODUCT_AUDIT_STATUS_CHANGE',
  'RECIPIENT_ADDRESS_UPDATE',
]

function verifySignature(body: string, authorization: string, appSecret: string): boolean {
  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex')
  return authorization === expected
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

    const authorization = request.headers.get('authorization') || ''
    const appSecret = process.env.TIKTOK_SHOP_APP_SECRET || ''

    if (appSecret && authorization) {
      const isValid = verifySignature(body, authorization, appSecret)
      if (!isValid) {
        console.warn('[TikTok] Invalid webhook signature')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = getSupabase()

    const eventType = String(payload.event || payload.type || payload.event_type || 'unknown')
    const notificationId = String(payload.tts_notification_id || payload.notification_id || `${Date.now()}-${Math.random()}`)
    const shopId = String(payload.shop_id || payload.shop_open_id || 'unknown')

    const { error: insertError } = await supabase
      .from('marketplace_webhook_events')
      .insert({
        marketplace_id: 'tiktok',
        marketplace_account_id: null,
        event_type: eventType,
        event_id: notificationId,
        payload: payload,
        status: 'received',
        source_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      })

    if (insertError) {
      if (insertError.code === '23505') {
        console.log(`[TikTok] Duplicate notification: ${notificationId}`)
        return NextResponse.json({ success: true }, { status: 200 })
      }
      console.error('[TikTok] Webhook insert error:', insertError)
    }

    console.log(`[TikTok] Received: event=${eventType} id=${notificationId} shop=${shopId}`)

    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    console.error('[TikTok] Webhook error:', error)
    return NextResponse.json({}, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({
    marketplace: 'tiktok_shop',
    status: 'healthy',
    uptime: process.uptime(),
  })
}
