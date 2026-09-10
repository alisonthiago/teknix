import { createAdminClient } from '@/utils/supabase/admin'
import type { FlowListingInput, FlowMatchResult } from './types'

export async function upsertFlowListing(input: FlowListingInput) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('flow_listings').upsert({
    channel_id: input.channelId,
    external_id: input.externalId,
    sku: input.sku ?? null,
    title: input.title ?? null,
    current_price: input.price ?? null,
    stock_quantity: input.stockQuantity ?? null,
    raw_data: input.rawData ?? {},
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'channel_id,external_id' }).select().single()
  if (error) throw error
  return data
}

export async function recordListingPrice(listingId: string, price: number, source: 'MANUAL' | 'CHANNEL' | 'SYNC') {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('flow_listing_prices').insert({ listing_id: listingId, price, source }).select().single()
  if (error) throw error
  return data
}

export async function suggestProductMatch(listingId: string, userId: string, sku?: string | null, ean?: string | null): Promise<FlowMatchResult> {
  const supabase = createAdminClient()
  let query = supabase.from('flow_products').select('id, sku, ean').eq('user_id', userId)
  if (sku) query = query.eq('sku', sku)
  else if (ean) query = query.eq('ean', ean)
  else return { status: 'PENDING', reason: 'Nenhum identificador seguro informado' }

  const { data, error } = await query.limit(2)
  if (error) throw error
  const exact = data?.length === 1 ? data[0] : null
  const result: FlowMatchResult = exact
    ? { status: 'MATCHED', productId: exact.id, reason: 'Correspondência exata por identificador' }
    : { status: data?.length ? 'PENDING' : 'NONE', reason: data?.length ? 'Correspondência ambígua; revisão necessária' : 'Produto não encontrado' }

  await supabase.from('flow_product_matches').upsert({
    listing_id: listingId,
    candidate_product_id: result.productId ?? null,
    reason: result.reason,
    confidence: exact ? 1 : 0,
    status: exact ? 'ACCEPTED' : 'PENDING',
  }, { onConflict: 'listing_id' })
  if (exact) await supabase.from('flow_listings').update({ product_id: exact.id }).eq('id', listingId)
  return result
}