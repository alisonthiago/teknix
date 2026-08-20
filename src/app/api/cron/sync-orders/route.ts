import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncMercadoLivreAccount } from '@/services/mercadolivre/syncCatalog'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const summary = {
    timestamp: new Date().toISOString(),
    accountsProcessed: 0,
    ordersReconciled: 0,
    productsSynced: 0,
    errors: [] as string[]
  }

  try {
    // 1. Fetch all active Mercado Livre connections
    const { data: mlConnections, error: mlErr } = await supabase
      .from('marketplace_connections')
      .select('seller_id, account_name, marketplace_id')
      .eq('marketplace_id', 'mercadolivre')
      .eq('is_active', true)

    if (mlErr) {
      console.error('[Cron Sync] Error loading connections:', mlErr)
    }

    // Default seller fallback if none listed
    const connectionsToSync = (mlConnections && mlConnections.length > 0)
      ? mlConnections
      : [{ seller_id: '470831049', account_name: 'TEKNIXBRASIL', marketplace_id: 'mercadolivre' }]

    for (const conn of connectionsToSync) {
      if (!conn.seller_id) continue
      try {
        console.log(`[Cron Sync] Reconciling account ${conn.account_name} (${conn.seller_id})...`)
        const res = await syncMercadoLivreAccount(conn.seller_id)
        summary.accountsProcessed++
        summary.ordersReconciled += res.ordersSynced
        summary.productsSynced += res.productsSynced
        if (res.errors.length) {
          summary.errors.push(...res.errors)
        }
      } catch (err: any) {
        console.error(`[Cron Sync] Account ${conn.seller_id} sync error:`, err)
        summary.errors.push(err.message)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reconciliação automática concluída com sucesso! Processadas ${summary.accountsProcessed} conta(s), reconciliados ${summary.ordersReconciled} pedido(s).`,
      summary
    })
  } catch (error: any) {
    console.error('[Cron Sync Fatal Error]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
