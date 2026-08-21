'use client'

import { useState } from 'react'
import { Bell, ShoppingCart, AlertTriangle, ArrowDown, ExternalLink, Package } from 'lucide-react'
import Link from 'next/link'
import { markAsRead, markAllAsRead } from './actions'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  resource?: string
  resource_id?: string
}

export default function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const validInitial = (initialNotifications || []).filter(n => {
    const title = String(n.title || '').toLowerCase()
    const msg = String(n.message || '').toLowerCase()
    if (
      title.includes('fornecedor') ||
      title.includes('sucesso') ||
      title.includes('arquivo grande') ||
      title.includes('contato') ||
      title.includes('logomarca') ||
      msg.includes('foram atualizados') ||
      msg.includes('excede o limite')
    ) {
      return false
    }
    return true
  })

  const [notifications, setNotifications] = useState(validInitial)
  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
  }

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_SALE': return <ShoppingCart className="w-5 h-5 text-[#00a650]" />
      case 'LOW_STOCK': return <Package className="w-5 h-5 text-orange-600" />
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-lime-600" />
      case 'LOW_MARGIN': return <ArrowDown className="w-5 h-5 text-red-600" />
      default: return <Bell className="w-5 h-5 text-[#3483fa]" />
    }
  }

  const getBg = (type: string) => {
    switch (type) {
      case 'NEW_SALE': return 'bg-[#e6f9ef]'
      case 'LOW_STOCK': return 'bg-orange-100'
      case 'WARNING': return 'bg-lime-100'
      case 'LOW_MARGIN': return 'bg-red-100'
      default: return 'bg-[#ecf3fe]'
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto mp-stack">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#333]">Notificações</h1>
          {unreadCount > 0 && <p className="text-sm text-[#999] mt-1">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-[#3483fa] hover:text-[#2968c8] font-medium">
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#fafafa] rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[#999]" />
            </div>
            <h3 className="text-[#333] font-medium">Nenhuma notificação</h3>
            <p className="text-[#999] text-sm mt-1">Você está em dia com as novidades.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#eeeeee]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 sm:p-6 flex gap-4 hover:bg-[#fafafa] transition-colors cursor-pointer ${n.is_read ? 'opacity-60' : ''}`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getBg(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`text-sm font-medium ${n.is_read ? 'text-[#666]' : 'text-[#333]'}`}>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#3483fa] inline-block mr-2"></span>}
                        {n.title}
                      </h4>
                      <p className="text-sm text-[#999] mt-1">{n.message}</p>
                    </div>
                    <span className="text-xs text-[#999] whitespace-nowrap">
                      {new Date(n.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {n.resource === 'sale' && n.resource_id && (
                    <div className="mt-3">
                      <Link href="/sales" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3483fa] hover:text-[#2968c8]">
                        Ver Vendas <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
