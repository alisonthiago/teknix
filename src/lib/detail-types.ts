// Detail page interfaces (shared between components and server queries)

export interface ProductDetail {
  id: string
  sku: string
  name: string
  brand: string
  model: string
  ean: string
  category: string
  description: string
  image: string
  images?: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'PAUSED'
  created_at: string
  updated_at: string
  supplier: {
    id: string; name: string; cnpj: string; contact: string; phone: string; whatsapp: string; email: string; delivery_time: number; min_order: number; last_purchase: string; cost: number
  }
  costs: { purchase: number; freight: number; packaging: number; other: number; real: number }
  pricing: { current_price: number; suggested_price: number; minimum_price: number; profit: number; margin: number }
  stock: { physical: number; reserved: number; available: number; minimum: number; maximum: number; location: string; value: number }
  summary: { total_sales: number; total_orders: number; total_revenue: number; total_profit: number; avg_margin: number; avg_ticket: number }
  marketplaces: Array<{ name: string; account_name?: string; listing_id: string; price: number; stock: number; status: 'ACTIVE' | 'INACTIVE'; last_sync: string }>
  recent_sales: Array<{ id: string; order_id: string; order_uuid?: string; customer_name?: string; marketplace: string; account_name?: string; quantity: number; price: number; revenue: number; profit: number; margin: number; status: string; date: string }>
  stock_movements: Array<{ id: string; date: string; type: 'COMPRA' | 'VENDA' | 'CANCELAMENTO' | 'DEVOLUCAO' | 'AJUSTE' | 'PERDA' | 'TRANSFERENCIA'; quantity: number; balance: number; order_ref: string; user: string }>
  purchases_history: Array<{ id: string; purchase_id?: string; order_ref: string; supplier: string; quantity: number; unit_cost: number; total: number; date: string; status: string }>
  history: Array<{ id: string; date: string; time: string; action: string; user: string; details: string }>
  sales_chart: Array<{ period: string; units: number; revenue: number }>
}

export interface OrderDetail {
  id: string
  order_number: string
  marketplace: string
  customer: { name: string; email: string; phone: string; cpf: string }
  date: string
  status: string
  items: Array<{ product_id?: string | null; sku: string; name: string; quantity: number; price: number; total: number; image?: string | null }>
  payment: { method: string; installments: number; total: number; fee: number; net: number }
  shipping: { address: string; city: string; state: string; zip: string; method: string; cost: number; tracking: string }
  timeline: Array<{ date: string; time: string; status: string; description: string }>
}

export interface SaleDetail {
  id: string
  order_id: string
  marketplace: string
  customer: { name: string; email: string; phone: string }
  product: { id: string; sku: string; name: string; brand: string }
  quantity: number
  price: number
  revenue: number
  cost: number
  fees: number
  freight: number
  taxes: number
  profit: number
  margin: number
  date: string
  status: string
  payment: { method: string; installments: number }
  shipping: { method: string; tracking: string; status: string }
  timeline: Array<{ date: string; time: string; action: string; details: string }>
}

export interface SupplierDetail {
  id: string
  name: string
  logo_url: string | null
  cnpj: string
  contact: string
  phone: string
  whatsapp: string
  email: string
  city: string
  state: string
  address: string
  delivery_time: number
  min_order: number
  payment_terms: string
  bank: string
  agency: string
  account: string
  pix_key: string | null
  distributor_state: string | null
  distributor_city: string | null
  pickup_address: string | null
  notes: string
  status: string
  created_at: string
  contacts: Array<{ id: string; name: string | null; phone: string; is_whatsapp: boolean }>
  products: Array<{ id: string; sku: string; name: string; cost: number; stock: number }>
  purchases: Array<{ id: string; date: string; invoice: string; items: number; total: number; status: string }>
  stats: { total_purchased: number; total_orders: number; avg_ticket: number; products_count: number }
  timeline: Array<{ date: string; time: string; action: string; details: string }>
}
