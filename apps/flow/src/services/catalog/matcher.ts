import { createClient } from '@supabase/supabase-js'

export interface ExternalListingData {
  channel: string // 'mercadolivre' | 'shopee' | 'magalu' | 'site'
  externalId: string // e.g. 'MLB123456789'
  title: string
  price: number
  stock: number
  sellerSku?: string | null
  gtin?: string | null
  brand?: string | null
  model?: string | null
  catalogProductId?: string | null
  thumbnailUrl?: string | null
  permalink?: string | null
  marketplaceAccountId?: string | null
}

export interface MatchResult {
  action: 'LINKED' | 'PENDING_MATCH' | 'EXISTING_UPDATED'
  productId?: string | null
  listingId?: string | null
  pendingMatchId?: string | null
  confidence: number
  reason: string
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

/**
 * Motor Anti-Duplicação do TEKNIX FLOW
 *
 * Princípio Fundamental:
 * NUNCA duplica um produto central apenas porque um anúncio externo foi detectado.
 * 1. Verifica se o anúncio já está cadastrado em marketplace_listings.
 * 2. Se for novo anúncio, busca correspondência exata por GTIN/EAN, SKU ou Catalog ID.
 * 3. Se confiança >= 90%, vincula diretamente ao produto central existente.
 * 4. Se houver dúvida (< 90%), envia para pending_product_matches para aprovação do usuário.
 */
export async function matchAndLinkExternalListing(item: ExternalListingData): Promise<MatchResult> {
  const supabase = getAdminClient()

  // 1. O anúncio já existe cadastrado no banco?
  const { data: existingListing } = await supabase
    .from('marketplace_listings')
    .select('id, product_id, price')
    .or(`external_id.eq.${item.externalId},external_listing_id.eq.${item.externalId}`)
    .maybeSingle()

  if (existingListing) {
    // Atualiza apenas o anúncio específico (preço individual, estoque e última sync)
    await supabase
      .from('marketplace_listings')
      .update({
        price: item.price,
        stock_synced: item.stock,
        title: item.title,
        thumbnail_url: item.thumbnailUrl,
        permalink: item.permalink,
        catalog_product_id: item.catalogProductId || undefined,
        last_synced_at: new Date().toISOString(),
        last_sync_origin: item.channel.toUpperCase()
      })
      .eq('id', existingListing.id)

    return {
      action: 'EXISTING_UPDATED',
      productId: existingListing.product_id,
      listingId: existingListing.id,
      confidence: 100,
      reason: `Anúncio ${item.externalId} já vinculado ao produto central.`
    }
  }

  // 2. Busca de Correspondência com Alta Confiança
  let matchedProductId: string | null = null
  let confidence = 0
  let reason = 'Nenhuma correspondência segura encontrada.'

  // 2.1 Busca por GTIN / EAN (Confiança 100%)
  if (item.gtin && item.gtin.trim().length >= 8) {
    const cleanGtin = item.gtin.trim()
    const { data: productByGtin } = await supabase
      .from('products')
      .select('id, name, sku')
      .eq('ean', cleanGtin)
      .maybeSingle()

    if (productByGtin) {
      matchedProductId = productByGtin.id
      confidence = 100
      reason = `Correspondência exata por Código de Barras (EAN/GTIN: ${cleanGtin}) com produto ${productByGtin.name}`
    }
  }

  // 2.2 Busca por SKU Interno = Seller SKU (Confiança 95%)
  if (!matchedProductId && item.sellerSku && item.sellerSku.trim().length > 0) {
    const cleanSku = item.sellerSku.trim()
    const { data: productBySku } = await supabase
      .from('products')
      .select('id, name, sku')
      .eq('sku', cleanSku)
      .maybeSingle()

    if (productBySku) {
      matchedProductId = productBySku.id
      confidence = 95
      reason = `Correspondência exata por SKU interno (${cleanSku}) com produto ${productBySku.name}`
    }
  }

  // 2.3 Busca por Catalog Product ID compartilhado (Confiança 90%)
  if (!matchedProductId && item.catalogProductId && item.catalogProductId.trim().length > 0) {
    const { data: siblingListing } = await supabase
      .from('marketplace_listings')
      .select('product_id')
      .eq('catalog_product_id', item.catalogProductId.trim())
      .not('product_id', 'is', null)
      .maybeSingle()

    if (siblingListing?.product_id) {
      matchedProductId = siblingListing.product_id
      confidence = 90
      reason = `Correspondência por Catalog Product ID (${item.catalogProductId}) já vinculado anteriormente.`
    }
  }

  // 2.4 Busca por Marca + Modelo (Confiança 75% — requer confirmação humana)
  if (!matchedProductId && item.brand && item.model) {
    const { data: productByModel } = await supabase
      .from('products')
      .select('id, name, brand, model')
      .ilike('brand', item.brand.trim())
      .ilike('model', item.model.trim())
      .maybeSingle()

    if (productByModel) {
      matchedProductId = productByModel.id
      confidence = 75
      reason = `Correspondência provável por Marca (${item.brand}) e Modelo (${item.model}).`
    }
  }

  // 3. DECISÃO:
  // Se Confiança >= 90% -> Vincula diretamente ao produto existente sem duplicar
  if (confidence >= 90 && matchedProductId) {
    const { data: newListing, error: insErr } = await supabase
      .from('marketplace_listings')
      .insert({
        product_id: matchedProductId,
        channel: item.channel,
        marketplace_id: item.channel,
        marketplace_account_id: item.marketplaceAccountId || null,
        external_id: item.externalId,
        external_listing_id: item.externalId,
        seller_sku: item.sellerSku || null,
        title: item.title,
        price: item.price,
        stock_synced: item.stock,
        status: 'ACTIVE',
        catalog_product_id: item.catalogProductId || null,
        thumbnail_url: item.thumbnailUrl || null,
        permalink: item.permalink || null,
        last_synced_at: new Date().toISOString(),
        last_sync_origin: item.channel.toUpperCase()
      })
      .select('id')
      .single()

    if (!insErr && newListing) {
      return {
        action: 'LINKED',
        productId: matchedProductId,
        listingId: newListing.id,
        confidence,
        reason
      }
    }
  }

  // Se Confiança < 90% ou não encontrado -> Envia para a fila "Produtos para Vincular"
  const { data: pendingMatch } = await supabase
    .from('pending_product_matches')
    .upsert({
      channel: item.channel,
      external_id: item.externalId,
      seller_sku: item.sellerSku || null,
      title: item.title,
      price: item.price,
      stock: item.stock,
      thumbnail_url: item.thumbnailUrl || null,
      permalink: item.permalink || null,
      gtin: item.gtin || null,
      brand: item.brand || null,
      model: item.model || null,
      catalog_product_id: item.catalogProductId || null,
      suggested_product_id: matchedProductId || null,
      confidence_score: confidence,
      match_reason: reason,
      status: 'pending',
      updated_at: new Date().toISOString()
    }, { onConflict: 'channel, external_id' })
    .select('id')
    .maybeSingle()

  return {
    action: 'PENDING_MATCH',
    productId: matchedProductId,
    pendingMatchId: pendingMatch?.id || null,
    confidence,
    reason: `Anúncio colocado na fila de vinculação (${reason}). Nenhuma duplicação criada.`
  }
}
