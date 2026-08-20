export type MarketplaceChannel = 
  | 'MERCADO_LIVRE' 
  | 'SHOPEE' 
  | 'AMAZON' 
  | 'MAGALU' 
  | 'SHOPIFY' 
  | 'TIKTOK_SHOP'

export interface ChannelProduct {
  externalId: string
  sku: string
  title: string
  description?: string
  price: number
  stock: number
  pictures: string[]
  brand?: string
  model?: string
  category?: string
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE'
}

export interface ChannelOrder {
  externalOrderId: string
  channel: MarketplaceChannel
  orderNumber: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  totalAmount: number
  status: 'NOVO' | 'PAGO' | 'EM_SEPARACAO' | 'SEPARADO' | 'EMBALADO' | 'ENVIADO' | 'ENTREGUE' | 'CANCELADO'
  paymentMethod: string
  shipping: {
    address: string
    city: string
    state: string
    zip: string
    carrier?: string
    trackingCode?: string
    method: string
    cost: number
    labelAvailable: boolean
  }
  items: Array<{
    sku: string
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    imageUrl?: string
  }>
  createdAt: string
}
