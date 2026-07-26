import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import './index.css'

setWorkerUrl(workerUrl)

// AdSense loader: set VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXX in your env to enable ads.
const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT
if (adsenseClient && adsenseClient.startsWith('ca-pub-')) {
  const s = document.createElement('script')
  s.async = true
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`
  s.crossOrigin = 'anonymous'
  document.head.appendChild(s)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
