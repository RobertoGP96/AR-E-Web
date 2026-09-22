# ADR-0003 — Recepción unificada desde el paquete y máquina de estados del paquete

**Estado:** Aceptada
**Fecha:** 2026-09-22
**Reglas y estados afectados:** ES-paquete, INV-001, INV-002, INV-006
**Apps impactadas:** admin-next (`/packages`, `/packages/[id]`, `/delivery/prepare`, `packages/actions.ts`, `src/lib/package-status.ts`)

## Contexto

Las llegadas se registraban en dos sitios con listas distintas: `/packages/[id]` (uno a uno) y `/delivery/prepare` fase 1 (lista plana con tope silencioso de 80 candidatos visibles y 500/1000 en consulta, sin filtro por agente: N9). El estado del paquete era un `select` libre (`setPackageStatusAction` sin máquina de estados: N8), así que un paquete podía pasar a `Procesado` sin llegadas o volver a `Enviado` con recepciones registradas. Los productos importados sin categoría (N3) quedaban bloqueados sin una forma de arreglarlos desde la pantalla.

## Decisión

1. **Un solo checklist de llegadas** (`ProductChecklist`, el mismo componente que ADR-0002) usado tanto en `/packages/[id]` como en `/delivery/prepare` fase 1: muestra lo esperado (`comprada − recibida > 0`) agrupado por cliente, con filtros por tienda, compra (#id) y cliente, buscador y sin tope de visibles. Ambas pantallas llaman a `registerArrivalsAction` (ya transaccional).
2. **Asignar categoría en línea**: una fila sin categoría muestra un `Select` que llama a `assignProductCategoryAction` (roles packages, delivery, orders) y se desbloquea sin salir de la pantalla (INV-002).
3. **Máquina de estados del paquete** (`ES-paquete`): `Enviado → Recibido` automático con la primera llegada (o acción "Marcar recibido"), `Recibido → Procesado` con "Terminar revisión", `Procesado → Recibido` solo admin. `setPackageStatusAction` valida `canTransition(from, to, role)`; `createPackageAction` fuerza `Enviado` (o `Recibido` con la casilla "Ya está en el almacén"); `updatePackageAction` no acepta `status`. La lista `/packages` ofrece solo los botones de transición válidos.
4. Tras crear un paquete, "Guardar y marcar llegadas" lleva a `/delivery/prepare?package=<id>`.

## Consecuencias

- Positivas: una sola forma de recibir, mismos filtros y validaciones en las dos pantallas; estados de paquete coherentes; productos sin categoría se resuelven en el sitio.
- Negativas: se pierde la posibilidad de fijar cualquier estado a mano (era la fuente de incoherencias); los usuarios acostumbrados al select necesitan el procedimiento `logistico.md`.
- Trabajo derivado: `prepare/types.ts` incorpora `shopName` y `purchaseIds`; `package-status.test.ts`; conformidad INV-006 para paquete.

## Alternativas descartadas

- **Dejar `/packages/[id]` como está y mejorar solo prepare.** Descartada: mantiene dos listas con reglas distintas.
- **Derivar el estado del paquete de cantidades (como el producto).** Descartada: no hay forma de saber cuántas unidades "debía" traer un paquete; `Procesado` es una decisión humana ("terminé de revisar").
- **Bloquear "Terminar revisión" hasta recibir todo lo esperado.** Descartada: lo esperado es global por producto, no por paquete; un producto puede llegar repartido en varios paquetes.
