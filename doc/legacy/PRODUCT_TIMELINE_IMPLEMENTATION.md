# 📊 Product Timeline - Guía de Implementación

## 🎯 Descripción General

Se ha incorporado una sección de **Historial de Eventos del Producto** (Timeline) en el componente `ProductDetails`. Esta funcionalidad muestra visualmente el ciclo de vida de un producto desde su creación hasta su entrega, utilizando una línea de tiempo interactiva con eventos clave.

## 📁 Archivos Modificados/Creados

### 1. **Nuevo Componente: `product-timeline.tsx`**
```
📁 apps/admin/src/components/products/product-timeline.tsx
```

**Características:**
- Renderiza una línea de tiempo visual con eventos
- Soporta 4 estados principales: Comprado, Recibido, Entregado, Pendiente
- Obtiene datos de las relaciones del producto (buys, receiveds, delivers)
- Formatea fechas en español con localización argentina
- Incluye iconografía de Lucide Icons
- Leyenda de estados al final

**Props:**
```typescript
interface ProductTimelineProps {
  product: {
    status: string;
    created_at?: string;
    updated_at?: string;
    buys?: Array<{ buy_date?: string; amount_buyed?: number }>;
    receiveds?: Array<{ created_at?: string; amount_received?: number }>;
    delivers?: Array<{ created_at?: string; amount_delivered?: number }>;
    amount_purchased?: number;
    amount_received?: number;
    amount_delivered?: number;
  };
}
```

### 2. **Actualización: `product-details.tsx`**
```
📁 apps/admin/src/components/products/product-details.tsx
```

**Cambios:**
- Importa el componente `ProductTimeline`
- Integra `<ProductTimeline product={product} />` después de la sección de información económica
- La timeline ocupa el ancho completo del contenedor

### 3. **Actualización: Tipo TypeScript `Product`**
```
📁 apps/admin/src/types/models/product.ts
```

**Cambios:**
- Agregadas las relaciones opcionales:
  ```typescript
  buys?: ProductBuyed[];
  receiveds?: ProductReceived[];
  delivers?: ProductDelivery[];
  ```
- Importaciones de tipos relacionados

## 🔄 Flujo de Datos

### Backend → Frontend

**Endpoint utilizado:**
```
GET /api_data/product/{id}/
```

**Estructura esperada de respuesta:**
```json
{
  "id": "uuid-del-producto",
  "name": "Nombre Producto",
  "status": "ENTREGADO",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-02T15:30:00Z",
  "amount_purchased": 5,
  "amount_received": 5,
  "amount_delivered": 5,
  "buys": [
    {
      "buy_date": "2025-12-01T10:30:00Z",
      "amount_buyed": 5
    }
  ],
  "receiveds": [
    {
      "created_at": "2025-12-01T18:00:00Z",
      "amount_received": 5
    }
  ],
  "delivers": [
    {
      "created_at": "2025-12-02T09:00:00Z",
      "amount_delivered": 5
    }
  ]
}
```

## 🎨 Estados y Colores

| Estado | Icono | Color | Descripción |
|--------|-------|-------|-------------|
| Creado | CheckCircle2 | Gris | Registro inicial en el sistema |
| Comprado | ShoppingCart | Azul | Producto fue comprado en la tienda |
| Recibido | Package | Amarillo | Producto fue recibido |
| Entregado | Truck | Verde | Producto fue entregado al cliente |
| Pendiente | Clock | Gris | Esperando siguiente estado |

## 🧠 Lógica de Construcción del Timeline

1. **Se crea el evento "Registro Creado"** siempre (si existe `created_at`)
2. **Se crea el evento "Comprado"** si:
   - Existen registros en `buys` array, O
   - El status es "COMPRADO" y `amount_purchased > 0`
3. **Se crea el evento "Recibido"** si:
   - Existen registros en `receiveds` array, O
   - El status es "RECIBIDO" y `amount_received > 0`
4. **Se crea el evento "Entregado"** si:
   - Existen registros en `delivers` array, O
   - El status es "ENTREGADO" y `amount_delivered > 0`

5. **Los eventos se ordenan cronológicamente** por fecha ascendente

## 🖼️ Características Visuales

### Línea de Tiempo
- **Línea central vertical** con gradiente azul → amarillo → verde
- **Puntos circulares** (12x12px) con iconos para cada evento
- **Bordes blancos** alrededor de cada punto
- **Tarjetas de eventos** con información descriptiva

### Interactividad
- Efecto hover en tarjetas de eventos
- Badges con fecha y hora del evento
- Checkmark verde indicando eventos completados
- Leyenda de estados al pie

## 📅 Formato de Fechas

Se utiliza el locale **es-AR** (Español de Argentina):
```typescript
date.toLocaleDateString('es-AR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
```

**Ejemplo:** `1 de diciembre de 2025 14:30`

## 🔍 Debugging

### Para verificar que el timeline está recibiendo datos:
1. Abrir DevTools → Console
2. En la página del producto, ejecutar:
```javascript
// Inspeccionar datos del producto
console.log(product)

// Verificar relaciones
console.log({
  buys: product.buys,
  receiveds: product.receiveds,
  delivers: product.delivers
})
```

### Si no aparecen eventos:
- Verificar que el backend retorna las relaciones
- Confirmar que `amount_purchased/received/delivered > 0`
- Revisar que las fechas están en formato ISO

## 🚀 Mejoras Futuras

1. **Estados intermedios**
   - Agregar estado "Enviado" con fecha de envío
   - Mostrar estado de devolución/cancelación

2. **Información expandida**
   - Click en evento para ver detalles
   - Modal con información de transacción
   - Descargar recibos de cada evento

3. **Analytics**
   - Tiempo promedio entre estados
   - Estadísticas de demora
   - Comparativa con otros productos

4. **Filtros**
   - Ver solo ciertos tipos de eventos
   - Rango de fechas personalizado

## 📝 Notas Técnicas

- El componente es **responsivo** y se adapta a diferentes tamaños de pantalla
- Utiliza **Tailwind CSS v4** para estilos
- Compatible con **tema oscuro/claro** (heredado de shadcn/ui)
- Sin dependencias externas además de las ya incluidas en el proyecto

## ✅ Checklist de Validación

- [x] Componente timeline creado
- [x] Integración en product-details.tsx
- [x] Tipos TypeScript actualizados
- [x] Manejo de fechas de relaciones
- [x] Ordenamiento cronológico
- [x] Fallback para productos sin eventos
- [x] Leyenda de estados
- [x] Responsive design
- [x] Estilos coherentes con el diseño existente
- [x] Documentación completa
