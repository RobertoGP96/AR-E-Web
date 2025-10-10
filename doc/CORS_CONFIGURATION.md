# Configuración de Variables de Entorno para CORS en Render

## 🔧 Variables de Entorno Necesarias en Render Dashboard

### CORS_ALLOWED_ORIGINS
Esta variable define qué dominios pueden acceder a tu API desde el navegador.

```
CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com,https://tu-frontend.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

### Ejemplos según el entorno:

#### 🚀 Producción (Render + Vercel)
```
CORS_ALLOWED_ORIGINS=https://mi-tienda-api.onrender.com,https://mi-tienda.vercel.app,https://www.mi-tienda.com
```

#### 🧪 Desarrollo + Producción
```
CORS_ALLOWED_ORIGINS=https://mi-tienda-api.onrender.com,https://mi-tienda.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

#### 🌍 Permitir todos los dominios (SOLO para desarrollo/testing)
```
CORS_ALLOW_ALL_ORIGINS=True
```

## 📝 Pasos para Configurar en Render:

### 1. En Render Dashboard
1. Ve a tu Web Service
2. Haz clic en "Environment"
3. Agrega las siguientes variables:

```
SECRET_KEY=tu_clave_secreta_segura
DEBUG=False
ALLOWED_HOSTS=tu-app-name.onrender.com
CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com,https://tu-frontend.vercel.app
```

### 2. Variables CORS Específicas

#### Para acceso desde navegador directo:
```
CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com
```

#### Para acceso desde frontend en Vercel:
```
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
```

#### Para desarrollo local + producción:
```
CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com,https://tu-frontend.vercel.app,http://localhost:5173,http://localhost:3000
```

## 🔍 Casos de Uso Específicos:

### Ver documentación Swagger desde navegador:
```
CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com
```

### Conectar frontend React/Vue desde Vercel:
```
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
```

### Desarrollo local con Vite:
```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Desarrollo local con Create React App:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## ⚠️ Configuraciones Especiales:

### Para permitir subdominios:
```python
# En settings.py (no como variable de entorno)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.tu-dominio\.com$",
]
```

### Para desarrollo rápido (NO usar en producción):
```
CORS_ALLOW_ALL_ORIGINS=True
```

## 🛠️ Ejemplo Completo de Variables en Render:

```
# Básicas
SECRET_KEY=django-insecure-CAMBIA-ESTO-POR-UNA-CLAVE-SEGURA
DEBUG=False
ALLOWED_HOSTS=mi-tienda-api.onrender.com

# CORS
CORS_ALLOWED_ORIGINS=https://mi-tienda-api.onrender.com,https://mi-tienda.vercel.app,http://localhost:5173

# Base de datos (se configura automáticamente con PostgreSQL)
DATABASE_URL=postgresql://...

# Opcional
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## 🧪 Cómo Probar CORS:

### 1. Desde el navegador:
```javascript
// Abre la consola del navegador en https://tu-app.onrender.com/api/docs/
fetch('https://tu-app.onrender.com/arye_system/api_data/user/')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('CORS Error:', error));
```

### 2. Desde tu frontend:
```javascript
// En tu app React/Vue/Angular
const API_URL = 'https://tu-app.onrender.com/arye_system/'

fetch(`${API_URL}api_data/user/`)
  .then(response => response.json())
  .then(data => console.log(data))
```

## 🚨 Errores Comunes y Soluciones:

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solución:** Agregar tu dominio a `CORS_ALLOWED_ORIGINS`

### Error: "CORS policy: The request client is not a secure context"
**Solución:** Usar `https://` en lugar de `http://` en producción

### Error: "CORS policy: Credentials mode"
**Solución:** Ya está configurado `CORS_ALLOW_CREDENTIALS=True`

## 🔒 Seguridad:

### ✅ Buenas prácticas:
- Usar dominios específicos en lugar de `*`
- Usar `https://` en producción
- No usar `CORS_ALLOW_ALL_ORIGINS=True` en producción

### ❌ Evitar en producción:
- `CORS_ALLOW_ALL_ORIGINS=True`
- Dominios con `http://` (excepto localhost para desarrollo)
- Wildcard `*` en `CORS_ALLOWED_ORIGINS`