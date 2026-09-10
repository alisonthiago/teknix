import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EVENT_TYPES = new Set([
  'order.created', 'order.pending', 'order.released', 'order.generated',
  'order.received', 'order.posted', 'order.delivered', 'order.cancelled',
  'order.undelivered', 'order.paused', 'order.suspended',
])

type LabelData = {
  id?: unknown
  protocol?: unknown
  status?: unknown
  tracking?: unknown
  self_tracking?: unknown
  user_id?: unknown
  tags?: unknown
  tracking_url?: unknown
  created_at?: unknown
  paid_at?: unknown
  generated_at?: unknown
  posted_at?: unknown
  delivered_at?: unknown
  canceled_at?: unknown
  expired_at?: unknown
}

type Payload = { event?: unknown; data?: LabelData }

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuração do Supabase ausente')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function isRegistrationProbe(body: string, userAgent: string | null): boolean {
  const trimmed = body.trim()
  if (!trimmed) return true
  try {
    const payload = JSON.parse(trimmed) as unknown
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false
    const keys = Object.keys(payload)
    if (keys.length === 0) return true
    return userAgent === 'Melhor Envio Webhooks/1.0' && !keys.includes('event') && !keys.includes('data')
  } catch {
    return false
  }
}

function sanitisePayload(payload: Payload) {
  const data = payload.data || {}
  return {
    event: String(payload.event),
    data: {
      id: String(data.id), protocol: data.protocol ? String(data.protocol) : null,
      status: data.status ? String(data.status) : null,
      tracking: data.tracking ? String(data.tracking) : null,
      self_tracking: data.self_tracking ? String(data.self_tracking) : null,
      user_id: data.user_id ? String(data.user_id) : null,
      tags: Array.isArray(data.tags)
        ? data.tags.filter((tag): tag is Record<string, unknown> => Boolean(tag && typeof tag === 'object'))
          .map((tag) => ({ tag: typeof tag.tag === 'string' ? tag.tag : null, url: typeof tag.url === 'string' ? tag.url : null }))
        : [],
      tracking_url: data.tracking_url ? String(data.tracking_url) : null,
      created_at: data.created_at || null, paid_at: data.paid_at || null,
      generated_at: data.generated_at || null,
      posted_at: data.posted_at || null, delivered_at: data.delivered_at || null,
      canceled_at: data.canceled_at || null, expired_at: data.expired_at || null,
    },
  }
}

function internalStatus(event: string): string | null {
  if (event === 'order.posted') return 'ENVIADO'
  if (event === 'order.delivered') return 'ENTREGUE'
  if (event === 'order.cancelled') return 'CANCELADO'
  if (['order.undelivered', 'order.paused', 'order.suspended'].includes(event)) return 'PROBLEMA'
  if (['order.created', 'order.released', 'order.generated'].includes(event)) return 'ETIQUETA_IMPRESSA'
  return null
}

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-request-id') || randomUUID()
  const receivedAt = new Date().toISOString()
  const rawBody = await request.text()
  const secret = process.env.MELHOR_ENVIO_WEBHOOK_SECRET
  const signature = request.headers.get('x-me-signature')

  // The Melhor Envio dashboard sends an unsigned probe when registering a URL.
  // Only an empty probe is accepted; event payloads remain signature-protected.
  if (!signature && isRegistrationProbe(rawBody, request.headers.get('user-agent'))) {
    console.info('[Melhor Envio webhook] registration probe accepted', { correlationId })
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (!secret || !signature) {
    return NextResponse.json({ received: false, error: 'Webhook não configurado' }, { status: 401 })
  }
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64')
  if (!safeEqual(signature, expected)) {
    return NextResponse.json({ received: false, error: 'Assinatura inválida' }, { status: 401 })
  }

  let payload: Payload
  try { payload = JSON.parse(rawBody) as Payload } catch {
    return NextResponse.json({ received: false, error: 'JSON inválido' }, { status: 400 })
  }
  const event = typeof payload.event === 'string' ? payload.event : ''
  const data = payload.data && typeof payload.data === 'object' ? payload.data : null
  const labelId = data && typeof data.id === 'string' ? data.id : ''
  if (!EVENT_TYPES.has(event) || !data || !labelId) {
    return NextResponse.json({ received: false, error: 'Payload de etiqueta inválido' }, { status: 400 })
  }

  const safePayload = sanitisePayload(payload)
  const payloadHash = createHash('sha256').update(rawBody).digest('hex')
  const idempotencyKey = `melhor-envio:${event}:${labelId}:${payloadHash}`
  const supabase = getAdminClient()
  const row = {
    idempotency_key: idempotencyKey, provider: 'melhor_envio', event_type: event, label_id: labelId,
    protocol: data.protocol ? String(data.protocol) : null,
    tracking_code: data.tracking ? String(data.tracking) : data.self_tracking ? String(data.self_tracking) : null,
    external_status: data.status ? String(data.status) : null,
    internal_status: internalStatus(event), payload: safePayload, status: 'RECEIVED',
    correlation_id: correlationId, received_at: receivedAt, http_result: 200,
  }
  const { data: inserted, error: insertError } = await supabase
    .from('melhor_envio_webhook_events').insert(row).select('id').maybeSingle()
  if (insertError?.code === '23505') {
    return NextResponse.json({ received: true, duplicate: true, correlationId }, { status: 200 })
  }
  if (insertError || !inserted) {
    console.error('[Melhor Envio webhook] persist error', { correlationId, error: insertError?.message })
    return NextResponse.json({ received: false, error: 'Falha ao registrar evento', correlationId }, { status: 500 })
  }

  try {
    const tracking = row.tracking_code
    let order: { id: string; status: string } | null = null
    let shipmentId: string | null = null
    if (tracking) {
      const byOrder = await supabase.from('orders').select('id,status').eq('tracking_code', tracking).maybeSingle()
      order = byOrder.data
      if (!order) {
        const shipment = await supabase.from('shipments').select('id,order_id').eq('tracking_code', tracking).maybeSingle()
        if (shipment.data?.order_id) {
          shipmentId = shipment.data.id || null
          const byShipment = await supabase.from('orders').select('id,status').eq('id', shipment.data.order_id).maybeSingle()
          order = byShipment.data
        }
      }
    }
    if (!order && row.protocol) {
      const byProtocol = await supabase.from('orders').select('id,status').eq('order_number', row.protocol).maybeSingle()
      order = byProtocol.data
    }
    if (!order) {
      await supabase.from('melhor_envio_webhook_events').update({ status: 'ORDER_NOT_FOUND', processed_at: new Date().toISOString() }).eq('id', inserted.id)
      return NextResponse.json({ received: true, processed: false, reason: 'order_not_found', correlationId }, { status: 200 })
    }

    const nextStatus = row.internal_status
    const changed = Boolean(nextStatus && nextStatus !== order.status)
    const orderUpdate: Record<string, string> = {}
    if (tracking) orderUpdate.tracking_code = tracking
    orderUpdate.carrier = 'Melhor Envio'
    if (nextStatus === 'ENVIADO') orderUpdate.shipped_at = String(data.posted_at || new Date().toISOString())
    if (nextStatus === 'ENTREGUE') orderUpdate.delivered_at = String(data.delivered_at || new Date().toISOString())
    if (nextStatus && changed) orderUpdate.status = nextStatus
    if (Object.keys(orderUpdate).length) await supabase.from('orders').update(orderUpdate).eq('id', order.id)
    if (changed) await supabase.from('order_status_history').insert({ order_id: order.id, from_status: order.status, to_status: nextStatus, notes: `Melhor Envio: ${event} (${labelId})` })
    const shipmentUpdate = { tracking_code: tracking, carrier: 'Melhor Envio', status: nextStatus || 'ETIQUETA', ...(nextStatus === 'ENVIADO' ? { shipped_at: orderUpdate.shipped_at } : {}), ...(nextStatus === 'ENTREGUE' ? { delivered_at: orderUpdate.delivered_at } : {}) }
    const shipmentQuery = shipmentId
      ? supabase.from('shipments').update(shipmentUpdate).eq('id', shipmentId)
      : supabase.from('shipments').update(shipmentUpdate).eq('order_id', order.id)
    await shipmentQuery
    await supabase.from('melhor_envio_webhook_events').update({ order_id: order.id, shipment_id: shipmentId, status: changed ? 'PROCESSED' : 'PROCESSED_NO_CHANGE', processed_at: new Date().toISOString() }).eq('id', inserted.id)
    return NextResponse.json({ received: true, processed: true, duplicate: false, orderId: order.id, correlationId }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    await supabase.from('melhor_envio_webhook_events').update({ status: 'FAILED', error_message: message, processed_at: new Date().toISOString() }).eq('id', inserted.id)
    console.error('[Melhor Envio webhook] processing error', { correlationId, error: message })
    return NextResponse.json({ received: true, processed: false, correlationId }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Melhor Envio Webhook',
    message: 'Endpoint ativo. Aguardando eventos POST.',
  }, { status: 200 })
}