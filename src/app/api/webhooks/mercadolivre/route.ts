import { NextRequest, NextResponse } from 'next/server'
import { enqueueAndProcessWebhook } from '@/services/mercadolivre/webhookProcessor'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resource, topic, user_id } = body

    if (!user_id) {
      console.error('[ML Webhook Entrypoint] Payload sem user_id')
      return NextResponse.json({ received: true, error: 'user_id obrigatório no payload' }, { status: 200 })
    }

    const sellerId = String(user_id)

    console.log(`[ML Webhook Entrypoint] Recebido: topic=${topic}, resource=${resource}, seller=${sellerId}`)

    // 1. Enfileira o evento na fila e dispara o worker em background com idempotência
    const result = await enqueueAndProcessWebhook(body)

    // 2. Resposta HTTP 200 instantânea (< 100ms) para cumprir o SLA do Mercado Livre
    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      duplicate: result.duplicate,
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (err: any) {
    console.error('[ML Webhook Entrypoint] Erro ao enfileirar:', err.message)
    // Retorna 200 para evitar que o Mercado Livre pause ou desative o webhook
    return NextResponse.json({ received: true, error: err.message }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    endpoint: '/api/webhooks/mercadolivre',
    topics: ['orders_v2', 'orders', 'shipments', 'items', 'payments', 'questions', 'messages'],
    timestamp: new Date().toISOString()
  })
}
