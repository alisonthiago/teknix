/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { processWebhook } from '@/services/mercadolivre/webhookProcessor'

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

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = getSupabase()

    // Basic ML Payload validation
    if (!payload.topic || !payload.resource || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { topic, resource, user_id, application_id, _id: event_id } = payload

    // 1. Check idempotency and insert
    // Supabase will throw error if unique constraint (marketplace_id, topic, resource, event_id) is violated
    // We handle it gracefully to not fail the webhook
    const { data: event, error: insertError } = await supabase
      .from('marketplace_webhook_events')
      .insert({
        marketplace_id: 'mercadolivre',
        topic,
        resource,
        resource_id: resource.split('/').pop(),
        seller_id: user_id.toString(),
        application_id: application_id?.toString(),
        event_id: event_id?.toString() || `${Date.now()}-${Math.random()}`,
        payload,
        status: 'RECEIVED'
      })
      .select('id')
      .single()

    if (insertError) {
      // If it's a unique constraint violation, it's a duplicate. Just return 200.
      if (insertError.code === '23505') {
        return NextResponse.json({ message: 'Already received' }, { status: 200 })
      }
      console.error('Webhook insert error:', insertError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // 2. Dispatch background processor
    // waitUntil ensures the Vercel function stays alive until this promise resolves,
    // even though we return the HTTP response immediately.
    waitUntil(processWebhook(event.id, payload))

    // 3. Return 200 OK immediately
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
