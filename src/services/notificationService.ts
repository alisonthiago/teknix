import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type NotificationCategory = 'vendas' | 'pedidos' | 'estoque' | 'integracoes' | 'erros' | 'sistema'
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical'

export interface CreateNotificationParams {
  userId?: string
  type: string
  title: string
  message: string
  severity?: NotificationSeverity
  category?: NotificationCategory
  module?: string
  entityId?: string
  entityType?: string
  marketplaceId?: string
  actorName?: string
  metadata?: Record<string, any>
}

export async function createRealNotification(params: CreateNotificationParams) {
  const supabase = getSupabase()
  const defaultUserId = '3af9068a-4b78-4c9c-8657-f83b93c01588'

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId || defaultUserId,
        type: params.type,
        title: params.title,
        message: params.message,
        is_read: false,
        actor_name: params.actorName || null,
        module: params.module || params.category || 'sistema',
        entity_id: params.entityId || null,
        entity_type: params.entityType || null,
        marketplace_id: params.marketplaceId || null,
        metadata: {
          severity: params.severity || 'info',
          category: params.category || 'sistema',
          ...params.metadata
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error inserting notification:', err)
    return null
  }
}

// Helpers for specific system events
export async function notifyNewSale(orderNumber: string, channel: string, amount: number, customerName?: string) {
  return createRealNotification({
    type: 'sale',
    category: 'vendas',
    severity: 'success',
    module: 'sales',
    title: `🛒 Nova Venda — ${channel}`,
    message: `Pedido #${orderNumber} de R$ ${amount.toFixed(2).replace('.', ',')}${customerName ? ` para ${customerName}` : ''}.`,
    metadata: { orderNumber, channel, amount }
  })
}

export async function notifyStockAlert(productName: string, sku: string, stock: number) {
  const isOut = stock <= 0
  return createRealNotification({
    type: isOut ? 'stock_out' : 'stock_low',
    category: 'estoque',
    severity: isOut ? 'critical' : 'warning',
    module: 'products',
    title: isOut ? '🚨 Produto Sem Estoque' : '⚠️ Estoque Baixo',
    message: isOut
      ? `O produto "${productName}" (SKU: ${sku}) atingiu 0 unidades.`
      : `O produto "${productName}" (SKU: ${sku}) está com apenas ${stock} unidade(s) disponível(is).`,
    metadata: { productName, sku, stock }
  })
}

export async function notifyIntegrationStatus(marketplace: string, action: 'CONNECTED' | 'DISCONNECTED' | 'SYNC_SUCCESS' | 'ERROR', details?: string) {
  let title = ''
  let severity: NotificationSeverity = 'info'

  switch (action) {
    case 'CONNECTED':
      title = `✅ ${marketplace} Conectado`
      severity = 'success'
      break
    case 'DISCONNECTED':
      title = `🔌 ${marketplace} Desconectado`
      severity = 'warning'
      break
    case 'SYNC_SUCCESS':
      title = `🔄 Sincronização Concluída — ${marketplace}`
      severity = 'success'
      break
    case 'ERROR':
      title = `🚨 Erro na Integração — ${marketplace}`
      severity = 'error'
      break
  }

  return createRealNotification({
    type: 'integration',
    category: 'integracoes',
    severity,
    module: 'marketplaces',
    title,
    message: details || `Status atualizado para o canal ${marketplace}.`,
    metadata: { marketplace, action }
  })
}
