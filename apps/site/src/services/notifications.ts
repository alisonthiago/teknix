/* ==========================================================================
   TEKNIX SITE — CLIENT NOTIFICATION DISPATCHER (INTEGRADO AO @TEKNIX/CORE)
   Notifica comprador (e-mail), administradores da loja e operações
   ========================================================================== */

import { notificationService, type EventType } from '../../../../packages/core/src/index'

export async function dispatchSiteNotification(
  eventType: EventType,
  params: {
    orderNumber?: string
    total?: number
    customerName: string
    customerEmail: string
    customerPhone?: string
    itemsCount?: number
  }
) {
  try {
    const formattedTotal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(params.total || 0)

    // 1. Notificação para o Comprador (E-mail de confirmação + In-App)
    await notificationService.publishEvent(eventType, {
      project: 'site',
      entityId: params.orderNumber,
      targetUser: {
        name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
        role: 'customer'
      },
      data: {
        orderNumber: params.orderNumber || '',
        total: formattedTotal,
        itemsCount: params.itemsCount || 1
      }
    })

    // 2. Notificação interna para a Administração da Loja / HUB
    await notificationService.publishEvent('marketplace.sale', {
      project: 'hub',
      entityId: params.orderNumber,
      targetUser: {
        name: 'Administrador TEKNIX',
        email: 'vendas@teknixbrasil.com.br',
        role: 'admin'
      },
      data: {
        marketplace: 'Loja Oficial TEKNIX',
        orderNumber: params.orderNumber || '',
        total: formattedTotal
      }
    })
  } catch (err) {
    console.warn('Erro ao despachar notificação central:', err)
  }
}
