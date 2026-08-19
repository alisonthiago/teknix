'use client'

import { useNotification } from '@/contexts/NotificationContext'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export function ToastContainer() {
  const { activeToasts, dismissToast } = useNotification()

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {activeToasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        const isError = toast.type === 'error'
        const isWarning = toast.type === 'warning'
        const isInfo = toast.type === 'info'

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 w-80 p-4 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-l-4 animate-in slide-in-from-right-8 fade-in duration-300 ${
              isSuccess ? 'border-l-[#38a169]' :
              isError ? 'border-l-[#e74c3c]' :
              isWarning ? 'border-l-[#f59e0b]' :
              'border-l-[#3483fa]'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle className="w-5 h-5 text-[#38a169]" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#e74c3c]" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />}
              {isInfo && <Info className="w-5 h-5 text-[#3483fa]" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-semibold text-[#333] mb-0.5">
                {toast.title}
              </h4>
              <p className="text-[13px] text-[#666] leading-snug">
                {toast.message}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-[#999] hover:text-[#333] transition-colors p-1 -mr-1 -mt-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
