'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createMarketplace(formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    code: formData.get('code') as string,
    default_percentage_fee: parseFloat(formData.get('default_percentage_fee') as string) || 0,
    default_fixed_fee: parseFloat(formData.get('default_fixed_fee') as string) || 0,
    default_tax: parseFloat(formData.get('default_tax') as string) || 0,
    default_freight: parseFloat(formData.get('default_freight') as string) || 0,
    default_ads_fee: parseFloat(formData.get('default_ads_fee') as string) || 0,
    other_fees: parseFloat(formData.get('other_fees') as string) || 0,
    status: 'ACTIVE',
  }

  const { error } = await supabase.from('marketplaces').insert([data])
  if (error) throw new Error(error.message)

  revalidatePath('/marketplaces')
  redirect('/marketplaces')
}

export async function updateMarketplace(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    code: formData.get('code') as string,
    default_percentage_fee: parseFloat(formData.get('default_percentage_fee') as string) || 0,
    default_fixed_fee: parseFloat(formData.get('default_fixed_fee') as string) || 0,
    default_tax: parseFloat(formData.get('default_tax') as string) || 0,
    default_freight: parseFloat(formData.get('default_freight') as string) || 0,
    default_ads_fee: parseFloat(formData.get('default_ads_fee') as string) || 0,
    other_fees: parseFloat(formData.get('other_fees') as string) || 0,
    status: formData.get('status') as string || 'ACTIVE',
  }

  const { error } = await supabase.from('marketplaces').update(data).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/marketplaces')
  redirect('/marketplaces')
}

export async function deleteMarketplace(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('marketplaces').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/marketplaces')
}
