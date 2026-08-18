'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPurchase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const supplier_id = formData.get('supplier_id') as string
  const date = formData.get('date') as string
  const invoice = formData.get('invoice') as string
  const payment_method = formData.get('payment_method') as string
  const notes = formData.get('notes') as string
  const product_id = formData.get('product_id') as string
  const quantity = parseInt(formData.get('quantity') as string) || 0
  const unit_cost = parseFloat(formData.get('unit_cost') as string) || 0
  const freight = parseFloat(formData.get('freight') as string) || 0
  const other_costs = parseFloat(formData.get('other_costs') as string) || 0

  const total_cost = (unit_cost * quantity) + freight + other_costs
  const real_unit_cost = quantity > 0 ? (total_cost / quantity) : unit_cost

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

  const { data: product } = await supabase.from('products').select('sku, stock, name').eq('id', product_id).single()

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
      total_cost,
      real_unit_cost,
      user_id: user?.id || null
    }])

  if (itemError) throw new Error(itemError.message)

  const newStock = (product?.stock || 0) + quantity
  const { error: productUpdateError } = await supabase
    .from('products')
    .update({
      stock: newStock,
      cost_purchase: unit_cost,
      freight_purchase: freight / quantity
    })
    .eq('id', product_id)

  if (productUpdateError) throw new Error(productUpdateError.message)

  await supabase.from('inventory_movements').insert([{
    product_id,
    type: 'PURCHASE',
    quantity: quantity,
    reference_id: purchase.id,
    notes: `Compra via NFe: ${invoice}`,
    user_id: user?.id || null
  }])

  revalidatePath('/purchases')
  revalidatePath('/products')
  revalidatePath('/dashboard')
  redirect('/purchases')
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

  revalidatePath('/purchases')
  revalidatePath('/products')
  revalidatePath('/dashboard')
}
