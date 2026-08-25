import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient()

    const { data: logs, error } = await supabase
      .from('order_status_history')
      .select('*, orders(id, order_number, customer_name, tracking_code, marketplaces(name, code, logo))')
      .ilike('notes', '%etiqueta%')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderIds, operatorName, attempt = 1, printerSettings } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds é obrigatório e deve ser uma lista.' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const now = new Date().toISOString()
    const operator = operatorName || 'Operador da Expedição'

    const printEntries = []

    for (const orderId of orderIds) {
      // 1. Inserir log no histórico de status do pedido
      const { data: logEntry } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          from_status: 'PAGO',
          to_status: 'ETIQUETA_IMPRESSA',
          notes: `Etiqueta impressa com sucesso (${attempt}ª impressão) por ${operator}. Formato térmico 100x150mm.`,
          created_at: now
        })
        .select()
        .single()

      // 2. Atualizar status na tabela orders caso não seja enviado ou entregue
      await supabase
        .from('orders')
        .update({
          status: 'ETIQUETA_IMPRESSA',
          updated_at: now
        })
        .eq('id', orderId)
        .in('status', ['PAGO', 'NOVO', 'APROVADO', 'EM_SEPARACAO'])

      printEntries.push(logEntry)
    }

    return NextResponse.json({
      success: true,
      printedCount: orderIds.length,
      timestamp: now,
      entries: printEntries
    })
  } catch (err: any) {
    console.error('Error logging print shipment:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
