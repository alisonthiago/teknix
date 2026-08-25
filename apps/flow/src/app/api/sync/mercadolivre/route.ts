import { NextResponse } from 'next/server'
import { syncMercadoLivreAccount } from '@/services/mercadolivre/syncCatalog'
import { syncFullCatalog } from '@/services/mercadolivre/productSync'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sellerId, mode } = body

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId is required' }, { status: 400 })
    }

    const seller = sellerId.toString()

    // mode=legacy → apenas pedidos (catálogo legado desativado por padrão)
    if (mode === 'legacy') {
      const legacyResults = await syncMercadoLivreAccount(seller, { syncCatalog: false, syncOrders: true })
      return NextResponse.json({
        success: true,
        message: `Pedidos sincronizados: ${legacyResults.ordersSynced}.`,
        ...legacyResults,
      })
    }

    // Padrão: catálogo completo (ml_listings) + pedidos — sem corrida entre dois syncs de catálogo
    const [catalogReport, orderResults] = await Promise.all([
      syncFullCatalog(seller),
      syncMercadoLivreAccount(seller, { syncCatalog: false, syncOrders: true }),
    ])

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída! ${orderResults.ordersSynced} pedido(s). Catálogo: ${catalogReport.fullySynced}/${catalogReport.totalItems} completos.`,
      ordersSynced: orderResults.ordersSynced,
      productsSynced: catalogReport.fullySynced,
      errors: [...(orderResults.errors || []), ...(catalogReport.failed ? [`${catalogReport.failed} anúncio(s) com falha`] : [])],
      catalogReport,
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message || 'Erro durante a sincronização' }, { status: 500 })
  }
}
