# 🚀 Guía de Deploy Automático en Vercel - Aplicación Cliente

## 📋 Configuración Actual

Tu proyecto ya tiene la configuración necesaria:
- ✅ `vercel.json` configurado
- ✅ `.vercelignore` para excluir archivos innecesarios
- ✅ Scripts de build en `package.json`
- ✅ Variables de entorno en `.env.production`

---

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Asegúrate de que el código esté en GitHub

```powershell
# Verifica el estado del repositorio
git status

# Agrega cambios pendientes
git add .

# Commit
git commit -m "chore: prepare for Vercel deployment"

# Push a GitHub
git push origin main
```

**Repositorio actual**: `RobertoGP96/AR-E-Web`

---

## 🌐 Paso 2: Configurar Proyecto en Vercel

### 2.1 Acceder a Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com)
2. Haz login con tu cuenta de GitHub
3. Click en **"Add New..."** → **"Project"**

### 2.2 Importar Repositorio

1. Busca y selecciona el repositorio: **`AR-E-Web`**
2. Click en **"Import"**

### 2.3 Configurar el Proyecto

En la página de configuración, usa estos valores:

#### **Framework Preset**
```
Vite
```

#### **Root Directory**
```
./
```
⚠️ **NO** selecciones ningún subdirectorio, deja la raíz

#### **Build and Output Settings**

| Campo | Valor |
|-------|-------|
| **Build Command** | `cd apps/client && pnpm build:vercel` |
| **Output Directory** | `apps/client/dist` |
| **Install Command** | `pnpm install --no-frozen-lockfile` |

#### **Node.js Version**
```
18.x
```

---

## 🔐 Paso 3: Configurar Variables de Entorno

En la sección **"Environment Variables"**, añade estas variables:

### Variables Requeridas:

| Nombre | Valor | Entorno |
|--------|-------|---------|
| `VITE_API_URL` | `https://ar-e-web.onrender.com/arye_system` | Production |
| `VITE_APP_ENV` | `production` | Production |
| `VITE_APP_NAME` | `AR-E-Web Client` | Production |
| `VITE_ENABLE_ANALYTICS` | `true` | Production |
| `VITE_DEBUG` | `false` | Production |
| `VITE_DEPLOY_TARGET` | `vercel` | Production |

### Cómo añadir variables:

1. En cada variable:
   - **Key**: Nombre de la variable (ej: `VITE_API_URL`)
   - **Value**: El valor correspondiente
   - **Environments**: Selecciona **Production**, **Preview**, y **Development**

2. Click en **"Add"** para cada variable

---

## 🚀 Paso 4: Deploy

1. Revisa toda la configuración
2. Click en **"Deploy"**
3. Espera a que termine el build (2-5 minutos)

### Durante el Deploy verás:

```
Running "pnpm install --no-frozen-lockfile"
✓ Dependencies installed

Running "cd apps/client && pnpm build:vercel"
✓ Type checking...
✓ Building with Vite...
✓ Build completed

✓ Deployment ready
```

---

## ✅ Paso 5: Verificar el Deploy

Una vez completado, Vercel te dará:

- **URL de Producción**: `https://ar-e-web.vercel.app` (o similar)
- **URL Preview**: Para cada pull request

### Pruebas Post-Deploy:

1. Accede a la URL proporcionada
2. Verifica que la aplicación carga correctamente
3. Prueba la conexión con el backend
4. Verifica que las rutas funcionan (React Router)

---

## 🔄 Deploy Automático Configurado

### Cómo funciona:

#### **Deploy a Producción**
- Cada `git push` a la rama **`main`** → Deploy automático a producción

#### **Deploy Preview**
- Cada Pull Request → Deploy de preview con URL única
- Comentario automático en el PR con la URL

#### **Deploy Manual**
- Desde el dashboard de Vercel → Botón "Redeploy"

---

## 🔧 Configuración Adicional (Opcional)

### Custom Domain

1. En Vercel Dashboard → Tu proyecto → **Settings** → **Domains**
2. Click en **"Add"**
3. Ingresa tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

### Configurar Notificaciones

1. **Settings** → **Notifications**
2. Configura notificaciones en:
   - Email
   - Slack
   - Discord

### Build Performance

La configuración actual ya incluye:
- ✅ Cache de dependencias
- ✅ Chunks optimizados
- ✅ Compresión automática
- ✅ CDN global

---

## 🐛 Troubleshooting

### Error: "Build failed"

**Verifica localmente:**
```powershell
cd apps/client
pnpm install
pnpm type-check
pnpm build:vercel
```

### Error: "Module not found"

**Solución**: Verifica que todas las dependencias estén en `package.json`:
```powershell
pnpm install
```

### Error: API no responde

**Verifica**:
1. Variables de entorno correctas en Vercel
2. CORS configurado en el backend para el dominio de Vercel

### Build muy lento

**Optimizaciones**:
1. Vercel usa cache automático
2. Si persiste, revisa las dependencias en `package.json`

---

## 📊 Monitoreo

### Analytics de Vercel

1. En tu proyecto → **Analytics**
2. Verás:
   - Tiempo de carga
   - Visitantes
   - Errores
   - Core Web Vitals

### Logs

1. **Deployments** → Selecciona un deploy → **Build Logs**
2. Para runtime errors → **Functions** (si usas)

---

## 🔒 Seguridad

### Headers de Seguridad

Ya configurados en `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Variables de Entorno

- ✅ NUNCA expongas secrets en el código
- ✅ Usa el prefix `VITE_` para variables públicas
- ✅ Las variables privadas no se exponen al cliente

---

## 🔄 Actualizar el Backend

No olvides actualizar el backend para permitir requests desde Vercel:

### Backend: `config/settings.py`

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Desarrollo local
    "https://ar-e-web.vercel.app",  # Vercel producción
    "https://ar-e-web-*.vercel.app",  # Vercel previews
    # Añade tu dominio custom si lo tienes
]
```

---

## 📝 Comandos Útiles

### Vercel CLI (Opcional)

```powershell
# Instalar Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy manual desde local
vercel --prod

# Ver logs en tiempo real
vercel logs

# Ver información del proyecto
vercel inspect

# Listar deployments
vercel list
```

---

## 🎯 Checklist Final

Antes de hacer deploy, verifica:

- [ ] ✅ Código pusheado a GitHub (rama `main`)
- [ ] ✅ Build funciona localmente: `pnpm build:vercel`
- [ ] ✅ No hay errores de TypeScript: `pnpm type-check`
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Backend permite CORS desde Vercel
- [ ] ✅ `.env.production` con valores correctos
- [ ] ✅ `vercel.json` revisado
- [ ] ✅ Tests pasando (si los tienes)

---

## 📞 Soporte

### Links Útiles:

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Documentación Vercel**: https://vercel.com/docs
- **Vercel CLI**: https://vercel.com/docs/cli
- **Vite + Vercel**: https://vercel.com/docs/frameworks/vite

### Tu Proyecto:

- **Repositorio**: https://github.com/RobertoGP96/AR-E-Web
- **Vercel**: https://vercel.com/[tu-username]/ar-e-web

---

## 🎉 ¡Listo!

Con esto tienes:
- ✅ Deploy automático en cada push a `main`
- ✅ Preview en cada Pull Request
- ✅ URL de producción estable
- ✅ CDN global
- ✅ SSL automático
- ✅ Rollback fácil
- ✅ Logs y analytics

**¡Tu aplicación cliente está lista para producción! 🚀**
