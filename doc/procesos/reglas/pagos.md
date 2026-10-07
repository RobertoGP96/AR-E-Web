# Reglas de pagos y balance (RN-020 a RN-023)

Casos de prueba en [`../casos/pay-status.json`](../casos/pay-status.json), [`../casos/surplus-distribution.json`](../casos/surplus-distribution.json) y [`../casos/client-balance.json`](../casos/client-balance.json). Máquina de estados en [`../estados/pago.md`](../estados/pago.md). Todas las cantidades se redondean a 2 decimales antes de comparar o sumar.

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

## RN-021 Saldo a favor y deuda del cliente

**Desde:** 1.0.0. **Redefinida en 2.0.0 (ADR-0009).** **Estado:** vigente (`api/services/client_balance_service.py` `compute_client_balance` + `CustomUser.recalculate_balance` en `backend/api/models/users.py`; `computeClientBalance` en `apps/admin-next/src/lib/client-balance.ts` + `recalculateClientBalance` en `src/lib/balance.ts`). Casos en `casos/client-balance.json`.

Cada orden y cada entrega del cliente es una **partida** con `costo` (`total_costs` / `weight_cost`), `efectivo` (`received_value_of_client` / `payment_amount`) y `saldoAplicado` (`balance_applied`). Se consideran **todas** las partidas del cliente, sin filtrar por estado.

```
por partida:
  cubierto  = round2(efectivo + saldoAplicado)
  sobrepago = max(0, round2(cubierto − costo))
  pendiente = max(0, round2(costo − cubierto))

cliente:
  balance (saldo a favor) = max(0, round2(Σ sobrepago − Σ saldoAplicado))   → CustomUser.balance
  debt    (deuda)         = round2(Σ pendiente)                             → CustomUser.debt
  net     (posición neta) = round2(Σ efectivo − Σ costo)                    (derivada, no se guarda)
```

- **Saldo a favor**: dinero que el cliente ya entregó y aún no se ha aplicado a ninguna partida. Es el «disponible» de RN-022 y lo que muestra el panel de pago de cualquier partida pendiente. Nunca es negativo.
- **Deuda**: lo que el cliente debe, sumando lo que falta por cubrir en cada partida. Un cliente puede tener saldo a favor y deuda a la vez (sobrepagó una orden y debe otra): el estado es `DEUDA` y las pantallas muestran ambas cifras.
- **Posición neta**: la fórmula de RN-021 1.x. Es el saldo corriente de los extractos («Estado de cuenta») y coincide con `balance − debt`, salvo con datos históricos en los que se aplicó saldo sin sobrepago que lo respalde (bug B1/B2 del antiguo `apply_balance`): entonces `balance` se recorta a 0 y la diferencia solo se ve en `net` (RN-021-10).
- **El saldo aplicado no es efectivo**: consume saldo a favor (resta en `balance`) y cubre pendiente (resta en `debt`), pero no entra en `net`. Ejemplo (RN-021-05/06): A cuesta 100 y se cobran 150 → `balance` 50; B cuesta 50 sin cobrar → `debt` 50, `net` 0. Se aplican los 50 a B → `balance` 0, `debt` 0, `net` 0.
- Las bolsas (peso 0, costo 0, sin pagos) no alteran nada (INV-003).
- `balance_status` (Django) / `clientBalanceStatus` (admin-next): `DEUDA` si `debt > 0`; si no `SALDO A FAVOR` si `balance > 0`; si no `AL DÍA`.
- Se recalculan **juntos** tras cada cobro, cada cambio de `total_costs`, cada pesado o re-pesado y cada borrado de orden o entrega. En admin-next debe llamarse explícitamente dentro de la misma transacción de la mutación; en Django lo disparan señales. La migración `0042` recalcula todos los clientes; «Recalcular balances» (admin-next) y `recalculate_balances` (Django) lo repiten bajo demanda.
- Hasta 1.x `balance` guardaba la posición neta (negativo = deuda). Las vistas que agregaban `balance < 0` como deuda usan ahora `debt`.

## RN-022 Aplicar saldo

**Desde:** 1.0.0. **Estado:** vigente en admin-next (`confirmOrderPaymentAction`, `confirmDeliveryPaymentAction`) y en el PATCH de `applied_balance` de Django; **incumplida** por `POST order/{id}/apply_balance/` de Django (bugs B1/B2).

Al cobrar una orden o una entrega, el contador puede cubrir parte o todo el pendiente con saldo a favor del cliente:

```
disponible   = balance del cliente            -- saldo a favor (RN-021 2.0.0, ya ≥ 0)
pendiente    = max(0, costo − efectivo − saldoAplicado)
saldoAplicar ≤ min(disponible, pendiente)
```

- El saldo aplicado se **acumula** en `balance_applied` de la orden o entrega; nunca se registra como efectivo nuevo.
- Nunca se aplica más que el balance positivo disponible en ese momento ni más que el pendiente.
- Tras aplicar saldo, el saldo a favor baja en lo aplicado y la deuda baja en lo cubierto (RN-021 2.0.0); la posición neta no cambia. El "disponible" que ve el contador debe descontar el saldo aplicado en la misma sesión antes de recalcular.
- Aplicar saldo y registrar efectivo en el mismo cobro se hace en una sola transacción: sumar efectivo, sumar saldo aplicado, recalcular estado (RN-020), recalcular balance (RN-021).
- **Desde 2.0.0** el límite de 1.2.0 desaparece: el sobrepago de una partida es saldo a favor aunque existan otras partidas pendientes, así que el panel de pago de la pendiente lo ofrece directamente. RN-023 (repartir el exceso de efectivo) sigue disponible como alternativa.

## RN-023 Redistribución de sobrepago

**Desde:** 1.2.0 (ADR-0008). **Estado:** vigente en admin-next (`planSurplusDistribution` en `apps/admin-next/src/lib/surplus.ts`; `redistributeSurplusInTx` en `src/lib/surplus-redistribution.ts`; `confirmOrderPaymentAction` / `confirmDeliveryPaymentAction` con `distributeSurplus`; `redistributeOrderSurplusAction` / `redistributeDeliverySurplusAction`). En Django solo la función pura (`api/services/payment_services.py`); no hay endpoint.

Cuando una orden o entrega tiene **efectivo** por encima de su costo, ese exceso puede moverse a las otras partidas pendientes del mismo cliente.

```
exceso       = round2(efectivo + saldoAplicado − costo)          (solo si > 0)
movible      = min(exceso, efectivo)                              -- el saldo aplicado nunca se mueve (RN-022)
destinos     = órdenes del cliente con status ≠ Cancelado y costo > 0
             + entregas del cliente con peso > 0
             con pendiente = round2(costo − efectivo − saldoAplicado) > 0,
             sin la partida origen,
             ordenadas por fecha ascendente (createdAt de la orden, deliverDate de la entrega);
             a igual fecha, órdenes antes que entregas; luego id ascendente
para cada destino, mientras restante > 0:
    asignado = min(restante, pendiente)
    destino.efectivo += asignado ; restante −= asignado
origen.efectivo −= Σ asignado                                      -- lo que sobre sigue en el origen (saldo a favor, RN-021)
```

- Se ejecuta en **una transacción** junto con el cobro (si el contador deja activado «repartir el excedente») o como acción explícita sobre una partida ya sobrepagada. Tras mover el efectivo se recalcula el estado de pago de cada partida (RN-020). La fecha de pago de los destinos es la del origen.
- **Σ efectivo del cliente no cambia, luego su balance (RN-021) tampoco.** Es la invariante que distingue el reparto de un cobro nuevo.
- Nunca mueve saldo aplicado ni genera saldo aplicado en los destinos: todo lo que entra en un destino es efectivo que el cliente pagó de verdad.
- Si no hay destinos, no se hace nada y el exceso queda como saldo a favor. El contador puede desactivar el reparto en el panel para conservar el exceso como adelanto.
- **Desde 2.0.0 (ADR-0009)** el reparto es opcional: el exceso ya aparece como saldo a favor (RN-021) y puede aplicarse desde el panel de pago de cada pendiente (RN-022). Repartir mueve efectivo; aplicar saldo lo consume como `balance_applied`. Ambos dejan la posición neta igual.
- Casos: RN-023-01 a RN-023-08 en `casos/surplus-distribution.json`; RN-023-01 reproduce el caso real del pedido 64 (ADR-0008).
