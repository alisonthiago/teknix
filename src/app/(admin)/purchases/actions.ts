'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity-logger'

interface PurchaseItemPayload {
  product_id: string
  quantity: number
  unit_cost: number
  freight: number
  other_costs: number
}

interface CreatePurchasePayload {
  supplier_id: string
  date: string
  invoice: string
  payment_method: string
  notes: string
  items: PurchaseItemPayload[]
}

export async function createPurchase(payload: CreatePurchasePayload): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { supplier_id, date, invoice, payment_method, notes, items } = payload

  // Calcula total geral de todos os itens
  const total_cost = items.reduce((acc, i) => {
    return acc + (i.unit_cost * i.quantity) + i.freight + i.other_costs
  }, 0)

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert([{
      supplier_id,
      date,
      invoice,
      total_cost,
      payment_method,
      notes,
      user_id: user?.id || null
    }])
    .select()
    .single()

  if (purchaseError) throw new Error(purchaseError.message)

  // Processa cada item da compra
  for (const item of items) {
    const { product_id, quantity, unit_cost, freight, other_costs } = item
    const item_total = (unit_cost * quantity) + freight + other_costs
    const real_unit_cost = quantity > 0 ? (item_total / quantity) : unit_cost

    const { data: product } = await supabase
      .from('products')
      .select('sku, stock, name')
      .eq('id', product_id)
      .single()

    const { error: itemError } = await supabase
      .from('purchase_items')
      .insert([{
        purchase_id: purchase.id,
        product_id,
        sku: product?.sku || 'UNKNOWN',
        quantity,
        unit_cost,
        freight,
        other_costs,
        total_cost: item_total,
        real_unit_cost,
        user_id: user?.id || null
      }])

    if (itemError) throw new Error(itemError.message)

    const newStock = (product?.stock || 0) + quantity
    await supabase
      .from('products')
      .update({
        stock: newStock,
        cost_purchase: unit_cost,
        freight_purchase: quantity > 0 ? freight / quantity : 0
      })
      .eq('id', product_id)

    await supabase.from('inventory_movements').insert([{
      product_id,
      type: 'PURCHASE',
      quantity,
      reference_id: purchase.id,
      notes: `Compra via NFe: ${invoice}`,
      user_id: user?.id || null
    }])
  }

  await logActivity({
    title: 'Nova Compra Adicionada',
    message: `Compra via NFe ${invoice || 'Sem Nota'} no valor de R$ ${total_cost.toFixed(2)} adicionada ao estoque.`,
    type: 'success',
    module: 'purchases',
    entity_id: purchase.id,
    entity_type: 'purchase'
  })

  revalidatePath('/purchases')
  revalidatePath('/products')
  revalidatePath('/dashboard')

  return purchase.id
}


export async function deletePurchase(id: string) {
  const supabase = await createClient()

  // Get purchase items to reverse stock
  const { data: items } = await supabase.from('purchase_items').select('product_id, quantity').eq('purchase_id', id)

  if (items) {
    for (const item of items) {
      const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
      if (product) {
        await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', item.product_id)
      }
    }
  }

  await supabase.from('purchase_items').delete().eq('purchase_id', id)
  const { error } = await supabase.from('purchases').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await logActivity({
    title: 'Compra Cancelada/Excluída',
    message: `A compra #${id.split('-')[0]} foi excluída e o estoque dos produtos foi revertido.`,
    type: 'error',
    module: 'purchases',
    entity_id: id,
    entity_type: 'purchase'
  })

  revalidatePath('/purchases')
  revalidatePath('/products')
  revalidatePath('/dashboard')
}
