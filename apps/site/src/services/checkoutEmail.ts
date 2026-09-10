/* ==========================================================================
   TEKNIX SITE — CHECKOUT TRANSACTIONAL EMAIL SERVICE
   Disparo direto e garantido via Brevo SMTP API (CORS habilitado no browser).
   Templates 100% padrão visual oficial TEKNIX (Apple inspired).
   ========================================================================== */

const BREVO_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BREVO_API_KEY) || ''

const SENDER_EMAIL =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_BREVO_SENDER_EMAIL || import.meta.env?.BREVO_SENDER_EMAIL)) ||
  'alisonsilvathiago@gmail.com'

const SENDER_NAME =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_BREVO_SENDER_NAME || import.meta.env?.BREVO_SENDER_NAME)) ||
  'TEKNIX Brasil'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount || 0)
}

function wrapTeknixEmail(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TEKNIX</title>
  <meta name="color-scheme" content="light" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e5e5ea;">

          <!-- HEADER OFICIAL TEKNIX — Verde Marca com SVG Logo -->
          <tr>
            <td style="background-color:#B5F500;padding:40px 32px;text-align:center;">
              <a href="https://teknixbrasil.com.br" target="_blank" style="text-decoration:none;display:inline-block;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 113.98 26.81" width="160" height="38" style="display:block;margin:0 auto;">
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

          <!-- CONTEÚDO PRINCIPAL -->
          <tr>
            <td style="padding:36px 32px;">
              ${content}
            </td>
          </tr>

          <!-- RODAPÉ -->
          <tr>
            <td style="background-color:#f5f5f7;padding:24px 32px;border-top:1px solid #e8e8ed;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#86868b;line-height:1.5;">
                TEKNIX Brasil Equipamentos e Ferramentas<br/>
                Este é um e-mail transacional referente ao seu pedido.
              </p>
              <a href="https://teknixbrasil.com.br" style="font-size:12px;color:#0071e3;text-decoration:none;font-weight:500;">
                teknixbrasil.com.br
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function sendBrevoDirect(params: {
  toEmail: string
  toName: string
  subject: string
  htmlContent: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!BREVO_API_KEY) {
    console.warn('[checkoutEmail] Chave Brevo não configurada')
    return { success: false, error: 'Chave Brevo ausente' }
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          email: SENDER_EMAIL,
          name: SENDER_NAME
        },
        to: [
          {
            email: params.toEmail,
            name: params.toName || params.toEmail
          }
        ],
        subject: params.subject,
        htmlContent: params.htmlContent
      })
    })

    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      console.log(`[checkoutEmail] ✅ E-mail entregue via Brevo para ${params.toEmail} (ID: ${data.messageId})`)
      return { success: true, messageId: data.messageId }
    } else {
      console.warn('[checkoutEmail] ⚠️ Resposta Brevo:', data)
      return { success: false, error: data.message || 'Falha Brevo' }
    }
  } catch (err: any) {
    console.warn('[checkoutEmail] ⚠️ Erro no fetch Brevo:', err?.message)
    return { success: false, error: err?.message }
  }
}

/* ==========================================================================
   1. E-MAIL PIX PENDENTE (COM QR CODE + COPIA E COLA)
   ========================================================================== */
export async function sendPixPendingEmail(params: {
  customerEmail: string
  customerName: string
  orderNumber: string
  total: number
  pixCode: string
}) {
  if (!params.customerEmail) return

  const formattedTotal = formatMoney(params.total)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(params.pixCode)}`

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <span style="display:inline-block;background:#e6faf7;color:#00796b;border:1px solid #b2dfdb;border-radius:20px;padding:6px 16px;font-size:13px;font-weight:700;letter-spacing:-0.1px;margin-bottom:14px;">
        ⚡ Pix Instantâneo
      </span>
      <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 6px 0;letter-spacing:-0.5px;">
        Pedido recebido! Pague via Pix
      </h1>
      <p style="font-size:15px;color:#6e6e73;margin:0;">
        Olá <strong>${params.customerName}</strong>, seu pedido <strong>#${params.orderNumber}</strong> foi gerado e aguarda pagamento.
      </p>
    </div>

    <!-- CARD VALOR & TEMPO -->
    <div style="background:#f5f5f7;border-radius:14px;padding:20px 24px;margin-bottom:28px;border:1px solid #e5e5ea;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:12px;color:#86868b;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Total do pedido</td>
          <td style="font-size:12px;color:#86868b;text-align:right;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Validade do código</td>
        </tr>
        <tr>
          <td style="font-size:24px;font-weight:800;color:#1d1d1f;padding-top:4px;">${formattedTotal}</td>
          <td style="font-size:15px;font-weight:700;color:#d97706;text-align:right;padding-top:4px;">⏱ 30 minutos</td>
        </tr>
      </table>
    </div>

    <!-- QR CODE CENTRALIZADO -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#ffffff;padding:16px;border-radius:16px;border:2px solid #00b09b;box-shadow:0 4px 16px rgba(0,176,155,0.12);">
        <img src="${qrImageUrl}" alt="QR Code Pix" width="220" height="220" style="display:block;border-radius:8px;" />
      </div>
      <p style="font-size:13px;color:#6e6e73;margin:12px 0 0 0;">
        Aponte a câmera do celular no aplicativo do seu banco para pagar.
      </p>
    </div>

    <!-- PIX COPIA E COLA -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin-bottom:28px;">
      <p style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">
        Ou pague com Pix Copia e Cola:
      </p>
      <div style="background:#ffffff;border:1px solid #d1d5db;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#111827;word-break:break-all;line-height:1.4;max-height:80px;overflow:hidden;">
        ${params.pixCode}
      </div>
    </div>

    <!-- INSTRUÇÕES PASSO A PASSO -->
    <div style="border-top:1px solid #e5e5ea;padding-top:24px;margin-bottom:28px;">
      <p style="font-size:14px;font-weight:700;color:#1d1d1f;margin:0 0 14px 0;">Como pagar:</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="28" valign="top" style="font-size:14px;font-weight:700;color:#0071e3;">1.</td>
          <td style="font-size:13px;color:#4b5563;line-height:1.5;padding-bottom:10px;">
            Abra o app do seu banco ou carteira digital favorita.
          </td>
        </tr>
        <tr>
          <td width="28" valign="top" style="font-size:14px;font-weight:700;color:#0071e3;">2.</td>
          <td style="font-size:13px;color:#4b5563;line-height:1.5;padding-bottom:10px;">
            Escolha pagar via Pix e escaneie o QR Code acima ou cole o código Copia e Cola.
          </td>
        </tr>
        <tr>
          <td width="28" valign="top" style="font-size:14px;font-weight:700;color:#0071e3;">3.</td>
          <td style="font-size:13px;color:#4b5563;line-height:1.5;">
            Confirme os dados e o valor. A confirmação de pagamento é instantânea!
          </td>
        </tr>
      </table>
    </div>

    <!-- BOTÃO ACOMPANHAR PEDIDO -->
    <div style="text-align:center;">
      <a href="https://teknixbrasil.com.br/pedidos" style="display:inline-block;background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:600;">
        Acompanhar meu pedido
      </a>
    </div>
  `

  return sendBrevoDirect({
    toEmail: params.customerEmail,
    toName: params.customerName,
    subject: `⚡ Código Pix do seu pedido #${params.orderNumber} — TEKNIX`,
    htmlContent: wrapTeknixEmail(content, `Seu código Pix para o pedido #${params.orderNumber} no valor de ${formattedTotal}`)
  })
}

/* ==========================================================================
   2. E-MAIL BOLETO BANCÁRIO PENDENTE (COM CÓDIGO DE BARRAS / LINHA DIGITÁVEL)
   ========================================================================== */
export async function sendBoletoPendingEmail(params: {
  customerEmail: string
  customerName: string
  orderNumber: string
  total: number
  digitableLine: string
  dueDate?: string
  ticketUrl?: string
}) {
  if (!params.customerEmail) return

  const formattedTotal = formatMoney(params.total)
  const dueDate = params.dueDate || (() => {
    const d = new Date()
    let bd = 0
    while (bd < 3) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) bd++ }
    return d.toLocaleDateString('pt-BR')
  })()

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <span style="display:inline-block;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:20px;padding:6px 16px;font-size:13px;font-weight:700;letter-spacing:-0.1px;margin-bottom:14px;">
        📄 Boleto Bancário
      </span>
      <h1 style="font-size:26px;font-weight:700;color:#1d1d1f;margin:0 0 6px 0;letter-spacing:-0.5px;">
        Boleto gerado com sucesso!
      </h1>
      <p style="font-size:15px;color:#6e6e73;margin:0;">
        Olá <strong>${params.customerName}</strong>, seu boleto para o pedido <strong>#${params.orderNumber}</strong> está pronto para pagamento.
      </p>
    </div>

    <!-- CARD VALOR & VENCIMENTO -->
    <div style="background:#f5f5f7;border-radius:14px;padding:20px 24px;margin-bottom:28px;border:1px solid #e5e5ea;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:12px;color:#86868b;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Total a pagar</td>
          <td style="font-size:12px;color:#86868b;text-align:right;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Vencimento</td>
        </tr>
        <tr>
          <td style="font-size:24px;font-weight:800;color:#1d1d1f;padding-top:4px;">${formattedTotal}</td>
          <td style="font-size:16px;font-weight:700;color:#1d1d1f;text-align:right;padding-top:4px;">📅 ${dueDate}</td>
        </tr>
      </table>
    </div>

    <!-- LINHA DIGITÁVEL (CÓDIGO DE BARRAS) -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
      <p style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">
        Linha Digitável (Código para copiar):
      </p>
      <div style="background:#ffffff;border:1px solid #d1d5db;border-radius:8px;padding:14px;font-family:monospace;font-size:15px;font-weight:700;color:#111827;letter-spacing:0.5px;word-break:break-all;text-align:center;">
        ${params.digitableLine || '23793.38029 60600.421923 57006.333306 7 15660000002000'}
      </div>
      <p style="font-size:12px;color:#6b7280;margin:10px 0 0 0;text-align:center;">
        Copie o número acima e cole na área de "Pagar Boleto" do seu banco.
      </p>
    </div>

    <!-- INSTRUÇÕES -->
    <div style="border-top:1px solid #e5e5ea;padding-top:24px;margin-bottom:28px;">
      <p style="font-size:14px;font-weight:700;color:#1d1d1f;margin:0 0 14px 0;">Instruções de pagamento:</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="28" valign="top" style="font-size:14px;font-weight:700;color:#0071e3;">•</td>
          <td style="font-size:13px;color:#4b5563;line-height:1.5;padding-bottom:8px;">
            Você pode pagar pelo <strong>Internet Banking</strong>, aplicativo do banco, ou imprimir para pagar em qualquer <strong>agência bancária ou casa lotérica</strong>.
          </td>
        </tr>
        <tr>
          <td width="28" valign="top" style="font-size:14px;font-weight:700;color:#0071e3;">•</td>
          <td style="font-size:13px;color:#4b5563;line-height:1.5;padding-bottom:8px;">
            A compensação bancária é realizada em <strong>1 a 2 dias úteis</strong> após a quitação.
          </td>
        </tr>
        <tr>
          <td width="28" valign="top" style="font-size:14px;font-weight:700;color:#0071e3;">•</td>
          <td style="font-size:13px;color:#4b5563;line-height:1.5;">
            Após a confirmação, seu pedido entrará em separação e despacho imediatamente.
          </td>
        </tr>
      </table>
    </div>

    <!-- BOTÕES DE AÇÃO -->
    <div style="text-align:center;">
      <a href="https://teknixbrasil.com.br/pedidos" style="display:inline-block;background-color:#0071e3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:600;">
        Ver detalhes do pedido
      </a>
    </div>
  `

  return sendBrevoDirect({
    toEmail: params.customerEmail,
    toName: params.customerName,
    subject: `📄 Boleto Bancário do seu pedido #${params.orderNumber} — TEKNIX`,
    htmlContent: wrapTeknixEmail(content, `Boleto bancário do pedido #${params.orderNumber} no valor de ${formattedTotal}`)
  })
}
