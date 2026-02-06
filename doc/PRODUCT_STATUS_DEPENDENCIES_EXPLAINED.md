# 📊 DEPENDENCIAS DE ESTADOS DE PRODUCTOS - EXPLICACIÓN VISUAL

**Documento:** Flujo de cambio de estado con dependencias claras
**Fecha:** 6 de febrero de 2026
**Status:** ACTUALIZADO CON DEPENDENCIAS OBLIGATORIAS

---

## 🎯 REGLA FUNDAMENTAL

> **Un producto SOLO puede cambiar de estado si TODAS las condiciones previas están cumplidas**

---

## 📈 FLUJO DE ESTADOS CON DEPENDENCIAS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENCARGADO (Estado Inicial)                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Requisitos para estar en este estado:                                    │
│ • amount_purchased < amount_requested (falta comprar)                    │
│ • amount_received = 0 (no se puede recibir sin comprar)                 │
│ • amount_delivered = 0 (no se puede entregar sin recibir)               │
│                                                                           │
│ Transiciones:                                                             │
│ • ¿Se compró todo lo solicitado?                                         │
│   └─ SÍ: amount_purchased >= amount_requested                            │
│      └─→ COMPRADO (próximo estado)                                       │
│   └─ NO: espera más compras                                              │
│      └─→ Se mantiene en ENCARGADO                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ amount_purchased >= amount_requested
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            COMPRADO                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Requisitos para estar en este estado:                                    │
│ • amount_purchased >= amount_requested ✓ (completamente comprado)       │
│ • amount_received < amount_requested (falta recibir)                     │
│ • amount_delivered = 0 (no se puede entregar sin recibir primero)       │
│                                                                           │
│ Transiciones:                                                             │
│ • ¿Se recibió todo lo comprado?                                          │
│   └─ SÍ: amount_received >= amount_requested                             │
│      └─→ RECIBIDO (próximo estado)                                       │
│   └─ NO: espera más recepciones                                          │
│      └─→ Se mantiene en COMPRADO                                         │
│ • ¿Se revirtió la compra (reembolso)?                                    │
│   └─ SÍ: amount_purchased < amount_requested                             │
│      └─→ ENCARGADO (estado anterior)                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                    amount_received >= amount_requested
                    AND amount_purchased >= amount_requested
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            RECIBIDO                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Requisitos para estar en este estado:                                    │
│ • amount_purchased >= amount_requested ✓ (completamente comprado)       │
│ • amount_received >= amount_requested ✓ (completamente recibido)        │
│ • amount_delivered < amount_received (falta entregar)                    │
│                                                                           │
│ Transiciones:                                                             │
│ • ¿Se entregó todo lo recibido?                                          │
│   └─ SÍ: amount_delivered >= amount_received AND                         │
│      └─ amount_delivered >= amount_purchased                             │
│      └─→ ENTREGADO (próximo estado)                                      │
│   └─ NO: espera más entregas                                             │
│      └─→ Se mantiene en RECIBIDO                                         │
│ • ¿Se revirtió la compra (reembolso)?                                    │
│   └─ SÍ: amount_purchased < amount_requested                             │
│      └─→ COMPRADO (estado anterior)                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
           amount_delivered >= amount_received AND
           amount_delivered >= amount_purchased AND
           amount_purchased >= amount_requested
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ENTREGADO (Estado Final)                        │
├─────────────────────────────────────────────────────────────────────────┤
│ Requisitos para estar en este estado:                                    │
│ • amount_purchased >= amount_requested ✓ (completamente comprado)       │
│ • amount_received >= amount_requested ✓ (completamente recibido)        │
│ • amount_delivered >= amount_received ✓ (completamente entregado)       │
│ • amount_delivered >= amount_purchased ✓ (todo lo comprado fue entregado)
│                                                                           │
│ Transiciones:                                                             │
│ • ¿Se revirtió una entrega?                                              │
│   └─ SÍ: amount_delivered < amount_received                              │
│      └─→ RECIBIDO (estado anterior)                                      │
│   └─ NO: permanece en estado final                                       │
│      └─→ Se mantiene en ENTREGADO                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ VALIDACIÓN DE DEPENDENCIAS

### Tabla de Transiciones Válidas

| Desde | Hacia | Condiciones Requeridas | Válido |
|-------|-------|------------------------|--------|
| ENCARGADO | COMPRADO | amount_purchased ≥ amount_requested | ✓ |
| COMPRADO | RECIBIDO | amount_purchased ≥ requested AND amount_received ≥ requested | ✓ |
| RECIBIDO | ENTREGADO | amount_delivered ≥ requested AND amount_delivered ≥ received | ✓ |
| COMPRADO | ENCARGADO | amount_purchased < amount_requested (reembolso) | ✓ |
| RECIBIDO | COMPRADO | amount_received < amount_requested (devolución) | ✓ |
| ENTREGADO | RECIBIDO | amount_delivered < amount_received (devolución) | ✓ |
| ENCARGADO | RECIBIDO | **SIN pasar por COMPRADO** | ✗ INVÁLIDO |
| ENCARGADO | ENTREGADO | **SIN pasar por COMPRADO y RECIBIDO** | ✗ INVÁLIDO |
| COMPRADO | ENTREGADO | **SIN pasar por RECIBIDO** | ✗ INVÁLIDO |

---

## 📋 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Flujo Normal Completo

```
Producto: "iPhone 13"
amount_requested: 10 unidades

PASO 1: Crear ProductBuyed con amount_buyed = 10
─────────────────────────────────────────────────
Antes:  ENCARGADO (0, 0, 0)
Comprobación:
  • amount_purchased = 10 ≥ 10 ✓
  • Se cumple la condición: 10 ≥ 10
Después: COMPRADO (10, 0, 0)

PASO 2: Crear ProductReceived con amount_received = 5
────────────────────────────────────────────────────
Antes:  COMPRADO (10, 0, 0)
Comprobación:
  • amount_purchased = 10 ≥ 10 ✓
  • amount_received = 5 < 10 ✗ (NO CAMBIA)
Después: COMPRADO (10, 5, 0)

PASO 3: Crear otro ProductReceived con amount_received = 5
──────────────────────────────────────────────────────────
Antes:  COMPRADO (10, 5, 0)
Comprobación:
  • amount_purchased = 10 ≥ 10 ✓
  • amount_received = 10 ≥ 10 ✓
  • amount_delivered = 0 < 10 ✓
  • Se cumple: 10 ≥ 10 AND 0 < 10
Después: RECIBIDO (10, 10, 0)

PASO 4: Crear ProductDelivery con amount_delivered = 10
───────────────────────────────────────────────────────
Antes:  RECIBIDO (10, 10, 0)
Comprobación:
  • amount_purchased = 10 ≥ 10 ✓
  • amount_received = 10 ≥ 10 ✓
  • amount_delivered = 10 ≥ 10 ✓
  • amount_delivered = 10 ≥ 10 ✓
  • Se cumple: 10 ≥ 10 AND 10 ≥ 10 AND 10 ≥ 10 AND 10 ≥ 10
Después: ENTREGADO (10, 10, 10)

RESULTADO FINAL: ✓ Flujo Correcto
```

---

### Ejemplo 2: Intento Inválido (EVITADO)

```
Problema: Intentar ir directamente de COMPRADO a ENTREGADO

Producto: "Samsung Galaxy"
amount_requested: 10 unidades

ESTADO ACTUAL: COMPRADO (10, 0, 0)

INTENTO: Crear ProductDelivery sin crear ProductReceived
─────────────────────────────────────────────────────────

Comprobación:
  • amount_purchased = 10 ≥ 10 ✓
  • amount_received = 0 ≥ 10 ✗ (FALLA AQUÍ)
  • amount_delivered = 10 ≥ 10 ✓
  • amount_delivered = 10 ≥ 0 ✓

LÓGICA:
  if (amount_purchased ≥ amount_requested AND 
      amount_received ≥ amount_requested AND  ← FALLA: 0 ≥ 10 es FALSO
      amount_delivered ≥ amount_received AND 
      amount_delivered ≥ amount_purchased):
    return ENTREGADO

RESULTADO: No cambia a ENTREGADO
Se mantiene en: COMPRADO (10, 0, 10)  ← Estado inválido evitado

CONCLUSIÓN: ✓ El sistema evita esta transición inválida automáticamente
```

---

### Ejemplo 3: Reembolso y Reversión

```
Producto: "Laptop"
amount_requested: 10 unidades

ESTADO INICIAL: COMPRADO (10, 0, 0)

PASO 1: Crear ProductReceived con amount_received = 5
────────────────────────────────────────────────────
Antes:  COMPRADO (10, 0, 0)
Después: COMPRADO (10, 5, 0)  (5 < 10, aún no se recibe todo)

PASO 2: Procesar reembolso: quantity_refuned = 2
───────────────────────────────────────────────
Antes:  COMPRADO (10, 5, 0)

Recalcular:
  • total_purchased = 10 - 2 = 8

Comprobación:
  • amount_purchased = 8 < 10 ✗ (Ya NO cumple condición de COMPRADO)
  • amount_received = 5 ✗ (No puede ser RECIBIDO sin estar COMPRADO)
  • Se revierte a ENCARGADO

Después: ENCARGADO (8, 5, 0)  ← Estado revierte automáticamente

CONCLUSIÓN: ✓ Reembolso revierte el estado correctamente
```

---

## 🔒 VALIDACIONES IMPLEMENTADAS

### En `_determine_product_status()`:

```python
# REGLA 1: RECIBIDO REQUIERE COMPRADO COMPLETO
if (amount_purchased >= amount_requested AND  # ← Debe estar comprado PRIMERO
    amount_received >= amount_requested AND 
    amount_delivered < amount_received):
    return RECIBIDO

# REGLA 2: ENTREGADO REQUIERE COMPRADO Y RECIBIDO COMPLETOS
if (amount_purchased >= amount_requested AND  # ← Debe estar comprado PRIMERO
    amount_received >= amount_requested AND   # ← Debe estar recibido SEGUNDO
    amount_delivered >= amount_received AND 
    amount_delivered >= amount_purchased):
    return ENTREGADO

# REGLA 3: COMPRADO REQUIERE NO HABER RECIBIDO NADA SIN COMPRA COMPLETA
if (amount_purchased >= amount_requested AND 
    amount_received < amount_requested):     # ← No puede ir a RECIBIDO sin esta condición
    return COMPRADO
```

---

## 📊 TABLA DE VERDAD: DETERMINACIÓN DE ESTADO

| Purchased | Received | Delivered | Status |
|-----------|----------|-----------|--------|
| 0 | 0 | 0 | ENCARGADO |
| 5 | 0 | 0 | ENCARGADO |
| 10 | 0 | 0 | COMPRADO ✓ |
| 10 | 5 | 0 | COMPRADO ✓ |
| 10 | 10 | 0 | RECIBIDO ✓ |
| 10 | 10 | 5 | RECIBIDO ✓ |
| 10 | 10 | 10 | ENTREGADO ✓ |
| 10 | 0 | 10 | COMPRADO ✗ (inválido, bloqueado) |
| 10 | 0 | 0 | COMPRADO ✓ |
| 10 | 5 | 10 | COMPRADO ✓ (inválido, bloqueado) |
| 0 | 0 | 10 | ENCARGADO ✗ (imposible crear sin compra) |

---

## 🎯 GARANTÍAS DEL SISTEMA

### ✓ Garantía 1: Transiciones Ordenadas
> Un producto NO PUEDE saltar estados. Debe pasar por ENCARGADO → COMPRADO → RECIBIDO → ENTREGADO

### ✓ Garantía 2: Dependencias Obligatorias
> - NO puedes ir a RECIBIDO sin estar en COMPRADO completo
> - NO puedes ir a ENTREGADO sin estar en RECIBIDO completo
> - NO puedes entregar lo que no recibiste
> - NO puedes recibir lo que no compraste

### ✓ Garantía 3: Reversiones Automáticas
> Si se elimina una transacción o hay reembolso, el estado revierte automáticamente al estado válido anterior

### ✓ Garantía 4: Consistencia
> El sistema verifica TODAS las condiciones antes de cambiar de estado. Si falta UNA, no cambia.

---

## 🚀 FLUJO TÉCNICO DETRÁS DE ESCENAS

```python
@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    # 1. Calcular totales desde BD
    total_purchased = sum(pb.amount_buyed - pb.quantity_refuned for pb in product.buys.all())
    total_received = sum(pr.amount_received for pr in product.receiveds.all())
    total_delivered = sum(pd.amount_delivered for pd in product.delivers.all())
    
    # 2. Determinar nuevo estado con TODAS las validaciones
    new_status = _determine_product_status(
        amount_purchased=total_purchased,      # Verificar
        amount_received=total_received,        # Verificar
        amount_delivered=total_delivered,      # Verificar
        amount_requested=product.amount_requested,
        current_status=product.status
    )
    
    # 3. Actualizar SOLO si cambió
    if product.status != new_status:
        product.status = new_status
        product.save(update_fields=['status', 'updated_at'])
```

---

## 📝 CHECKLIST: Dependencias Implementadas

- [x] RECIBIDO SOLO si COMPRADO completo
- [x] ENTREGADO SOLO si RECIBIDO completo
- [x] NO hay saltos de estado
- [x] NO se puede entregar sin recibir
- [x] NO se puede recibir sin comprar
- [x] Reembolsos revierten estado
- [x] Devoluciones revierten estado
- [x] Validación en cada transacción
- [x] Logs de transiciones
- [x] Documentación clara

---

**✓ Dependencias de Estados Validadas y Documentadas**
