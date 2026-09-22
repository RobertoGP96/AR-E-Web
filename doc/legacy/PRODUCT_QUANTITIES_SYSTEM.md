# 📊 Sistema de Control de Cantidades de Productos

## 🎯 Descripción General

El modelo `Product` mantiene tres campos centrales que almacenan y controlan todas las cantidades en el ciclo de vida de un producto:

| Campo | Descripción |
|-------|-------------|
| **`amount_purchased`** | Cantidad total de productos **comprados** |
| **`amount_received`** | Cantidad total de productos **recibidos** |
| **`amount_delivered`** | Cantidad total de productos **entregados** |

Estos campos se actualizan **automáticamente** mediante signals cuando se crean, modifican o eliminan los subproductos relacionados.

---

## 🔄 Flujo de Cambio de Estado

El estado del producto se determina automáticamente basándose en las cantidades usando la función `_determine_product_status()`:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ESTADOS                              │
└─────────────────────────────────────────────────────────────────┘

        ┌─────────────────────────────────────────────────────┐
        │ ENCARGADO (Estado Inicial)                          │
        │ amount_purchased < amount_requested                 │
        └────────────┬────────────────────────────────────────┘
                     │
                     │ Se compran productos
                     │ amount_purchased >= amount_requested
                     ▼
        ┌─────────────────────────────────────────────────────┐
        │ COMPRADO                                            │
        │ amount_purchased >= amount_requested                │
        │ amount_received < amount_requested                  │
        └────────────┬────────────────────────────────────────┘
                     │
                     │ Se reciben productos
                     │ amount_received >= amount_requested
                     ▼
        ┌─────────────────────────────────────────────────────┐
        │ RECIBIDO                                            │
        │ amount_received >= amount_requested                 │
        │ amount_delivered < amount_received                  │
        └────────────┬────────────────────────────────────────┘
                     │
                     │ Se entregan productos
                     │ amount_delivered >= amount_received      │
                     ▼
        ┌─────────────────────────────────────────────────────┐
        │ ENTREGADO (Estado Final)                            │
        │ amount_delivered >= amount_received                 │
        │ amount_delivered >= amount_purchased                │
        └─────────────────────────────────────────────────────┘
```

---

## 🔗 Relaciones entre Modelos

```
Product (Principal)
│
├── amount_purchased ◄──── ProductBuyed (compras)
│   └─ Se actualiza cuando se crean/modifican/eliminan ProductBuyed
│   └─ Formula: SUM(pb.amount_buyed - pb.quantity_refuned)
│
├── amount_received ◄──── ProductReceived (recepciones)
│   └─ Se actualiza cuando se crean/modifican/eliminan ProductReceived
│   └─ Formula: SUM(pr.amount_received)
│
└── amount_delivered ◄──── ProductDelivery (entregas)
    └─ Se actualiza cuando se crean/modifican/eliminan ProductDelivery
    └─ Formula: SUM(pd.amount_delivered)
```

---

## 📝 Signals y Actualizaciones Automáticas

### 1. **ProductBuyed Signals**

#### `update_product_on_buyed_save()`
Se ejecuta cuando se **crea o actualiza** un `ProductBuyed`:

```python
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    product = instance.original_product
    
    # Recalcula: suma de todas las compras (restando devoluciones)
    total_purchased = sum(
        pb.amount_buyed - pb.quantity_refuned
        for pb in product.buys.all()
    )
    product.amount_purchased = max(0, total_purchased)
    
    # Determina automáticamente el nuevo estado
    product.status = _determine_product_status(
        amount_purchased=product.amount_purchased,
        amount_received=product.amount_received,
        amount_delivered=product.amount_delivered,
        amount_requested=product.amount_requested,
        current_status=product.status
    )
    
    product.save(update_fields=['amount_purchased', 'status'])
```

**Ejemplo:**
```
Si amount_requested = 10
1. Se crea ProductBuyed con amount_buyed = 5
   → amount_purchased = 5
   → status = ENCARGADO (5 < 10)

2. Se crea otro ProductBuyed con amount_buyed = 5
   → amount_purchased = 10
   → status = COMPRADO (10 >= 10)

3. Se refunda con quantity_refuned = 2
   → amount_purchased = 8 (10 - 2)
   → status = ENCARGADO (8 < 10)
```

#### `update_product_on_buyed_delete()`
Se ejecuta cuando se **elimina** un `ProductBuyed`:
- Recalcula `amount_purchased` restando el registro eliminado
- Ajusta automáticamente el estado

---

### 2. **ProductReceived Signals**

#### `update_product_on_received_save()`
Se ejecuta cuando se **crea o actualiza** un `ProductReceived`:

```python
def update_product_on_received_save(sender, instance, created, **kwargs):
    product = instance.original_product
    
    # Recalcula: suma de todas las recepciones
    total_received = sum(
        pr.amount_received
        for pr in product.receiveds.all()
    )
    product.amount_received = total_received
    
    # Determina automáticamente el nuevo estado
    product.status = _determine_product_status(...)
    
    product.save(update_fields=['amount_received', 'status'])
```

**Ejemplo:**
```
Si amount_requested = 10, amount_purchased = 10
1. Se crea ProductReceived con amount_received = 5
   → amount_received = 5
   → status = COMPRADO (5 < 10)

2. Se crea otro ProductReceived con amount_received = 5
   → amount_received = 10
   → status = RECIBIDO (10 >= 10)
```

#### `update_product_on_received_delete()`
Se ejecuta cuando se **elimina** un `ProductReceived`:
- Recalcula `amount_received` sin el registro eliminado
- Ajusta automáticamente el estado

---

### 3. **ProductDelivery Signals**

#### `update_product_on_delivery_save()`
Se ejecuta cuando se **crea o actualiza** un `ProductDelivery`:

```python
def update_product_on_delivery_save(sender, instance, created, **kwargs):
    product = instance.original_product
    
    # Recalcula: suma de todas las entregas
    total_delivered = sum(
        pd.amount_delivered
        for pd in product.delivers.all()
    )
    product.amount_delivered = total_delivered
    
    # Determina automáticamente el nuevo estado
    product.status = _determine_product_status(...)
    
    product.save(update_fields=['amount_delivered', 'status'])
    
    # Verifica si la orden debe completarse
    if product.order:
        product.order.update_status_based_on_delivery()
```

**Ejemplo:**
```
Si amount_purchased = 10, amount_received = 10
1. Se crea ProductDelivery con amount_delivered = 5
   → amount_delivered = 5
   → status = RECIBIDO (5 < 10)

2. Se crea otro ProductDelivery con amount_delivered = 5
   → amount_delivered = 10
   → status = ENTREGADO (10 >= 10)
```

#### `update_product_on_delivery_delete()`
Se ejecuta cuando se **elimina** un `ProductDelivery`:
- Recalcula `amount_delivered` sin el registro eliminado
- Ajusta automáticamente el estado
- Revisa si la orden necesita cambiar de estado

---

## 💡 Casos de Uso Comunes

### Caso 1: Compra Parcial y Completa
```
Producto: iPhone 13 | amount_requested = 10

1. Compra inicial: ProductBuyed(amount_buyed=5)
   → amount_purchased = 5
   → status = ENCARGADO

2. Compra adicional: ProductBuyed(amount_buyed=5)
   → amount_purchased = 10
   → status = COMPRADO ✓ (cambio automático)
```

### Caso 2: Recepción Parcial
```
Producto: iPhone 13 | amount_purchased = 10

1. Primera recepción: ProductReceived(amount_received=7)
   → amount_received = 7
   → status = COMPRADO (7 < 10)

2. Segunda recepción: ProductReceived(amount_received=3)
   → amount_received = 10
   → status = RECIBIDO ✓ (cambio automático)
```

### Caso 3: Entrega y Recepción de Clientes
```
Producto: iPhone 13 | amount_received = 10

1. Entrega parcial: ProductDelivery(amount_delivered=6)
   → amount_delivered = 6
   → status = RECIBIDO (6 < 10)

2. Entrega completa: ProductDelivery(amount_delivered=4)
   → amount_delivered = 10
   → status = ENTREGADO ✓ (cambio automático)
```

### Caso 4: Devolución y Reembolso
```
Producto: iPhone 13 | amount_purchased = 10

1. Reembolso: ProductBuyed.quantity_refuned = 2
   → amount_purchased = 8 (10 - 2)
   → status = ENCARGADO (8 < 10) ✓ (cambio automático)
```

---

## 🔍 Propiedades Calculadas del Producto

El modelo `Product` proporciona propiedades útiles basadas en estos campos:

```python
@property
def pending_purchase(self):
    """Cantidad aún falta por comprar"""
    return self.amount_requested - self.amount_purchased

@property
def pending_received(self):
    """Cantidad aún falta por recibir"""
    return self.amount_purchased - self.amount_received

@property
def pending_delivery(self):
    """Cantidad aún falta por entregar"""
    return self.amount_received - self.amount_delivered

@property
def is_fully_purchased(self):
    """¿Se compró todo lo solicitado?"""
    return self.amount_purchased >= self.amount_requested

@property
def is_fully_received(self):
    """¿Se recibió todo lo comprado?"""
    return self.amount_received >= self.amount_purchased

@property
def is_fully_delivered(self):
    """¿Se entregó todo lo recibido?"""
    return self.amount_delivered >= self.amount_received
```

---

## ✅ Verificación de Integridad

Para verificar que el sistema está funcionando correctamente:

```python
# En una vista o script
product = Product.objects.get(id=uuid)

# Verificar que las cantidades son consistentes
assert product.amount_purchased >= 0
assert product.amount_received >= 0
assert product.amount_delivered >= 0

# Verificar el orden correcto
assert product.amount_purchased >= product.amount_received
assert product.amount_received >= product.amount_delivered

# Verificar que el estado sea consistente
print(f"amount_purchased: {product.amount_purchased}")
print(f"amount_received: {product.amount_received}")
print(f"amount_delivered: {product.amount_delivered}")
print(f"status: {product.status}")
```

---

## 🚀 Flujo de Implementación

1. **✅ Campos definidos** en `Product`:
   - `amount_purchased` (por defecto 0)
   - `amount_received` (por defecto 0)
   - `amount_delivered` (por defecto 0)

2. **✅ Signals configurados**:
   - `ProductBuyed` → actualiza `amount_purchased`
   - `ProductReceived` → actualiza `amount_received`
   - `ProductDelivery` → actualiza `amount_delivered`

3. **✅ Determinación de estado centralizada**:
   - Función `_determine_product_status()` en signals.py
   - Lógica coherente y mantenible

4. **✅ Propiedades calculadas**:
   - `pending_purchase`, `pending_received`, `pending_delivery`
   - `is_fully_purchased`, `is_fully_received`, `is_fully_delivered`

---

## 📚 Documentación Relacionada

- [Signals en Django](https://docs.djangoproject.com/en/stable/topics/signals/)
- [Modelos de Productos](../backend/api/models/products.py)
- [Signals del Sistema](../backend/api/signals.py)
- [Enums y Estados](../backend/api/enums.py)

---

**Última actualización**: 5 de febrero de 2026
**Sistema**: Shein Shop Management System
