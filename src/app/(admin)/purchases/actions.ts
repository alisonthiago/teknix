'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPurchase(formData: FormData) {
  const supabase = await createClient()

  const supplier_id = formData.get('supplier_id') as string
  const date = formData.get('date') as string
  const invoice = formData.get('invoice') as string
  const payment_method = formData.get('payment_method') as string
  const notes = formData.get('notes') as string
  
  // For simplicity in this iteration, we assume 1 item per purchase form submission
  // In a real app, this would be a dynamic list of items.
  const product_id = formData.get('product_id') as string
  const quantity = parseInt(formData.get('quantity') as string) || 0
  const unit_cost = parseFloat(formData.get('unit_cost') as string) || 0
  const freight = parseFloat(formData.get('freight') as string) || 0
  const other_costs = parseFloat(formData.get('other_costs') as string) || 0
  
  const total_cost = (unit_cost * quantity) + freight + other_costs
  const real_unit_cost = quantity > 0 ? (total_cost / quantity) : unit_cost

  // 1. Create Purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert([{
      supplier_id,
      date,
      invoice,
      total_cost,
      payment_method,
      notes
    }])
    .select()
    .single()

  if (purchaseError) throw new Error(purchaseError.message)

  // Get product sku
  const { data: product } = await supabase.from('products').select('sku, stock').eq('id', product_id).single()

  // 2. Create Purchase Item
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
      real_unit_cost
    }])

  if (itemError) throw new Error(itemError.message)

  // 3. Update Stock and Cost
  const newStock = (product?.stock || 0) + quantity
  const { error: productUpdateError } = await supabase
    .from('products')
    .update({ 
      stock: newStock,
      cost_purchase: unit_cost,
      freight_purchase: freight / quantity // rough distribution
    })
    .eq('id', product_id)

  if (productUpdateError) throw new Error(productUpdateError.message)

  // 4. Create Stock Movement
  await supabase
    .from('stock_movements')
    .insert([{
      product_id,
      type: 'PURCHASE',
      quantity: quantity,
      reference_id: purchase.id,
      notes: `Compra via NFe: ${invoice}`
    }])

  revalidatePath('/purchases')
  revalidatePath('/products')
  redirect('/purchases')
}
