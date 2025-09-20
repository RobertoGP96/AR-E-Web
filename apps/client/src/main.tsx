import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'

// Detectar plataforma de despliegue
const isCloudflare = import.meta.env.VITE_DEPLOY_TARGET === 'cloudflare';
const isProduction = import.meta.env.PROD;

// Configurar basename según la plataforma
let basename = '/';
if (isProduction && !isCloudflare) {
  // GitHub Pages necesita el nombre del repositorio como basename
  basename = '/AR-E-Web/';
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
)
