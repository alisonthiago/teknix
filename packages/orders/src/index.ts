/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL ORDERS & PAYMENT LINKS SERVICE (@teknix/orders)
   Geração de links de pagamento, liquidação de pedidos e roteamento de eventos
   ========================================================================== */

import { logAuditEvent } from '../../permissions/src/index'
import { notificationService } from '../../notifications/src/index'
import { inventoryService } from '../../inventory/src/index'

export interface PaymentLinkParams {
  customerId: string
  customerName: string
  customerEmail: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discountAmount?: number
  shippingAmount?: number
  expiresInMinutes?: number
}

export interface PaymentLinkResult {
  id: string
  url: string
  totalAmount: number
  expiresAt: string
  reservationId: string
}

export class OrderService {
  /**
   * Cria um Link de Pagamento no HUB com reserva temporária de estoque
   */
  async createPaymentLink(
    params: PaymentLinkParams,
    creator: { id: string; name: string }
  ): Promise<{ success: boolean; link?: PaymentLinkResult; error?: string }> {
    try {
      const linkId = `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const durationMinutes = params.expiresInMinutes || 60
      const totalAmount = Math.max(
        0,
        params.unitPrice * params.quantity - (params.discountAmount || 0) + (params.shippingAmount || 0)
      )

      // 1. Criar reserva temporária no estoque (não baixa definitivo ainda)
      const reservation = inventoryService.createStockReservation(
        params.productId,
        params.quantity,
        linkId,
        durationMinutes
      )

      const url = `https://play.teknixbrasil.com.br/checkout?linkId=${linkId}`
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()

      // 2. Registrar auditoria central
      logAuditEvent({
        userId: creator.id,
        userName: creator.name,
        project: 'hub',
        action: 'payments.link.create',
        resource: 'payments',
        entityId: linkId,
        entityName: `Link para ${params.customerName} — ${params.productName}`,
        changes: [
          {
            field: 'payment_link',
            before: null,
            after: { linkId, totalAmount, customer: params.customerEmail, product: params.productName }
          }
        ]
      })

      return {
        success: true,
        link: {
          id: linkId,
          url,
          totalAmount,
          expiresAt,
          reservationId: reservation.reservationId
        }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao gerar link de pagamento.' }
    }
  }

  /**
   * Quando o pagamento for aprovado (via Loja, Link de Pagamento ou Marketplace)
   */
  async handlePaymentApproved(params: {
    orderId: string
    orderNumber: string
    customerId: string
    customerName: string
    customerEmail: string
    totalAmount: number
    items: { productId: string; productName: string; quantity: number; price: number }[]
    reservationId?: string
    channelSource: 'loja' | 'hub_link' | 'flow_marketplace'
  }): Promise<{ success: boolean }> {
    try {
      // 1. Consumir reserva temporária se existir
      if (params.reservationId) {
        inventoryService.consumeReservation(params.reservationId)
      }

      // 2. Disparar notificações coordenadas pela Matriz Central
      // A. Para o CLIENTE
      await notificationService.publishEvent('order.paid', {
        project: 'site',
        targetUser: {
          id: params.customerId,
          name: params.customerName,
          email: params.customerEmail,
          role: 'customer'
        },
        data: {
          orderNumber: params.orderNumber,
          total: params.totalAmount,
          items: params.items
        }
      })

      // B. Para o HUB (Administração e Métricas)
      await notificationService.publishEvent('payment.approved', {
        project: 'hub',
        targetUser: { role: 'admin' },
        data: {
          orderNumber: params.orderNumber,
          customer: params.customerName,
          total: params.totalAmount,
          source: params.channelSource
        }
      })

      // C. Para o FLOW (Operação e Expedição)
      await notificationService.publishEvent('marketplace.sale', {
        project: 'flow',
        targetUser: { role: 'operator' },
        data: {
          orderNumber: params.orderNumber,
          items: params.items,
          status: 'ready_to_pack'
        }
      })

      return { success: true }
    } catch (err) {
      console.error('Erro ao processar aprovação de pagamento:', err)
      return { success: false }
    }
  }
}

export const orderService = new OrderService()
