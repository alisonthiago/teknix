import { NextRequest, NextResponse } from 'next/server'
import { searchMercadoLivreCatalog } from '@/services/mercadolivre/catalogSearch'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, gtin, brand, model, imageUrl, price } = body

    const candidates = await searchMercadoLivreCatalog({ query, gtin, brand, model, imageUrl, price })
    return NextResponse.json({ 
      candidates,
      debug: {
        receivedImage: imageUrl,
        candidatesCount: candidates.length,
        firstThumb: candidates[0]?.thumbnail
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao buscar catálogo' }, { status: 500 })
  }
}
