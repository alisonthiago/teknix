export interface ProductSignalsData {
  badge?: 'none' | 'daily' | 'special' | 'bestseller'
  demo?: boolean
  offerEndsAt?: string
  bestSeller?: boolean
  stock?: number
}

export interface ProductReview { id: string; author: string; rating: number; date: string; text: string; recommended: boolean }

export function remainingOfferTime(endsAt: string | undefined, now: number) {
  const end = endsAt ? Date.parse(endsAt) : NaN
  return Number.isFinite(end) ? Math.max(0, Math.ceil((end - now) / 1000)) : 0
}

export function reviewSummary(reviews: ProductReview[]) {
  const valid = reviews.filter(r => Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5)
  return { reviews: valid, count: valid.length, average: valid.length ? valid.reduce((sum, r) => sum + r.rating, 0) / valid.length : 0 }
}
