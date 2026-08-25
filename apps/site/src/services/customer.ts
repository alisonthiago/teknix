import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface Customer {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  cpf_cnpj?: string
  created_at: string
}

export interface Order {
  id: string
  customer_id: string
  user_id: string
  total: number
  subtotal: number
  discount: number
  shipping: number
  status: string
  payment_status: string
  payment_method: string
  origin: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_sku?: string
  quantity: number
  price: number
  subtotal: number
}

export interface Address {
  id: string
  user_id: string
  label: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
}

export async function getCustomerByUserId(userId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching customer:', error)
    return null
  }

  return data as Customer
}

export async function createCustomer(user: User, name: string) {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      user_id: user.id,
      name: name,
      email: user.email
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    return null
  }

  return data as Customer
}

export async function getOrdersByUserId(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data as Order[]
}

export async function getOrderById(orderId: string, userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return null
  }

  return data as Order
}

export async function getOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (error) {
    console.error('Error fetching order items:', error)
    return []
  }

  return data as OrderItem[]
}

export async function getAddressesByUserId(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })

  if (error) {
    console.error('Error fetching addresses:', error)
    return []
  }

  return data as Address[]
}

export async function createAddress(address: Omit<Address, 'id'>) {
  const { data, error } = await supabase
    .from('addresses')
    .insert(address)
    .select()
    .single()

  if (error) {
    console.error('Error creating address:', error)
    return null
  }

  return data as Address
}

export async function updateAddress(addressId: string, userId: string, updates: Partial<Address>) {
  const { error } = await supabase
    .from('addresses')
    .update(updates)
    .eq('id', addressId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating address:', error)
    return false
  }

  return true
}

export async function deleteAddress(addressId: string, userId: string) {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting address:', error)
    return false
  }

  return true
}
