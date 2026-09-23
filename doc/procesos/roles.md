# Roles y permisos (matriz canónica)

Fuente: `apps/admin-next/src/lib/roles.ts` (conjuntos por sección, usados por las server actions) y `apps/admin-next/src/lib/route-roles.ts` (acceso por ruta), que a su vez reflejan `apps/admin/src/routes/role-config.ts` y `doc/apps/admin.md` §1 y §4. Los cinco roles están definidos en `backend/api/models/users.py` (`ROLE_CHOICES`).

Convención: **X** = puede; **L** = solo lectura; **—** = sin acceso. Cuando una celda dice "propios" el rol solo ve o toca los registros de los clientes que tiene asignados (`assigned_agent`).

## Acceso por sección (rutas)

| Sección (ruta admin-next) | admin | agent | accountant | logistical | client |
|---|---|---|---|---|---|
| Dashboard `/dashboard` | X | X (métricas propias) | X | X | — |
| Usuarios `/users` | X | — | L (solo pestaña Balances) | — | — |
| Tiendas y cuentas de compra `/shops` | X | — | — | — | — |
| Categorías `/categories` | X | — | — | — | — |
| Órdenes y productos `/orders`, `/orders/[id]` | X | X (propios) | — | — | — |
| Productos `/products` | X | L (propios) | — | L | — |
| Compras `/purchases`, `/purchases/new`, `/purchases/[id]` | X | — | — | — | — |
| Paquetes `/packages`, `/packages/[id]` | X | — | — | X | — |
| Preparación `/delivery/prepare` | X | — | — | X | — |
| Entregas `/delivery`, `/delivery/[id]` | X | L | — | X | — |
| Balance, facturas, gastos, análisis `/balance`, `/invoices`, `/expenses`, `/analytics` | X | — | X | — | — |
| Configuración `/settings` (general) | X | X | X | X | — |
| Configuración: datos `/settings/data` | X | — | X | — | — |
| Configuración: importar, limpieza, sistema | X | — | — | — | — |
| Perfil `/profile` | X | X | X | X | — |
| App cliente (`apps/client`) | — | — | — | — | X (solo lectura de sus órdenes y entregas) |

Un usuario con rol `client` que intenta entrar al panel es expulsado (logout forzado) tanto en admin Vite como en admin-next.

## Operaciones del ciclo de vida

| Operación | admin | agent | accountant | logistical | client | Regla / estado |
|---|---|---|---|---|---|---|
| Crear cliente y asignarle agente | X | — | — | — | — | — |
| Crear orden para un cliente | X (gestor: cualquier miembro del personal; por defecto el admin general) | X (propios; `sales_manager` = él mismo) | — | — | — | ES-orden, ADR-0007 |
| Añadir / editar / quitar productos de una orden | X | X (propios) | — | — | — | RN-001, INV-002 |
| Cancelar orden | X | X (propios) | — | — | — | ES-orden |
| Crear compra desde productos pendientes | X | — | — | — | — | ADR-0002, INV-005 |
| Añadir productos comprados a una compra / reembolsar | X | — | — | — | — | INV-001 |
| Registrar paquete | X | — | — | X | — | ES-paquete |
| Registrar llegadas (recepciones) en un paquete | X | — | — | X | — | INV-001, INV-002, ES-paquete |
| Terminar revisión del paquete (`Recibido → Procesado`) | X | — | — | X | — | ES-paquete |
| Reabrir paquete (`Procesado → Recibido`) | X | — | — | — | — | ES-paquete |
| Asignar categoría a un producto sin categoría (desde el checklist) | X | X (propios) | — | X | — | INV-002 |
| Sacar unidades de una bolsa / echar sueltos | X | — | — | X | — | INV-003 |
| Armar entrega desde recibidos | X | — | — | X | — | ADR-0004 |
| Pesar y cerrar bolsa | X | — | — | X | — | RN-002, RN-003, INV-004 |
| Re-pesar una entrega ya pesada | X | — | — | — | — | INV-004 |
| Despachar (`Pendiente → En transito`) | X | — | — | X | — | ES-entrega |
| Entregar (`En transito → Entregado`, fecha y foto) | X | — | — | X | — | ES-entrega, RN-011 |
| Marcar fallida / reintentar (`En transito ↔ Fallida`) | X | — | — | X | — | ES-entrega |
| Reabrir entrega (`Entregado → En transito`) | X | — | — | — | — | ES-entrega |
| Editar datos de una entrega (cliente, categoría, fecha, foto) | X | — | — | X | — | — |
| Borrar entrega | X (solo bolsas vacías o sin peso ni pagos) | — | — | X (idem) | — | INV-003 |
| Registrar cobro de orden o entrega (efectivo) | X | — | X | — | — | RN-020, RN-021 |
| Aplicar saldo del cliente a una orden o entrega | X | — | X | — | — | RN-022 |
| Facturas, gastos, balances por rango | X | — | X | — | — | — |
| Importar embarques Excel, limpiar datos, recalcular estados | X | — | — | — | — | — |
| Ver estado de sus órdenes y entregas | — | — | — | — | X | — |

## Notas

- El agente **no** ejecuta ninguna operación de entrega; en `/delivery` solo consulta. Las server actions de entregas rechazan su rol aunque la página le permita entrar.
- La compra es exclusiva del administrador. Es una decisión de negocio (control de tarjetas y cuentas de compra), no una limitación técnica.
- Las transiciones inversas (reabrir paquete, re-pesar, reabrir entrega) son exclusivas del administrador porque deshacen efectos económicos (costo por peso, comisión, estado de producto).
- En Django, las mismas operaciones pasan por `backend/api/permissions/`; en admin Vite por `routes/role-config.ts`. Cualquier diferencia respecto a esta matriz se registra en [`conformidad.md`](conformidad.md).
