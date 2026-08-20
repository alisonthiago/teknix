import { NextResponse } from 'next/server'
import { syncMercadoLivreAccount } from '@/services/mercadolivre/syncCatalog'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sellerId } = body

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId is required' }, { status: 400 })
    }

    const results = await syncMercadoLivreAccount(sellerId.toString())

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída! ${results.productsSynced} produto(s) e ${results.ordersSynced} pedido(s) sincronizados.`,
      ...results
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message || 'Erro durante a sincronização' }, { status: 500 })
  }
}
