import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/theme.css'
import { initAnalytics } from './analytics'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import { RepositoryProvider } from './data/RepositoryProvider'
import { registerServiceWorker } from './reminders/serviceWorker'
import { listenForInstallPrompt } from './store/installStore'
import { loadP4Provider } from './p4Provider'

initAnalytics()
registerServiceWorker()
listenForInstallPrompt()
loadP4Provider()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <RepositoryProvider>
            <App />
          </RepositoryProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
