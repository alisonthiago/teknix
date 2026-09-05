import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export interface CompareProduct {
  id: string
  name: string
  sku: string
  slug: string
  image_url: string
  price: number
  promo_price?: number
  brand?: string
  category?: string
  specifications?: Record<string, string>
}

interface CompareContextType {
  items: CompareProduct[]
  addToCompare: (product: CompareProduct) => void
  removeFromCompare: (productId: string) => void
  clearCompare: () => void
  isInCompare: (productId: string) => boolean
  totalItems: number
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

const STORAGE_KEY = 'teknix_compare'
const MAX_ITEMS = 4

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToCompare = useCallback((product: CompareProduct) => {
    setItems(prev => {
      if (prev.length >= MAX_ITEMS) return prev
      if (prev.some(p => p.id === product.id)) return prev
      return [...prev, product]
    })
  }, [])

  const removeFromCompare = useCallback((productId: string) => {
    setItems(prev => prev.filter(p => p.id !== productId))
  }, [])

  const clearCompare = useCallback(() => {
    setItems([])
  }, [])

  const isInCompare = useCallback((productId: string) => {
    return items.some(p => p.id === productId)
  }, [items])

  return (
    <CompareContext.Provider value={{
      items,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      totalItems: items.length
    }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider')
  }
  return context
}
