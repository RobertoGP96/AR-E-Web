# Guía de Migración de Estados - Admin

## 🔄 Cambios de Estados (Inglés → Español)

Esta guía te ayudará a actualizar los componentes del Admin que usan los valores antiguos en inglés.

---

## ⚠️ IMPORTANTE

**Todos los estados ahora están en ESPAÑOL** para coincidir con el backend.

### Antes (❌ INCORRECTO):
```typescript
status: "Ordered"
pay_status: "Unpaid"
```

### Ahora (✅ CORRECTO):
```typescript
status: "Encargado"
pay_status: "No pagado"
```

---

## 📝 Tabla de Conversión

### OrderStatus & ProductStatus & PackageStatus
| Antes (Inglés) | Ahora (Español) |
|----------------|-----------------|
| `"Ordered"` | `"Encargado"` |
| `"Processing"` | `"Procesando"` |
| `"Completed"` | `"Completado"` |
| `"Cancelled"` | `"Cancelado"` |

### PayStatus & ShoppingStatus
| Antes (Inglés) | Ahora (Español) |
|----------------|-----------------|
| `"Unpaid"` | `"No pagado"` |
| `"Paid"` | `"Pagado"` |
| `"Partial"` | `"Parcial"` |

### DeliveryStatus
| Antes (Inglés) | Ahora (Español) |
|----------------|-----------------|
| `"Sent"` | `"Pendiente"` |
| `"In Transit"` | `"En transito"` |
| `"Delivered"` | `"Entregado"` |
| N/A | `"Fallida"` (nuevo) |

---

## 🔧 Archivos que Necesitan Actualización

### 1. `/components/orders/OrderStatusBadge.tsx`

**Cambiar:**
```typescript
const statusConfig: Record<OrderStatus, BadgeConfig> = {
  "Ordered": { ... },      // ❌
  "Processing": { ... },   // ❌
  "Completed": { ... },    // ❌
  "Cancelled": { ... }     // ❌
};
```

**Por:**
```typescript
const statusConfig: Record<OrderStatus, BadgeConfig> = {
  "Encargado": { ... },    // ✅
  "Procesando": { ... },   // ✅
  "Completado": { ... },   // ✅
  "Cancelado": { ... }     // ✅
};
```

**Cambiar fallback:**
```typescript
// Antes
const config = statusConfig[status] || statusConfig["Processing"];

// Ahora
const config = statusConfig[status] || statusConfig["Procesando"];
```

---

### 2. `/components/utils/PayStatusBadge.tsx`

**Cambiar:**
```typescript
const statusConfig: Record<PayStatus, BadgeConfig> = {
  "Unpaid": { ... },   // ❌
  "Paid": { ... },     // ❌
  "Partial": { ... }   // ❌
};
```

**Por:**
```typescript
const statusConfig: Record<PayStatus, BadgeConfig> = {
  "No pagado": { ... },  // ✅
  "Pagado": { ... },     // ✅
  "Parcial": { ... }     // ✅
};
```

**Cambiar fallback:**
```typescript
// Antes
const config = statusConfig[status] || statusConfig["Unpaid"];

// Ahora
const config = statusConfig[status] || statusConfig["No pagado"];
```

---

### 3. `/components/delivery/DeliveryStatusBadge.tsx`

**Cambiar:**
```typescript
const statusConfig: Record<DeliveryStatus, BadgeConfig> = {
  "Sent": { ... },        // ❌
  "In Transit": { ... },  // ❌
  "Delivered": { ... }    // ❌
};
```

**Por:**
```typescript
const statusConfig: Record<DeliveryStatus, BadgeConfig> = {
  "Pendiente": { ... },    // ✅
  "En transito": { ... },  // ✅
  "Entregado": { ... },    // ✅
  "Fallida": { ... }       // ✅ NUEVO
};
```

**Cambiar fallback:**
```typescript
// Antes
const config = statusConfig[status] || statusConfig["Sent"];

// Ahora
const config = statusConfig[status] || statusConfig["Pendiente"];
```

---

### 4. `/components/products/ProductsTable.tsx`

**Línea 80 y 87 - Cambiar valores por defecto:**
```typescript
// Antes
status: "Ordered",

// Ahora
status: "Encargado",
```

---

### 5. `/components/purshases/PurshasesTable.tsx`

**Líneas 32 y 60 - Cambiar valores:**
```typescript
// Antes (línea 32)
status_of_shopping: "Unpaid",

// Ahora
status_of_shopping: "No pagado",

// Antes (línea 60)
status_of_shopping: "Processing",

// Ahora
status_of_shopping: "Procesando",  // O "No pagado" según contexto
```

---

### 6. `/components/delivery/DeliveryTable.tsx`

**Líneas 52 y 65 - Cambiar valores:**
```typescript
// Antes (línea 52)
status: "Ordered",

// Ahora
status: "Encargado",

// Antes (línea 65)
status: "Sent",

// Ahora
status: "Pendiente",
```

---

## 🎨 Constantes ya Actualizadas

Las siguientes constantes en `/types/utils.ts` ya fueron actualizadas:

```typescript
// ✅ Ya actualizados
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = { ... };
export const PAY_STATUS_LABELS: Record<PayStatus, string> = { ... };
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = { ... };

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = { ... };
export const PAY_STATUS_COLORS: Record<PayStatus, string> = { ... };
export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = { ... };

// ✅ También actualizados
export const ORDER_STATUS_OPTIONS = [ ... ];
export const PAY_STATUS_OPTIONS = [ ... ];
export const PRODUCT_STATUS_OPTIONS = [ ... ];
```

**Puedes usarlos directamente en tus componentes.**

---

## 🧪 Cómo Verificar

### 1. Compilación TypeScript
```bash
cd apps/admin
pnpm tsc --noEmit
```

Si hay errores de tipo, TypeScript te mostrará exactamente dónde están los valores antiguos.

### 2. Buscar valores antiguos
```bash
# En PowerShell
Select-String -Path "apps\admin\src\**\*.tsx" -Pattern '"Ordered"|"Unpaid"|"Sent"'

# O usa el buscador de VS Code con regex:
"Ordered"|"Processing"|"Unpaid"|"Sent"
```

### 3. Pruebas manuales
1. Crear un pedido nuevo
2. Cambiar el estado de un pedido
3. Verificar que se guarda correctamente en el backend
4. Verificar que no hay errores 400 en la consola

---

## 📋 Checklist de Migración

### Por Componente:

- [ ] `OrderStatusBadge.tsx` - Actualizar statusConfig y fallback
- [ ] `PayStatusBadge.tsx` - Actualizar statusConfig y fallback
- [ ] `DeliveryStatusBadge.tsx` - Actualizar statusConfig y fallback
- [ ] `ProductsTable.tsx` - Actualizar valores por defecto
- [ ] `PurshasesTable.tsx` - Actualizar valores por defecto
- [ ] `DeliveryTable.tsx` - Actualizar valores por defecto
- [ ] Formularios de creación - Verificar valores iniciales
- [ ] Formularios de edición - Verificar valores por defecto
- [ ] Selectores - Usar las constantes `*_OPTIONS` de utils.ts

### Por Funcionalidad:

- [ ] Crear pedido - Funciona correctamente
- [ ] Editar pedido - Funciona correctamente
- [ ] Cambiar estado de pedido - Funciona correctamente
- [ ] Crear producto - Funciona correctamente
- [ ] Crear entrega - Funciona correctamente
- [ ] Crear compra - Funciona correctamente
- [ ] Filtros por estado - Funcionan correctamente

---

## 💡 Tips

### 1. Usar Constantes
En lugar de hardcodear valores, usa las constantes:

```typescript
// ❌ Malo
status: "Encargado"

// ✅ Bueno
import { ORDER_STATUSES } from '@/types/models/base';
status: ORDER_STATUSES.ENCARGADO
```

### 2. Type Safety
TypeScript te ayudará a detectar errores:

```typescript
// Si escribes mal, TypeScript te alertará
const status: OrderStatus = "Odered"; // ❌ Error de compilación
```

### 3. Mapeos Automáticos
Usa las funciones de mapeo para convertir automáticamente:

```typescript
import { ORDER_STATUS_LABELS } from '@/types/utils';

// Mostrar label en español
<span>{ORDER_STATUS_LABELS[order.status]}</span>
```

---

## 🚨 Errores Comunes

### Error 1: Valor no reconocido
```
Error 400: "Ordered" is not a valid choice.
```

**Causa:** Estás enviando valores en inglés al backend.
**Solución:** Cambiar a español según la tabla de conversión.

### Error 2: TypeScript Error
```
Type '"Ordered"' is not assignable to type 'OrderStatus'
```

**Causa:** Los tipos ya fueron actualizados pero el código no.
**Solución:** Cambiar el valor a español.

### Error 3: BadgeConfig no encuentra el estado
```
Cannot read property 'color' of undefined
```

**Causa:** El statusConfig usa valores antiguos en inglés.
**Solución:** Actualizar las keys del statusConfig a español.

---

## ✅ Ventajas de estos Cambios

1. **Consistencia:** Frontend y backend usan los mismos valores
2. **Sin errores 400:** No más errores de validación
3. **Type Safety:** TypeScript detecta errores automáticamente
4. **Mejor UX:** Usuarios ven todo en español
5. **Mantenibilidad:** Un solo idioma, menos confusión

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Verifica que estás usando los valores correctos de la tabla de conversión
2. Revisa que los imports sean correctos
3. Ejecuta `pnpm tsc --noEmit` para ver errores de tipo
4. Consulta el documento `TYPE_CORRECTIONS_SUMMARY.md` para detalles

---

**Fecha:** 9 de octubre de 2025
**Versión:** 1.0
