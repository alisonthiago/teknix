/* ==========================================================================
   TEKNIX CORE — BREVO EMAIL PROVIDER
   Camada centralizada e desacoplada para envio de e-mails transacionais
   ========================================================================== */

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
    
    let envEmail = ''
    let envName = ''
    try {
      envEmail = globalObj.process?.env?.BREVO_SENDER_EMAIL || globalObj.process?.env?.VITE_BREVO_SENDER_EMAIL || ''
      envName = globalObj.process?.env?.BREVO_SENDER_NAME || globalObj.process?.env?.VITE_BREVO_SENDER_NAME || ''
    } catch {}
    try {
      if (!envEmail && typeof import.meta !== 'undefined') {
        envEmail = (import.meta as any)?.env?.VITE_BREVO_SENDER_EMAIL || (import.meta as any)?.env?.BREVO_SENDER_EMAIL || ''
        envName = (import.meta as any)?.env?.VITE_BREVO_SENDER_NAME || (import.meta as any)?.env?.BREVO_SENDER_NAME || ''
      }
    } catch {}

    this.defaultSender = sender || {
      email: envEmail || 'alisonsilvathiago@gmail.com',
      name: envName || 'TEKNIX'
    }
  }

  async sendEmail(options: BrevoSendOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      console.info('[BrevoEmailProvider] Simulated email dispatch (No API key set):', {
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
          to: [
            {
              email: options.toEmail,
              name: options.toName || options.toEmail
            }
          ],
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
