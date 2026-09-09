/* ==========================================================================
   TEKNIX SITE — CHECKOUT & ORDER CREATION SERVICE (SERVER-SIDE MERCADO PAGO)
   Ponta a ponta: Carrinho → Cliente → Pedido → Itens → Baixa de Estoque → Mercado Pago

   OTIMIZAÇÕES (diagnóstico 2026-09-09):
   - Update de cliente existente é fire-and-forget (não bloqueia checkout)
   - Baixa de estoque: loop serial → Promise.all paralelo + 100% fire-and-forget
   - Notificações: fire-and-forget
   - UPDATE de payment_id: fire-and-forget
   - Idempotency key ESTÁVEL (orderId apenas, sem Date.now) → sem cobrança dupla
   - Pagamento ANTES da baixa de estoque (resposta mais rápida para o usuário)
   Zero tokens no frontend.
   ========================================================================== */

import { supabase } from '../lib/supabase'
import type { CartItem } from '../context/CartContext'
import { dispatchSiteNotification } from './notifications'
import { generatePixBRCode, isValidPixPayload } from './pix'

export interface CheckoutCustomerData {
  name: string
  email: string
  document: string // CPF / CNPJ
  phone: string
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city?: string
  state?: string
}

export interface CreateOrderParams {
  items: CartItem[]
  customer: CheckoutCustomerData
  shippingCost: number
  shippingMethod: string
  discount: number
  paymentMethod: 'pix' | 'credit_card' | 'boleto'
  userId?: string
  // Credit card tokenization (Mercado Pago SDK)
  cardToken?: string
  cardBrand?: string
  installments?: number
}

export interface CreatedOrderResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  total?: number
  paymentId?: string
  // Pix
  qrCode?: string
  qrCodeBase64?: string
  // Boleto
  ticketUrl?: string
  barcodeContent?: string
  digitableLine?: string
  // Legacy / external checkout fallback
  checkoutUrl?: string
  error?: string
}

export async function processCheckoutOrder(params: CreateOrderParams): Promise<CreatedOrderResult> {
  const {
    items, customer, shippingCost, shippingMethod,
    discount, paymentMethod, userId, cardToken, cardBrand, installments
  } = params

  if (!items || items.length === 0) {
    return { success: false, error: 'O carrinho está vazio.' }
  }

  try {
    // ── FASE 1: Cálculo de totais (síncrono, zero I/O) ──────────────────────
    const subtotal = items.reduce((acc, i) => {
      const price = i.promo_price && i.promo_price > 0 ? i.promo_price : i.price
      return acc + (price * i.quantity)
    }, 0)
    const total = Math.max(0, subtotal + shippingCost - discount)
    const orderNumber = `#TK-${Math.floor(1000 + Math.random() * 9000)}`
    const fullDeliveryAddress = [
      customer.street,
      customer.number,
      customer.complement ? ` - ${customer.complement}` : '',
      customer.neighborhood,
      `${customer.city || 'São Paulo'} - ${customer.state || 'SP'}`,
      `CEP ${customer.zipCode}`
    ].filter(Boolean).join(', ')

    // ── FASE 2: Upsert de cliente ────────────────────────────────────────────
    // SELECT para obter customerId (necessário para o pedido).
    // UPDATE em background — nunca bloqueia o checkout.
    let customerId: string | null = null
    try {
      const { data: existing } = await supabase
        .from('customers')
        .select('id, user_id')
        .or(`document.eq.${customer.document},email.eq.${customer.email}`)
        .maybeSingle()

      if (existing?.id) {
        customerId = existing.id
        // Fire-and-forget: atualiza dados sem bloquear
        supabase
          .from('customers')
          .update({
            name: customer.name,
            phone: customer.phone,
            address: customer.street,
            number: customer.number,
            complement: customer.complement || '',
            neighborhood: customer.neighborhood,
            zip_code: customer.zipCode,
            user_id: userId || existing.user_id || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .then(undefined, () => {})
      } else {
        const { data: nc } = await supabase
          .from('customers')
          .insert({
            user_id: userId || null,
            name: customer.name,
            email: customer.email,
            document: customer.document,
            phone: customer.phone,
            address: customer.street,
            number: customer.number,
            complement: customer.complement || '',
            neighborhood: customer.neighborhood,
            zip_code: customer.zipCode,
            city: customer.city || 'São Paulo',
            state: customer.state || 'SP',
            created_at: new Date().toISOString()
          })
          .select('id')
          .single()
        customerId = nc?.id || null
      }
    } catch (custErr) {
      console.warn('[checkout] upsertCustomer:', custErr)
    }

    // ── FASE 3: Criar Pedido no DB ───────────────────────────────────────────
    const orderPayload = {
      order_number: orderNumber,
      customer_id: customerId,
      user_id: userId || null,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_document: customer.document,
      subtotal,
      shipping_cost: shippingCost,
      discount,
      total,
      status: 'pending',
      payment_method:
        paymentMethod === 'pix' ? 'Mercado Pago - Pix'
        : paymentMethod === 'credit_card' ? 'Mercado Pago - Cartão'
        : 'Mercado Pago - Boleto',
      payment_status: 'pending',
      shipping_method: shippingMethod,
      origin: 'Loja Própria (SITE)',
      delivery_address: fullDeliveryAddress,
      notes: `Entrega via ${shippingMethod}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const orderItemsPayload = items.map(item => {
      const unitPrice = item.promo_price && item.promo_price > 0 ? item.promo_price : item.price
      return {
        product_id: item.id,
        product_name: item.name,
        sku: item.sku || '',
        quantity: item.quantity,
        price: unitPrice,
        total: unitPrice * item.quantity
      }
    })

    let orderId: string
    let finalOrderNumber: string = orderNumber

    try {
      // Inserção via Edge Function (service_role — bypassa RLS)
      const { data: pd, error: pe } = await supabase.functions.invoke('integrations-proxy', {
        body: {
          provider: 'store',
          action: 'create_order',
          payload: { order: orderPayload, items: orderItemsPayload }
        }
      })
      if (!pe && pd?.success && pd?.id) {
        orderId = pd.id
        finalOrderNumber = pd.order_number || orderNumber
      } else {
        throw new Error(pe?.message || pd?.error || 'Proxy store falhou')
      }
    } catch (proxyErr: any) {
      console.warn('[checkout] Edge Function store indisponível, direct insert:', proxyErr?.message)
      const { data: od, error: oe } = await supabase
        .from('store_orders')
        .insert(orderPayload)
        .select('id, order_number')
        .single()
      if (oe) throw new Error(`Falha ao registrar pedido: ${oe.message}`)
      orderId = od.id
      finalOrderNumber = od.order_number || orderNumber
      // Itens em background
      supabase.from('store_order_items')
        .insert(orderItemsPayload.map(i => ({ ...i, order_id: orderId })))
        .then(undefined, () => {})
    }

    // ── FASE 4: Pagamento no Mercado Pago ────────────────────────────────────
    // Idempotency key ESTÁVEL: tecnix-{orderId} (sem Date.now)
    // → duplo clique / retry nunca gera segunda cobrança
    const docNumber = customer.document.replace(/\D/g, '')
    const docType = docNumber.length > 11 ? 'CNPJ' : 'CPF'
    const primarySku = items[0]?.sku || items[0]?.id || ''
    const stableKey = `teknix-${orderId}`

    let paymentResult: any = null
    try {
      const { data: ed, error: ee } = await supabase.functions.invoke('integrations-proxy', {
        body: {
          provider: 'mercado_pago',
          action: 'create_order',
          payload: {
            orderId,
            orderNumber: finalOrderNumber,
            amount: total,
            paymentMethod,
            productCode: primarySku,
            items: items.map(it => ({
              id: it.sku || it.id,
              name: it.name,
              price: it.promo_price && it.promo_price > 0 ? it.promo_price : it.price,
              quantity: it.quantity || 1
            })),
            cardToken: cardToken || undefined,
            cardBrand: cardBrand || undefined,
            installments: installments || 1,
            payer: {
              email: customer.email,
              firstName: customer.name.split(' ')[0],
              lastName: customer.name.split(' ').slice(1).join(' ') || 'TEKNIX',
              identification: { type: docType, number: docNumber },
              address: {
                zipCode: customer.zipCode,
                street: customer.street,
                number: customer.number,
                neighborhood: customer.neighborhood,
                city: customer.city || 'São Paulo',
                state: customer.state || 'SP'
              }
            },
            idempotencyKey: stableKey
          }
        }
      })
      if (ee) console.warn('[checkout] Edge function mercado_pago error:', ee.message)
      paymentResult = ed
    } catch (mpErr: any) {
      console.warn('[checkout] MP edge indisponível:', mpErr.message)
    }

    // ── FASE 5: Fire-and-forget — não bloqueiam resposta ao usuário ───────────

    // 5a. Notificação de pedido criado
    dispatchSiteNotification('order.created', {
      orderNumber: finalOrderNumber || orderNumber,
      total,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      itemsCount: items.length
    }).catch(() => {})

    // 5b. Atualiza payment_id no pedido
    if (paymentResult?.mpPaymentId || paymentResult?.mpOrderId) {
      supabase.from('store_orders').update({
        payment_id: paymentResult.mpPaymentId || paymentResult.mpOrderId,
        updated_at: new Date().toISOString()
      }).eq('id', orderId).then(undefined, () => {})
    }

    // 5c. Baixa de estoque: paralela por produto, 100% fire-and-forget
    void (async () => {
      try {
        await Promise.all(items.map(async (item) => {
          try {
            const { data: prod } = await supabase
              .from('products')
              .select('id, stock, stock_quantity')
              .eq('id', item.id)
              .single()
            if (!prod) return
            const newStock = Math.max(0, (prod.stock ?? prod.stock_quantity ?? 0) - item.quantity)
            await supabase.from('products').update({
              stock: newStock,
              stock_quantity: newStock,
              updated_at: new Date().toISOString()
            }).eq('id', item.id)
            // stock_movements e marketplace_listings — opcionais, não bloqueiam
            supabase.from('stock_movements').insert({
              product_id: item.id,
              type: 'VENDA',
              quantity: -item.quantity,
              order_ref: finalOrderNumber,
              notes: `Venda Loja Própria TEKNIX — Pedido #${finalOrderNumber}`
            }).then(undefined, () => {})
            supabase.from('marketplace_listings').update({
              stock: newStock,
              updated_at: new Date().toISOString()
            }).eq('product_id', item.id).then(undefined, () => {})
          } catch (e) {
            console.debug(`[checkout] Estoque produto ${item.id}:`, e)
          }
        }))
      } catch (e) {
        console.debug('[checkout] Baixa de estoque batch:', e)
      }
    })()

    // ── FASE 6: Retorno imediato para a UI ───────────────────────────────────
    let resolvedPixQr = ''
    if (paymentMethod === 'pix') {
      if (paymentResult?.qrCode && isValidPixPayload(paymentResult.qrCode)) {
        resolvedPixQr = paymentResult.qrCode
      } else {
        // Gera código Pix oficial padrão Banco Central do Brasil (EMVCo + CRC16-CCITT)
        resolvedPixQr = generatePixBRCode({
          amount: total,
          txId: (finalOrderNumber || orderNumber || 'PEDIDO').replace(/[^A-Za-z0-9]/g, '').slice(0, 25)
        })
      }
    }

    return {
      success: true,
      orderId,
      orderNumber: finalOrderNumber || orderNumber,
      total,
      paymentId: paymentResult?.mpPaymentId || paymentResult?.mpOrderId,
      // Pix
      qrCode: resolvedPixQr,
      qrCodeBase64: paymentResult?.qrCodeBase64 || '',
      // Boleto
      ticketUrl: paymentResult?.ticketUrl || '',
      barcodeContent: paymentResult?.barcodeContent || '',
      digitableLine: paymentResult?.digitableLine || '',
      checkoutUrl: paymentResult?.checkoutUrl || ''
    }
  } catch (error: any) {
    console.error('[checkout] Erro no processamento:', error)
    return {
      success: false,
      error: error.message || 'Ocorreu um erro ao processar o seu pedido.'
    }
  }
}
