/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL SECURITY ENGINE (@teknix/security)
   Defesa em profundidade: Rate limit, sessões, IDOR guard, privacidade e LGPD
   ========================================================================== */

import { logAuditEvent, type UserRole, type ProjectScope } from '../../permissions/src/index'
import { notificationService } from '../../notifications/src/index'

export interface UserSession {
  sessionId: string
  userId: string
  project: ProjectScope
  ipAddress?: string
  userAgent?: string
  createdAt: number
  lastActiveAt: number
  expiresAt: number
  isRevoked: boolean
}

export interface RateLimitAttempt {
  count: number
  firstAttempt: number
  blockedUntil?: number
}

export class SecurityService {
  private activeSessions: Map<string, UserSession> = new Map()
  private rateLimits: Map<string, RateLimitAttempt> = new Map()

  // ----------------------------------------------------
  // 1. Proteção contra Força Bruta e Rate Limiting
  // ----------------------------------------------------
  checkRateLimit(
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutos
    blockDurationMs: number = 30 * 60 * 1000 // 30 minutos de bloqueio
  ): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
    const now = Date.now()
    const record = this.rateLimits.get(key)

    if (!record) {
      this.rateLimits.set(key, { count: 1, firstAttempt: now })
      return { allowed: true, remainingAttempts: maxAttempts - 1 }
    }

    // Se estiver bloqueado
    if (record.blockedUntil && now < record.blockedUntil) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000)
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds }
    }

    // Se a janela expirou, reseta
    if (now - record.firstAttempt > windowMs) {
      this.rateLimits.set(key, { count: 1, firstAttempt: now })
      return { allowed: true, remainingAttempts: maxAttempts - 1 }
    }

    // Incrementa tentativa
    record.count += 1
    if (record.count > maxAttempts) {
      record.blockedUntil = now + blockDurationMs
      const retryAfterSeconds = Math.ceil(blockDurationMs / 1000)
      
      // Emite alerta de segurança de força bruta
      void notificationService.publishEvent('security.alert', {
        project: 'hub',
        targetUser: { role: 'admin' },
        data: {
          title: 'Alerta de Segurança: Tentativas Excessivas (Rate Limit)',
          key,
          attempts: record.count,
          blockedForMinutes: Math.ceil(blockDurationMs / 60000)
        }
      })

      return { allowed: false, remainingAttempts: 0, retryAfterSeconds }
    }

    return { allowed: true, remainingAttempts: maxAttempts - record.count }
  }

  resetRateLimit(key: string) {
    this.rateLimits.delete(key)
  }

  // ----------------------------------------------------
  // 2. Gerenciamento Seguro de Sessões
  // ----------------------------------------------------
  createSession(params: {
    userId: string
    project: ProjectScope
    ipAddress?: string
    userAgent?: string
    durationHours?: number
  }): UserSession {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const durationMs = (params.durationHours || 24) * 60 * 60 * 1000
    const now = Date.now()

    const session: UserSession = {
      sessionId,
      userId: params.userId,
      project: params.project,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + durationMs,
      isRevoked: false
    }

    this.activeSessions.set(sessionId, session)

    logAuditEvent({
      userId: params.userId,
      userName: 'Usuário',
      project: params.project,
      action: 'auth.session.created',
      resource: 'sessions',
      entityId: sessionId,
      changes: [{ field: 'session', before: null, after: { project: params.project } }]
    })

    return session
  }

  validateSession(sessionId: string): { valid: boolean; session?: UserSession; error?: string } {
    const session = this.activeSessions.get(sessionId)
    if (!session) return { valid: false, error: 'Sessão inexistente.' }
    if (session.isRevoked) return { valid: false, error: 'Sessão revogada.' }
    if (Date.now() > session.expiresAt) {
      this.activeSessions.delete(sessionId)
      return { valid: false, error: 'Sessão expirada.' }
    }

    session.lastActiveAt = Date.now()
    return { valid: true, session }
  }

  revokeSession(sessionId: string, revokerId: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.isRevoked = true
      logAuditEvent({
        userId: revokerId,
        userName: 'Admin / Usuário',
        project: session.project,
        action: 'auth.session.revoked',
        resource: 'sessions',
        entityId: sessionId
      })
      return true
    }
    return false
  }

  revokeAllUserSessions(userId: string, revokerId: string): number {
    let count = 0
    this.activeSessions.forEach(session => {
      if (session.userId === userId && !session.isRevoked) {
        session.isRevoked = true
        count++
      }
    })

    logAuditEvent({
      userId: revokerId,
      userName: 'Admin / Usuário',
      project: 'hub',
      action: 'auth.all_sessions.revoked',
      resource: 'sessions',
      entityId: userId,
      changes: [{ field: 'revoked_count', before: null, after: count }]
    })

    return count
  }

  // ----------------------------------------------------
  // 3. Prevenção de IDOR e Controle de Propriedade
  // ----------------------------------------------------
  validateResourceOwnership(
    requestingUserId: string,
    resourceOwnerUserId: string,
    requestingUserRole: UserRole
  ): { allowed: boolean; reason?: string } {
    // Administradores e Masters possuem autorização operacional
    if (['MASTER', 'ADMIN'].includes(requestingUserRole)) {
      return { allowed: true }
    }

    // Clientes só podem acessar seus próprios recursos
    if (requestingUserId === resourceOwnerUserId) {
      return { allowed: true }
    }

    // Tentativa de acesso indevido bloqueada
    logAuditEvent({
      userId: requestingUserId,
      userName: 'Usuário',
      project: 'site',
      action: 'security.idor.blocked',
      resource: 'resource_access',
      entityId: resourceOwnerUserId,
      changes: [{ field: 'attempted_target', before: requestingUserId, after: resourceOwnerUserId }]
    })

    return {
      allowed: false,
      reason: 'Acesso negado: Você não possui autorização para visualizar este recurso.'
    }
  }

  // ----------------------------------------------------
  // 4. Mascaramento de Dados Sensíveis e Privacidade (LGPD)
  // ----------------------------------------------------
  maskCpf(document?: string): string {
    if (!document) return ''
    const clean = document.replace(/\D/g, '')
    if (clean.length !== 11) return '***.***.***-**'
    return `***.***.***-${clean.slice(-2)}`
  }

  maskPhone(phone?: string): string {
    if (!phone) return ''
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 4) return '(**) *****-****'
    return `(**) *****-${clean.slice(-4)}`
  }

  maskCreditCard(last4?: string, brand?: string): string {
    return `${brand ? brand.toUpperCase() : 'Cartão'} terminado em •••• ${last4 || '••••'}`
  }

  sanitizeHtml(dirty: string): string {
    if (!dirty) return ''
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:[^"']*/gi, '')
  }
}

export const securityService = new SecurityService()
