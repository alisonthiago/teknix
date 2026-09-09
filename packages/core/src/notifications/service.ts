/* ==========================================================================
   TEKNIX CORE — CENTRAL NOTIFICATION SERVICE
   Distribui eventos, grava histórico e despacha para Brevo / In-App / SMS.
   A API Key do Brevo é injetada automaticamente do ambiente (Node ou Vite).
   ========================================================================== */

import type { NotificationPayload, EventType, ProjectContext } from './types'
import { renderTemplate } from './templates'
import { BrevoEmailProvider } from './providers/brevo'

/** Lê a chave Brevo do ambiente — compatível com Node.js (BREVO_API_KEY)
 *  e Vite/browser (VITE_BREVO_API_KEY via import.meta.env). */
function resolveBrevoApiKey(explicitKey?: string): string {
  if (explicitKey) return explicitKey

  // Node.js / Edge Functions
  try {
    const nodeKey = (globalThis as any)?.process?.env?.BREVO_API_KEY
    if (nodeKey) return nodeKey
  } catch {}

  // Vite browser build
  try {
    const viteKey = (import.meta as any)?.env?.VITE_BREVO_API_KEY
    if (viteKey) return viteKey
  } catch {}

  return ''
}

export class NotificationService {
  private emailProvider: BrevoEmailProvider
  private inMemoryNotifications: NotificationPayload[] = []

  constructor(brevoApiKey?: string) {
    const resolvedKey = resolveBrevoApiKey(brevoApiKey)
    this.emailProvider = new BrevoEmailProvider(resolvedKey)
  }

  /**
   * Publica um evento central no monorepo e distribui as notificações necessárias.
   * O template HTML correto é selecionado automaticamente pelo eventType.
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
        console.warn(`[NotificationService] Falha ao enviar e-mail (${eventType}):`, emailRes.error)
      } else {
        payload.status = 'sent'
        console.info(`[NotificationService] ✅ E-mail enviado (${eventType}) → ${payload.recipientEmail}`)
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

// Instância Singleton — a API Key é resolvida automaticamente do ambiente
export const notificationService = new NotificationService()
