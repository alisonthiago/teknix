import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    // 1. Consulta conexão do Mercado Livre
    const { data: conn } = await supabase
      .from('marketplace_connections')
      .select('*')
      .eq('marketplace_id', 'mercadolivre')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 2. Consulta último evento de webhook
    const { data: lastEvent } = await supabase
      .from('marketplace_webhook_events')
      .select('*')
      .eq('marketplace_id', 'mercadolivre')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 3. Consulta última venda / pedido real
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('order_number, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const isConnected = Boolean(conn && (conn.access_token || conn.refresh_token))
    let tokenStatus = 'NOT_CONNECTED'
    let hoursRemaining = 0

    if (conn?.token_expires_at) {
      const expTime = new Date(conn.token_expires_at).getTime()
      const now = Date.now()
      hoursRemaining = Math.max(0, Math.round((expTime - now) / (1000 * 60 * 60) * 10) / 10)
      tokenStatus = expTime > now ? 'VALID' : 'EXPIRED'
    } else if (conn?.access_token) {
      tokenStatus = 'VALID'
    }

    const health = {
      mercadolivre: {
        status: isConnected ? (tokenStatus === 'VALID' ? 'HEALTHY' : 'DEGRADED') : 'NOT_CONFIGURED',
        sellerId: conn?.seller_id || null,
        isConnected,
        tokenStatus,
        tokenExpiresInHours: hoursRemaining,
        lastTokenUpdate: conn?.updated_at || null,
        webhookStatus: lastEvent ? 'ACTIVE' : 'READY',
        lastWebhookEvent: lastEvent?.created_at || null,
        lastOrderNumber: lastOrder?.order_number || null,
        lastOrderSync: lastOrder?.updated_at || lastOrder?.created_at || null,
        message: isConnected
          ? `Mercado Livre conectado com sucesso. Token válido por ${hoursRemaining}h (renovação automática ativa).`
          : 'Nenhuma conexão ativa do Mercado Livre configurada.'
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(health)
  } catch (err: any) {
    return NextResponse.json({ error: err.message, status: 'ERROR' }, { status: 500 })
  }
}
