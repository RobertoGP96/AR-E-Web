# ADR-0009 — El saldo del cliente es su saldo a favor; la deuda se lleva aparte

**Estado:** Aceptada
**Fecha:** 2026-10-07
**Reglas y estados afectados:** RN-021 (redefinida, versión mayor 2.0.0), RN-022 (el disponible pasa a ser directamente el saldo), RN-023 (sigue vigente, deja de ser el único remedio), ES-pago («Relación con el balance»), glosario («Cliente»)
**Apps impactadas:** Django (`CustomUser.balance` y nuevo `CustomUser.debt`, migración `0042`, `api/services/balance_service.py`, `recalculate_balance`, `balance_status`, serializers de usuario, `client_services.py`, métricas del dashboard), admin-next (`src/lib/client-balance.ts`, `src/lib/balance.ts`, `/users?tab=balances`, dashboards, `/analytics`, extracto imprimible, exportación de datos, `PaymentPanel`), admin Vite (`client-balances-table.tsx`, `ConfirmPaymentDialog` de orden y entrega, `ClientOperationsStatement`), app cliente (solo lectura; recibe `balance` y `debt` por la API)

## Contexto

Hasta 1.x, `CustomUser.balance` era la **posición neta** del cliente: Σ efectivo cobrado − Σ costos de todas sus órdenes y entregas. Un número negativo era deuda; positivo, saldo a favor. Esa única cifra mezclaba dos preguntas distintas («¿cuánto dinero suyo tengo sin aplicar?» y «¿cuánto me debe?») y producía el efecto que motivó ADR-0008 y que el usuario volvió a encontrar el 7 de octubre de 2026: un sobrepago en la orden A no aparecía como saldo disponible al cobrar la orden B, porque la deuda de B ya lo había compensado en el neto. RN-022 (`disponible = max(0, balance)`) daba 0 y el contador no podía usar el dinero que el cliente ya había entregado. RN-023 (repartir el exceso) corrige el caso desde la partida sobrepagada, pero no desde el panel de pago de la pendiente, que es donde el contador está trabajando.

El negocio pide que el saldo tenga un enfoque económico: que represente el dinero del cliente disponible para pagar, que se muestre al cobrar cualquier partida y que la deuda se vea por separado.

## Decisión

Para cada orden y cada entrega del cliente (partida) con `costo`, `efectivo` y `saldoAplicado`:

```
cubierto  = round2(efectivo + saldoAplicado)
sobrepago = max(0, round2(cubierto − costo))
pendiente = max(0, round2(costo − cubierto))
```

y para el cliente:

| Magnitud | Fórmula | Dónde se guarda | Qué responde |
|---|---|---|---|
| **Saldo a favor** (`balance`) | `max(0, round2(Σ sobrepago − Σ saldoAplicado))` | `CustomUser.balance` | Dinero del cliente aún sin aplicar. Es el «disponible» de RN-022. |
| **Deuda** (`debt`) | `round2(Σ pendiente)` | `CustomUser.debt` (nuevo) | Lo que el cliente debe. |
| **Posición neta** (`net`) | `round2(Σ efectivo − Σ costo)` | derivada (no se guarda) | La cifra de RN-021 1.x; coincide con `balance − debt` salvo con datos históricos inconsistentes. |

Reglas:

- Se consideran **todas** las órdenes y entregas del cliente, sin filtrar por estado (igual que en 1.x): una orden cancelada con costo y sin cobros sigue contando como deuda hasta que el admin la ajuste (su costo no se pone a cero al cancelar, `estados/orden.md`). Las bolsas tienen costo 0 y no afectan.
- El saldo aplicado consume saldo a favor y reduce la deuda de la partida; **no** es efectivo. Un saldo aplicado sin sobrepago que lo respalde (bug B1/B2 del antiguo `apply_balance`) no puede dejar el saldo a favor en negativo: se recorta a 0 y la diferencia se ve en la posición neta (caso RN-021-10).
- `balance_status`: `DEUDA` si `debt > 0`, si no `SALDO A FAVOR` si `balance > 0`, si no `AL DÍA`. Un cliente puede tener saldo a favor y deuda a la vez; su estado es `DEUDA` porque hay algo por cobrar, y la pantalla muestra ambas cifras.
- RN-022 queda `disponible = balance` (ya es ≥ 0). El panel de pago de cualquier partida pendiente muestra ese saldo y lo aplica hasta `min(disponible, pendiente)`. Tras aplicarlo, el saldo a favor baja en lo aplicado y la deuda baja en lo cubierto; la posición neta no cambia.
- RN-023 (reparto del exceso de efectivo) sigue disponible como alternativa: mueve efectivo en vez de aplicar saldo. Deja de ser necesario para el caso del ADR-0008.
- Ambos escritores recalculan `balance` y `debt` juntos, en la misma transacción de la mutación, con la misma función pura (`compute_client_balance` / `computeClientBalance`). La migración `0042` recalcula todos los clientes al desplegar; «Recalcular balances» de admin-next y el comando `recalculate_balances` de Django hacen lo mismo bajo demanda.
- Los extractos («Estado de cuenta» de admin-next, `get_client_operations_statement` de Django) siguen siendo libros de **posición neta** con saldo corriente, porque eso es lo que un extracto representa; su resumen final informa saldo a favor y deuda con la fórmula nueva.

## Consecuencias

- Positivas: el caso del usuario desaparece de raíz: al abrir el pago de la orden B el panel muestra 50 de saldo disponible y lo aplica. Las pantallas de balances distinguen «me debe» de «tiene dinero conmigo», que es lo que el contador necesita para cobrar y para devolver. La cifra guardada nunca es negativa, así que deja de haber «balances negativos» que confundían en la app cliente y el admin Vite.
- Negativas o costes: cambia el **significado** de una columna existente (`balance`) en las cuatro implementaciones; cualquier consumidor externo que la leyera como neto queda desactualizado (por eso la versión es mayor). Las vistas que agregaban `balance < 0` como deuda tuvieron que pasar a `debt`. Dos cifras en vez de una ocupan más espacio en tablas y tarjetas.
- Trabajo derivado: `reglas/pagos.md` (RN-021 reescrita, RN-022 y RN-023 ajustadas), `estados/pago.md`, `glosario.md`, `procedimientos/contador.md`, `casos/client-balance.json` (12 casos) consumidos por `spec-cases.test.ts` y `test_spec_cases.py`, `client-balance.test.ts`, `test_balance_payments.py` reescrito a la semántica nueva, `conformidad.md`, `CHANGELOG.md` 2.0.0, `doc/apps/admin-next.md`.

## Alternativas descartadas

- **Mantener el neto en `balance` y derivar el saldo a favor solo en admin-next** (opción «solo admin-next»): resuelve el panel de pago pero deja al admin Vite y a la app cliente mostrando un «saldo» que no es el que ve el contador; dos definiciones del mismo campo en el mismo sistema. El usuario pidió explícitamente el enfoque económico en todas las apps.
- **Ofrecer solo «cubrir con el sobrepago de la orden X» en el panel de la pendiente** (RN-023 desde el otro lado): parche de interfaz sobre la misma limitación; el saldo seguiría sin reflejar el dinero disponible en balances, dashboards y extractos.
- **Excluir las órdenes canceladas de la deuda**: económicamente razonable, pero cambia la posición neta respecto de 1.x y requiere definir qué pasa con lo cobrado en una orden cancelada (devolver o convertir en saldo). Se mantiene el criterio de 1.x y se deja para un ADR posterior junto con el cierre contable de cancelaciones.
- **Tabla de movimientos de saldo (ledger persistido)**: la solución contable completa, pero exige una entidad nueva y migraciones en las tres apps; el modelo derivado por partidas es suficiente porque toda la información ya está en las partidas (ADR-0001).
