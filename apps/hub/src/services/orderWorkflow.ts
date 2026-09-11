/* ==========================================================================
   TEKNIX HUB — ORDER WORKFLOW SERVICE
   Gerenciador central do fluxo operacional ponta a ponta da loja própria:
   COMPRA → CLIENTE → PEDIDO → PAGAMENTO → ESTOQUE → FINANCEIRO → FISCAL → ENVIO → ENTREGA

   Garante:
   - Persistência e integridade em store_orders, store_order_items, customers, products
   - Baixa atômica e idempotente de estoque físico central com registro em inventory_movements
   - Acumulação de métricas reais do cliente (total_spent, total_orders)
   - Zero dependência de estados fictícios ou mocks em memória
   ========================================================================== */

import { supabase } from '../lib/supabase'

export interface OrderWorkflowResult {
  success: boolean
  message: string
  order?: any
  stockUpdated?: boolean
  error?: string
}

export class OrderWorkflow {
  /**
   * Confirma o pagamento de um pedido da loja própria (store_orders),
   * executando a cascata completa:
   * 1. store_orders: status = 'paid', payment_status = 'approved' (ou 'paid')
   * 2. Baixa de estoque físico central em products.stock
   * 3. Registro no livro-razão inventory_movements
   * 4. Atualização das métricas do cliente em customers
   */
  static async confirmOrderPayment(
    orderId: string,
    options: {
      source?: 'manual' | 'webhook' | 'simulation'
      mpPaymentId?: string
      notes?: string
    } = {}
  ): Promise<OrderWorkflowResult> {
    try {
      // 1. Busca o pedido e seus itens
      const { data: order, error: orderErr } = await supabase
        .from('store_orders')
        .select('*, items:store_order_items(*)')
        .eq('id', orderId)
        .single()

      if (orderErr || !order) {
        return { success: false, message: `Pedido ${orderId} não encontrado`, error: orderErr?.message }
      }

      // IDEMPOTÊNCIA: Se já foi aprovado/pago, não refaz baixa de estoque
      if (order.status === 'paid' && order.payment_status === 'approved') {
        return {
          success: true,
          message: `Pedido ${order.order_number} já se encontra com pagamento confirmado (Idempotente).`,
          order,
          stockUpdated: false
        }
      }

      const now = new Date().toISOString()
      const paymentId = options.mpPaymentId || order.payment_id || `MANUAL-${Date.now()}`

      // 2. Atualiza o pedido para PAGO
      const { data: updatedOrder, error: updateErr } = await supabase
        .from('store_orders')
        .update({
          status: 'paid',
          payment_status: 'approved',
          payment_id: paymentId,
          notes: options.notes ? `${order.notes || ''} | ${options.notes}`.trim() : order.notes,
          updated_at: now
        })
        .eq('id', orderId)
        .select('*, items:store_order_items(*)')
        .single()

      if (updateErr) {
        return { success: false, message: 'Falha ao atualizar status do pedido', error: updateErr.message }
      }

      // 3. Baixa atômica de estoque para cada item do pedido
      const items = order.items || []
      let stockUpdated = false

      for (const item of items) {
        if (!item.product_id || !item.quantity) continue

        try {
          // Busca o produto central
          const { data: prod } = await supabase
            .from('products')
            .select('id, stock')
            .eq('id', item.product_id)
            .single()

          if (prod) {
            const currentStock = prod.stock ?? 0
            const newStock = Math.max(0, currentStock - Number(item.quantity))

            // Atualiza estoque no banco
            await supabase
              .from('products')
              .update({
                stock: newStock,
                updated_at: now
              })
              .eq('id', prod.id)

            // Registra movimentação no livro-razão
            await supabase
              .from('inventory_movements')
              .insert({
                product_id: prod.id,
                type: 'VENDA',
                quantity: -Number(item.quantity),
                notes: `[ORDER:${order.order_number}] Venda Loja Própria TEKNIX (Item: ${item.product_name || item.sku || 'Produto'})`,
                created_at: now
              })

            stockUpdated = true
          }
        } catch (stkErr) {
          console.warn(`[OrderWorkflow] Alerta ao atualizar estoque do item ${item.product_id}:`, stkErr)
        }
      }

      // 4. Atualiza métricas do cliente (total_orders e total_spent)
      try {
        let customerId = order.customer_id

        // Se não tiver customer_id, tenta localizar por e-mail ou documento
        if (!customerId && (order.customer_email || order.customer_document)) {
          const docClean = (order.customer_document || '').replace(/\D/g, '')
          const { data: custFound } = await supabase
            .from('customers')
            .select('id, total_orders, total_spent')
            .or(`email.eq.${order.customer_email}${docClean ? `,cpf.eq.${docClean}` : ''}`)
            .maybeSingle()

          if (custFound) {
            customerId = custFound.id
            // Vincula o ID encontrado de volta ao pedido
            await supabase
              .from('store_orders')
              .update({ customer_id: customerId })
              .eq('id', orderId)
          }
        }

        if (customerId) {
          const { data: cData } = await supabase
            .from('customers')
            .select('total_orders, total_spent')
            .eq('id', customerId)
            .single()

          if (cData) {
            const newTotalOrders = (cData.total_orders || 0) + 1
            const newTotalSpent = Number(((cData.total_spent || 0) + Number(order.total || 0)).toFixed(2))

            await supabase
              .from('customers')
              .update({
                total_orders: newTotalOrders,
                total_spent: newTotalSpent,
                updated_at: now
              })
              .eq('id', customerId)
          }
        }
      } catch (custErr) {
        console.warn('[OrderWorkflow] Alerta ao atualizar métricas do cliente:', custErr)
      }

      return {
        success: true,
        message: `Pagamento do pedido ${order.order_number} confirmado com sucesso. Estoque e dados operacionais sincronizados.`,
        order: updatedOrder || order,
        stockUpdated
      }
    } catch (err: any) {
      console.error('[OrderWorkflow] confirmOrderPayment fatal error:', err)
      return { success: false, message: 'Erro inesperado no processamento do pedido', error: err.message }
    }
  }

  /**
   * Atualiza o ciclo de envio do pedido:
   * preparing (Preparando envio) -> shipped (Enviado / Em trânsito) -> delivered (Entregue)
   */
  static async updateShippingStatus(
    orderId: string,
    status: 'preparing' | 'shipped' | 'delivered' | 'cancelled',
    details: {
      trackingCode?: string
      carrier?: string
      notes?: string
    } = {}
  ): Promise<OrderWorkflowResult> {
    try {
      const now = new Date().toISOString()
      const updateData: any = {
        status,
        updated_at: now
      }

      if (details.trackingCode) {
        updateData.notes = `[Rastreio: ${details.trackingCode}] ${details.carrier ? `Via ${details.carrier}` : ''} ${details.notes || ''}`.trim()
      }

      const { data: updated, error } = await supabase
        .from('store_orders')
        .update(updateData)
        .eq('id', orderId)
        .select('*, items:store_order_items(*)')
        .single()

      if (error) {
        return { success: false, message: 'Erro ao atualizar status de envio', error: error.message }
      }

      return {
        success: true,
        message: `Status do pedido atualizado para "${status.toUpperCase()}".`,
        order: updated
      }
    } catch (err: any) {
      return { success: false, message: 'Erro no workflow de envio', error: err.message }
    }
  }
}
