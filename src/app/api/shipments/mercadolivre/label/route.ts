import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')
    const orderIds = searchParams.get('orderIds')
    const directShipmentId = searchParams.get('shipmentId')

    const clientId = process.env.MERCADOLIVRE_APP_ID || '8874323668438382'
    const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET || 'JQrkHL7X2ieJdxPpevL9b9PX3iffwfFm'
    const sellerId = process.env.MERCADOLIVRE_SELLER_ID || '470831049'

    // 1. Get access token
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Falha ao autenticar com o Mercado Livre' }, { status: 500 })
    }

    const tokenData = await tokenRes.json()
    const token = tokenData.access_token

    let shipmentIds: string[] = []

    if (directShipmentId) {
      shipmentIds = directShipmentId.split(',')
    } else {
      const supabase = await createClient()
      const idsToFetch = orderIds ? orderIds.split(',') : (orderId ? [orderId] : [])

      if (idsToFetch.length === 0) {
        return NextResponse.json({ error: 'Nenhum pedido especificado' }, { status: 400 })
      }

      // Query database for orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, tracking_code')
        .in('id', idsToFetch)

      // Search ML for each order
      for (const ord of orders || []) {
        const rawNum = ord.order_number.replace(/\D/g, '')
        try {
          const mlOrderRes = await fetch(`https://api.mercadolibre.com/orders/${rawNum}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (mlOrderRes.ok) {
            const mlOrd = await mlOrderRes.json()
            if (mlOrd.shipping?.id) {
              shipmentIds.push(String(mlOrd.shipping.id))
            }
          } else if (ord.tracking_code && /^\d+$/.test(ord.tracking_code)) {
            shipmentIds.push(ord.tracking_code)
          }
        } catch (e) {
          console.error('Error fetching ML order shipment:', e)
        }
      }
    }

    if (shipmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível encontrar o ID de envio do Mercado Livre para este pedido.' },
        { status: 404 }
      )
    }

    // 2. Fetch Official PDF from Mercado Livre
    const shipmentQuery = shipmentIds.join(',')
    const labelRes = await fetch(
      `https://api.mercadolibre.com/shipment_labels?shipment_ids=${shipmentQuery}&response_type=pdf`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!labelRes.ok) {
      const errorJson = await labelRes.json().catch(() => null)
      console.warn('ML Label error:', errorJson)
      return NextResponse.json(
        {
          error: errorJson?.message || 'Etiqueta não disponível para impressão no momento.',
          details: errorJson,
        },
        { status: labelRes.status }
      )
    }

    const pdfBuffer = await labelRes.arrayBuffer()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="etiquetas-mercadolivre-${shipmentIds.join('-')}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Error in Mercado Livre shipment label route:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
