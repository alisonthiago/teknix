'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
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

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data && !error) {
      setNotifications(data as AppNotification[])
    }
  }, [supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const notify = async ({ title, message, type }: NotifyOptions) => {
    const tempId = crypto.randomUUID()
    const newNotification: AppNotification = {
      id: tempId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    // Add to toasts immediately
    setActiveToasts(prev => [...prev, newNotification])

    // Auto dismiss toast after 5s
    setTimeout(() => {
      dismissToast(tempId)
    }, 5000)

    // Save to DB
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            title,
            message,
            type,
            is_read: false
          })
          .select()
          .single()

        if (data && !error) {
          setNotifications(prev => [data as AppNotification, ...prev].slice(0, 50))
        } else {
          // If insert fails or no data returned, fallback to temp state for history
          setNotifications(prev => [newNotification, ...prev].slice(0, 50))
        }
      } else {
        setNotifications(prev => [newNotification, ...prev].slice(0, 50))
      }
    } catch (e) {
      console.error('Failed to save notification', e)
    }
  }

  const dismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id))
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
