import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import HubLoader from './HubLoader.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './styles/global.css'
import './styles/typography.css'
import './styles/spacing.css'

const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
const port = typeof window !== 'undefined' ? window.location.port : ''
const isHubHost = hostname === 'hub.teknixbrasil.com.br' || port === '5174'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {isHubHost ? (
        <HubLoader />
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </ErrorBoundary>
  </StrictMode>,
)


