# Guía de Filtros de Usuarios

## Resumen
Este documento explica cómo funcionan los filtros de usuarios entre el frontend (React) y el backend (Django REST Framework).

## Backend - Django REST Framework

### Configuración Global
Los filtros están configurados globalmente en `backend/config/settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',  # Filtros exactos por campos
        'rest_framework.filters.SearchFilter',                 # Búsqueda por texto
        'rest_framework.filters.OrderingFilter',               # Ordenamiento
    ],
    'PAGE_SIZE': 20,
}
```

### UserViewSet - Filtros Soportados

En `backend/api/views.py`, el `UserViewSet` está configurado con:

```python
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # Filtros configurados
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['name', 'last_name', 'email', 'phone_number']
    ordering_fields = ['id', 'name', 'date_joined']
    ordering = ['-date_joined']  # Más recientes primero
```

### Parámetros de Query Soportados

#### 1. Filtros Exactos (DjangoFilterBackend)
```
GET /api_data/user/?role=admin
GET /api_data/user/?is_active=true
GET /api_data/user/?is_verified=false
GET /api_data/user/?role=agent&is_active=true
```

**Valores válidos:**
- `role`: `'admin'`, `'agent'`, `'accountant'`, `'buyer'`, `'logistical'`, `'user'`
- `is_active`: `true` o `false` (booleano)
- `is_verified`: `true` o `false` (booleano)

#### 2. Búsqueda por Texto (SearchFilter)
```
GET /api_data/user/?search=roberto
GET /api_data/user/?search=example@email.com
GET /api_data/user/?search=+5355555555
```

El parámetro `search` busca en:
- `name` (nombre)
- `last_name` (apellido)
- `email` (correo electrónico)
- `phone_number` (número de teléfono)

**Nota:** La búsqueda es case-insensitive y busca coincidencias parciales.

#### 3. Ordenamiento (OrderingFilter)
```
GET /api_data/user/?ordering=name           # A-Z
GET /api_data/user/?ordering=-name          # Z-A
GET /api_data/user/?ordering=-date_joined   # Más recientes primero
```

#### 4. Paginación
```
GET /api_data/user/?page=1&page_size=20
```

### Ejemplos de URLs Completas

```bash
# Usuario activos y verificados
GET /api_data/user/?is_active=true&is_verified=true

# Agentes verificados, ordenados por nombre
GET /api_data/user/?role=agent&is_verified=true&ordering=name

# Buscar "roberto" entre usuarios activos
GET /api_data/user/?search=roberto&is_active=true

# Obtener admins, página 2
GET /api_data/user/?role=admin&page=2&page_size=10
```

## Frontend - React + TypeScript

### Tipos Definidos

En `apps/admin/src/types/api.ts`:

```typescript
export interface BaseFilters extends Record<string, unknown> {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserFilters extends BaseFilters {
  is_active?: boolean;
  is_verified?: boolean;
  role?: string;
  date_joined_from?: string;  // No implementado aún en backend
  date_joined_to?: string;    // No implementado aún en backend
}
```

### UserFilterState (Componente UI)

En `apps/admin/src/components/filters/user-filters.tsx`:

```typescript
export interface UserFilterState {
  role: 'all' | 'admin' | 'agent' | 'accountant' | 'buyer' | 'logistical' | 'user';
  isActive: 'all' | 'active' | 'inactive';
  isVerified: 'all' | 'verified' | 'unverified';
}
```

### Conversión de Filtros UI a Filtros API

En `apps/admin/src/pages/Users.tsx`:

```typescript
const apiFilters = useMemo(() => {
  const filters: {
    search?: string;
    role?: UserRole;
    is_active?: boolean;
    is_verified?: boolean;
  } = {};

  // Búsqueda por texto
  if (searchTerm) {
    filters.search = searchTerm;
  }

  // Filtro por rol (excluir 'all')
  if (userFilters.role !== 'all') {
    filters.role = userFilters.role as UserRole;
  }

  // Filtro por estado activo
  if (userFilters.isActive === 'active') {
    filters.is_active = true;
  } else if (userFilters.isActive === 'inactive') {
    filters.is_active = false;
  }

  // Filtro por estado verificado
  if (userFilters.isVerified === 'verified') {
    filters.is_verified = true;
  } else if (userFilters.isVerified === 'unverified') {
    filters.is_verified = false;
  }

  return filters;
}, [searchTerm, userFilters]);
```

### Envío de Filtros a la API

En `apps/admin/src/services/users/get-users.ts`:

```typescript
export const getUsers = async (filters?: UserFilters) => {
  // apiClient.getPaginated envía filtros como query params
  const response = await apiClient.getPaginated<CustomUser>('/api_data/user/', filters);
  return response;
};
```

El `apiClient.getPaginated` convierte automáticamente el objeto de filtros en query parameters:

```typescript
// Ejemplo: { role: 'admin', is_active: true, search: 'roberto' }
// Se convierte en: /api_data/user/?role=admin&is_active=true&search=roberto
```

## Correspondencia de Tipos

### ✅ Filtros Implementados Correctamente

| Frontend (UserFilters) | Backend (UserViewSet) | Query Param | Descripción |
|------------------------|----------------------|-------------|-------------|
| `role?: string` | `filterset_fields` | `role` | Filtra por rol exacto |
| `is_active?: boolean` | `filterset_fields` | `is_active` | Filtra por estado activo |
| `is_verified?: boolean` | `filterset_fields` | `is_verified` | Filtra por verificación |
| `search?: string` | `search_fields` | `search` | Búsqueda en nombre, email, teléfono |
| `page?: number` | Paginación DRF | `page` | Número de página |
| `per_page?: number` | Paginación DRF | `page_size` | Items por página |

### ⚠️ Filtros Definidos pero No Implementados

| Frontend | Backend | Estado |
|----------|---------|--------|
| `date_joined_from` | ❌ No implementado | Requiere filtro personalizado |
| `date_joined_to` | ❌ No implementado | Requiere filtro personalizado |
| `sort_by` / `sort_order` | ✅ Implementado como `ordering` | Diferente sintaxis |

## Depuración

### Console Logs Agregados

1. **En `Users.tsx`:**
```typescript
console.log('🔍 Filtros aplicados:', apiFilters);
```

2. **En `get-users.ts`:**
```typescript
console.log('🌐 getUsers - Filtros recibidos:', filters);
```

### Verificar Request en DevTools

1. Abrir DevTools (F12)
2. Ir a la pestaña **Network**
3. Filtrar por **XHR** o **Fetch**
4. Buscar requests a `/api_data/user/`
5. Verificar la URL completa con query params

Ejemplo esperado:
```
http://127.0.0.1:8000/api_data/user/?role=agent&is_active=true&search=roberto&page=1&page_size=20
```

## Resolución de Problemas

### Problema: Los filtros no se aplican

**Solución:**
1. Verificar que los console.logs muestren los filtros correctos
2. Verificar en Network que los query params se envíen correctamente
3. Verificar que el backend esté corriendo
4. Verificar que Django Filter esté instalado: `pip list | grep django-filter`

### Problema: Búsqueda no encuentra resultados

**Causas posibles:**
1. La búsqueda es case-sensitive en algunos campos
2. Los datos no existen en la base de datos
3. Los campos de búsqueda no incluyen el campo deseado

**Solución:**
- Verificar que `search_fields` incluya los campos correctos
- Agregar más campos si es necesario:
```python
search_fields = ['name', 'last_name', 'email', 'phone_number', 'home_address']
```

### Problema: Filtros booleanos no funcionan

**Causa:** Django espera valores `true`/`false` (strings), no `1`/`0`

**Solución:** El frontend ya envía booleanos correctamente:
```typescript
filters.is_active = true;  // ✅ Correcto
filters.is_active = 1;     // ❌ Incorrecto
```

## Testing

### Prueba Manual con curl

```bash
# Test 1: Filtrar por rol
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://127.0.0.1:8000/api_data/user/?role=admin"

# Test 2: Buscar por nombre
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://127.0.0.1:8000/api_data/user/?search=roberto"

# Test 3: Filtros combinados
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://127.0.0.1:8000/api_data/user/?role=agent&is_active=true&search=example"

# Test 4: Paginación
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://127.0.0.1:8000/api_data/user/?page=2&page_size=10"
```

### Prueba con Python

```python
import requests

BASE_URL = "http://127.0.0.1:8000"
TOKEN = "your_access_token_here"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Test filtros
response = requests.get(
    f"{BASE_URL}/api_data/user/",
    headers=headers,
    params={
        "role": "agent",
        "is_active": True,
        "search": "roberto",
        "page": 1,
        "page_size": 20
    }
)

print(f"Status: {response.status_code}")
print(f"Resultados: {response.json()['count']}")
print(f"URL completa: {response.url}")
```

## Conclusión

Los filtros están **correctamente configurados** en ambos lados:

✅ **Backend:** UserViewSet tiene filtros por rol, is_active, is_verified y búsqueda
✅ **Frontend:** Los tipos coinciden y se envían correctamente
✅ **Configuración:** Django Filter está instalado y configurado globalmente

**Acción requerida:** Verificar con los console.logs y DevTools que los filtros se están enviando y aplicando correctamente.
