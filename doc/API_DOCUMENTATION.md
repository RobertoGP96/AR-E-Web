# Documentación de la API - AR-E-Web Backend

## 🌐 URLs de Documentación en Render

### Principales
- **🎯 API Base**: `https://tu-app-name.onrender.com/arye_system/`
- **📋 Swagger UI**: `https://tu-app-name.onrender.com/api/docs/`
- **📄 ReDoc**: `https://tu-app-name.onrender.com/api/redoc/`
- **👮 Admin Panel**: `https://tu-app-name.onrender.com/admin/`

### Schema
- **⚙️ OpenAPI Schema**: `https://tu-app-name.onrender.com/api/schema/`

## 🔐 Autenticación

### Obtener Token JWT
```http
POST /arye_system/auth/
Content-Type: application/json

{
    "username": "tu_usuario",
    "password": "tu_contraseña"
}
```

### Usar Token en Requests
```http
Authorization: Bearer tu_jwt_token_aqui
```

### Refrescar Token
```http
POST /arye_system/auth/refresh/
Content-Type: application/json

{
    "refresh": "tu_refresh_token"
}
```

## 📊 Endpoints Principales

### 👥 Usuarios
- `GET /arye_system/api_data/user/` - Listar usuarios
- `POST /arye_system/api_data/user/` - Crear usuario
- `GET /arye_system/api_data/user/{id}/` - Detalle usuario
- `PUT /arye_system/api_data/user/{id}/` - Actualizar usuario
- `DELETE /arye_system/api_data/user/{id}/` - Eliminar usuario

### 🛒 Pedidos (Orders)
- `GET /arye_system/api_data/order/` - Listar pedidos
- `POST /arye_system/api_data/order/` - Crear pedido
- `GET /arye_system/api_data/order/{id}/` - Detalle pedido
- `PUT /arye_system/api_data/order/{id}/` - Actualizar pedido
- `DELETE /arye_system/api_data/order/{id}/` - Eliminar pedido

### 🏪 Tiendas (Shops)
- `GET /arye_system/api_data/shop/` - Listar tiendas
- `POST /arye_system/api_data/shop/` - Crear tienda
- `GET /arye_system/api_data/shop/{id}/` - Detalle tienda
- `PUT /arye_system/api_data/shop/{id}/` - Actualizar tienda
- `DELETE /arye_system/api_data/shop/{id}/` - Eliminar tienda

### 💳 Cuentas de Compra
- `GET /arye_system/api_data/buying_account/` - Listar cuentas
- `POST /arye_system/api_data/buying_account/` - Crear cuenta
- `GET /arye_system/api_data/buying_account/{id}/` - Detalle cuenta

### ℹ️ Información Común
- `GET /arye_system/api_data/common_information/` - Información del sistema
- `POST /arye_system/api_data/common_information/` - Crear información

### 📦 Productos
- `GET /arye_system/api_data/product/` - Listar productos
- `POST /arye_system/api_data/product/` - Crear producto
- `GET /arye_system/api_data/product/{id}/` - Detalle producto

### 🧾 Recibos de Compra
- `GET /arye_system/api_data/shopping_reciep/` - Listar recibos
- `POST /arye_system/api_data/shopping_reciep/` - Crear recibo

### 🛍️ Productos Comprados
- `GET /arye_system/api_data/buyed_product/` - Productos comprados
- `POST /arye_system/api_data/buyed_product/` - Registrar compra

### 🚚 Recibos de Entrega
- `GET /arye_system/api_data/deliver_reciep/` - Recibos de entrega
- `POST /arye_system/api_data/deliver_reciep/` - Crear recibo entrega

### ✅ Productos Recibidos
- `GET /arye_system/api_data/product_received/` - Productos recibidos
- `POST /arye_system/api_data/product_received/` - Confirmar recepción

### 📦 Paquetes
- `GET /arye_system/api_data/package/` - Listar paquetes
- `POST /arye_system/api_data/package/` - Crear paquete

### � Notificaciones
- `GET /arye_system/api_data/notifications/` - Listar notificaciones del usuario
- `GET /arye_system/api_data/notifications/{id}/` - Detalle de notificación
- `DELETE /arye_system/api_data/notifications/{id}/` - Eliminar notificación
- `POST /arye_system/api_data/notifications/{id}/mark_as_read/` - Marcar notificación como leída
- `POST /arye_system/api_data/notifications/{id}/mark_as_unread/` - Marcar notificación como no leída
- `POST /arye_system/api_data/notifications/mark_all_as_read/` - Marcar múltiples notificaciones como leídas
- `GET /arye_system/api_data/notifications/unread/` - Obtener notificaciones no leídas
- `GET /arye_system/api_data/notifications/unread_count/` - Conteo de notificaciones no leídas
- `GET /arye_system/api_data/notifications/stats/` - Estadísticas de notificaciones
- `DELETE /arye_system/api_data/notifications/clear_read/` - Eliminar notificaciones leídas
- `DELETE /arye_system/api_data/notifications/clear_all/` - Eliminar todas las notificaciones
- `GET /arye_system/api_data/notifications/throttle_stats/` - Estadísticas de límites de notificaciones
- `GET /arye_system/api_data/notifications/grouped/` - Notificaciones agrupadas
- `GET /arye_system/api_data/notifications/groups/{group_id}/expand/` - Expandir grupo de notificaciones
- `POST /arye_system/api_data/notifications/groups/{group_id}/mark-read/` - Marcar grupo como leído

### ⚙️ Preferencias de Notificación
- `GET /arye_system/api_data/notification-preferences/` - Obtener preferencias del usuario
- `PUT/PATCH /arye_system/api_data/notification-preferences/update_preferences/` - Actualizar preferencias
- `GET /arye_system/api_data/notification-preferences/notification_types/` - Tipos de notificación disponibles
- `POST /arye_system/api_data/notification-preferences/reset_to_defaults/` - Restablecer preferencias a valores por defecto

## �🛠️ Utilidades

### 🖼️ Subida de Imágenes
```http
POST /arye_system/image_upload/
Content-Type: multipart/form-data

{
    "image": archivo_imagen
}
```

### 🔒 Seguridad
- `POST /arye_system/security/` - Gestión de seguridad

### 📧 Recuperación de Contraseña
- `GET/POST /arye_system/password/{password_secret}` - Recuperar contraseña

### ✉️ Verificación de Usuario
- `GET /arye_system/verify_user/{verification_secret}` - Verificar usuario

### 📡 Notificaciones en Tiempo Real (SSE)
```http
GET /arye_system/api_data/notifications/stream/
```

**Uso desde frontend:**
```javascript
const eventSource = new EventSource('/arye_system/api_data/notifications/stream');

eventSource.addEventListener('notification', (event) => {
    const data = JSON.parse(event.data);
    console.log('Nueva notificación:', data);
});

eventSource.addEventListener('heartbeat', (event) => {
    console.log('Heartbeat recibido');
});

eventSource.addEventListener('error', (event) => {
    console.error('Error en SSE:', event);
});
```

### 🖼️ Subida de Imágenes
```http
POST /arye_system/image_upload/
Content-Type: multipart/form-data

{
    "image": archivo_imagen
}
```

### 🔒 Seguridad
- `POST /arye_system/security/` - Gestión de seguridad

### 📧 Recuperación de Contraseña
- `GET/POST /arye_system/password/{password_secret}` - Recuperar contraseña

### ✉️ Verificación de Usuario
- `GET /arye_system/verify_user/{verification_secret}` - Verificar usuario

## 🎛️ Funcionalidades de la Documentación Swagger

### En la interfaz Swagger podrás:
1. **🔍 Explorar todos los endpoints** - Con descripciones detalladas
2. **🧪 Probar endpoints directamente** - Sin necesidad de herramientas externas
3. **🔐 Autenticarte con JWT** - Usar el botón "Authorize"
4. **📋 Ver ejemplos de requests/responses** - Para cada endpoint
5. **📊 Filtrar y buscar endpoints** - Por nombre o funcionalidad
6. **📖 Ver modelos de datos** - Estructuras de objetos de la API
7. **🔔 Gestionar notificaciones** - Ver, marcar como leídas y configurar preferencias
8. **📡 Probar notificaciones en tiempo real** - Conexión SSE para eventos en vivo

## 🔧 Configuración para Frontend

### Para conectar tu frontend React/Vue/Angular:
```javascript
const API_BASE_URL = 'https://tu-app-name.onrender.com/arye_system/api_data/'
const AUTH_URL = 'https://tu-app-name.onrender.com/arye_system/auth/'
```

### Ejemplo de configuración con Axios:
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://tu-app-name.onrender.com/arye_system/',
  headers: {
    'Content-Type': 'application/json',
  }
})

// Interceptor para agregar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Configuración para notificaciones en tiempo real
const setupNotifications = () => {
  const eventSource = new EventSource('/arye_system/api_data/notifications/stream')
  
  eventSource.addEventListener('notification', (event) => {
    const notification = JSON.parse(event.data)
    // Mostrar notificación al usuario
    showNotification(notification)
  })
  
  eventSource.addEventListener('error', (event) => {
    console.error('Error en conexión SSE:', event)
  })
  
  return eventSource
}
```

## 📝 Notas Importantes

1. **🔒 Autenticación requerida**: La mayoría de endpoints requieren autenticación JWT
2. **📄 Paginación**: Los listados están paginados
3. **🔍 Filtros**: Muchos endpoints soportan filtrado, búsqueda y ordenamiento
4. **📊 Formatos**: La API acepta y devuelve JSON
5. **🌐 CORS**: Configurado para permitir requests desde tu frontend
6. **🔔 Notificaciones**: Sistema completo de notificaciones con tiempo real vía SSE
7. **⚙️ Preferencias**: Los usuarios pueden configurar qué notificaciones recibir

## 🆘 Solución de Problemas

### Si no puedes acceder a la documentación:
1. Verifica que el despliegue en Render esté completo
2. Asegúrate de usar `https://` no `http://`
3. Verifica las variables de entorno en Render
4. Revisa los logs de despliegue en Render Dashboard

### Para desarrollo local:
- Documentación local: `http://localhost:8000/api/docs/`
- Admin local: `http://localhost:8000/admin/`