import { supabase } from '../lib/supabase'

type CouponRow = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  starts_at: string | null
  ends_at: string | null
  usage_limit: number | null
  used_count: number
}

export type AppliedCoupon = { id: string; code: string; discount: number }

export async function validateCoupon(code: string, subtotal: number): Promise<{ coupon?: AppliedCoupon; error?: string }> {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, '')
  if (!normalized) return { error: 'Digite o código do cupom.' }
  const { data, error } = await supabase.from('coupons').select('id, code, discount_type, discount_value, min_order_amount, starts_at, ends_at, usage_limit, used_count').eq('code', normalized).eq('active', true).maybeSingle()
  if (error || !data) return { error: 'Cupom inválido ou indisponível.' }
  const coupon = data as CouponRow
  const now = Date.now()
  if ((coupon.starts_at && new Date(coupon.starts_at).getTime() > now) || (coupon.ends_at && new Date(coupon.ends_at).getTime() < now)) return { error: 'Este cupom não está vigente.' }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) return { error: 'Este cupom atingiu o limite de usos.' }
  if (subtotal < Number(coupon.min_order_amount || 0)) return { error: `Este cupom exige compra mínima de R$ ${Number(coupon.min_order_amount).toFixed(2).replace('.', ',')}.` }
  const discount = coupon.discount_type === 'percentage' ? subtotal * (Number(coupon.discount_value) / 100) : Number(coupon.discount_value)
  return { coupon: { id: coupon.id, code: coupon.code, discount: Math.min(subtotal, Number(discount.toFixed(2))) } }
}

export async function registerCouponUse(couponId?: string) {
  if (!couponId) return
  const { data } = await supabase.from('coupons').select('used_count').eq('id', couponId).maybeSingle()
  if (data) await supabase.from('coupons').update({ used_count: Number(data.used_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', couponId)
}
