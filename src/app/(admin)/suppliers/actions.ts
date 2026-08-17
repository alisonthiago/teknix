'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSupplier(formData: FormData) {
  const supabase = await createClient()

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
  }

  const { error } = await supabase.from('suppliers').insert([data])

  if (error) {
    console.error('Error creating supplier:', error)
    throw new Error(error.message)
  }

  revalidatePath('/suppliers')
  redirect('/suppliers')
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  
  if (error) {
    console.error('Error deleting supplier:', error)
    return { error: error.message }
  }

  revalidatePath('/suppliers')
}
