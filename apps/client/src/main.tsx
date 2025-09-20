import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'

// GitHub Pages necesita el nombre del repositorio como basename en producción
const basename = import.meta.env.PROD ? '/AR-E-Web' : '';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
)
