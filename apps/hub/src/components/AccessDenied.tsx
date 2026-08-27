import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react'

interface AccessDeniedProps {
  title?: string
  message?: string
}

export default function AccessDenied({
  title = 'Acesso Restrito',
  message = 'Seu perfil de colaborador não possui permissão para acessar este módulo ou executar esta ação.'
}: AccessDeniedProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: "'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 20,
        background: '#fef2f2',
        border: '1px solid #fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
        marginBottom: 20
      }}>
        <Lock size={32} />
      </div>

      <h2 style={{
        fontSize: '22px',
        fontWeight: 800,
        color: '#111827',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h2>

      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        maxWidth: '460px',
        lineHeight: 1.5,
        margin: '0 0 24px 0'
      }}>
        {message}
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Link
          to="/hub"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#111827',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'opacity 0.15s ease'
          }}
        >
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>
      </div>
    </div>
  )
}
