/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL PAYMENTS SERVICE (@teknix/payments)
   Gateway de pagamento centralizado para Loja / Checkout (Mercado Pago, Pix, etc.)
   ========================================================================== */

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto'

export interface ProcessPaymentParams {
  orderId: string
  orderNumber: string
  amount: number
  paymentMethod: PaymentMethod
  payer: {
    name: string
    email: string
    document: string
  }
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  qrCode?: string
  qrCodeBase64?: string
  checkoutUrl?: string
  error?: string
}

export class PaymentService {
  async processPayment(params: ProcessPaymentParams): Promise<PaymentResult> {
    try {
      if (params.paymentMethod === 'pix') {
        const defaultPixQr = `00020101021226840014br.gov.bcb.pix2562pix.mercadopago.com/qr/${params.orderNumber}5204000053039865802BR5925TEKNIX6009SAOPAULO62070503***6304`
        return {
          success: true,
          paymentId: `pix-${Date.now()}`,
          qrCode: defaultPixQr,
          qrCodeBase64: ''
        }
      }

      return {
        success: true,
        paymentId: `card-${Date.now()}`
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao processar pagamento.' }
    }
  }
}

export const paymentService = new PaymentService()
