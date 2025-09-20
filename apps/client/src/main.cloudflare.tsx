import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'

// Para Cloudflare Pages no necesitamos basename ya que se despliega en el root
createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/">
    <App />
  </BrowserRouter>
)