# Componente de Detalle de Delivery

Este documento describe los componentes y funcionalidades creados para ver y gestionar los detalles de un delivery, incluyendo la capacidad de agregar y remover productos.

## Componentes Creados

### 1. `DeliveryDetail.tsx` (Página Principal)
**Ubicación:** `apps/admin/src/pages/DeliveryDetail.tsx`

Componente principal que muestra todos los detalles de un delivery específico.

**Características:**
- Muestra información general del delivery (ID, fecha, peso, estado)
- Muestra información del pedido asociado y cliente
- Muestra desglose de costos (peso, ganancia del manager, total)
- Integra tabla de productos del delivery
- Permite agregar nuevos productos al delivery
- Navegación de regreso a la lista de deliveries

**Props:** Ninguna (obtiene el ID del delivery desde los parámetros de la ruta)

### 2. `DeliveryProductsTable.tsx`
**Ubicación:** `apps/admin/src/components/delivery/DeliveryProductsTable.tsx`

Tabla que muestra los productos incluidos en un delivery con opciones para removerlos.

**Props:**
```typescript
interface DeliveryProductsTableProps {
  deliveryId: ID;
  products: ProductDelivery[];
}
```

**Características:**
- Muestra imagen, nombre, SKU, tienda y cantidad entregada de cada producto
- Botón para remover producto del delivery con confirmación
- Estado vacío cuando no hay productos
- Integración con toast para notificaciones

### 3. `AddProductToDeliveryDialog.tsx`
**Ubicación:** `apps/admin/src/components/delivery/AddProductToDeliveryDialog.tsx`

Diálogo modal para agregar productos a un delivery con selección y búsqueda.

**Props:**
```typescript
interface AddProductToDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryId: ID;
  orderId?: ID;
}
```

**Características:**
- Búsqueda de productos por nombre o SKU
- Selector de productos con imágenes
- Muestra información del producto seleccionado (stock disponible, tienda, costo, estado)
- Input de cantidad con validación
- Previene agregar más unidades de las disponibles
- Filtrado opcional por pedido

## Hooks Creados

### 1. `useSingleDelivery`
**Ubicación:** `apps/admin/src/hooks/delivery/useSingleDelivery.ts`

Hook para obtener un delivery específico por su ID.

```typescript
function useSingleDelivery(id: ID): {
  delivery: DeliverReceip | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}
```

### 2. `useAddProductToDelivery`
**Ubicación:** `apps/admin/src/hooks/delivery/useAddProductToDelivery.ts`

Hook para agregar un producto a un delivery.

```typescript
interface AddProductToDeliveryData {
  deliveryId: ID;
  productId: UUID;
  amount: number;
}

function useAddProductToDelivery(): UseMutationResult<...>
```

**Endpoint:** `POST /api/delivery_receips/{deliveryId}/add_product/`

**Payload:**
```json
{
  "product_id": "uuid",
  "amount_delivered": number
}
```

### 3. `useRemoveProductFromDelivery`
**Ubicación:** `apps/admin/src/hooks/delivery/useRemoveProductFromDelivery.ts`

Hook para remover un producto de un delivery.

```typescript
interface RemoveProductFromDeliveryData {
  deliveryId: ID;
  productDeliveryId: ID;
}

function useRemoveProductFromDelivery(): UseMutationResult<...>
```

**Endpoint:** `DELETE /api/delivery_receips/{deliveryId}/remove_product/{productDeliveryId}/`

## Servicios Creados

### `get-delivery.ts`
**Ubicación:** `apps/admin/src/services/delivery/get-delivery.ts`

Servicio para obtener un delivery específico desde el backend.

```typescript
function getDelivery(id: ID): Promise<DeliverReceip>
```

**Endpoint:** `GET /api/delivery_receips/{id}/`

## Rutas Agregadas

Se agregó la siguiente ruta en `AppRoutes.tsx`:

```typescript
<Route path="deliveries/:id" element={<DeliveryDetail />} />
```

**URL de acceso:** `/deliveries/{id}`

## Tipos Actualizados

Se agregó `ProductDelivery` a las exportaciones principales en `types/index.ts`:

```typescript
export type {
  // ... otros tipos
  ProductDelivery,
  CreateProductDeliveryData,
  UpdateProductDeliveryData,
}
```

## Flujo de Uso

1. **Ver detalles del delivery:**
   - Desde la tabla de deliveries, hacer clic en "Ver detalles" en el menú de acciones
   - O navegar directamente a `/deliveries/{id}`

2. **Agregar producto al delivery:**
   - En la página de detalles, hacer clic en "Agregar Producto"
   - Buscar el producto deseado por nombre o SKU
   - Seleccionar el producto del dropdown
   - Especificar la cantidad a entregar
   - Confirmar la adición

3. **Remover producto del delivery:**
   - En la tabla de productos, hacer clic en el icono de eliminar (papelera)
   - Confirmar la eliminación en el diálogo

## Integración con Backend

### Endpoints Requeridos

El backend debe proporcionar los siguientes endpoints:

1. **GET** `/api/delivery_receips/{id}/`
   - Obtiene los detalles de un delivery
   - Debe incluir `delivered_products` con los productos asociados

2. **POST** `/api/delivery_receips/{id}/add_product/`
   - Agrega un producto al delivery
   - Body: `{ product_id: UUID, amount_delivered: number }`

3. **DELETE** `/api/delivery_receips/{id}/remove_product/{productDeliveryId}/`
   - Remueve un producto del delivery

## Cache e Invalidación

Los hooks utilizan React Query para gestionar el cache. Cuando se agrega o remueve un producto, se invalidan automáticamente las siguientes queries:

- `['delivery', deliveryId]` - Detalles del delivery específico
- `['deliveries']` - Lista de deliveries
- `['products']` - Lista de productos

## Validaciones

- No se puede agregar una cantidad mayor a las unidades disponibles del producto
- La cantidad debe ser mayor a 0
- Se requiere seleccionar un producto antes de agregar
- Confirmación antes de remover un producto

## Notificaciones

Se utilizan toasts (sonner) para notificar al usuario:
- ✅ Éxito al agregar producto
- ✅ Éxito al remover producto
- ❌ Errores en las operaciones
- ⚠️ Validaciones fallidas

## Mejoras Futuras

1. Agregar filtros en el selector de productos (por tienda, categoría, estado)
2. Editar cantidad de productos ya agregados
3. Vista previa de cómo afectará el cambio al delivery
4. Historial de cambios en el delivery
5. Exportar lista de productos del delivery a PDF/Excel
6. Agregar múltiples productos a la vez
7. Copiar productos de otro delivery

## Notas Técnicas

- Se utiliza TanStack Query (React Query) para gestión de estado del servidor
- Componentes de UI de shadcn/ui
- TypeScript para type safety
- Lucide React para iconos
- Sonner para notificaciones toast
