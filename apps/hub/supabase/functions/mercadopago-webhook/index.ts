/* ==========================================================================
   TEKNIX MERCADO PAGO WEBHOOK HANDLER (Supabase Edge Function)
   Recebe notificações assíncronas de pagamento do Mercado Pago,
   valida idempotência, consulta status real na API do MP no servidor
   e atualiza o status do pedido no HUB automaticamente.
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
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const resourceId = url.searchParams.get('id') || url.searchParams.get('data.id')

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Body pode ser vazio se notificação veio via query params
    }

    const eventId = String(body?.id || resourceId || Date.now())
    const paymentId = String(body?.data?.id || body?.resource?.split('/').pop() || resourceId || eventId)
    const eventType = body?.action || body?.type || topic || 'payment.updated'

    console.log(`[Mercado Pago Webhook] Evento recebido: ${eventType} | ID: ${paymentId}`)

    // 1. IDEMPOTÊNCIA: Verifica se o evento já foi processado
    const { data: existingEvent } = await supabaseClient
      .from('webhook_events')
      .select('id, processed')
      .eq('event_id', `mp-${eventId}`)
      .maybeSingle()

    if (existingEvent?.processed) {
      console.log(`[Mercado Pago Webhook] Evento ${eventId} já processado anteriormente. Ignorando duplicata.`)
      return new Response(JSON.stringify({ success: true, message: 'Evento já processado (Idempotente)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Registra evento no banco
    await supabaseClient.from('webhook_events').upsert({
      event_id: `mp-${eventId}`,
      provider_id: 'mercado_pago',
      event_type: eventType,
      payload: body,
      processed: false,
      created_at: new Date().toISOString()
    })

    // 2. Busca token seguro no servidor
    const { data: config } = await supabaseClient
      .from('integration_configs')
      .select('credentials')
      .eq('id', 'mercado_pago')
      .single()

    const token = config?.credentials?.accessToken || ''

    let paymentStatus = 'pending'
    let orderId: string | null = null

    if (token && paymentId && paymentId !== 'undefined') {
      // Consulta status real na API do Mercado Pago (Server-to-Server)
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (mpRes.ok) {
          const mpData = await mpRes.json()
          paymentStatus = mpData.status // 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled'
          orderId = mpData.external_reference || null
        }
      } catch (err: any) {
        console.warn(`[Mercado Pago Webhook] Falha ao consultar pagamento ${paymentId}:`, err.message)
      }
    } else {
      // Modo mock para testes
      paymentStatus = body?.type === 'payment.approved' || body?.action === 'payment.approved' ? 'approved' : 'pending'
      orderId = body?.order_id || body?.order_number || null
    }

    // 3. Atualiza o status do pedido no Supabase
    let updatedOrder = null
    const newOrderStatus = paymentStatus === 'approved'
      ? 'paid'
      : paymentStatus === 'rejected' || paymentStatus === 'cancelled'
      ? 'cancelled'
      : 'pending'

    if (orderId) {
      const query = orderId.startsWith('#TK-') || orderId.startsWith('TK-')
        ? supabaseClient.from('orders').update({
            status: newOrderStatus,
            payment_status: paymentStatus,
            payment_id: paymentId,
            updated_at: new Date().toISOString()
          }).eq('order_number', orderId)
        : supabaseClient.from('orders').update({
            status: newOrderStatus,
            payment_status: paymentStatus,
            payment_id: paymentId,
            updated_at: new Date().toISOString()
          }).eq('id', orderId)

      const { data } = await query.select('id, order_number, status').maybeSingle()
      updatedOrder = data
    }

    // 4. Marca evento como processado
    await supabaseClient
      .from('webhook_events')
      .update({ processed: true, updated_at: new Date().toISOString() })
      .eq('event_id', `mp-${eventId}`)

    // 5. Registra log de auditoria
    await supabaseClient.from('integration_logs').insert({
      provider_id: 'mercado_pago',
      category: 'payment',
      action: `webhook.${eventType}`,
      status: 'success',
      order_id: updatedOrder?.id || orderId,
      order_number: updatedOrder?.order_number,
      response_payload: { paymentId, paymentStatus, orderStatus: newOrderStatus },
      created_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        paymentStatus,
        orderStatus: newOrderStatus,
        updatedOrder
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('[Mercado Pago Webhook] Erro crítico:', err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
