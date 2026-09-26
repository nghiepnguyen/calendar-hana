import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/theme.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { RepositoryProvider } from './data/RepositoryProvider'
import { registerServiceWorker } from './reminders/serviceWorker'
import { listenForInstallPrompt } from './store/installStore'

registerServiceWorker()
listenForInstallPrompt()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RepositoryProvider>
          <App />
        </RepositoryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
