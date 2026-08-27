/* ==========================================================================
   TEKNIX CORE — CENTRAL NOTIFICATION SERVICE
   Distribui eventos, grava histórico e despacha para Brevo / In-App / SMS
   ========================================================================== */

import type { NotificationPayload, EventType, ProjectContext } from './types'
import { renderTemplate } from './templates'
import { BrevoEmailProvider } from './providers/brevo'

export class NotificationService {
  private emailProvider: BrevoEmailProvider
  private inMemoryNotifications: NotificationPayload[] = []

  constructor(brevoApiKey?: string) {
    this.emailProvider = new BrevoEmailProvider(brevoApiKey)
  }

  /**
   * Publica um evento central no monorepo e distribui as notificações necessárias
   */
  async publishEvent(
    eventType: EventType,
    context: {
      project: ProjectContext
      tenantId?: string
      entityId?: string
      actor?: { id?: string; name?: string; email?: string }
      targetUser?: { id?: string; name?: string; email?: string; phone?: string; role?: 'customer' | 'admin' | 'staff' }
      data?: Record<string, any>
    }
  ): Promise<{ success: boolean; dispatchedCount: number; errors?: string[] }> {
    const errors: string[] = []
    let count = 0

    const templateData = {
      ...(context.data || {}),
      name: context.targetUser?.name || 'Cliente',
      email: context.targetUser?.email || '',
      entityId: context.entityId || ''
    }

    const { subject, bodyText, bodyHtml } = renderTemplate(eventType, templateData)

    const payload: NotificationPayload = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      project: context.project,
      tenantId: context.tenantId,
      recipientUserId: context.targetUser?.id,
      recipientEmail: context.targetUser?.email,
      recipientPhone: context.targetUser?.phone,
      recipientRole: context.targetUser?.role || 'customer',
      eventType: eventType,
      entityId: context.entityId,
      title: subject,
      message: bodyText,
      channels: ['in_app', 'email'],
      data: context.data,
      createdAt: new Date().toISOString(),
      readAt: null,
      status: 'pending'
    }

    // 1. Armazenar In-App
    this.inMemoryNotifications.unshift(payload)
    count++

    // 2. Enviar por E-mail se houver destinatário
    if (payload.recipientEmail) {
      const emailRes = await this.emailProvider.sendEmail({
        toEmail: payload.recipientEmail,
        toName: context.targetUser?.name,
        subject: subject,
        htmlContent: bodyHtml || bodyText,
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
      dispatchedCount: count,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Retorna as notificações In-App do usuário com isolamento estrito por ID e Projeto
   */
  getInAppNotifications(userId: string, project?: ProjectContext): NotificationPayload[] {
    return this.inMemoryNotifications.filter(n => {
      const matchUser = n.recipientUserId === userId
      const matchProject = project ? n.project === project : true
      return matchUser && matchProject
    })
  }

  /**
   * Marca uma notificação como lida
   */
  markAsRead(notificationId: string): boolean {
    const notif = this.inMemoryNotifications.find(n => n.id === notificationId)
    if (notif) {
      notif.readAt = new Date().toISOString()
      return true
    }
    return false
  }
}

// Instância Singleton para uso rápido no monorepo
export const notificationService = new NotificationService()
