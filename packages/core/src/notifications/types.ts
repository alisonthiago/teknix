/* ==========================================================================
   TEKNIX CORE — CENTRAL NOTIFICATION TYPES
   Compartilhado por todos os módulos: FLOW, HUB, SITE
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
  | 'user.email.verified'
  | 'payment.approved'
  | 'payment.failed'
  | 'marketplace.sale'
  | 'security.alert'
  | 'system.notice'

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

export interface NotificationPreference {
  userId: string
  project: ProjectContext
  emailNotifications: boolean
  inAppNotifications: boolean
  smsNotifications: boolean
  whatsappNotifications: boolean
  orderUpdates: boolean
  securityAlerts: boolean
  marketingEmails: boolean
}
