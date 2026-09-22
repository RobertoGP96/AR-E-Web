# 🔧 Actualización del Backend para Vercel Deploy

## ⚠️ IMPORTANTE: Configurar CORS en el Backend

Después de hacer el deploy en Vercel, debes actualizar el backend para permitir requests desde tu nuevo dominio.

---

## 📝 Paso 1: Obtener tu URL de Vercel

Después del primer deploy, Vercel te dará una URL como:
```
https://ar-e-web.vercel.app
```

También genera URLs para previews:
```
https://ar-e-web-git-[branch].vercel.app
https://ar-e-web-[hash].vercel.app
```

---

## 🔧 Paso 2: Actualizar Backend

### Archivo: `backend/config/settings.py`

Busca la sección de CORS y actualízala:

```python
# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    # Desarrollo local
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    
    # Admin app (Cloudflare)
    "https://ar-e-web-admin.pages.dev",
    "https://admin.ar-e-web.com",  # Si tienes dominio custom
    
    # Client app (Vercel) - AÑADE ESTAS LÍNEAS
    "https://ar-e-web.vercel.app",
    
    # IMPORTANTE: Permite todos los deploys de preview
    # Opción 1: Lista específica (más seguro)
    "https://ar-e-web-git-main.vercel.app",
    "https://ar-e-web-git-develop.vercel.app",
    
    # Opción 2: Usar regex en CORS_ALLOWED_ORIGIN_REGEXES (recomendado)
]

# Para permitir TODAS las URLs de preview de Vercel
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://ar-e-web-.*\.vercel\.app$",
    r"^https://.*\.vercel\.app$",  # Si tienes múltiples proyectos
]

# Configuración adicional de CORS
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

---

## 🔒 Opción Segura (Recomendada)

Si prefieres más control, usa esta configuración:

```python
# backend/config/settings.py

# Lista blanca de orígenes permitidos
ALLOWED_CLIENT_ORIGINS = [
    # Local
    "http://localhost:5173",
    # Vercel Production
    "https://ar-e-web.vercel.app",
]

# Patterns para deploys de preview
ALLOWED_PREVIEW_PATTERNS = [
    r"^https://ar-e-web-.*\.vercel\.app$",
]

# Combinar en CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS = ALLOWED_CLIENT_ORIGINS

# Patterns de regex
CORS_ALLOWED_ORIGIN_REGEXES = ALLOWED_PREVIEW_PATTERNS
```

---

## 🧪 Paso 3: Verificar la Configuración

### Prueba Local:

```powershell
cd backend

# Activar entorno virtual
.venv\Scripts\activate

# Ejecutar servidor
python manage.py runserver

# En otra terminal, prueba el CORS:
curl -H "Origin: https://ar-e-web.vercel.app" `
     -H "Access-Control-Request-Method: GET" `
     -X OPTIONS http://localhost:8000/arye_system/shops/
```

Deberías ver headers de CORS en la respuesta.

---

## 🚀 Paso 4: Deploy del Backend

### Si usas Render.com:

1. **Commit y Push:**
```powershell
cd backend
git add config/settings.py
git commit -m "feat: add CORS for Vercel domain"
git push origin main
```

2. **Deploy Automático:**
   - Render detectará el push y hará deploy automáticamente

3. **Verificar:**
   - Ve a Render Dashboard
   - Verifica que el deploy se completó
   - Revisa los logs

### Si usas Railway/Heroku:

Similar al proceso de Render, el deploy es automático.

---

## ✅ Paso 5: Verificar desde Vercel

Una vez que tu app esté en Vercel:

1. Abre la URL de tu app: `https://ar-e-web.vercel.app`
2. Abre DevTools (F12) → Network tab
3. Intenta hacer una acción que llame al backend
4. Verifica que:
   - ✅ La request se completa sin errores
   - ✅ Los headers CORS están presentes
   - ✅ No hay errores de CORS en la consola

---

## 🐛 Troubleshooting

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa**: Backend no tiene configurado el dominio de Vercel

**Solución**:
1. Verifica que el dominio esté en `CORS_ALLOWED_ORIGINS`
2. O que el patrón regex en `CORS_ALLOWED_ORIGIN_REGEXES` lo cubra
3. Redeploy el backend

### Error: "CORS policy: The request client is not a secure context"

**Causa**: Estás intentando hacer requests HTTP desde HTTPS

**Solución**:
- Asegúrate de que `VITE_API_URL` use `https://` no `http://`

### Error: Funciona en local pero no en Vercel

**Revisa**:
1. Variables de entorno en Vercel (`VITE_API_URL`)
2. Backend permite el dominio de Vercel
3. El backend está en HTTPS (no HTTP)

---

## 📋 Variables de Entorno del Cliente

Asegúrate de que en Vercel tienes:

```env
VITE_API_URL=https://ar-e-web.onrender.com/arye_system
```

⚠️ **IMPORTANTE**: 
- Usa `https://` (no `http://`)
- No incluyas barra final `/` si tu backend no la espera
- El path debe coincidir con tu configuración de Django

---

## 🔐 Seguridad Adicional

### Rate Limiting (Opcional pero Recomendado)

Instala `django-ratelimit`:

```bash
pip install django-ratelimit
```

En tu backend:

```python
# backend/config/settings.py

MIDDLEWARE = [
    # ... otros middlewares
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Debe estar arriba
    # ... resto de middlewares
]

# Rate limiting
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
```

### CSRF Protection

```python
# backend/config/settings.py

CSRF_TRUSTED_ORIGINS = [
    "https://ar-e-web.vercel.app",
    "https://*.vercel.app",
]

# Para APIs REST sin CSRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

---

## 📊 Monitoreo

### Logs del Backend

```python
# backend/config/settings.py

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/cors.log',
        },
    },
    'loggers': {
        'corsheaders': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

---

## ✨ Checklist Final

Después de actualizar el backend:

- [ ] ✅ `CORS_ALLOWED_ORIGINS` incluye dominio de Vercel
- [ ] ✅ `CORS_ALLOWED_ORIGIN_REGEXES` para previews (opcional)
- [ ] ✅ `CSRF_TRUSTED_ORIGINS` configurado
- [ ] ✅ Backend redeployado
- [ ] ✅ Verificado desde Vercel que funciona
- [ ] ✅ No hay errores de CORS en DevTools
- [ ] ✅ Requests API funcionan correctamente

---

## 🎯 Resumen

1. **Obtén tu URL de Vercel** después del primer deploy
2. **Actualiza `backend/config/settings.py`** con CORS
3. **Push y redeploy el backend**
4. **Verifica que todo funcione** desde Vercel

**¡Listo! Tu stack completo está en producción! 🚀**
