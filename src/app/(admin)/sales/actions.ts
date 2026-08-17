'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSale(formData: FormData) {
  const supabase = await createClient()

  const marketplace_id = formData.get('marketplace_id') as string
  const date = formData.get('date') as string
  const order_id = formData.get('order_id') as string
  
  // Single item for prototype simplicity
  const product_id = formData.get('product_id') as string
  const quantity = parseInt(formData.get('quantity') as string) || 0
  const unit_price = parseFloat(formData.get('unit_price') as string) || 0
  
  // Deductions
  const fees = parseFloat(formData.get('fees') as string) || 0
  const taxes = parseFloat(formData.get('taxes') as string) || 0
  const freight = parseFloat(formData.get('freight') as string) || 0
  const other_costs = parseFloat(formData.get('other_costs') as string) || 0

  const total_revenue = unit_price * quantity

  // 1. Get real cost of the product for COGS
  const { data: product } = await supabase.from('products').select('*').eq('id', product_id).single()
  const realCostPerUnit = (Number(product?.cost_purchase) || 0) + (Number(product?.freight_purchase) || 0) + (Number(product?.packaging_cost) || 0) + (Number(product?.other_costs) || 0)
  const cogs = realCostPerUnit * quantity

  const profit = total_revenue - cogs - fees - taxes - freight - other_costs
  const margin = total_revenue > 0 ? (profit / total_revenue) * 100 : 0

  // 2. Create Sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert([{
      marketplace_id,
      date,
      order_id,
      total_revenue,
      status: 'COMPLETED'
    }])
    .select()
    .single()

  if (saleError) throw new Error(saleError.message)

  // 3. Create Sale Item
  const { error: itemError } = await supabase
    .from('sale_items')
    .insert([{
      sale_id: sale.id,
      product_id,
      sku: product?.sku || 'UNKNOWN',
      quantity,
      unit_price,
      total_revenue,
      fees,
      taxes,
      freight,
      other_costs,
      cogs,
      profit,
      margin
    }])

  if (itemError) throw new Error(itemError.message)

  // 4. Update Stock
  const newStock = (product?.stock || 0) - quantity
  const { error: stockError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', product_id)

  if (stockError) throw new Error(stockError.message)

  // 5. Create Stock Movement
  await supabase
    .from('stock_movements')
    .insert([{
      product_id,
      type: 'SALE',
      quantity: -quantity, // negative for sale out
      reference_id: sale.id,
      notes: `Venda Pedido: ${order_id}`
    }])

  revalidatePath('/sales')
  revalidatePath('/products')
  revalidatePath('/dashboard')
  redirect('/sales')
}
