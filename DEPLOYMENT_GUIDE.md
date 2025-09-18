# Configuración de deployment para diferentes plataformas

## 🌐 CLOUDFLARE PAGES

### Client App
```bash
# Build settings en Cloudflare
Framework: Vite
Build command: cd apps/client && pnpm install && pnpm build
Build output: apps/client/dist
Root directory: /
Node version: 18

# Environment Variables
VITE_API_URL=https://your-backend.onrender.com/api
VITE_ADMIN_URL=https://admin.your-domain.com
VITE_APP_TITLE=AR-E Web
```

### Admin App  
```bash
# Build settings en Cloudflare
Framework: Vite
Build command: cd apps/admin && pnpm install && pnpm build
Build output: apps/admin/dist
Root directory: /
Node version: 18

# Environment Variables
VITE_API_URL=https://your-backend.onrender.com/api
VITE_CLIENT_URL=https://your-domain.com
VITE_ADMIN_TITLE=AR-E Admin
```

## 🐍 RENDER (Backend Django)

### Backend Settings
```bash
# Build Command
pip install -r requirements.txt

# Start Command  
cd backend && gunicorn config.wsgi:application

# Environment Variables
DEBUG=False
SECRET_KEY=your-production-secret
DATABASE_URL=postgresql://... (Render provides this)
ALLOWED_HOSTS=your-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com

# Static Files
STATIC_URL=/static/
STATIC_ROOT=/opt/render/project/src/staticfiles/
```

## 🐳 DOCKER (Opcional)

### Client Dockerfile
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/client/package.json ./apps/client/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY apps/client ./apps/client
RUN pnpm build:client

FROM nginx:alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## 📋 CHECKLIST DE DEPLOYMENT

### Antes del deployment:
- [ ] Configurar variables de entorno en cada plataforma
- [ ] Verificar CORS settings en Django
- [ ] Configurar dominios personalizados
- [ ] Setup SSL/TLS certificates
- [ ] Configurar CDN para assets estáticos

### Después del deployment:
- [ ] Verificar que todas las apps cargan correctamente
- [ ] Probar navegación entre client y admin
- [ ] Verificar API connections
- [ ] Configurar monitoring y logging
- [ ] Setup backup strategy para la BD

## 🔄 DEPLOYMENT AUTOMATIZADO

El workflow de GitHub Actions se ejecuta automáticamente cuando:
- Push a `main` → Deploy a producción
- Push a `develop` → Deploy a staging (si está configurado)
- Pull Request → Tests y builds de verificación

### Secrets requeridos en GitHub:
```
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
RENDER_API_KEY=your-render-key (opcional)
```