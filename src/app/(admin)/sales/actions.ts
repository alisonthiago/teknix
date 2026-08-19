'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/activity-logger'

export async function createSale(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const marketplace_id = formData.get('marketplace_id') as string
  const date = formData.get('date') as string
  const order_id = formData.get('order_id') as string
  const product_id = formData.get('product_id') as string
  const quantity = parseInt(formData.get('quantity') as string) || 0
  const unit_price = parseFloat(formData.get('unit_price') as string) || 0
  const fees = parseFloat(formData.get('fees') as string) || 0
  const taxes = parseFloat(formData.get('taxes') as string) || 0
  const freight = parseFloat(formData.get('freight') as string) || 0
  const other_costs = parseFloat(formData.get('other_costs') as string) || 0

  const total_revenue = unit_price * quantity

  const { data: product } = await supabase.from('products').select('*').eq('id', product_id).single()
  if (!product) throw new Error('Produto não encontrado')

  // Stock validation
  if (product.stock < quantity) {
    throw new Error(`Estoque insuficiente. Disponível: ${product.stock}`)
  }

  const realCostPerUnit = (Number(product.cost_purchase) || 0) + (Number(product.freight_purchase) || 0) + (Number(product.packaging_cost) || 0) + (Number(product.other_costs) || 0)
  const cogs = realCostPerUnit * quantity
  const profit = total_revenue - cogs - fees - taxes - freight - other_costs
  const margin = total_revenue > 0 ? (profit / total_revenue) * 100 : 0

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert([{
      marketplace_id,
      date,
      order_id,
      total_revenue,
      status: 'COMPLETED',
      user_id: user?.id || null
    }])
    .select()
    .single()

  if (saleError) throw new Error(saleError.message)

  const { error: itemError } = await supabase
    .from('sale_items')
    .insert([{
      sale_id: sale.id,
      product_id,
      sku: product.sku,
      quantity,
      unit_price,
      total_revenue,
      fees,
      taxes,
      freight,
      other_costs,
      cogs,
      profit,
      margin,
      user_id: user?.id || null
    }])

  if (itemError) throw new Error(itemError.message)

  const newStock = product.stock - quantity
  const { error: stockError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', product_id)

  if (stockError) throw new Error(stockError.message)

  await supabase.from('inventory_movements').insert([{
    product_id,
    type: 'SALE',
    quantity: -quantity,
    reference_id: sale.id,
    notes: `Venda Pedido: ${order_id}`,
    user_id: user?.id || null
  }])

  // Auto-create notification
  await supabase.from('notifications').insert([{
    user_id: user?.id,
    type: 'NEW_SALE',
    title: 'Nova Venda',
    message: `Venda #${order_id || sale.id.slice(0,6)} - ${quantity}x ${product.name} - R$ ${total_revenue.toFixed(2)}`,
    marketplace_id: marketplace_id || null,
    resource: 'sale',
    resource_id: sale.id
  }])

  // Low stock notification
  if (newStock <= product.min_stock && newStock > 0) {
    await supabase.from('notifications').insert([{
      user_id: user?.id,
      type: 'LOW_STOCK',
      title: 'Estoque Baixo',
      message: `${product.name} com apenas ${newStock} unidades em estoque`,
      resource: 'product',
      resource_id: product.id
    }])
  }

  await logActivity({
    title: 'Nova Venda Registrada',
    message: `Venda do pedido #${order_id || sale.id.split('-')[0]} no valor de R$ ${total_revenue.toFixed(2)} cadastrada.`,
    type: 'success',
    module: 'sales',
    entity_id: sale.id,
    entity_type: 'sale'
  })

  revalidatePath('/sales')
  revalidatePath('/products')
  revalidatePath('/dashboard')
  redirect('/sales')
}

export async function deleteSale(id: string) {
  const supabase = await createClient()

  // Get sale items to restore stock
  const { data: items } = await supabase.from('sale_items').select('product_id, quantity').eq('sale_id', id)

  if (items) {
    for (const item of items) {
      const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
      if (product) {
        await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id)
      }
    }
  }

  await supabase.from('sale_items').delete().eq('sale_id', id)
  const { error } = await supabase.from('sales').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await logActivity({
    title: 'Venda Excluída',
    message: `A venda #${id.split('-')[0]} foi excluída e o estoque do produto devolvido.`,
    type: 'error',
    module: 'sales',
    entity_id: id,
    entity_type: 'sale'
  })

  revalidatePath('/sales')
  revalidatePath('/products')
  revalidatePath('/dashboard')
}
