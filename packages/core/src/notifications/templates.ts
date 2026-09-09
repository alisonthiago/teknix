/* ==========================================================================
   TEKNIX CORE — NOTIFICATION TEMPLATES
   Templates completos para todos os eventos do ciclo do cliente.
   HTML premium, identidade visual TEKNIX (Apple-inspired).
   Variáveis dinâmicas: {{variavel}}
   ========================================================================== */

export interface TemplateDefinition {
  subject: string
  bodyText: string
  bodyHtml?: string
}

/* --------------------------------------------------------------------------
   LAYOUT BASE — Wrapper compartilhado por todos os templates
   -------------------------------------------------------------------------- */
function wrapEmail(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TEKNIX</title>
  <meta name="color-scheme" content="light" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- HEADER OFICIAL TEKNIX — Verde Marca com SVG Logo (Altura Ampliada) -->
          <tr>
            <td style="background-color:#B5F500;border-radius:16px 16px 0 0;padding:44px 40px;text-align:center;">
              <a href="https://teknixbrasil.com.br" target="_blank" style="text-decoration:none;display:inline-block;vertical-align:middle;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 113.98 26.81" width="178" height="42" style="display:block;margin:0 auto;vertical-align:middle;">
                  <g fill="#111111">
                    <polygon points="56.95 26.15 52.21 26.19 49.52 22.34 46.09 17.51 43.48 20.03 43.46 26.2 39.44 26.2 39.44 .97 43.47 .96 43.46 8.58 43.48 15.21 51.4 7.36 56.59 7.39 48.85 14.95 56.95 26.15"/>
                    <path d="M108.37,23.32v2.92c-1.43.03-2.67.06-3.99-.35-1.52-.47-2.96-1.36-3.93-2.62l-2.33-3.01-1.92,2.5c-2.19,2.85-4.83,3.73-8.34,3.46v-4.11s1.05-.05,1.05-.05c1.62.13,3.09-.56,4.07-1.81l2.65-3.39-6.67-8.75c-.13-.17-.09-.58-.02-.78h4.17s5,6.3,5,6.3l2.55-3.22,2.47-3.08h4c.29.46.05.9-.23,1.27l-1.28,1.63-5.04,6.64,2.87,3.61c.77.97,1.9,1.47,3.1,1.59h1.8s.02,1.25.02,1.25Z"/>
                    <path d="M73.33,16.07c0-2.87-2.11-5.18-4.91-5.42s-5.53,1.78-5.67,4.7l-.08,10.84h-4.03s0-10.25,0-10.25c-.05-3.9,2.25-7.33,5.86-8.8,5.04-2.05,10.8.7,12.44,5.9.25.8.32,1.59.4,2.44v10.71s-4,.01-4,.01v-10.14Z"/>
                    <path d="M30.76,22.09c.85-.54,1.36-1.25,1.75-2.1l4.25-.02c-1.16,3.7-4.45,6.33-8.32,6.78-3.61.42-7.13-.96-9.32-3.89s-2.66-6.84-1.08-10.29c1.38-3.01,4.26-5.3,7.79-5.81,4.59-.66,8.98,1.97,10.63,6.32.61,1.61.78,3.31.63,4.98h-15.86c.15,1.19.6,2.15,1.38,3.02,2.04,2.26,5.53,2.68,8.14,1.01ZM33,14.94c-.33-1.55-1.15-2.63-2.23-3.48-2.31-1.51-5.23-1.46-7.44.24-1.02.78-1.71,1.92-2.06,3.25h11.73Z"/>
                    <path d="M15.99,26.22l-4.32-.04c-3.82-.04-6.97-3.46-6.99-6.94l-.05-8.69c0-.45-.36-.84-.81-.85l-3.82-.02v-4.29s2.76.01,2.76.01c3.36.19,6.11,2.9,6.14,6.26l.07,7.03c.02,2.11,2.06,3.26,3.97,3.25l3.06-.02-.02,4.3Z"/>
                    <path d="M15.76,4.67l.02,4.17-3.43-.03c-3.15-.21-5.64-2.77-5.88-5.9L6.42,0h4.35s0,3.8,0,3.8c.06.49.37.86.86.87h4.13Z"/>
                    <rect x="81.41" y="7.34" width="4.08" height="18.87"/>
                    <polygon points="85.48 5.19 81.42 5.17 81.42 .98 85.48 .96 85.48 5.19"/>
                    <g>
                      <path d="M111.95,4.58l.05.03c1.07.16,1.87,1.01,1.98,2.06v.46c-.13,1.16-1.09,2.06-2.25,2.09-1.42.04-2.55-1.21-2.35-2.65.17-1.03.95-1.81,1.98-1.96l.03-.02h.57ZM113.51,6.89c0-1.02-.83-1.84-1.84-1.84s-1.84.83-1.84,1.84.83,1.84,1.84,1.84,1.84-.83,1.84-1.84Z"/>
                      <path d="M112.83,8.05h-.67s-.34-.7-.34-.7c-.06-.13-.19-.21-.33-.21h-.62s0,2.42,0,2.42h.63s0-.91,0-.91h.22c.14,0,.27.08.33.21l.34.7h.67l-.42-.85c-.09-.13-.18-.21-.34-.29.3-.09.45-.32.45-.61,0-.2-.05-.38-.22-.51-.16-.09-.35-.16-.54-.16h-1.11s0,2.42,0,2.42h.63s0-.91,0-.91h.22c.14,0,.27.08.33.21l.34.7ZM111.91,6.39c0-.18-.1-.3-.27-.3h-.36s0,.62,0,.62h.37c.17-.02.26-.15.26-.32Z"/>
                    </g>
                  </g>
                </svg>
              </a>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e8e8ed;border-right:1px solid #e8e8ed;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f5f5f7;border-radius:0 0 16px 16px;padding:24px 40px;border:1px solid #e8e8ed;border-top:none;">
              <p style="margin:0;font-size:12px;color:#86868b;line-height:1.6;text-align:center;">
                TEKNIX Brasil · Este é um e-mail automático, não responda.<br/>
                <a href="https://teknixbrasil.com.br" style="color:#0071e3;text-decoration:none;">teknixbrasil.com.br</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/* --------------------------------------------------------------------------
   TEMPLATES INDIVIDUAIS
   -------------------------------------------------------------------------- */

const templates: Record<string, TemplateDefinition> = {

  /* ===== CONTA — Boas-vindas ===== */
  'user.created': {
    subject: 'Bem-vindo à TEKNIX, {{name}}!',
    bodyText: 'Olá {{name}}, sua conta TEKNIX foi criada com sucesso! Explore nosso catálogo completo de ferramentas e equipamentos em teknixbrasil.com.br.',
    bodyHtml: wrapEmail(`
      <h1 style="font-size:28px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Bem-vindo à TEKNIX.</h1>
      <p style="font-size:16px;color:#6e6e73;margin:0 0 32px 0;">Sua conta foi criada com sucesso.</p>
      <p style="font-size:15px;color:#1d1d1f;line-height:1.6;margin:0 0 16px 0;">Olá, <strong>{{name}}</strong>! Estamos felizes em ter você aqui.</p>
      <p style="font-size:15px;color:#6e6e73;line-height:1.6;margin:0 0 32px 0;">Agora você pode acompanhar pedidos, salvar itens favoritos e ter um checkout mais rápido em todas as suas compras.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://teknixbrasil.com.br" style="background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Explorar o catálogo</a>
      </div>
      <hr style="border:none;border-top:1px solid #f0f0f5;margin:32px 0;" />
      <p style="font-size:13px;color:#86868b;line-height:1.5;margin:0;">Se você não criou esta conta, ignore este e-mail.</p>
    `, 'Sua conta TEKNIX foi criada com sucesso!')
  },

  /* ===== PEDIDO — Criado / Aguardando pagamento ===== */
  'order.created': {
    subject: 'Pedido #{{orderNumber}} recebido — TEKNIX',
    bodyText: 'Olá {{name}}, recebemos o seu pedido #{{orderNumber}} no valor de {{total}}. Assim que o pagamento for confirmado, começaremos a preparar seus produtos.',
    bodyHtml: wrapEmail(`
      <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Pedido recebido!</h1>
      <p style="font-size:15px;color:#6e6e73;margin:0 0 32px 0;">Estamos aguardando a confirmação do pagamento.</p>
      <div style="background-color:#f5f5f7;border-radius:12px;padding:24px;margin:0 0 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:13px;color:#86868b;padding-bottom:8px;">Nº do pedido</td>
            <td style="font-size:13px;color:#86868b;padding-bottom:8px;text-align:right;">Data</td>
          </tr>
          <tr>
            <td style="font-size:18px;font-weight:700;color:#1d1d1f;">#{{orderNumber}}</td>
            <td style="font-size:15px;color:#1d1d1f;text-align:right;">{{date}}</td>
          </tr>
          <tr><td colspan="2" style="padding:16px 0;"><hr style="border:none;border-top:1px solid #e8e8ed;" /></td></tr>
          <tr>
            <td style="font-size:14px;color:#1d1d1f;">Total do pedido</td>
            <td style="font-size:20px;font-weight:700;color:#0071e3;text-align:right;">{{total}}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:14px;color:#6e6e73;line-height:1.6;margin:0 0 24px 0;">Olá <strong>{{name}}</strong>, assim que confirmarmos seu pagamento você receberá um novo e-mail com atualização do status.</p>
      <div style="text-align:center;">
        <a href="https://teknixbrasil.com.br/pedidos" style="background-color:#1d1d1f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Ver meu pedido</a>
      </div>
    `, 'Pedido #{{orderNumber}} recebido — aguardando pagamento')
  },

  /* ===== PEDIDO — Pagamento aprovado ===== */
  'order.paid': {
    subject: 'Pagamento confirmado — Pedido #{{orderNumber}} TEKNIX',
    bodyText: 'Olá {{name}}, o pagamento do seu pedido #{{orderNumber}} no valor de {{total}} foi aprovado! Estamos preparando seus produtos para envio.',
    bodyHtml: wrapEmail(`
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background-color:#e8f5e9;border-radius:50%;margin-bottom:16px;">
          <span style="font-size:24px;">✓</span>
        </div>
        <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Pagamento confirmado!</h1>
        <p style="font-size:15px;color:#6e6e73;margin:0;">Seu pedido está sendo preparado.</p>
      </div>
      <div style="background-color:#f5f5f7;border-radius:12px;padding:24px;margin:0 0 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:13px;color:#86868b;padding-bottom:4px;">Pedido</td>
            <td style="font-size:13px;color:#86868b;padding-bottom:4px;text-align:right;">Itens</td>
          </tr>
          <tr>
            <td style="font-size:18px;font-weight:700;color:#1d1d1f;">#{{orderNumber}}</td>
            <td style="font-size:15px;color:#1d1d1f;text-align:right;">{{itemsCount}} produto(s)</td>
          </tr>
          <tr><td colspan="2" style="padding:16px 0;"><hr style="border:none;border-top:1px solid #e8e8ed;" /></td></tr>
          <tr>
            <td style="font-size:14px;color:#1d1d1f;font-weight:600;">Total</td>
            <td style="font-size:22px;font-weight:700;color:#1e8a3c;text-align:right;">{{total}}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:14px;color:#6e6e73;line-height:1.6;margin:0 0 28px 0;">Olá <strong>{{name}}</strong>! Você receberá um novo e-mail assim que seu pedido for despachado com o código de rastreamento.</p>
      <div style="text-align:center;">
        <a href="https://teknixbrasil.com.br/pedidos" style="background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Acompanhar pedido</a>
      </div>
    `, 'Pagamento do pedido #{{orderNumber}} confirmado!')
  },

  /* ===== PEDIDO — Despachado ===== */
  'order.shipped': {
    subject: 'Seu pedido #{{orderNumber}} foi enviado! 🚚',
    bodyText: 'Ótimas notícias, {{name}}! Seu pedido #{{orderNumber}} foi despachado. Código de rastreamento: {{trackingCode}}. Previsão de entrega: {{deliveryEstimate}}.',
    bodyHtml: wrapEmail(`
      <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Seu pedido está a caminho!</h1>
      <p style="font-size:15px;color:#6e6e73;margin:0 0 32px 0;">Olá <strong>{{name}}</strong>, separamos e despachamos seu pedido.</p>
      <div style="background-color:#f0f7ff;border-radius:12px;padding:24px;margin:0 0 28px 0;border-left:4px solid #0071e3;">
        <p style="font-size:13px;color:#0071e3;font-weight:600;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.5px;">Código de rastreamento</p>
        <p style="font-size:22px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:2px;">{{trackingCode}}</p>
        <p style="font-size:13px;color:#86868b;margin:0;">Transportadora: {{carrier}} · Previsão: <strong>{{deliveryEstimate}}</strong></p>
      </div>
      <div style="background-color:#f5f5f7;border-radius:12px;padding:20px 24px;margin:0 0 28px 0;">
        <p style="font-size:13px;color:#86868b;margin:0 0 4px 0;">Pedido</p>
        <p style="font-size:16px;font-weight:600;color:#1d1d1f;margin:0;">#{{orderNumber}} · {{total}}</p>
      </div>
      <div style="text-align:center;">
        <a href="https://teknixbrasil.com.br/pedidos" style="background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Rastrear entrega</a>
      </div>
    `, 'Seu pedido #{{orderNumber}} foi despachado!')
  },

  /* ===== PEDIDO — Entregue ===== */
  'order.delivered': {
    subject: 'Pedido #{{orderNumber}} entregue com sucesso! 🎉',
    bodyText: 'Olá {{name}}, seu pedido #{{orderNumber}} foi entregue! Esperamos que você aproveite muito. Se tiver qualquer dúvida, estamos à disposição.',
    bodyHtml: wrapEmail(`
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">🎉</div>
        <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Pedido entregue!</h1>
        <p style="font-size:15px;color:#6e6e73;margin:0;">Esperamos que você aproveite muito.</p>
      </div>
      <p style="font-size:15px;color:#1d1d1f;line-height:1.6;margin:0 0 24px 0;">Olá <strong>{{name}}</strong>! Confirmamos a entrega do seu pedido <strong>#{{orderNumber}}</strong>.</p>
      <div style="background-color:#f5f5f7;border-radius:12px;padding:20px 24px;margin:0 0 28px 0;">
        <p style="font-size:13px;color:#86868b;margin:0 0 4px 0;">Pedido entregue</p>
        <p style="font-size:16px;font-weight:600;color:#1d1d1f;margin:0;">#{{orderNumber}} · {{total}}</p>
      </div>
      <p style="font-size:14px;color:#6e6e73;line-height:1.6;margin:0 0 28px 0;">Encontrou algum problema? Entre em contato conosco — estamos aqui para ajudar.</p>
      <div style="text-align:center;">
        <a href="https://teknixbrasil.com.br/pedidos" style="background-color:#1d1d1f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Ver histórico de pedidos</a>
      </div>
    `, 'Pedido #{{orderNumber}} entregue com sucesso!')
  },

  /* ===== PEDIDO — Cancelado ===== */
  'order.cancelled': {
    subject: 'Pedido #{{orderNumber}} cancelado — TEKNIX',
    bodyText: 'Olá {{name}}, o pedido #{{orderNumber}} no valor de {{total}} foi cancelado. Se você tiver pago, o reembolso será processado em até 7 dias úteis.',
    bodyHtml: wrapEmail(`
      <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Pedido cancelado</h1>
      <p style="font-size:15px;color:#6e6e73;margin:0 0 32px 0;">Seu pedido foi cancelado conforme solicitado.</p>
      <div style="background-color:#fff5f5;border-radius:12px;padding:20px 24px;margin:0 0 28px 0;border-left:4px solid #ff3b30;">
        <p style="font-size:13px;color:#86868b;margin:0 0 4px 0;">Pedido cancelado</p>
        <p style="font-size:18px;font-weight:700;color:#1d1d1f;margin:0 0 4px 0;">#{{orderNumber}}</p>
        <p style="font-size:15px;color:#1d1d1f;margin:0;">Valor: {{total}}</p>
      </div>
      <p style="font-size:14px;color:#6e6e73;line-height:1.6;margin:0 0 8px 0;">Olá <strong>{{name}}</strong>. Caso tenha efetuado pagamento, o reembolso será processado em até <strong>7 dias úteis</strong> pela operadora do cartão ou pelo Pix.</p>
      <p style="font-size:14px;color:#6e6e73;line-height:1.6;margin:0 0 28px 0;">Motivo: <strong>{{reason}}</strong></p>
      <div style="text-align:center;">
        <a href="https://teknixbrasil.com.br" style="background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Continuar comprando</a>
      </div>
    `, 'Pedido #{{orderNumber}} foi cancelado')
  },

  /* ===== PAGAMENTO — Falhou ===== */
  'payment.failed': {
    subject: 'Problema com seu pagamento — Pedido #{{orderNumber}}',
    bodyText: 'Olá {{name}}, não conseguimos processar o pagamento do pedido #{{orderNumber}} no valor de {{total}}. Verifique seus dados e tente novamente.',
    bodyHtml: wrapEmail(`
      <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Falha no pagamento</h1>
      <p style="font-size:15px;color:#6e6e73;margin:0 0 32px 0;">Precisamos que você atualize sua forma de pagamento.</p>
      <div style="background-color:#fff5f5;border-radius:12px;padding:24px;margin:0 0 28px 0;border:1px solid #ffcdd2;">
        <p style="font-size:13px;color:#c62828;font-weight:600;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.5px;">Pagamento não processado</p>
        <p style="font-size:16px;font-weight:700;color:#1d1d1f;margin:0 0 4px 0;">Pedido #{{orderNumber}}</p>
        <p style="font-size:15px;color:#6e6e73;margin:0;">Valor: {{total}} · Método: {{paymentMethod}}</p>
      </div>
      <p style="font-size:14px;color:#6e6e73;line-height:1.6;margin:0 0 8px 0;">Olá <strong>{{name}}</strong>. Os produtos do seu pedido foram reservados. Você tem até <strong>24 horas</strong> para regularizar o pagamento antes do cancelamento automático.</p>
      <p style="font-size:13px;color:#86868b;line-height:1.5;margin:0 0 28px 0;">Razão: {{failureReason}}</p>
      <div style="text-align:center;">
        <a href="https://teknixbrasil.com.br/pedidos" style="background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Atualizar pagamento</a>
      </div>
    `, 'Problema com pagamento do pedido #{{orderNumber}}')
  },

  /* ===== SEGURANÇA — 2FA ===== */
  'user.2fa.required': {
    subject: 'Código de verificação TEKNIX: {{code}}',
    bodyText: 'Olá {{name}}, seu código de verificação de dois fatores é: {{code}}. Ele expira em {{expiresInMinutes}} minutos. Se você não solicitou, altere sua senha.',
    bodyHtml: wrapEmail(`
      <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Verificação em duas etapas</h1>
      <p style="font-size:15px;color:#6e6e73;margin:0 0 32px 0;">Olá <strong>{{name}}</strong>, use o código abaixo para entrar na sua conta.</p>
      <div style="background-color:#f5f5f7;border-radius:16px;padding:32px;text-align:center;margin:0 0 28px 0;">
        <p style="font-size:13px;color:#86868b;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Seu código</p>
        <p style="font-size:40px;font-weight:700;letter-spacing:10px;color:#0071e3;margin:0;font-variant-numeric:tabular-nums;">{{code}}</p>
        <p style="font-size:12px;color:#86868b;margin:12px 0 0 0;">Expira em {{expiresInMinutes}} minutos</p>
      </div>
      <hr style="border:none;border-top:1px solid #f0f0f5;margin:28px 0;" />
      <p style="font-size:13px;color:#86868b;line-height:1.5;margin:0;">Nunca compartilhe este código. A TEKNIX jamais solicitará seu código por telefone, chat ou e-mail.</p>
    `, 'Seu código de verificação TEKNIX')
  },

  /* ===== CONTA — Redefinição de senha ===== */
  'user.password.reset': {
    subject: 'Redefinição de senha — Conta TEKNIX',
    bodyText: 'Olá {{name}}, clique no link a seguir para redefinir sua senha: {{resetLink}}. O link expira em 30 minutos. Se você não solicitou, ignore este e-mail.',
    bodyHtml: wrapEmail(`
      <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Redefinição de senha</h1>
      <p style="font-size:15px;color:#6e6e73;margin:0 0 32px 0;">Recebemos uma solicitação para redefinir a senha da sua conta TEKNIX.</p>
      <p style="font-size:15px;color:#1d1d1f;line-height:1.6;margin:0 0 28px 0;">Olá <strong>{{name}}</strong>, clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>30 minutos</strong>.</p>
      <div style="text-align:center;margin:0 0 28px 0;">
        <a href="{{resetLink}}" style="background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Criar nova senha</a>
      </div>
      <div style="background-color:#f5f5f7;border-radius:12px;padding:16px 20px;margin:0 0 16px 0;">
        <p style="font-size:12px;color:#86868b;margin:0 0 4px 0;">Se o botão não funcionar, copie este link:</p>
        <p style="font-size:12px;color:#0071e3;margin:0;word-break:break-all;">{{resetLink}}</p>
      </div>
      <hr style="border:none;border-top:1px solid #f0f0f5;margin:24px 0;" />
      <p style="font-size:13px;color:#86868b;line-height:1.5;margin:0;">Se você não solicitou a redefinição de senha, ignore este e-mail — sua conta continuará segura.</p>
    `, 'Redefinição de senha solicitada para sua conta TEKNIX')
  },

  /* ===== CONTA — E-mail verificado ===== */
  'user.email.verified': {
    subject: 'E-mail verificado — Conta TEKNIX confirmada',
    bodyText: 'Olá {{name}}, seu e-mail foi verificado com sucesso! Sua Conta TEKNIX está completa e ativa.',
    bodyHtml: wrapEmail(`
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background-color:#e8f5e9;border-radius:50%;margin-bottom:16px;">
          <span style="font-size:28px;">✓</span>
        </div>
        <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">E-mail verificado!</h1>
        <p style="font-size:15px;color:#6e6e73;margin:0;">Sua conta TEKNIX está completamente ativa.</p>
      </div>
      <p style="font-size:15px;color:#1d1d1f;line-height:1.6;margin:0 0 28px 0;">Olá <strong>{{name}}</strong>! Seu endereço de e-mail <strong>{{email}}</strong> foi verificado. Você já pode aproveitar todos os recursos da sua conta.</p>
      <div style="text-align:center;">
        <a href="https://teknixbrasil.com.br/conta" style="background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Ir para minha conta</a>
      </div>
    `, 'E-mail verificado — conta TEKNIX ativa')
  },

  /* ===== SEGURANÇA — Alerta ===== */
  'security.alert': {
    subject: '⚠️ Alerta de segurança na sua Conta TEKNIX',
    bodyText: 'Olá {{name}}, detectamos uma atividade incomum na sua conta: {{alertDescription}}. Se não foi você, acesse sua conta imediatamente e altere sua senha.',
    bodyHtml: wrapEmail(`
      <div style="background-color:#fff8e1;border-radius:12px;padding:20px 24px;margin:0 0 28px 0;border-left:4px solid #f59e0b;">
        <p style="font-size:15px;font-weight:700;color:#92400e;margin:0 0 4px 0;">⚠️ Alerta de segurança</p>
        <p style="font-size:14px;color:#92400e;margin:0;">Detectamos atividade incomum na sua conta.</p>
      </div>
      <h1 style="font-size:24px;font-weight:700;color:#1d1d1f;margin:0 0 8px 0;letter-spacing:-0.5px;">Ação detectada na sua conta</h1>
      <p style="font-size:15px;color:#1d1d1f;line-height:1.6;margin:0 0 8px 0;">Olá <strong>{{name}}</strong>, identificamos a seguinte ação:</p>
      <div style="background-color:#f5f5f7;border-radius:12px;padding:20px 24px;margin:0 0 28px 0;">
        <p style="font-size:15px;color:#1d1d1f;margin:0 0 8px 0;font-weight:600;">{{alertDescription}}</p>
        <p style="font-size:13px;color:#86868b;margin:0;">Data/hora: {{timestamp}} · IP: {{ipAddress}}</p>
      </div>
      <p style="font-size:14px;color:#6e6e73;line-height:1.6;margin:0 0 28px 0;">Se foi você, pode ignorar este e-mail. Caso contrário, <strong>altere sua senha imediatamente</strong>.</p>
      <div style="text-align:center;">
        <a href="https://teknixbrasil.com.br/login" style="background-color:#1d1d1f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Proteger minha conta</a>
      </div>
    `, 'Alerta de segurança na sua Conta TEKNIX')
  },

  /* ===== LOJA — Nova venda (notificação admin) ===== */
  'marketplace.sale': {
    subject: '[{{marketplace}}] Nova venda — Pedido #{{orderNumber}}',
    bodyText: 'Nova venda em {{marketplace}}! Pedido #{{orderNumber}} no valor de {{total}}. Acesse o HUB para gerenciar a expedição.',
    bodyHtml: wrapEmail(`
      <div style="background-color:#e8f5e9;border-radius:12px;padding:20px 24px;margin:0 0 28px 0;border-left:4px solid #1e8a3c;">
        <p style="font-size:13px;color:#1e8a3c;font-weight:700;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.5px;">Nova venda confirmada</p>
        <p style="font-size:22px;font-weight:700;color:#1d1d1f;margin:0;">{{marketplace}}</p>
      </div>
      <div style="background-color:#f5f5f7;border-radius:12px;padding:24px;margin:0 0 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:13px;color:#86868b;padding-bottom:4px;">Nº do pedido</td>
            <td style="font-size:13px;color:#86868b;padding-bottom:4px;text-align:right;">Produtos</td>
          </tr>
          <tr>
            <td style="font-size:18px;font-weight:700;color:#1d1d1f;">#{{orderNumber}}</td>
            <td style="font-size:15px;color:#1d1d1f;text-align:right;">{{itemsCount}} item(s)</td>
          </tr>
          <tr><td colspan="2" style="padding:16px 0;"><hr style="border:none;border-top:1px solid #e8e8ed;" /></td></tr>
          <tr>
            <td style="font-size:14px;color:#1d1d1f;font-weight:600;">Total</td>
            <td style="font-size:22px;font-weight:700;color:#1e8a3c;text-align:right;">{{total}}</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="https://hub.teknixbrasil.com.br" style="background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;display:inline-block;">Acessar o HUB</a>
      </div>
    `, 'Nova venda — Pedido #{{orderNumber}} em {{marketplace}}')
  },

  /* ===== SISTEMA — Aviso genérico ===== */
  'system.notice': {
    subject: 'Aviso importante — TEKNIX',
    bodyText: '{{message}}',
    bodyHtml: wrapEmail(`
      <h1 style="font-size:24px;font-weight:700;color:#1d1d1f;margin:0 0 24px 0;letter-spacing:-0.5px;">{{title}}</h1>
      <p style="font-size:15px;color:#6e6e73;line-height:1.6;margin:0 0 28px 0;">{{message}}</p>
    `)
  }
}

export const NOTIFICATION_TEMPLATES = templates

/* --------------------------------------------------------------------------
   RENDER ENGINE — interpola variáveis {{key}} nos templates
   -------------------------------------------------------------------------- */
export function renderTemplate(
  templateKey: string,
  variables: Record<string, any>
): TemplateDefinition {
  const tpl = NOTIFICATION_TEMPLATES[templateKey] || {
    subject: 'Notificação TEKNIX',
    bodyText: 'Você tem uma nova notificação.',
    bodyHtml: '<p>Você tem uma nova notificação.</p>'
  }

  let renderedSubject = tpl.subject
  let renderedText = tpl.bodyText
  let renderedHtml = tpl.bodyHtml || `<p>${tpl.bodyText}</p>`

  // Adicionar variáveis padrão se não fornecidas
  const defaultVars: Record<string, string> = {
    date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    carrier: 'Correios',
    reason: 'solicitado pelo cliente',
    failureReason: 'dados do cartão inválidos ou saldo insuficiente',
    alertDescription: 'acesso com dispositivo não reconhecido',
    timestamp: new Date().toLocaleString('pt-BR'),
    ipAddress: '',
    marketplace: 'Loja Oficial TEKNIX',
    itemsCount: '1',
    ...variables
  }

  Object.entries(defaultVars).forEach(([key, val]) => {
    const reg = new RegExp(`{{${key}}}`, 'g')
    const safeVal = String(val ?? '')
    renderedSubject = renderedSubject.replace(reg, safeVal)
    renderedText = renderedText.replace(reg, safeVal)
    renderedHtml = renderedHtml.replace(reg, safeVal)
  })

  return {
    subject: renderedSubject,
    bodyText: renderedText,
    bodyHtml: renderedHtml
  }
}
