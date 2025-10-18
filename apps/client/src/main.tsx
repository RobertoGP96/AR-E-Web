import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

// Configurar basename para diferentes plataformas de despliegue
const isVercel = import.meta.env.VITE_DEPLOY_TARGET === 'vercel';
const basename = isVercel ? '/' : '/';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
)
