# VARIABLES DE ENTORNO PARA RENDER

## Configuración Básica
- `SECRET_KEY`: Clave secreta de Django (generar una nueva para producción)
- `DEBUG`: Establecer en `False` para producción
- `ALLOWED_HOSTS`: Dominio de tu app en Render (ej: `tu-app.onrender.com`)

## Base de Datos
- `DATABASE_URL`: Se genera automáticamente cuando creates el servicio PostgreSQL en Render

## CORS (Cross-Origin Resource Sharing) - IMPORTANTE PARA NAVEGADOR
- `CORS_ALLOWED_ORIGINS`: URLs permitidas para hacer requests al API
  - **Para ver documentación Swagger**: `https://tu-app.onrender.com`
  - **Para frontend en Vercel**: `https://tu-frontend.vercel.app`
  - **Para desarrollo local**: `http://localhost:5173,http://localhost:3000`
  - **Combinado**: `https://tu-app.onrender.com,https://tu-frontend.vercel.app,http://localhost:5173`

- `CORS_ALLOW_ALL_ORIGINS`: Establecer en `True` SOLO para desarrollo/testing (NO en producción)

## JWT Tokens (Opcional)
- `ACCESS_TOKEN_LIFETIME_MINUTES`: Duración del token de acceso (default: 60)
- `REFRESH_TOKEN_LIFETIME_DAYS`: Duración del token de refresco (default: 7)

## Cloudinary (Para imágenes)
- `CLOUDINARY_CLOUD_NAME`: Nombre de tu cloud de Cloudinary
- `CLOUDINARY_API_KEY`: API Key de Cloudinary
- `CLOUDINARY_API_SECRET`: API Secret de Cloudinary

## Email (Opcional)
- `EMAIL_HOST_USER`: Tu email de Gmail
- `EMAIL_HOST_PASSWORD`: App Password de Gmail (no tu contraseña normal)

## Ejemplo de valores:
```
SECRET_KEY=django-insecure-ejemplo-cambiar-en-produccion
DEBUG=False
ALLOWED_HOSTS=mi-tienda-api.onrender.com
CORS_ALLOWED_ORIGINS=https://mi-tienda.vercel.app,http://localhost:5173
```