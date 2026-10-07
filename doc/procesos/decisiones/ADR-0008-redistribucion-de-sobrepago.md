# ADR-0008 — El exceso de un cobro se reparte entre los pendientes del cliente

**Estado:** Aceptada
**Fecha:** 2026-10-07
**Reglas y estados afectados:** RN-023 (nueva), RN-022 (nota), ES-pago (transición «reparto de sobrepago»)
**Apps impactadas:** admin-next (`src/lib/surplus.ts`, `src/lib/surplus-redistribution.ts`, `app/(admin)/surplus-actions.ts`, `confirmOrderPaymentAction`, `confirmDeliveryPaymentAction`, `PaymentPanel`, `SurplusBanner` en `/orders/[id]` y `/delivery/[id]`), Django (`api/services/payment_services.py`, solo la función pura). Admin Vite y app cliente sin cambios.

## Contexto

Caso real del 7 de octubre de 2026: el pedido 64 del cliente 339 costaba 8.63 y el contador registró en él un cobro de 46.43, que era la suma de **todo** lo que el cliente debía (pedido 63: 29.19; entregas 26 y 27: 6.86 y 1.75). El sistema se comportó según la especificación: el pedido 64 quedó `Pagado`, el balance del cliente (RN-021) dio 0 porque el exceso se compensó con las otras deudas, y el pedido 63 y las dos entregas siguieron `No pagado`.

El resultado es contablemente correcto en el agregado pero inútil en el detalle: tres partidas ya pagadas aparecen como deuda y, como el balance es 0, el panel de pago no ofrece «saldo a favor» para cubrirlas (RN-022: `disponible = max(0, balance)`). El contador no tenía ninguna acción para corregirlo desde admin-next (anular cobros solo existe en Django admin). Además, el panel mostraba el exceso como «Excedente al saldo» aunque ese saldo nunca llegaría a existir.

## Decisión

Cuando un cobro deja efectivo por encima del costo de la orden o la entrega, ese exceso se puede **repartir** entre las otras órdenes y entregas con pendiente del mismo cliente, de la más antigua a la más reciente (RN-023). Es un movimiento de efectivo entre partidas: la suma de efectivo del cliente, y por tanto su balance, no cambia; solo cambian los estados de pago (RN-020).

Dos puntos de entrada en admin-next:

| Dónde | Cuándo | Qué hace |
|---|---|---|
| Panel de pago (`PaymentPanel`) | El monto supera el pendiente **y** el cliente tiene otras partidas por pagar | Muestra el excedente, la lista de partidas que cubriría y un interruptor «Repartir el excedente entre sus pendientes», **activado por defecto**. Al confirmar, el cobro y el reparto van en la misma transacción. Desactivado, el excedente queda como saldo a favor (comportamiento anterior). |
| Detalle de orden o entrega (`SurplusBanner`) | La partida ya tiene efectivo por encima del costo | Aviso «Sobrepago de X» con el botón «Repartir entre pendientes» (vista previa del plan y confirmación). Si el cliente no tiene pendientes, solo informa de que el exceso es saldo a favor. |

Reglas de reparto (RN-023, detalladas en `reglas/pagos.md`): solo se mueve **efectivo** (el saldo aplicado nunca se mueve, RN-022); los destinos son órdenes no canceladas con costo > 0 y entregas pesadas, con pendiente > 0; el orden es fecha ascendente (`created_at` de la orden, `deliver_date` de la entrega), a igual fecha órdenes antes que entregas y luego id; cada destino recibe `min(restante, pendiente)`; lo que sobre permanece en el origen; la fecha de pago de los destinos es la del origen.

La función de reparto es pura y compartida: `planSurplusDistribution` (TS) y `plan_surplus_distribution` (Python), con vectores en `casos/surplus-distribution.json`. Django no expone todavía un endpoint que ejecute el plan (deuda registrada en `conformidad.md`, coherente con ADR-0001).

## Consecuencias

- Positivas: el caso del pedido 64 se corrige desde la interfaz con un clic y no vuelve a producirse, porque el panel propone el reparto en el momento del cobro; las partidas pagadas dejan de aparecer como deuda; el estado de cuenta del cliente refleja a qué se destinó cada cobro.
- Negativas o costes: el cobro con reparto escribe varias partidas en una transacción (más filas tocadas, más rutas revalidadas). El reparto automático «más antiguo primero» puede no coincidir con lo que el cliente quiso pagar; el contador puede desactivarlo y cobrar partida por partida. Un sobrepago de **saldo aplicado** (no efectivo) no se reparte, por diseño.
- Trabajo derivado: `reglas/pagos.md` (RN-023, nota en RN-022), `estados/pago.md` (transición), `procedimientos/contador.md` §3, `casos/surplus-distribution.json`, `spec-cases.test.ts`, `test_spec_cases.py`, `surplus.test.ts`, `conformidad.md`, `CHANGELOG.md` 1.2.0, `doc/apps/admin-next.md`.

## Alternativas descartadas

- **Dejar el saldo como está y corregir los datos a mano**: resuelve un caso, no el flujo; además admin-next no tiene acción de anular cobros y la corrección exige acceso directo a la base de datos.
- **Repartir siempre y sin preguntar**: quita al contador la opción legítima de dejar el exceso como saldo a favor (por ejemplo, un adelanto para pedidos futuros). Se deja activado por defecto pero visible y desactivable.
- **Permitir aplicar «saldo» a los pendientes aunque el balance sea 0**: romper RN-022 (`disponible = max(0, balance)`) reintroduciría el doble conteo que esa regla evita (bug B1/B2 de Django).
- **Registrar el cobro como un pago del cliente sin partida y asignarlo después**: requiere una entidad nueva de pagos y migraciones en las tres apps; fuera del alcance de admin-next (ADR-0001). Puede plantearse en un ADR posterior si se necesita trazabilidad por recibo.
