/* ==========================================================================
   TEKNIX CORE — TWO-FACTOR AUTHENTICATION (2FA) ENGINE
   Gera, gerencia ciclo de vida, cooldown e validação de tokens OTP
   ========================================================================== */

import { notificationService } from '../notifications/service'
import type { ProjectContext } from '../notifications/types'

export interface TwoFactorChallenge {
  id: string
  userId: string
  email: string
  phone?: string
  code: string
  attempts: number
  maxAttempts: number
  expiresAt: number
  createdAt: number
  verified: boolean
}

export class TwoFactorService {
  private challenges: Map<string, TwoFactorChallenge> = new Map()

  /**
   * Gera um código de 6 dígitos e despacha para o e-mail cadastrado
   */
  async requestEmailCode(
    userId: string,
    email: string,
    userName: string = 'Cliente',
    project: ProjectContext = 'site'
  ): Promise<{ success: boolean; challengeId?: string; expiresInSeconds: number; error?: string }> {
    // 1. Cooldown check (60 segundos)
    const existing = Array.from(this.challenges.values()).find(
      c => c.userId === userId && Date.now() - c.createdAt < 60000
    )
    if (existing) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - existing.createdAt)) / 1000)
      return {
        success: false,
        expiresInSeconds: 0,
        error: `Por favor, aguarde ${waitSeconds} segundos antes de solicitar um novo código.`
      }
    }

    // 2. Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const challengeId = `2fa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const validityMinutes = 10

    const challenge: TwoFactorChallenge = {
      id: challengeId,
      userId,
      email,
      code,
      attempts: 0,
      maxAttempts: 3,
      expiresAt: Date.now() + validityMinutes * 60 * 1000,
      createdAt: Date.now(),
      verified: false
    }

    this.challenges.set(challengeId, challenge)

    // 3. Notificar via NotificationService
    await notificationService.publishEvent('user.2fa.required', {
      project,
      targetUser: { id: userId, name: userName, email },
      data: {
        code,
        expiresInMinutes: validityMinutes
      }
    })

    return {
      success: true,
      challengeId,
      expiresInSeconds: validityMinutes * 60
    }
  }

  /**
   * Valida o código informado pelo usuário
   */
  verifyCode(challengeId: string, inputCode: string): { success: boolean; error?: string } {
    const challenge = this.challenges.get(challengeId)

    if (!challenge) {
      return { success: false, error: 'Sessão de verificação expirada ou inválida.' }
    }

    if (Date.now() > challenge.expiresAt) {
      this.challenges.delete(challengeId)
      return { success: false, error: 'Este código de verificação expirou. Solicite um novo.' }
    }

    challenge.attempts += 1

    if (challenge.attempts > challenge.maxAttempts) {
      this.challenges.delete(challengeId)
      return { success: false, error: 'Número máximo de tentativas excedido. Solicite um novo código.' }
    }

    if (challenge.code.trim() !== inputCode.trim()) {
      const remaining = challenge.maxAttempts - challenge.attempts
      return {
        success: false,
        error: `Código incorreto. Você tem mais ${remaining} ${remaining === 1 ? 'tentativa' : 'tentativas'}.`
      }
    }

    // Sucesso
    challenge.verified = true
    this.challenges.delete(challengeId)
    return { success: true }
  }
}

export const twoFactorService = new TwoFactorService()
