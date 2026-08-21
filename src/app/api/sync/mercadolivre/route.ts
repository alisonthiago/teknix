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

    // mode=full -> usa o novo MarketplaceProductSyncService com cascata completa
    // mode=legacy (default) -> usa o syncCatalog antigo (pedidos + listings)
    if (mode === 'full') {
      const report = await syncFullCatalog(sellerId.toString())
      return NextResponse.json({
        success: true,
        message: `Sincronização completa: ${report.fullySynced} OK, ${report.partiallySynced} parcial, ${report.failed} falhas de ${report.totalItems} anúncios.`,
        report
      })
    }

    // Modo padrão: sync legado + novo catálogo em cascata
    const [legacyResults, catalogReport] = await Promise.all([
      syncMercadoLivreAccount(sellerId.toString()),
      syncFullCatalog(sellerId.toString()).catch(err => {
        console.error('[Sync Route] Erro no catálogo completo:', err.message)
        return null
      })
    ])

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída! ${legacyResults.productsSynced} produto(s) e ${legacyResults.ordersSynced} pedido(s) sincronizados.${catalogReport ? ` Catálogo: ${catalogReport.fullySynced}/${catalogReport.totalItems} completos.` : ''}`,
      ...legacyResults,
      catalogReport
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message || 'Erro durante a sincronização' }, { status: 500 })
  }
}
