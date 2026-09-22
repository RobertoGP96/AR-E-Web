# Procedimiento de compras (administrador)

Pantallas de admin-next: `/purchases`, `/purchases/new`, `/purchases/[id]`, `/shops`, `/orders/[id]`. Solo el rol `admin` compra ([`../roles.md`](../roles.md)). Reglas aplicables: RN-001, RN-004, RN-010, RN-012, INV-001, INV-005; decisión ADR-0002.

## 1. Preparar tiendas y cuentas

1. `/shops`: cada tienda tiene su tarifa por defecto y al menos una cuenta de compra (`BuyingAccounts`).
2. Si vas a pagar con tarjeta, tenla registrada para indicar `tarjeta` en la compra.

## 2. Crear una compra desde los productos pendientes

1. `/purchases` → "Nueva compra" (o desde `/orders/[id]` → "Comprar pendientes", que preselecciona la tienda si la orden tiene una sola).
2. **Paso 1 — tienda y cuenta.** Elige la tienda y la cuenta de compra. Solo aparecen productos `Encargado` de esa tienda con `pedida − comprada > 0` (INV-005).
3. **Paso 2 — checklist.** Los productos aparecen agrupados por cliente. Marca los que compras; la cantidad por defecto es lo pendiente y puedes bajarla (nunca subirla por encima de `pedida − comprada`, INV-001). Cada fila muestra el costo estimado (RN-004): si compras todo lo pedido es el `totalCost` del producto; si compras menos, se recalcula con las unidades marcadas. Usa el buscador y "marcar todo / nada" por cliente. En móvil son tarjetas apiladas con stepper táctil y barra inferior con el resumen.
4. **Paso 3 — datos de la compra.** Fecha, estado de pago de la compra (lo fijas tú según lo cobrado en la tarjeta), tarjeta, y `total pagado` prellenado con la suma estimada (edítalo con el importe real del recibo de la tienda).
5. "Crear compra". Todo se escribe en una transacción: `ShoppingReceip`, un `ProductBuyed` por producto marcado y el recálculo de cada producto (`Encargado → Comprado` si compraste todo lo pedido). Te lleva a `/purchases/[id]` con el CTA "Registrar paquete".

## 3. Completar o corregir una compra

En `/purchases/[id]`:

- "Añadir productos": abre el mismo checklist (tienda fija) para incluir productos que faltaban.
- "Reembolsar": indica unidades reembolsadas e importe. La cantidad comprada neta baja; si baja por debajo de lo recibido, se bloquea (INV-001): primero el logístico retira la recepción.
- "Quitar producto comprado": solo si no tiene unidades recibidas.
- Editar cabecera (`purchase-dialog`): fecha, cuenta, tarjeta, estado de pago, total pagado. La cabecera no cambia cantidades.

## 4. Compra parcial

Si la tienda solo tenía parte de las unidades:

1. Compra lo disponible (cantidad menor en el checklist).
2. El producto seguirá `Encargado` (RN-010-06). Avisa al agente para que baje la cantidad pedida a lo comprado, o crea después otra compra con el resto (misma tienda, aparecerá de nuevo como pendiente).

## Qué NO hacer

- No crees una compra vacía "para llenarla después"; el flujo es marcar productos y crear.
- No incluyas en una compra productos de otra tienda (el checklist no los muestra; la action lo rechaza, INV-005).
- No cambies el estado del producto ni de la orden a mano tras comprar: se derivan (RN-010, RN-012).
- No corrijas la cantidad comprada borrando y recreando: usa reembolso (deja rastro y respeta INV-001).
- No uses `total pagado` de la compra como costo para el cliente: lo que el cliente debe es el costo de la orden (RN-001), no lo que pagó la tarjeta.

## Errores esperados

| Mensaje | Causa | Solución |
|---|---|---|
| "Cantidad mayor que lo pendiente de comprar" | INV-001 | Baja la cantidad. Si la tienda envió más unidades, edita la compra como admin y documenta la sobrecompra. |
| "El producto no pertenece a la tienda de la compra" | INV-005 | Crea otra compra para la tienda correcta. |
| "No se puede reembolsar: hay unidades recibidas" | INV-001 | Pide al logístico que retire la recepción (y las unidades de la bolsa). |
| "Producto duplicado en la compra" | El checklist se envió dos veces | Refresca; el producto ya está en la compra. |
| "No se pudo borrar la compra: tiene productos comprados" | Borrado con hijos | Quita/reembolsa los productos antes, o deja la compra. |
