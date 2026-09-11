import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { playNotificationSound } from '../utils/audioChime'
import {
  HubNotificationService,
  type HubNotification,
  type CreateNotificationInput
} from '../services/notificationService'

interface HubNotificationContextType {
  notifications: HubNotification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  createNotification: (input: CreateNotificationInput) => Promise<HubNotification | null>
  activeToasts: HubNotification[]
  dismissToast: (id: string) => void
}

const HubNotificationContext = createContext<HubNotificationContextType | undefined>(undefined)

export function HubNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<HubNotification[]>([])
  const [activeToasts, setActiveToasts] = useState<HubNotification[]>([])
  const [loading, setLoading] = useState(true)

  const unreadCount = notifications.filter(n => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await HubNotificationService.fetchNotifications(100)
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Inicialização e Realtime Subscription
  useEffect(() => {
    fetchNotifications()

    // Realtime Postgres Changes Subscription
    const channel = supabase
      .channel('hub-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotif = payload.new as HubNotification
          playNotificationSound()
          setNotifications(prev => {
            if (prev.some(p => p.id === newNotif.id)) return prev
            return [newNotif, ...prev]
          })
          setActiveToasts(prev => [newNotif, ...prev.slice(0, 3)])
          setTimeout(() => {
            dismissToast(newNotif.id)
          }, 5000)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const updated = payload.new as HubNotification
          setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const deletedId = (payload.old as { id: string })?.id
          if (deletedId) {
            setNotifications(prev => prev.filter(n => n.id !== deletedId))
          }
        }
      )
      .subscribe()

    // Polling de fallback a cada 30 segundos
    const pollTimer = setInterval(() => {
      HubNotificationService.fetchNotifications(100).then(data => {
        if (data.length > 0) {
          setNotifications(data)
        }
      })
    }, 30000)

    return () => {
      clearInterval(pollTimer)
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, dismissToast])

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await HubNotificationService.markAsRead(id)
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await HubNotificationService.markAllAsRead()
  }

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await HubNotificationService.deleteNotification(id)
  }

  const createNotification = async (input: CreateNotificationInput) => {
    return await HubNotificationService.createNotification(input)
  }

  return (
    <HubNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createNotification,
        activeToasts,
        dismissToast
      }}
    >
      {children}
      {/* Toast flutuante de novidades em tempo real no canto inferior direito */}
      {activeToasts.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          pointerEvents: 'none'
        }}>
          {activeToasts.map(toast => (
            <div
              key={toast.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                pointerEvents: 'auto',
                animation: 'hubSlideIn 0.3s ease-out'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: toast.type === 'success' ? '#ecfdf5' : toast.type === 'error' ? '#fef2f2' : toast.type === 'warning' ? '#fffbeb' : '#eff6ff',
                color: toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#dc2626' : toast.type === 'warning' ? '#d97706' : '#2563eb',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '!'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                  {toast.title}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '14px'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </HubNotificationContext.Provider>
  )
}

export function useHubNotifications() {
  const context = useContext(HubNotificationContext)
  if (!context) {
    throw new Error('useHubNotifications must be used within a HubNotificationProvider')
  }
  return context
}
