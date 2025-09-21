# Guía de Despliegue en Render - Proyecto AR-E-Web

## Problema Identificado
El error `cd: backend: No such file or directory` indica que Render no está configurado correctamente para encontrar el directorio backend.

## Soluciones Implementadas

### 1. Archivo render.yaml
Se creó un archivo `render.yaml` en la raíz del proyecto que especifica:
- **rootDir**: `backend` - Le dice a Render que use el directorio backend como raíz
- **buildCommand**: `./build.sh` - Script de construcción mejorado
- **startCommand**: `gunicorn config.wsgi:application` - Comando correcto sin `cd`

### 2. Script build.sh Mejorado
Se actualizó el script `build.sh` con:
- Debug logging para ver el directorio actual
- Mejor detección de la estructura del proyecto
- Upgrade de pip antes de instalar dependencias
- Manejo de errores mejorado

## Configuración en Render Dashboard

### Opción 1: Usar render.yaml (Recomendado)
1. Hacer commit de los cambios:
   ```bash
   git add .
   git commit -m "Add Render configuration and fix deployment"
   git push origin main
   ```

2. En Render Dashboard:
   - New → Web Service
   - Connect Repository: `AR-E-Web`
   - **Deploy from**: `main` branch
   - Render detectará automáticamente el archivo `render.yaml`

### Opción 2: Configuración Manual
Si prefieres configurar manualmente:

1. **Basic Settings:**
   - **Root Directory**: `backend`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application`

2. **Environment Variables:**
   ```
   SECRET_KEY=tu_clave_secreta_generada
   DEBUG=False
   ALLOWED_HOSTS=tu-app-name.onrender.com
   CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
   PYTHON_VERSION=3.12.0
   DJANGO_SETTINGS_MODULE=config.settings
   ```

3. **Database:**
   - Crear PostgreSQL service en Render
   - La variable `DATABASE_URL` se configurará automáticamente

## Verificación del Despliegue

Después del despliegue, verifica:

1. **Logs de Build**: Deben mostrar el directorio correcto y la instalación exitosa
2. **Endpoint principal**: `https://tu-app.onrender.com/api/`
3. **Admin panel**: `https://tu-app.onrender.com/admin/`
4. **API Documentation**: `https://tu-app.onrender.com/api/docs/`

## Comandos de Debug

Si necesitas debug adicional, puedes agregar al inicio del build.sh:
```bash
echo "=== DEBUG INFO ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"
echo "Directory contents:"
ls -la
echo "==================="
```

## Estructura Final Esperada

```
tu-repo/
├── render.yaml              # Configuración de Render
├── build.sh                 # Script de build mejorado
├── backend/                 # Django project
│   ├── manage.py
│   ├── requirements.txt
│   ├── build.sh            # Script alternativo (opcional)
│   └── config/
│       └── wsgi.py
└── apps/                   # Frontend apps
    ├── client/
    └── admin/
```

## Próximos Pasos

1. Hacer commit de los cambios
2. Crear nuevo Web Service en Render o actualizar el existente
3. Configurar variables de entorno
4. Crear y conectar base de datos PostgreSQL
5. Verificar el funcionamiento

## Notas Importantes

- **Root Directory**: Siempre debe apuntar a `backend`
- **Start Command**: No incluir `cd backend &&` si el Root Directory ya está configurado
- **Build Command**: Puede ser relativo al Root Directory
- **Variables de Entorno**: Configurar en Render Dashboard, no en archivos de código