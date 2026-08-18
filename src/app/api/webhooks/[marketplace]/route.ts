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

const MARKETPLACE_CODES: Record<string, string> = {
  mercadolivre: 'mercadolivre',
  shopee: 'shopee',
  amazon: 'amazon',
  tiktok: 'tiktok',
  magalu: 'magalu',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ marketplace: string }> }
) {
  const { marketplace } = await params
  const marketplaceKey = MARKETPLACE_CODES[marketplace]

  if (!marketplaceKey) {
    return NextResponse.json({ error: 'Marketplace desconhecido' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    try {
      const text = await request.text()
      body = { raw: text }
    } catch {
      body = {}
    }
  }

  const supabase = getSupabase()

  const eventType = String(
    body.topic || body.type || body.event || body.event_type ||
    body.NotificationType || body.push_code || 'unknown'
  )
  const eventId = String(
    body._id || body.tts_notification_id || body.MessageId ||
    body.messageId || body.event_id || `${Date.now()}-${Math.random()}`
  )

  const { error: insertError } = await supabase
    .from('marketplace_webhook_events')
    .insert({
      marketplace_id: marketplaceKey,
      marketplace_account_id: null,
      event_type: eventType,
      event_id: eventId,
      payload: body,
      status: 'received',
      source_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    })

  if (insertError) {
    if (insertError.code === '23505') {
      console.log(`[${marketplace}] Duplicate event: ${eventId}`)
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }
    console.error(`[${marketplace}] Webhook insert error:`, insertError)
  }

  console.log(`[${marketplace}] Received event: ${eventType} (${eventId})`)

  return NextResponse.json({ received: true }, { status: 200 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ marketplace: string }> }
) {
  const { marketplace } = await params

  return NextResponse.json({
    marketplace,
    status: 'healthy',
    uptime: process.uptime(),
  })
}
