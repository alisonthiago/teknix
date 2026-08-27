/* ==========================================================================
   TEKNIX SITE — CART CONTEXT
   Estado global do carrinho: persistido em localStorage.
   Fluxo: Produto → addToCart → Checkout → createOrder (Supabase)
   ========================================================================== */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  sku: string
  price: number
  promo_price?: number | null
  image: string
  quantity: number
  stock: number
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  lastAddedItem: CartItem | null
  clearLastAdded: () => void
}

const CartContext = createContext<CartContextType | null>(null)

const CART_KEY = 'teknix_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null)

  // Persiste no localStorage sempre que muda
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch (e) {
      console.warn('Erro ao salvar carrinho no localStorage:', e)
    }
  }, [items])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => {
    const price = i.promo_price && i.promo_price > 0 ? i.promo_price : i.price
    return sum + price * i.quantity
  }, 0)

  function addToCart(item: Omit<CartItem, 'quantity'>) {
    let updatedItem: CartItem
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        const nextQty = existing.quantity + 1
        if (existing.stock && existing.quantity >= existing.stock) return prev
        updatedItem = { ...existing, quantity: nextQty }
        return prev.map(i => i.id === item.id ? updatedItem : i)
      }
      updatedItem = { ...item, quantity: 1 }
      return [...prev, updatedItem]
    })
    setLastAddedItem({ ...item, quantity: 1 })
    setIsOpen(true) // Abre automaticamente o flyout/drawer
  }

  function removeFromCart(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQuantity(id: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(id)
      return
    }
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      const maxQty = i.stock ? Math.min(qty, i.stock) : qty
      return { ...i, quantity: maxQty }
    }))
  }

  function clearCart() {
    setItems([])
  }

  function clearLastAdded() {
    setLastAddedItem(null)
  }

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      lastAddedItem,
      clearLastAdded
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}

