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
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
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

function getDomainCookieParam(): string {
  if (typeof window === 'undefined') return ''
  const host = window.location.hostname
  if (host.includes('teknixbrasil.com.br')) {
    return '; domain=.teknixbrasil.com.br'
  }
  return ''
}

function saveCartShared(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    const raw = JSON.stringify(items)
    localStorage.setItem(CART_KEY, raw)
    const domainStr = getDomainCookieParam()
    document.cookie = `teknix_cart=${encodeURIComponent(raw)}; path=/${domainStr}; max-age=604800; SameSite=Lax`
  } catch (e) {
    console.warn('Erro ao sincronizar carrinho:', e)
  }
}

function loadInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    // 1. Tenta carregar de query param `?cart=` (transferência garantida entre domínios)
    const sp = new URLSearchParams(window.location.search)
    const cartParam = sp.get('cart')
    if (cartParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(cartParam))
        if (Array.isArray(decoded) && decoded.length > 0) {
          saveCartShared(decoded)
          // Limpa o param da URL de forma elegante
          sp.delete('cart')
          const newSearch = sp.toString() ? `?${sp.toString()}` : ''
          window.history.replaceState({}, '', `${window.location.pathname}${newSearch}`)
          return decoded
        }
      } catch (e) {
        console.debug('Falha ao decodificar param ?cart:', e)
      }
    }

    // 2. Tenta carregar de Cookie compartilhado (.teknixbrasil.com.br)
    const match = document.cookie.match(/(?:^|;\s*)teknix_cart=([^;]*)/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]))
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(CART_KEY, JSON.stringify(parsed))
          return parsed
        }
      } catch (e) {
        console.debug('Falha ao decodificar cookie teknix_cart:', e)
      }
    }

    // 3. Fallback para localStorage local
    const stored = localStorage.getItem(CART_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.debug('loadInitialCart:', e)
  }
  return []
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadInitialCart())
  const [isOpen, setIsOpen] = useState(false)
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null)

  // Persiste no localStorage e no Cookie compartilhado sempre que o carrinho muda
  useEffect(() => {
    saveCartShared(items)
  }, [items])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => {
    const price = i.promo_price && i.promo_price > 0 ? i.promo_price : i.price
    return sum + price * i.quantity
  }, 0)

  function addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    const quantityToAdd = item.quantity && item.quantity > 0 ? item.quantity : 1
    let updatedItem: CartItem
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        const nextQty = existing.quantity + quantityToAdd
        if (existing.stock && nextQty > existing.stock) return prev
        updatedItem = { ...existing, quantity: nextQty }
        return prev.map(i => i.id === item.id ? updatedItem : i)
      }
      updatedItem = { ...item, quantity: quantityToAdd }
      return [...prev, updatedItem]
    })
    setLastAddedItem({ ...item, quantity: quantityToAdd, stock: item.stock })
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

export function getCartSessionCode(): string {
  if (typeof window === 'undefined') return '998904892'
  try {
    let code = sessionStorage.getItem('teknix_cart_code')
    if (!code) {
      // Gera código numérico exclusivo de 9 a 10 dígitos (ex: 998904892 ou 049034384083)
      const randomNum = Math.floor(100000000 + Math.random() * 900000000)
      code = String(randomNum)
      sessionStorage.setItem('teknix_cart_code', code)
    }
    return code
  } catch {
    return '998904892'
  }
}

export function getCheckoutHref(items: CartItem[]): string {
  if (typeof window === 'undefined') return '/checkout'
  const host = window.location.hostname
  const isProd = host === 'teknixbrasil.com.br' ||
    host === 'www.teknixbrasil.com.br' ||
    host.endsWith('teknixbrasil.com.br')

  const cartCode = getCartSessionCode()
  const cartParam = items && items.length > 0 ? `?cart=${encodeURIComponent(JSON.stringify(items))}` : ''

  if (isProd) {
    return `https://play.teknixbrasil.com.br/${cartCode}${cartParam}`
  } else {
    return `/checkout/${cartCode}${cartParam}`
  }
}

