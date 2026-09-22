# Procedimiento del agente (gestor)

Pantallas de admin-next: `/dashboard`, `/orders`, `/orders/[id]`, `/products`, `/delivery` (lectura). Permisos en [`../roles.md`](../roles.md). Reglas aplicables: RN-001, RN-010 a RN-012, RN-020, INV-001, INV-002.

## 1. Recibir el encargo del cliente

1. El cliente envía su lista (WhatsApp o lista compartida desde la app cliente). La app cliente no escribe en la base de datos.
2. Comprueba en `/users` (si tienes acceso) o pide al admin que el cliente exista y te lo tenga asignado. Sin agente asignado no se puede crear la orden y la comisión por peso sería 0 (RN-003).

## 2. Crear la orden

1. `/orders` → "Nueva orden" abre `/orders/new`: elige el cliente (solo verás tus clientes; el gestor se rellena contigo) y añade todos los productos en la misma pantalla, con el costo calculado por fila y el total en la barra inferior. Un solo botón crea la orden con sus productos.
2. Guarda. La orden nace `Encargado` / `No pagado` con costo 0.

## 3. Añadir productos

Para añadir más productos después: `/orders/[id]` → "Añadir productos" (varios a la vez). Por cada artículo:

1. Tienda, nombre, enlace, SKU, cantidad pedida (> 0).
2. Precio unitario en la tienda, envío de la tienda (por línea), IVA activado o no, tarifa de tienda (%), impuestos adicionales y propios.
3. **Categoría** (obligatoria: sin ella el logístico no podrá recibirlo ni embolsarlo, INV-002).
4. Guarda. El costo se calcula con RN-001 y el total de la orden se refresca. Comprueba el desglose (IVA sobre precio × cantidad + envío; tarifa sobre base + IVA).

Repite para todos los productos. Si el admin ya compró alguno, el botón "Comprar pendientes" (solo admin) enlaza a la compra; tú no compras.

## 4. Seguir el estado

- `/orders/[id]` muestra cada producto con su estado derivado y las cantidades pedida / comprada / recibida / entregada. Un producto en bolsa o en tránsito aparece `Recibido` con el chip "en bolsa / en entrega #" (RN-011).
- `/delivery` (solo lectura) muestra las entregas de tus clientes: peso, costo por peso, estado y pago.
- El estado de la orden (`Encargado → Procesando → Completado`) se deriva de los productos (RN-012). Hasta que admin-next lo implemente, si ves una orden desactualizada pide al admin que la recalcule; no la edites a mano.

## 5. Ajustes permitidos

| Situación | Qué hacer |
|---|---|
| El cliente cambia la cantidad antes de la compra | Edita `cantidad pedida` en el producto. El costo se recalcula. |
| La tienda solo tenía parte de las unidades (compra parcial) | El producto queda `Encargado` para siempre mientras `pedida > comprada` (RN-010-06). Baja la cantidad pedida a lo comprado; el sistema no permite bajar por debajo de lo comprado (INV-001). |
| El cliente cancela un producto no comprado | Quita el producto. El total y el estado de pago se refrescan. |
| El cliente cancela todo antes de la compra | Cancela la orden (`Cancelado`). Si ya tenía cobros, avisa al contador. |
| Producto sin categoría (importado) | Asígnala desde el detalle del producto o desde el checklist de llegadas. |

## Qué NO hacer

- No cambies el estado de un producto ni de una orden a mano (no existe el control en admin-next; en Django admin tampoco debe hacerse).
- No registres cobros: es tarea del contador (`/orders/[id]` panel de pago no está disponible para tu rol).
- No crees productos sin categoría "para después".
- No dupliques la orden si el cliente añade productos: añádelos a la existente. Una orden `Completado` vuelve a `Procesando` sola.

## Errores esperados

| Mensaje | Causa | Solución |
|---|---|---|
| "La cantidad pedida no puede ser menor que la comprada" | INV-001 | Pide al admin un reembolso en la compra antes de bajar la cantidad. |
| "Selecciona una categoría" | INV-002 | Elige categoría. |
| "No tienes acceso a esta orden" | La orden es de un cliente de otro agente | Pide al admin la reasignación del cliente. |
| "No se puede cancelar: hay productos recibidos o entregados" | ES-orden | Pide al logístico/admin que retire las unidades o entrega lo pendiente. |
