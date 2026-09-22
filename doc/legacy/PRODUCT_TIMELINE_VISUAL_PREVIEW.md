# 🎨 Product Timeline - Vista Previa Visual

## Estructura de la Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│  Historial de Eventos del Producto                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ●                                                             │
│    │  Registro Creado                    ✓ 1 de dic 10:00      │
│    │  El producto fue registrado en el sistema                 │
│    │                                                             │
│    │    ●                                                        │
│    │    │  Comprado                      ✓ 1 de dic 10:30      │
│    │    │  Se compraron 5 unidad(es) del producto              │
│    │    │                                                        │
│    │    │  ●                                                     │
│    │    │  │  Recibido                   ✓ 1 de dic 18:00      │
│    │    │  │  Se recibieron 5 unidad(es) del producto          │
│    │    │  │                                                     │
│    │    │  │  ●                                                  │
│    │    │  │  │  Entregado                ✓ 2 de dic 09:00     │
│    │    │  │  │  Se entregaron 5 unidad(es) al cliente        │
│    │    │  │  │                                                  │
│    │    │  │  │                                                  │
│    ▼    ▼  ▼  ▼                                                  │
│    ━━━━━━━━━━━━━━━━━ (Línea de gradiente)                      │
│                                                                  │
│ Estados Disponibles:                                            │
│  ● Comprado  ● Recibido  ● Entregado  ● Pendiente              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes Visuales

### 1. Tarjeta del Timeline
```
┌─────────────────────────────────┐
│ ● Comprado  1 de dic 10:30  ✓  │
│ Se compraron 5 unidad(es)...    │
└─────────────────────────────────┘
```
- **Punto colorido** (●): Icono de estado
- **Título**: Nombre del evento
- **Badge**: Fecha y hora
- **Checkmark**: Indicador de completado
- **Descripción**: Detalles del evento

### 2. Icono por Estado

| Estado | Icono | Descripción |
|--------|-------|-------------|
| 🛒 Comprado | ShoppingCart | Compra realizada |
| 📦 Recibido | Package | Recepción de paquete |
| 🚚 Entregado | Truck | Entrega completada |
| ⏰ Pendiente | Clock | En espera |
| ✓ Creado | CheckCircle2 | Registro inicial |

### 3. Colores de Fondo

```
Gris (#F3F4F6)    - Estados iniciales y pendientes
Azul (#DBEAFE)    - Comprado
Amarillo (#FEF3C7) - Recibido
Verde (#DCFCE7)   - Entregado
Rojo (#FEE2E2)    - Cancelado
```

## Layout Responsivo

### Desktop (1024px+)
```
┌──────────────────────────────────────┐
│  ● Evento 1                          │
│  Descripción...                      │
│                                      │
│    ● Evento 2                        │
│    Descripción...                    │
└──────────────────────────────────────┘
```

### Tablet (640px - 1023px)
```
┌────────────────────┐
│ ● Evento 1         │
│ Desc...            │
│                    │
│  ● Evento 2        │
│  Desc...           │
└────────────────────┘
```

### Mobile (< 640px)
```
● Evento 1
Descripción...

● Evento 2
Descripción...
```

## Ejemplo de Datos Completos

### Producto SIN eventos
```json
{
  "id": "abc123",
  "name": "Producto Nuevo",
  "status": "ENCARGADO",
  "created_at": "2025-12-02T10:00:00Z",
  "buys": [],
  "receiveds": [],
  "delivers": []
}
```

**Timeline mostrada:**
```
⚠ No hay eventos registrados para este producto
```

### Producto CON eventos (ciclo completo)
```json
{
  "id": "abc123",
  "name": "Producto Entregado",
  "status": "ENTREGADO",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-02T15:30:00Z",
  "amount_purchased": 5,
  "amount_received": 5,
  "amount_delivered": 5,
  "buys": [
    {"buy_date": "2025-12-01T10:30:00Z", "amount_buyed": 5}
  ],
  "receiveds": [
    {"created_at": "2025-12-01T18:00:00Z", "amount_received": 5}
  ],
  "delivers": [
    {"created_at": "2025-12-02T09:00:00Z", "amount_delivered": 5}
  ]
}
```

**Timeline mostrada:**
```
✓ Registro Creado          1 de diciembre de 2025 10:00
  El producto fue registrado en el sistema

✓ Comprado                 1 de diciembre de 2025 10:30
  Se compraron 5 unidad(es) del producto

✓ Recibido                 1 de diciembre de 2025 18:00
  Se recibieron 5 unidad(es) del producto

✓ Entregado                2 de diciembre de 2025 09:00
  Se entregaron 5 unidad(es) al cliente
```

### Producto EN PROGRESO
```json
{
  "id": "def456",
  "name": "Producto en Compra",
  "status": "COMPRADO",
  "created_at": "2025-12-01T10:00:00Z",
  "amount_purchased": 3,
  "amount_received": 0,
  "amount_delivered": 0,
  "buys": [
    {"buy_date": "2025-12-01T10:30:00Z", "amount_buyed": 3}
  ],
  "receiveds": [],
  "delivers": []
}
```

**Timeline mostrada:**
```
✓ Registro Creado          1 de diciembre de 2025 10:00
  El producto fue registrado en el sistema

✓ Comprado                 1 de diciembre de 2025 10:30
  Se compraron 3 unidad(es) del producto

(Esperando: Recibido)
(Esperando: Entregado)
```

## Integración en ProductDetails

### Posición en el layout
```
┌────────────────────────────────────────────┐
│  Detalles del Producto (Card Header)       │
├────────────────────────────────────────────┤
│                                            │
│  [Imagen del Producto]                     │
│                                            │
│  ┌──────────────┬──────────────────────┐  │
│  │ Información  │  Información         │  │
│  │ General      │  Económica           │  │
│  │              │                      │  │
│  │ - Desc       │ - Precios            │  │
│  │ - Estado     │ - Impuestos          │  │
│  │ - Tienda     │ - Costo Total        │  │
│  └──────────────┴──────────────────────┘  │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  📊 TIMELINE DEL PRODUCTO          │   │
│  │  ● Evento 1                        │   │
│  │  ● Evento 2                        │   │
│  │  ● Evento 3                        │   │
│  │  ● Evento 4                        │   │
│  └────────────────────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

## Estados Especiales

### Producto Cancelado
```
✓ Registro Creado          1 de dic 10:00
  El producto fue registrado en el sistema

⚠ Cancelado                1 de dic 11:00
  Estado actual: Cancelado
```

### Producto con Devolución
```
✓ Registro Creado          1 de dic 10:00
✓ Comprado                 1 de dic 10:30
✓ Recibido                 1 de dic 18:00
✓ Entregado                2 de dic 09:00

⚠ Devolución Iniciada      3 de dic 14:00
  Devuelto por cliente
```

## Performance y Optimizaciones

- **Lazy rendering**: Los eventos se renderizan solo cuando son visibles
- **Memoización**: El componente es pure y no se redibuja innecesariamente
- **CSS puro**: Sin animaciones costosas
- **Gradientes nativos**: Uso de Tailwind para mejor rendimiento

## Accesibilidad

✓ **Contraste**: Colores cumplen WCAG AA  
✓ **Iconos**: Acompañados de texto descriptivo  
✓ **Semántica**: Estructura HTML correcta  
✓ **Focus**: Navegable con teclado  

## Casos de Uso

### Caso 1: Admin revisando un pedido
1. Abre la página del producto
2. Ve inmediatamente el estado actual y fechas
3. Puede verificar si hay retrasos
4. Identifica rápidamente en qué fase está

### Caso 2: Cliente consultando seguimiento
1. El timeline muestra claramente el progreso
2. Sabe cuándo fue comprado, recibido y entregado
3. Entiende mejor el proceso del e-commerce

### Caso 3: Análisis de rendimiento
1. Comparar tiempos entre eventos
2. Identificar cuellos de botella
3. Optimizar procesos

---

**✨ Vista previa completada. El timeline está listo para producción.**
