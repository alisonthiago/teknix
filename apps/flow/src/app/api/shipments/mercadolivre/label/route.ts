import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getValidTokenBySellerId } from '@/services/mercadolivre/client'
import { PDFDocument } from 'pdf-lib'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')
    const orderIds = searchParams.get('orderIds')
    const directShipmentId = searchParams.get('shipmentId')
    const isOriginal = searchParams.get('original') === 'true'
    const cropPackagingOnly = searchParams.get('cropPackagingOnly') !== 'false'

    const supabase = await createClient()

    let ordersData: any[] = []
    let sellerId: string | null = null

    if (orderId || orderIds) {
      const idsToFetch = orderIds ? orderIds.split(',').filter(Boolean) : (orderId ? [orderId] : [])
      const isAllUuid = idsToFetch.every(id => id.includes('-') && id.length === 36)
       if (isAllUuid) {
          const { data: orders } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, sku, image_url))')
            .in('id', idsToFetch)
          ordersData = orders || []
          if ((ordersData[0] as any)?.marketplace_id) {
            const { data: conn } = await supabase
              .from('marketplace_connections')
              .select('seller_id')
              .eq('marketplace_id', (ordersData[0] as any).marketplace_id)
              .limit(1)
              .maybeSingle()
            if (conn?.seller_id) sellerId = conn.seller_id
          }
        } else {
          const { data: orders } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, sku, image_url))')
          
          ordersData = (orders || []).filter(o => 
            idsToFetch.includes(o.id) || idsToFetch.includes(o.order_number)
          )
          if ((ordersData[0] as any)?.marketplace_id) {
            const { data: conn } = await supabase
              .from('marketplace_connections')
              .select('seller_id')
              .eq('marketplace_id', (ordersData[0] as any).marketplace_id)
              .limit(1)
              .maybeSingle()
            if (conn?.seller_id) sellerId = conn.seller_id
          }
        }
    }

    let token = ''
    if (sellerId) {
      try {
        token = await getValidTokenBySellerId(sellerId)
      } catch (e) {
        console.warn('Could not get valid ML token for label generation:', e)
      }
    }

    let shipmentIds: string[] = []
    if (directShipmentId) {
      shipmentIds = directShipmentId.split(',').filter(Boolean)
    } else {
      for (const ord of ordersData) {
        const rawNum = ord.order_number?.replace(/\D/g, '') || ''
        if (token && rawNum) {
          try {
            const mlOrderRes = await fetch(`https://api.mercadolibre.com/orders/${rawNum}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (mlOrderRes.ok) {
              const mlOrd = await mlOrderRes.json()
              const shipId = mlOrd.shipping?.id || mlOrd.shipment_id || mlOrd.shipment?.id
              if (shipId) {
                shipmentIds.push(String(shipId))
              }
            }
          } catch (e) {
            console.error('Error fetching ML order shipment:', e)
          }
        }
        if (shipmentIds.length === 0 && ord.tracking_code) {
          const numericTracking = ord.tracking_code.replace(/\D/g, '')
          if (numericTracking.length > 10) {
            shipmentIds.push(numericTracking)
          }
        }
      }
    }

    console.log('[Label Route] ordersData:', ordersData.length, 'sellerId:', sellerId, 'token:', !!token, 'shipmentIds:', shipmentIds)

    if (shipmentIds.length > 0 && token) {
      const shipmentQuery = shipmentIds.join(',')
      const labelRes = await fetch(
        `https://api.mercadolibre.com/shipment_labels?shipment_ids=${shipmentQuery}&response_type=pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      console.log('[Label Route] ML shipment_labels status:', labelRes.status)

      if (labelRes.ok) {
        const rawPdfBuffer = await labelRes.arrayBuffer()

        if (isOriginal || !cropPackagingOnly) {
          return new NextResponse(rawPdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="etiqueta_original_${shipmentIds.join('_')}.pdf"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        }

        try {
          const sourcePdf = await PDFDocument.load(rawPdfBuffer)
          const outputPdf = await PDFDocument.create()
          const totalPages = sourcePdf.getPageCount()

          for (let i = 0; i < totalPages; i += (totalPages % 2 === 0 && totalPages > 1 ? 2 : 1)) {
            const [copiedPage] = await outputPdf.copyPages(sourcePdf, [i])
            outputPdf.addPage(copiedPage)
          }

          const croppedPdfBytes = await outputPdf.save()

          return new NextResponse(Buffer.from(croppedPdfBytes), {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="etiqueta_expedicao_${shipmentIds.join('_')}.pdf"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        } catch (pdfErr) {
          console.error('Error cropping packaging label page:', pdfErr)
          return new NextResponse(rawPdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="etiqueta_mercadolivre_${shipmentIds.join('_')}.pdf"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        }
      }
    }

    return NextResponse.json(
      { error: 'Etiqueta não disponível. Verifique se o pedido possui envio gerado no Mercado Livre.', details: { orders: ordersData.length, shipmentIds, token: !!token } },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error in Mercado Livre shipment label route:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
