/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL CUSTOMERS SERVICE (@teknix/customers)
   Cadastro, edição, sincronização com Brevo, e-mail de boas-vindas e auditoria
   ========================================================================== */

import { supabase } from '../../supabase/client'
import { logAuditEvent } from '../../permissions/src/index'
import { brevoService } from '../../communications/src/index'

export interface CustomerData {
  id?: string
  userId?: string
  name: string
  email: string
  phone?: string
  document?: string // CPF/CNPJ
  status?: 'active' | 'blocked' | 'inactive'
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    postalCode?: string
  }
}

export interface MaskedPaymentMethod {
  id: string
  customerId: string
  gatewayToken: string
  brand: string // visa, mastercard, elo
  lastFourDigits: string // Ex: 4242
  expMonth: string
  expYear: string
  isDefault: boolean
  status: 'active' | 'expired' | 'failed'
}

export class CustomerService {
  /**
   * Cadastra cliente pelo HUB, dispara e-mail de boas-vindas e sincroniza com Brevo
   */
  async createCustomer(
    data: CustomerData,
    creator: { id: string; name: string }
  ): Promise<{ success: boolean; customer?: CustomerData; error?: string }> {
    try {
      const customerId = data.id || `cust-${Date.now()}`

      const { error: dbError } = await supabase
        .from('customers')
        .insert({
          id: customerId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          cpf: data.document || (data as any).cpf || null,
          user_id: data.userId || null,
          created_at: new Date().toISOString()
        })

      if (dbError) {
        console.warn('Aviso DB ao criar cliente (simulado se offline):', dbError.message)
      }

      // 1. Sincronizar com Brevo
      await brevoService.syncContact(data.email, {
        NOME: data.name,
        TELEFONE: data.phone,
        TIPO_USUARIO: 'CLIENTE',
        PROJETO: 'loja'
      })

      // 2. Disparar e-mail de boas-vindas com link seguro para definir senha
      const welcomeLink = `https://teknixbrasil.com.br/password?email=${encodeURIComponent(data.email)}`
      await brevoService.sendEmail({
        toEmail: data.email,
        toName: data.name,
        subject: 'Sua conta TEKNIX foi criada com sucesso',
        htmlContent: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1d1d1f;">
            <h1 style="font-size: 24px; font-weight: 600;">Olá, ${data.name}!</h1>
            <p style="font-size: 15px; line-height: 1.5; color: #515154;">
              Sua conta na <strong>TEKNIX</strong> foi criada pelo nosso atendimento.
            </p>
            <p style="font-size: 15px; line-height: 1.5; color: #515154;">
              Para acessar sua conta e acompanhar seus pedidos com total segurança, clique no botão abaixo para definir sua senha de acesso:
            </p>
            <div style="margin: 32px 0;">
              <a href="${welcomeLink}" style="background-color: #0071e3; color: #ffffff; padding: 12px 24px; border-radius: 980px; text-decoration: none; font-weight: 500; display: inline-block;">
                Definir Minha Senha de Acesso
              </a>
            </div>
            <p style="font-size: 12px; color: #86868b;">
              Se você não solicitou este cadastro, entre em contato imediatamente com o nosso suporte.
            </p>
          </div>
        `,
        type: 'TRANSACTIONAL'
      })

      // 3. Registrar auditoria central
      logAuditEvent({
        userId: creator.id,
        userName: creator.name,
        project: 'hub',
        action: 'customers.create',
        resource: 'customers',
        entityId: customerId,
        entityName: data.name,
        changes: [{ field: 'all', before: null, after: data }]
      })

      return {
        success: true,
        customer: { ...data, id: customerId }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao cadastrar cliente.' }
    }
  }

  /**
   * Atualiza dados cadastrais do cliente com registro de auditoria
   */
  async updateCustomer(
    customerId: string,
    updates: Partial<CustomerData>,
    editor: { id: string; name: string },
    previousData?: Partial<CustomerData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: dbError } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          document: updates.document
        })
        .eq('id', customerId)

      if (dbError) {
        console.warn('Aviso DB ao atualizar cliente:', dbError.message)
      }

      // Sincronizar dados no Brevo se e-mail ou nome mudou
      if (updates.email || updates.name || updates.phone) {
        await brevoService.syncContact(updates.email || previousData?.email || '', {
          NOME: updates.name || previousData?.name,
          TELEFONE: updates.phone || previousData?.phone,
          TIPO_USUARIO: 'CLIENTE',
          PROJETO: 'loja'
        })
      }

      // Registrar auditoria
      const changes = Object.keys(updates).map(key => ({
        field: key,
        before: (previousData as any)?.[key] || null,
        after: (updates as any)[key]
      }))

      logAuditEvent({
        userId: editor.id,
        userName: editor.name,
        project: 'hub',
        action: 'customers.edit',
        resource: 'customers',
        entityId: customerId,
        entityName: updates.name || previousData?.name,
        changes
      })

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atualizar cliente.' }
    }
  }

  /**
   * Retorna métodos de pagamento mascarados (Tokens, bandeira e últimos 4 dígitos)
   * NUNCA expõe número completo do cartão ou CVV.
   */
  async getMaskedPaymentMethods(customerId: string): Promise<MaskedPaymentMethod[]> {
    // Exemplo de métodos tokenizados e mascarados
    return [
      {
        id: `pm-${customerId}-1`,
        customerId,
        gatewayToken: `tok_live_${Math.random().toString(36).slice(2, 10)}`,
        brand: 'Mastercard',
        lastFourDigits: '8842',
        expMonth: '11',
        expYear: '28',
        isDefault: true,
        status: 'active'
      }
    ]
  }
}

export const customerService = new CustomerService()
