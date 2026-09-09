/* ==========================================================================
   TEKNIX SITE — CLIENT NOTIFICATION DISPATCHER
   Central de despacho de eventos do SITE para o @teknix/core.
   A chave Brevo é injetada pelo ambiente Vite (VITE_BREVO_API_KEY).
   ========================================================================== */

import { NotificationService, type EventType } from '../../../../packages/core/src/index'

// Instância local do SITE — chave Brevo injetada do ambiente Vite
const siteNotificationService = new NotificationService(
  import.meta.env.VITE_BREVO_API_KEY || ''
)

/* --------------------------------------------------------------------------
   dispatchSiteNotification — Eventos de pedido e loja
   -------------------------------------------------------------------------- */
export async function dispatchSiteNotification(
  eventType: EventType,
  params: {
    orderNumber?: string
    total?: number
    customerName: string
    customerEmail: string
    customerPhone?: string
    itemsCount?: number
    trackingCode?: string
    carrier?: string
    deliveryEstimate?: string
    reason?: string
    paymentMethod?: string
    failureReason?: string
  }
) {
  try {
    const formattedTotal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(params.total || 0)

    // 1. Notificação para o Comprador
    await siteNotificationService.publishEvent(eventType, {
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
        itemsCount: String(params.itemsCount || 1),
        trackingCode: params.trackingCode || '',
        carrier: params.carrier || 'Correios',
        deliveryEstimate: params.deliveryEstimate || '3 a 7 dias úteis',
        reason: params.reason || 'solicitado pelo cliente',
        paymentMethod: params.paymentMethod || '',
        failureReason: params.failureReason || 'dados de pagamento inválidos'
      }
    })

    // 2. Notificação interna para o time da loja (apenas em eventos de venda)
    if (eventType === 'order.paid' || eventType === 'order.created') {
      await siteNotificationService.publishEvent('marketplace.sale', {
        project: 'hub',
        entityId: params.orderNumber,
        targetUser: {
          name: 'Equipe TEKNIX',
          email: 'vendas@teknixbrasil.com.br',
          role: 'admin'
        },
        data: {
          marketplace: 'Loja Oficial TEKNIX',
          orderNumber: params.orderNumber || '',
          total: formattedTotal,
          itemsCount: String(params.itemsCount || 1)
        }
      })
    }
  } catch (err) {
    console.warn('[dispatchSiteNotification] Erro ao despachar notificação:', err)
  }
}

/* --------------------------------------------------------------------------
   dispatchWelcomeEmail — E-mail de boas-vindas pós-cadastro
   -------------------------------------------------------------------------- */
export async function dispatchWelcomeEmail(customer: {
  name: string
  email: string
}) {
  if (!customer.email) return

  try {
    await siteNotificationService.publishEvent('user.created', {
      project: 'site',
      targetUser: {
        name: customer.name,
        email: customer.email,
        role: 'customer'
      },
      data: {
        name: customer.name,
        email: customer.email
      }
    })
  } catch (err) {
    console.warn('[dispatchWelcomeEmail] Erro ao enviar boas-vindas:', err)
  }
}

/* --------------------------------------------------------------------------
   dispatchOrderShippedEmail — E-mail de despacho com rastreio
   -------------------------------------------------------------------------- */
export async function dispatchOrderShippedEmail(params: {
  customerName: string
  customerEmail: string
  orderNumber: string
  total: number
  trackingCode: string
  carrier?: string
  deliveryEstimate?: string
}) {
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(params.total)

  await dispatchSiteNotification('order.shipped', {
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    orderNumber: params.orderNumber,
    total: params.total,
    trackingCode: params.trackingCode,
    carrier: params.carrier || 'Correios',
    deliveryEstimate: params.deliveryEstimate || '3 a 7 dias úteis'
  })
}

/* --------------------------------------------------------------------------
   dispatchSecurityAlert — Alerta de segurança de conta
   -------------------------------------------------------------------------- */
export async function dispatchSecurityAlert(params: {
  customerName: string
  customerEmail: string
  alertDescription: string
  ipAddress?: string
}) {
  try {
    await siteNotificationService.publishEvent('security.alert', {
      project: 'site',
      targetUser: {
        name: params.customerName,
        email: params.customerEmail,
        role: 'customer'
      },
      data: {
        alertDescription: params.alertDescription,
        ipAddress: params.ipAddress || 'desconhecido',
        timestamp: new Date().toLocaleString('pt-BR')
      }
    })
  } catch (err) {
    console.warn('[dispatchSecurityAlert] Erro ao enviar alerta de segurança:', err)
  }
}
