export interface Product {
  id: string
  name: string
  sku?: string
  slug?: string
  description?: string
  price: number
  promo_price?: number
  cost?: number
  stock?: number
  category_id?: string
  segment?: string
  image_url?: string
  images?: string[]
  featured?: boolean
  active?: boolean
  specifications?: Record<string, unknown>
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
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  created_at?: string
}

export interface Order {
  id: string
  customer_id?: string
  user_id?: string
  total: number
  status?: string
  payment_status?: string
  payment_method?: string
  origin?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
}

export interface User {
  id: string
  email?: string
  role?: string
  blocked?: boolean
  created_at?: string
}
