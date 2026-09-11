import { NextRequest, NextResponse } from 'next/server'
import { updateListingPrice, updateSitePrice } from '@/services/catalog/priceService'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params
    const body = await request.json()
    const { listingId, isSitePrice, newPrice, reason } = body

    if (typeof newPrice !== 'number' || newPrice < 0) {
      return NextResponse.json({ error: 'Preço inválido' }, { status: 400 })
    }

    if (isSitePrice) {
      const result = await updateSitePrice({
        productId,
        newPrice,
        origin: 'SITE'
      })
      return NextResponse.json({ success: true, result })
    }

    if (!listingId) {
      return NextResponse.json({ error: 'listingId é obrigatório para alteração de anúncio' }, { status: 400 })
    }

    const result = await updateListingPrice({
      listingId,
      newPrice,
      origin: 'FLOW',
      notes: reason || 'Ajuste individual de preço no anúncio'
    })

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[API Update Price Error]', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar preço' }, { status: 500 })
  }
}
