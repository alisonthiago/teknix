'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const VALID_TRANSITIONS: Record<string, string[]> = {
  NOVO: ['PAGO', 'CANCELADO'],
  PAGO: ['AGUARDANDO_SEPARACAO', 'CANCELADO'],
  AGUARDANDO_SEPARACAO: ['EM_SEPARACAO', 'CANCELADO'],
  EM_SEPARACAO: ['SEPARADO', 'PROBLEMA'],
  SEPARADO: ['AGUARDANDO_EXPEDICAO'],
  AGUARDANDO_EXPEDICAO: ['EMBALADO'],
  EMBALADO: ['ENVIADO'],
  ENVIADO: ['ENTREGUE', 'PROBLEMA'],
  ENTREGUE: ['DEVOLVIDO'],
  PROBLEMA: ['EM_SEPARACAO', 'ENVIADO', 'CANCELADO'],
}

export async function getOrders(filters?: { status?: string; marketplace_id?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('orders')
    .select('*, marketplaces(name, code)')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.marketplace_id) query = query.eq('marketplace_id', filters.marketplace_id)

  const { data } = await query
  return data || []
}

export async function getOrder(id: string) {
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, marketplaces(name, code)')
    .eq('id', id)
    .single()

  if (!order) return null

  const { data: items } = await supabase
    .from('order_items')
    .select('*, products(name, sku, image_url)')
    .eq('order_id', id)

  const { data: history } = await supabase
    .from('order_status_history')
    .select('*, profiles(name)')
    .eq('order_id', id)
    .order('created_at', { ascending: false })

  return { ...order, items: items || [], history: history || [] }
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const orderNumber = formData.get('order_number') as string
  const marketplaceId = formData.get('marketplace_id') as string || null
  const customerName = formData.get('customer_name') as string || null
  const notes = formData.get('notes') as string || null

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      marketplace_id: marketplaceId,
      order_number: orderNumber,
      customer_name: customerName,
      status: 'NOVO',
      notes,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('order_status_history').insert({
    order_id: order.id,
    user_id: user.id,
    to_status: 'NOVO',
    notes: 'Pedido criado',
  })

  revalidatePath('/orders')
  redirect(`/orders/${order.id}`)
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Pedido não encontrado')

  const allowed = VALID_TRANSITIONS[order.status] || []
  if (!allowed.includes(newStatus)) {
    throw new Error(`Transição de ${order.status} para ${newStatus} não é permitida`)
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'ENVIADO') updateData.shipped_at = new Date().toISOString()
  if (newStatus === 'ENTREGUE') updateData.delivered_at = new Date().toISOString()

  await supabase.from('orders').update(updateData).eq('id', orderId)

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    user_id: user.id,
    from_status: order.status,
    to_status: newStatus,
  })

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('order_items').delete().eq('order_id', orderId)
  await supabase.from('order_status_history').delete().eq('order_id', orderId)
  await supabase.from('orders').delete().eq('id', orderId)

  revalidatePath('/orders')
  redirect('/orders')
}
