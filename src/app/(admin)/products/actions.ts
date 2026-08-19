'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/activity-logger'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const data = {
    sku: formData.get('sku') as string,
    name: formData.get('name') as string,
    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    ean: formData.get('ean') as string,
    category: formData.get('category') as string,
    supplier_id: formData.get('supplier_id') as string || null,
    cost_purchase: parseFloat(formData.get('cost_purchase') as string) || 0,
    freight_purchase: parseFloat(formData.get('freight_purchase') as string) || 0,
    packaging_cost: parseFloat(formData.get('packaging_cost') as string) || 0,
    other_costs: parseFloat(formData.get('other_costs') as string) || 0,
    weight: parseFloat(formData.get('weight') as string) || 0,
    width: parseFloat(formData.get('width') as string) || 0,
    height: parseFloat(formData.get('height') as string) || 0,
    length: parseFloat(formData.get('length') as string) || 0,
    min_stock: parseInt(formData.get('min_stock') as string) || 0,
    status: 'ACTIVE',
    notes: formData.get('notes') as string,
    user_id: user?.id || null,
  }

  const { data: insertedProduct, error } = await supabase.from('products').insert([data]).select('id').single()
  if (error) throw new Error(error.message)

  await logActivity({
    title: 'Novo Produto Adicionado',
    message: `Um novo produto "${data.name}" (SKU: ${data.sku}) foi cadastrado.`,
    type: 'success',
    module: 'products',
    entity_id: insertedProduct.id,
    entity_type: 'product'
  })

  revalidatePath('/products')
  redirect('/products')
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    sku: formData.get('sku') as string,
    name: formData.get('name') as string,
    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    ean: formData.get('ean') as string,
    category: formData.get('category') as string,
    supplier_id: formData.get('supplier_id') as string || null,
    cost_purchase: parseFloat(formData.get('cost_purchase') as string) || 0,
    freight_purchase: parseFloat(formData.get('freight_purchase') as string) || 0,
    packaging_cost: parseFloat(formData.get('packaging_cost') as string) || 0,
    other_costs: parseFloat(formData.get('other_costs') as string) || 0,
    weight: parseFloat(formData.get('weight') as string) || 0,
    width: parseFloat(formData.get('width') as string) || 0,
    height: parseFloat(formData.get('height') as string) || 0,
    length: parseFloat(formData.get('length') as string) || 0,
    min_stock: parseInt(formData.get('min_stock') as string) || 0,
    status: formData.get('status') as string || 'ACTIVE',
    notes: formData.get('notes') as string,
  }

  const { error } = await supabase.from('products').update(data).eq('id', id)
  if (error) throw new Error(error.message)

  await logActivity({
    title: 'Produto Atualizado',
    message: `O produto "${data.name}" (SKU: ${data.sku}) foi modificado.`,
    type: 'info',
    module: 'products',
    entity_id: id,
    entity_type: 'product'
  })

  revalidatePath('/products')
  revalidatePath('/operacao')
  revalidatePath(`/produtos/${id}`)
  redirect(`/produtos/${id}`)
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('name, sku').eq('id', id).single()

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)

  if (product) {
    await logActivity({
      title: 'Produto Excluído',
      message: `O produto "${product.name}" (SKU: ${product.sku}) foi excluído do sistema.`,
      type: 'error',
      module: 'products',
      entity_id: id,
      entity_type: 'product'
    })
  }

  revalidatePath('/products')
}
