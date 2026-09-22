# Configuración de Variables de Entorno

## Descripción General

El proyecto utiliza diferentes archivos de configuración para manejar las URLs del backend según el entorno de desarrollo.

## Estructura de Archivos de Configuración

### Cliente (`apps/client/`)

- **`.env`** - Configuración por defecto (usa backend desplegado)
- **`.env.local`** - Configuración local de desarrollo (gitignored)
- **`.env.production`** - Configuración para producción

### Admin (`apps/admin/`)

- **`.env`** - Configuración por defecto (usa backend desplegado)
- **`.env.local`** - Configuración local de desarrollo (gitignored)
- **`.env.production`** - Configuración para producción
- **`.env.example`** - Plantilla de ejemplo

## URLs de Backend Disponibles

### 🌐 Backend Desplegado (Recomendado)
```bash
VITE_API_URL=https://ar-e-web.onrender.com/arye_system
```

### 🏠 Backend Local
```bash
VITE_API_URL=http://localhost:8000/arye_system
```

## Configuración por Defecto

Por defecto, tanto el cliente como el admin están configurados para usar el **backend desplegado en Render**. Esto permite:

- ✅ Desarrollo sin necesidad de ejecutar el backend localmente
- ✅ Trabajo en equipo con datos compartidos
- ✅ Pruebas con datos reales
- ✅ Menor configuración inicial

## Cambiar a Backend Local

Si necesitas usar el backend local:

1. **Para desarrollo temporal:**
   - Edita `.env.local` en la carpeta correspondiente
   - Descomenta la línea del backend local
   - Comenta la línea del backend desplegado

2. **Para desarrollo permanente:**
   - Copia `.env.example` como `.env.local`
   - Configura `VITE_API_URL=http://localhost:8000/arye_system`

## Prioridad de Archivos

Vite carga los archivos en este orden (el último prevalece):

1. `.env`
2. `.env.local`
3. `.env.[mode]`
4. `.env.[mode].local`

## Comandos Útiles

### Verificar configuración actual:
```bash
# Cliente
cd apps/client
npm run dev

# Admin
cd apps/admin
npm run dev
```

### Verificar variables de entorno:
```bash
echo $VITE_API_URL
```

## Notas Importantes

- ⚠️ Los archivos `.env.local` están en `.gitignore` para evitar conflictos entre desarrolladores
- 🔒 Nunca commitees credenciales o URLs sensibles en archivos `.env` públicos
- 🚀 La configuración de producción siempre debe usar el backend desplegado
- 📝 Siempre documenta cambios en las URLs o configuraciones

## Troubleshooting

### Backend no responde:
1. Verifica que el backend esté desplegado y funcionando
2. Revisa las URLs en Network tab del navegador
3. Confirma que no hay errores de CORS

### Variables no se cargan:
1. Reinicia el servidor de desarrollo
2. Verifica que las variables empiecen con `VITE_`
3. Revisa la sintaxis del archivo `.env`