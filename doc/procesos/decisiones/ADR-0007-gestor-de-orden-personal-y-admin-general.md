# ADR-0007 — El gestor de una orden puede ser cualquier miembro del personal; por defecto, el admin general

**Estado:** Aceptada
**Fecha:** 2026-09-23
**Reglas y estados afectados:** ES-orden (transición `— → Encargado`), matriz de `roles.md`, glosario («Gestor / agente»)
**Apps impactadas:** Django (`OrderCreateSerializer`, `OrderSerializer`, `OrderUpdateSerializer`, `api/services/staff_service.py`), admin-next (`orders/actions.ts`, `/orders`, `/orders/new`, `order-dialog.tsx`, `src/lib/order-manager.ts`, `src/lib/general-admin.ts`), admin Vite (`CreateOrderDialog.tsx`, `EditOrderDialog.tsx`)

## Contexto

El campo `Order.sales_manager` («gestor» o «agente de ventas») solo admitía usuarios con rol `agent`: los tres serializers de Django rechazaban cualquier otro rol («El usuario no es agente»), y los formularios de admin-next y admin Vite solo listaban agentes (y admins) y **filtraban los clientes por el agente elegido**, de modo que una orden solo podía crearse para un cliente con ese agente asignado (`estados/orden.md` exigía «Cliente con agente asignado»). Si el admin no elegía gestor, la orden quedaba sin él (`sales_manager = null`), lo que provocó el bug B7 de notificaciones y deja órdenes huérfanas en los dashboards.

El negocio pide que las órdenes se puedan asignar a cualquier persona del equipo (agentes, logísticos y contadores) y que, cuando quien crea la orden no es un agente, el gestor por defecto sea el **admin general**.

## Decisión

El gestor de una orden es cualquier miembro activo del personal: `admin`, `agent`, `accountant` o `logistical`. Al crear o editar una orden:

| Quién opera | Gestor resultante |
|---|---|
| Agente | Él mismo, siempre (se ignora lo que envíe el formulario). Sin cambios respecto a `roles.md`. |
| Admin (u otro rol autorizado en `/orders`) | El miembro del personal elegido en el formulario; si no elige ninguno, el **admin general**; si no hay admin activo, `null`. |

**Admin general** = el usuario `admin` activo con `is_superuser`; a falta de él, el `admin` activo más antiguo (menor `id`).

Detalle de implementación:

- Django: `api/services/staff_service.py` (`SALES_MANAGER_ROLES`, `get_general_admin`, `resolve_sales_manager`). Los tres validadores pasan a llamarse `validate_sales_manager_id` (el nombre del campo del serializer; con el nombre anterior DRF nunca los ejecutaba) y aceptan los cuatro roles; `OrderCreateSerializer.create` aplica `resolve_sales_manager(request.user, sales_manager)` cuando no llega gestor o el creador es agente.
- admin-next: `src/lib/order-manager.ts` (puro: `SALES_MANAGER_ROLES`, `resolveSalesManagerId`, `salesManagerLabel`) y `src/lib/general-admin.ts` (servidor). `createOrderAction`, `updateOrderAction` y `createOrderWithProductsAction` resuelven el gestor con esa función y comprueban que sea personal activo. Los selectores de gestor listan a todo el personal (con el rol junto al nombre salvo para agentes) y quedan preseleccionados con el admin general. **El gestor deja de filtrar la lista de clientes**: el admin ve todos los clientes con su agente asignado como descripción; el agente sigue viendo solo los suyos.
- admin Vite: `CreateOrderDialog` y `EditOrderDialog` listan los cuatro roles, preseleccionan el admin general y no filtran clientes por gestor.

La comisión por peso (RN-003) **no cambia**: sigue siendo la del agente asignado al cliente (`assigned_agent`), no la del gestor de la orden. Un gestor contador o logístico no cobra comisión por serlo.

## Consecuencias

- Positivas: ninguna orden nace sin gestor cuando existe un admin; el equipo puede repartir el seguimiento de órdenes entre todo el personal; desaparece el bloqueo «cliente sin agente asignado» al crear órdenes desde el admin.
- Negativas o costes: los dashboards de agente («mis órdenes» por `sales_manager`) no muestran a contadores ni logísticos las órdenes que gestionan, porque no tienen acceso a `/orders` (`roles.md` no cambia). El filtro «Gestor» de `/orders` muestra ahora a todo el personal. Las órdenes existentes con `sales_manager = null` no se migran.
- Trabajo derivado: `estados/orden.md` (precondición), `roles.md`, `glosario.md`, `procedimientos/agente.md`, `CHANGELOG.md` 1.1.0, `conformidad.md`; tests `apps/admin-next/src/lib/order-manager.test.ts` y `backend/api/tests/test_sales_manager_assignment.py` (añadido al job de backend en CI).

## Alternativas descartadas

- **Mantener `sales_manager` solo para agentes y añadir un campo nuevo «responsable»**: duplicaría el concepto en tres apps y en los reportes por gestor sin aportar nada, porque el negocio quiere un único responsable por orden.
- **Asignar por defecto el agente del cliente en lugar del admin general**: es lo que hacía implícitamente el filtro de clientes; el negocio prefiere que el admin general sea el punto de control y que el agente del cliente siga rigiendo solo la comisión (RN-003).
- **Elegir «admin general» por configuración (`CommonInformation`)**: añade una migración y una pantalla para un valor que en la práctica es único; la regla superusuario → admin más antiguo es determinista y no requiere datos nuevos. Puede revisarse en un ADR posterior si aparecen varios admins con roles distintos.
