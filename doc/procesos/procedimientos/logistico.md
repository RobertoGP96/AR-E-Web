# Procedimiento del logístico

Pantallas de admin-next: `/packages`, `/packages/[id]`, `/delivery/prepare`, `/delivery`, `/delivery/[id]`, `/products` (lectura). Permisos en [`../roles.md`](../roles.md). Reglas aplicables: RN-002, RN-003, RN-010, RN-011, INV-001 a INV-006; decisiones ADR-0003, ADR-0004, ADR-0005.

## 1. Registrar el paquete

1. `/packages` → "Nuevo paquete" abre `/packages/new`: agencia, número de seguimiento, fecha y, en la misma pantalla, el checklist de lo que llegó en el bulto. "Crear paquete y registrar llegadas" hace ambas cosas en una transacción (el paquete nace `Recibido`); sin llegadas marcadas nace `Enviado` o `Recibido` según la casilla "ya está en el almacén".
2. Si ya lo tienes en el almacén, marca "Ya está en el almacén": nace `Recibido`.
3. "Guardar y marcar llegadas" te lleva a `/delivery/prepare?package=<id>` con el paquete preseleccionado.

## 2. Marcar llegadas (recepciones)

En `/delivery/prepare` fase 1 o en `/packages/[id]` (mismo checklist):

1. Selecciona el paquete. La lista muestra lo **esperado**: productos con `comprada − recibida > 0`, agrupados por cliente, con filtros por tienda, compra (#id) y cliente, y buscador.
2. Marca lo que venía y la cantidad (tope `comprada − recibida`, INV-001).
3. Un producto sin categoría aparece bloqueado con la acción "Asignar categoría": elígela en línea y sigue (INV-002).
4. "Registrar llegadas". En una transacción: se crean las recepciones, cada unidad cae en la **bolsa** abierta del cliente y categoría (se crea si no existe), los productos pasan a `Recibido` (no a `Entregado`: RN-011) y el paquete pasa a `Recibido` si estaba `Enviado`.
5. Repite si el paquete trae más productos de los que marcaste. Lo que no llegó sigue esperado para otros paquetes.

## 3. Revisar y cerrar bolsas

En `/delivery/prepare` fase 2 (o `/delivery` con el filtro "En preparación"):

1. Cada bolsa muestra cliente, categoría y unidades. "Sacar" devuelve unidades a "recibido sin bolsa"; "Echar sueltos" añade unidades recibidas antes que no estén en ninguna bolsa (INV-001, INV-005).
2. Pesa la bolsa física y pulsa "Pesar y cerrar" con el peso en libras (> 0). Se fijan `weight`, `weight_cost = peso × cargo por libra de la categoría` (RN-002), `manager_profit = peso × comisión del agente del cliente` (RN-003), el estado de pago (RN-020) y el balance del cliente (RN-021). La bolsa deja de ser bolsa: pasa a "Pendiente" y las siguientes llegadas de ese cliente y categoría abren otra.
3. Una bolsa que se queda vacía se borra sola (INV-003).
4. Cuando termines con el paquete: "Terminar revisión" (`Recibido → Procesado`). Puedes hacerlo aunque falten unidades por llegar.

## 4. Armar una entrega con unidades sueltas

Para unidades recibidas que no están en ninguna bolsa (importaciones antiguas, unidades sacadas):

1. `/delivery` → "Armar entrega" abre `/delivery/new` → elige cliente (también desde la mesa de bolsas con "Armar entrega con estos").
2. Marca unidades por categoría; se crea una entrega (bolsa) por categoría.
3. Indica el peso si ya lo tienes: la entrega nace pesada. Si no, queda "En preparación" y la pesas después.

## 5. Despachar, entregar, fallar

En `/delivery` (acciones por fila) o `/delivery/[id]`:

| Acción | Desde | Hacia | Qué pasa |
|---|---|---|---|
| Despachar | Pendiente pesada | En transito | Sale hacia el cliente. Exige peso > 0. |
| Entregar | En transito (o Pendiente pesada, entrega en mano) | Entregado | Fecha (por defecto ahora) y foto opcional. Todos los productos de la entrega se recalculan: los completos pasan a `Entregado` (RN-011); las órdenes completas pasan a `Completado` (RN-012). |
| Marcar fallida | En transito | Fallida | Sin efecto sobre productos. |
| Reintentar | Fallida | En transito | — |

Solo aparecen los botones de las transiciones válidas. No hay select de estado.

## 6. Ajustes después de pesar

- Añadir o quitar unidades de una entrega pesada: permitido mientras no esté `Entregado`. El peso no se recalcula solo; si cambia, pide a un admin que re-pese.
- Cambiar cliente, categoría, fecha o foto: "Editar" en `/delivery/[id]`. No cambia estado ni peso.
- Borrar: solo bolsas (peso 0, sin pagos); se vacían y se borran. Una entrega con peso o pagos no se borra.

## Qué NO hacer

- No crees entregas "manuales" fuera de bolsas: la opción ya no existe; usa "Armar entrega desde recibidos".
- No recibas más unidades de las compradas (INV-001). Si la tienda envió de más, avisa al admin para que ajuste la compra.
- No peses una bolsa vacía ni pongas peso 0 "para cerrarla".
- No vuelvas a pesar; si el peso estaba mal, pide "Re-pesar" a un admin (INV-004).
- No marques `Entregado` para "quitar la entrega de pendientes": el producto pasará a `Entregado` y la orden a `Completado`.
- No registres cobros: es del contador.

## Errores esperados

| Mensaje | Causa | Solución |
|---|---|---|
| "Cantidad mayor que lo pendiente de recibir" | INV-001 | Baja la cantidad o pide ajuste de la compra. |
| "El producto no tiene categoría" | INV-002 | "Asignar categoría" en la fila. |
| "El producto no es de este cliente" | INV-005 | Elige la entrega del cliente correcto. |
| "La entrega ya fue pesada" | INV-004 | Pide re-pesado a un admin. |
| "No se puede despachar sin peso" | ES-entrega | Pesa la bolsa primero. |
| "No se puede borrar: la entrega tiene peso o pagos" | ES-entrega | Reabrir/vaciar por admin, o dejarla. |
| "No se puede quitar la recepción: las unidades están en una entrega pesada" | INV-001 | Quita primero las unidades de la entrega (si no está `Entregado`). |
| "Transición no permitida" | INV-006 | Usa el botón que corresponde al estado actual. |
