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
  cpf_cnpj?: string
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
  subtotal?: number
  discount?: number
  shipping_cost?: number
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
  product_name?: string
  product_sku?: string
  quantity: number
  price: number
  subtotal?: number
}

export interface User {
  id: string
  email?: string
  role?: string
  blocked?: boolean
  created_at?: string
}

export interface Address {
  id: string
  user_id: string
  label?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_default?: boolean
}

export interface Segment {
  id: string
  name: string
  slug?: string
  description?: string
  theme?: Record<string, unknown>
  active?: boolean
  created_at?: string
}
