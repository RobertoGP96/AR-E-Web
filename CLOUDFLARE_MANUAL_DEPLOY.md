# Cloudflare Pages - Manual Deploy Guide

## Opción 1: Dashboard Web (Recomendado)
1. Ve a https://dash.cloudflare.com
2. Pages → Create a project → Connect to Git
3. Selecciona tu repositorio: RobertoGP96/AR-E-Web
4. Configura:
   - Build command: `cd apps/client && pnpm install && pnpm build`
   - Build output directory: `apps/client/dist`
   - Root directory: `/`
   - Environment variables:
     - `VITE_APP_ENV`: `production`

## Opción 2: API Manual
```bash
# 1. Configurar variables de entorno
export CLOUDFLARE_API_TOKEN="tu_token_aqui"
export CLOUDFLARE_ACCOUNT_ID="tu_account_id_aqui"

# 2. Ejecutar script
./deploy-cloudflare-api.bat
```

## Opción 3: GitHub Actions
- Push cualquier cambio a main
- El workflow se ejecutará automáticamente
- Configura secrets en GitHub:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`

## URLs útiles:
- Dashboard: https://dash.cloudflare.com/
- API Token: https://dash.cloudflare.com/profile/api-tokens
- Documentación: https://developers.cloudflare.com/pages/

## Comandos de build locales:
```bash
cd apps/client
pnpm install
pnpm build
# Los archivos estarán en apps/client/dist
```