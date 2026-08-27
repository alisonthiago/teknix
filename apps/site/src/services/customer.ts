import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface Customer {
  id: string
  user_id?: string
  name: string
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  document?: string // CPF / CNPJ
  cpf_cnpj?: string
  birth_date?: string
  address?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_sku?: string
  product_image?: string
  quantity: number
  price: number
  subtotal?: number
  is_digital?: boolean
  download_url?: string
}

export interface Order {
  id: string
  order_number?: string
  customer_id?: string
  user_id?: string
  total: number
  subtotal?: number
  discount?: number
  shipping_cost?: number
  shipping?: number
  shipping_method?: string
  tracking_code?: string
  status?: string // 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status?: string // 'pending' | 'approved' | 'rejected' | 'refunded'
  payment_method?: string
  qr_code?: string
  qr_code_base64?: string
  checkout_url?: string
  delivery_estimate?: string
  delivery_address?: string
  customer_name?: string
  customer_email?: string
  shipping_address?: any
  origin?: string
  notes?: string
  created_at?: string
  updated_at?: string
  items?: OrderItem[]
}

export interface Address {
  id: string
  user_id: string
  label: string
  recipient_name?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
  created_at?: string
}

export async function getCustomerByUserId(userId: string, userEmail?: string): Promise<Customer | null> {
  // 1. Tentar por user_id
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) return data as Customer

  // 2. Tentar por email
  if (userEmail) {
    const { data: byEmail } = await supabase
      .from('customers')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle()

    if (byEmail) {
      // Vincular user_id se ainda não estiver vinculado
      if (!byEmail.user_id) {
        await supabase.from('customers').update({ user_id: userId }).eq('id', byEmail.id)
      }
      return byEmail as Customer
    }
  }

  return null
}

export async function createOrUpdateCustomer(user: User, customerData: Partial<Customer>): Promise<Customer | null> {
  const existing = await getCustomerByUserId(user.id, user.email)
  
  if (existing) {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...customerData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar cliente:', error)
      return null
    }
    return data as Customer
  } else {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: user.id,
        name: customerData.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente',
        email: user.email,
        phone: customerData.phone || '',
        document: customerData.document || customerData.cpf_cnpj || '',
        ...customerData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar cliente:', error)
      return null
    }
    return data as Customer
  }
}

export async function getOrdersByUserId(userId: string, userEmail?: string): Promise<Order[]> {
  try {
    // 1. Buscar customer_id associado
    let customerId: string | null = null
    const { data: cust } = await supabase
      .from('customers')
      .select('id')
      .or(`user_id.eq.${userId}${userEmail ? `,email.eq.${userEmail}` : ''}`)
      .maybeSingle()

    if (cust) customerId = cust.id

    // 2. Query de pedidos por user_id ou customer_id
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (customerId) {
      query = query.or(`user_id.eq.${userId},customer_id.eq.${customerId}`)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data: orders, error } = await query

    if (error || !orders) {
      return []
    }

    // 3. Buscar os itens de cada pedido
    const orderIds = orders.map(o => o.id)
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('*, products(name, image_url, images, sku)')
        .in('order_id', orderIds)

      const itemsByOrder: Record<string, OrderItem[]> = {}
      if (items) {
        items.forEach((item: any) => {
          if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
          const prod = item.products
          itemsByOrder[item.order_id].push({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            product_name: item.product_name || prod?.name || 'Produto TEKNIX',
            product_sku: item.product_sku || prod?.sku,
            product_image: item.product_image || prod?.image_url || (Array.isArray(prod?.images) ? prod?.images[0] : ''),
            quantity: item.quantity || 1,
            price: Number(item.price || 0),
            subtotal: Number(item.total || item.price * item.quantity || 0),
            is_digital: item.is_digital || false,
            download_url: item.download_url
          })
        })
      }

      return orders.map(o => ({
        ...o,
        items: itemsByOrder[o.id] || []
      }))
    }

    return orders as Order[]
  } catch (e) {
    console.error('Erro ao buscar pedidos:', e)
    return []
  }
}

export async function getAddressesByUserId(userId: string): Promise<Address[]> {
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

export async function createAddress(address: Omit<Address, 'id'>): Promise<Address | null> {
  // Se for padrão, remove padrão dos outros
  if (address.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', address.user_id)
  }

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

export async function updateAddress(addressId: string, userId: string, updates: Partial<Address>): Promise<boolean> {
  if (updates.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
  }

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

export async function setDefaultAddress(addressId: string, userId: string): Promise<boolean> {
  await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
  const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', addressId).eq('user_id', userId)
  return !error
}

export async function deleteAddress(addressId: string, userId: string): Promise<boolean> {
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
