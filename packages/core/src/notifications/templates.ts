/* ==========================================================================
   TEKNIX CORE — NOTIFICATION TEMPLATES
   Templates universais com interpolação de variáveis: {{variable}}
   ========================================================================== */

export interface TemplateDefinition {
  subject: string
  bodyText: string
  bodyHtml?: string
}

export const NOTIFICATION_TEMPLATES: Record<string, TemplateDefinition> = {
  'user.2fa.required': {
    subject: 'Seu código de verificação TEKNIX: {{code}}',
    bodyText: 'Olá {{name}}, seu código de verificação de dois fatores para acesso é: {{code}}. Ele expira em {{expiresInMinutes}} minutos. Se você não solicitou este código, altere sua senha imediatamente.',
    bodyHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1d1d1f;">
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Verificação em Duas Etapas</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #6e6e73;">Olá {{name}}, utilize o código abaixo para validar seu acesso à sua Conta TEKNIX:</p>
        <div style="background-color: #f5f5f7; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0071e3;">{{code}}</span>
        </div>
        <p style="font-size: 13px; color: #86868b; line-height: 1.4;">Este código é de uso único e expira em {{expiresInMinutes}} minutos. Nunca compartilhe este código com ninguém.</p>
      </div>
    `
  },
  'order.paid': {
    subject: 'Confirmação do Pedido #{{orderNumber}} — TEKNIX Store',
    bodyText: 'Olá {{name}}, seu pedido #{{orderNumber}} no valor de {{total}} foi aprovado com sucesso! Estamos preparando seus produtos para envio.',
    bodyHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1d1d1f;">
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">Obrigado pelo seu pedido!</h2>
        <p style="font-size: 15px; color: #6e6e73;">Pedido #<strong>{{orderNumber}}</strong> confirmado no valor de <strong>{{total}}</strong>.</p>
        <p style="font-size: 14px; color: #1d1d1f; margin-top: 20px;">Você receberá atualizações sobre o rastreamento assim que o pacote for despachado.</p>
      </div>
    `
  },
  'marketplace.sale': {
    subject: '[{{marketplace}}] Nova venda realizada: Pedido #{{orderNumber}}',
    bodyText: 'Nova venda confirmada no {{marketplace}}! Pedido #{{orderNumber}} no valor de {{total}}. Acesse o painel FLOW para gerenciar a expedição.',
    bodyHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #1d1d1f;">
        <h3 style="font-size: 20px; font-weight: 600; color: #0071e3;">Nova Venda em {{marketplace}}</h3>
        <p style="font-size: 14px; color: #333336;">Pedido #<strong>{{orderNumber}}</strong> | Total: <strong>{{total}}</strong></p>
        <p style="font-size: 13px; color: #6e6e73;">Acesse o painel operacional para emissão de etiqueta e envio.</p>
      </div>
    `
  },
  'user.password.reset': {
    subject: 'Redefinição de Senha — Conta TEKNIX',
    bodyText: 'Olá {{name}}, clique no link a seguir para redefinir sua senha: {{resetLink}}. O link expira em 30 minutos.',
    bodyHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1d1d1f;">
        <h2 style="font-size: 22px; font-weight: 600;">Redefinição de Senha</h2>
        <p style="font-size: 14px; color: #6e6e73;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para prosseguir:</p>
        <div style="margin: 28px 0;">
          <a href="{{resetLink}}" style="background-color: #0071e3; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 980px; font-weight: 500; display: inline-block;">Redefinir Senha</a>
        </div>
      </div>
    `
  }
}

export function renderTemplate(templateKey: string, variables: Record<string, any>): TemplateDefinition {
  const tpl = NOTIFICATION_TEMPLATES[templateKey] || {
    subject: 'Notificação TEKNIX',
    bodyText: 'Você tem uma nova notificação.',
    bodyHtml: '<p>Você tem uma nova notificação.</p>'
  }

  let renderedSubject = tpl.subject
  let renderedText = tpl.bodyText
  let renderedHtml = tpl.bodyHtml || tpl.bodyText

  Object.entries(variables).forEach(([key, val]) => {
    const reg = new RegExp(`{{${key}}}`, 'g')
    renderedSubject = renderedSubject.replace(reg, String(val))
    renderedText = renderedText.replace(reg, String(val))
    renderedHtml = renderedHtml.replace(reg, String(val))
  })

  return {
    subject: renderedSubject,
    bodyText: renderedText,
    bodyHtml: renderedHtml
  }
}
