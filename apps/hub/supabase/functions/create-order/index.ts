/* ==========================================================================
   TEKNIX — create-order Edge Function
   Cria pedidos da loja própria usando service_role (bypassa RLS).
   Chamado pelo checkout no SITE para evitar problemas de RLS com anon.
   ========================================================================== */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Supabase client com service_role — bypassa RLS completamente
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json()
    const { order, items } = body

    if (!order || !items || !Array.isArray(items)) {
      return new Response(JSON.stringify({ error: 'Payload inválido: order e items são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Insere o pedido
    const { data: orderData, error: orderErr } = await supabase
      .from('store_orders')
      .insert(order)
      .select('id, order_number')
      .single()

    if (orderErr) {
      console.error('[create-order] Erro ao inserir pedido:', orderErr)
      return new Response(JSON.stringify({ error: orderErr.message, details: orderErr.details }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Insere os itens do pedido
    const itemsWithOrderId = items.map((item: any) => ({
      ...item,
      order_id: orderData.id,
    }))

    const { error: itemsErr } = await supabase
      .from('store_order_items')
      .insert(itemsWithOrderId)

    if (itemsErr) {
      console.error('[create-order] Erro ao inserir itens:', itemsErr)
      // Pedido criado mas itens falharam — não cancela, apenas loga
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: orderData.id,
        order_number: orderData.order_number,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('[create-order] Erro inesperado:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
