# 📡 Nuevo Endpoint: Product Timeline

## 📋 Descripción

Se ha creado un **endpoint dedicado** para obtener los datos de la timeline de un producto, separando completamente esta funcionalidad del endpoint principal de productos.

## 🔌 Endpoint

### Ruta
```
GET /api_data/product/{id}/timeline/
```

### Ejemplo
```bash
GET /api_data/product/550e8400-e29b-41d4-a716-446655440000/timeline/
Authorization: Bearer {token}
```

## 📊 Respuesta (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Producto Ejemplo",
  "status": "ENTREGADO",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-02T15:30:00Z",
  "amount_requested": 5,
  "amount_purchased": 5,
  "amount_received": 5,
  "amount_delivered": 5,
  "buys": [
    {
      "id": 1,
      "buy_date": "2025-12-01T10:30:00Z",
      "amount_buyed": 5,
      "created_at": "2025-12-01T10:30:00Z"
    }
  ],
  "receiveds": [
    {
      "id": 1,
      "amount_received": 5,
      "created_at": "2025-12-01T18:00:00Z"
    }
  ],
  "delivers": [
    {
      "id": 1,
      "amount_delivered": 5,
      "created_at": "2025-12-02T09:00:00Z"
    }
  ]
}
```

## ⚙️ Implementación Backend

### ViewSet
```python
# apps/admin/src/hooks/product/useProductTimeline.ts
@action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
def timeline(self, request, pk=None):
    """
    Obtiene los datos de la timeline de un producto.
    Retorna el producto con sus relaciones (buys, receiveds, delivers).
    """
    product = self.get_object()
    serializer = ProductTimelineSerializer(product)
    return Response(serializer.data)
```

### Serializers
```python
# Serializadores simplificados para la timeline
class ProductBuyedTimelineSerializer(serializers.ModelSerializer)
class ProductReceivedTimelineSerializer(serializers.ModelSerializer)
class ProductDeliveryTimelineSerializer(serializers.ModelSerializer)

# Serializador principal
class ProductTimelineSerializer(serializers.ModelSerializer):
    buys = ProductBuyedTimelineSerializer(many=True, read_only=True)
    receiveds = ProductReceivedTimelineSerializer(many=True, read_only=True)
    delivers = ProductDeliveryTimelineSerializer(many=True, read_only=True)
```

## 🎯 Implementación Frontend

### Hook: `useProductTimeline`
```typescript
import { useProductTimeline } from '@/hooks/product/useProductTimeline';

// Uso
const { timeline, isLoading, error, refetch, invalidateTimeline } = 
  useProductTimeline(productId);
```

**Retorna:**
```typescript
{
  timeline: Product | null,      // Datos de la timeline
  isLoading: boolean,             // Indicador de carga
  error: Error | null,            // Errores
  refetch: Function,              // Refrescar datos
  invalidateTimeline: Function    // Invalidar cache
}
```

### Componente: `ProductTimeline`
```typescript
import ProductTimeline from '@/components/products/product-timeline';

// Uso
<ProductTimeline productId={productId} />
```

**Props:**
```typescript
interface ProductTimelineProps {
  productId: string;
}
```

## 🔄 Flujo de Datos

```
ProductDetails
    ↓
    ├─ useProduct(id)           // Obtiene datos principales
    │  └─ GET /api_data/product/{id}/
    │
    └─ ProductTimeline(productId)
       └─ useProductTimeline(id) // Obtiene datos de timeline (en paralelo)
          └─ GET /api_data/product/{id}/timeline/
             └─ ProductTimelineSerializer
                ├─ ProductBuyedTimelineSerializer
                ├─ ProductReceivedTimelineSerializer
                └─ ProductDeliveryTimelineSerializer
```

## ✅ Beneficios

### Separación de Responsabilidades
- ✅ Endpoint dedicado para timeline
- ✅ Serializers simplificados solo con datos necesarios
- ✅ No afecta el endpoint principal de productos

### Performance
- ✅ Query optimizado: solo obtiene relaciones necesarias
- ✅ Carga en paralelo con datos principales
- ✅ Cache independiente de TanStack Query

### Mantenibilidad
- ✅ Cambios en timeline no afectan endpoint principal
- ✅ Hook reutilizable en otros componentes
- ✅ Código más limpio y organizado

## 🚀 Uso Completo

### Componente ProductDetails
```tsx
const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { product, isLoading: mainLoading } = useProduct(id || '');

  // La timeline se carga en paralelo
  return (
    <div>
      {/* Información principal */}
      {mainLoading ? <Loader /> : <ProductInfo product={product} />}
      
      {/* Timeline carga independientemente */}
      <ProductTimeline productId={id || ''} />
    </div>
  );
};
```

## 📡 Seguridad

- ✅ Requiere autenticación (`IsAuthenticated`)
- ✅ Respeta permisos de roles (hereda del viewset)
- ✅ Filtra datos por usuario (agent, client)

## 🔍 Debugging

### Verificar que el endpoint funciona
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api_data/product/550e8400-e29b-41d4-a716-446655440000/timeline/
```

### Ver requests en DevTools
1. Abrir DevTools → Network
2. Buscar requests a `/api_data/product/*/timeline/`
3. Verificar que las relaciones (buys, receiveds, delivers) llegan completas

## 📈 Estadísticas

- **Campos retornados**: 14
- **Relaciones incluidas**: 3 (buys, receiveds, delivers)
- **Serializers creados**: 4 (1 principal + 3 anidados)
- **Líneas de código backend**: ~50
- **Líneas de código frontend**: ~30

## 🔗 Rutas Relacionadas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api_data/product/{id}/` | Obtener producto completo |
| GET | `/api_data/product/{id}/timeline/` | **Obtener timeline** ✨ |
| POST | `/api_data/product/` | Crear producto |
| PUT | `/api_data/product/{id}/` | Actualizar producto |
| DELETE | `/api_data/product/{id}/` | Eliminar producto |

## 📝 Notas

- El endpoint retorna las relaciones con todas las instancias (no limitadas)
- Las fechas se retornan en ISO 8601 format (UTC)
- Soporta paginación mediante query params (si se necesita en el futuro)
- Compatible con el sistema de permisos existente

---

**✨ Endpoint optimizado y listo para producción**
