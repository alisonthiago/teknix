import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro no SITE:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#f5f5f7',
          color: '#1d1d1f',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
            Ops! Algo deu errado ao carregar a vitrine.
          </h1>
          <p style={{ fontSize: '15px', color: '#6e6e73', maxWidth: '480px', marginBottom: '24px' }}>
            {this.state.error?.message || 'Ocorreu um erro inesperado. Clique abaixo para recarregar.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: 0,
              background: '#0071e3',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Recarregar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
