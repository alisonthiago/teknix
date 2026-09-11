import { supabase } from '../lib/supabase'

export type NotificationSeverity = 'success' | 'warning' | 'error' | 'info'
export type NotificationModule =
  | 'sale'
  | 'order'
  | 'payment'
  | 'pix'
  | 'stock'
  | 'invoice'
  | 'shipment'
  | 'message'
  | 'question'
  | 'system'
  | 'marketplace'

export interface HubNotification {
  id: string
  user_id?: string | null
  type: NotificationSeverity | string
  title: string
  message: string
  is_read: boolean
  actor_user_id?: string | null
  actor_name?: string | null
  actor_role?: string | null
  target_user_id?: string | null
  module?: NotificationModule | string | null
  entity_id?: string | null
  entity_type?: 'order' | 'product' | 'invoice' | 'shipment' | 'customer' | 'question' | string | null
  resource?: string | null
  resource_id?: string | null
  marketplace_id?: string | null
  metadata?: Record<string, any> | null
  created_at: string
}

export interface CreateNotificationInput {
  title: string
  message: string
  type: NotificationSeverity
  module: NotificationModule
  entity_id?: string
  entity_type?: string
  user_id?: string | null
  actor_name?: string
  actor_role?: string
  metadata?: Record<string, any>
}

/**
 * Resolve o destino de navegação com base nos dados reais da notificação
 */
export function resolveNotificationUrl(notif: Partial<HubNotification>): string {
  if (notif.metadata?.url && typeof notif.metadata.url === 'string') {
    return notif.metadata.url
  }

  const mod = String(notif.module || '').toLowerCase()
  const entityType = String(notif.entity_type || '').toLowerCase()
  const entityId = notif.entity_id ? String(notif.entity_id).trim() : ''

  // Vendas, Pedidos ou Pagamentos vinculados a um pedido
  if (mod === 'sale' || mod === 'order' || entityType === 'order') {
    return entityId ? `/hub/pedidos/${entityId}` : '/hub/pedidos'
  }

  if (mod === 'payment' || mod === 'pix') {
    return entityId ? `/hub/pedidos/${entityId}` : '/hub/financeiro'
  }

  // Estoque e Produtos
  if (mod === 'stock' || entityType === 'product') {
    return entityId ? `/hub/produtos/${entityId}` : '/hub/avisos-estoque'
  }

  // Envios e Etiquetas
  if (mod === 'shipment' || entityType === 'shipment') {
    return entityId ? `/hub/envios?order=${encodeURIComponent(entityId)}` : '/hub/envios'
  }

  // Notas Fiscais
  if (mod === 'invoice' || entityType === 'invoice') {
    return '/hub/notas-fiscais'
  }

  // Clientes
  if (mod === 'customer' || entityType === 'customer') {
    return entityId ? `/hub/clientes/${entityId}` : '/hub/clientes'
  }

  // Mensagens / Perguntas de marketplace
  if (mod === 'message' || mod === 'question' || mod === 'marketplace') {
    return '/hub/mercado-livre'
  }

  return '/hub'
}

/**
 * Serviço de Notificações do HUB
 */
export const HubNotificationService = {
  /**
   * Busca notificações persistidas no banco
   */
  async fetchNotifications(limit: number = 50): Promise<HubNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[HubNotificationService] Erro ao buscar notificações:', error)
        return []
      }
      return (data as HubNotification[]) || []
    } catch (err) {
      console.error('[HubNotificationService] Falha inesperada ao buscar notificações:', err)
      return []
    }
  },

  /**
   * Marca uma notificação individual como lida
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) {
        console.error('[HubNotificationService] Erro ao marcar como lida:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('[HubNotificationService] Falha inesperada ao marcar como lida:', err)
      return false
    }
  },

  /**
   * Marca todas as notificações pendentes como lidas
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (error) {
        console.error('[HubNotificationService] Erro ao marcar todas como lidas:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('[HubNotificationService] Falha inesperada ao marcar todas como lidas:', err)
      return false
    }
  },

  /**
   * Exclui uma notificação
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[HubNotificationService] Erro ao excluir notificação:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('[HubNotificationService] Falha inesperada ao excluir notificação:', err)
      return false
    }
  },

  /**
   * Cria e persiste uma nova notificação no Supabase
   */
  async createNotification(input: CreateNotificationInput): Promise<HubNotification | null> {
    try {
      const payload = {
        title: input.title,
        message: input.message,
        type: input.type,
        module: input.module,
        entity_id: input.entity_id || null,
        entity_type: input.entity_type || null,
        user_id: input.user_id || null,
        actor_name: input.actor_name || null,
        actor_role: input.actor_role || null,
        metadata: input.metadata || null,
        is_read: false,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('[HubNotificationService] Erro ao criar notificação:', error)
        return null
      }
      return data as HubNotification
    } catch (err) {
      console.error('[HubNotificationService] Falha ao criar notificação:', err)
      return null
    }
  },

  // -------------------------------------------------------------
  // Disparadores especializados para fluxos de negócio reais
  // -------------------------------------------------------------

  /** 1. Nova Venda / Pedido Criado */
  async notifyNewSale(orderId: string, orderNumber: string, customerName: string, total: number, channel: string = 'Loja Oficial') {
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
    return this.createNotification({
      title: `Nova venda recebida #${orderNumber || orderId}`,
      message: `${customerName || 'Cliente'} realizou compra de ${formatted} via ${channel}.`,
      type: 'success',
      module: 'sale',
      entity_id: orderId,
      entity_type: 'order',
      metadata: { order_number: orderNumber, channel, total }
    })
  },

  /** 2. Pix Gerado */
  async notifyPixGenerated(orderId: string, orderNumber: string, customerName: string, total: number) {
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
    return this.createNotification({
      title: `Pix gerado para o pedido #${orderNumber || orderId}`,
      message: `Aguardando pagamento de ${formatted} por ${customerName || 'Cliente'}.`,
      type: 'info',
      module: 'pix',
      entity_id: orderId,
      entity_type: 'order',
      metadata: { order_number: orderNumber, total }
    })
  },

  /** 3. Pagamento Aprovado */
  async notifyPaymentApproved(orderId: string, orderNumber: string, customerName: string, total: number, method: string = 'Pix') {
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
    return this.createNotification({
      title: `Pagamento aprovado — Pedido #${orderNumber || orderId}`,
      message: `Recebimento de ${formatted} confirmado via ${method}. Liberado para separação!`,
      type: 'success',
      module: 'payment',
      entity_id: orderId,
      entity_type: 'order',
      metadata: { order_number: orderNumber, total, method }
    })
  },

  /** 4. Pagamento Recusado / Expirado */
  async notifyPaymentFailed(orderId: string, orderNumber: string, reason: string = 'Transação recusada pela operadora') {
    return this.createNotification({
      title: `Pagamento não concluído — Pedido #${orderNumber || orderId}`,
      message: `Motivo: ${reason}.`,
      type: 'warning',
      module: 'payment',
      entity_id: orderId,
      entity_type: 'order',
      metadata: { order_number: orderNumber, reason }
    })
  },

  /** 5. Alerta de Estoque Baixo */
  async notifyLowStock(productId: string, productName: string, currentStock: number, minStock: number = 5) {
    return this.createNotification({
      title: `Estoque baixo — ${productName}`,
      message: `Restam apenas ${currentStock} unidade(s) disponíveis (mínimo configurado: ${minStock}).`,
      type: 'warning',
      module: 'stock',
      entity_id: productId,
      entity_type: 'product',
      metadata: { product_name: productName, current_stock: currentStock, min_stock: minStock }
    })
  },

  /** 6. Nota Fiscal Autorizada */
  async notifyInvoiceAuthorized(invoiceId: string, invoiceNumber: string, orderId?: string) {
    return this.createNotification({
      title: `NF-e #${invoiceNumber} autorizada pela SEFAZ`,
      message: `Documento fiscal emitido com sucesso e chave de acesso pronta.`,
      type: 'success',
      module: 'invoice',
      entity_id: invoiceId,
      entity_type: 'invoice',
      metadata: { invoice_number: invoiceNumber, order_id: orderId }
    })
  },

  /** 7. Etiqueta de Envio Gerada */
  async notifyShipmentLabelGenerated(shipmentId: string, orderId: string, trackingCode: string, carrier: string = 'Melhor Envio') {
    return this.createNotification({
      title: `Etiqueta gerada — Pedido #${orderId}`,
      message: `Código de rastreamento: ${trackingCode} via ${carrier}. Pronta para impressão.`,
      type: 'info',
      module: 'shipment',
      entity_id: orderId,
      entity_type: 'shipment',
      metadata: { shipment_id: shipmentId, tracking_code: trackingCode, carrier }
    })
  },

  /** 8. Pedido Entregue */
  async notifyOrderDelivered(orderId: string, trackingCode: string) {
    return this.createNotification({
      title: `Pedido entregue com sucesso #${orderId}`,
      message: `Transportadora confirmou a entrega do pacote (Rastreio: ${trackingCode}).`,
      type: 'success',
      module: 'shipment',
      entity_id: orderId,
      entity_type: 'shipment',
      metadata: { tracking_code: trackingCode }
    })
  },

  /** 9. Falha de Integração / Webhook */
  async notifyIntegrationError(module: NotificationModule, title: string, message: string, details?: any) {
    return this.createNotification({
      title: `[Falha de Integração] ${title}`,
      message,
      type: 'error',
      module,
      entity_type: 'system',
      metadata: details
    })
  }
}
