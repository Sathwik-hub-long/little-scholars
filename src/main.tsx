
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Register Little Scholars PWA service worker
const updateSW = registerSW({
  immediate: true,

  onNeedRefresh() {
    if (window.confirm('A new version of Little Scholars is available. Update now?')) {
      void updateSW(true)
    }
  },

  onOfflineReady() {
    console.info('Little Scholars is ready to work offline.')
  },

  onRegisterError(error: unknown) {
    console.error('PWA registration failed:', error)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
