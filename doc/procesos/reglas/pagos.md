# Reglas de pagos y balance (RN-020 a RN-022)

Casos de prueba en [`../casos/pay-status.json`](../casos/pay-status.json). Máquina de estados en [`../estados/pago.md`](../estados/pago.md). Todas las cantidades se redondean a 2 decimales antes de comparar o sumar.

## RN-020 Estado de pago

**Desde:** 1.0.0. **Estado:** vigente (`Order.add_received_value` y `Order.save` en `backend/api/models/orders.py`; `DeliverReceip.add_payment_amount` en `backend/api/models/deliveries.py`; `computePayStatus` en `apps/admin-next/src/lib/order-cost.ts`).

Se aplica a la orden (costo = `total_costs`), a la entrega (costo = `weight_cost`) y a la compra (costo = `total_cost_of_purchase`, estado fijado por el admin).

```
costo      = round2(costo)
pagado     = round2(efectivo + saldoAplicado)
estado     = Pagado     si pagado ≥ costo y costo > 0
             Parcial    si pagado > 0 (y no es Pagado)
             No pagado  en cualquier otro caso
```

- **Los cobros son acumulativos**: cada registro de pago **suma** al efectivo (`received_value_of_client` / `payment_amount`) y al saldo aplicado (`balance_applied`). Nunca se reemplaza el total por el importe del último cobro.
- Con costo 0 no existe `Pagado`; si hay dinero registrado queda `Parcial` (RN-020-07). Una entrega sin pesar (bolsa) tiene costo 0 y por eso no admite pagos (INV-003).
- El sobrepago deja el estado en `Pagado`; el exceso aparece como saldo a favor en el balance (RN-021).
- El estado se recalcula **también** cuando cambia el costo (añadir, editar o quitar un producto de una orden; re-pesar una entrega). Django no lo hace hoy al cambiar `total_costs` (bug B3); admin-next sí (`refreshOrderTotals`).
- Fijar el estado a mano congela el cálculo automático en Django (bug B24). En admin-next el estado de pago de orden y entrega no es editable; solo el de la compra.

## RN-021 Balance del cliente

**Desde:** 1.0.0. **Estado:** vigente (`CustomUser.recalculate_balance` en `backend/api/models/users.py:137-179`; `recalculateClientBalance` en `apps/admin-next/src/lib/balance.ts`).

```
balance = round2( (Σ Order.received_value_of_client + Σ DeliverReceip.payment_amount)
                − (Σ Order.total_costs             + Σ DeliverReceip.weight_cost) )
```

sobre **todas** las órdenes y entregas del cliente, sin filtrar por estado.

- `balance > 0`: saldo a favor; `balance < 0`: deuda.
- **El saldo aplicado (`balance_applied`) no entra en la fórmula**, ni como ingreso ni como gasto. Ese dinero ya se contó como efectivo cuando el cliente pagó de más en otra orden o entrega; volver a contarlo lo duplicaría. La deuda de la orden sí se reduce (RN-020), y la deuda global la reduce el costo que ya estaba restado. Ejemplo: costo A = 100 pagado 150 → balance +50; costo B = 50 cubierto con saldo 50 → balance = (150 + 0) − (100 + 50) = 0. Correcto sin sumar el saldo aplicado.
- Las bolsas (peso 0, `weight_cost` 0) no alteran el balance.
- Se recalcula tras cada cobro, cada cambio de `total_costs`, cada pesado o re-pesado y cada borrado de orden o entrega. En admin-next debe llamarse explícitamente dentro de la misma transacción de la mutación; en Django lo disparan señales. Al purgar datos también debe recalcularse (bug N6).

## RN-022 Aplicar saldo

**Desde:** 1.0.0. **Estado:** vigente en admin-next (`confirmOrderPaymentAction`, `confirmDeliveryPaymentAction`) y en el PATCH de `applied_balance` de Django; **incumplida** por `POST order/{id}/apply_balance/` de Django (bugs B1/B2).

Al cobrar una orden o una entrega, el contador puede cubrir parte o todo el pendiente con saldo a favor del cliente:

```
disponible   = max(0, balance del cliente)
pendiente    = max(0, costo − efectivo − saldoAplicado)
saldoAplicar ≤ min(disponible, pendiente)
```

- El saldo aplicado se **acumula** en `balance_applied` de la orden o entrega; nunca se registra como efectivo nuevo.
- Nunca se aplica más que el balance positivo disponible en ese momento ni más que el pendiente.
- Como el balance no suma `balance_applied` (RN-021), tras aplicar saldo el balance solo cambia si en el mismo acto entra efectivo. El "disponible" que ve el contador debe descontar el saldo aplicado en la misma sesión antes de recalcular.
- Aplicar saldo y registrar efectivo en el mismo cobro se hace en una sola transacción: sumar efectivo, sumar saldo aplicado, recalcular estado (RN-020), recalcular balance (RN-021).
