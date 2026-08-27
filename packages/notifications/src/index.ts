/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL NOTIFICATIONS SERVICE (@teknix/notifications)
   Pipeline multi-canal, orquestrador de eventos e provedor de e-mail Brevo
   ========================================================================== */

export type ProjectContext = 'flow' | 'hub' | 'site'
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp'
export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'cancelled'

export type EventType =
  | 'order.created'
  | 'order.paid'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'product.purchased'
  | 'user.created'
  | 'user.login'
  | 'user.2fa.required'
  | 'user.password.reset'
  | 'payment.approved'
  | 'payment.failed'
  | 'marketplace.sale'
  | 'security.alert'

export interface NotificationPayload {
  id?: string
  project: ProjectContext
  tenantId?: string
  recipientUserId?: string
  recipientEmail?: string
  recipientPhone?: string
  recipientRole?: 'customer' | 'admin' | 'staff' | 'operator'
  eventType: EventType
  entityId?: string
  title: string
  message: string
  channels: NotificationChannel[]
  data?: Record<string, any>
  createdAt?: string
  readAt?: string | null
  status?: NotificationStatus
}

export interface BrevoSendOptions {
  toEmail: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
  senderEmail?: string
  senderName?: string
}

export class BrevoEmailProvider {
  private apiKey: string
  private defaultSender: { email: string; name: string }

  constructor(apiKey?: string, sender?: { email: string; name: string }) {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : {}
    this.apiKey = apiKey || globalObj.process?.env?.BREVO_API_KEY || ''
    this.defaultSender = sender || {
      email: 'nao-responda@teknixbrasil.com.br',
      name: 'TEKNIX'
    }
  }

  async sendEmail(options: BrevoSendOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      console.info('[BrevoEmailProvider] Simulated email dispatch:', {
        to: options.toEmail,
        subject: options.subject
      })
      return { success: true, messageId: `simulated-${Date.now()}` }
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            email: options.senderEmail || this.defaultSender.email,
            name: options.senderName || this.defaultSender.name
          },
          to: [{ email: options.toEmail, name: options.toName || options.toEmail }],
          subject: options.subject,
          htmlContent: options.htmlContent,
          textContent: options.textContent
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        return { success: false, error: errData.message || `Brevo HTTP error ${response.status}` }
      }

      const resData = await response.json()
      return { success: true, messageId: resData.messageId }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send email through Brevo' }
    }
  }
}

export class NotificationService {
  private emailProvider: BrevoEmailProvider
  private inMemoryNotifications: NotificationPayload[] = []

  constructor(brevoApiKey?: string) {
    this.emailProvider = new BrevoEmailProvider(brevoApiKey)
  }

  async publishEvent(
    eventType: EventType,
    context: {
      project: ProjectContext
      tenantId?: string
      entityId?: string
      targetUser?: { id?: string; name?: string; email?: string; phone?: string; role?: 'customer' | 'admin' | 'staff' | 'operator' }
      data?: Record<string, any>
    }
  ): Promise<{ success: boolean; dispatchedCount: number; errors?: string[] }> {
    const errors: string[] = []
    const subject = `[TEKNIX] ${eventType}`
    const bodyText = `Notificação do evento ${eventType} para ${context.targetUser?.name || 'usuário'}.`

    const payload: NotificationPayload = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      project: context.project,
      tenantId: context.tenantId,
      recipientUserId: context.targetUser?.id,
      recipientEmail: context.targetUser?.email,
      recipientPhone: context.targetUser?.phone,
      recipientRole: context.targetUser?.role || 'customer',
      eventType,
      entityId: context.entityId,
      title: subject,
      message: bodyText,
      channels: ['in_app', 'email'],
      data: context.data,
      createdAt: new Date().toISOString(),
      readAt: null,
      status: 'pending'
    }

    this.inMemoryNotifications.unshift(payload)

    if (payload.recipientEmail) {
      const emailRes = await this.emailProvider.sendEmail({
        toEmail: payload.recipientEmail,
        toName: context.targetUser?.name,
        subject,
        htmlContent: `<p>${bodyText}</p>`,
        textContent: bodyText
      })

      if (!emailRes.success && emailRes.error) {
        errors.push(emailRes.error)
        payload.status = 'failed'
      } else {
        payload.status = 'sent'
      }
    }

    return {
      success: errors.length === 0,
      dispatchedCount: 1,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  getInAppNotifications(userId: string, project?: ProjectContext): NotificationPayload[] {
    return this.inMemoryNotifications.filter(n => {
      const matchUser = n.recipientUserId === userId
      const matchProject = project ? n.project === project : true
      return matchUser && matchProject
    })
  }

  markAsRead(notificationId: string): boolean {
    const notif = this.inMemoryNotifications.find(n => n.id === notificationId)
    if (notif) {
      notif.readAt = new Date().toISOString()
      return true
    }
    return false
  }
}

export const notificationService = new NotificationService()
