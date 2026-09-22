# ADR-0002 — La compra se crea a partir de los productos pendientes de una tienda

**Estado:** Aceptada
**Fecha:** 2026-09-22
**Reglas y estados afectados:** RN-004, RN-010, RN-012, INV-001, INV-005, ES-producto
**Apps impactadas:** admin-next (`/purchases/new`, `/purchases/[id]`, `/orders/[id]`, `purchases/actions.ts`)

## Contexto

En admin-next la compra se creaba como cabecera vacía (`purchase-dialog.tsx`) y luego se añadían productos comprados uno a uno en `/purchases/[id]` (`addBuyedProductAction`). El admin tenía que buscar, por cada producto, en qué orden estaba, cuántas unidades faltaban y si la tienda coincidía. Las validaciones de tienda vivían en la página, no en la action (N8); las escrituras no eran atómicas (N5); y era fácil olvidar productos de un cliente. El admin Vite tiene un flujo parecido (`purshase-form` + `purchase-product-selector`) con las mismas limitaciones.

## Decisión

La compra se crea **desde los productos pendientes de una tienda**: un asistente en `/purchases/new` con (1) tienda y cuenta de compra, (2) checklist de productos `Encargado` de esa tienda con `pedida − comprada > 0`, agrupados por cliente, con cantidad editable (tope `pedida − comprada`) y costo estimado por fila (RN-004), (3) datos de la compra con el total prellenado. La action `createPurchaseWithProductsAction` escribe `ShoppingReceip`, todos los `ProductBuyed` y el recálculo de cada producto en **una transacción**, validando en servidor tienda (INV-005), tope (INV-001) y duplicados.

El detalle de la compra reutiliza el mismo checklist ("Añadir productos", `addBuyedProductsAction`). Desde `/orders/[id]` un admin entra con "Comprar pendientes" (`?orderId=`) para preseleccionar la tienda de esa orden. Reembolsos y bajas de unidades compradas pasan a transacción y se bloquean si dejarían `comprada < recibida`.

## Consecuencias

- Positivas: una compra por tienda con todos los clientes en un solo acto; imposible olvidar productos visibles; imposible mezclar tiendas o superar lo pedido; estado de producto correcto al salir de la transacción.
- Negativas: `purchase-dialog.tsx` queda solo para editar cabecera; el admin que compraba "a ciegas" (sin productos en el sistema) ya no puede: primero el agente carga la orden. Es intencional.
- Trabajo derivado: `src/components/product-checklist.tsx` compartido con ADR-0003 y ADR-0004; `purchaseBatchSchema`; test `purchase-rules.test.ts`; procedimiento `admin-compras.md`.

## Alternativas descartadas

- **Mantener uno a uno y solo añadir validaciones.** Descartada: no reduce pasos ni errores de omisión.
- **Compra por orden (una compra = una orden).** Descartada: en la práctica una compra en Shein incluye productos de varios clientes; forzar una compra por orden multiplica recibos y no refleja el pago real con tarjeta.
- **Marcar "comprado" directamente en el producto sin `ShoppingReceip`.** Descartada: se pierde el recibo, la cuenta de compra, la tarjeta y el costo real, que alimentan reportes de ganancia.
