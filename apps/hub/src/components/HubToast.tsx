import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { HubToastDetail } from '../lib/hubNotifications'
import './HubToast.css'

interface ToastItem extends HubToastDetail {
  id: number
}

export default function HubToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<HubToastDetail>).detail
      if (!detail?.message) return
      const id = Date.now() + Math.random()
      const toast: ToastItem = {
        id,
        title: detail.title,
        message: detail.message,
        type: detail.type || 'info',
        duration: detail.duration || 4500,
        onClick: detail.onClick
      }
      setToasts(current => [...current.slice(-4), toast])
      window.setTimeout(() => {
        setToasts(current => current.filter(item => item.id !== id))
      }, toast.duration)
    }

    window.addEventListener('hub:toast', handleToast)
    return () => window.removeEventListener('hub:toast', handleToast)
  }, [])

  const handleDismiss = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setToasts(current => current.filter(item => item.id !== id))
  }

  return (
    <div className="hub-toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success'
        const isError = toast.type === 'error'
        const isWarning = toast.type === 'warning'
        const isInfo = toast.type === 'info' || !toast.type

        return (
          <div
            key={toast.id}
            onClick={toast.onClick}
            className={`hub-toast-card ${
              isSuccess ? 'border-success' :
              isError ? 'border-error' :
              isWarning ? 'border-warning' :
              'border-info'
            } ${toast.onClick ? 'cursor-pointer' : ''}`}
            role="status"
          >
            {/* Ícone */}
            <div className="hub-toast-icon-wrap">
              {isSuccess && <CheckCircle size={20} className="text-[#38a169]" />}
              {isError && <AlertCircle size={20} className="text-[#e74c3c]" />}
              {isWarning && <AlertTriangle size={20} className="text-[#f59e0b]" />}
              {isInfo && <Info size={20} className="text-[#1f2328]" />}
            </div>

            {/* Conteúdo (Título + Mensagem) */}
            <div className="hub-toast-body">
              {toast.title && (
                <h4 className="hub-toast-title">
                  {toast.title}
                </h4>
              )}
              <p className="hub-toast-msg">
                {toast.message}
              </p>
            </div>

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={(e) => handleDismiss(toast.id, e)}
              className="hub-toast-close"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}