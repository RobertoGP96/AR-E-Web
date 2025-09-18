# Cloudflare Pages deployment configuration

## Build Settings
- **Framework**: Vite
- **Build command**: `cd apps/client && pnpm install && pnpm build`
- **Build output directory**: `apps/client/dist`
- **Root directory**: `/` (dejar vacío o poner `/`)

## Environment Variables (Configurar en Cloudflare Dashboard)
```
VITE_API_URL=https://tu-backend-url.com/api
VITE_APP_TITLE=Cliente App
NODE_VERSION=18
PNPM_VERSION=8
```

## Custom Domain (Opcional)
Si quieres usar un dominio personalizado:
1. Ve a **Pages > tu-proyecto > Custom domains**
2. Agrega tu dominio
3. Configura los DNS records en Cloudflare

## Headers y Security (Opcional)
Crear archivo `_headers` en `/apps/client/public/`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Deploy Commands
```bash
# Verificar build local
cd apps/client
pnpm install
pnpm build
pnpm preview

# Push a GitHub para deploy automático
git add .
git commit -m "feat: deploy configuration for Cloudflare Pages"
git push origin main
```