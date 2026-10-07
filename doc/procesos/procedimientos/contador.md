# Procedimiento del contador

Pantallas de admin-next: `/orders/[id]` y `/delivery/[id]` (panel de pago), `/users?tab=balances`, `/balance`, `/invoices`, `/expenses`, `/analytics`, `/settings/data`. Permisos en [`../roles.md`](../roles.md). Reglas aplicables: RN-020, RN-021, RN-022, INV-003.

## 1. Qué se cobra

| Concepto | Dónde | Costo | Estado de pago |
|---|---|---|---|
| Productos de la orden | `/orders/[id]` → panel de pago | `total_costs` (suma de RN-001) | `Order.pay_status` |
| Envío por peso de la entrega | `/delivery/[id]` → panel de pago | `weight_cost` (RN-002), existe solo después de pesar | `DeliverReceip.payment_status` |

Una bolsa (peso 0) no se cobra (INV-003). Una compra tiene su propio estado de pago, que fija el admin y no afecta al cliente.

## 2. Registrar un cobro

1. Abre la orden o la entrega. El panel muestra costo, efectivo ya recibido, saldo ya aplicado, pendiente y el balance actual del cliente.
2. Introduce el **efectivo recibido ahora**. Es acumulativo: se suma a lo anterior; no escribas el total.
3. Si el cliente tiene balance positivo, puedes indicar **saldo a aplicar**, hasta `min(balance disponible, pendiente)` (RN-022).
4. Confirma. En una transacción: efectivo y saldo aplicado se suman, el estado de pago se recalcula (RN-020) y el balance del cliente se recalcula (RN-021).
5. Comprueba el estado resultante: `Pagado` si efectivo + saldo aplicado ≥ costo; `Parcial` si hay algo; `No pagado` si nada.

## 3. Sobrepagos y saldo a favor

- Si el cliente paga de más, registra el importe real en la partida que estás cobrando. El panel detecta el excedente y, **si el cliente tiene otras órdenes o entregas por pagar**, propone repartirlo entre ellas de la más antigua a la más reciente («Repartir el excedente entre sus pendientes», activado por defecto, con la lista de lo que cubrirá). Confirma y todo se registra en una transacción: la partida cobrada queda `Pagado` y las cubiertas pasan a `Pagado` o `Parcial` (RN-023).
- Desactiva el reparto solo si el cliente quiere dejar ese exceso como **adelanto**: entonces la orden queda `Pagado` y el exceso aparece como balance positivo (RN-021). Ojo: si el cliente tiene otras deudas, ese balance positivo no existirá (las deudas lo compensan) y las partidas seguirán `No pagado`; por eso el reparto es la opción por defecto.
- Si descubres un sobrepago ya registrado (por ejemplo, se cobró en un pedido el total de la deuda del cliente), abre el detalle de esa orden o entrega: el aviso «Sobrepago de X» ofrece «Repartir entre pendientes» con la vista previa del reparto. El balance del cliente no cambia; solo se mueve el efectivo a las partidas correctas.
- El saldo a favor real se consume aplicándolo a otra orden o entrega (paso 2.3). El saldo aplicado **no** vuelve a contarse como efectivo; el balance no baja al aplicarlo porque ya se contó al entrar (RN-021, ejemplo en `reglas/pagos.md`). El reparto de RN-023 nunca mueve saldo aplicado, solo efectivo.
- No apliques saldo dos veces por el mismo importe: el panel descuenta lo aplicado en la sesión antes de mostrar el disponible.

## 4. Balances y reportes

- `/users?tab=balances`: balance por cliente (positivo a favor, negativo deuda). Si un balance parece incorrecto tras una limpieza de datos o importación, pide al admin "Recalcular balances" en `/settings/system`.
- **Generar factura** (botón de cada fila de balances): abre un documento imprimible del cliente en una pestaña nueva (imprimir o guardar como PDF desde el navegador). Tres tipos: **Pendientes** (elige qué órdenes y entregas con saldo por pagar incluir; total a pagar = Σ `costo − efectivo − saldo aplicado`), **Estado de cuenta** (extracto tipo cuenta bancaria con cada cargo, cada pago y el saldo corriente, que termina en el balance RN-021; opcionalmente acotado por fechas, con lo anterior resumido como saldo inicial) y **Por pedidos** (pedidos concretos con sus productos y lo pagado/pendiente de cada uno). El documento es informativo: no se guarda ni altera cobros, estados ni balances; las filas «Saldo aplicado» aparecen pero no mueven el saldo (RN-022).
- `/balance` → nuevo balance por rango: ingresos (efectivo de órdenes y entregas), costos (compras, `weight_cost`, facturas, gastos), ganancia. Las bolsas no cuentan.
- `/invoices`: facturas del transportista (costo del sistema). `/expenses`: gastos generales.
- `/analytics`: ganancia por entrega = `weight_cost − manager_profit − peso × costo por libra` (RN-003).

## Qué NO hacer

- No escribas el total acumulado en el campo de cobro: es un incremento.
- No registres el saldo aplicado como efectivo (es el bug B1/B2 del endpoint antiguo `apply_balance` de Django; en admin-next el panel lo separa).
- No cambies el estado de pago a mano: se deriva. En Django admin, fijarlo congela el cálculo (bug B24).
- No cobres una bolsa ni una entrega sin pesar.
- No cobres por adelantado sobre una orden con costo 0 (quedaría `Parcial` sin sentido; RN-020-07). Espera a que el agente cargue los productos.

## Errores esperados

| Mensaje | Causa | Solución |
|---|---|---|
| "El saldo a aplicar supera el disponible" | RN-022 | Baja el importe al balance positivo actual. |
| "El saldo a aplicar supera el pendiente" | RN-022 | Baja el importe al pendiente. |
| "La entrega no tiene peso; no se puede cobrar" | INV-003 | Pide al logístico que pese la bolsa. |
| "Importe inválido" | Importe ≤ 0 y saldo 0 | Introduce al menos un importe > 0. |
| "No tienes acceso" | Rol sin permiso de cobro (agente, logístico) | Solo contador y admin cobran. |
