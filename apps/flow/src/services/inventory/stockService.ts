import { createClient } from '@supabase/supabase-js'

let _adminClientPromise: Promise<any> | null = null

async function getAdminClient() {
  if (!_adminClientPromise) {
    _adminClientPromise = (async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      if (!key) {
        throw new Error('[StockService] Chave de API do Supabase ausente nas variáveis de ambiente.')
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

export interface SaleEventParams {
  productId: string
  channel: string // 'site' | 'mercadolivre' | 'shopee' | 'magalu'
  listingExternalId?: string | null // e.g. 'MLB222'
  orderId: string
  quantity: number
  unitPriceSold: number
  customerName?: string | null
  soldAt?: string | null
}

export interface CancellationParams {
  productId: string
  channel: string
  orderId: string
  quantity: number
  listingExternalId?: string | null
  reason?: string
}

export interface ReservationParams {
  productId: string
  orderId: string
  channel?: string
  quantity: number
  ttlMinutes?: number // Default: 15 minutos (tempo padrão do Pix)
}

/**
 * 1. Processa baixa de estoque físico central por venda em qualquer canal/anúncio.
 *
 * BLINDAGENS DE CONCORRÊNCIA E SEGURANÇA:
 * - O estoque físico central é ÚNICO.
 * - Idempotente: evita duplicidade caso o webhook seja recebido mais de uma vez.
 * - Concorrência protegida: utiliza trava condicional (.gte('stock', quantity)).
 * - NUNCA permite que o estoque fique negativo (< 0).
 */
export async function processSaleDeduction(sale: SaleEventParams) {
  const { productId, channel, listingExternalId, orderId, quantity, unitPriceSold, customerName, soldAt } = sale
  const supabase = await getAdminClient()

  if (quantity <= 0) throw new Error('Quantidade inválida para venda')

  // 1. Idempotência: verifica se a venda deste pedido já foi processada
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  const { data: existingMovement } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('product_id', productId)
    .eq('type', 'VENDA')
    .ilike('notes', `%[ORDER:${orderId}]%`)
    .maybeSingle()

  if (existingMovement) {
    console.log(`[StockService] Venda do pedido ${orderId} já processada anteriormente. Ignorando duplicata.`)
    return { ok: true, duplicate: true }
  }

  // 2. Busca estoque atual do produto central
  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('id, name, sku, stock, reserved_stock, cost_purchase')
    .eq('id', productId)
    .single()

  if (pErr || !product) {
    throw new Error(`Produto central não encontrado: ${productId}`)
  }

  const currentStock = Number(product.stock) || 0

  if (currentStock < quantity) {
    throw new Error(`INSUFFICIENT_STOCK: Saldo físico insuficiente (solicitado: ${quantity}, disponível em estoque: ${currentStock})`)
  }

  const newStock = currentStock - quantity

  // 3. Atualização atômica condicional: .gte('stock', quantity)
  // Garante que se duas vendas simultâneas chegarem, a segunda que tentar debitar além do saldo é barrada
  const { data: updatedProduct, error: updErr } = await supabase
    .from('products')
    .update({
      stock: newStock,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .gte('stock', quantity)
    .select('id, stock')
    .maybeSingle()

  if (updErr) {
    throw new Error(`Erro ao atualizar estoque central: ${updErr.message}`)
  }

  if (!updatedProduct) {
    throw new Error(`RACE_CONDITION_BLOCKED: Estoque consumido por outra operação concorrente no mesmo instante. Operação cancelada para evitar estoque negativo.`)
  }

  // 4. Registra movimentação de estoque
  const notes = `[ORDER:${orderId}] Venda via ${channel.toUpperCase()}${listingExternalId ? ` (${listingExternalId})` : ''} — Preço unitário: R$ ${unitPriceSold.toFixed(2)} — Comprador: ${customerName || 'Cliente'}`

  await supabase
    .from('inventory_movements')
    .insert({
      product_id: productId,
      type: 'VENDA',
      quantity: -quantity,
      reference_id: isUuid ? orderId : null,
      notes,
      created_at: soldAt || new Date().toISOString()
    })

  // 5. Se houver anúncio vinculado (ex: MLB222), atualiza métricas de vendas dele
  if (listingExternalId) {
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('id, sold_quantity, total_revenue')
      .or(`external_id.eq.${listingExternalId},external_listing_id.eq.${listingExternalId}`)
      .maybeSingle()

    if (listing) {
      const soldQty = (Number(listing.sold_quantity) || 0) + quantity
      const totalRev = (Number(listing.total_revenue) || 0) + (quantity * unitPriceSold)

      await supabase
        .from('marketplace_listings')
        .update({
          sold_quantity: soldQty,
          total_revenue: totalRev,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', listing.id)
    }
  }

  console.log(`[StockService] Baixa efetuada com sucesso: Produto ${product.sku} | Estoque: ${currentStock} -> ${updatedProduct.stock} | Canal: ${channel}`)

  return {
    ok: true,
    productId,
    oldStock: currentStock,
    newStock: updatedProduct.stock,
    channel,
    listingExternalId
  }
}

/**
 * 2. Processa cancelamento / devolução de venda, restaurando o estoque físico central.
 *
 * GARANTIAS:
 * - Evita estorno duplicado (idempotência por orderId + tipo DEVOLUCAO).
 * - Restaura o estoque central exatamente na quantidade devolvida.
 * - Registra movimentação de auditoria.
 * - Se houver listing vinculada, estorna as métricas de venda.
 */
export async function processSaleCancellation(cancellation: CancellationParams) {
  const { productId, channel, orderId, quantity, listingExternalId, reason } = cancellation
  const supabase = await getAdminClient()

  if (quantity <= 0) throw new Error('Quantidade inválida para cancelamento')

  // 1. Idempotência do cancelamento
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  const { data: existingReturn } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('product_id', productId)
    .eq('type', 'DEVOLUCAO')
    .ilike('notes', `%[ORDER:${orderId}]%`)
    .maybeSingle()

  if (existingReturn) {
    console.log(`[StockService] Cancelamento/devolução do pedido ${orderId} já processado. Ignorando duplicata.`)
    return { ok: true, duplicate: true }
  }

  // 2. Busca estoque atual
  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('id, name, sku, stock')
    .eq('id', productId)
    .single()

  if (pErr || !product) {
    throw new Error(`Produto não encontrado: ${productId}`)
  }

  const currentStock = Number(product.stock) || 0
  const newStock = currentStock + quantity

  // 3. Incrementa estoque central
  const { error: updErr } = await supabase
    .from('products')
    .update({
      stock: newStock,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)

  if (updErr) {
    throw new Error(`Erro ao restaurar estoque: ${updErr.message}`)
  }

  // 4. Registra movimentação DEVOLUCAO
  const notes = `[ORDER:${orderId}] Cancelamento/Estorno via ${channel.toUpperCase()}${listingExternalId ? ` (${listingExternalId})` : ''} — Motivo: ${reason || 'Cancelamento de Pedido'}`

  await supabase
    .from('inventory_movements')
    .insert({
      product_id: productId,
      type: 'DEVOLUCAO',
      quantity: quantity,
      reference_id: isUuid ? orderId : null,
      notes,
      created_at: new Date().toISOString()
    })

  // 5. Se houver listing vinculada, ajusta métricas
  if (listingExternalId) {
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('id, sold_quantity, total_revenue, price')
      .or(`external_id.eq.${listingExternalId},external_listing_id.eq.${listingExternalId}`)
      .maybeSingle()

    if (listing) {
      const soldQty = Math.max(0, (Number(listing.sold_quantity) || 0) - quantity)
      const totalRev = Math.max(0, (Number(listing.total_revenue) || 0) - (quantity * Number(listing.price || 0)))

      await supabase
        .from('marketplace_listings')
        .update({
          sold_quantity: soldQty,
          total_revenue: totalRev,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', listing.id)
    }
  }

  console.log(`[StockService] Estoque restaurado: Produto ${product.sku} | Estoque: ${currentStock} -> ${newStock} | Pedido: ${orderId}`)

  return {
    ok: true,
    productId,
    oldStock: currentStock,
    newStock,
    channel,
    restoredQuantity: quantity
  }
}

/**
 * 3. Reserva estoque temporário para Checkout / Pix com TTL de expiração.
 */
export async function reserveStockWithTTL(params: ReservationParams) {
  const { productId, orderId, channel = 'site', quantity, ttlMinutes = 15 } = params
  const supabase = await getAdminClient()

  if (quantity <= 0) throw new Error('Quantidade inválida para reserva')

  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('id, sku, stock, reserved_stock')
    .eq('id', productId)
    .single()

  if (pErr || !product) throw new Error(`Produto não encontrado: ${productId}`)

  const currentStock = Number(product.stock) || 0
  const currentReserved = Number(product.reserved_stock) || 0
  const availableStock = currentStock - currentReserved

  if (availableStock < quantity) {
    throw new Error(`INSUFFICIENT_AVAILABLE_STOCK: Saldo disponível insuficiente para reserva (disponível: ${availableStock}, solicitado: ${quantity})`)
  }

  const newReserved = currentReserved + quantity
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()

  // Atualiza reserved_stock no produto
  const { error: updErr } = await supabase
    .from('products')
    .update({
      reserved_stock: newReserved,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)

  if (updErr) throw new Error(`Erro ao reservar estoque: ${updErr.message}`)

  // Registra movimentação RESERVA com data de expiração no notes
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  await supabase
    .from('inventory_movements')
    .insert({
      product_id: productId,
      type: 'RESERVA',
      quantity: -quantity,
      reference_id: isUuid ? orderId : null,
      notes: `[ORDER:${orderId}] Reserva temporária via ${channel.toUpperCase()} — Expira em: ${expiresAt} (${ttlMinutes} min)`,
      created_at: new Date().toISOString()
    })

  return {
    ok: true,
    productId,
    reservedQuantity: quantity,
    totalReserved: newReserved,
    availableStock: currentStock - newReserved,
    expiresAt
  }
}

/**
 * 4. Libera reserva de estoque (ex: Pix expirado ou checkout abandonado).
 */
export async function releaseReservedStock(params: { productId: string; orderId: string; quantity: number; reason?: string }) {
  const { productId, orderId, quantity, reason = 'Pix expirado / Checkout cancelado' } = params
  const supabase = await getAdminClient()

  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('id, sku, stock, reserved_stock')
    .eq('id', productId)
    .single()

  if (pErr || !product) throw new Error(`Produto não encontrado: ${productId}`)

  const currentReserved = Number(product.reserved_stock) || 0
  const newReserved = Math.max(0, currentReserved - quantity)

  await supabase
    .from('products')
    .update({
      reserved_stock: newReserved,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  await supabase
    .from('inventory_movements')
    .insert({
      product_id: productId,
      type: 'LIBERACAO_RESERVA',
      quantity: quantity,
      reference_id: isUuid ? orderId : null,
      notes: `[ORDER:${orderId}] Liberação de reserva — Motivo: ${reason}`,
      created_at: new Date().toISOString()
    })

  return {
    ok: true,
    productId,
    releasedQuantity: quantity,
    remainingReserved: newReserved,
    availableStock: Number(product.stock) - newReserved
  }
}
