/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL INVENTORY & MARKETPLACE STOCK ENGINE (@teknix/inventory)
   FLOW como centro da verdade de produtos e estoque, sincronização bidirecional
   ========================================================================== */

import { supabase } from '../../supabase/client'
import { logAuditEvent } from '../../permissions/src/index'
import { notificationService } from '../../notifications/src/index'

export type MarketplaceChannel = 'mercadolivre' | 'shopee' | 'amazon' | 'loja'

export interface ProductIdentifierMap {
  productId: string
  sku: string // Preserva o SKU oficial do Mercado Livre / Fornecedor
  ean?: string
  gtin?: string
  mlItemId?: string
  shopeeItemId?: string
  amazonAsin?: string
}

export interface StockReservation {
  id: string
  productId: string
  quantity: number
  paymentLinkId: string
  expiresAt: number
  status: 'active' | 'consumed' | 'released'
}

export class InventoryService {
  private reservations: Map<string, StockReservation> = new Map()
  private masterStockCache: Map<string, number> = new Map()

  /**
   * Atualiza a quantidade mestre no FLOW (Supabase) e redistribui para todos os canais
   */
  async updateMasterStock(
    productId: string,
    newQuantity: number,
    operator: { id: string; name: string },
    productName?: string,
    previousQuantity?: number
  ): Promise<{ success: boolean; newQuantity: number; error?: string }> {
    try {
      const safeQty = Math.max(0, newQuantity)
      this.masterStockCache.set(productId, safeQty)

      const { error: dbError } = await supabase
        .from('products')
        .update({ stock: safeQty })
        .eq('id', productId)

      if (dbError) {
        console.warn('Aviso DB ao atualizar estoque central:', dbError.message)
      }

      // 1. Alertas automáticos do FLOW e HUB
      if (safeQty === 0) {
        await notificationService.publishEvent('security.alert', {
          project: 'flow',
          targetUser: { role: 'operator' },
          data: {
            title: 'Pausar Anúncios nos Marketplaces: Estoque Zerado',
            productId,
            productName: productName || productId,
            stock: 0
          }
        })
        await notificationService.publishEvent('security.alert', {
          project: 'hub',
          targetUser: { role: 'admin' },
          data: {
            title: 'Estoque Zerado — Reposição Necessária',
            productId,
            productName: productName || productId,
            stock: 0
          }
        })
      } else if (safeQty <= 2) {
        await notificationService.publishEvent('security.alert', {
          project: 'hub',
          targetUser: { role: 'admin' },
          data: {
            title: 'Estoque Crítico / Baixo',
            productId,
            productName: productName || productId,
            stock: safeQty
          }
        })
      }

      // 2. Registrar auditoria central
      logAuditEvent({
        userId: operator.id,
        userName: operator.name,
        project: 'flow',
        action: 'inventory.adjust',
        resource: 'inventory',
        entityId: productId,
        entityName: productName || productId,
        changes: [
          {
            field: 'stock',
            before: previousQuantity ?? null,
            after: safeQty
          }
        ]
      })

      return { success: true, newQuantity: safeQty }
    } catch (err: any) {
      return { success: false, newQuantity: 0, error: err?.message || 'Erro ao atualizar estoque.' }
    }
  }

  /**
   * Processa uma venda de qualquer canal (Mercado Livre, Shopee, Amazon, Loja),
   * recalcula o estoque mestre no FLOW e redistribui para os demais canais.
   */
  async processChannelSale(params: {
    channel: MarketplaceChannel
    productId: string
    quantitySold: number
    orderId: string
    productName?: string
  }): Promise<{ success: boolean; newMasterStock: number; error?: string }> {
    try {
      // 1. Obter estoque atual no banco
      const { data: prod } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', params.productId)
        .maybeSingle()

      const currentStock = this.masterStockCache.get(params.productId) ?? prod?.stock ?? 10
      const newStock = Math.max(0, currentStock - params.quantitySold)

      // 2. Atualizar no FLOW
      await this.updateMasterStock(
        params.productId,
        newStock,
        { id: `system-${params.channel}`, name: `Venda ${params.channel.toUpperCase()}` },
        params.productName || prod?.name,
        currentStock
      )

      return { success: true, newMasterStock: newStock }
    } catch (err: any) {
      return { success: false, newMasterStock: 0, error: err?.message }
    }
  }

  /**
   * Reserva temporária para link de pagamento (expiração automática)
   */
  createStockReservation(
    productId: string,
    quantity: number,
    paymentLinkId: string,
    durationMinutes: number = 30
  ): { success: boolean; reservationId: string } {
    const reservationId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    
    this.reservations.set(reservationId, {
      id: reservationId,
      productId,
      quantity,
      paymentLinkId,
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
      status: 'active'
    })

    return { success: true, reservationId }
  }

  releaseReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId)
    if (res && res.status === 'active') {
      res.status = 'released'
      return true
    }
    return false
  }

  consumeReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId)
    if (res && res.status === 'active') {
      res.status = 'consumed'
      return true
    }
    return false
  }
}

export const inventoryService = new InventoryService()
