import React from 'react'
import { RefreshCw } from 'lucide-react'

interface HubLoadingStateProps {
  message?: string
  size?: number
  padding?: number | string
  style?: React.CSSProperties
  className?: string
  fullscreen?: boolean
}

export default function HubLoadingState({
  message = 'Carregando dados...',
  size = 24,
  padding = 80,
  style,
  className = '',
  fullscreen = false,
}: HubLoadingStateProps) {
  if (fullscreen) {
    return (
      <div
        className={`hub-loading-state fullscreen ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          textAlign: 'center',
          ...style,
        }}
      >
        <RefreshCw className="hub-spin" size={size} style={{ marginBottom: 12 }} />
        <div style={{ fontSize: '14px', fontWeight: 500 }}>{message}</div>
      </div>
    )
  }

  return (
    <div
      className={`hub-loading-state ${className}`}
      style={{
        padding: typeof padding === 'number' ? `${padding}px 20px` : padding,
        textAlign: 'center',
        color: '#64748b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        ...style,
      }}
    >
      <RefreshCw className="hub-spin" size={size} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{message}</div>
    </div>
  )
}
