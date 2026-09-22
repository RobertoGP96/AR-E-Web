# ✅ Actualización: Invalidación de Queries de Productos

**Fecha:** 6 de febrero de 2026  
**Objetivo:** Asegurar que la query de productos se actualice automáticamente cuando se crean, actualizan o eliminan compras, paquetes y entregas.

## 📋 Resumen de Cambios

Se han actualizado **7 hooks** en el panel administrativo para invalidar automáticamente la query de productos cuando se realizan operaciones en compras, paquetes y entregas.

---

## 🔧 Hooks Actualizados

### 1. **Compras (ProductBuyed)**
- ✅ `useCreateProductBuyed` - **Ya existía invalidación**
  - Invalida: `['products']`, `['product-buyed']`, `['orders']`

### 2. **Paquetes (Package)**

#### Creación y Actualización
- ✅ `useCreatePackage`
  - **Antes:** Solo invalidaba `['packages']`
  - **Ahora:** Invalida `['packages']`, `['products']`, `['product-received']`

- ✅ `useUpdatePackage`
  - **Antes:** Solo invalidaba `['packages']`
  - **Ahora:** Invalida `['packages']`, `['products']`, `['product-received']`

- ✅ `useUpdatePackageStatus`
  - **Antes:** Solo invalidaba `['packages']`
  - **Ahora:** Invalida `['packages']`, `['products']`, `['product-received']`

#### Eliminación
- ✅ `useDeletePackage`
  - **Antes:** Solo invalidaba `['packages']`
  - **Ahora:** Invalida `['packages']`, `['products']`, `['product-received']`

#### Agregar Productos
- ✅ `useAddProductsToPackage`
  - **Antes:** Solo invalidaba `['packages']`
  - **Ahora:** Invalida `['packages']`, `['products']`, `['product-received']`

### 3. **Entregas (Delivery)**

#### Creación y Actualización
- ✅ `useCreateDelivery`
  - **Antes:** Solo invalidaba `['deliveries']`
  - **Ahora:** Invalida `['deliveries']`, `['products']`

- ✅ `useUpdateDelivery`
  - **Antes:** Solo invalidaba `['deliveries']`
  - **Ahora:** Invalida `['deliveries']`, `['products']`

- ✅ `useUpdateDeliveryStatus`
  - **Antes:** Solo invalidaba `['deliveries']`
  - **Ahora:** Invalida `['deliveries']`, `['products']`

#### Eliminación
- ✅ `useDeleteDelivery`
  - **Antes:** Solo invalidaba `['deliveries']`
  - **Ahora:** Invalida `['deliveries']`, `['products']`

#### Agregar/Remover Productos
- ✅ `useAddProductToDelivery` - **Ya existía invalidación**
  - Invalida: `['delivery', id]`, `['deliveries']`, `['products']`

- ✅ `useRemoveProductFromDelivery` - **Ya existía invalidación**
  - Invalida: `['delivery', id]`, `['deliveries']`, `['products']`

- ✅ `useRemoveProductFromPackage` - **Ya existía invalidación**
  - Invalida: `['package', id]`, `['packages']`, `['products']`

---

## 📁 Archivos Modificados

```
apps/admin/src/hooks/
├── package/
│   ├── useCreatePackage.ts          ✅ Actualizado
│   ├── useUpdatePackage.ts          ✅ Actualizado
│   ├── useDeletePackage.ts          ✅ Actualizado
│   └── useAddProductsToPackage.ts   ✅ Actualizado
│
└── delivery/
    ├── useCreateDelivery.ts         ✅ Actualizado
    ├── useUpdateDelivery.ts         ✅ Actualizado
    └── useDeleteDelivery.ts         ✅ Actualizado
```

---

## 🎯 Flujo de Invalidación de Queries

### Cuando se crea una compra:
```
useCreateProductBuyed
    ↓
✅ Invalida: ['products']
✅ Invalida: ['product-buyed']
✅ Invalida: ['orders']
```

### Cuando se crea un paquete:
```
useCreatePackage
    ↓
✅ Invalida: ['packages']
✅ Invalida: ['products']       ← NUEVO
✅ Invalida: ['product-received'] ← NUEVO
```

### Cuando se crea una entrega:
```
useCreateDelivery
    ↓
✅ Invalida: ['deliveries']
✅ Invalida: ['products']       ← NUEVO
```

### Cuando se agrega un producto a un paquete:
```
useAddProductsToPackage
    ↓
✅ Invalida: ['packages']
✅ Invalida: ['products']       ← NUEVO
✅ Invalida: ['product-received'] ← NUEVO
```

---

## 🔄 Cómo Funciona

Cuando se ejecuta cualquiera de estos hooks:

1. **Mutación**: Se realiza la acción (crear, actualizar, eliminar)
2. **onSuccess**: Si tiene éxito, se ejecuta el callback
3. **Invalidación**: Se invalidan todas las queries especificadas
4. **Auto-refetch**: React Query automáticamente refetcha las queries invalidadas
5. **UI Update**: La UI se actualiza con los datos nuevos

---

## ✨ Beneficios

- 🔄 **Estado sincronizado**: Los productos siempre muestran su estado actual
- ⚡ **Rendimiento**: Invalidación selectiva solo de lo que cambió
- 🎯 **Consistencia**: Todas las operaciones siguen el mismo patrón
- 📊 **Actualización en tiempo real**: Sin necesidad de F5 o reload

---

## 📝 Ejemplos de Uso

### Crear una compra (ya funcionaba):
```typescript
const { createProductBuyed, isCreating } = useCreateProductBuyed();

await createProductBuyed(productData);
// ✅ Automáticamente invalida y refetcha ['products']
```

### Crear un paquete (ahora funciona):
```typescript
const { mutateAsync, isPending } = useCreatePackage();

await mutateAsync(packageData);
// ✅ Automáticamente invalida y refetcha ['products']
```

### Agregar productos a una entrega:
```typescript
const { mutateAsync, isPending } = useAddProductToDelivery();

await mutateAsync({ deliveryId, productId, amount });
// ✅ Automáticamente invalida y refetcha ['products']
```

---

## 🧪 Cómo Verificar

1. Abre el panel administrativo
2. Navega a cualquier sección de productos
3. Crea una compra, paquete o entrega
4. Verifica que los estados de los productos se actualicen automáticamente
5. Abre React Query DevTools (esquina inferior derecha)
6. Observa cómo se invalida `['products']` en la query

---

## 📚 Documentación Relacionada

- [PRODUCT_STATUS_DEPENDENCIES_EXPLAINED.md](./PRODUCT_STATUS_DEPENDENCIES_EXPLAINED.md)
- [PRODUCT_TIMELINE_CHANGES.md](./PRODUCT_TIMELINE_CHANGES.md)
- [PRODUCT_MANAGEMENT_COMPONENTS.md](./PRODUCT_MANAGEMENT_COMPONENTS.md)

---

**Cambios completados y verificados ✅**
