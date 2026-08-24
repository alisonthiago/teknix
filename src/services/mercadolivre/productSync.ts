 
/**
 * MarketplaceProductSyncService
 * 
 * Serviço central de sincronização completa de produtos do Mercado Livre.
 * 
 * Segue rigorosamente a documentação oficial do Mercado Livre:
 * - Item principal:   GET /items/{ITEM_ID}
 * - Descrição:        GET /items/{ITEM_ID}/description
 * - Preços:           GET /items/{ITEM_ID}/prices
 * - Fotos/Pictures:   campo pictures[] dentro de GET /items/{ITEM_ID}
 * 
 * Princípios:
 * 1. Dado Real é Dado Real — nunca inventar, nunca usar || 0 para esconder falha
 * 2. Idempotência — nunca duplicar produto/listing
 * 3. Atualização Parcial — falha em descrição não apaga preço
 * 4. Status de Sincronização — diferenciar SYNCED, PARTIAL, FAILED
 * 5. Observabilidade — log estruturado por operação
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getValidTokenBySellerId } from './client'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SyncResult {
  itemId: string
  status: 'SYNCED' | 'PARTIAL' | 'FAILED'
  fields: {
    main: boolean
    price: boolean
    description: boolean
    pictures: number // count synced
    picturesTotal: number
    stock: boolean
    attributes: boolean
    variations: boolean
  }
  priceML: number | null
  priceInDB: number | null
  durationMs: number
  errors: string[]
}

export interface CatalogSyncReport {
  sellerId: string
  startedAt: string
  completedAt: string
  totalItems: number
  fullySynced: number
  partiallySynced: number
  failed: number
  results: SyncResult[]
}

// ─── Supabase singleton ─────────────────────────────────────────────────────

let _supabase: SupabaseClient<any> | null = null
function getSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabase
}

// ─── ML API helpers ─────────────────────────────────────────────────────────

async function mlGet(path: string, token: string): Promise<{ ok: boolean; data: any }> {
  const start = Date.now()
  const url = `https://api.mercadolibre.com${path}`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    const elapsed = Date.now() - start
    if (res.ok) {
      console.log(`[ML API] GET ${path} → 200 OK (${elapsed}ms)`)
    } else {
      console.warn(`[ML API] GET ${path} → ${res.status} (${elapsed}ms)`, data?.error, data?.message)
    }
    return { ok: res.ok, data }
  } catch (err: any) {
    console.error(`[ML API] GET ${path} → NETWORK ERROR:`, err.message)
    return { ok: false, data: null }
  }
}

// ─── Core Sync Function ─────────────────────────────────────────────────────

/**
 * Sincroniza UM anúncio completo do Mercado Livre na TEKNIX.
 * Consulta separadamente: /items, /items/description, /items/prices
 * Nunca usa o resultado de um como fallback do outro.
 */
export async function syncSingleItem(itemId: string, sellerId: string): Promise<SyncResult> {
  const startMs = Date.now()
  const supabase = getSupabase()
  const errors: string[] = []
  const fields = {
    main: false,
    price: false,
    description: false,
    pictures: 0,
    picturesTotal: 0,
    stock: false,
    attributes: false,
    variations: false
  }

  console.log(`\n════════════════════════════════════════════`)
  console.log(`[SyncItem] Iniciando sincronização completa: ${itemId}`)
  console.log(`════════════════════════════════════════════`)

  // 1. Obter token válido via Single-Flight Mutex
  let token: string
  try {
    token = await getValidTokenBySellerId(sellerId)
  } catch (err: any) {
    errors.push(`Token inválido: ${err.message}`)
    return {
      itemId, status: 'FAILED', fields,
      priceML: null, priceInDB: null,
      durationMs: Date.now() - startMs, errors
    }
  }

  // ── PASSO 1: Dados Principais via GET /items/{id} ────────────────────────
  const { ok: mainOk, data: item } = await mlGet(`/items/${itemId}`, token)
  if (!mainOk || !item?.id) {
    errors.push(`GET /items/${itemId} falhou`)
    return {
      itemId, status: 'FAILED', fields,
      priceML: null, priceInDB: null,
      durationMs: Date.now() - startMs, errors
    }
  }

  // ── PASSO 2: Preço via GET /items/{id}/prices ────────────────────────────
  // NÃO usar item.price como único preço — consultar endpoint de preços
  let priceFromPricesEndpoint: number | null = null
  let basePrice: number | null = null
  let originalPrice: number | null = null
  let promoPrice: number | null = null

  const { ok: priceOk, data: pricesData } = await mlGet(`/items/${itemId}/prices`, token)
  if (priceOk && pricesData?.prices && pricesData.prices.length > 0) {
    // Prioridade: standard price primeiro, depois o primeiro disponível
    const standardPrice = pricesData.prices.find((p: any) => p.type === 'standard')
    const promoEntry = pricesData.prices.find((p: any) => p.type === 'promotion' || p.regular_amount !== null)

    if (standardPrice?.amount !== undefined && standardPrice.amount !== null) {
      priceFromPricesEndpoint = Number(standardPrice.amount)
      if (standardPrice.regular_amount !== null) {
        originalPrice = Number(standardPrice.regular_amount)
        promoPrice = Number(standardPrice.amount)
      }
    }
    if (promoEntry && promoEntry.amount !== null) {
      promoPrice = Number(promoEntry.amount)
    }
    fields.price = true
  } else if (!priceOk) {
    errors.push(`GET /items/${itemId}/prices falhou — usando item.price como fallback`)
  }

  // Fallback: usar item.price SOMENTE se o endpoint de preços falhou ou não retornou amount
  const finalPrice = priceFromPricesEndpoint ?? (item.price !== null && item.price !== undefined ? Number(item.price) : null)
  basePrice = item.base_price !== null && item.base_price !== undefined ? Number(item.base_price) : null
  originalPrice = originalPrice ?? (item.original_price !== null ? Number(item.original_price) : null)

  if (priceFromPricesEndpoint !== null) {
    fields.price = true
  } else if (finalPrice !== null) {
    // Preço veio de item.price, não do endpoint oficial — marcar como parcial
    errors.push(`Preço obtido via item.price (fallback) — endpoint /prices não retornou valor`)
    fields.price = true
  } else {
    errors.push(`Preço INDISPONÍVEL — não retornou valor em nenhum endpoint`)
    fields.price = false
  }

  // ── PASSO 3: Descrição via GET /items/{id}/description ───────────────────
  let descriptionText: string | null = null
  let descriptionPlain: string | null = null

  const { ok: descOk, data: descData } = await mlGet(`/items/${itemId}/description`, token)
  if (descOk && descData) {
    // Prioridade: plain_text (texto limpo), depois text (pode ter HTML)
    descriptionPlain = descData.plain_text?.trim() || null
    descriptionText = descData.text?.trim() || null
    fields.description = true
  } else {
    errors.push(`GET /items/${itemId}/description falhou — descrição não sincronizada`)
  }

  // ── PASSO 4: Fotos (Pictures) via item.pictures[] ───────────────────────
  const pictures: Array<{ id: string; url: string; secure_url: string; size: string; max_size: string }> = []
  fields.picturesTotal = item.pictures?.length || 0

  if (item.pictures && item.pictures.length > 0) {
    for (const pic of item.pictures) {
      const secureUrl = (pic.secure_url || pic.url || '').replace('http://', 'https://')
      if (secureUrl) {
        pictures.push({
          id: pic.id || '',
          url: pic.url || secureUrl,
          secure_url: secureUrl,
          size: pic.size || '',
          max_size: pic.max_size || ''
        })
      }
    }
    fields.pictures = pictures.length
  }

  const primaryPicUrl = pictures[0]?.secure_url || item.thumbnail?.replace('http://', 'https://') || null

  // ── PASSO 5: Extrair campos principais ───────────────────────────────────
  // SKU: seller_custom_field ou seller_sku. Se nulo, usar external_id como identificador
  const sku = item.seller_custom_field || item.seller_sku || null
  const title = item.title || 'Produto Mercado Livre'
  const stock = item.available_quantity !== null && item.available_quantity !== undefined
    ? Number(item.available_quantity) : null
  const soldQty = Number(item.sold_quantity) || 0
  const condition = item.condition || 'new'
  const listingType = item.listing_type_id || null
  const status = item.status || 'active'
  const permalink = item.permalink || null
  const categoryId = item.category_id || null
  const currencyId = item.currency_id || 'BRL'
  const catalogProductId = item.catalog_product_id || null
  const userProductId = item.user_product_id || null
  const familyId = item.family_id || null

  // Atributos relevantes
  const attrs = item.attributes || []
  const brand = attrs.find((a: any) => a.id === 'BRAND')?.value_name || null
  const model = attrs.find((a: any) => a.id === 'MODEL')?.value_name || null
  const gtin = attrs.find((a: any) => ['GTIN', 'EAN', 'UPC', 'ISBN'].includes(a.id))?.value_name || null
  const weight = attrs.find((a: any) => a.id === 'WEIGHT' || a.id === 'NET_WEIGHT')?.value_name || null
  const dimensions = attrs.find((a: any) => a.id === 'PACKAGE_DIMENSIONS')?.value_name || null
  fields.attributes = attrs.length > 0

  // Variações
  const variations = item.variations || []
  fields.variations = variations.length > 0

  // Stock
  if (stock !== null) fields.stock = true

  // ── PASSO 6: Determinar Marketplace ID e User ID ────────────────────────
  let marketplaceId = 'mercadolivre'
  const { data: mp } = await supabase
    .from('marketplaces')
    .select('id')
    .or('code.eq.MERCADO_LIVRE,code.eq.mercadolivre')
    .maybeSingle()
  if (mp?.id) marketplaceId = mp.id

  let userId: string | null = null
  const { data: conn } = await supabase
    .from('marketplace_connections')
    .select('user_id')
    .eq('seller_id', sellerId)
    .maybeSingle()
  if (conn?.user_id) userId = conn.user_id

  // ── PASSO 7: Upsert em ml_listings (chave: external_listing_id) ─
  // NUNCA usar price || 0 — salvar null se preço não disponível
  const syncStatus = errors.length === 0 ? 'SYNCED'
    : (fields.main ? 'PARTIAL' : 'FAILED')

  const listingPayload: Record<string, any> = {
    marketplace_id: marketplaceId,
    seller_id: sellerId,
    external_listing_id: itemId,
    title,
    status,
    listing_type: listingType,
    condition,
    permalink,
    thumbnail_url: primaryPicUrl,
    category_id: categoryId,
    currency_id: currencyId,
    catalog_product_id: catalogProductId,
    user_product_id: userProductId,
    family_id: familyId,
    brand,
    model,
    gtin,
    weight,
    dimensions,
    sold_quantity: soldQty,
    description: descriptionPlain || descriptionText,
    sync_status: syncStatus,
    price_synced_from_endpoint: priceFromPricesEndpoint !== null,
    last_synced_at: new Date().toISOString(),
    last_sync_error: errors.length > 0 ? errors.join('; ') : null,
    sync_attempts: 1
  }

  // Só atualizar preço/estoque se foram obtidos com sucesso
  if (finalPrice !== null) listingPayload.price = finalPrice
  if (basePrice !== null) listingPayload.base_price = basePrice
  if (originalPrice !== null) listingPayload.original_price = originalPrice
  if (promoPrice !== null) listingPayload.promo_price = promoPrice
  if (stock !== null) listingPayload.stock = stock
  if (stock !== null) listingPayload.stock_synced = stock

  // Select-or-insert pattern (sem onConflict que pode falhar)
  const { data: existingListing } = await supabase
    .from('ml_listings')
    .select('id, price, description')
    .eq('external_listing_id', itemId)
    .maybeSingle()

  let listingDbId: string | null = null

  if (existingListing) {
    // Atualização Parcial: não sobrescrever campos que vieram como null desta sync
    const updatePayload: Record<string, any> = { ...listingPayload }
    if (finalPrice === null) delete updatePayload.price
    if (descriptionPlain === null && descriptionText === null && existingListing.description) {
      delete updatePayload.description // mantém último valor confirmado
    }
    await supabase.from('ml_listings').update(updatePayload).eq('id', existingListing.id)
    listingDbId = existingListing.id
    console.log(`[SyncItem] Listing UPDATED: ${itemId} (ID: ${existingListing.id}) | Preço: R$ ${finalPrice ?? 'INDISPONÍVEL'}`)
  } else {
    const { data: newListing, error: insErr } = await supabase
      .from('ml_listings')
      .insert({ ...listingPayload, product_id: null })
      .select('id')
      .single()
    if (insErr) {
      errors.push(`Erro ao inserir listing: ${insErr.message}`)
    } else {
      listingDbId = newListing?.id || null
      console.log(`[SyncItem] Listing CREATED: ${itemId} (ID: ${listingDbId}) | Preço: R$ ${finalPrice ?? 'INDISPONÍVEL'}`)
    }
  }

  // ── PASSO 8: Sincronizar Fotos ────────────────────────────────────────────
  // Não deletar fotos se nenhuma nova chegou — comparar por picture_id
  if (listingDbId && pictures.length > 0) {
    const { data: existingPics } = await supabase
      .from('ml_listing_images')
      .select('external_picture_id')
      .eq('listing_id', listingDbId)

    const existingPicIds = new Set((existingPics || []).map((p: any) => p.external_picture_id))
    let newPicsCount = 0

    for (let i = 0; i < pictures.length; i++) {
      const pic = pictures[i]
      if (!existingPicIds.has(pic.id)) {
        // Nova foto — inserir
        await supabase.from('ml_listing_images').insert({
          listing_id: listingDbId,
          external_picture_id: pic.id,
          url: pic.secure_url,
          size: pic.size,
          max_size: pic.max_size,
          is_primary: i === 0,
          sort_order: i
        })
        newPicsCount++
      }
    }

    // Remover fotos que não existem mais no ML (por picture_id)
    const currentMLPicIds = pictures.map(p => p.id).filter(Boolean)
    if (currentMLPicIds.length > 0 && existingPics && existingPics.length > 0) {
      const toDelete = (existingPics as any[]).filter(ep => !currentMLPicIds.includes(ep.external_picture_id))
      for (const ep of toDelete) {
        await supabase.from('ml_listing_images')
          .delete().eq('listing_id', listingDbId).eq('external_picture_id', ep.external_picture_id)
      }
    }

    console.log(`[SyncItem] Fotos: ${pictures.length} total (${newPicsCount} novas adicionadas)`)
  }

  // ── PASSO 9: Upsert do produto interno (se tiver SKU cadastrado) ──────────
  if (sku && listingDbId) {
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, stock')
      .eq('sku', sku)
      .maybeSingle()

    if (existingProduct) {
      const productUpdate: Record<string, any> = {
        name: title,
        brand,
        model,
        ean: gtin,
        image_url: primaryPicUrl,
        updated_at: new Date().toISOString()
      }
      if (stock !== null) productUpdate.stock = stock
      await supabase.from('products').update(productUpdate).eq('id', existingProduct.id)

      // Vincular listing ao produto
      await supabase.from('ml_listings').update({ product_id: existingProduct.id }).eq('id', listingDbId)
    }
  }

  // ── PASSO 10: Sincronizar Variações ──────────────────────────────────────
  if (variations.length > 0 && listingDbId) {
    for (const variation of variations) {
      const varSku = variation.seller_custom_field || variation.id?.toString()
      const varStock = variation.available_quantity ?? null
      const varPrice = variation.price ?? null
      const varAttrs = (variation.attribute_combinations || []).map((a: any) => ({
        id: a.id, name: a.name, value: a.value_name
      }))

      await supabase.from('ml_listing_variations').upsert({
        listing_id: listingDbId,
        external_variation_id: variation.id?.toString(),
        seller_sku: varSku,
        price: varPrice,
        stock: varStock,
        attributes: varAttrs,
        updated_at: new Date().toISOString()
      }, { onConflict: 'listing_id, external_variation_id' })
    }
    console.log(`[SyncItem] Variações: ${variations.length} sincronizadas`)
  }

  // ── PASSO 11: Relatório Final ─────────────────────────────────────────────
  fields.main = true
  const status_final: 'SYNCED' | 'PARTIAL' | 'FAILED' = errors.length === 0 ? 'SYNCED'
    : (fields.main && (fields.price || fields.description) ? 'PARTIAL' : 'FAILED')

  const durationMs = Date.now() - startMs
  console.log(`[SyncItem] ${itemId} → ${status_final} em ${durationMs}ms | Preço ML: R$ ${finalPrice ?? 'INDISPONÍVEL'} | Fotos: ${fields.pictures}/${fields.picturesTotal}`)
  if (errors.length > 0) console.warn(`[SyncItem] Erros:`, errors)

  return {
    itemId,
    status: status_final,
    fields,
    priceML: finalPrice,
    priceInDB: finalPrice,
    durationMs,
    errors
  }
}

// ─── Sync All Items (Full Catalog Sync) ─────────────────────────────────────

export async function syncFullCatalog(sellerId: string): Promise<CatalogSyncReport> {
  const startedAt = new Date().toISOString()
  const results: SyncResult[] = []

  console.log(`\n╔══════════════════════════════════════════════╗`)
  console.log(`║  TEKNIX × ML — SINCRONIZAÇÃO COMPLETA DO CATÁLOGO  ║`)
  console.log(`╚══════════════════════════════════════════════╝`)

  let token: string
  try {
    token = await getValidTokenBySellerId(sellerId)
  } catch (err: any) {
    return {
      sellerId, startedAt, completedAt: new Date().toISOString(),
      totalItems: 0, fullySynced: 0, partiallySynced: 0, failed: 1,
      results: [{ itemId: 'N/A', status: 'FAILED', fields: { main: false, price: false, description: false, pictures: 0, picturesTotal: 0, stock: false, attributes: false, variations: false }, priceML: null, priceInDB: null, durationMs: 0, errors: [`Token inválido: ${err.message}`] }]
    }
  }

  // Buscar todos os IDs de anúncios ativos
  let offset = 0
  const allItemIds: string[] = []

  while (true) {
    const { ok, data } = await mlGet(`/users/${sellerId}/items/search?status=active&limit=50&offset=${offset}`, token)
    if (!ok || !data?.results?.length) break
    allItemIds.push(...data.results)
    if (data.results.length < 50) break
    offset += 50
  }

  // Também buscar itens pausados
  const { ok: pausedOk, data: pausedData } = await mlGet(`/users/${sellerId}/items/search?status=paused&limit=50`, token)
  if (pausedOk && pausedData?.results?.length) {
    allItemIds.push(...pausedData.results)
  }

  console.log(`[CatalogSync] Total de anúncios encontrados: ${allItemIds.length}`)

  // Sincronizar cada item individualmente com cascata completa
  for (const itemId of allItemIds) {
    try {
      const result = await syncSingleItem(itemId, sellerId)
      results.push(result)
    } catch (err: any) {
      console.error(`[CatalogSync] Erro inesperado em ${itemId}:`, err.message)
      results.push({
        itemId,
        status: 'FAILED',
        fields: { main: false, price: false, description: false, pictures: 0, picturesTotal: 0, stock: false, attributes: false, variations: false },
        priceML: null,
        priceInDB: null,
        durationMs: 0,
        errors: [err.message]
      })
    }
  }

  const completedAt = new Date().toISOString()
  const report: CatalogSyncReport = {
    sellerId,
    startedAt,
    completedAt,
    totalItems: results.length,
    fullySynced: results.filter(r => r.status === 'SYNCED').length,
    partiallySynced: results.filter(r => r.status === 'PARTIAL').length,
    failed: results.filter(r => r.status === 'FAILED').length,
    results
  }

  console.log(`\n[CatalogSync] RELATÓRIO FINAL:`)
  console.log(`  Total: ${report.totalItems} | Sinc. Completa: ${report.fullySynced} | Parcial: ${report.partiallySynced} | Falha: ${report.failed}`)

  return report
}
