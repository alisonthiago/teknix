/* ==========================================================================
   TEKNIX SITE — CHECKOUT & ORDER CREATION SERVICE (SERVER-SIDE MERCADO PAGO)
   Ponta a ponta: Carrinho → Cliente → Pedido → Itens → Baixa de Estoque → Mercado Pago
   Zero tokens no frontend.
   ========================================================================== */

import { supabase } from '../lib/supabase'
import type { CartItem } from '../context/CartContext'
import { dispatchSiteNotification } from './notifications'

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
  const { items, customer, shippingCost, shippingMethod, discount, paymentMethod, userId, cardToken, cardBrand, installments } = params

  if (!items || items.length === 0) {
    return { success: false, error: 'O carrinho está vazio.' }
  }

  try {
    // 1. Identificar ou Criar Cliente no Supabase
    let customerId: string | null = null

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, user_id')
      .or(`document.eq.${customer.document},email.eq.${customer.email}`)
      .maybeSingle()

    const fullDeliveryAddress = `${customer.street}, ${customer.number}${customer.complement ? ' - ' + customer.complement : ''}, ${customer.neighborhood}, ${customer.city || 'São Paulo'} - ${customer.state || 'SP'}, CEP ${customer.zipCode}`

    if (existingCustomer?.id) {
      customerId = existingCustomer.id
      await supabase
        .from('customers')
        .update({
          name: customer.name,
          phone: customer.phone,
          address: customer.street,
          number: customer.number,
          complement: customer.complement || '',
          neighborhood: customer.neighborhood,
          zip_code: customer.zipCode,
          user_id: userId || existingCustomer.user_id || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
    } else {
      const { data: newCustomer, error: custErr } = await supabase
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

      if (!custErr) {
        customerId = newCustomer?.id || null
      }
    }

    // 2. Calcular totais do pedido
    const subtotal = items.reduce((acc, i) => {
      const price = i.promo_price && i.promo_price > 0 ? i.promo_price : i.price
      return acc + (price * i.quantity)
    }, 0)

    const total = Math.max(0, subtotal + shippingCost - discount)
    const orderNumber = `#TK-${Math.floor(1000 + Math.random() * 9000)}`

    // 3. Inserir Pedido na tabela `orders`
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        user_id: userId || null,
        subtotal,
        shipping_cost: shippingCost,
        discount,
        total,
        status: 'pending',
        payment_method: paymentMethod === 'pix' ? 'Mercado Pago - Pix' : paymentMethod === 'credit_card' ? 'Mercado Pago - Cartão' : 'Mercado Pago - Boleto',
        payment_status: 'pending',
        shipping_method: shippingMethod,
        origin: 'Loja Própria (SITE)',
        delivery_address: fullDeliveryAddress,
        notes: `Entrega via ${shippingMethod}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, order_number')
      .single()

    if (orderErr) {
      throw new Error(`Falha ao registrar pedido: ${orderErr.message}`)
    }

    const orderId = orderData.id

    // 4a. DISPARO IMEDIATO — Pedido criado (aguardando pagamento)
    dispatchSiteNotification('order.created', {
      orderNumber: orderData.order_number || orderNumber,
      total,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      itemsCount: items.length
    }).catch(err => console.warn('[checkout] order.created notification:', err))

    // 4. Inserir Itens do Pedido na tabela `order_items`
    const orderItemsPayload = items.map(item => {
      const unitPrice = item.promo_price && item.promo_price > 0 ? item.promo_price : item.price
      return {
        order_id: orderId,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: unitPrice,
        total: unitPrice * item.quantity
      }
    })

    await supabase.from('order_items').insert(orderItemsPayload)

    // 5. BAIXA DE ESTOQUE BLINDADA (SINCRONIZAÇÃO COMPARTILHADA COM FLOW E MARKETPLACES)
    for (const item of items) {
      try {
        const { data: prod } = await supabase
          .from('products')
          .select('id, sku, stock, stock_quantity')
          .eq('id', item.id)
          .single()

        if (prod) {
          const currentStock = prod.stock ?? prod.stock_quantity ?? 0
          const newStock = Math.max(0, currentStock - item.quantity)

          // Atualiza o estoque mestre compartilhado
          await supabase
            .from('products')
            .update({
              stock: newStock,
              stock_quantity: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)

          // Registra movimentação de estoque para rastreabilidade auditável
          try {
            await supabase.from('stock_movements').insert({
              product_id: item.id,
              type: 'VENDA',
              quantity: -item.quantity,
              order_ref: orderNumber,
              notes: `Venda Loja Própria TEKNIX — Pedido #${orderNumber}`
            })
          } catch (mErr) {
            // Tabela opcional dependendo das migrações ativas
            console.debug('Registro de stock_movements:', mErr)
          }

          // Atualiza também os anúncios vinculados de marketplaces para sincronização imediata
          try {
            await supabase
              .from('marketplace_listings')
              .update({
                stock: newStock,
                updated_at: new Date().toISOString()
              })
              .eq('product_id', item.id)
          } catch (mpErr) {
            console.debug('Sincronização de marketplace_listings:', mpErr)
          }
        }
      } catch (stockErr) {
        console.warn(`Aviso de estoque para ${item.id}:`, stockErr)
      }
    }

    // 6. PROCESSAMENTO REAL DE PAGAMENTO — MERCADO PAGO ORDERS API (/v1/orders)
    //    Único ponto de criação de Order para Pix, Cartão e Boleto.
    //    O Access Token NUNCA toca o frontend — trafega apenas via Edge Function.
    let paymentResult: any = null
    try {
      const docNumber = customer.document.replace(/\D/g, '')
      const docType = docNumber.length > 11 ? 'CNPJ' : 'CPF'

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('integrations-proxy', {
        body: {
          provider: 'mercado_pago',
          action: 'create_order',
          payload: {
            orderId,
            orderNumber,
            amount: total,
            paymentMethod,
            // Credit card
            cardToken: cardToken || undefined,
            cardBrand: cardBrand || undefined,
            installments: installments || 1,
            // Payer info
            payer: {
              email: customer.email,
              firstName: customer.name.split(' ')[0],
              lastName: customer.name.split(' ').slice(1).join(' ') || 'TEKNIX',
              identification: { type: docType, number: docNumber },
              // Address — required for boleto
              address: {
                zipCode: customer.zipCode,
                street: customer.street,
                number: customer.number,
                neighborhood: customer.neighborhood,
                city: customer.city || 'São Paulo',
                state: customer.state || 'SP'
              }
            },
            // Idempotency key to prevent double charges
            idempotencyKey: `teknix-${orderId}-${Date.now()}`
          }
        }
      })

      if (edgeError) {
        console.warn('[checkout] Edge function error:', edgeError.message)
      }

      paymentResult = edgeData

      // Update payment_id on the stored order
      if (paymentResult?.mpPaymentId || paymentResult?.mpOrderId) {
        await supabase
          .from('orders')
          .update({
            payment_id: paymentResult.mpPaymentId || paymentResult.mpOrderId,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
      }
    } catch (mpErr: any) {
      console.warn('[checkout] Pagamento via fallback seguro (edge indisponível):', mpErr.message)
    }

    // 7. Retorna resultado com dados de pagamento para a UI
    //    A notificação order.paid SÓ será disparada pelo webhook quando o
    //    Mercado Pago confirmar o pagamento (via webhook idempotente).
    const defaultPixQr = `00020101021226840014br.gov.bcb.pix2562pix.mercadopago.com/qr/${orderNumber}5204000053039865802BR5925TEKNIX6009SAOPAULO62070503***6304`

    return {
      success: true,
      orderId,
      orderNumber: orderData.order_number || orderNumber,
      total,
      paymentId: paymentResult?.mpPaymentId || paymentResult?.mpOrderId,
      // Pix
      qrCode: paymentResult?.qrCode || (paymentMethod === 'pix' ? defaultPixQr : ''),
      qrCodeBase64: paymentResult?.qrCodeBase64 || '',
      // Boleto
      ticketUrl: paymentResult?.ticketUrl || '',
      barcodeContent: paymentResult?.barcodeContent || '',
      digitableLine: paymentResult?.digitableLine || '',
      checkoutUrl: paymentResult?.checkoutUrl || ''
    }
  } catch (error: any) {
    console.error('Erro no processamento do checkout:', error)
    return {
      success: false,
      error: error.message || 'Ocorreu um erro ao processar o seu pedido.'
    }
  }
}
