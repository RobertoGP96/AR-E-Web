# CHANGELOG de la especificación de procesos

Formato de cada entrada: versión, fecha, reglas/estados afectados, motivo (ADR), apps impactadas. Versionado semántico (ver `README.md`, "Gobierno del cambio").

## 1.0.0 — 2026-09-22

Primera versión de la especificación como fuente única de verdad. Sustituye a los documentos sueltos de `doc/` (movidos a `doc/legacy/`).

**Reglas y estados definidos**

- Costos: RN-001 (costo de producto), RN-002 (costo por peso), RN-003 (comisión del gestor), RN-004 (estimación de compra parcial). Reflejan el código vigente en Django, admin Vite y admin-next; no cambian comportamiento.
- Estados: RN-010 (estado de producto derivado de cantidades, vigente), **RN-011 (nueva)**: para el estado del producto solo cuentan las unidades en entregas con estado `Entregado`; RN-012 (estado de orden derivado, vigente en Django, pendiente en admin-next).
- Pagos: RN-020 (estado de pago), RN-021 (balance del cliente), RN-022 (saldo aplicado limitado al balance positivo). Reflejan el código vigente.
- Invariantes INV-001 a INV-006.
- Máquinas de estado `ES-orden`, `ES-producto`, `ES-pago` (vigentes) y **`ES-paquete`, `ES-entrega` (nuevas)**: transiciones explícitas con rol, en lugar de selección libre; la bolsa se formaliza como entrega `Pendiente` con peso 0.

**Decisiones**

- ADR-0001 alcance del rediseño limitado a admin-next.
- ADR-0002 compra creada desde los productos pendientes de una tienda.
- ADR-0003 recepción unificada y máquina de estados del paquete.
- ADR-0004 un solo camino de entrega basado en bolsas.
- ADR-0005 producto `Entregado` solo cuando su entrega está `Entregado`.
- ADR-0006 responsive móvil obligatorio.

**Verificación**

- `casos/product-status.json` (16 casos), `casos/product-cost.json` (8), `casos/pay-status.json` (11).
- `apps/admin-next/src/lib/spec-cases.test.ts` y `backend/api/tests/test_spec_cases.py` consumen los casos; `.github/workflows/spec-tests.yml` los ejecuta en CI.
- `conformidad.md` registra el estado inicial: las reglas nuevas (RN-011, ES-paquete, ES-entrega, INV-004, INV-006) y varios invariantes no se cumplen todavía en admin-next; se corrigen en las fases 1 a 4 del plan de rediseño. Django, admin Vite y la app cliente mantienen los bugs B1–B33 y contradicciones C1–C18 documentados.

**Apps impactadas:** admin-next (fases 1–4), documentación de todas las apps (`doc/apps/*.md` enlazan aquí). Sin cambios de comportamiento en Django, admin Vite ni app cliente en esta versión.

## 1.0.1 — 2026-09-22

Sin cambios de reglas. Actualización de `conformidad.md` tras implementar en admin-next las fases 1 a 4 del rediseño (compra desde productos pendientes, recepción unificada con máquina de estados de paquete, entregas con un solo camino y RN-011, endurecimiento transaccional y RN-012 derivada). Ver la sección «Actualización 2026-09-22» de la matriz.

**Apps impactadas:** admin-next.

## 1.0.2 — 2026-09-22

Sin cambios de reglas. Altas con sus productos en la misma vista en admin-next: `/orders/new` (orden + productos en línea, `createOrderWithProductsAction`), `/packages/new` (paquete + llegadas, `createPackageWithArrivalsAction`), `/delivery/new` (entrega armada desde recibidos con peso por categoría, `assembleDeliveryAction` con `weights`). Los diálogos de creación de orden, paquete y entrega desaparecen; quedan los de edición. Procedimientos de agente y logístico actualizados.

**Apps impactadas:** admin-next.

## 1.1.0 — 2026-09-23

**ADR-0007 — gestor de orden.** El gestor (`sales_manager`) de una orden puede ser cualquier miembro del personal (`admin`, `agent`, `accountant`, `logistical`), no solo un agente. Un agente sigue creando y editando sus órdenes a su propio nombre; cuando opera un admin y no elige gestor, se asigna el **admin general** (admin activo superusuario o, en su defecto, el más antiguo). El gestor ya no filtra la lista de clientes al crear la orden; la precondición «cliente con agente asignado» de `ES-orden` desaparece. RN-003 no cambia (la comisión sigue siendo la del agente asignado al cliente). De paso se corrige un defecto latente de Django: los tres validadores `validate_sales_manager` nunca se ejecutaban porque DRF invoca `validate_<nombre del campo>` y el campo del serializer es `sales_manager_id`; ahora se llaman `validate_sales_manager_id` y sí rechazan gestores que no son personal. Además `OrderUpdateSerializer` resolvía `sales_manager_id` como campo de solo lectura, por lo que cambiar el gestor por `PATCH` (admin Vite) se ignoraba; ahora es escribible.

**Afecta a:** `estados/orden.md` (transición `— → Encargado`), `roles.md`, `glosario.md`, `procedimientos/agente.md`, `conformidad.md`.

**Verificación:** `apps/admin-next/src/lib/order-manager.test.ts` (vitest) y `backend/api/tests/test_sales_manager_assignment.py` (pytest, añadido al job de backend en CI). No hay casos JSON nuevos: la regla no es una función pura compartida por las tres implementaciones.

**Apps impactadas:** Django (`staff_service.py`, serializers de órdenes), admin-next (`orders/actions.ts`, `/orders`, `/orders/new`, `order-dialog.tsx`), admin Vite (`CreateOrderDialog`, `EditOrderDialog`). App cliente sin cambios (solo lectura).

## 1.0.3 — 2026-09-23

Sin cambios de reglas. Los paquetes admiten **dos fotos** (`package_picture`, `package_picture_2`; migración Django `0041`): alta/edición en admin-next (`/packages/new`, `package-dialog.tsx`) y admin Vite (diálogo de fotos en la tabla), y las cabeceras de detalle de paquete y entrega en admin-next muestran las fotos como miniaturas de tamaño fijo con visor modal (`components/detail-photos.tsx`) en lugar de una imagen que crecía con la foto.

**Apps impactadas:** Django (modelo y serializer de `Package`), admin-next, admin Vite, app cliente (solo tipos).

## 1.1.1 — 2026-09-23

Sin cambios de reglas. Documentos al cliente desde `/users?tab=balances` en admin-next («Generar factura»: factura de pendientes con selección de partidas, estado de cuenta tipo extracto con saldo corriente RN-021 y rango opcional, factura por pedidos con productos RN-001), renderizados en `/users/[id]/statement` para imprimir o guardar como PDF. Solo lectura: no se persiste nada ni se alteran cobros o balances; el saldo aplicado se muestra como informativo (RN-022). Lógica pura en `apps/admin-next/src/lib/client-statement.ts` con tests. Procedimiento del contador §4 actualizado.

**Apps impactadas:** admin-next.
