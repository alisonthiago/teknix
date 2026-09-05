/** Contrato HUB → SITE. Configuração editorial separada dos dados do marketplace. */
export interface ProductCommerce {
  offerEnabled: boolean
  offerEndsAt: string | null
  badge: 'none' | 'daily' | 'special' | 'bestseller'
  showLastUnit: boolean
  installments: number
  pixDiscountPercent: number
  freeShipping: boolean
  condition?: string
  soldCount?: number | string
}
export const DEFAULT_COMMERCE: ProductCommerce = {
  offerEnabled: false, offerEndsAt: null, badge: 'none', showLastUnit: false,
  installments: 1, pixDiscountPercent: 0, freeShipping: false,
  condition: 'Novo', soldCount: '+10 mil vendidos'
}
export function normalizeCommerce(value: unknown): ProductCommerce {
  const p = value && typeof value === 'object' ? value as Partial<ProductCommerce> : {}
  return {
    offerEnabled: p.offerEnabled === true,
    offerEndsAt: typeof p.offerEndsAt === 'string' && Number.isFinite(Date.parse(p.offerEndsAt)) ? p.offerEndsAt : null,
    badge: ['daily','special','bestseller'].includes(p.badge || '') ? p.badge! : 'none',
    showLastUnit: p.showLastUnit === true,
    installments: Number.isInteger(p.installments) && p.installments! >= 1 && p.installments! <= 24 ? p.installments! : 1,
    pixDiscountPercent: typeof p.pixDiscountPercent === 'number' && Number.isFinite(p.pixDiscountPercent) && p.pixDiscountPercent >= 0 && p.pixDiscountPercent < 100 ? p.pixDiscountPercent : 0,
    freeShipping: p.freeShipping === true,
    condition: typeof p.condition === 'string' && p.condition.trim() ? p.condition.trim() : 'Novo',
    soldCount: p.soldCount != null ? p.soldCount : '+10 mil vendidos'
  }
}
export function validateCommerce(p: ProductCommerce, price: number, promo: number | null, now = Date.now()): string | null {
  if (!Number.isFinite(price) || price < 0) return 'Informe um preço de venda válido.'
  if (promo !== null && (!Number.isFinite(promo) || promo <= 0 || promo >= price)) return 'O preço promocional deve ser maior que zero e menor que o preço de venda.'
  if (p.offerEnabled && (!p.offerEndsAt || !Number.isFinite(Date.parse(p.offerEndsAt)) || Date.parse(p.offerEndsAt) <= now)) return 'A oferta precisa de uma data de término no futuro.'
  if (!Number.isInteger(p.installments) || p.installments < 1 || p.installments > 24) return 'Escolha de 1 a 24 parcelas sem juros.'
  if (!Number.isFinite(p.pixDiscountPercent) || p.pixDiscountPercent < 0 || p.pixDiscountPercent >= 100) return 'O desconto no Pix deve ser de 0 a menos de 100%.'
  return null
}
export function productPricing(price = 0, promo: number | null | undefined, settings: unknown, now = Date.now()) {
  const commerce = normalizeCommerce(settings)
  const base = Number.isFinite(Number(price)) ? Math.max(0, Number(price)) : 0
  const offerActive = commerce.offerEnabled && !!commerce.offerEndsAt && Date.parse(commerce.offerEndsAt) > now
  const promotionActive = !commerce.offerEnabled || offerActive
  const current = promotionActive && promo != null && promo > 0 && promo < base ? Number(promo) : base
  const pix = Math.round(current * (1 - commerce.pixDiscountPercent / 100) * 100) / 100
  return { base, current, pix, discount: base > pix ? Math.round((base - pix) / base * 100) : 0,
    installment: Math.round(current / commerce.installments * 100) / 100, commerce, offerActive }
}
