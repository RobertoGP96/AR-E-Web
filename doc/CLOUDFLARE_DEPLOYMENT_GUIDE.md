# 🚀 Guía de Despliegue para Cloudflare Pages

## Introducción
Esta guía te ayudará a desplegar la aplicación admin de AR-E-Web en Cloudflare Pages con configuraciones optimizadas para performance y seguridad.

## 📋 Prerequisitos

### 1. Cuenta de Cloudflare
- Registro en [Cloudflare Pages](https://pages.cloudflare.com/)
- Acceso al repositorio de GitHub

### 2. Herramientas locales
- Node.js v18 o superior
- pnpm instalado globalmente: `npm install -g pnpm`
- Git configurado

## 🛠️ Configuración del Proyecto

### 1. Variables de Entorno
Las variables están configuradas en `.env.production`. Principales variables:

```bash
VITE_API_URL=https://ar-e-web.onrender.com/arye_system
VITE_APP_MODE=production
VITE_CDN_URL=https://ar-e-web-admin.pages.dev
```

### 2. Configuración de Build
- **Framework**: Vite
- **Directorio de salida**: `dist`
- **Comando de build**: `pnpm build`
- **Node.js version**: 18.x

## 🚀 Proceso de Despliegue

### Opción 1: Despliegue Automático (Recomendado)

#### 1. Conectar Repositorio
1. Ve a [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Click en "Create a project"
3. Selecciona "Connect to Git"
4. Autoriza el acceso a tu repositorio GitHub
5. Selecciona el repositorio `AR-E-Web`

#### 2. Configurar Build Settings
```
Framework preset: None
Build command: pnpm build
Build output directory: dist
Root directory: apps/admin
Environment variables: 
- NODE_VERSION: 18
- PNPM_VERSION: 8
```

#### 3. Variables de Entorno en Cloudflare
En el panel de Cloudflare Pages, ve a Settings > Environment variables:

**Production Environment:**
```
VITE_API_URL=https://ar-e-web.onrender.com/arye_system
VITE_APP_MODE=production
VITE_APP_NAME=Arye System Admin
VITE_APP_VERSION=1.0.0
VITE_AUTH_TOKEN_KEY=access_token
VITE_REFRESH_TOKEN_KEY=refresh_token
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
VITE_ENABLE_API_LOGGING=false
VITE_ENABLE_ERROR_LOGGING=true
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,csv,xlsx
VITE_API_DOCS_URL=https://ar-e-web.onrender.com/api/docs/
VITE_API_SCHEMA_URL=https://ar-e-web.onrender.com/api/schema/
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPORT=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_DEFAULT_THEME=light
VITE_DEFAULT_LANGUAGE=es
VITE_CDN_URL=https://ar-e-web-admin.pages.dev
VITE_STATIC_ASSETS_URL=https://ar-e-web-admin.pages.dev/assets
VITE_ENABLE_PRELOAD=true
VITE_ENABLE_PREFETCH=true
```

### Opción 2: Despliegue Manual

#### 1. Build Local
```bash
# En el directorio apps/admin
cd apps/admin

# Windows
.\deploy-cloudflare.ps1

# Linux/Mac
chmod +x deploy-cloudflare.sh
./deploy-cloudflare.sh

# Windows (Batch)
deploy-cloudflare.bat
```

#### 2. Upload Manual
```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Autenticar con Cloudflare
wrangler login

# Deploy
wrangler pages publish dist --project-name=ar-e-web-admin
```

## ⚙️ Configuraciones Específicas

### 1. Headers de Seguridad
El archivo `public/_headers` incluye:
- Content Security Policy optimizada
- Headers de seguridad (XSS, CSRF protection)
- Cache control para assets estáticos
- Configuración CORS para el backend

### 2. Redirects y Reescrituras
El archivo `public/_redirects` configura:
- SPA routing (todas las rutas van a index.html)
- Proxy para API calls al backend
- Manejo de errores 404

### 3. Optimizaciones de Performance
- **Code splitting**: Chunks separados por vendor, UI, forms
- **Tree shaking**: Eliminación de código no usado
- **Minificación**: Optimizada para producción
- **Cache**: Headers específicos para assets estáticos
- **Preload/Prefetch**: Resources críticos cargados anticipadamente

## 🔧 Configuración Avanzada

### 1. Custom Domain
```bash
# En Cloudflare Pages Dashboard
1. Ve a Custom domains
2. Añade tu dominio (ej: admin.ar-e-web.com)
3. Configura los DNS records según las instrucciones
```

### 2. Analytics y Monitoring
```bash
# Cloudflare Web Analytics
1. Activa Web Analytics en el dashboard
2. El código se inyecta automáticamente
```

### 3. Performance Optimizations
```bash
# En Cloudflare Dashboard > Speed > Optimization
- Auto Minify: HTML, CSS, JS activado
- Brotli compression: Activado
- Early Hints: Activado
- Image optimization: Activado
```

## 🛡️ Seguridad

### 1. Headers de Seguridad
- **CSP**: Content Security Policy restrictiva
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Previene clickjacking
- **X-Content-Type-Options**: Previene MIME sniffing

### 2. Configuración CORS
```javascript
// Configurado en _headers para permitir comunicación con el backend
Access-Control-Allow-Origin: https://ar-e-web.onrender.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

## 📊 Monitoring y Mantenimiento

### 1. Logs y Analytics
- Cloudflare Analytics para tráfico
- Console.log desactivado en producción
- Error logging activado

### 2. Updates y CI/CD
```bash
# Auto-deploy desde main branch
1. Push changes to main branch
2. Cloudflare detecta cambios automáticamente
3. Ejecuta build y deploy
4. Preview URLs para branches de feature
```

### 3. Rollback
```bash
# En caso de problemas
1. Ve a Cloudflare Pages Dashboard
2. Deployments tab
3. Selecciona deployment anterior
4. Click "Rollback to this deployment"
```

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. Build Fails
```bash
# Verificar Node.js version
echo $NODE_VERSION  # Debe ser 18

# Limpiar cache
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check TypeScript errors
pnpm type-check
```

#### Error: terser not found
Si ves el error `terser not found. Since Vite v3, terser has become an optional dependency`:

```bash
# Solución: Instalar terser como devDependency
cd apps/admin
pnpm add -D terser

# O actualizar package.json para incluir:
"devDependencies": {
  "terser": "^5.36.0"
}

# Luego reinstalar dependencias
pnpm install
```

**Nota**: Este error es común en Cloudflare Pages porque `terser` es una dependencia opcional desde Vite v3.

#### 2. Assets No Cargan
```bash
# Verificar base path en vite.config.ts
base: '/'  # Para Cloudflare Pages

# Verificar _headers cache control
Cache-Control: public, max-age=31536000, immutable
```

#### 3. API Calls Fallan
```bash
# Verificar CORS en backend
# Verificar URL en .env.production
VITE_API_URL=https://ar-e-web.onrender.com/arye_system

# Verificar _redirects proxy
/api/*  https://ar-e-web.onrender.com/arye_system/:splat  200
```

#### 4. SPA Routing No Funciona
```bash
# Verificar _redirects
/*    /index.html   200  # Debe ser la primera regla
```

## 📝 Comandos Útiles

```bash
# Development
pnpm dev

# Build local
pnpm build

# Preview build
pnpm preview

# Type checking
pnpm type-check

# Linting
pnpm lint:fix

# Clean install
pnpm clean && pnpm install

# Deploy to Cloudflare (manual)
wrangler pages publish dist --project-name=ar-e-web-admin
```

## 🔗 Enlaces Importantes

- [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite Build Docs](https://vitejs.dev/guide/build.html)
- [Repositorio del Proyecto](https://github.com/RobertoGP96/AR-E-Web)

## 📞 Soporte

Para problemas específicos:
1. Revisa los logs en Cloudflare Pages Dashboard
2. Verifica las variables de entorno
3. Comprueba que el backend esté disponible
4. Revisa la configuración de DNS si usas dominio custom

---

**Última actualización**: Octubre 2024  
**Versión de la guía**: 1.0