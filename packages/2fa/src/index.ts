/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL 2FA ENGINE (@teknix/2fa)
   Geração e validação de tokens OTP, cooldown e integração multi-canal
   ========================================================================== */

import { notificationService, type ProjectContext } from '../../notifications/src/index'

export interface TwoFactorChallenge {
  id: string
  userId: string
  email: string
  code: string
  attempts: number
  maxAttempts: number
  expiresAt: number
  createdAt: number
}

export class TwoFactorService {
  private challenges: Map<string, TwoFactorChallenge> = new Map()

  async requestEmailCode(
    userId: string,
    email: string,
    userName: string = 'Cliente',
    project: ProjectContext = 'site'
  ): Promise<{ success: boolean; challengeId?: string; expiresInSeconds: number; error?: string }> {
    const existing = Array.from(this.challenges.values()).find(
      c => c.userId === userId && Date.now() - c.createdAt < 60000
    )
    if (existing) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - existing.createdAt)) / 1000)
      return {
        success: false,
        expiresInSeconds: 0,
        error: `Aguarde ${waitSeconds} segundos antes de solicitar um novo código.`
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const challengeId = `2fa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const validityMinutes = 10

    const challenge: TwoFactorChallenge = {
      id: challengeId,
      userId,
      email,
      code,
      attempts: 0,
      maxAttempts: 3,
      expiresAt: Date.now() + validityMinutes * 60 * 1000,
      createdAt: Date.now()
    }

    this.challenges.set(challengeId, challenge)

    await notificationService.publishEvent('user.2fa.required', {
      project,
      targetUser: { id: userId, name: userName, email },
      data: { code, expiresInMinutes: validityMinutes }
    })

    return {
      success: true,
      challengeId,
      expiresInSeconds: validityMinutes * 60
    }
  }

  verifyCode(challengeId: string, inputCode: string): { success: boolean; error?: string } {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) {
      return { success: false, error: 'Sessão de verificação expirada ou inválida.' }
    }

    if (Date.now() > challenge.expiresAt) {
      this.challenges.delete(challengeId)
      return { success: false, error: 'O código expirou. Solicite um novo código.' }
    }

    challenge.attempts += 1
    if (challenge.attempts > challenge.maxAttempts) {
      this.challenges.delete(challengeId)
      return { success: false, error: 'Número máximo de tentativas excedido.' }
    }

    if (challenge.code.trim() !== inputCode.trim()) {
      return { success: false, error: 'Código incorreto. Tente novamente.' }
    }

    this.challenges.delete(challengeId)
    return { success: true }
  }
}

export const twoFactorService = new TwoFactorService()
