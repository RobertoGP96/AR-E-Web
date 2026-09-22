# ADR-0004 — Un solo camino de entrega basado en bolsas, con máquina de estados

**Estado:** Aceptada
**Fecha:** 2026-09-22
**Reglas y estados afectados:** ES-entrega, RN-002, RN-003, INV-003, INV-004, INV-005, INV-006
**Apps impactadas:** admin-next (`/delivery`, `/delivery/[id]`, `/delivery/prepare`, `delivery/actions.ts`, `src/lib/delivery-status.ts`, `src/lib/open-bags.ts`, dashboards, `balance/actions.ts`)

## Contexto

Convivían dos caminos: las **bolsas** automáticas del flujo de preparación (`DeliverReceip` `Pendiente` con `weight = 0`, `open-bags.ts`) y la **"Nueva entrega" manual** (`delivery-dialog.tsx`) donde se elegían cliente, categoría, peso, estado y productos a mano. El estado de la entrega era un `select` libre; `registerBagWeightAction` solo comprobaba `Pendiente`, así que se podía re-pesar (N8); `updateDeliveryAction` aceptaba `status` y `weight`; `addDeliveredProductAction` no validaba el cliente en servidor (N8); `removeDeliveredProductAction` no borraba bolsas vacías (N5); las bolsas aparecían como "entregas pendientes" en `/delivery`, en los contadores de los dashboards y en `calculateBalanceRangeAction` (N7); `deliverDate` se sellaba al crear la bolsa (N10); borrar una entrega con hijos fallaba con P2003 (N2).

## Decisión

Existe **un solo camino**: bolsa (automática al recibir, o "Armar entrega desde recibidos") → **pesar y cerrar** → **despachar** (`En transito`) → **entregar** (`Entregado`, con fecha y foto) → cobrar. Se formaliza en `ES-entrega`:

- La bolsa es exactamente `Pendiente` + `weight = 0` + sin pagos (INV-003). Se etiqueta "En preparación" y **no cuenta** como pendiente en `/delivery` (oculta por defecto, filtro `?prep=1`), dashboards ni balances por rango.
- Pesar exige `weight = 0` (INV-004); "Re-pesar" es una acción de admin con `force`. Despachar exige `weight > 0`.
- Transiciones con acciones explícitas y rol: `dispatchDeliveryAction`, `completeDeliveryAction` (fija `deliverDate`, recalcula todos los productos), `failDeliveryAction`, `reopenDeliveryAction` (admin). `updateDeliveryAction` pierde `status` (y `weight` salvo bolsa). No hay select de estado.
- "Nueva entrega" manual se sustituye por "Armar entrega desde recibidos" (`createDeliveryFromReceivedAction` = `addLooseToBag` + peso opcional en una transacción), que reutiliza el checklist agrupado por categoría.
- `addDeliveredProductAction` valida `product.order.clientId === delivery.clientId` (INV-005) y bloquea con `Entregado`; `removeDeliveredProductAction` borra la bolsa si queda vacía; `deleteDeliveryAction` vacía y borra bolsas, y rechaza entregas con peso o pagos con mensaje claro.
- Todas las actions en `$transaction`.

## Consecuencias

- Positivas: imposible crear entregas incoherentes (sin peso en tránsito, re-pesadas, con productos de otro cliente); contadores y balances sin bolsas fantasma; el flujo es el mismo para todas las unidades.
- Negativas: los datos existentes con `deliverDate` de bolsa quedan sesgados hasta que se entreguen; una entrega manual que antes se creaba en un paso ahora requiere que las unidades estén recibidas (es la regla INV-001, antes se saltaba).
- Trabajo derivado: `delivery-status.test.ts`; procedimiento `logistico.md`; conformidad ES-entrega, INV-003, INV-004; contadores en `logistical-dashboard.tsx`, `admin-dashboard.tsx`, `agent-dashboard.tsx`, `balance/actions.ts`.

## Alternativas descartadas

- **Mantener "Nueva entrega" manual y añadir validaciones.** Descartada: dos caminos siguen produciendo entregas distintas para el mismo caso y duplican la lógica de peso y costos.
- **Tabla `Bag` separada.** Descartada por ADR-0001 (sin esquema nuevo); la derivación por `status + weight` es suficiente y compatible con Django y el admin Vite, que ven las bolsas como entregas `Pendiente` de peso 0.
- **Permitir re-pesar a logístico.** Descartada: re-pesar cambia `weight_cost`, comisión, estado de pago y balance; debe quedar restringido y trazable.
