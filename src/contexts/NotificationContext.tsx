'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { playNotificationSound } from '@/utils/audio-chime'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
  actor_name?: string
  module?: string
  entity_id?: string
  entity_type?: string
  image_url?: string
}

export interface NotifyOptions {
  title: string
  message: string
  type: NotificationType
}

interface NotificationContextProps {
  notifications: AppNotification[]
  unreadCount: number
  notify: (options: NotifyOptions) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  
  // For Toast rendering only
  activeToasts: AppNotification[]
  dismissToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  notify: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  activeToasts: [],
  dismissToast: () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Busca notificações operacionais reais da empresa
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data && !error) {
      // Filtrar estritamente apenas notificações de Marketplaces, Vendas, Perguntas, Mensagens e Estoque (ignorar logs internos de CRUD)
      const validNotifs = (data as AppNotification[]).filter(n => {
        const title = String(n.title || '').toLowerCase()
        const msg = String(n.message || '').toLowerCase()
        const mod = String(n.module || '').toLowerCase()
        if (
          title.includes('fornecedor') ||
          title.includes('sucesso') ||
          title.includes('arquivo grande') ||
          title.includes('contato') ||
          title.includes('logomarca') ||
          msg.includes('json válido') ||
          msg.includes('receita federal') ||
          msg.includes('enviar pdf') ||
          msg.includes('foram atualizados') ||
          msg.includes('excede o limite') ||
          mod === 'suppliers' ||
          mod === 'auth' ||
          mod === 'system'
        ) {
          return false
        }
        return true
      })
      setNotifications(validNotifs)

      // Enriquecer notificações de vendas com fotos dos produtos
      const saleNotifs = validNotifs.filter(n => {
        const t = String(n.title || '').toLowerCase() + ' ' + String(n.message || '').toLowerCase()
        return t.includes('venda') || t.includes('comprou') || t.includes('pedido')
      })
      if (saleNotifs.length > 0) {
        const orderNums = new Set<string>()
        for (const n of saleNotifs) {
          const matches = (n.title + ' ' + n.message).match(/MLB-?\d+/g)
          if (matches) matches.forEach(m => orderNums.add(m))
        }
        if (orderNums.size > 0) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('order_number, order_items(products(name, image_url))')
            .in('order_number', Array.from(orderNums))
          const imageMap: Record<string, string> = {}
          for (const o of ordersData || []) {
            const items = (o as any).order_items || []
            for (const item of items) {
              if (item.products?.image_url) {
                imageMap[(o as any).order_number] = item.products.image_url
                break
              }
            }
          }
          setNotifications(prev => prev.map(n => {
            const match = (n.title + ' ' + n.message).match(/MLB-?\d+/)
            if (match && imageMap[match[0]]) return { ...n, image_url: imageMap[match[0]] }
            return n
          }))
        }
      }
    }
  }, [supabase])

  const dismissToast = useCallback((id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    fetchNotifications()

    // 1. Polling de fallback a cada 10 segundos
    const intervalId = setInterval(fetchNotifications, 10000)

    // 2. Realtime subscription no Supabase
    let channel: any = null
    const setupRealtime = async () => {
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            const newNotif = payload.new as AppNotification
            const title = String(newNotif.title || '').toLowerCase()
            const mod = String(newNotif.module || '').toLowerCase()
            if (!title.includes('fornecedor') && !title.includes('catálogo') && mod !== 'suppliers') {
              playNotificationSound()
              setNotifications(prev => {
                if (prev.some(p => p.id === newNotif.id)) return prev
                return [newNotif, ...prev].slice(0, 50)
              })
              setActiveToasts(prev => [...prev, newNotif])
              setTimeout(() => {
                dismissToast(newNotif.id)
              }, 5000)
            }
          }
        )
        .subscribe()
    }
    
    setupRealtime()

    return () => {
      clearInterval(intervalId)
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchNotifications, supabase, dismissToast])

  // notify agora é EXCLUSIVO para exibir Toasts visuais temporários na tela, SEM poluir a Central de Notificações
  const notify = ({ title, message, type }: NotifyOptions) => {
    playNotificationSound()
    const tempId = crypto.randomUUID()
    const newToast: AppNotification = {
      id: tempId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    // Exibe o toast visual no canto da tela
    setActiveToasts(prev => [...prev, newToast])

    // Auto remove após 4s
    setTimeout(() => {
      dismissToast(tempId)
    }, 4000)
  }

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    } catch (e) {
      console.error(e)
    }
  }

  const removeNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await supabase.from('notifications').delete().eq('id', id)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      notify,
      markAsRead,
      markAllAsRead,
      removeNotification,
      activeToasts,
      dismissToast
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
