# Variables de Entorno para Cloudflare Pages

## Cómo añadir las variables en Cloudflare:

1. Ve a tu proyecto en Cloudflare Pages
2. Settings → Environment variables
3. Selecciona "Production" environment
4. Añade cada una de estas variables:

## Variables Requeridas:

```
NODE_VERSION = 18
PNPM_VERSION = 8

VITE_API_URL = https://ar-e-web.onrender.com/arye_system
VITE_APP_MODE = production
VITE_APP_NAME = Arye System Admin
VITE_APP_VERSION = 1.0.0

VITE_AUTH_TOKEN_KEY = access_token
VITE_REFRESH_TOKEN_KEY = refresh_token

VITE_API_TIMEOUT = 30000
VITE_API_RETRY_ATTEMPTS = 3

VITE_ENABLE_API_LOGGING = false
VITE_ENABLE_ERROR_LOGGING = true

VITE_DEFAULT_PAGE_SIZE = 20
VITE_MAX_PAGE_SIZE = 100

VITE_MAX_FILE_SIZE = 10485760
VITE_ALLOWED_FILE_TYPES = jpg,jpeg,png,pdf,csv,xlsx

VITE_API_DOCS_URL = https://ar-e-web.onrender.com/api/docs/
VITE_API_SCHEMA_URL = https://ar-e-web.onrender.com/api/schema/

VITE_ENABLE_ANALYTICS = true
VITE_ENABLE_EXPORT = true
VITE_ENABLE_NOTIFICATIONS = true

VITE_DEFAULT_THEME = light
VITE_DEFAULT_LANGUAGE = es

VITE_CDN_URL = https://ar-e-web-admin.pages.dev
VITE_STATIC_ASSETS_URL = https://ar-e-web-admin.pages.dev/assets

VITE_ENABLE_PRELOAD = true
VITE_ENABLE_PREFETCH = true
```

## Notas:
- Todas las variables con prefijo `VITE_` son accesibles en el código del cliente
- El `NODE_VERSION` y `PNPM_VERSION` son importantes para el build correcto
- Puedes ajustar `VITE_CDN_URL` con tu dominio personalizado después del despliegue
