import React from 'react'
import { RefreshCw } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  size?: number
  padding?: number | string
  className?: string
  style?: React.CSSProperties
  fullscreen?: boolean
}

export default function LoadingState({
  message = 'Carregando...',
  size = 24,
  padding = 48,
  className = '',
  style,
  fullscreen = false,
}: LoadingStateProps) {
  if (fullscreen) {
    return (
      <div
        className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center text-[#64748b] text-center ${className}`}
        style={style}
      >
        <RefreshCw className="animate-spin mb-3 text-[#64748b]" size={size} />
        <div className="text-sm font-medium">{message}</div>
      </div>
    )
  }

  return (
    <div
      className={`flow-loading-state ${className}`}
      style={{
        padding: typeof padding === 'number' ? `${padding}px 20px` : padding,
        ...style,
      }}
    >
      <RefreshCw className="animate-spin mb-3 text-[#64748b]" size={size} />
      <div className="text-[13.5px] font-medium">{message}</div>
    </div>
  )
}
