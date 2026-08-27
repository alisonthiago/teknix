/* ==========================================================================
   TEKNIX MONOREPO — CAMPAIGNS & MARKETING SERVICE (@teknix/campaigns)
   Criação de campanhas segmentadas, disparo em lote e histórico de envios
   ========================================================================== */

import { audienceService, type AudienceFilter, type AudienceCustomer } from '../../audiences/src/index'
import { brevoService, type CommunicationChannel } from '../../communications/src/index'

export interface CampaignRecord {
  id: string
  title: string
  subject: string
  contentHtml: string
  channel: CommunicationChannel
  filter: AudienceFilter
  totalRecipients: number
  sentCount: number
  failedCount: number
  status: 'draft' | 'sending' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
}

export class CampaignService {
  private campaignsHistory: CampaignRecord[] = []

  /**
   * Dispara uma campanha segmentada para o público selecionado
   */
  async launchCampaign(params: {
    title: string
    subject: string
    contentHtml: string
    channel: CommunicationChannel
    filter: AudienceFilter
  }): Promise<{ success: boolean; campaignId: string; totalFound: number; sent: number; failed: number }> {
    // 1. Filtrar público
    const audience: AudienceCustomer[] = await audienceService.queryAudience(params.filter)

    const campaignId = `camp-${Date.now()}`
    const record: CampaignRecord = {
      id: campaignId,
      title: params.title,
      subject: params.subject,
      contentHtml: params.contentHtml,
      channel: params.channel,
      filter: params.filter,
      totalRecipients: audience.length,
      sentCount: 0,
      failedCount: 0,
      status: 'sending',
      createdAt: new Date().toISOString()
    }

    this.campaignsHistory.unshift(record)

    let sent = 0
    let failed = 0

    // 2. Disparar para cada cliente da audiência
    for (const customer of audience) {
      if (!customer.email) {
        failed++
        continue
      }

      // Interpolação de variáveis
      const personalizedHtml = params.contentHtml
        .replace(/{{name}}/g, customer.name)
        .replace(/{{email}}/g, customer.email)

      const res = await brevoService.sendEmail({
        toEmail: customer.email,
        toName: customer.name,
        subject: params.subject.replace(/{{name}}/g, customer.name),
        htmlContent: personalizedHtml,
        type: 'MARKETING'
      })

      if (res.success) {
        sent++
      } else {
        failed++
      }
    }

    record.sentCount = sent
    record.failedCount = failed
    record.status = failed === audience.length && audience.length > 0 ? 'failed' : 'completed'
    record.completedAt = new Date().toISOString()

    return {
      success: true,
      campaignId,
      totalFound: audience.length,
      sent,
      failed
    }
  }

  getCampaignsHistory(): CampaignRecord[] {
    return this.campaignsHistory
  }
}

export const campaignService = new CampaignService()
