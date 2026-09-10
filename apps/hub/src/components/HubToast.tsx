import { useEffect, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { HubToastDetail } from '../lib/hubNotifications'
import './HubToast.css'

interface Toast extends HubToastDetail {
  id: number
}

export default function HubToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<HubToastDetail>).detail
      if (!detail?.message) return
      const id = Date.now() + Math.random()
      const toast: Toast = { id, message: detail.message, type: detail.type || 'info', duration: detail.duration || 4000 }
      setToasts(current => [...current.slice(-2), toast])
      window.setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), toast.duration)
    }

    window.addEventListener('hub:toast', handleToast)
    return () => window.removeEventListener('hub:toast', handleToast)
  }, [])

  return (
    <div className="hub-toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => {
        const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? XCircle : Info
        return (
          <div key={toast.id} className={`hub-toast hub-toast-${toast.type}`} role="status">
            <Icon size={18} />
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))} aria-label="Fechar notificação">
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}