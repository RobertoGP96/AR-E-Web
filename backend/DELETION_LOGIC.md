# Resumen de Cambios: Eliminación en Cascada con Actualización de Cantidades

## Problema Original
Al eliminar compras, paquetes o entregas, los productos relacionados se eliminaban pero las cantidades en los productos originales NO se actualizaban correctamente.

## Solución Implementada

### 1. ShoppingReceip (Compras)
**Archivo:** `backend/api/models/shops.py`

**Lógica de eliminación:**
- Descuenta `amount_buyed` de `amount_purchased` del producto original
- **Cambio de estado:**
  - Si `amount_purchased < amount_requested` → Estado: `ENCARGADO`

**Ejemplo:**
```
Producto: Laptop
- amount_requested: 10
- amount_purchased: 5 (después de comprar 5)
- Estado: COMPRADO

Al eliminar la compra:
- amount_purchased: 0
- Estado: ENCARGADO ✓
```

---

### 2. Package (Paquetes)
**Archivo:** `backend/api/models/deliveries.py`

**Lógica de eliminación:**
- Descuenta `amount_received` de `amount_received` del producto original
- **Cambio de estado:**
  - Si `amount_received < amount_purchased` y estado es `RECIBIDO`:
    - Si `amount_purchased > 0` → Estado: `COMPRADO`
    - Si `amount_purchased == 0` → Estado: `ENCARGADO`

**Ejemplo:**
```
Producto: Laptop
- amount_requested: 10
- amount_purchased: 10
- amount_received: 8 (después de recibir paquete con 8)
- Estado: RECIBIDO

Al eliminar el paquete:
- amount_received: 0
- Estado: COMPRADO ✓ (porque aún tiene amount_purchased = 10)
```

---

### 3. DeliverReceip (Entregas)
**Archivo:** `backend/api/models/deliveries.py`

**Lógica de eliminación:**
- Descuenta `amount_delivered` de `amount_delivered` del producto original
- **Cambio de estado:**
  - Si `amount_delivered < amount_received` y estado es `ENTREGADO`:
    - Si `amount_received > 0` → Estado: `RECIBIDO`
    - Si `amount_received == 0` pero `amount_purchased > 0` → Estado: `COMPRADO`

**Ejemplo:**
```
Producto: Laptop
- amount_requested: 10
- amount_purchased: 10
- amount_received: 10
- amount_delivered: 10
- Estado: ENTREGADO

Al eliminar la entrega:
- amount_delivered: 0
- Estado: RECIBIDO ✓ (porque aún tiene amount_received = 10)
```

---

## Flujo de Estados del Producto

```
ENCARGADO → COMPRADO → RECIBIDO → ENTREGADO
    ↑          ↑          ↑
    |          |          |
Eliminar   Eliminar   Eliminar
Compra     Paquete    Entrega
```

## Verificaciones Implementadas

### ✅ ShoppingReceip.delete()
- Verifica que `amount_purchased` no sea negativo
- Solo cambia a `ENCARGADO` si la cantidad es insuficiente

### ✅ Package.delete()
- Verifica que `amount_received` no sea negativo
- Solo cambia estado si actualmente es `RECIBIDO`
- Considera si hay productos comprados para determinar el nuevo estado

### ✅ DeliverReceip.delete()
- Verifica que `amount_delivered` no sea negativo
- Solo cambia estado si actualmente es `ENTREGADO`
- Considera la cascada: RECIBIDO → COMPRADO según cantidades

## Beneficios

1. **Consistencia de datos:** Las cantidades siempre reflejan el estado real
2. **Estados correctos:** Los productos vuelven al estado apropiado
3. **Trazabilidad:** Se mantiene la integridad del flujo de trabajo
4. **Prevención de errores:** Uso de `max(0, ...)` para evitar valores negativos
