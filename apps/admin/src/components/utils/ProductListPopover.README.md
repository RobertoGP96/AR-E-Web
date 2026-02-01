# 📦 ProductListPopover - Componente Reutilizable

## 🎯 Descripción

Componente reutilizable creado para mostrar listas de productos en un popover a través de diferentes contextos de la aplicación: **compras**, **paquetes**, **pedidos** y **entregas**.

Este componente elimina la duplicación de código y proporciona una interfaz consistente para mostrar productos en todas las tablas de la aplicación.

## 📁 Archivos Creados

```
src/components/utils/
├── ProductListPopover.tsx           # Componente principal
├── ProductListPopover.md            # Documentación completa
├── ProductListPopover.examples.tsx  # 10 ejemplos de uso
└── ProductListPopover.test.ts       # Tests unitarios
```

## ✨ Características Principales

- ✅ **Reutilizable**: Un componente para todos los contextos
- ✅ **Flexible**: Altamente personalizable con props
- ✅ **Tipado**: TypeScript completo con autocompletado
- ✅ **Adaptadores**: Hook para transformar diferentes estructuras de datos
- ✅ **Responsive**: Se adapta a diferentes tamaños
- ✅ **Accesible**: Implementa mejores prácticas de accesibilidad
- ✅ **Probado**: Incluye tests unitarios

## 🚀 Uso Rápido

### 1. Importar el componente

```tsx
import { ProductListPopover, useProductListAdapter } from "@/components/utils/ProductListPopover";
```

### 2. Usar en tu tabla

```tsx
function DeliveryTable({ deliveries }) {
  const { adaptDeliveredProducts } = useProductListAdapter();
  
  return (
    <TableCell>
      <ProductListPopover
        products={adaptDeliveredProducts(delivery.delivered_products || [])}
        title="Productos Entregados"
      />
    </TableCell>
  );
}
```

## 📊 Contextos de Uso

### 1️⃣ Compras (ShoppingReceip)

```tsx
const { adaptBuyedProducts } = useProductListAdapter();

<ProductListPopover
  products={adaptBuyedProducts(purchase.buyed_products || [])}
  title="Productos Comprados"
  showPrice={true}
/>
```

### 2️⃣ Paquetes (Package)

```tsx
const { adaptReceivedProducts } = useProductListAdapter();

<ProductListPopover
  products={adaptReceivedProducts(pkg.received_products || [])}
  title="Productos Recibidos"
  showPrice={true}
/>
```

### 3️⃣ Entregas (DeliverReceip)

```tsx
const { adaptDeliveredProducts } = useProductListAdapter();

<ProductListPopover
  products={adaptDeliveredProducts(delivery.delivered_products || [])}
  title="Productos Entregados"
/>
```

### 4️⃣ Pedidos (Order)

```tsx
const { adaptOrderProducts } = useProductListAdapter();

<ProductListPopover
  products={adaptOrderProducts(order.products || [])}
  title="Productos del Pedido"
  showPrice={true}
/>
```

## 🎨 Opciones de Personalización

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `products` | `ProductItem[]` | **requerido** | Lista de productos |
| `title` | `string` | `"Productos"` | Título del popover |
| `showPrice` | `boolean` | `false` | Mostrar precios |
| `showCategory` | `boolean` | `true` | Mostrar categoría |
| `showSku` | `boolean` | `true` | Mostrar SKU |
| `triggerVariant` | `string` | `"outline"` | Estilo del botón |
| `emptyMessage` | `string` | `"No hay productos"` | Mensaje vacío |

Ver `ProductListPopover.md` para la lista completa de props.

## 🔄 Adaptadores Disponibles

El hook `useProductListAdapter()` proporciona:

- `adaptBuyedProducts()` - Para productos comprados
- `adaptReceivedProducts()` - Para productos recibidos
- `adaptDeliveredProducts()` - Para productos entregados
- `adaptOrderProducts()` - Para productos de pedidos

## 📖 Ejemplos Completos

Ver `ProductListPopover.examples.tsx` para 10 ejemplos detallados:

1. ✅ Uso en DeliveryTable
2. ✅ Uso en PurchasesTable
3. ✅ Uso en PackagesTable
4. ✅ Uso en OrdersTable
5. ✅ Versión compacta
6. ✅ Versión expandida
7. ✅ Con adaptador personalizado
8. ✅ Integración completa en tabla
9. ✅ Con estado de carga
10. ✅ Popover deshabilitado

## 🧪 Tests

Ejecutar tests:

```bash
npm test ProductListPopover.test.ts
```

Los tests cubren:
- ✅ Adaptadores de datos
- ✅ Casos edge (arrays vacíos, valores undefined)
- ✅ Validación de tipos
- ✅ Cálculos de totales

## 🔧 Implementación en Tablas Existentes

### Antes (Código Duplicado)

```tsx
// En DeliveryTable.tsx (líneas 351-432)
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <Package className="h-4 w-4" />
      {delivery.delivered_products?.length || 0}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80 max-h-96 overflow-y-auto">
    <div className="space-y-2">
      <h4 className="font-semibold text-sm border-b pb-2">
        Productos Entregados ({delivery.delivered_products?.length || 0})
      </h4>
      {/* ... 80+ líneas de código repetitivo ... */}
    </div>
  </PopoverContent>
</Popover>
```

### Después (Componente Reutilizable)

```tsx
<ProductListPopover
  products={adaptDeliveredProducts(delivery.delivered_products || [])}
  title="Productos Entregados"
/>
```

**Resultado**: 
- 📉 De ~80 líneas a 3 líneas
- 🎯 Código más limpio y mantenible
- 🔄 Reutilizable en todas las tablas

## 🎁 Beneficios

1. **Menos Código**: Reduce duplicación significativamente
2. **Mantenimiento**: Un solo lugar para actualizar
3. **Consistencia**: UI uniforme en toda la app
4. **Flexibilidad**: Fácil de personalizar
5. **Tipado**: TypeScript completo
6. **Probado**: Tests incluidos

## 📝 Próximos Pasos

### Para implementar en tus tablas:

1. **Importa el componente y el hook**
   ```tsx
   import { ProductListPopover, useProductListAdapter } from "@/components/utils/ProductListPopover";
   ```

2. **Usa el adaptador apropiado**
   ```tsx
   const { adaptDeliveredProducts } = useProductListAdapter();
   ```

3. **Reemplaza el código existente**
   ```tsx
   <ProductListPopover
     products={adaptDeliveredProducts(data.products || [])}
     title="Productos"
   />
   ```

### Tablas donde puedes implementarlo:

- [ ] `DeliveryTable.tsx` - Entregas
- [ ] `PurchasesTable.tsx` - Compras
- [ ] `PackagesTable.tsx` - Paquetes
- [ ] `OrdersTable.tsx` - Pedidos

## 🤝 Contribuir

Si necesitas agregar funcionalidad:

1. Modifica `ProductListPopover.tsx`
2. Agrega ejemplos en `ProductListPopover.examples.tsx`
3. Actualiza tests en `ProductListPopover.test.ts`
4. Documenta en `ProductListPopover.md`

## 📚 Documentación Adicional

- **Documentación completa**: Ver `ProductListPopover.md`
- **Ejemplos de código**: Ver `ProductListPopover.examples.tsx`
- **Tests**: Ver `ProductListPopover.test.ts`

## 💡 Tips

- Usa `renderAdditionalInfo` para información personalizada
- Usa `getImageUrl` si tu estructura de imágenes es diferente
- Ajusta `popoverWidth` y `popoverMaxHeight` según necesites
- Usa `disabled={true}` para deshabilitar bajo ciertas condiciones

## 🐛 Troubleshooting

**Problema**: Las imágenes no se muestran
```tsx
// Solución: Usa getImageUrl personalizado
<ProductListPopover
  products={products}
  getImageUrl={(product) => {
    // Tu lógica personalizada aquí
    return product.additionalInfo?.custom_image_field;
  }}
/>
```

**Problema**: Estructura de datos diferente
```tsx
// Solución: Crea un adaptador personalizado
const adaptCustom = (data: any[]) => {
  return data.map(item => ({
    id: item.customId,
    name: item.customName,
    quantity: item.customQty,
    // ... resto de campos
  }));
};
```

## ✅ Checklist de Implementación

- [x] Componente principal creado
- [x] Documentación completa
- [x] Ejemplos de uso (10 ejemplos)
- [x] Tests unitarios
- [x] Hook de adaptadores
- [x] TypeScript completo
- [ ] Implementar en DeliveryTable
- [ ] Implementar en PurchasesTable
- [ ] Implementar en PackagesTable
- [ ] Implementar en OrdersTable

---

**Creado por**: Antigravity AI Assistant  
**Fecha**: 2026-02-01  
**Versión**: 1.0.0
