# Reglas de costos (RN-001 a RN-004)

Todas las cantidades monetarias se redondean a 2 decimales con redondeo aritmético (`round2` en admin-next: `Math.round((n + EPSILON) * 100) / 100`; `round(x, 2)` en Django). Los casos de prueba están en [`../casos/product-cost.json`](../casos/product-cost.json).

## RN-001 Costo de un producto

**Desde:** 1.0.0. **Estado:** vigente (refleja el código).

Entradas del producto: `shopCost` (precio unitario en la tienda), `amountRequested` (cantidad pedida), `shopDeliveryCost` (envío de la tienda, por línea, no por unidad), `chargeIva` (booleano), `shopTaxes` (tarifa de la tienda en porcentaje, p. ej. 5 = 5 %), `addedTaxes` (impuestos adicionales), `ownTaxes` (impuestos propios).

```
subtotal       = shopCost × amountRequested
base           = subtotal + shopDeliveryCost
baseTax        = chargeIva ? base × 0.07 : 0          (IVA 7 % sobre la base)
shopTaxAmount  = (base + baseTax) × (shopTaxes / 100) (tarifa de tienda sobre base + IVA)
totalCost      = base + baseTax + shopTaxAmount + addedTaxes + ownTaxes
```

Cada campo derivado (`baseTax`, `shopTaxAmount`, `totalCost`, y también `addedTaxes` y `ownTaxes` al persistir) se redondea a 2 decimales.

Aclaraciones que corrigen documentos anteriores (contradicciones C1/C2 de `doc/legacy/`):

- La cantidad **sí** multiplica el precio unitario.
- El IVA se aplica sobre **precio × cantidad + envío**, no solo sobre el precio.
- La tarifa de tienda se aplica sobre **base + IVA**, no sobre la base sola (salvo que `chargeIva` sea falso, en cuyo caso IVA = 0).
- `addedTaxes` y `ownTaxes` se suman al final y no llevan IVA ni tarifa.

Implementación de referencia:

- admin-next: `apps/admin-next/src/lib/order-cost.ts` (`computeProductCost`, `round2`).
- Django: la cascada la calcula el cliente y Django la persiste redondeada en `backend/api/models/products.py` (`Product.save()`); la misma fórmula se recalcula en `backend/api/models/shops.py` (`ShoppingReceip._calculate_product_cost`) y en `backend/api/services/purchases_service.py` (`calculate_product_buyed_cost`).
- admin Vite: `apps/admin/src/components/products/ProductForm.tsx` (`calculateTotalCost`).

El costo total de la orden es la suma de `totalCost` de sus productos, redondeada (`Order.update_total_costs`, `refreshOrderTotals` en admin-next). Cambiar o borrar un producto obliga a refrescar `total_costs` y el estado de pago (RN-020).

## RN-002 Costo por peso de una entrega

**Desde:** 1.0.0. **Estado:** vigente.

```
weightCost = round2(weight × category.clientShippingCharge)
```

- `weight` en libras, fijado al pesar la bolsa (ES-entrega).
- `clientShippingCharge` es el cobro al cliente por libra definido en la categoría de la entrega. Si la entrega no tiene categoría, el cargo es 0 (por eso INV-002 exige categoría antes de embolsar).
- `weightCost` es lo que el cliente debe por la entrega y entra en el balance (RN-021) y en el estado de pago de la entrega (RN-020).
- Se calcula **una sola vez**, al pesar; no se recalcula si después cambia la tarifa de la categoría. Re-pesar (solo admin, INV-004) lo recalcula.

Implementación: `apps/admin-next/src/app/(admin)/delivery/actions.ts` (`deriveCosts`, `registerBagWeightAction`); admin Vite `delivery-form.tsx`; Django no lo calcula (lo recibe del cliente).

## RN-003 Comisión del gestor

**Desde:** 1.0.0. **Estado:** vigente.

```
managerProfit = round2(weight × client.assignedAgent.agentProfit)
```

- `agentProfit` es la comisión por libra del agente **asignado al cliente** en el momento de pesar (no el `sales_manager` de la orden).
- Si el cliente no tiene agente asignado, la comisión es 0.
- Se fija al pesar, junto con RN-002. Solo cambia al re-pesar.
- No afecta al balance del cliente; es información de ganancia del sistema: `ganancia = weightCost − managerProfit − weight × category.shippingCostPerPound`.

Implementación: mismos archivos que RN-002; propiedad `system_delivery_profit` en `backend/api/models/deliveries.py`.

## RN-004 Estimación del costo de una compra parcial

**Desde:** 1.0.0. **Estado:** vigente.

Al calcular cuánto cuesta un producto dentro de una compra (para el total estimado de la compra y para reportes):

```
si amountBuyed == amountRequested:  costo = product.totalCost
si no:                              costo = RN-001 con amountRequested := amountBuyed
```

Es decir, cuando se compran todas las unidades pedidas se usa el costo ya almacenado; cuando se compran menos (o más), se recalcula la cascada completa con las unidades compradas, manteniendo el envío, el IVA, la tarifa y los impuestos del producto. El total de la compra es la suma redondeada de estos costos, excluyendo productos reembolsados en los reportes de ganancia.

Implementación: `backend/api/models/shops.py:79-112` (`ShoppingReceip._calculate_product_cost`), `backend/api/services/purchases_service.py` (`calculate_product_buyed_cost`); en admin-next `estimatePurchaseCost` / `estimateBuyedCost` en `src/lib/order-cost.ts` (fase 1 del plan).

Nota: esta estimación **no** modifica `Product.totalCost` ni `Order.total_costs`. Lo que el cliente debe sigue siendo el costo de lo pedido (RN-001) hasta que el agente ajuste la cantidad pedida del producto.
