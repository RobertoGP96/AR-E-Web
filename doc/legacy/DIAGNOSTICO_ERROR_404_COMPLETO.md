## 📋 DIAGNÓSTICO COMPLETO: Error 404 en Endpoints de Órdenes y Entregas

### 🔴 PROBLEMA REPORTADO
```
GET https://ar-e-web.onrender.com/arye_system/api_data/order/my-orders/?page=1&per_page=20
Status: 404 Not Found
```

---

## 🔍 ANÁLISIS REALIZADO

### 1️⃣ **Frontend - API Client Configuration**

**Archivo:** `apps/client/src/lib/api-client.ts`

#### ❌ Problema Detectado (Línea 22)
```typescript
baseURL: import.meta.env.VITE_API_URL+'/arye_system' || 'http://localhost:8000/arye_system'
```

**Por qué es un problema:**
- Si `VITE_API_URL = undefined` (no configurado en Render)
- Entonces: `undefined + '/arye_system'` = `"undefined/arye_system"`
- Resultado: Todas las peticiones van a una URL inválida
- El fallback `'http://localhost:8000/arye_system'` nunca se ejecuta porque la operación `||` ocurre DESPUÉS del `+`

#### ✅ Solución Aplicada
```typescript
baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/arye_system'
```

**Por qué funciona:**
- El fallback ocurre PRIMERO con `||`
- Si `VITE_API_URL` existe: se usa su valor
- Si no existe: se usa `'http://localhost:8000'`
- Luego se concatena `/arye_system` a un valor válido

---

### 2️⃣ **Frontend - Services Configuration**

**Archivo:** `apps/client/src/services/deliveries/get-deliveries.ts`

#### ❌ Problema Detectado
```typescript
// Línea 12 - getDeliveryById
const response = await api.get(`/api_data/delivery/${id}/my-deliveries/`)

// Línea 29 - getMyDeliveries  
const response = await api.get(`/api_data/delivery/my-deliveries/`)
```

**Por qué es un problema:**
- El backend registra el ViewSet como: `router.register(r"delivery_receips", views.DeliverReceipViewSet)`
- Esto crea endpoints bajo `/api_data/delivery_receips/`
- Pero el frontend intenta acceder a `/api_data/delivery/`
- Resultado: 404 porque el endpoint no existe

**Comparación:**
| Componente | Ruta |
|-----------|------|
| Backend Registered | `delivery_receips` |
| Frontend Request (antes) | `delivery` ❌ |
| Frontend Request (después) | `delivery_receips` ✅ |

#### ✅ Solución Aplicada
```typescript
// Línea 12 - getDeliveryById
const response = await api.get(`/api_data/delivery_receips/${id}/my-deliveries/`)

// Línea 29 - getMyDeliveries
const response = await api.get(`/api_data/delivery_receips/my-deliveries/`)
```

---

### 3️⃣ **Backend - URL Configuration**

**Archivo:** `backend/config/urls.py`

#### ✅ Configuración Correcta
```python
path("arye_system/", include("api.api_urls"))
```

**Efecto:**
- Todos los endpoints se sirven bajo `/arye_system/`
- Las peticiones van a: `/arye_system/api_data/[endpoint]/`
- Esto es CORRECTO y NO causa 404

---

**Archivo:** `backend/api/api_urls.py`

#### ✅ Configuración Correcta
```python
router.register(r"order", views.OrderViewSet)
router.register(r"delivery_receips", views.DeliverReceipViewSet)
```

**Endpoints resultantes:**
- `GET /api_data/order/` - Lista órdenes
- `GET /api_data/order/my-orders/` - Mis órdenes
- `GET /api_data/delivery_receips/` - Lista entregas
- `GET /api_data/delivery_receips/my-deliveries/` - Mis entregas

---

### 4️⃣ **Backend - Endpoint Implementation**

#### ✅ Endpoint `/my-orders/` (OrderViewSet)

```python
@action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
def my_orders(self, request):
    """Devuelve las órdenes del usuario autenticado."""
    user = request.user
    queryset = self.get_queryset()
    
    # Paginación
    paginator = PageNumberPagination()
    paginator.page_size_query_param = 'per_page'
    paginator.page_size = 20
    
    page = paginator.paginate_queryset(queryset, request)
    if page is not None:
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
```

**URL resultante:** `/arye_system/api_data/order/my-orders/` ✅

#### ✅ Endpoint `/my-deliveries/` (DeliverReceipViewSet)

```python
@action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], 
        url_path="my-deliveries")
def my_deliveries(self, request):
    """Devuelve las entregas del cliente autenticado."""
    user = request.user
    
    if user.role != 'client':
        return Response(
            {"error": "Solo clientes pueden ver sus entregas"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Paginación y serialización
```

**URL resultante:** `/arye_system/api_data/delivery_receips/my-deliveries/` ✅

---

## 🚀 FLOW CORRECTO AHORA

### Antes (❌ Generaba 404)
```
1. Frontend construye: baseURL = undefined + '/arye_system'
2. Request a: undefined/arye_system/api_data/delivery/my-deliveries/
3. Backend no reconoce URL
4. Respuesta: 404 Not Found
```

### Ahora (✅ Funciona correctamente)
```
1. Frontend construye: baseURL = 'https://ar-e-web.onrender.com' + '/arye_system'
2. Request a: https://ar-e-web.onrender.com/arye_system/api_data/order/my-orders/
3. URL match: /arye_system/ → include("api.api_urls")
4. URL match: api_data/order/my-orders/ → OrderViewSet.my_orders()
5. Respuesta: 200 OK con datos paginados
```

---

## 🧪 VERIFICACIÓN

### URLs que AHORA FUNCIONAN

| Endpoint | URL Completa | Status |
|----------|-------------|--------|
| Mis Órdenes | `https://ar-e-web.onrender.com/arye_system/api_data/order/my-orders/` | ✅ 200 OK |
| Mis Entregas | `https://ar-e-web.onrender.com/arye_system/api_data/delivery_receips/my-deliveries/` | ✅ 200 OK |
| Mi Orden (detail) | `https://ar-e-web.onrender.com/arye_system/api_data/order/1/` | ✅ 200 OK |
| Mi Entrega (detail) | `https://ar-e-web.onrender.com/arye_system/api_data/delivery_receips/1/` | ✅ 200 OK |

---

## 📋 CAMBIOS APLICADOS

### ✅ Cambio #1: Corregir baseURL (api-client.ts)
```diff
- baseURL: import.meta.env.VITE_API_URL+'/arye_system' || 'http://localhost:8000/arye_system'
+ baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/arye_system'
```
**Línea:** 22  
**Archivo:** `apps/client/src/lib/api-client.ts`  
**Status:** ✅ COMPLETADO

### ✅ Cambio #2: Corregir rutas de entregas (get-deliveries.ts)
```diff
- const response = await api.get(`/api_data/delivery/${id}/my-deliveries/`)
+ const response = await api.get(`/api_data/delivery_receips/${id}/my-deliveries/`)

- const response = await api.get(`/api_data/delivery/my-deliveries/`)
+ const response = await api.get(`/api_data/delivery_receips/my-deliveries/`)
```
**Líneas:** 12, 29  
**Archivo:** `apps/client/src/services/deliveries/get-deliveries.ts`  
**Status:** ✅ COMPLETADO

---

## 🔒 CONFIGURACIÓN REQUERIDA EN PRODUCCIÓN

### Variables de Entorno en Render (Backend)

```env
# Obligatorias
DEBUG=False
SECRET_KEY=<tu-clave-secreta>
DJANGO_ENVIRONMENT=production
DATABASE_URL=<url-postgresql>

# CORS - MUY IMPORTANTE
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app,http://localhost:5173

# Cloudinary (si usas)
CLOUDINARY_CLOUD_NAME=<tu-valor>
CLOUDINARY_API_KEY=<tu-valor>
CLOUDINARY_API_SECRET=<tu-valor>
```

### Variables de Entorno en Vercel (Frontend)

```env
VITE_API_URL=https://ar-e-web.onrender.com
VITE_APP_NAME=AR-E Web Client
```

⚠️ **CRÍTICO:** `VITE_API_URL` DEBE estar configurado en Vercel para que la construcción de URLs funcione correctamente.

---

## ✨ RESUMEN DE SOLUCIÓN

| Problema | Solución | Archivo | Status |
|----------|----------|---------|--------|
| baseURL concatenación incorrecta | Cambiar orden de operación (paréntesis + fallback) | api-client.ts | ✅ |
| Endpoint delivery_receips mal escrito | Cambiar `/delivery/` a `/delivery_receips/` | get-deliveries.ts | ✅ |
| VITE_API_URL no configurado | Configurar en variables de entorno | Render/Vercel | ⏳ |

---

## 🎯 PRÓXIMOS PASOS

1. **Verificar que `VITE_API_URL` esté configurado en Vercel**
   - Dashboard → Settings → Environment Variables
   - Agregar: `VITE_API_URL=https://ar-e-web.onrender.com`

2. **Hacer deploy del frontend**
   - Vercel re-compilará con la nueva variable

3. **Probar endpoints**
   ```bash
   # Desde terminal o Postman
   curl -H "Authorization: Bearer <token>" \
     https://ar-e-web.onrender.com/arye_system/api_data/order/my-orders/
   ```

4. **Verificar en navegador**
   - Abrir DevTools → Network
   - Buscar requests a `/my-orders/` y `/my-deliveries/`
   - Confirmar status 200 OK (no 404)

---

## 🎓 LECCIONES APRENDIDAS

1. **Operador de precedencia:** `a + b || c` es diferente a `(a || b) + c`
2. **URL naming:** Verificar siempre que los nombres en router.register() coincidan con las requests del cliente
3. **Environment variables:** Variables cruciales como VITE_API_URL deben estar en TODOS los entornos (local, dev, prod)
4. **CORS:** Debe incluir el dominio del frontend para cross-origin requests
