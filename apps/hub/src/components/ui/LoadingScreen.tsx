import React from 'react'
import { RefreshCw } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  subtitle?: string
  fullscreen?: boolean
}

export default function LoadingScreen({
  message = 'Carregando...',
  subtitle,
  fullscreen = true
}: LoadingScreenProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullscreen ? '100vh' : '100%',
        width: '100%',
        background: '#ffffff',
        color: '#64748b',
        fontFamily: 'var(--tk-font-family, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        userSelect: 'none',
        zIndex: 99999,
        position: fullscreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <RefreshCw className="hub-spin" size={24} style={{ marginBottom: 12, color: '#64748b' }} />
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>{message}</div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4 }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
