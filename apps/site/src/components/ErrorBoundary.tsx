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
    console.error('ErrorBoundary capturou erro no SITE TEKNIX:', error, errorInfo)
  }

  handleHardReset = () => {
    try {
      sessionStorage.clear()
    } catch {
      // Ignora erro de storage
    }
    window.location.href = '/'
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
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#f8fafc',
          color: '#111827',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '36px 32px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#059669',
              fontSize: '26px'
            }}>
              ⚡
            </div>

            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 10px',
              color: '#111827'
            }}>
              Ops! Tivemos um pequeno imprevisto.
            </h1>

            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: 1.55,
              margin: '0 0 24px'
            }}>
              {this.state.error?.message
                ? `Houve uma falha na renderização de um componente: ${this.state.error.message}`
                : 'Não foi possível carregar a vitrine neste instante. Clique abaixo para atualizar.'}
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  height: '44px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#b5f500',
                  color: '#141414',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                Recarregar página
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                Voltar para a Página Inicial
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
