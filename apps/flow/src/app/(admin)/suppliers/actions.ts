'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/activity-logger'

export async function createSupplier(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const data = {
    name: formData.get('name') as string,
    legal_name: formData.get('legal_name') as string,
    cnpj: formData.get('cnpj') as string,
    contact: formData.get('contact') as string,
    phone: formData.get('phone') as string,
    whatsapp: formData.get('whatsapp') as string,
    email: formData.get('email') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    delivery_time: parseInt(formData.get('delivery_time') as string) || 0,
    min_order: parseFloat(formData.get('min_order') as string) || 0,
    freight: parseFloat(formData.get('freight') as string) || 0,
    payment_terms: formData.get('payment_terms') as string,
    notes: formData.get('notes') as string,
    user_id: user?.id || null,
  }

  const { data: insertedSupplier, error } = await supabase.from('suppliers').insert([data]).select('id').single()
  if (error) throw new Error(error.message)

  await logActivity({
    title: 'Novo Fornecedor Adicionado',
    message: `A distribuidora/fornecedor "${data.name}" foi cadastrada no sistema.`,
    type: 'success',
    module: 'suppliers',
    entity_id: insertedSupplier.id,
    entity_type: 'supplier'
  })

  revalidatePath('/operacao')
  redirect('/operacao')
}

export async function updateSupplier(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    legal_name: formData.get('legal_name') as string,
    cnpj: formData.get('cnpj') as string,
    email: formData.get('email') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    distributor_city: formData.get('distributor_city') as string,
    distributor_state: formData.get('distributor_state') as string,
    pickup_address: formData.get('pickup_address') as string,
    delivery_time: parseInt(formData.get('delivery_time') as string) || 0,
    min_order: parseFloat(formData.get('min_order') as string) || 0,
    freight: parseFloat(formData.get('freight') as string) || 0,
    payment_terms: formData.get('payment_terms') as string,
    pix_key: formData.get('pix_key') as string,
    notes: formData.get('notes') as string,
  }

  const { error } = await supabase.from('suppliers').update(data).eq('id', id)
  if (error) throw new Error(error.message)

  await logActivity({
    title: 'Fornecedor Atualizado',
    message: `Os dados do fornecedor "${data.name}" foram atualizados.`,
    type: 'info',
    module: 'suppliers',
    entity_id: id,
    entity_type: 'supplier'
  })

  revalidatePath('/operacao')
  revalidatePath(`/fornecedores/${id}`)
  revalidatePath(`/fornecedores/${id}/editar`)
  redirect(`/fornecedores/${id}`)
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { data: supplier } = await supabase.from('suppliers').select('name').eq('id', id).single()

  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw new Error(error.message)

  if (supplier) {
    await logActivity({
      title: 'Fornecedor Excluído',
      message: `O fornecedor "${supplier.name}" foi removido do sistema.`,
      type: 'error',
      module: 'suppliers',
      entity_id: id,
      entity_type: 'supplier'
    })
  }

  revalidatePath('/operacao')
  revalidatePath(`/fornecedores/${id}`)
}
