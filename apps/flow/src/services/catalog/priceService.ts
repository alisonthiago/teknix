import { createClient } from '@supabase/supabase-js'
import { getValidTokenBySellerId } from '../mercadolivre/client'

let _adminClientPromise: Promise<any> | null = null

async function getAdminClient() {
  if (!_adminClientPromise) {
    _adminClientPromise = (async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      if (!key) {
        throw new Error('[PriceService] Chave de API do Supabase ausente nas variáveis de ambiente.')
      }
      const client = createClient(supabaseUrl, key)
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await client.auth.signInWithPassword({
            email: 'teste@teste.com',
            password: '123456'
          })
        } catch {
          // ignore
        }
      }
      return client
    })()
  }
  return _adminClientPromise
}

export interface PriceUpdateParams {
  listingId: string
  newPrice: number
  origin: 'FLOW' | 'HUB' | 'SITE' | 'MERCADO_LIVRE' | 'SHOPEE' | 'MAGALU'
  userId?: string | null
  notes?: string | null
}

export interface SitePriceUpdateParams {
  productId: string
  newPrice: number
  origin: 'HUB' | 'SITE' | 'FLOW'
  userId?: string | null
  notes?: string | null
}

/**
 * Atualiza o preço de UMA listing/oferta específica.
 *
 * REGRA ABSOLUTA:
 * - Alterar MLB111 NUNCA altera MLB222, MLB333, SITE ou outros canais.
 * - Registra histórico detalhado com origem da alteração.
 * - Evita loops: se origin for 'MERCADO_LIVRE', não redispara para o Mercado Livre.
 */
export async function updateListingPrice(params: PriceUpdateParams) {
  const { listingId, newPrice, origin, userId, notes } = params
  const supabase = await getAdminClient()

  if (newPrice <= 0 || isNaN(newPrice)) {
    throw new Error('Preço inválido para atualização')
  }

  // 1. Busca anúncio atual
  const { data: listing, error: findErr } = await supabase
    .from('marketplace_listings')
    .select('id, product_id, external_id, channel, price, marketplace_account_id')
    .eq('id', listingId)
    .single()

  if (findErr || !listing) {
    throw new Error(`Anúncio não encontrado: ${listingId}`)
  }

  const oldPrice = Number(listing.price) || 0

  // Se o preço for idêntico, nada a fazer (idempotência)
  if (Math.abs(oldPrice - newPrice) < 0.001) {
    return { ok: true, unchanged: true, currentPrice: oldPrice }
  }

  // 2. Se a alteração veio do FLOW e for Mercado Livre, envia para a API oficial do ML
  if (origin === 'FLOW' && listing.channel === 'mercadolivre' && listing.external_id) {
    try {
      // Busca seller_id da conta vinculada
      let sellerId: string | null = null
      if (listing.marketplace_account_id) {
        const { data: acc } = await supabase
          .from('marketplace_accounts')
          .select('seller_id')
          .eq('id', listing.marketplace_account_id)
          .maybeSingle()
        sellerId = acc?.seller_id || null
      }

      if (sellerId) {
        const token = await getValidTokenBySellerId(sellerId)
        const mlRes = await fetch(`https://api.mercadolibre.com/items/${listing.external_id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ price: newPrice })
        })

        if (!mlRes.ok) {
          const mlErr = await mlRes.json().catch(() => ({}))
          console.error(`[ML Price Update Error] Item ${listing.external_id}:`, mlErr)
          throw new Error(`Mercado Livre rejeitou a alteração de preço: ${mlErr.message || mlRes.statusText}`)
        }
      }
    } catch (apiErr: any) {
      console.error('[Price Update] Falha ao enviar para marketplace:', apiErr.message)
      throw apiErr
    }
  }

  // 3. Atualiza EXCLUSIVAMENTE este anúncio no banco
  const { error: updErr } = await supabase
    .from('marketplace_listings')
    .update({
      price: newPrice,
      last_synced_at: new Date().toISOString(),
      last_sync_origin: origin
    })
    .eq('id', listing.id)

  if (updErr) {
    throw new Error(`Erro ao salvar novo preço no banco: ${updErr.message}`)
  }

  // 4. Registra histórico de auditoria
  await supabase
    .from('listing_price_history')
    .insert({
      listing_id: listing.id,
      product_id: listing.product_id,
      channel: listing.channel,
      external_id: listing.external_id,
      old_price: oldPrice,
      new_price: newPrice,
      origin,
      user_id: userId || null,
      notes: notes || `Preço atualizado de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)} via ${origin}`
    })

  return {
    ok: true,
    listingId: listing.id,
    externalId: listing.external_id,
    oldPrice,
    newPrice,
    origin
  }
}

/**
 * Atualiza o preço do SITE oficial TEKNIX.
 * REGRA ABSOLUTA:
 * NUNCA propaga nem altera os preços do Mercado Livre, Shopee ou Magalu.
 */
export async function updateSiteProductPrice(params: SitePriceUpdateParams) {
  const { productId, newPrice, origin, userId } = params
  const supabase = await getAdminClient()

  if (newPrice <= 0 || isNaN(newPrice)) {
    throw new Error('Preço inválido para o site')
  }

  const { data: prod, error: getErr } = await supabase
    .from('products')
    .select('id, site_price, sku')
    .eq('id', productId)
    .single()

  if (getErr || !prod) {
    throw new Error('Produto não encontrado')
  }

  const oldPrice = Number(prod.site_price) || 0

  await supabase
    .from('products')
    .update({
      site_price: newPrice,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)

  // Auditoria
  await supabase
    .from('listing_price_history')
    .insert({
      product_id: productId,
      channel: 'site',
      external_id: prod.sku,
      old_price: oldPrice,
      new_price: newPrice,
      origin,
      user_id: userId || null,
      notes: `Preço da loja oficial alterado de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)} via ${origin}. Marketplaces inalterados.`
    })

  return { ok: true, productId, oldPrice, newPrice }
}

export { updateSiteProductPrice as updateSitePrice }
