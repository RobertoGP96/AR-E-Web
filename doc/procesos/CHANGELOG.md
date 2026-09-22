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
