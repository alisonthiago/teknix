import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { setupMobileViewportGuard } from './utils/mobileViewport'

// Inicializa a proteção global contra zoom residual de formulários no mobile
setupMobileViewportGuard()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
