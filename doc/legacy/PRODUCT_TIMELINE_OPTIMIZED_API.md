# 🎯 Endpoint Optimizado de Timeline del Producto

## Descripción General

Se ha creado un **endpoint especializado** que retorna los eventos de la timeline de un producto **ya formateados y listos para renderizar**, eliminando la necesidad de transformación lógica en el frontend.

---

## 📍 Endpoint

### GET `/api_data/product/{id}/timeline/`

Obtiene la timeline de un producto con todos los eventos ya formateados con propiedades visuales.

#### Autenticación
- **Requerida**: Sí (Bearer Token JWT)
- **Roles**: Todos los roles autenticados

#### Parámetros
| Parámetro | Tipo | Ubicación | Requerido | Descripción |
|-----------|------|-----------|-----------|-------------|
| `id` | Integer | URL | Sí | ID del producto |

---

## 📤 Respuesta

### Estructura de Respuesta

```json
{
  "id": 1,
  "name": "iPhone 15 Pro",
  "status": "delivered",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T16:45:00Z",
  "events": [
    {
      "status": "created",
      "date": "2024-01-15T10:30:00Z",
      "label": "Registro Creado",
      "description": "El producto fue registrado en el sistema",
      "icon": "check-circle-2",
      "color": "text-gray-600",
      "bgColor": "bg-gray-100",
      "isCompleted": true
    },
    {
      "status": "purchased",
      "date": "2024-01-16T09:00:00Z",
      "label": "Comprado",
      "description": "Se compraron 5 unidad(es) del producto",
      "icon": "shopping-cart",
      "color": "text-blue-600",
      "bgColor": "bg-blue-100",
      "isCompleted": true
    },
    {
      "status": "received",
      "date": "2024-01-18T14:20:00Z",
      "label": "Recibido",
      "description": "Se recibieron 5 unidad(es) del producto",
      "icon": "package",
      "color": "text-yellow-600",
      "bgColor": "bg-yellow-100",
      "isCompleted": true
    },
    {
      "status": "delivered",
      "date": "2024-01-20T16:45:00Z",
      "label": "Entregado",
      "description": "Se entregaron 5 unidad(es) al cliente",
      "icon": "truck",
      "color": "text-green-600",
      "bgColor": "bg-green-100",
      "isCompleted": true
    }
  ]
}
```

---

## 🎨 Propiedades de TimelineEvent

### TimelineEvent
| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `status` | String | Estado del evento: `created`, `purchased`, `received`, `delivered` |
| `date` | ISO String | Fecha del evento en formato ISO 8601 |
| `label` | String | Etiqueta legible del evento (ej: "Comprado", "Recibido") |
| `description` | String | Descripción detallada del evento |
| `icon` | String | Nombre del icono Lucide (ej: `shopping-cart`, `package`, `truck`) |
| `color` | String | Clase Tailwind para el color del icono (ej: `text-blue-600`) |
| `bgColor` | String | Clase Tailwind para el fondo del contenedor (ej: `bg-blue-100`) |
| `isCompleted` | Boolean | Indica si el evento se ha completado |

---

## 📊 Iconos Disponibles

| Status | Icono | Nombre Lucide |
|--------|-------|---------------|
| Creado | ✓ | `check-circle-2` |
| Comprado | 🛒 | `shopping-cart` |
| Recibido | 📦 | `package` |
| Entregado | 🚚 | `truck` |

---

## 🔄 Ejemplo de Uso - Frontend

### Hook (`useProductTimeline`)

```typescript
import { useProductTimeline } from '@/hooks/product/useProductTimeline';

function MyComponent() {
  const { events, isLoading, error } = useProductTimeline('123');
  
  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {events.map(event => (
        <div key={event.status}>
          <h3>{event.label}</h3>
          <p>{event.description}</p>
          <span>{event.date}</span>
        </div>
      ))}
    </div>
  );
}
```

### Componente

```tsx
import ProductTimeline from '@/components/products/product-timeline';

export function ProductDetails() {
  return (
    <ProductTimeline productId="123" />
  );
}
```

---

## 🔧 Implementación Backend

### Serializer (`ProductTimelineFormattedSerializer`)

El serializer realiza toda la transformación en el servidor:

```python
class ProductTimelineFormattedSerializer(serializers.ModelSerializer):
    events = serializers.SerializerMethodField(read_only=True)
    
    def get_events(self, obj):
        # Mapeo de estados a configuración visual
        status_config = {
            'created': {
                'label': 'Registro Creado',
                'icon': 'check-circle-2',
                'color': 'text-gray-600',
                'bgColor': 'bg-gray-100',
            },
            # ... más estados
        }
        
        events = []
        
        # Construcción de eventos desde relaciones
        if obj.created_at:
            events.append({
                'status': 'created',
                'date': obj.created_at.isoformat(),
                'label': status_config['created']['label'],
                # ... más propiedades
            })
        
        # Ordenar eventos por fecha
        events.sort(key=lambda x: x['date'])
        
        return events
```

### ViewSet

```python
@action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
def timeline(self, request, pk=None):
    product = self.get_object()
    serializer = ProductTimelineFormattedSerializer(product)
    return Response(serializer.data)
```

---

## ✨ Ventajas de Este Enfoque

### 1. **Separación de Responsabilidades**
- Backend: Controla la lógica de datos y formato
- Frontend: Solo renderiza lo que recibe

### 2. **Caché Eficiente**
- TanStack Query cachea la respuesta formateada
- No hay re-cálculos innecesarios

### 3. **Mantenibilidad**
- Cambios visuales se hacen en un solo lugar (backend)
- El frontend es más simple y predecible

### 4. **Rendimiento**
- Menos lógica en componentes React
- Menor payload procesado en el cliente

### 5. **Consistencia**
- Los eventos siempre tienen la misma estructura
- Los colores e iconos son consistentes en toda la app

---

## 📋 Estructura de Archivos

### Backend
```
backend/
├── api/
│   ├── serializers/
│   │   ├── products_serializers.py  # ProductTimelineFormattedSerializer
│   │   └── __init__.py              # Exporta el serializer
│   └── views/
│       └── product_views.py         # Endpoint timeline()
```

### Frontend
```
apps/admin/
├── src/
│   ├── hooks/
│   │   └── product/
│   │       └── useProductTimeline.ts  # Hook con tipos TimelineEvent
│   └── components/
│       └── products/
│           └── product-timeline.tsx   # Componente renderizador
```

---

## 🧪 Testing

### Test Backend

```python
from rest_framework.test import APITestCase
from api.models import Product
from django.contrib.auth import get_user_model

User = get_user_model()

class ProductTimelineTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test')
        self.product = Product.objects.create(name='Test Product')
        self.client.force_authenticate(self.user)
    
    def test_timeline_endpoint(self):
        response = self.client.get(f'/api_data/product/{self.product.id}/timeline/')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('events', response.data)
        self.assertIsInstance(response.data['events'], list)
        
        # Verificar estructura de evento
        if response.data['events']:
            event = response.data['events'][0]
            self.assertIn('status', event)
            self.assertIn('date', event)
            self.assertIn('label', event)
            self.assertIn('icon', event)
            self.assertIn('color', event)
            self.assertIn('bgColor', event)
```

### Test Frontend

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useProductTimeline } from '@/hooks/product/useProductTimeline';

describe('useProductTimeline', () => {
  it('should fetch and return timeline events', async () => {
    const { result } = renderHook(() => useProductTimeline('123'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.events).toBeDefined();
    expect(Array.isArray(result.current.events)).toBe(true);
    
    if (result.current.events.length > 0) {
      const event = result.current.events[0];
      expect(event).toHaveProperty('status');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('label');
    }
  });
});
```

---

## 🚀 Integración Completa

### 1. **Instalación de Dependencias** ✅
- Backend: `Django 5.1+`, `DRF 3.15+`
- Frontend: `React 19+`, `TanStack Query 5+`

### 2. **Backend Validado** ✅
```bash
python manage.py check  # ✓ No hay errores
```

### 3. **Frontend Validado** ✅
```bash
pnpm type-check  # ✓ Tipos correctos
```

### 4. **Componente Integrado** ✅
- `ProductTimeline` renderea eventos del API
- Hook `useProductTimeline` maneja la lógica de fetching
- Tipos TypeScript definidos correctamente

---

## 📱 Ejemplo de Respuesta Real

```json
{
  "id": 42,
  "name": "Samsung Galaxy S24",
  "status": "delivered",
  "created_at": "2024-01-10T08:00:00Z",
  "updated_at": "2024-01-25T15:30:00Z",
  "events": [
    {
      "status": "created",
      "date": "2024-01-10T08:00:00Z",
      "label": "Registro Creado",
      "description": "El producto fue registrado en el sistema",
      "icon": "check-circle-2",
      "color": "text-gray-600",
      "bgColor": "bg-gray-100",
      "isCompleted": true
    },
    {
      "status": "purchased",
      "date": "2024-01-12T10:30:00Z",
      "label": "Comprado",
      "description": "Se compraron 3 unidad(es) del producto",
      "icon": "shopping-cart",
      "color": "text-blue-600",
      "bgColor": "bg-blue-100",
      "isCompleted": true
    },
    {
      "status": "received",
      "date": "2024-01-18T14:00:00Z",
      "label": "Recibido",
      "description": "Se recibieron 3 unidad(es) del producto",
      "icon": "package",
      "color": "text-yellow-600",
      "bgColor": "bg-yellow-100",
      "isCompleted": true
    },
    {
      "status": "delivered",
      "date": "2024-01-25T15:30:00Z",
      "label": "Entregado",
      "description": "Se entregaron 3 unidad(es) al cliente",
      "icon": "truck",
      "color": "text-green-600",
      "bgColor": "bg-green-100",
      "isCompleted": true
    }
  ]
}
```

---

## 🔍 Flujo de Datos

```
ProductDetails Component
        ↓
    useProductTimeline hook
        ↓
    TanStack Query
        ↓
    GET /api_data/product/{id}/timeline/
        ↓
    ProductViewSet.timeline() action
        ↓
    ProductTimelineFormattedSerializer
        ↓
    Backend: Genera eventos con propiedades visuales
        ↓
    JSON Response (con eventos formateados)
        ↓
    Frontend: Cachea con TanStack Query
        ↓
    ProductTimeline Component (renderiza directamente)
```

---

## ✅ Checklist de Implementación

- [x] Crear `ProductTimelineFormattedSerializer` en backend
- [x] Agregar método `get_events()` que retorna eventos formateados
- [x] Actualizar endpoint `timeline()` en ViewSet
- [x] Crear tipos TypeScript para `TimelineEvent` y `ProductTimelineResponse`
- [x] Crear hook `useProductTimeline` con tipos correctos
- [x] Actualizar componente `ProductTimeline` para usar eventos del API
- [x] Validar backend con `python manage.py check`
- [x] Validar frontend con `pnpm type-check`
- [x] Documentar endpoint y estructura
- [x] Crear ejemplos de uso

---

## 📚 Referencias

- **Backend**: `backend/api/serializers/products_serializers.py`
- **ViewSet**: `backend/api/views/product_views.py`
- **Hook**: `apps/admin/src/hooks/product/useProductTimeline.ts`
- **Componente**: `apps/admin/src/components/products/product-timeline.tsx`
- **Tipos**: `apps/admin/src/hooks/product/useProductTimeline.ts`

---

**✅ Implementación completa y funcional.**
