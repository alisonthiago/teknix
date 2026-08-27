import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export interface FavoriteProduct {
  id: string
  name: string
  sku?: string
  price: number
  promo_price?: number | null
  image_url?: string
  slug?: string
}

interface FavoritesContextType {
  favorites: FavoriteProduct[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (product: FavoriteProduct) => void
  removeFavorite: (id: string) => void
  clearFavorites: () => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

const FAVORITES_STORAGE_KEY = '@teknix:favorites'

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Salva no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    } catch (e) {
      console.warn('Erro ao salvar favoritos no localStorage', e)
    }
  }, [favorites])

  // Se o usuário estiver logado, podemos também sincronizar ou buscar do banco
  useEffect(() => {
    if (!user) return
    async function syncUserFavorites() {
      try {
        const { data } = await supabase
          .from('favorites')
          .select('product_id, products(*)')
          .eq('user_id', user!.id)

        if (data && data.length > 0) {
          const dbFavs: FavoriteProduct[] = data
            .filter(d => d.products)
            .map((d: any) => {
              const p = d.products
              return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: Number(p.price || p.sell_price || 0),
                promo_price: p.promo_price ? Number(p.promo_price) : null,
                image_url: p.image_url || (Array.isArray(p.images) ? p.images[0] : ''),
                slug: p.slug
              }
            })

          setFavorites(prev => {
            const merged = [...prev]
            dbFavs.forEach(df => {
              if (!merged.some(m => m.id === df.id)) merged.push(df)
            })
            return merged
          })
        }
      } catch (e) {
        // Fallback para localStorage
      }
    }
    syncUserFavorites()
  }, [user])

  function isFavorite(id: string) {
    return favorites.some(f => f.id === id)
  }

  function toggleFavorite(product: FavoriteProduct) {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === product.id)
      if (exists) {
        // Remove
        if (user) {
          supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id).then()
        }
        return prev.filter(f => f.id !== product.id)
      } else {
        // Add
        if (user) {
          supabase.from('favorites').insert({ user_id: user.id, product_id: product.id }).then()
        }
        return [...prev, product]
      }
    })
  }

  function removeFavorite(id: string) {
    setFavorites(prev => prev.filter(f => f.id !== id))
    if (user) {
      supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id).then()
    }
  }

  function clearFavorites() {
    setFavorites([])
  }

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, removeFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites deve ser utilizado dentro de FavoritesProvider')
  }
  return context
}
