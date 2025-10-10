# ⚡ Quick Start - Deploy Automático en Vercel

## 🎯 Resumen de 5 Minutos

Este es el proceso paso a paso para configurar el deploy automático de la aplicación cliente en Vercel.

---

## 📋 Paso 1: Verificar que todo funciona localmente

```powershell
# Desde la raíz del proyecto
cd apps/client

# Ejecutar el script de verificación
.\pre-deploy-check.ps1

# O manualmente:
pnpm install
pnpm type-check
pnpm build:vercel
```

✅ **Si el build funciona**, continúa al siguiente paso.

---

## 🌐 Paso 2: Acceder a Vercel

1. Ve a **https://vercel.com**
2. Haz **login con GitHub**
3. Autoriza el acceso a tus repositorios

---

## 📦 Paso 3: Importar Proyecto

1. Click en **"Add New..."** → **"Project"**
2. Busca y selecciona: **`AR-E-Web`**
3. Click en **"Import"**

---

## ⚙️ Paso 4: Configuración del Proyecto

### Framework Preset:
```
Vite
```

### Root Directory:
```
./
```
⚠️ **Importante**: NO cambies el directorio raíz

### Build Settings:

Habilita **"Override"** y usa estos valores:

| Campo | Valor Exacto |
|-------|--------------|
| **Build Command** | `cd apps/client && pnpm build:vercel` |
| **Output Directory** | `apps/client/dist` |
| **Install Command** | `pnpm install --no-frozen-lockfile` |

### Node.js Version:
```
18.x
```

---

## 🔐 Paso 5: Variables de Entorno

Click en **"Environment Variables"** y añade:

### Método 1: Una por una

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_API_URL` | `https://ar-e-web.onrender.com/arye_system` | Production, Preview, Development |
| `VITE_APP_ENV` | `production` | Production |
| `VITE_APP_NAME` | `AR-E-Web Client` | Production, Preview, Development |
| `VITE_ENABLE_ANALYTICS` | `true` | Production |
| `VITE_DEBUG` | `false` | Production |
| `VITE_DEPLOY_TARGET` | `vercel` | Production, Preview, Development |

### Método 2: Copiar y pegar todo

```env
VITE_API_URL=https://ar-e-web.onrender.com/arye_system
VITE_APP_ENV=production
VITE_APP_NAME=AR-E-Web Client
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG=false
VITE_DEPLOY_TARGET=vercel
```

Click en **"Add"** para cada variable o usa la opción de pegar múltiples.

---

## 🚀 Paso 6: Deploy

1. Revisa toda la configuración
2. Click en **"Deploy"**
3. Espera 2-5 minutos

### Log esperado:

```
✓ Running install command...
✓ Dependencies installed

✓ Running build command...
✓ Type checking completed
✓ Build completed successfully

✓ Deploying...
✓ Deployment ready
```

---

## ✅ Paso 7: Verificar Deploy

Una vez completado:

1. Vercel te dará una **URL** como: `https://ar-e-web.vercel.app`
2. Click en **"Visit"** para abrir tu app
3. Verifica que todo funciona

---

## 🔄 Deploy Automático Configurado ✨

### ¡Ya está! Ahora:

✅ **Cada `git push` a `main`** → Deploy automático a producción

✅ **Cada Pull Request** → Deploy de preview con URL única

✅ **Rollback fácil** → Desde el dashboard de Vercel

---

## 🔧 Configuraciones Adicionales (Opcional)

### Dominio Personalizado

1. En tu proyecto → **Settings** → **Domains**
2. Click en **"Add"**
3. Ingresa tu dominio: `tusitio.com`
4. Configura los DNS según las instrucciones

### Notificaciones

1. **Settings** → **Git** → **Deploy Hooks**
2. Configura webhooks para:
   - Slack
   - Discord
   - Email

---

## 🐛 Troubleshooting Rápido

### ❌ "Build failed"

**Solución:**
```powershell
cd apps/client
pnpm install
pnpm build:vercel
```
Si funciona local, revisa las variables de entorno en Vercel.

### ❌ "Cannot find module"

**Solución:**
1. Ve a **Settings** → **General**
2. Verifica que **Install Command** sea: `pnpm install --no-frozen-lockfile`
3. Click en **"Redeploy"**

### ❌ "API not responding"

**Solución:**
1. Verifica las variables en Vercel
2. Actualiza el backend para permitir CORS desde tu dominio de Vercel:

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "https://ar-e-web.vercel.app",
    "https://ar-e-web-*.vercel.app",  # Para previews
]
```

### ❌ "404 on routes"

**Ya está resuelto** con el `vercel.json` que incluye:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 📊 Monitorear tu App

### Analytics
1. En tu proyecto → **Analytics**
2. Verás métricas de rendimiento en tiempo real

### Logs
1. **Deployments** → Selecciona un deploy
2. Click en **"View Build Logs"**

### Rollback
1. **Deployments** → Lista de todos los deploys
2. Click en tres puntos → **"Promote to Production"**

---

## 🎯 Comandos Git para Deploy

```powershell
# Hacer cambios
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# Ver el deploy automático en:
# https://vercel.com/[tu-usuario]/ar-e-web
```

---

## 📱 Deploy desde CLI (Alternativa)

```powershell
# Instalar Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy a producción
vercel --prod

# Ver logs en tiempo real
vercel logs --follow

# Listar todos los deploys
vercel list
```

---

## 📞 Links Útiles

- **Tu Dashboard**: https://vercel.com/dashboard
- **Documentación**: https://vercel.com/docs
- **Status de Vercel**: https://www.vercel-status.com/

---

## ✨ ¡Felicidades!

Tu aplicación cliente está ahora en producción con:

- ✅ Deploy automático
- ✅ HTTPS gratis
- ✅ CDN global
- ✅ Preview deployments
- ✅ Rollback instantáneo
- ✅ Analytics incluido

**🚀 ¡Listo para escalar!**
