# Guía Completa: Desplegar Django Backend en Render

## Resumen de lo configurado

✅ **build.sh** - Script de construcción para Render
✅ **settings.py** - Configurado para producción con PostgreSQL y WhiteNoise
✅ **Variables de entorno** - Documentadas en RENDER_ENV_VARS.md

## Pasos para desplegar

### 1. Preparar repositorio
```bash
git add .
git commit -m "Configure Django for Render deployment"
git push origin main
```

### 2. Crear cuenta en Render
- Ve a [render.com](https://render.com)
- Regístrate con GitHub
- Conecta el repositorio `AR-E-Web`

### 3. Crear Web Service
- Dashboard → New → Web Service
- Selecciona tu repositorio
- **Root Directory**: `backend`
- **Build Command**: `./build.sh`
- **Start Command**: `gunicorn config.wsgi:application`
- **Plan**: Free

### 4. Configurar variables de entorno
```
SECRET_KEY=genera_una_nueva_clave_secreta
DEBUG=False
ALLOWED_HOSTS=tu-app-name.onrender.com
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
```

### 5. Crear PostgreSQL Database
- Dashboard → New → PostgreSQL
- **Name**: tu-tienda-db
- **Plan**: Free
- Copia la External Database URL

### 6. Conectar Database
- En Web Service → Environment
- Agregar: `DATABASE_URL=postgresql://...`

## URLs finales
- **API**: `https://tu-app-name.onrender.com`
- **Admin**: `https://tu-app-name.onrender.com/admin/`
- **API Docs**: `https://tu-app-name.onrender.com/api/docs/`

## Verificar funcionamiento
1. Ve a tu URL de la API
2. Verifica endpoint: `/api/auth/` 
3. Accede al admin con superuser
4. Revisa la documentación automática de la API

## Consideraciones importantes
- **Plan gratuito**: Se suspende después de 15 min de inactividad
- **Base de datos**: El plan gratuito tiene límites de almacenamiento
- **Escalabilidad**: Puedes upgrader a plan pagado cuando necesites más recursos

## Conectar con frontend
En tu app React/Vite, actualiza la URL base:
```typescript
const API_BASE_URL = 'https://tu-app-name.onrender.com/api/'
```