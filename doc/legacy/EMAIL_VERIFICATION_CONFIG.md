# Configuración de Email de Verificación

## Estado Actual
El envío de emails de verificación está **DESHABILITADO** por defecto para facilitar el desarrollo.

## Cómo funciona

### 1. Configuración en Settings
Se han añadido las siguientes configuraciones en `settings.py`:

```python
# Website Configuration
WEB_SITE_NAME = config('WEB_SITE_NAME', default='AR-E Web Platform')
VERIFICATION_URL = config('VERIFICATION_URL', default='http://localhost:5173/verify?token=')

# Email sending configuration
ENABLE_EMAIL_VERIFICATION = config('ENABLE_EMAIL_VERIFICATION', default=False, cast=bool)
```

### 2. Función send_email mejorada
La función en `api/utils/email_sender.py` ahora:
- Verifica si `ENABLE_EMAIL_VERIFICATION` está habilitado
- Valida que todas las configuraciones necesarias estén presentes
- Maneja errores sin interrumpir el registro de usuarios
- Muestra logs informativos cuando está deshabilitado

### 3. Variables de Entorno
Añade estas variables a tu archivo `.env`:

```bash
# Website Configuration
WEB_SITE_NAME=AR-E Web Platform
VERIFICATION_URL=http://localhost:5173/verify?token=

# Email Verification (deshabilitado por defecto para desarrollo)
ENABLE_EMAIL_VERIFICATION=False
```

## Para Habilitar el Envío de Emails

1. Configura las credenciales de email en tu `.env`:
```bash
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-password-de-app
ENABLE_EMAIL_VERIFICATION=True
```

2. Asegúrate de tener instalado `resend`:
```bash
pip install resend
```

3. Configura la URL de verificación según tu dominio de producción:
```bash
VERIFICATION_URL=https://tu-dominio.com/verify?token=
```

## Desarrollo
Durante el desarrollo, cuando un usuario se registra:
- Se genera un token de verificación
- Se muestra en la consola del servidor: `"Email de verificación deshabilitado. Token para {usuario}: {token}"`
- El usuario se registra normalmente sin necesidad de verificación por email

## Resolución de Errores
Este cambio resuelve los siguientes errores:
- ❌ `'Settings' object has no attribute 'WEB_SITE_NAME'`
- ❌ `'Settings' object has no attribute 'VERIFICATION_URL'`
- ❌ Fallos en el registro cuando el servicio de email no está disponible

## Logs
Cuando el envío está deshabilitado, verás en la consola:
```
Email de verificación deshabilitado. Token para Juan: abc123def456...
```

Cuando está habilitado y se envía correctamente:
```
Email de verificación enviado a usuario@email.com
```

En caso de error:
```
Error enviando email de verificación: [detalle del error]
```