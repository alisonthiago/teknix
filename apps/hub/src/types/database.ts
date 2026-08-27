export interface ProductVariation {
  id: string
  sku: string
  ean?: string
  name: string
  price?: number
  stock?: number
  weight?: number
  width?: number
  height?: number
  length?: number
  image_url?: string
}

export interface ShippingRule {
  type: 'customer_pays' | 'free_shipping' | 'fixed_price' | 'custom_rule'
  fixed_price?: number
  rule_description?: string
}

export interface Product {
  id: string
  name: string
  sku?: string
  ncm?: string
  barcode?: string
  brand?: string
  slug?: string
  description?: string
  short_description?: string
  price: number
  promo_price?: number
  cost_price?: number
  stock?: number
  manage_stock?: boolean
  unlimited_stock?: boolean
  status?: 'active' | 'inactive' | 'draft'
  stock_min?: number
  stock_reserved?: number
  weight?: number
  width?: number
  height?: number
  length?: number
  category_id?: string
  subcategory?: string
  segment?: string
  image_url?: string
  images?: string[]
  featured?: boolean
  active?: boolean
  is_new?: boolean
  specifications?: any
  characteristics?: any
  variations?: ProductVariation[]
  shipping_rule?: ShippingRule
  mercadolivre_item_id?: string
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  name: string
  slug?: string
  description?: string
  image_url?: string
  active?: boolean
  created_at?: string
}

export interface Customer {
  id: string
  user_id?: string
  name: string
  document?: string // CPF/CNPJ
  email?: string
  phone?: string
  address?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
  created_at?: string
}

export interface OrderHistoryEvent {
  id: string
  status: string
  description: string
  created_at: string
}

export interface Order {
  id: string
  order_number: string // Ex: #TK-1045
  customer_id?: string
  user_id?: string
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  total_amount?: number
  status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_method?: string
  payment_status?: string
  shipping_method?: string
  tracking_code?: string
  origin?: string
  notes?: string
  nfe_key?: string
  nfe_pdf_url?: string
  nfe_xml_url?: string
  history?: OrderHistoryEvent[]
  customer?: Customer // Populated on join
  items?: OrderItem[] // Populated on join
  created_at?: string
  updated_at?: string
}


export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variation_id?: string
  product_name: string
  quantity: number
  price: number
  total: number
}

export interface User {
  id: string
  email?: string
  role?: string
  blocked?: boolean
  created_at?: string
}
