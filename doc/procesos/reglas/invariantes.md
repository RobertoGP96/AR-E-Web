# Invariantes (INV-001 a INV-006)

Un invariante es una condición que debe cumplirse en la base de datos en todo momento, no solo al final de una operación. Toda mutación que pueda romper uno debe validarlo **en el servidor** (server action o serializer), no solo en la interfaz, y ejecutarse en una transacción. El informe de invariantes de `/settings/system` (admin-next) y el comando `diagnose_product_status` (Django) comprueban INV-001 e INV-003 sobre datos existentes.

## INV-001 Cadena de cantidades

Para cada producto:

```
amountRequested ≥ amountPurchased ≥ amountReceived ≥ amountDelivered ≥ 0
amountRequested > 0
```

Validaciones que lo garantizan:

| Operación | Validación en servidor |
|---|---|
| Comprar `n` unidades | `n ≤ amountRequested − amountPurchased` |
| Reembolsar o quitar `n` unidades compradas | `amountPurchased − n ≥ amountReceived` |
| Recibir `n` unidades | `n ≤ amountPurchased − amountReceived` (no contra `amountRequested`: bug B5 en Django) |
| Quitar una recepción de `n` unidades | `amountReceived − n ≥ amountDelivered`; primero se retiran de bolsas abiertas (`pullUnitsFromOpenBags`) y se bloquea si las unidades están en una entrega pesada |
| Embolsar o entregar `n` unidades | `n ≤ amountReceived − amountDelivered` |
| Reducir `amountRequested` | nuevo valor `≥ amountPurchased` |

Excepción tolerada: sobrecompra (`amountPurchased > amountRequested`) cuando la tienda envía más unidades. Se admite solo desde la edición de la compra por un administrador y el estado se deriva igualmente (RN-010-10).

## INV-002 Categoría obligatoria para recibir y embolsar

Un `ProductReceived` o un `ProductDelivery` solo puede crearse si `product.categoryId` no es nulo. La bolsa se identifica por cliente + categoría, y `weight_cost` (RN-002) depende de la categoría de la entrega.

- Al crear un producto la categoría es obligatoria en admin-next.
- Los productos importados sin categoría (bug N3) se desbloquean con la acción "Asignar categoría" desde el checklist de llegadas antes de poder recibirlos.
- Una entrega hereda la categoría de su bolsa; "Armar entrega desde recibidos" agrupa por categoría y crea una entrega por categoría.

## INV-003 Definición de bolsa

Una bolsa es exactamente una `DeliverReceip` con:

```
status = Pendiente  y  weight = 0  y  paymentAmount = 0  y  balanceApplied = 0
```

- Existe como máximo **una** bolsa por (cliente, categoría). Si una carrera crea dos, se fusionan (fase 4).
- Se crea sola al registrar la primera llegada de ese cliente y categoría; se borra sola cuando se queda sin `ProductDelivery` (`deleteBagIfEmpty`), incluida la eliminación de la última unidad desde la entrega o desde la recepción.
- No admite pagos ni cambios de estado: no se puede despachar ni entregar con peso 0.
- No cuenta como "entrega pendiente" en listados ni dashboards; se muestra como "En preparación".
- `deliver_date` de la bolsa se fija al crearla y se sobrescribe al entregar (fase 3; bug N10).

## INV-004 Una entrega se pesa una sola vez

`registerBagWeight` solo procede si `status = Pendiente` y `weight = 0`. Una entrega con `weight > 0` no se vuelve a pesar salvo por un administrador con la acción explícita "Re-pesar", que recalcula `weight_cost`, `manager_profit`, estado de pago y balance en una transacción y queda registrada. Re-pesar una entrega `Entregado` no está permitido; primero hay que reabrirla.

## INV-005 Pertenencia de tienda y cliente

- Un `ProductBuyed` solo puede pertenecer a una compra cuya `shop_of_buy` sea la tienda del producto (`product.shopId === purchase.shopOfBuyId`).
- Un `ProductDelivery` solo puede pertenecer a una entrega cuyo cliente sea el cliente de la orden del producto (`product.order.clientId === delivery.clientId`).
- Un `ProductReceived` puede pertenecer a cualquier paquete (un paquete mezcla clientes y tiendas).

Se valida en el servidor en cada alta (bug N8: hoy solo en la página).

## INV-006 Los estados de paquete y entrega solo cambian por transiciones permitidas

`Package.status` y `DeliverReceip.status` no se escriben con un valor arbitrario. Cada cambio pasa por `canTransition(from, to, role)` de `src/lib/package-status.ts` y `src/lib/delivery-status.ts` (fases 2 y 3) según las tablas de [`../estados/paquete.md`](../estados/paquete.md) y [`../estados/entrega.md`](../estados/entrega.md). Las acciones de edición (`updatePackageAction`, `updateDeliveryAction`) no aceptan el campo `status`. `Product.status` y `Order.status` (salvo `Cancelado`) no se escriben nunca a mano: se derivan (RN-010 a RN-012).
