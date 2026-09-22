# ADR-0005 — El producto pasa a `Entregado` solo cuando su entrega está `Entregado`

**Estado:** Aceptada
**Fecha:** 2026-09-22
**Reglas y estados afectados:** RN-011 (nueva), RN-010, RN-012, ES-producto, ES-entrega
**Apps impactadas:** admin-next (`src/lib/product-status.ts`, `delivery/actions.ts`, `status-badges.tsx`, `/products`, `/orders/[id]`, `/settings/system`); Django (no implementada; deuda registrada en conformidad)

## Contexto

Al registrar una llegada, admin-next mete las unidades en una bolsa creando filas `ProductDelivery`. `recomputeProductAmounts` suma **todas** las `ProductDelivery` en `amountDelivered`, y RN-010 evalúa `amountDelivered ≥ amountReceived` → el producto aparecía `Entregado` en el mismo instante en que se marcaba como recibido, con la entrega aún `Pendiente` y sin peso (bug N1). Contaminaba `/products`, `/orders/[id]`, las métricas y, en Django, la derivación de la orden a `Completado` (RN-012). Además `/delivery/[id]` no permitía añadir a mano lo que ya estaba en bolsa.

Django no tiene bolsas: solo crea `ProductDelivery` al crear una entrega manual, por lo que no sufría el síntoma, pero tampoco distingue entre "asignado a una entrega" y "entregado".

## Decisión

Se introduce **RN-011**: para derivar el estado del producto solo cuentan las unidades en entregas con `status = Entregado`.

```
amountDeliveredFinal = Σ ProductDelivery.amountDelivered  where deliverReceip.status = 'Entregado'
status = deriveProductStatus(amountRequested, amountPurchased, amountReceived, amountDeliveredFinal)
amountDelivered      = Σ ProductDelivery.amountDelivered  (todas)   -- se mantiene para no embolsar dos veces
```

- Mientras las unidades están en bolsa, pesadas, en tránsito o fallidas, el producto es `Recibido` y muestra el chip "En bolsa / en entrega #" con `amountDelivered − amountDeliveredFinal` unidades (`ProductStatusBadge` con `inTransit`).
- `completeDeliveryAction` y `reopenDeliveryAction` recalculan todos los productos de la entrega (`recomputeProductsOfDelivery`).
- La función pura `deriveProductStatus` no cambia; cambia qué agregado se le pasa. Los casos RN-011-01 a 03 lo verifican.
- Datos existentes: `recomputeAllProductsAction` (admin, lotes de 200) en `/settings/system` recalcula todos los productos con la nueva regla.
- La decisión es reversible en una línea (pasar `amountDelivered` en lugar de `amountDeliveredFinal`), pero revertirla exige un ADR nuevo.

## Consecuencias

- Positivas: el estado `Entregado` vuelve a significar "en manos del cliente"; las órdenes se completan solo cuando se entregó de verdad; `/delivery/[id]` puede mostrar y ajustar lo que está en bolsa.
- Negativas: divergencia con Django hasta que implemente la misma agregación (una entrega marcada `Entregado` desde el admin Vite recalcula por señales con la regla antigua: las unidades ya contaban, así que el resultado coincide; el caso divergente es una entrega `Pendiente` creada desde el admin Vite, que Django ya contaba como entregada). Se registra en `conformidad.md` como ❌ Django para RN-011.
- Trabajo derivado: `product-status.ts`, `recomputeProductsOfDelivery`, chips, `casos/product-status.json` (RN-011-*), conformidad.

## Alternativas descartadas

- **No crear `ProductDelivery` hasta pesar** (bolsa solo en memoria o con otra tabla). Descartada: la bolsa debe persistir entre sesiones y ser visible desde Django y el admin Vite; requeriría esquema nuevo (ADR-0001).
- **Contar como entregadas las unidades en entregas con peso > 0.** Descartada: una entrega pesada aún puede fallar o reabrirse; "entregado" es el hecho físico, no el pesaje.
- **Añadir un estado `En entrega` al producto.** Descartada: cambia el enum compartido con Django y las tres apps (C16/C18 ya muestran cuánto cuesta un enum desalineado); el chip cumple la misma función sin tocar el enum.
