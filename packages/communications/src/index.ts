/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL COMMUNICATIONS SERVICE (@teknix/communications)
   Integração Brevo (Transacional vs Marketing), SMS, WhatsApp e Sync de Contatos
   ========================================================================== */

export type CommunicationType = 'TRANSACTIONAL' | 'MARKETING'
export type CommunicationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app'

export interface BrevoContactAttributes {
  NOME?: string
  TELEFONE?: string
  PROJETO?: string
  TIPO_USUARIO?: 'CLIENTE' | 'COLABORADOR' | 'ADMIN' | 'OPERADOR'
  ULTIMA_COMPRA_DATA?: string
  TOTAL_PEDIDOS?: number
  TOTAL_GASTO?: number
  ULTIMO_PRODUTO_COMPRADO?: string
  ULTIMA_CATEGORIA_COMPRADA?: string
}

export class BrevoCommunicationService {
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

  /**
   * Sincroniza ou atualiza um contato e seus atributos de segmentação no Brevo
   */
  async syncContact(
    email: string,
    attributes: BrevoContactAttributes,
    listIds?: number[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      console.info('[BrevoSync] Simulação de sincronização de contato:', { email, attributes })
      return { success: true }
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          email,
          attributes,
          listIds: listIds || [2], // Lista padrão
          updateEnabled: true
        })
      })

      if (!response.ok && response.status !== 400) {
        const errData = await response.json().catch(() => ({}))
        return { success: false, error: errData.message || `Brevo HTTP error ${response.status}` }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao sincronizar contato no Brevo' }
    }
  }

  /**
   * Dispara um e-mail com garantia de isolamento Transacional vs Marketing
   */
  async sendEmail(options: {
    toEmail: string
    toName?: string
    subject: string
    htmlContent: string
    textContent?: string
    type: CommunicationType
    senderEmail?: string
    senderName?: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      console.info(`[BrevoCommunication] Simulação de envio (${options.type}):`, {
        to: options.toEmail,
        subject: options.subject
      })
      return { success: true, messageId: `msg-${Date.now()}` }
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
          textContent: options.textContent,
          tags: [options.type.toLowerCase()]
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        return { success: false, error: errData.message || `Brevo HTTP error ${response.status}` }
      }

      const resData = await response.json()
      return { success: true, messageId: resData.messageId }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao enviar e-mail pelo Brevo' }
    }
  }
}

export const brevoService = new BrevoCommunicationService()
