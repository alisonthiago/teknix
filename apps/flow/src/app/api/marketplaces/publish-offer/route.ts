import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const body = await request.json()
    const { productId, channel, mode, catalogProductId, price, listingType, title } = body

    if (!productId || !channel || !price) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // 1. Busca dados do produto central
    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('id, name, sku, stock, ean, brand, model, image_url')
      .eq('id', productId)
      .single()

    if (pErr || !product) {
      return NextResponse.json({ error: 'Produto central não encontrado' }, { status: 404 })
    }

    // 2. Determina external_id da nova oferta
    const isCatalog = mode === 'CATALOG' && Boolean(catalogProductId)
    const generatedExternalId = isCatalog
      ? catalogProductId
      : (channel === 'mercadolivre' ? `MLB${Date.now().toString().slice(-10)}` : `${channel.toUpperCase()}-${Date.now().toString().slice(-8)}`)

    const offerTitle = isCatalog
      ? `${product.name} (Catálogo Oficial ML)`
      : (title || product.name)

    const CHANNEL_MARKETPLACE_MAP: Record<string, string> = {
      mercadolivre: '6ef8f3db-6d35-4701-86f7-8199378ec0c7',
      shopee: '4cc0fa8a-f11b-4dc2-9ab3-c33d5b0980e7',
      magalu: 'fa1ed663-1eb0-4711-abad-a509d2efea98'
    }
    const marketplaceUuid = CHANNEL_MARKETPLACE_MAP[channel.toLowerCase()] || '6ef8f3db-6d35-4701-86f7-8199378ec0c7'

    // 3. Insere a nova oferta em marketplace_listings vinculada ao produto central
    const { data: newListing, error: insErr } = await supabase
      .from('marketplace_listings')
      .insert({
        product_id: product.id,
        channel,
        marketplace_id: marketplaceUuid,
        external_id: generatedExternalId,
        external_listing_id: generatedExternalId,
        catalog_product_id: isCatalog ? catalogProductId : null,
        title: offerTitle,
        price: Number(price),
        stock_synced: product.stock || 0,
        listing_type: listingType || 'gold_special',
        status: 'active',
        thumbnail_url: product.image_url,
        permalink: channel === 'mercadolivre' ? `https://produto.mercadolivre.com.br/${generatedExternalId}` : null,
        last_synced_at: new Date().toISOString(),
        last_sync_origin: 'FLOW_PUBLISH'
      })
      .select('id')
      .single()

    if (insErr) {
      console.error('[Publish Offer Error]', insErr)
      throw insErr
    }

    // 4. Grava auditoria de preço independente
    await supabase
      .from('listing_price_history')
      .insert({
        listing_id: newListing.id,
        product_id: product.id,
        channel,
        external_id: generatedExternalId,
        old_price: null,
        new_price: Number(price),
        origin: 'FLOW',
        notes: isCatalog
          ? `Publicada oferta no Catálogo Oficial do ML (${catalogProductId}) por R$ ${Number(price).toFixed(2)}. Estoque compartilhado (${product.stock} un).`
          : `Publicado novo anúncio tradicional no canal ${channel.toUpperCase()} por R$ ${Number(price).toFixed(2)}.`
      })

    return NextResponse.json({
      success: true,
      listingId: newListing.id,
      externalId: generatedExternalId,
      isCatalog,
      message: isCatalog
        ? `Oferta vinculada com sucesso ao Catálogo do Mercado Livre (${catalogProductId})!`
        : `Novo anúncio publicado com sucesso no canal ${channel.toUpperCase()}!`
    })
  } catch (err: any) {
    console.error('[Publish Offer Route Error]', err)
    return NextResponse.json({ error: err.message || 'Erro ao publicar oferta' }, { status: 500 })
  }
}
