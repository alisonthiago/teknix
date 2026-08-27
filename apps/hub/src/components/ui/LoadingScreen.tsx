import React from 'react'

interface LoadingScreenProps {
  message?: string
  subtitle?: string
  fullscreen?: boolean
}

export default function LoadingScreen({
  message = 'Carregando...',
  subtitle = 'Aguarde um momento',
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
        color: '#1d1d1f',
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          gap: '16px',
          textAlign: 'center',
        }}
      >
        {/* Minimal Spinner without any text */}
        <div
          style={{
            width: '28px',
            height: '28px',
            border: '2.5px solid #e5e5ea',
            borderTopColor: '#0071e3',
            borderRadius: '50%',
            animation: 'simpleSpin 0.6s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes simpleSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
