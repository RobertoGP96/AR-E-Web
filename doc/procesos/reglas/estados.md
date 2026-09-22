# Reglas de derivación de estados (RN-010 a RN-012)

Los estados de producto y de orden **no se editan a mano**: se derivan de las cantidades y de los estados de sus hijos cada vez que cambia una compra, recepción o entrega. Los casos de prueba están en [`../casos/product-status.json`](../casos/product-status.json). Máquinas de estado completas en [`../estados/producto.md`](../estados/producto.md) y [`../estados/orden.md`](../estados/orden.md).

## Cantidades agregadas de un producto

| Campo | Definición |
|---|---|
| `amountRequested` | Cantidad pedida por el cliente (editable por el agente). |
| `amountPurchased` | Σ `ProductBuyed.amountBuyed` − Σ `ProductBuyed.quantityRefuned` (nunca negativo). |
| `amountReceived` | Σ `ProductReceived.amountReceived`. |
| `amountDelivered` | Σ `ProductDelivery.amountDelivered` de **todas** las entregas, incluidas las bolsas. Sirve para saber cuántas unidades ya están asignadas y no embolsar dos veces. |
| `amountDeliveredFinal` | Σ `ProductDelivery.amountDelivered` solo de entregas con `status = Entregado`. Es el valor que alimenta el estado (RN-011). No se persiste; se calcula al recalcular. |

## RN-010 Estado del producto derivado de cantidades

**Desde:** 1.0.0. **Estado:** vigente (refleja `_determine_product_status` en `backend/api/signals.py` y `deriveProductStatus` en `apps/admin-next/src/lib/order-cost.ts`).

Se evalúa en orden; gana la primera fila cuya condición completa se cumple. `req`, `pur`, `rec`, `del` son `amountRequested`, `amountPurchased`, `amountReceived` y el valor de entregado que corresponda (RN-011).

| Orden | Estado | Condición exacta |
|---|---|---|
| 1 | `Entregado` | `pur ≥ req` y `rec ≥ req` y `del ≥ rec` y `del ≥ pur` y `del > 0` |
| 2 | `Recibido` | `pur ≥ req` y `rec ≥ req` y `del < rec` y `rec > 0` |
| 3 | `Comprado` | `pur ≥ req` y `rec < req` y `pur > 0` |
| 4 | `Encargado` | en cualquier otro caso (incluida compra parcial `0 < pur < req` y reembolso total) |

Consecuencias que conviene conocer:

- Una **compra parcial** (`pur < req`) deja el producto en `Encargado` aunque se reciba y entregue todo lo comprado (caso RN-010-06). Para cerrar el producto el agente debe ajustar `amountRequested` a lo realmente comprado. Es la limitación B4 del código actual; la regla la documenta, no la resuelve. Cambiarla requiere un ADR.
- Un **reembolso total** vuelve el producto a `Encargado` (RN-010-07).
- Una **sobrecompra** (`pur > req`) recibida y entregada por completo llega a `Entregado`; si solo se entregan las unidades pedidas queda `Recibido` porque `del < rec` (RN-010-10 y RN-010-11).
- Django devuelve el estado actual sin cambiarlo cuando `req ≤ 0`; admin-next devuelve `Encargado`. Los casos evitan `req = 0`; un producto con cantidad pedida 0 no es válido (INV-001).

## RN-011 Solo cuentan como entregadas las unidades en entregas `Entregado`

**Desde:** 1.0.0. **Estado:** nueva (ADR-0005). Implementada en admin-next en la fase 3 del plan; no implementada en Django (ver conformidad).

Al evaluar RN-010, `del` es `amountDeliveredFinal` (unidades en entregas con `status = Entregado`), **no** `amountDelivered`.

- Mientras las unidades están en una bolsa, en una entrega pesada `Pendiente`, `En transito` o `Fallida`, el producto permanece `Recibido` y la interfaz muestra un indicador "en bolsa / en entrega #id" con `amountDelivered − amountDeliveredFinal` unidades.
- Cuando la entrega pasa a `Entregado`, se recalculan **todos** los productos de esa entrega y los que cumplen RN-010 con el nuevo `del` pasan a `Entregado`.
- Si un administrador reabre una entrega (`Entregado → En transito`), se recalculan de nuevo y los productos vuelven a `Recibido`.
- `amountDelivered` sigue contando todas las unidades asignadas; es el valor que limita cuántas unidades quedan por embolsar (`amountReceived − amountDelivered`).

Casos: RN-011-01 a RN-011-03. La función pura es la misma que en RN-010; lo que cambia es qué agregado se le pasa.

## RN-012 Estado de la orden derivado de sus productos

**Desde:** 1.0.0. **Estado:** vigente en Django (`Order.update_status_based_on_products`, `backend/api/models/orders.py:70-127`). **admin-next no lo deriva hoy**: `Order.status` solo cambia a mano (divergencia N4; se corrige en el plan de rediseño).

Se evalúa tras cada recálculo de estado de un producto de la orden:

| Orden | Estado de la orden | Condición |
|---|---|---|
| 0 | (sin cambio) | la orden está `Cancelado` o no tiene productos |
| 1 | `Completado` | todos los productos están `Entregado` |
| 2 | `Procesando` | al menos un producto está `Comprado`, `Recibido` o `Entregado` |
| 3 | `Encargado` | ningún producto ha salido de `Encargado` |

- `Cancelado` es el único estado manual; se respeta siempre y solo un administrador o el agente de la orden lo fijan.
- Una orden `Completado` puede volver a `Procesando` si se reabre una entrega o se añade un producto nuevo (que nace `Encargado`).
- Borrar un producto también dispara la derivación (bug B26 en Django: hoy no lo hace).
