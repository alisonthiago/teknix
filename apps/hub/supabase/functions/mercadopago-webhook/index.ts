/* ==========================================================================
   TEKNIX MERCADO PAGO WEBHOOK HANDLER (Supabase Edge Function)
   Recebe notificações assíncronas de pagamento do Mercado Pago,
   valida idempotência, consulta status real na API do MP no servidor
   e atualiza o status do pedido no HUB automaticamente.

   Suporta tópicos:
   - "order"   → consulta GET /v1/orders/{id}    (API de Orders)
   - "payment" → consulta GET /v1/payments/{id}  (API legada de Payments)
   ========================================================================== */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const topicParam = url.searchParams.get('topic') || url.searchParams.get('type') || ''
    const idParam = url.searchParams.get('id') || url.searchParams.get('data.id') || ''

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Body pode ser vazio se notificação veio via query params
    }

    // Resolve topic: prefer body action/type, fallback to query params
    const rawTopic = body?.action || body?.type || topicParam || 'payment.updated'
    const resourceId = body?.data?.id || body?.resource?.split('/').pop() || idParam || ''
    const eventId = String(body?.id || resourceId || Date.now())

    // Detect whether this is an Orders API notification or legacy Payment notification
    const isOrderTopic = rawTopic.startsWith('order') || topicParam === 'order'
    const eventType = rawTopic

    console.log(`[MP Webhook] Evento: ${eventType} | ResourceID: ${resourceId} | IsOrder: ${isOrderTopic}`)

    // =========================================================
    // 1. IDEMPOTÊNCIA — evita reprocessamento de eventos iguais
    // =========================================================
    const dedupeKey = `mp-${eventType.replace('.', '_')}-${resourceId || eventId}`
    const { data: existingEvent } = await supabaseClient
      .from('webhook_events')
      .select('id, processed')
      .eq('event_id', dedupeKey)
      .maybeSingle()

    if (existingEvent?.processed) {
      console.log(`[MP Webhook] Evento ${dedupeKey} já processado. Ignorando duplicata.`)
      return new Response(JSON.stringify({ success: true, message: 'Evento já processado (Idempotente)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Registra evento no banco (não processado ainda)
    await supabaseClient.from('webhook_events').upsert({
      event_id: dedupeKey,
      provider_id: 'mercado_pago',
      event_type: eventType,
      payload: body,
      processed: false,
      created_at: new Date().toISOString()
    })

    // =========================================================
    // 2. Busca token seguro no servidor (NUNCA no frontend)
    // =========================================================
    const { data: config } = await supabaseClient
      .from('integration_configs')
      .select('credentials')
      .eq('id', 'mercado_pago')
      .single()

    const token = config?.credentials?.accessToken || ''

    // =========================================================
    // 3. Consulta status REAL no Mercado Pago (server-to-server)
    // =========================================================
    let mpStatus = 'pending'
    let mpStatusDetail = ''
    let orderId: string | null = null
    let mpPaymentId: string | null = resourceId || null

    if (token && resourceId && resourceId !== 'undefined') {
      try {
        if (isOrderTopic) {
          // ---- Orders API (/v1/orders) ----
          const mpRes = await fetch(`https://api.mercadopago.com/v1/orders/${resourceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (mpRes.ok) {
            const mpOrder = await mpRes.json()
            mpStatus = mpOrder.status // 'paid' | 'action_required' | 'failed' | 'cancelled'
            mpStatusDetail = mpOrder.status_detail || ''
            orderId = mpOrder.external_reference || null

            // Extract payment ID from order for record-keeping
            const firstPayment = mpOrder?.transactions?.payments?.[0]
            if (firstPayment?.id) mpPaymentId = firstPayment.id

            console.log(`[MP Webhook] Orders API status: ${mpStatus} | external_ref: ${orderId}`)
          }
        } else {
          // ---- Legacy Payments API (/v1/payments) ----
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (mpRes.ok) {
            const mpPayment = await mpRes.json()
            // Normalize legacy payment statuses to Orders API format
            const legacyStatus = mpPayment.status // 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled'
            if (legacyStatus === 'approved') mpStatus = 'paid'
            else if (legacyStatus === 'rejected' || legacyStatus === 'cancelled') mpStatus = 'cancelled'
            else mpStatus = 'pending'
            mpStatusDetail = mpPayment.status_detail || ''
            orderId = mpPayment.external_reference || null
            console.log(`[MP Webhook] Payments API status: ${legacyStatus} → normalized: ${mpStatus}`)
          }
        }
      } catch (err: any) {
        console.warn(`[MP Webhook] Falha ao consultar Mercado Pago: ${err.message}`)
      }
    } else {
      // Mock mode / sem credenciais
      mpStatus = body?.type === 'payment.approved' || body?.action === 'payment.approved'
        ? 'paid'
        : 'pending'
      orderId = body?.order_id || body?.order_number || body?.external_reference || null
    }

    // =========================================================
    // 4. Mapeia status do Mercado Pago → status interno TEKNIX
    // =========================================================
    let newOrderStatus: string
    let newPaymentStatus: string

    if (mpStatus === 'paid' || mpStatus === 'approved') {
      newOrderStatus = 'paid'
      newPaymentStatus = 'approved'
    } else if (mpStatus === 'failed' || mpStatus === 'cancelled' || mpStatus === 'rejected') {
      newOrderStatus = 'cancelled'
      newPaymentStatus = mpStatus
    } else {
      // 'action_required' | 'pending' | 'in_process'
      newOrderStatus = 'pending'
      newPaymentStatus = 'pending'
    }

    // =========================================================
    // 5. Atualiza o pedido no Supabase
    // =========================================================
    let updatedOrder = null

    if (orderId) {
      // external_reference pode ser UUID (id), '#TK-XXXX' (order_number) ou '#TK-XXXX_MLB5108941105'
      const cleanRef = orderId.includes('_') ? orderId.split('_')[0] : orderId
      const isOrderNumber = cleanRef.startsWith('#TK-') || cleanRef.startsWith('TK-')
      const updatePayload = {
        status: newOrderStatus,
        payment_status: newPaymentStatus,
        payment_id: mpPaymentId || undefined,
        updated_at: new Date().toISOString()
      }

      const query = isOrderNumber
        ? supabaseClient.from('store_orders').update(updatePayload).eq('order_number', cleanRef)
        : supabaseClient.from('store_orders').update(updatePayload).eq('id', cleanRef)

      const { data } = await query.select('id, order_number, status').maybeSingle()
      updatedOrder = data
      console.log(`[MP Webhook] Pedido atualizado: ${updatedOrder?.order_number} → ${newOrderStatus}`)
    }

    // =========================================================
    // 6. Marca evento como processado
    // =========================================================
    await supabaseClient
      .from('webhook_events')
      .update({ processed: true, updated_at: new Date().toISOString() })
      .eq('event_id', dedupeKey)

    // =========================================================
    // 7. Registra log de auditoria
    // =========================================================
    await supabaseClient.from('integration_logs').insert({
      provider_id: 'mercado_pago',
      category: 'payment',
      action: `webhook.${eventType}`,
      status: 'success',
      order_id: updatedOrder?.id || orderId,
      order_number: updatedOrder?.order_number,
      response_payload: {
        resourceId,
        mpStatus,
        mpStatusDetail,
        newOrderStatus,
        newPaymentStatus,
        isOrderTopic
      },
      created_at: new Date().toISOString()
    }).catch(() => {/* non-critical audit log */})

    return new Response(
      JSON.stringify({
        success: true,
        resourceId,
        mpStatus,
        newOrderStatus,
        newPaymentStatus,
        updatedOrder
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('[MP Webhook] Erro crítico:', err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
