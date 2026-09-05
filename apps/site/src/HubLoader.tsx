import { Suspense, lazy } from 'react'

const LazyHubApp = lazy(async () => {
  await import('../../hub/src/styles/global.css')
  const module = await import('../../hub/src/App')
  return { default: module.default }
})

export default function HubLoader() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            background: '#f5f5f7',
            color: '#1d1d1f'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>TEKNIX Hub</div>
          <div style={{ fontSize: '13px', color: '#86868b' }}>Carregando painel administrativo...</div>
        </div>
      }
    >
      <LazyHubApp />
    </Suspense>
  )
}
