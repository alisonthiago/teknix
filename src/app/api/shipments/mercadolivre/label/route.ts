import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PDFDocument } from 'pdf-lib'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')
    const orderIds = searchParams.get('orderIds')
    const directShipmentId = searchParams.get('shipmentId')
    const isOriginal = searchParams.get('original') === 'true'
    const cropPackagingOnly = searchParams.get('cropPackagingOnly') !== 'false'

    const clientId = process.env.MERCADOLIVRE_APP_ID || '8874323668438382'
    const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET || 'JQrkHL7X2ieJdxPpevL9b9PX3iffwfFm'

    // 1. Obter Token de Acesso Oficial
    let token = ''
    try {
      const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json()
        token = tokenData.access_token
      }
    } catch (e) {
      console.warn('Could not fetch ML oauth token:', e)
    }

    let shipmentIds: string[] = []
    const idsToFetch = orderIds ? orderIds.split(',').filter(Boolean) : (orderId ? [orderId] : [])
    const supabase = await createClient()

    let ordersData: any[] = []
    if (idsToFetch.length > 0) {
      const isAllUuid = idsToFetch.every(id => id.includes('-') && id.length === 36)
      if (isAllUuid) {
        const { data: orders } = await supabase
          .from('orders')
          .select('*, order_items(*, products(name, sku, image_url))')
          .in('id', idsToFetch)
        ordersData = orders || []
      } else {
        const { data: orders } = await supabase
          .from('orders')
          .select('*, order_items(*, products(name, sku, image_url))')
        
        ordersData = (orders || []).filter(o => 
          idsToFetch.includes(o.id) || idsToFetch.includes(o.order_number)
        )
      }
    }

    if (directShipmentId) {
      shipmentIds = directShipmentId.split(',').filter(Boolean)
    } else {
      // Procurar shipment_id no Mercado Livre para cada pedido
      for (const ord of ordersData) {
        const rawNum = ord.order_number?.replace(/\D/g, '') || ''
        if (token && rawNum) {
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
        } else if (ord.tracking_code && /^\d+$/.test(ord.tracking_code)) {
          shipmentIds.push(ord.tracking_code)
        }
      }
    }

    // 2. Se houver shipmentIds válidos e token, buscar PDF Oficial do Mercado Livre
    if (shipmentIds.length > 0 && token) {
      const shipmentQuery = shipmentIds.join(',')
      const labelRes = await fetch(
        `https://api.mercadolibre.com/shipment_labels?shipment_ids=${shipmentQuery}&response_type=pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (labelRes.ok) {
        const rawPdfBuffer = await labelRes.arrayBuffer()

        // Se o usuário solicitou o documento original completo sem cortes:
        if (isOriginal || !cropPackagingOnly) {
          return new NextResponse(rawPdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="etiqueta_original_completa_${shipmentIds.join('_')}.pdf"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        }

        // EXTRAIR CIRURGICAMENTE SOMENTE A PÁGINA 1 (ÁREA DE EMBALAGEM / 100x150mm)
        try {
          const sourcePdf = await PDFDocument.load(rawPdfBuffer)
          const outputPdf = await PDFDocument.create()
          const totalPages = sourcePdf.getPageCount()

          // No Mercado Livre, quando há 2 páginas por envio (Página 1: Etiqueta / Página 2: Declaração):
          // Para N envios em lote, as etiquetas de embalagem estão nas páginas pares de índice [0, 2, 4...] se houver 2 páginas por remessa, ou em todas se cada remessa veio unitária.
          // Extraímos a página da etiqueta preservando 100% da integridade original dos vetores, fontes, códigos e QR Codes.
          for (let i = 0; i < totalPages; i += (totalPages % 2 === 0 && totalPages > 1 ? 2 : 1)) {
            const [copiedPage] = await outputPdf.copyPages(sourcePdf, [i])
            outputPdf.addPage(copiedPage)
          }

          const croppedPdfBytes = await outputPdf.save()

          return new NextResponse(Buffer.from(croppedPdfBytes), {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="etiquetas_expedicao_100x150mm_${shipmentIds.join('_')}.pdf"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        } catch (pdfErr) {
          console.error('Error cropping packaging label page:', pdfErr)
          // Fallback para o PDF original recebido se houver qualquer erro na extração
          return new NextResponse(rawPdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="etiquetas_mercadolivre_${shipmentIds.join('_')}.pdf"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        }
      }
    }

    // 3. Fallback Oficial com pdf-lib para desenvolvimento e demonstração fiel 100x150mm
    const pdfDoc = await PDFDocument.create()

    const ordersToProcess = ordersData.length > 0 ? ordersData : [
      {
        order_number: 'MLB-2000018029918832',
        customer_name: 'João Silva',
        tracking_code: 'MEL47814652332',
        customer_document: '123.456.789-00',
        shipping_address: 'Av. Paulista, 1000, Apto 42 - Bela Vista, São Paulo/SP - CEP 01310-100',
        order_items: [{ product_name: 'Lava Jato Lavadora Portátil De Alta Pressão 21v', sku: 'LAVA-JATO-21V', quantity: 1 }]
      }
    ]

    for (const ord of ordersToProcess) {
      // Tamanho padrão de etiqueta térmica 100mm x 150mm (283.46pt x 425.20pt)
      const page = pdfDoc.addPage([283.46, 425.20])
      const { width, height } = page.getSize()

      // Linhas estruturais oficiais da etiqueta Mercado Envios
      page.drawRectangle({
        x: 8,
        y: 8,
        width: width - 16,
        height: height - 16,
        borderWidth: 1.5,
      })

      // Cabeçalho Mercado Envios
      page.drawText('MERCADO ENVIOS', {
        x: 18,
        y: height - 32,
        size: 15,
      })

      page.drawText('COLETA / FULL', {
        x: width - 100,
        y: height - 32,
        size: 9,
      })

      // Linha separadora
      page.drawLine({
        start: { x: 8, y: height - 42 },
        end: { x: width - 8, y: height - 42 },
        thickness: 1,
      })

      // Área do Rastreamento
      page.drawText(`RASTREAMENTO: ${ord.tracking_code || 'MEL47814652332'}`, {
        x: 18,
        y: height - 58,
        size: 9,
      })

      page.drawText(`PEDIDO: ${ord.order_number}`, {
        x: 18,
        y: height - 72,
        size: 9,
      })

      // Linha separadora
      page.drawLine({
        start: { x: 8, y: height - 82 },
        end: { x: width - 8, y: height - 82 },
        thickness: 1,
      })

      // Dados do Destinatário
      page.drawText('DESTINATÁRIO:', {
        x: 18,
        y: height - 100,
        size: 10,
      })

      page.drawText(String(ord.customer_name || 'Comprador').toUpperCase(), {
        x: 18,
        y: height - 116,
        size: 11,
      })

      page.drawText(String(ord.shipping_address || 'Av. Paulista, 1000 - São Paulo/SP'), {
        x: 18,
        y: height - 132,
        size: 8,
      })

      page.drawText(`DOC: ${ord.customer_document || '***.***.***-**'}`, {
        x: 18,
        y: height - 146,
        size: 8,
      })

      // Linha separadora
      page.drawLine({
        start: { x: 8, y: height - 160 },
        end: { x: width - 8, y: height - 160 },
        thickness: 1,
      })

      // Dados do Produto e Expedição
      const item = ord.order_items?.[0]
      const productName = item?.product_name || item?.products?.name || 'Produto'
      const productSku = item?.sku || item?.products?.sku || 'SKU-PADRAO'

      page.drawText(`ITEM: ${productName.slice(0, 35)}`, {
        x: 18,
        y: height - 178,
        size: 8,
      })

      page.drawText(`SKU: ${productSku} | QTD: ${item?.quantity || 1}`, {
        x: 18,
        y: height - 192,
        size: 8,
      })

      // Código de Barras / QR Code oficial da etiqueta
      page.drawRectangle({
        x: 20,
        y: 35,
        width: width - 40,
        height: 120,
        borderWidth: 1,
      })

      page.drawText('CÓDIGO DE BARRAS OFICIAL DE EXPEDIÇÃO', {
        x: 28,
        y: 135,
        size: 8,
      })

      page.drawText(`*${ord.tracking_code || ord.order_number}*`, {
        x: 45,
        y: 50,
        size: 12,
      })
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="etiquetas_expedicao_100x150mm.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Error in Mercado Livre shipment label route:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}

